import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timetableApi, QUERY_KEYS } from '../../api';
import toast from 'react-hot-toast';
import styles from './TimetablePage.module.css';

/* ── Templates ──────────────────────────────────────────────────────────────── */
const TEMPLATES = [
  {
    id: 'java-backend',
    name: 'Java Backend Path',
    desc: 'Complete Java → Spring Boot → MySQL → AWS journey',
    icon: '☕',
    color: '#f59e0b',
    phases: [
      { name: 'Java Core', topics: ['Variables & Data Types', 'OOP Fundamentals', 'Collections Framework', 'Exception Handling', 'Generics', 'Streams & Lambdas', 'Concurrency Basics'] },
      { name: 'Advanced Java', topics: ['JVM Internals', 'Memory Management', 'Design Patterns', 'Multithreading Deep Dive'] },
      { name: 'Spring Boot', topics: ['IoC & Dependency Injection', 'REST API Design', 'JPA & Hibernate', 'Spring Security', 'Spring Testing'] },
      { name: 'MySQL', topics: ['Joins & Subqueries', 'Indexing & Query Optimization', 'Transactions & Isolation', 'Database Design & Normalization'] },
      { name: 'System Design', topics: ['Scalability Fundamentals', 'Caching Strategies', 'Message Queues', 'Distributed System Patterns'] },
    ],
  },
  {
    id: 'dsa-intensive',
    name: 'DSA Intensive',
    desc: 'Data structures & algorithms for coding rounds',
    icon: '∑',
    color: '#3b82f6',
    phases: [
      { name: 'Foundations', topics: ['Arrays & Strings', 'Hash Maps', 'Two Pointers', 'Sliding Window', 'Prefix Sum'] },
      { name: 'Trees & Graphs', topics: ['Binary Trees', 'BST Operations', 'BFS', 'DFS', 'Graph Algorithms'] },
      { name: 'Dynamic Programming', topics: ['1D DP Patterns', '2D DP Patterns', 'Knapsack Variants', 'LCS & LIS'] },
      { name: 'Advanced DS', topics: ['Heaps & Priority Queues', 'Trie', 'Union-Find', 'Backtracking Patterns'] },
    ],
  },
  {
    id: 'quick-refresh',
    name: '2-Week Refresh',
    desc: 'Fast revision of highest-frequency patterns before an interview',
    icon: '⚡',
    color: '#8b5cf6',
    phases: [
      { name: 'Top Patterns', topics: ['HashMap & Two-Sum Variants', 'Two Pointers', 'Sliding Window', 'BFS & DFS', 'Binary Search', 'Dynamic Programming Basics'] },
      { name: 'Java Refresher', topics: ['Collections API', 'String Methods & Comparators', 'Sorting Techniques'] },
    ],
  },
  {
    id: 'system-design',
    name: 'System Design Focus',
    desc: 'Deep dive into distributed systems for senior/staff roles',
    icon: '🏗',
    color: '#10b981',
    phases: [
      { name: 'Fundamentals', topics: ['Scalability & Load Balancing', 'CAP Theorem', 'Consistency Models', 'Database Selection'] },
      { name: 'Components', topics: ['Caching with Redis', 'Message Queues (Kafka)', 'CDN & Edge Computing', 'Rate Limiting'] },
      { name: 'Case Studies', topics: ['Design Twitter Feed', 'Design URL Shortener', 'Design WhatsApp', 'Design Netflix'] },
    ],
  },
];

/* ── Task type meta ─────────────────────────────────────────────────────────── */
const TASK_META = {
  THEORY:           { icon: '📖', label: 'Theory',          color: '#60a5fa', bg: 'rgba(59,130,246,.12)' },
  PRACTICE_EASY:    { icon: '🟢', label: 'Easy Problems',   color: '#4ade80', bg: 'rgba(74,222,128,.1)'  },
  PRACTICE_MEDIUM:  { icon: '🟡', label: 'Medium Problems', color: '#fbbf24', bg: 'rgba(251,191,36,.1)'  },
  PRACTICE_HARD:    { icon: '🔴', label: 'Hard Problems',   color: '#f87171', bg: 'rgba(248,113,113,.1)' },
  PRACTICE:         { icon: '💻', label: 'Practice',        color: '#a78bfa', bg: 'rgba(167,139,250,.1)' },
  REVIEW:           { icon: '🔄', label: 'Review',          color: '#2dd4bf', bg: 'rgba(45,212,191,.1)'  },
};

