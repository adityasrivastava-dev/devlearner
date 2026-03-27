package com.learnsystem.service;

import com.learnsystem.dto.SeedBatchRequest;
import com.learnsystem.dto.SeedBatchRequest.*;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.regex.*;

/**
 * Phase 2 — PDF Import Service
 * Extracts chapters/sections from DSA/Java books
 * and maps them to the SeedBatch topic structure.
 */
@Service
@Slf4j
public class PdfImportService {

// Chapter patterns: "Chapter 1", "1.", "CHAPTER ONE", "1 Arrays", etc.
private static final Pattern CHAPTER_PATTERN = Pattern.compile(
		"(?i)^\\s*(chapter\\s+\\d+|\\d+\\.\\d*\\s+[A-Z]|\\d+\\s+[A-Z][A-Za-z]|[IVX]+\\.\\s+[A-Z])",
		Pattern.MULTILINE
);

private static final Pattern SECTION_PATTERN = Pattern.compile(
		"^\\s*(\\d+\\.\\d+\\.?\\s+[A-Z][A-Za-z].{3,50}|[A-Z][A-Z ]{4,30})\\s*$",
		Pattern.MULTILINE
);

// Known DSA/Java topic keywords to identify section type
private static final List<String> DSA_KEYWORDS = List.of(
		"array", "string", "linked list", "stack", "queue", "tree", "graph",
		"hash", "heap", "sort", "search", "dynamic programming", "recursion",
		"greedy", "backtracking", "two pointer", "sliding window", "trie",
		"segment tree", "binary search", "bfs", "dfs", "dijkstra"
);

private static final List<String> JAVA_KEYWORDS = List.of(
		"class", "object", "interface", "inheritance", "polymorphism",
		"abstraction", "encapsulation", "generics", "lambda", "stream",
		"collection", "exception", "thread", "concurrency", "jvm"
);

// ── Main entry point ──────────────────────────────────────────────────────

public PdfImportResult importPdf(MultipartFile file, String defaultCategory) throws IOException {
	log.info("Importing PDF: {} ({} bytes)", file.getOriginalFilename(), file.getSize());

	String fullText;
	try (PDDocument doc = Loader.loadPDF(file.getBytes())) {
		PDFTextStripper stripper = new PDFTextStripper();
		stripper.setSortByPosition(true);
		fullText = stripper.getText(doc);
		log.info("Extracted {} chars from {} pages", fullText.length(), doc.getNumberOfPages());
	}

	List<Section> sections = extractSections(fullText);
	log.info("Found {} sections", sections.size());

	List<TopicSeedDto> topics = sections.stream()
			.filter(s -> s.content.length() > 200) // skip tiny sections
			.map(s -> sectionToTopic(s, defaultCategory))
			.toList();

	SeedBatchRequest batch = new SeedBatchRequest();
	batch.setBatchName("PDF Import — " + file.getOriginalFilename());
	batch.setSkipExisting(true);
	batch.setTopics(topics);

	return new PdfImportResult(
			file.getOriginalFilename(),
			fullText.length(),
			sections.size(),
			topics.size(),
			batch
	);
}

// ── Section extraction ────────────────────────────────────────────────────

private List<Section> extractSections(String text) {
	List<Section> sections = new ArrayList<>();
	String[] lines = text.split("\n");

	String currentTitle = null;
	StringBuilder currentContent = new StringBuilder();

	for (String line : lines) {
		if (isChapterOrSection(line)) {
			// Save previous section
			if (currentTitle != null && currentContent.length() > 100) {
				sections.add(new Section(cleanTitle(currentTitle), currentContent.toString().trim()));
			}
			currentTitle   = line.trim();
			currentContent = new StringBuilder();
		} else if (currentTitle != null) {
			currentContent.append(line).append("\n");
			// Limit content to first 2000 chars (intro + first code block)
			if (currentContent.length() > 3000) {
				currentContent.setLength(2000);
			}
		}
	}
	// Save last section
	if (currentTitle != null && currentContent.length() > 100) {
		sections.add(new Section(cleanTitle(currentTitle), currentContent.toString().trim()));
	}
	return sections;
}

private boolean isChapterOrSection(String line) {
	String trimmed = line.trim();
	if (trimmed.length() < 3 || trimmed.length() > 80) return false;
	return CHAPTER_PATTERN.matcher(trimmed).find()
			|| SECTION_PATTERN.matcher(trimmed).find();
}

private String cleanTitle(String title) {
	return title.trim()
			.replaceAll("^\\d+\\.?\\s*", "")      // remove leading numbers
			.replaceAll("(?i)^chapter\\s*\\d+:?\\s*", "") // remove "Chapter X:"
			.trim();
}

// ── Topic builder from extracted section ─────────────────────────────────

private TopicSeedDto sectionToTopic(Section section, String defaultCategory) {
	TopicSeedDto dto = new TopicSeedDto();
	dto.setTitle(toTitleCase(section.title));

	// Detect category from content
	String category = detectCategory(section.title + " " + section.content, defaultCategory);
	dto.setCategory(category);

	// Extract description — first 2 meaningful sentences
	dto.setDescription(extractDescription(section.content));

	// Extract time complexity if mentioned
	dto.setTimeComplexity(extractComplexity(section.content, "time"));
	dto.setSpaceComplexity(extractComplexity(section.content, "space"));

	// Extract any code block as starter code
	dto.setStarterCode(extractCode(section.content));

	// Set approach hints from content
	dto.setWhenToUse(extractWhenToUse(section.title));
	dto.setBruteForce("Brute force approach — see content above for optimized solution");
	dto.setOptimizedApproach("Apply " + dto.getTitle() + " — extracted from: " + section.title);

	// No auto-generated examples/problems from PDF — admin can use generator for those
	dto.setExamples(List.of());
	dto.setProblems(List.of());

	return dto;
}

// ── Content extractors ────────────────────────────────────────────────────

private String detectCategory(String text, String defaultCategory) {
	String t = text.toLowerCase();
	long dsaScore  = DSA_KEYWORDS.stream().filter(t::contains).count();
	long javaScore = JAVA_KEYWORDS.stream().filter(t::contains).count();
	if (dsaScore > javaScore) return "DSA";
	if (javaScore > dsaScore) return "JAVA";
	return defaultCategory.toUpperCase();
}

private String extractDescription(String content) {
	String[] sentences = content.split("[.!?]");
	StringBuilder desc = new StringBuilder();
	int count = 0;
	for (String s : sentences) {
		String clean = s.trim().replaceAll("\\s+", " ");
		if (clean.length() > 20 && !clean.startsWith("//") && !clean.contains("{")) {
			if (desc.length() > 0) desc.append(". ");
			desc.append(clean);
			if (++count >= 2) break;
		}
	}
	return desc.length() > 10 ? desc.toString() : "Extracted from PDF — edit to refine description.";
}

private String extractComplexity(String content, String type) {
	Pattern p = Pattern.compile(
			"(?i)" + type + "\\s*(?:complexity)?\\s*:?\\s*O\\([^)]+\\)",
			Pattern.CASE_INSENSITIVE
	);
	Matcher m = p.matcher(content);
	if (m.find()) {
		String found = m.group().replaceAll("(?i)" + type + "\\s*(?:complexity)?\\s*:?\\s*", "");
		return found.trim();
	}
	return null;
}

private String extractCode(String content) {
	// Look for indented blocks or Java-looking code
	Pattern codeBlock = Pattern.compile("(?m)^( {4,}|\\t)[^\\n]{5,}(?:\\n(?:[ \\t][^\\n]*|\\s*))*");
	Matcher m = codeBlock.matcher(content);
	if (m.find()) {
		String code = m.group().trim();
		if (code.length() > 20 && code.length() < 1000) {
			return "// Extracted from PDF:\n" + code;
		}
	}
	return "// TODO: Add starter code for this topic\npublic class Main {\n    public static void main(String[] args) {\n        // implement\n    }\n}";
}

private String extractWhenToUse(String title) {
	String t = title.toLowerCase();
	for (String kw : DSA_KEYWORDS) {
		if (t.contains(kw)) return "Use " + title + " when the problem involves " + kw + " operations";
	}
	return "Apply " + title + " when the problem structure matches this concept";
}

private String toTitleCase(String text) {
	if (text == null || text.isBlank()) return text;
	String[] words = text.toLowerCase().split("\\s+");
	StringBuilder sb = new StringBuilder();
	for (String w : words) {
		if (!w.isEmpty()) {
			if (sb.length() > 0) sb.append(' ');
			sb.append(Character.toUpperCase(w.charAt(0))).append(w.substring(1));
		}
	}
	return sb.toString();
}

// ── Inner types ────────────────────────────────────────────────────────────

public record Section(String title, String content) {}

public record PdfImportResult(
		String filename,
		int    charCount,
		int    sectionsFound,
		int    topicsCreated,
		SeedBatchRequest batch
) {}
}