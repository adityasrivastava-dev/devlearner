import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { interviewApi, QUERY_KEYS } from '../../api';
import { QUESTIONS } from '../interview/interviewData';
import toast from 'react-hot-toast';
import styles from './AdminPage.module.css';

const IQ_CATEGORIES = ['JAVA', 'ADVANCED_JAVA', 'DSA', 'SQL', 'AWS'];
const IQ_DIFFICULTIES = ['HIGH', 'MEDIUM'];

const CAT_LABEL = {
  JAVA:          'Java Core',
  ADVANCED_JAVA: 'Advanced Java',
  DSA:           'DSA',
  SQL:           'SQL',
  AWS:           'AWS',
};

const CAT_COLOR = {
  JAVA:          '#f59e0b',
  ADVANCED_JAVA: '#8b5cf6',
  DSA:           '#10b981',
  SQL:           '#3b82f6',
  AWS:           '#f97316',
};

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
  const [tab, setTab] = useState('manage'); // manage | create

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>Interview Q&amp;A</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            ['manage', '⚙ Manage'],
            ['create', '+ New Question'],
          ].map(([key, label]) => (
            <button
              key={key}
              className={`btn btn-sm ${tab === key ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setTab(key)}
            >{label}</button>
          ))}
        </div>
      </div>

      {tab === 'manage' && <IQManagePanel onEdit={(q) => setTab('edit-' + q.id)} />}
      {tab === 'create' && <IQFormPanel question={null} onDone={() => setTab('manage')} />}
      {tab.startsWith('edit-') && (
        <IQEditWrapper
          id={parseInt(tab.replace('edit-', ''))}
          onDone={() => setTab('manage')}
        />
      )}
    </div>
  );
}

/* ── Manage panel ───────────────────────────────────────────────────────────── */
function IQManagePanel({ onEdit }) {
  const qc = useQueryClient();
  const [search, setSearch]   = useState('');
  const [catFilter, setCat]   = useState('ALL');
  const [diffFilter, setDiff] = useState('ALL');
  const [deleting, setDeleting] = useState(null);
  const [importing, setImporting] = useState(false);

  const { data: questions = [], isLoading, refetch } = useQuery({
    queryKey: QUERY_KEYS.interviewQuestions,
    queryFn:  () => interviewApi.getAll(),
    staleTime: 30_000,
  });

  async function handleDelete(q) {
    if (!window.confirm(`Delete this question?\n\n"${q.question.slice(0, 80)}…"\n\nThis cannot be undone.`)) return;
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
    if (!window.confirm(`Delete ALL ${questions.length} interview questions? This cannot be undone.`)) return;
    try {
      const res = await interviewApi.deleteAll();
      toast.success(`Deleted ${res.deleted} questions`);
      qc.invalidateQueries({ queryKey: QUERY_KEYS.interviewQuestions });
    } catch {
      toast.error('Delete all failed');
    }
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
        {questions.length > 0 && (
          <button className="btn btn-danger btn-sm" onClick={handleDeleteAll}>🗑 Delete All</button>
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
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '10px 14px',
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
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
              <button className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }} onClick={() => onEdit(q)}>✏ Edit</button>
              <button
                className="btn btn-danger btn-sm"
                style={{ flexShrink: 0 }}
                disabled={deleting === q.id}
                onClick={() => handleDelete(q)}
              >
                {deleting === q.id ? <span className="spinner" /> : '🗑'}
              </button>
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
