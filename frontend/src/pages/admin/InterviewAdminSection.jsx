import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { interviewApi, QUERY_KEYS } from '../../api';
import { QUESTIONS } from '../interview/interviewData';
import toast from 'react-hot-toast';
import styles from './AdminPage.module.css';

const IQ_CATEGORIES = ['JAVA', 'ADVANCED_JAVA', 'DSA', 'SQL', 'SPRING_BOOT', 'HIBERNATE', 'AWS'];
const IQ_DIFFICULTIES = ['HIGH', 'MEDIUM'];

const CAT_LABEL = {
  JAVA:          'Java Core',
  ADVANCED_JAVA: 'Advanced Java',
  DSA:           'DSA',
  SQL:           'SQL',
  SPRING_BOOT:   'Spring Boot',
  HIBERNATE:     'Hibernate',
  AWS:           'AWS',
};

const CAT_COLOR = {
  JAVA:          '#f59e0b',
  ADVANCED_JAVA: '#8b5cf6',
  DSA:           '#10b981',
  SQL:           '#3b82f6',
  SPRING_BOOT:   '#22c55e',
  HIBERNATE:     '#14b8a6',
  AWS:           '#f97316',
};

// ── Batch Library — one entry per JSON file in /public/interview-batches/ ─────
const LIBRARY_BATCHES = [
  {
    id: 'iq-batch-05',
    name: 'Spring Boot Fundamentals',
    href: '/interview-batches/iq-batch-05-spring-boot-fundamentals.json',
    categories: ['SPRING_BOOT'],
    count: 20,
    description: 'IoC & DI, auto-configuration, bean scopes, profiles, Actuator, exception handling',
  },
  {
    id: 'iq-batch-06',
    name: 'Spring Boot Advanced + Hibernate',
    href: '/interview-batches/iq-batch-06-spring-hibernate-advanced.json',
    categories: ['SPRING_BOOT', 'HIBERNATE'],
    count: 40,
    description: '@Transactional & propagation, AOP, Spring Security, JPA lifecycle, N+1, second-level cache',
  },
  {
    id: 'iq-batch-07',
    name: 'Java Core Extended',
    href: '/interview-batches/iq-batch-07-java-core-extended.json',
    categories: ['JAVA'],
    count: 20,
    description: 'String pool, ClassLoader, design patterns (Strategy, Observer, Factory, Decorator), concurrency utils',
  },
  {
    id: 'iq-batch-08',
    name: 'Advanced Java Extended',
    href: '/interview-batches/iq-batch-08-advanced-java-extended.json',
    categories: ['ADVANCED_JAVA'],
    count: 20,
    description: 'Virtual threads, records, sealed classes, pattern matching, reactive (Mono/Flux), dynamic proxies',
  },
  {
    id: 'iq-batch-09',
    name: 'DSA Patterns Extended',
    href: '/interview-batches/iq-batch-09-dsa-extended.json',
    categories: ['DSA'],
    count: 25,
    description: 'Monotonic stack, Union-Find, Trie, Dijkstra, Bellman-Ford, LRU cache, Floyd cycle detection',
  },
  {
    id: 'iq-batch-10',
    name: 'SQL Advanced',
    href: '/interview-batches/iq-batch-10-sql-extended.json',
    categories: ['SQL'],
    count: 15,
    description: 'MVCC, InnoDB deadlocks, EXPLAIN plan, covering index, partitioning, phantom reads, sharding',
  },
  {
    id: 'iq-batch-11',
    name: 'AWS Advanced',
    href: '/interview-batches/iq-batch-11-aws-extended.json',
    categories: ['AWS'],
    count: 15,
    description: 'Auto Scaling, ALB vs NLB, ElastiCache Redis, Multi-AZ, CloudFront, Cognito, Step Functions',
  },
];

const DIFF_COLOR = {
  HIGH:   'var(--red)',
  MEDIUM: 'var(--yellow)',
};

const BLANK = {
  category: 'JAVA',
  difficulty: 'HIGH',
  question: '',
  quickAnswer: '',
  keyPoints: '',
  codeExample: '',
  displayOrder: 0,
};

