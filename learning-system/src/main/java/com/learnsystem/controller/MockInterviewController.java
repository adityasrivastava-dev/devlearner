package com.learnsystem.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.learnsystem.model.MockInterviewSession;
import com.learnsystem.model.MockInterviewSession.Stage;
import com.learnsystem.model.User;
import com.learnsystem.repository.MockInterviewRepository;
import com.learnsystem.service.GeminiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api/mock-interview")
@RequiredArgsConstructor
public class MockInterviewController {

    private final MockInterviewRepository repo;
    private final GeminiService           gemini;
    private final ObjectMapper            mapper = new ObjectMapper();

    // ── Personas ───────────────────────────────────────────────────────────────

    private static final String QUESTION_PERSONA =
        "You are a senior backend engineer at a top tech company generating interview questions. " +
        "Return ONLY a single valid JSON object with no markdown, no explanation, no code fences. " +
        "Use this exact shape:\n" +
        "{\n" +
        "  \"type\": \"APPROACH|MCQ|CODE|SQL|FIND_OUTPUT|PSEUDOCODE|STEPS|DESIGN\",\n" +
        "  \"spokenIntro\": \"Natural 1-2 sentence intro the interviewer says aloud\",\n" +
        "  \"question\": \"The question or task for the candidate\",\n" +
        "  \"code\": \"properly indented code using \\\\n for every line break — NEVER put all code on one line. Use 4-space indentation. Example: \\\"public int add(int a, int b) {\\\\n    return a + b;\\\\n}\\\"\",\n" +
        "  \"options\": [\"A) ...\",\"B) ...\",\"C) ...\",\"D) ...\"] or null\n" +
        "}\n\n" +
        "CRITICAL: The 'code' field MUST use \\n escape sequences for line breaks. " +
        "Write code exactly as it would appear in an IDE, with each statement on its own line and proper indentation. " +
        "Never compress code into a single line.\n\n" +
        "Type selection rules:\n" +
        "- Q1 is always APPROACH (warm up, explain a concept)\n" +
        "- MCQ: conceptual 'which of the following / what is' question — include 4 options\n" +
        "- FIND_OUTPUT: show a code snippet (put in 'code' field) and ask what it prints\n" +
        "- CODE: ask candidate to write a function/class on a whiteboard (no execution)\n" +
        "- SQL: ask to write a SQL query for a scenario\n" +
        "- PSEUDOCODE: ask for algorithm steps in pseudocode\n" +
        "- STEPS: trace how a piece of code executes step by step\n" +
        "- DESIGN: design a class hierarchy, DB schema, or system component\n" +
        "- APPROACH: open-ended explanation of a concept or decision\n\n" +
        "For DSA: prefer CODE, FIND_OUTPUT, PSEUDOCODE, STEPS\n" +
        "For JAVA: prefer MCQ, FIND_OUTPUT, CODE, APPROACH\n" +
        "For SPRING_BOOT: prefer APPROACH, CODE, MCQ\n" +
        "For SYSTEM_DESIGN: prefer APPROACH, DESIGN\n" +
        "For MYSQL: prefer SQL, MCQ, APPROACH\n" +
        "Make questions progressively harder across the session.";

    private static final String FEEDBACK_PERSONA =
        "You are a technical interviewer giving brief, encouraging feedback after a candidate answers. " +
        "Be specific and constructive. 1-2 sentences only. " +
        "Acknowledge what was good, point out any gap. Don't give the full answer away.";

    private static final String DEBRIEF_PERSONA =
        "You are a senior interviewer giving a post-interview debrief. " +
        "Respond ONLY with valid JSON, no markdown, no explanation:\n" +
        "{\"approachScore\":7,\"communicationScore\":8,\"codeScore\":6," +
        "\"debriefText\":\"2-3 sentence overall assessment.\"," +
        "\"strengths\":[\"specific strength 1\",\"specific strength 2\"]," +
        "\"improvements\":[\"specific improvement area\"]}";

    // ── Question type distribution per category ────────────────────────────────

    private static final Map<String, List<String>> CAT_TYPES = Map.of(
        "DSA",           List.of("APPROACH","FIND_OUTPUT","CODE","PSEUDOCODE","STEPS","CODE"),
        "JAVA",          List.of("APPROACH","MCQ","FIND_OUTPUT","CODE","MCQ","APPROACH"),
        "SPRING_BOOT",   List.of("APPROACH","MCQ","CODE","APPROACH","MCQ"),
        "SYSTEM_DESIGN", List.of("APPROACH","DESIGN","APPROACH","DESIGN","APPROACH"),
        "MYSQL",         List.of("APPROACH","SQL","MCQ","SQL","APPROACH")
    );

