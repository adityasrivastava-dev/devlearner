package com.execservice.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.util.List;

/**
 * Safety scanner for the execution microservice.
 *
 * The execution service runs code inside Docker containers by default.
 * With Docker isolation, System.exit and Runtime.halt are safe — they kill
 * the container, not the host JVM. Those blocks are skipped in Docker mode.
 *
 * All other blocks remain as defense-in-depth even inside containers.
 */
@Component
public class CodeSafetyScanner {

    public static final int MAX_CODE_BYTES = 50_000;

    @Value("${execution.docker.enabled:true}")
    private boolean dockerEnabled;

    public record ScanResult(boolean safe, String reason) {
        public static ScanResult ok()              { return new ScanResult(true,  null); }
        public static ScanResult blocked(String r) { return new ScanResult(false, r);   }
    }

    // Only dangerous in non-Docker mode (kills host JVM)
    private static final List<String[]> HOST_KILL_BLOCKED = List.of(
        new String[]{ "System.exit",  "System.exit() is not permitted in submissions" },
        new String[]{ "Runtime.halt", "Runtime.halt() is not permitted" }
    );

    // Dangerous regardless of Docker mode
    private static final List<String[]> ALWAYS_BLOCKED = List.of(
        new String[]{ "Runtime.getRuntime",      "Runtime.exec() / process spawning is not permitted" },
        new String[]{ "ProcessBuilder",          "ProcessBuilder is not permitted" },
        new String[]{ "java.net.Socket",         "Network access (Socket) is not permitted" },
        new String[]{ "java.net.ServerSocket",   "Network access (ServerSocket) is not permitted" },
        new String[]{ "java.net.URL(",           "Network access (URL) is not permitted" },
        new String[]{ "HttpURLConnection",       "Network access (HttpURLConnection) is not permitted" },
        new String[]{ "java.rmi.",               "RMI is not permitted" },
        new String[]{ "System.loadLibrary",      "Native library loading is not permitted" },
        new String[]{ "System.load(",            "Native library loading is not permitted" },
        new String[]{ "sun.misc.Unsafe",         "Unsafe memory access is not permitted" },
        new String[]{ "jdk.internal.",           "Internal JDK APIs are not permitted" },
        new String[]{ "setAccessible(true)",     "setAccessible(true) is not permitted" },
        new String[]{ "getDeclaredConstructor",  "Reflective instantiation is not permitted" },
        new String[]{ "ClassLoader",             "Custom ClassLoader usage is not permitted" },
        new String[]{ "defineClass",             "defineClass is not permitted" },
        new String[]{ "addShutdownHook",         "Shutdown hooks are not permitted" }
    );

    public ScanResult scan(String code) {
        if (code == null || code.isBlank())      return ScanResult.blocked("Code cannot be empty");
        if (code.length() > MAX_CODE_BYTES)      return ScanResult.blocked(
                "Code exceeds the " + (MAX_CODE_BYTES / 1000) + " KB size limit");

        String stripped = stripCommentsAndStrings(code);

        if (!dockerEnabled) {
            for (String[] rule : HOST_KILL_BLOCKED) {
                if (stripped.contains(rule[0])) return ScanResult.blocked(rule[1]);
            }
        }

        for (String[] rule : ALWAYS_BLOCKED) {
            if (stripped.contains(rule[0])) return ScanResult.blocked(rule[1]);
        }

        return ScanResult.ok();
    }

    private String stripCommentsAndStrings(String code) {
        code = code.replaceAll("/\\*[\\s\\S]*?\\*/", " ");
        code = code.replaceAll("//[^\n]*", " ");
        code = code.replaceAll("\"(?:[^\"\\\\]|\\\\.)*\"", "\"\"");
        code = code.replaceAll("'(?:[^'\\\\]|\\\\.)'", "' '");
        return code;
    }
}