/* ── Main exported section ──────────────────────────────────────────────────── */
export default function InterviewAdminSection() {
  const [tab, setTab] = useState('manage'); // manage | create | bulk | library | topicfiles | build

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>Interview Q&amp;A</span>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            ['manage',     '⚙ Manage'],
            ['create',     '+ New Question'],
            ['bulk',       '⬆ Paste JSON'],
            ['topicfiles', '📂 Topic Files'],
            ['library',    '📚 Batch Library'],
            ['build',      '🔨 Build Set'],
          ].map(([key, label]) => (
            <button
              key={key}
              className={`btn btn-sm ${tab === key ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setTab(key)}
            >{label}</button>
          ))}
        </div>
      </div>

      {tab === 'manage'     && <IQManagePanel onEdit={(q) => setTab('edit-' + q.id)} />}
      {tab === 'create'     && <IQFormPanel question={null} onDone={() => setTab('manage')} />}
      {tab === 'bulk'       && <IQBulkUploadPanel onDone={() => setTab('manage')} />}
      {tab === 'topicfiles' && <IQTopicFilesPanel />}
      {tab === 'library'    && <IQBatchLibraryPanel />}
      {tab === 'build'      && <IQBuildSetPanel />}
      {tab.startsWith('edit-') && (
        <IQEditWrapper
          id={parseInt(tab.replace('edit-', ''))}
          onDone={() => setTab('manage')}
        />
      )}
    </div>
  );
}

/* ── Topic Files panel (classpath:interviewquestions/) ───────────────────────── */
function IQTopicFilesPanel() {
  const qc = useQueryClient();
  const [importing, setImporting] = useState(null);
  const [results, setResults]     = useState({});

  const { data: files = [], isLoading } = useQuery({
    queryKey: ['iqTopicFiles'],
    queryFn:  () => interviewApi.getFiles(),
    staleTime: 60 * 1000,
  });

  async function handleImport(filename) {
    setImporting(filename);
    try {
      const res = await interviewApi.importFile(filename);
      setResults(prev => ({ ...prev, [filename]: res }));
      qc.invalidateQueries({ queryKey: QUERY_KEYS.interviewQuestions });
      toast.success(`${filename}: imported ${res.imported}, skipped ${res.skipped}`);
    } catch (e) {
      toast.error(`Failed to import ${filename}`);
    } finally {
      setImporting(null);
    }
  }

  async function handleImportAll() {
    for (const f of files) {
      await handleImport(f.filename);
    }
  }

  const FILE_LABELS = {
    'iq-java-topics.json':     { label: 'Java Core',       color: '#f59e0b', icon: '☕' },
    'iq-adv-java-topics.json': { label: 'Advanced Java',   color: '#8b5cf6', icon: '⚡' },
    'iq-dsa-topics.json':      { label: 'DSA',             color: '#10b981', icon: '🌳' },
    'iq-sql-topics.json':      { label: 'MySQL / SQL',     color: '#3b82f6', icon: '🗄' },
    'iq-spring-topics.json':   { label: 'Spring Boot',     color: '#22c55e', icon: '🍃' },
    'iq-sysdesign-topics.json':{ label: 'System Design',   color: '#f472b6', icon: '🏗' },
    'iq-aws-topics.json':      { label: 'AWS',             color: '#f97316', icon: '☁' },
  };

  return (
    <div style={{ padding: '16px 0' }}>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
            Topic-Specific Q&A Files
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>
            Topic-tagged interview questions stored in backend resources. Importing skips duplicates.
          </div>
        </div>
        {files.length > 0 && (
          <button
            className="btn btn-sm btn-primary"
            onClick={handleImportAll}
            disabled={importing !== null}
          >
            Import All
          </button>
        )}
      </div>

      {isLoading && (
        <div style={{ color: 'var(--text3)', fontSize: 13 }}>Loading files…</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {files.map(f => {
          const meta   = FILE_LABELS[f.filename] || { label: f.filename, color: '#94a3b8', icon: '📄' };
          const result = results[f.filename];
          return (
            <div key={f.filename} className={styles.iqFileRow}>
              <span style={{ fontSize: 20 }}>{meta.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                  <span style={{ color: meta.color }}>{meta.label}</span>
                  <span style={{ color: 'var(--text3)', fontWeight: 400, marginLeft: 6 }}>
                    ({f.filename})
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                  {f.count} questions · {f.topics.length} topics
                  {f.topics.length > 0 && `: ${f.topics.slice(0, 3).join(', ')}${f.topics.length > 3 ? ` +${f.topics.length - 3} more` : ''}`}
                </div>
                {result && (
                  <div style={{ fontSize: 11, color: '#4ade80', marginTop: 2 }}>
                    ✓ Imported {result.imported} · Skipped {result.skipped}
                  </div>
                )}
              </div>
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => handleImport(f.filename)}
                disabled={importing === f.filename}
              >
                {importing === f.filename ? 'Importing…' : result ? 'Re-import' : 'Import'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Manage panel ───────────────────────────────────────────────────────────── */
function IQManagePanel({ onEdit }) {
  const qc = useQueryClient();
  const [search, setSearch]         = useState('');
  const [catFilter, setCat]         = useState('ALL');
  const [diffFilter, setDiff]       = useState('ALL');
  const [deleting, setDeleting]     = useState(null);   // question id being deleted
  const [confirmingId, setConfirmingId] = useState(null); // id awaiting confirm
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [deletingAll, setDeletingAll]   = useState(false);
  const [importing, setImporting]   = useState(false);
  const [jsonPreview, setJsonPreview] = useState(null);

  const { data: questions = [], isLoading, refetch } = useQuery({
    queryKey: QUERY_KEYS.interviewQuestions,
    queryFn:  () => interviewApi.getAll(),
    staleTime: 30_000,
  });

  async function handleDelete(q) {
    // First click → show inline confirm; second click → actually delete
    if (confirmingId !== q.id) { setConfirmingId(q.id); return; }
    setConfirmingId(null);
    setDeleting(q.id);
    try {
      await interviewApi.delete(q.id);
      toast.success('Question deleted');
      qc.invalidateQueries({ queryKey: QUERY_KEYS.interviewQuestions });
    } catch {
      toast.error('Delete failed');
    } finally { setDeleting(null); }
  }

  async function handleDeleteAll() {
    setDeletingAll(true);
    try {
      const res = await interviewApi.deleteAll();
      toast.success(`Deleted ${res.deleted} questions`);
      qc.invalidateQueries({ queryKey: QUERY_KEYS.interviewQuestions });
      setConfirmDeleteAll(false);
    } catch {
      toast.error('Delete all failed');
    } finally { setDeletingAll(false); }
  }

  async function handleImportDefaults() {
    if (questions.length > 0) {
      if (!window.confirm(`Import ${QUESTIONS.length} default questions? They will be added on top of the ${questions.length} already in the database.`)) return;
    }
    setImporting(true);
    try {
      // Map static data format to entity format
      const payload = QUESTIONS.map((q, i) => ({
        category:     q.category,
        difficulty:   q.difficulty === 'HIGH' ? 'HIGH' : 'MEDIUM',
        question:     q.question,
        quickAnswer:  q.quickAnswer,
        keyPoints:    JSON.stringify(q.keyPoints || []),
        codeExample:  q.codeExample || null,
        displayOrder: i,
      }));
      const res = await interviewApi.bulkImport(payload);
      toast.success(`Imported ${res.imported} questions`);
      qc.invalidateQueries({ queryKey: QUERY_KEYS.interviewQuestions });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed');
    } finally { setImporting(false); }
  }

  const filtered = questions.filter(q => {
    if (catFilter !== 'ALL' && q.category !== catFilter) return false;
    if (diffFilter !== 'ALL' && q.difficulty !== diffFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!q.question.toLowerCase().includes(s) && !q.quickAnswer?.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  return (
    <>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <input
          className="input"
          style={{ flex: 1, minWidth: 200, maxWidth: 320 }}
          placeholder="🔍 Search questions…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="input" style={{ width: 'auto' }} value={catFilter} onChange={e => setCat(e.target.value)}>
          <option value="ALL">All Categories</option>
          {IQ_CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
        </select>
        <select className="input" style={{ width: 'auto' }} value={diffFilter} onChange={e => setDiff(e.target.value)}>
          <option value="ALL">All Priorities</option>
          <option value="HIGH">High Priority</option>
          <option value="MEDIUM">Good to Know</option>
        </select>
        <span style={{ fontSize: 12, color: 'var(--text3)', whiteSpace: 'nowrap' }}>
          {filtered.length} / {questions.length}
        </span>
        <button className="btn btn-ghost btn-sm" onClick={refetch}>↻</button>
        <button
          className="btn btn-primary btn-sm"
          disabled={importing}
          onClick={handleImportDefaults}
        >
          {importing ? <><span className="spinner" />Importing…</> : '⬇ Import Defaults'}
        </button>
        {questions.length > 0 && !confirmDeleteAll && (
          <button className="btn btn-danger btn-sm" onClick={() => setConfirmDeleteAll(true)}>🗑 Delete All</button>
        )}
        {confirmDeleteAll && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(248,113,113,.12)', border: '1px solid rgba(248,113,113,.4)', borderRadius: 8, padding: '4px 10px' }}>
            <span style={{ fontSize: 12, color: '#f87171', fontWeight: 600 }}>Delete all {questions.length} questions?</span>
            <button className="btn btn-danger btn-sm" disabled={deletingAll} onClick={handleDeleteAll}>
              {deletingAll ? <span className="spinner" /> : 'Yes, delete all'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDeleteAll(false)}>Cancel</button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className={styles.loading}><span className="spinner" />Loading questions…</div>
      ) : questions.length === 0 ? (
        <EmptyHint text="No interview questions yet. Click «Import Defaults» to load the built-in set, or use «+ New Question» to add one manually." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.map(q => (
            <div key={q.id} style={{
              display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 10,
              padding: '10px 14px',
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
            }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', lineHeight: 1.4 }}>
                  {q.question}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{
                    background: CAT_COLOR[q.category] + '22',
                    color: CAT_COLOR[q.category],
                    padding: '1px 7px', borderRadius: 4, fontWeight: 600, fontSize: 10,
                  }}>
                    {CAT_LABEL[q.category] || q.category}
                  </span>
                  <span style={{ color: DIFF_COLOR[q.difficulty], fontWeight: 600 }}>
                    {q.difficulty === 'HIGH' ? 'High Priority' : 'Good to Know'}
                  </span>
                  {q.displayOrder > 0 && (
                    <span style={{ color: 'var(--text3)' }}>order: {q.displayOrder}</span>
                  )}
                </div>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                style={{ flexShrink: 0, fontFamily: 'monospace' }}
                title="View / Edit as JSON"
                onClick={() => setJsonPreview(jsonPreview?.id === q.id ? null : q)}
              >
                {'{ }'}
              </button>
              <button className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }} onClick={() => { setConfirmingId(null); onEdit(q); }}>✏ Edit</button>
              {confirmingId === q.id ? (
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <button
                    className="btn btn-danger btn-sm"
                    style={{ flexShrink: 0, fontSize: 11 }}
                    disabled={deleting === q.id}
                    onClick={() => handleDelete(q)}
                  >
                    {deleting === q.id ? <span className="spinner" /> : 'Confirm'}
                  </button>
                  <button className="btn btn-ghost btn-sm" style={{ flexShrink: 0, fontSize: 11 }} onClick={() => setConfirmingId(null)}>✕</button>
                </div>
              ) : (
                <button
                  className="btn btn-danger btn-sm"
                  style={{ flexShrink: 0 }}
                  disabled={deleting === q.id}
                  onClick={() => handleDelete(q)}
                >
                  🗑
                </button>
              )}
              {/* Inline JSON editor — full width below the row */}
              {jsonPreview?.id === q.id && (
                <div style={{ width: '100%' }}>
                  <JsonInlineEditor
                    question={q}
                    onClose={() => setJsonPreview(null)}
                    onSaved={() => {
                      setJsonPreview(null);
                      qc.invalidateQueries({ queryKey: QUERY_KEYS.interviewQuestions });
                    }}
                  />
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
              No questions match the current filter.
            </div>
          )}
        </div>
      )}
    </>
  );
}

/* ── Edit wrapper ───────────────────────────────────────────────────────────── */
function IQEditWrapper({ id, onDone }) {
  const { data: questions = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.interviewQuestions,
    queryFn:  () => interviewApi.getAll(),
    staleTime: 60_000,
  });
  const q = questions.find(q => q.id === id);
  if (isLoading) return <div className={styles.loading}><span className="spinner" />Loading…</div>;
  if (!q) return <div style={{ color: 'var(--red)', padding: 20 }}>Question not found</div>;
  return <IQFormPanel question={q} onDone={onDone} />;
}

/* ── Create / Edit form ─────────────────────────────────────────────────────── */
function IQFormPanel({ question, onDone }) {
  const qc    = useQueryClient();
  const isNew = !question;

  // keyPoints is stored as JSON array string in DB; convert to one-per-line for editing
  const kpToText = (kp) => {
    if (!kp) return '';
    try { return JSON.parse(kp).join('\n'); } catch { return kp; }
  };

  const [form, setForm] = useState(
    isNew
      ? { ...BLANK }
      : {
          category:     question.category,
          difficulty:   question.difficulty,
          question:     question.question,
          quickAnswer:  question.quickAnswer,
          keyPoints:    kpToText(question.keyPoints),
          codeExample:  question.codeExample || '',
          displayOrder: question.displayOrder ?? 0,
        }
  );
  const [saving, setSaving] = useState(false);

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  async function handleSave() {
    if (!form.question.trim())    { toast.error('Question is required');     return; }
    if (!form.quickAnswer.trim()) { toast.error('Quick Answer is required'); return; }

    // Convert one-per-line keyPoints to JSON array
    const kpArray = form.keyPoints
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);

    const payload = {
      ...form,
      keyPoints:    JSON.stringify(kpArray),
      codeExample:  form.codeExample.trim() || null,
      displayOrder: parseInt(form.displayOrder) || 0,
    };

    setSaving(true);
    try {
      if (isNew) {
        await interviewApi.create(payload);
        toast.success('Question created');
      } else {
        await interviewApi.update(question.id, payload);
        toast.success('Question updated');
      }
      qc.invalidateQueries({ queryKey: QUERY_KEYS.interviewQuestions });
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
        <Field label="Category" required>
          <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
            {IQ_CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
          </select>
        </Field>
        <Field label="Priority" required>
          <select className="input" value={form.difficulty} onChange={e => set('difficulty', e.target.value)}>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Good to Know</option>
          </select>
        </Field>
        <Field label="Display Order" hint="lower = first">
          <input
            className="input"
            type="number"
            value={form.displayOrder}
            onChange={e => set('displayOrder', e.target.value)}
          />
        </Field>
      </div>

      <TAField
        label="Question"
        required
        value={form.question}
        onChange={v => set('question', v)}
        rows={3}
        placeholder="What is the difference between HashMap and TreeMap?"
      />

      <TAField
        label="Quick Answer — 2-4 sentences visible immediately"
        required
        value={form.quickAnswer}
        onChange={v => set('quickAnswer', v)}
        rows={5}
        placeholder="HashMap uses a hash table for O(1) average-case lookups and has no ordering guarantee. TreeMap uses a Red-Black tree for O(log n) operations and keeps keys in sorted order. Use HashMap when order doesn't matter; use TreeMap when you need sorted keys or range queries."
      />

      <TAField
        label="Key Points — one per line (bullet details shown after reveal)"
        value={form.keyPoints}
        onChange={v => set('keyPoints', v)}
        rows={6}
        placeholder={`HashMap: O(1) average, null keys allowed\nTreeMap: O(log n), no null keys, sorted by Comparable/Comparator\nLinkedHashMap: insertion-order or access-order iteration`}
      />

      <TAField
        label="Code Example — optional, shown in monospace block"
        value={form.codeExample}
        onChange={v => set('codeExample', v)}
        rows={8}
        mono
        placeholder={`Map<String, Integer> hash = new HashMap<>();\nMap<String, Integer> tree = new TreeMap<>();\n\nhash.put("b", 2); hash.put("a", 1);\ntree.put("b", 2); tree.put("a", 1);\n\nSystem.out.println(hash.keySet()); // [b, a] — unordered\nSystem.out.println(tree.keySet()); // [a, b] — sorted`}
      />

      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button className="btn btn-primary" disabled={saving} onClick={handleSave}>
          {saving
            ? <><span className="spinner" />{isNew ? 'Creating…' : 'Saving…'}</>
            : isNew ? '✅ Create Question' : '✅ Save Changes'}
        </button>
        <button className="btn btn-ghost" onClick={onDone}>Cancel</button>
      </div>
    </div>
  );
}

/* ── Bulk Upload (paste / file) ─────────────────────────────────────────────── */
function IQBulkUploadPanel({ onDone }) {
  const qc = useQueryClient();
  const [json, setJson]     = useState('');
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState(null);

  function normalise(raw) {
    const list = Array.isArray(raw) ? raw : raw?.questions;
    if (!Array.isArray(list)) throw new Error('Expected a JSON array or { questions: [...] }');
    return list.map((item, i) => {
      const keyPoints = Array.isArray(item.keyPoints)
        ? JSON.stringify(item.keyPoints.filter(Boolean))
        : (() => {
            if (typeof item.keyPoints === 'string') {
              const t = item.keyPoints.trim();
              if (!t) return JSON.stringify([]);
              if (t.startsWith('[')) return t;
              return JSON.stringify(t.split('\n').map(l => l.trim()).filter(Boolean));
            }
            return JSON.stringify([]);
          })();
      return {
        category:     item.category,
        difficulty:   item.difficulty || 'MEDIUM',
        question:     item.question,
        quickAnswer:  item.quickAnswer,
        keyPoints,
        codeExample:  item.codeExample || null,
        displayOrder: Number.isFinite(Number(item.displayOrder)) ? Number(item.displayOrder) : i,
      };
    });
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setJson(await file.text());
    setSummary(null);
  }

  async function handleImport() {
    let parsed;
    try { parsed = JSON.parse(json); } catch { toast.error('Invalid JSON'); return; }
    let payload;
    try { payload = normalise(parsed); } catch (err) { toast.error(err.message); return; }
    if (!payload.length) { toast.error('No questions found'); return; }

    setSaving(true); setSummary(null);
    try {
      const res = await interviewApi.bulkImport(payload);
      setSummary({ count: payload.length, ...res });
      toast.success(`Imported ${res.imported} questions${res.skipped ? `, skipped ${res.skipped}` : ''}`);
      qc.invalidateQueries({ queryKey: QUERY_KEYS.interviewQuestions });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk import failed');
    } finally { setSaving(false); }
  }

  const SAMPLE = JSON.stringify({
    batchName: 'my-batch',
    questions: [{
      category: 'SPRING_BOOT', difficulty: 'HIGH',
      question: 'What is @Transactional?',
      quickAnswer: 'Spring wraps the method in a proxy that opens a transaction before invocation and commits (or rolls back) on exit.',
      keyPoints: ['Proxy-based — only works on public methods called from outside the bean', 'Default rollback on RuntimeException; checked exceptions do NOT rollback', 'Propagation.REQUIRED is the default'],
      codeExample: '@Transactional\npublic void transfer(Long from, Long to, BigDecimal amount) { ... }',
      displayOrder: 0,
    }],
  }, null, 2);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input type="file" accept=".json,application/json" onChange={handleFileChange} />
        <button className="btn btn-ghost btn-sm" onClick={() => { setJson(SAMPLE); setSummary(null); }}>Load Sample</button>
        <button className="btn btn-ghost btn-sm" onClick={() => { setJson(''); setSummary(null); }}>Clear</button>
      </div>
      <div style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg2)', fontSize: 12, color: 'var(--text2)', lineHeight: 1.7 }}>
        Paste a raw JSON array <code>[ ... ]</code> or an object <code>{'{ "batchName": "...", "questions": [...] }'}</code>.
        Duplicate questions (same category + question text) are skipped automatically.
      </div>
      <textarea
        className={styles.jsonInput}
        rows={22}
        value={json}
        onChange={e => setJson(e.target.value)}
        placeholder={SAMPLE}
      />
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-primary" disabled={saving || !json.trim()} onClick={handleImport}>
          {saving ? <><span className="spinner" />Importing…</> : '⬆ Import'}
        </button>
        <button className="btn btn-ghost" onClick={onDone}>Done</button>
      </div>
      {summary && (
        <div className={styles.resultBox} style={{ marginTop: 4 }}>
          Received {summary.count} question{summary.count !== 1 ? 's' : ''}. Imported {summary.imported}, skipped {summary.skipped}.
        </div>
      )}
    </div>
  );
}

