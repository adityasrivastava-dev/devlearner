/* ══════════════════════════════════════════════════════════════════════════════
   flowchart.js  -  Topic-specific Mermaid.js flowcharts (Java + DSA complete)
══════════════════════════════════════════════════════════════════════════════ */
const Flowchart = (() => {
  const G = "fill:#1a2e1a,stroke:#4ade80,color:#4ade80";
  const R = "fill:#2e1a1a,stroke:#f87171,color:#f87171";
  const B = "fill:#1a1e2e,stroke:#60a5fa,color:#60a5fa";
  const P = "fill:#1e1e2e,stroke:#a78bfa,color:#a78bfa";
  const Y = "fill:#1e1a0a,stroke:#fbbf24,color:#fbbf24";
  const T = "fill:#1a2825,stroke:#34d399,color:#34d399";
  const K = "fill:#2e1a26,stroke:#f472b6,color:#f472b6";

  const CHARTS = {

    "java basics": `flowchart TD
    A([Start]) --> B["Create Main.java"]
    B --> C["public class Main"]
    C --> D["public static void main(String[] args)"]
    D --> E["System.out.println()"]
    E --> F["javac Main.java"]
    F --> G1{Errors?}
    G1 -- Yes --> H["Fix syntax"]
    H --> F
    G1 -- No  --> I["java Main"]
    I --> J([Output!])
    style A ${G}
    style J ${G}
    style G1 ${B}
    style H ${R}`,

    "variables": `flowchart TD
    A([Declare]) --> B{Which type?}
    B -- int/long/double --> C["Primitive
int x = 42;"]
    B -- String/Object  --> D["Reference
String s = 'hi';"]
    B -- boolean        --> E["boolean b = true;"]
    C --> F{Need in collection?}
    F -- Yes --> G["Autobox: Integer, Double"]
    F -- No  --> H["Use primitive (faster)"]
    D --> I["ALWAYS .equals()
not == for Strings"]
    E --> J([Use variable])
    G --> J
    H --> J
    I --> J
    style A ${G}
    style J ${G}
    style B ${P}
    style F ${B}
    style I ${R}`,

    "operators": `flowchart TD
    A([Expression]) --> B{Operator?}
    B -- Arithmetic --> C["+ - * / %
Cast before / if decimal needed"]
    B -- Logical    --> D["&& short-circuits on false
|| short-circuits on true"]
    B -- Bitwise    --> E["n&1 odd, n>>1 div2
n&(n-1) clears low bit"]
    B -- Ternary    --> F["cond ? a : b"]
    C --> G([Result])
    D --> G
    E --> G
    F --> G
    style A ${G}
    style G ${G}
    style B ${P}
    style E ${T}`,

    "control flow": `flowchart TD
    A([Condition]) --> B{How many branches?}
    B -- Two        --> C["if / else"]
    B -- Many range --> D["if-else chain"]
    B -- Discrete   --> E["switch(val) { case x -> ... }"]
    B -- Simple     --> F["ternary: cond ? a : b"]
    C --> G{Deep nesting?}
    G -- Yes --> H["Guard clauses - early return"]
    G -- No  --> I([Execute])
    D --> I
    E --> I
    F --> I
    H --> I
    style A ${G}
    style I ${G}
    style B ${P}
    style G ${B}
    style H ${T}`,

    "loops": `flowchart TD
    A([Need loop]) --> B{Know count?}
    B -- Yes  --> C["for(int i=0; i<n; i++)"]
    B -- No   --> D{At least once?}
    D -- Yes  --> E["do { } while(cond)"]
    D -- No   --> F["while(condition)"]
    C --> G{Values only?}
    G -- Yes  --> H["for(T x : collection)"]
    G -- No   --> I["Index loop"]
    E --> J{Control?}
    F --> J
    H --> J
    I --> J
    J -- Skip --> K["continue"]
    J -- Exit --> L["break"]
    J -- Normal --> M([Execute body])
    style A ${G}
    style M ${G}
    style B ${B}
    style D ${P}
    style J ${Y}`,

    "methods": `flowchart TD
    A([Define method]) --> B["Return type + name + params"]
    B --> C{Same name diff params?}
    C -- Yes --> D["Method overloading"]
    C -- No  --> E["Single method"]
    D --> F{Varargs?}
    E --> F
    F -- Yes --> G["int... nums"]
    F -- No  --> H["Fixed params"]
    G --> I["Call: method(1, 2, 3)"]
    H --> I
    I --> J{Recursive?}
    J -- Yes --> K{Base case?}
    K -- No  --> I
    K -- Yes --> L([Return])
    J -- No  --> L
    style A ${G}
    style L ${G}
    style C ${B}
    style F ${P}
    style J ${Y}`,

    "java arrays": `flowchart TD
    A([Array needed]) --> B["int[] arr = new int[n]"]
    B --> C{Operation?}
    C -- Read    --> D["arr[i]  O(1)"]
    C -- Sort    --> E["Arrays.sort()  O(n logn)"]
    C -- Search  --> F{Sorted?}
    C -- Copy    --> G["Arrays.copyOf()"]
    C -- Fill    --> H["Arrays.fill(arr, val)"]
    F -- Yes --> I["Arrays.binarySearch()  O(logn)"]
    F -- No  --> J["Linear scan  O(n)"]
    D --> K([Done])
    E --> K
    I --> K
    J --> K
    G --> K
    H --> K
    style A ${G}
    style K ${G}
    style C ${P}
    style F ${B}`,

    "java strings": `flowchart TD
    A([String op]) --> B{Build or process?}
    B -- Build   --> C{Many concat?}
    C -- Yes     --> D["StringBuilder.append()"]
    C -- No      --> E["str = a + b"]
    B -- Compare --> F["ALWAYS .equals()
NEVER =="]
    B -- Search  --> G["indexOf() contains()
startsWith()"]
    B -- Split   --> H["split(regex)"]
    B -- Parse   --> I["Integer.parseInt(s)"]
    D --> J([Result])
    E --> J
    F --> J
    G --> J
    H --> J
    I --> J
    style A ${G}
    style J ${G}
    style B ${B}
    style F ${R}
    style C ${P}`,

    "classes": `flowchart TD
    A([Design class]) --> B["private fields"]
    B --> C["constructor(s)"]
    C --> D["getters + setters"]
    D --> E["methods (behaviour)"]
    E --> F{static or instance?}
    F -- Static   --> G["Belongs to Class
no 'this' needed"]
    F -- Instance --> H["Belongs to Object
uses 'this.field'"]
    G --> I["MyClass obj = new MyClass()"]
    H --> I
    I --> J([Object ready])
    style A ${G}
    style J ${G}
    style F ${B}`,

    "inheritance": `flowchart TD
    A([IS-A relationship?]) --> B{Genuine IS-A?}
    B -- Yes --> C["class Dog extends Animal"]
    B -- No  --> D["Use Composition (HAS-A)"]
    C --> E["super() in constructor"]
    E --> F{Override method?}
    F -- Yes --> G["@Override - compile check"]
    F -- No  --> H["Inherit as-is"]
    G --> I{Call super too?}
    I -- Yes --> J["super.method()"]
    I -- No  --> K["Full override"]
    J --> L(["Animal a = new Dog()"])
    H --> L
    K --> L
    D --> M(["Use composition"])
    style A ${G}
    style L ${G}
    style M ${T}
    style B ${B}
    style F ${P}`,

    "polymorphism": `flowchart TD
    A([Same name, diff behaviour]) --> B{When resolved?}
    B -- Compile-time --> C["Overloading
same name, diff params"]
    B -- Runtime      --> D["Overriding
child overrides parent"]
    C --> E["Compiler picks by arg types"]
    D --> F["Animal a = new Dog()
a.speak() -> Dog.speak()"]
    F --> G{Interface?}
    G -- Yes --> H["Shape s = new Circle()
can swap: s = new Rect()"]
    G -- No  --> I["Class hierarchy only"]
    E --> J([Correct method called])
    H --> J
    I --> J
    style A ${G}
    style J ${G}
    style B ${B}
    style G ${P}`,

    "abstraction": `flowchart TD
    A([Define contract]) --> B{Complete impl?}
    B -- None    --> C["interface Shape { area(); }"]
    B -- Partial --> D["abstract class Shape { abstract area(); }"]
    C --> E{Multiple interfaces?}
    E -- Yes --> F["implements A, B, C (OK)"]
    E -- No  --> G["implements Shape"]
    D --> H["extends Shape (single only)"]
    F --> I["Override ALL abstract methods"]
    G --> I
    H --> I
    I --> J([Contract fulfilled])
    style A ${G}
    style J ${G}
    style B ${B}
    style E ${P}`,

    "encapsulation": `flowchart TD
    A([Protect data]) --> B["private int field"]
    B --> C["public getField()"]
    C --> D["public setField(val) + validation"]
    D --> E{Immutable needed?}
    E -- Yes --> F["final field, no setter"]
    E -- No  --> G{Sensitive data?}
    G -- Yes --> H["Defensive copy in get/set"]
    G -- No  --> I["Direct return OK"]
    F --> J([Data protected])
    H --> J
    I --> J
    style A ${G}
    style J ${G}
    style E ${B}
    style F ${T}`,

    "solid": `flowchart TD
    A([SOLID check]) --> B["S - Single Responsibility
one class, one reason to change"]
    B --> C["O - Open/Closed
extend not modify"]
    C --> D["L - Liskov Substitution
subclass usable as base"]
    D --> E["I - Interface Segregation
small focused interfaces"]
    E --> F["D - Dependency Inversion
depend on abstractions"]
    F --> G{Any violation?}
    G -- Yes --> H["Refactor: extract class/interface"]
    H --> G
    G -- No  --> I([Clean design])
    style A ${G}
    style I ${G}
    style G ${B}
    style H ${R}`,

    "exception handling": `flowchart TD
    A([Risky code]) --> B["try { riskyCode() }"]
    B --> C{Exception thrown?}
    C -- No  --> D["finally { cleanup() }"]
    C -- Yes --> E{Checked or Unchecked?}
    E -- Checked   --> F["Must catch or declare throws"]
    E -- Unchecked --> G["Optional to catch"]
    F --> H["catch(Exception e) { handle() }"]
    G --> H
    H --> I{Chain exception?}
    I -- Yes --> J["throw new ServiceEx(msg, e)"]
    I -- No  --> K["Log and recover"]
    J --> D
    K --> D
    D --> L{Resource to close?}
    L -- Yes --> M["try-with-resources
(AutoCloseable)"]
    L -- No  --> N([Handled])
    M --> N
    style A ${G}
    style N ${G}
    style C ${B}
    style E ${P}
    style M ${T}`,

    "generics": `flowchart TD
    A([Type-safe code]) --> B["class Box<T> { T value; }"]
    B --> C["Box<String> box = new Box<>()"]
    C --> D{Wildcard needed?}
    D -- Read only  --> E["<? extends T> upper bound"]
    D -- Write only --> F["<? super T> lower bound"]
    D -- Both       --> G["Exact <T>"]
    E --> H["List<? extends Number>
read as Number, cannot add"]
    F --> I["List<? super Integer>
add Integer, reads Object"]
    G --> J["Full type safety"]
    H --> K([Type-safe])
    I --> K
    J --> K
    style A ${G}
    style K ${G}
    style D ${B}
    style E ${T}
    style F ${K}`,

    "arraylist linkedlist": `flowchart TD
    A([Need list]) --> B{Random access?}
    B -- Yes  --> C["ArrayList
O(1) get, O(n) insert mid"]
    B -- No   --> D["LinkedList
O(1) at ends, O(n) get"]
    C --> E{Sort?}
    E -- Yes --> F["Collections.sort()
list.sort(comparator)"]
    E -- No  --> G([List ready])
    D --> G
    F --> G
    style A ${G}
    style G ${G}
    style B ${B}`,

    "hashset treeset": `flowchart TD
    A([Unique values]) --> B{Ordered?}
    B -- No, fastest --> C["HashSet  O(1)"]
    B -- Sorted      --> D["TreeSet  O(logn)"]
    B -- Insert order -> E["LinkedHashSet  O(1)"]
    C --> F{Set operation?}
    D --> G["first/last/floor/ceiling"]
    F -- Union     --> H["setA.addAll(setB)"]
    F -- Intersect --> I["setA.retainAll(setB)"]
    F -- Diff      --> J["setA.removeAll(setB)"]
    G --> K([Set ready])
    H --> K
    I --> K
    J --> K
    E --> K
    style A ${G}
    style K ${G}
    style B ${B}
    style F ${P}`,

    "hashmap treemap": `flowchart TD
    A([Key-Value store]) --> B{Sorted keys?}
    B -- No, fastest --> C["HashMap  O(1) avg"]
    B -- Sorted      --> D["TreeMap  O(logn)"]
    B -- Insert order -> E["LinkedHashMap"]
    C --> F["put/get/getOrDefault
merge(k,1,Integer::sum)"]
    D --> G["firstKey/floorKey/subMap"]
    E --> H["LRU: accessOrder=true"]
    F --> I{Iterate?}
    I -- Keys   --> J["keySet()"]
    I -- Values --> K["values()"]
    I -- Both   --> L["entrySet()"]
    G --> M([Map ready])
    H --> M
    J --> M
    K --> M
    L --> M
    style A ${G}
    style M ${G}
    style B ${B}
    style I ${Y}`,

    "queue deque": `flowchart TD
    A([Queue type?]) --> B{Semantics?}
    B -- FIFO      --> C["Queue<T>
offer/poll/peek"]
    B -- Both ends --> D["Deque<T> ArrayDeque
offerFirst/Last, pollFirst/Last"]
    B -- Priority  --> E["PriorityQueue
Min-heap default"]
    E --> F{Max heap?}
    F -- Yes --> G["new PQ<>(reverseOrder())"]
    F -- No  --> H["Default min-heap"]
    C --> I([Ready])
    D --> I
    G --> I
    H --> I
    style A ${G}
    style I ${G}
    style B ${B}
    style F ${Y}`,

    "lambda expressions": `flowchart TD
    A([Functional interface]) --> B["Exactly ONE abstract method"]
    B --> C{Replace anonymous class?}
    C -- Yes --> D["(params) -> expression"]
    C -- No  --> E["Regular class"]
    D --> F{Method reference?}
    F -- Static   --> G["Class::staticMethod"]
    F -- Instance --> H["obj::instanceMethod"]
    F -- Constructor -> I["Class::new"]
    F -- Keep lambda -> J["(x) -> x * 2"]
    G --> K([Lambda used])
    H --> K
    I --> K
    J --> K
    E --> K
    style A ${G}
    style K ${G}
    style C ${B}
    style F ${P}`,

    "streams api": `flowchart TD
    A([Collection]) --> B["list.stream()"]
    B --> C{Filter?}
    C -- Yes --> D[".filter(predicate)"]
    C -- No  --> E
    D --> E{Transform?}
    E -- Yes --> F[".map(fn)
.flatMap(fn)"]
    E -- No  --> H
    F --> H{Terminal?}
    H --> I{Which?}
    I -- List    --> J[".collect(toList())"]
    I -- Count   --> K[".count()"]
    I -- Reduce  --> L[".reduce(0, Integer::sum)"]
    I -- Group   --> M[".collect(groupingBy())"]
    I -- First   --> N[".findFirst() -> Optional"]
    J --> O([Stream result])
    K --> O
    L --> O
    M --> O
    N --> O
    style A ${G}
    style O ${G}
    style C ${B}
    style E ${P}
    style I ${Y}`,

    "multithreading": `flowchart TD
    A([Parallel task]) --> B{Task type?}
    B -- CPU-bound --> C["FixedThreadPool(cores)"]
    B -- IO-bound  --> D["CachedThreadPool"]
    C --> E["submit(Runnable or Callable)"]
    D --> E
    E --> F{Shared state?}
    F -- Yes --> G{Performance critical?}
    G -- Yes --> H["AtomicInteger (lock-free)"]
    G -- No  --> I["synchronized or Lock"]
    F -- No  --> J["No sync needed"]
    H --> K["shutdown + awaitTermination"]
    I --> K
    J --> K
    K --> L([Done])
    style A ${G}
    style L ${G}
    style B ${B}
    style F ${P}
    style H ${T}`,

    "executorservice": `flowchart TD
    A([Thread pool]) --> B{Task type?}
    B -- Fixed count  --> C["newFixedThreadPool(n)"]
    B -- Dynamic      --> D["newCachedThreadPool()"]
    B -- Scheduled    --> E["newScheduledThreadPool(n)"]
    C --> F["Future<T> f = pool.submit(task)"]
    D --> F
    E --> G["scheduleAtFixedRate(task, 0, 10, SECS)"]
    F --> H["f.get() to wait for result"]
    H --> I{isDone?}
    I -- Yes --> J["Get result"]
    I -- No  --> K["Wait or do other work"]
    K --> I
    J --> L["pool.shutdown()"]
    G --> L
    L --> M([Tasks done])
    style A ${G}
    style M ${G}
    style B ${B}
    style I ${Y}`,

    "completablefuture": `flowchart TD
    A([Async chain]) --> B["CF.supplyAsync(() -> fetch())"]
    B --> C[".thenApply(data -> process())"]
    C --> D[".thenCompose(r -> asyncOp(r))"]
    D --> E[".thenAccept(r -> save(r))"]
    E --> F{Error handling?}
    F -- Yes --> G[".exceptionally(ex -> fallback)"]
    F -- No  --> H[".join() or .get()"]
    G --> H
    H --> I{Combine CFs?}
    I -- All --> J["CF.allOf(cf1,cf2).thenRun()"]
    I -- Any --> K["CF.anyOf(cf1,cf2)"]
    I -- One --> L([Async done])
    J --> L
    K --> L
    style A ${G}
    style L ${G}
    style F ${B}
    style I ${P}`,

    "jvm memory": `flowchart TD
    A([JVM Memory]) --> B{Where stored?}
    B -- Objects   --> C["Heap - GC managed"]
    B -- Calls     --> D["Stack - per thread"]
    B -- Classes   --> E["Metaspace - off heap"]
    C --> F{Generation?}
    F -- Young --> G["Eden -> S0 -> S1
Minor GC frequent"]
    F -- Old   --> H["Tenured - Major GC"]
    G --> I{Survived 16 GCs?}
    I -- Yes --> H
    I -- No  --> J["Collected (minor GC)"]
    D --> K["Frame: locals + operand stack"]
    H --> L([Memory managed])
    J --> L
    K --> L
    E --> L
    style A ${G}
    style L ${G}
    style B ${B}
    style F ${P}`,

    "design patterns": `flowchart TD
    A([Design problem]) --> B{Category?}
    B -- Creational  --> C{How create?}
    B -- Structural  --> D{How compose?}
    B -- Behavioural --> E{How communicate?}
    C -- One instance   --> F["Singleton"]
    C -- Complex build  --> G["Builder"]
    C -- Family         --> H["Factory"]
    D -- Add behaviour  --> I["Decorator"]
    D -- Hide complexity -> J["Facade"]
    E -- Notify many    --> K["Observer"]
    E -- Swap algo      --> L["Strategy"]
    E -- Undo/redo      --> M["Command"]
    F --> N([Pattern applied])
    G --> N
    H --> N
    I --> N
    J --> N
    K --> N
    L --> N
    M --> N
    style A ${G}
    style N ${G}
    style B ${P}
    style C ${B}
    style D ${T}
    style E ${Y}`,

    "arrays dsa": `flowchart TD
    A([Array problem]) --> B{Pattern?}
    B -- Pair sum   --> C["HashMap: store complement
For each i: check target-arr[i]"]
    B -- Subarray   --> D["Prefix sum + HashMap
count where prefixSum-k exists"]
    B -- Max sub    --> E["Kadane: curr=max(arr[i], curr+arr[i])"]
    B -- Partition  --> F["Dutch flag: lo/mid/hi"]
    B -- Rotate     --> G["Triple reverse O(n) O(1)"]
    C --> H([O(n) O(1)])
    D --> H
    E --> H
    F --> H
    G --> H
    style A ${G}
    style H ${G}
    style B ${B}`,

    "linked list": `flowchart TD
    A([Linked list op]) --> B{Which?}
    B -- Reverse  --> C["prev=null, curr=head
Save next BEFORE breaking link"]
    B -- Cycle    --> D["Floyd: slow/fast
if meet: cycle exists"]
    B -- Middle   --> E["slow+fast: fast=2x speed
when fast=null, slow=middle"]
    B -- Merge    --> F["Dummy node + cur
compare heads, attach smaller"]
    B -- Remove N --> G["Two ptrs k+1 apart
remove slow.next"]
    C --> H([Solved])
    D --> H
    E --> H
    F --> H
    G --> H
    style A ${G}
    style H ${G}
    style B ${B}
    style C ${R}`,

    "stack dsa": `flowchart TD
    A([Stack problem]) --> B{Pattern?}
    B -- Brackets  --> C["Push open, pop on close
Empty at end = balanced"]
    B -- NGE       --> D["Mono decreasing
pop when curr > top
result[popped]=curr"]
    B -- Min O(1)  --> E["Parallel minStack
push min(x, minSt.peek())"]
    B -- Rect      --> F["Mono increasing
pop when curr < top
w=i-peek()-1, area=h*w"]
    C --> G([O(n)])
    D --> G
    E --> G
    F --> G
    style A ${G}
    style G ${G}
    style B ${B}
    style D ${P}`,

    "queue bfs": `flowchart TD
    A([BFS / Queue]) --> B["Queue<int[]> q
q.offer(start)
visited[start]=true"]
    B --> C{Q empty?}
    C -- No  --> D["int[] cur = q.poll()"]
    D --> E{Goal?}
    E -- Yes --> F([Return steps])
    E -- No  --> G["For each neighbor
if !visited: mark+enqueue"]
    G --> C
    C -- Yes --> H([Not found])
    style A ${G}
    style F ${G}
    style H ${R}
    style C ${B}
    style E ${P}`,

    "binary search": `flowchart TD
    A([Binary search]) --> B{On array or answer?}
    B -- Array  --> C["lo=0 hi=n-1
mid=lo+(hi-lo)/2"]
    B -- Answer --> D["lo=min hi=max
canAchieve(mid)?"]
    C --> E["while lo<=hi"]
    E --> F{arr[mid] vs target?}
    F -- Equal   --> G([return mid])
    F -- Less    --> H["lo=mid+1"]
    F -- Greater --> I["hi=mid-1"]
    H --> E
    I --> E
    D --> J["while lo<hi"]
    J --> K{canAchieve?}
    K -- Yes --> L["hi=mid (try smaller)"]
    K -- No  --> M["lo=mid+1"]
    L --> J
    M --> J
    style A ${G}
    style G ${G}
    style F ${B}
    style K ${P}`,

    "sorting": `flowchart TD
    A([Sort]) --> B{Constraint?}
    B -- Stable, always  --> C["Merge Sort O(n logn)
divide+sort+merge"]
    B -- Fast in practice --> D["Quick Sort O(n logn) avg
partition around pivot"]
    B -- Small range int  --> E["Counting Sort O(n+k)
no comparisons"]
    B -- Built-in         --> F["Arrays.sort()
list.sort(comparator)"]
    C --> G([Sorted])
    D --> G
    E --> H([O(n+k)])
    F --> G
    style A ${G}
    style G ${G}
    style H ${G}
    style B ${B}`,

    "two pointer": `flowchart TD
    A([Two pointer]) --> B{Direction?}
    B -- Converging --> C["l=0 r=n-1
sum=arr[l]+arr[r]"]
    B -- Same dir   --> D{Pattern?}
    C --> E{sum vs target?}
    E -- Equal --> F([Found!])
    E -- Low   --> G["l++"]
    E -- High  --> H["r--"]
    G --> C
    H --> C
    D -- Dedup    --> I["w=1: write when arr[r]!=arr[r-1]"]
    D -- Cycle    --> J["slow/fast Floyd"]
    D -- Partition --> K["Dutch flag"]
    I --> L([O(n) O(1)])
    J --> L
    K --> L
    style A ${G}
    style F ${G}
    style L ${G}
    style B ${B}
    style E ${P}`,

    "sliding window": `flowchart TD
    A([Sliding window]) --> B{Fixed or variable?}
    B -- Fixed k --> C["Init sum of k
Slide: +arr[i]-arr[i-k]"]
    B -- Variable --> D["Expand right always
Shrink left when invalid"]
    C --> E["for i=k to n
update sum and max"]
    D --> F{Window valid?}
    F -- Yes --> G["Update result, r++"]
    F -- No  --> H["l++ until valid"]
    G --> I{r<n?}
    I -- Yes --> D
    I -- No  --> J([return result])
    H --> F
    E --> J
    style A ${G}
    style J ${G}
    style B ${B}
    style F ${P}`,

    "recursion": `flowchart TD
    A([Recursive fn]) --> B["Define BASE CASE"]
    B --> C["Define RECURSIVE CASE"]
    C --> D{Overlapping subproblems?}
    D -- Yes --> E["Add memoization
memo[] or HashMap"]
    D -- No  --> F{Backtracking?}
    E --> G["Check memo first
Store result before return"]
    F -- Yes --> H["CHOOSE > EXPLORE > UNCHOOSE
curr.add(x); recurse(); curr.remove()"]
    F -- No  --> I["Divide and conquer"]
    G --> J([O(n) not O(2^n)])
    H --> K([All solutions found])
    I --> L([Recursive result])
    style A ${G}
    style J ${G}
    style K ${G}
    style L ${G}
    style D ${B}
    style F ${P}`,

    "prefix sum": `flowchart TD
    A([Range queries]) --> B["prefix[0]=0
prefix[i+1]=prefix[i]+arr[i]"]
    B --> C["Build O(n) once"]
    C --> D{Query type?}
    D -- Range sum   --> E["sum(l,r)=prefix[r+1]-prefix[l]  O(1)"]
    D -- Subarray=k  --> F["HashMap of prefix sums
count+=map.get(sum-k)"]
    D -- 2D rect     --> G["psum[i][j]=mat+psum above+left-corner
rect=inclusion-exclusion  O(1)"]
    E --> H([O(1) per query])
    F --> I([O(n) total])
    G --> J([O(1) per rect])
    style A ${G}
    style H ${G}
    style I ${G}
    style J ${G}
    style D ${B}`,

    "hashing": `flowchart TD
    A([HashMap/HashSet]) --> B{Operation?}
    B -- Count    --> C["map.merge(k,1,Integer::sum)"]
    B -- Two sum  --> D["store value->index
check complement before insert"]
    B -- Group    --> E["computeIfAbsent(k,
k->new ArrayList<>()).add(v)"]
    B -- Dedup    --> F["set.add(x) false if dup"]
    B -- LRU      --> G["LinkedHashMap accessOrder=true
removeEldestEntry override"]
    C --> H([O(n)])
    D --> H
    E --> H
    F --> H
    G --> H
    style A ${G}
    style H ${G}
    style B ${B}
    style G ${K}`,

    "trees": `flowchart TD
    A([Tree problem]) --> B{Traversal?}
    B -- Inorder   --> C["L->Root->R = BST sorted"]
    B -- Preorder  --> D["Root->L->R = serialize"]
    B -- Postorder --> E["L->R->Root = delete"]
    B -- Level BFS --> F["Queue: capture size each level"]
    C --> G{Return value?}
    G -- Yes --> H["int h(node){ return 1+max(l,r) }"]
    G -- No  --> I([Done])
    D --> I
    E --> I
    F --> I
    H --> I
    style A ${G}
    style I ${G}
    style B ${B}
    style G ${Y}`,

    "binary search tree": `flowchart TD
    A([BST op]) --> B{Which?}
    B -- Insert   --> C["val<root: go left
val>root: go right
null: insert here"]
    B -- Search   --> D["Same navigation
return node.isEnd"]
    B -- Delete   --> E{Children?}
    E -- 0  --> F["return null"]
    E -- 1  --> G["return child"]
    E -- 2  --> H["Find inorder successor
copy val, delete successor"]
    B -- Validate --> I["isValid(node, min, max)
pass bounds down"]
    B -- Kth      --> J["Inorder: count++ til k"]
    C --> K([O(logn) balanced])
    D --> K
    F --> K
    G --> K
    H --> K
    I --> K
    J --> K
    style A ${G}
    style K ${G}
    style B ${B}
    style E ${P}`,

    "heaps": `flowchart TD
    A([Heap problem]) --> B{Find what?}
    B -- Kth largest  --> C["Min-heap size k
evict min when size>k
peek=kth largest"]
    B -- Kth smallest --> D["Max-heap size k
peek=kth smallest"]
    B -- Median       --> E["Two heaps: low=maxHeap high=minHeap
balance sizes always"]
    B -- Merge k      --> F["Min-heap of k heads
always pop min, add next from same list"]
    B -- Top-k freq   --> G["Freq map then
min-heap of size k"]
    C --> H([O(n logk)])
    D --> H
    E --> I(["O(logn) add
O(1) median"])
    F --> H
    G --> H
    style A ${G}
    style H ${G}
    style I ${G}
    style B ${B}`,

    "graphs": `flowchart TD
    A([Graph]) --> B{Shortest path?}
    B -- Unweighted --> C["BFS  O(V+E)"]
    B -- Weighted   --> D["Dijkstra MinHeap  O((V+E)logV)"]
    B -- Negative   --> E["Bellman-Ford  O(VE)"]
    B -- Explore    --> F{DFS or BFS?}
    F -- Components --> G["DFS flood fill
count calls"]
    F -- Cycle      --> H["DFS 3-color
0=unvisited 1=inpath 2=done
back edge=cycle"]
    F -- Islands    --> I["DFS mark as 0
count DFS calls"]
    C --> J([Solved])
    D --> J
    E --> J
    G --> J
    H --> J
    I --> J
    style A ${G}
    style J ${G}
    style B ${B}
    style F ${P}
    style H ${R}`,

    "dynamic programming": `flowchart TD
    A([DP problem]) --> B{Approach?}
    B -- Top-down  --> C["Memoize: check cache first
memo[n]=-1 means uncomputed"]
    B -- Bottom-up --> D{1D or 2D state?}
    C --> E["if memo[n]!=-1: return memo[n]
return memo[n]=solve(subprob)"]
    D -- 1D --> F["dp[i] from dp[i-1], dp[i-2]
often optimize to 2 vars"]
    D -- 2D --> G["dp[i][j] from dp[i-1][j]
dp[i][j-1], dp[i-1][j-1]"]
    F --> H{Space optimize?}
    H -- Yes --> I["prev2,prev1=prev1,curr"]
    H -- No  --> J["Full dp[] array"]
    E --> K([O(n) not O(2^n)])
    I --> K
    J --> K
    G --> K
    style A ${G}
    style K ${G}
    style B ${B}
    style D ${P}
    style H ${Y}`,

    "greedy": `flowchart TD
    A([Greedy]) --> B["Sort by optimal criterion"]
    B --> C{What criterion?}
    C -- Intervals --> D["Sort by END time
pick if start>=lastEnd"]
    C -- Jump game --> E["Track maxReach
if i>maxReach: false"]
    C -- Meetings  --> F["Sort by start
Min-heap of end times"]
    C -- Ratio     --> G["Sort value/weight desc
take fraction if needed"]
    D --> H([O(n logn)])
    E --> H
    F --> H
    G --> H
    style A ${G}
    style H ${G}
    style C ${B}`,

    "backtracking": `flowchart TD
    A([Backtracking]) --> B["for each choice"]
    B --> C{Valid?}
    C -- No  --> D["Prune - skip"]
    C -- Yes --> E["CHOOSE: add to path"]
    E --> F["EXPLORE: recurse"]
    F --> G{Base case?}
    G -- Yes --> H["ADD to results"]
    G -- No  --> B
    H --> I["UNCHOOSE: remove from path"]
    D --> I
    I --> J{More choices?}
    J -- Yes --> B
    J -- No  --> K([All solutions])
    style A ${G}
    style K ${G}
    style H ${G}
    style C ${B}
    style G ${P}
    style D ${R}
    style I ${Y}`,

    "union find": `flowchart TD
    A([Union-Find]) --> B["Init: parent[i]=i, rank[i]=0"]
    B --> C["find(x):
if parent[x]!=x:
parent[x]=find(parent[x])
return parent[x]"]
    C --> D["PATH COMPRESSION"]
    D --> E["union(x,y): px=find(x), py=find(y)"]
    E --> F{px==py?}
    F -- Yes --> G(["Already connected"])
    F -- No  --> H{rank compare?}
    H --> I["Attach lower rank
under higher rank"]
    I --> J["UNION BY RANK"]
    J --> K([O(alpha n) ~ O(1)])
    style A ${G}
    style K ${G}
    style G ${T}
    style F ${B}
    style D ${T}
    style J ${P}`,

    "topological sort": `flowchart TD
    A([Topo sort]) --> B{Method?}
    B -- Kahn BFS --> C["Compute in-degree for all nodes"]
    B -- DFS      --> D["DFS post-order
push AFTER all neighbors done"]
    C --> E["Queue all nodes with inDegree==0"]
    E --> F["while queue not empty:
node=poll, order.add(node)
for neighbor: if --inDeg==0: enqueue"]
    F --> G{order.size == V?}
    G -- Yes --> H([Valid order])
    G -- No  --> I([Cycle detected!])
    D --> J["visited[node]=true
for each neighbor: if !visited: dfs
stack.push(node)"]
    J --> K["Pop stack = topo order"]
    K --> H
    style A ${G}
    style H ${G}
    style I ${R}
    style G ${B}`,

    "trie": `flowchart TD
    A([Trie op]) --> B{Operation?}
    B -- Insert --> C["node=root
for char c: idx=c-a
if null: new TrieNode
node=children[idx]
node.isEnd=true"]
    B -- Search --> D["node=root
for char c: if null return false
node=children[c-a]
return node.isEnd"]
    B -- Prefix --> E["Same as search
but return true at end
(no isEnd check)"]
    C --> F([O(m) m=word len])
    D --> F
    E --> F
    style A ${G}
    style F ${G}
    style B ${B}`,

    "shortest path": `flowchart TD
    A([Shortest path]) --> B{Graph type?}
    B -- Unweighted  --> C["BFS  O(V+E)"]
    B -- Non-negative --> D["Dijkstra MinHeap  O((V+E)logV)"]
    B -- Negative    --> E["Bellman-Ford  O(VE)"]
    B -- All pairs   --> F["Floyd-Warshall  O(V^3)"]
    D --> G{Negative weights?}
    G -- Yes --> H([Use Bellman-Ford])
    G -- No  --> I([Shortest found])
    C --> I
    E --> I
    F --> I
    style A ${G}
    style I ${G}
    style H ${R}
    style B ${B}
    style G ${R}`,

    "monotonic stack": `flowchart TD
    A([Monotonic stack]) --> B{Increasing or decreasing?}
    B -- Decreasing --> C["Next Greater Element
Pop when curr > top
result[popped]=curr"]
    B -- Increasing --> D["Largest Rectangle
Pop when curr < top
width=i-peek()-1, area=h*w"]
    C --> E{Circular?}
    E -- Yes --> F["Iterate 2n, use i%n"]
    E -- No  --> G([O(n)])
    D --> G
    F --> G
    style A ${G}
    style G ${G}
    style B ${B}
    style C ${P}
    style D ${Y}`,

    "default": `flowchart TD
    A([Problem]) --> B["Identify: input/output/constraints"]
    B --> C{Pattern?}
    C -- Array/String   --> D["Two Pointer or Sliding Window"]
    C -- Fast lookup    --> E["HashMap O(1)"]
    C -- Optimal subproblem --> F["DP or Greedy"]
    C -- Graph/Tree     --> G["BFS or DFS"]
    C -- Sorted data    --> H["Binary Search O(logn)"]
    D --> I["Code solution"]
    E --> I
    F --> I
    G --> I
    H --> I
    I --> J{All tests pass?}
    J -- Yes --> K([Accepted!])
    J -- No  --> L["Debug edge cases"]
    L --> I
    style A ${G}
    style K ${G}
    style C ${B}
    style J ${P}
    style L ${R}`
  };

  // Key aliases for partial title matching
  const ALIASES = [
    [["java basics","setup","hello world"], "java basics"],
    [["variables","data type"],             "variables"],
    [["operator","expression"],             "operators"],
    [["control flow","if","switch"],        "control flow"],
    [["loop","for","while"],               "loops"],
    [["method","function"],                "methods"],
    [["java array"],                       "java arrays"],
    [["java string"],                      "java strings"],
    [["class","object","oop"],             "classes"],
    [["inherit"],                          "inheritance"],
    [["polymorphi"],                       "polymorphism"],
    [["abstract","interface"],             "abstraction"],
    [["encapsul","access modifier"],       "encapsulation"],
    [["solid"],                            "solid"],
    [["exception","error handling"],       "exception handling"],
    [["generic"],                          "generics"],
    [["arraylist","linkedlist","list"],     "arraylist linkedlist"],
    [["hashset","treeset","set"],           "hashset treeset"],
    [["hashmap","treemap","map"],           "hashmap treemap"],
    [["queue","deque","priority"],         "queue deque"],
    [["lambda"],                           "lambda expressions"],
    [["stream"],                           "streams api"],
    [["functional interface"],             "lambda expressions"],
    [["optional"],                         "streams api"],
    [["multithreading","thread"],          "multithreading"],
    [["synchroni","lock","concurrent"],    "multithreading"],
    [["executor","thread pool"],           "executorservice"],
    [["completable","async","future"],     "completablefuture"],
    [["jvm","memory model","gc","garbage"],"jvm memory"],
    [["reflection","annotation"],          "design patterns"],
    [["design pattern","singleton","factory","builder","observer","strategy"],"design patterns"],
    [["arrays"],                           "arrays dsa"],
    [["string"],                           "strings"],
    [["linked list","linkedlist"],         "linked list"],
    [["stack"],                            "stack dsa"],
    [["binary search"],                    "binary search"],
    [["two pointer"],                      "two pointer"],
    [["sliding window"],                   "sliding window"],
    [["recursion","backtrack"],            "recursion"],
    [["sorting","sort algo"],              "sorting"],
    [["prefix sum"],                       "prefix sum"],
    [["hashing","hashmap","hashset"],      "hashing"],
    [["tree","binary tree"],               "trees"],
    [["bst","binary search tree"],         "binary search tree"],
    [["heap","priority queue"],            "heaps"],
    [["graph","bfs","dfs","island"],       "graphs"],
    [["dynamic programming","dp 1d","dp 2d"],"dynamic programming"],
    [["greedy"],                           "greedy"],
    [["backtrack","constraint"],           "backtracking"],
    [["union find","disjoint"],            "union find"],
    [["topological"],                      "topological sort"],
    [["trie","prefix tree"],               "trie"],
    [["shortest path","dijkstra","bellman"],"shortest path"],
    [["monotonic"],                        "monotonic stack"],
  ];

  const LABELS = {
    "binary search":    "O(log n) — halving each step",
    "sorting":          "O(n log n) merge/quick sort",
    "two pointer":      "O(n) — single pass",
    "sliding window":   "O(n) — each element in/out once",
    "prefix sum":       "O(n) build | O(1) query",
    "hashing":          "O(1) avg — hash table",
    "binary search tree":"O(log n) balanced",
    "heaps":            "O(log n) insert | O(1) peek",
    "trie":             "O(m) — m = word length",
    "graphs":           "O(V+E) — BFS/DFS",
    "dynamic programming":"O(n) to O(n²) table",
    "greedy":           "O(n log n) sort + scan",
    "backtracking":     "O(2ⁿ) with pruning",
    "union find":       "O(α n) ≈ O(1) amortized",
    "topological sort": "O(V+E)",
    "shortest path":    "O((V+E) log V) Dijkstra",
    "monotonic stack":  "O(n) — push/pop once each",
  };

  function render(topicTitle) {
    const container = document.getElementById("flowchartContainer");
    if (!container) return;
    const key   = (topicTitle || "").toLowerCase().trim();
    const ckey  = resolve(key);
    const chart = CHARTS[ckey] || CHARTS["default"];
    const id    = "mermaid-" + Date.now();
    container.innerHTML = `
      <div class="flowchart-wrap">
        <div class="flowchart-label">
          <span class="fc-topic-name">${esc(topicTitle || "Algorithm")}</span>
          <span class="fc-algo-tag">${LABELS[ckey] || "Algorithm Flowchart"}</span>
        </div>
        <div id="${id}" class="mermaid-target"></div>
      </div>`;
    if (typeof mermaid === "undefined") {
      document.getElementById(id).innerHTML =
        "<p style='color:var(--text3);padding:20px'>Mermaid.js not loaded.</p>";
      return;
    }
    mermaid.render("svg-" + id, chart.trim()).then(({ svg }) => {
      document.getElementById(id).innerHTML = svg;
    }).catch(err => {
      document.getElementById(id).innerHTML =
        "<p style='color:var(--red);padding:20px'>Render error: " + err.message + "</p>";
    });
  }

  function resolve(key) {
    if (CHARTS[key]) return key;
    for (const [keywords, target] of ALIASES) {
      for (const kw of keywords) {
        if (key.includes(kw) || kw.includes(key.substring(0, 6))) return target;
      }
    }
    return "default";
  }

  function esc(s) {
    return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }

  return { render };
})();