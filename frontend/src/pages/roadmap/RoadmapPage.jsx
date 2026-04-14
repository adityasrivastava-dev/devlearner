import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { roadmapsApi, topicsApi, QUERY_KEYS } from '../../api';
import toast from 'react-hot-toast';
import styles from './RoadmapPage.module.css';

// ── Canonical phase order & metadata ─────────────────────────────────────────
const PHASE_ORDER = ['JAVA', 'ADVANCED_JAVA', 'DSA', 'SPRING_BOOT', 'MYSQL', 'SYSTEM_DESIGN', 'TESTING', 'AWS'];

const PHASE_META = {
  JAVA:          { label: 'Core Java',                    icon: '☕', color: '#f59e0b' },
  ADVANCED_JAVA: { label: 'Advanced Java',                icon: '⚡', color: '#06b6d4' },
  DSA:           { label: 'Data Structures & Algorithms', icon: '🧩', color: '#8b5cf6' },
  SPRING_BOOT:   { label: 'Spring Boot',                  icon: '🌱', color: '#22c55e' },
  MYSQL:         { label: 'MySQL & Databases',            icon: '🗄️', color: '#f97316' },
  SYSTEM_DESIGN: { label: 'System Design',                icon: '🏗️', color: '#ec4899' },
  TESTING:       { label: 'Testing',                      icon: '🧪', color: '#14b8a6' },
  AWS:           { label: 'AWS & Cloud',                  icon: '☁️', color: '#64748b' },
};

// ── Predefined templates ──────────────────────────────────────────────────────
const PREDEFINED = [
  {
    name: 'Full Stack Backend (Core Java → AWS)',
    icon: '🚀', color: '#6366f1', level: 'Advanced', estimatedHours: 320,
    description: 'The complete journey — Core Java, Advanced Java, DSA, Spring Boot, MySQL, System Design, Testing, and AWS. Zero to job-ready.',
    categories: ['JAVA', 'ADVANCED_JAVA', 'DSA', 'SPRING_BOOT', 'MYSQL', 'SYSTEM_DESIGN', 'TESTING', 'AWS'],
  },
  {
    name: 'Java Backend Engineer',
    icon: '☕', color: '#f59e0b', level: 'Intermediate', estimatedHours: 120,
    description: 'Core Java + Spring Boot + MySQL — the classic backend path',
    categories: ['JAVA', 'SPRING_BOOT', 'MYSQL'],
  },
  {
    name: 'DSA Mastery',
    icon: '🧩', color: '#8b5cf6', level: 'Intermediate', estimatedHours: 80,
    description: 'Data structures and algorithms for MAANG interviews',
    categories: ['DSA'],
  },
  {
    name: 'MAANG Interview Pack',
    icon: '🏆', color: '#ef4444', level: 'Advanced', estimatedHours: 200,
    description: 'Full sweep: Java + DSA + System Design + AWS',
    categories: ['JAVA', 'ADVANCED_JAVA', 'DSA', 'SYSTEM_DESIGN', 'AWS'],
  },
  {
    name: 'Spring Boot Specialist',
    icon: '🌱', color: '#22c55e', level: 'Intermediate', estimatedHours: 60,
    description: 'Deep dive into the Spring ecosystem',
    categories: ['SPRING_BOOT'],
  },
  {
    name: 'Advanced Java',
    icon: '⚡', color: '#06b6d4', level: 'Advanced', estimatedHours: 70,
    description: 'Concurrency, JVM internals, and performance tuning',
    categories: ['ADVANCED_JAVA'],
  },
  {
    name: 'SQL & Cloud',
    icon: '🗄️', color: '#f97316', level: 'Beginner', estimatedHours: 50,
    description: 'MySQL mastery and AWS cloud deployment skills',
    categories: ['MYSQL', 'AWS'],
  },
];

const BLANK_FORM = { name: '', description: '', icon: '📁', color: '#4ade80', level: 'Intermediate', estimatedHours: 40 };

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Sort a roadmap's topics by the canonical phase order, then by displayOrder. */
function sortTopics(topics) {
  return [...topics].sort((a, b) => {
    const pi = PHASE_ORDER.indexOf(a.topicCategory);
    const pj = PHASE_ORDER.indexOf(b.topicCategory);
    if (pi !== pj) return (pi === -1 ? 99 : pi) - (pj === -1 ? 99 : pj);
    return (a.orderIndex || 0) - (b.orderIndex || 0);
  });
}

