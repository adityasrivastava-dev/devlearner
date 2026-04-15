package com.learnsystem.config;

import org.springframework.stereotype.Component;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Brute-force protection for the login endpoint.
 *
 * Tracks failed attempts per email AND per IP independently.
 * After MAX_ATTEMPTS failures in WINDOW_MS, the account/IP is locked
 * until the window rolls over.
 *
 * Separate from ExecutionRateLimiter because:
 *  - Different limits (5 attempts vs 10 executions)
 *  - Different window (15 min vs 1 min)
 *  - Tracks failures only, not total calls
 *  - Locks on email + IP (double-key strategy)
 */
@Component
public class LoginRateLimiter {

    static final int  MAX_ATTEMPTS = 5;
    static final long WINDOW_MS    = 15 * 60 * 1000L; // 15 minutes

    private record Bucket(AtomicInteger failures, long windowStart) {}

    private final ConcurrentHashMap<String, Bucket> buckets = new ConcurrentHashMap<>();

    /** Call BEFORE attempting authentication. Returns false if locked out. */
    public boolean isAllowed(String email, String ip) {
        return !isLocked(keyFor(email)) && !isLocked(keyFor(ip));
    }

    /** Call AFTER a FAILED authentication. Increments the failure counter. */
    public void recordFailure(String email, String ip) {
        increment(keyFor(email));
        increment(keyFor(ip));
    }

    /** Call AFTER a SUCCESSFUL authentication. Resets both counters. */
    public void recordSuccess(String email, String ip) {
        buckets.remove(keyFor(email));
        buckets.remove(keyFor(ip));
    }

    /** Returns remaining attempts before lockout for display (0 = locked). */
    public int remainingAttempts(String email) {
        Bucket b = buckets.get(keyFor(email));
        if (b == null || isExpired(b)) return MAX_ATTEMPTS;
        return Math.max(0, MAX_ATTEMPTS - b.failures().get());
    }

    // ── internals ─────────────────────────────────────────────────────────────

    private boolean isLocked(String key) {
        Bucket b = buckets.get(key);
        if (b == null)          return false;
        if (isExpired(b))       { buckets.remove(key); return false; }
        return b.failures().get() >= MAX_ATTEMPTS;
    }

    private void increment(String key) {
        long now = System.currentTimeMillis();
        buckets.compute(key, (k, existing) -> {
            if (existing == null || isExpired(existing)) {
                Bucket fresh = new Bucket(new AtomicInteger(1), now);
                return fresh;
            }
            existing.failures().incrementAndGet();
            return existing;
        });
    }

    private boolean isExpired(Bucket b) {
        return System.currentTimeMillis() - b.windowStart() >= WINDOW_MS;
    }

    private static String keyFor(String value) {
        return value == null ? "null" : value.toLowerCase().strip();
    }
}
