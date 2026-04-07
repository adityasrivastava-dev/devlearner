import { useState, useCallback, useMemo } from 'react';
import { adminApi } from '../../api';
import toast from 'react-hot-toast';
import styles from './AdminPage.module.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const CAT_TYPE = {
  JAVA: 'code', DSA: 'code', ADVANCED_JAVA: 'code',
  SPRING_BOOT: 'code', SPRING_MVC: 'code', SPRING_SECURITY: 'code',
  HIBERNATE: 'code', SPRING_DATA: 'code', MICROSERVICES: 'code',
  JAVASCRIPT: 'code', MYSQL: 'sql', AWS: 'concept',
};

const CATEGORY_INFO = {
  JAVA:            { prefix: 'B', icon: '☕', desc: 'Java code + test cases + tracer steps' },
  DSA:             { prefix: 'D', icon: '🌲', desc: 'Algorithms + complexity analysis + test cases' },
  ADVANCED_JAVA:   { prefix: 'J', icon: '⚙️', desc: 'Reflection, NIO, Concurrency deep-dives' },
  SPRING_BOOT:     { prefix: 'S', icon: '🍃', desc: 'Spring annotations + REST/JPA examples' },
  SPRING_MVC:      { prefix: 'S', icon: '🍃', desc: 'Controllers, views, request mapping' },
  SPRING_SECURITY: { prefix: 'S', icon: '🔒', desc: 'Auth, JWT, method security' },
  HIBERNATE:       { prefix: 'S', icon: '🗄', desc: 'JPA mappings, queries, transactions' },
  SPRING_DATA:     { prefix: 'S', icon: '📦', desc: 'Repositories, derived queries, projections' },
  MICROSERVICES:   { prefix: 'S', icon: '🔗', desc: 'Service discovery, API gateway, resilience' },
  MYSQL:           { prefix: 'M', icon: '🛢', desc: 'SQL queries only — no Java code or test runner' },
  AWS:             { prefix: 'A', icon: '☁️', desc: 'Conceptual scenarios — no code at all' },
  JAVASCRIPT:      { prefix: 'JS', icon: '🟨', desc: 'JS/TS code with test cases' },
};

// Category-specific tags for the `pattern` field on problems
const CATEGORY_TAGS = {
  JAVA: [
    'OOP Basics', 'Inheritance', 'Polymorphism', 'Encapsulation', 'Abstraction',
    'Generics', 'Collections', 'Iterator', 'Comparable/Comparator',
    'Streams & Lambda', 'Optional', 'Method References',
    'Exception Handling', 'Try-With-Resources',
    'Multithreading', 'synchronized', 'volatile', 'Executor',
    'I/O & NIO', 'Serialization',
    'Reflection', 'Annotations',
    'Design Pattern - Singleton', 'Design Pattern - Factory', 'Design Pattern - Builder',
    'Design Pattern - Observer', 'Design Pattern - Strategy',
    'String Manipulation', 'Regex',
    'JVM Internals', 'GC & Memory',
  ],
  DSA: [
    'Array Traversal', 'Two Pointers', 'Sliding Window', 'Prefix Sum',
    'Linked List', 'Fast & Slow Pointers',
    'Stack', 'Monotonic Stack', 'Queue', 'Deque',
    'Binary Search', 'Search Space Reduction',
    'BFS', 'DFS', 'Topological Sort',
    'Binary Tree', 'BST', 'AVL Tree', 'Segment Tree', 'Trie',
    'Heap / Priority Queue',
    'Hash Map', 'Hash Set', 'Frequency Count',
    'Dynamic Programming - 1D', 'Dynamic Programming - 2D',
    'Memoization', 'Tabulation',
    'Backtracking', 'Recursion',
    'Greedy', 'Interval Merging',
    'Sorting', 'Merge Sort', 'Quick Sort', 'Counting Sort',
    'Graph Traversal', 'Shortest Path', 'Union-Find',
    'Bit Manipulation', 'Math & Number Theory',
  ],
  ADVANCED_JAVA: [
    'Reflection API', 'Method Handles', 'Dynamic Proxy',
    'Custom Annotations', 'Annotation Processing',
    'CompletableFuture', 'Fork/Join Framework', 'Reactive Streams',
    'NIO.2 Paths', 'WatchService', 'Memory-Mapped Files',
    'JVM Tuning', 'GC Algorithms', 'Heap Profiling',
    'Bytecode Manipulation', 'Class Loaders',
    'Java Modules (JPMS)', 'ServiceLoader',
    'Records', 'Sealed Classes', 'Pattern Matching',
  ],
  SPRING_BOOT: [
    'IoC Container', 'Dependency Injection', '@Bean / @Component',
    'Auto-Configuration', '@Conditional',
    'REST Controller', 'Request Mapping', 'Request Body / Params',
    'Exception Handler', '@ControllerAdvice',
    'Spring Data JPA', 'Repository', 'JPQL', 'Native Query',
    'Transactions', '@Transactional',
    'Spring Security', 'JWT Auth',
    'Actuator', 'Health Checks', 'Metrics',
    'Caching (@Cacheable)', 'Async (@Async)',
    'Testing (MockMvc)', 'Testcontainers',
    'Spring Profiles', 'Configuration Properties',
  ],
  MYSQL: [
    'SELECT Basics', 'WHERE Clause', 'ORDER BY', 'LIMIT / OFFSET',
    'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL OUTER JOIN', 'Self Join', 'Cross Join',
    'GROUP BY', 'HAVING', 'Aggregate Functions',
    'Subquery', 'Correlated Subquery', 'EXISTS / NOT EXISTS',
    'CTE (WITH clause)', 'Recursive CTE',
    'Window Functions', 'ROW_NUMBER', 'RANK / DENSE_RANK', 'LEAD / LAG',
    'CASE WHEN', 'COALESCE', 'NULLIF',
    'String Functions', 'Date Functions', 'Math Functions',
    'Index Optimization', 'EXPLAIN Plan',
    'Transactions', 'ACID Properties',
    'Stored Procedure', 'Trigger', 'View',
    'Schema Design', 'Normalization',
  ],
  AWS: [
    'EC2 Instance Types', 'AMI & Snapshots', 'Auto Scaling Groups', 'Load Balancer (ALB/NLB)',
    'VPC Design', 'Subnets', 'Security Groups', 'NACLs', 'VPC Peering',
    'S3 Buckets', 'S3 Storage Classes', 'S3 Lifecycle Policies', 'S3 Cross-Region Replication',
    'IAM Users & Roles', 'IAM Policies', 'Least Privilege', 'STS AssumeRole',
    'RDS Multi-AZ', 'RDS Read Replicas', 'Aurora Serverless',
    'ElastiCache Redis', 'ElastiCache Memcached',
    'Lambda Functions', 'API Gateway', 'Serverless Architecture',
    'CloudFront CDN', 'Route 53', 'ACM (SSL Certificates)',
    'ECS', 'EKS', 'Fargate', 'Docker on AWS',
    'CloudWatch Logs', 'CloudWatch Alarms', 'X-Ray Tracing',
    'SNS', 'SQS', 'EventBridge',
    'Cost Optimization', 'Reserved vs On-Demand vs Spot',
    'Disaster Recovery', 'RTO & RPO',
  ],
  ADVANCED_JAVA: [
    'Reflection API', 'Method Handles', 'Dynamic Proxy',
    'Custom Annotations', 'Annotation Processing',
    'CompletableFuture', 'Fork/Join Framework',
    'NIO.2 Paths', 'WatchService',
    'JVM Tuning', 'GC Algorithms',
    'Bytecode Manipulation', 'Class Loaders',
    'Records', 'Sealed Classes', 'Pattern Matching',
  ],
  JAVASCRIPT: [
    'Closures', 'Hoisting', 'Event Loop', 'Promises', 'Async/Await',
    'Prototypes', 'Classes', 'Destructuring', 'Spread/Rest',
    'Array Methods', 'Object Methods', 'Map/Set',
    'DOM Manipulation', 'Event Handling',
    'Modules (ESM)', 'CommonJS',
    'Error Handling', 'TypeScript Basics',
  ],
};