/** Group sorted topics by their category. Returns array of { cat, meta, topics }. */
function groupByPhase(topics) {
  const sorted = sortTopics(topics);
  const map = new Map();
  for (const t of sorted) {
    const cat = t.topicCategory;
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat).push(t);
  }
  // Keep the canonical order
  return PHASE_ORDER
    .filter((cat) => map.has(cat))
    .map((cat, idx) => ({
      cat,
      phaseNum: idx + 1,
      meta: PHASE_META[cat] || { label: cat, icon: '📦', color: '#6b7280' },
      topics: map.get(cat),
    }));
}

// ─────────────────────────────────────────────────────────────────────────────

export default function RoadmapPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qc = useQueryClient();

  // 'list' | 'pick-template' | 'configure' | 'detail'
  const [view, setView] = useState('list');
  const [detailId, setDetailId] = useState(null);

  // Create form state
  const [form, setForm] = useState(BLANK_FORM);
  const [selTopics, setSelTopics] = useState(new Set());
  const [topicSearch, setTopicSearch] = useState('');

  // Detail-view state
  const [expandedPhases, setExpandedPhases] = useState(new Set(PHASE_ORDER)); // all open by default
  const [addingToPhase, setAddingToPhase] = useState(null); // category string
  const [phaseAddSearch, setPhaseAddSearch] = useState('');

  const { data: roadmaps = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.roadmaps,
    queryFn: roadmapsApi.getAll,
    staleTime: 2 * 60 * 1000,
  });

  const { data: allTopics = [] } = useQuery({
    queryKey: QUERY_KEYS.topics('ALL'),
    queryFn: () => topicsApi.getAll(),
    staleTime: 10 * 60 * 1000,
  });

  // Auto-open a roadmap when navigated back from a topic with ?rmId=
  const rmIdFromUrl = searchParams.get('rmId') ? parseInt(searchParams.get('rmId'), 10) : null;
  useEffect(() => {
    if (rmIdFromUrl && view === 'list' && roadmaps.length > 0) {
      const rm = roadmaps.find((r) => r.id === rmIdFromUrl);
      if (rm) {
        setDetailId(rm.id);
        setExpandedPhases(new Set(PHASE_ORDER));
        setView('detail');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rmIdFromUrl, roadmaps.length]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (data) => roadmapsApi.create(data),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.roadmaps });
      toast.success('Roadmap created!');
      setView('detail');
      setDetailId(created.id);
      setForm(BLANK_FORM);
      setSelTopics(new Set());
      setTopicSearch('');
    },
    onError: () => toast.error('Failed to create roadmap'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => roadmapsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.roadmaps });
      setView('list');
      setDetailId(null);
      toast.success('Roadmap deleted');
    },
  });

  const toggleDoneMutation = useMutation({
    mutationFn: ({ rmId, topicId }) => roadmapsApi.toggleDone(rmId, topicId),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.roadmaps }),
    onError: () => toast.error('Failed to update'),
  });

  const addTopicMutation = useMutation({
    mutationFn: ({ rmId, topicId, order }) => roadmapsApi.addTopic(rmId, topicId, order),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.roadmaps });
      setAddingToPhase(null);
      setPhaseAddSearch('');
    },
    onError: () => toast.error('Failed to add topic'),
  });

  const removeTopicMutation = useMutation({
    mutationFn: ({ rmId, topicId }) => roadmapsApi.removeTopic(rmId, topicId),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.roadmaps }),
    onError: () => toast.error('Failed to remove topic'),
  });

  // ── Derived data ──────────────────────────────────────────────────────────

  const detailRm = detailId ? roadmaps.find((r) => r.id === detailId) : null;

  const phases = useMemo(
    () => (detailRm?.topics ? groupByPhase(detailRm.topics) : []),
    [detailRm],
  );

  const totalDone  = detailRm?.topics?.filter((t) => t.completed).length ?? 0;
  const totalTopics = detailRm?.topics?.length ?? 0;
  const pct = totalTopics > 0 ? Math.round((totalDone / totalTopics) * 100) : 0;

  const filteredForCreate = useMemo(
    () => allTopics.filter((t) => t.title.toLowerCase().includes(topicSearch.toLowerCase())),
    [allTopics, topicSearch],
  );

  // Topics available to add in a specific phase (not already in the roadmap, matching that category)
  const phaseAddCandidates = useMemo(() => {
    if (!addingToPhase || !detailRm) return [];
    const existing = new Set(detailRm.topics.map((t) => t.topicId));
    return allTopics.filter(
      (t) => t.category === addingToPhase
          && !existing.has(t.id)
          && t.title.toLowerCase().includes(phaseAddSearch.toLowerCase()),
    );
  }, [addingToPhase, detailRm, allTopics, phaseAddSearch]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function openDetail(rm) {
    setDetailId(rm.id);
    setExpandedPhases(new Set(PHASE_ORDER));
    setView('detail');
  }

  function startRoadmap(rm) {
    if (!rm.topics?.length) { toast.error('This roadmap has no topics yet'); return; }
    const firstTopicId = sortTopics(rm.topics)[0]?.topicId;
    if (!firstTopicId) return;
    navigate(`/?topic=${firstTopicId}&rmId=${rm.id}&rmName=${encodeURIComponent(rm.name)}`);
  }

  function togglePhase(cat) {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }

  function pickTemplate(tpl) {
    const preSelected = allTopics.filter((t) => tpl.categories.includes(t.category));
    setForm({ name: tpl.name, description: tpl.description, icon: tpl.icon, color: tpl.color, level: tpl.level, estimatedHours: tpl.estimatedHours });
    setSelTopics(new Set(preSelected.map((t) => t.id)));
    setView('configure');
  }

  function handleCreate() {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    createMutation.mutate({ ...form, topicIds: [...selTopics] });
  }

  function toggleTopic(id) {
    setSelTopics((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // ── TEMPLATE PICKER ───────────────────────────────────────────────────────

  if (view === 'pick-template') {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => setView('list')}>← Back</button>
          <h1 className={styles.heading}>Choose a Template</h1>
        </div>
        <div className={styles.body}>
          <p className={styles.subtext}>Pick a curated roadmap to get started fast, or build from scratch.</p>
          <div className={styles.tplGrid}>
            {PREDEFINED.map((tpl, i) => (
              <div key={i} className={styles.tplCard} style={{ '--tpl-color': tpl.color }} onClick={() => pickTemplate(tpl)}>
                <div className={styles.tplIcon}>{tpl.icon}</div>
                <div className={styles.tplName}>{tpl.name}</div>
                <div className={styles.tplDesc}>{tpl.description}</div>
                <div className={styles.tplMeta}>
                  <span className={styles.tplBadge}>{tpl.level}</span>
                  <span className={styles.tplBadge}>{tpl.estimatedHours}h</span>
                </div>
                <div className={styles.tplCategories}>
                  {tpl.categories.map((c) => (
                    <span key={c} className={styles.tplCatPill} style={{ '--tpl-color': PHASE_META[c]?.color || '#6b7280' }}>
                      {PHASE_META[c]?.icon} {PHASE_META[c]?.label || c}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            <div className={styles.tplCard} style={{ '--tpl-color': '#6b7280' }} onClick={() => { setForm(BLANK_FORM); setSelTopics(new Set()); setView('configure'); }}>
              <div className={styles.tplIcon}>✏️</div>
              <div className={styles.tplName}>Blank Roadmap</div>
              <div className={styles.tplDesc}>Start from scratch and hand-pick every topic.</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── CONFIGURE ─────────────────────────────────────────────────────────────

  if (view === 'configure') {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => setView('pick-template')}>← Templates</button>
          <h1 className={styles.heading}>Configure Roadmap</h1>
          <button className="btn btn-primary btn-sm" disabled={!form.name.trim() || createMutation.isPending} onClick={handleCreate}>
            {createMutation.isPending ? 'Creating…' : `Create  (${selTopics.size} topics)`}
          </button>
        </div>
        <div className={styles.configBody}>
          <div className={styles.configForm}>
            <label className={styles.label}>Name *</label>
            <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Java Backend Engineer" autoFocus />
            <label className={styles.label}>Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="What is this roadmap for?" style={{ resize: 'vertical' }} />
            <div className={styles.formRow}>
              <div style={{ flex: 1 }}>
                <label className={styles.label}>Icon</label>
                <input className="input" value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} style={{ width: 72 }} />
              </div>
              <div style={{ flex: 1 }}>
                <label className={styles.label}>Accent color</label>
                <input type="color" value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} className={styles.colorPicker} />
              </div>
            </div>
            <div className={styles.formRow}>
              <div style={{ flex: 1 }}>
                <label className={styles.label}>Level</label>
                <select className="input" value={form.level} onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}>
                  <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label className={styles.label}>Est. hours</label>
                <input type="number" className="input" value={form.estimatedHours} min={1} onChange={(e) => setForm((f) => ({ ...f, estimatedHours: +e.target.value }))} />
              </div>
            </div>
          </div>

          <div className={styles.topicPicker}>
            <div className={styles.pickerHeader}>
              <span className={styles.label}>{selTopics.size} topic{selTopics.size !== 1 ? 's' : ''} selected</span>
              <input className="input" style={{ flex: 1, maxWidth: 220, fontSize: 12, padding: '4px 8px' }} placeholder="Search topics…" value={topicSearch} onChange={(e) => setTopicSearch(e.target.value)} />
            </div>
            <div className={styles.topicList}>
              {/* Group by phase inside the picker too */}
              {PHASE_ORDER.map((cat) => {
                const group = filteredForCreate.filter((t) => t.category === cat);
                if (!group.length) return null;
                const meta = PHASE_META[cat];
                return (
                  <div key={cat}>
                    <div className={styles.pickerPhaseHeader} style={{ '--ph-color': meta.color }}>
                      {meta.icon} {meta.label}
                    </div>
                    {group.map((t) => (
                      <label key={t.id} className={`${styles.topicRow} ${selTopics.has(t.id) ? styles.topicRowSel : ''}`}>
                        <input type="checkbox" checked={selTopics.has(t.id)} onChange={() => toggleTopic(t.id)} />
                        <span className={styles.topicRowTitle}>{t.title}</span>
                      </label>
                    ))}
                  </div>
                );
              })}
              {filteredForCreate.length === 0 && <div className={styles.emptySmall}>No topics match.</div>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── DETAIL VIEW ────────────────────────────────────────────────────────────

  if (view === 'detail' && detailRm) {
    return (
      <div className={styles.page}>
        {/* Header */}
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => setView('list')}>← My Roadmaps</button>
          <span className={styles.detailIcon}>{detailRm.icon || '📁'}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 className={styles.detailTitle}>{detailRm.name}</h1>
            {detailRm.description && <p className={styles.detailDesc}>{detailRm.description}</p>}
          </div>
          <div className={styles.detailActions}>
            <button className="btn btn-primary btn-sm" onClick={() => startRoadmap(detailRm)}>▶ Start</button>
            <button className="btn btn-danger btn-sm" onClick={() => window.confirm(`Delete "${detailRm.name}"?`) && deleteMutation.mutate(detailRm.id)}>🗑</button>
          </div>
        </div>

        {/* Progress bar */}
        <div className={styles.progressBar}>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${pct}%`, '--rm-color': detailRm.color || '#4ade80' }} />
          </div>
          <span className={styles.progressLabel}>{totalDone} / {totalTopics} done — {pct}%</span>
        </div>

        {/* Phase accordion */}
        <div className={styles.detailBody}>
          {phases.length === 0 && (
            <div className={styles.empty}>
              <span>📭</span>
              <h3>No topics yet</h3>
              <p>Use the phase headers to add topics to each phase.</p>
            </div>
          )}

          {phases.map((phase, phaseIdx) => {
            const phaseDone  = phase.topics.filter((t) => t.completed).length;
            const phaseTotal = phase.topics.length;
            const isOpen     = expandedPhases.has(phase.cat);

            return (
              <div key={phase.cat} className={`${styles.phase} ${!isOpen ? styles.phaseClosed : ''}`}>
                {/* Phase header */}
                <div
                  className={styles.phaseHeader}
                  style={{ '--ph-color': phase.meta.color }}
                  onClick={() => togglePhase(phase.cat)}
                >
                  <div className={styles.phaseLeft}>
                    <span className={styles.phaseNum}>Phase {phaseIdx + 1}</span>
                    <span className={styles.phaseIcon}>{phase.meta.icon}</span>
                    <span className={styles.phaseLabel}>{phase.meta.label}</span>
                  </div>
                  <div className={styles.phaseRight}>
                    <span className={styles.phaseProg}>{phaseDone}/{phaseTotal}</span>
                    <div className={styles.phaseMiniBar}>
                      <div className={styles.phaseMiniBarFill} style={{ width: phaseTotal > 0 ? `${(phaseDone / phaseTotal) * 100}%` : '0%', background: phase.meta.color }} />
                    </div>
                    <span className={styles.phaseChevron}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Phase topics */}
                {isOpen && (
                  <div className={styles.phaseTopics}>
                    {phase.topics.map((t, idx) => (
                      <div key={t.topicId} className={`${styles.topicItem} ${t.completed ? styles.topicDone : ''}`}>
                        <span className={styles.topicStep}>{idx + 1}</span>
                        <button
                          className={`${styles.doneBtn} ${t.completed ? styles.doneBtnActive : ''}`}
                          onClick={() => toggleDoneMutation.mutate({ rmId: detailRm.id, topicId: t.topicId })}
                          title={t.completed ? 'Mark as not done' : 'Mark as done'}
                        >
                          {t.completed ? '✓' : '○'}
                        </button>
                        <span className={styles.topicItemTitle}>{t.topicTitle}</span>
                        <span className={styles.topicItemCat} style={{ '--cat-color': phase.meta.color }}>
                          {phase.meta.label}
                        </span>
                        <div className={styles.topicItemActions}>
                          <button
                            className={styles.openBtn}
                            onClick={() => navigate(`/?topic=${t.topicId}&rmId=${detailRm.id}&rmName=${encodeURIComponent(detailRm.name)}`)}
                            title="Open topic"
                          >
                            Open →
                          </button>
                          <button
                            className={styles.removeTopicBtn}
                            onClick={() => removeTopicMutation.mutate({ rmId: detailRm.id, topicId: t.topicId })}
                            title="Remove from roadmap"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Add topic to this phase */}
                    {addingToPhase === phase.cat ? (
                      <div className={styles.phaseAddBox}>
                        <input
                          className="input"
                          style={{ fontSize: 12, padding: '4px 8px' }}
                          placeholder={`Search ${phase.meta.label} topics…`}
                          value={phaseAddSearch}
                          onChange={(e) => setPhaseAddSearch(e.target.value)}
                          autoFocus
                        />
                        <div className={styles.phaseAddList}>
                          {phaseAddCandidates.slice(0, 20).map((t) => (
                            <div key={t.id} className={styles.phaseAddItem}>
                              <span className={styles.topicItemTitle}>{t.title}</span>
                              <button
                                className={styles.addTopicBtn}
                                disabled={addTopicMutation.isPending}
                                onClick={() => addTopicMutation.mutate({ rmId: detailRm.id, topicId: t.id, order: (detailRm.topics?.length || 0) + 1 })}
                              >
                                + Add
                              </button>
                            </div>
                          ))}
                          {phaseAddCandidates.length === 0 && <div className={styles.emptySmall}>All {phase.meta.label} topics already added.</div>}
                        </div>
                        <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => { setAddingToPhase(null); setPhaseAddSearch(''); }}>
                          Close
                        </button>
                      </div>
                    ) : (
                      <button className={styles.addToPhaseBtn} onClick={() => { setAddingToPhase(phase.cat); setPhaseAddSearch(''); }}>
                        + Add {phase.meta.label} topic
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Add topics from categories not yet in this roadmap */}
          <div className={styles.addPhaseHint}>
            {PHASE_ORDER.filter((cat) => !phases.find((p) => p.cat === cat)).map((cat) => {
              const meta = PHASE_META[cat];
              return (
                <div key={cat} className={styles.emptyPhase}>
                  {addingToPhase === cat ? (
                    <div className={styles.phaseAddBox}>
                      <div className={styles.phaseHeader} style={{ '--ph-color': meta.color, cursor: 'default', marginBottom: 8 }}>
                        <span className={styles.phaseIcon}>{meta.icon}</span>
                        <span className={styles.phaseLabel}>{meta.label}</span>
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text3)' }}>not in roadmap yet</span>
                      </div>
                      <input
                        className="input"
                        style={{ fontSize: 12, padding: '4px 8px' }}
                        placeholder={`Search ${meta.label} topics…`}
                        value={phaseAddSearch}
                        onChange={(e) => setPhaseAddSearch(e.target.value)}
                        autoFocus
                      />
                      <div className={styles.phaseAddList}>
                        {phaseAddCandidates.slice(0, 20).map((t) => (
                          <div key={t.id} className={styles.phaseAddItem}>
                            <span className={styles.topicItemTitle}>{t.title}</span>
                            <button
                              className={styles.addTopicBtn}
                              disabled={addTopicMutation.isPending}
                              onClick={() => addTopicMutation.mutate({ rmId: detailRm.id, topicId: t.id, order: (detailRm.topics?.length || 0) + 1 })}
                            >
                              + Add
                            </button>
                          </div>
                        ))}
                        {phaseAddCandidates.length === 0 && <div className={styles.emptySmall}>No topics found.</div>}
                      </div>
                      <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => { setAddingToPhase(null); setPhaseAddSearch(''); }}>
                        Close
                      </button>
                    </div>
                  ) : (
                    <button className={styles.addEmptyPhaseBtn} style={{ '--ph-color': meta.color }} onClick={() => { setAddingToPhase(cat); setPhaseAddSearch(''); }}>
                      {meta.icon} Add {meta.label} phase
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── LIST VIEW (default) ────────────────────────────────────────────────────

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>← Back</button>
        <h1 className={styles.heading}>🗺 My Roadmaps</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setView('pick-template')}>+ New Roadmap</button>
      </div>

      <div className={styles.body}>
        {isLoading ? (
          <div className={styles.loading}><span className="spinner" /> Loading roadmaps…</div>
        ) : roadmaps.length === 0 ? (
          <div className={styles.empty}>
            <span>🗺</span>
            <h3>No roadmaps yet</h3>
            <p>Pick a template or build a custom learning path.</p>
            <button className="btn btn-primary" onClick={() => setView('pick-template')}>+ New Roadmap</button>
          </div>
        ) : (
          <div className={styles.listGrid}>
            {roadmaps.map((rm) => {
              const done  = rm.topics?.filter((t) => t.completed).length ?? 0;
              const total = rm.topics?.length ?? 0;
              const p     = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <div key={rm.id} className={styles.listCard} style={{ '--rm-color': rm.color || '#4ade80' }} onClick={() => openDetail(rm)}>
                  <div className={styles.listCardTop}>
                    <span className={styles.listCardIcon}>{rm.icon || '📁'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className={styles.listCardName}>{rm.name}</div>
                      {rm.description && <div className={styles.listCardDesc}>{rm.description}</div>}
                    </div>
                  </div>

                  {/* Mini progress */}
                  <div className={styles.listProgress}>
                    <div className={styles.listProgressTrack}>
                      <div className={styles.listProgressFill} style={{ width: `${p}%` }} />
                    </div>
                    <span className={styles.listProgressLabel}>{done}/{total} topics done</span>
                  </div>

                  {/* Phase pills */}
                  <div className={styles.listPhasePills}>
                    {PHASE_ORDER.filter((cat) => rm.topics?.some((t) => t.topicCategory === cat)).map((cat) => (
                      <span key={cat} className={styles.listPhasePill} style={{ '--ph-color': PHASE_META[cat]?.color }}>
                        {PHASE_META[cat]?.icon}
                      </span>
                    ))}
                  </div>

                  <div className={styles.listCardFooter} onClick={(e) => e.stopPropagation()}>
                    <button className="btn btn-primary btn-sm" onClick={() => openDetail(rm)}>View Roadmap →</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => startRoadmap(rm)}>▶ Start</button>
                    <button className="btn btn-danger btn-sm" onClick={() => window.confirm(`Delete "${rm.name}"?`) && deleteMutation.mutate(rm.id)}>🗑</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
