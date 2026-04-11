// Curated interview question bank.
// Each question is self-contained — quickAnswer + keyPoints + optional codeExample.

export const CATEGORY_META = {
  JAVA:          { label: 'Java Core',     color: '#f59e0b', icon: '☕' },
  ADVANCED_JAVA: { label: 'Advanced Java', color: '#8b5cf6', icon: '⚡' },
  DSA:           { label: 'DSA',           color: '#10b981', icon: '🌲' },
  SQL:           { label: 'SQL',           color: '#3b82f6', icon: '🗄' },
  AWS:           { label: 'AWS',           color: '#f97316', icon: '☁' },
};

export const QUESTIONS = [

  // ── JAVA CORE ─────────────────────────────────────────────────────────────
  {
    id: 'j01', category: 'JAVA', difficulty: 'HIGH',
    question: 'How does HashMap work internally?',
    quickAnswer:
      'HashMap uses an array of buckets. put(key, value) calls key.hashCode() to find the bucket index. Collisions are handled by a linked list at that bucket. From Java 8, a chain exceeding 8 entries converts to a red-black tree (O(log n)). The map resizes (doubles) when entries exceed capacity × loadFactor (default 0.75).',
    keyPoints: [
      'hashCode() → bucket index via (n-1) & hash',
      'equals() resolves collision within the bucket',
      'Default capacity 16, load factor 0.75',
      'Java 8+: chain → tree at TREEIFY_THRESHOLD = 8',
      'Not thread-safe — use ConcurrentHashMap for concurrency',
    ],
    codeExample:
`// The equals/hashCode contract is the key rule:
// if a.equals(b) → a.hashCode() == b.hashCode()

Map<String, Integer> map = new HashMap<>();
map.put("key", 1);   // hashCode("key") → bucket index
map.get("key");      // same hash → same bucket → equals() check

// Iteration order is NOT guaranteed
// Use LinkedHashMap for insertion-order iteration`,
  },
  {
    id: 'j02', category: 'JAVA', difficulty: 'HIGH',
    question: 'What is the equals() and hashCode() contract?',
    quickAnswer:
      'If two objects are equal via equals(), they must return the same hashCode(). The reverse is not required — different objects can share a hashCode (collision). Breaking this contract makes objects unfindable in HashMap and HashSet after insertion.',
    keyPoints: [
      'equals() true → hashCode() must be equal (required)',
      'hashCode() equal → equals() may be false (collision is ok)',
      'Always override both together — never one without the other',
      'Default Object.hashCode() is identity-based (memory address)',
    ],
  },
  {
    id: 'j03', category: 'JAVA', difficulty: 'HIGH',
    question: 'What is the difference between String, StringBuilder, and StringBuffer?',
    quickAnswer:
      'String is immutable — every modification creates a new object. StringBuilder is mutable and fast but not thread-safe. StringBuffer is mutable and thread-safe (synchronized methods) but slower. Use StringBuilder in single-threaded code (almost always); StringBuffer only when threads share the same buffer.',
    keyPoints: [
      'String: immutable, String Pool, safe to share across threads',
      'StringBuilder: mutable, no synchronization, O(1) amortized append',
      'StringBuffer: same as StringBuilder but synchronized — slower',
      'String + in a loop creates O(n²) garbage — use StringBuilder',
    ],
  },
  {
    id: 'j04', category: 'JAVA', difficulty: 'HIGH',
    question: 'What is the difference between == and .equals()?',
    quickAnswer:
      '== compares references for objects, values for primitives. equals() compares logical content as the class defines it. String literals may share the same reference (pool), but new String("x") always creates a new object — making == unreliable for strings.',
    keyPoints: [
      '== on objects: reference equality (are they the same object in memory?)',
      '.equals() on objects: content equality if overridden, else reference',
      '"abc" == "abc" may be true (String pool), but is not guaranteed',
      'new String("abc") == new String("abc") is always false',
    ],
  },
  {
    id: 'j05', category: 'JAVA', difficulty: 'HIGH',
    question: 'What is the difference between ArrayList and LinkedList?',
    quickAnswer:
      'ArrayList is backed by an array — O(1) random access, O(n) insert/delete in the middle. LinkedList is a doubly-linked list — O(1) add/remove at head or tail, O(n) random access. ArrayList beats LinkedList for most use cases due to CPU cache locality. Use LinkedList only when you need frequent head/tail operations.',
    keyPoints: [
      'ArrayList: fast get(i), slow add/remove in middle (shifts elements)',
      'LinkedList: fast addFirst/addLast, slow get(i) (traversal required)',
      'ArrayList has better cache performance (contiguous memory)',
      'LinkedList also implements Deque — can be used as a double-ended queue',
    ],
  },
  {
    id: 'j06', category: 'JAVA', difficulty: 'HIGH',
    question: 'What is the difference between abstract class and interface?',
    quickAnswer:
      'Abstract class can have state (fields), constructors, and concrete methods — single inheritance only. Interface defines a contract — multiple implementation allowed. Since Java 8, interfaces can have default and static methods. Use abstract class when sharing state; interface for defining a capability/contract.',
    keyPoints: [
      'Abstract class: single inheritance, can have fields and constructors',
      'Interface: multiple implementation, no instance state (pre-Java 9)',
      'Java 8: interfaces can have default methods (with body) and static methods',
      'Java 9: interfaces can have private helper methods',
      'Abstract class models "is-a"; interface models "can-do"',
    ],
  },
  {
    id: 'j07', category: 'JAVA', difficulty: 'MEDIUM',
    question: 'What are checked vs unchecked exceptions?',
    quickAnswer:
      'Checked exceptions extend Exception (not RuntimeException) — compiler forces you to handle or declare them. Unchecked exceptions extend RuntimeException — no compile-time requirement. Checked = expected failures (IOException). Unchecked = programming errors (NullPointerException, ArrayIndexOutOfBoundsException).',
    keyPoints: [
      'Checked: must catch or declare with throws in method signature',
      'Unchecked: RuntimeException subclasses, compiler does not enforce handling',
      'Error (OutOfMemoryError): neither — unrecoverable JVM issues',
      'Spring uses unchecked exceptions throughout — no forced try/catch',
    ],
  },
  {
    id: 'j08', category: 'JAVA', difficulty: 'MEDIUM',
    question: 'What is final, finally, finalize — what does each do?',
    quickAnswer:
      'final: keyword — variable cannot be reassigned, method cannot be overridden, class cannot be subclassed. finally: block that always executes after try/catch. finalize(): method called by GC before collection — deprecated Java 9, avoid entirely. Classic interview trap: three very different things.',
    keyPoints: [
      'final variable: fixed after first assignment',
      'final method: cannot be overridden in subclasses',
      'final class: cannot be subclassed (String, Integer are final)',
      'finally: runs even if exception thrown or return executed',
      'finalize(): unpredictable timing — use try-with-resources instead',
    ],
  },
  {
    id: 'j09', category: 'JAVA', difficulty: 'MEDIUM',
    question: 'What is the difference between Comparable and Comparator?',
    quickAnswer:
      'Comparable defines the natural ordering inside the class — implement compareTo() in the class. Comparator is an external ordering strategy — passed to sort() without modifying the class. Use Comparable for a single default order; Comparator for custom or multiple orderings.',
    keyPoints: [
      'Comparable: int compareTo(T o) — built into the object itself',
      'Comparator: int compare(T o1, T o2) — separate class or lambda',
      'Collections.sort(list) uses Comparable',
      'Collections.sort(list, comparator) uses Comparator',
      'Java 8: Comparator.comparing(Person::getName).thenComparing(Person::getAge)',
    ],
    codeExample:
`// External comparator as lambda (Java 8)
list.sort(Comparator.comparing(String::length)
                    .thenComparing(Comparator.naturalOrder()));`,
  },
  {
    id: 'j10', category: 'JAVA', difficulty: 'MEDIUM',
    question: 'What is fail-fast vs fail-safe iterator?',
    quickAnswer:
      'Fail-fast iterators (ArrayList, HashMap) throw ConcurrentModificationException if the collection is modified during iteration by checking an internal modCount. Fail-safe iterators (CopyOnWriteArrayList, ConcurrentHashMap) work on a snapshot — no exception but may not see latest updates.',
    keyPoints: [
      'Fail-fast: ArrayList, HashMap — throws ConcurrentModificationException',
      'Fail-safe: CopyOnWriteArrayList, ConcurrentHashMap',
      'Safe removal during iteration: use iterator.remove() or removeIf()',
      'Classic bug: list.remove() inside a for-each loop → CME',
    ],
  },
  {
    id: 'j11', category: 'JAVA', difficulty: 'MEDIUM',
    question: 'What is Java memory model — Stack vs Heap?',
    quickAnswer:
      'Stack holds method frames — local variables and object references. Heap holds all objects. When a method returns, its stack frame is popped. Heap objects live until GC. Primitives inside a method live on the stack; primitives inside an object live on the heap with that object.',
    keyPoints: [
      'Stack: per-thread, LIFO, holds primitives + object references',
      'Heap: shared across all threads, holds all objects',
      'StackOverflowError: infinite recursion blows the stack',
      'OutOfMemoryError: heap exhausted',
      'String pool is a special area in the heap for interned literals',
    ],
  },
  {
    id: 'j12', category: 'JAVA', difficulty: 'MEDIUM',
    question: 'What are generics and what is type erasure?',
    quickAnswer:
      'Generics add compile-time type safety — List<String> prevents inserting integers at compile time. Type erasure means generic info is removed at runtime — List<String> and List<Integer> are both just List at runtime. This is why you cannot do new T() or instanceof List<String>.',
    keyPoints: [
      'Generics are compile-time only — erased to Object at runtime',
      'Cannot create generic arrays: new T[10] is illegal',
      'Wildcard: ? extends T (read-only upper bound), ? super T (write-friendly)',
      'Raw types (List without parameter) bypass type checking — avoid',
    ],
  },

  // ── ADVANCED JAVA ─────────────────────────────────────────────────────────
  {
    id: 'aj01', category: 'ADVANCED_JAVA', difficulty: 'HIGH',
    question: 'What is the difference between synchronized and volatile?',
    quickAnswer:
      'synchronized provides mutual exclusion (one thread at a time) AND memory visibility. volatile provides visibility only — every read goes to main memory, writes are immediately visible. Use volatile for a single shared flag; use synchronized (or AtomicInteger) for compound operations like count++.',
    keyPoints: [
      'volatile: visibility guarantee only, no mutual exclusion',
      'synchronized: both mutual exclusion and visibility',
      'count++ is read-modify-write — volatile does NOT make it atomic',
      'AtomicInteger.incrementAndGet() is atomic without locks',
      'volatile is cheaper than synchronized but weaker',
    ],
    codeExample:
`// volatile: safe for a simple flag (single write)
private volatile boolean running = true;

// synchronized: needed for compound read-modify-write
synchronized void increment() { count++; }

// Better for counters: lock-free atomic
private AtomicInteger count = new AtomicInteger(0);
count.incrementAndGet(); // atomic, no lock overhead`,
  },
  {
    id: 'aj02', category: 'ADVANCED_JAVA', difficulty: 'HIGH',
    question: 'What is the difference between wait(), sleep(), and yield()?',
    quickAnswer:
      'sleep(ms) pauses the thread for a fixed duration, does NOT release the lock. wait() releases the lock and pauses until notify()/notifyAll() — must be inside synchronized block. yield() hints the scheduler to let another thread run but gives no guarantee.',
    keyPoints: [
      'sleep(): Thread method, holds the lock, resumes after timeout',
      'wait(): Object method, releases lock, waits for notify()',
      'notifyAll() is safer than notify() — avoids missed wakeups',
      'wait() must always be in a while loop (spurious wakeups are real)',
      'yield(): hint only, not reliable for coordination',
    ],
  },
  {
    id: 'aj03', category: 'ADVANCED_JAVA', difficulty: 'HIGH',
    question: 'What are Java 8 Streams and how do they differ from Collections?',
    quickAnswer:
      'Streams are a pipeline for processing sequences — they do not store data. Collections store data; Streams process it. Streams are lazy: intermediate operations (filter, map) do nothing until a terminal operation (collect, findFirst) is called. Streams cannot be reused after a terminal op.',
    keyPoints: [
      'Intermediate (lazy): filter, map, flatMap, sorted, distinct, limit',
      'Terminal (triggers execution): collect, forEach, reduce, count, findFirst, anyMatch',
      'parallelStream() uses ForkJoinPool — good for stateless CPU-bound ops',
      'Do not modify the source collection while streaming',
      'Stream.of(), Arrays.stream(), list.stream() — common entry points',
    ],
    codeExample:
`List<String> result = list.stream()
    .filter(s -> s.startsWith("A"))   // lazy — nothing runs yet
    .map(String::toUpperCase)          // lazy
    .sorted()                          // lazy
    .collect(Collectors.toList());     // terminal — pipeline executes here`,
  },
  {
    id: 'aj04', category: 'ADVANCED_JAVA', difficulty: 'HIGH',
    question: 'What is Optional and when should you use it?',
    quickAnswer:
      'Optional<T> is a container that may or may not hold a value — makes absence explicit in the method signature. Use it as a return type, never as a field or parameter. Prefer orElseGet() over orElse() for expensive defaults (orElse always evaluates, orElseGet is lazy).',
    keyPoints: [
      'Optional.empty(), Optional.of(val), Optional.ofNullable(val)',
      'orElse(default): always evaluates the default expression',
      'orElseGet(supplier): lazy — only called when Optional is empty',
      'orElseThrow(): throws NoSuchElementException or custom exception',
      'Never: optional.get() without isPresent() — defeats the purpose',
    ],
  },
  {
    id: 'aj05', category: 'ADVANCED_JAVA', difficulty: 'HIGH',
    question: 'What are the built-in functional interfaces in Java 8?',
    quickAnswer:
      'Functional interface: exactly one abstract method — can be used as a lambda or method reference. Key built-ins: Predicate<T> (T→boolean), Function<T,R> (T→R), Consumer<T> (T→void), Supplier<T> (→T), BiFunction<T,U,R>. They are the backbone of Streams and Optionals.',
    keyPoints: [
      'Predicate<T>: test(T t) → boolean — used in filter()',
      'Function<T,R>: apply(T t) → R — used in map()',
      'Consumer<T>: accept(T t) → void — used in forEach()',
      'Supplier<T>: get() → T — used in orElseGet()',
      'Method reference: Class::staticMethod, instance::method, Class::new',
    ],
  },
  {
    id: 'aj06', category: 'ADVANCED_JAVA', difficulty: 'HIGH',
    question: 'What are the SOLID principles?',
    quickAnswer:
      'S: Single Responsibility — one reason to change. O: Open/Closed — extend by adding, not modifying. L: Liskov Substitution — subclass usable wherever parent is expected. I: Interface Segregation — small focused interfaces. D: Dependency Inversion — depend on abstractions, not concretions.',
    keyPoints: [
      'SRP: UserService should not also send emails or handle file I/O',
      'OCP: add new behavior via new classes, not editing existing ones',
      'LSP: Square extending Rectangle violates LSP (setWidth breaks invariants)',
      'ISP: split fat IAnimal into IFlyable, ISwimmable rather than forcing all',
      'DIP: inject dependencies (constructor injection) — enables testing',
    ],
  },
  {
    id: 'aj07', category: 'ADVANCED_JAVA', difficulty: 'HIGH',
    question: 'Explain the Singleton pattern — what is the thread-safe way?',
    quickAnswer:
      'Singleton ensures one instance. Eager init (static final field) is always thread-safe. Double-checked locking needs volatile. The Bill Pugh static holder idiom is the cleanest — class loading guarantees atomicity without explicit synchronization.',
    keyPoints: [
      'Eager: static final INSTANCE = new Singleton() — simple, always safe',
      'Lazy DCL: volatile + synchronized block — thread-safe, lazy',
      'Bill Pugh (static holder): lazy, thread-safe, zero synchronization overhead',
      'Enum Singleton: simplest, handles serialization and reflection attacks',
      'Drawback: hard to test (global state), breaks Dependency Inversion',
    ],
    codeExample:
`// Bill Pugh Singleton — the preferred approach
public class Singleton {
    private Singleton() {}
    private static class Holder {
        static final Singleton INSTANCE = new Singleton();
    }
    public static Singleton getInstance() {
        return Holder.INSTANCE; // class loaded lazily on first call
    }
}`,
  },
  {
    id: 'aj08', category: 'ADVANCED_JAVA', difficulty: 'MEDIUM',
    question: 'What is ExecutorService and why use it over raw Thread?',
    quickAnswer:
      'Thread creation is expensive (~1 MB stack each). ExecutorService reuses a pool of threads, controls concurrency level, and provides Future<T> for async results. Always use ExecutorService in production code. Raw Thread is fine for one-off fire-and-forget tasks.',
    keyPoints: [
      'newFixedThreadPool(n): fixed pool, queues tasks when all threads busy',
      'newCachedThreadPool(): grows/shrinks dynamically, no queue',
      'newSingleThreadExecutor(): serial execution guarantee',
      'submit() returns Future<T>; execute() is fire-and-forget',
      'Always shutdown() — or leaked threads prevent JVM from exiting',
    ],
  },
  {
    id: 'aj09', category: 'ADVANCED_JAVA', difficulty: 'MEDIUM',
    question: 'What is CompletableFuture and how is it different from Future?',
    quickAnswer:
      'Future.get() blocks the calling thread — not composable. CompletableFuture adds non-blocking callbacks: thenApply(), thenAccept(), thenCompose(), exceptionally(). Chain multiple async operations without blocking. allOf() waits for all; anyOf() waits for the fastest.',
    keyPoints: [
      'thenApply(fn): transform result, like Stream.map — returns new CF',
      'thenAccept(consumer): consume result, return void',
      'thenCompose(fn): flatMap — when fn itself returns CompletableFuture',
      'exceptionally(fn): handle errors in the chain',
      'CompletableFuture.allOf(cf1, cf2).join() — wait for all to finish',
    ],
  },
  {
    id: 'aj10', category: 'ADVANCED_JAVA', difficulty: 'MEDIUM',
    question: 'What is garbage collection? What is G1GC?',
    quickAnswer:
      'GC automatically reclaims heap from unreachable objects. Java uses generational GC: Young Gen (Eden + Survivor) runs Minor GC frequently; Old Gen runs Major GC rarely. G1GC (default since Java 9) divides heap into regions and provides predictable pause times (<200ms). ZGC/Shenandoah achieve sub-millisecond pauses.',
    keyPoints: [
      'Minor GC: Young Gen — fast, stop-the-world brief pauses',
      'Major/Full GC: Old Gen — slower, longer pauses (GC pressure)',
      'G1GC: heap regions, predictable pauses, default in Java 9+',
      'ZGC (Java 15+): concurrent, sub-millisecond pauses for huge heaps',
      'Avoid: static maps holding references, large object allocation in loops',
    ],
  },

  // ── DSA ───────────────────────────────────────────────────────────────────
  {
    id: 'd01', category: 'DSA', difficulty: 'HIGH',
    question: 'What is Big O notation? Give examples of common complexities.',
    quickAnswer:
      'Big O describes the upper bound of time/space growth as input size grows. Drop constants and lower-order terms. O(1): HashMap get. O(log n): binary search. O(n): single loop. O(n log n): merge sort. O(n²): nested loops. O(2ⁿ): naive recursion. Always state both time and space in interviews.',
    keyPoints: [
      'O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ) < O(n!)',
      'Drop constants: O(3n) = O(n)',
      'Drop lower terms: O(n² + n) = O(n²)',
      'Space complexity includes recursion call stack depth',
      'Amortized: ArrayList.add() is O(1) amortized (rare O(n) resize)',
    ],
  },
  {
    id: 'd02', category: 'DSA', difficulty: 'HIGH',
    question: 'What is the Two Pointer technique and when do you use it?',
    quickAnswer:
      'Two pointers move through an array from both ends (or same direction) to find pairs or process in O(n) instead of O(n²). Use on sorted arrays for pair-sum problems, palindrome checks, or removing duplicates. Same-direction: slow/fast pointer for cycle detection.',
    keyPoints: [
      'Convergent pointers: requires sorted array, left+right move inward',
      'Same-direction: fast pointer explores, slow pointer marks a position',
      'Reduces O(n²) brute force to O(n)',
      'Classic problems: Two Sum (sorted), remove duplicates, container with most water',
    ],
    codeExample:
`// Two Sum in sorted array — O(n), O(1) space
int left = 0, right = arr.length - 1;
while (left < right) {
    int sum = arr[left] + arr[right];
    if (sum == target) return new int[]{left, right};
    else if (sum < target) left++;
    else right--;
}`,
  },
  {
    id: 'd03', category: 'DSA', difficulty: 'HIGH',
    question: 'What is the Sliding Window technique and when do you use it?',
    quickAnswer:
      'Sliding window maintains a contiguous subarray/substring by expanding/shrinking instead of recomputing from scratch. Fixed window: both ends advance together. Variable window: right always expands, left shrinks when a constraint is violated. Reduces O(n²) string/subarray problems to O(n).',
    keyPoints: [
      'Fixed window: move both pointers at same pace, process window content',
      'Variable window: right expands always, left shrinks when constraint violated',
      'Common constraint: HashMap for character frequencies, Set for uniqueness',
      'Classic: longest substring without repeating chars, max sum subarray of size k',
    ],
    codeExample:
`// Variable window: longest substring with at most k distinct chars
Map<Character, Integer> freq = new HashMap<>();
int left = 0, maxLen = 0;
for (int right = 0; right < s.length(); right++) {
    freq.merge(s.charAt(right), 1, Integer::sum);
    while (freq.size() > k) {
        char c = s.charAt(left++);
        freq.merge(c, -1, Integer::sum);
        if (freq.get(c) == 0) freq.remove(c);
    }
    maxLen = Math.max(maxLen, right - left + 1);
}`,
  },
  {
    id: 'd04', category: 'DSA', difficulty: 'HIGH',
    question: 'What is BFS vs DFS and when do you use each?',
    quickAnswer:
      'BFS explores level by level using a Queue — guarantees shortest path in unweighted graphs. DFS explores depth-first using a Stack or recursion — better for cycle detection, topological sort, connected components, and backtracking. BFS needs more memory (wide graphs); DFS needs stack depth (deep graphs).',
    keyPoints: [
      'BFS: Queue, shortest path in unweighted graph, level-order tree traversal',
      'DFS: Stack/recursion, cycle detection, topological sort, backtracking',
      'BFS space: O(width of graph); DFS space: O(depth)',
      'Weighted shortest path: Dijkstra = BFS + min-heap (priority queue)',
    ],
    codeExample:
`// BFS — iterative, always prefer over recursive for graphs
Queue<Integer> q = new LinkedList<>();
Set<Integer> visited = new HashSet<>();
q.add(start); visited.add(start);
while (!q.isEmpty()) {
    int node = q.poll();
    for (int neighbor : graph.get(node)) {
        if (visited.add(neighbor)) q.add(neighbor);
    }
}`,
  },
  {
    id: 'd05', category: 'DSA', difficulty: 'HIGH',
    question: 'What is Dynamic Programming? Memoization vs Tabulation?',
    quickAnswer:
      'DP solves problems by breaking them into overlapping subproblems and caching results. Memoization (top-down): recurse naturally, cache results. Tabulation (bottom-up): fill a table from base cases iteratively — no recursion stack, better for large inputs. Memoization is easier to derive; tabulation is faster in practice.',
    keyPoints: [
      'Two signals: overlapping subproblems + optimal substructure',
      'Memoization: add cache to brute-force recursion — easiest to write',
      'Tabulation: bottom-up, iterative, no stack overflow risk',
      'State definition is the hardest part — what uniquely identifies a subproblem?',
      'Classic: Fibonacci, Knapsack, Coin Change, LCS, Longest Increasing Subsequence',
    ],
    codeExample:
`// Coin Change — bottom-up tabulation
int[] dp = new int[amount + 1];
Arrays.fill(dp, amount + 1); // sentinel "infinity"
dp[0] = 0;
for (int coin : coins)
    for (int i = coin; i <= amount; i++)
        dp[i] = Math.min(dp[i], dp[i - coin] + 1);
return dp[amount] > amount ? -1 : dp[amount];`,
  },
  {
    id: 'd06', category: 'DSA', difficulty: 'HIGH',
    question: 'What is backtracking and how does it differ from brute force?',
    quickAnswer:
      'Backtracking explores all possibilities but prunes branches early when a constraint is violated. Brute force tries everything without pruning. Template: choose → recurse → unchoose. Use for permutations, combinations, N-Queens, Sudoku. Still exponential worst case but dramatically faster in practice.',
    keyPoints: [
      'Pruning: stop exploring a path as soon as it breaks a constraint',
      'Choose → explore → unchoose (undo) is the universal template',
      'State space is a decision tree; backtracking prunes whole subtrees',
      'Classic: subsets, permutations, combination sum, word search, N-Queens',
    ],
    codeExample:
`void backtrack(List<Integer> current, boolean[] used, int[] nums) {
    if (current.size() == nums.length) {
        result.add(new ArrayList<>(current)); return;
    }
    for (int i = 0; i < nums.length; i++) {
        if (used[i]) continue;          // prune
        used[i] = true;
        current.add(nums[i]);           // choose
        backtrack(current, used, nums); // explore
        current.remove(current.size() - 1); // unchoose
        used[i] = false;
    }
}`,
  },
  {
    id: 'd07', category: 'DSA', difficulty: 'MEDIUM',
    question: 'What is a Binary Search Tree and when does it degrade?',
    quickAnswer:
      'BST: left subtree < root < right subtree, recursively. Search/insert/delete are O(h). Balanced: O(log n). Worst case (sorted input): O(n) — degenerates to a linked list. Self-balancing BSTs (AVL, Red-Black) guarantee O(log n). Java TreeMap/TreeSet are Red-Black trees.',
    keyPoints: [
      'Inorder traversal of BST = sorted ascending sequence',
      'Balanced BST: O(log n) for all operations',
      'Unbalanced (sorted insertion): O(n) — use self-balancing instead',
      'TreeMap vs HashMap: TreeMap gives sorted iteration, HashMap is O(1) but unordered',
    ],
  },
  {
    id: 'd08', category: 'DSA', difficulty: 'MEDIUM',
    question: 'When do you use a Heap / Priority Queue?',
    quickAnswer:
      'A heap is a complete binary tree where parent ≤ children (min-heap). Insert and extract-min are O(log n); peek is O(1). Use for: Top-K elements, merge K sorted lists, Dijkstra, task scheduling. Java PriorityQueue is a min-heap by default.',
    keyPoints: [
      'Min-heap: smallest element always at root',
      'Max-heap: PriorityQueue with Collections.reverseOrder()',
      'Top-K largest: min-heap of size K, discard smaller elements',
      'Top-K smallest: max-heap of size K, discard larger elements',
      'Dijkstra = BFS where the "queue" is a min-heap on distance',
    ],
    codeExample:
`// Top K frequent elements using a min-heap of size K
PriorityQueue<int[]> heap =
    new PriorityQueue<>(Comparator.comparingInt(a -> a[1]));
for (var e : freq.entrySet()) {
    heap.offer(new int[]{e.getKey(), e.getValue()});
    if (heap.size() > k) heap.poll(); // evict least frequent
}`,
  },

  // ── SQL ───────────────────────────────────────────────────────────────────
  {
    id: 's01', category: 'SQL', difficulty: 'HIGH',
    question: 'What is the difference between INNER JOIN, LEFT JOIN, and FULL OUTER JOIN?',
    quickAnswer:
      'INNER JOIN: only rows with matches in both tables. LEFT JOIN: all rows from the left + matched from right (NULL if no match). FULL OUTER JOIN: all rows from both, NULL where no match. The anti-join pattern (LEFT JOIN + WHERE right.id IS NULL) finds rows that have no match.',
    keyPoints: [
      'INNER: intersection — matching rows only',
      'LEFT: all from left, NULLs from right where no match',
      'FULL OUTER: all from both sides (MySQL does not support directly — use UNION)',
      'Anti-join: LEFT JOIN + WHERE right_col IS NULL → unmatched left rows',
    ],
    codeExample:
`-- Anti-join: customers with no orders
SELECT c.id, c.name
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
WHERE o.id IS NULL;`,
  },
  {
    id: 's02', category: 'SQL', difficulty: 'HIGH',
    question: 'What are window functions and when do you use them?',
    quickAnswer:
      'Window functions compute values across related rows without collapsing them (unlike GROUP BY). OVER() defines the window. PARTITION BY groups like GROUP BY but keeps all rows. ORDER BY determines row order within partitions. Common: ROW_NUMBER, RANK, DENSE_RANK for ranking; LAG/LEAD for adjacent row values; SUM/AVG OVER for running totals.',
    keyPoints: [
      'ROW_NUMBER(): unique sequential number — no ties',
      'RANK(): skips numbers on ties (1,1,3)',
      'DENSE_RANK(): no skips on ties (1,1,2)',
      'LAG(col, 1): value from previous row — month-over-month comparisons',
      'LEAD(col, 1): value from next row',
      'SUM() OVER (ORDER BY date): running total',
    ],
    codeExample:
`SELECT name, dept, salary,
  RANK()       OVER (PARTITION BY dept ORDER BY salary DESC) AS rank,
  DENSE_RANK() OVER (PARTITION BY dept ORDER BY salary DESC) AS dense_rank,
  LAG(salary)  OVER (PARTITION BY dept ORDER BY salary DESC) AS prev_salary
FROM employees;`,
  },
  {
    id: 's03', category: 'SQL', difficulty: 'HIGH',
    question: 'What is the difference between WHERE and HAVING?',
    quickAnswer:
      'WHERE filters individual rows before aggregation. HAVING filters groups after GROUP BY. You cannot use aggregate functions in WHERE. Execution order: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY.',
    keyPoints: [
      'WHERE: runs before GROUP BY, filters raw rows',
      'HAVING: runs after GROUP BY, filters aggregated groups',
      'Cannot use column aliases from SELECT in WHERE or HAVING (not yet evaluated)',
      'HAVING without GROUP BY applies aggregate condition to the whole table',
    ],
    codeExample:
`SELECT dept, AVG(salary) AS avg_sal
FROM employees
WHERE status = 'ACTIVE'          -- filter rows first
GROUP BY dept
HAVING AVG(salary) > 70000;      -- filter groups after aggregation`,
  },
  {
    id: 's04', category: 'SQL', difficulty: 'HIGH',
    question: 'What is database indexing and when should you use it?',
    quickAnswer:
      'An index (typically B-tree) speeds up reads at the cost of write overhead and storage. Index columns in WHERE clauses, JOIN conditions, ORDER BY. Avoid indexing low-cardinality columns (boolean, status with few values) — the optimizer may skip them. Use EXPLAIN to verify an index is being used.',
    keyPoints: [
      'B-tree index: =, >, <, BETWEEN, LIKE "prefix%" — not LIKE "%suffix"',
      'Composite index (col1, col2): only useful when querying left-most prefix',
      'Covering index: all needed columns in the index — avoids table row lookup',
      'Too many indexes slow INSERT/UPDATE/DELETE (index maintenance cost)',
      'EXPLAIN / EXPLAIN ANALYZE: check if and which index is used',
      'Index not used: function on column (WHERE YEAR(date)=2024), implicit cast',
    ],
  },
  {
    id: 's05', category: 'SQL', difficulty: 'HIGH',
    question: 'What are ACID properties in database transactions?',
    quickAnswer:
      'Atomicity: all ops in a transaction succeed or all are rolled back. Consistency: transaction moves DB from one valid state to another. Isolation: concurrent transactions behave as if sequential. Durability: committed data survives crashes (write-ahead log).',
    keyPoints: [
      'Atomicity: BEGIN ... COMMIT / ROLLBACK — all or nothing',
      'Isolation levels (weakest→strongest): READ UNCOMMITTED, READ COMMITTED, REPEATABLE READ, SERIALIZABLE',
      'MySQL InnoDB default: REPEATABLE READ',
      'Durability: WAL (write-ahead log) ensures committed data is not lost',
      'Higher isolation = fewer anomalies but more lock contention',
    ],
  },
  {
    id: 's06', category: 'SQL', difficulty: 'MEDIUM',
    question: 'What is a CTE and how is it different from a subquery?',
    quickAnswer:
      'A CTE (WITH clause) is a named temporary result set — improves readability, can be referenced multiple times, and enables recursive queries. A subquery is inline and harder to read when nested. Use CTEs for step-by-step transformations; recursive CTEs for hierarchical data (org charts, trees).',
    keyPoints: [
      'CTE: WITH name AS (query) — named, reusable in the same statement',
      'Recursive CTE: WITH RECURSIVE — base case UNION ALL recursive step',
      'Optimizer may materialize CTE (evaluate once) or inline it (database-dependent)',
      'Use CTEs to decompose complex queries into readable named steps',
    ],
    codeExample:
`-- Recursive CTE: employee hierarchy
WITH RECURSIVE org AS (
    SELECT id, name, manager_id, 0 AS level
    FROM employees WHERE manager_id IS NULL       -- anchor (base case)
    UNION ALL
    SELECT e.id, e.name, e.manager_id, o.level + 1
    FROM employees e JOIN org o ON e.manager_id = o.id -- recursive step
)
SELECT * FROM org ORDER BY level;`,
  },
  {
    id: 's07', category: 'SQL', difficulty: 'MEDIUM',
    question: 'What is normalization? Explain 1NF, 2NF, 3NF.',
    quickAnswer:
      '1NF: atomic values — no repeating groups or arrays in a column. 2NF: no partial dependencies — every non-key column depends on the whole primary key (matters for composite keys). 3NF: no transitive dependencies — non-key columns depend only on the primary key, not on other non-key columns.',
    keyPoints: [
      '1NF: one value per cell, uniquely identifiable rows',
      '2NF: every non-key column fully depends on entire composite PK',
      '3NF: no A → B → C chains where B is not a key',
      'Denormalization: intentional redundancy for query performance (reporting DBs)',
    ],
  },
  {
    id: 's08', category: 'SQL', difficulty: 'HIGH',
    question: 'What is the N+1 query problem and how do you fix it?',
    quickAnswer:
      'N+1 occurs when you load N parent records then fire 1 extra query per parent to load children — N+1 total. Fix: JOIN both in one query, or batch-load with IN clause. In JPA/Hibernate: use JOIN FETCH in JPQL, @EntityGraph, or @BatchSize on lazy collections.',
    keyPoints: [
      'Symptom: hundreds of near-identical SELECT queries in logs',
      'Fix in SQL: JOIN both tables in one query',
      'Fix in JPA: JOIN FETCH in JPQL, or @EntityGraph annotation',
      '@BatchSize(size=50) on lazy @OneToMany reduces to N/50 + 1 queries',
      'spring.jpa.show-sql=true reveals N+1 immediately in dev',
    ],
    codeExample:
`-- N+1: 1 query for all authors + N individual queries for books
-- Fix: single JOIN
SELECT a.name, b.title
FROM authors a
JOIN books b ON a.id = b.author_id;

-- JPA fix: JOIN FETCH
@Query("SELECT a FROM Author a JOIN FETCH a.books")
List<Author> findAllWithBooks();`,
  },
  {
    id: 's09', category: 'SQL', difficulty: 'MEDIUM',
    question: 'How do you find and delete duplicate records?',
    quickAnswer:
      'Use GROUP BY + HAVING COUNT(*) > 1 to find duplicates. To delete keeping one, use ROW_NUMBER() OVER (PARTITION BY duplicate_cols ORDER BY id) and delete where rank > 1. Always verify with SELECT before deleting.',
    keyPoints: [
      'Find: GROUP BY duplicate_cols HAVING COUNT(*) > 1',
      'Identify which to delete: ROW_NUMBER() OVER (PARTITION BY ... ORDER BY id)',
      'Keep earliest: ORDER BY id ASC; keep latest: ORDER BY created_at DESC',
      'MySQL trick: DELETE WHERE id NOT IN (SELECT MIN(id) ... GROUP BY email)',
    ],
    codeExample:
`-- Delete duplicates, keep the row with lowest id
DELETE FROM users
WHERE id NOT IN (
    SELECT MIN(id) FROM users GROUP BY email
);`,
  },

  // ── AWS ───────────────────────────────────────────────────────────────────
  {
    id: 'a01', category: 'AWS', difficulty: 'HIGH',
    question: 'What is IAM? Difference between a user, role, and policy?',
    quickAnswer:
      'IAM controls who can do what in AWS. User: person or application with long-term credentials (access key + secret). Role: identity assumed temporarily by services (EC2, Lambda) — no long-term credentials. Policy: JSON document defining allowed/denied actions. Attach policies to users, groups, or roles.',
    keyPoints: [
      'User: long-term credentials — for people or external applications',
      'Role: assumed temporarily — for services (EC2 instance role, Lambda execution role)',
      'Policy: Effect(Allow/Deny), Action (s3:GetObject), Resource (ARN)',
      'Least privilege: grant only exactly what is needed',
      'Never hardcode credentials in code — use roles for service-to-service auth',
      'Instance profile: way to attach an IAM role to an EC2 instance',
    ],
  },
  {
    id: 'a02', category: 'AWS', difficulty: 'HIGH',
    question: 'What is the difference between EC2, Lambda, and ECS/Fargate?',
    quickAnswer:
      'EC2: virtual machines you manage — patch, scale, configure. Lambda: serverless functions, event-triggered, pay per invocation, max 15-min runtime. ECS: Docker container orchestration. Fargate: serverless containers (ECS without managing EC2). Lambda for short event-driven tasks; ECS/EC2 for long-running services.',
    keyPoints: [
      'EC2: full control, always running, best for stateful or complex long-running workloads',
      'Lambda: serverless, event-driven, cold start, max 15 min, auto-scales instantly',
      'ECS on EC2: you manage the underlying fleet',
      'ECS on Fargate: serverless containers — no EC2 management, pay per task',
      'EKS: managed Kubernetes — more power/complexity than ECS',
    ],
  },
  {
    id: 'a03', category: 'AWS', difficulty: 'HIGH',
    question: 'What is the difference between S3, EBS, and EFS?',
    quickAnswer:
      'S3: object storage via HTTP — unlimited scale, 11 nines durability, good for files/backups/static assets. EBS: block storage attached to one EC2 — like a hard disk, low latency, good for databases. EFS: NFS file system mountable from multiple EC2 simultaneously — shared storage.',
    keyPoints: [
      'S3: object store, globally accessible via HTTPS, infinite scale, cheap',
      'EBS: attached to one EC2 at a time, block-level, low latency random I/O',
      'EFS: network file system, multi-AZ, mountable from multiple EC2 simultaneously',
      'S3 Glacier: archival, very cheap, retrieval takes hours',
      'S3 lifecycle rules: auto-transition objects to cheaper storage tiers',
    ],
  },
  {
    id: 'a04', category: 'AWS', difficulty: 'HIGH',
    question: 'What is a VPC? Explain subnets, security groups, and NACLs.',
    quickAnswer:
      'VPC is your private isolated network in AWS. Public subnets have a route to an Internet Gateway; private subnets do not (use NAT Gateway for outbound). Security Groups are stateful instance-level firewalls. NACLs are stateless subnet-level firewalls. Security Groups are the main tool in practice.',
    keyPoints: [
      'VPC: your own private network, define CIDR block (e.g. 10.0.0.0/16)',
      'Public subnet: routes 0.0.0.0/0 → Internet Gateway',
      'Private subnet: routes 0.0.0.0/0 → NAT Gateway for outbound-only internet',
      'Security Group: stateful (return traffic auto-allowed), allow-only rules',
      'NACL: stateless (must allow both directions explicitly), allow + deny rules',
      'Bastion host: EC2 in public subnet to SSH into private resources',
    ],
  },
  {
    id: 'a05', category: 'AWS', difficulty: 'HIGH',
    question: 'What is the difference between SQS and SNS?',
    quickAnswer:
      'SQS is a message queue — consumer pulls messages, processes one at a time (point-to-point). SNS is a pub/sub topic — one message fans out to all subscribers simultaneously. Use SQS for task queues and decoupling services; SNS for broadcast notifications. Fan-out: SNS → multiple SQS queues for parallel processing.',
    keyPoints: [
      'SQS: pull-based, one consumer per message, messages persist up to 14 days',
      'SNS: push-based, multiple subscribers (SQS, Lambda, HTTP, email, SMS)',
      'Fan-out: SNS topic → multiple SQS queues for parallel consumers',
      'SQS visibility timeout: prevents double-processing while consumer works',
      'SQS FIFO: exactly-once delivery, ordered, lower throughput (3000 msg/s)',
      'DLQ (Dead Letter Queue): captures messages that fail N times',
    ],
  },
  {
    id: 'a06', category: 'AWS', difficulty: 'HIGH',
    question: 'What is Lambda cold start and when should you NOT use Lambda?',
    quickAnswer:
      'Cold start: first invocation spins up a container — adds 100ms-1s latency. Subsequent calls reuse the container (warm). Avoid Lambda for: tasks >15 min, high-throughput low-latency APIs (cold start matters), stateful workloads, WebSocket servers. Use Provisioned Concurrency to eliminate cold starts when latency is critical.',
    keyPoints: [
      'Cold start: first invocation initializes container + runtime',
      'Warm start: reuses existing container — very fast',
      'Max runtime: 15 minutes; Max memory: 10 GB',
      'Provisioned Concurrency: pre-warm N instances to eliminate cold starts',
      'Not for: >15 min jobs, stateful workloads, WebSockets, connection pooling',
      'Good for: S3 triggers, SQS consumers, scheduled tasks, API backends',
    ],
  },
  {
    id: 'a07', category: 'AWS', difficulty: 'HIGH',
    question: 'What is the difference between RDS and DynamoDB?',
    quickAnswer:
      'RDS is managed relational SQL (MySQL, PostgreSQL) — use for complex queries, joins, transactions, foreign keys. DynamoDB is NoSQL key-value/document — use for high-throughput, flexible schema, single-digit millisecond latency at any scale. DynamoDB requires careful partition key design upfront; RDS allows ad-hoc queries.',
    keyPoints: [
      'RDS: SQL, ACID, complex joins, scales vertically + read replicas',
      'DynamoDB: NoSQL, ms latency, auto-scale, pay per request mode',
      'DynamoDB: partition key + sort key design is the most critical decision',
      'DynamoDB: no joins — denormalize or use multiple requests (access patterns first)',
      'Aurora: AWS-optimized MySQL/PostgreSQL, 3-5x faster, auto-storage growth',
      'ElastiCache: in-memory Redis/Memcached layer to reduce RDS load',
    ],
  },
  {
    id: 'a08', category: 'AWS', difficulty: 'MEDIUM',
    question: 'What is CloudWatch and how do you monitor applications with it?',
    quickAnswer:
      'CloudWatch is AWS observability: metrics, logs, alarms, and dashboards. Every AWS service publishes metrics. Custom metrics available via PutMetricData API. Set alarms to trigger Auto Scaling or SNS notifications. CloudWatch Insights provides SQL-like log querying. X-Ray handles distributed tracing.',
    keyPoints: [
      'Metrics: EC2 CPU, RDS connections, Lambda errors, invocations',
      'Logs: stream application logs from Lambda, ECS, EC2 (via CloudWatch agent)',
      'Alarms: trigger Auto Scaling, SNS notification, EC2 action on metric threshold',
      'CloudWatch Insights: query logs with a SQL-like syntax',
      'X-Ray: distributed tracing, visualize request path across services',
      'EventBridge: cron scheduler + event bus (replaces CloudWatch Events)',
    ],
  },
];
