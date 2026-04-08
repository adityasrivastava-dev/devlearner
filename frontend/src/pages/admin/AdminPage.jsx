import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminApi, topicsApi, QUERY_KEYS } from '../../api';
import { getCategoryMeta, getDiffMeta, CATEGORIES } from '../../utils/helpers';
import toast from 'react-hot-toast';
import styles from './AdminPage.module.css';
import JsonBuilderSection from './JsonBuilderSection';
import QuizAdminSection from './QuizAdminSection';

export default function AdminPage() {
  const navigate   = useNavigate();
  const qc         = useQueryClient();
  const [section, setSection] = useState('topics'); // topics | users | seed | build | stats

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
            { key: 'topics',  icon: '📚', label: 'Topics' },
            { key: 'users',   icon: '👥', label: 'Users' },
            { key: 'seed',    icon: '📦', label: 'Import JSON' },
            { key: 'build',   icon: '🛠', label: 'Build JSON' },
            { key: 'quiz',    icon: '🧠', label: 'Quiz' },
            { key: 'stats',   icon: '📊', label: 'Stats' },
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
        {section === 'topics' && <TopicsSection qc={qc} />}
        {section === 'users'  && <UsersSection />}
        {section === 'seed'   && <SeedSection />}
        {section === 'build'  && <div className={styles.section}><div className={styles.sectionHeader}><span className={styles.sectionTitle}>JSON Builder</span></div><JsonBuilderSection /></div>}
        {section === 'quiz'   && <QuizAdminSection />}
        {section === 'stats'  && <StatsSection />}
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
        {[['info','📋 Info'],['story','📖 Story'],['code','💻 Code']].map(([t,l]) => (
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

  const [importing, setImporting] = useState(null); // filename currently being imported

  async function handleImport(filename) {
    setImporting(filename);
    try {
      const res = await adminApi.importSeedFile(filename);
      toast.success(`Imported: ${res.topicsSeeded} topics · ${res.problemsSeeded} problems`);
      refetch();
      qc.invalidateQueries({ queryKey: QUERY_KEYS.adminStats });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Import failed');
    } finally {
      setImporting(null);
    }
  }

  async function handleImportAll() {
    const pending = files.filter(f => f.status === 'PENDING');
    for (const f of pending) {
      await handleImport(f.filename);
    }
  }

  const pending = files.filter(f => f.status === 'PENDING');
  const imported = files.filter(f => f.status === 'IMPORTED');

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>
          {files.length} files · <span style={{ color: 'var(--accent)' }}>{imported.length} imported</span>
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
              ⚡ Import All Pending ({pending.length})
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className={styles.loading}><span className="spinner" />Loading files…</div>
      ) : (
        <div className={styles.seedFileList}>
          {files.map((file) => (
            <div key={file.filename} className={styles.seedFileRow}>

              {/* File info */}
              <div className={styles.seedFileInfo}>
                <span className={styles.seedFileName}>{file.filename}</span>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                  {file.topicCount} topic{file.topicCount !== 1 ? 's' : ''}
                  {file.status === 'IMPORTED' && (
                    <> · {file.topicsSeeded}t · {file.examplesSeeded}ex · {file.problemsSeeded}p</>
                  )}
                </span>
              </div>

              {/* Status badge */}
              <div style={{ minWidth: 100, textAlign: 'right' }}>
                {file.status === 'IMPORTED' ? (
                  <span className={styles.importedBadge}>✓ Imported</span>
                ) : file.status === 'ERROR' ? (
                  <span className={styles.errorBadge} title={file.errorMessage}>⚠ Error</span>
                ) : (
                  <span className={styles.pendingBadge}>Pending</span>
                )}
              </div>

              {/* Import button */}
              <button
                className={`btn btn-sm ${file.status === 'IMPORTED' ? 'btn-ghost' : 'btn-primary'}`}
                disabled={file.status === 'IMPORTED' || importing === file.filename || !!importing}
                onClick={() => handleImport(file.filename)}
                style={{ minWidth: 90 }}
              >
                {importing === file.filename
                  ? <><span className="spinner" /> Importing…</>
                  : file.status === 'IMPORTED'
                    ? '✓ Done'
                    : '↑ Import'}
              </button>
            </div>
          ))}
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