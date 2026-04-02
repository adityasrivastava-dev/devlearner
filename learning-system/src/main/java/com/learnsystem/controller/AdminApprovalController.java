package com.learnsystem.controller;

import com.learnsystem.model.User;
import com.learnsystem.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * SuperAdmin User Management — read-only + revoke admin.
 *
 * Admin accounts are managed directly via database (INSERT INTO user_roles).
 * This controller provides:
 *   GET  /api/admin/users              — view all users (SuperAdmin only)
 *   POST /api/admin/users/{id}/revoke-admin — revoke ADMIN role (SuperAdmin only)
 */
@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminApprovalController {

private final UserRepository userRepository;

private static final String SUPER_ADMIN = "asaditya1826@gmail.com";

// ── All users list ────────────────────────────────────────────────────────

@GetMapping("/users")
public ResponseEntity<?> getAllUsers(@AuthenticationPrincipal User current) {
	if (!isSuperAdmin(current))
		return ResponseEntity.status(403).body(Map.of("error", "SuperAdmin only"));

	List<Map<String, Object>> users = userRepository.findAll().stream()
			.sorted(Comparator.comparing(User::getCreatedAt,
					Comparator.nullsLast(Comparator.reverseOrder())))
			.map(u -> {
				Map<String, Object> m = new LinkedHashMap<>();
				m.put("id",           u.getId());
				m.put("name",         u.getName());
				m.put("email",        u.getEmail());
				m.put("role",         u.getPrimaryRole().name());
				m.put("roles",        u.getRoles() != null
						? u.getRoles().stream().map(Enum::name).toList() : List.of());
				m.put("provider",     u.getProvider().name());
				m.put("streakDays",   u.getStreakDays());
				m.put("problemsSolved", u.getProblemsSolved());
				m.put("createdAt",    u.getCreatedAt() != null
						? u.getCreatedAt().format(DateTimeFormatter.ISO_DATE_TIME) : null);
				m.put("lastLogin",    u.getLastLogin() != null
						? u.getLastLogin().format(DateTimeFormatter.ISO_DATE_TIME) : null);
				return m;
			}).collect(Collectors.toList());

	return ResponseEntity.ok(Map.of(
			"totalUsers", users.size(),
			"admins",     users.stream().filter(u -> "ADMIN".equals(u.get("role"))).count(),
			"users",      users
	));
}

// ── Revoke admin role ─────────────────────────────────────────────────────

@PostMapping("/users/{id}/revoke-admin")
public ResponseEntity<?> revokeAdmin(
		@PathVariable Long id,
		@AuthenticationPrincipal User current) {

	if (!isSuperAdmin(current))
		return ResponseEntity.status(403).body(Map.of("error", "SuperAdmin only"));

	User target = userRepository.findById(id).orElse(null);
	if (target == null)
		return ResponseEntity.status(404).body(Map.of("error", "User not found: " + id));

	if (SUPER_ADMIN.equalsIgnoreCase(target.getEmail()))
		return ResponseEntity.badRequest().body(Map.of("error", "Cannot revoke SuperAdmin's own role"));

	if (!target.isAdmin())
		return ResponseEntity.badRequest().body(Map.of("error", target.getName() + " is not an ADMIN"));

	target.removeRole(User.Role.ADMIN);
	userRepository.save(target);
	log.info("ADMIN revoked: {} (id={}) by {}", target.getEmail(), id, current.getEmail());

	return ResponseEntity.ok(Map.of(
			"success", true,
			"message", "ADMIN role revoked from " + target.getName() + " (" + target.getEmail() + ")"
	));
}

// ── Grant admin role (direct, no approval needed) ─────────────────────────

@PostMapping("/users/{id}/grant-admin")
public ResponseEntity<?> grantAdmin(
		@PathVariable Long id,
		@AuthenticationPrincipal User current) {

	if (!isSuperAdmin(current))
		return ResponseEntity.status(403).body(Map.of("error", "SuperAdmin only"));

	User target = userRepository.findById(id).orElse(null);
	if (target == null)
		return ResponseEntity.status(404).body(Map.of("error", "User not found: " + id));

	if (target.isAdmin())
		return ResponseEntity.ok(Map.of("message", target.getName() + " is already ADMIN"));

	target.addRole(User.Role.ADMIN);
	userRepository.save(target);
	log.info("ADMIN granted: {} (id={}) by {}", target.getEmail(), id, current.getEmail());

	return ResponseEntity.ok(Map.of(
			"success", true,
			"message", "ADMIN role granted to " + target.getName() + " (" + target.getEmail() + ")"
	));
}

private boolean isSuperAdmin(User user) {
	return user != null && SUPER_ADMIN.equalsIgnoreCase(user.getEmail());
}
}