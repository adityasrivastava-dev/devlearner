package com.learnsystem.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.Set;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;

@Column(nullable = false, unique = true)
private String email;

@Column(nullable = false)
private String name;

@Column(name = "password_hash")
private String passwordHash;

@Column(name = "avatar_url")
private String avatarUrl;

@Enumerated(EnumType.STRING)
@Column(nullable = false)
@Builder.Default
private Provider provider = Provider.LOCAL;

@Column(name = "provider_id")
private String providerId;

/**
 * Multi-role: stored as comma-separated string in DB column.
 * e.g. "STUDENT,TEACHER" or "ADMIN,STUDENT"
 * Hibernate @ElementCollection with a join table would also work but
 * this avoids an extra table and keeps the migration simple.
 */
@ElementCollection(fetch = FetchType.EAGER)
@CollectionTable(name = "user_roles",
		joinColumns = @JoinColumn(name = "user_id"))
@Column(name = "role")
@Enumerated(EnumType.STRING)
@Builder.Default
private Set<Role> roles = EnumSet.of(Role.STUDENT);

@Column(name = "email_verified", nullable = false)
@Builder.Default
private boolean emailVerified = false;

@Column(name = "verification_token")
private String verificationToken;

@Column(name = "token_expiry")
private LocalDateTime tokenExpiry;

@Column(name = "created_at")
private LocalDateTime createdAt;

@Column(name = "last_login")
private LocalDateTime lastLogin;

@Column(name = "streak_days")
@Builder.Default
private int streakDays = 0;

@Column(name = "problems_solved")
@Builder.Default
private int problemsSolved = 0;
// ── Phase 2 fields ────────────────────────────────────────────────────────

/** Pause days banked (1 per 7-day streak, max 3). Protects streak for 1 day. */
@Column(name = "pause_days_banked")
@Builder.Default
private int pauseDaysBanked = 0;

/** Date of last submitted solution — used for streak calculation (date only, no time). */
@Column(name = "last_active_date")
private java.time.LocalDate lastActiveDate;

/** Last time a streak recovery was used (1 allowed per 30 days). */
@Column(name = "last_recovery_used")
private java.time.LocalDate lastRecoveryUsed;

/** XP points accumulated from problems solved, recall drills, topics read. */
@Column(name = "xp")
@Builder.Default
private int xp = 0;
/** Level label: Beginner → Learner → Practitioner → Engineer → Senior → Architect */
@Column(name = "level", length = 50)
@Builder.Default
private String level = "Beginner";
/**
 * Admin Approval System:
 * When a user registers requesting ADMIN role, this is set to true.
 * Only asaditya1826@gmail.com can approve via POST /api/admin/users/{id}/approve-admin.
 * On approval: this flag is cleared and ADMIN role is added.
 */
@Column(name = "admin_request_pending", nullable = false)
@Builder.Default
private Boolean adminRequestPending = false;

/** Timestamp of admin role request — used to show how long request has been pending */
@Column(name = "admin_requested_at")
private LocalDateTime adminRequestedAt;

@PrePersist
protected void onCreate() {
	createdAt = LocalDateTime.now();
	lastLogin = LocalDateTime.now();
}

// ── Convenience helpers ───────────────────────────────────────────────────

public boolean hasRole(Role role) {
	return roles != null && roles.contains(role);
}

public boolean isAdmin() {
	return hasRole(Role.ADMIN);
}

public void addRole(Role role) {
	if (roles == null) roles = EnumSet.noneOf(Role.class);
	roles.add(role);
}

public void removeRole(Role role) {
	if (roles != null) roles.remove(role);
}

/** Primary role for display — highest privilege wins */
public Role getPrimaryRole() {
	if (hasRole(Role.ADMIN))   return Role.ADMIN;
	if (hasRole(Role.TEACHER)) return Role.TEACHER;
	if (hasRole(Role.STUDENT)) return Role.STUDENT;
	return Role.STUDENT;
}

// ── Enums ─────────────────────────────────────────────────────────────────

public enum Provider { LOCAL, GOOGLE }

public enum Role {
	STUDENT,   // default — browse, code, submit
	TEACHER,   // future — create topics, view student progress
	ADMIN      // full access — user mgmt, content mgmt, analytics
}
}