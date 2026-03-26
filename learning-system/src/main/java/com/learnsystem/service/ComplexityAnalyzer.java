package com.learnsystem.service;

import com.learnsystem.dto.ComplexityResponse;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.*;

/**
 * Static code analysis to estimate Time & Space complexity.
 *
 * Strategy — rule-based pattern matching (same approach used by many linters):
 *   1. Strip comments and string literals (avoid false positives)
 *   2. Measure loop nesting depth → O(n^k)
 *   3. Detect recursion + divide-and-conquer → O(log n) or O(n log n)
 *   4. Detect sorting calls → O(n log n)
 *   5. Detect binary search pattern → O(log n)
 *   6. Detect data structure usage for space
 *   7. Map patterns to Big-O with explanation
 */
@Service
public class ComplexityAnalyzer {

    // ── Public API ────────────────────────────────────────────────────────────

    public ComplexityResponse analyze(String code) {
        if (code == null || code.isBlank()) {
            return unknown();
        }

        String clean = stripCommentsAndStrings(code);

        TimeResult  time  = analyzeTime(clean);
        SpaceResult space = analyzeSpace(clean);

        return ComplexityResponse.builder()
                .timeComplexity(time.notation)
                .spaceComplexity(space.notation)
                .timeExplanation(time.explanation)
                .spaceExplanation(space.explanation)
                .confidence(time.confidence)
                .detectedPatterns(time.patterns)
                .dominantPattern(time.patterns.isEmpty() ? "Linear scan" : time.patterns.get(0))
                .build();
    }

    // ── Time Complexity Analysis ──────────────────────────────────────────────

    private TimeResult analyzeTime(String code) {
        List<String> patterns = new ArrayList<>();

        // ── 1. Binary search exact pattern ────────────────────────────
        if (isBinarySearch(code)) {
            patterns.add("Binary search (lo/hi/mid halving)");
            return new TimeResult("O(log n)", "Binary search halves the search space on each step.",
                    "HIGH", patterns);
        }

        // ── 2. Divide and conquer recursion (mergesort / quicksort shape) ──
        if (isDivideAndConquer(code)) {
            patterns.add("Divide & conquer recursion");
            if (hasSortingCall(code)) {
                patterns.add("Sort call");
                return new TimeResult("O(n log n)",
                        "Divide-and-conquer splits input in half and sorts each half.", "HIGH", patterns);
            }
            return new TimeResult("O(n log n)",
                    "Recursive divide-and-conquer — T(n) = 2T(n/2) + O(n) by Master theorem.", "MEDIUM", patterns);
        }

        // ── 3. Sort call alone ─────────────────────────────────────────
        if (hasSortingCall(code)) {
            patterns.add("Sorting (Arrays.sort / Collections.sort)");
            int loopDepth = maxLoopDepth(code);
            if (loopDepth >= 2) {
                patterns.add(loopDepth + "-level nested loop");
                return new TimeResult("O(n² log n)",
                        "Sort O(n log n) inside a nested loop O(n²).", "MEDIUM", patterns);
            }
            if (loopDepth == 1) {
                return new TimeResult("O(n log n)",
                        "Sorting dominates the linear pass over the data.", "HIGH", patterns);
            }
            return new TimeResult("O(n log n)", "Arrays.sort / Collections.sort uses Timsort.", "HIGH", patterns);
        }

        // ── 4. Loop nesting depth ──────────────────────────────────────
        int depth = maxLoopDepth(code);

        if (depth >= 4) {
            patterns.add(depth + "-level nested loop");
            return new TimeResult("O(n⁴) or worse",
                    depth + " nested loops each iterating over n elements.", "MEDIUM", patterns);
        }
        if (depth == 3) {
            patterns.add("Triple nested loop");
            return new TimeResult("O(n³)",
                    "Three nested loops — each iterates over the input size.", "HIGH", patterns);
        }
        if (depth == 2) {
            patterns.add("Double nested loop");
            // Check if inner loop is binary search / log
            if (hasInnerBinarySearch(code)) {
                patterns.add("Inner binary search");
                return new TimeResult("O(n log n)",
                        "Outer linear loop + inner binary search = n × log n.", "HIGH", patterns);
            }
            return new TimeResult("O(n²)",
                    "Two nested loops each scanning n elements = n × n operations.", "HIGH", patterns);
        }
        if (depth == 1) {
            patterns.add("Single loop");
            // Sliding window / two pointer are O(n) with a nested loop that doesn't re-scan
            if (isSlidingWindow(code)) {
                patterns.add("Sliding window");
                return new TimeResult("O(n)",
                        "Sliding window — each element is added and removed at most once.", "HIGH", patterns);
            }
            if (isTwoPointer(code)) {
                patterns.add("Two pointer");
                return new TimeResult("O(n)",
                        "Two pointers converge — together they traverse the array once.", "HIGH", patterns);
            }
            return new TimeResult("O(n)", "Single pass through the input.", "HIGH", patterns);
        }

        // ── 5. Pure recursion (no obvious divide) ──────────────────────
        if (hasRecursion(code)) {
            patterns.add("Recursion");
            if (hasMemoization(code)) {
                patterns.add("Memoization / DP table");
                int dpDims = dpDimensions(code);
                if (dpDims >= 2) {
                    return new TimeResult("O(n²)",
                            "2D DP memoization fills an n×m table.", "MEDIUM", patterns);
                }
                return new TimeResult("O(n)",
                        "Memoized recursion — each unique subproblem computed once.", "HIGH", patterns);
            }
            if (hasExponentialRecursion(code)) {
                patterns.add("Exponential branching (e.g. subset/permutation)");
                return new TimeResult("O(2ⁿ) or O(n!)",
                        "Recursive branching without memoization — exponential growth.", "MEDIUM", patterns);
            }
            return new TimeResult("O(n)",
                    "Linear recursion — one recursive call per level.", "MEDIUM", patterns);
        }

        // ── 6. No loops, no recursion ──────────────────────────────────
        if (depth == 0) {
            if (hasHashOperation(code) || hasMapOperation(code)) {
                patterns.add("HashMap / HashSet lookup");
                return new TimeResult("O(1)",
                        "Direct hash table lookup — constant time regardless of input size.", "HIGH", patterns);
            }
            patterns.add("Sequential statements");
            return new TimeResult("O(1)", "No loops or recursion — runs in constant time.", "HIGH", patterns);
        }

        return new TimeResult("O(n)", "Linear traversal of the input.", "LOW", patterns);
    }

