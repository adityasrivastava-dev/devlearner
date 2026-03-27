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
	try {
		byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
		if (keyBytes.length >= 64) return Keys.hmacShaKeyFor(keyBytes);
	} catch (Exception ignored) {}

	byte[] raw    = jwtSecret.getBytes();
	byte[] padded = new byte[64];
	System.arraycopy(raw, 0, padded, 0, Math.min(raw.length, 64));
	if (raw.length < 64) {
		log.warn("JWT secret < 64 bytes — generate with: openssl rand -base64 64");
	}
	return Keys.hmacShaKeyFor(padded);
}
}