    // ── Helpers ────────────────────────────────────────────────────────────────

    private int computeTotalQuestions(int durationMinutes) {
        if (durationMinutes <= 20) return 3;
        if (durationMinutes <= 30) return 4;
        if (durationMinutes <= 45) return 5;
        return 6;
    }

    private String suggestedType(String category, int questionIndex, int total) {
        List<String> types = CAT_TYPES.getOrDefault(category, CAT_TYPES.get("DSA"));
        int idx = Math.min(questionIndex, types.size() - 1);
        return types.get(idx);
    }

    private Map<String, Object> parseQuestion(String raw) {
        try {
            String cleaned = raw.replaceAll("(?s)```[a-zA-Z]*", "").replace("```", "").trim();
            JsonNode node = mapper.readTree(cleaned);
            Map<String, Object> q = new LinkedHashMap<>();
            q.put("type",        node.path("type").asText("APPROACH"));
            q.put("spokenIntro", node.path("spokenIntro").asText("Let's continue."));
            q.put("question",    node.path("question").asText("Explain your approach."));
            q.put("code",        node.path("code").isNull() ? null : node.path("code").asText(null));

            if (node.has("options") && node.path("options").isArray()) {
                List<String> opts = new ArrayList<>();
                node.path("options").forEach(o -> opts.add(o.asText()));
                q.put("options", opts);
            } else {
                q.put("options", null);
            }
            return q;
        } catch (Exception e) {
            log.warn("Failed to parse Gemini question JSON: {}", e.getMessage());
            // Map.of() doesn't allow null values — use LinkedHashMap instead
            Map<String, Object> fallback = new LinkedHashMap<>();
            fallback.put("type",        "APPROACH");
            fallback.put("spokenIntro", "Let's continue with the next question.");
            fallback.put("question",    raw.length() > 400 ? raw.substring(0, 400) : raw);
            fallback.put("code",        null);
            fallback.put("options",     null);
            return fallback;
        }
    }

    private Map<String, Object> generateQuestion(
            String category, String difficulty, int questionIndex,
            int totalQuestions, String resumeContext) {

        String suggestedType = suggestedType(category, questionIndex, totalQuestions);
        String prompt = String.format(
            "Category: %s | Difficulty: %s | Question %d of %d | Preferred type: %s%s\n\n" +
            "Generate a realistic interview question of the specified type. " +
            "Make it appropriately challenging for question %d of %d in this interview.",
            category, difficulty, questionIndex + 1, totalQuestions, suggestedType,
            (resumeContext != null && !resumeContext.isBlank()
                ? "\nCandidate resume tech: " + resumeContext : ""),
            questionIndex + 1, totalQuestions
        );
        String raw = gemini.chat(QUESTION_PERSONA, prompt);
        return parseQuestion(raw);
    }

    private String appendQuestion(String existing, Map<String, Object> q) {
        try {
            ArrayNode arr = existing == null || existing.isBlank()
                ? mapper.createArrayNode()
                : (ArrayNode) mapper.readTree(existing);
            ObjectNode node = mapper.createObjectNode();
            node.put("type",        (String) q.get("type"));
            node.put("spokenIntro", (String) q.get("spokenIntro"));
            node.put("question",    (String) q.get("question"));
            if (q.get("code") != null) node.put("code", (String) q.get("code"));
            else node.putNull("code");
            @SuppressWarnings("unchecked")
            List<String> opts = (List<String>) q.get("options");
            if (opts != null) {
                ArrayNode optsNode = mapper.createArrayNode();
                opts.forEach(optsNode::add);
                node.set("options", optsNode);
            } else {
                node.putNull("options");
            }
            arr.add(node);
            return mapper.writeValueAsString(arr);
        } catch (Exception e) {
            return existing;
        }
    }

    private String recordAnswer(String existing, int index, String answer, String feedback) {
        try {
            ArrayNode arr = (ArrayNode) mapper.readTree(existing);
            if (index < arr.size()) {
                ObjectNode node = (ObjectNode) arr.get(index);
                node.put("userAnswer", answer);
                node.put("feedback",   feedback);
            }
            return mapper.writeValueAsString(arr);
        } catch (Exception e) {
            return existing;
        }
    }