// Provide fallback tags for categories not explicitly listed
Object.keys(CATEGORY_INFO).forEach(cat => {
  if (!CATEGORY_TAGS[cat]) CATEGORY_TAGS[cat] = CATEGORY_TAGS.JAVA;
});

// ─── Sample generators (pre-fill with realistic placeholder text) ──────────────

function sampleCode(catType, topicTitle) {
  if (catType === 'sql') return (
`-- Topic: ${topicTitle || 'SQL Query'}
-- Write your SQL query below

SELECT column1, column2
FROM table_name
WHERE condition
ORDER BY column1;`
  );
  if (catType === 'concept') return null;
  return (
`// Topic: ${topicTitle || 'Java Example'}
public class Example {

    public static void main(String[] args) {
        // Demonstrate the concept here
        System.out.println("Hello, DevLearn!");
    }
}`
  );
}

function sampleStarterCode(catType, problemTitle) {
  if (catType === 'sql') return (
`-- ${problemTitle || 'SQL Problem'}
-- Write your SQL query here

SELECT
FROM
WHERE`
  );
  return (
`import java.util.*;

public class Solution {

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Read input, solve, print output

    }
}`
  );
}

function sampleSolutionCode(catType, problemTitle) {
  if (catType === 'sql') return (
`-- Solution for: ${problemTitle || 'SQL Problem'}
SELECT t.column1, COUNT(*) AS total
FROM table1 t
JOIN table2 t2 ON t.id = t2.foreign_id
WHERE t.condition = 'value'
GROUP BY t.column1
HAVING COUNT(*) > 0
ORDER BY total DESC;`
  );
  return (
`import java.util.*;

public class Solution {
    // Time: O(n)  Space: O(1)
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        // Solution logic here
        System.out.println(n);
    }
}`
  );
}

