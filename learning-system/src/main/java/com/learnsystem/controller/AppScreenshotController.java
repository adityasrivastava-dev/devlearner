package com.learnsystem.controller;

import com.learnsystem.model.AppScreenshot;
import com.learnsystem.repository.AppScreenshotRepository;
import lombok.RequiredArgsConstructor;
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

    /** ADMIN — upsert (create or update) a screenshot by slideKey */
    @PostMapping("/api/admin/app-screenshots")
    public ResponseEntity<AppScreenshot> save(@RequestBody Map<String, String> body) {
        String slideKey   = body.get("slideKey");
        String imageData  = body.get("imageData");
        String caption    = body.getOrDefault("caption", "");

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
