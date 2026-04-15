package com.learnsystem.security;

import com.learnsystem.model.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
public class JwtService {

@Value("${app.jwt.secret}")
private String jwtSecret;

@Value("${app.jwt.expiration-ms}")
private long jwtExpirationMs;

// ── Generate ──────────────────────────────────────────────────────────────

public String generateToken(User user) {
	// Embed all roles as comma-separated string: "STUDENT,ADMIN"
	String rolesStr = user.getRoles() == null ? "STUDENT"
			: user.getRoles().stream()
			.map(User.Role::name)
			.sorted()
			.collect(Collectors.joining(","));

	return Jwts.builder()
			.subject(user.getEmail())
			.claim("id",     user.getId())
			.claim("name",   user.getName())
			.claim("roles",  rolesStr)                     // ← plural, comma-separated
			.claim("role",   user.getPrimaryRole().name()) // ← singular, highest privilege (backward compat)
			.claim("avatar", user.getAvatarUrl())
			.issuedAt(new Date())
			.expiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
			.signWith(getSigningKey())
			.compact();
}

// ── Validate ──────────────────────────────────────────────────────────────

public boolean validateToken(String token) {
	try {
		Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token);
		return true;
	} catch (ExpiredJwtException e) {
		log.debug("JWT expired: {}", e.getMessage());
	} catch (JwtException e) {
		log.debug("JWT invalid: {}", e.getMessage());
	}
	return false;
}

// ── Extract ───────────────────────────────────────────────────────────────

public String getEmailFromToken(String token) {
	return getClaims(token).getSubject();
}

/** Returns all roles embedded in the token */
public Set<String> getRolesFromToken(String token) {
	Claims claims = getClaims(token);
	String rolesStr = claims.get("roles", String.class);
	if (rolesStr == null || rolesStr.isBlank()) {
		// Backward compat: read old "role" claim
		String single = claims.get("role", String.class);
		return single != null ? Set.of(single) : Set.of("STUDENT");
	}
	return Set.of(rolesStr.split(","));
}

public Claims getClaims(String token) {
	return Jwts.parser()
			.verifyWith(getSigningKey())
			.build()
			.parseSignedClaims(token)
			.getPayload();
}

// ── Key ───────────────────────────────────────────────────────────────────

private SecretKey getSigningKey() {
	// Attempt Base64 decode first (production secrets should be base64-encoded)
	byte[] keyBytes;
	try {
		keyBytes = Decoders.BASE64.decode(jwtSecret);
	} catch (IllegalArgumentException e) {
		// Not valid Base64 — treat as raw UTF-8 string (dev/test only)
		log.warn("JWT secret is not Base64-encoded — treating as raw string. " +
				"Generate a secure secret with: openssl rand -base64 64");
		keyBytes = jwtSecret.getBytes(java.nio.charset.StandardCharsets.UTF_8);
	}

	// Enforce minimum key length — HMAC-SHA512 requires 64 bytes (512 bits)
	// Zero-padding a short key does NOT add entropy and is cryptographically weak
	if (keyBytes.length < 32) {
		throw new IllegalStateException(
			"JWT secret is too short (" + keyBytes.length + " bytes). " +
			"Minimum 32 bytes required. Generate with: openssl rand -base64 64");
	}
	if (keyBytes.length < 64) {
		log.warn("JWT secret is {} bytes — recommend 64+ bytes for HMAC-SHA512. " +
				"Generate with: openssl rand -base64 64", keyBytes.length);
	}
	return Keys.hmacShaKeyFor(keyBytes);
}
}