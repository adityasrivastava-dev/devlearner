import json

f = 'C:/Dev/devlearner/devlearner/learning-system/src/main/resources/seeds/B09-pass-by-value.json'
with open(f, encoding='utf-8') as fh:
    data = json.load(fh)

improvements = {
    1: {
        "description": "Predict what the following code prints, then implement `predictOutput()` returning a `String[]` of the two lines:\n\n```java\nstatic void swap(int a, int b) {\n    int t = a; a = b; b = t;\n    System.out.println(a + \" \" + b);\n}\npublic static void main(String[] args) {\n    int x = 5, y = 10;\n    swap(x, y);\n    System.out.println(x + \" \" + y);\n}\n```\n\n**Key insight:** Java passes primitives by value — `a` and `b` inside `swap()` are copies. Swapping them has no effect on `x` and `y` in `main`.",
        "sampleInput": "x = 5, y = 10",
        "sampleOutput": "[\"10 5\", \"5 10\"]"
    },
    2: {
        "description": "Implement `swapInArray(int[] arr, int i, int j)` that swaps elements at indices `i` and `j` **in-place**. Arrays are passed by reference in Java, so mutations inside the method are visible to the caller.\n\n**Example 1:**\nInput: arr = [1,2,3,4,5], i = 0, j = 4\nOutput: [5,2,3,4,1]\n\n**Example 2:**\nInput: arr = [10,20], i = 0, j = 1\nOutput: [20,10]\n\n**Key insight:** Unlike primitives, array mutations inside a method ARE visible outside — the reference is copied, but both point to the same underlying array.",
        "sampleInput": "arr = [1,2,3,4,5], i = 0, j = 4",
        "sampleOutput": "[5,2,3,4,1]"
    },
    3: {
        "description": "Will calling `appendSuffix(str, \" World\")` modify the original `String` variable? Implement the method and demonstrate that `String` is **immutable** — the method must **return** the new string instead.\n\n```java\nString s = \"Hello\";\nappendSuffix(s, \" World\");\nSystem.out.println(s); // What prints?\n```\n\n**Example:**\nInput: str = \"Hello\", suffix = \" World\"\nMethod returns: \"Hello World\"\nOriginal variable after call: \"Hello\" (unchanged)\n\n**Key insight:** Strings are immutable. Even though the reference is passed, you cannot mutate the String object itself.",
        "sampleInput": "str = \"Hello\", suffix = \" World\"",
        "sampleOutput": "\"Hello World\""
    },
    4: {
        "description": "Java can't increment a primitive through a method call. Implement `increment(int[] counter)` that increments `counter[0]` — using a single-element array as a **mutable wrapper** to simulate pass-by-reference.\n\n**Example 1:**\nInput: counter = [0], call increment(counter) three times\nOutput: counter[0] = 3\n\n**Example 2:**\nInput: counter = [10], call increment(counter) once\nOutput: counter[0] = 11\n\n**Key insight:** `int[] counter` — the array object is shared; `counter[0]++` mutates the shared object, which is visible to the caller.",
        "sampleInput": "counter = [0], increment x3",
        "sampleOutput": "counter[0] = 3"
    },
    5: {
        "description": "Predict the output of the aliasing code below, then implement `predictSizes()` returning `int[]` of the two sizes printed:\n\n```java\nList<Integer> a = new ArrayList<>(List.of(1,2,3));\nList<Integer> b = a;        // b aliases a\nb.add(4);\nSystem.out.println(a.size());  // Line 1\n\nList<Integer> c = new ArrayList<>(a); // c is a copy\nc.add(5);\nSystem.out.println(a.size());  // Line 2\n```\n\n**Key insight:** `b = a` — both variables point to the **same** object. `new ArrayList<>(a)` creates an independent copy.",
        "sampleInput": "a = [1,2,3]",
        "sampleOutput": "[4, 4]"
    },
    6: {
        "description": "Implement `reverse(int[] arr)` that reverses the array **in-place** using two pointers. Since arrays are passed by reference in Java, the change is visible to the caller without returning anything.\n\n**Example 1:**\nInput: [1,2,3,4,5]\nOutput: [5,4,3,2,1]\n\n**Example 2:**\nInput: [1,2]\nOutput: [2,1]\n\n**Example 3:**\nInput: [42]\nOutput: [42]\n\n**Key insight:** The method receives a reference to the array — in-place mutations (arr[i] = ...) are visible to the caller.",
        "sampleInput": "[1,2,3,4,5]",
        "sampleOutput": "[5,4,3,2,1]"
    },
    7: {
        "description": "Implement `buildGreeting(String name, String title, int year)` that constructs and **returns** a formatted greeting string. Since String is immutable, the only way to produce a modified string from a method is to return it.\n\n**Example 1:**\nInput: name = \"Alice\", title = \"Dr\", year = 2024\nOutput: \"Welcome, Dr. Alice! Class of 2024.\"\n\n**Example 2:**\nInput: name = \"Bob\", title = \"Mr\", year = 2023\nOutput: \"Welcome, Mr. Bob! Class of 2023.\"\n\n**Key insight:** Use `StringBuilder` internally for efficient concatenation, then return `.toString()`.",
        "sampleInput": "name=\"Alice\", title=\"Dr\", year=2024",
        "sampleOutput": "\"Welcome, Dr. Alice! Class of 2024.\""
    },
    8: {
        "description": "Implement `fillFibonacci(int[] arr)` that fills the given array with Fibonacci numbers starting from F(0)=0, F(1)=1. The array is mutated in-place — no return value needed.\n\n**Example 1:**\nInput: arr = new int[6]\nOutput: arr = [0,1,1,2,3,5]\n\n**Example 2:**\nInput: arr = new int[8]\nOutput: arr = [0,1,1,2,3,5,8,13]\n\n**Key insight:** Passing the array lets the method fill it directly. The caller sees the populated array because both hold a reference to the same object.",
        "sampleInput": "arr = new int[6]",
        "sampleOutput": "[0,1,1,2,3,5]"
    },
    9: {
        "description": "Implement `appendWords(StringBuilder sb, String[] words, String separator)` that appends all words to `sb` separated by `separator`. `StringBuilder` is **mutable** — changes are visible to the caller without returning.\n\n**Example 1:**\nInput: sb = \"\", words = [\"foo\",\"bar\",\"baz\"], separator = \", \"\nOutput: sb = \"foo, bar, baz\"\n\n**Example 2:**\nInput: sb = \"prefix-\", words = [\"a\",\"b\"], separator = \"-\"\nOutput: sb = \"prefix-a-b\"\n\n**Key insight:** Unlike String, StringBuilder is mutable — `sb.append(...)` modifies the shared object in-place.",
        "sampleInput": "sb=\"\", words=[\"foo\",\"bar\",\"baz\"], sep=\", \"",
        "sampleOutput": "sb = \"foo, bar, baz\""
    },
    10: {
        "description": "Implement `shallowCopy(int[][] matrix)` that returns a **new** `int[][]` where the outer array is a new object, but the inner row arrays are **shared** (not copied). Demonstrate the shallow copy trap.\n\n**Example:**\nInput: matrix = [[1,2],[3,4]]\nshallowCopy returns: new int[][] pointing to same rows\n\nAfter: copy[0][0] = 99\nmatrix[0][0] is also 99 (shared row!)\ncopy[0] = new int[]{7,8} does NOT affect matrix[0] (outer array is independent).\n\n**Key insight:** Shallow copy duplicates the outer array but shares references to inner arrays.",
        "sampleInput": "matrix = [[1,2],[3,4]], modify copy[0][0]=99",
        "sampleOutput": "matrix[0][0] = 99 (shared row mutated)"
    },
    11: {
        "description": "Create a mutable `Counter` class with a `value` field. Implement `sumIntoCounter(Counter c, int[] nums)` that adds all elements of `nums` to `c.value`. Since `Counter` is a mutable object, changes persist after the method returns.\n\n**Example 1:**\nInput: c = Counter(0), nums = [1,2,3,4,5]\nOutput: c.value = 15\n\n**Example 2:**\nInput: c = Counter(10), nums = [5,5]\nOutput: c.value = 20\n\n**Key insight:** Object field mutations (`c.value += x`) are visible to the caller because both hold a reference to the same Counter object.",
        "sampleInput": "c = Counter(0), nums = [1,2,3,4,5]",
        "sampleOutput": "c.value = 15"
    },
    12: {
        "description": "Implement `fillMultiplicationTable(int[][] matrix)` that fills `matrix[i][j] = (i+1) * (j+1)` in-place. The 2D array is passed by reference, so the caller sees the filled matrix without a return value.\n\n**Example:**\nInput: matrix = new int[3][3]\nOutput:\n[[1,2,3],\n [2,4,6],\n [3,6,9]]\n\n**Key insight:** The outer array reference is passed by value, but it points to the same 2D array — mutations to elements are visible to the caller.",
        "sampleInput": "new int[3][3]",
        "sampleOutput": "[[1,2,3],[2,4,6],[3,6,9]]"
    },
    13: {
        "description": "Since Java can't swap two primitives via method parameters, implement `swapPair(int a, int b)` that **returns** an `int[]` of `{b, a}` — the caller unpacks the result.\n\n**Example 1:**\nInput: a = 5, b = 10\nOutput: [10, 5]\nUsage: int[] r = swapPair(x, y); x = r[0]; y = r[1];\n\n**Example 2:**\nInput: a = -3, b = 7\nOutput: [7, -3]\n\n**Key insight:** No language trick can swap caller-side primitives. The clean Java solution is to return the swapped values and let the caller reassign.",
        "sampleInput": "a = 5, b = 10",
        "sampleOutput": "[10, 5]"
    },
    14: {
        "description": "Given a `Person` class with a mutable `name` field, implement `shallowCopyList(List<Person> list)` that returns a **new List** containing the **same Person objects** (not clones).\n\nDemonstrate the trap: mutating `copy.get(0).name` also changes `original.get(0).name`.\n\n**Example:**\noriginal = [Person(\"Alice\"), Person(\"Bob\")]\ncopy = shallowCopyList(original)\ncopy.get(0).name = \"Zara\"\n=> original.get(0).name is also \"Zara\"\n\n**Key insight:** Shallow copy duplicates the list structure but shares object references — mutating a contained object is visible through both lists.",
        "sampleInput": "original = [Person(\"Alice\"), Person(\"Bob\")], copy[0].name = \"Zara\"",
        "sampleOutput": "original.get(0).name = \"Zara\""
    },
    15: {
        "description": "Given a binary tree, implement `sumTree(TreeNode root, int[] total)` that accumulates the sum of all node values into `total[0]`. Use a single-element int array as a **mutable accumulator** passed through recursion.\n\n**Example 1:**\nInput: tree = [1,2,3], total = [0]\nOutput: total[0] = 6\n\n**Example 2:**\nInput: tree = [4,2,6,1,3,5,7], total = [0]\nOutput: total[0] = 28\n\n**Key insight:** `int total` can't accumulate across recursive calls without return values. `int[] total` shares state across all stack frames.",
        "sampleInput": "tree = [1,2,3], total = [0]",
        "sampleOutput": "total[0] = 6"
    },
    16: {
        "description": "Implement `rotate(int[] nums, int k)` that rotates the array **right** by `k` steps in-place using the triple-reverse technique. Handle `k > nums.length` by using `k % nums.length`.\n\n**Example 1:**\nInput: nums = [1,2,3,4,5,6,7], k = 3\nOutput: [5,6,7,1,2,3,4]\n\n**Example 2:**\nInput: nums = [1,2,3], k = 4\nOutput: [3,1,2]\nExplanation: k % 3 = 1 effective rotation.\n\n**Key insight:** Triple-reverse: reverse all, reverse first k, reverse last n-k. O(n) time, O(1) space.",
        "sampleInput": "nums = [1,2,3,4,5,6,7], k = 3",
        "sampleOutput": "[5,6,7,1,2,3,4]"
    },
    17: {
        "description": "Find the longest common prefix among an array of strings. Implement using a `String[] result` holder (single-element array) mutated inside a helper method — demonstrating pass-by-reference for object state.\n\n**Example 1:**\nInput: [\"flower\",\"flow\",\"flight\"]\nOutput: \"fl\"\n\n**Example 2:**\nInput: [\"dog\",\"racecar\",\"car\"]\nOutput: \"\"\n\n**Key insight:** `result[0]` is a mutable slot — the helper modifies it in-place, and the change is visible to the caller. Same pattern as using a mutable wrapper class.",
        "sampleInput": "[\"flower\",\"flow\",\"flight\"]",
        "sampleOutput": "\"fl\""
    },
    18: {
        "description": "Implement DFS on an adjacency list graph using a `boolean[] visited` array passed to the recursive helper. The shared `visited` array prevents revisiting nodes across all recursion levels.\n\n**Example:**\nInput: graph = {0:[1,2], 1:[3], 2:[3], 3:[]}, start = 0\nDFS visit order: 0, 1, 3, 2 (or similar depth-first order)\nvisited after DFS: [true, true, true, true]\n\n**Key insight:** `visited` is a reference — all recursive calls share the same array. Marking `visited[node] = true` in one call is visible to all callers up the stack.",
        "sampleInput": "graph = {0:[1,2], 1:[3], 2:[3], 3:[]}, start = 0",
        "sampleOutput": "visited = [true, true, true, true]"
    },
    19: {
        "description": "Given a nested structure where each element is either an `Integer` or a `List<Object>`, flatten it into a `List<Integer>` result. Pass the result list into the recursive helper — it accumulates integers in-place.\n\n**Example 1:**\nInput: [1, [2, [3, 4], 5]]\nOutput: [1, 2, 3, 4, 5]\n\n**Example 2:**\nInput: [[1, 2], [3, [4, 5]]]\nOutput: [1, 2, 3, 4, 5]\n\n**Key insight:** Passing the List to each recursive call shares the same result list — `result.add(x)` from any depth appends to the single output list.",
        "sampleInput": "[1, [2, [3, 4], 5]]",
        "sampleOutput": "[1, 2, 3, 4, 5]"
    },
    20: {
        "description": "Implement a simple `ObjectPool<T>` with `acquire()` (returns a pooled object or null if empty) and `release(T obj)` (returns object to the pool). Use a `List<T>` as backing store.\n\n**Example:**\nPool initialized with [\"conn1\", \"conn2\"]\nacquire() => \"conn1\"\nacquire() => \"conn2\"\nacquire() => null (pool empty)\nrelease(\"conn1\")\nacquire() => \"conn1\"\n\n**Key insight:** The pool list is a shared mutable object. `acquire()` removes from it; `release()` adds back. All callers share the same pool state via reference semantics.",
        "sampleInput": "pool=[\"conn1\",\"conn2\"], acquire, acquire, acquire",
        "sampleOutput": "[\"conn1\", \"conn2\", null]"
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
print(f"B09 updated: {updated} problems improved")
