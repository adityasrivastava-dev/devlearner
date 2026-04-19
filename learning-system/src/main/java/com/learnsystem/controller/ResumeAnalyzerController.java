package com.learnsystem.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnsystem.model.Topic;
import com.learnsystem.model.User;
import com.learnsystem.repository.TopicRepository;
import com.learnsystem.service.GeminiService;
import com.learnsystem.service.LearningGateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * POST /api/resume/analyze  (multipart/form-data, field "file")
 *
 * Extracts tech keywords from a resume PDF and compares them against the
 * user's gate stages to surface learning gaps.
 *
 * Returns:
 *   extractedTech  — list of recognised tech terms found in the resume
 *   gaps           — tech on resume but not yet mastered in DevLearn
 *   strengths      — tech on resume that IS mastered
 *   suggestions    — DevLearn topics to study for the gaps
 *   unmapped       — tech terms found but not mapped to any DevLearn topic
 */
@Slf4j
@RestController
@RequestMapping("/api/resume")
@RequiredArgsConstructor
public class ResumeAnalyzerController {

    private final TopicRepository    topicRepo;
    private final LearningGateService gateService;
    private final GeminiService      geminiService;
    private final ObjectMapper       objectMapper = new ObjectMapper();

    // ── Keyword → DevLearn topic title mappings ────────────────────────────────
    // Key = lowercase keyword (regex word-boundary matched)
    // Value = DevLearn topic title (must match actual topic titles in DB)
    private static final Map<String, List<String>> KEYWORD_TOPICS = new LinkedHashMap<>();
    static {
        // Java Core
        put("java",             "JVM / JRE / JDK Architecture", "Data Types & Variables", "Class & Object in Java");
        put("jvm",              "JVM / JRE / JDK Architecture");
        put("oop",              "Class & Object in Java", "Inheritance in Java", "Polymorphism in Java");
        put("generics",         "Generics in Java");
        put("collections",      "Java Collections Framework");
        put("streams",          "Streams API & Functional Interfaces");
        put("lambda",           "Streams API & Functional Interfaces");
        put("multithreading",   "Concurrency & Threads");
        put("concurrency",      "Concurrency & Threads");
        put("threads",          "Concurrency & Threads");
        put("design patterns",  "Design Patterns in Java");
        put("solid",            "Design Patterns in Java");
        put("exception handling","Exception Handling in Java");
        put("serialization",    "Serialization in Java");
        put("reflection",       "Reflection & Annotations");
        put("garbage collection","JVM Garbage Collection");
        put("completablefuture","CompletableFuture & Async");
        put("optional",         "Optional & Parallel Streams");
        // Spring
        put("spring boot",      "Spring Boot");
        put("spring",           "Spring Core & IoC");
        put("spring security",  "Spring Security");
        put("spring mvc",       "Spring Boot");
        put("hibernate",        "Spring JPA & Hibernate");
        put("jpa",              "Spring JPA & Hibernate");
        put("rest",             "REST API Design");
        put("microservices",    "Microservices Architecture");
        put("actuator",         "Spring Boot Actuator");
        // DSA
        put("linked list",      "Linked List");
        put("binary tree",      "Trees & Binary Trees");
        put("tree",             "Trees & Binary Trees");
        put("graph",            "Graphs & Graph Algorithms");
        put("dynamic programming", "Dynamic Programming");
        put("recursion",        "Recursion & Backtracking");
        put("backtracking",     "Recursion & Backtracking");
        put("sorting",          "Sorting Algorithms");
        put("binary search",    "Binary Search");
        put("heap",             "Heaps & Priority Queues");
        put("trie",             "Trie & Advanced Trees");
        put("stack",            "Stack & Queue");
        put("queue",            "Stack & Queue");
        put("greedy",           "Greedy Algorithms");
        put("bit manipulation", "Bit Manipulation");
        // MySQL
        put("mysql",            "SQL Basics & DDL/DML");
        put("sql",              "SQL Basics & DDL/DML");
        put("postgresql",       "SQL Basics & DDL/DML");
        put("database",         "SQL Basics & DDL/DML");
        put("indexing",         "Indexing & Performance");
        put("joins",            "Joins & Subqueries");
        put("normalization",    "Normalization & Database Design");
        put("transactions",     "Advanced SQL & Transactions");
        put("query optimization","Query Optimization");
        put("stored procedure", "Advanced SQL & Transactions");
        // AWS
        put("aws",              "AWS Core Services");
        put("s3",               "AWS Core Services");
        put("ec2",              "AWS Core Services");
        put("lambda",           "Serverless & Messaging (AWS)");
        put("sqs",              "Serverless & Messaging (AWS)");
        put("sns",              "Serverless & Messaging (AWS)");
        put("rds",              "RDS & Aurora");
        put("elasticache",      "ElastiCache & Storage");
        put("redis",            "ElastiCache & Storage");
        put("cloudfront",       "Networking, CDN & Route 53");
        put("vpc",              "Networking, CDN & Route 53");
        put("docker",           "DevOps, Docker & CI/CD");
        put("kubernetes",       "DevOps, Docker & CI/CD");
        put("ci/cd",            "DevOps, Docker & CI/CD");
        put("devops",           "DevOps, Docker & CI/CD");
        // System Design
        put("system design",    "System Design Fundamentals");
        put("distributed",      "Distributed Systems & Consensus");
        put("caching",          "Performance & Caching Patterns");
        put("load balancing",   "System Design Fundamentals");
        put("kafka",            "Distributed Systems & Consensus");
        put("message queue",    "Distributed Systems & Consensus");
        put("auth",             "Authentication Systems Design");
        put("oauth",            "Authentication Systems Design");
        put("jwt",              "Spring Security");
        // Testing
        put("junit",            "Unit & Integration Testing");
        put("mockito",          "Unit & Integration Testing");
        put("testing",          "Unit & Integration Testing");
        put("tdd",              "Unit & Integration Testing");
    }

