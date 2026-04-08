# Seed Files — DevLearn Content Library

Seed files are JSON batch imports for the devlearner platform.
Import them via **Admin → Import JSON → Predefined Files** or the `POST /api/admin/seed-files/{filename}` API.

---

## Naming Convention

```
{PREFIX}{NN}-{slug}.json
```

| Prefix | Track | DB Category | Notes |
|--------|-------|-------------|-------|
| `B`    | Basic Java (Core) | `JAVA` | Fundamentals: JVM through Design Patterns |
| `J`    | Advanced Java | `ADVANCED_JAVA` | Concurrency, Reflection, NIO, etc. |
| `D`    | Data Structures & Algorithms | `DSA` | Arrays through DP |
| `S`    | Spring Boot | `SPRING_BOOT` / `SPRING_MVC` / `SPRING_SECURITY` | Framework topics |
| `M`    | MySQL / SQL | `MYSQL` | SQL queries, not Java code |
| `A`    | AWS | `AWS` | Conceptual — no code execution |

The **filename prefix is for organization only**. The `"category"` field inside the JSON drives the UI filter tab.

---

## File Structure

```json
{
  "batchName": "B01-jvm-architecture",
  "skipExisting": true,
  "topics": [
    {
      "title": "JVM / JRE / JDK Architecture",
      "category": "JAVA",
      "description": "...",
      "order": 1,
      "story": "...",
      "analogy": "...",
      "memoryAnchor": "...",
      "firstPrinciples": "...",
      "bruteForce": "...",
      "optimizedApproach": "...",
      "whenToUse": "...",
      "examples": [ { ...see below... } ],
      "problems": [ { ...see below... } ]
    }
  ]
}
```

### Example object
```json
{
  "displayOrder": 1,
  "title": "...",
  "code": "...",
  "tracerSteps": "[{ line, lineCode, variables, phase, annotation }]",
  "flowchartMermaid": "graph TD ...",
  "pseudocode": "...",
  "explanation": "...",
  "realWorldUse": "..."
}
```
> For **MYSQL**: use `code` for the SQL query.
> For **AWS**: omit `code`; use `explanation` only.

### Problem object (JAVA / DSA / SPRING)
```json
{
  "displayOrder": 1,
  "title": "...",
  "difficulty": "EASY | MEDIUM | HARD",
  "description": "...",
  "pattern": "...",
  "constraints": "...",
  "hint1": "...", "hint2": "...", "hint3": "...",
  "starterCode": "...",
  "solutionCode": "...",
  "testCases": [ { "input": "...", "output": "..." } ]
}
```

### Problem object (MYSQL)
```json
{
  "displayOrder": 1,
  "title": "...",
  "difficulty": "EASY | MEDIUM | HARD",
  "description": "...",
  "hint1": "...", "hint2": "...", "hint3": "...",
  "starterCode": "-- Your SQL here",
  "solutionCode": "SELECT ...",
  "editorial": "..."
}
```

### Problem object (AWS)
```json
{
  "displayOrder": 1,
  "title": "...",
  "difficulty": "EASY | MEDIUM | HARD",
  "description": "Scenario: ...",
  "hint1": "...", "hint2": "...",
  "answer": "...",
  "editorial": "..."
}
```

---

## Full Roadmap

### Basic Java — B series (target: 22 files)
| File | Topic | Status |
|------|-------|--------|
| B01-jvm-architecture | JVM / JRE / JDK Architecture | ✅ |
| B02-compilation-flow | Java Compilation & Bytecode | ✅ |
| B03-data-types | Primitive Data Types & Type Casting | ✅ |
| B04-java-operators | Operators & Expressions | ✅ |
| B05-control-flow | Control Flow (if/switch/loops) | ✅ |
| B06-arrays | Arrays (1D, 2D, varargs) | ✅ |
| B07-strings | Strings & String Pool | ✅ |
| B08-methods | Methods, Overloading & Recursion | ✅ |
| B09-pass-by-value | Pass-by-Value vs Pass-by-Reference | ✅ |
| B10-memory-management | Memory Management & GC | ✅ |
| B11-class-and-object | Classes & Objects | ✅ |
| B12-inheritance | Inheritance | ✅ |
| B13-polymorphism | Polymorphism | ✅ |
| B14-abstraction | Abstraction (Abstract / Interface) | ✅ |
| B15-encapsulation | Encapsulation & Access Modifiers | ✅ |
| B16-generics | Generics | ✅ |
| B17-collections | Collections Framework | ✅ |
| B18-exception-handling | Exception Handling | ✅ |
| B19-streams-api | Streams API & Lambdas | ⏳ |
| B20-io-nio | I/O & NIO | ⏳ |
| B21-concurrency | Concurrency & Threads | ⏳ |
| B22-design-patterns | Design Patterns (GoF) | ⏳ |

