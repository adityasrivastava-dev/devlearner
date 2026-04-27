package com.learnsystem.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnsystem.dto.ExecuteResponse;
import com.learnsystem.dto.SubmitResponse;
import com.learnsystem.dto.SyntaxCheckResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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
 * HTTP client that delegates code execution to the execution microservice.
 *
 * When execution.service.url is blank (default), isEnabled() returns false
 * and the caller falls back to the local ExecutionService. No code changes
 * are needed to move between local and remote execution — just set the env var.
 *
 * Deployment:
 *   Render main API:  EXECUTION_SERVICE_URL=http://execution-service:8081
 *   Local dev:        leave unset (uses local executor)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ExecutionClient {

    @Value("${execution.service.url:}")
    private String serviceUrl;

    private final ObjectMapper objectMapper;

    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    /** True when a remote execution service URL is configured. */
    public boolean isEnabled() {
        return serviceUrl != null && !serviceUrl.isBlank();
    }

    // ── Run ───────────────────────────────────────────────────────────────────

    public ExecuteResponse execute(String code, String stdin, String javaVersion, String harness) {
        Map<String, Object> body = Map.of(
            "code",        code,
            "stdin",       stdin != null ? stdin : "",
            "javaVersion", javaVersion != null ? javaVersion : "17",
            "harness",     harness != null ? harness : ""
        );
        return post("/internal/execute", body, ExecuteResponse.class);
    }

    // ── Submit ────────────────────────────────────────────────────────────────

    public record TestCaseInput(String input, String expectedOutput) {}

    public SubmitResponse submit(String code, String javaVersion, String harness,
                                 List<TestCaseInput> testCases) {
        Map<String, Object> body = Map.of(
            "code",        code,
            "javaVersion", javaVersion != null ? javaVersion : "17",
            "harness",     harness != null ? harness : "",
            "testCases",   testCases
        );
        return post("/internal/submit", body, SubmitResponse.class);
    }

    // ── Syntax check ──────────────────────────────────────────────────────────

    public SyntaxCheckResponse syntaxCheck(String code, String javaVersion) {
        Map<String, Object> body = Map.of(
            "code",        code,
            "javaVersion", javaVersion != null ? javaVersion : "17"
        );
        return post("/internal/syntax-check", body, SyntaxCheckResponse.class);
    }

    // ── HTTP helper ───────────────────────────────────────────────────────────

    private <T> T post(String path, Object body, Class<T> responseType) {
        try {
            String json = objectMapper.writeValueAsString(body);
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(serviceUrl + path))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(30))
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();

            HttpResponse<String> res = HTTP.send(req, HttpResponse.BodyHandlers.ofString());

            if (res.statusCode() != 200) {
                log.error("Execution service returned {} for {}: {}", res.statusCode(), path, res.body());
                throw new RuntimeException("Execution service error: HTTP " + res.statusCode());
            }

            return objectMapper.readValue(res.body(), responseType);

        } catch (IOException | InterruptedException e) {
            log.error("Execution service call failed for {}: {}", path, e.getMessage());
            throw new RuntimeException("Execution service unavailable: " + e.getMessage(), e);
        }
    }
}
