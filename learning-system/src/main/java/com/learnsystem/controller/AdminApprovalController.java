package com.learnsystem.controller;

import com.learnsystem.model.User;
import com.learnsystem.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Admin Approval System.
 *
 * Flow:
 *  1. User registers with requestAdminRole=true via POST /api/auth/register
 *  2. Their account is created as STUDENT with adminRequestPending=true
 *  3. An email notification is sent to asaditya1826@gmail.com (via logging for now)
 *  4. asaditya1826@gmail.com logs in and navigates to Admin Portal → Pending Approvals
 *  5. POST /api/admin/users/{id}/approve-admin  → grants ADMIN role
 *     POST /api/admin/users/{id}/reject-admin   → rejects and clears pending flag
 *
 * Security: All endpoints restricted to users with ADMIN role.
 * The first admin (asaditya1826@gmail.com) can be bootstrapped via the DB or
 * application startup config.
 */
@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminApprovalController {

private final UserRepository userRepository;

/** Owner email — only this account can approve admin requests */
private static final String OWNER_EMAIL = "asaditya1826@gmail.com";

// ── Pending admin requests ────────────────────────────────────────────────

/**
 * GET /api/admin/pending-admins
 * Returns all users with adminRequestPending=true.
 * Only callable by an existing ADMIN.
 */
@GetMapping("/pending-admins")
public ResponseEntity<?> getPendingAdminRequests(@AuthenticationPrincipal User currentUser) {
	if (!isOwner(currentUser)) {
		return ResponseEntity.status(403).body(Map.of(
				"error", "Only " + OWNER_EMAIL + " can view pending admin requests"
		));
	}

	List<User> pending = userRepository.findAll().stream()
			.filter(u -> Boolean.TRUE.equals(u.getAdminRequestPending()))
			.collect(Collectors.toList());

	List<Map<String, Object>> result = pending.stream().map(u -> {
		Map<String, Object> m = new LinkedHashMap<>();
		m.put("id",               u.getId());
		m.put("name",             u.getName());
		m.put("email",            u.getEmail());
		m.put("provider",         u.getProvider().name());
		m.put("requestedAt",      u.getAdminRequestedAt() != null
				? u.getAdminRequestedAt().format(DateTimeFormatter.ISO_DATE_TIME) : null);
		m.put("createdAt",        u.getCreatedAt() != null
				? u.getCreatedAt().format(DateTimeFormatter.ISO_DATE_TIME) : null);
		return m;
	}).collect(Collectors.toList());

	return ResponseEntity.ok(Map.of(
			"pendingCount", result.size(),
			"requests", result
	));
}

// ── Approve admin request ─────────────────────────────────────────────────

/**
 * POST /api/admin/users/{id}/approve-admin
 * Approves the admin role request for user {id}.
 * Restricted to asaditya1826@gmail.com only.
 */
@PostMapping("/users/{id}/approve-admin")
public ResponseEntity<?> approveAdminRequest(
		@PathVariable Long id,
		@AuthenticationPrincipal User currentUser) {

	if (!isOwner(currentUser)) {
		return ResponseEntity.status(403).body(Map.of(
				"error", "Only " + OWNER_EMAIL + " can approve admin requests"
		));
	}

	User target = userRepository.findById(id).orElse(null);
	if (target == null) {
		return ResponseEntity.status(404).body(Map.of("error", "User not found: " + id));
	}

	if (!target.isAdminRequestPending()) {
		return ResponseEntity.badRequest().body(Map.of(
				"error", "User " + target.getEmail() + " does not have a pending admin request"
		));
	}

	target.approveAdminRole();
	userRepository.save(target);

	log.info("ADMIN APPROVED: {} (id={}) approved by {}",
			target.getEmail(), target.getId(), currentUser.getEmail());

	return ResponseEntity.ok(Map.of(
			"success",  true,
			"message",  "ADMIN role granted to " + target.getName() + " (" + target.getEmail() + ")",
			"userId",   target.getId(),
			"userName", target.getName(),
			"userEmail",target.getEmail()
	));
}

// ── Reject admin request ──────────────────────────────────────────────────

/**
 * POST /api/admin/users/{id}/reject-admin
 * Rejects and clears the admin role request for user {id}.
 */
@PostMapping("/users/{id}/reject-admin")
public ResponseEntity<?> rejectAdminRequest(
		@PathVariable Long id,
		@AuthenticationPrincipal User currentUser) {

	if (!isOwner(currentUser)) {
		return ResponseEntity.status(403).body(Map.of(
				"error", "Only " + OWNER_EMAIL + " can reject admin requests"
		));
	}

	User target = userRepository.findById(id).orElse(null);
	if (target == null) {
		return ResponseEntity.status(404).body(Map.of("error", "User not found: " + id));
	}

	if (!target.isAdminRequestPending()) {
		return ResponseEntity.badRequest().body(Map.of(
				"error", "User " + target.getEmail() + " does not have a pending admin request"
		));
	}

	target.rejectAdminRequest();
	userRepository.save(target);

	log.info("ADMIN REJECTED: {} (id={}) rejected by {}",
			target.getEmail(), target.getId(), currentUser.getEmail());

	return ResponseEntity.ok(Map.of(
			"success",  true,
			"message",  "Admin request rejected for " + target.getName(),
			"userId",   target.getId()
	));
}

// ── Revoke existing admin ──────────────────────────────────────────────────

/**
 * POST /api/admin/users/{id}/revoke-admin
 * Removes ADMIN role from a user. Owner only.
 */
@PostMapping("/users/{id}/revoke-admin")
public ResponseEntity<?> revokeAdmin(
		@PathVariable Long id,
		@AuthenticationPrincipal User currentUser) {

	if (!isOwner(currentUser)) {
		return ResponseEntity.status(403).body(Map.of(
				"error", "Only " + OWNER_EMAIL + " can revoke admin roles"
		));
	}

	User target = userRepository.findById(id).orElse(null);
	if (target == null) {
		return ResponseEntity.status(404).body(Map.of("error", "User not found: " + id));
	}

	// Never revoke owner's own admin role
	if (OWNER_EMAIL.equalsIgnoreCase(target.getEmail())) {
		return ResponseEntity.badRequest().body(Map.of(
				"error", "Cannot revoke owner account's admin role"
		));
	}

	target.removeRole(User.Role.ADMIN);
	userRepository.save(target);

	log.info("ADMIN REVOKED: {} (id={}) by {}", target.getEmail(), id, currentUser.getEmail());

	return ResponseEntity.ok(Map.of(
			"success", true,
			"message", "ADMIN role revoked from " + target.getName()
	));
}

// ── All users list (admin panel) ──────────────────────────────────────────

/**
 * GET /api/admin/users
 * Returns all users with their roles and pending status.
 */
@GetMapping("/users")
public ResponseEntity<?> getAllUsers(@AuthenticationPrincipal User currentUser) {
	if (!isOwner(currentUser)) {
		return ResponseEntity.status(403).body(Map.of("error", "Owner access required"));
	}

	List<Map<String, Object>> users = userRepository.findAll().stream()
			.map(u -> {
				Map<String, Object> m = new LinkedHashMap<>();
				m.put("id",                u.getId());
				m.put("name",              u.getName());
				m.put("email",             u.getEmail());
				m.put("role",              u.getPrimaryRole().name());
				m.put("roles",             u.getRoles().stream().map(Enum::name).toList());
				m.put("provider",          u.getProvider().name());
				m.put("adminPending",      u.isAdminRequestPending());
				m.put("adminRequestedAt",  u.getAdminRequestedAt() != null
						? u.getAdminRequestedAt().format(DateTimeFormatter.ISO_DATE_TIME) : null);
				m.put("createdAt",         u.getCreatedAt() != null
						? u.getCreatedAt().format(DateTimeFormatter.ISO_DATE_TIME) : null);
				m.put("streakDays",        u.getStreakDays());
				m.put("problemsSolved",    u.getProblemsSolved());
				return m;
			}).collect(Collectors.toList());

	long pendingCount = users.stream()
			.filter(u -> Boolean.TRUE.equals(u.get("adminPending")))
			.count();

	return ResponseEntity.ok(Map.of(
			"totalUsers",   users.size(),
			"pendingAdmins", pendingCount,
			"users",        users
	));
}

// ── Bootstrap: make owner admin on first startup ───────────────────────────

/**
 * POST /api/admin/bootstrap
 * Makes asaditya1826@gmail.com an ADMIN if they have an account and are not already admin.
 * This is called manually once after first login of the owner.
 * After first call: this endpoint becomes a no-op if owner is already admin.
 */
@PostMapping("/bootstrap")
public ResponseEntity<?> bootstrap(@AuthenticationPrincipal User currentUser) {
	// Must be authenticated and must be the owner
	if (currentUser == null || !OWNER_EMAIL.equalsIgnoreCase(currentUser.getEmail())) {
		return ResponseEntity.status(403).body(Map.of(
				"error", "Only " + OWNER_EMAIL + " can bootstrap admin access"
		));
	}

	if (currentUser.isAdmin()) {
		return ResponseEntity.ok(Map.of(
				"message", "You are already an ADMIN. No action needed.",
				"email", currentUser.getEmail()
		));
	}

	currentUser.addRole(User.Role.ADMIN);
	userRepository.save(currentUser);

	log.info("BOOTSTRAP: {} is now ADMIN", currentUser.getEmail());

	return ResponseEntity.ok(Map.of(
			"success", true,
			"message", "ADMIN role granted to owner account: " + currentUser.getEmail(),
			"nextStep", "You can now approve pending admin requests at /admin.html"
	));
}

// ── Helper ────────────────────────────────────────────────────────────────

private boolean isOwner(User user) {
	return user != null && OWNER_EMAIL.equalsIgnoreCase(user.getEmail());
}
}