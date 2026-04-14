package com.learnsystem.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.InputStream;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * GET /api/java/completions?version=17
 *
 * Serves Java IDE completion data from classpath JSON files.
 * Files live at: src/main/resources/java-completions/java{version}.json
 *
 * Supports: Java 8, 11, 17, 21
 * Falls back to Java 17 for unknown versions.
 *
 * Response is cached for 24 hours — completions don't change at runtime.
 * To update completions: edit the JSON files and redeploy (or restart).
 *
 * Frontend fetches this once on editor mount and on Java version change.
 * No static arrays in frontend code — all completions live here.
 */
@Slf4j
@RestController
@RequestMapping("/api/java")
@RequiredArgsConstructor
public class JavaCompletionController {

private static final Set<String> SUPPORTED = Set.of("8", "11", "17", "21");
private static final String      DEFAULT    = "17";

// In-memory cache so we don't re-read classpath resources on every request
private final Map<String, Object> cache = new ConcurrentHashMap<>();
private final ObjectMapper        objectMapper;

@GetMapping("/completions")
public ResponseEntity<?> getCompletions(
		@RequestParam(defaultValue = "17") String version) {

	// Normalize version string: "Java 17" → "17", "17.0.2" → "17"
	String v = version.replaceAll("[^0-9]", "").replaceAll("^0+", "");
	// Map unsupported versions to nearest supported
	if      (!SUPPORTED.contains(v) && !v.isEmpty()) {
		int num = Integer.parseInt(v.length() > 4 ? v.substring(0, 2) : v);
		if      (num <= 8)  v = "8";
		else if (num <= 11) v = "11";
		else if (num <= 17) v = "17";
		else                v = "21";
	}
	if (!SUPPORTED.contains(v)) v = DEFAULT;

	final String key = v;

	log.debug("Java completions requested: version={} (resolved={})", version, key);
	try {
		// Serve from in-memory cache after first load
		boolean cacheMiss = !cache.containsKey(key);
		Object data = cache.computeIfAbsent(key, vk -> {
			try {
				ClassPathResource res = new ClassPathResource(
						"java-completions/java" + vk + ".json");
				try (InputStream is = res.getInputStream()) {
					return objectMapper.readValue(is, Object.class);
				}
			} catch (Exception e) {
				throw new RuntimeException("Could not load completions for Java " + vk, e);
			}
		});
		if (cacheMiss) log.info("Java completions loaded from disk: version={}", key);

		return ResponseEntity.ok()
				// Cache 24 hours in browser — completions rarely change
				.cacheControl(CacheControl.maxAge(24, TimeUnit.HOURS).cachePublic())
				.body(data);

	} catch (Exception e) {
		log.error("Failed to load Java completions: version={} error={}", key, e.getMessage());
		return ResponseEntity.internalServerError()
				.body(Map.of("error", "Failed to load completions: " + e.getMessage()));
	}
}

/**
 * GET /api/java/completions/versions
 * Returns available Java versions so frontend can build the version dropdown.
 */
@GetMapping("/completions/versions")
public ResponseEntity<?> getVersions() {
	return ResponseEntity.ok(Map.of(
			"versions", SUPPORTED.stream().sorted().toList(),
			"default",  DEFAULT
	));
}
}