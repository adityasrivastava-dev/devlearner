package com.learnsystem.service;

import com.learnsystem.dto.AuthDtos.*;
import com.learnsystem.model.User;
import com.learnsystem.repository.UserRepository;
import com.learnsystem.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

private final UserRepository  userRepository;
private final PasswordEncoder passwordEncoder;
private final JwtService      jwtService;

@Transactional
public AuthResponse register(RegisterRequest req) {
	if (userRepository.existsByEmail(req.getEmail())) {
		throw new IllegalArgumentException("Email already registered: " + req.getEmail());
	}
	User user = User.builder()
			.name(req.getName())
			.email(req.getEmail().toLowerCase().trim())
			.passwordHash(passwordEncoder.encode(req.getPassword()))
			.provider(User.Provider.LOCAL)
			.roles(EnumSet.of(User.Role.STUDENT))
			.emailVerified(true)
			.build();
	userRepository.save(user);
	log.info("New user registered: {}", user.getEmail());
	return buildAuthResponse(user);
}

@Transactional
public AuthResponse login(LoginRequest req) {
	User user = userRepository.findByEmail(req.getEmail().toLowerCase().trim())
			.orElseThrow(() -> new UsernameNotFoundException("No account for: " + req.getEmail()));
	if (user.getProvider() != User.Provider.LOCAL || user.getPasswordHash() == null) {
		throw new BadCredentialsException("This account uses Google login. Please sign in with Google.");
	}
	if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
		throw new BadCredentialsException("Incorrect password");
	}
	user.setLastLogin(LocalDateTime.now());
	userRepository.save(user);
	return buildAuthResponse(user);
}

public UserProfileResponse getProfile(User user) {
	return UserProfileResponse.builder()
			.id(user.getId())
			.name(user.getName())
			.email(user.getEmail())
			.roles(toRoleList(user))
			.role(user.getPrimaryRole().name())
			.avatarUrl(user.getAvatarUrl())
			.provider(user.getProvider().name())
			.emailVerified(user.isEmailVerified())
			.streakDays(user.getStreakDays())
			.problemsSolved(user.getProblemsSolved())
			.createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null)
			.build();
}

private AuthResponse buildAuthResponse(User user) {
	return AuthResponse.builder()
			.token(jwtService.generateToken(user))
			.type("Bearer")
			.id(user.getId())
			.name(user.getName())
			.email(user.getEmail())
			.roles(toRoleList(user))
			.role(user.getPrimaryRole().name())
			.avatarUrl(user.getAvatarUrl())
			.emailVerified(user.isEmailVerified())
			.streakDays(user.getStreakDays())
			.problemsSolved(user.getProblemsSolved())
			.build();
}

/** Convert Set<Role> → sorted List<String> e.g. ["ADMIN","STUDENT"] */
private List<String> toRoleList(User user) {
	if (user.getRoles() == null || user.getRoles().isEmpty()) {
		return List.of("STUDENT");
	}
	return user.getRoles().stream()
			.map(User.Role::name)
			.sorted()
			.collect(Collectors.toList());
}
}