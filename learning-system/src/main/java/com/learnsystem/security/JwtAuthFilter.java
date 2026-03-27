package com.learnsystem.security;

import com.learnsystem.model.User;
import com.learnsystem.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

// NOT @Component — registered manually in SecurityConfig to avoid double registration
@RequiredArgsConstructor
@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {

private final JwtService     jwtService;
private final UserRepository userRepository;

@Override
protected void doFilterInternal(HttpServletRequest request,
                                HttpServletResponse response,
                                FilterChain chain) throws ServletException, IOException {

	String authHeader = request.getHeader("Authorization");
	if (authHeader == null || !authHeader.startsWith("Bearer ")) {
		chain.doFilter(request, response);
		return;
	}

	String token = authHeader.substring(7);
	if (!jwtService.validateToken(token)) {
		chain.doFilter(request, response);
		return;
	}

	try {
		String email = jwtService.getEmailFromToken(token);

		// Read ALL roles from the token (not from DB — supports role-switch testing)
		Set<String> roleNames = jwtService.getRolesFromToken(token);

		User user = userRepository.findByEmail(email).orElse(null);

		if (user != null && SecurityContextHolder.getContext().getAuthentication() == null) {
			// Build authorities from token roles (not DB roles)
			// This makes role-switch work without touching the DB
			List<SimpleGrantedAuthority> authorities = roleNames.stream()
					.map(r -> new SimpleGrantedAuthority("ROLE_" + r))
					.collect(Collectors.toList());

			var auth = new UsernamePasswordAuthenticationToken(
					user, null, authorities);
			auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
			SecurityContextHolder.getContext().setAuthentication(auth);
		}
	} catch (Exception e) {
		log.debug("JWT auth failed: {}", e.getMessage());
	}

	chain.doFilter(request, response);
}
}