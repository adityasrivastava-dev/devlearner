import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminApi, topicsApi, QUERY_KEYS } from '../../api';
import { getCategoryMeta, getDiffMeta, CATEGORIES } from '../../utils/helpers';
import toast from 'react-hot-toast';
import styles from './AdminPage.module.css';
import JsonBuilderSection from './JsonBuilderSection';
import QuizAdminSection from './QuizAdminSection';
import AlgorithmAdminSection from './AlgorithmAdminSection';

export default function AdminPage() {
  const navigate   = useNavigate();
  const qc         = useQueryClient();
  const [section, setSection] = useState('topics'); // topics | users | seed | build | algorithms | stats

  return (
    <div className={styles.adminPage}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={() => navigate('/')}>← App</button>
          <div className={styles.logo}>⟨devlearn⟩ <span className={styles.adminBadge}>ADMIN</span></div>
        </div>
        <nav className={styles.nav}>
          {[
            { key: 'topics',     icon: '📚', label: 'Topics' },
            { key: 'users',      icon: '👥', label: 'Users' },
            { key: 'seed',       icon: '📦', label: 'Import JSON' },
            { key: 'build',      icon: '🛠', label: 'Build JSON' },
            { key: 'quiz',       icon: '🧠', label: 'Quiz' },
            { key: 'algorithms', icon: '⚡', label: 'Algorithms' },
            { key: 'stats',      icon: '📊', label: 'Stats' },
          ].map((item) => (
            <button
              key={item.key}
              className={`${styles.navBtn} ${section === item.key ? styles.activeNav : ''}`}
              onClick={() => setSection(item.key)}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {section === 'topics'     && <TopicsSection qc={qc} />}
        {section === 'users'      && <UsersSection />}
        {section === 'seed'       && <SeedSection />}
        {section === 'build'      && <div className={styles.section}><div className={styles.sectionHeader}><span className={styles.sectionTitle}>JSON Builder</span></div><JsonBuilderSection /></div>}
        {section === 'quiz'       && <QuizAdminSection />}
        {section === 'algorithms' && <AlgorithmAdminSection />}
        {section === 'stats'      && <StatsSection />}
      </div>
    </div>
  );
}

/* ── Topics section ──────────────────────────────────────────────────────────── */
function TopicsSection({ qc }) {
  const [catFilter, setCatFilter] = useState('ALL');
  const [selectedTopic, setSelectedTopic] = useState(null);

  const { data: topics = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.topics(catFilter),
    queryFn:  () => topicsApi.getAll(catFilter),
    staleTime: 2 * 60 * 1000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteTopic(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['topics'] });
      toast.success('Topic deleted');
      setSelectedTopic(null);
    },
    onError: () => toast.error('Delete failed'),
  });

  function confirmDelete(topic) {
    if (window.confirm(`Delete "${topic.title}" and all its problems/examples?`)) {
      deleteMutation.mutate(topic.id);
    }
  }

  return (
    <div className={styles.twoCol}>
      {/* Topic list */}
      <div className={styles.leftCol}>
        <div className={styles.colHeader}>
          <span className={styles.colTitle}>Topics ({topics.length})</span>
          <button className="btn btn-primary btn-sm" onClick={() => setSelectedTopic({ _new: true })}>
            + New Topic
          </button>
        </div>

        {/* Category filter */}
        <div className={styles.catFilter}>
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              className={`${styles.catBtn} ${catFilter === c.key ? styles.activeCat : ''}`}
              onClick={() => setCatFilter(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className={styles.loading}><span className="spinner" />Loading…</div>
        ) : (
          <div className={styles.topicList}>
            {topics.map((t) => {
              const meta = getCategoryMeta(t.category);
              return (
                <div
                  key={t.id}
                  className={`${styles.topicRow} ${selectedTopic?.id === t.id ? styles.selected : ''}`}
                  onClick={() => setSelectedTopic(t)}
                >
                  <div className={styles.topicRowMain}>
                    <span className={styles.topicRowTitle}>{t.title}</span>
                    <span className={`badge ${meta.cls}`} style={{ fontSize: 9, padding: '1px 5px' }}>
                      {meta.label}
                    </span>
                  </div>
                  <button
                    className={styles.deleteBtn}
                    onClick={(e) => { e.stopPropagation(); confirmDelete(t); }}
                    title="Delete topic"
                  >🗑</button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Topic editor */}
      <div className={styles.rightCol}>
        {selectedTopic ? (
          <TopicEditor
            topic={selectedTopic._new ? null : selectedTopic}
            onSaved={() => {
              qc.invalidateQueries({ queryKey: ['topics'] });
              setSelectedTopic(null);
            }}
          />
        ) : (
          <div className={styles.noSelection}>
            <span>📝</span>
            <p>Select a topic to edit, or create a new one.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TopicEditor({ topic, onSaved }) {
  const isNew = !topic;
  const [form, setForm] = useState({
    title:            topic?.title            || '',
    category:         topic?.category         || 'DSA',
    description:      topic?.description      || '',
    timeComplexity:   topic?.timeComplexity   || '',
    spaceComplexity:  topic?.spaceComplexity  || '',
    bruteForce:       topic?.bruteForce       || '',
    optimizedApproach:topic?.optimizedApproach|| '',
    whenToUse:        topic?.whenToUse        || '',
    memoryAnchor:     topic?.memoryAnchor     || '',
    story:            topic?.story            || '',
    analogy:          topic?.analogy          || '',
    firstPrinciples:  topic?.firstPrinciples  || '',
    starterCode:      topic?.starterCode      || '',
  });

  const [activeTab, setActiveTab] = useState('info');

  // ── Seed file loader state ────────────────────────────────────────────────
  const [showSeedLoader, setShowSeedLoader] = useState(false);
  const [selectedFile,   setSelectedFile]   = useState('');
  const [seedTopics,     setSeedTopics]     = useState([]);
  const [loadingTopics,  setLoadingTopics]  = useState(false);
  const [topicFilter,    setTopicFilter]    = useState('');

  const { data: seedFiles = [] } = useQuery({
    queryKey: QUERY_KEYS.seedFiles,
    queryFn:  adminApi.getSeedFiles,
    staleTime: 30_000,
  });

  async function handleFileSelect(filename) {
    setSelectedFile(filename);
    setSeedTopics([]);
    setTopicFilter('');
    if (!filename) return;
    setLoadingTopics(true);
    try {
      const topics = await adminApi.getTopicsFromSeedFile(filename);
      setSeedTopics(topics);
    } catch {
      toast.error('Could not load topics from file');
    } finally {
      setLoadingTopics(false);
    }
  }

  function handleLoadTopic(seedTopic) {
    setForm({
      title:             seedTopic.title             || '',
      category:          seedTopic.category          || 'DSA',
      description:       seedTopic.description       || '',
      timeComplexity:    seedTopic.timeComplexity     || '',
      spaceComplexity:   seedTopic.spaceComplexity    || '',
      bruteForce:        seedTopic.bruteForce         || '',
      optimizedApproach: seedTopic.optimizedApproach  || '',
      whenToUse:         seedTopic.whenToUse          || '',
      memoryAnchor:      seedTopic.memoryAnchor       || '',
      story:             seedTopic.story              || '',
      analogy:           seedTopic.analogy            || '',
      firstPrinciples:   seedTopic.firstPrinciples    || '',
      starterCode:       seedTopic.starterCode        || '',
    });
    setShowSeedLoader(false);
    toast.success(`Loaded "${seedTopic.title}" from seed file`);
  }

  const filteredSeedTopics = seedTopics.filter((t) =>
    !topicFilter || t.title.toLowerCase().includes(topicFilter.toLowerCase())
  );

  const mutation = useMutation({
    mutationFn: isNew
      ? (data) => adminApi.createTopic(data)
      : (data) => adminApi.updateTopic(topic.id, data),
    onSuccess: () => { toast.success(isNew ? 'Topic created!' : 'Topic updated!'); onSaved(); },
    onError: () => toast.error('Save failed'),
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className={styles.topicEditor}>
      <div className={styles.editorHeader}>
        <span className={styles.editorTitle}>{isNew ? '+ New Topic' : `Editing: ${topic.title}`}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {/* Seed file loader toggle */}
          <button
            className={`btn btn-ghost btn-sm ${showSeedLoader ? 'btn-primary' : ''}`}
            onClick={() => setShowSeedLoader((v) => !v)}
            title="Load fields from a seed JSON file"
          >
            📁 Load from seed
          </button>
          <button
            className="btn btn-primary btn-sm"
            disabled={mutation.isPending || !form.title}
            onClick={() => mutation.mutate(form)}
          >
            {mutation.isPending ? <><span className="spinner" />Saving…</> : '💾 Save'}
          </button>
        </div>
      </div>

      {/* ── Seed file loader panel ─────────────────────────────────── */}
      {showSeedLoader && (
        <div className={styles.seedLoaderPanel}>
          <div className={styles.seedLoaderHeader}>
            <span className={styles.seedLoaderTitle}>
              📁 Load from Seed File
            </span>
            <span className={styles.seedLoaderSub}>
              Pick a file, then click a topic to auto-fill all fields
            </span>
          </div>

          {/* File selector */}
          <div className={styles.seedFileSelect}>
            <select
              className="input"
              value={selectedFile}
              onChange={(e) => handleFileSelect(e.target.value)}
              style={{ fontSize: 12 }}
            >
              <option value="">— Select a seed file —</option>
              {seedFiles.map((f) => (
                <option key={f.filename} value={f.filename}>
                  {f.filename}
                  {f.topicCount ? ` (${f.topicCount} topics)` : ''}
                  {f.status === 'IMPORTED' ? ' ✓' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Topic list from file */}
          {selectedFile && (
            <>
              {loadingTopics ? (
                <div className={styles.seedLoaderMsg}>
                  <span className="spinner" /> Loading topics from {selectedFile}…
                </div>
              ) : seedTopics.length === 0 ? (
                <div className={styles.seedLoaderMsg}>No topics found in this file.</div>
              ) : (
                <>
                  <input
                    className="input"
                    style={{ fontSize: 12, marginBottom: 8 }}
                    placeholder={`🔍 Filter ${seedTopics.length} topics…`}
                    value={topicFilter}
                    onChange={(e) => setTopicFilter(e.target.value)}
                  />
                  <div className={styles.seedTopicList}>
                    {filteredSeedTopics.map((t, i) => (
                      <button
                        key={i}
                        className={styles.seedTopicRow}
                        onClick={() => handleLoadTopic(t)}
                      >
                        <div className={styles.seedTopicMain}>
                          <span className={styles.seedTopicTitle}>{t.title}</span>
                          <span className={`badge badge-${t.category?.toLowerCase() === 'dsa' ? 'dsa' : 'java'}`}
                            style={{ fontSize: 9 }}>
                            {t.category}
                          </span>
                        </div>
                        <div className={styles.seedTopicMeta}>
                          {t.exampleCount} examples · {t.problemCount} problems
                          {t.story ? ' · has story' : ''}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Editor tabs */}
      <div className="tab-bar">
        {[['info','📋 Info'],['story','📖 Story'],['code','💻 Code'], ...(!isNew ? [['problems','🎯 Problems']] : [])].map(([t,l]) => (
          <button key={t} className={`tab-btn ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
            {l}
          </button>
        ))}
      </div>

      <div className={styles.editorBody}>
        {activeTab === 'info' && (
          <div className={styles.formGrid}>
            <Field label="Title *" value={form.title} onChange={set('title')} />
            <div className={styles.fieldWrap}>
              <label className={styles.fieldLabel}>Category *</label>
              <select className={styles.select} value={form.category} onChange={set('category')}>
                {CATEGORIES.filter(c => c.key !== 'ALL').map(c =>
                  <option key={c.key} value={c.key}>{c.label}</option>
                )}
              </select>
            </div>
            <Field label="Description" value={form.description} onChange={set('description')} textarea rows={3} wide />
            <Field label="Time Complexity" value={form.timeComplexity} onChange={set('timeComplexity')} />
            <Field label="Space Complexity" value={form.spaceComplexity} onChange={set('spaceComplexity')} />
            <Field label="Brute Force" value={form.bruteForce} onChange={set('bruteForce')} textarea />
            <Field label="Optimized Approach" value={form.optimizedApproach} onChange={set('optimizedApproach')} textarea />
            <Field label="When to Use" value={form.whenToUse} onChange={set('whenToUse')} textarea />
          </div>
        )}
        {activeTab === 'story' && (
          <div className={styles.formGrid}>
            <Field label="Memory Anchor" value={form.memoryAnchor} onChange={set('memoryAnchor')} textarea wide />
            <Field label="Story" value={form.story} onChange={set('story')} textarea rows={5} wide />
            <Field label="Analogy" value={form.analogy} onChange={set('analogy')} textarea rows={4} wide />
            <Field label="First Principles" value={form.firstPrinciples} onChange={set('firstPrinciples')} textarea rows={4} wide />
          </div>
        )}
        {activeTab === 'code' && (
          <div className={styles.formGrid}>
            <Field label="Starter Code" value={form.starterCode} onChange={set('starterCode')} textarea rows={12} wide code />
          </div>
        )}
        {activeTab === 'problems' && !isNew && (
          <TopicProblemsPanel topicId={topic.id} />
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, textarea, rows = 2, wide, code }) {
  return (
    <div className={`${styles.fieldWrap} ${wide ? styles.wideField : ''}`}>
      <label className={styles.fieldLabel}>{label}</label>
      {textarea ? (
        <textarea
          className={`input ${code ? styles.codeTextarea : ''}`}
          value={value}
          onChange={onChange}
          rows={rows}
          style={{ resize: 'vertical', fontFamily: code ? 'var(--font-code)' : undefined, fontSize: code ? 12 : undefined }}
        />
      ) : (
        <input className="input" value={value} onChange={onChange} />
      )}
    </div>
  );
}

/* ── Topic Problems Panel ─────────────────────────────────────────────────────── */
function TopicProblemsPanel({ topicId }) {
  const qc = useQueryClient();
  const [editingProblem, setEditingProblem] = useState(null); // null | {} (new) | problem obj
  const queryKey = ['admin-topic-problems', topicId];

  const { data: problems = [], isLoading, refetch } = useQuery({
    queryKey,
    queryFn: () => topicsApi.getProblems(topicId),
    staleTime: 0,
  });

  const createMut = useMutation({
    mutationFn: (data) => adminApi.createProblem(topicId, data),
    onSuccess: () => { toast.success('Problem created'); setEditingProblem(null); refetch(); },
    onError: (e) => toast.error(e?.response?.data?.error || 'Create failed'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => adminApi.updateProblem(id, data),
    onSuccess: () => { toast.success('Problem updated'); setEditingProblem(null); refetch(); },
    onError: (e) => toast.error(e?.response?.data?.error || 'Update failed'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => adminApi.deleteProblem(id),
    onSuccess: () => { toast.success('Problem deleted'); refetch(); },
    onError: () => toast.error('Delete failed'),
  });

  if (editingProblem !== null) {
    return <ProblemForm
      problem={editingProblem?.id ? editingProblem : null}
      onCancel={() => setEditingProblem(null)}
      onSave={(data) => editingProblem?.id
        ? updateMut.mutate({ id: editingProblem.id, data })
        : createMut.mutate(data)
      }
      isPending={createMut.isPending || updateMut.isPending}
    />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>{problems.length} problem{problems.length !== 1 ? 's' : ''}</span>
        <button className="btn btn-primary btn-sm" onClick={() => setEditingProblem({})}>+ New Problem</button>
      </div>
      {isLoading ? (
        <div className={styles.loading}><span className="spinner" />Loading…</div>
      ) : problems.length === 0 ? (
        <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
          No problems yet. Click "+ New Problem" to add one.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {problems.map((p) => {
            const diff = getDiffMeta(p.difficulty);
            return (
              <div key={p.id} className={styles.problemRow}>
                <span className={styles.problemTitle}>{p.title}</span>
                <span className={`badge`} style={{ fontSize: 9, color: diff.color, borderColor: diff.color + '44', background: diff.bg, padding: '1px 6px', border: '1px solid', borderRadius: 4 }}>
                  {p.difficulty}
                </span>
                <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
                  <button className="btn btn-ghost btn-xs" onClick={() => setEditingProblem(p)}>✏️ Edit</button>
                  <button className="btn btn-danger btn-xs"
                    onClick={() => window.confirm(`Delete problem "${p.title}"?`) && deleteMut.mutate(p.id)}
                    disabled={deleteMut.isPending}
                  >🗑</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const BLANK_PROBLEM = () => ({
  title: '', description: '', difficulty: 'EASY',
  inputFormat: '', outputFormat: '', sampleInput: '', sampleOutput: '',
  constraints: '', hint: '', hint1: '', hint2: '', hint3: '',
  starterCode: '', testCases: '[]', pattern: '', editorial: '',
  displayOrder: 0,
});

function ProblemForm({ problem, onCancel, onSave, isPending }) {
  const isNew = !problem;
  const [form, setForm] = useState(problem ? {
    title: problem.title || '', description: problem.description || '',
    difficulty: problem.difficulty || 'EASY',
    inputFormat: problem.inputFormat || '', outputFormat: problem.outputFormat || '',
    sampleInput: problem.sampleInput || '', sampleOutput: problem.sampleOutput || '',
    constraints: problem.constraints || '', hint: problem.hint || '',
    hint1: problem.hint1 || '', hint2: problem.hint2 || '', hint3: problem.hint3 || '',
    starterCode: problem.starterCode || '', testCases: problem.testCases || '[]',
    pattern: problem.pattern || '', editorial: problem.editorial || '',
    displayOrder: problem.displayOrder || 0,
  } : BLANK_PROBLEM());

  const [tab, setTab] = useState('basic');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
          {isNew ? '+ New Problem' : `Editing: ${problem.title}`}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={() => onSave(form)} disabled={!form.title || isPending}>
            {isPending ? 'Saving…' : '💾 Save'}
          </button>
        </div>
      </div>
      <div className="tab-bar" style={{ marginBottom: 10 }}>
        {[['basic','📋 Basic'],['io','🔄 I/O'],['hints','💡 Hints'],['code','💻 Code'],['editorial','📖 Editorial']].map(([t,l]) => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{l}</button>
        ))}
      </div>
      {tab === 'basic' && (
        <div className={styles.formGrid}>
          <Field label="Title *" value={form.title} onChange={set('title')} wide />
          <div className={styles.fieldWrap}>
            <label className={styles.fieldLabel}>Difficulty *</label>
            <select className={styles.select} value={form.difficulty} onChange={set('difficulty')}>
              <option>EASY</option><option>MEDIUM</option><option>HARD</option>
            </select>
          </div>
          <Field label="Pattern" value={form.pattern} onChange={set('pattern')} />
          <Field label="Display Order" value={String(form.displayOrder)} onChange={set('displayOrder')} />
          <Field label="Description" value={form.description} onChange={set('description')} textarea rows={5} wide />
          <Field label="Constraints" value={form.constraints} onChange={set('constraints')} textarea rows={3} wide />
        </div>
      )}
      {tab === 'io' && (
        <div className={styles.formGrid}>
          <Field label="Input Format" value={form.inputFormat} onChange={set('inputFormat')} textarea rows={3} wide />
          <Field label="Output Format" value={form.outputFormat} onChange={set('outputFormat')} textarea rows={2} wide />
          <Field label="Sample Input" value={form.sampleInput} onChange={set('sampleInput')} textarea rows={3} wide code />
          <Field label="Sample Output" value={form.sampleOutput} onChange={set('sampleOutput')} textarea rows={2} wide code />
          <Field label="Test Cases (JSON)" value={form.testCases} onChange={set('testCases')} textarea rows={6} wide code />
        </div>
      )}
      {tab === 'hints' && (
        <div className={styles.formGrid}>
          <Field label="General Hint" value={form.hint} onChange={set('hint')} textarea rows={2} wide />
          <Field label="Hint 1" value={form.hint1} onChange={set('hint1')} textarea rows={2} wide />
          <Field label="Hint 2" value={form.hint2} onChange={set('hint2')} textarea rows={2} wide />
          <Field label="Hint 3" value={form.hint3} onChange={set('hint3')} textarea rows={2} wide />
        </div>
      )}
      {tab === 'code' && (
        <div className={styles.formGrid}>
          <Field label="Starter Code" value={form.starterCode} onChange={set('starterCode')} textarea rows={12} wide code />
        </div>
      )}
      {tab === 'editorial' && (
        <div className={styles.formGrid}>
          <Field label="Editorial" value={form.editorial} onChange={set('editorial')} textarea rows={6} wide />
        </div>
      )}
    </div>
  );
}

/* ── Users section ───────────────────────────────────────────────────────────── */
function UsersSection() {
  const SUPER_ADMIN = 'asaditya1826@gmail.com';
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.adminUsers,
    queryFn:  adminApi.getUsers,
    staleTime: 30 * 1000,
  });

  const grantMutation  = useMutation({
    mutationFn: adminApi.grantAdmin,
    onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEYS.adminUsers }); toast.success('Admin granted'); },
  });
  const revokeMutation = useMutation({
    mutationFn: adminApi.revokeAdmin,
    onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEYS.adminUsers }); toast.success('Admin revoked'); },
  });

  const users = data?.users || [];

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>Users ({users.length})</span>
        <span className={styles.sectionSub}>{data?.admins || 0} admins</span>
      </div>

      {isLoading ? (
        <div className={styles.loading}><span className="spinner" />Loading users…</div>
      ) : (
        <div className={styles.usersTable}>
          <table className={styles.table}>
            <thead><tr>
              <th>Name</th><th>Email</th><th>Role</th><th>Provider</th>
              <th>Streak</th><th>Solved</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td style={{ fontSize: 11, color: 'var(--text2)' }}>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === 'ADMIN' ? 'badge-admin' : 'badge-dsa'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--text3)' }}>{u.provider}</td>
                  <td style={{ fontSize: 12 }}>{u.streakDays > 0 ? `🔥 ${u.streakDays}` : '—'}</td>
                  <td style={{ fontSize: 12 }}>{u.problemsSolved}</td>
                  <td>
                    {u.email !== SUPER_ADMIN && (
                      u.role === 'ADMIN' ? (
                        <button
                          className="btn btn-danger btn-xs"
                          disabled={revokeMutation.isPending}
                          onClick={() => window.confirm(`Revoke admin from ${u.name}?`) && revokeMutation.mutate(u.id)}
                        >Revoke Admin</button>
                      ) : (
                        <button
                          className="btn btn-ghost btn-xs"
                          disabled={grantMutation.isPending}
                          onClick={() => window.confirm(`Grant admin to ${u.name}?`) && grantMutation.mutate(u.id)}
                        >Grant Admin</button>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── Seed / Import section ───────────────────────────────────────────────────── */
function SeedSection() {
  const qc = useQueryClient();
  const [mode, setMode] = useState('files'); // files | paste

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>Import Data</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['files', '📁 Predefined Files'], ['paste', '📋 Paste JSON']].map(([key, label]) => (
            <button
              key={key}
              className={`btn btn-sm ${mode === key ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setMode(key)}
            >{label}</button>
          ))}
        </div>
      </div>
      {mode === 'files' ? <SeedFilesPanel qc={qc} /> : <SeedPastePanel />}
    </div>
  );
}

function SeedFilesPanel({ qc }) {
  const { data: files = [], isLoading, refetch } = useQuery({
    queryKey: QUERY_KEYS.seedFiles,
    queryFn:  adminApi.getSeedFiles,
    staleTime: 10 * 1000,
  });

  const [expanded,  setExpanded]  = useState(null);   // filename of expanded row
  const [preview,   setPreview]   = useState({});      // filename → { loading, json, error }
  const [importing, setImporting] = useState(null);

  async function handleExpand(filename) {
    if (expanded === filename) { setExpanded(null); return; }
    setExpanded(filename);
    // Load preview if not already loaded
    if (!preview[filename]) {
      setPreview(p => ({ ...p, [filename]: { loading: true } }));
      try {
        const topics = await adminApi.getTopicsFromSeedFile(filename);
        setPreview(p => ({ ...p, [filename]: { loading: false, topics } }));
      } catch {
        setPreview(p => ({ ...p, [filename]: { loading: false, error: 'Could not load preview' } }));
      }
    }
  }

  async function handleImport(filename) {
    setImporting(filename);
    try {
      const res = await adminApi.importSeedFile(filename);
      toast.success(`Imported: ${res.topicsSeeded} topics · ${res.problemsSeeded} problems`);
      refetch();
      qc.invalidateQueries({ queryKey: QUERY_KEYS.adminStats });
      setExpanded(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Import failed');
    } finally {
      setImporting(null);
    }
  }

  async function handleImportAll() {
    const pending = files.filter(f => f.status === 'PENDING');
    for (const f of pending) await handleImport(f.filename);
  }

  const pending  = files.filter(f => f.status === 'PENDING');
  const imported = files.filter(f => f.status === 'IMPORTED');

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>
          {files.length} files · <span style={{ color: 'var(--success)' }}>{imported.length} imported</span>
          {' · '}<span style={{ color: 'var(--yellow)' }}>{pending.length} pending</span>
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => refetch()}>↻ Refresh</button>
          {pending.length > 0 && (
            <button className="btn btn-primary btn-sm" disabled={!!importing} onClick={handleImportAll}>
              ⚡ Import All Pending ({pending.length})
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className={styles.loading}><span className="spinner" />Loading files…</div>
      ) : (
        <div className={styles.seedFileList}>
          {files.map((file) => {
            const isOpen   = expanded === file.filename;
            const pv       = preview[file.filename] || {};
            const isImported = file.status === 'IMPORTED';
            const isImporting = importing === file.filename;

            return (
              <div key={file.filename} className={styles.seedFileCard}>

                {/* ── Row — always visible ── */}
                <div
                  className={styles.seedFileRow}
                  onClick={() => handleExpand(file.filename)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={styles.seedFileInfo}>
                    <span className={styles.seedFileName}>{file.filename}</span>
                    {isImported && (
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                        {file.topicsSeeded}t · {file.examplesSeeded}ex · {file.problemsSeeded}p
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {isImported ? (
                      <span className={styles.importedBadge}>✓ Imported</span>
                    ) : file.status === 'ERROR' ? (
                      <span className={styles.errorBadge}>⚠ Error</span>
                    ) : (
                      <span className={styles.pendingBadge}>Pending</span>
                    )}
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* ── Expanded preview ── */}
                {isOpen && (
                  <div className={styles.seedFilePreview}>
                    {pv.loading ? (
                      <div className={styles.loading}><span className="spinner" />Loading topics…</div>
                    ) : pv.error ? (
                      <div style={{ fontSize: 12, color: 'var(--red)' }}>{pv.error}</div>
                    ) : pv.topics ? (
                      <>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>
                          {pv.topics.length} topic{pv.topics.length !== 1 ? 's' : ''} in this file
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                          {pv.topics.map((t, i) => (
                            <div key={i} style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              padding: '6px 10px', background: 'var(--bg2)',
                              borderRadius: 'var(--radius)', border: '1px solid var(--border)',
                              fontSize: 12
                            }}>
                              <span style={{ flex: 1, fontWeight: 600, color: 'var(--text)' }}>{t.title}</span>
                              <span className={`badge badge-${(t.category||'').toLowerCase()==='dsa'?'dsa':'java'}`}
                                style={{ fontSize: 9 }}>{t.category}</span>
                              <span style={{ color: 'var(--text3)', fontSize: 11 }}>
                                {t.exampleCount}ex · {t.problemCount}p
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : null}

                    {/* Import action */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button
                        className={`btn btn-sm ${isImported ? 'btn-ghost' : 'btn-primary'}`}
                        disabled={isImported || isImporting || !!importing}
                        onClick={(e) => { e.stopPropagation(); handleImport(file.filename); }}
                      >
                        {isImporting
                          ? <><span className="spinner" /> Importing…</>
                          : isImported ? '✓ Already Imported' : '↑ Import this file'}
                      </button>
                      {isImported && file.appliedAt && (
                        <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                          Imported {new Date(file.appliedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function SeedPastePanel() {
  const [json, setJson]     = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSeed() {
    let payload;
    try { payload = JSON.parse(json); }
    catch { toast.error('Invalid JSON'); return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await adminApi.seedBatch(payload);
      setResult(res);
      if (res.success) toast.success(`Seeded ${res.topicsSeeded} topics!`);
      else toast.error('Seed completed with errors');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Seed failed');
    } finally { setLoading(false); }
  }

  return (
    <>
      <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12, lineHeight: 1.6 }}>
        Paste a seed batch JSON to import topics, examples, and problems.
        Set <code style={{ background: 'var(--bg3)', padding: '1px 4px', borderRadius: 3, fontSize: 11 }}>skipExisting: true</code> to skip already-imported topics.
      </p>
      <textarea
        className={styles.jsonInput}
        value={json}
        onChange={(e) => setJson(e.target.value)}
        placeholder={`{\n  "batchName": "Core Java",\n  "skipExisting": true,\n  "topics": [...]\n}`}
        rows={20}
      />
      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        <button className="btn btn-primary" disabled={loading || !json.trim()} onClick={handleSeed}>
          {loading ? <><span className="spinner" />Importing…</> : '📦 Import Batch'}
        </button>
        <button className="btn btn-ghost" onClick={() => { setJson(''); setResult(null); }}>Clear</button>
      </div>
      {result && (
        <div className={`${styles.resultBox} ${result.success ? styles.success : styles.partial}`}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>{result.message}</div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>
            Topics: {result.topicsSeeded} seeded, {result.topicsSkipped} skipped ·
            Examples: {result.examplesSeeded} · Problems: {result.problemsSeeded}
          </div>
          {result.errors?.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {result.errors.map((e, i) => (
                <div key={i} style={{ fontSize: 11, color: 'var(--red)', marginTop: 3 }}>⚠ {e}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

/* ── Stats section ───────────────────────────────────────────────────────────── */
function StatsSection() {
  const qc = useQueryClient();
  const { data, isLoading, refetch } = useQuery({
    queryKey: QUERY_KEYS.adminStats,
    queryFn:  adminApi.getStats,
    staleTime: 30 * 1000,
  });

  const clearMutation = useMutation({
    mutationFn: adminApi.clearAllData,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['topics'] });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.adminStats });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.seedFiles });
      toast.success('All data cleared successfully');
      refetch();
    },
    onError: (err) => toast.error('Clear failed: ' + (err?.response?.data?.message || err?.message || 'unknown error')),
  });

  function handleClearAll() {
    if (!window.confirm(
      '⚠️ DELETE ALL DATA?\n\nThis will permanently remove ALL topics, examples, problems AND import history from the database.\n\nYou will need to re-import all seed files afterwards.\n\nConfirm?'
    )) return;
    clearMutation.mutate();
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>Database Stats</span>
        <button className="btn btn-ghost btn-sm" onClick={() => refetch()}>↻ Refresh</button>
      </div>
      {isLoading ? (
        <div className={styles.loading}><span className="spinner" />Loading stats…</div>
      ) : data ? (
        <>
          <div className={styles.statsGrid}>
            {[
              { label: 'Topics',   value: data.topics,   icon: '📚', color: 'var(--accent)' },
              { label: 'Examples', value: data.examples, icon: '💡', color: 'var(--blue)' },
              { label: 'Problems', value: data.problems, icon: '🎯', color: 'var(--yellow)' },
              { label: 'Total',    value: data.total,    icon: '∑',  color: 'var(--purple)' },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className={styles.statCard}>
                <div className={styles.statIcon} style={{ color }}>{icon}</div>
                <div className={styles.statNum} style={{ color }}>{value}</div>
                <div className={styles.statLabel}>{label}</div>
              </div>
            ))}
          </div>
          {data.byCategory && (
            <div className={styles.catStats}>
              <div className={styles.catStatsTitle}>Topics by Category</div>
              {Object.entries(data.byCategory).map(([cat, count]) => {
                if (!count) return null;
                const meta = getCategoryMeta(cat);
                return (
                  <div key={cat} className={styles.catStatRow}>
                    <span className={`badge ${meta.cls}`}>{meta.label}</span>
                    <div className={styles.catBar}>
                      <div
                        className={styles.catBarFill}
                        style={{ width: `${Math.min((count / 50) * 100, 100)}%`, background: meta.color }}
                      />
                    </div>
                    <span className={styles.catCount}>{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : null}

      {/* ── Danger Zone ─────────────────────────────────────────────────── */}
      <div className={styles.dangerZone}>
        <div className={styles.dangerHeader}>
          <span className={styles.dangerTitle}>⚠️ Danger Zone</span>
          <span className={styles.dangerSub}>These actions are irreversible</span>
        </div>
        <div className={styles.dangerRow}>
          <div className={styles.dangerInfo}>
            <div className={styles.dangerActionTitle}>Clear All Data</div>
            <div className={styles.dangerActionDesc}>
              Permanently delete all topics, examples, problems and import history.
              You will need to re-import seed files afterwards.
            </div>
          </div>
          <button
            className={styles.clearAllBtn}
            disabled={clearMutation.isPending}
            onClick={handleClearAll}
          >
            {clearMutation.isPending
              ? <><span className="spinner" /> Clearing…</>
              : '🗑 Clear All Data'}
          </button>
        </div>
      </div>
    </div>
  );
}