    private static void put(String keyword, String... topics) {
        KEYWORD_TOPICS.put(keyword, Arrays.asList(topics));
    }

    // ── Endpoint ───────────────────────────────────────────────────────────────

    @PostMapping(value = "/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> analyze(
            @RequestPart("file") MultipartFile file,
            @AuthenticationPrincipal User user) {

        if (user == null) return ResponseEntity.status(401).build();

        if (file == null || file.isEmpty())
            return ResponseEntity.badRequest().body(Map.of("error", "No file uploaded"));

        String fname = file.getOriginalFilename();
        if (fname == null || !fname.toLowerCase().endsWith(".pdf"))
            return ResponseEntity.badRequest().body(Map.of("error", "Only PDF files are supported"));

        if (file.getSize() > 5 * 1024 * 1024)
            return ResponseEntity.badRequest().body(Map.of("error", "File too large — maximum 5 MB"));

        String text;
        try (PDDocument doc = Loader.loadPDF(file.getBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            text = stripper.getText(doc).toLowerCase();
        } catch (Exception e) {
            log.error("PDF parse failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Could not read PDF — make sure it contains selectable text"));
        }

        // Match keywords
        Set<String> foundKeywords = new LinkedHashSet<>();
        Set<String> mentionedTopicTitles = new LinkedHashSet<>();

        for (Map.Entry<String, List<String>> entry : KEYWORD_TOPICS.entrySet()) {
            String keyword = entry.getKey();
            Pattern p = Pattern.compile("\\b" + Pattern.quote(keyword) + "\\b");
            if (p.matcher(text).find()) {
                foundKeywords.add(keyword);
                mentionedTopicTitles.addAll(entry.getValue());
            }
        }

        if (foundKeywords.isEmpty()) {
            return ResponseEntity.ok(Map.of(
                "extractedTech", List.of(),
                "gaps", List.of(),
                "strengths", List.of(),
                "suggestions", List.of(),
                "unmapped", List.of(),
                "message", "No recognised tech keywords found. Make sure the PDF contains selectable text."
            ));
        }

        // Load topics + gate stages
        List<Topic> allTopics = topicRepo.findAllByOrderByDisplayOrderAscTitleAsc();
        Map<String, Topic> topicByTitle = allTopics.stream()
                .collect(Collectors.toMap(t -> t.getTitle().toLowerCase(), t -> t, (a, b) -> a));
        Map<Long, String> stages = gateService.getAllGateStages(user.getId());

        List<Map<String, Object>> strengths   = new ArrayList<>();
        List<Map<String, Object>> gaps        = new ArrayList<>();
        Set<String> mappedTitles = new HashSet<>();

        for (String topicTitle : mentionedTopicTitles) {
            Topic topic = topicByTitle.get(topicTitle.toLowerCase());
            if (topic == null) continue;
            mappedTitles.add(topicTitle.toLowerCase());

            String stage = stages.getOrDefault(topic.getId(), "THEORY");
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("topicId",   topic.getId());
            item.put("title",     topic.getTitle());
            item.put("category",  topic.getCategory().name());
            item.put("stage",     stage);

            if ("MASTERED".equals(stage)) {
                strengths.add(item);
            } else {
                item.put("action", actionFor(stage));
                gaps.add(item);
            }
        }

        // Unmapped keywords (recognised but no DB topic match)
        List<String> unmapped = foundKeywords.stream()
                .filter(kw -> KEYWORD_TOPICS.get(kw).stream()
                        .noneMatch(t -> topicByTitle.containsKey(t.toLowerCase())))
                .collect(Collectors.toList());

        // Suggestions = gap topics sorted by stage priority
        List<Map<String, Object>> suggestions = gaps.stream()
                .sorted(Comparator.comparingInt(m -> stageOrder((String) m.get("stage"))))
                .limit(10)
                .collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("extractedTech", new ArrayList<>(foundKeywords));
        result.put("strengths",     strengths);
        result.put("gaps",          gaps);
        result.put("suggestions",   suggestions);
        result.put("unmapped",      unmapped);
        result.put("totalFound",    foundKeywords.size());
        result.put("gapCount",      gaps.size());
        result.put("strengthCount", strengths.size());

        log.info("Resume analyzed: userId={} keywords={} gaps={} strengths={}",
                user.getId(), foundKeywords.size(), gaps.size(), strengths.size());
        return ResponseEntity.ok(result);
    }

