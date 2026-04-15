package com.learnsystem.controller;

import com.learnsystem.config.LoginRateLimiter;
import com.learnsystem.dto.AuthDtos.*;
import com.learnsystem.model.User;
import com.learnsystem.repository.UserRepository;
import com.learnsystem.security.JwtService;
import com.learnsystem.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

private final AuthService      authService;
private final UserRepository   userRepository;
private final JwtService       jwtService;
private final LoginRateLimiter loginRateLimiter;

/**
 * POST /api/auth/register
 * Body: { name, email, password }
 * Returns JWT + user info
 */
@PostMapping("/register")
public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
	log.info("Register attempt: {}", req.getEmail());
	AuthResponse resp = authService.register(req);
	log.info("User registered: {} (id={})", req.getEmail(), resp.getId());
	return ResponseEntity.ok(resp);
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Returns JWT + user info
 */
@PostMapping("/login")
public ResponseEntity<?> login(
		@Valid @RequestBody LoginRequest req,
		HttpServletRequest httpReq) {

	String email = req.getEmail();
	String ip    = getClientIp(httpReq);

	// Brute-force protection: 5 failed attempts per email or IP locks for 15 min
	if (!loginRateLimiter.isAllowed(email, ip)) {
		int remaining = loginRateLimiter.remainingAttempts(email);
		log.warn("Login blocked (rate limit): email={} ip={}", email, ip);
		return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
				.body(Map.of(
						"error",   "Too many failed attempts",
						"message", "Account temporarily locked. Try again in 15 minutes.",
						"remainingAttempts", remaining
				));
	}

	try {
		log.info("Login attempt: email={} ip={}", email, ip);
		AuthResponse resp = authService.login(req);
		loginRateLimiter.recordSuccess(email, ip); // reset counter on success
		log.info("Login success: email={} id={}", email, resp.getId());
		return ResponseEntity.ok(resp);
	} catch (BadCredentialsException e) {
		loginRateLimiter.recordFailure(email, ip);
		int remaining = loginRateLimiter.remainingAttempts(email);
		log.warn("Login failed: email={} ip={} remainingAttempts={}", email, ip, remaining);
		// Return generic message — don't reveal whether email exists
		return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
				.body(Map.of(
						"error",   "Invalid credentials",
						"message", "Email or password is incorrect.",
						"remainingAttempts", remaining
				));
	}
}

private static String getClientIp(HttpServletRequest req) {
	String forwarded = req.getHeader("X-Forwarded-For");
	if (forwarded != null && !forwarded.isBlank()) {
		return forwarded.split(",")[0].strip();
	}
	return req.getRemoteAddr();
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
	log.debug("Logout requested");
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
			"valid",          true,
			"id",             fresh.getId(),
			"name",           fresh.getName(),
			"email",          fresh.getEmail(),
			"role",           fresh.getPrimaryRole().name(),
			"roles",          roles,
			"avatar",         fresh.getAvatarUrl() != null ? fresh.getAvatarUrl() : "",
			"streakDays",     fresh.getStreakDays(),
			"problemsSolved", fresh.getProblemsSolved()
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
			"token",              newToken,
			"id",                 fresh.getId(),
			"name",               fresh.getName(),
			"email",              fresh.getEmail(),
			"role",               fresh.getPrimaryRole().name(),
			"roles",              roles,
			"avatar",             fresh.getAvatarUrl() != null ? fresh.getAvatarUrl() : "",
			"streakDays",         fresh.getStreakDays(),
			"problemsSolved",     fresh.getProblemsSolved()
	));
}
}