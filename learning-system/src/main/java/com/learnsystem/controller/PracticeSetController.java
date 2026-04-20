package com.learnsystem.controller;

import com.learnsystem.service.PracticeSetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/practice-set")
@RequiredArgsConstructor
public class PracticeSetController {

    private final PracticeSetService practiceSetService;

    @PostMapping("/generate")
    public ResponseEntity<Map<String, Object>> generate(
            @RequestParam("resume") MultipartFile file,
            @AuthenticationPrincipal UserDetails user) throws Exception {

        if (file == null || file.isEmpty())
            return ResponseEntity.badRequest().body(Map.of("error", "Resume PDF is required."));

        String ct = file.getContentType();
        if (ct == null || !ct.equalsIgnoreCase("application/pdf"))
            return ResponseEntity.badRequest().body(Map.of("error", "Only PDF files are accepted."));

        Map<String, Object> result = practiceSetService.generate(file.getBytes());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/more")
    public ResponseEntity<List<Map<String, Object>>> more(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails user) {

        String sessionId = (String) body.get("sessionId");
        String topic = (String) body.get("topic");
        @SuppressWarnings("unchecked")
        List<String> existing = (List<String>) body.getOrDefault("existingQuestions", List.of());

        if (sessionId == null || topic == null)
            return ResponseEntity.badRequest().build();

        List<Map<String, Object>> questions = practiceSetService.more(sessionId, topic, existing);
        return ResponseEntity.ok(questions);
    }
}
