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
public class SmartInterviewService {

    private final GeminiService geminiService;
    private final ObjectMapper  objectMapper = new ObjectMapper();

    // ── Session store ─────────────────────────────────────────────────────────
    private final Map<String, InterviewSession> sessions = new ConcurrentHashMap<>();

    // Max conversation turns to include in AI context (keeps tokens manageable)
    private static final int HISTORY_WINDOW = 12;
    private static final int SESSION_TTL_HOURS = 3;

    // ── Public API ────────────────────────────────────────────────────────────

    public Map<String, Object> startSession(byte[] pdfBytes, Long userId) throws Exception {
        String resumeText = extractPdfText(pdfBytes);
        if (resumeText.isBlank())
            throw new IllegalArgumentException("Could not extract text from PDF. Make sure the file contains selectable text.");

        // Deep parse with Gemini (better at structured JSON extraction)
        Map<String, Object> profile = parseResume(resumeText);

        String sessionId = UUID.randomUUID().toString();
        InterviewSession session = new InterviewSession(sessionId, userId, resumeText, profile);

        // Generate the opening question
        String opener = generateOpener(session);
        session.addInterviewerMessage(opener);

        sessions.put(sessionId, session);
        log.info("Smart interview started: sessionId={} userId={} name={}", sessionId, userId, profile.get("name"));

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("sessionId",      sessionId);
        resp.put("firstQuestion",  opener);
        resp.put("profile",        profile);
        resp.put("totalQuestions", 20);
        return resp;
    }

    public Map<String, Object> respond(String sessionId, String answer) {
        InterviewSession session = requireSession(sessionId);

        session.addCandidateMessage(answer);

        // Evaluate answer with Groq (fast)
        Map<String, Object> evaluation = evaluateAnswer(session, answer);

        // Update session tracking
        String topic    = (String) evaluation.getOrDefault("topicCovered", "General");
        int    score    = ((Number) evaluation.getOrDefault("score", 3)).intValue();
        boolean struggled = Boolean.TRUE.equals(evaluation.get("struggled"));

        session.recordEvaluation(session.getQuestionCount(), session.getCurrentPhase(), score, topic, struggled);
        session.topicsCovered.add(topic);
        if (struggled) session.weakTopics.add(topic);

        // Advance phase based on question count
        session.currentPhase = phaseFor(session.getQuestionCount());

        // Check completion
        boolean complete = session.getQuestionCount() >= 20;

        String nextQuestion;
        if (complete) {
            nextQuestion = generateClosing(session);
            session.complete = true;
        } else {
            nextQuestion = generateNextQuestion(session, answer, evaluation);
        }
        session.addInterviewerMessage(nextQuestion);

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("nextQuestion",  nextQuestion);
        resp.put("evaluation",    evaluation);
        resp.put("questionCount", session.getQuestionCount());
        resp.put("phase",         session.currentPhase);
        resp.put("isComplete",    complete);
        return resp;
    }

    public Map<String, Object> getSummary(String sessionId) {
        InterviewSession session = requireSession(sessionId);
        return generateSummary(session);
    }

    // ── PDF extraction ────────────────────────────────────────────────────────

    private String extractPdfText(byte[] bytes) throws Exception {
        try (PDDocument doc = Loader.loadPDF(bytes)) {
            return new PDFTextStripper().getText(doc);
        }
    }

    // ── Resume parsing ────────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseResume(String resumeText) {
        String truncated = resumeText.length() > 5000 ? resumeText.substring(0, 5000) : resumeText;

        String system = """
            You are an expert HR analyst. Parse this resume and extract structured information.
            Return ONLY valid JSON — no markdown, no fences, no explanation.
            JSON structure:
            {
              "name": "First Last",
              "currentRole": "Senior Backend Engineer",
              "yearsOfExperience": 4,
              "techStack": [
                {"tech": "Java", "level": "Advanced", "years": 4},
                {"tech": "Spring Boot", "level": "Advanced", "years": 3}
              ],
              "projects": [
                {"name": "Payment Gateway", "desc": "Brief description", "tech": ["Java", "MySQL", "Redis"], "role": "Lead Developer"}
              ],
              "companies": ["Company A", "Company B"],
              "achievements": ["Led team of 5", "Reduced API latency by 40%"],
              "topicsToTest": ["Concurrency", "JVM internals", "Spring Security", "System design", "Database indexing"]
            }
            Extract as much detail as possible. topicsToTest should list 6-8 specific technical areas to probe.
            """;