    // ── Space Complexity Analysis ─────────────────────────────────────────────

    private SpaceResult analyzeSpace(String code) {
        List<String> reasons = new ArrayList<>();

        // 2D array / matrix
        if (has2DArray(code)) {
            reasons.add("2D array/DP table");
            return new SpaceResult("O(n²)", "2D array or DP table allocated proportional to n×m.");
        }

        // Recursion / call stack
        boolean recursive = hasRecursion(code);
        boolean memo      = hasMemoization(code);

        // Explicit n-sized allocation
        boolean hasNArray    = hasLinearArray(code);
        boolean hasDataStruc = hasHashOperation(code) || hasMapOperation(code) ||
                hasListAllocation(code) || hasQueueAllocation(code);

        if (recursive && memo) {
            reasons.add("Recursive call stack + memo table");
            return new SpaceResult("O(n)", "Memoization table + recursion call stack, each up to depth n.");
        }

        if (recursive) {
            reasons.add("Recursive call stack");
            if (isDivideAndConquer(code)) {
                return new SpaceResult("O(log n)", "Divide-and-conquer recursion stack depth is log n.");
            }
            return new SpaceResult("O(n)", "Recursion stack can grow up to n deep.");
        }

        if (hasNArray && hasDataStruc) {
            reasons.add("Array + HashMap/List");
            return new SpaceResult("O(n)", "Array and auxiliary data structure each proportional to n.");
        }

        if (hasNArray || hasDataStruc) {
            if (hasNArray) reasons.add("Array sized to input");
            if (hasDataStruc) reasons.add("HashMap / List / Queue");
            return new SpaceResult("O(n)", "Auxiliary data structure grows with input size.");
        }

        // Stack/Queue without obvious n sizing
        if (code.contains("Stack") || code.contains("Deque") || code.contains("ArrayDeque")) {
            reasons.add("Stack / Deque (worst case n elements)");
            return new SpaceResult("O(n)", "Stack or deque can hold up to n elements in the worst case.");
        }

        // Check if there's truly constant space
        if (!hasNArray && !hasDataStruc && !recursive) {
            // sliding window / two pointer pattern
            if (isSlidingWindow(code) || isTwoPointer(code)) {
                return new SpaceResult("O(1)", "Only a fixed number of pointer/index variables used.");
            }
            return new SpaceResult("O(1)", "No extra data structures — only a few scalar variables.");
        }

        return new SpaceResult("O(n)", "Auxiliary storage proportional to input size.");
    }

