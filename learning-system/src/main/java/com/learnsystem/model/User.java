package com.learnsystem.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

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

/** BCrypt-hashed password. Null for OAuth users. */
@Column(name = "password_hash")
private String passwordHash;

/** Profile picture URL (from Google or gravatar) */
@Column(name = "avatar_url")
private String avatarUrl;

@Enumerated(EnumType.STRING)
@Column(nullable = false)
@Builder.Default
private Provider provider = Provider.LOCAL;

/** Google subject ID — used to match returning OAuth users */
@Column(name = "provider_id")
private String providerId;

@Enumerated(EnumType.STRING)
@Column(nullable = false)
@Builder.Default
private Role role = Role.STUDENT;

@Column(name = "email_verified", nullable = false)
@Builder.Default
private boolean emailVerified = false;

/** Email verification / password-reset token */
@Column(name = "verification_token")
private String verificationToken;

@Column(name = "token_expiry")
private LocalDateTime tokenExpiry;

@Column(name = "created_at")
private LocalDateTime createdAt;

@Column(name = "last_login")
private LocalDateTime lastLogin;

/** Consecutive days studied — incremented by progress service */
@Column(name = "streak_days")
@Builder.Default
private int streakDays = 0;

/** Total problems solved */
@Column(name = "problems_solved")
@Builder.Default
private int problemsSolved = 0;

@PrePersist
protected void onCreate() {
	createdAt = LocalDateTime.now();
	lastLogin = LocalDateTime.now();
}

public enum Provider { LOCAL, GOOGLE }
public enum Role     { STUDENT, ADMIN }
}