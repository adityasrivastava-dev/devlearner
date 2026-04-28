package com.learnsystem.service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.stream.Collectors;

/**
 * Manages a pool of execution service instances with automatic load balancing,
 * health checking, and optional Docker-based auto-scaling.
 *
 * ── Routing algorithm ───────────────────────────────────────────────────────
 * 1. Round-robin across all HEALTHY instances.
 * 2. If a request returns HTTP 429 (instance at capacity), mark it BUSY
 *    and retry with the next HEALTHY instance.
 * 3. If ALL instances are BUSY and autoscale is enabled AND total pool < max:
 *    spawn a new Docker container, add it to the pool, route to it.
 * 4. Background health check every 10s — BUSY/DEAD instances that respond 200
 *    to /internal/health are promoted back to HEALTHY.
 * 5. Auto-spawned instances idle for N minutes are stopped and removed.
 *
 * ── Configuration ────────────────────────────────────────────────────────────
 * execution.service.urls=http://host1:8081,http://host2:8082   (comma list)
 * execution.service.url=http://host:8081                       (single, legacy)
 * execution.autoscale.enabled=false
 * execution.autoscale.max-instances=4
 * execution.autoscale.image=execution-service:latest
 * execution.autoscale.port-base=8082
 * execution.autoscale.cooldown-minutes=5
 *
 * ── Deployment note ──────────────────────────────────────────────────────────
 * Auto-spawn requires Docker daemon accessible from the host running the main API.
 * On Render free tier: set autoscale.enabled=false (no Docker daemon available).
 * On VPS / home server: set autoscale.enabled=true.
 */
@Slf4j
@Component
public class ExecutionLoadBalancer {

    // ── Instance state ────────────────────────────────────────────────────────

    public enum InstanceStatus { HEALTHY, BUSY, DEAD }

    public static class Instance {
        public final String  url;
        public final boolean autoSpawned;
        public final AtomicReference<InstanceStatus> status   = new AtomicReference<>(InstanceStatus.HEALTHY);
        public final AtomicLong lastBusyAt                    = new AtomicLong(0);
        final String containerName;

        Instance(String url, boolean autoSpawned) {
            this.url          = url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
            this.autoSpawned  = autoSpawned;
            // derive a stable container name from the port number
            String port       = url.replaceAll(".*:(\\d+)$", "$1");
            this.containerName = "exec-worker-" + port;
        }
    }

    // ── Pool ──────────────────────────────────────────────────────────────────

    private final CopyOnWriteArrayList<Instance> pool = new CopyOnWriteArrayList<>();
    private final AtomicInteger roundRobin            = new AtomicInteger(0);
    // Prevents two simultaneous spawn attempts
    private final AtomicBoolean spawning              = new AtomicBoolean(false);

    // ── Config ────────────────────────────────────────────────────────────────

    // Supports both "execution.service.urls" (new) and "execution.service.url" (legacy single-URL)
    @Value("${execution.service.urls:${execution.service.url:}}")
    private String configuredUrls;

    @Value("${execution.autoscale.enabled:false}")
    private boolean autoscaleEnabled;

    @Value("${execution.autoscale.max-instances:4}")
    private int maxInstances;

    @Value("${execution.autoscale.image:execution-service:latest}")
    private String autoscaleImage;

    @Value("${execution.autoscale.port-base:8082}")
    private int portBase;

