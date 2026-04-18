import json

f = 'C:/Dev/devlearner/devlearner/learning-system/src/main/resources/seeds/B08-methods.json'
with open(f, encoding='utf-8') as fh:
    data = json.load(fh)

improvements = {
    1: {
        "description": "Implement `factorial(n)` **both recursively and iteratively**. Return the factorial result. Handle n=0 (returns 1 by definition).\n\n**Example 1:**\nInput: n = 5\nOutput: 120\nExplanation: 5! = 5 * 4 * 3 * 2 * 1 = 120.\n\n**Example 2:**\nInput: n = 0\nOutput: 1\nExplanation: 0! = 1 by convention.\n\n**Example 3:**\nInput: n = 10\nOutput: 3628800",
        "sampleInput": "5",
        "sampleOutput": "120"
    },
    2: {
        "description": "Implement `pow(x, n)` — raise `x` to the power `n`. Handle negative exponents. Must run in **O(log n)** using fast exponentiation (repeated squaring).\n\n**Example 1:**\nInput: x = 2.0, n = 10\nOutput: 1024.0\n\n**Example 2:**\nInput: x = 2.0, n = -2\nOutput: 0.25\nExplanation: 2^(-2) = 1 / (2^2) = 0.25.\n\n**Example 3:**\nInput: x = 2.1, n = 3\nOutput: 9.261",
        "sampleInput": "x = 2.0, n = 10",
        "sampleOutput": "1024.0"
    },
    3: {
        "description": "Implement `gcd(a, b)` using **Euclid's algorithm** (recursive), and `lcm(a, b) = a * b / gcd(a, b)`.\n\n**Example 1:**\nInput: a = 48, b = 18\nOutput: gcd = 6, lcm = 144\nExplanation: gcd(48,18) = gcd(18,12) = gcd(12,6) = gcd(6,0) = 6.\n\n**Example 2:**\nInput: a = 4, b = 6\nOutput: gcd = 2, lcm = 12\n\n**Example 3:**\nInput: a = 7, b = 5\nOutput: gcd = 1, lcm = 35",
        "sampleInput": "a = 48, b = 18",
        "sampleOutput": "gcd = 6, lcm = 144"
    },
    4: {
        "description": "Recursively compute the **sum of digits** of a non-negative integer `n` without converting to a string. Use the modulo and division operators only.\n\n**Example 1:**\nInput: n = 493\nOutput: 16\nExplanation: 4 + 9 + 3 = 16.\n\n**Example 2:**\nInput: n = 0\nOutput: 0\n\n**Example 3:**\nInput: n = 9999\nOutput: 36\nExplanation: 9 + 9 + 9 + 9 = 36.",
        "sampleInput": "493",
        "sampleOutput": "16"
    },
    5: {
        "description": "Create a `Calculator` class with **overloaded** `add()` methods: `add(int, int)`, `add(double, double)`, and `add(String, String)` (concatenation). Demonstrate method overloading — same method name, different parameter types.\n\n**Example 1:**\nadd(2, 3) => 5\n\n**Example 2:**\nadd(2.5, 3.5) => 6.0\n\n**Example 3:**\nadd(\"Hello, \", \"World!\") => \"Hello, World!\"",
        "sampleInput": "add(2, 3)",
        "sampleOutput": "5"
    },
    6: {
        "description": "Write a method `sum(int... nums)` using **varargs** that accepts any number of integers and returns their sum. Also write `max(int first, int... rest)` that returns the maximum across all arguments.\n\n**Example 1:**\nsum(1, 2, 3, 4, 5) => 15\n\n**Example 2:**\nsum() => 0\nExplanation: Zero arguments; sum of empty list is 0.\n\n**Example 3:**\nmax(3, 1, 4, 1, 5, 9, 2, 6) => 9",
        "sampleInput": "sum(1, 2, 3, 4, 5)",
        "sampleOutput": "15"
    },
    7: {
        "description": "Implement **recursive binary search** on a sorted array. Return the index of `target`, or `-1` if not found. Pass `low` and `high` as parameters on each recursive call.\n\n**Example 1:**\nInput: nums = [-1,0,3,5,9,12], target = 9\nOutput: 4\nExplanation: 9 is at index 4.\n\n**Example 2:**\nInput: nums = [-1,0,3,5,9,12], target = 2\nOutput: -1\nExplanation: 2 is not in the array.",
        "sampleInput": "nums = [-1,0,3,5,9,12], target = 9",
        "sampleOutput": "4"
    },
    8: {
        "description": "Implement **merge sort** on an integer array using recursive divide-and-conquer. Split the array in half, recursively sort each half, then merge them. O(n log n) time, O(n) space.\n\n**Example 1:**\nInput: [38,27,43,3,9,82,10]\nOutput: [3,9,10,27,38,43,82]\n\n**Example 2:**\nInput: [5,1,4,2,8]\nOutput: [1,2,4,5,8]\n\n**Example 3:**\nInput: [1]\nOutput: [1]",
        "sampleInput": "[38,27,43,3,9,82,10]",
        "sampleOutput": "[3,9,10,27,38,43,82]"
    },
    9: {
        "description": "Given a 2D image (int matrix), starting pixel `(sr, sc)`, and a `newColor`, perform a **flood fill**: change the starting pixel's color and all connected pixels of the same original color to `newColor`. Connectivity is 4-directional.\n\n**Example 1:**\nInput: image = [[1,1,1],[1,1,0],[1,0,1]], sr=1, sc=1, newColor=2\nOutput: [[2,2,2],[2,2,0],[2,0,1]]\n\n**Example 2:**\nInput: image = [[0,0,0],[0,0,0]], sr=0, sc=0, newColor=2\nOutput: [[2,2,2],[2,2,2]]",
        "sampleInput": "image=[[1,1,1],[1,1,0],[1,0,1]], sr=1, sc=1, newColor=2",
        "sampleOutput": "[[2,2,2],[2,2,0],[2,0,1]]"
    },
    10: {
        "description": "Given an integer array `nums` with unique elements, return **all possible subsets** (the power set). The solution set must not contain duplicate subsets. Return subsets in any order.\n\n**Example 1:**\nInput: [1,2,3]\nOutput: [[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]\n\n**Example 2:**\nInput: [0]\nOutput: [[],[0]]\nExplanation: Two subsets: empty set and {0}.",
        "sampleInput": "[1,2,3]",
        "sampleOutput": "[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]"
    },
    11: {
        "description": "You can climb 1 or 2 steps at a time. Return the number of **distinct ways** to climb `n` stairs. Use **memoization** (top-down DP) to avoid redundant recomputation.\n\n**Example 1:**\nInput: n = 2\nOutput: 2\nExplanation: (1+1) or (2) — two distinct ways.\n\n**Example 2:**\nInput: n = 3\nOutput: 3\nExplanation: (1+1+1), (1+2), (2+1) — three ways.\n\n**Example 3:**\nInput: n = 5\nOutput: 8",
        "sampleInput": "5",
        "sampleOutput": "8"
    },
    12: {
        "description": "Given an array of **distinct** integers, return all possible **permutations**. Use backtracking: at each step pick an unused element, place it, recurse, then backtrack.\n\n**Example 1:**\nInput: [1,2,3]\nOutput: [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]\n\n**Example 2:**\nInput: [0,1]\nOutput: [[0,1],[1,0]]\n\n**Example 3:**\nInput: [1]\nOutput: [[1]]",
        "sampleInput": "[1,2,3]",
        "sampleOutput": "[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]"
    },
    13: {
        "description": "Given an array of coin denominations and a target `amount`, find the **minimum number of coins** needed to make up that amount using **memoization**. Return -1 if the amount cannot be made.\n\n**Example 1:**\nInput: coins = [1,5,11], amount = 15\nOutput: 3\nExplanation: 5 + 5 + 5 = 15 (three coins).\n\n**Example 2:**\nInput: coins = [2], amount = 3\nOutput: -1\nExplanation: Cannot make 3 with only 2-denomination coins.",
        "sampleInput": "coins = [1,5,11], amount = 15",
        "sampleOutput": "3"
    },
    14: {
        "description": "Implement `isEven(n)` and `isOdd(n)` using **mutual recursion**: `isEven` calls `isOdd` and vice versa, without using the `%` operator. Base cases: isEven(0)=true, isOdd(0)=false.\n\n**Example 1:**\nInput: isEven(4)\nOutput: true\nExplanation: isEven(4) -> isOdd(3) -> isEven(2) -> isOdd(1) -> isEven(0) = true.\n\n**Example 2:**\nInput: isOdd(3)\nOutput: true\n\n**Example 3:**\nInput: isEven(7)\nOutput: false",
        "sampleInput": "isEven(4)",
        "sampleOutput": "true"
    },
    15: {
        "description": "Given a binary tree, find its **maximum depth** — the number of nodes along the longest root-to-leaf path. Use recursive DFS.\n\n**Example 1:**\nInput: [3,9,20,null,null,15,7]\nOutput: 3\nExplanation: The longest path is 3->20->15 or 3->20->7 (depth 3).\n\n**Example 2:**\nInput: [1,null,2]\nOutput: 2\n\n**Example 3:**\nInput: []\nOutput: 0",
        "sampleInput": "[3,9,20,null,null,15,7]",
        "sampleOutput": "3"
    },
    16: {
        "description": "A string of digits can be decoded: '1'->A, '2'->B, ..., '26'->Z. Count the number of ways to decode it using **memoization**. '0' has no valid single-digit mapping.\n\n**Example 1:**\nInput: \"12\"\nOutput: 2\nExplanation: \"AB\" (1,2) or \"L\" (12) — two ways.\n\n**Example 2:**\nInput: \"226\"\nOutput: 3\nExplanation: \"BZ\" (2,26), \"VF\" (22,6), \"BBF\" (2,2,6).\n\n**Example 3:**\nInput: \"06\"\nOutput: 0\nExplanation: '0' cannot be decoded.",
        "sampleInput": "\"226\"",
        "sampleOutput": "3"
    },
    17: {
        "description": "Given a 2D maze where `0` = open and `1` = wall, find if there is a path from top-left `(0,0)` to bottom-right `(m-1,n-1)` using **recursive DFS**. Move in 4 directions; mark visited cells to avoid cycles.\n\n**Example 1:**\nInput: [[0,0,0],[1,1,0],[1,1,0]]\nOutput: true\nExplanation: Path: (0,0)->(0,1)->(0,2)->(1,2)->(2,2).\n\n**Example 2:**\nInput: [[0,1],[1,0]]\nOutput: false\nExplanation: Both paths are blocked by walls.",
        "sampleInput": "[[0,0,0],[1,1,0],[1,1,0]]",
        "sampleOutput": "true"
    },
    18: {
        "description": "Given a 2D grid of `'1'` (land) and `'0'` (water), count the number of **islands**. An island is a group of adjacent land cells connected horizontally or vertically. Use DFS to sink each island after counting it.\n\n**Example 1:**\nInput: [[\"1\",\"1\",\"0\"],[\"0\",\"1\",\"0\"],[\"0\",\"0\",\"1\"]]\nOutput: 2\n\n**Example 2:**\nInput: [[\"1\",\"1\",\"1\"],[\"0\",\"1\",\"0\"],[\"1\",\"1\",\"1\"]]\nOutput: 1\nExplanation: All land cells are connected.",
        "sampleInput": "[[\"1\",\"1\",\"0\"],[\"0\",\"1\",\"0\"],[\"0\",\"0\",\"1\"]]",
        "sampleOutput": "2"
    },
    19: {
        "description": "Write a method `compose(Function<Integer,Integer> f, Function<Integer,Integer> g)` that returns a new function equivalent to `f(g(x))`. Demonstrate higher-order functions and Java's `Function` interface.\n\n**Example 1:**\nf = x -> x * 2, g = x -> x + 3\ncompose(f, g).apply(5) => 16\nExplanation: g(5)=8, f(8)=16.\n\n**Example 2:**\nf = x -> x * x, g = x -> x + 1\ncompose(f, g).apply(4) => 25\nExplanation: g(4)=5, f(5)=25.",
        "sampleInput": "f = x->x*2, g = x->x+3, x = 5",
        "sampleOutput": "16"
    },
    20: {
        "description": "Parse and evaluate a **boolean expression** string: `'t'`=true, `'f'`=false, `'!(expr)'`=NOT, `'&(e1,e2,...)'`=AND, `'|(e1,e2,...)'`=OR. Expressions can be arbitrarily nested.\n\n**Example 1:**\nInput: \"!(f)\"\nOutput: true\nExplanation: NOT false = true.\n\n**Example 2:**\nInput: \"&(t,f)\"\nOutput: false\nExplanation: AND(true,false) = false.\n\n**Example 3:**\nInput: \"|(f,&(t,t))\"\nOutput: true\nExplanation: OR(false, AND(true,true)) = OR(false,true) = true.",
        "sampleInput": "\"|(f,&(t,t))\"",
        "sampleOutput": "true"
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
print(f"B08 updated: {updated} problems improved")
