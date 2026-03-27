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
	DESIGN_PATTERNS, JVM, GENERIC_DSA, GENERIC_JAVA
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
		}
		case STRINGS -> {
			d.setDescription("Immutable char sequences. Master sliding window for substrings, frequency arrays for anagrams, StringBuilder for construction.");
			d.setTimeComplexity("O(n) sliding window | O(n²) naive | O(n log n) sorted");
			d.setSpaceComplexity("O(1) with char[26] | O(n) HashMap");
			d.setBruteForce("Generate all substrings O(n²) and check each");
			d.setOptimizedApproach("Sliding window with HashMap for frequency tracking — single pass O(n)");
			d.setWhenToUse("Pattern matching, palindromes, anagram detection, substring problems");
		}
		case SORTING -> {
			d.setDescription("Ordering elements is prerequisite for binary search, two-pointer, and greedy. Know merge, quick, heap, counting sort and when to use each.");
			d.setTimeComplexity("O(n²) bubble/selection | O(n log n) merge/quick/heap | O(n+k) counting");
			d.setSpaceComplexity("O(1) in-place quick/heap | O(n) merge | O(k) counting");
			d.setBruteForce("Bubble sort — swap adjacent elements until sorted");
			d.setOptimizedApproach("Merge sort (stable, guaranteed) or quick sort (in-place, cache-friendly)");
			d.setWhenToUse("Before binary search, two-pointer problems, when order matters");
		}
		case TREES -> {
			d.setDescription("Hierarchical structure. DFS (recursion) solves most tree problems. BFS (queue) for level-order. Master both traversals.");
			d.setTimeComplexity("O(n) traversal | O(h) DFS recursion stack | O(w) BFS queue");
			d.setSpaceComplexity("O(h) stack | O(w) queue where h=height, w=max width");
			d.setBruteForce("Brute: traverse every path from root O(n²)");
			d.setOptimizedApproach("DFS return values carry computed info up the tree O(n)");
			d.setWhenToUse("Hierarchical data, expression trees, interval problems, file systems");
		}
		case DYNAMIC_PROG -> {
			d.setDescription("Avoid recomputing overlapping subproblems. Two approaches: top-down memoization (easy) or bottom-up tabulation (efficient).");
			d.setTimeComplexity("O(n) to O(n²) — one cell per unique state");
			d.setSpaceComplexity("O(n²) table → O(n) rolling array → O(1) with two variables");
			d.setBruteForce("Recursion without memo — exponential O(2ⁿ) for most problems");
			d.setOptimizedApproach("Tabulation: fill dp[] from base case. Space-optimize: only keep previous row/vars");
			d.setWhenToUse("Optimal substructure + overlapping subproblems: counting ways, min/max over sequence");
		}
		case OOP -> {
			d.setDescription("Model programs as objects with state and behaviour. Four pillars: Encapsulation, Inheritance, Polymorphism, Abstraction.");
			d.setTimeComplexity("N/A — design concept");
			d.setSpaceComplexity("N/A");
			d.setBruteForce("Procedural code: global state, no encapsulation");
			d.setOptimizedApproach("Private fields + public methods, favour composition over inheritance, program to interfaces");
			d.setWhenToUse("Modelling real-world entities, enforcing invariants, extensible design");
		}
		case COLLECTIONS -> {
			d.setDescription("Java Collections Framework. ArrayList (O(1) access), LinkedList (O(1) add/remove ends), HashMap (O(1) avg), TreeMap (O(log n) sorted).");
			d.setTimeComplexity("ArrayList O(1) get | LinkedList O(1) add ends | HashMap O(1) avg | TreeMap O(log n)");
			d.setSpaceComplexity("O(n) all");
			d.setBruteForce("Arrays and manual resizing before Collections");
			d.setOptimizedApproach("Pick the right collection for the access pattern — HashMap for lookup, PriorityQueue for ordered stream");
			d.setWhenToUse("Any time you need dynamic data storage with specific access patterns");
		}
		case CONCURRENCY -> {
			d.setDescription("Multiple threads sharing CPU. Master ExecutorService, synchronized, AtomicInteger, and CompletableFuture for async work.");
			d.setTimeComplexity("O(n/k) theoretical with k threads for parallelizable work");
			d.setSpaceComplexity("O(k) per thread stack");
			d.setBruteForce("Single-threaded sequential — safe but slow");
			d.setOptimizedApproach("Thread pool via ExecutorService, Future/CompletableFuture for async, AtomicInteger for lock-free counters");
			d.setWhenToUse("I/O-bound async tasks, CPU-bound parallel computation, background processing");
		}
		default -> {
			d.setDescription("Master " + title + " with targeted examples and graduated practice problems.");
			d.setTimeComplexity("Varies by problem — analyze each case");
			d.setSpaceComplexity("O(n) typical");
			d.setBruteForce("Brute force: try all possibilities");
			d.setOptimizedApproach("Apply the core " + title + " pattern to reduce complexity");
			d.setWhenToUse("When the problem structure matches " + title + " characteristics");
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
		list.add(prob);
	}
	return list;
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
		default -> List.of();
	};
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