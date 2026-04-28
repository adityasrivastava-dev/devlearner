package com.learnsystem.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnsystem.dto.ExecuteResponse;
import com.learnsystem.dto.SubmitResponse;
import com.learnsystem.dto.SyntaxCheckResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * HTTP client that delegates code execution to the execution microservice pool.
 *
 * Routing strategy:
 *   1. Ask ExecutionLoadBalancer for the next HEALTHY instance (round-robin).
 *   2. If the instance returns HTTP 429 (at capacity), mark it BUSY in the load
 *      balancer and retry with the next available instance.
 *   3. The load balancer auto-spawns a new Docker container when all instances
 *      are BUSY (if execution.autoscale.enabled=true).
 *   4. If a connection fails (server down), mark the instance DEAD and retry.
 *
 * isEnabled() returns false when no URLs are configured — callers fall back
 * to the local ExecutionService with zero code changes.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ExecutionClient {

    private final ExecutionLoadBalancer loadBalancer;
    private final ObjectMapper          objectMapper;

    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    /** True when at least one execution service URL is configured. */
    public boolean isEnabled() { return loadBalancer.isEnabled(); }

    // ── Public API ────────────────────────────────────────────────────────────

    public ExecuteResponse execute(String code, String stdin, String javaVersion, String harness) {
        return post("/internal/execute", Map.of(
            "code",        code,
            "stdin",       stdin        != null ? stdin        : "",
            "javaVersion", javaVersion  != null ? javaVersion  : "17",
            "harness",     harness      != null ? harness      : ""
        ), ExecuteResponse.class);
    }

    public record TestCaseInput(String input, String expectedOutput) {}

    public SubmitResponse submit(String code, String javaVersion, String harness,
                                 List<TestCaseInput> testCases) {
        return post("/internal/submit", Map.of(
            "code",        code,
            "javaVersion", javaVersion  != null ? javaVersion  : "17",
            "harness",     harness      != null ? harness      : "",
            "testCases",   testCases
        ), SubmitResponse.class);
    }

    public SyntaxCheckResponse syntaxCheck(String code, String javaVersion) {
        return post("/internal/syntax-check", Map.of(
            "code",        code,
            "javaVersion", javaVersion  != null ? javaVersion  : "17"
        ), SyntaxCheckResponse.class);
    }

    // ── HTTP with retry-on-429 ────────────────────────────────────────────────

    private <T> T post(String path, Object body, Class<T> responseType) {
        // Try each instance at most once; cap at 3 attempts to keep latency bounded
        int maxAttempts = Math.min(loadBalancer.getPoolSize() + 1, 3);
        Exception lastError = null;

        for (int attempt = 0; attempt < maxAttempts; attempt++) {
            String url;
            try {
                url = loadBalancer.getNextUrl();
            } catch (Exception e) {
                throw new RuntimeException("No execution service available: " + e.getMessage(), e);
            }

            try {
                String json = objectMapper.writeValueAsString(body);

                HttpRequest req = HttpRequest.newBuilder()
                        .uri(URI.create(url + path))
                        .header("Content-Type", "application/json")
                        .timeout(Duration.ofSeconds(35))
                        .POST(HttpRequest.BodyPublishers.ofString(json))
                        .build();

                HttpResponse<String> res = HTTP.send(req, HttpResponse.BodyHandlers.ofString());

                if (res.statusCode() == 200) {
                    loadBalancer.markHealthy(url);
                    return objectMapper.readValue(res.body(), responseType);
                }

                if (res.statusCode() == 429) {
                    // Instance semaphore is full — mark it BUSY and try the next one.
                    // ExecutionLoadBalancer will spawn a new container if all are BUSY.
                    log.warn("[attempt {}/{}] Instance {} at capacity (429) — routing to next", attempt + 1, maxAttempts, url);
                    loadBalancer.markBusy(url);
                    lastError = new RuntimeException("HTTP 429 from " + url);
                    continue;
                }

                if (res.statusCode() == 503) {
                    log.warn("[attempt {}/{}] Instance {} unavailable (503)", attempt + 1, maxAttempts, url);
                    loadBalancer.markDead(url);
                    lastError = new RuntimeException("HTTP 503 from " + url);
                    continue;
                }

                // Any other non-200 response — do not retry (likely a code/request error)
                log.error("Instance {} returned {} for {}: {}", url, res.statusCode(), path, res.body());
                throw new RuntimeException("Execution service error: HTTP " + res.statusCode());

            } catch (IOException | InterruptedException e) {
                // Connection refused / timeout — instance is down
                log.warn("[attempt {}/{}] Instance {} unreachable: {}", attempt + 1, maxAttempts, url, e.getMessage());
                loadBalancer.markDead(url);
                lastError = e;
            }
        }

        throw new RuntimeException("All execution instances failed after " + maxAttempts + " attempt(s)", lastError);
    }
}
