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

### DSA — D series (target: 9 files)
| File | Topic | Status |
|------|-------|--------|
| D01-arrays-hashing | Arrays & Hashing | ⏳ |
| D02-linked-lists | Linked Lists | ⏳ |
| D03-stacks-queues | Stacks & Queues | ⏳ |
| D04-trees | Binary Trees & BST | ⏳ |
| D05-heaps | Heaps & Priority Queues | ⏳ |
| D06-graphs | Graphs (BFS/DFS) | ⏳ |
| D07-sorting | Sorting Algorithms | ⏳ |
| D08-binary-search | Binary Search & Two Pointers | ⏳ |
| D09-dynamic-programming | Dynamic Programming | ⏳ |

### Spring Boot — S series (target: 6 files)
| File | Topic | Status |
|------|-------|--------|
| S01-ioc-di | IoC & Dependency Injection | ⏳ |
| S02-rest-api | REST API with Spring MVC | ⏳ |
| S03-jpa-hibernate | JPA & Hibernate | ⏳ |
| S04-spring-security | Spring Security & JWT | ⏳ |
| S05-testing | Testing (JUnit 5, MockMvc) | ⏳ |
| S06-microservices | Microservices Basics | ⏳ |

### MySQL — M series (target: 3 files)
| File | Topic | Status |
|------|-------|--------|
| M01-sql-basics | SELECT, WHERE, ORDER BY, GROUP BY | ⏳ |
| M02-joins-subqueries | JOINs, Subqueries, CTEs | ⏳ |
| M03-indexes-transactions | Indexes, Transactions, EXPLAIN | ⏳ |

### AWS — A series (target: 4 files)
| File | Topic | Status |
|------|-------|--------|
| A01-ec2-vpc | EC2, VPC, Security Groups | ⏳ |
| A02-s3-cloudfront | S3, CloudFront, IAM | ⏳ |
| A03-rds-elasticache | RDS, ElastiCache, Parameter Groups | ⏳ |
| A04-deployment | Elastic Beanstalk, ECS, CI/CD | ⏳ |

---

## Import Rules

- `"skipExisting": true` — safe re-run: topics with the same title are skipped (no overwrite)
- `"skipExisting": false` — re-seeds even if the topic already exists (use with care)
- `seed_log` table records each import keyed by `batchName` — the Predefined Files UI uses this to show IMPORTED/PENDING status
- At startup, `SeedDataRunner` auto-applies any file whose `batchName` is **not** in `seed_log`