/* ── Batch Library ───────────────────────────────────────────────────────────── */
function IQBatchLibraryPanel() {
  const qc = useQueryClient();
  const [states, setStates] = useState({}); // { [batchId]: { status, result, error } }

  function setStatus(id, status, extra = {}) {
    setStates(s => ({ ...s, [id]: { status, ...extra } }));
  }

  function normalise(raw) {
    const list = Array.isArray(raw) ? raw : raw?.questions;
    if (!Array.isArray(list)) throw new Error('Unexpected batch format');
    return list.map((item, i) => {
      const keyPoints = Array.isArray(item.keyPoints)
        ? JSON.stringify(item.keyPoints.filter(Boolean))
        : (() => {
            if (typeof item.keyPoints === 'string') {
              const t = item.keyPoints.trim();
              if (!t) return JSON.stringify([]);
              if (t.startsWith('[')) return t;
              return JSON.stringify(t.split('\n').map(l => l.trim()).filter(Boolean));
            }
            return JSON.stringify([]);
          })();
      return {
        category:     item.category,
        difficulty:   item.difficulty || 'MEDIUM',
        question:     item.question,
        quickAnswer:  item.quickAnswer,
        keyPoints,
        codeExample:  item.codeExample || null,
        displayOrder: Number.isFinite(Number(item.displayOrder)) ? Number(item.displayOrder) : i,
      };
    });
  }

  async function handleImport(batch) {
    setStatus(batch.id, 'loading');
    try {
      const res = await fetch(batch.href);
      if (!res.ok) throw new Error(`File not found (${res.status}) — batch not created yet`);
      const payload = normalise(await res.json());
      const result  = await interviewApi.bulkImport(payload);
      setStatus(batch.id, 'done', { result });
      toast.success(`${batch.name}: ${result.imported} imported`);
      qc.invalidateQueries({ queryKey: QUERY_KEYS.interviewQuestions });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Import failed';
      setStatus(batch.id, 'error', { error: msg });
      toast.error(`${batch.name}: ${msg}`);
    }
  }

  async function handleImportAll() {
    for (const batch of LIBRARY_BATCHES) {
      await handleImport(batch);
    }
  }

  const totalQ = LIBRARY_BATCHES.reduce((s, b) => s + b.count, 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ color: 'var(--text2)', fontSize: 13 }}>
          {totalQ} questions across {LIBRARY_BATCHES.length} batches. Duplicate imports are safe — backend skips existing questions.
        </span>
        <button className="btn btn-primary btn-sm" onClick={handleImportAll}>
          ⬇ Import All Batches
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {LIBRARY_BATCHES.map(batch => {
          const st = states[batch.id];
          const isLoading = st?.status === 'loading';
          const isDone    = st?.status === 'done';
          const isError   = st?.status === 'error';

          return (
            <div
              key={batch.id}
              style={{
                border: `1px solid ${isDone ? 'var(--green)' : isError ? 'var(--red)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
                background: 'var(--bg2)',
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', lineHeight: 1.3 }}>{batch.name}</div>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', background: 'var(--bg3)', borderRadius: 4, padding: '2px 7px', flexShrink: 0 }}>
                  {batch.count} Q
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>{batch.description}</div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {batch.categories.map(cat => (
                  <span key={cat} style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                    background: (CAT_COLOR[cat] || '#888') + '22',
                    color: CAT_COLOR[cat] || '#888',
                  }}>
                    {CAT_LABEL[cat] || cat}
                  </span>
                ))}
              </div>
              {isDone && (
                <div style={{ fontSize: 12, color: 'var(--green)' }}>
                  ✓ {st.result.imported} imported, {st.result.skipped} skipped
                </div>
              )}
              {isError && (
                <div style={{ fontSize: 12, color: 'var(--red)' }}>✕ {st.error}</div>
              )}
              <button
                className={`btn btn-sm ${isDone ? 'btn-ghost' : 'btn-primary'}`}
                style={{ marginTop: 'auto' }}
                disabled={isLoading}
                onClick={() => handleImport(batch)}
              >
                {isLoading
                  ? <><span className="spinner" /> Importing…</>
                  : isDone ? '↻ Re-import' : '⬇ Import Batch'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Inline JSON editor (expand below a question row) ───────────────────────── */
function JsonInlineEditor({ question, onClose, onSaved }) {
  // Build the editable JSON object (keyPoints as parsed array)
  function toEditableObj(q) {
    let kp = [];
    try { kp = JSON.parse(q.keyPoints || '[]'); } catch { kp = []; }
    return {
      category:     q.category,
      difficulty:   q.difficulty,
      question:     q.question,
      quickAnswer:  q.quickAnswer,
      keyPoints:    kp,
      codeExample:  q.codeExample || null,
      displayOrder: q.displayOrder ?? 0,
    };
  }

  const [raw, setRaw]     = useState(() => JSON.stringify(toEditableObj(question), null, 2));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function handleChange(val) {
    setRaw(val);
    try { JSON.parse(val); setError(''); }
    catch (e) { setError(e.message); }
  }

  async function handleSave() {
    let obj;
    try { obj = JSON.parse(raw); }
    catch (e) { setError(e.message); return; }

    const payload = {
      ...obj,
      keyPoints: Array.isArray(obj.keyPoints)
        ? JSON.stringify(obj.keyPoints)
        : typeof obj.keyPoints === 'string' && obj.keyPoints.startsWith('[')
          ? obj.keyPoints
          : JSON.stringify([]),
      codeExample: obj.codeExample || null,
    };

    setSaving(true);
    try {
      await interviewApi.update(question.id, payload);
      toast.success('Question updated via JSON');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  }

  function handleCopy() {
    navigator.clipboard.writeText(raw);
    toast.success('JSON copied');
  }

  return (
    <div style={{
      width: '100%',
      marginTop: 10,
      background: 'var(--bg3)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: 14,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>
          JSON Editor — ID #{question.id}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-ghost btn-sm" onClick={handleCopy}>📋 Copy</button>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕ Close</button>
        </div>
      </div>
      <textarea
        className={styles.jsonInput}
        rows={18}
        value={raw}
        onChange={e => handleChange(e.target.value)}
        spellCheck={false}
        style={{ width: '100%' }}
      />
      {error && (
        <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 4, fontFamily: 'monospace' }}>
          JSON error: {error}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button
          className="btn btn-primary btn-sm"
          disabled={!!error || saving}
          onClick={handleSave}
        >
          {saving ? <><span className="spinner" />Saving…</> : '✅ Save JSON'}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

/* ── Build Set panel ─────────────────────────────────────────────────────────── */
function IQBuildSetPanel() {
  const { data: questions = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.interviewQuestions,
    queryFn:  () => interviewApi.getAll(),
    staleTime: 30_000,
  });

  const [setName, setSetName]   = useState('my-interview-set');
  const [catFilter, setCat]     = useState('ALL');
  const [diffFilter, setDiff]   = useState('ALL');
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState(new Set());
  const [showJson, setShowJson] = useState(false);

  const filtered = questions.filter(q => {
    if (catFilter !== 'ALL' && q.category !== catFilter) return false;
    if (diffFilter !== 'ALL' && q.difficulty !== diffFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!q.question.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(filtered.map(q => q.id)));
  }

  function clearAll() {
    setSelected(new Set());
  }

  function buildJson() {
    const selectedQs = questions.filter(q => selected.has(q.id));
    const payload = {
      batchName: setName || 'my-interview-set',
      questions: selectedQs.map(q => {
        let kp = [];
        try { kp = JSON.parse(q.keyPoints || '[]'); } catch { kp = []; }
        return {
          category:     q.category,
          difficulty:   q.difficulty,
          question:     q.question,
          quickAnswer:  q.quickAnswer,
          keyPoints:    kp,
          codeExample:  q.codeExample || null,
          displayOrder: q.displayOrder ?? 0,
        };
      }),
    };
    return JSON.stringify(payload, null, 2);
  }

  function handleCopy() {
    navigator.clipboard.writeText(buildJson());
    toast.success(`Copied ${selected.size} questions as JSON`);
  }

  function handleDownload() {
    const blob = new Blob([buildJson()], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${setName || 'interview-set'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${setName}.json`);
  }

  const json = showJson ? buildJson() : '';

  if (isLoading) return <div className={styles.loading}><span className="spinner" />Loading questions…</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Set name */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>
            Set / Batch Name
          </label>
          <input
            className="input"
            style={{ width: 240 }}
            value={setName}
            onChange={e => setSetName(e.target.value.trim().replace(/\s+/g, '-').toLowerCase())}
            placeholder="my-interview-set"
          />
        </div>
        <div style={{ marginTop: 18, display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: selected.size > 0 ? 'var(--primary)' : 'var(--text3)', fontWeight: 600 }}>
            {selected.size} selected
          </span>
          {selected.size > 0 && (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowJson(v => !v)}>
                {showJson ? 'Hide JSON' : '{ } Preview JSON'}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={handleCopy}>📋 Copy JSON</button>
              <button className="btn btn-primary btn-sm" onClick={handleDownload}>⬇ Download .json</button>
            </>
          )}
        </div>
      </div>

      {/* JSON preview */}
      {showJson && selected.size > 0 && (
        <textarea
          className={styles.jsonInput}
          rows={16}
          value={json}
          readOnly
          style={{ width: '100%' }}
        />
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="input"
          style={{ flex: 1, minWidth: 180, maxWidth: 280 }}
          placeholder="🔍 Filter questions…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="input" style={{ width: 'auto' }} value={catFilter} onChange={e => setCat(e.target.value)}>
          <option value="ALL">All Categories</option>
          {IQ_CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
        </select>
        <select className="input" style={{ width: 'auto' }} value={diffFilter} onChange={e => setDiff(e.target.value)}>
          <option value="ALL">All Priorities</option>
          <option value="HIGH">High Priority</option>
          <option value="MEDIUM">Good to Know</option>
        </select>
        <button className="btn btn-ghost btn-sm" onClick={selectAll}>Select All ({filtered.length})</button>
        {selected.size > 0 && <button className="btn btn-ghost btn-sm" onClick={clearAll}>Clear</button>}
      </div>

      {/* Question checklist */}
      {questions.length === 0 ? (
        <EmptyHint text="No questions yet. Import some first via Paste JSON or Batch Library." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 520, overflowY: 'auto' }}>
          {filtered.map(q => {
            const isChecked = selected.has(q.id);
            return (
              <label
                key={q.id}
                style={{
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                  padding: '9px 12px',
                  background: isChecked ? 'var(--primary)11' : 'var(--bg2)',
                  border: `1px solid ${isChecked ? 'var(--primary)44' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleSelect(q.id)}
                  style={{ marginTop: 2, flexShrink: 0, accentColor: 'var(--primary)' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: isChecked ? 600 : 400, color: 'var(--text)', lineHeight: 1.4 }}>
                    {q.question}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', display: 'flex', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                    <span style={{
                      background: (CAT_COLOR[q.category] || '#888') + '22',
                      color: CAT_COLOR[q.category] || '#888',
                      padding: '1px 6px', borderRadius: 4, fontWeight: 600, fontSize: 10,
                    }}>
                      {CAT_LABEL[q.category] || q.category}
                    </span>
                    <span style={{ color: DIFF_COLOR[q.difficulty], fontWeight: 600 }}>
                      {q.difficulty === 'HIGH' ? 'High Priority' : 'Good to Know'}
                    </span>
                  </div>
                </div>
              </label>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
              No questions match the current filter.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Small helpers ──────────────────────────────────────────────────────────── */
function Field({ label, hint, required, children, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 2, ...style }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>
        {label}{required && <span style={{ color: 'var(--red)', marginLeft: 3 }}>*</span>}
        {hint && <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: 'var(--text3)', opacity: .7 }}>{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function TAField({ label, required, hint, value, onChange, rows = 4, placeholder, mono }) {
  return (
    <Field label={label} required={required} hint={hint} style={{ marginBottom: 10 }}>
      <textarea
        className={styles.jsonInput}
        style={mono ? {} : { fontFamily: 'var(--font-ui)', fontSize: 13 }}
        rows={rows}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </Field>
  );
}

function EmptyHint({ text }) {
  return (
    <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
      📭 {text}
    </div>
  );
}