        String aiResponse = geminiService.chatGeminiFirst(system, "Resume:\n" + truncated);

        try {
            String cleaned = stripFences(aiResponse);
            return objectMapper.readValue(cleaned, new TypeReference<>() {});
        } catch (Exception e) {
            log.warn("Resume parse failed, using defaults: {}", e.getMessage());
            Map<String, Object> fallback = new LinkedHashMap<>();
            fallback.put("name", "Candidate");
            fallback.put("currentRole", "Software Engineer");
            fallback.put("yearsOfExperience", 3);
            fallback.put("techStack", List.of(Map.of("tech", "Java", "level", "Intermediate")));
            fallback.put("projects", List.of());
            fallback.put("companies", List.of());
            fallback.put("achievements", List.of());
            fallback.put("topicsToTest", List.of("Java Core", "Data Structures", "System Design"));
            return fallback;
        }
    }

    // ── Question generation ───────────────────────────────────────────────────

    private String generateOpener(InterviewSession session) {
        String name = (String) session.profile.getOrDefault("name", "there");
        String role = (String) session.profile.getOrDefault("currentRole", "Software Engineer");

        String system = """
            You are Alex, a senior technical interviewer at a MAANG company.
            Start the interview with a warm, professional opening.
            Reference the candidate's name and current role naturally.
            Ask them to briefly introduce themselves and walk you through their background.
            Keep it to 2-3 sentences. Be conversational, not robotic. Return ONLY the question.
            """;

        String prompt = String.format(
            "Candidate name: %s\nCurrent role: %s\nTech stack highlights: %s",
            name, role, formatTechStack(session.profile));

        String result = geminiService.chatGroqOnly(system, prompt);
        if (result == null || result.isBlank())
            return String.format("Hi %s! I'm Alex. Before we dive in, could you briefly introduce yourself and walk me through your background?", name);
        return result;
    }

    private String generateNextQuestion(InterviewSession session, String lastAnswer, Map<String, Object> evaluation) {
        String system = buildAdaptiveSystemPrompt();
        String context = buildConversationContext(session, lastAnswer, evaluation);

        String result = geminiService.chatGroqOnly(system, context);
        if (result == null || result.isBlank()) {
            // Fallback questions by phase
            return fallbackQuestion(session.currentPhase, session.profile);
        }
        return result.trim();
    }

    private String buildAdaptiveSystemPrompt() {
        return """
            You are Alex, a senior technical interviewer at a MAANG company conducting a real interview.
            Your job: generate the NEXT single interview question based on the conversation so far.

            Rules:
            - Reference the candidate's ACTUAL resume — their specific projects, tech stack, companies
            - If they answered well → go deeper on that concept OR naturally transition to next area
            - If they struggled → ask a simpler follow-up OR kindly pivot: "Let's move to something else..."
            - If they mentioned something interesting → follow up naturally: "You mentioned X, can you elaborate?"
            - Use natural transitions: "Great!", "Interesting!", "Let's shift gears...", "Building on that..."
            - NEVER repeat a topic already well-covered
            - Phase flow: INTRO(Q1-2) → THEORY(Q3-7) → PROJECT(Q8-10) → CODING(Q11-13) → SYSTEM_DESIGN(Q14-16) → BEHAVIORAL(Q17-19) → CLOSING(Q20)

            Return ONLY the question text. Nothing else. No labels. No explanation.
            """;
    }

    private String buildConversationContext(InterviewSession session, String lastAnswer, Map<String, Object> eval) {
        // Recent conversation window
        List<ConversationTurn> history = session.history;
        int start = Math.max(0, history.size() - HISTORY_WINDOW);
        String historyText = history.subList(start, history.size()).stream()
            .map(t -> (t.role.equals("interviewer") ? "Alex: " : "Candidate: ") + t.content)
            .collect(Collectors.joining("\n\n"));

        String profileSummary = buildProfileSummary(session.profile);
        String evalSummary = String.format(
            "Score: %s/5 | Struggled: %s | Topic: %s | Missed: %s",
            eval.getOrDefault("score", "?"),
            eval.getOrDefault("struggled", false),
            eval.getOrDefault("topicCovered", "Unknown"),
            eval.getOrDefault("pointsMissed", List.of()));

        return String.format("""
            CANDIDATE PROFILE:
            %s

            RECENT CONVERSATION:
            %s

            LAST ANSWER EVALUATION: %s
            CURRENT PHASE: %s | QUESTION #%d
            TOPICS COVERED SO FAR: %s
            WEAK AREAS (needs more probing): %s

            Generate the next question:
            """,
            profileSummary, historyText, evalSummary,
            session.currentPhase, session.getQuestionCount(),
            String.join(", ", session.topicsCovered),
            String.join(", ", session.weakTopics));
    }

    private String generateClosing(InterviewSession session) {
        return "That wraps up our technical discussion — you've covered some impressive ground today! " +
               "Do you have any questions for me about the role, team culture, or what a typical day looks like?";
    }

    // ── Answer evaluation ─────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private Map<String, Object> evaluateAnswer(InterviewSession session, String answer) {
        // Get the last interviewer question
        String lastQuestion = session.history.stream()
            .filter(t -> t.role.equals("interviewer"))
            .reduce((a, b) -> b)
            .map(t -> t.content)
            .orElse("General question");

        String system = """
            You are evaluating a technical interview answer. Return ONLY valid JSON — no fences, no explanation.
            {
              "score": 4,
              "confidence": "high",
              "struggled": false,
              "topicCovered": "HashMap internals",
              "pointsHit": ["mentioned load factor 0.75", "explained separate chaining"],
              "pointsMissed": ["forgot tree conversion at threshold 8"],
              "briefFeedback": "Good understanding of basics, missed one key detail about tree conversion."
            }
            Score guide: 5=Expert, 4=Good with minor gaps, 3=Adequate, 2=Significant gaps, 1=Incorrect/off-topic
            struggled=true if score <= 2
            """;

        String prompt = String.format(
            "Phase: %s\nQuestion: %s\nCandidate's answer: %s",
            session.currentPhase, lastQuestion, answer);

        String aiResponse = geminiService.chatGroqOnly(system, prompt);

        try {
            String cleaned = stripFences(aiResponse);
            return objectMapper.readValue(cleaned, new TypeReference<>() {});
        } catch (Exception e) {
            log.warn("Evaluation parse failed: {}", e.getMessage());
            return Map.of(
                "score", 3, "confidence", "medium", "struggled", false,
                "topicCovered", "General", "pointsHit", List.of(),
                "pointsMissed", List.of(), "briefFeedback", "Answer recorded.");
        }
    }

    // ── Summary generation ────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private Map<String, Object> generateSummary(InterviewSession session) {
        // Build phase scores from evaluations
        Map<String, List<Integer>> phaseScoreMap = new LinkedHashMap<>();
        for (EvalSnapshot e : session.evaluations) {
            phaseScoreMap.computeIfAbsent(e.phase, k -> new ArrayList<>()).add(e.score);
        }
        Map<String, Double> phaseAvg = new LinkedHashMap<>();
        phaseScoreMap.forEach((p, scores) ->
            phaseAvg.put(p, scores.stream().mapToInt(i->i).average().orElse(0)));

        double overall = session.evaluations.stream()
            .mapToInt(e -> e.score).average().orElse(3.0);

        // Build conversation transcript for Gemini deep analysis
        String transcript = session.history.stream()
            .map(t -> (t.role.equals("interviewer") ? "Alex: " : "Candidate: ") + t.content)
            .collect(Collectors.joining("\n"));
        // Truncate for token limits
        if (transcript.length() > 6000) transcript = transcript.substring(0, 6000) + "...";

        String system = """
            Analyze this complete interview transcript and generate a comprehensive performance report.
            Return ONLY valid JSON — no fences, no explanation.
            {
              "overallScore": 3.8,
              "grade": "Good",
              "summary": "2-3 sentence overall assessment of the candidate",
              "phaseScores": {"THEORY": 4.2, "PROJECT": 3.5, "CODING": 3.0, "BEHAVIORAL": 4.0},
              "strengths": ["Deep Java expertise", "Articulate about projects", "Good problem-solving approach"],
              "gaps": ["Concurrency primitives need work", "System design responses were surface-level"],
              "topicBreakdown": [
                {"topic": "Java Core", "score": 4, "note": "Strong fundamentals"},
                {"topic": "Spring Boot", "score": 3, "note": "Good basics, gaps in internals"}
              ],
              "studyPlan": [
                "Review ConcurrentHashMap internals and compare with HashMap",
                "Practice designing distributed caching with Redis",
                "Study CAP theorem and real-world trade-offs"
              ],
              "hiringSuggestion": "Strong candidate for mid-senior backend roles. Recommend follow-up system design round."
            }
            """;

        String prompt = String.format(
            "Candidate: %s | Experience: %s years\nPhase averages: %s\n\nFull transcript:\n%s",
            session.profile.getOrDefault("name", "Candidate"),
            session.profile.getOrDefault("yearsOfExperience", "?"),
            phaseAvg, transcript);

        String aiResponse = geminiService.chatGeminiFirst(system, prompt);

        try {
            String cleaned = stripFences(aiResponse);
            Map<String, Object> result = objectMapper.readValue(cleaned, new TypeReference<>() {});
            // Inject computed data in case AI missed it
            result.putIfAbsent("overallScore", Math.round(overall * 10.0) / 10.0);
            result.putIfAbsent("phaseScores", phaseAvg);
            result.put("totalQuestionsAnswered", session.evaluations.size());
            result.put("candidateName", session.profile.getOrDefault("name", "Candidate"));
            return result;
        } catch (Exception e) {
            log.warn("Summary parse failed: {}", e.getMessage());
            return Map.of(
                "overallScore", Math.round(overall * 10.0) / 10.0,
                "grade", gradeFor(overall),
                "summary", "Interview completed. Review the conversation transcript for detailed feedback.",
                "phaseScores", phaseAvg,
                "strengths", List.of("Completed the full interview"),
                "gaps", List.copyOf(session.weakTopics),
                "studyPlan", List.of("Review weak topics identified during the interview"),
                "hiringSuggestion", "Interview data collected — manual review recommended.",
                "candidateName", session.profile.getOrDefault("name", "Candidate"),
                "totalQuestionsAnswered", session.evaluations.size()
            );
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private InterviewSession requireSession(String sessionId) {
        InterviewSession session = sessions.get(sessionId);
        if (session == null)
            throw new IllegalStateException("Interview session not found. Please start a new interview.");
        if (session.createdAt.isBefore(LocalDateTime.now().minusHours(SESSION_TTL_HOURS))) {
            sessions.remove(sessionId);
            throw new IllegalStateException("Interview session expired. Please start a new one.");
        }
        return session;
    }

    private String stripFences(String text) {
        if (text == null) return "{}";
        String s = text.trim();
        if (s.startsWith("```")) s = s.replaceAll("^```[a-z]*\\n?", "").replaceAll("```\\s*$", "").trim();
        // Find outermost JSON object or array
        int objStart = s.indexOf('{'), arrStart = s.indexOf('[');
        if (objStart >= 0 && (arrStart < 0 || objStart < arrStart)) {
            int end = s.lastIndexOf('}');
            if (end > objStart) return s.substring(objStart, end + 1);
        }
        if (arrStart >= 0) {
            int end = s.lastIndexOf(']');
            if (end > arrStart) return s.substring(arrStart, end + 1);
        }
        return s;
    }

    private String phaseFor(int questionCount) {
        if (questionCount <= 2)  return "INTRO";
        if (questionCount <= 7)  return "THEORY";
        if (questionCount <= 10) return "PROJECT";
        if (questionCount <= 13) return "CODING";
        if (questionCount <= 16) return "SYSTEM_DESIGN";
        if (questionCount <= 19) return "BEHAVIORAL";
        return "CLOSING";
    }

    private String gradeFor(double score) {
        if (score >= 4.5) return "Excellent";
        if (score >= 3.5) return "Good";
        if (score >= 2.5) return "Needs Work";
        return "Keep Practicing";
    }

    @SuppressWarnings("unchecked")
    private String formatTechStack(Map<String, Object> profile) {
        Object ts = profile.get("techStack");
        if (ts instanceof List<?> list) {
            return list.stream()
                .filter(Map.class::isInstance)
                .map(m -> ((Map<?,?>)m).get("tech") + " (" + ((Map<?,?>)m).get("level") + ")")
                .limit(5)
                .collect(Collectors.joining(", "));
        }
        return "Java, Spring Boot";
    }

    @SuppressWarnings("unchecked")
    private String buildProfileSummary(Map<String, Object> profile) {
        return String.format(
            "Name: %s | Role: %s | Experience: %s years\nTech: %s\nProjects: %s\nAchievements: %s\nTopics to test: %s",
            profile.getOrDefault("name", "Candidate"),
            profile.getOrDefault("currentRole", "Engineer"),
            profile.getOrDefault("yearsOfExperience", "?"),
            formatTechStack(profile),
            formatList(profile.get("projects"), "name"),
            formatList(profile.get("achievements"), null),
            formatList(profile.get("topicsToTest"), null));
    }

    @SuppressWarnings("unchecked")
    private String formatList(Object obj, String field) {
        if (obj instanceof List<?> list) {
            return list.stream()
                .map(item -> {
                    if (field != null && item instanceof Map<?,?> m) return String.valueOf(m.get(field));
                    return String.valueOf(item);
                })
                .limit(5)
                .collect(Collectors.joining(", "));
        }
        return "";
    }

    private String fallbackQuestion(String phase, Map<String, Object> profile) {
        String tech = formatTechStack(profile);
        return switch (phase) {
            case "THEORY"       -> "Can you explain how " + firstTech(profile) + " handles memory management internally?";
            case "PROJECT"      -> "Walk me through the most challenging technical problem you've solved in one of your projects.";
            case "CODING"       -> "Let's do a quick coding exercise. How would you find the first non-repeating character in a string?";
            case "SYSTEM_DESIGN"-> "How would you design a URL shortener that handles 100 million requests per day?";
            case "BEHAVIORAL"   -> "Tell me about a time you had a technical disagreement with a teammate. How did you resolve it?";
            default             -> "What excites you most about the technologies you work with?";
        };
    }

    private String firstTech(Map<String, Object> profile) {
        Object ts = profile.get("techStack");
        if (ts instanceof List<?> list && !list.isEmpty()) {
            Object first = list.get(0);
            if (first instanceof Map<?,?> m) {
                Object tech = m.get("tech");
                if (tech != null) return tech.toString();
            }
        }
        return "Java";
    }

    // ── Inner types ───────────────────────────────────────────────────────────

    record ConversationTurn(String role, String content) {}

    record EvalSnapshot(int qNum, String phase, int score, String topic, boolean struggled) {}

    static class InterviewSession {
        final String sessionId;
        final Long userId;
        final String resumeText;
        final Map<String, Object> profile;
        final List<ConversationTurn> history = new ArrayList<>();
        final List<EvalSnapshot> evaluations = new ArrayList<>();
        final Set<String> topicsCovered = new LinkedHashSet<>();
        final Set<String> weakTopics    = new LinkedHashSet<>();
        final LocalDateTime createdAt   = LocalDateTime.now();
        int questionCount = 0;
        String currentPhase = "INTRO";
        boolean complete = false;

        InterviewSession(String sessionId, Long userId, String resumeText, Map<String, Object> profile) {
            this.sessionId  = sessionId;
            this.userId     = userId;
            this.resumeText = resumeText;
            this.profile    = profile;
        }

        void addInterviewerMessage(String content) { history.add(new ConversationTurn("interviewer", content)); }
        void addCandidateMessage(String content)   { history.add(new ConversationTurn("candidate",   content)); questionCount++; }
        int  getQuestionCount()                    { return questionCount; }
        String getCurrentPhase()                   { return currentPhase; }
        void recordEvaluation(int qNum, String phase, int score, String topic, boolean struggled) {
            evaluations.add(new EvalSnapshot(qNum, phase, score, topic, struggled));
        }
    }
}
