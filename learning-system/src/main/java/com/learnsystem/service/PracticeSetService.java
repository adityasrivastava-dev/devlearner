package com.learnsystem.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PracticeSetService {

    private final GeminiService geminiService;
    private final ObjectMapper  mapper = new ObjectMapper();

    // Session store — maps sessionId → {profile, resumeText, createdAt}
    private final Map<String, PracticeSession> sessions = new ConcurrentHashMap<>();
    private static final int TTL_HOURS = 4;

    // ── Public API ─────────────────────────────────────────────────────────────

    // 5 micro-batches — each prompt stays well under free-tier token limits
    private static final String[][] MICRO_BATCHES = {
        { "THEORY",       "4" },
        { "CODING",       "3" },
        { "PROJECT",      "3" },
        { "BEHAVIORAL",   "2" },
        { "SYSTEM_DESIGN","2" },
    };

    public Map<String, Object> generate(byte[] pdfBytes) throws Exception {
        String resumeText = extractText(pdfBytes);
        if (resumeText.isBlank())
            throw new IllegalArgumentException("Could not extract text from PDF. Make sure it contains selectable text.");

        // Small resume snippet keeps each prompt under ~2500 tokens
        String truncated = resumeText.length() > 2000 ? resumeText.substring(0, 2000) : resumeText;

        // Call 1: profile parse (small structured call)
        Map<String, Object> profile = parseProfile(truncated);

        // Calls 2-6: one category per micro-batch, sequential, small prompts
        List<Map<String, Object>> questions = new ArrayList<>();
        for (String[] batch : MICRO_BATCHES) {
            String category = batch[0];
            int    count    = Integer.parseInt(batch[1]);
            List<Map<String, Object>> batchQs = generateQuestions(truncated, profile, category, count);
            // Assign sequential ids across all batches
            int base = questions.size();
            for (int i = 0; i < batchQs.size(); i++) {
                Map<String, Object> q = new java.util.LinkedHashMap<>(batchQs.get(i));
                q.put("id", base + i + 1);
                questions.add(q);
            }
            sleepQuietly(400); // small pause to avoid per-minute quota bursts
        }

        String sessionId = UUID.randomUUID().toString();
        sessions.put(sessionId, new PracticeSession(sessionId, truncated, profile));

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("sessionId", sessionId);
        resp.put("profile",   profile);
        resp.put("questions", questions);
        resp.put("total",     questions.size());
        return resp;
    }

    private static void sleepQuietly(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }

    public List<Map<String, Object>> more(String sessionId, String topic, List<String> existingQuestions) {
        PracticeSession session = requireSession(sessionId);
        List<Map<String, Object>> newQs = generateMoreOnTopic(session, topic, existingQuestions);
        log.info("Practice set expanded: sessionId={} topic={} added={}", sessionId, topic, newQs.size());
        return newQs;
    }

    // ── Question generation ────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> generateQuestions(
            String resumeText,
            Map<String, Object> profile,
            String focusTopic,
            int count) {

        String techList  = formatList(profile.get("techStack"), "tech");
        String projList  = formatList(profile.get("projects"),  "name");
        String topicList = formatList(profile.get("topicsToTest"), null);

        String focusClause = "category must be exactly: " + (focusTopic != null ? focusTopic : "THEORY") + ". "
            + (("PROJECT".equals(focusTopic)) ? "Reference the candidate's actual project names directly." : "");

        String system = """
            You are an expert interview coach. Return ONLY a valid JSON array — no markdown, no fences.
            Each element: {"id":1,"category":"THEORY","topic":"...","difficulty":"Medium","question":"...","answer":"...","keyPoints":["..."],"followUp":"..."}
            difficulty: Easy, Medium, or Hard. Answers under 60 words.
            JSON rules: never use double-quotes inside string values (use single quotes); keyPoints is always an array.
            """;

        String prompt = String.format("""
            Candidate: %s, %s yrs | Tech: %s | Projects: %s
            %s
            Generate exactly %d questions. Mix Easy/Medium/Hard.
            """,
            profile.getOrDefault("currentRole", "Engineer"),
            profile.getOrDefault("yearsOfExperience", "?"),
            techList, projList,
            focusClause, count);

        // Prefer Gemini for thorough answers; Groq as fast fallback
        String aiResponse = geminiService.chatLargePrompt(system, prompt);

        try {
            String cleaned = stripFences(aiResponse);
            List<Map<String, Object>> questions;
            try {
                questions = mapper.readValue(cleaned, new TypeReference<>() {});
            } catch (Exception firstEx) {
                log.warn("Practice questions parse failed, retrying with quote sanitizer: {}", firstEx.getMessage());
                questions = mapper.readValue(sanitizeJsonQuotes(cleaned), new TypeReference<>() {});
            }
            for (int i = 0; i < questions.size(); i++) {
                questions.get(i).putIfAbsent("id", i + 1);
            }
            return questions;
        } catch (Exception e) {
            log.error("Failed to parse practice questions: {}", e.getMessage());
            return List.of(Map.of(
                "id", 1, "category", "THEORY", "topic", "General",
                "difficulty", "Medium",
                "question", "Could not generate questions. Please try uploading your resume again.",
                "answer", "Please retry.",
                "keyPoints", List.of(),
                "followUp", ""
            ));
        }
    }

    private List<Map<String, Object>> generateMoreOnTopic(
            PracticeSession session,
            String topic,
            List<String> existingQuestions) {

        String avoid = existingQuestions == null || existingQuestions.isEmpty()
            ? "none"
            : String.join(" | ", existingQuestions.stream().limit(8).collect(Collectors.toList()));

        String system = """
            You are an expert interview coach. Generate MORE interview Q&A pairs on a specific topic.
            Return ONLY valid JSON array — no markdown, no fences.
            Same structure as before:
            {
              "id": 1,
              "category": "THEORY",
              "topic": "exact topic name",
              "difficulty": "Medium",
              "question": "...",
              "answer": "Detailed 3-5 sentence answer.",
              "keyPoints": ["...", "..."],
              "followUp": "..."
            }
            Do NOT repeat any questions from the existing list. Go deeper on sub-topics.
            CRITICAL: Never use double-quote characters inside string values — use single quotes instead. Every JSON object must be complete and properly closed.
            """;

        String prompt = String.format("""
            Candidate profile:
            Role: %s | Tech: %s

            Topic to expand: %s

            Existing questions to AVOID repeating:
            %s

            Generate 10 NEW questions on this topic going deeper into sub-topics, edge cases, and practical applications.
            Include a mix of Easy/Medium/Hard difficulties.
            """,
            session.profile.getOrDefault("currentRole", "Engineer"),
            formatList(session.profile.get("techStack"), "tech"),
            topic, avoid);

        String aiResponse = geminiService.chatLargePrompt(system, prompt);

        try {
            String cleaned = stripFences(aiResponse);
            List<Map<String, Object>> questions;
            try {
                questions = mapper.readValue(cleaned, new TypeReference<>() {});
            } catch (Exception firstEx) {
                log.warn("More questions parse failed, retrying with quote sanitizer: {}", firstEx.getMessage());
                questions = mapper.readValue(sanitizeJsonQuotes(cleaned), new TypeReference<>() {});
            }
            questions.forEach(q -> q.putIfAbsent("topic", topic));
            return questions;
        } catch (Exception e) {
            log.error("Failed to parse more questions: {}", e.getMessage());
            return List.of();
        }
    }

    // ── Resume parsing ────────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseProfile(String resumeText) {
        String system = """
            Parse this resume and return ONLY valid JSON — no fences.
            {
              "name": "First Last",
              "currentRole": "Senior Backend Engineer",
              "yearsOfExperience": 4,
              "techStack": [{"tech": "Java", "level": "Advanced", "years": 4}],
              "projects": [{"name": "Payment Gateway", "desc": "brief description", "tech": ["Java", "Redis"]}],
              "companies": ["Company A"],
              "topicsToTest": ["HashMap internals", "Spring Boot lifecycle", "Concurrency", "System design", "SQL indexing"]
            }
            topicsToTest: list 8-10 very specific technical areas based on their resume.
            """;

        String aiResponse = geminiService.chatLargePrompt(system, "Resume:\n" + resumeText);

        try {
            return mapper.readValue(stripFences(aiResponse), new TypeReference<>() {});
        } catch (Exception e) {
            log.warn("Profile parse failed: {}", e.getMessage());
            Map<String, Object> fallback = new LinkedHashMap<>();
            fallback.put("name", "Candidate");
            fallback.put("currentRole", "Software Engineer");
            fallback.put("yearsOfExperience", 3);
            fallback.put("techStack", List.of(Map.of("tech", "Java", "level", "Intermediate")));
            fallback.put("projects", List.of());
            fallback.put("companies", List.of());
            fallback.put("topicsToTest", List.of("Java Core", "Data Structures", "System Design"));
            return fallback;
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String extractText(byte[] bytes) throws Exception {
        try (PDDocument doc = Loader.loadPDF(bytes)) {
            return new PDFTextStripper().getText(doc);
        }
    }

    private PracticeSession requireSession(String sessionId) {
        PracticeSession s = sessions.get(sessionId);
        if (s == null) throw new IllegalStateException("Session not found. Please upload your resume again.");
        if (s.createdAt.isBefore(LocalDateTime.now().minusHours(TTL_HOURS))) {
            sessions.remove(sessionId);
            throw new IllegalStateException("Session expired. Please upload your resume again.");
        }
        return s;
    }

    private String stripFences(String text) {
        if (text == null) return "[]";
        String s = text.trim();
        if (s.startsWith("```")) s = s.replaceAll("^```[a-z]*\\n?", "").replaceAll("```\\s*$", "").trim();
        int arr = s.indexOf('['), obj = s.indexOf('{');
        if (arr >= 0 && (obj < 0 || arr < obj)) {
            int end = s.lastIndexOf(']');
            if (end > arr) return s.substring(arr, end + 1);
        }
        if (obj >= 0) {
            int end = s.lastIndexOf('}');
            if (end > obj) return s.substring(obj, end + 1);
        }
        return s;
    }

    /**
     * Replaces unescaped double quotes inside JSON string values with single quotes.
     * Uses a state machine to distinguish string delimiters from content quotes.
     */
    private String sanitizeJsonQuotes(String json) {
        StringBuilder sb = new StringBuilder(json.length());
        boolean inString = false;
        boolean escaped  = false;

        for (int i = 0; i < json.length(); i++) {
            char c = json.charAt(i);
            if (escaped) {
                sb.append(c);
                escaped = false;
                continue;
            }
            if (c == '\\') {
                sb.append(c);
                escaped = true;
                continue;
            }
            if (c == '"') {
                if (!inString) {
                    inString = true;
                    sb.append(c);
                } else {
                    // Peek ahead (skip whitespace) to see if this looks like a closing delimiter
                    int j = i + 1;
                    while (j < json.length() && json.charAt(j) == ' ') j++;
                    char next = j < json.length() ? json.charAt(j) : 0;
                    if (next == ':' || next == ',' || next == '}' || next == ']' || next == '\n' || next == '\r' || next == 0) {
                        inString = false;
                        sb.append(c);
                    } else {
                        // Unescaped quote inside a string value — replace with single quote
                        sb.append('\'');
                    }
                }
            } else {
                sb.append(c);
            }
        }
        return sb.toString();
    }

    @SuppressWarnings("unchecked")
    private String formatList(Object obj, String field) {
        if (obj instanceof List<?> list) {
            return list.stream()
                .map(item -> {
                    if (field != null && item instanceof Map<?,?> m) { Object v = m.get(field); return v != null ? v.toString() : ""; }
                    return String.valueOf(item);
                })
                .filter(s -> !s.isBlank() && !s.equals("null"))
                .limit(8)
                .collect(Collectors.joining(", "));
        }
        return "";
    }

    // ── Session record ────────────────────────────────────────────────────────

    static class PracticeSession {
        final String sessionId;
        final String resumeText;
        final Map<String, Object> profile;
        final LocalDateTime createdAt = LocalDateTime.now();

        PracticeSession(String sessionId, String resumeText, Map<String, Object> profile) {
            this.sessionId  = sessionId;
            this.resumeText = resumeText;
            this.profile    = profile;
        }
    }
}