function taskMeta(type) { return TASK_META[type] || TASK_META.PRACTICE; }

function fmtMin(min) {
  if (!min) return '0m';
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function fmtDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
}

function isToday(dateStr) {
  return dateStr === new Date().toISOString().slice(0, 10);
}

function isPast(dateStr) {
  return dateStr < new Date().toISOString().slice(0, 10);
}

/* ── Estimate days from template ────────────────────────────────────────────── */
function estimateDays(template, hoursPerDay) {
  if (!template) return 0;
  const topicCount = template.phases.reduce((s, p) => s + p.topics.length, 0);
  const tasksPerTopic = hoursPerDay >= 4 ? 5 : hoursPerDay >= 2 ? 4 : 3;
  const minsPerTask   = hoursPerDay >= 4 ? 48 : 45;
  const totalMins     = topicCount * tasksPerTopic * minsPerTask;
  return Math.ceil(totalMins / (hoursPerDay * 60));
}

/* ══════════════════════════════════════════════════════════════════════════════
   Main page
══════════════════════════════════════════════════════════════════════════════ */
export default function TimetablePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [view, setView]               = useState('list');    // list | create | detail
  const [selectedId, setSelectedId]   = useState(null);
  const [detailTab, setDetailTab]     = useState('today');   // today | schedule

  /* ── Queries ── */
  const { data: timetables = [], isLoading: listLoading } = useQuery({
    queryKey: QUERY_KEYS.timetables,
    queryFn:  timetableApi.list,
    staleTime: 30 * 1000,
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: QUERY_KEYS.timetable(selectedId),
    queryFn:  () => timetableApi.get(selectedId),
    enabled:  !!selectedId,
    staleTime: 10 * 1000,
  });

  /* ── Toggle task mutation ── */
  const toggleMutation = useMutation({
    mutationFn: ({ id, dayNumber, taskIndex }) =>
      timetableApi.toggleTask(id, dayNumber, taskIndex),
    onSuccess: (data) => {
      qc.setQueryData(QUERY_KEYS.timetable(selectedId), (old) =>
        old ? { ...old, completedTasks: data.completedTasks, status: data.status } : old
      );
      qc.invalidateQueries({ queryKey: QUERY_KEYS.timetables });
    },
    onError: () => toast.error('Could not update task'),
  });

  /* ── Delete mutation ── */
  const deleteMutation = useMutation({
    mutationFn: (id) => timetableApi.delete(id),
    onSuccess: () => {
      toast.success('Timetable deleted');
      qc.invalidateQueries({ queryKey: QUERY_KEYS.timetables });
      setView('list');
      setSelectedId(null);
    },
  });

  function openDetail(id) { setSelectedId(id); setView('detail'); setDetailTab('today'); }

  /* ── Render ── */
  return (
    <div className={styles.page}>
      <header className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <button className={styles.backBtn} onClick={() => {
            if (view !== 'list') { setView('list'); setSelectedId(null); }
            else navigate('/');
          }}>
            {view !== 'list' ? '← Back' : '← Home'}
          </button>
          <div className={styles.titleWrap}>
            <span className={styles.titleIcon}>📅</span>
            <div>
              <span className={styles.title}>Study Timetable</span>
              <span className={styles.titleSub}>Plan your prep — day by day, hour by hour</span>
            </div>
          </div>
        </div>
        {view === 'list' && (
          <button className={styles.createBtn} onClick={() => setView('create')}>
            + New Timetable
          </button>
        )}
      </header>

      <div className={styles.body}>
        {view === 'list'   && <ListView timetables={timetables} loading={listLoading} onOpen={openDetail} onCreate={() => setView('create')} />}
        {view === 'create' && <CreateWizard onDone={(id) => { qc.invalidateQueries({ queryKey: QUERY_KEYS.timetables }); openDetail(id); }} onCancel={() => setView('list')} />}
        {view === 'detail' && (
          <DetailView
            detail={detail}
            loading={detailLoading}
            tab={detailTab}
            onTab={setDetailTab}
            completedTasks={detail?.completedTasks || []}
            onToggle={(dayNumber, taskIndex) => toggleMutation.mutate({ id: selectedId, dayNumber, taskIndex })}
            onDelete={() => deleteMutation.mutate(selectedId)}
            timetableId={selectedId}
          />
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   ListView
══════════════════════════════════════════════════════════════════════════════ */
function ListView({ timetables, loading, onOpen, onCreate }) {
  if (loading) return <div className={styles.center}><span className={styles.spinner} /></div>;

  if (timetables.length === 0) return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>📅</div>
      <h2 className={styles.emptyTitle}>No timetables yet</h2>
      <p className={styles.emptyDesc}>Create a personalized day-by-day study plan from a template or build your own.</p>
      <button className={styles.createBtn} onClick={onCreate}>+ Create First Timetable</button>
    </div>
  );

  return (
    <div className={styles.listWrap}>
      <div className={styles.listGrid}>
        {timetables.map(t => {
          const pct = t.totalTasks ? Math.round((t.completedCount / t.totalTasks) * 100) : 0;
          const statusColor = t.status === 'COMPLETED' ? '#4ade80' : t.status === 'PAUSED' ? '#fbbf24' : '#60a5fa';
          return (
            <div key={t.id} className={styles.card} onClick={() => onOpen(t.id)}>
              <div className={styles.cardHeader}>
                <span className={styles.cardName}>{t.name}</span>
                <span className={styles.cardStatus} style={{ color: statusColor }}>{t.status}</span>
              </div>
              <div className={styles.cardMeta}>
                <span>⏱ {t.hoursPerDay}h/day</span>
                <span>📆 {t.totalDays} days</span>
                <span>📚 {t.totalTopics} topics</span>
              </div>
              <div className={styles.cardDates}>
                {fmtDate(t.startDate)} → {fmtDate(t.endDate)}
              </div>
              <div className={styles.cardProgress}>
                <div className={styles.progressTrack}>
                  <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                </div>
                <span className={styles.progressLabel}>{pct}% complete</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   CreateWizard
══════════════════════════════════════════════════════════════════════════════ */
function CreateWizard({ onDone, onCancel }) {
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [config, setConfig] = useState({
    name: '',
    hoursPerDay: 4,
    startDate: new Date().toISOString().slice(0, 10),
    includeRestDays: true,
  });
  const [generating, setGenerating] = useState(false);

  const estimatedDays = useMemo(() => estimateDays(selectedTemplate, config.hoursPerDay), [selectedTemplate, config.hoursPerDay]);

  /* Build topics list from template */
  function buildTopics() {
    if (!selectedTemplate) return [];
    return selectedTemplate.phases.flatMap(phase =>
      phase.topics.map(name => ({ name, phase: phase.name }))
    );
  }

  async function handleGenerate() {
    if (!selectedTemplate) { toast.error('Choose a template first'); return; }
    if (!config.name.trim()) { toast.error('Enter a name for your timetable'); return; }
    setGenerating(true);
    try {
      const result = await timetableApi.generate({
        name:            config.name.trim(),
        hoursPerDay:     config.hoursPerDay,
        startDate:       config.startDate,
        includeRestDays: config.includeRestDays,
        topics:          buildTopics(),
      });
      toast.success('Timetable created!');
      onDone(result.id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className={styles.wizardWrap}>
      {/* ── Step indicators ── */}
      <div className={styles.steps}>
        {['Choose Template', 'Configure', 'Confirm'].map((label, i) => (
          <div key={i} className={`${styles.stepItem} ${step === i + 1 ? styles.stepActive : step > i + 1 ? styles.stepDone : ''}`}>
            <span className={styles.stepDot}>{step > i + 1 ? '✓' : i + 1}</span>
            <span className={styles.stepLabel}>{label}</span>
            {i < 2 && <span className={styles.stepLine} />}
          </div>
        ))}
      </div>

      {/* ── Step 1: Template picker ── */}
      {step === 1 && (
        <div className={styles.stepContent}>
          <h2 className={styles.stepTitle}>Choose a learning path</h2>
          <p className={styles.stepDesc}>Pick the template that matches your goal. You can customize hours and dates next.</p>
          <div className={styles.templateGrid}>
            {TEMPLATES.map(t => (
              <div
                key={t.id}
                className={`${styles.templateCard} ${selectedTemplate?.id === t.id ? styles.templateSelected : ''}`}
                style={selectedTemplate?.id === t.id ? { borderColor: t.color } : {}}
                onClick={() => { setSelectedTemplate(t); if (!config.name) setConfig(c => ({ ...c, name: t.name })); }}
              >
                <div className={styles.templateIcon} style={{ background: t.color + '22', color: t.color }}>{t.icon}</div>
                <div className={styles.templateName}>{t.name}</div>
                <div className={styles.templateDesc}>{t.desc}</div>
                <div className={styles.templatePhases}>
                  {t.phases.map(p => (
                    <span key={p.name} className={styles.phaseChip}>{p.name}</span>
                  ))}
                </div>
                <div className={styles.templateCount}>{t.phases.reduce((s,p) => s + p.topics.length, 0)} topics</div>
              </div>
            ))}
          </div>
          <div className={styles.wizardActions}>
            <button className={styles.ghostBtn} onClick={onCancel}>Cancel</button>
            <button className={styles.primaryBtn} disabled={!selectedTemplate} onClick={() => setStep(2)}>
              Next: Configure →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Configuration ── */}
      {step === 2 && (
        <div className={styles.stepContent}>
          <h2 className={styles.stepTitle}>Configure your schedule</h2>
          <p className={styles.stepDesc}>Tell us how much time you can commit each day.</p>

          <div className={styles.configGrid}>
            {/* Name */}
            <div className={styles.configField}>
              <label className={styles.configLabel}>Timetable Name</label>
              <input
                className={styles.configInput}
                value={config.name}
                onChange={e => setConfig(c => ({ ...c, name: e.target.value }))}
                placeholder="e.g. Amazon SDE-2 Prep"
              />
            </div>

            {/* Hours per day */}
            <div className={styles.configField}>
              <label className={styles.configLabel}>
                Hours per day — <span style={{ color: '#60a5fa', fontWeight: 700 }}>{config.hoursPerDay}h</span>
                <span style={{ color: 'var(--text3)', fontWeight: 400, marginLeft: 8 }}>
                  ≈ {estimatedDays} days total
                </span>
              </label>
              <div className={styles.sliderWrap}>
                <span className={styles.sliderMin}>1h</span>
                <input
                  type="range" min={1} max={8} step={1}
                  value={config.hoursPerDay}
                  onChange={e => setConfig(c => ({ ...c, hoursPerDay: Number(e.target.value) }))}
                  className={styles.slider}
                />
                <span className={styles.sliderMax}>8h</span>
              </div>
              <div className={styles.sliderTicks}>
                {[1,2,3,4,5,6,7,8].map(n => (
                  <span key={n} style={{ color: config.hoursPerDay === n ? '#60a5fa' : 'var(--text3)', fontWeight: config.hoursPerDay === n ? 700 : 400 }}>{n}h</span>
                ))}
              </div>
            </div>

            {/* Start date */}
            <div className={styles.configField}>
              <label className={styles.configLabel}>Start Date</label>
              <input
                type="date"
                className={styles.configInput}
                value={config.startDate}
                onChange={e => setConfig(c => ({ ...c, startDate: e.target.value }))}
              />
            </div>

            {/* Rest days */}
            <div className={styles.configField}>
              <label className={styles.configLabel}>Weekly Rest Day</label>
              <div className={styles.toggleRow}>
                <button
                  className={`${styles.toggleBtn} ${config.includeRestDays ? styles.toggleOn : ''}`}
                  onClick={() => setConfig(c => ({ ...c, includeRestDays: !c.includeRestDays }))}
                >
                  {config.includeRestDays ? '✓ Enabled' : 'Disabled'}
                </button>
                <span className={styles.toggleDesc}>
                  {config.includeRestDays
                    ? 'A rest day is added every 7 study days (recommended)'
                    : 'No rest days — study every day without breaks'}
                </span>
              </div>
            </div>
          </div>

          {/* Preview summary */}
          <div className={styles.summaryBar}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryVal}>{selectedTemplate?.phases.reduce((s,p) => s+p.topics.length,0)}</span>
              <span className={styles.summaryKey}>topics</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryVal}>{config.hoursPerDay}h</span>
              <span className={styles.summaryKey}>per day</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryVal}>{estimatedDays}</span>
              <span className={styles.summaryKey}>days</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryVal}>
                {new Date(new Date(config.startDate).getTime() + estimatedDays * 86400000)
                  .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <span className={styles.summaryKey}>finishes</span>
            </div>
          </div>

          <div className={styles.wizardActions}>
            <button className={styles.ghostBtn} onClick={() => setStep(1)}>← Back</button>
            <button className={styles.primaryBtn} onClick={() => setStep(3)}>
              Preview Schedule →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Preview & confirm ── */}
      {step === 3 && (
        <div className={styles.stepContent}>
          <h2 className={styles.stepTitle}>Preview & confirm</h2>
          <p className={styles.stepDesc}>Here's what your first week looks like. All {estimatedDays} days are generated on creation.</p>

          {/* Template phases overview */}
          <div className={styles.previewPhases}>
            {selectedTemplate?.phases.map((phase, pi) => (
              <div key={pi} className={styles.previewPhase}>
                <div className={styles.previewPhaseName} style={{ color: selectedTemplate.color }}>{phase.name}</div>
                <div className={styles.previewTopics}>
                  {phase.topics.map((t, ti) => (
                    <span key={ti} className={styles.previewTopicChip}>{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Sample day layout for 3 days */}
          <div className={styles.previewDays}>
            <div className={styles.previewDayLabel}>Sample first 3 days ({config.hoursPerDay}h/day):</div>
            {[
              { day: 1, tasks: getSampleTasks(selectedTemplate, 0, config.hoursPerDay) },
              { day: 2, tasks: getSampleTasks(selectedTemplate, 1, config.hoursPerDay) },
              { day: 3, tasks: getSampleTasks(selectedTemplate, 2, config.hoursPerDay) },
            ].map(({ day, tasks }) => (
              <div key={day} className={styles.previewDayCard}>
                <div className={styles.previewDayNum}>Day {day}</div>
                <div className={styles.previewTaskList}>
                  {tasks.map((t, i) => {
                    const meta = taskMeta(t.type);
                    return (
                      <div key={i} className={styles.previewTask} style={{ background: meta.bg }}>
                        <span>{meta.icon}</span>
                        <span style={{ color: meta.color }}>{t.topicName}</span>
                        <span className={styles.previewTaskType}>{meta.label}</span>
                        <span className={styles.previewTaskMin}>{t.minutes}m</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.wizardActions}>
            <button className={styles.ghostBtn} onClick={() => setStep(2)}>← Back</button>
            <button className={styles.primaryBtn} disabled={generating} onClick={handleGenerate}>
              {generating ? <><span className={styles.spinnerSm} /> Generating…</> : '🚀 Create Timetable'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* Helper to build sample tasks for preview */
function getSampleTasks(template, topicOffset, hoursPerDay) {
  if (!template) return [];
  const allTopics = template.phases.flatMap(p =>
    p.topics.map(name => ({ name, phase: p.name }))
  );
  const minutesPerDay = hoursPerDay * 60;
  const taskTypes = hoursPerDay >= 4
    ? [
        { type: 'THEORY',          minutes: 45 },
        { type: 'PRACTICE_EASY',   minutes: 60 },
        { type: 'PRACTICE_MEDIUM', minutes: 70 },
        { type: 'PRACTICE_HARD',   minutes: 45 },
        { type: 'REVIEW',          minutes: 20 },
      ]
    : hoursPerDay >= 2
      ? [{ type: 'THEORY', minutes: 45 }, { type: 'PRACTICE_EASY', minutes: 60 }, { type: 'PRACTICE_MEDIUM', minutes: 70 }, { type: 'REVIEW', minutes: 20 }]
      : [{ type: 'THEORY', minutes: 45 }, { type: 'PRACTICE', minutes: 45 }, { type: 'REVIEW', minutes: 20 }];

  const result = [];
  let remaining = minutesPerDay;
  let topicIdx = topicOffset % allTopics.length;
  let typeIdx  = 0;

  while (remaining > 0 && result.length < 4) {
    const tt = taskTypes[typeIdx % taskTypes.length];
    if (remaining < tt.minutes) break;
    result.push({ ...tt, topicName: allTopics[topicIdx]?.name || 'Topic' });
    remaining -= tt.minutes;
    typeIdx++;
    if (typeIdx >= taskTypes.length) { typeIdx = 0; topicIdx++; }
  }
  return result;
}

/* ══════════════════════════════════════════════════════════════════════════════
   DetailView
══════════════════════════════════════════════════════════════════════════════ */
function DetailView({ detail, loading, tab, onTab, completedTasks, onToggle, onDelete, timetableId }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dayNotes, setDayNotes] = useState({});
  const navigate = useNavigate();
  const qc = useQueryClient();

  // Sync dayNotes from detail when it loads
  useEffect(() => {
    if (detail?.dayNotes) setDayNotes(detail.dayNotes);
  }, [detail?.id]);

  const notesMutation = useMutation({
    mutationFn: ({ dayNumber, note }) => timetableApi.setDayNote(timetableId, dayNumber, note),
    onSuccess: (data) => setDayNotes(data.dayNotes || {}),
    onError: () => toast.error('Could not save note'),
  });

  if (loading || !detail) return <div className={styles.center}><span className={styles.spinner} /></div>;

  const schedule = detail.schedule || [];
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayDays = schedule.filter(d => d.date === todayStr);
  const nextDay   = schedule.find(d => !d.isRestDay && d.date > todayStr);

  const totalTasks = schedule
    .filter(d => !d.isRestDay)
    .flatMap(d => d.tasks).length;
  const pct = totalTasks ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  function isTaskDone(dayNumber, taskIndex) {
    return completedTasks.includes(`${dayNumber}-${taskIndex}`);
  }

  return (
    <div className={styles.detailWrap}>
      {/* ── Header ── */}
      <div className={styles.detailHeader}>
        <div>
          <div className={styles.detailName}>{detail.name}</div>
          <div className={styles.detailMeta}>
            <span>⏱ {detail.hoursPerDay}h/day</span>
            <span>📆 {fmtDate(detail.startDate)} → {fmtDate(detail.endDate)}</span>
            <span>📚 {detail.totalTopics} topics · {detail.totalDays} days</span>
            <span className={`${styles.statusBadge} ${detail.status === 'COMPLETED' ? styles.statusDone : ''}`}>
              {detail.status}
            </span>
          </div>
        </div>
        <div className={styles.detailActions}>
          {confirmDelete
            ? <>
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>Sure?</span>
                <button className={styles.dangerBtn} onClick={onDelete}>Delete</button>
                <button className={styles.ghostBtn} onClick={() => setConfirmDelete(false)}>Cancel</button>
              </>
            : <button className={styles.ghostBtn} onClick={() => setConfirmDelete(true)}>🗑 Delete</button>
          }
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className={styles.detailProgress}>
        <div className={styles.progressTrack} style={{ height: 8 }}>
          <div className={styles.progressFill} style={{ width: `${pct}%` }} />
        </div>
        <span className={styles.progressLabel}>{completedTasks.length}/{totalTasks} tasks · {pct}% complete</span>
      </div>

      {/* ── Tabs ── */}
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'today' ? styles.tabActive : ''}`} onClick={() => onTab('today')}>
          🔥 Today
        </button>
        <button className={`${styles.tab} ${tab === 'schedule' ? styles.tabActive : ''}`} onClick={() => onTab('schedule')}>
          📆 Full Schedule
        </button>
      </div>

      {/* ── Today tab ── */}
      {tab === 'today' && (
        <div className={styles.todayWrap}>
          {todayDays.length > 0
            ? todayDays.map(day => (
                <DayCard
                  key={day.dayNumber}
                  day={day}
                  isTaskDone={isTaskDone}
                  onToggle={onToggle}
                  navigate={navigate}
                  dayNote={dayNotes[String(day.dayNumber)] || ''}
                  onSaveNote={(dn, note) => notesMutation.mutate({ dayNumber: dn, note })}
                  highlight
                />
              ))
            : (
              <div className={styles.noTodayWrap}>
                {nextDay
                  ? <>
                      <p className={styles.noTodayMsg}>No tasks scheduled for today.</p>
                      <p className={styles.noTodayNext}>Next study day: <strong>{fmtDate(nextDay.date)}</strong> — Day {nextDay.dayNumber}</p>
                      <DayCard
                        day={nextDay}
                        isTaskDone={isTaskDone}
                        onToggle={onToggle}
                        navigate={navigate}
                        dayNote={dayNotes[String(nextDay.dayNumber)] || ''}
                        onSaveNote={(dn, note) => notesMutation.mutate({ dayNumber: dn, note })}
                      />
                    </>
                  : <p className={styles.noTodayMsg}>
                      {pct === 100 ? '🎉 All done! Great work.' : 'You\'re all caught up for now.'}
                    </p>
                }
              </div>
            )
          }
        </div>
      )}

      {/* ── Schedule tab ── */}
      {tab === 'schedule' && (
        <div className={styles.scheduleWrap}>
          {schedule.map(day => (
            <DayCard
              key={day.dayNumber}
              day={day}
              isTaskDone={isTaskDone}
              onToggle={onToggle}
              navigate={navigate}
              dayNote={dayNotes[String(day.dayNumber)] || ''}
              onSaveNote={(dn, note) => notesMutation.mutate({ dayNumber: dn, note })}
              highlight={day.date === todayStr}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Day card ─────────────────────────────────────────────────────────────── */
function DayCard({ day, isTaskDone, onToggle, navigate, dayNote, onSaveNote, highlight }) {
  const done = (day.tasks || []).every((_, i) => isTaskDone(day.dayNumber, i));
  const past = isPast(day.date) && !isToday(day.date);

  // Sticky note state
  const [noteOpen, setNoteOpen]   = useState(!!dayNote);
  const [localNote, setLocalNote] = useState(dayNote || '');
  const saveTimer = useRef(null);

  // Sync note text when dayNote prop changes (e.g. after save)
  useEffect(() => { setLocalNote(dayNote || ''); }, [dayNote]);
  // Open the note area automatically when a note already exists
  useEffect(() => { if (dayNote) setNoteOpen(true); }, [day.dayNumber]);

  function handleNoteChange(val) {
    setLocalNote(val);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => onSaveNote?.(day.dayNumber, val), 900);
  }

  if (day.isRestDay) return (
    <div className={`${styles.dayCard} ${styles.restCard}`}>
      <div className={styles.dayHeader}>
        <span className={styles.dayNum}>Day {day.dayNumber}</span>
        <span className={styles.dayDate}>{fmtDate(day.date)}</span>
        <span className={styles.restBadge}>☕ Rest Day</span>
        <button
          className={styles.noteToggleBtn}
          title="Sticky note"
          onClick={() => setNoteOpen(o => !o)}
        >📝</button>
      </div>
      {noteOpen && (
        <div className={styles.stickyNote}>
          <textarea
            className={styles.stickyTextarea}
            placeholder="Jot something down for this rest day…"
            value={localNote}
            onChange={e => handleNoteChange(e.target.value)}
            rows={3}
          />
        </div>
      )}
      {!noteOpen && <p className={styles.restText}>Take a break — rest is part of the learning process.</p>}
    </div>
  );

  return (
    <div className={`${styles.dayCard}
      ${highlight ? styles.dayCardToday : ''}
      ${done ? styles.dayCardDone : ''}
      ${past && !done ? styles.dayCardPast : ''}
    `}>
      <div className={styles.dayHeader}>
        <span className={styles.dayNum}>Day {day.dayNumber}</span>
        <span className={styles.dayDate}>{fmtDate(day.date)}</span>
        {highlight && <span className={styles.todayBadge}>TODAY</span>}
        {done && <span className={styles.doneBadge}>✓ Done</span>}
        <span style={{ flex: 1 }} />
        <span className={styles.dayTime}>{fmtMin(day.totalMinutes)}</span>
        <button
          className={`${styles.noteToggleBtn} ${noteOpen ? styles.noteToggleActive : ''}`}
          title={noteOpen ? 'Hide note' : 'Add sticky note'}
          onClick={() => setNoteOpen(o => !o)}
        >
          📝
        </button>
      </div>

      {/* ── Sticky note ── */}
      {noteOpen && (
        <div className={styles.stickyNote}>
          <textarea
            className={styles.stickyTextarea}
            placeholder="Write notes, reminders, or questions for this day…"
            value={localNote}
            onChange={e => handleNoteChange(e.target.value)}
            rows={3}
            autoFocus={!dayNote}
          />
          {localNote && (
            <div className={styles.stickyFooter}>
              📌 Saved automatically
            </div>
          )}
        </div>
      )}

      {/* ── Task groups ── */}
      {groupByPhase(day.tasks || []).map(({ phase, tasks }) => (
        <div key={phase} className={styles.phaseGroup}>
          {phase && <div className={styles.phaseGroupLabel}>{phase}</div>}
          {tasks.map((task) => {
            const globalIdx = (day.tasks || []).indexOf(task);
            const meta      = taskMeta(task.type);
            const checked   = isTaskDone(day.dayNumber, globalIdx);
            const navPath   = taskNavPath(task);
            const navLabel  = taskNavLabel(task);
            return (
              <div key={globalIdx} className={`${styles.taskRow} ${checked ? styles.taskDone : ''}`}>
                <input
                  type="checkbox"
                  className={styles.taskCheck}
                  checked={checked}
                  onChange={() => onToggle(day.dayNumber, globalIdx)}
                />
                <span className={styles.taskIcon}>{meta.icon}</span>
                <div className={styles.taskInfo}>
                  <button
                    className={styles.taskTopicLink}
                    style={{ color: checked ? 'var(--text3)' : meta.color }}
                    title={navLabel}
                    onClick={() => navigate?.(navPath)}
                  >
                    {task.topicName}
                    <span className={styles.taskNavArrow}>↗</span>
                  </button>
                  <span className={styles.taskDesc}>{task.description}</span>
                </div>
                <span className={styles.taskMin}>{fmtMin(task.minutes)}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function groupByPhase(tasks) {
  const map = new Map();
  tasks.forEach(t => {
    const p = t.phase || '';
    if (!map.has(p)) map.set(p, []);
    map.get(p).push(t);
  });
  return Array.from(map.entries()).map(([phase, tasks]) => ({ phase, tasks }));
}

function taskNavPath(task) {
  const type = task.type || '';
  if (type === 'REVIEW')              return '/review';
  if (type.startsWith('PRACTICE'))    return `/problems?search=${encodeURIComponent(task.topicName)}`;
  if (task.topicId)                   return `/?topic=${task.topicId}&fromTimetable=true`;
  return `/?topicSearch=${encodeURIComponent(task.topicName)}&fromTimetable=true`;
}

function taskNavLabel(task) {
  const type = task.type || '';
  if (type === 'REVIEW')           return 'Open Review Queue';
  if (type.startsWith('PRACTICE')) return `Search "${task.topicName}" in Problems`;
  return `Open topic on Dashboard`;
}