    // ── Pattern Detectors ─────────────────────────────────────────────────────

    /** Count maximum nesting depth of for/while loops */
    private int maxLoopDepth(String code) {
        // Walk char by char tracking brace depth and loop starts
        int maxDepth = 0, currentLoopDepth = 0;
        // Simplified: count { after loop keywords
        String[] lines = code.split("\n");
        int depth = 0;
        int loopDepthAtBrace = 0;

        // Stack-based approach: push loop context on {, pop on }
        Deque<Boolean> stack = new ArrayDeque<>(); // true = loop opened this brace

        Pattern loopPat = Pattern.compile("\\b(for|while)\\s*\\(");

        for (String line : lines) {
            String trimmed = line.trim();
            boolean isLoop = loopPat.matcher(trimmed).find()
                    && !trimmed.startsWith("//")
                    && !trimmed.contains("//"); // skip commented-out loops (rough)

            // Count { and } on this line
            for (char c : trimmed.toCharArray()) {
                if (c == '{') {
                    stack.push(isLoop);
                    isLoop = false; // only mark first brace of this loop
                    // Current loop depth = count of true values in stack
                    long ld = stack.stream().filter(b -> b).count();
                    if (ld > maxDepth) maxDepth = (int) ld;
                } else if (c == '}') {
                    if (!stack.isEmpty()) stack.pop();
                }
            }
        }
        return maxDepth;
    }

    private boolean isBinarySearch(String code) {
        // Must have lo/hi/mid pattern AND halving (mid = lo+(hi-lo)/2 or similar)
        boolean hasLo  = code.contains("lo") || code.contains("left")  || code.contains("start");
        boolean hasHi  = code.contains("hi") || code.contains("right") || code.contains("end");
        boolean hasMid = code.contains("mid");
        boolean hasHalving = code.contains("/2") || code.contains(">> 1") || code.contains(">>>1");
        boolean hasWhileOrLoop = Pattern.compile("while\\s*\\(\\s*(lo|left|start)\\s*<=?\\s*(hi|right|end)").matcher(code).find();
        return hasLo && hasHi && hasMid && hasHalving && hasWhileOrLoop;
    }

    private boolean hasInnerBinarySearch(String code) {
        // Has a loop AND binary search indicators suggesting inner log
        return maxLoopDepth(code) >= 1 && isBinarySearch(code);
    }

    private boolean isDivideAndConquer(String code) {
        // Recursion where argument is roughly halved: n/2, mid, arr.length/2
        if (!hasRecursion(code)) return false;
        return code.contains("/ 2") || code.contains("/2") || code.contains("mid")
                || code.contains(">> 1") || Pattern.compile("\\w+\\.length\\s*/\\s*2").matcher(code).find();
    }

    private boolean hasSortingCall(String code) {
        return code.contains("Arrays.sort") || code.contains("Collections.sort")
                || code.contains(".sort(") || code.contains("TreeSet") || code.contains("TreeMap");
    }

    private boolean isSlidingWindow(String code) {
        // window start + end expanding/shrinking, no O(n²) inner scan
        return (code.contains("windowStart") || code.contains("windowEnd")
                || code.contains("left") && code.contains("right")
                || code.contains("shrink") || code.contains("expand"))
                && maxLoopDepth(code) <= 1;
    }

    private boolean isTwoPointer(String code) {
        boolean hasLeftRight = (code.contains("left") || code.contains("l ")) &&
                (code.contains("right") || code.contains("r "));
        boolean hasConverge  = code.contains("l++") || code.contains("left++") ||
                code.contains("r--") || code.contains("right--");
        return hasLeftRight && hasConverge && maxLoopDepth(code) <= 1;
    }

    private boolean hasRecursion(String code) {
        // Look for a method calling itself: extract main method names and see if they appear in body
        // Heuristic: any method whose name appears again in its own body
        Pattern methodDef = Pattern.compile("(?:public|private|protected|static)\\s+\\S+\\s+(\\w+)\\s*\\(");
        Matcher m = methodDef.matcher(code);
        while (m.find()) {
            String name = m.group(1);
            if (name.equals("main")) continue;
            // Check if name appears again after its declaration
            int pos = m.end();
            String rest = code.substring(pos);
            if (rest.contains(name + "(")) return true;
        }
        return false;
    }

