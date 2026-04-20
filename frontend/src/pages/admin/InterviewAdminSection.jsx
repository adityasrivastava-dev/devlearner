import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { interviewApi, QUERY_KEYS } from '../../api';
import { QUESTIONS } from '../interview/interviewData';
import toast from 'react-hot-toast';
import styles from './AdminPage.module.css';

const IQ_CATEGORIES = ['JAVA', 'ADVANCED_JAVA', 'DSA', 'SQL', 'SPRING_BOOT', 'HIBERNATE', 'AWS', 'BEHAVIORAL', 'SYSTEM_DESIGN'];
const IQ_DIFFICULTIES = ['HIGH', 'MEDIUM'];

const CAT_LABEL = {
  JAVA:          'Java Core',
  ADVANCED_JAVA: 'Advanced Java',
  DSA:           'DSA',
  SQL:           'SQL',
  SPRING_BOOT:   'Spring Boot',
  HIBERNATE:     'Hibernate',
  AWS:           'AWS',
  BEHAVIORAL:    'Behavioral',
  SYSTEM_DESIGN: 'System Design',
};

const CAT_COLOR = {
  JAVA:          '#f59e0b',
  ADVANCED_JAVA: '#8b5cf6',
  DSA:           '#10b981',
  SQL:           '#3b82f6',
  SPRING_BOOT:   '#22c55e',
  HIBERNATE:     '#14b8a6',
  AWS:           '#f97316',
  BEHAVIORAL:    '#8b5cf6',
  SYSTEM_DESIGN: '#06b6d4',
};


const DIFF_COLOR = {
  HIGH:   'var(--red)',
  MEDIUM: 'var(--yellow)',
};

const BLANK = {
  category:  'JAVA',
  difficulty: 'HIGH',
  question: '',
  quickAnswer: '',
  keyPoints: '',
  codeExample: '',
  followUpQuestions: '',
  spokenAnswer: '',
  commonMistakes: '',
  companiesAskThis: '',
  seniorExpectation: '',
  timeToAnswer: '',
  relatedTopics: '',
  tags: '',
  displayOrder: 0,
};

/* ── Main exported section ──────────────────────────────────────────────────── */
export default function InterviewAdminSection() {
  const [tab, setTab] = useState('manage');

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>Interview Q&amp;A</span>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            ['manage',     '⚙ Manage'],
            ['create',     '+ New Question'],
            ['bulk',       '⬆ Paste JSON'],
            ['topicfiles', '📂 Import Files'],
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
      {tab.startsWith('edit-') && (
        <IQEditWrapper
          id={parseInt(tab.replace('edit-', ''))}
          onDone={() => setTab('manage')}
        />
      )}
    </div>
  );
}

