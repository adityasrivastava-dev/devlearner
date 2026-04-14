package com.learnsystem.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Logs every inbound API request with method, path, response status, and duration.
 *
 * Log levels by status:
 *   2xx / 3xx → INFO
 *   4xx        → WARN
 *   5xx        → ERROR
 *
 * Skips non-API paths (static assets, actuator noise, OAuth2 redirects).
 *
 * Format: [API] POST /api/auth/login -> 200 (47ms)
 */
@Slf4j
@Component
public class ApiLoggingFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        long   start    = System.currentTimeMillis();
        String method   = request.getMethod();
        String uri      = request.getRequestURI();
        String query    = request.getQueryString();
        String fullPath = query != null ? uri + "?" + query : uri;

        try {
            chain.doFilter(request, response);
        } finally {
            long ms     = System.currentTimeMillis() - start;
            int  status = response.getStatus();

            if (status >= 500) {
                log.error("[API] {} {} -> {} ({}ms)", method, fullPath, status, ms);
            } else if (status >= 400) {
                log.warn( "[API] {} {} -> {} ({}ms)", method, fullPath, status, ms);
            } else {
                log.info( "[API] {} {} -> {} ({}ms)", method, fullPath, status, ms);
            }
        }
    }

    /** Skip non-API paths — static assets and OAuth2 redirects don't need HTTP logging. */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/oauth2")
            || path.startsWith("/login/oauth2")
            || path.startsWith("/actuator")
            || path.endsWith(".js")
            || path.endsWith(".css")
            || path.endsWith(".html")
            || path.endsWith(".ico")
            || path.endsWith(".png")
            || path.endsWith(".woff2");
    }
}
