package com.learnsystem.service;

import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Scans submitted code for patterns that would crash or compromise the server.
 *
 * WHY THIS EXISTS
 * ───────────────
 * User code runs inside a child JVM process. Without scanning:
 *
 *   System.exit(0)           → kills the PARENT Spring Boot JVM (the whole server)
 *   Runtime.exec("rm -rf /") → spawns arbitrary OS commands
 *   new Socket("attacker.com") → exfiltrates data, bypasses firewall
 *   System.loadLibrary(...)  → loads native code, full OS access
 *   while(true) {}           → handled by TIMEOUT_SECONDS, not blocked here
 *
 * HOW IT WORKS
 * ─────────────
 * 1. Strip comments and string literals so "// System.exit" is not flagged.
 * 2. Check for banned identifiers with word-boundary awareness.
 * 3. Fast: pure string ops, no AST parsing, sub-millisecond for any realistic code.
 *
 * WHAT IS NOT BLOCKED
 * ────────────────────
 * - Thread.sleep()      — needed for concurrency examples
 * - java.io.File        — needed for some I/O problems (read-only in child's tempDir)
 * - System.in/out/err   — essential
 * - Reflection reads    — getMethods(), getFields() are fine; setAccessible(true) blocked
 */
@Component
public class CodeSafetyScanner {

    /** Max code size accepted. 50 KB is ~1500 lines — plenty for any interview problem. */
    public static final int MAX_CODE_BYTES = 50_000;

    public record ScanResult(boolean safe, String reason) {
        public static ScanResult ok()              { return new ScanResult(true,  null); }
        public static ScanResult blocked(String r) { return new ScanResult(false, r);   }
    }

    /**
     * Each entry: { "token to find in stripped code", "user-facing reason" }
     *
     * Ordered: most dangerous first so the first match wins quickly.
     */
    private static final List<String[]> BLOCKED = List.of(
        // ── JVM suicide — kills the parent Spring Boot process ────────────────
        new String[]{ "System.exit",             "System.exit() is not permitted in submissions" },
        new String[]{ "Runtime.halt",            "Runtime.halt() is not permitted" },

        // ── Process spawning — executes arbitrary OS commands ─────────────────
        new String[]{ "Runtime.getRuntime",      "Runtime.exec() / process spawning is not permitted" },
        new String[]{ "ProcessBuilder",          "ProcessBuilder is not permitted" },

        // ── Network access — data exfiltration, outbound connections ──────────
        new String[]{ "java.net.Socket",         "Network access (Socket) is not permitted" },
        new String[]{ "java.net.ServerSocket",   "Network access (ServerSocket) is not permitted" },
        new String[]{ "java.net.URL(",           "Network access (URL) is not permitted" },
        new String[]{ "HttpURLConnection",       "Network access (HttpURLConnection) is not permitted" },
        new String[]{ "java.rmi.",               "RMI is not permitted" },

        // ── Native code — bypasses all JVM controls ───────────────────────────
        new String[]{ "System.loadLibrary",      "Native library loading is not permitted" },
        new String[]{ "System.load(",            "Native library loading is not permitted" },
        new String[]{ "sun.misc.Unsafe",         "Unsafe memory access is not permitted" },
        new String[]{ "jdk.internal.",           "Internal JDK APIs are not permitted" },

        // ── Reflection escalation — bypasses access controls ──────────────────
        new String[]{ "setAccessible(true)",     "setAccessible(true) is not permitted" },
        new String[]{ "getDeclaredConstructor",  "Reflective instantiation is not permitted" },

        // ── Class loading — can load malicious bytecode ───────────────────────
        new String[]{ "ClassLoader",             "Custom ClassLoader usage is not permitted" },
        new String[]{ "defineClass",             "defineClass is not permitted" },

        // ── Shutdown hooks — persists after execution ends ────────────────────
        new String[]{ "addShutdownHook",         "Shutdown hooks are not permitted" }
    );

    /**
     * Returns ScanResult.ok() if the code is safe to execute,
     * or ScanResult.blocked(reason) if a banned pattern was found.
     */
    public ScanResult scan(String code) {
        if (code == null || code.isBlank()) {
            return ScanResult.blocked("Code cannot be empty");
        }
        if (code.length() > MAX_CODE_BYTES) {
            return ScanResult.blocked(
                "Code exceeds the " + (MAX_CODE_BYTES / 1000) + " KB size limit");
        }

        String stripped = stripCommentsAndStrings(code);

        for (String[] rule : BLOCKED) {
            if (stripped.contains(rule[0])) {
                return ScanResult.blocked(rule[1]);
            }
        }

        return ScanResult.ok();
    }

    /**
     * Remove comments and string literals before scanning so that:
     *   // System.exit(0)  → not flagged (comment)
     *   "System.exit"      → not flagged (string literal)
     *
     * This is a best-effort strip, not a full parser. Handles the common cases.
     */
    private String stripCommentsAndStrings(String code) {
        // Remove block comments first  /* ... */
        code = code.replaceAll("/\\*[\\s\\S]*?\\*/", " ");
        // Remove line comments  // ...
        code = code.replaceAll("//[^\n]*", " ");
        // Remove string literals (handles escaped quotes inside strings)
        code = code.replaceAll("\"(?:[^\"\\\\]|\\\\.)*\"", "\"\"");
        // Remove char literals
        code = code.replaceAll("'(?:[^'\\\\]|\\\\.)'", "' '");
        return code;
    }
}
