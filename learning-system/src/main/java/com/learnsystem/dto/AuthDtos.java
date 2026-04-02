package com.learnsystem.dto;

import lombok.Builder;
import lombok.Data;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public class AuthDtos {

// ── Requests ──────────────────────────────────────────────────────────────

@Data
public static class RegisterRequest {
	@NotBlank(message = "Name is required")
	private String name;

	@Email(message = "Valid email is required")
	@NotBlank
	private String email;

	@NotBlank
	@Size(min = 6, message = "Password must be at least 6 characters")
	private String password;

	/**
	 * If true: user is requesting ADMIN role.
	 * Account is created as STUDENT but adminRequestPending=true is set.
	 * asaditya1826@gmail.com must approve via /api/admin/users/{id}/approve-admin.
	 */
	private boolean requestAdminRole = false;
}

@Data
public static class LoginRequest {
	@Email @NotBlank
	private String email;

	@NotBlank
	private String password;
}

// ── Responses ─────────────────────────────────────────────────────────────

@Data
@Builder
public static class AuthResponse {
	private String       token;
	private String       type;
	private Long         id;
	private String       name;
	private String       email;
	private String       role;        // primary role e.g. "ADMIN"
	private List<String> roles;       // all roles e.g. ["STUDENT","ADMIN"]
	private String       avatarUrl;
	private boolean      emailVerified;
	private int          streakDays;
	private int          problemsSolved;
}

@Data
@Builder
public static class UserProfileResponse {
	private Long         id;
	private String       name;
	private String       email;
	private String       role;        // primary role
	private List<String> roles;       // all roles
	private String       avatarUrl;
	private String       provider;
	private boolean      emailVerified;
	private int          streakDays;
	private int          problemsSolved;
	private String       createdAt;
}
}