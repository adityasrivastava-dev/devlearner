package com.learnsystem.controller;

import com.learnsystem.model.AppScreenshot;
import com.learnsystem.repository.AppScreenshotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
public class AppScreenshotController {

    private final AppScreenshotRepository repo;

    /** PUBLIC — returns all screenshots as {slideKey, imageData, caption} */
    @GetMapping("/api/app-screenshots")
    public ResponseEntity<List<Map<String, String>>> getAll() {
        List<Map<String, String>> result = repo.findAll().stream()
                .map(s -> Map.of(
                        "slideKey",   s.getSlideKey(),
                        "imageData",  s.getImageData() != null ? s.getImageData() : "",
                        "caption",    s.getCaption()   != null ? s.getCaption()   : ""
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // Max 6 MB base64-encoded image (~4.5 MB raw)
    private static final int MAX_IMAGE_DATA_LEN = 6 * 1024 * 1024;
    private static final java.util.regex.Pattern ALLOWED_SLIDE_KEY =
            java.util.regex.Pattern.compile("^[a-zA-Z0-9_-]{1,64}$");
    private static final java.util.regex.Pattern DATA_URI_PREFIX =
            java.util.regex.Pattern.compile("^data:image/(png|jpeg|webp|gif);base64,");

    /** ADMIN — upsert (create or update) a screenshot by slideKey */
    @PostMapping("/api/admin/app-screenshots")
    public ResponseEntity<?> save(@RequestBody Map<String, String> body) {
        String slideKey  = body.get("slideKey");
        String imageData = body.get("imageData");
        String caption   = body.getOrDefault("caption", "");

        // Validate slideKey
        if (slideKey == null || !ALLOWED_SLIDE_KEY.matcher(slideKey).matches()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Invalid slideKey"));
        }
        // Validate imageData format and size
        if (imageData != null && !imageData.isEmpty()) {
            if (imageData.length() > MAX_IMAGE_DATA_LEN) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Image too large (max 6 MB)"));
            }
            if (!DATA_URI_PREFIX.matcher(imageData).find()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "imageData must be a valid data URI (png/jpeg/webp/gif)"));
            }
        }
        // Limit caption length
        if (caption.length() > 500) {
            caption = caption.substring(0, 500);
        }

        AppScreenshot screenshot = repo.findBySlideKey(slideKey)
                .orElse(new AppScreenshot());
        screenshot.setSlideKey(slideKey);
        screenshot.setImageData(imageData);
        screenshot.setCaption(caption);
        return ResponseEntity.ok(repo.save(screenshot));
    }

    /** ADMIN — delete by slideKey */
    @DeleteMapping("/api/admin/app-screenshots/{slideKey}")
    public ResponseEntity<Void> delete(@PathVariable String slideKey) {
        repo.deleteBySlideKey(slideKey);
        return ResponseEntity.noContent().build();
    }
}