    @Value("${execution.autoscale.cooldown-minutes:5}")
    private int cooldownMinutes;

    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(3))
            .build();

    private final ExecutorService spawnThread = Executors.newSingleThreadExecutor(
            r -> { Thread t = new Thread(r, "exec-spawn"); t.setDaemon(true); return t; });

    // ── Init ──────────────────────────────────────────────────────────────────

    @PostConstruct
    public void init() {
        if (configuredUrls != null && !configuredUrls.isBlank()) {
            for (String url : configuredUrls.split(",")) {
                url = url.trim();
                if (!url.isEmpty()) pool.add(new Instance(url, false));
            }
        }
        log.info("ExecutionLoadBalancer: {} instance(s) configured. Autoscale={} max={}",
                pool.size(), autoscaleEnabled, maxInstances);
    }

    @PreDestroy
    public void shutdown() {
        spawnThread.shutdownNow();
    }

    // ── Public API ────────────────────────────────────────────────────────────

    public boolean isEnabled() { return !pool.isEmpty(); }

    public int getPoolSize()   { return pool.size(); }

    /**
     * Returns the URL of the next instance to route to.
     * Round-robins across HEALTHY instances.
     * Falls back to least-recently-busy if all are BUSY.
     * Triggers a background spawn when all are BUSY and autoscale is on.
     */
    public String getNextUrl() {
        List<Instance> healthy = pool.stream()
                .filter(i -> i.status.get() == InstanceStatus.HEALTHY)
                .collect(Collectors.toList());

        if (!healthy.isEmpty()) {
            int idx = Math.abs(roundRobin.getAndIncrement()) % healthy.size();
            return healthy.get(idx).url;
        }

        // All instances are at capacity — kick off a spawn
        if (autoscaleEnabled && !spawning.get()) {
            long liveCount = pool.stream().filter(i -> i.status.get() != InstanceStatus.DEAD).count();
            if (liveCount < maxInstances) {
                log.warn("All {} instance(s) BUSY — triggering auto-spawn", pool.size());
                spawnThread.submit(this::spawnNewInstance);
            } else {
                log.warn("All instances BUSY and pool at max ({}) — cannot auto-scale further", maxInstances);
            }
        }

        // While the new instance boots, route to the least-recently-busy one
        return pool.stream()
                .filter(i -> i.status.get() != InstanceStatus.DEAD)
                .min(Comparator.comparingLong(i -> i.lastBusyAt.get()))
                .map(i -> i.url)
                .orElseThrow(() -> new RuntimeException("No execution instances available"));
    }

    /**
     * Called by ExecutionClient when an instance returns HTTP 429 (semaphore full).
     * Marks it BUSY and immediately triggers a spawn if autoscale is enabled.
     */
    public void markBusy(String url) {
        pool.stream().filter(i -> i.url.equals(url)).findFirst().ifPresent(i -> {
            i.status.set(InstanceStatus.BUSY);
            i.lastBusyAt.set(System.currentTimeMillis());
            log.info("Instance {} BUSY (semaphore full)", url);

            if (autoscaleEnabled && !spawning.get() && pool.size() < maxInstances) {
                spawnThread.submit(this::spawnNewInstance);
            }
        });
    }

    /** Called by ExecutionClient after a successful 200 response. */
    public void markHealthy(String url) {
        pool.stream().filter(i -> i.url.equals(url)).findFirst().ifPresent(i -> {
            InstanceStatus prev = i.status.getAndSet(InstanceStatus.HEALTHY);
            if (prev != InstanceStatus.HEALTHY) {
                log.info("Instance {} → HEALTHY", url);
            }
        });
    }

    /** Called by ExecutionClient when a request fails with a connection error. */
    public void markDead(String url) {
        pool.stream().filter(i -> i.url.equals(url)).findFirst().ifPresent(i -> {
            i.status.set(InstanceStatus.DEAD);
            log.warn("Instance {} → DEAD (connection failed)", url);
        });
    }

    /** Instance stats for the admin endpoint. */
    public List<Map<String, Object>> getStats() {
        return pool.stream().map(i -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("url",          i.url);
            m.put("status",       i.status.get().name());
            m.put("autoSpawned",  i.autoSpawned);
            m.put("lastBusyAt",   i.lastBusyAt.get());
            return m;
        }).collect(Collectors.toList());
    }

    // ── Background: health checks every 10s ──────────────────────────────────

    @Scheduled(fixedDelay = 10_000)
    public void healthCheckLoop() {
        if (pool.isEmpty()) return;

        for (Instance instance : pool) {
            boolean alive = ping(instance.url);
            InstanceStatus cur = instance.status.get();

            if (alive && (cur == InstanceStatus.DEAD || cur == InstanceStatus.BUSY)) {
                instance.status.set(InstanceStatus.HEALTHY);
                log.info("Instance {} recovered → HEALTHY", instance.url);
            } else if (!alive && cur == InstanceStatus.HEALTHY) {
                instance.status.set(InstanceStatus.DEAD);
                log.warn("Instance {} health-check failed → DEAD", instance.url);
            }
        }
    }

    // ── Background: idle cleanup every 60s ───────────────────────────────────

    @Scheduled(fixedDelay = 60_000)
    public void cleanupIdleInstances() {
        if (pool.size() <= 1) return; // always keep at least one

        long cutoff = System.currentTimeMillis() - (cooldownMinutes * 60_000L);

        pool.removeIf(instance -> {
            if (!instance.autoSpawned)                              return false;
            if (instance.status.get() == InstanceStatus.BUSY)      return false;
            if (instance.lastBusyAt.get() > cutoff)                 return false;
            // keep at least one instance alive
            long survivors = pool.stream()
                    .filter(i -> !i.url.equals(instance.url))
                    .filter(i -> i.status.get() != InstanceStatus.DEAD)
                    .count();
            if (survivors == 0) return false;

            log.info("Stopping idle auto-spawned instance {} (idle for {}+ min)", instance.url, cooldownMinutes);
            stopContainer(instance);
            return true;
        });
    }

    // ── Auto-spawn ────────────────────────────────────────────────────────────

    private void spawnNewInstance() {
        if (!spawning.compareAndSet(false, true)) return; // another spawn in progress

        try {
            // Find a free port
            Set<String> usedUrls = pool.stream().map(i -> i.url).collect(Collectors.toSet());
            int port = portBase;
            while (usedUrls.contains("http://localhost:" + port)) port++;

            String url           = "http://localhost:" + port;
            String containerName = "exec-worker-" + port;

            log.info("Spawning new execution instance → {} ({})", url, containerName);

            List<String> cmd = List.of(
                "docker", "run", "-d",
                "--name",        containerName,
                "-p",            port + ":8081",
                "-v",            "/var/run/docker.sock:/var/run/docker.sock",
                "-e",            "DOCKER_ENABLED=true",
                "--restart",     "unless-stopped",
                autoscaleImage
            );

            Process p = new ProcessBuilder(cmd).redirectErrorStream(true).start();
            boolean exited = p.waitFor(10, TimeUnit.SECONDS);
            String  output = new String(p.getInputStream().readAllBytes()).trim();

            if (!exited || p.exitValue() != 0) {
                log.error("docker run failed (exit {}): {}", p.exitValue(), output);
                return;
            }

            // Add to pool as DEAD — health check loop promotes to HEALTHY
            Instance fresh = new Instance(url, true);
            fresh.status.set(InstanceStatus.DEAD);
            pool.add(fresh);
            log.info("Container {} started (id={}), waiting for readiness...", containerName, output.substring(0, Math.min(12, output.length())));

            // Poll up to 25s for the new instance to be ready
            for (int i = 0; i < 25; i++) {
                Thread.sleep(1000);
                if (ping(url)) {
                    fresh.status.set(InstanceStatus.HEALTHY);
                    log.info("Instance {} is HEALTHY and accepting requests", url);
                    return;
                }
            }

            log.warn("Instance {} did not become healthy within 25s — health-check loop will retry", url);

        } catch (Exception e) {
            log.error("Failed to spawn execution instance: {}", e.getMessage(), e);
        } finally {
            spawning.set(false);
        }
    }

    private void stopContainer(Instance instance) {
        try {
            new ProcessBuilder("docker", "stop", instance.containerName)
                    .start().waitFor(10, TimeUnit.SECONDS);
            log.debug("Stopped container {}", instance.containerName);
        } catch (Exception e) {
            log.warn("Could not stop container {}: {}", instance.containerName, e.getMessage());
        }
    }

    private boolean ping(String url) {
        try {
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url + "/internal/health"))
                    .timeout(Duration.ofSeconds(2))
                    .GET().build();
            return HTTP.send(req, HttpResponse.BodyHandlers.discarding()).statusCode() == 200;
        } catch (Exception e) {
            return false;
        }
    }
}