function generateSampleBatch(cfg) {
  const catType = CAT_TYPE[cfg.category] || 'code';
  const isCode    = catType === 'code';
  const isSql     = catType === 'sql';
  const isConcept = catType === 'concept';
  const info = CATEGORY_INFO[cfg.category] || {};

  const examples = Array.from({ length: cfg.numExamples }, (_, i) => {
    const ex = {
      displayOrder: i + 1,
      title: `Example ${i + 1}: [Give this example a descriptive title]`,
      explanation: '[Step-by-step: explain exactly what this example shows and why each part matters]',
      realWorldUse: '[Where does this appear in real production code? e.g. "Spring uses this internally for..."]',
    };
    if (!isConcept) {
      ex.code = sampleCode(catType, cfg.topicTitle);
    }
    if (isCode) {
      ex.pseudocode = 'STEP 1: [describe first step]\nSTEP 2: [describe second step]\nRETURN [result]';
      ex.flowchartMermaid = 'graph TD\n    A[Start] --> B{Condition?}\n    B -->|Yes| C[Action]\n    B -->|No| D[Alternative]\n    C --> E[End]\n    D --> E';
      ex.tracerSteps = '';
    }
    return ex;
  });

  const difficulties = [
    ...Array(cfg.easyCount).fill('EASY'),
    ...Array(cfg.mediumCount).fill('MEDIUM'),
    ...Array(cfg.hardCount).fill('HARD'),
  ];

  const problems = difficulties.map((diff, i) => {
    const p = {
      displayOrder: i + 1,
      title: `[Problem ${i + 1} Title — ${diff}]`,
      difficulty: diff,
      description: isConcept
        ? `Scenario: [Describe the AWS scenario or concept question here]\n\nRequirements:\n- [requirement 1]\n- [requirement 2]\n\nWhat would you choose and why?`
        : `[Clear problem statement]\n\nGiven [input description], write a method that [what it should do].\n\nInput: [describe input format]\nOutput: [describe output format]\n\nExample:\nInput: [sample input]\nOutput: [sample output]\n\nExplanation: [why that output]`,
      hint1: '[Gentle hint — point toward the right approach without giving it away]',
      hint2: '[More specific — name the algorithm or SQL clause to use]',
      hint3: '[Near-solution hint — describe the key step]',
    };
    if (cfg.selectedTags.length > 0) {
      p.pattern = cfg.selectedTags[Math.min(i, cfg.selectedTags.length - 1)];
    } else {
      p.pattern = '[Algorithm pattern or SQL clause — e.g. Two Pointers, GROUP BY, IoC]';
    }
    if (!isConcept) {
      p.starterCode = sampleStarterCode(catType, p.title);
      p.solutionCode = sampleSolutionCode(catType, p.title);
      if (isCode) {
        p.testCases = [
          { input: '[sample stdin]', output: '[expected stdout]' },
          { input: '[edge case stdin]', output: '[expected stdout]' },
        ];
        p.constraints = '1 ≤ n ≤ 10⁵ | [other constraints]';
      }
    } else {
      p.answer = '[Full answer: explain the correct AWS service/approach, trade-offs, and when NOT to use it]';
    }
    p.editorial = '[In-depth editorial: algorithm choice, complexity analysis (Time/Space), common mistakes, alternative approaches]';
    return p;
  });

  const topic = {
    title: cfg.topicTitle || '[Topic Title — e.g. Streams API & Lambdas]',
    category: cfg.category,
    description: '[2-3 sentence overview shown on the topic card. Cover what it is, why it matters, and when to use it.]',
    order: Number(cfg.order) || 1,
    story: '[Analogy or real-world story that makes this topic click for a visual learner]',
    analogy: '[Metaphor: "Think of X like Y because..."]',
    memoryAnchor: '[Mnemonic, acronym, or visual trick to remember the key rule — e.g. PECS: Producer Extends Consumer Super]',
    examples,
    problems,
  };

  if (!isConcept) {
    topic.firstPrinciples = '[Root problem this concept solves. What would code look like without it?]';
    topic.bruteForce      = '[The naive/unoptimized approach — helps learner appreciate the optimized version]';
    topic.optimizedApproach = '[The better solution with explanation of why it is better]';
    topic.whenToUse       = '[Concrete scenarios: "Use this when... Avoid when..."]';
  }

  return {
    batchName: cfg.batchName || `${info.prefix || 'X'}XX-${cfg.topicTitle.toLowerCase().replace(/\s+/g, '-') || 'topic-name'}`,
    skipExisting: true,
    topics: [topic],
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function jsonToState(parsed) {
  const topicRaw = parsed.topics?.[0] || {};
  return {
    batchName: parsed.batchName || '',
    skipExisting: parsed.skipExisting !== false,
    topic: {
      title:              topicRaw.title || '',
      category:           topicRaw.category || 'JAVA',
      description:        topicRaw.description || '',
      order:              topicRaw.order || 1,
      story:              topicRaw.story || '',
      analogy:            topicRaw.analogy || '',
      memoryAnchor:       topicRaw.memoryAnchor || '',
      firstPrinciples:    topicRaw.firstPrinciples || '',
      bruteForce:         topicRaw.bruteForce || '',
      optimizedApproach:  topicRaw.optimizedApproach || '',
      whenToUse:          topicRaw.whenToUse || '',
      examples: (topicRaw.examples || []).map(ex => ({
        displayOrder:    ex.displayOrder || 1,
        title:           ex.title || '',
        code:            ex.code || '',
        tracerSteps:     ex.tracerSteps || '',
        flowchartMermaid:ex.flowchartMermaid || '',
        pseudocode:      ex.pseudocode || '',
        explanation:     ex.explanation || '',
        realWorldUse:    ex.realWorldUse || '',
      })),
      problems: (topicRaw.problems || []).map(p => ({
        displayOrder:   p.displayOrder || 1,
        title:          p.title || '',
        difficulty:     p.difficulty || 'EASY',
        description:    p.description || '',
        pattern:        p.pattern || '',
        constraints:    p.constraints || '',
        hint1:          p.hint1 || '',
        hint2:          p.hint2 || '',
        hint3:          p.hint3 || '',
        starterCode:    p.starterCode || '',
        solutionCode:   p.solutionCode || '',
        testCases:      p.testCases?.length ? p.testCases : [{ input: '', output: '' }],
        answer:         p.answer || '',
        editorial:      p.editorial || '',
      })),
    },
  };
}

function stateToJson(state) {
  const { batchName, skipExisting, topic } = state;
  const catType = CAT_TYPE[topic.category] || 'code';
  const isCode    = catType === 'code';
  const isConcept = catType === 'concept';

  const examples = topic.examples.map((ex, i) => {
    const o = { displayOrder: ex.displayOrder || i + 1, title: ex.title };
    if (!isConcept && ex.code.trim())            o.code             = ex.code.trim();
    if (isCode && ex.tracerSteps.trim())         o.tracerSteps      = ex.tracerSteps.trim();
    if (isCode && ex.flowchartMermaid.trim())    o.flowchartMermaid = ex.flowchartMermaid.trim();
    if (isCode && ex.pseudocode.trim())          o.pseudocode       = ex.pseudocode.trim();
    if (ex.explanation.trim())                   o.explanation      = ex.explanation.trim();
    if (ex.realWorldUse.trim())                  o.realWorldUse     = ex.realWorldUse.trim();
    return o;
  });

  const problems = topic.problems.map((p, i) => {
    const o = {
      displayOrder: p.displayOrder || i + 1,
      title: p.title,
      difficulty: p.difficulty,
      description: p.description,
    };
    if (p.pattern.trim())     o.pattern     = p.pattern.trim();
    if (p.constraints.trim()) o.constraints = p.constraints.trim();
    if (p.hint1.trim())       o.hint1       = p.hint1.trim();
    if (p.hint2.trim())       o.hint2       = p.hint2.trim();
    if (p.hint3.trim())       o.hint3       = p.hint3.trim();
    if (isConcept) {
      if (p.answer.trim()) o.answer = p.answer.trim();
    } else {
      if (p.starterCode.trim())  o.starterCode  = p.starterCode.trim();
      if (p.solutionCode.trim()) o.solutionCode = p.solutionCode.trim();
      if (isCode) {
        const tc = p.testCases.filter(t => t.input.trim() || t.output.trim());
        if (tc.length) o.testCases = tc;
      }
    }
    if (p.editorial.trim()) o.editorial = p.editorial.trim();
    return o;
  });

  const topicObj = {
    title: topic.title, category: topic.category,
    description: topic.description, order: Number(topic.order) || 1,
  };
  ['story','analogy','memoryAnchor'].forEach(f => {
    if (topic[f]?.trim()) topicObj[f] = topic[f].trim();
  });
  if (!isConcept) {
    ['firstPrinciples','bruteForce','optimizedApproach','whenToUse'].forEach(f => {
      if (topic[f]?.trim()) topicObj[f] = topic[f].trim();
    });
  }
  topicObj.examples = examples;
  topicObj.problems = problems;

  return { batchName, skipExisting, topics: [topicObj] };
}

// ─── WIZARD STEP ─────────────────────────────────────────────────────────────

function SetupWizard({ onGenerate, onLoadJson }) {
  const [mode, setMode]               = useState(null); // null | 'create' | 'edit'
  const [category, setCategory]       = useState('JAVA');
  const [batchName, setBatchName]     = useState('');
  const [topicTitle, setTopicTitle]   = useState('');
  const [order, setOrder]             = useState(1);
  const [numExamples, setNumExamples] = useState(3);
  const [easyCount, setEasyCount]     = useState(6);
  const [mediumCount, setMediumCount] = useState(6);
  const [hardCount, setHardCount]     = useState(8);
  const [selectedTags, setSelectedTags] = useState([]);
  const [pasteJson, setPasteJson]     = useState('');
  const [loadError, setLoadError]     = useState('');

  const info = CATEGORY_INFO[category] || {};
  const tags = CATEGORY_TAGS[category] || [];
  const totalProblems = easyCount + mediumCount + hardCount;

  function toggleTag(tag) {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }

  function handleGenerate() {
    onGenerate({ category, batchName, topicTitle, order, numExamples, easyCount, mediumCount, hardCount, selectedTags });
  }

  function handleLoad() {
    setLoadError('');
    try {
      const parsed = JSON.parse(pasteJson);
      if (!parsed.topics || !Array.isArray(parsed.topics)) throw new Error('Missing "topics" array');
      onLoadJson(parsed);
    } catch (e) {
      setLoadError(e.message);
    }
  }

  return (
    <div className={styles.wizardWrap}>

      {/* ── Mode selector ── */}
      {!mode && (
        <div className={styles.wizardModeRow}>
          <button className={styles.wizardModeCard} onClick={() => setMode('create')}>
            <span className={styles.wizardModeIcon}>✨</span>
            <span className={styles.wizardModeTitle}>Create New Batch</span>
            <span className={styles.wizardModeDesc}>Pick a category, fill in details, generate a perfect template</span>
          </button>
          <button className={styles.wizardModeCard} onClick={() => setMode('edit')}>
            <span className={styles.wizardModeIcon}>✏️</span>
            <span className={styles.wizardModeTitle}>Edit Existing JSON</span>
            <span className={styles.wizardModeDesc}>Paste an existing seed JSON and edit it field-by-field</span>
          </button>
        </div>
      )}

      {/* ── Create flow ── */}
      {mode === 'create' && (
        <div className={styles.wizardCard}>
          <div className={styles.wizardHeader}>
            <span className={styles.wizardTitle}>✨ New Batch Setup</span>
            <button className={styles.wizardBack} onClick={() => setMode(null)}>← Back</button>
          </div>

          {/* Step 1: Category */}
          <div className={styles.wizardSection}>
            <div className={styles.wizardSectionLabel}>1 — Category</div>
            <div className={styles.catGrid}>
              {Object.entries(CATEGORY_INFO).map(([cat, info]) => (
                <button
                  key={cat}
                  className={`${styles.catCard} ${category === cat ? styles.catCardActive : ''}`}
                  onClick={() => { setCategory(cat); setSelectedTags([]); }}
                >
                  <span className={styles.catIcon}>{info.icon}</span>
                  <span className={styles.catLabel}>{cat.replace(/_/g, ' ')}</span>
                  <span className={styles.catDesc}>{info.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Basic info */}
          <div className={styles.wizardSection}>
            <div className={styles.wizardSectionLabel}>2 — Batch Info</div>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Batch Name <span style={{color:'var(--red)'}}>*</span></label>
                <input
                  className={styles.input}
                  value={batchName}
                  onChange={e => setBatchName(e.target.value)}
                  placeholder={`e.g. ${info.prefix || 'X'}19-streams-api`}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Topic Order (sort position)</label>
                <input
                  className={styles.input}
                  type="number" min={1}
                  value={order}
                  onChange={e => setOrder(e.target.value)}
                  style={{ width: 90 }}
                />
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Topic Title <span style={{color:'var(--red)'}}>*</span></label>
              <input
                className={styles.input}
                value={topicTitle}
                onChange={e => setTopicTitle(e.target.value)}
                placeholder="e.g. Streams API & Lambdas"
              />
            </div>
          </div>

          {/* Step 3: Counts */}
          <div className={styles.wizardSection}>
            <div className={styles.wizardSectionLabel}>3 — Content Counts</div>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Examples</label>
                <div className={styles.countRow}>
                  {[1,2,3,4,5].map(n => (
                    <button
                      key={n}
                      className={`${styles.countBtn} ${numExamples === n ? styles.countBtnActive : ''}`}
                      onClick={() => setNumExamples(n)}
                    >{n}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>
                Problems — <span style={{color:'var(--accent)'}}>Easy: {easyCount}</span>
                {' · '}<span style={{color:'var(--yellow)'}}>Medium: {mediumCount}</span>
                {' · '}<span style={{color:'var(--red)'}}>Hard: {hardCount}</span>
                {' · '}Total: <b>{totalProblems}</b>
              </label>
              <div className={styles.diffRow}>
                {[['Easy', easyCount, setEasyCount, 'var(--accent)'], ['Medium', mediumCount, setMediumCount, 'var(--yellow)'], ['Hard', hardCount, setHardCount, 'var(--red)']].map(([label, val, setter, color]) => (
                  <div key={label} className={styles.diffCounter}>
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>{label}</span>
                    <div style={{ display:'flex', gap: 4, alignItems:'center' }}>
                      <button className={styles.countBtn} onClick={() => setter(Math.max(0, val - 1))}>−</button>
                      <span style={{ minWidth: 20, textAlign: 'center', fontSize: 13, fontWeight: 700, color }}>{val}</span>
                      <button className={styles.countBtn} onClick={() => setter(val + 1)}>+</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Step 4: Tags */}
          <div className={styles.wizardSection}>
            <div className={styles.wizardSectionLabel}>
              4 — Tags / Patterns
              <span className={styles.wizardSectionHint}> — picked tags auto-fill the "pattern" field on each problem</span>
            </div>
            <div className={styles.tagCloud}>
              {tags.map(tag => (
                <button
                  key={tag}
                  className={`${styles.tagChip} ${selectedTags.includes(tag) ? styles.tagChipActive : ''}`}
                  onClick={() => toggleTag(tag)}
                >
                  {selectedTags.includes(tag) ? '✓ ' : ''}{tag}
                </button>
              ))}
            </div>
            {selectedTags.length > 0 && (
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
                Selected ({selectedTags.length}): {selectedTags.join(', ')}
              </div>
            )}
          </div>

          {/* Generate button */}
          <button
            className="btn btn-primary"
            disabled={!batchName.trim() || !topicTitle.trim()}
            onClick={handleGenerate}
            style={{ alignSelf: 'flex-start' }}
          >
            🛠 Generate Template →
          </button>
          {(!batchName.trim() || !topicTitle.trim()) && (
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>Batch Name and Topic Title are required</span>
          )}
        </div>
      )}

      {/* ── Edit / Load flow ── */}
      {mode === 'edit' && (
        <div className={styles.wizardCard}>
          <div className={styles.wizardHeader}>
            <span className={styles.wizardTitle}>✏️ Load Existing JSON</span>
            <button className={styles.wizardBack} onClick={() => setMode(null)}>← Back</button>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text3)', margin: 0 }}>
            Paste a seed batch JSON (single topic). All fields will be loaded into the form.
          </p>
          <textarea
            className={styles.codeArea}
            rows={14}
            value={pasteJson}
            onChange={e => { setPasteJson(e.target.value); setLoadError(''); }}
            placeholder={'{\n  "batchName": "B01-example",\n  "skipExisting": true,\n  "topics": [...]\n}'}
            spellCheck={false}
          />
          {loadError && (
            <div style={{ fontSize: 12, color: 'var(--red)' }}>⚠ JSON error: {loadError}</div>
          )}
          <button
            className="btn btn-primary"
            disabled={!pasteJson.trim()}
            onClick={handleLoad}
            style={{ alignSelf: 'flex-start' }}
          >
            📂 Load into Builder →
          </button>
        </div>
      )}
    </div>
  );
}

// ─── BUILDER FORM ─────────────────────────────────────────────────────────────

function BuilderForm({ initialState, onBack }) {
  const [state, setState]         = useState(initialState);
  const [activeTab, setActiveTab] = useState('topic');
  const [activeExIdx, setActiveExIdx] = useState(0);
  const [activePrIdx, setActivePrIdx] = useState(0);
  const [importing, setImporting]     = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const catType   = CAT_TYPE[state.topic.category] || 'code';
  const isCode    = catType === 'code';
  const isSql     = catType === 'sql';
  const isConcept = catType === 'concept';

  const jsonOutput = useMemo(() => {
    try { return JSON.stringify(stateToJson(state), null, 2); }
    catch { return '// JSON error'; }
  }, [state]);

  // ── State helpers ──
  const setBatch = (k, v) => setState(s => ({ ...s, [k]: v }));
  const setTopic = (k, v) => setState(s => ({ ...s, topic: { ...s.topic, [k]: v } }));

  const setEx = useCallback((i, k, v) => setState(s => {
    const a = [...s.topic.examples]; a[i] = { ...a[i], [k]: v };
    return { ...s, topic: { ...s.topic, examples: a } };
  }), []);

  const setPr = useCallback((i, k, v) => setState(s => {
    const a = [...s.topic.problems]; a[i] = { ...a[i], [k]: v };
    return { ...s, topic: { ...s.topic, problems: a } };
  }), []);

  const setTc = useCallback((pi, ti, k, v) => setState(s => {
    const ps = [...s.topic.problems];
    const tc = [...ps[pi].testCases]; tc[ti] = { ...tc[ti], [k]: v };
    ps[pi] = { ...ps[pi], testCases: tc };
    return { ...s, topic: { ...s.topic, problems: ps } };
  }), []);

  function addExample() {
    const idx = state.topic.examples.length;
    setState(s => ({
      ...s,
      topic: {
        ...s.topic,
        examples: [...s.topic.examples, {
          displayOrder: idx + 1, title: '', code: sampleCode(catType, state.topic.title),
          tracerSteps: '', flowchartMermaid: '', pseudocode: '', explanation: '', realWorldUse: '',
        }],
      },
    }));
    setActiveExIdx(idx);
  }

  function removeExample(idx) {
    setState(s => ({ ...s, topic: { ...s.topic, examples: s.topic.examples.filter((_, i) => i !== idx) } }));
    setActiveExIdx(Math.max(0, idx - 1));
  }

  function addProblem(diff = 'EASY') {
    const idx = state.topic.problems.length;
    setState(s => ({
      ...s,
      topic: {
        ...s.topic,
        problems: [...s.topic.problems, {
          displayOrder: idx + 1, title: '', difficulty: diff, description: '',
          pattern: '', constraints: '', hint1: '', hint2: '', hint3: '',
          starterCode: sampleStarterCode(catType, ''), solutionCode: sampleSolutionCode(catType, ''),
          testCases: [{ input: '', output: '' }], answer: '', editorial: '',
        }],
      },
    }));
    setActivePrIdx(idx);
  }

  function removeProblem(idx) {
    setState(s => ({ ...s, topic: { ...s.topic, problems: s.topic.problems.filter((_, i) => i !== idx) } }));
    setActivePrIdx(Math.max(0, idx - 1));
  }

  const availableTags = CATEGORY_TAGS[state.topic.category] || [];

  function handleCopy() {
    navigator.clipboard.writeText(jsonOutput).then(() => toast.success('JSON copied!'));
  }

  function handleDownload() {
    const name = (state.batchName.trim() || 'seed-batch').replace(/\s+/g, '-') + '.json';
    const blob = new Blob([jsonOutput], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), { href: url, download: name }).click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${name}`);
  }

  async function handleImport() {
    let payload;
    try { payload = JSON.parse(jsonOutput); } catch { toast.error('JSON has errors — check preview'); return; }
    setImporting(true);
    try {
      const res = await adminApi.seedBatch(payload);
      toast.success(`Imported: ${res.topicsSeeded} topics · ${res.problemsSeeded} problems`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed');
    } finally { setImporting(false); }
  }

  const easyN   = state.topic.problems.filter(p => p.difficulty === 'EASY').length;
  const mediumN = state.topic.problems.filter(p => p.difficulty === 'MEDIUM').length;
  const hardN   = state.topic.problems.filter(p => p.difficulty === 'HARD').length;

  return (
    <div className={styles.builderLayout}>

      {/* ── LEFT: Form ── */}
      <div className={styles.builderForm}>

        {/* Batch header */}
        <div className={styles.builderCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className={styles.builderCardTitle}>📦 Batch Config</div>
            <button className="btn btn-ghost btn-sm" onClick={onBack}>← Setup</button>
          </div>
          <div className={styles.fieldRow}>
            <Field label="Batch Name" required>
              <input className={styles.input} value={state.batchName}
                onChange={e => setBatch('batchName', e.target.value)} />
            </Field>
            <Field label="Skip Existing?">
              <label className={styles.toggle}>
                <input type="checkbox" checked={state.skipExisting}
                  onChange={e => setBatch('skipExisting', e.target.checked)} />
                <span style={{ fontSize: 12 }}>{state.skipExisting ? 'Yes — safe re-run' : 'No — overwrite'}</span>
              </label>
            </Field>
          </div>
        </div>

        {/* Section tabs */}
        <div className={styles.builderTabs}>
          {[
            ['topic',    '📚 Topic',    null],
            ['examples', '💡 Examples', state.topic.examples.length],
            ['problems', '🧩 Problems', state.topic.problems.length],
          ].map(([key, label, count]) => (
            <button key={key}
              className={`${styles.builderTabBtn} ${activeTab === key ? styles.builderTabActive : ''}`}
              onClick={() => setActiveTab(key)}
            >
              {label}{count !== null && <span className={styles.tabCount}>{count}</span>}
            </button>
          ))}
        </div>

        {/* ══ TOPIC TAB ══ */}
        {activeTab === 'topic' && (
          <div className={styles.builderCard}>
            <div className={styles.fieldRow}>
              <Field label="Title" required>
                <input className={styles.input} value={state.topic.title}
                  onChange={e => setTopic('title', e.target.value)} />
              </Field>
              <Field label="Order">
                <input className={styles.input} type="number" min={1}
                  value={state.topic.order} style={{ width: 90 }}
                  onChange={e => setTopic('order', e.target.value)} />
              </Field>
            </div>
            <Field label="Category">
              <select className={styles.input} value={state.topic.category}
                onChange={e => setTopic('category', e.target.value)}>
                {Object.keys(CATEGORY_INFO).map(c => (
                  <option key={c} value={c}>{CATEGORY_INFO[c].icon} {c.replace(/_/g,' ')}</option>
                ))}
              </select>
            </Field>
            {isConcept && <div className={styles.categoryHint}>☁️ AWS — no code fields. Use explanation + answer fields only.</div>}
            {isSql     && <div className={styles.categoryHint}>🛢 MySQL — code fields show SQL queries. No tracer, no test cases.</div>}

            <Field label="Description" required hint="2-3 sentences shown on topic card">
              <textarea className={styles.textarea} rows={3} value={state.topic.description}
                onChange={e => setTopic('description', e.target.value)} />
            </Field>
            <Field label="Story / Analogy" hint="Real-world hook for visual learners">
              <textarea className={styles.textarea} rows={3} value={state.topic.story}
                onChange={e => setTopic('story', e.target.value)} />
            </Field>
            <Field label="Memory Anchor" hint="Mnemonic, acronym, or visual trick">
              <textarea className={styles.textarea} rows={2} value={state.topic.memoryAnchor}
                onChange={e => setTopic('memoryAnchor', e.target.value)} />
            </Field>
            {!isConcept && <>
              <Field label="First Principles" hint="Root problem this concept solves">
                <textarea className={styles.textarea} rows={3} value={state.topic.firstPrinciples}
                  onChange={e => setTopic('firstPrinciples', e.target.value)} />
              </Field>
              <div className={styles.fieldRow}>
                <Field label="Brute Force Approach">
                  <textarea className={styles.textarea} rows={2} value={state.topic.bruteForce}
                    onChange={e => setTopic('bruteForce', e.target.value)} />
                </Field>
                <Field label="Optimized Approach">
                  <textarea className={styles.textarea} rows={2} value={state.topic.optimizedApproach}
                    onChange={e => setTopic('optimizedApproach', e.target.value)} />
                </Field>
              </div>
              <Field label="When To Use">
                <textarea className={styles.textarea} rows={2} value={state.topic.whenToUse}
                  onChange={e => setTopic('whenToUse', e.target.value)} />
              </Field>
            </>}
          </div>
        )}

        {/* ══ EXAMPLES TAB ══ */}
        {activeTab === 'examples' && (
          <div className={styles.builderCard}>
            <div className={styles.itemSelector}>
              {state.topic.examples.map((ex, i) => (
                <button key={i}
                  className={`${styles.itemTab} ${activeExIdx === i ? styles.itemTabActive : ''}`}
                  onClick={() => setActiveExIdx(i)}
                >
                  Ex {i + 1}{ex.title ? `: ${ex.title.slice(0, 16)}` : ''}
                </button>
              ))}
              <button className={`${styles.itemTab} ${styles.addItemTab}`} onClick={addExample}>+ Add</button>
            </div>

            {state.topic.examples[activeExIdx] && (() => {
              const ex  = state.topic.examples[activeExIdx];
              const set = (k, v) => setEx(activeExIdx, k, v);
              return (
                <>
                  <div className={styles.fieldRow}>
                    <Field label={`Example ${activeExIdx + 1} Title`} required>
                      <input className={styles.input} value={ex.title}
                        onChange={e => set('title', e.target.value)} />
                    </Field>
                    <Field label="Order">
                      <input className={styles.input} type="number" min={1}
                        value={ex.displayOrder} style={{ width: 80 }}
                        onChange={e => set('displayOrder', Number(e.target.value))} />
                    </Field>
                  </div>
                  {!isConcept && (
                    <Field label={isSql ? 'SQL Query' : 'Java Code'}>
                      <textarea className={styles.codeArea} rows={8} spellCheck={false}
                        value={ex.code} onChange={e => set('code', e.target.value)} />
                    </Field>
                  )}
                  {isCode && (
                    <>
                      <Field label="Pseudocode">
                        <textarea className={styles.textarea} rows={3} value={ex.pseudocode}
                          onChange={e => set('pseudocode', e.target.value)} />
                      </Field>
                      <Field label="Flowchart (Mermaid)" hint="graph TD / sequenceDiagram">
                        <textarea className={styles.codeArea} rows={4} spellCheck={false}
                          value={ex.flowchartMermaid} onChange={e => set('flowchartMermaid', e.target.value)} />
                      </Field>
                      <Field label="Tracer Steps (JSON)" hint='[{line, lineCode, variables, phase, annotation}]'>
                        <textarea className={styles.codeArea} rows={3} spellCheck={false}
                          value={ex.tracerSteps} onChange={e => set('tracerSteps', e.target.value)} />
                      </Field>
                    </>
                  )}
                  <Field label="Explanation" required>
                    <textarea className={styles.textarea} rows={3} value={ex.explanation}
                      onChange={e => set('explanation', e.target.value)} />
                  </Field>
                  <Field label="Real-World Use">
                    <textarea className={styles.textarea} rows={2} value={ex.realWorldUse}
                      onChange={e => set('realWorldUse', e.target.value)} />
                  </Field>
                  {state.topic.examples.length > 1 && (
                    <button className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--red)', marginTop: 4 }}
                      onClick={() => removeExample(activeExIdx)}>
                      🗑 Remove Example {activeExIdx + 1}
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* ══ PROBLEMS TAB ══ */}
        {activeTab === 'problems' && (
          <div className={styles.builderCard}>
            <div className={styles.itemSelector}>
              {state.topic.problems.map((p, i) => (
                <button key={i}
                  className={`${styles.itemTab} ${activePrIdx === i ? styles.itemTabActive : ''}`}
                  onClick={() => setActivePrIdx(i)}
                >
                  <span className={styles[`diff${p.difficulty}`]}>{p.difficulty[0]}</span>
                  {' '}P{i + 1}{p.title ? `: ${p.title.slice(0, 14)}` : ''}
                </button>
              ))}
              <div style={{ display: 'flex', gap: 4 }}>
                {['EASY', 'MEDIUM', 'HARD'].map(d => (
                  <button key={d} className={`${styles.itemTab} ${styles.addItemTab}`}
                    onClick={() => addProblem(d)}
                    title={`Add ${d} problem`}
                  >
                    <span className={styles[`diff${d}`]}>+{d[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {state.topic.problems[activePrIdx] && (() => {
              const p   = state.topic.problems[activePrIdx];
              const set = (k, v) => setPr(activePrIdx, k, v);
              return (
                <>
                  <div className={styles.fieldRow}>
                    <Field label={`Problem ${activePrIdx + 1} Title`} required>
                      <input className={styles.input} value={p.title}
                        onChange={e => set('title', e.target.value)} />
                    </Field>
                    <Field label="Difficulty">
                      <select className={styles.input} value={p.difficulty}
                        onChange={e => set('difficulty', e.target.value)}>
                        <option value="EASY">Easy</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HARD">Hard</option>
                      </select>
                    </Field>
                  </div>

                  {/* Tag picker */}
                  <Field label="Pattern / Tag" hint="pick from list OR type custom">
                    <div className={styles.tagPickerRow}>
                      <input className={styles.input} value={p.pattern}
                        onChange={e => set('pattern', e.target.value)}
                        placeholder="e.g. Two Pointers, GROUP BY, IoC" />
                    </div>
                    <div className={styles.tagCloud} style={{ marginTop: 5 }}>
                      {availableTags.map(tag => (
                        <button key={tag}
                          className={`${styles.tagChip} ${p.pattern === tag ? styles.tagChipActive : ''}`}
                          onClick={() => set('pattern', p.pattern === tag ? '' : tag)}
                        >{tag}</button>
                      ))}
                    </div>
                  </Field>

                  <Field label="Constraints">
                    <input className={styles.input} value={p.constraints}
                      onChange={e => set('constraints', e.target.value)}
                      placeholder="e.g. 1 ≤ n ≤ 10⁵, no built-in sort" />
                  </Field>
                  <Field label="Description / Problem Statement" required>
                    <textarea className={styles.textarea} rows={6} value={p.description}
                      onChange={e => set('description', e.target.value)} />
                  </Field>
                  {['hint1','hint2','hint3'].map((k, hi) => (
                    <Field key={k} label={`Hint ${hi + 1}`} hint={['gentle nudge','name the approach','near-solution'][hi]}>
                      <input className={styles.input} value={p[k]}
                        onChange={e => set(k, e.target.value)} />
                    </Field>
                  ))}

                  {!isConcept && (
                    <>
                      <Field label={isSql ? 'Starter Query' : 'Starter Code'} hint="skeleton the user begins with">
                        <textarea className={styles.codeArea} rows={6} spellCheck={false}
                          value={p.starterCode} onChange={e => set('starterCode', e.target.value)} />
                      </Field>
                      <Field label={isSql ? 'Solution Query' : 'Solution Code'} hint="full correct answer">
                        <textarea className={styles.codeArea} rows={6} spellCheck={false}
                          value={p.solutionCode} onChange={e => set('solutionCode', e.target.value)} />
                      </Field>
                    </>
                  )}

                  {isCode && (
                    <Field label="Test Cases">
                      {p.testCases.map((tc, ti) => (
                        <div key={ti} className={styles.testCaseRow}>
                          <input className={styles.input} value={tc.input} style={{ flex: 1 }}
                            placeholder="stdin" onChange={e => setTc(activePrIdx, ti, 'input', e.target.value)} />
                          <input className={styles.input} value={tc.output} style={{ flex: 1 }}
                            placeholder="expected stdout" onChange={e => setTc(activePrIdx, ti, 'output', e.target.value)} />
                          {p.testCases.length > 1 && (
                            <button className="btn btn-ghost btn-sm" style={{ color:'var(--red)', padding:'4px 8px' }}
                              onClick={() => setState(s => {
                                const ps = [...s.topic.problems];
                                ps[activePrIdx] = { ...ps[activePrIdx], testCases: ps[activePrIdx].testCases.filter((_,x) => x !== ti) };
                                return { ...s, topic: { ...s.topic, problems: ps } };
                              })}>×</button>
                          )}
                        </div>
                      ))}
                      <button className="btn btn-ghost btn-sm" style={{ marginTop: 4 }}
                        onClick={() => setState(s => {
                          const ps = [...s.topic.problems];
                          ps[activePrIdx] = { ...ps[activePrIdx], testCases: [...ps[activePrIdx].testCases, { input:'', output:'' }] };
                          return { ...s, topic: { ...s.topic, problems: ps } };
                        })}>+ Test Case</button>
                    </Field>
                  )}

                  {isConcept && (
                    <Field label="Answer" hint="full conceptual answer with trade-offs">
                      <textarea className={styles.textarea} rows={5} value={p.answer}
                        onChange={e => set('answer', e.target.value)} />
                    </Field>
                  )}
                  <Field label="Editorial" hint="in-depth post-solve explanation + complexity">
                    <textarea className={styles.textarea} rows={3} value={p.editorial}
                      onChange={e => set('editorial', e.target.value)} />
                  </Field>

                  {state.topic.problems.length > 1 && (
                    <button className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--red)', marginTop: 4 }}
                      onClick={() => removeProblem(activePrIdx)}>
                      🗑 Remove Problem {activePrIdx + 1}
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* ── RIGHT: Preview ── */}
      <div className={styles.builderPreview}>
        <div className={styles.previewHeader}>
          <span className={styles.previewTitle}>JSON Preview</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowPreview(p => !p)}>
              {showPreview ? '▾ Hide' : '▸ Show'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={handleCopy}>📋 Copy</button>
            <button className="btn btn-ghost btn-sm" onClick={handleDownload}>⬇ .json</button>
            <button className="btn btn-primary btn-sm" disabled={importing} onClick={handleImport}>
              {importing ? <><span className="spinner" />Saving…</> : '↑ Import to DB'}
            </button>
          </div>
        </div>
        <div className={styles.previewStats}>
          <span className={styles.previewStat}>{state.topic.examples.length} examples</span>
          <span className={styles.previewStat} style={{ color:'var(--accent)' }}>{easyN}E</span>
          <span className={styles.previewStat} style={{ color:'var(--yellow)' }}>{mediumN}M</span>
          <span className={styles.previewStat} style={{ color:'var(--red)' }}>{hardN}H</span>
          <span className={styles.previewStat} style={{ color:'var(--text3)' }}>
            {(jsonOutput.length / 1024).toFixed(1)} KB
          </span>
        </div>
        {showPreview && <pre className={styles.jsonPreview}>{jsonOutput}</pre>}
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

export default function JsonBuilderSection() {
  const [phase, setPhase]     = useState('setup'); // setup | build
  const [formState, setFormState] = useState(null);

  function handleGenerate(cfg) {
    const sample = generateSampleBatch(cfg);
    setFormState(jsonToState(sample));
    setPhase('build');
  }

  function handleLoadJson(parsed) {
    setFormState(jsonToState(parsed));
    setPhase('build');
  }

  function handleBack() {
    if (window.confirm('Go back to setup? Unsaved changes will be lost.')) {
      setPhase('setup');
      setFormState(null);
    }
  }

  if (phase === 'build' && formState) {
    return <BuilderForm initialState={formState} onBack={handleBack} />;
  }

  return <SetupWizard onGenerate={handleGenerate} onLoadJson={handleLoadJson} />;
}

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, hint, required, children }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>
        {label}
        {required && <span style={{ color: 'var(--red)' }}> *</span>}
        {hint && <span className={styles.fieldHint}> — {hint}</span>}
      </label>
      {children}
    </div>
  );
}