### Advanced Java — J series (target: 8 files)
| File | Topic | Status |
|------|-------|--------|
| J01-reflection | Reflection API | ⏳ |
| J02-annotations | Custom Annotations & APT | ⏳ |
| J03-concurrency-advanced | CompletableFuture, Fork/Join | ⏳ |
| J04-nio2 | NIO.2, Paths, WatchService | ⏳ |
| J05-jvm-tuning | GC Tuning & JVM Flags | ⏳ |
| J06-bytecode | Bytecode Manipulation (ASM) | ⏳ |
| J07-modules | Java Modules (JPMS) | ⏳ |
| J08-records-sealed | Records, Sealed Classes, Pattern Matching | ⏳ |

  ---
DSA Series (D01–D09)

┌──────┬────────────────┬───────────────────────────────────────────────┬─────────────────────────────────────────────────────────────────┐
│ File │     Topic      │                   Examples                    │                            Problems                             │
├──────┼────────────────┼───────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────┤
│      │                │ Singly/doubly/circular,                       │ Reverse list, detect cycle, merge sorted lists, find middle,    │
│ D01  │ Linked List    │ insert/delete/reverse, runner technique,      │ remove nth from end, palindrome check, flatten multilevel, LRU  │
│      │                │ sentinel nodes                                │ cache, copy with random pointer, add two numbers                │
├──────┼────────────────┼───────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────┤
│      │                │                                               │ Valid brackets, min stack, daily temperatures, next greater     │
│ D02  │ Stack & Queue  │ Stack via array/linked list, queue via        │ element, sliding window max, evaluate RPN, largest rectangle    │
│      │                │ circular array, monotonic stack, deque        │ histogram, task scheduler, circular queue, implement stack with │
│      │                │                                               │  queues                                                         │
├──────┼────────────────┼───────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────┤
│      │                │ BST insert/search/delete, DFS/BFS traversal,  │ Inorder/preorder/postorder, level order, max depth, path sum,   │
│ D03  │ Trees          │ height/diameter, LCA                          │ validate BST, serialize/deserialize, lowest common ancestor,    │
│      │                │                                               │ zigzag traversal, count nodes, binary tree cameras              │
├──────┼────────────────┼───────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────┤
│      │ Heaps &        │ Min/max heap, heapify, top-K pattern,         │ Kth largest, top K frequent, merge K lists, median from stream, │
│ D04  │ Priority       │ two-heap technique, merge K sorted            │  task scheduler, find K closest points, ugly number, employee   │
│      │ Queues         │                                               │ free time, reorganize string, IPO problem                       │
├──────┼────────────────┼───────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────┤
│      │                │ Adjacency list/matrix, DFS/BFS, topological   │ Number of islands, clone graph, course schedule, network delay  │
│ D05  │ Graphs         │ sort, union-find, Dijkstra, Bellman-Ford      │ time, word ladder, minimum spanning tree, critical connections, │
│      │                │                                               │  alien dictionary, cheapest flights, swim in rising water       │
├──────┼────────────────┼───────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────┤
│      │ Sorting        │ Bubble/selection/insertion, merge sort, quick │ Sort colors, sort by frequency, merge intervals, largest        │
│ D06  │ Algorithms     │  sort, counting sort, radix sort, comparison  │ number, wiggle sort, pancake sort, sort list linked, kth        │
│      │                │                                               │ smallest in matrix, maximum gap, count inversions               │
├──────┼────────────────┼───────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────┤
│      │                │                                               │ Fibonacci, climbing stairs, coin change, longest common         │
│ D07  │ Dynamic        │ Memoization vs tabulation, 1D/2D DP,          │ subsequence, longest increasing subsequence, edit distance, 0/1 │
│      │ Programming    │ knapsack, LCS, LIS patterns                   │  knapsack, partition equal subset, word break, unique paths,    │
│      │                │                                               │ decode ways, burst balloons                                     │
├──────┼────────────────┼───────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────┤
│      │ Recursion &    │ Recursion tree, pruning,                      │ N-Queens, Sudoku solver, letter combinations, subsets,          │
│ D08  │ Backtracking   │ permutations/combinations/subsets, constraint │ permutations, combination sum, word search, palindrome          │
│      │                │  propagation                                  │ partitioning, generate parentheses, knight's tour               │
├──────┼────────────────┼───────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────┤
│      │ Trie &         │ Trie insert/search/startsWith, segment tree   │ Implement trie, word search II, replace words, autocomplete     │
│ D09  │ Advanced Trees │ range query, Fenwick tree prefix sum          │ system, range sum query, range min query, count of range sum,   │
│      │                │                                               │ longest word, map sum pairs, index pairs                        │
└──────┴────────────────┴───────────────────────────────────────────────┴─────────────────────────────────────────────────────────────────┘

  ---