/* ── Import Files panel — fully dynamic from classpath:interviewquestions/ ──── */
function labelFromFilename(filename) {
  return filename
    .replace(/\.json$/, '')
    .replace(/^iq-(batch-\d+-)?/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function IQTopicFilesPanel() {
  const qc = useQueryClient();
  const [importing, setImporting] = useState(null);
  const [results, setResults]     = useState({});

  const { data: files = [], isLoading, refetch } = useQuery({
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
      toast.success(`Imported ${res.imported}, skipped ${res.skipped}`);
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Import failed';
      toast.error(`${filename}: ${msg}`);
    } finally {
      setImporting(null);
    }
  }

  async function handleImportAll() {
    for (const f of files) {
      await handleImport(f.filename);
    }
  }

  const totalQ = files.reduce((s, f) => s + (f.count || 0), 0);

  return (
    <div style={{ padding: '16px 0' }}>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
            Interview Question Files
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>
            {files.length} files · {totalQ} questions in <code>resources/interviewquestions/</code>. Importing skips duplicates.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-sm btn-ghost" onClick={() => refetch()} disabled={isLoading}>↻ Refresh</button>
          {files.length > 0 && (
            <button className="btn btn-sm btn-primary" onClick={handleImportAll} disabled={importing !== null}>
              ⬇ Import All
            </button>
          )}
        </div>
      </div>

      {isLoading && <div style={{ color: 'var(--text3)', fontSize: 13 }}>Loading files…</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {files.map(f => {
          const result = results[f.filename];
          return (
            <div key={f.filename} className={styles.iqFileRow}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                  {labelFromFilename(f.filename)}
                  <span style={{ color: 'var(--text3)', fontWeight: 400, marginLeft: 6, fontSize: 11 }}>
                    {f.filename}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                  {f.count} questions
                  {f.topics.length > 0 && ` · ${f.topics.slice(0, 4).join(', ')}${f.topics.length > 4 ? ` +${f.topics.length - 4} more` : ''}`}
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
                {importing === f.filename ? 'Importing…' : result ? '↻ Re-import' : 'Import'}
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

  // JSON array fields stored as JSON string in DB; convert to one-per-line for editing
  const arrToText = (v) => {
    if (!v) return '';
    try { return JSON.parse(v).join('\n'); } catch { return v; }
  };

  const [form, setForm] = useState(
    isNew
      ? { ...BLANK }
      : {
          category:          question.category,
          difficulty:        question.difficulty,
          question:          question.question,
          quickAnswer:       question.quickAnswer,
          keyPoints:         arrToText(question.keyPoints),
          codeExample:       question.codeExample || '',
          followUpQuestions: arrToText(question.followUpQuestions),
          spokenAnswer:      question.spokenAnswer || '',
          commonMistakes:    question.commonMistakes || '',
          companiesAskThis:  arrToText(question.companiesAskThis),
          seniorExpectation: question.seniorExpectation || '',
          timeToAnswer:      question.timeToAnswer || '',
          relatedTopics:     arrToText(question.relatedTopics),
          tags:              arrToText(question.tags),
          displayOrder:      question.displayOrder ?? 0,
        }
  );
  const [saving, setSaving] = useState(false);

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  async function handleSave() {
    if (!form.question.trim())    { toast.error('Question is required');     return; }
    if (!form.quickAnswer.trim()) { toast.error('Quick Answer is required'); return; }

    // Helper: convert one-per-line text to JSON array string
    const toArr = (text) => JSON.stringify(
      (text || '').split('\n').map(l => l.trim()).filter(Boolean)
    );

    const payload = {
      ...form,
      keyPoints:         toArr(form.keyPoints),
      followUpQuestions: toArr(form.followUpQuestions),
      companiesAskThis:  toArr(form.companiesAskThis),
      relatedTopics:     toArr(form.relatedTopics),
      tags:              toArr(form.tags),
      codeExample:       form.codeExample.trim() || null,
      spokenAnswer:      form.spokenAnswer.trim() || null,
      commonMistakes:    form.commonMistakes.trim() || null,
      seniorExpectation: form.seniorExpectation.trim() || null,
      timeToAnswer:      form.timeToAnswer.trim() || null,
      displayOrder:      parseInt(form.displayOrder) || 0,
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

      <div style={{ borderTop: '1px solid var(--border2)', margin: '16px 0 8px', paddingTop: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12 }}>
          Interview Intelligence Fields
        </div>

        <TAField
          label="Spoken Answer — how to say it out loud in 30–45 seconds"
          value={form.spokenAnswer}
          onChange={v => set('spokenAnswer', v)}
          rows={4}
          placeholder="So, the difference is... HashMap uses a hash table giving O(1) average lookups with no ordering guarantee, while TreeMap uses a Red-Black tree giving O(log n) with keys in sorted order. I'd pick HashMap by default unless I need sorted keys or range queries..."
        />

        <TAField
          label="Common Mistakes — what candidates typically get wrong"
          value={form.commonMistakes}
          onChange={v => set('commonMistakes', v)}
          rows={3}
          placeholder="Confusing HashMap thread-safety with ConcurrentHashMap. Forgetting TreeMap requires Comparable keys or a Comparator — NPE with null keys."
        />

        <TAField
          label="Follow-Up Questions — one per line, what the interviewer asks next"
          value={form.followUpQuestions}
          onChange={v => set('followUpQuestions', v)}
          rows={4}
          placeholder={"How would you make a HashMap thread-safe?\nWhat is the load factor and when would you change it?\nHow does TreeMap handle null keys?"}
        />

        <TAField
          label="Senior Expectation — what a senior candidate adds"
          value={form.seniorExpectation}
          onChange={v => set('seniorExpectation', v)}
          rows={3}
          placeholder="Mention internal resizing (rehashing) when load factor exceeded, memory overhead of tree nodes vs bucket arrays, and when LinkedHashMap fits better than TreeMap for LRU cache patterns."
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
          <Field label="Time to Answer" hint='e.g. "30s", "1min"'>
            <input
              className="input"
              value={form.timeToAnswer}
              onChange={e => set('timeToAnswer', e.target.value)}
              placeholder="45s"
            />
          </Field>
          <Field label="Companies Ask This — one per line">
            <textarea
              className="input"
              style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 13 }}
              rows={3}
              value={form.companiesAskThis}
              onChange={e => set('companiesAskThis', e.target.value)}
              placeholder={"Amazon\nGoogle\nFlipkart"}
            />
          </Field>
          <Field label="Tags — one per line">
            <textarea
              className="input"
              style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 13 }}
              rows={3}
              value={form.tags}
              onChange={e => set('tags', e.target.value)}
              placeholder={"collections\nhashing\nperformance"}
            />
          </Field>
        </div>

        <TAField
          label="Related Topics — one per line (topic titles)"
          value={form.relatedTopics}
          onChange={v => set('relatedTopics', v)}
          rows={3}
          placeholder={"ConcurrentHashMap\nLinkedHashMap\nCollections Framework"}
        />
      </div>

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
      const normKeyPoints = Array.isArray(item.keyPoints)
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
      const normArr = (v) => {
        if (Array.isArray(v)) return v.length ? JSON.stringify(v.filter(Boolean)) : null;
        if (typeof v === 'string' && v.trim()) {
          const t = v.trim();
          if (t.startsWith('[')) return t;
          return JSON.stringify(t.split('\n').map(s => s.trim()).filter(Boolean));
        }
        return null;
      };
      return {
        category:          item.category,
        topicTitle:        item.topicTitle || null,
        difficulty:        item.difficulty || 'MEDIUM',
        question:          item.question,
        quickAnswer:       item.quickAnswer,
        keyPoints:         normKeyPoints,
        codeExample:       item.codeExample || null,
        followUpQuestions: normArr(item.followUpQuestions),
        spokenAnswer:      item.spokenAnswer || null,
        commonMistakes:    item.commonMistakes || null,
        companiesAskThis:  normArr(item.companiesAskThis),
        seniorExpectation: item.seniorExpectation || null,
        timeToAnswer:      item.timeToAnswer || null,
        relatedTopics:     normArr(item.relatedTopics),
        tags:              normArr(item.tags),
        displayOrder:      Number.isFinite(Number(item.displayOrder)) ? Number(item.displayOrder) : i,
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
