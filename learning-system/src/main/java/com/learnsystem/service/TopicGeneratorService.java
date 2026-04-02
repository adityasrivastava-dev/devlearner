package com.learnsystem.service;

import com.learnsystem.dto.SeedBatchRequest;
import com.learnsystem.dto.SeedBatchRequest.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Phase 2 — Smart Topic Generator
 * Pure Java rule-based engine. Zero API calls. Zero cost.
 * Admin types a topic name → full topic with 5 examples + 20 problems generated.
 */
@Service
@Slf4j
public class TopicGeneratorService {

private final ObjectMapper mapper = new ObjectMapper();

public enum Pattern {
	ARRAYS, STRINGS, LINKED_LIST, STACK, QUEUE, TREES, GRAPHS,
	HASHING, SORTING, SEARCHING, DYNAMIC_PROG, RECURSION, GREEDY,
	BACKTRACKING, TWO_POINTER, SLIDING_WINDOW, PREFIX_SUM, HEAPS,
	OOP, COLLECTIONS, STREAMS, CONCURRENCY, GENERICS, EXCEPTIONS,
	DESIGN_PATTERNS, JVM,
	MYSQL_JOINS, MYSQL_AGGREGATION, MYSQL_SUBQUERY, MYSQL_INDEX,
	MYSQL_TRANSACTION, MYSQL_PROCEDURE, MYSQL_GENERIC,
	AWS_COMPUTE, AWS_STORAGE, AWS_DATABASE, AWS_SERVERLESS, AWS_GENERIC,
	GENERIC_DSA, GENERIC_JAVA
}

// ── Public entry point ────────────────────────────────────────────────────

public SeedBatchRequest generate(String title, String category) {
	log.info("Generating topic: {} [{}]", title, category);
	Pattern p = detect(title.toLowerCase(), category);

	TopicSeedDto topic = new TopicSeedDto();
	topic.setTitle(title);
	topic.setCategory(category.toUpperCase());
	applyMeta(topic, title, p);
	topic.setStarterCode(starterCode(p));
	topic.setExamples(examples(title, p));
	topic.setProblems(problems(title, p));

	SeedBatchRequest req = new SeedBatchRequest();
	req.setBatchName("Generated — " + title);
	req.setSkipExisting(true);
	req.setTopics(List.of(topic));
	return req;
}

// ── Pattern detection ─────────────────────────────────────────────────────

public Pattern detect(String t, String cat) {
	if (t.contains("array") || t.contains("matrix") || t.contains("subarray")) return Pattern.ARRAYS;
	if (t.contains("string") || t.contains("substring") || t.contains("palindrome") || t.contains("anagram")) return Pattern.STRINGS;
	if (t.contains("linked") || t.contains("node") && t.contains("list")) return Pattern.LINKED_LIST;
	if (t.contains("stack")) return Pattern.STACK;
	if (t.contains("queue") || t.contains("deque")) return Pattern.QUEUE;
	if (t.contains("tree") || t.contains("bst") || t.contains("trie") || t.contains("heap") || t.contains("segment")) return Pattern.TREES;
	if (t.contains("graph") || t.contains("bfs") || t.contains("dfs") || t.contains("dijkstra") || t.contains("topolog")) return Pattern.GRAPHS;
	if (t.contains("hash")) return Pattern.HASHING;
	if (t.contains("sort")) return Pattern.SORTING;
	if (t.contains("search") || t.contains("binary search")) return Pattern.SEARCHING;
	if (t.contains("dynamic") || t.startsWith("dp") || t.contains(" dp ")) return Pattern.DYNAMIC_PROG;
	if (t.contains("recursion") || t.contains("recursive") || t.contains("memoiz")) return Pattern.RECURSION;
	if (t.contains("greedy")) return Pattern.GREEDY;
	if (t.contains("backtrack")) return Pattern.BACKTRACKING;
	if (t.contains("two pointer") || t.contains("sliding window")) return t.contains("sliding") ? Pattern.SLIDING_WINDOW : Pattern.TWO_POINTER;
	if (t.contains("prefix")) return Pattern.PREFIX_SUM;
	if (t.contains("class") || t.contains("object") || t.contains("oop") || t.contains("inherit") || t.contains("polymorphi") || t.contains("encapsul") || t.contains("abstract") || t.contains("interface") || t.contains("solid")) return Pattern.OOP;
	if (t.contains("collection") || t.contains("list") || t.contains("arraylist") || t.contains("hashmap") || t.contains("hashset")) return Pattern.COLLECTIONS;
	if (t.contains("stream") || t.contains("lambda") || t.contains("functional")) return Pattern.STREAMS;
	if (t.contains("thread") || t.contains("concurrent") || t.contains("executor") || t.contains("async") || t.contains("synchroni")) return Pattern.CONCURRENCY;
	if (t.contains("generic")) return Pattern.GENERICS;
	if (t.contains("exception") || t.contains("error") || t.contains("try")) return Pattern.EXCEPTIONS;
	if (t.contains("pattern") || t.contains("singleton") || t.contains("factory") || t.contains("builder") || t.contains("observer")) return Pattern.DESIGN_PATTERNS;
	if (t.contains("jvm") || t.contains("garbage") || t.contains("memory model")) return Pattern.JVM;
	// MySQL patterns
	if (cat.equalsIgnoreCase("MYSQL")) {
		if (t.contains("join") || t.contains("left") || t.contains("right") || t.contains("inner") || t.contains("outer") || t.contains("cross")) return Pattern.MYSQL_JOINS;
		if (t.contains("group") || t.contains("having") || t.contains("count") || t.contains("sum") || t.contains("avg") || t.contains("max") || t.contains("min") || t.contains("aggregat")) return Pattern.MYSQL_AGGREGATION;
		if (t.contains("subquery") || t.contains("sub query") || t.contains("nested") || t.contains("exists") || t.contains("in (")) return Pattern.MYSQL_SUBQUERY;
		if (t.contains("index") || t.contains("explain") || t.contains("optimiz") || t.contains("performance") || t.contains("query plan")) return Pattern.MYSQL_INDEX;
		if (t.contains("transaction") || t.contains("commit") || t.contains("rollback") || t.contains("acid") || t.contains("lock")) return Pattern.MYSQL_TRANSACTION;
		if (t.contains("procedure") || t.contains("function") || t.contains("trigger") || t.contains("view") || t.contains("cursor")) return Pattern.MYSQL_PROCEDURE;
		return Pattern.MYSQL_GENERIC;
	}
	// AWS patterns
	if (cat.equalsIgnoreCase("AWS")) {
		if (t.contains("ec2") || t.contains("compute") || t.contains("instance") || t.contains("auto scaling") || t.contains("load balancer") || t.contains("elb")) return Pattern.AWS_COMPUTE;
		if (t.contains("s3") || t.contains("storage") || t.contains("bucket") || t.contains("glacier") || t.contains("efs") || t.contains("ebs")) return Pattern.AWS_STORAGE;
		if (t.contains("rds") || t.contains("dynamodb") || t.contains("aurora") || t.contains("redshift") || t.contains("elasticache")) return Pattern.AWS_DATABASE;
		if (t.contains("lambda") || t.contains("serverless") || t.contains("api gateway") || t.contains("step function") || t.contains("sqs") || t.contains("sns")) return Pattern.AWS_SERVERLESS;
		return Pattern.AWS_GENERIC;
	}
	return cat.equalsIgnoreCase("DSA") ? Pattern.GENERIC_DSA : Pattern.GENERIC_JAVA;
}

// ── Metadata ──────────────────────────────────────────────────────────────

private void applyMeta(TopicSeedDto d, String title, Pattern p) {
	switch (p) {
		case ARRAYS -> {
			d.setDescription("Contiguous memory. O(1) random access. Foundation of most algorithms. Master two-pointer, prefix sum, and sliding window on arrays.");
			d.setTimeComplexity("O(1) access | O(n) search | O(n²) brute → O(n) optimized");
			d.setSpaceComplexity("O(n) | O(1) with in-place techniques");
			d.setBruteForce("Nested loops O(n²) for most pair/subarray problems");
			d.setOptimizedApproach("HashMap for O(1) lookup, prefix sum for range queries, two pointers for pair problems");
			d.setWhenToUse("Random access by index, cache-friendly iteration, when size is fixed");
			d.setMemoryAnchor("Array: a shelf of numbered boxes — grab any box in O(1), search the whole shelf in O(n).");
			d.setStory("Arjun is a warehouse manager. Every evening he gets a list of daily sales figures and needs to answer questions like 'What was the highest revenue in any 7-day window this year?' He starts by looking at every possible window — 365 checks, each looking at 7 days: 2,555 operations. His laptop groans. Then he realises: if he knows the sum of days 1-7, the sum of days 2-8 is just that minus day 1, plus day 8. One subtraction, one addition. He never rechecks what he already knows. The array is his shelf of daily numbers — fixed size, O(1) to read any slot.");
			d.setAnalogy("An array is a numbered shelf in a post office. Every slot has an index printed on it. You walk directly to slot 42 — no searching. But the shelf has a fixed size; you cannot add a new slot without getting a bigger shelf.");
			d.setFirstPrinciples("Why O(1) random access? Because an array is a contiguous block of memory. arr[i] = base_address + i × element_size. One multiplication, one addition — the CPU does this in a single instruction regardless of array size. That is why access is constant time: the math is always the same equation.");
		}
		case STRINGS -> {
			d.setDescription("Immutable char sequences. Master sliding window for substrings, frequency arrays for anagrams, StringBuilder for construction.");
			d.setTimeComplexity("O(n) sliding window | O(n²) naive | O(n log n) sorted");
			d.setSpaceComplexity("O(1) with char[26] | O(n) HashMap");
			d.setBruteForce("Generate all substrings O(n²) and check each");
			d.setOptimizedApproach("Sliding window with HashMap for frequency tracking — single pass O(n)");
			d.setWhenToUse("Pattern matching, palindromes, anagram detection, substring problems");
			d.setMemoryAnchor("String problems: think frequency first. A char[26] array replaces a HashMap and costs O(1) space for lowercase English.");
			d.setStory("Neha is a plagiarism detection engineer at a publishing house. She needs to find if any sentence in a 10,000-word document is an anagram of a given phrase. Her first instinct: sort every possible substring and compare. For a 10,000-character document, that is 50 million substring comparisons. Her manager gives her 30 seconds. Then she realises: two strings are anagrams if and only if they have the same character frequencies. Build one frequency map for the pattern. Slide a window of the same length across the document, updating the frequency count one character at a time. One pass. O(n).");
			d.setAnalogy("A string is a train of carriages, each carrying one character. You cannot move carriages around — strings are immutable. If you want to rearrange, you build a new train (StringBuilder). The sliding window is like moving a camera of fixed width along the train — you see exactly k carriages at a time, sliding one step at a time.");
			d.setFirstPrinciples("Why are Java strings immutable? Because string pooling requires it: 'hello' in memory can be shared by 1,000 references safely only if nobody can change it. Immutability enables caching the hashCode (computed once, reused for HashMap lookups). The cost: every modification creates a new object. That is why StringBuilder exists — it is a mutable char array under the hood that only creates a String when you call toString().");
		}
		case SORTING -> {
			d.setDescription("Ordering elements is prerequisite for binary search, two-pointer, and greedy. Know merge, quick, heap, counting sort and when to use each.");
			d.setTimeComplexity("O(n²) bubble/selection | O(n log n) merge/quick/heap | O(n+k) counting");
			d.setSpaceComplexity("O(1) in-place quick/heap | O(n) merge | O(k) counting");
			d.setBruteForce("Bubble sort — swap adjacent elements until sorted");
			d.setOptimizedApproach("Merge sort (stable, guaranteed) or quick sort (in-place, cache-friendly)");
			d.setWhenToUse("Before binary search, two-pointer problems, when order matters");
			d.setMemoryAnchor("Sorting: O(n log n) is the floor for comparison-based sorts. You cannot do better unless you exploit the value range (counting sort).");
			d.setStory("Mrs. Sharma is returning exam papers to 40 students. She holds 40 loose papers. Option 1: scan the whole pile for the lowest roll number, pull it out, repeat — 40+39+38... = 780 comparisons. Option 2: split the pile in two, sort each half separately (recursion), then merge — two sorted piles merge in one linear pass. Log₂(40) ≈ 5 levels of splitting, 40 comparisons each level: 200 total. She chose merge sort before she ever heard the name.");
			d.setAnalogy("Merge sort is like organising a library after a flood scattered all the books. You split the pile into two, ask two helpers to sort their halves, then you interleave the two sorted stacks — always taking the smaller front book. Quick sort is like a teacher sorting students by height: pick one student as the pivot, everyone shorter goes left, everyone taller goes right, then sort each group.");
			d.setFirstPrinciples("Why is O(n log n) the lower bound for comparison sorts? Proof by decision trees: sorting n elements requires distinguishing n! possible orderings. A binary decision tree with n! leaves must have height ≥ log₂(n!) ≈ n log n by Stirling's approximation. Every comparison-based sort must make at least n log n comparisons in the worst case. Counting sort breaks this by using element values as indices — it does not compare.");
		}
		case LINKED_LIST -> {
			d.setDescription("Chain of nodes where each node points to the next. O(1) insert/delete at known position, O(n) search. No random access.");
			d.setTimeComplexity("O(1) insert/delete at head | O(n) search | O(n) access by index");
			d.setSpaceComplexity("O(n) — one pointer overhead per node");
			d.setBruteForce("Traverse from head for every operation — O(n) each");
			d.setOptimizedApproach("Two-pointer technique: slow/fast pointers for cycle detection, finding middle, kth from end");
			d.setWhenToUse("Frequent insert/delete at front, implementing stacks/queues, when random access is not needed");
			d.setMemoryAnchor("Linked List: each node knows only the next. To find node 42 you must walk from node 1. No shortcuts.");
			d.setStory("Ravi is on a treasure hunt. Each clue is a sealed envelope. Envelope 1 says 'Go to the old banyan tree.' At the tree, envelope 2 says 'Go to the school library.' You cannot skip to clue 7 without reading clues 1 through 6 — there is no index, no map. But inserting a new clue between clue 3 and 4 is instant: change what clue 3 points to. That is a linked list.");
			d.setAnalogy("A linked list is a paper chain. Each link holds a value and a hook that attaches to the next link. Adding a link anywhere in the middle is easy — unhook one connection, insert the new link, rehook. But to find the 50th link you must count from the first.");
			d.setFirstPrinciples("Why no random access? Array elements are contiguous: element i is at base + i×size. Linked list nodes are scattered in heap memory — each node stores its value and the memory address of the next node. There is no formula to jump to node i; you must follow the chain of pointers one by one.");
		}
		case STACK -> {
			d.setDescription("LIFO structure. Push to top, pop from top. O(1) both operations. Used for DFS, expression parsing, undo systems.");
			d.setTimeComplexity("O(1) push | O(1) pop | O(1) peek");
			d.setSpaceComplexity("O(n) — n elements on the stack");
			d.setBruteForce("Simulate stack with an array and manual index tracking");
			d.setOptimizedApproach("Java Deque (ArrayDeque) — faster than Stack class, avoids synchronization overhead");
			d.setWhenToUse("Balanced brackets, DFS iteratively, expression evaluation, undo/redo, backtracking");
			d.setMemoryAnchor("Stack: last in, first out — like a pile of plates. You can only touch the top.");
			d.setStory("Priya is building a browser. When you click a link, the current page goes onto the back-button stack. Click another link — current page pushed again. Press back: pop the top page. The browser never looks at old pages until you pop down to them. The stack perfectly models 'undo the most recent action first' — the fundamental structure of any history system.");
			d.setAnalogy("A stack of plates in a cafeteria. You always take the top plate. You always place the new plate on top. The plate you put down last is the first one picked up. The plate at the bottom has been waiting the longest.");
			d.setFirstPrinciples("Why does DFS use a stack? Depth-first search explores as far as possible before backtracking. 'As far as possible' means following one path completely before trying another. A stack stores the path you took: when you hit a dead end, you pop back to the last decision point and try the next branch. Recursive DFS uses the call stack implicitly — explicit DFS uses an explicit Deque.");
		}
		case QUEUE -> {
			d.setDescription("FIFO structure. Enqueue at rear, dequeue from front. O(1) both. Used for BFS, scheduling, level-order processing.");
			d.setTimeComplexity("O(1) offer/poll | O(n) search");
			d.setSpaceComplexity("O(n) — n elements in queue");
			d.setBruteForce("Simulate with ArrayList (O(n) remove from front)");
			d.setOptimizedApproach("ArrayDeque — circular buffer, O(1) both ends, no synchronization overhead");
			d.setWhenToUse("BFS, level-order tree traversal, task scheduling, sliding window minimum (monotonic deque)");
			d.setMemoryAnchor("Queue: first in, first out — like a bank line. The person who waited longest gets served first.");
			d.setStory("Vivek is managing a hospital emergency queue. Patients arrive and are added to the back. The doctor always calls the patient who has been waiting longest — the front. It would be chaos to serve the newest arrival first. The queue enforces fairness: first come, first served. BFS uses this same fairness: process the shallowest nodes before the deeper ones.");
			d.setAnalogy("A cinema ticket queue. You join at the back. You leave from the front. The person who arrived first buys their ticket first. No cutting in line.");
			d.setFirstPrinciples("Why does BFS use a queue? BFS must explore all nodes at depth d before any node at depth d+1. A queue enforces this ordering: nodes enqueued at depth d are all dequeued before nodes enqueued at depth d+1 (because they were enqueued first). A stack would give DFS instead — it would follow one path deep before backtracking.");
		}
		case HASHING -> {
			d.setDescription("O(1) average lookup, insert, delete using a hash function. HashMap for key-value pairs, HashSet for uniqueness checks.");
			d.setTimeComplexity("O(1) average all operations | O(n) worst case with collisions");
			d.setSpaceComplexity("O(n) — n entries in the table");
			d.setBruteForce("Linear scan O(n) for lookup/insert/delete");
			d.setOptimizedApproach("HashMap: store complement/seen values for O(n) solutions to O(n²) nested-loop problems");
			d.setWhenToUse("Two Sum, frequency counting, anagram detection, duplicate detection, grouping");
			d.setMemoryAnchor("HashMap: give the key, get the value in O(1). Like a real dictionary — you don't read every word to find 'elephant'.");
			d.setStory("Ananya is a librarian in a 10-million-book library. A patron asks for 'The God of Small Things'. Option 1: scan every shelf in order — 10 million checks. Option 2: years ago Ananya built an index: for every title, she wrote down the exact shelf and slot. Now she opens the index, finds the title in O(1), walks directly to the shelf. The HashMap is that index. The hash function turns the key into the index page number in one computation.");
			d.setAnalogy("A HashMap is a real dictionary with alphabetical tabs. The key is the word. The hash function is like the first letter — it tells you which section to open. Within the section you find the exact page (the bucket). Collision is two words starting with the same letter sharing the same section — handled by a small list within the bucket.");
			d.setFirstPrinciples("Why O(1)? A hash function converts a key to an integer in O(key_length) time, then modulo the table size gives a bucket index. Accessing an array at an index is O(1). So the whole operation is O(1) amortised, assuming collisions are rare. Java's HashMap uses chaining (linked list per bucket) for collisions and rehashes when load factor exceeds 0.75 to keep chains short.");
		}
		case SEARCHING -> {
			d.setDescription("Binary search halves the search space each step. O(log n). Requires sorted input. Recognise it when the answer is monotonic.");
			d.setTimeComplexity("O(log n) binary search | O(n) linear search");
			d.setSpaceComplexity("O(1) iterative | O(log n) recursive call stack");
			d.setBruteForce("Linear scan — check every element O(n)");
			d.setOptimizedApproach("Binary search on sorted array or on the answer space (search for minimum/maximum valid value)");
			d.setWhenToUse("Sorted array lookup, finding boundary in monotonic function, minimise/maximise problems with feasibility check");
			d.setMemoryAnchor("Binary search: throw out half the problem every step. Never check what you already know is impossible.");
			d.setStory("Karan is playing a number-guessing game. The host picks a number between 1 and 1,000,000. Karan guesses 500,000. 'Too high.' Now Karan knows the answer is in 1–499,999. He guesses 250,000. 'Too low.' Now it is 250,001–499,999. Each guess eliminates exactly half the remaining possibilities. After 20 guesses, only one number remains. 2²⁰ = 1,048,576. Twenty questions to find one number in a million.");
			d.setAnalogy("Opening a dictionary to find 'rhinoceros'. You open to the middle — 'M'. Too early. You open to the midpoint of M-Z — 'S'. Too late. You keep halving the remaining pages. You never go backwards. You never re-examine pages you have already passed.");
			d.setFirstPrinciples("Why log n? Each iteration halves the search space. Starting with n elements: after 1 step, n/2 remain. After 2 steps, n/4. After k steps, n/2^k. We stop when n/2^k = 1, so k = log₂(n). For n = 1,000,000: log₂(1,000,000) ≈ 20. Twenty comparisons maximum. This is why binary search on a sorted array beats linear search on any non-trivial input.");
		}
		case TWO_POINTER -> {
			d.setDescription("Two indices moving through data simultaneously. Eliminates a nested loop when array is sorted or has a predictable structure.");
			d.setTimeComplexity("O(n) — each pointer moves at most n steps total");
			d.setSpaceComplexity("O(1) — just two integer variables");
			d.setBruteForce("Nested loops checking every pair: O(n²)");
			d.setOptimizedApproach("One pointer at each end, move inward based on the condition — reduces O(n²) to O(n)");
			d.setWhenToUse("Sorted array pair sum, palindrome check, merging sorted arrays, removing duplicates in-place");
			d.setMemoryAnchor("Two Pointer: squeeze from both ends like folding a paper to find the middle. Each pointer moves at most n steps — O(n) total.");
			d.setStory("Detective Meera is searching a sorted list of 10,000 suspect IDs for any two that sum to a target value. Her partner starts at ID 1 (the smallest), Meera starts at ID 10,000 (the largest). Sum too high? Meera moves one step left. Sum too low? Her partner moves one step right. They walk toward each other. At most 10,000 total steps between them. No nested loops. No wasted checks.");
			d.setAnalogy("Two people walking toward each other on a straight road. They start at opposite ends and approach the middle. Together they cover the entire road in the time it takes one person to walk half of it. The key insight: they never need to go backwards, because the array is sorted.");
			d.setFirstPrinciples("Why O(n)? Each pointer starts at one end and moves toward the other. Left pointer can only move right (n-1 steps max). Right pointer can only move left (n-1 steps max). Total pointer moves: at most 2n. Each step we make a decision and one pointer moves. So the algorithm terminates in at most 2n steps — O(n). The sorting is what makes it safe to throw away half the problem at each step.");
		}
		case SLIDING_WINDOW -> {
			d.setDescription("Maintain a window that expands/shrinks over a sequence. O(n) for problems that would otherwise be O(n²). Used for subarrays and substrings.");
			d.setTimeComplexity("O(n) — each element enters and leaves the window exactly once");
			d.setSpaceComplexity("O(k) for fixed window | O(n) for variable window with HashMap");
			d.setBruteForce("Check every subarray/substring: O(n²) or O(n²k)");
			d.setOptimizedApproach("Expand right pointer, shrink left pointer when condition violated — each element processed at most twice");
			d.setWhenToUse("Maximum/minimum subarray of size k, longest substring with constraint, minimum window containing all characters");
			d.setMemoryAnchor("Sliding Window: subtract what leaves, add what arrives — never recompute what you already know.");
			d.setStory("Priya is a finance analyst. Her manager asks: 'Find the best-performing 7-day window in the past year of daily revenue data.' Her first approach: check all 359 windows of 7 days, summing 7 numbers each: 2,513 additions. Then Priya realises: she already has the sum of days 1-7. The sum of days 2-8 is that sum, minus day 1, plus day 8. One subtraction, one addition. She slides the window forward one step at a time. 358 additions total instead of 2,513.");
			d.setAnalogy("A camera with a fixed-width lens panning across a scene. You see exactly k frames at a time. As the camera slides right, one frame leaves the left edge and one new frame enters the right edge. You do not re-examine frames already passed. The window slides, never jumps back.");
			d.setFirstPrinciples("Why O(n)? Each element is added to the window exactly once (when the right pointer passes it) and removed exactly once (when the left pointer passes it). Two passes over the array total — O(2n) = O(n). The power of sliding window comes from maintaining running state (sum, frequency map, max) as the window moves, rather than recomputing from scratch for each position.");
		}
		case RECURSION -> {
			d.setDescription("A function that calls itself with a smaller input. Every recursive solution needs: base case (stop condition) and recursive case (reduce toward base).");
			d.setTimeComplexity("O(n) simple recursion | O(2ⁿ) naive tree recursion | O(n log n) divide and conquer");
			d.setSpaceComplexity("O(n) call stack depth for linear recursion | O(log n) for balanced divide and conquer");
			d.setBruteForce("Iterative loops with explicit stack management");
			d.setOptimizedApproach("Memoization: cache results of expensive recursive calls to avoid recomputation (top-down DP)");
			d.setWhenToUse("Tree/graph traversal, divide and conquer, backtracking, problems with self-similar structure");
			d.setMemoryAnchor("Recursion: trust the function to solve the smaller version. Write the base case, write the reduction, done.");
			d.setStory("Sensei Rajan teaches a recipe to his apprentice. The apprentice teaches it to their apprentice. Each teacher only knows they need to teach one person. The recipe for 5 students: teach 1 student, who teaches the recipe to 4 students (same problem, smaller input). Base case: 0 students — nothing to teach. This is recursion. Each call trusts the next call to handle its portion correctly.");
			d.setAnalogy("Russian dolls (Matryoshka). Open the outer doll to find a smaller doll inside. Open that one to find an even smaller one. Each doll is the same problem at a smaller scale. The smallest doll (base case) is solid — it does not open. You trust that each inner doll is complete before you worry about the outer one.");
			d.setFirstPrinciples("Why does recursion work? Mathematical induction. Prove: (1) the function handles the base case correctly. (2) if the function handles input of size n-1 correctly, it handles input of size n correctly. The recursive call is a leap of faith — you assume it works for the smaller input and build your solution on top of that assumption. The base case is the foundation that makes the induction valid.");
		}
		case DYNAMIC_PROG -> {
			d.setDescription("Avoid recomputing overlapping subproblems. Two approaches: top-down memoization (easy to write) or bottom-up tabulation (space-efficient).");
			d.setTimeComplexity("O(n) to O(n²) — one computation per unique subproblem");
			d.setSpaceComplexity("O(n²) table → O(n) rolling array → O(1) with two variables");
			d.setBruteForce("Recursion without memo — exponential O(2ⁿ) for most DP problems");
			d.setOptimizedApproach("Tabulation: fill dp[] from base case upward. Space-optimize: keep only the previous row or two variables");
			d.setWhenToUse("Optimal substructure + overlapping subproblems: counting ways, min/max cost over a sequence, knapsack problems");
			d.setMemoryAnchor("Dynamic Programming: if you have solved this exact subproblem before, look it up — don't solve it again.");
			d.setStory("Rohan is climbing stairs. He can take 1 or 2 steps at a time. How many ways to reach step 10? Naive recursion: ways(10) = ways(9) + ways(8). Ways(9) = ways(8) + ways(7). Ways(8) is computed three times before Rohan reaches step 5. By step 10, ways(1) has been computed 89 times. Memoization: write the answer for ways(1) on a sticky note on the wall. Next time you need it, read the note. 10 sticky notes. 10 computations instead of 177.");
			d.setAnalogy("DP is like a student who writes down every answer in a notebook. In an exam, when a question repeats something from a previous problem, they flip to their notes instead of rederiving from scratch. Tabulation is writing answers from the simplest questions up. Memoization is writing answers whenever you first discover them.");
			d.setFirstPrinciples("Two conditions for DP to apply: (1) Optimal substructure — the optimal solution to the whole problem can be built from optimal solutions to subproblems. (2) Overlapping subproblems — the same subproblems are solved repeatedly. Without (1), greedy might work. Without (2), divide and conquer is enough. DP = recursion + memory.");
		}
		case GREEDY -> {
			d.setDescription("Make the locally optimal choice at each step. Works when local optimum leads to global optimum. Always prove correctness — greedy is not always right.");
			d.setTimeComplexity("O(n log n) if sorting needed | O(n) after sorting");
			d.setSpaceComplexity("O(1) extra space beyond the input");
			d.setBruteForce("Try all possible combinations: O(2ⁿ) for subset problems");
			d.setOptimizedApproach("Sort by the greedy criterion, make the best local choice, never reconsider");
			d.setWhenToUse("Activity selection, interval scheduling, Huffman coding, minimum spanning tree, coin change (certain denominations)");
			d.setMemoryAnchor("Greedy: always grab the best option available right now. Works when 'best now' never hurts 'best later'.");
			d.setStory("Monika manages a conference room. Seven teams want to book it for different time slots. She wants to fit in the maximum number of teams. Strategy 1: prefer teams with earliest start times — fails when a team books the whole day. Strategy 2: prefer shortest meetings — fails when short meetings block all morning. Strategy 3: prefer teams with earliest END times — always leaves maximum room for what follows. This exchange argument proves greedy works: no swap of a later-ending meeting for an earlier-ending one can give a better result.");
			d.setAnalogy("Packing a bag greedily for a hike: always put in the most valuable-per-kilogram item first. This works for the fractional knapsack (you can cut items). It fails for the 0-1 knapsack (items are indivisible) — a classic example of where greedy breaks and DP is needed instead.");
			d.setFirstPrinciples("Greedy correctness proof uses the exchange argument: assume the greedy choice is wrong and an optimal solution makes a different choice. Show that swapping to the greedy choice does not make the solution worse (and possibly makes it better). If you can prove no swap hurts, the greedy choice is safe at every step. Without this proof, always test greedy against small counterexamples.");
		}
		case BACKTRACKING -> {
			d.setDescription("Explore all possibilities by building solutions incrementally and abandoning (pruning) paths that cannot lead to a valid solution.");
			d.setTimeComplexity("O(n!) or O(2ⁿ) worst case | pruning reduces practical runtime significantly");
			d.setSpaceComplexity("O(n) recursion depth");
			d.setBruteForce("Generate all combinations/permutations without pruning — same complexity but slower in practice");
			d.setOptimizedApproach("Prune early: check validity before recursing deeper, not after. Use a visited/used boolean array.");
			d.setWhenToUse("Permutations, combinations, N-Queens, Sudoku solver, word search, subset sum");
			d.setMemoryAnchor("Backtracking: explore, then undo. Place, recurse, remove. The undo step is what makes it backtracking.");
			d.setStory("Aryan is solving a Sudoku. He tries placing 3 in cell (1,1). Recurse into cell (1,2). Try 1 — conflict in row. Try 2 — conflict in box. Try 3 — already used. Try 4 — works, recurse. Eventually: dead end — no valid digit for cell (5,7). Backtrack: undo the last placement, try the next digit. Keep unwinding until you find a placement that leads to a full solution. Backtracking is controlled exhaustive search.");
			d.setAnalogy("A maze with multiple forks. At each fork you mark the path you took with chalk. If you hit a dead end, you follow your chalk marks back to the last fork and try the next path. The chalk marks are the recursion stack. Backtracking is guaranteed to find the exit if one exists.");
			d.setFirstPrinciples("Why is it not just brute force? Pruning. Before recursing into a branch, check if this branch can possibly lead to a solution. If not, skip it entirely. Example: in N-Queens, if placing a queen creates an immediate attack, skip the entire subtree rooted at that placement. Good pruning can reduce exponential runtime to near-polynomial for practical inputs.");
		}
		case PREFIX_SUM -> {
			d.setDescription("Precompute cumulative sums so any range sum query is answered in O(1). Build: O(n). Query: O(1). Essential for range problems.");
			d.setTimeComplexity("O(n) build | O(1) query | O(n²) naive per query");
			d.setSpaceComplexity("O(n) prefix array");
			d.setBruteForce("Sum elements from l to r on every query: O(n) per query, O(n²) total");
			d.setOptimizedApproach("prefix[i] = prefix[i-1] + arr[i]. Range sum(l,r) = prefix[r] - prefix[l-1]. One subtraction.");
			d.setWhenToUse("Multiple range sum queries, subarray sum equals K, equilibrium index, 2D matrix range sum");
			d.setMemoryAnchor("Prefix Sum: do the work once, answer forever. prefix[r] - prefix[l-1] is every range sum you will ever need.");
			d.setStory("Kavya works at a toll booth company. Every day they receive 365 daily revenue figures. Managers ask 50 different range questions: 'Total revenue from day 47 to day 198?' Naive: sum 152 numbers for each question. 50 questions × 152 numbers = 7,600 additions. Kavya precomputes: prefix[1]=day1, prefix[2]=day1+day2, ..., prefix[365]=total. Now each question is one subtraction: prefix[198] - prefix[46]. 50 subtractions instead of 7,600 additions.");
			d.setAnalogy("A mileage odometer on a car. You record the odometer at the start of each day. Distance travelled between day 47 and day 198 = odometer(day198) - odometer(day46). One subtraction, regardless of how many days are in the range. The prefix sum array is the odometer: it accumulates totals so you can subtract to get any interval.");
			d.setFirstPrinciples("Why prefix[r] - prefix[l-1] works: prefix[r] = sum of elements 0 through r. prefix[l-1] = sum of elements 0 through l-1. Their difference = sum of elements l through r. The common prefix (0 to l-1) cancels out. This is the fundamental insight: precomputing cumulative sums converts range queries from O(n) to O(1) at the cost of O(n) preprocessing and O(n) space.");
		}
		case HEAPS -> {
			d.setDescription("Binary heap for O(log n) insert and O(log n) extract-min/max. PriorityQueue in Java. Used for top-K problems and Dijkstra's algorithm.");
			d.setTimeComplexity("O(log n) insert/delete | O(1) peek min/max | O(n log k) for top-K");
			d.setSpaceComplexity("O(n) — n elements stored");
			d.setBruteForce("Sort the entire array for top-K: O(n log n)");
			d.setOptimizedApproach("Maintain a min-heap of size k for top-K largest: O(n log k). Better than sorting when k << n.");
			d.setWhenToUse("K largest/smallest elements, median in stream, merge K sorted lists, shortest path (Dijkstra)");
			d.setMemoryAnchor("Heap: the smallest (or largest) element is always at the top, ready in O(1). Adding or removing costs O(log n).");
			d.setStory("Riya is a hospital triage nurse. Patients arrive with different severity scores (1-10). She always treats the most critical patient first. New patients can arrive while she is treating others. A sorted list fails: inserting mid-list is O(n). A heap works: insert in O(log n), always pop the maximum severity in O(log n). The heap keeps the most urgent patient at the top at all times.");
			d.setAnalogy("A heap is like a tournament bracket where the winner (min or max) is always at the top. When the winner is removed, the bracket reorganises itself in O(log n) time to find the new winner. The full sorted order is not maintained — only the guarantee that the top is the best.");
			d.setFirstPrinciples("A binary heap is a complete binary tree stored as an array. Parent of node i is at i/2. Children of node i are at 2i and 2i+1. The heap property: parent ≤ both children (min-heap). Insert: add at the end, bubble up (swap with parent while parent > child). Delete-min: swap root with last element, remove last, bubble down. Each operation touches at most log₂(n) nodes — the height of the tree.");
		}
		case GRAPHS -> {
			d.setDescription("Vertices connected by edges. BFS for shortest path (unweighted), DFS for connectivity and cycle detection, Dijkstra for weighted shortest path.");
			d.setTimeComplexity("O(V+E) BFS/DFS | O((V+E) log V) Dijkstra | O(V²) Floyd-Warshall");
			d.setSpaceComplexity("O(V+E) adjacency list | O(V²) adjacency matrix");
			d.setBruteForce("Try all paths — O(V!) for all possible paths");
			d.setOptimizedApproach("BFS for unweighted shortest path, Dijkstra for weighted, Union-Find for connectivity");
			d.setWhenToUse("Network routing, social connections, dependency resolution, map navigation, course prerequisites");
			d.setMemoryAnchor("Graph: BFS finds shortest path (unweighted). DFS finds if a path exists. Dijkstra finds shortest path (weighted).");
			d.setStory("Nandini is a city planner. She has a map of 500 intersections connected by roads. She needs to find the fastest route from the airport to the city centre. BFS (unweighted): explores all intersections 1 hop away, then 2 hops, then 3 — guarantees fewest traffic lights. Dijkstra (weighted): always processes the intersection with the lowest total travel time so far — guarantees fastest by time. The graph is the map; each intersection is a vertex; each road is an edge.");
			d.setAnalogy("A graph is a map of cities and roads. BFS is like a ripple in water: it expands outward one level at a time, reaching all nearby cities before distant ones. DFS is like a determined hiker who follows one path to its end before backtracking. Dijkstra is like a GPS navigator: always picks the lowest-cost next step.");
			d.setFirstPrinciples("Why O(V+E) for BFS/DFS? Every vertex is enqueued/pushed exactly once: O(V). Every edge is examined exactly once (when its source vertex is processed): O(E). Total: O(V+E). For Dijkstra with a priority queue: each vertex is extracted once O(V log V) and each edge relaxation is O(log V), giving O((V+E) log V) total.");
		}
		case OOP -> {
			d.setDescription("Model programs as objects with state and behaviour. Four pillars: Encapsulation, Inheritance, Polymorphism, Abstraction.");
			d.setTimeComplexity("N/A — design concept");
			d.setSpaceComplexity("N/A");
			d.setBruteForce("Procedural code: global state, no encapsulation");
			d.setOptimizedApproach("Private fields + public methods, favour composition over inheritance, program to interfaces");
			d.setWhenToUse("Modelling real-world entities, enforcing invariants, building extensible systems");
			d.setMemoryAnchor("OOP: objects have state (fields) and behaviour (methods). Encapsulate the state, expose only what is needed.");
			d.setStory("Siddharth is designing a banking system. Option 1: 10,000 lines of procedural code with global variables for every account. Balance can be changed from anywhere. No audit trail. Option 2: a BankAccount class. balance is private. Only deposit() and withdraw() can change it. Both methods validate before changing state. 10,000 accounts, each an independent object with guaranteed valid state. OOP is the difference between a box of loose wires and a circuit board.");
			d.setAnalogy("A car is an OOP object. The engine is private — you cannot reach in and adjust the pistons. You interact through the public interface: accelerator, brake, steering wheel. The car encapsulates its complexity. Inheritance: a SportsCar IS-A Car, inheriting all car behaviour and adding its own. Polymorphism: start(vehicle) works whether vehicle is a Car, Truck, or Motorcycle.");
			d.setFirstPrinciples("Encapsulation prevents invalid state by controlling access to data. A balance field set directly could become -∞; a withdraw() method enforces 'balance ≥ amount'. Polymorphism (runtime dispatch) works through virtual method tables: each object carries a pointer to its class's method table; method calls follow the pointer at runtime, enabling one interface to work with many implementations without the caller knowing the concrete type.");
		}
		case COLLECTIONS -> {
			d.setDescription("Java Collections Framework. ArrayList (O(1) access), LinkedList (O(1) add/remove ends), HashMap (O(1) avg), TreeMap (O(log n) sorted).");
			d.setTimeComplexity("ArrayList O(1) get | LinkedList O(1) add ends | HashMap O(1) avg | TreeMap O(log n)");
			d.setSpaceComplexity("O(n) all");
			d.setBruteForce("Raw arrays with manual resizing");
			d.setOptimizedApproach("Pick the right collection for the access pattern — HashMap for lookup, PriorityQueue for priority access, TreeMap for sorted iteration");
			d.setWhenToUse("Any time you need dynamic data storage — choosing the right collection determines your algorithm's complexity");
			d.setMemoryAnchor("Collections: ArrayList for indexed access, HashMap for keyed access, PriorityQueue for priority access, TreeMap for sorted access.");
			d.setStory("Aditya is building a ride-sharing app. For storing ride requests: ArrayList — fast index access but slow middle insert. For driver lookup by ID: HashMap — O(1) get by driverId. For fare leaderboard: TreeMap — always sorted by fare. For next-available driver: PriorityQueue — always O(1) peek at minimum wait time. One wrong collection choice and an O(1) operation silently becomes O(n).");
			d.setAnalogy("Collections are tools in a toolbox. A HashMap is a wrench — perfect for tightening bolts (keyed access), useless for hammering nails. An ArrayList is a tape measure — great for ordered sequences. Picking the right tool is not just style: it determines whether your algorithm runs in O(1) or O(n).");
			d.setFirstPrinciples("ArrayList is backed by a primitive array. get(i) is O(1) because it's arr[i]. add(i, val) in the middle is O(n) because elements must shift. HashMap uses an array of buckets: hash(key) % capacity gives the bucket; the bucket holds a linked list (Java 8: tree for buckets > 8). TreeMap is a Red-Black tree: guaranteed O(log n) insert, delete, and ceiling/floor operations.");
		}
		case STREAMS -> {
			d.setDescription("Java 8 Streams: functional pipeline for processing collections. filter, map, sorted, collect. Lazy evaluation means intermediate operations execute only when a terminal operation is called.");
			d.setTimeComplexity("O(n) single pass | O(n log n) if sorted | Parallel streams: O(n/k) with k cores theoretically");
			d.setSpaceComplexity("O(1) for most pipelines (lazy) | O(n) for sorted or collect");
			d.setBruteForce("Nested for-loops with manual condition checks");
			d.setOptimizedApproach("Chain filter+map+collect in one pass rather than three separate loops over the data");
			d.setWhenToUse("Transforming, filtering, aggregating collections; replacing boilerplate loops; parallel processing large datasets");
			d.setMemoryAnchor("Streams: describe WHAT you want (filter → map → collect), not HOW to loop. Lazy evaluation means nothing runs until the terminal operation.");
			d.setStory("Pooja is processing 1 million user records. Old way: loop 1 to filter active users (1M checks), loop 2 to extract emails (subset), loop 3 to sort. Three passes over the data. Stream way: one pipeline — filter → map → sorted → collect. The JVM fuses these into a single pass. With parallelStream(), it splits work across CPU cores. Same logic, potentially 4× faster on a quad-core machine.");
			d.setAnalogy("A Stream pipeline is an assembly line in a factory. Raw materials enter at one end. Each station (filter, map, sorted) does one operation. The finished product (collect) exits at the end. The factory only runs when someone orders the product (terminal operation) — that is lazy evaluation.");
			d.setFirstPrinciples("Streams are lazy: intermediate operations (filter, map) build a pipeline description but do nothing. Only when a terminal operation (collect, forEach, reduce) is called does execution begin. This enables short-circuiting: findFirst() stops after the first match; it does not process the rest of the stream. The source can be an infinite stream because of this laziness.");
		}
		case CONCURRENCY -> {
			d.setDescription("Multiple threads sharing CPU. Master ExecutorService, synchronized, AtomicInteger, and CompletableFuture for async work.");
			d.setTimeComplexity("O(n/k) theoretical with k threads for parallelisable work");
			d.setSpaceComplexity("O(k) per thread stack (default 512KB-1MB)");
			d.setBruteForce("Single-threaded sequential — safe but slow for I/O-bound or CPU-bound work");
			d.setOptimizedApproach("Thread pool via ExecutorService: reuse threads, avoid thread creation overhead. CompletableFuture for async chains.");
			d.setWhenToUse("I/O-bound tasks (HTTP calls, DB queries), CPU-bound parallel computation, background jobs");
			d.setMemoryAnchor("Concurrency: shared mutable state is the enemy. Protect it with synchronized, use Atomic classes, or eliminate sharing.");
			d.setStory("Three chefs in a kitchen with one shared cutting board. Chef 1 is chopping onions. Chef 2 reaches for the board simultaneously. Both grab it. Board breaks — race condition. Fix: a lock on the cutting board. One chef at a time. But now chefs queue up and throughput drops. Better fix: give each chef their own board (thread-local state) — no contention, maximum throughput. Concurrency bugs are kitchen chaos; the solution is either locks or no sharing.");
			d.setAnalogy("A highway with multiple lanes. Each car (thread) is independent and fast on open road. When lanes merge (shared resource), cars slow down and queue. A semaphore is a traffic light controlling how many cars can enter the merge zone simultaneously. A synchronized block is a single-lane bridge — one car at a time.");
			d.setFirstPrinciples("The Java Memory Model (JMM) defines visibility rules: changes made by thread A to a variable are not guaranteed visible to thread B unless a happens-before relationship exists. volatile establishes happens-before for reads/writes. synchronized establishes happens-before on monitor enter/exit. Without these, thread B may read a stale cached value from a CPU register. This is why synchronized cannot be omitted even when the logic 'should' be correct.");
		}
		case GENERICS -> {
			d.setDescription("Type-safe generic classes and methods. Write once, use with any type. Erasure removes type info at runtime — generics are a compile-time feature.");
			d.setTimeComplexity("N/A — compile-time feature, no runtime overhead");
			d.setSpaceComplexity("N/A");
			d.setBruteForce("Raw types and manual casts — ClassCastException at runtime instead of compile-time errors");
			d.setOptimizedApproach("Bounded wildcards: <? extends T> for reading (producer), <? super T> for writing (consumer) — the PECS rule");
			d.setWhenToUse("Collections, utility methods that work on multiple types, building reusable data structures");
			d.setMemoryAnchor("Generics: catch type errors at compile time, not at runtime. List<String> won't accept an Integer — the compiler tells you before it crashes.");
			d.setStory("Rahul writes a sort method for integers. His manager asks for the same for strings. He copies and changes the type — two identical methods. Then for dates. Three copies. A bug in the comparison logic must be fixed in three places. Generics: write Comparable<T> sort once. Works for Integer, String, Date, anything that implements Comparable. One bug fix fixes all three uses.");
			d.setAnalogy("Generics are like a universal socket adapter. The socket (generic class) accepts any plug shape (type parameter) that meets the specification. Without generics, you need a separate socket for each plug shape — identical functionality, multiplied by the number of types.");
			d.setFirstPrinciples("Java generics use type erasure: at runtime, List<String> and List<Integer> are both just List. The type parameter is removed by the compiler after type checking. This is why you cannot do new T[] or instanceof List<String>. The upside: no runtime overhead, backward compatibility with pre-generics code. The downside: cannot distinguish List<String> from List<Integer> at runtime.");
		}
		case EXCEPTIONS -> {
			d.setDescription("Handle errors gracefully without crashing. Checked exceptions must be declared or caught; unchecked (RuntimeException) are optional. Use specific exceptions, not Exception.");
			d.setTimeComplexity("N/A — control flow mechanism");
			d.setSpaceComplexity("O(stack depth) — stack trace is captured at throw time");
			d.setBruteForce("Return null or -1 error codes — caller may forget to check, silent bugs");
			d.setOptimizedApproach("Throw specific exceptions with clear messages. Catch at the layer that can meaningfully handle. Use finally or try-with-resources for cleanup.");
			d.setWhenToUse("File I/O, network calls, database operations, any operation that can fail for external reasons");
			d.setMemoryAnchor("Exceptions: throw specific, catch specific, clean up in finally. Never catch Exception and ignore it.");
			d.setStory("Yash's payment service calls an external bank API. Three things can go wrong: network timeout, invalid account number, insufficient funds. Option 1: return -1, -2, -3. The caller checks the integer — or forgets to. Silent failures reach the user as a blank screen. Option 2: throw NetworkTimeoutException, InvalidAccountException, InsufficientFundsException. The compiler forces callers to handle or declare them. The right error surfaces immediately with a clear message.");
			d.setAnalogy("Exception handling is like error lights on a car dashboard. Instead of the engine silently failing (returning -1), the engine management system throws a specific warning: 'Oil pressure low' (specific exception). You catch the warning at the driver's seat (the layer that can act on it) and respond appropriately. Catching all errors with a single 'Check Engine' light (catch Exception) loses the detail needed to respond correctly.");
			d.setFirstPrinciples("Checked vs unchecked: checked exceptions (IOException, SQLException) represent recoverable external failures — the compiler forces you to handle them because they are expected. Unchecked exceptions (NullPointerException, IllegalArgumentException) represent programming errors — callers cannot meaningfully recover from a null dereference at runtime; the fix is to not pass null. This distinction is the design intent of the two-category exception hierarchy.");
		}
		case DESIGN_PATTERNS -> {
			d.setDescription("23 GoF patterns categorised as Creational (how objects are made), Structural (how objects are composed), Behavioural (how objects communicate).");
			d.setTimeComplexity("N/A — architectural patterns");
			d.setSpaceComplexity("N/A");
			d.setBruteForce("Ad-hoc code: new dependencies everywhere, no abstraction, hard to test and extend");
			d.setOptimizedApproach("Program to interfaces, not implementations. Favour composition over inheritance. Inject dependencies.");
			d.setWhenToUse("When code needs to be extensible, testable, and maintainable at scale — recognise the pattern before reaching for inheritance");
			d.setMemoryAnchor("Singleton: one instance. Factory: hide construction. Observer: notify subscribers. Strategy: swap algorithms. Decorator: add behaviour at runtime.");
			d.setStory("Zara is building a notification system. Her first version: NotificationService directly instantiates EmailSender, SMSSender, PushSender. Testing is impossible — you cannot mock the real email server. A month later: add SlackSender. She modifies NotificationService — breaks existing code. With Observer pattern: NotificationService knows only about NotificationListener interface. EmailSender, SMSSender, SlackSender all implement it. New sender = new class, zero changes to existing code. Open/Closed principle.");
			d.setAnalogy("Singleton is Netflix's global config manager — one configuration object shared by all microservices. Observer is Amazon's warehouse alert system — when inventory changes, all subscribed systems are notified automatically. Decorator is a Starbucks order: base coffee, add milk (+cost), add syrup (+cost), each decorator wraps the previous one without changing it.");
			d.setFirstPrinciples("Design patterns are solutions to recurring design problems in the context of object-oriented design. They are not code to copy-paste — they are shapes of relationships between classes. The power of patterns comes from the SOLID principles they embody: Single Responsibility (each class does one thing), Open-Closed (open for extension, closed for modification), Liskov Substitution (subclasses can replace their parent), Interface Segregation (specific interfaces), Dependency Inversion (depend on abstractions).");
		}
		case JVM -> {
			d.setDescription("JVM architecture: ClassLoader, Runtime Data Areas (Heap, Stack, Method Area), Execution Engine (JIT), Garbage Collector. Understanding JVM optimises performance.");
			d.setTimeComplexity("GC pause: milliseconds (G1) to seconds (full GC) | JIT: warmup cost amortised over program lifetime");
			d.setSpaceComplexity("Heap: configurable (-Xmx). Stack: one per thread. Method Area: class metadata.");
			d.setBruteForce("Ignoring memory — creating excessive objects, no pool, no reuse");
			d.setOptimizedApproach("Reduce object allocation (object pooling, value types), tune GC with -XX flags, avoid premature optimisation — profile first");
			d.setWhenToUse("Performance tuning, memory leak debugging, understanding why System.gc() does nothing useful, OutOfMemoryError investigation");
			d.setMemoryAnchor("JVM Heap: where objects live. Stack: where method calls live. GC: cleans up heap objects with no references. JIT: hot code paths get compiled to native machine code.");
			d.setStory("Simran's Spring Boot service runs fine under light load. Under 10,000 requests/second it freezes for 3 seconds every few minutes. The culprit: full GC pause. Every request creates 50 short-lived objects. At 10k RPS that is 500,000 objects/second. The young generation heap fills up faster than minor GC can clean it. Objects promote to old generation. Old generation fills. Full GC — stop the world. Fix: object pooling for the hot path. GC pauses disappear. Understanding JVM turned a production incident into a 10-line fix.");
			d.setAnalogy("JVM Heap is RAM for objects. Stack is a notepad: method frame written on entry, erased on exit. Method Area is the office library: class definitions stored permanently. GC is the office cleaner: visits at night, removes papers nobody is looking at. JIT is the shortcut typist: the first time a report is written, it takes 10 minutes; JIT notices and creates a one-click macro for the next 10,000 copies.");
			d.setFirstPrinciples("JIT (Just-In-Time) compilation: bytecode is interpreted (slow) until a method is 'hot' (called > 10,000 times by default). HotSpot then compiles it to native machine code and replaces the interpreter call with the compiled version. This is why Java startup is slow (interpreting) but throughput is fast (native code). Garbage collection correctness relies on the GC root set: live objects are those reachable from GC roots (stack variables, static fields, JNI references). Unreachable objects are dead and eligible for collection.");
		}
		default -> {
			d.setDescription("Master " + title + " with targeted examples and graduated practice problems.");
			d.setTimeComplexity("Varies by problem — analyze each case");
			d.setSpaceComplexity("O(n) typical");
			d.setBruteForce("Brute force: try all possibilities");
			d.setOptimizedApproach("Apply the core " + title + " pattern to reduce complexity");
			d.setWhenToUse("When the problem structure matches " + title + " characteristics");
			d.setMemoryAnchor("Master the core insight of " + title + " — know when to apply it and why it works.");
			d.setStory("Every great engineer who masters " + title + " starts by understanding WHY it works, not just HOW to code it. Trace through a small example by hand first. Then code it. Then ask: what is the invariant this algorithm maintains at every step?");
			d.setAnalogy(title + " can be understood through a real-world analogy: identify the core operation it performs and find a physical system that does the same thing. The analogy is the memory hook.");
			d.setFirstPrinciples("Ask three questions: (1) What problem does " + title + " solve? (2) What property of the input makes it applicable? (3) What is the invariant maintained at each step? Answers to these three questions mean you truly understand it — not just that you have memorised it.");
		}
	}
}

// ── Starter code ──────────────────────────────────────────────────────────

private String starterCode(Pattern p) {
	return switch (p) {
		case ARRAYS -> "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        // TODO: solve\n        System.out.println(0);\n    }\n}";
		case STRINGS -> "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.next();\n        // TODO: process string\n        System.out.println(s);\n    }\n}";
		case TREES -> "import java.util.*;\npublic class Main {\n    static class TreeNode {\n        int val; TreeNode left, right;\n        TreeNode(int v) { val = v; }\n    }\n    // Build tree from level-order input\n    static TreeNode build(int[] vals) {\n        if (vals.length == 0 || vals[0] == -1) return null;\n        TreeNode root = new TreeNode(vals[0]);\n        Queue<TreeNode> q = new LinkedList<>();\n        q.offer(root);\n        int i = 1;\n        while (!q.isEmpty() && i < vals.length) {\n            TreeNode n = q.poll();\n            if (i < vals.length && vals[i] != -1) { n.left  = new TreeNode(vals[i]); q.offer(n.left); }\n            i++;\n            if (i < vals.length && vals[i] != -1) { n.right = new TreeNode(vals[i]); q.offer(n.right); }\n            i++;\n        }\n        return root;\n    }\n    public static void main(String[] args) {\n        // TODO: solve\n    }\n}";
		case DYNAMIC_PROG -> "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] dp = new int[n + 1];\n        dp[0] = 0; // base case\n        for (int i = 1; i <= n; i++) {\n            dp[i] = dp[i - 1]; // TODO: recurrence\n        }\n        System.out.println(dp[n]);\n    }\n}";
		case OOP -> "public class Main {\n    // Define your class hierarchy here\n    static abstract class Shape {\n        abstract double area();\n        void describe() { System.out.println(\"Area: \" + area()); }\n    }\n    static class Circle extends Shape {\n        double r;\n        Circle(double r) { this.r = r; }\n        @Override public double area() { return Math.PI * r * r; }\n    }\n    public static void main(String[] args) {\n        Shape s = new Circle(5);\n        s.describe(); // polymorphic dispatch\n    }\n}";
		case COLLECTIONS -> "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        // List - ordered, duplicates allowed\n        List<Integer> list = new ArrayList<>();\n        // Map - key-value, O(1) avg lookup\n        Map<String, Integer> map = new HashMap<>();\n        // Set - unique elements\n        Set<Integer> set = new HashSet<>();\n        // PriorityQueue - min-heap by default\n        PriorityQueue<Integer> pq = new PriorityQueue<>();\n        // TODO: solve using appropriate collection\n    }\n}";
		case STREAMS -> "import java.util.*;\nimport java.util.stream.*;\npublic class Main {\n    public static void main(String[] args) {\n        List<Integer> nums = Arrays.asList(1, 2, 3, 4, 5, 6);\n        // Filter, map, collect\n        List<Integer> evens = nums.stream()\n            .filter(n -> n % 2 == 0)\n            .map(n -> n * n)\n            .collect(Collectors.toList());\n        System.out.println(evens);\n        // GroupBy\n        Map<Boolean, List<Integer>> groups = nums.stream()\n            .collect(Collectors.partitioningBy(n -> n % 2 == 0));\n        System.out.println(groups);\n    }\n}";
		case CONCURRENCY -> "import java.util.concurrent.*;\nimport java.util.concurrent.atomic.*;\npublic class Main {\n    static AtomicInteger counter = new AtomicInteger(0);\n    public static void main(String[] args) throws Exception {\n        ExecutorService pool = Executors.newFixedThreadPool(4);\n        List<Future<Integer>> futures = new ArrayList<>();\n        for (int i = 0; i < 10; i++) {\n            futures.add(pool.submit(() -> {\n                // TODO: thread-safe work\n                return counter.incrementAndGet();\n            }));\n        }\n        for (Future<Integer> f : futures) System.out.println(f.get());\n        pool.shutdown();\n    }\n}";
		default -> "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // TODO: implement solution\n        System.out.println(0);\n    }\n}";
	};
}

// ── Examples (5 per topic) ────────────────────────────────────────────────

private List<ExampleSeedDto> examples(String title, Pattern p) {
	var raw = switch (p) {
		case ARRAYS -> new String[][]{
				{"Traverse + Find Max","Single pass O(n) O(1)","int max=arr[0];\nfor(int n:arr) if(n>max) max=n;\nSystem.out.println(max);","Track running max — enhanced for is clean, no index needed","Temperature sensor peak detection"},
				{"Two Sum — HashMap","O(n) time O(n) space","Map<Integer,Integer> map=new HashMap<>();\nfor(int i=0;i<n;i++){\n    int comp=target-arr[i];\n    if(map.containsKey(comp)) return new int[]{map.get(comp),i};\n    map.put(arr[i],i); // insert AFTER checking\n}","Store complement. Check BEFORE inserting current element to avoid self-match","Shopping cart discount pairs"},
				{"Kadane's Algorithm","Max subarray O(n) O(1)","int max=arr[0], curr=arr[0];\nfor(int i=1;i<n;i++){\n    curr=Math.max(arr[i], curr+arr[i]);\n    max=Math.max(max, curr);\n}","At each element: extend existing subarray OR start fresh — pick whichever is bigger","Stock max profit window"},
				{"Prefix Sum Array","Build O(n), query O(1)","int[] pre=new int[n+1];\nfor(int i=0;i<n;i++) pre[i+1]=pre[i]+arr[i];\n// Query [l,r]:\nint sum=pre[r+1]-pre[l];","Build once. Any range sum = prefix[r+1] - prefix[l] in O(1)","Realtime analytics dashboards"},
				{"Dutch Flag — 3-Way Partition","Sort 0,1,2 in O(n) O(1)","int lo=0,mid=0,hi=n-1;\nwhile(mid<=hi){\n    if(arr[mid]==0) swap(arr,lo++,mid++);\n    else if(arr[mid]==1) mid++;\n    else swap(arr,mid,hi--);\n}","lo=boundary of 0s, hi=boundary of 2s, mid=unknown zone","RGB sorting, flag problems"}
		};
		case STRINGS -> new String[][]{
				{"Is Palindrome","Two pointers O(n) O(1)","int l=0,r=s.length()-1;\nwhile(l<r){\n    if(s.charAt(l)!=s.charAt(r)) return false;\n    l++; r--;\n}\nreturn true;","Move inward comparing chars — stop on first mismatch","Username validation"},
				{"Check Anagram","Frequency count O(n) O(1)","int[] freq=new int[26];\nfor(char c:a.toCharArray()) freq[c-'a']++;\nfor(char c:b.toCharArray()) freq[c-'a']--;\nfor(int f:freq) if(f!=0) return false;\nreturn true;","Count up for s1, count down for s2 — any non-zero means mismatch","Duplicate file detection"},
				{"Longest Substring No Repeat","Sliding window O(n)","Map<Character,Integer> map=new HashMap<>();\nint max=0,l=0;\nfor(int r=0;r<s.length();r++){\n    if(map.containsKey(s.charAt(r))) l=Math.max(l,map.get(s.charAt(r))+1);\n    map.put(s.charAt(r),r);\n    max=Math.max(max,r-l+1);\n}","Window [l,r]. When duplicate found, jump l to position AFTER last occurrence","Password strength checker"},
				{"Reverse Words in String","StringBuilder O(n)","String[] words=s.trim().split(\"\\\\s+\");\nStringBuilder sb=new StringBuilder();\nfor(int i=words.length-1;i>=0;i--){\n    if(sb.length()>0) sb.append(' ');\n    sb.append(words[i]);\n}","Split on whitespace, iterate in reverse, join — trim handles extra spaces","Command parser"},
				{"Valid Parentheses","Stack O(n) O(n)","Deque<Character> stack=new ArrayDeque<>();\nfor(char c:s.toCharArray()){\n    if(c=='('||c=='['||c=='{') stack.push(c);\n    else if(stack.isEmpty()||!matches(stack.pop(),c)) return false;\n}\nreturn stack.isEmpty();","Push open brackets, pop and verify on close — empty stack = balanced","Code editor syntax check"}
		};
		case DYNAMIC_PROG -> new String[][]{
				{"Fibonacci — Rolling Variables","O(n) time O(1) space","int a=0,b=1;\nfor(int i=2;i<=n;i++){\n    int c=a+b; a=b; b=c;\n}\nreturn b;","Only need last two values — slide forward, discard rest","Sequence generation"},
				{"House Robber","Max non-adjacent sum","int prev2=0,prev1=0;\nfor(int money:nums){\n    int curr=Math.max(prev1, prev2+money);\n    prev2=prev1; prev1=curr;\n}\nreturn prev1;","At each house: skip OR rob + best from 2 houses ago","Resource allocation with cooldown"},
				{"Coin Change","Min coins — unbounded knapsack","int[] dp=new int[amount+1];\nArrays.fill(dp, amount+1); // 'infinity'\ndp[0]=0;\nfor(int i=1;i<=amount;i++)\n    for(int c:coins)\n        if(c<=i) dp[i]=Math.min(dp[i], dp[i-c]+1);\nreturn dp[amount]>amount?-1:dp[amount];","Fill from 0 to amount. Each state = min coins to make exactly that value","ATM cash dispensing"},
				{"Longest Common Subsequence","2D DP O(mn)","int[][] dp=new int[m+1][n+1];\nfor(int i=1;i<=m;i++)\n    for(int j=1;j<=n;j++)\n        dp[i][j]=s1.charAt(i-1)==s2.charAt(j-1)?\n            dp[i-1][j-1]+1 : Math.max(dp[i-1][j],dp[i][j-1]);\nreturn dp[m][n];","Match=diagonal+1. No match=max of left/above","Diff tools, DNA sequence alignment"},
				{"0/1 Knapsack","Each item used at most once","boolean[] dp=new boolean[target+1];\ndp[0]=true;\nfor(int num:nums)\n    for(int j=target;j>=num;j--) // REVERSE prevents reuse\n        dp[j]|=dp[j-num];\nreturn dp[target];","Reverse inner loop = each item once. Forward = unbounded","Partition equal subset"}
		};
		case OOP -> new String[][]{
				{"Encapsulation","Private fields + validation","public class BankAccount {\n    private double balance;\n    public void deposit(double amount) {\n        if(amount>0) balance+=amount; // validate\n    }\n    public double getBalance() { return balance; }\n}","Private fields prevent invalid state — setters enforce business rules","Any domain model with invariants"},
				{"Inheritance + @Override","Reuse + specialize","class Animal { void speak(){System.out.println(\"...\");} }\nclass Dog extends Animal {\n    @Override void speak(){System.out.println(\"Woof!\");}\n}\nAnimal a=new Dog(); a.speak(); // prints Woof!","@Override = compile-time check. Polymorphic dispatch picks runtime type","Plugin/extension systems"},
				{"Interface Contract","Program to abstraction","interface Sortable { void sort(); }\nclass MergeSort implements Sortable {\n    @Override public void sort(){/*merge sort*/}\n}\nSortable algo=new MergeSort(); // swap impl easily","Code against interface, inject implementation — swap without changing callers","Strategy pattern, DI"},
				{"Abstract Class","Partial implementation","abstract class Shape {\n    abstract double area(); // must implement\n    void describe(){System.out.println(\"Area: \"+area());} // free\n}\nclass Circle extends Shape {\n    double r; Circle(double r){this.r=r;}\n    @Override double area(){return Math.PI*r*r;}\n}","Abstract = partial blueprint. Concrete subclass fills in blanks","Template method pattern"},
				{"Composition > Inheritance","HAS-A over IS-A","class Engine { void start(){/*...*/} }\nclass Car {\n    private Engine engine=new Engine(); // composition\n    void drive(){ engine.start(); }\n}","Prefer composition — less coupling, more flexible than deep inheritance","Logger, formatters, validators"}
		};
		case COLLECTIONS -> new String[][]{
				{"ArrayList vs LinkedList","Choose by access pattern","List<Integer> al=new ArrayList<>();  // O(1) get, O(n) insert mid\nList<Integer> ll=new LinkedList<>(); // O(n) get, O(1) add/remove ends\nal.add(42); ll.addFirst(1); ll.addLast(2);","ArrayList=random access. LinkedList=frequent insertions at ends","Buffer vs index structure"},
				{"HashMap Frequency Count","O(n) counting","Map<String,Integer> freq=new HashMap<>();\nfor(String word:words)\n    freq.merge(word,1,Integer::sum); // elegant\n// or: freq.put(w, freq.getOrDefault(w,0)+1)","merge(key,1,Integer::sum) is cleaner than getOrDefault","Word frequency, log analysis"},
				{"TreeMap Sorted Keys","NavigableMap operations","TreeMap<Integer,String> map=new TreeMap<>();\nmap.put(3,\"c\"); map.put(1,\"a\"); map.put(2,\"b\");\nmap.firstKey();           // 1\nmap.floorKey(2);          // 2 (largest ≤ 2)\nmap.subMap(1,true,3,true); // [1,3]","TreeMap = Red-Black tree. O(log n) but sorted iteration + range queries","Leaderboard, scheduling"},
				{"PriorityQueue — Min/Max Heap","Kth largest in O(n log k)","PriorityQueue<Integer> minHeap=new PriorityQueue<>();\nPriorityQueue<Integer> maxHeap=new PriorityQueue<>(reverseOrder());\n// Kth largest: min-heap of size k\nfor(int n:nums){\n    minHeap.offer(n);\n    if(minHeap.size()>k) minHeap.poll();\n}\nreturn minHeap.peek(); // kth largest","Keep min-heap of size k — top is always the kth largest","Top-K problems"},
				{"LinkedHashMap LRU Cache","Access order eviction","Map<Integer,Integer> cache=new LinkedHashMap<>(16,0.75f,true){\n    @Override\n    protected boolean removeEldestEntry(Map.Entry<Integer,Integer> e){\n        return size()>capacity;\n    }\n};\ncache.put(1,10); cache.get(1); cache.put(2,20);","accessOrder=true makes get() count as access — eldest = LRU","Browser cache, DB result cache"}
		};
		case MYSQL_JOINS -> new String[][]{
				{"INNER JOIN","Returns only matching rows from both tables",
						"SELECT e.name, d.department_name\nFROM employees e\nINNER JOIN departments d ON e.department_id = d.department_id;",
						"Only employees with a matching department are returned. No NULLs.","HR reporting systems"},
				{"LEFT JOIN","All rows from left table, NULLs for no match",
						"SELECT e.name, d.department_name\nFROM employees e\nLEFT JOIN departments d ON e.department_id = d.department_id;",
						"Every employee appears. Department is NULL if unassigned.","Finding orphaned records"},
				{"Find unmatched rows","LEFT JOIN + WHERE NULL trick",
						"SELECT e.name\nFROM employees e\nLEFT JOIN departments d ON e.department_id = d.department_id\nWHERE d.department_id IS NULL;",
						"Classic pattern: LEFT JOIN then filter WHERE right side IS NULL = rows with no match","Data quality checks"},
				{"Multiple JOINs","Chain three tables",
						"SELECT e.name, d.name AS dept, m.name AS manager\nFROM employees e\nLEFT JOIN departments d ON e.dept_id = d.id\nLEFT JOIN employees m ON e.manager_id = m.id;",
						"Each JOIN adds one more relationship. Order matters for LEFT JOINs.","Org chart queries"},
				{"SELF JOIN","Join a table to itself",
						"SELECT e.name AS employee, m.name AS manager\nFROM employees e\nLEFT JOIN employees m ON e.manager_id = m.id\nORDER BY m.name;",
						"Self-join uses table aliases to treat one table as two. Common for hierarchical data.","Employee hierarchy"}
		};
		case MYSQL_AGGREGATION -> new String[][]{
				{"COUNT + GROUP BY","Count rows per group",
						"SELECT department_id, COUNT(*) AS headcount\nFROM employees\nGROUP BY department_id\nORDER BY headcount DESC;",
						"COUNT(*) counts all rows, COUNT(col) skips NULLs. GROUP BY splits into buckets.","Department headcount report"},
				{"SUM + AVG","Financial aggregations",
						"SELECT\n  department_id,\n  SUM(salary) AS total_payroll,\n  ROUND(AVG(salary), 2) AS avg_salary\nFROM employees\nGROUP BY department_id;",
						"ROUND() avoids floating point noise in financial queries.","Payroll analysis"},
				{"HAVING vs WHERE","Filter before vs after grouping",
						"-- WHERE filters BEFORE grouping (fast)\nSELECT dept_id, COUNT(*) FROM employees\nWHERE hire_date > '2020-01-01'\nGROUP BY dept_id\nHAVING COUNT(*) > 5; -- HAVING filters AFTER",
						"Rule: use WHERE to filter rows, HAVING to filter groups. Never use HAVING where WHERE would work.","Performance optimization"},
				{"Window Functions","Rank without GROUP BY",
						"SELECT name, salary, department_id,\n  RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rank_in_dept\nFROM employees;",
						"Window functions compute over a partition without collapsing rows. RANK vs DENSE_RANK vs ROW_NUMBER.","Leaderboards, top-N per group"},
				{"Conditional aggregation","CASE inside aggregate",
						"SELECT department_id,\n  COUNT(CASE WHEN salary > 80000 THEN 1 END) AS high_earners,\n  COUNT(CASE WHEN salary <= 80000 THEN 1 END) AS others\nFROM employees\nGROUP BY department_id;",
						"CASE inside COUNT/SUM is a powerful pattern for pivot-like results without actual PIVOT.","Cross-tab reports"}
		};
		case MYSQL_SUBQUERY -> new String[][]{
				{"Scalar subquery","Returns single value",
						"SELECT name, salary,\n  salary - (SELECT AVG(salary) FROM employees) AS diff_from_avg\nFROM employees\nORDER BY diff_from_avg DESC;",
						"Scalar subquery in SELECT runs once. Much better than correlated subquery.","Salary comparison reports"},
				{"IN subquery","Filter with list from subquery",
						"SELECT name FROM employees\nWHERE department_id IN (\n  SELECT id FROM departments WHERE location = 'NYC'\n);",
						"IN with subquery can be slower than JOIN for large sets. Use EXISTS for better performance.","Geographic filtering"},
				{"EXISTS vs IN","Performance comparison",
						"-- EXISTS stops at first match (faster for large sets)\nSELECT e.name FROM employees e\nWHERE EXISTS (\n  SELECT 1 FROM orders o WHERE o.employee_id = e.id\n);",
						"EXISTS returns true/false — stops scanning when first match found. IN fetches all values first.","Existence checks"},
				{"CTE (WITH clause)","Readable subqueries",
						"WITH dept_avg AS (\n  SELECT department_id, AVG(salary) AS avg_sal\n  FROM employees GROUP BY department_id\n)\nSELECT e.name, e.salary, d.avg_sal\nFROM employees e\nJOIN dept_avg d ON e.department_id = d.department_id\nWHERE e.salary > d.avg_sal;",
						"CTEs are named subqueries, evaluated once. Much more readable than nested subqueries.","Complex multi-step queries"},
				{"NOT IN pitfall","NULL breaks NOT IN",
						"-- DANGEROUS: returns nothing if any value is NULL!\nSELECT name FROM a WHERE id NOT IN (SELECT fk FROM b);\n\n-- SAFE: use NOT EXISTS instead\nSELECT name FROM a WHERE NOT EXISTS (\n  SELECT 1 FROM b WHERE b.fk = a.id\n);",
						"NOT IN returns empty set if subquery contains even one NULL. NOT EXISTS is always safe.","Data quality"}
		};
		case MYSQL_INDEX, MYSQL_TRANSACTION, MYSQL_PROCEDURE, MYSQL_GENERIC -> generateMysqlGenericExamples(title);
		case AWS_COMPUTE, AWS_STORAGE, AWS_DATABASE, AWS_SERVERLESS, AWS_GENERIC -> generateAwsExamples(title, p);
		default -> generateGenericExamples(title);
	};

	List<ExampleSeedDto> list = new ArrayList<>();
	for (int i = 0; i < raw.length; i++) {
		var ex = new ExampleSeedDto();
		ex.setDisplayOrder(i + 1);
		ex.setTitle(raw[i][0]);
		ex.setDescription(raw[i][1]);
		ex.setCode(raw[i][2]);
		ex.setExplanation(raw[i][3]);
		ex.setRealWorldUse(raw[i][4]);
		list.add(ex);
	}
	return list;
}

private String[][] generateMysqlGenericExamples(String title) {
	return new String[][]{
			{"Basic SELECT","Retrieve filtered data", "SELECT id, name, salary FROM employees\nWHERE salary > 50000\nORDER BY salary DESC\nLIMIT 10;", "WHERE filters rows, ORDER BY sorts, LIMIT restricts count.", "Basic data retrieval"},
			{"INSERT","Add new records", "INSERT INTO employees (name, email, salary, dept_id)\nVALUES ('Alice', 'alice@co.com', 75000, 3),\n       ('Bob',   'bob@co.com',   65000, 2);", "Multi-row INSERT is more efficient than multiple single-row inserts.", "Data entry"},
			{"UPDATE with JOIN","Update based on related table", "UPDATE employees e\nJOIN departments d ON e.dept_id = d.id\nSET e.salary = e.salary * 1.1\nWHERE d.name = 'Engineering';", "JOIN in UPDATE allows filtering based on related table data.", "Bulk updates"},
			{"DELETE safely","Delete with subquery check", "-- Check first\nSELECT COUNT(*) FROM employees WHERE hire_date < '2015-01-01';\n-- Then delete\nDELETE FROM employees WHERE hire_date < '2015-01-01';", "Always SELECT before DELETE to verify affected rows.", "Data cleanup"},
			{"CASE expression","Conditional logic in SQL", "SELECT name, salary,\n  CASE\n    WHEN salary >= 100000 THEN 'Senior'\n    WHEN salary >= 70000  THEN 'Mid'\n    ELSE 'Junior'\n  END AS level\nFROM employees;", "CASE in SELECT creates computed columns. Equivalent to if-else in application code.", "Data classification"}
	};
}

private String[][] generateAwsExamples(String title, Pattern p) {
	String svc = p == Pattern.AWS_COMPUTE ? "EC2/Auto Scaling" :
			p == Pattern.AWS_STORAGE ? "S3/EBS/EFS" :
					p == Pattern.AWS_DATABASE ? "RDS/DynamoDB" :
							p == Pattern.AWS_SERVERLESS ? "Lambda/API Gateway" : "AWS Services";
	return new String[][]{
			{"Core concept: " + svc, "Fundamental usage pattern",
					"# " + title + " — Core concept\n# Study AWS documentation and practice in AWS Console\n# https://docs.aws.amazon.com",
					"Understand when and why to use " + title, "Production cloud architectures"},
			{"High Availability", "Multi-AZ deployment pattern",
					"# Deploy across multiple Availability Zones:\n# - Primary in us-east-1a\n# - Standby in us-east-1b\n# - Auto-failover in < 60 seconds",
					"Always design for failure. Single AZ = single point of failure.", "Production workloads"},
			{"Cost Optimization", "Right-sizing and reserved capacity",
					"# Reserved Instances: 1-3 year commitment = up to 75% savings\n# Spot Instances: spare capacity = up to 90% savings\n# Savings Plans: flexible commitment by $/hr",
					"Largest AWS cost driver is over-provisioned resources.", "FinOps / cost management"},
			{"Security Best Practices", "IAM and least privilege",
					"# Principles:\n# 1. Least privilege — grant minimum needed permissions\n# 2. Enable MFA for all users\n# 3. Rotate access keys regularly\n# 4. Use IAM roles, not access keys on EC2",
					"Security is a shared responsibility. AWS secures infrastructure; you secure your data and access.", "Security compliance"},
			{"Monitoring", "CloudWatch metrics and alarms",
					"# Key metrics to monitor:\n# - CPUUtilization > 80% → scale out\n# - 5xx errors → investigate application\n# - Latency P99 > threshold → performance issue\n# Set CloudWatch alarms → SNS → PagerDuty",
					"You can't manage what you don't measure. Set alarms before problems occur.", "Production operations"}
	};
}

private String[][] generateGenericExamples(String title) {
	String[] labels = {"Core concept", "Common pattern", "Optimization", "Edge case", "Real-world use"};
	String[][] out = new String[5][5];
	for (int i = 0; i < 5; i++) {
		out[i][0] = labels[i] + ": " + title;
		out[i][1] = labels[i] + " applied to " + title;
		out[i][2] = "// " + title + " — " + labels[i] + "\n// Implement the key pattern here";
		out[i][3] = "Understand how " + title + " " + labels[i].toLowerCase() + " works";
		out[i][4] = "Production systems using " + title;
	}
	return out;
}

// ── Problems (20: 6 Easy + 8 Medium + 6 Hard) ─────────────────────────────

private List<ProblemSeedDto> problems(String title, Pattern p) {
	var specs = getProblemSpecs(title, p);
	List<ProblemSeedDto> list = new ArrayList<>();
	// Map pattern enum to the canonical string used by AlgorithmDetectorService
	String patternTag = switch (p) {
		case TWO_POINTER    -> "TWO_POINTER";
		case SLIDING_WINDOW -> "SLIDING_WINDOW";
		case SEARCHING      -> "BINARY_SEARCH";
		case HASHING        -> "HASH_MAP";
		case RECURSION      -> "RECURSION";
		case DYNAMIC_PROG   -> "DYNAMIC_PROGRAMMING";
		case GREEDY         -> "GREEDY";
		case PREFIX_SUM     -> "PREFIX_SUM";
		case GRAPHS         -> "BFS";
		default             -> p.name();
	};
	for (int i = 0; i < 20; i++) {
		String diff = i < 6 ? "EASY" : i < 14 ? "MEDIUM" : "HARD";
		String[] spec = i < specs.size() ? specs.get(i) : makeGenericSpec(title, i);
		var prob = new ProblemSeedDto();
		prob.setDisplayOrder(i + 1);
		prob.setTitle(spec[0]);
		prob.setDescription(spec[1]);
		prob.setInputFormat(spec[2]);
		prob.setOutputFormat(spec[3]);
		prob.setSampleInput(spec[4]);
		prob.setSampleOutput(spec[5]);
		try {
			String tcJson = "[{\"input\":\"" + spec[4].replace("\n","\\n").replace("\"","\\\"") + "\",\"expectedOutput\":\"" + spec[5].replace("\"","\\\"") + "\"}]";
			prob.setTestCases(mapper.readTree(tcJson));
		} catch (Exception _e) { prob.setTestCases(mapper.createArrayNode()); }
		prob.setDifficulty(diff);
		prob.setHint(spec[6]);
		prob.setStarterCode(spec[7]);
		prob.setPattern(patternTag);
		// Phase 1: 3-tier hint ladder
		prob.setHint1(buildHint1(spec[6], diff));
		prob.setHint2(buildHint2(spec[0], p, diff));
		prob.setHint3("Pseudocode approach:\n1. " + spec[6] + "\n2. Iterate through the input applying the " + title + " pattern.\n3. Return the computed result.\n\n// Starter structure:\n" + spec[7].lines().limit(6).reduce("", (a, b) -> a + b + "\n"));
		list.add(prob);
	}
	return list;
}

/** Phase 1: Hint 1 — direction only, no algorithm revealed */
private String buildHint1(String hint, String diff) {
	if (diff.equals("EASY")) {
		return "Think about what single value or condition you need to track as you iterate through the input once.";
	} else if (diff.equals("MEDIUM")) {
		return "Consider what information from earlier in the input would help you avoid recomputing at each step.";
	} else {
		return "Think about breaking the problem into two simpler subproblems. Can you solve each independently and combine?";
	}
}

/** Phase 1: Hint 2 — reveals the pattern name and approach */
private String buildHint2(String title, Pattern p, String diff) {
	return switch (p) {
		case TWO_POINTER    -> "Use Two Pointer: place one index at the start and one at the end of the sorted input. Move them toward each other based on whether the current result is too large or too small.";
		case SLIDING_WINDOW -> "Use Sliding Window: maintain a running window of size k (or variable size). When you move the window right, add the new element and subtract the element that left. Avoid recomputing the whole window sum.";
		case SEARCHING      -> "Use Binary Search: if the array is sorted (or the answer space is monotonic), you can eliminate half the possibilities at each step. Find mid, compare, decide which half to keep.";
		case HASHING        -> "Use a HashMap: before inserting each element, check whether its complement (or pair) already exists in the map. This converts an O(n²) nested loop into a single O(n) pass.";
		case RECURSION      -> "Use Recursion: define the base case first (smallest input that you can answer directly). Then define how the answer to input n depends on the answer to input n-1 (or a smaller sub-input). Trust the recursive call.";
		case DYNAMIC_PROG   -> "Use Dynamic Programming: define dp[i] as the answer to the subproblem of size i. Write the recurrence: dp[i] depends on dp[i-1] (or dp[i-j] for some j). Fill from the base case upward.";
		case GREEDY         -> "Use Greedy: sort by the relevant criterion first. Then iterate once, always making the locally optimal choice. Never go back.";
		case PREFIX_SUM     -> "Use Prefix Sum: build prefix[i] = sum of elements 0..i in one pass. Then any range sum(l, r) = prefix[r] - prefix[l-1] in O(1).";
		case GRAPHS         -> "Use BFS: add the starting node to a queue and a visited set. While the queue is not empty, dequeue a node, process it, and enqueue its unvisited neighbours.";
		case BACKTRACKING   -> "Use Backtracking: at each step, try placing/choosing an option. Recurse. If you hit an invalid state, undo the last choice and try the next option.";
		default             -> "Think about the core data structure that gives you O(1) access to the information you need most. Apply " + title + " to avoid recomputation.";
	};
}

private List<String[]> getProblemSpecs(String title, Pattern p) {
	return switch (p) {
		case ARRAYS -> List.of(
				sp("Find Maximum","Return the maximum element","n then n integers","maximum integer","5\n3 1 4 1 5","5","Single pass, track running max","import java.util.*;\npublic class Main{public static void main(String[] a){Scanner sc=new Scanner(System.in);int n=sc.nextInt(),max=Integer.MIN_VALUE;for(int i=0;i<n;i++){int v=sc.nextInt();max=Math.max(max,v);}System.out.println(max);}}"),
				sp("Find Minimum","Return the minimum element","n then n integers","minimum integer","5\n3 1 4 1 5","1","Single pass, track running min","import java.util.*;\npublic class Main{public static void main(String[] a){Scanner sc=new Scanner(System.in);int n=sc.nextInt(),min=Integer.MAX_VALUE;for(int i=0;i<n;i++){int v=sc.nextInt();min=Math.min(min,v);}System.out.println(min);}}"),
				sp("Array Sum","Sum all elements","n then n integers","sum","5\n1 2 3 4 5","15","Single accumulator variable","import java.util.*;\npublic class Main{public static void main(String[] a){Scanner sc=new Scanner(System.in);int n=sc.nextInt(),s=0;for(int i=0;i<n;i++)s+=sc.nextInt();System.out.println(s);}}"),
				sp("Reverse Array","Reverse array in-place","n then n integers","reversed array on one line","5\n1 2 3 4 5","5 4 3 2 1","Two pointers from both ends","import java.util.*;\npublic class Main{public static void main(String[] a){Scanner sc=new Scanner(System.in);int n=sc.nextInt();int[] arr=new int[n];for(int i=0;i<n;i++)arr[i]=sc.nextInt();for(int l=0,r=n-1;l<r;l++,r--){int t=arr[l];arr[l]=arr[r];arr[r]=t;}StringBuilder sb=new StringBuilder();for(int i=0;i<n;i++){if(i>0)sb.append(' ');sb.append(arr[i]);}System.out.println(sb);}}"),
				sp("Contains Duplicate","True if any value appears twice","n then n integers","true or false","5\n1 2 3 1 4","true","HashSet.add() returns false on duplicate","import java.util.*;\npublic class Main{public static void main(String[] a){Scanner sc=new Scanner(System.in);int n=sc.nextInt();Set<Integer> s=new HashSet<>();boolean dup=false;for(int i=0;i<n;i++)if(!s.add(sc.nextInt()))dup=true;System.out.println(dup);}}"),
				sp("Count Even/Odd","Count evens and odds","n then n integers","evens odds on one line","6\n1 2 3 4 5 6","3 3","Check n%2==0","import java.util.*;\npublic class Main{public static void main(String[] a){Scanner sc=new Scanner(System.in);int n=sc.nextInt(),e=0,o=0;for(int i=0;i<n;i++){if(sc.nextInt()%2==0)e++;else o++;}System.out.println(e+\" \"+o);}}"),
				sp("Two Sum","Find indices of pair summing to target","n, target, then array","two space-separated indices","4\n9\n2 7 11 15","0 1","HashMap: check complement before inserting","import java.util.*;\npublic class Main{public static void main(String[] a){Scanner sc=new Scanner(System.in);int n=sc.nextInt(),t=sc.nextInt();int[] arr=new int[n];for(int i=0;i<n;i++)arr[i]=sc.nextInt();Map<Integer,Integer> m=new HashMap<>();for(int i=0;i<n;i++){int c=t-arr[i];if(m.containsKey(c)){System.out.println(m.get(c)+\" \"+i);return;}m.put(arr[i],i);}}}"),
				sp("Max Subarray Sum","Kadane's algorithm","n then n integers","max sum","6\n-2 1 -3 4 -1 2","6","curr=max(arr[i], curr+arr[i])","import java.util.*;\npublic class Main{public static void main(String[] a){Scanner sc=new Scanner(System.in);int n=sc.nextInt();int[] arr=new int[n];for(int i=0;i<n;i++)arr[i]=sc.nextInt();int max=arr[0],curr=arr[0];for(int i=1;i<n;i++){curr=Math.max(arr[i],curr+arr[i]);max=Math.max(max,curr);}System.out.println(max);}}"),
				sp("Move Zeroes","Move zeros to end, preserve order","n then array","rearranged array","6\n0 1 0 3 12 0","1 3 12 0 0 0","Write pointer for non-zeros","import java.util.*;\npublic class Main{public static void main(String[] a){Scanner sc=new Scanner(System.in);int n=sc.nextInt();int[] arr=new int[n];for(int i=0;i<n;i++)arr[i]=sc.nextInt();int w=0;for(int v:arr)if(v!=0)arr[w++]=v;while(w<n)arr[w++]=0;StringBuilder sb=new StringBuilder();for(int i=0;i<n;i++){if(i>0)sb.append(' ');sb.append(arr[i]);}System.out.println(sb);}}"),
				sp("Best Time to Buy and Sell","Single transaction max profit","n then prices","max profit","6\n7 1 5 3 6 4","5","Track minimum price seen so far","import java.util.*;\npublic class Main{public static void main(String[] a){Scanner sc=new Scanner(System.in);int n=sc.nextInt();int[] p=new int[n];for(int i=0;i<n;i++)p[i]=sc.nextInt();int min=p[0],profit=0;for(int i=1;i<n;i++){profit=Math.max(profit,p[i]-min);min=Math.min(min,p[i]);}System.out.println(profit);}}"),
				sp("Product Except Self","Product of all elements except index i","n then array","result array","4\n1 2 3 4","24 12 8 6","Prefix product * suffix product","import java.util.*;\npublic class Main{public static void main(String[] a){Scanner sc=new Scanner(System.in);int n=sc.nextInt();int[] arr=new int[n];for(int i=0;i<n;i++)arr[i]=sc.nextInt();int[] out=new int[n];out[0]=1;for(int i=1;i<n;i++)out[i]=out[i-1]*arr[i-1];int r=1;for(int i=n-1;i>=0;i--){out[i]*=r;r*=arr[i];}StringBuilder sb=new StringBuilder();for(int i=0;i<n;i++){if(i>0)sb.append(' ');sb.append(out[i]);}System.out.println(sb);}}"),
				sp("Container With Most Water","Max water between height bars","n then heights","max water","6\n1 8 6 2 5 4","25","Two pointers, move the shorter bar inward","import java.util.*;\npublic class Main{public static void main(String[] a){Scanner sc=new Scanner(System.in);int n=sc.nextInt();int[] h=new int[n];for(int i=0;i<n;i++)h[i]=sc.nextInt();int l=0,r=n-1,max=0;while(l<r){max=Math.max(max,Math.min(h[l],h[r])*(r-l));if(h[l]<h[r])l++;else r--;}System.out.println(max);}}"),
				sp("Subarray Sum Equals K","Count subarrays summing to k","n k then array","count","5\n2\n1 1 1 1 1","4","Prefix sum + HashMap: count[sum-k]","import java.util.*;\npublic class Main{public static void main(String[] a){Scanner sc=new Scanner(System.in);int n=sc.nextInt(),k=sc.nextInt();int[] arr=new int[n];for(int i=0;i<n;i++)arr[i]=sc.nextInt();Map<Integer,Integer> map=new HashMap<>();map.put(0,1);int sum=0,cnt=0;for(int v:arr){sum+=v;cnt+=map.getOrDefault(sum-k,0);map.merge(sum,1,Integer::sum);}System.out.println(cnt);}}"),
				sp("Trapping Rain Water","Trapped water between bars","n then heights","total water","6\n0 1 0 2 1 0","3","maxLeft[i] and maxRight[i] determine water at i","import java.util.*;\npublic class Main{public static void main(String[] a){Scanner sc=new Scanner(System.in);int n=sc.nextInt();int[] h=new int[n];for(int i=0;i<n;i++)h[i]=sc.nextInt();int[] lmax=new int[n],rmax=new int[n];lmax[0]=h[0];for(int i=1;i<n;i++)lmax[i]=Math.max(lmax[i-1],h[i]);rmax[n-1]=h[n-1];for(int i=n-2;i>=0;i--)rmax[i]=Math.max(rmax[i+1],h[i]);int water=0;for(int i=0;i<n;i++)water+=Math.min(lmax[i],rmax[i])-h[i];System.out.println(water);}}"),
				sp("Longest Consecutive Sequence","Longest run in unsorted array","n then array","length","8\n100 4 200 1 3 2 101 102","4","HashSet + only start from smallest in chain","import java.util.*;\npublic class Main{public static void main(String[] a){Scanner sc=new Scanner(System.in);int n=sc.nextInt();Set<Integer> s=new HashSet<>();for(int i=0;i<n;i++)s.add(sc.nextInt());int best=0;for(int v:s)if(!s.contains(v-1)){int len=1;while(s.contains(v+len))len++;best=Math.max(best,len);}System.out.println(best);}}"),
				sp("3Sum — Unique Triplets","Find all triplets summing to 0","n then array","count of unique triplets","6\n-1 0 1 2 -1 -4","2","Sort + two pointers, skip duplicates","import java.util.*;\npublic class Main{public static void main(String[] a){Scanner sc=new Scanner(System.in);int n=sc.nextInt();int[] arr=new int[n];for(int i=0;i<n;i++)arr[i]=sc.nextInt();Arrays.sort(arr);int cnt=0;for(int i=0;i<n-2;i++){if(i>0&&arr[i]==arr[i-1])continue;int l=i+1,r=n-1;while(l<r){int s=arr[i]+arr[l]+arr[r];if(s==0){cnt++;while(l<r&&arr[l]==arr[l+1])l++;while(l<r&&arr[r]==arr[r-1])r--;l++;r--;}else if(s<0)l++;else r--;}}System.out.println(cnt);}}"),
				sp("Merge Intervals","Merge all overlapping intervals","n then n pairs","merged count","5\n1 3\n2 6\n8 10\n15 18\n2 4","3","Sort by start, merge if overlap","import java.util.*;\npublic class Main{public static void main(String[] a){Scanner sc=new Scanner(System.in);int n=sc.nextInt();int[][] iv=new int[n][2];for(int i=0;i<n;i++){iv[i][0]=sc.nextInt();iv[i][1]=sc.nextInt();}Arrays.sort(iv,(x,y)->x[0]-y[0]);List<int[]> res=new ArrayList<>();for(int[] cur:iv){if(res.isEmpty()||res.get(res.size()-1)[1]<cur[0])res.add(cur);else res.get(res.size()-1)[1]=Math.max(res.get(res.size()-1)[1],cur[1]);}System.out.println(res.size());}}"),
				sp("Spiral Matrix","Traverse matrix in spiral order","rows cols then matrix","space-separated elements","3\n3\n1 2 3\n4 5 6\n7 8 9","1 2 3 6 9 8 7 4 5","Four boundaries: top/bottom/left/right","import java.util.*;\npublic class Main{public static void main(String[] a){Scanner sc=new Scanner(System.in);int r=sc.nextInt(),c=sc.nextInt();int[][] m=new int[r][c];for(int i=0;i<r;i++)for(int j=0;j<c;j++)m[i][j]=sc.nextInt();int t=0,b=r-1,l=0,ri=c-1;StringBuilder sb=new StringBuilder();while(t<=b&&l<=ri){for(int j=l;j<=ri;j++){if(sb.length()>0)sb.append(' ');sb.append(m[t][j]);}t++;for(int i=t;i<=b;i++){sb.append(' ').append(m[i][ri]);}ri--;if(t<=b){for(int j=ri;j>=l;j--){sb.append(' ').append(m[b][j]);}b--;}if(l<=ri){for(int i=b;i>=t;i--){sb.append(' ').append(m[i][l]);}l++;}}System.out.println(sb);}}"),
				sp("Jump Game II","Min jumps to reach end","n then jump array","min jumps","5\n2 3 1 1 4","2","Greedy: furthest reachable from current window","import java.util.*;\npublic class Main{public static void main(String[] a){Scanner sc=new Scanner(System.in);int n=sc.nextInt();int[] arr=new int[n];for(int i=0;i<n;i++)arr[i]=sc.nextInt();int jumps=0,curr=0,far=0;for(int i=0;i<n-1;i++){far=Math.max(far,i+arr[i]);if(i==curr){jumps++;curr=far;}}System.out.println(jumps);}}"),
				sp("Median of Two Sorted Arrays","Median without merging O(log n)","m n then both arrays","median as decimal","3\n4\n1 3 7\n2 4 6 8","4.5","Binary search on smaller array partition","import java.util.*;\npublic class Main{public static void main(String[] a){Scanner sc=new Scanner(System.in);int m=sc.nextInt(),n=sc.nextInt();int[] A=new int[m],B=new int[n];for(int i=0;i<m;i++)A[i]=sc.nextInt();for(int i=0;i<n;i++)B[i]=sc.nextInt();// Merge approach for correctness\nint[] all=new int[m+n];System.arraycopy(A,0,all,0,m);System.arraycopy(B,0,all,m,n);Arrays.sort(all);int tot=m+n;if(tot%2==1)System.out.println(all[tot/2]);else System.out.printf(\"%.1f%n\",(all[tot/2-1]+all[tot/2])/2.0);}}")
		);
		case DYNAMIC_PROG -> List.of(
				sp("Fibonacci Number","Compute nth Fibonacci number","single integer n","nth Fibonacci","10","55","Roll two variables: a=fib(n-2), b=fib(n-1)","import java.util.*;\npublic class Main{public static void main(String[] a){Scanner sc=new Scanner(System.in);int n=sc.nextInt();if(n<=1){System.out.println(n);return;}int prev=0,curr=1;for(int i=2;i<=n;i++){int tmp=curr;curr=prev+curr;prev=tmp;}System.out.println(curr);}}"),
				sp("Climbing Stairs","Ways to climb n stairs (1 or 2 steps)","single n","number of ways","6","13","dp[i]=dp[i-1]+dp[i-2], same as Fibonacci","import java.util.*;\npublic class Main{public static void main(String[] a){Scanner sc=new Scanner(System.in);int n=sc.nextInt();if(n<=2){System.out.println(n);return;}int a=1,b=2;for(int i=3;i<=n;i++){int c=a+b;a=b;b=c;}System.out.println(b);}}"),
				sp("Min Cost Climbing Stairs","Min cost to reach top","n then costs","min cost","6\n10 15 20 5 30 100","35","dp[i]=cost[i]+min(dp[i-1],dp[i-2])","import java.util.*;\npublic class Main{public static void main(String[] a){Scanner sc=new Scanner(System.in);int n=sc.nextInt();int[] c=new int[n];for(int i=0;i<n;i++)c[i]=sc.nextInt();int a=c[0],b=c[1];for(int i=2;i<n;i++){int tmp=c[i]+Math.min(a,b);a=b;b=tmp;}System.out.println(Math.min(a,b));}}"),
				sp("House Robber","Max sum non-adjacent elements","n then values","max","6\n2 7 9 3 1 5","16","curr=max(prev1, prev2+curr)","import java.util.*;\npublic class Main{public static void main(String[] a){Scanner sc=new Scanner(System.in);int n=sc.nextInt();int prev2=0,prev1=0;for(int i=0;i<n;i++){int v=sc.nextInt();int t=Math.max(prev1,prev2+v);prev2=prev1;prev1=t;}System.out.println(prev1);}}"),
				sp("Count Paths in Grid","Unique paths top-left to bottom-right","rows cols","count paths","3\n3","6","dp[i][j]=dp[i-1][j]+dp[i][j-1], border=1","import java.util.*;\npublic class Main{public static void main(String[] a){Scanner sc=new Scanner(System.in);int m=sc.nextInt(),n=sc.nextInt();int[][] dp=new int[m][n];for(int i=0;i<m;i++)dp[i][0]=1;for(int j=0;j<n;j++)dp[0][j]=1;for(int i=1;i<m;i++)for(int j=1;j<n;j++)dp[i][j]=dp[i-1][j]+dp[i][j-1];System.out.println(dp[m-1][n-1]);}}"),
				sp("Longest Increasing Subsequence Length","LIS length","n then array","LIS length","8\n10 9 2 5 3 7 101 18","4","dp[i]=max(dp[j]+1) for j<i with arr[j]<arr[i]","import java.util.*;\npublic class Main{public static void main(String[] a){Scanner sc=new Scanner(System.in);int n=sc.nextInt();int[] arr=new int[n],dp=new int[n];for(int i=0;i<n;i++)arr[i]=sc.nextInt();Arrays.fill(dp,1);int max=1;for(int i=1;i<n;i++){for(int j=0;j<i;j++)if(arr[j]<arr[i])dp[i]=Math.max(dp[i],dp[j]+1);max=Math.max(max,dp[i]);}System.out.println(max);}}"),
				sp("Coin Change — Min Coins","Fewest coins to make amount","coins count then coins, then target","min coins (-1 if impossible)","3\n1 5 6\n11","2","Fill dp[1..amount] = min(dp[i-coin]+1)","import java.util.*;\npublic class Main{public static void main(String[] a){Scanner sc=new Scanner(System.in);int n=sc.nextInt();int[] coins=new int[n];for(int i=0;i<n;i++)coins[i]=sc.nextInt();int T=sc.nextInt();int[] dp=new int[T+1];Arrays.fill(dp,T+1);dp[0]=0;for(int i=1;i<=T;i++)for(int c:coins)if(c<=i)dp[i]=Math.min(dp[i],dp[i-c]+1);System.out.println(dp[T]>T?-1:dp[T]);}}"),
				sp("Count Coin Combinations","Ways to make amount","n amount then coins","count","3\n4\n1 2 3","4","Outer=coins, inner=amounts (unbounded)","import java.util.*;\npublic class Main{public static void main(String[] a){Scanner sc=new Scanner(System.in);int n=sc.nextInt(),T=sc.nextInt();int[] coins=new int[n];for(int i=0;i<n;i++)coins[i]=sc.nextInt();long[] dp=new long[T+1];dp[0]=1;for(int c:coins)for(int j=c;j<=T;j++)dp[j]+=dp[j-c];System.out.println(dp[T]);}}"),
				sp("0-1 Knapsack","Max value within weight limit","n W then weights and values","max value","4\n10\n2 3 4 5\n3 4 5 7","12","dp[w]=max(dp[w], dp[w-wt]+val) reverse iteration","import java.util.*;\npublic class Main{public static void main(String[] a){Scanner sc=new Scanner(System.in);int n=sc.nextInt(),W=sc.nextInt();int[] wt=new int[n],val=new int[n];for(int i=0;i<n;i++)wt[i]=sc.nextInt();for(int i=0;i<n;i++)val[i]=sc.nextInt();int[] dp=new int[W+1];for(int i=0;i<n;i++)for(int w=W;w>=wt[i];w--)dp[w]=Math.max(dp[w],dp[w-wt[i]]+val[i]);System.out.println(dp[W]);}}"),
				sp("LCS Length","Longest Common Subsequence","m n then two strings","LCS length","4\n6\nABCD\nACBCAD","4","Match=diagonal+1, else max(left,above)","import java.util.*;\npublic class Main{public static void main(String[] a){Scanner sc=new Scanner(System.in);int m=sc.nextInt(),n=sc.nextInt();String s1=sc.next(),s2=sc.next();int[][] dp=new int[m+1][n+1];for(int i=1;i<=m;i++)for(int j=1;j<=n;j++)dp[i][j]=s1.charAt(i-1)==s2.charAt(j-1)?dp[i-1][j-1]+1:Math.max(dp[i-1][j],dp[i][j-1]);System.out.println(dp[m][n]);}}"),
				sp("Edit Distance","Min operations to convert s1 to s2","two strings","edit distance","6\n7\nhorse\nros","3","Match=diagonal, else 1+min(left,above,diagonal)","import java.util.*;\npublic class Main{public static void main(String[] a){Scanner sc=new Scanner(System.in);int m=sc.nextInt(),n=sc.nextInt();String s1=sc.next(),s2=sc.next();int[][] dp=new int[m+1][n+1];for(int i=0;i<=m;i++)dp[i][0]=i;for(int j=0;j<=n;j++)dp[0][j]=j;for(int i=1;i<=m;i++)for(int j=1;j<=n;j++)dp[i][j]=s1.charAt(i-1)==s2.charAt(j-1)?dp[i-1][j-1]:1+Math.min(dp[i-1][j-1],Math.min(dp[i-1][j],dp[i][j-1]));System.out.println(dp[m][n]);}}"),
				sp("Partition Equal Subset","Can array be split into two equal sums","n then array","true or false","5\n1 5 11 5 3","true","0-1 knapsack: find subset summing to total/2","import java.util.*;\npublic class Main{public static void main(String[] a){Scanner sc=new Scanner(System.in);int n=sc.nextInt(),total=0;int[] arr=new int[n];for(int i=0;i<n;i++){arr[i]=sc.nextInt();total+=arr[i];}if(total%2!=0){System.out.println(false);return;}int T=total/2;boolean[] dp=new boolean[T+1];dp[0]=true;for(int v:arr)for(int j=T;j>=v;j--)dp[j]|=dp[j-v];System.out.println(dp[T]);}}"),
				sp("Word Break","Can string be segmented from dictionary","word count then words then string","true or false","3\nleet code\nleetcode","true","dp[i]=true if dp[j] && dict.contains(s[j..i])","import java.util.*;\npublic class Main{public static void main(String[] a){Scanner sc=new Scanner(System.in);int n=sc.nextInt();Set<String> dict=new HashSet<>();for(int i=0;i<n;i++)dict.add(sc.next());String s=sc.next();int len=s.length();boolean[] dp=new boolean[len+1];dp[0]=true;for(int i=1;i<=len;i++)for(int j=0;j<i;j++)if(dp[j]&&dict.contains(s.substring(j,i))){dp[i]=true;break;}System.out.println(dp[len]);}}"),
				sp("Decode Ways","Ways to decode digit string","digit string","count","8\n2 2 6 1 1 2 6 3","3","dp[i]=dp[i-1] if valid single, +dp[i-2] if valid pair","import java.util.*;\npublic class Main{public static void main(String[] a){Scanner sc=new Scanner(System.in);String s=sc.next();int n=s.length();int[] dp=new int[n+1];dp[0]=1;dp[1]=s.charAt(0)!='0'?1:0;for(int i=2;i<=n;i++){int one=s.charAt(i-1)-'0';int two=Integer.parseInt(s.substring(i-2,i));if(one>=1)dp[i]+=dp[i-1];if(two>=10&&two<=26)dp[i]+=dp[i-2];}System.out.println(dp[n]);}}"),
				sp("Burst Balloons","Max coins from bursting all balloons","n then values","max coins","4\n3 1 5 8","167","dp[i][j]=max over each last balloon k in range","import java.util.*;\npublic class Main{public static void main(String[] a){Scanner sc=new Scanner(System.in);int n=sc.nextInt();int[] b=new int[n+2];b[0]=b[n+1]=1;for(int i=1;i<=n;i++)b[i]=sc.nextInt();int[][] dp=new int[n+2][n+2];for(int len=1;len<=n;len++)for(int l=1;l+len-1<=n;l++){int r=l+len-1;for(int k=l;k<=r;k++)dp[l][r]=Math.max(dp[l][r],dp[l][k-1]+b[l-1]*b[k]*b[r+1]+dp[k+1][r]);}System.out.println(dp[1][n]);}}"),
				sp("Regular Expression Match","'.' matches any char, '*' zero or more","pattern string","true or false","4\n5\naa\na*","true","dp[i][j]=match s[0..i-1] with p[0..j-1]","import java.util.*;\npublic class Main{public static void main(String[] a){Scanner sc=new Scanner(System.in);int m=sc.nextInt(),n=sc.nextInt();String s=sc.next(),p=sc.next();boolean[][] dp=new boolean[m+1][n+1];dp[0][0]=true;for(int j=2;j<=n;j++)if(p.charAt(j-1)=='*')dp[0][j]=dp[0][j-2];for(int i=1;i<=m;i++)for(int j=1;j<=n;j++){char ps=p.charAt(j-1);if(ps=='*'){dp[i][j]=dp[i][j-2]||(j>=2&&(p.charAt(j-2)=='.'||p.charAt(j-2)==s.charAt(i-1))&&dp[i-1][j]);}else dp[i][j]=(ps=='.'||ps==s.charAt(i-1))&&dp[i-1][j-1];}System.out.println(dp[m][n]);}}"),
				sp("Wildcard Match","'?' any single char, '*' any sequence","pattern string","true or false","4\n5\naab\na*b","true","dp[i][j] for matching s[i..] with p[j..]","import java.util.*;\npublic class Main{public static void main(String[] a){Scanner sc=new Scanner(System.in);int m=sc.nextInt(),n=sc.nextInt();String s=sc.next(),p=sc.next();boolean[][] dp=new boolean[m+1][n+1];dp[0][0]=true;for(int j=1;j<=n;j++)if(p.charAt(j-1)=='*')dp[0][j]=dp[0][j-1];for(int i=1;i<=m;i++)for(int j=1;j<=n;j++){char c=p.charAt(j-1);if(c=='*')dp[i][j]=dp[i-1][j]||dp[i][j-1];else dp[i][j]=(c=='?'||c==s.charAt(i-1))&&dp[i-1][j-1];}System.out.println(dp[m][n]);}}"),
				sp("Palindrome Partitioning Count","Min cuts for palindrome partitions","string","min cuts","5\naabbc","1","dp[i]=min cuts for s[0..i]","import java.util.*;\npublic class Main{public static void main(String[] a){Scanner sc=new Scanner(System.in);String s=sc.next();int n=s.length();boolean[][] pal=new boolean[n][n];for(int i=n-1;i>=0;i--)for(int j=i;j<n;j++)pal[i][j]=(s.charAt(i)==s.charAt(j))&&(j-i<=2||pal[i+1][j-1]);int[] dp=new int[n];Arrays.fill(dp,Integer.MAX_VALUE);for(int i=0;i<n;i++){if(pal[0][i]){dp[i]=0;continue;}for(int j=1;j<=i;j++)if(pal[j][i])dp[i]=Math.min(dp[i],dp[j-1]+1);}System.out.println(dp[n-1]);}}"),
				sp("Distinct Subsequences","Count distinct subsequences of t in s","two strings","count","5\n3\nrabbbit\nrab","3","dp[i][j]=ways to form t[0..j-1] from s[0..i-1]","import java.util.*;\npublic class Main{public static void main(String[] a){Scanner sc=new Scanner(System.in);int m=sc.nextInt(),n=sc.nextInt();String s=sc.next(),t=sc.next();long[][] dp=new long[m+1][n+1];for(int i=0;i<=m;i++)dp[i][0]=1;for(int i=1;i<=m;i++)for(int j=1;j<=n;j++){dp[i][j]=dp[i-1][j];if(s.charAt(i-1)==t.charAt(j-1))dp[i][j]+=dp[i-1][j-1];}System.out.println(dp[m][n]);}}"),
				sp("Cherry Pickup II","Max cherries two robots collect top to bottom","rows cols then grid","max cherries","3\n4\n3 1 1 2\n0 0 0 1\n3 0 0 0","5","3D DP: state is (row, col1, col2) for both robots","import java.util.*;\npublic class Main{public static void main(String[] a){Scanner sc=new Scanner(System.in);int rows=sc.nextInt(),cols=sc.nextInt();int[][] g=new int[rows][cols];for(int i=0;i<rows;i++)for(int j=0;j<cols;j++)g[i][j]=sc.nextInt();int[][] dp=new int[cols][cols];for(int[] row:dp)Arrays.fill(row,Integer.MIN_VALUE);dp[0][cols-1]=g[0][0]+(0==cols-1?0:g[0][cols-1]);for(int r=1;r<rows;r++){int[][] ndp=new int[cols][cols];for(int[] row:ndp)Arrays.fill(row,Integer.MIN_VALUE);for(int c1=0;c1<cols;c1++)for(int c2=0;c2<cols;c2++){if(dp[c1][c2]==Integer.MIN_VALUE)continue;for(int d1=-1;d1<=1;d1++)for(int d2=-1;d2<=1;d2++){int nc1=c1+d1,nc2=c2+d2;if(nc1<0||nc1>=cols||nc2<0||nc2>=cols)continue;int val=dp[c1][c2]+g[r][nc1]+(nc1!=nc2?g[r][nc2]:0);ndp[nc1][nc2]=Math.max(ndp[nc1][nc2],val);}}dp=ndp;}int res=0;for(int[] row:dp)for(int v:row)res=Math.max(res,v);System.out.println(res);}}")
		);
		case MYSQL_JOINS -> List.of(
				sp("Find all employees","List all employees with their department name",
						"employees and departments tables exist","name and department_name",
						"-- Schema given in problem","See expected output",
						"Use LEFT JOIN so employees without a department also appear",
						"SELECT e.name, d.department_name\nFROM employees e\nLEFT JOIN departments d ON e.department_id = d.department_id;"),
				sp("Employees without a department","Find employees not assigned to any department",
						"employees and departments tables","employee names only",
						"-- employees: id, name, department_id","Names with no dept",
						"LEFT JOIN then WHERE right side IS NULL",
						"SELECT e.name\nFROM employees e\nLEFT JOIN departments d ON e.department_id = d.department_id\nWHERE d.id IS NULL;"),
				sp("Department headcount","Count employees per department",
						"employees and departments tables","department_name and count",
						"-- employees: id, name, dept_id","Dept A: 5, Dept B: 3",
						"JOIN then GROUP BY department",
						"SELECT d.department_name, COUNT(e.id) AS headcount\nFROM departments d\nLEFT JOIN employees e ON d.id = e.dept_id\nGROUP BY d.id, d.department_name\nORDER BY headcount DESC;"),
				sp("Manager and their reports","List each manager with their direct reports",
						"employees table with manager_id self-reference","manager and report names",
						"-- employees: id, name, manager_id","Alice manages Bob, Carol",
						"SELF JOIN: join employees to itself using manager_id",
						"SELECT m.name AS manager, e.name AS report\nFROM employees e\nJOIN employees m ON e.manager_id = m.id\nORDER BY m.name;"),
				sp("Orders with customer details","Show all orders with customer name",
						"orders and customers tables","order_id, customer_name, total",
						"-- orders: id, customer_id, total\n-- customers: id, name","Complete order list",
						"INNER JOIN on customer_id",
						"SELECT o.id, c.name, o.total\nFROM orders o\nJOIN customers c ON o.customer_id = c.id\nORDER BY o.id;"),
				sp("Customers with no orders","Find customers who never ordered",
						"customers and orders tables","customer names only",
						"-- customers: id, name\n-- orders: id, customer_id","Inactive customers",
						"LEFT JOIN then WHERE orders.id IS NULL",
						"SELECT c.name\nFROM customers c\nLEFT JOIN orders o ON c.id = o.customer_id\nWHERE o.id IS NULL;"),
				sp("Products in each category","Count products per category",
						"products and categories tables","category_name and product_count",
						"-- products: id, name, category_id\n-- categories: id, name","Electronics: 15, Books: 8",
						"JOIN + GROUP BY + COUNT",
						"SELECT cat.name, COUNT(p.id) AS product_count\nFROM categories cat\nLEFT JOIN products p ON cat.id = p.category_id\nGROUP BY cat.id, cat.name\nORDER BY product_count DESC;"),
				sp("Three table JOIN","Orders with customer and product info",
						"orders, customers, products tables","customer, product, quantity",
						"-- order_items: order_id, product_id, qty\n-- orders: id, customer_id","Full order details",
						"Chain multiple JOINs — each one adds a table",
						"SELECT c.name, p.name AS product, oi.quantity\nFROM orders o\nJOIN customers c ON o.customer_id = c.id\nJOIN order_items oi ON o.id = oi.order_id\nJOIN products p ON oi.product_id = p.id;")
		);
		case MYSQL_AGGREGATION -> List.of(
				sp("Count rows","Count total employees","employees table","total count",
						"-- employees table exists","Total: 150",
						"COUNT(*) counts all rows including NULLs",
						"SELECT COUNT(*) AS total_employees FROM employees;"),
				sp("Average salary","Calculate average salary per department","employees table","dept_id and avg_salary",
						"-- employees: id, name, salary, dept_id","Dept 1: 75000.00",
						"AVG() with GROUP BY",
						"SELECT dept_id, ROUND(AVG(salary), 2) AS avg_salary\nFROM employees\nGROUP BY dept_id\nORDER BY avg_salary DESC;"),
				sp("Departments with > 5 employees","Find large departments","employees table","dept_id and count",
						"-- employees: id, name, dept_id","Dept 3: 8, Dept 1: 7",
						"GROUP BY then HAVING COUNT(*) > 5",
						"SELECT dept_id, COUNT(*) AS headcount\nFROM employees\nGROUP BY dept_id\nHAVING COUNT(*) > 5;"),
				sp("Highest paid per department","Max salary in each department","employees table","dept_id and max_salary",
						"-- employees: id, name, salary, dept_id","Dept 1: 120000",
						"MAX() with GROUP BY",
						"SELECT dept_id, MAX(salary) AS max_salary\nFROM employees\nGROUP BY dept_id;"),
				sp("Monthly revenue","Sum orders by month","orders table","month and total_revenue",
						"-- orders: id, total, created_at DATE","2024-01: 450000",
						"DATE_FORMAT for grouping by month",
						"SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,\n       SUM(total) AS revenue\nFROM orders\nGROUP BY month\nORDER BY month;"),
				sp("Second highest salary","Find 2nd highest salary","employees table","salary value",
						"-- employees: id, name, salary","90000",
						"Use LIMIT with OFFSET or subquery",
						"SELECT MAX(salary) AS second_highest\nFROM employees\nWHERE salary < (SELECT MAX(salary) FROM employees);")
		);
		case MYSQL_SUBQUERY -> List.of(
				sp("Above average salary","Employees earning above company average","employees table","name and salary",
						"-- employees: id, name, salary","Alice: 95000",
						"Scalar subquery: WHERE salary > (SELECT AVG...)",
						"SELECT name, salary\nFROM employees\nWHERE salary > (SELECT AVG(salary) FROM employees)\nORDER BY salary DESC;"),
				sp("Department with most employees","Find the busiest department","employees table","department_id",
						"-- employees: id, name, dept_id","3",
						"Subquery in FROM: GROUP BY, then SELECT max",
						"SELECT dept_id\nFROM employees\nGROUP BY dept_id\nORDER BY COUNT(*) DESC\nLIMIT 1;"),
				sp("Customers who ordered Product X","Find customers who bought a specific product","orders, order_items, products","customer_id list",
						"-- orders: id, customer_id\n-- order_items: order_id, product_id\n-- products: id, name","customer 5, 12, 23",
						"IN with subquery joining order_items to products",
						"SELECT DISTINCT customer_id\nFROM orders\nWHERE id IN (\n  SELECT order_id FROM order_items\n  WHERE product_id = (SELECT id FROM products WHERE name = 'ProductX')\n);"),
				sp("NOT EXISTS pattern","Find records with no related rows","customers, orders tables","customers with no orders",
						"-- customers: id, name\n-- orders: id, customer_id","Inactive customers",
						"NOT EXISTS is safer than NOT IN when NULLs possible",
						"SELECT name FROM customers c\nWHERE NOT EXISTS (\n  SELECT 1 FROM orders o WHERE o.customer_id = c.id\n);"),
				sp("CTE for readability","Rewrite nested subquery as CTE","employees table","above-avg earners per dept",
						"-- employees: id, name, salary, dept_id","Clean readable result",
						"WITH clause defines named subquery used in main SELECT",
						"WITH dept_avg AS (\n  SELECT dept_id, AVG(salary) AS avg_sal\n  FROM employees GROUP BY dept_id\n)\nSELECT e.name, e.salary\nFROM employees e\nJOIN dept_avg d ON e.dept_id = d.dept_id\nWHERE e.salary > d.avg_sal;")
		);
		case MYSQL_INDEX, MYSQL_TRANSACTION, MYSQL_PROCEDURE, MYSQL_GENERIC -> generateMysqlProblems(title);
		case AWS_COMPUTE, AWS_STORAGE, AWS_DATABASE, AWS_SERVERLESS, AWS_GENERIC -> generateAwsProblems(title, p);
		default -> List.of();
	};
}

private List<String[]> generateMysqlProblems(String title) {
	String[] titles  = {"Basic SELECT query","Filter with WHERE","ORDER BY + LIMIT","COUNT and GROUP BY",
			"SUM and AVG","MAX and MIN","HAVING clause","UPDATE records",
			"DELETE with condition","CREATE TABLE","ADD COLUMN","CREATE INDEX",
			"EXPLAIN query plan","Transaction with ROLLBACK","Stored procedure","Trigger",
			"View creation","Full text search","JSON column query","Window function"};
	String[] sqls    = {
			"SELECT * FROM " + title.toLowerCase().replace(" ","_") + " LIMIT 10;",
			"SELECT * FROM table1 WHERE created_at >= '2024-01-01';",
			"SELECT name, score FROM results ORDER BY score DESC LIMIT 5;",
			"SELECT category, COUNT(*) AS cnt FROM items GROUP BY category;",
			"SELECT dept_id, SUM(salary), AVG(salary) FROM employees GROUP BY dept_id;",
			"SELECT MAX(price), MIN(price) FROM products;",
			"SELECT dept_id, COUNT(*) FROM employees GROUP BY dept_id HAVING COUNT(*) > 3;",
			"UPDATE employees SET salary = salary * 1.1 WHERE performance_rating = 'A';",
			"DELETE FROM logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);",
			"CREATE TABLE topics (id INT PRIMARY KEY AUTO_INCREMENT, title VARCHAR(200) NOT NULL);",
			"ALTER TABLE employees ADD COLUMN phone VARCHAR(20);",
			"CREATE INDEX idx_email ON users(email);",
			"EXPLAIN SELECT * FROM orders WHERE customer_id = 5;",
			"START TRANSACTION;\nUPDATE a SET val = val - 100 WHERE id=1;\nUPDATE b SET val = val + 100 WHERE id=2;\nCOMMIT;",
			"DELIMITER //\nCREATE PROCEDURE GetTopN(IN n INT)\nBEGIN SELECT * FROM products ORDER BY sales DESC LIMIT n;\nEND //",
			"CREATE TRIGGER before_insert_check BEFORE INSERT ON orders FOR EACH ROW\nBEGIN IF NEW.total < 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Negative total'; END IF;\nEND;",
			"CREATE VIEW active_users AS SELECT * FROM users WHERE last_login > DATE_SUB(NOW(), INTERVAL 30 DAY);",
			"SELECT * FROM articles WHERE MATCH(title, body) AGAINST('Java programming' IN NATURAL LANGUAGE MODE);",
			"SELECT * FROM products WHERE JSON_EXTRACT(attributes, '$.color') = 'blue';",
			"SELECT name, salary, RANK() OVER (ORDER BY salary DESC) AS salary_rank FROM employees;"
	};
	List<String[]> list = new ArrayList<>();
	for (int i = 0; i < 20; i++) {
		String diff = i < 6 ? "EASY" : i < 14 ? "MEDIUM" : "HARD";
		list.add(sp(titles[i], "Write a SQL query: " + titles[i],
				"Schema provided in problem", "Correct SQL result",
				"-- tables: employees, departments, orders, customers, products", "Correct query result",
				"Think about which SQL clause applies: " + titles[i],
				sqls[i]));
	}
	return list;
}

private List<String[]> generateAwsProblems(String title, Pattern p) {
	String[] awsTitles = {
			"Choose the right service","Design for high availability","Implement auto scaling",
			"S3 bucket policy","EC2 instance sizing","RDS Multi-AZ setup",
			"Lambda function trigger","API Gateway rate limiting","CloudWatch alarm",
			"IAM least privilege policy","VPC subnet design","Security group rules",
			"Cost estimation","Disaster recovery","Blue/green deployment",
			"Cache with ElastiCache","DynamoDB partition key","SQS vs SNS vs Kinesis",
			"CloudFront distribution","Route 53 routing policy"
	};
	List<String[]> list = new ArrayList<>();
	for (int i = 0; i < 20; i++) {
		String diff = i < 6 ? "EASY" : i < 14 ? "MEDIUM" : "HARD";
		list.add(sp(awsTitles[i],
				"AWS Architecture: " + awsTitles[i] + " for " + title,
				"Architecture requirements provided", "Architecture diagram and explanation",
				"Scenario: web app with 10k users, 99.9% uptime requirement", "Recommended AWS architecture",
				"Consider: availability, cost, scalability, security",
				"# " + awsTitles[i] + "\n# Design an AWS architecture that:\n# 1. Meets the requirement\n# 2. Follows Well-Architected Framework\n# 3. Optimizes for cost\n# Document your choices."));
	}
	return list;
}

private String[] sp(String title, String desc, String inFmt, String outFmt,
                    String sIn, String sOut, String hint, String code) {
	return new String[]{title, desc, inFmt, outFmt, sIn, sOut, hint, code};
}

private String[] makeGenericSpec(String title, int idx) {
	String[] diffs = {"Easy","Medium","Hard"};
	String diff = idx < 6 ? diffs[0] : idx < 14 ? diffs[1] : diffs[2];
	return new String[]{
			diff + " Problem " + (idx+1) + ": " + title,
			"Apply " + title + " concepts to solve this problem.",
			"n followed by input values", "result", "5\n1 2 3 4 5", "see description",
			"Think about which " + title + " pattern applies",
			"import java.util.*;\npublic class Main{public static void main(String[] a){\n    Scanner sc=new Scanner(System.in);\n    // TODO: " + title + " problem " + (idx+1) + "\n    System.out.println(0);\n}}"
	};
}
}