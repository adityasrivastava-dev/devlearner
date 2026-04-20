package com.learnsystem.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnsystem.model.InterviewQuestion;
import com.learnsystem.model.Problem;
import com.learnsystem.repository.InterviewQuestionRepository;
import com.learnsystem.repository.ProblemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.data.domain.PageRequest;
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
    private final InterviewQuestionRepository iqRepo;
    private final ProblemRepository problemRepo;
    private final ObjectMapper mapper = new ObjectMapper();

    // Session store — maps sessionId → {profile, resumeText, createdAt}
    private final Map<String, PracticeSession> sessions = new ConcurrentHashMap<>();
    private static final int TTL_HOURS = 4;

    // Minimum DB questions needed to use DB path (avoids empty practice sets)
    private static final int MIN_IQ_COUNT   = 10;
    private static final int MIN_PROB_COUNT = 3;

    // Tech skill keyword → DB InterviewQuestion categories
    private static final Map<String, List<String>> SKILL_TO_IQ_CATS = new LinkedHashMap<>();
    // Tech skill keyword → Topic.Category enum string (for problems)
    private static final Map<String, List<String>> SKILL_TO_TOPIC_CATS = new LinkedHashMap<>();

    static {
        SKILL_TO_IQ_CATS.put("java",         List.of("JAVA", "ADVANCED_JAVA"));
        SKILL_TO_IQ_CATS.put("spring",        List.of("SPRING_BOOT"));
        SKILL_TO_IQ_CATS.put("hibernate",     List.of("SPRING_BOOT"));
        SKILL_TO_IQ_CATS.put("jpa",           List.of("SPRING_BOOT"));
        SKILL_TO_IQ_CATS.put("mysql",         List.of("SQL"));
        SKILL_TO_IQ_CATS.put("sql",           List.of("SQL"));
        SKILL_TO_IQ_CATS.put("postgresql",    List.of("SQL"));
        SKILL_TO_IQ_CATS.put("aws",           List.of("AWS"));
        SKILL_TO_IQ_CATS.put("ec2",           List.of("AWS"));
        SKILL_TO_IQ_CATS.put("s3",            List.of("AWS"));
        SKILL_TO_IQ_CATS.put("lambda",        List.of("AWS"));
        SKILL_TO_IQ_CATS.put("dsa",           List.of("DSA"));
        SKILL_TO_IQ_CATS.put("algorithm",     List.of("DSA"));
        SKILL_TO_IQ_CATS.put("data structure",List.of("DSA"));
        SKILL_TO_IQ_CATS.put("python",        List.of("DSA"));
        SKILL_TO_IQ_CATS.put("javascript",    List.of("DSA"));
        SKILL_TO_IQ_CATS.put("go",            List.of("DSA"));
        SKILL_TO_IQ_CATS.put("kotlin",        List.of("JAVA", "ADVANCED_JAVA"));

        SKILL_TO_TOPIC_CATS.put("java",       List.of("JAVA", "ADVANCED_JAVA"));
        SKILL_TO_TOPIC_CATS.put("spring",     List.of("SPRING_BOOT"));
        SKILL_TO_TOPIC_CATS.put("hibernate",  List.of("SPRING_BOOT"));
        SKILL_TO_TOPIC_CATS.put("jpa",        List.of("SPRING_BOOT"));
        SKILL_TO_TOPIC_CATS.put("mysql",      List.of("MYSQL"));
        SKILL_TO_TOPIC_CATS.put("sql",        List.of("MYSQL"));
        SKILL_TO_TOPIC_CATS.put("aws",        List.of("AWS"));
        SKILL_TO_TOPIC_CATS.put("dsa",        List.of("DSA"));
        SKILL_TO_TOPIC_CATS.put("algorithm",  List.of("DSA"));
        SKILL_TO_TOPIC_CATS.put("kotlin",     List.of("JAVA", "ADVANCED_JAVA"));
    }

    // ── Public API ─────────────────────────────────────────────────────────────

    public Map<String, Object> generate(byte[] pdfBytes) throws Exception {
        String resumeText = extractText(pdfBytes);
        if (resumeText.isBlank())
            throw new IllegalArgumentException("Could not extract text from PDF. Make sure it contains selectable text.");

        String truncated = resumeText.length() > 2000 ? resumeText.substring(0, 2000) : resumeText;

        // Call 1: profile parse (one small AI call — always needed)
        Map<String, Object> profile = parseProfile(truncated);

        // Determine which DB categories to query
        List<String> iqCats    = resolveIqCategories(profile);
        List<String> topicCats = resolveTopicCategories(profile);

        // Check if DB has enough data to use the DB path
        long iqCount   = iqRepo.countByCategories(iqCats);
        long probCount = problemRepo.countUsableByCategories(topicCats);

        log.info("Practice set DB check: iqCats={} iqCount={} topicCats={} probCount={}",
                 iqCats, iqCount, topicCats, probCount);

        List<Map<String, Object>> questions;
        if (iqCount >= MIN_IQ_COUNT) {
            // DB path — fast, no additional AI calls except PROJECT
            questions = buildFromDb(truncated, profile, iqCats, topicCats, probCount);
        } else {
            // AI fallback — used when DB is empty or too thin
            log.warn("DB too thin (iq={}) — falling back to AI generation", iqCount);
            questions = buildFromAi(truncated, profile);
        }

        String sessionId = UUID.randomUUID().toString();
        sessions.put(sessionId, new PracticeSession(sessionId, truncated, profile));

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("sessionId", sessionId);
        resp.put("profile",   profile);
        resp.put("questions", questions);
        resp.put("total",     questions.size());
        resp.put("source",    iqCount >= MIN_IQ_COUNT ? "db" : "ai");
        return resp;
    }

    public List<Map<String, Object>> more(String sessionId, String topic, List<String> existingQuestions) {
        PracticeSession session = requireSession(sessionId);
        List<Map<String, Object>> newQs = generateMoreOnTopic(session, topic, existingQuestions);
        log.info("Practice set expanded: sessionId={} topic={} added={}", sessionId, topic, newQs.size());
        return newQs;
    }

    // ── DB-backed generation ───────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> buildFromDb(
            String resumeText,
            Map<String, Object> profile,
            List<String> iqCats,
            List<String> topicCats,
            long probCount) {

        List<Map<String, Object>> questions = new ArrayList<>();

        // ── THEORY (8 questions from interview_questions) ────────────────────
        List<InterviewQuestion> theoryIqs = iqRepo.findByCategoriesRandom(iqCats, PageRequest.of(0, 8));
        for (InterviewQuestion iq : theoryIqs) {
            questions.add(iqToQuestion(iq, "THEORY"));
        }

        // ── CODING (4 problems from problems table) ──────────────────────────
        if (probCount >= MIN_PROB_COUNT) {
            List<Problem> problems = problemRepo.findByCategoriesRandom(topicCats, PageRequest.of(0, 4));
            for (Problem p : problems) {
                questions.add(problemToQuestion(p));
            }
        } else {
            // Fall back to AI for coding if no usable problems
            List<Map<String, Object>> codingQs = generateQuestions(resumeText, profile, "CODING", 3);
            questions.addAll(codingQs);
        }

        // ── PROJECT (2 AI questions — personalized to resume) ────────────────
        List<Map<String, Object>> projectQs = generateQuestions(resumeText, profile, "PROJECT", 2);
        questions.addAll(projectQs);

        // ── BEHAVIORAL (3 questions) ─────────────────────────────────────────
        List<InterviewQuestion> behavioralIqs = iqRepo.findByCategoriesRandom(
                List.of("BEHAVIORAL"), PageRequest.of(0, 3));
        for (InterviewQuestion iq : behavioralIqs) {
            questions.add(iqToQuestion(iq, "BEHAVIORAL"));
        }

        // ── SYSTEM_DESIGN (3 questions) ──────────────────────────────────────
        List<InterviewQuestion> sdIqs = iqRepo.findByCategoriesRandom(
                List.of("SYSTEM_DESIGN"), PageRequest.of(0, 3));
        for (InterviewQuestion iq : sdIqs) {
            questions.add(iqToQuestion(iq, "SYSTEM_DESIGN"));
        }

        // Assign sequential IDs
        for (int i = 0; i < questions.size(); i++) {
            questions.get(i).put("id", i + 1);
        }

        log.info("DB practice set assembled: {} questions", questions.size());
        return questions;
    }

    /** Convert InterviewQuestion entity → practice set question map */
    private Map<String, Object> iqToQuestion(InterviewQuestion iq, String practiceCategory) {
        Map<String, Object> q = new LinkedHashMap<>();
        q.put("category",   practiceCategory);
        q.put("topic",      iq.getTopicTitle() != null ? iq.getTopicTitle() : categoryLabel(iq.getCategory()));
        q.put("difficulty", "HIGH".equals(iq.getDifficulty()) ? "Hard" : "Medium");
        q.put("question",   iq.getQuestion());
        q.put("answer",     iq.getQuickAnswer());
        q.put("keyPoints",  parseJsonArray(iq.getKeyPoints()));
        q.put("followUp",   firstFollowUp(iq.getFollowUpQuestions()));
        return q;
    }

    /** Convert Problem entity → practice set question map */
    private Map<String, Object> problemToQuestion(Problem p) {
        Map<String, Object> q = new LinkedHashMap<>();
        q.put("category",   "CODING");
        q.put("topic",      p.getTopic().getTitle());
        q.put("difficulty", capitalize(p.getDifficulty().name()));
        q.put("question",   p.getTitle());
        q.put("answer",     buildProblemAnswer(p));
        q.put("keyPoints",  buildProblemKeyPoints(p));
        q.put("followUp",   "What is the time and space complexity of your solution?");
        return q;
    }

    private String buildProblemAnswer(Problem p) {
        StringBuilder sb = new StringBuilder();
        if (p.getPattern() != null && !p.getPattern().isBlank())
            sb.append("Pattern: ").append(p.getPattern()).append(". ");
        if (p.getHint1() != null && !p.getHint1().isBlank())
            sb.append(p.getHint1());
        return sb.toString().isBlank() ? "Think about the optimal data structure for this problem." : sb.toString().trim();
    }

    private List<String> buildProblemKeyPoints(Problem p) {
        List<String> kps = new ArrayList<>();
        if (p.getHint1() != null && !p.getHint1().isBlank()) kps.add(p.getHint1());
        if (p.getHint2() != null && !p.getHint2().isBlank()) kps.add(p.getHint2());
        if (p.getHint3() != null && !p.getHint3().isBlank()) kps.add(p.getHint3());
        if (p.getPattern() != null && !p.getPattern().isBlank())
            kps.add(0, "Pattern: " + p.getPattern());
        return kps;
    }

    // ── AI fallback generation (same as before, kept for thin DB) ─────────────

    private static final String[][] MICRO_BATCHES = {
        { "THEORY",       "4" },
        { "CODING",       "3" },
        { "PROJECT",      "3" },
        { "BEHAVIORAL",   "2" },
        { "SYSTEM_DESIGN","2" },
    };

    private List<Map<String, Object>> buildFromAi(String resumeText, Map<String, Object> profile) {
        List<Map<String, Object>> questions = new ArrayList<>();
        for (String[] batch : MICRO_BATCHES) {
            String category = batch[0];
            int    count    = Integer.parseInt(batch[1]);
            List<Map<String, Object>> batchQs = generateQuestions(resumeText, profile, category, count);
            int base = questions.size();
            for (int i = 0; i < batchQs.size(); i++) {
                Map<String, Object> q = new java.util.LinkedHashMap<>(batchQs.get(i));
                q.put("id", base + i + 1);
                questions.add(q);
            }
            sleepQuietly(400);
        }
        return questions;
    }

    // ── Skill → Category mapping ───────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private List<String> resolveIqCategories(Map<String, Object> profile) {
        Set<String> cats = new LinkedHashSet<>();
        Object techStack = profile.get("techStack");
        if (techStack instanceof List<?> list) {
            for (Object item : list) {
                if (item instanceof Map<?,?> rawMap) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> m = (Map<String, Object>) rawMap;
                    String tech = String.valueOf(m.getOrDefault("tech", "")).toLowerCase();
                    for (Map.Entry<String, List<String>> e : SKILL_TO_IQ_CATS.entrySet()) {
                        if (tech.contains(e.getKey())) {
                            cats.addAll(e.getValue());
                        }
                    }
                }
            }
        }
        // Default fallback if nothing matched
        if (cats.isEmpty()) cats.addAll(List.of("JAVA", "DSA", "SQL"));
        return new ArrayList<>(cats);
    }

    @SuppressWarnings("unchecked")
    private List<String> resolveTopicCategories(Map<String, Object> profile) {
        Set<String> cats = new LinkedHashSet<>();
        Object techStack = profile.get("techStack");
        if (techStack instanceof List<?> list) {
            for (Object item : list) {
                if (item instanceof Map<?,?> rawMap) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> m = (Map<String, Object>) rawMap;
                    String tech = String.valueOf(m.getOrDefault("tech", "")).toLowerCase();
                    for (Map.Entry<String, List<String>> e : SKILL_TO_TOPIC_CATS.entrySet()) {
                        if (tech.contains(e.getKey())) {
                            cats.addAll(e.getValue());
                        }
                    }
                }
            }
        }
        if (cats.isEmpty()) cats.addAll(List.of("JAVA", "DSA", "MYSQL"));
        return new ArrayList<>(cats);
    }

    // ── AI question generation ─────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> generateQuestions(
            String resumeText,
            Map<String, Object> profile,
            String focusTopic,
            int count) {

        String techList  = formatList(profile.get("techStack"), "tech");
        String projList  = formatList(profile.get("projects"),  "name");

        String focusClause = "category must be exactly: " + focusTopic + ". "
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
            log.error("Failed to parse practice questions for category {}: {}", focusTopic, e.getMessage());
            return List.of(Map.of(
                "id", 1, "category", focusTopic, "topic", "General",
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

    @SuppressWarnings("unchecked")
    private List<String> parseJsonArray(String json) {
        if (json == null || json.isBlank()) return List.of();
        try { return mapper.readValue(json, new TypeReference<>() {}); }
        catch (Exception e) { return List.of(); }
    }

    private String firstFollowUp(String followUpJson) {
        List<String> list = parseJsonArray(followUpJson);
        return list.isEmpty() ? "" : list.get(0);
    }

    private String categoryLabel(String category) {
        return switch (category) {
            case "JAVA"          -> "Java";
            case "ADVANCED_JAVA" -> "Advanced Java";
            case "DSA"           -> "DSA";
            case "SQL"           -> "SQL";
            case "SPRING_BOOT"   -> "Spring Boot";
            case "AWS"           -> "AWS";
            case "BEHAVIORAL"    -> "Behavioral";
            case "SYSTEM_DESIGN" -> "System Design";
            default              -> category;
        };
    }

    private String capitalize(String s) {
        if (s == null || s.isBlank()) return s;
        return s.charAt(0) + s.substring(1).toLowerCase();
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
                    int j = i + 1;
                    while (j < json.length() && json.charAt(j) == ' ') j++;
                    char next = j < json.length() ? json.charAt(j) : 0;
                    if (next == ':' || next == ',' || next == '}' || next == ']' || next == '\n' || next == '\r' || next == 0) {
                        inString = false;
                        sb.append(c);
                    } else {
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

    private static void sleepQuietly(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
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
