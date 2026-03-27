package com.learnsystem.controller;

import com.learnsystem.dto.AuthDtos.*;
import com.learnsystem.model.User;
import com.learnsystem.repository.UserRepository;
import com.learnsystem.security.JwtService;
import com.learnsystem.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

private final AuthService     authService;
private final UserRepository  userRepository;
private final JwtService      jwtService;

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
	// Always load fresh from DB so role changes are reflected immediately
	User fresh = userRepository.findById(user.getId()).orElse(user);
	List<String> roles = fresh.getRoles() != null
			? fresh.getRoles().stream().map(r -> r.name()).sorted().collect(java.util.stream.Collectors.toList())
			: List.of("STUDENT");
	return ResponseEntity.ok(Map.of(
			"valid",  true,
			"id",     fresh.getId(),
			"name",   fresh.getName(),
			"email",  fresh.getEmail(),
			"role",   fresh.getPrimaryRole().name(),
			"roles",  roles,
			"avatar", fresh.getAvatarUrl() != null ? fresh.getAvatarUrl() : ""
	));
}

/**
 * POST /api/auth/refresh
 * Re-issues a fresh JWT based on CURRENT DB roles.
 * Call this after any role change — no re-login needed.
 */
@PostMapping("/refresh")
@PreAuthorize("isAuthenticated()")
public ResponseEntity<?> refresh(@AuthenticationPrincipal User user) {
	// Load latest state from DB
	User fresh = userRepository.findById(user.getId())
			.orElseThrow(() -> new RuntimeException("User not found"));

	String newToken = jwtService.generateToken(fresh);
	List<String> roles = fresh.getRoles() != null
			? fresh.getRoles().stream().map(r -> r.name()).sorted().collect(java.util.stream.Collectors.toList())
			: List.of("STUDENT");

	return ResponseEntity.ok(Map.of(
			"token",  newToken,
			"id",     fresh.getId(),
			"name",   fresh.getName(),
			"email",  fresh.getEmail(),
			"role",   fresh.getPrimaryRole().name(),
			"roles",  roles,
			"avatar", fresh.getAvatarUrl() != null ? fresh.getAvatarUrl() : ""
	));
}
}