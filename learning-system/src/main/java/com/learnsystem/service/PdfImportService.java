package com.learnsystem.service;

import com.learnsystem.dto.SeedBatchRequest;
import com.learnsystem.dto.SeedBatchRequest.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.interactive.documentnavigation.outline.PDDocumentOutline;
import org.apache.pdfbox.pdmodel.interactive.documentnavigation.outline.PDOutlineItem;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.regex.*;
import java.util.stream.Collectors;

/**
 * Phase 2 — PDF Import Service
 *
 * Strategy (in priority order):
 *   1. PDF Outline/Bookmarks  — most books have a proper outline (PDDocumentOutline)
 *   2. Table of Contents page — scan first 15 pages for "Contents"/"Index" heading
 *   3. Chapter heading scan   — regex match on chapter/section headings in full text
 *
 * Each detected chapter → TopicSeedDto (title + category detected from name)
 * Admin reviews suggestions → clicks Save → imports into DB
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PdfImportService {

// ── Known DSA / Java keywords for category detection ─────────────────────
private static final Set<String> DSA_WORDS = Set.of(
		"array","string","linked list","stack","queue","tree","binary","graph",
		"hash","heap","sort","search","dynamic","recursion","greedy","backtrack",
		"two pointer","sliding","trie","segment","bfs","dfs","dijkstra","dp","knapsack",
		"prefix","suffix","palindrome","subsequence","subarray","matrix","grid"
);
private static final Set<String> JAVA_WORDS = Set.of(
		"class","object","oop","inherit","polymorphi","abstract","interface",
		"encapsul","generic","lambda","stream","collection","exception","thread",
		"concurr","executor","jvm","gc","garbage","design pattern","solid",
		"annotation","reflection","optional","functional","builder","singleton"
);

// ── TOC line pattern ───────────────────────────────────────────────────────
// Matches lines like:  "1. Arrays .................. 12"
//                      "Chapter 3: Sorting Algorithms"
//                      "2.4 Hash Maps"
private static final Pattern TOC_LINE = Pattern.compile(
		"^\\s*(?:chapter\\s+)?([\\dIVXivx]+[.:]?\\s+)(.{3,60})(?:\\s*[.\\s]{3,}\\s*\\d+)?\\s*$",
		Pattern.CASE_INSENSITIVE
);

// ── Chapter heading pattern (fallback) ────────────────────────────────────
private static final Pattern CHAPTER_HEADING = Pattern.compile(
		"(?m)^\\s*(?:chapter\\s+[\\dIVX]+\\s*[:\\-–]?\\s*)(.{3,70})$",
		Pattern.CASE_INSENSITIVE
);

// ══════════════════════════════════════════════════════════════════════════
//  PUBLIC API
// ══════════════════════════════════════════════════════════════════════════

public PdfImportResult importPdf(MultipartFile file, String defaultCategory) throws IOException {
	log.info("Parsing PDF: {} ({} KB)", file.getOriginalFilename(), file.getSize() / 1024);

	List<String> topicTitles = new ArrayList<>();
	int totalPages = 0;
	String method = "unknown";

	try (PDDocument doc = Loader.loadPDF(file.getBytes())) {
		totalPages = doc.getNumberOfPages();
		log.info("PDF has {} pages", totalPages);

		// ── Strategy 1: PDF built-in outline (bookmarks) ─────────────────
		PDDocumentOutline outline = doc.getDocumentCatalog().getDocumentOutline();
		if (outline != null) {
			List<String> fromOutline = extractFromOutline(outline);
			if (fromOutline.size() >= 3) {
				topicTitles = fromOutline;
				method = "PDF outline/bookmarks";
				log.info("Outline found: {} entries", topicTitles.size());
			}
		}

		// ── Strategy 2: Table of Contents page ───────────────────────────
		if (topicTitles.isEmpty()) {
			List<String> fromToc = extractFromTocPage(doc);
			if (fromToc.size() >= 3) {
				topicTitles = fromToc;
				method = "table of contents page";
				log.info("TOC page found: {} entries", topicTitles.size());
			}
		}

		// ── Strategy 3: Chapter heading scan ─────────────────────────────
		if (topicTitles.isEmpty()) {
			topicTitles = extractFromHeadings(doc);
			method = "chapter heading scan";
			log.info("Heading scan found: {} entries", topicTitles.size());
		}
	}

	// Deduplicate, clean, filter noise
	topicTitles = topicTitles.stream()
			.map(this::cleanTitle)
			.filter(t -> t.length() >= 4 && t.length() <= 80)
			.filter(t -> !isNoise(t))
			.distinct()
			.collect(Collectors.toList());

	log.info("Final topics after cleaning: {}", topicTitles.size());

	// Build SeedBatch from topic titles
	List<TopicSeedDto> topics = topicTitles.stream()
			.map(title -> buildTopicFromTitle(title, defaultCategory))
			.collect(Collectors.toList());

	SeedBatchRequest batch = new SeedBatchRequest();
	batch.setBatchName("PDF: " + file.getOriginalFilename());
	batch.setSkipExisting(true);
	batch.setTopics(topics);

	return new PdfImportResult(
			file.getOriginalFilename(), totalPages, method,
			topicTitles.size(), topics, batch
	);
}

// ══════════════════════════════════════════════════════════════════════════
//  STRATEGY 1 — PDF OUTLINE (BOOKMARKS)
// ══════════════════════════════════════════════════════════════════════════

private List<String> extractFromOutline(PDDocumentOutline outline) {
	List<String> titles = new ArrayList<>();
	PDOutlineItem item = outline.getFirstChild();
	while (item != null) {
		String title = item.getTitle();
		if (title != null && !title.isBlank()) {
			titles.add(title.trim());
			// Include one level of children (sections)
			PDOutlineItem child = item.getFirstChild();
			int childCount = 0;
			while (child != null && childCount < 20) {
				String ct = child.getTitle();
				if (ct != null && !ct.isBlank()) titles.add("  " + ct.trim());
				child = child.getNextSibling();
				childCount++;
			}
		}
		item = item.getNextSibling();
	}
	return titles;
}

// ══════════════════════════════════════════════════════════════════════════
//  STRATEGY 2 — TABLE OF CONTENTS PAGE
// ══════════════════════════════════════════════════════════════════════════

private List<String> extractFromTocPage(PDDocument doc) throws IOException {
	PDFTextStripper stripper = new PDFTextStripper();
	stripper.setSortByPosition(true);
	int pagesToScan = Math.min(20, doc.getNumberOfPages());

	for (int page = 1; page <= pagesToScan; page++) {
		stripper.setStartPage(page);
		stripper.setEndPage(page);
		String text = stripper.getText(doc);

		// Check if this page looks like a TOC
		String lower = text.toLowerCase();
		if (!lower.contains("content") && !lower.contains("index") &&
				!lower.contains("chapter") && !lower.contains("table of")) continue;

		List<String> found = parseTocLines(text);
		if (found.size() >= 3) return found;
	}
	return Collections.emptyList();
}

private List<String> parseTocLines(String text) {
	List<String> titles = new ArrayList<>();
	String[] lines = text.split("\n");

	for (String line : lines) {
		line = line.trim();
		if (line.isEmpty()) continue;

		// Skip common TOC header noise
		if (line.matches("(?i)(contents|table of contents|index|page)")) continue;

		Matcher m = TOC_LINE.matcher(line);
		if (m.matches()) {
			String title = m.group(2).trim();
			// Remove trailing dots and page numbers
			title = title.replaceAll("[.\\s]+$", "").replaceAll("\\s*\\d+$", "").trim();
			if (title.length() >= 3) titles.add(title);
		}
	}
	return titles;
}

// ══════════════════════════════════════════════════════════════════════════
//  STRATEGY 3 — CHAPTER HEADING SCAN
// ══════════════════════════════════════════════════════════════════════════

private List<String> extractFromHeadings(PDDocument doc) throws IOException {
	PDFTextStripper stripper = new PDFTextStripper();
	stripper.setSortByPosition(true);
	// Only scan first 40% of book — headings cluster early
	int endPage = Math.min(doc.getNumberOfPages(), Math.max(20, doc.getNumberOfPages() * 2 / 5));
	stripper.setEndPage(endPage);
	String text = stripper.getText(doc);

	List<String> titles = new ArrayList<>();
	Matcher m = CHAPTER_HEADING.matcher(text);
	while (m.find()) {
		titles.add(m.group(1).trim());
	}
	// Also try numbered sections: "1. Arrays", "2. Strings"
	Pattern numbered = Pattern.compile("(?m)^\\s*(\\d+)\\.\\s+([A-Z][A-Za-z &()/\\-]{3,50})\\s*$");
	Matcher nm = numbered.matcher(text);
	while (nm.find()) {
		titles.add(nm.group(2).trim());
	}
	return titles;
}

// ══════════════════════════════════════════════════════════════════════════
//  TOPIC BUILDER
// ══════════════════════════════════════════════════════════════════════════

private TopicSeedDto buildTopicFromTitle(String title, String defaultCategory) {
	TopicSeedDto dto = new TopicSeedDto();
	dto.setTitle(title.startsWith("  ") ? title.trim() : toTitleCase(title));
	dto.setCategory(detectCategory(title, defaultCategory));
	dto.setDescription(buildDescription(title));
	dto.setTimeComplexity(guessComplexity(title));
	dto.setWhenToUse("Apply " + title + " when the problem structure matches");
	dto.setBruteForce("Start with brute force, then optimize");
	dto.setOptimizedApproach("See examples and problems for optimized patterns");
	dto.setStarterCode(buildStarterCode(title));
	dto.setExamples(Collections.emptyList());
	dto.setProblems(Collections.emptyList());
	return dto;
}

private String detectCategory(String title, String defaultCategory) {
	String t = title.toLowerCase();
	long dsaScore  = DSA_WORDS.stream().filter(t::contains).count();
	long javaScore = JAVA_WORDS.stream().filter(t::contains).count();
	if (dsaScore > javaScore) return "DSA";
	if (javaScore > dsaScore) return "JAVA";
	return defaultCategory.toUpperCase();
}

private String buildDescription(String title) {
	String t = title.toLowerCase();
	if (t.contains("array"))    return "Arrays provide O(1) random access. Master two-pointer, prefix sum, and sliding window patterns.";
	if (t.contains("string"))   return "String manipulation — sliding window, frequency maps, and StringBuilder for efficient construction.";
	if (t.contains("tree"))     return "Tree traversal with DFS (recursive) and BFS (queue). Return values propagate info up the tree.";
	if (t.contains("graph"))    return "Graph traversal — BFS for shortest path, DFS for components and cycle detection.";
	if (t.contains("dynamic") || t.contains(" dp")) return "Dynamic programming — identify overlapping subproblems, build bottom-up table.";
	if (t.contains("sort"))     return "Sorting algorithms — know when to use merge sort (stable), quick sort (in-place), counting sort (integer range).";
	if (t.contains("hash"))     return "Hash maps provide O(1) average lookup. Use for frequency counting, caching, and complement search.";
	if (t.contains("stack"))    return "Stack (LIFO) — monotonic stack for next greater element, valid parentheses, expression evaluation.";
	if (t.contains("queue"))    return "Queue (FIFO) — BFS traversal, sliding window maximum, task scheduling.";
	if (t.contains("heap") || t.contains("priority")) return "Heap/PriorityQueue — O(log n) insert/remove. Min-heap for kth largest, max-heap for kth smallest.";
	if (t.contains("recur"))    return "Recursion — define base case, reduce problem, combine results. Add memoization for overlapping subproblems.";
	if (t.contains("greedy"))   return "Greedy — make locally optimal choice at each step. Prove correctness: no future choice can improve the decision.";
	if (t.contains("class") || t.contains("oop")) return "Object-oriented programming — encapsulation, inheritance, polymorphism, abstraction.";
	return "Master " + title + " with targeted examples and practice problems.";
}

private String guessComplexity(String title) {
	String t = title.toLowerCase();
	if (t.contains("binary search"))   return "O(log n)";
	if (t.contains("hash"))            return "O(1) average";
	if (t.contains("sort"))            return "O(n log n)";
	if (t.contains("dynamic") || t.contains(" dp")) return "O(n²) typical";
	if (t.contains("tree") || t.contains("graph"))  return "O(n)";
	return "O(n) typical";
}

private String buildStarterCode(String title) {
	String t = title.toLowerCase();
	if (t.contains("tree"))
		return "import java.util.*;\npublic class Main {\n    static class TreeNode {\n        int val; TreeNode left, right;\n        TreeNode(int v) { val = v; }\n    }\n    public static void main(String[] args) {\n        // Build and traverse tree\n    }\n}";
	if (t.contains("graph"))
		return "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        int n = 5;\n        List<List<Integer>> adj = new ArrayList<>();\n        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());\n        // Add edges and traverse\n    }\n}";
	return "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // TODO: implement " + title + "\n        System.out.println(0);\n    }\n}";
}

// ══════════════════════════════════════════════════════════════════════════
//  UTILS
// ══════════════════════════════════════════════════════════════════════════

private String cleanTitle(String raw) {
	return raw.trim()
			.replaceAll("^[\\d]+[.):\\s]+", "")     // remove leading "1." "2:" etc
			.replaceAll("(?i)^chapter\\s+\\d+\\s*[:\\-–]?\\s*", "")
			.replaceAll("[.…]+$", "")                // trailing dots
			.replaceAll("\\s{2,}", " ")
			.trim();
}

private boolean isNoise(String title) {
	String t = title.toLowerCase().trim();
	// Skip common non-topic strings
	return t.matches("(contents|index|preface|introduction|appendix|bibliography|references|about|foreword|acknowledgement.*|page|part [ivx\\d]+)") ||
			t.length() < 3 || t.matches("\\d+") || t.matches("[ivxlcdm]+");
}

private String toTitleCase(String text) {
	if (text == null || text.isBlank()) return text;
	String[] words = text.trim().split("\\s+");
	StringBuilder sb = new StringBuilder();
	String[] smallWords = {"a","an","the","and","but","or","for","nor","on","at","to","by","in","of","up"};
	Set<String> small = new HashSet<>(Arrays.asList(smallWords));
	for (int i = 0; i < words.length; i++) {
		String w = words[i];
		if (sb.length() > 0) sb.append(' ');
		if (i == 0 || !small.contains(w.toLowerCase())) {
			sb.append(Character.toUpperCase(w.charAt(0))).append(w.substring(1).toLowerCase());
		} else {
			sb.append(w.toLowerCase());
		}
	}
	return sb.toString();
}

// ── Result record ─────────────────────────────────────────────────────────
public record PdfImportResult(
		String              filename,
		int                 totalPages,
		String              detectionMethod,
		int                 topicCount,
		List<TopicSeedDto>  topics,
		SeedBatchRequest    batch
) {}
}