    // ── Endpoints ──────────────────────────────────────────────────────────────

    /** POST /api/mock-interview/start */
    @PostMapping("/start")
    public ResponseEntity<?> start(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal User user) {

        if (user == null) return ResponseEntity.status(401).build();

        String catStr       = (String) body.getOrDefault("category", "DSA");
        String diffStr      = (String) body.getOrDefault("difficulty", "MEDIUM");
        int    minutes      = (int)    body.getOrDefault("durationMinutes", 45);
        String resumeCtx    = (String) body.get("resumeContext");

        MockInterviewSession.Category  cat;
        MockInterviewSession.Difficulty diff;
        try {
            cat  = MockInterviewSession.Category.valueOf(catStr);
            diff = MockInterviewSession.Difficulty.valueOf(diffStr);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid category or difficulty"));
        }

        int total = computeTotalQuestions(minutes);

        // Generate first question
        Map<String, Object> firstQ = generateQuestion(catStr, diffStr, 0, total, resumeCtx);
        String questionsJson = appendQuestion(null, firstQ);

        MockInterviewSession session = MockInterviewSession.builder()
            .userId(user.getId())
            .stage(Stage.ACTIVE)
            .category(cat)
            .difficulty(diff)
            .durationMinutes(minutes)
            .totalQuestions(total)
            .currentQuestionIndex(0)
            .resumeContext(resumeCtx)
            .questionsJson(questionsJson)
            .build();

        repo.save(session);
        log.info("Mock interview started: userId={} sessionId={} category={} total={}",
            user.getId(), session.getId(), cat, total);

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("sessionId",      session.getId());
        resp.put("totalQuestions", total);
        resp.put("questionIndex",  0);
        resp.put("durationMinutes", minutes);
        resp.put("question",       firstQ);
        return ResponseEntity.ok(resp);
    }

    /** POST /api/mock-interview/{id}/answer  { answer, questionIndex } */
    @PostMapping("/{id}/answer")
    public ResponseEntity<?> answer(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal User user) {

        if (user == null) return ResponseEntity.status(401).build();

        MockInterviewSession session = repo.findByIdAndUserId(id, user.getId()).orElse(null);
        if (session == null) return ResponseEntity.notFound().build();
        if (session.getStage() == Stage.DEBRIEF)
            return ResponseEntity.badRequest().body(Map.of("error", "Interview already completed"));

        String answer   = (String) body.getOrDefault("answer", "");
        int    qIndex   = (int)    body.getOrDefault("questionIndex", 0);

        // Get question text for feedback context
        String questionText = "";
        try {
            ArrayNode arr = (ArrayNode) mapper.readTree(session.getQuestionsJson());
            if (qIndex < arr.size()) questionText = arr.get(qIndex).path("question").asText();
        } catch (Exception ignored) {}

        // Brief feedback from AI
        String feedbackPrompt = "Question asked: " + questionText + "\nCandidate answered: " + answer;
        String feedback = gemini.chat(FEEDBACK_PERSONA, feedbackPrompt);

        // Record answer + feedback
        String updated = recordAnswer(session.getQuestionsJson(), qIndex, answer, feedback);

        int nextIndex = qIndex + 1;
        boolean done  = nextIndex >= session.getTotalQuestions();

        if (!done) {
            // Generate next question and append
            Map<String, Object> nextQ = generateQuestion(
                session.getCategory().name(),
                session.getDifficulty().name(),
                nextIndex,
                session.getTotalQuestions(),
                session.getResumeContext()
            );
            updated = appendQuestion(updated, nextQ);
            session.setCurrentQuestionIndex(nextIndex);
            session.setQuestionsJson(updated);
            repo.save(session);

            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("feedback",      feedback);
            resp.put("done",          false);
            resp.put("questionIndex", nextIndex);
            resp.put("question",      nextQ);
            return ResponseEntity.ok(resp);
        } else {
            session.setCurrentQuestionIndex(nextIndex);
            session.setQuestionsJson(updated);
            session.setStage(Stage.DEBRIEF);
            session.setEndedAt(LocalDateTime.now());
            repo.save(session);
            return ResponseEntity.ok(Map.of("feedback", feedback, "done", true));
        }
    }

