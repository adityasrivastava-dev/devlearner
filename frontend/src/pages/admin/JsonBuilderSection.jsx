import { useState, useCallback, useMemo } from 'react';
import { adminApi } from '../../api';
import toast from 'react-hot-toast';
import styles from './AdminPage.module.css';

// ─── Category configuration ───────────────────────────────────────────────────
const CAT_TYPE = {
  JAVA:            'code',
  DSA:             'code',
  ADVANCED_JAVA:   'code',
  SPRING_BOOT:     'code',
  SPRING:          'code',
  SPRING_MVC:      'code',
  SPRING_SECURITY: 'code',
  HIBERNATE:       'code',
  SPRING_DATA:     'code',
  MICROSERVICES:   'code',
  JAVASCRIPT:      'code',
  MYSQL:           'sql',
  AWS:             'concept',
};

const ALL_CATEGORIES = [
  'JAVA', 'DSA', 'ADVANCED_JAVA',
  'SPRING_BOOT', 'SPRING_MVC', 'SPRING_SECURITY', 'HIBERNATE', 'SPRING_DATA', 'MICROSERVICES',
  'MYSQL', 'AWS', 'JAVASCRIPT',
];

const PREFIX_MAP = {
  JAVA: 'B', DSA: 'D', ADVANCED_JAVA: 'J',
  SPRING_BOOT: 'S', SPRING_MVC: 'S', SPRING_SECURITY: 'S',
  HIBERNATE: 'S', SPRING_DATA: 'S', MICROSERVICES: 'S',
  MYSQL: 'M', AWS: 'A', JAVASCRIPT: 'JS',
};

// ─── Default blank structures ─────────────────────────────────────────────────
function blankExample(order = 1) {
  return {
    displayOrder: order,
    title: '',
    code: '',
    tracerSteps: '',
    flowchartMermaid: '',
    pseudocode: '',
    explanation: '',
    realWorldUse: '',
  };
}

function blankProblem(order = 1) {
  return {
    displayOrder: order,
    title: '',
    difficulty: 'EASY',
    description: '',
    pattern: '',
    constraints: '',
    hint1: '',
    hint2: '',
    hint3: '',
    starterCode: '',
    solutionCode: '',
    testCases: [{ input: '', output: '' }],
    answer: '',
    editorial: '',
  };
}

function blankBatch() {
  return {
    batchName: '',
    skipExisting: true,
    topic: {
      title: '',
      category: 'JAVA',
      description: '',
      order: 1,
      story: '',
      analogy: '',
      memoryAnchor: '',
      firstPrinciples: '',
      bruteForce: '',
      optimizedApproach: '',
      whenToUse: '',
      examples: [blankExample(1)],
      problems: [blankProblem(1)],
    },
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function omitEmpty(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => {
    if (v === '' || v === null || v === undefined) return false;
    if (Array.isArray(v) && v.length === 0) return false;
    return true;
  }));
}

