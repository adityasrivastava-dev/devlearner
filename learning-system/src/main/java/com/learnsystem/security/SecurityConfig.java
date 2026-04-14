package com.learnsystem.security;

import com.learnsystem.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

private final JwtService           jwtService;
private final UserRepository       userRepository;
private final OAuth2SuccessHandler oAuth2SuccessHandler;

@Value("${app.frontend-url}")
private String frontendUrl;

// Build filter manually — registered once only
private JwtAuthFilter jwtAuthFilter() {
	return new JwtAuthFilter(jwtService, userRepository);
}

// ══════════════════════════════════════════════════════════════════════════
// CHAIN 1 — /api/** (stateless JWT, no session)
// React frontend calls these endpoints directly with Bearer token.
// Always returns JSON — never redirects to a login page.
// ══════════════════════════════════════════════════════════════════════════
@Bean
@Order(1)
public SecurityFilterChain apiFilterChain(HttpSecurity http) throws Exception {
	http
			.securityMatcher("/api/**")
			.csrf(AbstractHttpConfigurer::disable)
			.cors(cors -> cors.configurationSource(corsConfigurationSource()))
			.sessionManagement(sm -> sm
					.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

			.authorizeHttpRequests(auth -> auth
					// Auth endpoints — always public
					.requestMatchers("/api/auth/**").permitAll()

					// Gate + user video endpoints require authentication (user-specific data)
					.requestMatchers("/api/topics/*/gate", "/api/topics/*/gate/**").authenticated()
					.requestMatchers("/api/topics/*/videos/user", "/api/topics/*/videos/user/**").authenticated()

					// Public read-only data
					.requestMatchers(HttpMethod.GET,
							"/api/topics", "/api/topics/**",
							"/api/problems", "/api/problems/filters",
							"/api/submissions/percentile",
							"/api/interview-questions", "/api/interview-questions/**").permitAll()

					// Java completions — public, used by the code editor before login
					// FIX: was incorrectly placed in Chain 2 (/java-completions/**) which
					// never matched because Chain 1 intercepts all /api/** first.
					.requestMatchers(HttpMethod.GET,
							"/api/java/completions",
							"/api/java/completions/**").permitAll()

					// Quiz — list and play are public; submit and history require auth
					.requestMatchers(HttpMethod.GET,
							"/api/quiz/sets",
							"/api/quiz/sets/**").permitAll()

					// Admin endpoints
					.requestMatchers("/api/admin/**").hasRole("ADMIN")

					// Everything else requires authentication
					.anyRequest().authenticated()
			)

			// Return JSON errors — React handles display, not the server
			.exceptionHandling(ex -> ex
					.authenticationEntryPoint((req, res, e) -> {
						res.setStatus(401);
						res.setContentType("application/json");
						res.getWriter().write(
								"{\"error\":\"Unauthorized\",\"message\":\"Please log in\"}");
					})
					.accessDeniedHandler((req, res, e) -> {
						res.setStatus(403);
						res.setContentType("application/json");
						res.getWriter().write(
								"{\"error\":\"Forbidden\",\"message\":\"Insufficient permissions\"}");
					})
			)
			.addFilterBefore(jwtAuthFilter(), UsernamePasswordAuthenticationFilter.class);

	return http.build();
}

// ══════════════════════════════════════════════════════════════════════════
// CHAIN 2 — OAuth2 only
// React no longer lives in Spring Boot — there are no .html pages to serve.
// This chain exists ONLY to handle the Google OAuth2 redirect flow:
//   1. User clicks "Continue with Google" on React frontend
//   2. React navigates to GET /oauth2/authorization/google
//   3. Spring handles Google redirect, issues JWT
//   4. OAuthSuccessHandler redirects back to React frontend with ?token=JWT
//
// All HTML pages are removed from resources/static — React serves them.
// The only permitted paths here are the OAuth2 handshake endpoints.
// ══════════════════════════════════════════════════════════════════════════
@Bean
@Order(2)
public SecurityFilterChain oauth2FilterChain(HttpSecurity http) throws Exception {
	http
			.csrf(AbstractHttpConfigurer::disable)
			.cors(cors -> cors.configurationSource(corsConfigurationSource()))
			.sessionManagement(sm -> sm
					.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))

			.authorizeHttpRequests(auth -> auth
					// Only the OAuth2 handshake endpoints need to be accessible
					.requestMatchers(
							"/oauth2/**",
							"/login/oauth2/**",
							"/error",
							"/favicon.ico"
					).permitAll()
					// Everything else: let the React app handle it (404 from Spring = React route)
					.anyRequest().permitAll()
			)

			.oauth2Login(oauth2 -> oauth2
					// loginPage points to React's /login route, not a .html file
					.loginPage(frontendUrl + "/login")
					.authorizationEndpoint(ae -> ae
							.baseUri("/oauth2/authorization"))
					.redirectionEndpoint(re -> re
							.baseUri("/login/oauth2/code/*"))
					.successHandler(oAuth2SuccessHandler)
					// On failure redirect to React's login with error param
					.failureUrl(frontendUrl + "/login?error=oauth")
			)

			.exceptionHandling(ex -> ex
					// On auth failure: redirect to React login, not a .html page
					.authenticationEntryPoint((req, res, e) ->
							res.sendRedirect(frontendUrl + "/login"))
			);

	return http.build();
}

@Bean
public PasswordEncoder passwordEncoder() {
	return new BCryptPasswordEncoder();
}

@Bean
public AuthenticationManager authenticationManager(
		AuthenticationConfiguration cfg) throws Exception {
	return cfg.getAuthenticationManager();
}

// ── CORS ──────────────────────────────────────────────────────────────────
// Allows requests from:
//   DEV:  http://localhost:3000  (Vite dev server)
//   PROD: your actual domain     (Nginx serving React build)
// Both are set via app.frontend-url in application.properties
@Bean
public CorsConfigurationSource corsConfigurationSource() {
	CorsConfiguration config = new CorsConfiguration();

	// Allow the React frontend origin explicitly
	// Plus localhost:3000 for local dev even if frontend-url is production
	config.setAllowedOrigins(List.of(
			frontendUrl,            // e.g. https://devlearner.onrender.com
			"http://localhost:3000" // Vite dev server
	));

	config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
	config.setAllowedHeaders(List.of("*"));
	config.setExposedHeaders(List.of("Authorization"));
	config.setAllowCredentials(true);
	config.setMaxAge(3600L); // Cache preflight for 1 hour

	UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
	source.registerCorsConfiguration("/**", config);
	return source;
}
}