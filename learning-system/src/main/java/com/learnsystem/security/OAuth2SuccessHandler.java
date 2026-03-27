package com.learnsystem.security;

import com.learnsystem.model.User;
import com.learnsystem.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.EnumSet;

@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

private final JwtService     jwtService;
private final UserRepository userRepository;

@Value("${app.frontend-url}")
private String frontendUrl;

@Override
public void onAuthenticationSuccess(HttpServletRequest request,
                                    HttpServletResponse response,
                                    Authentication authentication) throws IOException {

	OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

	String email      = oAuth2User.getAttribute("email");
	String name       = oAuth2User.getAttribute("name");
	String picture    = oAuth2User.getAttribute("picture");
	String providerId = oAuth2User.getAttribute("sub"); // Google subject ID

	// Find or create user
	User user = userRepository.findByEmail(email)
			.orElseGet(() -> userRepository.findByProviderAndProviderId(User.Provider.GOOGLE, providerId)
					.orElse(null));

	if (user == null) {
		// First time Google login — create account
		user = User.builder()
				.email(email)
				.name(name != null ? name : email.split("@")[0])
				.avatarUrl(picture)
				.provider(User.Provider.GOOGLE)
				.providerId(providerId)
				.roles(EnumSet.of(User.Role.STUDENT))
				.emailVerified(true) // Google verifies email
				.build();
		log.info("New Google user registered: {}", email);
	} else {
		// Returning user — update profile
		user.setName(name != null ? name : user.getName());
		user.setAvatarUrl(picture);
		user.setProvider(User.Provider.GOOGLE);
		user.setProviderId(providerId);
		user.setEmailVerified(true);
	}

	user.setLastLogin(LocalDateTime.now());
	userRepository.save(user);

	// Issue JWT
	String token = jwtService.generateToken(user);

	// Check if there was a ?from= parameter stored before the OAuth redirect
	// Spring saves it in the session under SPRING_SECURITY_SAVED_REQUEST
	// We use a simpler approach: check the referer or default to "/"
	// Always redirect to app root — index.html handles ?token= and cleans the URL
	String redirectUrl = frontendUrl + "/?token=" + token;
	getRedirectStrategy().sendRedirect(request, response, redirectUrl);
}
}