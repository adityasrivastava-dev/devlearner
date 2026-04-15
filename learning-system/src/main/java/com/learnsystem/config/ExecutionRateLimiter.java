package com.learnsystem.config;

import org.springframework.stereotype.Component;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Simple in-memory sliding-window rate limiter for the code execution endpoint.
 *
 * Limits each user to MAX_REQUESTS executions per WINDOW_MS milliseconds.
 * Uses ConcurrentHashMap — safe for concurrent requests on the same user ID.
 *
 * Not distributed: if running multiple instances, each instance tracks its own
 * counts. For a distributed setup, replace with Redis + Bucket4j.
 */
@Component
public class ExecutionRateLimiter {

    private static final int  MAX_REQUESTS = 10;          // per user per window
    private static final long WINDOW_MS    = 60_000L;     // 1 minute

    private record Window(AtomicInteger count, long windowStart) {}

    private final ConcurrentHashMap<Long, Window> windows = new ConcurrentHashMap<>();

    // Sweep expired entries every SWEEP_EVERY calls to prevent unbounded map growth
    private static final int SWEEP_EVERY = 200;
    private final AtomicLong  sweepCounter = new AtomicLong(0);

    /**
     * Returns true if the request should be allowed, false if rate limit exceeded.
     */
    public boolean tryConsume(Long userId) {
        long now = System.currentTimeMillis();

        Window window = windows.compute(userId, (id, existing) -> {
            if (existing == null || now - existing.windowStart() >= WINDOW_MS) {
                return new Window(new AtomicInteger(1), now);
            }
            existing.count().incrementAndGet();
            return existing;
        });

        // Periodically purge expired windows to prevent unbounded memory growth
        if (sweepCounter.incrementAndGet() % SWEEP_EVERY == 0) {
            windows.entrySet().removeIf(e -> now - e.getValue().windowStart() >= WINDOW_MS);
        }

        return window.count().get() <= MAX_REQUESTS;
    }

    /**
     * Returns remaining requests allowed in the current window for a user.
     */
    public int remaining(Long userId) {
        long now = System.currentTimeMillis();
        Window window = windows.get(userId);
        if (window == null || now - window.windowStart() >= WINDOW_MS) return MAX_REQUESTS;
        return Math.max(0, MAX_REQUESTS - window.count().get());
    }
}
