package com.learnsystem.controller;

import com.learnsystem.model.User;
import com.learnsystem.repository.UserRepository;
import com.learnsystem.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Admin Portal — user role management endpoints.
 * listUsers() is commented out — AdminApprovalController handles GET /api/admin/users.
 * All other paths here are unique: /stats, /{id}/roles, /switch-role etc.
 */
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminPortalController {

private final UserRepository userRepository;
private final JwtService     jwtService;

/** GET all users */
/*@GetMapping
public ResponseEntity<List<Map<String,Object>>> listUsers() {
	return ResponseEntity.ok(
			userRepository.findAll().stream().map(this::toMap).collect(Collectors.toList())
	);
}*/

/** GET stats */
@GetMapping("/stats")
public ResponseEntity<Map<String,Object>> stats() {
	List<User> all = userRepository.findAll();
	return ResponseEntity.ok(Map.of(
			"totalUsers",   all.size(),
			"adminCount",   all.stream().filter(User::isAdmin).count(),
			"studentCount", all.stream().filter(u -> u.hasRole(User.Role.STUDENT)).count(),
			"googleUsers",  all.stream().filter(u -> u.getProvider() == User.Provider.GOOGLE).count(),
			"localUsers",   all.stream().filter(u -> u.getProvider() == User.Provider.LOCAL).count()
	));
}

/**
 * PUT /api/admin/users/{id}/roles
 * Body: { "roles": ["STUDENT","ADMIN"] }
 * Replaces ALL roles for the user.
 */
@PutMapping("/{id}/roles")
public ResponseEntity<?> setRoles(@PathVariable Long id,
                                  @RequestBody Map<String, List<String>> body) {
	List<String> roleNames = body.get("roles");
	if (roleNames == null || roleNames.isEmpty()) {
		return ResponseEntity.badRequest().body(Map.of("error", "At least one role required"));
	}
	Set<User.Role> newRoles = new HashSet<>();
	for (String r : roleNames) {
		try { newRoles.add(User.Role.valueOf(r.toUpperCase())); }
		catch (IllegalArgumentException e) {
			return ResponseEntity.badRequest().body(Map.of("error", "Unknown role: " + r));
		}
	}
	User user = userRepository.findById(id)
			.orElseThrow(() -> new RuntimeException("User not found"));
	user.getRoles().clear();
	user.getRoles().addAll(newRoles);
	userRepository.save(user);
	return ResponseEntity.ok(toMap(user));
}

/**
 * POST /api/admin/users/{id}/roles/add
 * Body: { "role": "ADMIN" }
 * Adds a single role without removing existing ones.
 */
@PostMapping("/{id}/roles/add")
public ResponseEntity<?> addRole(@PathVariable Long id,
                                 @RequestBody Map<String,String> body) {
	User user = userRepository.findById(id)
			.orElseThrow(() -> new RuntimeException("User not found"));
	try {
		user.addRole(User.Role.valueOf(body.get("role").toUpperCase()));
	} catch (IllegalArgumentException e) {
		return ResponseEntity.badRequest().body(Map.of("error", "Unknown role: " + body.get("role")));
	}
	userRepository.save(user);
	return ResponseEntity.ok(toMap(user));
}

/**
 * DELETE /api/admin/users/{id}/roles/{role}
 * Removes one role. User must have at least one role remaining.
 */
@DeleteMapping("/{id}/roles/{role}")
public ResponseEntity<?> removeRole(@PathVariable Long id,
                                    @PathVariable String role) {
	User user = userRepository.findById(id)
			.orElseThrow(() -> new RuntimeException("User not found"));
	if (user.getRoles().size() <= 1) {
		return ResponseEntity.badRequest()
				.body(Map.of("error", "Cannot remove last role — user must have at least one"));
	}
	try { user.removeRole(User.Role.valueOf(role.toUpperCase())); }
	catch (IllegalArgumentException e) {
		return ResponseEntity.badRequest().body(Map.of("error", "Unknown role: " + role));
	}
	userRepository.save(user);
	return ResponseEntity.ok(toMap(user));
}

/** DELETE user */
@DeleteMapping("/{id}")
public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
	userRepository.deleteById(id);
	return ResponseEntity.noContent().build();
}

/**
 * POST /api/admin/users/switch-role
 * Issues a temporary JWT with different roles for testing.
 * DB is NEVER changed.
 */
@PostMapping("/switch-role")
public ResponseEntity<?> switchRole(@RequestBody Map<String, Object> body,
                                    @AuthenticationPrincipal User caller) {
	// Accept either single "role" or list "roles"
	Set<User.Role> targetRoles = new HashSet<>();

	if (body.containsKey("roles")) {
		List<?> roleList = (List<?>) body.get("roles");
		for (Object r : roleList) {
			try { targetRoles.add(User.Role.valueOf(r.toString().toUpperCase())); }
			catch (IllegalArgumentException e) {
				return ResponseEntity.badRequest().body(Map.of("error", "Unknown role: " + r));
			}
		}
	} else if (body.containsKey("role")) {
		try { targetRoles.add(User.Role.valueOf(body.get("role").toString().toUpperCase())); }
		catch (IllegalArgumentException e) {
			return ResponseEntity.badRequest().body(Map.of("error", "Unknown role: " + body.get("role")));
		}
	} else {
		return ResponseEntity.badRequest().body(Map.of("error", "Provide 'role' or 'roles'"));
	}

	// Build a fake user with the overridden roles (DB not touched)
	User fake = User.builder()
			.id(caller.getId())
			.email(caller.getEmail())
			.name(caller.getName())
			.avatarUrl(caller.getAvatarUrl())
			.roles(targetRoles)
			.provider(caller.getProvider())
			.emailVerified(caller.isEmailVerified())
			.streakDays(caller.getStreakDays())
			.problemsSolved(caller.getProblemsSolved())
			.build();

	String token = jwtService.generateToken(fake);
	List<String> roleNames = targetRoles.stream().map(User.Role::name).sorted().toList();

	return ResponseEntity.ok(Map.of(
			"token",         token,
			"roles",         roleNames,
			"primaryRole",   fake.getPrimaryRole().name(),
			"message",       "Switched to " + roleNames + ". DB roles unchanged.",
			"originalRoles", caller.getRoles().stream().map(User.Role::name).sorted().toList()
	));
}

// ── Helper ─────────────────────────────────────────────────────────────────

private Map<String,Object> toMap(User u) {
	List<String> roleList = u.getRoles() != null
			? u.getRoles().stream().map(User.Role::name).sorted().toList()
			: List.of("STUDENT");
	// Map.of() max is 10 pairs — use ofEntries() for 11+
	return Map.ofEntries(
			Map.entry("id",             u.getId()),
			Map.entry("name",           u.getName()     != null ? u.getName()     : ""),
			Map.entry("email",          u.getEmail()    != null ? u.getEmail()    : ""),
			Map.entry("roles",          roleList),
			Map.entry("primaryRole",    u.getPrimaryRole().name()),
			Map.entry("provider",       u.getProvider().name()),
			Map.entry("avatarUrl",      u.getAvatarUrl() != null ? u.getAvatarUrl() : ""),
			Map.entry("createdAt",      u.getCreatedAt() != null ? u.getCreatedAt().toString() : ""),
			Map.entry("lastLogin",      u.getLastLogin()  != null ? u.getLastLogin().toString()  : ""),
			Map.entry("streakDays",     u.getStreakDays()),
			Map.entry("problemsSolved", u.getProblemsSolved())
	);
}
}