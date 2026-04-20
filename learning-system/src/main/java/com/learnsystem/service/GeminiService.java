package com.learnsystem.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * AI text generation service.
 *
 * Provider priority:
 *   1. Groq   (GROQ_API_KEY)    — Llama 3.1, 14 400 req/day free, very reliable
 *   2. Gemini (GEMINI_API_KEY)  — fallback, multiple model fallback chain
 *   3. OpenAI (OPENAI_API_KEY)  — final fallback (gpt-4o-mini), paid but always available
 */
@Slf4j
@Service
public class GeminiService {

    // ── Groq ──────────────────────────────────────────────────────────────────
    private static final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

    private static final List<String> GROQ_MODELS = List.of(
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
        "llama3-8b-8192"
    );

    // ── Gemini ────────────────────────────────────────────────────────────────
    private static final String GEMINI_BASE =
        "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent";

    private static final List<String> GEMINI_MODELS = List.of(
        "gemini-2.0-flash",
        "gemini-2.0-flash-001",
        "gemini-2.5-flash",
        "gemini-2.0-flash-lite"
    );

    // ── OpenAI ────────────────────────────────────────────────────────────────
    private static final String OPENAI_URL = "https://api.openai.com/v1/chat/completions";

    private static final List<String> OPENAI_MODELS = List.of(
        "gpt-4o-mini",   // cheapest + fast, very reliable
        "gpt-3.5-turbo"  // legacy fallback
    );

    @Value("${groq.api.key:}")
    private String groqKey;

    @Value("${gemini.api.key:}")
    private String geminiKey;

    @Value("${openai.api.key:}")
    private String openaiKey;

    private final OkHttpClient http = new OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(40, TimeUnit.SECONDS)
        .build();

    private final ObjectMapper mapper = new ObjectMapper();

    // ── Public API ─────────────────────────────────────────────────────────────

    public String chat(String systemPrompt, String userMessage) {
        if (groqKey != null && !groqKey.isBlank()) {
            String result = callGroq(systemPrompt, userMessage);
            if (result != null) return result;
            log.warn("All Groq models failed — falling back to Gemini");
        }
        if (geminiKey != null && !geminiKey.isBlank()) {
            String result = callGemini(systemPrompt, userMessage);
            if (result != null) return result;
            log.warn("All Gemini models failed — falling back to OpenAI");
        }
        if (openaiKey != null && !openaiKey.isBlank()) {
            String result = callOpenAI(systemPrompt, userMessage);
            if (result != null) return result;
        }
        log.error("All AI providers exhausted");
        return "All AI models are currently busy. Please wait a moment and try again.";
    }

    public String continueConversation(String systemPrompt, String history, String newMessage) {
        String full = (history == null || history.isBlank())
            ? newMessage
            : history + "\n\nCandidate: " + newMessage;
        return chat(systemPrompt, full);
    }

    /** Speed-critical path: Groq → Gemini → OpenAI */
    public String chatGroqOnly(String systemPrompt, String userMessage) {
        if (groqKey != null && !groqKey.isBlank()) {
            String result = callGroq(systemPrompt, userMessage);
            if (result != null) return result;
        }
        return chat(systemPrompt, userMessage);
    }

    /** Deep analysis path: Gemini → Groq → OpenAI */
    public String chatGeminiFirst(String systemPrompt, String userMessage) {
        if (geminiKey != null && !geminiKey.isBlank()) {
            String result = callGemini(systemPrompt, userMessage);
            if (result != null) return result;
        }
        if (groqKey != null && !groqKey.isBlank()) {
            String result = callGroq(systemPrompt, userMessage);
            if (result != null) return result;
        }
        if (openaiKey != null && !openaiKey.isBlank()) {
            String result = callOpenAI(systemPrompt, userMessage);
            if (result != null) return result;
        }
        return "All AI models are currently busy. Please try again.";
    }

    /** Large-prompt path (resume analysis, practice sets): Gemini → OpenAI, skips Groq free-tier TPM limits */
    public String chatLargePrompt(String systemPrompt, String userMessage) {
        if (geminiKey != null && !geminiKey.isBlank()) {
            String result = callGemini(systemPrompt, userMessage);
            if (result != null) return result;
        }
        if (openaiKey != null && !openaiKey.isBlank()) {
            String result = callOpenAI(systemPrompt, userMessage);
            if (result != null) return result;
        }
        // Last resort: try Groq anyway
        if (groqKey != null && !groqKey.isBlank()) {
            String result = callGroq(systemPrompt, userMessage);
            if (result != null) return result;
        }
        return "All AI models are currently busy. Please try again.";
    }

    // ── Groq (OpenAI-compatible) ──────────────────────────────────────────────