    private String actionFor(String stage) {
        return switch (stage) {
            case "THEORY" -> "Read theory & write a note";
            case "EASY"   -> "Solve Easy problems";
            case "MEDIUM" -> "Solve Medium problems";
            case "HARD"   -> "Solve Hard problem to master";
            default       -> "Start learning";
        };
    }

    private int stageOrder(String stage) {
        return switch (stage) {
            case "EASY"   -> 0;
            case "MEDIUM" -> 1;
            case "HARD"   -> 2;
            default       -> 3;
        };
    }

    // ── Generate Interview ─────────────────────────────────────────────────────

    @PostMapping(value = "/generate-interview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> generateInterview(
            @RequestPart("file") MultipartFile file,
            @AuthenticationPrincipal User user) {

        if (user == null) return ResponseEntity.status(401).build();
        if (file == null || file.isEmpty())
            return ResponseEntity.badRequest().body(Map.of("error", "No file uploaded"));

        String fname = file.getOriginalFilename();
        if (fname == null || !fname.toLowerCase().endsWith(".pdf"))
            return ResponseEntity.badRequest().body(Map.of("error", "Only PDF files are supported"));
        if (file.getSize() > 5 * 1024 * 1024)
            return ResponseEntity.badRequest().body(Map.of("error", "File too large — maximum 5 MB"));

        String resumeText;
        try (PDDocument doc = Loader.loadPDF(file.getBytes())) {
            resumeText = new PDFTextStripper().getText(doc);
        } catch (Exception e) {
            log.error("PDF parse failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Could not read PDF — make sure it contains selectable text"));
        }

        // Truncate to ~4000 chars to stay within token limits
        String truncated = resumeText.length() > 4000 ? resumeText.substring(0, 4000) : resumeText;

        String systemPrompt = """
            You are a senior technical interviewer at MAANG (Meta, Apple, Amazon, Netflix, Google).
            Analyze the candidate's resume and generate a personalized interview question set.

            Return ONLY a valid JSON array — no markdown, no explanation, no code fences.
            Each element must have exactly these fields:
            {
              "id": <integer starting at 1>,
              "type": "<THEORY|CODING|PROJECT|BEHAVIORAL|SYSTEM_DESIGN>",
              "topic": "<short topic name>",
              "question": "<the full interview question>",
              "difficulty": "<Easy|Medium|Hard>",
              "expectedPoints": ["key point 1", "key point 2", "key point 3"]
            }

            Generate 18-22 questions with this distribution:
            - THEORY (5-6): Core concept questions on their specific tech stack (Java internals, Spring, DB, etc.)
            - CODING (4-5): Algorithm/DS problems matching their experience level. Include the problem statement clearly.
            - PROJECT (4-5): Specific deep-dive questions about projects listed on their resume. Reference project names directly.
            - BEHAVIORAL (3-4): STAR-format situational questions based on their work experience.
            - SYSTEM_DESIGN (2-3): Architecture questions if they have backend/cloud experience.

            Make every question specific to THIS resume. Reference their actual projects, companies, and tech stack.
            Do NOT generate generic questions unrelated to their background.
            """;

