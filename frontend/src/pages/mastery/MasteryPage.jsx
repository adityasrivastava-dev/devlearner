import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { topicsApi, gateApi, QUERY_KEYS } from '../../api';
import { CATEGORIES, getCategoryMeta } from '../../utils/helpers';
import styles from './MasteryPage.module.css';

// Stage display metadata
const STAGE_META = {
  THEORY:  { label: 'Not started', short: 'Theory',  order: 0, color: 'var(--text3)',  bg: 'var(--bg3)',           border: 'var(--border2)' },
  EASY:    { label: 'Easy unlock', short: 'Easy',    order: 1, color: '#60a5fa',        bg: 'rgba(59,130,246,0.1)', border: '#3b82f6' },
  MEDIUM:  { label: 'Medium',      short: 'Medium',  order: 2, color: '#fbbf24',        bg: 'rgba(217,119,6,0.1)',  border: '#d97706' },
  HARD:    { label: 'Hard',        short: 'Hard',    order: 3, color: '#fb923c',        bg: 'rgba(234,88,12,0.1)',  border: '#ea580c' },
  MASTERED:{ label: 'Mastered',    short: 'Mastered',order: 4, color: '#4ade80',        bg: 'rgba(22,163,74,0.1)', border: '#16a34a' },
};

// Category display order — follows CATEGORIES array in helpers.js
const CAT_ORDER = CATEGORIES.filter(c => c.key !== 'ALL').map(c => c.key);

export default function MasteryPage() {
  const navigate = useNavigate();

  const { data: topics = [], isLoading: topicsLoading } = useQuery({
    queryKey: QUERY_KEYS.topics('ALL'),
    queryFn:  () => topicsApi.getAll('ALL'),
    staleTime: 5 * 60_000,
  });

  const { data: stagesMap = {}, isLoading: stagesLoading } = useQuery({
    queryKey: QUERY_KEYS.allGateStages,
    queryFn:  () => gateApi.getAllStages(),
    staleTime: 2 * 60_000,
  });

  const loading = topicsLoading || stagesLoading;

  // Enrich topics with their stage
  const enriched = useMemo(() =>
    topics.map(t => ({ ...t, stage: stagesMap[t.id] || 'THEORY' })),
    [topics, stagesMap]
  );

  // Group by category in the defined order
  const grouped = useMemo(() => {
    const map = new Map();
    for (const t of enriched) {
      const cat = t.category || 'DSA';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat).push(t);
    }
    // Sort within each group by displayOrder
    map.forEach(arr => arr.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)));

    // Return in defined category order, then any remaining
    const ordered = [];
    for (const key of CAT_ORDER) {
      if (map.has(key)) ordered.push({ key, topics: map.get(key), meta: getCategoryMeta(key) });
    }
    for (const [key, ts] of map.entries()) {
      if (!CAT_ORDER.includes(key)) ordered.push({ key, topics: ts, meta: getCategoryMeta(key) });
    }
    return ordered;
  }, [enriched]);

  // Summary counts
  const counts = useMemo(() => {
    const c = { THEORY: 0, EASY: 0, MEDIUM: 0, HARD: 0, MASTERED: 0 };
    for (const t of enriched) c[t.stage] = (c[t.stage] || 0) + 1;
    return c;
  }, [enriched]);

  const inProgress = (counts.EASY || 0) + (counts.MEDIUM || 0) + (counts.HARD || 0);

  function goToTopic(id) {
    navigate(`/?topic=${id}`);
  }

  return (
    <div className={styles.page}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.titleRow}>
            <button className={styles.backBtn} onClick={() => navigate('/')}>← Home</button>
            <h1 className={styles.title}>Topic Mastery Map</h1>
            <span className={styles.sub}>{enriched.length} topics across all categories</span>
          </div>

          {/* Summary pills */}
          <div className={styles.summary}>
            <div className={`${styles.pill} ${styles.pillGray}`}>
              <span className={styles.pillNum}>{counts.THEORY ?? 0}</span>
              <span className={styles.pillLabel}>Not started</span>
            </div>
            <div className={`${styles.pill} ${styles.pillBlue}`}>
              <span className={styles.pillNum}>{inProgress}</span>
              <span className={styles.pillLabel}>In progress</span>
            </div>
            <div className={`${styles.pill} ${styles.pillGreen}`}>
              <span className={styles.pillNum}>{counts.MASTERED ?? 0}</span>
              <span className={styles.pillLabel}>Mastered</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {enriched.length > 0 && (
          <div className={styles.progressBar}>
            {['MASTERED', 'HARD', 'MEDIUM', 'EASY'].map(stage => {
              const pct = ((counts[stage] || 0) / enriched.length) * 100;
              if (pct === 0) return null;
              return (
                <div
                  key={stage}
                  className={styles.progressSegment}
                  style={{ width: `${pct}%`, background: STAGE_META[stage].border }}
                  title={`${STAGE_META[stage].label}: ${counts[stage]}`}
                />
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className={styles.legend}>
          {Object.entries(STAGE_META).map(([key, m]) => (
            <div key={key} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: m.border }} />
              <span className={styles.legendLabel}>{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <div className={styles.body}>
        {loading && (
          <div className={styles.loadingState}>
            <span className={styles.spinner} />
            <span>Loading your progress…</span>
          </div>
        )}

        {!loading && grouped.map(({ key, topics: catTopics, meta }) => {
          const mastered  = catTopics.filter(t => t.stage === 'MASTERED').length;
          const inProg    = catTopics.filter(t => t.stage !== 'THEORY' && t.stage !== 'MASTERED').length;
          const notStarted = catTopics.filter(t => t.stage === 'THEORY').length;

          return (
            <section key={key} className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.catDot} style={{ background: meta.color }} />
                <span className={styles.catLabel}>{meta.label}</span>
                <span className={styles.catCount}>{catTopics.length} topics</span>
                <div className={styles.catStats}>
                  {mastered > 0   && <span className={styles.catStatGreen}>{mastered} mastered</span>}
                  {inProg > 0     && <span className={styles.catStatAmber}>{inProg} in progress</span>}
                  {notStarted > 0 && <span className={styles.catStatGray}>{notStarted} not started</span>}
                </div>
              </div>

              <div className={styles.grid}>
                {catTopics.map(topic => {
                  const sm = STAGE_META[topic.stage] || STAGE_META.THEORY;
                  return (
                    <button
                      key={topic.id}
                      className={styles.card}
                      style={{ borderColor: sm.border, background: sm.bg }}
                      onClick={() => goToTopic(topic.id)}
                      title={`${topic.title} — ${sm.label}`}
                    >
                      <span className={styles.cardName}>{topic.title}</span>
                      <span
                        className={styles.cardStage}
                        style={{ color: sm.color, borderColor: sm.border }}
                      >
                        {topic.stage === 'MASTERED' && '✓ '}{sm.short}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
