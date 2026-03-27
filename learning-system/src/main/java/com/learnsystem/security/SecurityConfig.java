package com.learnsystem.security;

import com.learnsystem.repository.UserRepository;
import lombok.RequiredArgsConstructor;
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

// ── Build filter manually (not a @Component) so it's only registered once ──
private JwtAuthFilter jwtAuthFilter() {
	return new JwtAuthFilter(jwtService, userRepository);
}

// ══════════════════════════════════════════════════════════════════════════
// CHAIN 1 — /api/** (stateless JWT, no session, no OAuth2)
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
					// Auth — always public
					.requestMatchers("/api/auth/**").permitAll()

					// Public read
					.requestMatchers(HttpMethod.GET,
							"/api/topics", "/api/topics/**").permitAll()
					.requestMatchers(HttpMethod.GET,
							"/api/roadmaps", "/api/roadmaps/**").permitAll()

					// Admin
					.requestMatchers("/api/admin/**").hasRole("ADMIN")

					// All other API calls need auth
					.anyRequest().authenticated()
			)

			// Always JSON — never redirects
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
// CHAIN 2 — web pages + OAuth2 (session-based for Google redirect)
// ══════════════════════════════════════════════════════════════════════════
@Bean
@Order(2)
public SecurityFilterChain webFilterChain(HttpSecurity http) throws Exception {
	http
			.csrf(AbstractHttpConfigurer::disable)
			.cors(cors -> cors.configurationSource(corsConfigurationSource()))
			.sessionManagement(sm -> sm
					.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))

			.authorizeHttpRequests(auth -> auth
					.requestMatchers(
							"/", "/index.html", "/login.html",
							"/admin.html", "/roadmap.html", "/portal.html", "/error",
							"/css/**", "/js/**", "/favicon.ico"
					).permitAll()
					.anyRequest().authenticated()
			)

			.oauth2Login(oauth2 -> oauth2
					.loginPage("/login.html")
					.authorizationEndpoint(ae -> ae
							.baseUri("/oauth2/authorization"))
					.redirectionEndpoint(re -> re
							.baseUri("/login/oauth2/code/*"))
					.successHandler(oAuth2SuccessHandler)
					.failureUrl("/login.html?error=oauth")
			)

			.exceptionHandling(ex -> ex
					.authenticationEntryPoint((req, res, e) ->
							res.sendRedirect("/login.html"))
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

@Bean
public CorsConfigurationSource corsConfigurationSource() {
	CorsConfiguration config = new CorsConfiguration();
	config.setAllowedOriginPatterns(List.of("*"));
	config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
	config.setAllowedHeaders(List.of("*"));
	config.setAllowCredentials(true);
	UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
	source.registerCorsConfiguration("/**", config);
	return source;
}
}