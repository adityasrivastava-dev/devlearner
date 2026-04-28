import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { quizApi, QUIZ_CATEGORIES, DIFFICULTY_META } from '../../api';
import { adminApi } from '../../api';
import styles from './AdminPage.module.css';
import qStyles from './QuizAdmin.module.css';

// ── internal admin API calls ─────────────────────────────────────────────────
async function adminGetQuizFiles() {
  return adminApi.getQuizFiles();
}

async function adminImportQuizFile(filename) {
  try {
    return await adminApi.importQuizFile(filename);
  } catch (e) {
    throw new Error(e?.response?.data?.error || e?.response?.data?.message || e?.message || 'Import failed');
  }
}

async function adminListQuizSets() {
  return adminApi.getQuizSets();
}

async function adminDeleteQuizSet(id) {
  try {
    return await adminApi.deleteQuizSet(id);
  } catch (e) {
    throw new Error(e?.response?.data?.error || e?.response?.data?.message || e?.message || 'Delete failed');
  }
}

// ── root component ────────────────────────────────────────────────────────────
export default function QuizAdminSection({ embedded = false }) {
  const [tab, setTab] = useState('files'); // files | sets | build | paste

  const tabs = [
    { key: 'files', label: '📁 JSON Files'   },
    { key: 'sets',  label: '📋 Manage Sets'  },
    { key: 'build', label: '🛠 Build Quiz'   },
    { key: 'paste', label: '📋 Paste JSON'   },
  ];

  const inner = (
    <>
      {/* Sub-tabs */}
      <div className={qStyles.tabBar}>
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`${qStyles.tab} ${tab === t.key ? qStyles.tabActive : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={qStyles.tabBody}>
        {tab === 'files' && <QuizFilesPanel />}
        {tab === 'sets'  && <QuizSetsPanel />}
        {tab === 'build' && <QuizBuilderPanel onSaved={() => setTab('sets')} />}
        {tab === 'paste' && <QuizPastePanel />}
      </div>
    </>
  );

  // When embedded inside Build JSON tab, no outer section wrapper needed
  if (embedded) return <div style={{ paddingTop: 4 }}>{inner}</div>;

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>🧠 Quiz Management</span>
        <span className={styles.sectionSub}>Seed, build and manage MCQ quiz sets</span>
      </div>
      {inner}
    </div>
  );
}

// ── FILES PANEL — import from classpath:quiz/*.json ──────────────────────────
function QuizFilesPanel() {
  const [importing, setImporting] = useState(null);
  const qc = useQueryClient();

  const { data: files = [], isLoading, refetch } = useQuery({
    queryKey: ['quiz-admin-files'],
    queryFn:  adminGetQuizFiles,
    staleTime: 10_000,
  });

  async function handleImport(filename) {
    setImporting(filename);
    try {
      const res = await adminImportQuizFile(filename);
      if (res.skipped) {
        toast('Already imported — skipped', { icon: 'ℹ️' });
      } else {
        toast.success(`Seeded: "${res.title}" — ${res.questionCount} questions`);
      }
      refetch();
      qc.invalidateQueries({ queryKey: ['quiz-admin-sets'] });
    } catch (e) {
      toast.error(e.message);
    } finally {
      setImporting(null);
    }
  }

  async function handleImportAll() {
    const pending = files.filter((f) => f.status === 'PENDING');
    for (const f of pending) await handleImport(f.filename);
  }

  const pending  = files.filter((f) => f.status === 'PENDING');
  const imported = files.filter((f) => f.status === 'IMPORTED');

  return (
    <>
      <div className={qStyles.panelTop}>
        <span className={qStyles.panelMeta}>
          {files.length} files · <span style={{ color: 'var(--success)' }}>{imported.length} imported</span>
          {' · '}<span style={{ color: 'var(--yellow)' }}>{pending.length} pending</span>
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => refetch()}>↻ Refresh</button>
          {pending.length > 0 && (
            <button
              className="btn btn-primary btn-sm"
              disabled={!!importing}
              onClick={handleImportAll}
            >
              ⚡ Import All ({pending.length})
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className={styles.loading}><span className="spinner" /> Loading files…</div>
      ) : files.length === 0 ? (
        <div className={qStyles.emptyMsg}>
          No JSON files found in <code>resources/quiz/</code>.<br />
          Add Q01-*.json files there and restart the backend.
        </div>
      ) : (
        <div className={qStyles.fileList}>
          {files.map((f) => (
            <div key={f.filename} className={qStyles.fileRow}>
              <div className={qStyles.fileInfo}>
                <span className={qStyles.fileName}>{f.filename}</span>
                <span className={qStyles.fileMeta}>
                  {f.category} · {f.difficulty} · {f.questionCount} questions
                  {f.title && ` · "${f.title}"`}
                </span>
              </div>
              <div className={qStyles.fileStatus}>
                {f.status === 'IMPORTED' ? (
                  <span className={qStyles.badgeImported}>✓ Imported</span>
                ) : f.status === 'ERROR' ? (
                  <span className={qStyles.badgeError} title={f.error}>⚠ Error</span>
                ) : (
                  <span className={qStyles.badgePending}>Pending</span>
                )}
              </div>
              <button
                className={`btn btn-sm ${f.status === 'IMPORTED' ? 'btn-ghost' : 'btn-primary'}`}
                disabled={f.status === 'IMPORTED' || importing === f.filename || !!importing}
                onClick={() => handleImport(f.filename)}
                style={{ minWidth: 90 }}
              >
                {importing === f.filename
                  ? <><span className="spinner" /> Importing…</>
                  : f.status === 'IMPORTED' ? '✓ Done' : '↑ Import'}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={qStyles.hint}>
        📁 Place <code>.json</code> files in <code>learning-system/src/main/resources/quiz/</code> and restart the backend to see them here.
        JSON format: <code>{'{ "title": "...", "category": "JAVA", "difficulty": "INTERMEDIATE", "questions": [...] }'}</code>
      </div>
    </>
  );
}

// ── SETS PANEL — manage existing quiz sets ────────────────────────────────────
function QuizSetsPanel() {
  const qc = useQueryClient();
  const [editingSet, setEditingSet] = useState(null); // set object to edit questions

  const { data: sets = [], isLoading, refetch } = useQuery({
    queryKey: ['quiz-admin-sets'],
    queryFn:  adminListQuizSets,
    staleTime: 10_000,
  });

  const deleteMut = useMutation({
    mutationFn: adminDeleteQuizSet,
    onSuccess: () => {
      toast.success('Quiz set deleted');
      qc.invalidateQueries({ queryKey: ['quiz-admin-sets'] });
      qc.invalidateQueries({ queryKey: ['quiz-admin-files'] });
    },
    onError: () => toast.error('Delete failed'),
  });

  function confirmDelete(set) {
    if (window.confirm(`Delete "${set.title}" and all ${set.questionCount} questions? This cannot be undone.`)) {
      deleteMut.mutate(set.id);
    }
  }

  if (editingSet) {
    return <QuizQuestionsEditor
      set={editingSet}
      onBack={() => { setEditingSet(null); refetch(); }}
    />;
  }

  return (
    <>
      <div className={qStyles.panelTop}>
        <span className={qStyles.panelMeta}>{sets.length} quiz set{sets.length !== 1 ? 's' : ''}</span>
        <button className="btn btn-ghost btn-sm" onClick={() => refetch()}>↻ Refresh</button>
      </div>

      {isLoading ? (
        <div className={styles.loading}><span className="spinner" /> Loading…</div>
      ) : sets.length === 0 ? (
        <div className={qStyles.emptyMsg}>No quiz sets yet. Use the Files or Build tab to add some.</div>
      ) : (
        <div className={qStyles.setTable}>
          <div className={qStyles.setTableHead}>
            <span>Title</span>
            <span>Category</span>
            <span>Difficulty</span>
            <span>Questions</span>
            <span>Actions</span>
          </div>
          {sets.map((set) => {
            const diff = DIFFICULTY_META[set.difficulty] || DIFFICULTY_META.INTERMEDIATE;
            return (
              <div key={set.id} className={qStyles.setTableRow}>
                <span className={qStyles.setTitle}>
                  {set.icon} {set.title}
                </span>
                <span className={qStyles.setCat}>{set.category}</span>
                <span>
                  <span className={qStyles.diffChip} style={{ color: diff.color, background: diff.bg }}>
                    {diff.label}
                  </span>
                </span>
                <span className={qStyles.qCount}>{set.questionCount}</span>
                <span className={qStyles.rowActions}>
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={() => setEditingSet(set)}
                  >
                    ✏️ Questions
                  </button>
                  <button
                    className="btn btn-danger btn-xs"
                    onClick={() => confirmDelete(set)}
                    disabled={deleteMut.isPending}
                  >
                    🗑 Delete
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ── Question editor for an existing set ─────────────────────────────────────
function QuizQuestionsEditor({ set, onBack }) {
  const qc = useQueryClient();
  const [addingNew, setAddingNew] = useState(false);
  const [editQ, setEditQ] = useState(null); // question being edited

  const { data: questions = [], isLoading, refetch } = useQuery({
    queryKey: ['quiz-questions', set.id],
    queryFn:  () => adminApi.getQuizQuestions(set.id),
    staleTime: 0,
  });

  const deleteMut = useMutation({
    mutationFn: (qid) => adminApi.deleteQuizQuestion(qid),
    onSuccess: () => { toast.success('Question deleted'); refetch(); },
    onError: () => toast.error('Delete failed'),
  });

  const addMut = useMutation({
    mutationFn: (data) => adminApi.addQuizQuestion(set.id, data),
    onSuccess: () => { toast.success('Question added'); setAddingNew(false); refetch(); },
    onError: () => toast.error('Add failed'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => adminApi.updateQuizQuestion(id, data),
    onSuccess: () => { toast.success('Question updated'); setEditQ(null); refetch(); },
    onError: () => toast.error('Update failed'),
  });

  if (addingNew || editQ) {
    return (
      <QuestionForm
        initial={editQ}
        onCancel={() => { setAddingNew(false); setEditQ(null); }}
        onSave={(data) => editQ
          ? updateMut.mutate({ id: editQ.id, data })
          : addMut.mutate(data)
        }
        isPending={addMut.isPending || updateMut.isPending}
      />
    );
  }

  return (
    <div>
      <div className={qStyles.panelTop} style={{ marginBottom: 12 }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← Back to Sets</button>
        <span className={qStyles.panelMeta}>{set.icon} {set.title} — {questions.length} questions</span>
        <button className="btn btn-primary btn-sm" onClick={() => setAddingNew(true)}>+ Add Question</button>
      </div>

      {isLoading ? (
        <div className={styles.loading}><span className="spinner" /> Loading…</div>
      ) : questions.length === 0 ? (
        <div className={qStyles.emptyMsg}>No questions yet. Click "+ Add Question" to start.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {questions.map((q, i) => (
            <div key={q.id} className={qStyles.qEditRow}>
              <span className={qStyles.qEditNum}>Q{i + 1}</span>
              <span className={qStyles.qEditText}>{q.questionText}</span>
              <span className={qStyles.qEditAnswer}>✓ {q.correctOption}</span>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button className="btn btn-ghost btn-xs" onClick={() => setEditQ(q)}>✏️</button>
                <button className="btn btn-danger btn-xs"
                  onClick={() => window.confirm('Delete this question?') && deleteMut.mutate(q.id)}
                  disabled={deleteMut.isPending}
                >🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QuestionForm({ initial, onCancel, onSave, isPending }) {
  const [form, setForm] = useState({
    questionText:  initial?.questionText  || '',
    optionA:       initial?.optionA       || '',
    optionB:       initial?.optionB       || '',
    optionC:       initial?.optionC       || '',
    optionD:       initial?.optionD       || '',
    correctOption: initial?.correctOption || 'A',
    explanation:   initial?.explanation   || '',
    codeSnippet:   initial?.codeSnippet   || '',
    difficulty:    initial?.difficulty    || 'MEDIUM',
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const canSave = form.questionText && form.optionA && form.optionB;

  return (
    <div className={qStyles.qFormWrap}>
      <div className={qStyles.panelTop} style={{ marginBottom: 12 }}>
        <span className={qStyles.panelMeta}>{initial ? 'Edit Question' : 'New Question'}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={() => onSave(form)} disabled={!canSave || isPending}>
            {isPending ? 'Saving…' : '💾 Save'}
          </button>
        </div>
      </div>
      <div className={qStyles.qFormGrid}>
        <label className={qStyles.qFormLabel}>Question *</label>
        <textarea className="input" rows={3} value={form.questionText} onChange={set('questionText')} />
        <label className={qStyles.qFormLabel}>Code Snippet (optional)</label>
        <textarea className="input" rows={4} style={{ fontFamily: 'var(--font-code)', fontSize: 12 }}
          value={form.codeSnippet} onChange={set('codeSnippet')} placeholder="Java code shown with the question…" />
        <label className={qStyles.qFormLabel}>Option A *</label>
        <input className="input" value={form.optionA} onChange={set('optionA')} />
        <label className={qStyles.qFormLabel}>Option B *</label>
        <input className="input" value={form.optionB} onChange={set('optionB')} />
        <label className={qStyles.qFormLabel}>Option C</label>
        <input className="input" value={form.optionC} onChange={set('optionC')} />
        <label className={qStyles.qFormLabel}>Option D</label>
        <input className="input" value={form.optionD} onChange={set('optionD')} />
        <label className={qStyles.qFormLabel}>Correct Answer *</label>
        <select className="input" value={form.correctOption} onChange={set('correctOption')}>
          <option>A</option><option>B</option><option>C</option><option>D</option>
        </select>
        <label className={qStyles.qFormLabel}>Explanation</label>
        <textarea className="input" rows={2} value={form.explanation} onChange={set('explanation')}
          placeholder="Why is this the correct answer?" />
        <label className={qStyles.qFormLabel}>Difficulty</label>
        <select className="input" value={form.difficulty} onChange={set('difficulty')}>
          <option>EASY</option><option>MEDIUM</option><option>HARD</option>
        </select>
      </div>
    </div>
  );
}

// ── BUILDER PANEL — create a new quiz set with GUI ────────────────────────────
const BLANK_QUESTION = () => ({
  _id:           Math.random(),
  questionText:  '',
  optionA:       '',
  optionB:       '',
  optionC:       '',
  optionD:       '',
  correctOption: 'A',
  explanation:   '',
  codeSnippet:   '',
  difficulty:    'MEDIUM',
  tags:          '',
});

const BLANK_SET = () => ({
  title:        '',
  description:  '',
  category:     'JAVA',
  difficulty:   'INTERMEDIATE',
  icon:         '📝',
  displayOrder: 0,
  questions:    [BLANK_QUESTION()],
});

function QuizBuilderPanel({ onSaved }) {
  const [mode, setMode] = useState(null); // null | 'create' | 'browse' | 'edit'
  const [editInitial, setEditInitial] = useState(null); // pre-loaded set for edit mode

  function handleLoadSet(setData) {
    // setData is a full quiz set object — convert to our internal format
    setEditInitial({
      title:        setData.title        || '',
      description:  setData.description  || '',
      category:     setData.category     || 'JAVA',
      difficulty:   setData.difficulty   || 'INTERMEDIATE',
      icon:         setData.icon         || '📝',
      displayOrder: setData.displayOrder || 0,
      questions:    (setData.questions || []).map((q) => ({
        ...q,
        _id:          Math.random(),
        optionC:      q.optionC      || '',
        optionD:      q.optionD      || '',
        codeSnippet:  q.codeSnippet  || '',
        tags:         q.tags         || '',
      })),
    });
    setMode('create'); // reuse the create form
  }

  // ── Home — mode cards ────────────────────────────────────────────────────
  if (!mode) {
    return (
      <div className={qStyles.builderHome}>
        <button className={qStyles.builderCard} onClick={() => { setEditInitial(null); setMode('create'); }}>
          <span className={qStyles.builderCardIcon}>✨</span>
          <span className={qStyles.builderCardTitle}>Create New Quiz</span>
          <span className={qStyles.builderCardDesc}>Build a quiz set from scratch — fill in questions one by one</span>
        </button>
        <button className={qStyles.builderCard} onClick={() => setMode('browse')}>
          <span className={qStyles.builderCardIcon}>📁</span>
          <span className={qStyles.builderCardTitle}>Browse JSON Files</span>
          <span className={qStyles.builderCardDesc}>Load any quiz set from resources/quiz/ and edit it field-by-field</span>
        </button>
        <button className={qStyles.builderCard} onClick={() => setMode('edit')}>
          <span className={qStyles.builderCardIcon}>✏️</span>
          <span className={qStyles.builderCardTitle}>Edit Existing JSON</span>
          <span className={qStyles.builderCardDesc}>Paste a quiz JSON and edit every question in the form</span>
        </button>
      </div>
    );
  }

  // ── Browse — pick a file, pick a set, load into editor ──────────────────
  if (mode === 'browse') {
    return <QuizBrowsePanel
      onBack={() => setMode(null)}
      onLoad={(setData) => handleLoadSet(setData)}
    />;
  }

  // ── Edit — paste JSON then load ──────────────────────────────────────────
  if (mode === 'edit') {
    return <QuizEditPastePanel
      onBack={() => setMode(null)}
      onLoad={(setData) => handleLoadSet(setData)}
    />;
  }

  // ── Create / Edit form ───────────────────────────────────────────────────
  return <QuizEditorForm
    initial={editInitial}
    onBack={() => { setMode(null); setEditInitial(null); }}
    onSaved={() => { setMode(null); setEditInitial(null); onSaved?.(); }}
  />;
}

// ── Browse JSON files panel ───────────────────────────────────────────────────
function QuizBrowsePanel({ onBack, onLoad }) {
  const [files,         setFiles]         = useState([]);
  const [filesLoading,  setFilesLoading]  = useState(true);
  const [selectedFile,  setSelectedFile]  = useState('');
  const [sets,          setSets]          = useState([]); // topics from the selected file
  const [setsLoading,   setSetsLoading]   = useState(false);
  const [filter,        setFilter]        = useState('');

  useEffect(() => {
    adminGetQuizFiles()
      .then(setFiles)
      .catch(() => setFiles([]))
      .finally(() => setFilesLoading(false));
  }, []);

  async function handleFileSelect(filename) {
    setSelectedFile(filename);
    setSets([]);
    setFilter('');
    if (!filename) return;
    setSetsLoading(true);
    try {
      // Load the file directly via the import-file endpoint in preview mode
      // We fetch raw file data from the listing, then use a dedicated preview
      try {
        const data = await adminApi.previewQuizFile(filename);
        setSets(data.questions ? [data] : data); // single set or array
      } catch {
        // Fallback: just show the file info we already have
        const fileInfo = files.find((f) => f.filename === filename);
        if (fileInfo) setSets([fileInfo]);
      }
    } catch {
      const fileInfo = files.find((f) => f.filename === filename);
      if (fileInfo) setSets([{ title: fileInfo.title, ...fileInfo }]);
    } finally {
      setSetsLoading(false);
    }
  }

  const filtered = sets.filter((s) =>
    !filter || (s.title || '').toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className={qStyles.builder}>
      <div className={qStyles.builderActions} style={{ borderTop: 'none', paddingTop: 0 }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← Back</button>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>📁 Browse Quiz JSON Files</span>
        <span />
      </div>

      <p style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.6, margin: 0 }}>
        Select a file from <code style={{ background: 'var(--bg3)', padding: '1px 5px', borderRadius: 3, fontSize: 11 }}>resources/quiz/</code> to load it into the editor.
      </p>

      {/* File selector */}
      <select
        className="input"
        value={selectedFile}
        onChange={(e) => handleFileSelect(e.target.value)}
        style={{ fontSize: 12 }}
        disabled={filesLoading}
      >
        <option value="">
          {filesLoading ? 'Loading files…' : `— Select a quiz file (${files.length} available) —`}
        </option>
        {files.map((f) => (
          <option key={f.filename} value={f.filename}>
            {f.filename}
            {f.questionCount ? ` · ${f.questionCount} questions` : ''}
            {f.status === 'IMPORTED' ? ' ✓' : ''}
          </option>
        ))}
      </select>

      {/* Set list from file */}
      {selectedFile && (
        setsLoading ? (
          <div style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--text3)', alignItems: 'center' }}>
            <span className="spinner" /> Loading…
          </div>
        ) : sets.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>Could not parse this file.</div>
        ) : (
          <>
            {sets.length > 1 && (
              <input className="input" style={{ fontSize: 12 }}
                placeholder={`🔍 Filter ${sets.length} sets…`}
                value={filter} onChange={(e) => setFilter(e.target.value)} />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filtered.map((s, i) => {
                const diff = DIFFICULTY_META[s.difficulty] || DIFFICULTY_META.INTERMEDIATE;
                return (
                  <button key={i} className={qStyles.fileRow}
                    style={{ textAlign: 'left', cursor: 'pointer' }}
                    onClick={() => onLoad(s)}
                  >
                    <div className={qStyles.fileInfo}>
                      <span className={qStyles.fileName}>{s.icon || '📝'} {s.title}</span>
                      <span className={qStyles.fileMeta}>
                        {s.category} ·
                        <span style={{ color: diff.color }}> {diff.label}</span>
                        {s.questionCount || (s.questions || []).length
                          ? ` · ${s.questionCount || (s.questions || []).length} questions`
                          : ''}
                      </span>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--accent3)', fontWeight: 600, flexShrink: 0 }}>
                      Load →
                    </span>
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>
              Click a set to open it in the editor — all questions will be editable.
            </div>
          </>
        )
      )}
    </div>
  );
}

// ── Edit by pasting JSON ──────────────────────────────────────────────────────
function QuizEditPastePanel({ onBack, onLoad }) {
  const [json, setJson] = useState('');
  const [err,  setErr]  = useState('');

  function handleLoad() {
    setErr('');
    try {
      const parsed = JSON.parse(json);
      if (!parsed.title) throw new Error('Missing "title" field');
      if (!parsed.questions || !Array.isArray(parsed.questions)) throw new Error('Missing "questions" array');
      onLoad(parsed);
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div className={qStyles.builder}>
      <div className={qStyles.builderActions} style={{ borderTop: 'none', paddingTop: 0 }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← Back</button>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>✏️ Edit Existing Quiz JSON</span>
        <span />
      </div>
      <p style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.6, margin: 0 }}>
        Paste a quiz set JSON (same format as the seed files). All questions will load into the editor.
      </p>
      <textarea
        className="input"
        rows={18}
        value={json}
        onChange={(e) => { setJson(e.target.value); setErr(''); }}
        placeholder={'{\n  "title": "My Quiz",\n  "category": "JAVA",\n  "difficulty": "INTERMEDIATE",\n  "questions": [...]\n}'}
        style={{ fontFamily: 'var(--font-code)', fontSize: 12, resize: 'vertical' }}
      />
      {err && <div style={{ fontSize: 12, color: 'var(--red)' }}>⚠ {err}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" disabled={!json.trim()} onClick={handleLoad}>
          📂 Load into Editor →
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => { setJson(''); setErr(''); }}>Clear</button>
      </div>
    </div>
  );
}

// ── Core editor form (create + edit share this) ───────────────────────────────
function QuizEditorForm({ initial, onBack, onSaved }) {
  const [set, setSet]               = useState(initial || BLANK_SET());
  const [activeQ, setActiveQ]       = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving]         = useState(false);
  const qc = useQueryClient();

  function updateSet(field, val) {
    setSet((s) => ({ ...s, [field]: val }));
  }

  function updateQ(idx, field, val) {
    setSet((s) => {
      const qs = [...s.questions];
      qs[idx] = { ...qs[idx], [field]: val };
      return { ...s, questions: qs };
    });
  }

  function addQuestion() {
    setSet((s) => ({ ...s, questions: [...s.questions, BLANK_QUESTION()] }));
    setActiveQ(set.questions.length);
  }

  function removeQuestion(idx) {
    if (set.questions.length === 1) return;
    setSet((s) => {
      const qs = s.questions.filter((_, i) => i !== idx);
      return { ...s, questions: qs };
    });
    setActiveQ((a) => Math.min(a, set.questions.length - 2));
  }

  function duplicateQuestion(idx) {
    const copy = { ...set.questions[idx], _id: Math.random() };
    setSet((s) => {
      const qs = [...s.questions];
      qs.splice(idx + 1, 0, copy);
      return { ...s, questions: qs };
    });
    setActiveQ(idx + 1);
  }

  function buildPayload() {
    return {
      title:       set.title,
      description: set.description,
      category:    set.category,
      difficulty:  set.difficulty,
      icon:        set.icon,
      displayOrder: set.displayOrder,
      questions:   set.questions.map(({ _id, ...q }) => ({
        ...q,
        optionC: q.optionC || undefined,
        optionD: q.optionD || undefined,
        codeSnippet: q.codeSnippet || undefined,
        tags: q.tags || undefined,
      })),
    };
  }

  async function handleSave() {
    if (!set.title.trim()) { toast.error('Title is required'); return; }
    if (set.questions.some((q) => !q.questionText.trim() || !q.optionA.trim() || !q.optionB.trim())) {
      toast.error('All questions need text, option A and option B'); return;
    }
    setSaving(true);
    try {
      const res = await quizApi.seedSet(buildPayload());
      if (res.skipped) {
        toast('A set with this title already exists — use a different title', { icon: 'ℹ️' });
      } else {
        toast.success(`Saved! "${res.title}" — ${res.questionCount} questions`);
        qc.invalidateQueries({ queryKey: ['quiz-admin-sets'] });
        qc.invalidateQueries({ queryKey: ['quiz-admin-files'] });
        setSet(BLANK_SET());
        setActiveQ(0);
        onSaved?.();
      }
    } catch (e) {
      toast.error(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const q = set.questions[activeQ] || set.questions[0];

  return (
    <div className={qStyles.builder}>

      {/* ── Back + header ─────────────────────────────────────────── */}
      <div className={qStyles.builderActions} style={{ borderTop: 'none', paddingTop: 0 }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← Back</button>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
          {set.title ? `✏️ ${set.title}` : '✨ New Quiz Set'}
        </span>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleSave}
          disabled={saving || !set.title.trim()}
        >
          {saving ? <><span className="spinner" /> Saving…</> : '💾 Save'}
        </button>
      </div>

      {/* ── Set metadata ─────────────────────────────────────────── */}
      <div className={qStyles.builderMeta}>
        <div className={qStyles.metaRow}>
          <div className={qStyles.metaField} style={{ flex: 3 }}>
            <label className={qStyles.label}>Quiz Title *</label>
            <input
              className={`input ${qStyles.metaInput}`}
              value={set.title}
              onChange={(e) => updateSet('title', e.target.value)}
              placeholder="e.g. Java OOP — Core Concepts"
            />
          </div>
          <div className={qStyles.metaField} style={{ flex: 1 }}>
            <label className={qStyles.label}>Icon</label>
            <input
              className={`input ${qStyles.metaInput}`}
              value={set.icon}
              onChange={(e) => updateSet('icon', e.target.value)}
              placeholder="📝"
              maxLength={4}
            />
          </div>
        </div>
        <div className={qStyles.metaRow}>
          <div className={qStyles.metaField}>
            <label className={qStyles.label}>Description</label>
            <input
              className={`input ${qStyles.metaInput}`}
              value={set.description}
              onChange={(e) => updateSet('description', e.target.value)}
              placeholder="Short description shown on the quiz card"
            />
          </div>
        </div>
        <div className={qStyles.metaRow}>
          <div className={qStyles.metaField}>
            <label className={qStyles.label}>Category</label>
            <select
              className={`input ${qStyles.metaInput}`}
              value={set.category}
              onChange={(e) => updateSet('category', e.target.value)}
            >
              {QUIZ_CATEGORIES.filter((c) => c.key !== 'ALL').map((c) => (
                <option key={c.key} value={c.key}>{c.icon} {c.label}</option>
              ))}
            </select>
          </div>
          <div className={qStyles.metaField}>
            <label className={qStyles.label}>Difficulty</label>
            <select
              className={`input ${qStyles.metaInput}`}
              value={set.difficulty}
              onChange={(e) => updateSet('difficulty', e.target.value)}
            >
              {Object.entries(DIFFICULTY_META).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div className={qStyles.metaField} style={{ maxWidth: 100 }}>
            <label className={qStyles.label}>Display Order</label>
            <input
              type="number"
              className={`input ${qStyles.metaInput}`}
              value={set.displayOrder}
              onChange={(e) => updateSet('displayOrder', Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* ── Question tabs ─────────────────────────────────────────── */}
      <div className={qStyles.qTabBar}>
        {set.questions.map((q, i) => (
          <button
            key={q._id}
            className={`${qStyles.qTab} ${activeQ === i ? qStyles.qTabActive : ''} ${!q.questionText.trim() ? qStyles.qTabEmpty : ''}`}
            onClick={() => setActiveQ(i)}
          >
            Q{i + 1}
          </button>
        ))}
        <button className={`${qStyles.qTab} ${qStyles.qTabAdd}`} onClick={addQuestion}>
          + Add
        </button>
      </div>

      {/* ── Question editor ───────────────────────────────────────── */}
      {q && (
        <div className={qStyles.qEditor}>
          <div className={qStyles.qEditorHeader}>
            <span className={qStyles.qEditorLabel}>Question {activeQ + 1} of {set.questions.length}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-ghost btn-xs" onClick={() => duplicateQuestion(activeQ)}>⧉ Duplicate</button>
              <button
                className="btn btn-danger btn-xs"
                onClick={() => removeQuestion(activeQ)}
                disabled={set.questions.length === 1}
              >
                🗑 Remove
              </button>
            </div>
          </div>

          {/* Question text */}
          <div className={qStyles.fieldGroup}>
            <label className={qStyles.label}>Question Text *</label>
            <textarea
              className={`input ${qStyles.qTextarea}`}
              rows={3}
              value={q.questionText}
              onChange={(e) => updateQ(activeQ, 'questionText', e.target.value)}
              placeholder="What is the time complexity of HashMap.get() in the average case?"
            />
          </div>

          {/* Code snippet */}
          <div className={qStyles.fieldGroup}>
            <label className={qStyles.label}>Code Snippet (optional — shown above options)</label>
            <textarea
              className={`input ${qStyles.codeTextarea}`}
              rows={4}
              value={q.codeSnippet}
              onChange={(e) => updateQ(activeQ, 'codeSnippet', e.target.value)}
              placeholder="Map<String,Integer> m = new HashMap<>();&#10;m.put(&quot;a&quot;, 1);"
              style={{ fontFamily: 'var(--font-code)', fontSize: 12 }}
            />
          </div>

          {/* Options */}
          <div className={qStyles.optionsGrid}>
            {['A', 'B', 'C', 'D'].map((key) => {
              const field = `option${key}`;
              const isCorrect = q.correctOption === key;
              return (
                <div
                  key={key}
                  className={`${qStyles.optionField} ${isCorrect ? qStyles.optionCorrect : ''}`}
                >
                  <div className={qStyles.optionLabelRow}>
                    <span className={`${qStyles.optKey} ${isCorrect ? qStyles.optKeyCorrect : ''}`}>{key}</span>
                    {key === 'C' || key === 'D'
                      ? <span className={qStyles.optOptional}>optional</span>
                      : <span className={qStyles.optRequired}>required</span>}
                    <label className={qStyles.correctRadio}>
                      <input
                        type="radio"
                        name={`correct-${activeQ}`}
                        checked={isCorrect}
                        onChange={() => updateQ(activeQ, 'correctOption', key)}
                      />
                      Correct answer
                    </label>
                  </div>
                  <input
                    className={`input ${qStyles.optInput}`}
                    value={q[field]}
                    onChange={(e) => updateQ(activeQ, field, e.target.value)}
                    placeholder={`Option ${key}${key === 'A' || key === 'B' ? ' *' : ' (leave blank to hide)'}`}
                  />
                </div>
              );
            })}
          </div>

          {/* Explanation */}
          <div className={qStyles.fieldGroup}>
            <label className={qStyles.label}>Explanation * (shown after answering)</label>
            <textarea
              className={`input ${qStyles.qTextarea}`}
              rows={3}
              value={q.explanation}
              onChange={(e) => updateQ(activeQ, 'explanation', e.target.value)}
              placeholder="Explain why the correct answer is right and the others are wrong..."
            />
          </div>

          {/* Difficulty + tags */}
          <div className={qStyles.metaRow}>
            <div className={qStyles.metaField}>
              <label className={qStyles.label}>Question Difficulty</label>
              <select
                className={`input ${qStyles.metaInput}`}
                value={q.difficulty}
                onChange={(e) => updateQ(activeQ, 'difficulty', e.target.value)}
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
            <div className={qStyles.metaField} style={{ flex: 2 }}>
              <label className={qStyles.label}>Tags (comma-separated)</label>
              <input
                className={`input ${qStyles.metaInput}`}
                value={q.tags}
                onChange={(e) => updateQ(activeQ, 'tags', e.target.value)}
                placeholder="hashmap,collections,complexity"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Actions ───────────────────────────────────────────────── */}
      <div className={qStyles.builderActions}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowPreview((v) => !v)}>
            {showPreview ? '🙈 Hide JSON' : '👁 Preview JSON'}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => { setSet(BLANK_SET()); setActiveQ(0); }}>
            ↺ Reset
          </button>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text3)' }}>
          {set.questions.length} question{set.questions.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── JSON Preview ──────────────────────────────────────────── */}
      {showPreview && (
        <pre className={styles.jsonPreview}>
          {JSON.stringify(buildPayload(), null, 2)}
        </pre>
      )}
    </div>
  );
}

// ── PASTE PANEL — raw JSON input like the topic batch paste ──────────────────
function QuizPastePanel() {
  const [json,    setJson]    = useState('');
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  async function handleSeed() {
    let payload;
    try { payload = JSON.parse(json); }
    catch { toast.error('Invalid JSON — check your syntax'); return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await quizApi.seedSet(payload);
      setResult({ ...res, ok: !res.skipped });
      if (res.skipped) toast('Already exists — skipped', { icon: 'ℹ️' });
      else {
        toast.success(`Seeded "${res.title}" — ${res.questionCount} questions`);
        qc.invalidateQueries({ queryKey: ['quiz-admin-sets'] });
      }
    } catch (e) {
      toast.error(e.response?.data?.error || e.message || 'Seed failed');
    } finally { setLoading(false); }
  }

  const SAMPLE = JSON.stringify({
    title: "My Quiz Set",
    description: "Short description",
    category: "JAVA",
    difficulty: "INTERMEDIATE",
    icon: "📝",
    questions: [
      {
        questionText: "What is the default capacity of ArrayList?",
        optionA: "8",
        optionB: "10",
        optionC: "16",
        optionD: "12",
        correctOption: "B",
        explanation: "ArrayList default initial capacity is 10.",
        difficulty: "EASY",
        tags: "arraylist,collections"
      }
    ]
  }, null, 2);

  return (
    <>
      <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12, lineHeight: 1.7 }}>
        Paste a quiz JSON to create a set directly. Use the same format as the seed files.
        Idempotent — same title twice is a no-op.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button
          className="btn btn-ghost btn-xs"
          onClick={() => setJson(SAMPLE)}
        >
          Load Sample
        </button>
        <button
          className="btn btn-ghost btn-xs"
          onClick={() => { setJson(''); setResult(null); }}
        >
          Clear
        </button>
      </div>

      <textarea
        className={styles.jsonInput}
        value={json}
        onChange={(e) => setJson(e.target.value)}
        placeholder={SAMPLE}
        rows={22}
      />

      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        <button
          className="btn btn-primary"
          disabled={loading || !json.trim()}
          onClick={handleSeed}
        >
          {loading ? <><span className="spinner" />Seeding…</> : '🧠 Seed Quiz Set'}
        </button>
      </div>

      {result && (
        <div
          className={`${styles.resultBox} ${result.ok ? styles.success : styles.partial}`}
          style={{ marginTop: 12 }}
        >
          {result.skipped
            ? `⚠ Skipped — a set named "${result.reason?.replace('Set already exists: ', '')}" already exists.`
            : `✅ Created quiz set "${result.title}" with ${result.questionCount} questions (ID: ${result.setId})`}
        </div>
      )}
    </>
  );
}