MySQL Series (M01–M03)

┌──────┬──────────────┬─────────────────────────────────────────────┬─────────────────────────────────────────────────────────────────────┐
│ File │    Topic     │                  Examples                   │                              Problems                               │
├──────┼──────────────┼─────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────┤
│      │              │ SELECT/WHERE/ORDER BY/GROUP BY/HAVING,      │ Find duplicates, top N per group, filter by date range, count by    │
│ M01  │ SQL Basics   │ aggregate functions, aliases, DISTINCT      │ category, running total, conditional aggregation, null handling,    │
│      │              │                                             │ pagination with LIMIT OFFSET                                        │
├──────┼──────────────┼─────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────┤
│      │ Joins &      │ INNER/LEFT/RIGHT/FULL JOIN, self join,      │ Customers with no orders, second highest salary, department top     │
│ M02  │ Subqueries   │ correlated subquery, EXISTS/IN, CTEs        │ earner, find managers, tree hierarchy, consecutive seats, rising    │
│      │              │                                             │ temperature, game play analysis                                     │
├──────┼──────────────┼─────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────┤
│      │              │ Window functions (ROW_NUMBER, RANK,         │ Rank scores, median salary, monthly active users, retention         │
│ M03  │ Advanced SQL │ LAG/LEAD), indexes, stored procedures,      │ analysis, consecutive available seats, first login per player,      │
│      │              │ transactions                                │ query optimization with EXPLAIN, ACID transaction demo              │
└──────┴──────────────┴─────────────────────────────────────────────┴─────────────────────────────────────────────────────────────────────┘

  ---
AWS Series (A01–A04)

┌──────┬─────────────────┬─────────────────────────────────────────────────┬──────────────────────────────────────────────────────────────┐
│ File │      Topic      │                    Examples                     │                           Problems                           │
├──────┼─────────────────┼─────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────┤
│      │ AWS Core        │ IAM roles/policies, EC2 launch types, S3 bucket │ Design IAM for multi-team, S3 static hosting, EC2            │
│ A01  │ Services        │  policies, VPC subnets, security groups         │ auto-scaling setup, cross-account access, cost optimization  │
│      │                 │                                                 │ scenarios                                                    │
├──────┼─────────────────┼─────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────┤
│      │ Serverless &    │ Lambda triggers, API Gateway REST/HTTP,         │ Serverless CRUD API, event-driven pipeline, DynamoDB access  │
│ A02  │ Databases       │ DynamoDB single-table design, SQS/SNS patterns  │ patterns, fan-out notification, scheduled job with           │
│      │                 │                                                 │ EventBridge                                                  │
├──────┼─────────────────┼─────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────┤
│      │ Networking &    │ Route53 routing policies, CloudFront            │ Multi-region failover, CDN cache strategy, blue-green        │
│ A03  │ CDN             │ distributions, Load Balancers (ALB/NLB), VPC    │ deployment, private API design, WAF rules                    │
│      │                 │ peering                                         │                                                              │
├──────┼─────────────────┼─────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────┤
│      │ DevOps &        │ ECS/EKS basics, CodePipeline CI/CD,             │ Design CI/CD pipeline, containerize Spring Boot,             │
│ A04  │ Containers      │ CloudFormation IaC, CloudWatch alarms, X-Ray    │ infrastructure as code template, observability stack, cost   │
│      │                 │ tracing                                         │ alerting setup                                               │
└──────┴─────────────────┴─────────────────────────────────────────────────┴──────────────────────────────────────────────────────────────┘

## Import Rules

- `"skipExisting": true` — safe re-run: topics with the same title are skipped (no overwrite)
- `"skipExisting": false` — re-seeds even if the topic already exists (use with care)
- `seed_log` table records each import keyed by `batchName` — the Predefined Files UI uses this to show IMPORTED/PENDING status
- At startup, `SeedDataRunner` auto-applies any file whose `batchName` is **not** in `seed_log`
