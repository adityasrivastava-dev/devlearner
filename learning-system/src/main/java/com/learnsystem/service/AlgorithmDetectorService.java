package com.learnsystem.service;

import org.springframework.stereotype.Service;

/**
 * Phase 1 — Algorithm Detector.
 *
 * Analyses submitted Java source code using static pattern matching
 * (NO external API, NO LLM — must stay < 200 ms per the master plan).
 *
 * Returns a DetectionResult containing:
 *  - pattern         — canonical name e.g. "TWO_POINTER"
 *  - label           — display name e.g. "Two Pointer"
 *  - explanation     — why we detected it
 *  - optimizationNote — suggestion if a better approach exists
 */
@Service
public class AlgorithmDetectorService {

public record DetectionResult(
		String pattern,
		String label,
		String explanation,
		String optimizationNote
) {}

public DetectionResult detect(String code) {
	if (code == null || code.isBlank()) return unknown();

	String c = code.toLowerCase();

	// ── Two Pointer ───────────────────────────────────────────────────────
	if (hasTwoPointer(c)) {
		return new DetectionResult(
				"TWO_POINTER", "Two Pointer",
				"Your code uses two index variables (left/right or i/j) that move toward each other or in the same direction — the Two Pointer pattern.",
				null
		);
	}

	// ── Sliding Window ────────────────────────────────────────────────────
	if (hasSlidingWindow(c)) {
		return new DetectionResult(
				"SLIDING_WINDOW", "Sliding Window",
				"Your code maintains a running window (windowSum, maxWindow, or similar) that expands and contracts — the Sliding Window pattern.",
				null
		);
	}

	// ── Binary Search ──────────────────────────────────────────────────────
	if (hasBinarySearch(c)) {
		return new DetectionResult(
				"BINARY_SEARCH", "Binary Search",
				"Your code divides the search space in half each iteration using mid = (low + high) / 2 — the Binary Search pattern.",
				null
		);
	}

	// ── HashMap / Hashing ─────────────────────────────────────────────────
	if (hasHashMap(c)) {
		String opt = hasNestedLoop(c)
				? "You also have nested loops — consider if the HashMap alone can eliminate one of them and bring complexity down to O(n)."
				: null;
		return new DetectionResult(
				"HASH_MAP", "HashMap / Hashing",
				"Your code uses a HashMap or HashSet for O(1) lookup — a Hashing pattern.",
				opt
		);
	}

	// ── Recursion / Divide & Conquer ──────────────────────────────────────
	if (hasRecursion(c)) {
		String opt = !c.contains("memo") && !c.contains("dp[") && !c.contains("cache")
				? "Your recursive solution may have overlapping subproblems. Consider memoization to reduce repeated work."
				: null;
		return new DetectionResult(
				"RECURSION", "Recursion",
				"Your code calls itself — a Recursive approach. Check for a base case and that the recursive call reduces the problem size.",
				opt
		);
	}

	// ── Dynamic Programming ───────────────────────────────────────────────
	if (hasDynamicProgramming(c)) {
		return new DetectionResult(
				"DYNAMIC_PROGRAMMING", "Dynamic Programming",
				"Your code builds up results using a DP table (dp[]) or memoization map — a Dynamic Programming pattern.",
				null
		);
	}

	// ── BFS ───────────────────────────────────────────────────────────────
	if (hasBFS(c)) {
		return new DetectionResult(
				"BFS", "Breadth-First Search",
				"Your code uses a Queue to process nodes level by level — the BFS pattern.",
				null
		);
	}

	// ── DFS ───────────────────────────────────────────────────────────────
	if (hasDFS(c)) {
		return new DetectionResult(
				"DFS", "Depth-First Search",
				"Your code uses a Stack or recursive calls to explore depth-first — the DFS pattern.",
				null
		);
	}

	// ── Greedy ────────────────────────────────────────────────────────────
	if (hasGreedy(c)) {
		return new DetectionResult(
				"GREEDY", "Greedy",
				"Your code sorts the input and makes locally optimal choices at each step — a Greedy pattern.",
				null
		);
	}

	// ── Prefix Sum ────────────────────────────────────────────────────────
	if (hasPrefixSum(c)) {
		return new DetectionResult(
				"PREFIX_SUM", "Prefix Sum",
				"Your code precomputes cumulative sums — the Prefix Sum pattern. Range queries become O(1) after O(n) build.",
				null
		);
	}

	// ── Brute Force (nested loops, no smarter structure) ──────────────────
	if (hasNestedLoop(c)) {
		return new DetectionResult(
				"BRUTE_FORCE", "Brute Force (Nested Loops)",
				"Your code uses nested loops — an O(n²) Brute Force approach.",
				"Nested loops are often replaceable with a HashMap (O(n)) or Two Pointer (O(n)) approach. Check the Optimize tab."
		);
	}

	return unknown();
}

// ── Pattern detectors ─────────────────────────────────────────────────────

private boolean hasTwoPointer(String c) {
	return (contains(c, "left", "right") || contains(c, "lo", "hi") ||
			contains(c, "start", "end") || contains(c, "i", "j") && c.contains("while"))
			&& !c.contains("queue") && !c.contains("bfs");
}

private boolean hasSlidingWindow(String c) {
	return c.contains("windowsum") || c.contains("window_sum") ||
			c.contains("maxwindow") || c.contains("currsum") ||
			(c.contains("window") && (c.contains("left") || c.contains("right")));
}

private boolean hasBinarySearch(String c) {
	return (c.contains("mid") && (c.contains("low") || c.contains("left")) &&
			(c.contains("high") || c.contains("right"))) ||
			c.contains("arrays.binarysearch") || c.contains("collections.binarysearch");
}

private boolean hasHashMap(String c) {
	return c.contains("hashmap") || c.contains("hashset") ||
			c.contains("linkedhashmap") || c.contains("treemap") ||
			c.contains("map.put") || c.contains("map.get") ||
			c.contains("set.add") || c.contains("set.contains");
}

private boolean hasRecursion(String c) {
	// Look for a method that calls itself — extract method name from common patterns
	// Simplified: check if code calls a method with same name mentioned multiple times
	// and has a base case return
	return (c.contains("return") && (
			c.contains("(n-1)") || c.contains("(n - 1)") ||
					c.contains("(i+1)") || c.contains("(i + 1)") ||
					c.contains("(idx+1)") || c.contains("(index+1)") ||
					c.contains("solve(") || c.contains("helper(") ||
					c.contains("dfs(") || c.contains("backtrack(") ||
					c.contains("recurse(")));
}

private boolean hasDynamicProgramming(String c) {
	return c.contains("dp[") || c.contains("memo[") ||
			c.contains("memo.put") || c.contains("cache.put") ||
			(c.contains("int[][]") && c.contains("for") && c.contains("return"));
}

private boolean hasBFS(String c) {
	return c.contains("queue") && (c.contains("linkedlist") || c.contains("arraydeque")) &&
			(c.contains("poll") || c.contains("offer") || c.contains("add")) &&
			c.contains("while");
}

private boolean hasDFS(String c) {
	return (c.contains("stack") && c.contains("push") && c.contains("pop")) ||
			(c.contains("deque") && c.contains("push") && c.contains("pop"));
}

private boolean hasGreedy(String c) {
	return c.contains("arrays.sort") || c.contains("collections.sort") &&
			c.contains("for") && !c.contains("dp[");
}

private boolean hasPrefixSum(String c) {
	return c.contains("prefix") || c.contains("presum") ||
			c.contains("cumulative") ||
			(c.contains("sum[i]") && c.contains("sum[i-1]")) ||
			(c.contains("prefix[i]") || c.contains("prefix[i-1]"));
}

private boolean hasNestedLoop(String c) {
	// Count 'for' occurrences — two or more nested = O(n²)
	int count = 0, idx = 0;
	while ((idx = c.indexOf("for (", idx)) != -1) { count++; idx++; }
	idx = 0;
	while ((idx = c.indexOf("for(", idx)) != -1) { count++; idx++; }
	return count >= 2;
}

private boolean contains(String c, String... tokens) {
	for (String t : tokens) if (!c.contains(t)) return false;
	return true;
}

private DetectionResult unknown() {
	return new DetectionResult("UNKNOWN", "Custom Approach",
			"We could not automatically detect a named pattern. Review the Optimize tab for common approaches.",
			null);
}
}