    /** POST /api/mock-interview/{id}/finish — generate debrief after all questions done */
    @PostMapping("/{id}/finish")
    public ResponseEntity<?> finish(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {

        if (user == null) return ResponseEntity.status(401).build();

        MockInterviewSession session = repo.findByIdAndUserId(id, user.getId()).orElse(null);
        if (session == null) return ResponseEntity.notFound().build();

        // Build debrief prompt from all Q&A pairs
        StringBuilder qa = new StringBuilder();
        try {
            ArrayNode arr = (ArrayNode) mapper.readTree(session.getQuestionsJson());
            for (int i = 0; i < arr.size(); i++) {
                JsonNode node = arr.get(i);
                qa.append("Q").append(i + 1).append(" [").append(node.path("type").asText()).append("]: ")
                  .append(node.path("question").asText()).append("\n")
                  .append("Answer: ").append(node.path("userAnswer").asText("(no answer)")).append("\n\n");
            }
        } catch (Exception e) {
            qa.append("Questions and answers unavailable.");
        }

        String debriefPrompt = "Category: " + session.getCategory().name() +
            " | Difficulty: " + session.getDifficulty().name() +
            "\n\nFull Q&A:\n" + qa +
            "\nEvaluate the candidate and return scores + feedback as JSON.";

        String rawDebrief = gemini.chat(DEBRIEF_PERSONA, debriefPrompt);

        try {
            String cleaned = rawDebrief.replaceAll("(?s)```[a-zA-Z]*", "").replace("```", "").trim();
            JsonNode node = mapper.readTree(cleaned);
            session.setApproachScore(node.path("approachScore").asInt(5));
            session.setCommunicationScore(node.path("communicationScore").asInt(5));
            session.setCodeScore(node.path("codeScore").asInt(5));
            session.setDebriefText(node.path("debriefText").asText("Interview completed."));
            session.setStrengths(node.path("strengths").toString());
            session.setImprovements(node.path("improvements").toString());
        } catch (Exception e) {
            session.setApproachScore(5);
            session.setCommunicationScore(5);
            session.setCodeScore(5);
            session.setDebriefText(rawDebrief.length() > 500 ? rawDebrief.substring(0, 500) : rawDebrief);
            session.setStrengths("[]");
            session.setImprovements("[]");
        }

        session.setStage(Stage.DEBRIEF);
        repo.save(session);

        int overall = Math.round(
            (session.getApproachScore() + session.getCommunicationScore() + session.getCodeScore()) / 3f);

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("stage",              "DEBRIEF");
        resp.put("approachScore",      session.getApproachScore());
        resp.put("communicationScore", session.getCommunicationScore());
        resp.put("codeScore",          session.getCodeScore());
        resp.put("overallScore",       overall);
        resp.put("debriefText",        session.getDebriefText());
        resp.put("strengths",          session.getStrengths() != null ? session.getStrengths() : "[]");
        resp.put("improvements",       session.getImprovements() != null ? session.getImprovements() : "[]");
        resp.put("debriefSpeech",
            "Interview complete. Your overall score is " + overall + " out of 10. " + session.getDebriefText());
        return ResponseEntity.ok(resp);
    }

    /** GET /api/mock-interview/{id} */
    @GetMapping("/{id}")
    public ResponseEntity<?> getSession(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {

        if (user == null) return ResponseEntity.status(401).build();
        return repo.findByIdAndUserId(id, user.getId())
            .map(s -> ResponseEntity.ok(Map.of(
                "sessionId",      s.getId(),
                "stage",          s.getStage().name(),
                "category",       s.getCategory().name(),
                "difficulty",     s.getDifficulty().name(),
                "totalQuestions", s.getTotalQuestions(),
                "questionIndex",  s.getCurrentQuestionIndex()
            )))
            .orElse(ResponseEntity.notFound().build());
    }

    /** GET /api/mock-interview/history */
    @GetMapping("/history")
    public ResponseEntity<?> history(@AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).build();
        List<Map<String, Object>> results = new ArrayList<>();
        for (MockInterviewSession s : repo.findByUserIdOrderByStartedAtDesc(user.getId())) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("sessionId",   s.getId());
            item.put("category",    s.getCategory().name());
            item.put("difficulty",  s.getDifficulty().name());
            item.put("stage",       s.getStage().name());
            item.put("overallScore", s.getApproachScore() != null
                ? Math.round((s.getApproachScore() + s.getCommunicationScore() + s.getCodeScore()) / 3f) : null);
            item.put("startedAt",   s.getStartedAt() != null ? s.getStartedAt().toString() : null);
            results.add(item);
        }
        return ResponseEntity.ok(results);
    }
}
