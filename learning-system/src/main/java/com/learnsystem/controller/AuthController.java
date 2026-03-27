package com.learnsystem.controller;

import com.learnsystem.dto.AuthDtos.*;
import com.learnsystem.model.User;
import com.learnsystem.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

private final AuthService authService;

/**
 * POST /api/auth/register
 * Body: { name, email, password }
 * Returns JWT + user info
 */
@PostMapping("/register")
public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
	return ResponseEntity.ok(authService.register(req));
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Returns JWT + user info
 */
@PostMapping("/login")
public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
	return ResponseEntity.ok(authService.login(req));
}

/**
 * GET /api/auth/me
 * Header: Authorization: Bearer <token>
 * Returns current user profile
 */
@GetMapping("/me")
@PreAuthorize("isAuthenticated()")
public ResponseEntity<UserProfileResponse> me(@AuthenticationPrincipal User user) {
	return ResponseEntity.ok(authService.getProfile(user));
}

/**
 * POST /api/auth/logout
 * Client just discards the token — stateless JWT logout
 */
@PostMapping("/logout")
public ResponseEntity<Map<String, String>> logout() {
	return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
}

/**
 * GET /api/auth/check
 * Quick endpoint to verify if a token is still valid
 * Returns 200 with user info or 401
 */
@GetMapping("/check")
@PreAuthorize("isAuthenticated()")
public ResponseEntity<Map<String, Object>> check(@AuthenticationPrincipal User user) {
	return ResponseEntity.ok(Map.of(
			"valid",  true,
			"id",     user.getId(),
			"name",   user.getName(),
			"email",  user.getEmail(),
			"role",   user.getPrimaryRole().name(),
			"roles",  user.getRoles() != null
					? user.getRoles().stream().map(r -> r.name()).sorted().collect(java.util.stream.Collectors.joining(","))
					: "STUDENT",
			"avatar", user.getAvatarUrl() != null ? user.getAvatarUrl() : ""
	));
}
}