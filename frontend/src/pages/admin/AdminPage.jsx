import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminApi, topicsApi, algorithmAdminApi, interviewApi, QUERY_KEYS } from '../../api';
import { getCategoryMeta, getDiffMeta, CATEGORIES } from '../../utils/helpers';
import toast from 'react-hot-toast';
import styles from './AdminPage.module.css';
import JsonBuilderSection from './JsonBuilderSection';
import QuizAdminSection from './QuizAdminSection';
import AlgorithmAdminSection from './AlgorithmAdminSection';
import InterviewAdminSection from './InterviewAdminSection';

export default function AdminPage() {
  const navigate   = useNavigate();
  const qc         = useQueryClient();
  const [section, setSection] = useState('topics'); // topics | users | seed | build | quiz | algorithms | interview | stats | quickimport

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
            { key: 'topics',      icon: '📚', label: 'Topics' },
            { key: 'users',       icon: '👥', label: 'Users' },
            { key: 'quickimport', icon: '⚡', label: 'Quick Import' },
            { key: 'seed',        icon: '📦', label: 'Seed Files' },
            { key: 'build',       icon: '🛠', label: 'Build JSON' },
            { key: 'quiz',        icon: '🧠', label: 'Quiz' },
            { key: 'algorithms',  icon: '∑',  label: 'Algorithms' },
            { key: 'interview',   icon: '📋', label: 'Interview Q&A' },
            { key: 'stats',       icon: '📊', label: 'Stats' },
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
        {section === 'topics'      && <TopicsSection qc={qc} />}
        {section === 'users'       && <UsersSection />}
        {section === 'quickimport' && <QuickImportSection />}
        {section === 'seed'        && <SeedSection />}
        {section === 'build'       && <div className={styles.section}><div className={styles.sectionHeader}><span className={styles.sectionTitle}>JSON Builder</span></div><JsonBuilderSection /></div>}
        {section === 'quiz'        && <QuizAdminSection />}
        {section === 'algorithms'  && <AlgorithmAdminSection />}
        {section === 'interview'   && <InterviewAdminSection />}
        {section === 'stats'       && <StatsSection />}
      </div>
    </div>
  );
}

