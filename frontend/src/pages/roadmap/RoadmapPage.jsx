import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { roadmapsApi, topicsApi, QUERY_KEYS } from '../../api';
import toast from 'react-hot-toast';
import styles from './RoadmapPage.module.css';

const CAT_LABEL = {
  JAVA: 'Java', ADVANCED_JAVA: 'Adv Java', SPRING_BOOT: 'Spring Boot',
  DSA: 'DSA', MYSQL: 'MySQL', AWS: 'AWS', SYSTEM_DESIGN: 'System Design', TESTING: 'Testing',
};

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

export default function RoadmapPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  // 'list' | 'pick-template' | 'configure'
  const [view, setView] = useState('list');
  const [form, setForm] = useState(BLANK_FORM);
  const [selTopics, setSelTopics] = useState(new Set());
  const [topicSearch, setTopicSearch] = useState('');
  const [managing, setManaging] = useState(null); // roadmap id
  const [addSearch, setAddSearch] = useState('');

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

  const createMutation = useMutation({
    mutationFn: (data) => roadmapsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.roadmaps });
      toast.success('Roadmap created!');
      setView('list');
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
      setManaging(null);
      toast.success('Roadmap deleted');
    },
  });

  const addTopicMutation = useMutation({
    mutationFn: ({ rmId, topicId, order }) => roadmapsApi.addTopic(rmId, topicId, order),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.roadmaps }),
    onError: () => toast.error('Failed to add topic'),
  });

  const removeTopicMutation = useMutation({
    mutationFn: ({ rmId, topicId }) => roadmapsApi.removeTopic(rmId, topicId),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.roadmaps }),
    onError: () => toast.error('Failed to remove topic'),
  });

  function pickTemplate(tpl) {
    const preSelected = allTopics.filter((t) => tpl.categories.includes(t.category));
    setForm({
      name: tpl.name,
      description: tpl.description,
      icon: tpl.icon,
      color: tpl.color,
      level: tpl.level,
      estimatedHours: tpl.estimatedHours,
    });
    setSelTopics(new Set(preSelected.map((t) => t.id)));
    setView('configure');
  }

  function goBlank() {
    setForm(BLANK_FORM);
    setSelTopics(new Set());
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

  function startRoadmap(rm) {
    if (!rm.topics?.length) { toast.error('This roadmap has no topics yet'); return; }
    // FIX: RoadmapTopicDto uses topicId (not id) and topicTitle (not title)
    const topicIds = rm.topics.map((t) => t.topicId);
    navigate(`/?topic=${topicIds[0]}&rmId=${rm.id}&rmName=${encodeURIComponent(rm.name)}&rmTopics=${topicIds.join(',')}`);
  }

  const filteredTopics = useMemo(
    () => allTopics.filter((t) => t.title.toLowerCase().includes(topicSearch.toLowerCase())),
    [allTopics, topicSearch],
  );

  const managingRm = managing ? roadmaps.find((r) => r.id === managing) : null;
  const existingTopicIds = useMemo(
    () => new Set((managingRm?.topics || []).map((t) => t.topicId)),
    [managingRm],
  );
  const addCandidates = useMemo(
    () => allTopics.filter(
      (t) => !existingTopicIds.has(t.id) && t.title.toLowerCase().includes(addSearch.toLowerCase()),
    ),
    [allTopics, existingTopicIds, addSearch],
  );

  // ── Template picker ────────────────────────────────────────────────────────
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
              <div
                key={i}
                className={styles.tplCard}
                style={{ '--tpl-color': tpl.color }}
                onClick={() => pickTemplate(tpl)}
              >
                <div className={styles.tplIcon}>{tpl.icon}</div>
                <div className={styles.tplName}>{tpl.name}</div>
                <div className={styles.tplDesc}>{tpl.description}</div>
                <div className={styles.tplMeta}>
                  <span className={styles.tplBadge}>{tpl.level}</span>
                  <span className={styles.tplBadge}>{tpl.estimatedHours}h</span>
                </div>
                <div className={styles.tplCategories}>
                  {tpl.categories.map((c) => (
                    <span key={c} className={styles.tplCatPill}>{CAT_LABEL[c] || c}</span>
                  ))}
                </div>
              </div>
            ))}
            <div className={styles.tplCard} style={{ '--tpl-color': '#6b7280' }} onClick={goBlank}>
              <div className={styles.tplIcon}>✏️</div>
              <div className={styles.tplName}>Blank Roadmap</div>
              <div className={styles.tplDesc}>Start from scratch and hand-pick every topic.</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Configure (create) ─────────────────────────────────────────────────────
  if (view === 'configure') {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => setView('pick-template')}>← Templates</button>
          <h1 className={styles.heading}>Configure Roadmap</h1>
          <button
            className="btn btn-primary btn-sm"
            disabled={!form.name.trim() || createMutation.isPending}
            onClick={handleCreate}
          >
            {createMutation.isPending ? 'Creating…' : `Create  (${selTopics.size} topics)`}
          </button>
        </div>
        <div className={styles.configBody}>
          {/* Left: metadata form */}
          <div className={styles.configForm}>
            <label className={styles.label}>Name *</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Java Backend Engineer"
              autoFocus
            />

            <label className={styles.label}>Description</label>
            <textarea
              className="input"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="What is this roadmap for?"
              style={{ resize: 'vertical' }}
            />

            <div className={styles.formRow}>
              <div style={{ flex: 1 }}>
                <label className={styles.label}>Icon</label>
                <input
                  className="input"
                  value={form.icon}
                  onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                  style={{ width: 72 }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className={styles.label}>Accent color</label>
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  className={styles.colorPicker}
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div style={{ flex: 1 }}>
                <label className={styles.label}>Level</label>
                <select
                  className="input"
                  value={form.level}
                  onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label className={styles.label}>Est. hours</label>
                <input
                  type="number"
                  className="input"
                  value={form.estimatedHours}
                  min={1}
                  onChange={(e) => setForm((f) => ({ ...f, estimatedHours: +e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Right: topic picker */}
          <div className={styles.topicPicker}>
            <div className={styles.pickerHeader}>
              <span className={styles.label}>{selTopics.size} topic{selTopics.size !== 1 ? 's' : ''} selected</span>
              <input
                className="input"
                style={{ flex: 1, maxWidth: 220, fontSize: 12, padding: '4px 8px' }}
                placeholder="Search topics…"
                value={topicSearch}
                onChange={(e) => setTopicSearch(e.target.value)}
              />
            </div>
            <div className={styles.topicList}>
              {filteredTopics.map((t) => (
                <label key={t.id} className={`${styles.topicRow} ${selTopics.has(t.id) ? styles.topicRowSel : ''}`}>
                  <input type="checkbox" checked={selTopics.has(t.id)} onChange={() => toggleTopic(t.id)} />
                  <span className={styles.topicRowTitle}>{t.title}</span>
                  <span className={styles.topicRowCat}>{CAT_LABEL[t.category] || t.category}</span>
                </label>
              ))}
              {filteredTopics.length === 0 && (
                <div className={styles.emptySmall}>No topics match.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── List view ──────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>← Back</button>
        <h1 className={styles.heading}>🗺 Roadmaps</h1>
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
          <div className={styles.listWrap}>
            <div className={styles.grid}>
              {roadmaps.map((rm) => (
                <div
                  key={rm.id}
                  className={`${styles.card} ${managing === rm.id ? styles.selectedCard : ''}`}
                  style={rm.color ? { '--rm-color': rm.color } : {}}
                >
                  <div className={styles.cardHeader}>
                    <span className={styles.cardIcon}>{rm.icon || '📁'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className={styles.cardName}>{rm.name}</div>
                      {rm.description && <div className={styles.cardDesc}>{rm.description}</div>}
                    </div>
                    <div className={styles.cardMeta}>{rm.topics?.length || 0} topics</div>
                  </div>

                  {rm.topics?.length > 0 && (
                    <div className={styles.topicPills}>
                      {/* FIX: use topicId + topicTitle from RoadmapTopicDto */}
                      {rm.topics.slice(0, 5).map((t) => (
                        <span key={t.topicId} className={styles.topicPill}>{t.topicTitle}</span>
                      ))}
                      {rm.topics.length > 5 && (
                        <span className={styles.topicPill} style={{ color: 'var(--text3)' }}>
                          +{rm.topics.length - 5} more
                        </span>
                      )}
                    </div>
                  )}

                  {rm.topics?.length === 0 && (
                    <div className={styles.noTopicsHint}>No topics — click Manage to add some.</div>
                  )}

                  <div className={styles.cardActions}>
                    <button className="btn btn-primary btn-sm" onClick={() => startRoadmap(rm)}>▶ Start</button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => { setManaging(managing === rm.id ? null : rm.id); setAddSearch(''); }}
                    >
                      {managing === rm.id ? '✕ Close' : '✎ Manage'}
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => window.confirm(`Delete "${rm.name}"?`) && deleteMutation.mutate(rm.id)}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Manage panel — shown inline when a card is active */}
            {managingRm && (
              <div className={styles.managePanel}>
                <div className={styles.managePanelHeader}>
                  <span style={{ fontWeight: 800, fontSize: 14 }}>Managing: {managingRm.name}</span>
                  <button className={styles.backBtn} onClick={() => setManaging(null)}>✕ Close</button>
                </div>

                {/* Current topics */}
                <div className={styles.manageSection}>
                  <div className={styles.label}>Current topics ({managingRm.topics?.length || 0})</div>
                  {(!managingRm.topics || managingRm.topics.length === 0) && (
                    <div className={styles.emptySmall}>No topics yet — add some below.</div>
                  )}
                  {managingRm.topics?.map((t) => (
                    <div key={t.topicId} className={styles.manageTopic}>
                      <span className={styles.manageTopicTitle}>{t.topicTitle}</span>
                      <span className={styles.topicPill}>{CAT_LABEL[t.topicCategory] || t.topicCategory}</span>
                      <button
                        className={styles.removeBtn}
                        disabled={removeTopicMutation.isPending}
                        onClick={() => removeTopicMutation.mutate({ rmId: managingRm.id, topicId: t.topicId })}
                        title="Remove from roadmap"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add topics */}
                <div className={styles.manageSection}>
                  <div className={styles.label}>Add topics</div>
                  <input
                    className="input"
                    style={{ fontSize: 12, padding: '4px 8px', marginBottom: 8 }}
                    placeholder="Search topics…"
                    value={addSearch}
                    onChange={(e) => setAddSearch(e.target.value)}
                  />
                  <div className={styles.addTopicList}>
                    {addCandidates.slice(0, 40).map((t) => (
                      <div key={t.id} className={styles.manageTopic}>
                        <span className={styles.manageTopicTitle}>{t.title}</span>
                        <span className={styles.topicPill}>{CAT_LABEL[t.category] || t.category}</span>
                        <button
                          className={styles.addBtn}
                          disabled={addTopicMutation.isPending}
                          onClick={() => addTopicMutation.mutate({
                            rmId: managingRm.id,
                            topicId: t.id,
                            order: (managingRm.topics?.length || 0) + 1,
                          })}
                          title="Add to roadmap"
                        >
                          +
                        </button>
                      </div>
                    ))}
                    {addCandidates.length === 0 && (
                      <div className={styles.emptySmall}>All topics already in this roadmap.</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
