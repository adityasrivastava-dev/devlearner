import json

f = 'C:/Dev/devlearner/devlearner/learning-system/src/main/resources/seeds/B10-memory-management.json'
with open(f, encoding='utf-8') as fh:
    data = json.load(fh)

improvements = {
    1: {
        "description": "For the code below, classify each named variable as `stack-primitive`, `stack-ref`, or `heap-object`:\n\n```java\npublic void demo() {\n    int x = 42;                    // (a)\n    String s = \"hello\";            // (b)\n    int[] arr = new int[]{1,2,3};  // (c)\n    Object obj = new Object();     // (d)\n}\n```\n\nImplement `classify()` returning a `String[]` with one label per variable.\n\n**Answer:** (a) stack-primitive, (b) stack-ref + heap-object (interned), (c) stack-ref + heap-object, (d) stack-ref + heap-object.",
        "sampleInput": "int x=42; String s=\"hello\"; int[] arr=new int[]{1,2,3}; Object obj=new Object();",
        "sampleOutput": "[\"stack-primitive\", \"stack-ref\", \"stack-ref\", \"stack-ref\"]"
    },
    2: {
        "description": "For each scenario, predict whether it throws `StackOverflowError`, `OutOfMemoryError`, or neither:\n\n1. `void inf() { inf(); }` — unbounded recursion\n2. `List<byte[]> l = new ArrayList<>(); while(true) l.add(new byte[1024*1024]);` — unbounded heap\n3. `for(int i=0;i<1000;i++) new Object();` — short-lived objects\n\nImplement `predict()` returning `String[]` with one result per scenario.\n\n**Key insight:** Deep call stacks blow the thread stack (StackOverflow). Retaining unlimited objects blows the heap (OutOfMemory). Short-lived, non-retained objects are GC'd safely.",
        "sampleInput": "3 scenarios: infinite recursion, unbounded list growth, 1000 throwaway objects",
        "sampleOutput": "[\"StackOverflowError\", \"OutOfMemoryError\", \"neither\"]"
    },
    3: {
        "description": "Count how many distinct objects are allocated on the **heap** in this snippet:\n\n```java\nString a = \"hello\";            // string pool\nString b = new String(\"hello\"); // new heap object\nint[] arr = new int[3];        // heap array\nObject o = new Object();       // heap object\nInteger i = 42;                // autoboxed — heap object\n```\n\nImplement `countHeapAllocations()` returning the count.\n\n**Answer:** 4 — `b` (new String), `arr`, `o`, and autoboxed `i`. `\"hello\"` literal reuses the string pool (1 object, possibly shared).",
        "sampleInput": "String a=\"hello\"; String b=new String(\"hello\"); int[] arr=new int[3]; Object o=new Object(); Integer i=42;",
        "sampleOutput": "4"
    },
    4: {
        "description": "Recursive Fibonacci for large `n` causes `StackOverflowError` due to exponential call depth. Implement `fibIterative(int n)` using only O(1) extra space.\n\n**Example 1:**\nInput: n = 10\nOutput: 55\n\n**Example 2:**\nInput: n = 50\nOutput: 12586269025\n\n**Example 3:**\nInput: n = 0\nOutput: 0\n\n**Key insight:** Each recursive call pushes a frame on the thread stack. For n=10000 the stack overflows. The iterative version uses two variables — constant stack space, runs forever.",
        "sampleInput": "10",
        "sampleOutput": "55"
    },
    5: {
        "description": "For each scenario, determine if the object becomes **GC-eligible** after the marked line:\n\n1. `Object o = new Object(); o = null;` — after `o = null`\n2. `List<Object> list = ...; list.add(obj); list = null;` — after `list = null`\n3. `static List<Object> cache = new ArrayList<>(); cache.add(obj);` — after method returns\n\nImplement `isGcEligible()` returning `boolean[]`.\n\n**Answers:** true (no references left), false (list still referenced by obj references inside? no — list is null but obj still in old list... actually list = null makes the list unreachable if nothing else holds it), false (static field keeps it alive forever).",
        "sampleInput": "3 scenarios: o=null, list=null, static cache",
        "sampleOutput": "[true, true, false]"
    },
    6: {
        "description": "The following recursive power function causes `StackOverflowError` for certain inputs. Find and fix the bug:\n\n```java\nstatic double pow(double x, int n) {\n    if (n == 0) return 1;\n    return x * pow(x, n - 1); // bug for negative n\n}\n```\n\nFixed `pow(x, n)` must handle **negative** `n` correctly without infinite recursion.\n\n**Example 1:** pow(2.0, -3) => 0.125\n**Example 2:** pow(3.0, 4) => 81.0\n\n**Fix:** Add base case for `n < 0`: return `1.0 / pow(x, -n)`.",
        "sampleInput": "x = 2.0, n = -3",
        "sampleOutput": "0.125"
    },
    7: {
        "description": "Implement `findMaxRecursionDepth()` that determines the **maximum safe recursion depth** on the current JVM by counting how deep a recursive call can go before `StackOverflowError` is thrown. Catch the error and return the depth reached.\n\n**Example output:** (depends on JVM stack size, typically 5000–20000)\nInput: (none)\nOutput: e.g. 8743\n\n**Key insight:** Each stack frame consumes memory. The default thread stack is 512KB–1MB. Catching `StackOverflowError` is valid — it's an `Error`, not an `Exception`, but is catchable.",
        "sampleInput": "(none — JVM-dependent)",
        "sampleOutput": "~8000 (varies by JVM stack size)"
    },
    8: {
        "description": "Implement two versions of joining a `String[]` into one string:\n1. `concatWithPlus(String[] parts)` — using `+` in a loop (creates a new String object per iteration)\n2. `concatWithBuilder(String[] parts)` — using `StringBuilder` (one buffer, no intermediate objects)\n\nReturn the final string from both. Benchmark shows StringBuilder is **O(n)** vs `+` which is **O(n²)**.\n\n**Example:**\nInput: [\"a\",\"b\",\"c\",\"d\",\"e\"]\nOutput: \"abcde\"\n\n**Key insight:** `s += parts[i]` allocates a new String each iteration — n allocations of growing size. StringBuilder appends in-place.",
        "sampleInput": "[\"a\",\"b\",\"c\",\"d\",\"e\"]",
        "sampleOutput": "\"abcde\""
    },
    9: {
        "description": "Implement `LRUCache<K,V>` with a maximum capacity. On `put()` when full, evict the **least recently used** entry. `get()` counts as a use.\n\n**Example:**\ncache = LRUCache(2)\nput(1,1), put(2,2)\nget(1) => 1\nput(3,3) — evicts key 2 (LRU)\nget(2) => -1 (evicted)\nget(3) => 3\n\n**Key insight:** Use `LinkedHashMap` with `accessOrder=true`, or a custom doubly-linked list + HashMap. Bounded size means bounded heap — prevents unbounded memory growth.",
        "sampleInput": "capacity=2, put(1,1), put(2,2), get(1), put(3,3), get(2)",
        "sampleOutput": "get(2) = -1"
    },
    10: {
        "description": "The following code has a **memory leak** — identify it and fix it:\n\n```java\nclass EventBus {\n    static List<Runnable> listeners = new ArrayList<>();\n    static void register(Runnable r) { listeners.add(r); }\n}\n// Callers register lambdas but never deregister\n```\n\nThe leak: `listeners` is static and grows forever — registered objects are never removed.\n\n**Fix:** Add `static void deregister(Runnable r) { listeners.remove(r); }` and always call it in a `finally` block or use `WeakReference<Runnable>`.\n\n**Key insight:** Static collections that grow without bounds are the #1 Java memory leak pattern.",
        "sampleInput": "register 10000 listeners, never deregister",
        "sampleOutput": "Fix: add deregister() or use WeakReference"
    },
    11: {
        "description": "Implement `merge(int[] nums1, int m, int[] nums2, int n)` that merges `nums2` into `nums1` **in-place**. `nums1` has length `m+n`; the last `n` slots are zero-padded. Use O(1) extra space by filling from the back.\n\n**Example 1:**\nInput: nums1=[1,2,3,0,0,0] m=3, nums2=[2,5,6] n=3\nOutput: [1,2,2,3,5,6]\n\n**Example 2:**\nInput: nums1=[1] m=1, nums2=[] n=0\nOutput: [1]\n\n**Key insight:** Merge from the end — no extra allocation needed. Compare nums1[m-1] and nums2[n-1], place the larger at position m+n-1.",
        "sampleInput": "nums1=[1,2,3,0,0,0] m=3, nums2=[2,5,6] n=3",
        "sampleOutput": "[1,2,2,3,5,6]"
    },
    12: {
        "description": "Process a large array of integers **without storing all results** in memory at once. Implement `processStream(int[] data, int windowSize)` that returns the running average for each window of `windowSize` elements, computed with O(1) extra space.\n\n**Example:**\nInput: data=[1,2,3,4,5], windowSize=3\nOutput: [2.0, 3.0, 4.0]\nExplanation: avg(1,2,3)=2.0, avg(2,3,4)=3.0, avg(3,4,5)=4.0.\n\n**Key insight:** Sliding window — subtract the outgoing element and add the incoming one. No need to store all window elements.",
        "sampleInput": "data=[1,2,3,4,5], windowSize=3",
        "sampleOutput": "[2.0, 3.0, 4.0]"
    },
    13: {
        "description": "Implement **iterative DFS** on a graph using an explicit `Stack<Integer>` instead of recursion, avoiding the risk of `StackOverflowError` on deep graphs.\n\n**Example:**\nInput: graph = {0:[1,2], 1:[3], 2:[3], 3:[]}, start = 0\nOutput: visited order = [0, 2, 3, 1] (LIFO stack order)\n\n**Key insight:** Replace the call stack with a heap-allocated `Stack<Integer>`. Push neighbors, pop and visit. The heap can hold far more than the thread stack — safe for graphs with millions of nodes.",
        "sampleInput": "graph={0:[1,2],1:[3],2:[3],3:[]}, start=0",
        "sampleOutput": "[0, 2, 3, 1]"
    },
    14: {
        "description": "Implement a simple **object pool** for `StringBuilder` objects. Pre-allocate `N` instances at startup. `acquire()` returns a cleared instance from the pool; `release(sb)` returns it. Avoids repeated allocation/GC pressure for high-throughput scenarios.\n\n**Example:**\npool = StringBuilderPool(3)\nsb1 = acquire() => empty StringBuilder\nsb1.append(\"hello\")\nrelease(sb1)\nsb2 = acquire() => same object, cleared\nsb2.length() => 0\n\n**Key insight:** Object pools reduce GC pressure by reusing objects instead of allocating new ones per request.",
        "sampleInput": "pool size=3, acquire, append, release, acquire",
        "sampleOutput": "reacquired sb.length() = 0"
    },
    15: {
        "description": "Implement a **trampoline** to evaluate deeply recursive functions without stack overflow. A trampoline repeatedly calls a function that returns either a result or another thunk (lambda) to call next.\n\n**Example — trampolined factorial:**\ntrampoline(factThunk(5)) => 120\ntrampoline(factThunk(100000)) => large number (no StackOverflow)\n\n**Key insight:** Each 'recursive' call returns a `Supplier` (thunk) instead of calling itself. The trampoline loop runs on the heap, never growing the call stack beyond 1 frame.",
        "sampleInput": "factThunk(5)",
        "sampleOutput": "120"
    },
    16: {
        "description": "Implement `allocateShortLived(int n)` that creates `n` objects, uses them, and discards them — demonstrating why short-lived objects are **cheap** in Java's generational GC. Then implement `allocateLongLived(int n)` that stores them in a static list.\n\n**Example:**\nallocateShortLived(1_000_000) — fast, no GC pressure\nallocateLongLived(1_000_000) — builds up old-gen, triggers full GC\n\n**Key insight:** Young-gen collection (minor GC) is very fast — it only scans live young objects. Short-lived objects die in Eden and are reclaimed cheaply with no promotion to old-gen.",
        "sampleInput": "n = 1_000_000",
        "sampleOutput": "short-lived: no OOM; long-lived: potential OOM"
    },
    17: {
        "description": "Implement a bounded `ArrayStack<T>` using a fixed-size array. Operations: `push(T)` (throws if full), `pop()` (throws if empty), `peek()`, `isEmpty()`, `isFull()`.\n\n**Example:**\nstack = ArrayStack(3)\npush(1), push(2), push(3)\npush(4) => throws StackFullException\npop() => 3\npop() => 2\npeek() => 1\n\n**Key insight:** Fixed-size array means bounded heap — no unbounded growth. The array is allocated once; elements are stored by index. Unlike `java.util.Stack`, this has predictable memory usage.",
        "sampleInput": "capacity=3, push(1),push(2),push(3),push(4)",
        "sampleOutput": "push(4) throws StackFullException"
    },
    18: {
        "description": "Write two methods demonstrating **escape analysis**:\n1. `doesEscape()` — creates and **returns** an object (it escapes; JVM must heap-allocate)\n2. `doesNotEscape()` — creates an object used only locally, never returned or stored (JVM may stack-allocate via escape analysis)\n\nReturn a description of where each object is likely allocated.\n\n**Key insight:** The JVM's escape analysis can stack-allocate objects that don't escape the method scope — faster allocation and no GC overhead. Objects that escape (returned, stored in fields) must go to the heap.",
        "sampleInput": "doesEscape() vs doesNotEscape()",
        "sampleOutput": "doesEscape: heap; doesNotEscape: stack (JVM optimized)"
    },
    19: {
        "description": "Transpose a square matrix **in-place** using O(1) extra space — swap `matrix[i][j]` with `matrix[j][i]` for all `i < j`.\n\n**Example 1:**\nInput:\n[[1,2,3],\n [4,5,6],\n [7,8,9]]\nOutput:\n[[1,4,7],\n [2,5,8],\n [3,6,9]]\n\n**Example 2:**\nInput: [[1,2],[3,4]]\nOutput: [[1,3],[2,4]]\n\n**Key insight:** Only the upper triangle needs to be iterated. Each swap touches exactly 2 cells — no temp array needed.",
        "sampleInput": "[[1,2,3],[4,5,6],[7,8,9]]",
        "sampleOutput": "[[1,4,7],[2,5,8],[3,6,9]]"
    },
    20: {
        "description": "Write a method that deliberately fills the heap until `OutOfMemoryError`, catches it, and reports the approximate heap size consumed. Use `Runtime.getRuntime()` to query memory stats before and after.\n\n**Example output:**\nHeap before: ~256MB free\nAllocated ~180MB before OOM\nCaught: java.lang.OutOfMemoryError: Java heap space\n\n**Key insight:** `OutOfMemoryError` is catchable (it's a `Throwable`). After catching it, some memory is freed (the large array reference is gone). `Runtime.totalMemory() - Runtime.freeMemory()` gives current heap usage.",
        "sampleInput": "(runs until OOM)",
        "sampleOutput": "OutOfMemoryError caught after ~N MB allocated"
    },
}

updated = 0
for topic in data['topics']:
    for p in topic.get('problems', []):
        order = p['displayOrder']
        if order in improvements:
            imp = improvements[order]
            p['description'] = imp['description']
            p['sampleInput'] = imp['sampleInput']
            p['sampleOutput'] = imp['sampleOutput']
            updated += 1

with open(f, 'w', encoding='utf-8') as fh:
    json.dump(data, fh, indent=2, ensure_ascii=False)
print(f"B10 updated: {updated} problems improved")