/* ── Topics section ──────────────────────────────────────────────────────────── */
function TopicsSection({ qc }) {
  const [catFilter, setCatFilter] = useState('ALL');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [confirmingTopicId, setConfirmingTopicId] = useState(null);

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
    if (confirmingTopicId !== topic.id) { setConfirmingTopicId(topic.id); return; }
    setConfirmingTopicId(null);
    deleteMutation.mutate(topic.id);
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
                  {confirmingTopicId === t.id ? (
                    <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                      <button className="btn btn-danger btn-xs" onClick={() => confirmDelete(t)}>Yes</button>
                      <button className="btn btn-ghost btn-xs" onClick={() => setConfirmingTopicId(null)}>✕</button>
                    </div>
                  ) : (
                    <button
                      className={styles.deleteBtn}
                      onClick={(e) => { e.stopPropagation(); confirmDelete(t); }}
                      title="Delete topic"
                    >🗑</button>
                  )}
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
    subCategory:      topic?.subCategory      || '',
    displayOrder:     topic?.displayOrder     ?? 999,
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
    youtubeUrls:      topic?.youtubeUrls      || '',
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
      youtubeUrls:       seedTopic.youtubeUrls        || '',
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
        {[
          ['info',      '📋 Info'],
          ['story',     '📖 Story'],
          ['code',      '💻 Code'],
          ['videos',    '▶ Videos'],
          ['questions', '🎯 Q&A'],
          ...(!isNew ? [['examples', '💡 Examples'], ['problems', '🎯 Problems']] : []),
        ].map(([t,l]) => (
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
            <Field label="Sub-Category (section heading in sidebar)" value={form.subCategory} onChange={set('subCategory')} placeholder="e.g. OOP (VERY IMPORTANT)" wide />
            <Field label="Display Order (lower = first)" value={form.displayOrder} onChange={set('displayOrder')} type="number" />
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
        {activeTab === 'videos' && (
          <div className={styles.formGrid}>
            <div className={styles.fieldWrap} style={{ gridColumn: '1 / -1' }}>
              <label className={styles.fieldLabel}>YouTube URLs</label>
              <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>
                Paste one URL per line, or as a JSON array. Shown in the Videos tab of the topic.
              </p>
              <textarea
                className={styles.textarea}
                rows={8}
                value={form.youtubeUrls}
                onChange={set('youtubeUrls')}
                placeholder={'One URL per line:\nhttps://youtu.be/abc123\nhttps://youtu.be/xyz456\n\nOr as JSON array:\n["https://youtu.be/abc123","https://youtu.be/xyz456"]'}
              />
            </div>
          </div>
        )}
        {activeTab === 'code' && (
          <div className={styles.formGrid}>
            <Field label="Starter Code" value={form.starterCode} onChange={set('starterCode')} textarea rows={12} wide code />
          </div>
        )}
        {activeTab === 'questions' && (
          <TopicQAPanel category={form.category} topicTitle={form.title} />
        )}
        {activeTab === 'examples' && !isNew && (
          <TopicExamplesPanel topicId={topic.id} />
        )}
        {activeTab === 'problems' && !isNew && (
          <TopicProblemsPanel topicId={topic.id} />
        )}
      </div>
    </div>
  );
}

// ── Topic Q&A Panel ───────────────────────────────────────────────────────────
function TopicQAPanel({ category, topicTitle }) {
  const EMPTY = { question: '', answer: '', difficulty: 'MEDIUM', codeExample: '' };
  const [pairs, setPairs] = useState([{ ...EMPTY }]);
  const [importing, setImporting] = useState(false);

  function updatePair(i, field, value) {
    setPairs(p => p.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  }
  function addPair()      { setPairs(p => [...p, { ...EMPTY }]); }
  function removePair(i)  { setPairs(p => p.filter((_, idx) => idx !== i)); }

  async function handleImport() {
    const valid = pairs.filter(p => p.question.trim() && p.answer.trim());
    if (!valid.length) return toast.error('Add at least one question + answer');
    if (!category)     return toast.error('Save the topic category first');

    const payload = valid.map((p, i) => ({
      category,
      topicTitle:  topicTitle || null,
      question:    p.question.trim(),
      quickAnswer: p.answer.trim(),
      difficulty:  p.difficulty || 'MEDIUM',
      codeExample: p.codeExample?.trim() || null,
      displayOrder: i,
    }));

    setImporting(true);
    try {
      const res = await interviewApi.bulkImport(payload);
      toast.success(`Imported ${res.imported ?? valid.length} question(s) for ${category}`);
      setPairs([{ ...EMPTY }]);
    } catch {
      toast.error('Import failed');
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className={styles.qaPanel}>
      <div className={styles.qaPanelHeader}>
        <div>
          <div className={styles.qaPanelTitle}>Interview Q&amp;A for <strong>{topicTitle || 'this topic'}</strong></div>
          <div className={styles.qaPanelSub}>
            Saved as <strong>{category}</strong> → <strong>{topicTitle || '(save topic first)'}</strong>.
            Shown only on this topic's Notes tab. Falls back to category questions if none exist.
            Duplicates are skipped automatically.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button className="btn btn-ghost btn-sm" onClick={addPair}>+ Add Row</button>
          <button className="btn btn-primary btn-sm" disabled={importing} onClick={handleImport}>
            {importing ? <><span className="spinner" />Importing…</> : '⬆ Import Questions'}
          </button>
        </div>
      </div>

      <div className={styles.qaList}>
        {pairs.map((pair, i) => (
          <div key={i} className={styles.qaPair}>
            <div className={styles.qaPairNum}>{i + 1}</div>
            <div className={styles.qaPairFields}>
              <input
                className="input"
                placeholder="Question — e.g. What is the difference between == and equals()?"
                value={pair.question}
                onChange={e => updatePair(i, 'question', e.target.value)}
              />
              <textarea
                className="input"
                placeholder="Answer / Quick explanation…"
                value={pair.answer}
                onChange={e => updatePair(i, 'answer', e.target.value)}
                rows={3}
                style={{ resize: 'vertical' }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  className="input"
                  value={pair.difficulty}
                  onChange={e => updatePair(i, 'difficulty', e.target.value)}
                  style={{ flex: '0 0 120px' }}
                >
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
                <input
                  className="input"
                  placeholder="Code example (optional)"
                  value={pair.codeExample}
                  onChange={e => updatePair(i, 'codeExample', e.target.value)}
                  style={{ flex: 1, fontFamily: 'var(--font-code)', fontSize: 12 }}
                />
              </div>
            </div>
            <button
              className={styles.qaPairRemove}
              onClick={() => removePair(i)}
              title="Remove"
              disabled={pairs.length === 1}
            >✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, textarea, rows = 2, wide, code, type = 'text', placeholder }) {
  return (
    <div className={`${styles.fieldWrap} ${wide ? styles.wideField : ''}`}>
      <label className={styles.fieldLabel}>{label}</label>
      {textarea ? (
        <textarea
          className={`input ${code ? styles.codeTextarea : ''}`}
          value={value}
          onChange={onChange}
          rows={rows}
          placeholder={placeholder}
          style={{ resize: 'vertical', fontFamily: code ? 'var(--font-code)' : undefined, fontSize: code ? 12 : undefined }}
        />
      ) : (
        <input className="input" type={type} value={value} onChange={onChange} placeholder={placeholder} />
      )}
    </div>
  );
}

/* ── Topic Examples Panel ─────────────────────────────────────────────────────── */
function TopicExamplesPanel({ topicId }) {
  const [editing, setEditing] = useState(null); // null | {} (new) | example obj
  const [confirmingExId, setConfirmingExId] = useState(null);
  const queryKey = ['admin-topic-examples', topicId];

  const { data: examples = [], isLoading, refetch } = useQuery({
    queryKey,
    queryFn: () => topicsApi.getExamples(topicId),
    staleTime: 0,
  });

  const createMut = useMutation({
    mutationFn: (data) => adminApi.createExample(topicId, data),
    onSuccess: () => { toast.success('Example created'); setEditing(null); refetch(); },
    onError: (e) => toast.error(e?.response?.data?.error || 'Create failed'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => adminApi.updateExample(id, data),
    onSuccess: () => { toast.success('Example updated'); setEditing(null); refetch(); },
    onError: (e) => toast.error(e?.response?.data?.error || 'Update failed'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => adminApi.deleteExample(id),
    onSuccess: () => { toast.success('Example deleted'); refetch(); },
    onError: () => toast.error('Delete failed'),
  });

  if (editing !== null) {
    return <ExampleForm
      example={editing?.id ? editing : null}
      onCancel={() => setEditing(null)}
      onSave={(data) => editing?.id
        ? updateMut.mutate({ id: editing.id, data })
        : createMut.mutate(data)
      }
      isPending={createMut.isPending || updateMut.isPending}
    />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>{examples.length} example{examples.length !== 1 ? 's' : ''}</span>
        <button className="btn btn-primary btn-sm" onClick={() => setEditing({})}>+ New Example</button>
      </div>
      {isLoading ? (
        <div className={styles.loading}><span className="spinner" />Loading…</div>
      ) : examples.length === 0 ? (
        <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
          No examples yet. Click "+ New Example" to add one.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {examples.map((ex) => (
            <div key={ex.id} className={styles.problemRow}>
              <span className={styles.problemTitle}>{ex.title || '(untitled)'}</span>
              <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 8, flexShrink: 0 }}>
                {ex.code ? 'has code' : ''}{ex.code && ex.pseudocode ? ' · ' : ''}{ex.pseudocode ? 'has pseudocode' : ''}
              </span>
              <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
                <button className="btn btn-ghost btn-xs" onClick={() => setEditing(ex)}>✏️ Edit</button>
                {confirmingExId === ex.id ? (
                  <>
                    <button className="btn btn-danger btn-xs" onClick={() => { setConfirmingExId(null); deleteMut.mutate(ex.id); }}>Yes</button>
                    <button className="btn btn-ghost btn-xs" onClick={() => setConfirmingExId(null)}>✕</button>
                  </>
                ) : (
                  <button className="btn btn-danger btn-xs"
                    onClick={() => setConfirmingExId(ex.id)}
                    disabled={deleteMut.isPending}
                  >🗑</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const BLANK_EXAMPLE = () => ({
  title: '', description: '', code: '', explanation: '',
  realWorldUse: '', pseudocode: '', flowchartMermaid: '', displayOrder: 0,
});

function ExampleForm({ example, onCancel, onSave, isPending }) {
  const isNew = !example;
  const [form, setForm] = useState(example ? {
    title: example.title || '',
    description: example.description || '',
    code: example.code || '',
    explanation: example.explanation || '',
    realWorldUse: example.realWorldUse || '',
    pseudocode: example.pseudocode || '',
    flowchartMermaid: example.flowchartMermaid || '',
    displayOrder: example.displayOrder || 0,
  } : BLANK_EXAMPLE());
  const [tab, setTab] = useState('basic');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
          {isNew ? '+ New Example' : `Editing: ${example.title}`}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={() => onSave(form)} disabled={!form.title || isPending}>
            {isPending ? 'Saving…' : '💾 Save'}
          </button>
        </div>
      </div>
      <div className="tab-bar" style={{ marginBottom: 10 }}>
        {[['basic','📋 Basic'],['code','💻 Code'],['pseudocode','📝 Pseudocode']].map(([t,l]) => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{l}</button>
        ))}
      </div>
      {tab === 'basic' && (
        <div className={styles.formGrid}>
          <Field label="Title *" value={form.title} onChange={set('title')} wide />
          <Field label="Display Order" value={String(form.displayOrder)} onChange={set('displayOrder')} type="number" />
          <Field label="Description" value={form.description} onChange={set('description')} textarea rows={4} wide />
          <Field label="Explanation" value={form.explanation} onChange={set('explanation')} textarea rows={3} wide />
          <Field label="Real World Use" value={form.realWorldUse} onChange={set('realWorldUse')} textarea rows={2} wide />
        </div>
      )}
      {tab === 'code' && (
        <div className={styles.formGrid}>
          <Field label="Java Code" value={form.code} onChange={set('code')} textarea rows={14} wide code />
        </div>
      )}
      {tab === 'pseudocode' && (
        <div className={styles.formGrid}>
          <Field label="Pseudocode" value={form.pseudocode} onChange={set('pseudocode')} textarea rows={10} wide code />
          <Field label="Flowchart Mermaid (optional)" value={form.flowchartMermaid} onChange={set('flowchartMermaid')} textarea rows={8} wide code />
        </div>
      )}
    </div>
  );
}

/* ── Topic Problems Panel ─────────────────────────────────────────────────────── */
function TopicProblemsPanel({ topicId }) {
  const [editingProblem, setEditingProblem] = useState(null); // null | {} (new) | problem obj
  const [bulkMode, setBulkMode] = useState(false);
  const [confirmingProblemId, setConfirmingProblemId] = useState(null);
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

  if (bulkMode) {
    return <BulkProblemsPanel
      topicId={topicId}
      onDone={() => { setBulkMode(false); refetch(); }}
    />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>{problems.length} problem{problems.length !== 1 ? 's' : ''}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setBulkMode(true)}>📋 Bulk Add</button>
          <button className="btn btn-primary btn-sm" onClick={() => setEditingProblem({})}>+ New Problem</button>
        </div>
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
                  {confirmingProblemId === p.id ? (
                    <>
                      <button className="btn btn-danger btn-xs" onClick={() => { setConfirmingProblemId(null); deleteMut.mutate(p.id); }}>Yes</button>
                      <button className="btn btn-ghost btn-xs" onClick={() => setConfirmingProblemId(null)}>✕</button>
                    </>
                  ) : (
                    <button className="btn btn-danger btn-xs"
                      onClick={() => setConfirmingProblemId(p.id)}
                      disabled={deleteMut.isPending}
                    >🗑</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Bulk Problems Paste ──────────────────────────────────────────────────────── */
const BULK_PROBLEMS_TEMPLATE = JSON.stringify([
  {
    title: "Two Sum",
    difficulty: "EASY",
    description: "Given an array of integers, return indices of the two numbers that add up to a target.",
    inputFormat: "Array of integers + target",
    outputFormat: "Indices as array",
    sampleInput: "[2,7,11,15]\n9",
    sampleOutput: "[0,1]",
    constraints: "2 <= nums.length <= 10^4",
    hint: "Think about what complement you need.",
    hint1: "For each number, what value do you need to reach the target?",
    hint2: "Use a HashMap to store seen values.",
    hint3: "Map stores value → index. Check if complement exists before adding.",
    starterCode: "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // your code\n    }\n}",
    testCases: JSON.stringify([
      { input: "[2,7,11,15]\n9", expectedOutput: "[0, 1]" },
      { input: "[3,2,4]\n6", expectedOutput: "[1, 2]" },
    ]),
    pattern: "HashMap",
    editorial: "Use a HashMap to store value→index. For each element, check if target-nums[i] exists in the map.",
    displayOrder: 1,
  },
], null, 2);

function BulkProblemsPanel({ topicId, onDone }) {
  const [json, setJson] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleImport() {
    let arr;
    try { arr = JSON.parse(json); }
    catch { toast.error('Invalid JSON — must be an array of problems'); return; }
    if (!Array.isArray(arr)) { toast.error('JSON must be an array [ {...}, {...} ]'); return; }

    setLoading(true);
    setResult(null);
    let created = 0, errors = [];
    for (const p of arr) {
      try {
        await adminApi.createProblem(topicId, p);
        created++;
      } catch (e) {
        errors.push(`"${p.title || '?'}": ${e?.response?.data?.error || e.message}`);
      }
    }
    setLoading(false);
    setResult({ created, errors });
    if (created > 0) toast.success(`${created} problem${created !== 1 ? 's' : ''} created`);
    if (errors.length) toast.error(`${errors.length} failed`);
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>📋 Bulk Add Problems</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setJson(BULK_PROBLEMS_TEMPLATE)}>📄 Template</button>
          <button className="btn btn-ghost btn-sm" onClick={onDone}>← Back</button>
        </div>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8, lineHeight: 1.6 }}>
        Paste a JSON array of problem objects. Each object should have at minimum <code style={{ background: 'var(--bg3)', padding: '1px 4px', borderRadius: 3 }}>title</code> and <code style={{ background: 'var(--bg3)', padding: '1px 4px', borderRadius: 3 }}>difficulty</code>.
        Click <strong>Template</strong> to see the full schema.
      </p>
      <textarea
        className={styles.jsonInput}
        value={json}
        onChange={(e) => setJson(e.target.value)}
        placeholder={'[\n  { "title": "...", "difficulty": "EASY", ... },\n  { "title": "...", "difficulty": "MEDIUM", ... }\n]'}
        rows={18}
      />
      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        <button className="btn btn-primary" disabled={loading || !json.trim()} onClick={handleImport}>
          {loading ? <><span className="spinner" />Importing…</> : '📦 Import All'}
        </button>
        <button className="btn btn-ghost" onClick={() => { setJson(''); setResult(null); }}>Clear</button>
        {result?.created > 0 && (
          <button className="btn btn-ghost" onClick={onDone}>← Back to list</button>
        )}
      </div>
      {result && (
        <div className={`${styles.resultBox} ${result.errors.length === 0 ? styles.success : styles.partial}`} style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{result.created} created · {result.errors.length} failed</div>
          {result.errors.map((e, i) => (
            <div key={i} style={{ fontSize: 11, color: 'var(--red)', marginTop: 2 }}>⚠ {e}</div>
          ))}
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
  const [confirmingUser, setConfirmingUser] = useState(null); // { id, action: 'grant'|'revoke' }

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
                      confirmingUser?.id === u.id ? (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            className="btn btn-danger btn-xs"
                            onClick={() => {
                              const a = confirmingUser.action;
                              setConfirmingUser(null);
                              if (a === 'revoke') revokeMutation.mutate(u.id);
                              else grantMutation.mutate(u.id);
                            }}
                          >Yes</button>
                          <button className="btn btn-ghost btn-xs" onClick={() => setConfirmingUser(null)}>✕</button>
                        </div>
                      ) : u.role === 'ADMIN' ? (
                        <button
                          className="btn btn-danger btn-xs"
                          disabled={revokeMutation.isPending}
                          onClick={() => setConfirmingUser({ id: u.id, action: 'revoke' })}
                        >Revoke Admin</button>
                      ) : (
                        <button
                          className="btn btn-ghost btn-xs"
                          disabled={grantMutation.isPending}
                          onClick={() => setConfirmingUser({ id: u.id, action: 'grant' })}
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

/* ── Quick Import ────────────────────────────────────────────────────────────── */
// Detects JSON type from keys and routes to the right API
function QuickImportSection() {
  const qc = useQueryClient();
  const [json, setJson] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detected, setDetected] = useState(null);
  const fileInputRef = useRef(null);

  function detectType(obj) {
    if (obj?.topics    && Array.isArray(obj.topics))     return 'topics';
    if (obj?.algorithms && Array.isArray(obj.algorithms)) return 'algorithms';
    if (obj?.questions && Array.isArray(obj.questions))  return 'quiz';
    if (Array.isArray(obj) && obj[0]?.slug)              return 'algorithms';
    if (Array.isArray(obj) && obj[0]?.questions)         return 'quiz';
    return null;
  }

  function handleChange(text) {
    setJson(text);
    setResult(null);
    setDetected(null);
    if (!text.trim()) return;
    try {
      const obj = JSON.parse(text);
      setDetected(detectType(obj));
    } catch {
      // ignore
    }
  }

  function handleFileLoad(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => handleChange(ev.target.result);
    reader.readAsText(file);
    e.target.value = '';
  }

  async function handleImport() {
    let obj;
    try { obj = JSON.parse(json); }
    catch { toast.error('Invalid JSON'); return; }

    const type = detectType(obj);
    if (!type) {
      toast.error('Could not detect type. Need { topics:[...] }, { algorithms:[...] }, or { questions:[...] }');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      let res;
      if (type === 'topics')     res = await adminApi.seedBatch(obj);
      if (type === 'algorithms') res = await algorithmAdminApi.seedBatch(obj);
      if (type === 'quiz') {
        res = await adminApi.pasteQuizSet(obj);
      }
      setResult({ type, res });
      qc.invalidateQueries({ queryKey: ['topics'] });
      qc.invalidateQueries({ queryKey: ['algorithms'] });
      qc.invalidateQueries({ queryKey: ['quiz-admin-sets'] });
      toast.success('Import complete!');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  }

  const TYPE_META = {
    topics:     { icon: '📚', label: 'Topics batch', color: 'var(--accent)' },
    algorithms: { icon: '∑',  label: 'Algorithms batch', color: 'var(--purple)' },
    quiz:       { icon: '🧠', label: 'Quiz set', color: 'var(--yellow)' },
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <div>
          <span className={styles.sectionTitle}>⚡ Quick Import</span>
          <span className={styles.sectionSub} style={{ marginLeft: 10 }}>
            Paste or drop any JSON — topics, algorithms, or quiz sets. Type is auto-detected.
          </span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => fileInputRef.current?.click()}>
          📁 Upload File
        </button>
        <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileLoad} />
      </div>

      {/* Type indicator */}
      {detected && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 12px', borderRadius: 20, marginBottom: 10,
          background: `${TYPE_META[detected]?.color}18`,
          border: `1px solid ${TYPE_META[detected]?.color}44`,
          fontSize: 12, fontWeight: 600, color: TYPE_META[detected]?.color,
        }}>
          {TYPE_META[detected]?.icon} Detected: {TYPE_META[detected]?.label}
        </div>
      )}
      {json.trim() && !detected && (() => {
        try { JSON.parse(json); return (
          <div style={{ fontSize: 12, color: 'var(--yellow)', marginBottom: 8 }}>
            ⚠ JSON is valid but type not recognized. Expected: topics/algorithms/questions arrays.
          </div>
        ); } catch { return (
          <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 8 }}>
            ✗ Invalid JSON
          </div>
        ); }
      })()}

      <textarea
        className={styles.jsonInput}
        value={json}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={`Paste any seed JSON here — topics batch, algorithms batch, or quiz set JSON.\n\nExamples:\n  { "batchName": "...", "topics": [...] }\n  { "batchName": "...", "algorithms": [...] }\n  { "title": "...", "questions": [...] }`}
        rows={22}
      />

      <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center' }}>
        <button
          className="btn btn-primary"
          disabled={loading || !json.trim() || !detected}
          onClick={handleImport}
        >
          {loading ? <><span className="spinner" />Importing…</> : `📦 Import ${detected ? TYPE_META[detected]?.label : '…'}`}
        </button>
        <button className="btn btn-ghost" onClick={() => { setJson(''); setResult(null); setDetected(null); }}>Clear</button>
      </div>

      {result && (
        <div className={`${styles.resultBox} ${styles.success}`} style={{ marginTop: 12 }}>
          {result.type === 'topics' && (
            <div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Topics import complete</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                {result.res.topicsSeeded} topics · {result.res.examplesSeeded} examples · {result.res.problemsSeeded} problems seeded
                {result.res.topicsSkipped > 0 && ` · ${result.res.topicsSkipped} skipped`}
              </div>
              {result.res.errors?.map((e, i) => (
                <div key={i} style={{ fontSize: 11, color: 'var(--red)', marginTop: 2 }}>⚠ {e}</div>
              ))}
            </div>
          )}
          {result.type === 'algorithms' && (
            <div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Algorithms import complete</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                {result.res.created} created · {result.res.updated} updated · {result.res.skipped} skipped
              </div>
              {result.res.errors?.map((e, i) => (
                <div key={i} style={{ fontSize: 11, color: 'var(--red)', marginTop: 2 }}>⚠ {e}</div>
              ))}
            </div>
          )}
          {result.type === 'quiz' && (
            <div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Quiz import complete</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                {result.res.questionCount ?? result.res.questions} questions imported
                {result.res.title && ` — "${result.res.title}"`}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Format reference */}
      <div className={styles.resultBox} style={{ marginTop: 16, background: 'var(--bg2)', borderColor: 'var(--border2)' }}>
        <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--text2)' }}>Supported formats:</strong><br />
          <code style={{ color: 'var(--accent)' }}>Topics:</code> <code>{'{ "batchName": "...", "skipExisting": true, "topics": [{...}] }'}</code><br />
          <code style={{ color: 'var(--purple)' }}>Algorithms:</code> <code>{'{ "batchName": "...", "skipExisting": true, "algorithms": [{...}] }'}</code><br />
          <code style={{ color: 'var(--yellow)' }}>Quiz:</code> <code>{'{ "title": "...", "category": "JAVA", "difficulty": "INTERMEDIATE", "questions": [{...}] }'}</code>
        </div>
      </div>
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
  const [confirmClearAll, setConfirmClearAll] = useState(false);
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
    if (!confirmClearAll) { setConfirmClearAll(true); return; }
    setConfirmClearAll(false);
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
          {confirmClearAll ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--red)', fontWeight: 600 }}>
                Are you sure? This cannot be undone.
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className={styles.clearAllBtn}
                  disabled={clearMutation.isPending}
                  onClick={handleClearAll}
                >
                  {clearMutation.isPending ? <><span className="spinner" /> Clearing…</> : 'Yes, delete everything'}
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setConfirmClearAll(false)}
                >Cancel</button>
              </div>
            </div>
          ) : (
            <button
              className={styles.clearAllBtn}
              disabled={clearMutation.isPending}
              onClick={handleClearAll}
            >
              {clearMutation.isPending
                ? <><span className="spinner" /> Clearing…</>
                : '🗑 Clear All Data'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
