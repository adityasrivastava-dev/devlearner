package com.learnsystem.dto;

import lombok.Builder;
import lombok.Data;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

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
	private String  token;
	private String  type;
	private Long    id;
	private String  name;
	private String  email;
	private String  role;
	private String  avatarUrl;
	private boolean emailVerified;
	private int     streakDays;
	private int     problemsSolved;
}

@Data
@Builder
public static class UserProfileResponse {
	private Long    id;
	private String  name;
	private String  email;
	private String  role;
	private String  avatarUrl;
	private String  provider;
	private boolean emailVerified;
	private int     streakDays;
	private int     problemsSolved;
	private String  createdAt;
}
}