    private String callGroq(String systemPrompt, String userMessage) {
        for (String model : GROQ_MODELS) {
            try {
                ObjectNode root = mapper.createObjectNode();
                root.put("model", model);
                root.put("temperature", 0.7);
                root.put("max_tokens",  8192);

                ArrayNode messages = root.putArray("messages");
                messages.addObject().put("role", "system").put("content", systemPrompt);
                messages.addObject().put("role", "user")  .put("content", userMessage);

                String body = mapper.writeValueAsString(root);

                Request req = new Request.Builder()
                    .url(GROQ_URL)
                    .header("Authorization", "Bearer " + groqKey)
                    .post(RequestBody.create(body, MediaType.parse("application/json")))
                    .build();

                try (Response resp = http.newCall(req).execute()) {
                    String respBody = resp.body() != null ? resp.body().string() : "";
                    if (resp.isSuccessful()) {
                        JsonNode json = mapper.readTree(respBody);
                        String text = json.at("/choices/0/message/content").asText("");
                        if (!text.isBlank()) {
                            log.debug("Groq response via {}", model);
                            return text;
                        }
                    }
                    int code = resp.code();
                    if (code == 429 || code == 503 || code == 413 || code == 400) {
                        log.warn("Groq {} returned {} — trying next model", model, code);
                        continue;
                    }
                    log.error("Groq {} error {}: {}", model, code, respBody);
                    return null;
                }
            } catch (Exception e) {
                log.warn("Groq {} failed: {} — trying next", model, e.getMessage());
            }
        }
        return null;
    }

    // ── OpenAI ────────────────────────────────────────────────────────────────

    private String callOpenAI(String systemPrompt, String userMessage) {
        for (String model : OPENAI_MODELS) {
            try {
                ObjectNode root = mapper.createObjectNode();
                root.put("model", model);
                root.put("temperature", 0.7);
                root.put("max_tokens",  8192);

                ArrayNode messages = root.putArray("messages");
                messages.addObject().put("role", "system").put("content", systemPrompt);
                messages.addObject().put("role", "user")  .put("content", userMessage);

                String body = mapper.writeValueAsString(root);

                Request req = new Request.Builder()
                    .url(OPENAI_URL)
                    .header("Authorization", "Bearer " + openaiKey)
                    .post(RequestBody.create(body, MediaType.parse("application/json")))
                    .build();

                try (Response resp = http.newCall(req).execute()) {
                    String respBody = resp.body() != null ? resp.body().string() : "";
                    if (resp.isSuccessful()) {
                        JsonNode json = mapper.readTree(respBody);
                        String text = json.at("/choices/0/message/content").asText("");
                        if (!text.isBlank()) {
                            log.debug("OpenAI response via {}", model);
                            return text;
                        }
                    }
                    int code = resp.code();
                    if (code == 429 || code == 503) {
                        log.warn("OpenAI {} returned {} — trying next model", model, code);
                        continue;
                    }
                    log.error("OpenAI {} error {}: {}", model, code, respBody);
                    return null;
                }
            } catch (Exception e) {
                log.warn("OpenAI {} failed: {} — trying next", model, e.getMessage());
            }
        }
        return null;
    }

    // ── Gemini ────────────────────────────────────────────────────────────────

    private String callGemini(String systemPrompt, String userMessage) {
        String body = buildGeminiBody(systemPrompt, userMessage);

        for (String model : GEMINI_MODELS) {
            String url = String.format(GEMINI_BASE, model) + "?key=" + geminiKey;
            try {
                Request req = new Request.Builder()
                    .url(url)
                    .post(RequestBody.create(body, MediaType.parse("application/json")))
                    .build();

                try (Response resp = http.newCall(req).execute()) {
                    String respBody = resp.body() != null ? resp.body().string() : "";
                    if (resp.isSuccessful()) {
                        JsonNode json = mapper.readTree(respBody);
                        String text = json.at("/candidates/0/content/parts/0/text").asText("");
                        if (!text.isBlank()) {
                            log.debug("Gemini response via {}", model);
                            return text;
                        }
                    }
                    int code = resp.code();
                    if (code == 429 || code == 503 || code == 404) {
                        log.warn("Gemini {} returned {} — trying next", model, code);
                        continue;
                    }
                    log.error("Gemini {} error {}: {}", model, code, respBody);
                    return null;
                }
            } catch (Exception e) {
                log.warn("Gemini {} failed: {} — trying next", model, e.getMessage());
            }
        }
        return null;
    }

    private String buildGeminiBody(String systemPrompt, String userMessage) {
        try {
            ObjectNode root = mapper.createObjectNode();
            root.putObject("system_instruction")
                .putArray("parts").addObject().put("text", systemPrompt);
            root.putArray("contents")
                .addObject().put("role", "user")
                .putArray("parts").addObject().put("text", userMessage);
            ObjectNode cfg = root.putObject("generationConfig");
            cfg.put("temperature",     0.7);
            cfg.put("maxOutputTokens", 8192);
            cfg.putObject("thinkingConfig").put("thinkingBudget", 0);
            return mapper.writeValueAsString(root);
        } catch (Exception e) {
            return "{}";
        }
    }
}
