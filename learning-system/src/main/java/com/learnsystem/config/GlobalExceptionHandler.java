package com.learnsystem.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

@ExceptionHandler(BadCredentialsException.class)
public ResponseEntity<Map<String,String>> badCredentials(BadCredentialsException e) {
    // Never echo the real message — it varies between "bad password" and "user not found",
    // which leaks whether the account exists (user enumeration attack).
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(Map.of("error", "Unauthorized", "message", "Invalid credentials"));
}

@ExceptionHandler(UsernameNotFoundException.class)
public ResponseEntity<Map<String,String>> notFound(UsernameNotFoundException e) {
    // Return the same response as BadCredentials to prevent user enumeration.
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(Map.of("error", "Unauthorized", "message", "Invalid credentials"));
}

@ExceptionHandler(IllegalArgumentException.class)
public ResponseEntity<Map<String,String>> badRequest(IllegalArgumentException e) {
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(Map.of("error", "Bad Request", "message", e.getMessage()));
}

@ExceptionHandler(AccessDeniedException.class)
public ResponseEntity<Map<String,String>> forbidden(AccessDeniedException e) {
    return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(Map.of("error", "Forbidden", "message", "You don't have permission for this action"));
}

@ExceptionHandler(MethodArgumentNotValidException.class)
public ResponseEntity<Map<String,String>> validation(MethodArgumentNotValidException e) {
    String msg = e.getBindingResult().getFieldErrors().stream()
            .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
            .collect(Collectors.joining(", "));
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(Map.of("error", "Validation Failed", "message", msg));
}

@ExceptionHandler(Exception.class)
public ResponseEntity<Map<String,String>> generic(Exception e) {
    // Suppress noisy but harmless exceptions
    String msg = e.getMessage() != null ? e.getMessage() : "";
    if (e instanceof org.springframework.web.servlet.resource.NoResourceFoundException) {
        // 404 for unknown paths — debug only
        log.debug("No resource: {}", msg);
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "Not Found", "message", msg));
    }
    if (msg.contains("ClientAbortException")
            || msg.contains("Connection aborted")
            || msg.contains("aborted by the software")
            || msg.contains("Broken pipe")
            || e.getCause() instanceof java.io.IOException) {
        // Browser navigated away mid-response — completely normal, not an error
        log.debug("Client disconnected (normal)");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Client disconnected", "message", "Connection closed"));
    }
    // Log exception class + message only — NOT the full stack trace.
    // Stack traces can expose DB schema, class paths, and internal query details
    // to anyone who can read logs (e.g., misconfigured log aggregators).
    log.error("Unhandled exception [{}]: {}", e.getClass().getSimpleName(), msg);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(Map.of("error", "Server Error", "message", "Something went wrong"));
}
}