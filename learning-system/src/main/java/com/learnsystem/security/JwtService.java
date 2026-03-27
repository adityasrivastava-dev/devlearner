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

@Slf4j
@Service
public class JwtService {

@Value("${app.jwt.secret}")
private String jwtSecret;

@Value("${app.jwt.expiration-ms}")
private long jwtExpirationMs;

// ── Generate token ────────────────────────────────────────────────────────

public String generateToken(User user) {
	return Jwts.builder()
			.subject(user.getEmail())
			.claim("id",     user.getId())
			.claim("name",   user.getName())
			.claim("role",   user.getRole().name())
			.claim("avatar", user.getAvatarUrl())
			.issuedAt(new Date())
			.expiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
			.signWith(getSigningKey())
			.compact();
}

// ── Validate token ────────────────────────────────────────────────────────

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

// ── Extract claims ────────────────────────────────────────────────────────

public String getEmailFromToken(String token) {
	return getClaims(token).getSubject();
}

public Claims getClaims(String token) {
	return Jwts.parser()
			.verifyWith(getSigningKey())
			.build()
			.parseSignedClaims(token)
			.getPayload();
}

// ── Key ───────────────────────────────────────────────────────────────────
// HS512 needs minimum 64 bytes (512 bits).
// Supports two formats in application.properties:
//   Recommended : Base64 string  (openssl rand -base64 64)
//   Fallback    : Plain text     (padded to 64 bytes automatically)

private SecretKey getSigningKey() {
	// 1. Try Base64 decode first
	try {
		byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
		if (keyBytes.length >= 64) {
			return Keys.hmacShaKeyFor(keyBytes);
		}
	} catch (Exception ignored) {
		// Not valid Base64 — treat as plain text
	}

	// 2. Plain text fallback — pad to 64 bytes for HS512
	byte[] raw    = jwtSecret.getBytes();
	byte[] padded = new byte[64];
	System.arraycopy(raw, 0, padded, 0, Math.min(raw.length, 64));

	if (raw.length < 64) {
		log.warn("JWT secret is only {} bytes. Generate a proper key: openssl rand -base64 64", raw.length);
	}

	return Keys.hmacShaKeyFor(padded);
}
}