    private boolean hasMemoization(String code) {
        return code.contains("memo") || code.contains("dp[") || code.contains("cache")
                || code.contains("Map") && hasRecursion(code)
                || code.contains("int[][]") || code.contains("boolean[]");
    }

    private boolean hasExponentialRecursion(String code) {
        // Two+ recursive calls in same method (Fibonacci-like, subset enumeration)
        Pattern recurseCall = Pattern.compile("(\\w+)\\s*\\(");
        // Rough: count recursive-looking duplicate calls
        Pattern methodDef = Pattern.compile("(?:public|private|protected|static)\\s+\\S+\\s+(\\w+)\\s*\\(");
        Matcher defM = methodDef.matcher(code);
        while (defM.find()) {
            String name = defM.group(1);
            if (name.equals("main")) continue;
            int pos = defM.end();
            String body = extractMethodBody(code, pos);
            long callCount = Arrays.stream(body.split(name + "\\s*\\(", -1)).count() - 1;
            if (callCount >= 2) return true;
        }
        return false;
    }

    private int dpDimensions(String code) {
        if (code.contains("int[][]") || code.contains("boolean[][]") || code.contains("dp[i][j]")) return 2;
        if (code.contains("int[][][]") || code.contains("dp[i][j][k]")) return 3;
        return 1;
    }

    private boolean hasHashOperation(String code) {
        return code.contains("HashMap") || code.contains("HashSet") || code.contains("Hashtable")
                || code.contains("new HashMap") || code.contains("new HashSet");
    }

    private boolean hasMapOperation(String code) {
        return code.contains(".put(") || code.contains(".get(") || code.contains(".containsKey(")
                || code.contains(".getOrDefault(") || code.contains(".merge(");
    }

    private boolean hasLinearArray(String code) {
        // new int[n], new int[arr.length], new String[n], etc.
        return Pattern.compile("new\\s+\\w+\\[\\s*\\w+\\s*\\]").matcher(code).find()
                && !code.contains("new int[26]") // constant-size arrays don't count
                && !code.contains("new int[128]")
                && !code.contains("new int[256]");
    }

    private boolean has2DArray(String code) {
        return code.contains("[][]") || code.contains("int[][]") || code.contains("dp[i][j]")
                || Pattern.compile("new\\s+\\w+\\[\\w+\\]\\[\\w+\\]").matcher(code).find();
    }

    private boolean hasListAllocation(String code) {
        return code.contains("new ArrayList") || code.contains("new LinkedList")
                || code.contains("List<") && code.contains("new ");
    }

    private boolean hasQueueAllocation(String code) {
        return code.contains("new LinkedList") || code.contains("new PriorityQueue")
                || code.contains("new ArrayDeque") || code.contains("Queue<");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** Extract approximate method body starting at pos */
    private String extractMethodBody(String code, int pos) {
        if (pos >= code.length()) return "";
        int start = code.indexOf('{', pos);
        if (start < 0) return "";
        int depth = 1, i = start + 1;
        while (i < code.length() && depth > 0) {
            char c = code.charAt(i);
            if (c == '{') depth++;
            else if (c == '}') depth--;
            i++;
        }
        return code.substring(start, Math.min(i, code.length()));
    }

    /**
     * Strip single-line comments, block comments, and string literals
     * so patterns inside them don't cause false positives.
     */
    private String stripCommentsAndStrings(String code) {
        // Remove block comments /* ... */
        code = code.replaceAll("(?s)/\\*.*?\\*/", " ");
        // Remove line comments //...
        code = code.replaceAll("//[^\n]*", " ");
        // Replace string literals "..." with empty string (but keep variable names)
        code = code.replaceAll("\"(?:[^\"\\\\]|\\\\.)*\"", "\"\"");
        // Replace char literals
        code = code.replaceAll("'(?:[^'\\\\]|\\\\.)'", "' '");
        return code;
    }

    private ComplexityResponse unknown() {
        return ComplexityResponse.builder()
                .timeComplexity("O(?)")
                .spaceComplexity("O(?)")
                .timeExplanation("Could not analyze — empty or too short.")
                .spaceExplanation("Could not analyze — empty or too short.")
                .confidence("LOW")
                .detectedPatterns(List.of())
                .dominantPattern("Unknown")
                .build();
    }

    // ── Inner records ─────────────────────────────────────────────────────────

    private record TimeResult(String notation, String explanation,
                              String confidence, List<String> patterns) {}

    private record SpaceResult(String notation, String explanation) {}
}