function buildJson(state) {
  const { batchName, skipExisting, topic } = state;
  const catType = CAT_TYPE[topic.category] || 'code';

  // Build examples
  const examples = topic.examples.map((ex, i) => {
    const base = {
      displayOrder: ex.displayOrder || i + 1,
      title: ex.title,
    };
    if (catType !== 'concept') base.code = ex.code;
    if (catType === 'code') {
      if (ex.tracerSteps.trim()) base.tracerSteps = ex.tracerSteps.trim();
      if (ex.flowchartMermaid.trim()) base.flowchartMermaid = ex.flowchartMermaid.trim();
      if (ex.pseudocode.trim()) base.pseudocode = ex.pseudocode.trim();
    }
    if (ex.explanation.trim()) base.explanation = ex.explanation.trim();
    if (ex.realWorldUse.trim()) base.realWorldUse = ex.realWorldUse.trim();
    return base;
  });

  // Build problems
  const problems = topic.problems.map((p, i) => {
    const base = {
      displayOrder: p.displayOrder || i + 1,
      title: p.title,
      difficulty: p.difficulty,
      description: p.description,
    };
    if (p.pattern.trim()) base.pattern = p.pattern.trim();
    if (p.constraints.trim()) base.constraints = p.constraints.trim();
    if (p.hint1.trim()) base.hint1 = p.hint1.trim();
    if (p.hint2.trim()) base.hint2 = p.hint2.trim();
    if (p.hint3.trim()) base.hint3 = p.hint3.trim();

    if (catType === 'concept') {
      if (p.answer.trim()) base.answer = p.answer.trim();
    } else {
      if (p.starterCode.trim()) base.starterCode = p.starterCode.trim();
      if (p.solutionCode.trim()) base.solutionCode = p.solutionCode.trim();
      if (catType === 'code') {
        const tc = p.testCases.filter(tc => tc.input.trim() || tc.output.trim());
        if (tc.length) base.testCases = tc;
      }
    }
    if (p.editorial.trim()) base.editorial = p.editorial.trim();
    return base;
  });

  // Build topic
  const topicObj = {
    title: topic.title,
    category: topic.category,
    description: topic.description,
    order: Number(topic.order) || 1,
  };
  const richFields = ['story', 'analogy', 'memoryAnchor'];
  const codeFields = ['firstPrinciples', 'bruteForce', 'optimizedApproach', 'whenToUse'];
  richFields.forEach(f => { if (topic[f].trim()) topicObj[f] = topic[f].trim(); });
  if (catType !== 'concept') {
    codeFields.forEach(f => { if (topic[f].trim()) topicObj[f] = topic[f].trim(); });
  }
  topicObj.examples = examples;
  topicObj.problems = problems;

  return { batchName, skipExisting, topics: [topicObj] };
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function JsonBuilderSection() {
  const [state, setState] = useState(blankBatch());
  const [activeTab, setActiveTab] = useState('topic'); // topic | examples | problems
  const [activeExIdx, setActiveExIdx] = useState(0);
  const [activePrIdx, setActivePrIdx] = useState(0);
  const [importing, setImporting] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const catType = CAT_TYPE[state.topic.category] || 'code';
  const isCode    = catType === 'code';
  const isSql     = catType === 'sql';
  const isConcept = catType === 'concept';

  // ── Computed JSON ──
  const jsonOutput = useMemo(() => {
    try { return JSON.stringify(buildJson(state), null, 2); }
    catch { return '{}'; }
  }, [state]);

  // ── Setters ──
  const setBatch = useCallback((key, val) =>
    setState(s => ({ ...s, [key]: val })), []);

  const setTopic = useCallback((key, val) =>
    setState(s => ({ ...s, topic: { ...s.topic, [key]: val } })), []);

  const setExample = useCallback((idx, key, val) =>
    setState(s => {
      const exs = [...s.topic.examples];
      exs[idx] = { ...exs[idx], [key]: val };
      return { ...s, topic: { ...s.topic, examples: exs } };
    }), []);

  const setProblem = useCallback((idx, key, val) =>
    setState(s => {
      const prs = [...s.topic.problems];
      prs[idx] = { ...prs[idx], [key]: val };
      return { ...s, topic: { ...s.topic, problems: prs } };
    }), []);

  const setTestCase = useCallback((pIdx, tcIdx, key, val) =>
    setState(s => {
      const prs = [...s.topic.problems];
      const tcs = [...prs[pIdx].testCases];
      tcs[tcIdx] = { ...tcs[tcIdx], [key]: val };
      prs[pIdx] = { ...prs[pIdx], testCases: tcs };
      return { ...s, topic: { ...s.topic, problems: prs } };
    }), []);

  function addExample() {
    const idx = state.topic.examples.length;
    setState(s => ({
      ...s,
      topic: { ...s.topic, examples: [...s.topic.examples, blankExample(idx + 1)] },
    }));
    setActiveExIdx(idx);
  }

  function removeExample(idx) {
    setState(s => {
      const exs = s.topic.examples.filter((_, i) => i !== idx);
      return { ...s, topic: { ...s.topic, examples: exs } };
    });
    setActiveExIdx(Math.max(0, idx - 1));
  }

  function addProblem() {
    const idx = state.topic.problems.length;
    setState(s => ({
      ...s,
      topic: { ...s.topic, problems: [...s.topic.problems, blankProblem(idx + 1)] },
    }));
    setActivePrIdx(idx);
  }

  function removeProblem(idx) {
    setState(s => {
      const prs = s.topic.problems.filter((_, i) => i !== idx);
      return { ...s, topic: { ...s.topic, problems: prs } };
    });
    setActivePrIdx(Math.max(0, idx - 1));
  }

  function addTestCase(pIdx) {
    setState(s => {
      const prs = [...s.topic.problems];
      prs[pIdx] = { ...prs[pIdx], testCases: [...prs[pIdx].testCases, { input: '', output: '' }] };
      return { ...s, topic: { ...s.topic, problems: prs } };
    });
  }

  function removeTestCase(pIdx, tcIdx) {
    setState(s => {
      const prs = [...s.topic.problems];
      prs[pIdx] = { ...prs[pIdx], testCases: prs[pIdx].testCases.filter((_, i) => i !== tcIdx) };
      return { ...s, topic: { ...s.topic, problems: prs } };
    });
  }

  function handleCopy() {
    navigator.clipboard.writeText(jsonOutput).then(() => toast.success('JSON copied!'));
  }

  function handleDownload() {
    const name = state.batchName.trim()
      ? state.batchName.trim().replace(/\s+/g, '-') + '.json'
      : 'seed-batch.json';
    const blob = new Blob([jsonOutput], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${name}`);
  }

  async function handleImport() {
    let payload;
    try { payload = JSON.parse(jsonOutput); }
    catch { toast.error('Invalid JSON — check the preview'); return; }
    setImporting(true);
    try {
      const res = await adminApi.seedBatch(payload);
      toast.success(`Imported: ${res.topicsSeeded} topics · ${res.problemsSeeded} problems`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed');
    } finally { setImporting(false); }
  }

  function handleReset() {
    if (window.confirm('Reset the builder? All unsaved data will be lost.')) {
      setState(blankBatch());
      setActiveExIdx(0);
      setActivePrIdx(0);
    }
  }

  const codeLabel = isCode ? 'Java Code' : isSql ? 'SQL Query' : null;
  const starterLabel = isCode ? 'Starter Code (Java)' : 'Starter Query (SQL)';
  const solutionLabel = isCode ? 'Solution Code (Java)' : 'Solution Query (SQL)';

  // ── Render ──
  return (
    <div className={styles.builderLayout}>

      {/* ── Left: Form ── */}
      <div className={styles.builderForm}>

        {/* Batch config */}
        <div className={styles.builderCard}>
          <div className={styles.builderCardTitle}>📦 Batch Config</div>
          <div className={styles.fieldRow}>
            <Field label="Batch Name" hint="e.g. B19-streams-api">
              <input
                className={styles.input}
                value={state.batchName}
                onChange={e => setBatch('batchName', e.target.value)}
                placeholder={`${PREFIX_MAP[state.topic.category] || 'B'}XX-topic-name`}
              />
            </Field>
            <Field label="Skip Existing?">
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={state.skipExisting}
                  onChange={e => setBatch('skipExisting', e.target.checked)}
                />
                <span>{state.skipExisting ? 'Yes (safe re-run)' : 'No (overwrite)'}</span>
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
            <button
              key={key}
              className={`${styles.builderTabBtn} ${activeTab === key ? styles.builderTabActive : ''}`}
              onClick={() => setActiveTab(key)}
            >
              {label}{count !== null ? <span className={styles.tabCount}>{count}</span> : null}
            </button>
          ))}
        </div>

        {/* ── TOPIC TAB ── */}
        {activeTab === 'topic' && (
          <div className={styles.builderCard}>
            <div className={styles.fieldRow}>
              <Field label="Topic Title" required>
                <input
                  className={styles.input}
                  value={state.topic.title}
                  onChange={e => setTopic('title', e.target.value)}
                  placeholder="e.g. Streams API & Lambdas"
                />
              </Field>
              <Field label="Order (sort position)">
                <input
                  className={styles.input}
                  type="number"
                  min={1}
                  value={state.topic.order}
                  onChange={e => setTopic('order', e.target.value)}
                  style={{ width: 80 }}
                />
              </Field>
            </div>

            <Field label="Category" required>
              <select
                className={styles.input}
                value={state.topic.category}
                onChange={e => setTopic('category', e.target.value)}
              >
                {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>

            {isConcept && (
              <div className={styles.categoryHint}>
                ☁️ AWS (concept) — no code fields. Use explanation + answer fields only.
              </div>
            )}
            {isSql && (
              <div className={styles.categoryHint}>
                🛢 MySQL (SQL) — code fields show SQL queries. No test cases or tracer.
              </div>
            )}

            <Field label="Description" required>
              <textarea
                className={styles.textarea}
                rows={3}
                value={state.topic.description}
                onChange={e => setTopic('description', e.target.value)}
                placeholder="One-paragraph overview shown on the topic card"
              />
            </Field>

            <Field label="Story / Analogy (narrative hook)" hint="Optional — helps visual learners">
              <textarea
                className={styles.textarea}
                rows={3}
                value={state.topic.story}
                onChange={e => setTopic('story', e.target.value)}
                placeholder="Real-world analogy or story that makes this topic click"
              />
            </Field>

            <Field label="Memory Anchor" hint="Mnemonic or acronym">
              <textarea
                className={styles.textarea}
                rows={2}
                value={state.topic.memoryAnchor}
                onChange={e => setTopic('memoryAnchor', e.target.value)}
                placeholder="e.g. PECS: Producer Extends Consumer Super"
              />
            </Field>

            {!isConcept && <>
              <Field label="First Principles" hint="The core 'why' behind this topic">
                <textarea
                  className={styles.textarea}
                  rows={3}
                  value={state.topic.firstPrinciples}
                  onChange={e => setTopic('firstPrinciples', e.target.value)}
                  placeholder="What problem does this solve? What would code look like without it?"
                />
              </Field>
              <div className={styles.fieldRow}>
                <Field label="Brute Force Approach">
                  <textarea
                    className={styles.textarea}
                    rows={2}
                    value={state.topic.bruteForce}
                    onChange={e => setTopic('bruteForce', e.target.value)}
                    placeholder="The naive/unoptimized way"
                  />
                </Field>
                <Field label="Optimized Approach">
                  <textarea
                    className={styles.textarea}
                    rows={2}
                    value={state.topic.optimizedApproach}
                    onChange={e => setTopic('optimizedApproach', e.target.value)}
                    placeholder="The better solution + why"
                  />
                </Field>
              </div>
              <Field label="When To Use">
                <textarea
                  className={styles.textarea}
                  rows={2}
                  value={state.topic.whenToUse}
                  onChange={e => setTopic('whenToUse', e.target.value)}
                  placeholder="Scenarios where this concept is the right tool"
                />
              </Field>
            </>}
          </div>
        )}

        {/* ── EXAMPLES TAB ── */}
        {activeTab === 'examples' && (
          <div className={styles.builderCard}>
            {/* Example selector */}
            <div className={styles.itemSelector}>
              {state.topic.examples.map((ex, i) => (
                <button
                  key={i}
                  className={`${styles.itemTab} ${activeExIdx === i ? styles.itemTabActive : ''}`}
                  onClick={() => setActiveExIdx(i)}
                >
                  Ex {i + 1}{ex.title ? `: ${ex.title.slice(0, 18)}…` : ''}
                </button>
              ))}
              <button className={`${styles.itemTab} ${styles.addItemTab}`} onClick={addExample}>
                + Add
              </button>
            </div>

            {state.topic.examples[activeExIdx] && (() => {
              const ex = state.topic.examples[activeExIdx];
              const set = (k, v) => setExample(activeExIdx, k, v);
              return (
                <>
                  <div className={styles.fieldRow}>
                    <Field label={`Example ${activeExIdx + 1} Title`} required>
                      <input
                        className={styles.input}
                        value={ex.title}
                        onChange={e => set('title', e.target.value)}
                        placeholder="e.g. Basic Stream Pipeline"
                      />
                    </Field>
                    <Field label="Display Order">
                      <input
                        className={styles.input}
                        type="number"
                        min={1}
                        value={ex.displayOrder}
                        onChange={e => set('displayOrder', Number(e.target.value))}
                        style={{ width: 80 }}
                      />
                    </Field>
                  </div>

                  {codeLabel && (
                    <Field label={codeLabel} hint={isCode ? 'Java — compilable, runnable' : 'SQL query'}>
                      <textarea
                        className={styles.codeArea}
                        rows={8}
                        value={ex.code}
                        onChange={e => set('code', e.target.value)}
                        placeholder={isCode
                          ? 'public class Example {\n    public static void main(String[] args) {\n        // ...\n    }\n}'
                          : 'SELECT * FROM users WHERE ...'}
                        spellCheck={false}
                      />
                    </Field>
                  )}

                  {isCode && (
                    <>
                      <Field label="Pseudocode" hint="Language-agnostic steps">
                        <textarea
                          className={styles.textarea}
                          rows={3}
                          value={ex.pseudocode}
                          onChange={e => set('pseudocode', e.target.value)}
                          placeholder="FOR each element in stream:\n  FILTER if condition\n  MAP to transformed value\n  COLLECT to list"
                        />
                      </Field>
                      <Field label="Flowchart (Mermaid)" hint="graph TD / sequenceDiagram etc.">
                        <textarea
                          className={styles.codeArea}
                          rows={4}
                          value={ex.flowchartMermaid}
                          onChange={e => set('flowchartMermaid', e.target.value)}
                          placeholder={'graph TD\n    A[Source] --> B[Filter]\n    B --> C[Map]\n    C --> D[Collect]'}
                          spellCheck={false}
                        />
                      </Field>
                      <Field label="Tracer Steps (JSON array)" hint="Optional — [{line, lineCode, variables, phase, annotation}]">
                        <textarea
                          className={styles.codeArea}
                          rows={4}
                          value={ex.tracerSteps}
                          onChange={e => set('tracerSteps', e.target.value)}
                          placeholder='[{"line":1,"lineCode":"int x = 5;","variables":{"x":5},"phase":"ASSIGN","annotation":"x assigned 5"}]'
                          spellCheck={false}
                        />
                      </Field>
                    </>
                  )}

                  <Field label="Explanation" hint="What this example demonstrates">
                    <textarea
                      className={styles.textarea}
                      rows={3}
                      value={ex.explanation}
                      onChange={e => set('explanation', e.target.value)}
                      placeholder="Step-by-step walkthrough of what the code/query does"
                    />
                  </Field>

                  <Field label="Real-World Use" hint="Production scenario">
                    <textarea
                      className={styles.textarea}
                      rows={2}
                      value={ex.realWorldUse}
                      onChange={e => set('realWorldUse', e.target.value)}
                      placeholder="How this pattern appears in production code / frameworks"
                    />
                  </Field>

                  {state.topic.examples.length > 1 && (
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--red)', marginTop: 4 }}
                      onClick={() => removeExample(activeExIdx)}
                    >
                      🗑 Remove Example {activeExIdx + 1}
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* ── PROBLEMS TAB ── */}
        {activeTab === 'problems' && (
          <div className={styles.builderCard}>
            {/* Problem selector */}
            <div className={styles.itemSelector}>
              {state.topic.problems.map((p, i) => (
                <button
                  key={i}
                  className={`${styles.itemTab} ${activePrIdx === i ? styles.itemTabActive : ''}`}
                  onClick={() => setActivePrIdx(i)}
                >
                  <span className={styles[`diff${p.difficulty}`]}>{p.difficulty[0]}</span>
                  {' '}P{i + 1}{p.title ? `: ${p.title.slice(0, 15)}…` : ''}
                </button>
              ))}
              <button className={`${styles.itemTab} ${styles.addItemTab}`} onClick={addProblem}>
                + Add
              </button>
            </div>

            {state.topic.problems[activePrIdx] && (() => {
              const p = state.topic.problems[activePrIdx];
              const set = (k, v) => setProblem(activePrIdx, k, v);
              return (
                <>
                  <div className={styles.fieldRow}>
                    <Field label={`Problem ${activePrIdx + 1} Title`} required>
                      <input
                        className={styles.input}
                        value={p.title}
                        onChange={e => set('title', e.target.value)}
                        placeholder="e.g. Count Words with Stream"
                      />
                    </Field>
                    <Field label="Difficulty">
                      <select
                        className={styles.input}
                        value={p.difficulty}
                        onChange={e => set('difficulty', e.target.value)}
                      >
                        <option value="EASY">Easy</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HARD">Hard</option>
                      </select>
                    </Field>
                    <Field label="Display Order">
                      <input
                        className={styles.input}
                        type="number"
                        min={1}
                        value={p.displayOrder}
                        onChange={e => set('displayOrder', Number(e.target.value))}
                        style={{ width: 70 }}
                      />
                    </Field>
                  </div>

                  <div className={styles.fieldRow}>
                    <Field label="Pattern / Tag" hint="e.g. Two Pointers, BFS, GROUP BY">
                      <input
                        className={styles.input}
                        value={p.pattern}
                        onChange={e => set('pattern', e.target.value)}
                        placeholder="Algorithmic pattern or SQL clause"
                      />
                    </Field>
                    <Field label="Constraints">
                      <input
                        className={styles.input}
                        value={p.constraints}
                        onChange={e => set('constraints', e.target.value)}
                        placeholder="e.g. 1 ≤ n ≤ 10⁵, no built-in sort"
                      />
                    </Field>
                  </div>

                  <Field label="Description / Problem Statement" required>
                    <textarea
                      className={styles.textarea}
                      rows={5}
                      value={p.description}
                      onChange={e => set('description', e.target.value)}
                      placeholder={
                        isConcept
                          ? 'Scenario: Your company needs to... What AWS service would you choose?'
                          : 'Given a list of integers, write a method that...\n\nInput: ...\nOutput: ...\nExample: ...'
                      }
                    />
                  </Field>

                  {/* Hints */}
                  {[['hint1', 'Hint 1 (gentle nudge)'], ['hint2', 'Hint 2 (direction)'], ['hint3', 'Hint 3 (near-solution)']].map(([key, label]) => (
                    <Field key={key} label={label}>
                      <input
                        className={styles.input}
                        value={p[key]}
                        onChange={e => set(key, e.target.value)}
                        placeholder={label}
                      />
                    </Field>
                  ))}

                  {/* Code fields */}
                  {!isConcept && (
                    <>
                      <Field label={starterLabel} hint="Skeleton code the user starts with">
                        <textarea
                          className={styles.codeArea}
                          rows={6}
                          value={p.starterCode}
                          onChange={e => set('starterCode', e.target.value)}
                          placeholder={isSql
                            ? '-- Write your SQL query here\nSELECT ...\nFROM ...'
                            : 'public class Solution {\n    public int solve(int[] nums) {\n        // TODO\n        return 0;\n    }\n}'}
                          spellCheck={false}
                        />
                      </Field>
                      <Field label={solutionLabel} hint="Full correct solution">
                        <textarea
                          className={styles.codeArea}
                          rows={6}
                          value={p.solutionCode}
                          onChange={e => set('solutionCode', e.target.value)}
                          placeholder={isSql
                            ? 'SELECT u.name, COUNT(o.id) AS order_count\nFROM users u\nLEFT JOIN orders o ON u.id = o.user_id\nGROUP BY u.id\nORDER BY order_count DESC;'
                            : 'public class Solution {\n    public int solve(int[] nums) {\n        // solution\n    }\n}'}
                          spellCheck={false}
                        />
                      </Field>
                    </>
                  )}

                  {/* Test cases — code only */}
                  {isCode && (
                    <Field label="Test Cases">
                      {p.testCases.map((tc, ti) => (
                        <div key={ti} className={styles.testCaseRow}>
                          <input
                            className={styles.input}
                            value={tc.input}
                            onChange={e => setTestCase(activePrIdx, ti, 'input', e.target.value)}
                            placeholder="Input (stdin)"
                            style={{ flex: 1 }}
                          />
                          <input
                            className={styles.input}
                            value={tc.output}
                            onChange={e => setTestCase(activePrIdx, ti, 'output', e.target.value)}
                            placeholder="Expected output"
                            style={{ flex: 1 }}
                          />
                          {p.testCases.length > 1 && (
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{ color: 'var(--red)', padding: '4px 8px' }}
                              onClick={() => removeTestCase(activePrIdx, ti)}
                            >×</button>
                          )}
                        </div>
                      ))}
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ marginTop: 4 }}
                        onClick={() => addTestCase(activePrIdx)}
                      >+ Test Case</button>
                    </Field>
                  )}

                  {/* Answer — concept/AWS only */}
                  {isConcept && (
                    <Field label="Answer / Explanation" hint="Full conceptual answer">
                      <textarea
                        className={styles.textarea}
                        rows={5}
                        value={p.answer}
                        onChange={e => set('answer', e.target.value)}
                        placeholder="The correct answer and why. Include trade-offs if applicable."
                      />
                    </Field>
                  )}

                  <Field label="Editorial" hint="In-depth explanation after solving">
                    <textarea
                      className={styles.textarea}
                      rows={3}
                      value={p.editorial}
                      onChange={e => set('editorial', e.target.value)}
                      placeholder="Deep dive: why this solution, complexity analysis, edge cases"
                    />
                  </Field>

                  {state.topic.problems.length > 1 && (
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--red)', marginTop: 4 }}
                      onClick={() => removeProblem(activePrIdx)}
                    >
                      🗑 Remove Problem {activePrIdx + 1}
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* Reset button */}
        <button
          className="btn btn-ghost btn-sm"
          style={{ color: 'var(--text3)', marginTop: 4 }}
          onClick={handleReset}
        >
          ↺ Reset Builder
        </button>
      </div>

      {/* ── Right: JSON Preview ── */}
      <div className={styles.builderPreview}>
        <div className={styles.previewHeader}>
          <span className={styles.previewTitle}>JSON Preview</span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowPreview(p => !p)}
            >
              {showPreview ? '▾ Hide' : '▸ Show'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={handleCopy}>
              📋 Copy
            </button>
            <button className="btn btn-ghost btn-sm" onClick={handleDownload}>
              ⬇ .json
            </button>
            <button
              className="btn btn-primary btn-sm"
              disabled={importing}
              onClick={handleImport}
            >
              {importing ? <><span className="spinner" />Importing…</> : '↑ Import to DB'}
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className={styles.previewStats}>
          <span className={styles.previewStat}><b>{state.topic.examples.length}</b> examples</span>
          <span className={styles.previewStat}><b>{state.topic.problems.filter(p => p.difficulty === 'EASY').length}</b> Easy</span>
          <span className={styles.previewStat}><b>{state.topic.problems.filter(p => p.difficulty === 'MEDIUM').length}</b> Medium</span>
          <span className={styles.previewStat}><b>{state.topic.problems.filter(p => p.difficulty === 'HARD').length}</b> Hard</span>
          <span className={styles.previewStat} style={{ color: 'var(--text3)' }}>
            {(jsonOutput.length / 1024).toFixed(1)} KB
          </span>
        </div>

        {showPreview && (
          <pre className={styles.jsonPreview}>{jsonOutput}</pre>
        )}
      </div>
    </div>
  );
}

// ─── Field wrapper ─────────────────────────────────────────────────────────────
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