        String aiResponse = geminiService.chat(systemPrompt, "Resume:\n" + truncated);

        try {
            // Strip markdown code fences if AI wrapped it
            String cleaned = aiResponse.trim();
            if (cleaned.startsWith("```")) {
                cleaned = cleaned.replaceAll("^```[a-z]*\\n?", "").replaceAll("```$", "").trim();
            }
            // Extract the JSON array
            int start = cleaned.indexOf('[');
            int end   = cleaned.lastIndexOf(']');
            if (start >= 0 && end > start) cleaned = cleaned.substring(start, end + 1);

            List<Map<String, Object>> questions = objectMapper.readValue(
                cleaned, new TypeReference<>() {});

            log.info("Interview generated: userId={} questions={}", user.getId(), questions.size());
            return ResponseEntity.ok(Map.of(
                "questions",   questions,
                "totalCount",  questions.size(),
                "candidateName", extractName(resumeText)
            ));
        } catch (Exception e) {
            log.error("Failed to parse AI question response: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "AI returned an unexpected format. Please try again."));
        }
    }

    // ── Evaluate Answer ────────────────────────────────────────────────────────

    @PostMapping("/evaluate-answer")
    public ResponseEntity<?> evaluateAnswer(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal User user) {

        if (user == null) return ResponseEntity.status(401).build();

        String question       = String.valueOf(body.getOrDefault("question", ""));
        String answer         = String.valueOf(body.getOrDefault("answer", ""));
        String type           = String.valueOf(body.getOrDefault("type", "THEORY"));
        Object epRaw          = body.get("expectedPoints");
        String expectedPoints = epRaw != null ? epRaw.toString() : "[]";

        if (answer.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "Answer cannot be empty"));

        String systemPrompt = """
            You are an expert MAANG technical interviewer evaluating a candidate's answer.
            Return ONLY valid JSON — no markdown, no explanation, no code fences.
            JSON structure:
            {
              "score": <integer 1-5>,
              "grade": "<Excellent|Good|Needs Work|Poor>",
              "strengths": ["what the candidate got right — be specific"],
              "gaps": ["what was missing or incorrect — be specific and constructive"],
              "modelAnswer": "<the ideal answer in 3-5 sentences>",
              "followUp": "<one natural follow-up question an interviewer would ask next>"
            }

            Scoring guide: 5=excellent, 4=good with minor gaps, 3=partially correct, 2=significant gaps, 1=incorrect/off-topic.
            Be constructive and specific. Reference the candidate's actual words.
            """;

        String userMsg = String.format(
            "Question type: %s\nQuestion: %s\nExpected key points: %s\nCandidate's answer: %s",
            type, question, expectedPoints, answer);

        String aiResponse = geminiService.chat(systemPrompt, userMsg);

        try {
            String cleaned = aiResponse.trim();
            if (cleaned.startsWith("```")) {
                cleaned = cleaned.replaceAll("^```[a-z]*\\n?", "").replaceAll("```$", "").trim();
            }
            int start = cleaned.indexOf('{');
            int end   = cleaned.lastIndexOf('}');
            if (start >= 0 && end > start) cleaned = cleaned.substring(start, end + 1);

            Map<String, Object> evaluation = objectMapper.readValue(
                cleaned, new TypeReference<>() {});
            return ResponseEntity.ok(evaluation);
        } catch (Exception e) {
            log.error("Failed to parse AI evaluation: {}", e.getMessage());
            // Return a safe fallback
            return ResponseEntity.ok(Map.of(
                "score",       3,
                "grade",       "Good",
                "strengths",   List.of("You provided an answer — review it against the model answer below."),
                "gaps",        List.of("AI evaluation unavailable. Compare your answer to the model answer."),
                "modelAnswer", "Please refer to the expected key points for this question.",
                "followUp",    "Can you elaborate further on your answer?"
            ));
        }
    }

    private String extractName(String resumeText) {
        // Heuristic: first non-empty line is usually the candidate's name
        String[] lines = resumeText.split("\\n");
        for (String line : lines) {
            String trimmed = line.trim();
            if (!trimmed.isBlank() && trimmed.length() < 60 && !trimmed.contains("@"))
                return trimmed;
        }
        return "Candidate";
    }
}
