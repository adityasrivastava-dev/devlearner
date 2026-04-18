import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { pathApi, QUERY_KEYS } from '../../api';
import styles from './LearningPathPage.module.css';

const STAGE_META = {
  THEORY:   { label: 'Theory',   color: '#94a3b8', icon: '📖', order: 0 },
  EASY:     { label: 'Easy',     color: '#4ade80', icon: '🟢', order: 1 },
  MEDIUM:   { label: 'Medium',   color: '#fbbf24', icon: '🟡', order: 2 },
  HARD:     { label: 'Hard',     color: '#f87171', icon: '🔴', order: 3 },
  MASTERED: { label: 'Mastered', color: '#a78bfa', icon: '⭐', order: 4 },
};

const CAT_META = {
  JAVA:          { icon: '☕', color: '#fbbf24' },
  ADVANCED_JAVA: { icon: '⚡', color: '#a78bfa' },
  DSA:           { icon: '🎯', color: '#60a5fa' },
  SPRING_BOOT:   { icon: '🍃', color: '#4ade80' },
  MYSQL:         { icon: '🗄',  color: '#f59e0b' },
  AWS:           { icon: '☁',  color: '#fb923c' },
  SYSTEM_DESIGN: { icon: '🏗',  color: '#f472b6' },
  TESTING:       { icon: '🧪',  color: '#34d399' },
};

export default function LearningPathPage() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.learningPath,
    queryFn:  pathApi.getPath,
    staleTime: 2 * 60 * 1000,
  });

  function goTopic(topicId) { navigate(`/?topic=${topicId}`); }

  if (isLoading) return (
    <div className={styles.page}>
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <span>Building your path…</span>
      </div>
    </div>
  );

  const summary  = data?.summary   || {};
  const focusNow = data?.focusNow  || [];
  const upNext   = data?.upNext    || [];
  const mastered = data?.mastered  || [];
  const weekPlan = data?.weekPlan  || [];
  const total    = summary.total   || 1;
  const masteredPct = Math.round((summary.mastered / total) * 100);

  return (
    <div className={styles.page}>
      <div className={styles.scrollBody}>

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className={styles.hero}>
          <h1 className={styles.title}>Your Learning Path</h1>
          <p className={styles.subtitle}>Personalised based on your current gate progress</p>

          {/* Summary pills */}
          <div className={styles.summaryRow}>
            <div className={styles.summaryPill} style={{ borderColor: '#a78bfa' }}>
              <span className={styles.pillNum}>{summary.mastered || 0}</span>
              <span className={styles.pillLabel}>Mastered</span>
            </div>
            <div className={styles.summaryPill} style={{ borderColor: '#fbbf24' }}>
              <span className={styles.pillNum}>{summary.inProgress || 0}</span>
              <span className={styles.pillLabel}>In Progress</span>
            </div>
            <div className={styles.summaryPill} style={{ borderColor: '#94a3b8' }}>
              <span className={styles.pillNum}>{summary.notStarted || 0}</span>
              <span className={styles.pillLabel}>Not Started</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className={styles.progressWrap}>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${masteredPct}%` }} />
            </div>
            <span className={styles.progressLabel}>{masteredPct}% mastered</span>
          </div>
        </div>

        <div className={styles.content}>

          {/* ── Week Plan ─────────────────────────────────────────── */}
          {weekPlan.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>📅 Study Plan</h2>
              <div className={styles.weeks}>
                {weekPlan.map((w) => (
                  <div key={w.week} className={`${styles.weekCard} ${w.week === 1 ? styles.weekCardActive : ''}`}>
                    <div className={styles.weekHeader}>
                      <span className={styles.weekLabel}>{w.label}</span>
                      <span className={styles.weekCount}>{w.items.length} topics</span>
                    </div>
                    <div className={styles.weekItems}>
                      {w.items.map((item) => {
                        const cat  = CAT_META[item.category] || { icon: '📘', color: '#888' };
                        const stg  = STAGE_META[item.stage]  || STAGE_META.THEORY;
                        return (
                          <button
                            key={item.topicId}
                            className={styles.weekItem}
                            onClick={() => goTopic(item.topicId)}
                          >
                            <span className={styles.weekItemIcon}>{cat.icon}</span>
                            <div className={styles.weekItemBody}>
                              <span className={styles.weekItemTitle}>{item.title}</span>
                              <span className={styles.weekItemAction}>{item.action}</span>
                            </div>
                            <span className={styles.stageDot} style={{ background: stg.color }} title={stg.label} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Focus Now ─────────────────────────────────────────── */}
          {focusNow.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>🎯 Focus Now — {focusNow.length} In Progress</h2>
              <div className={styles.topicGrid}>
                {focusNow.map((item) => <TopicCard key={item.topicId} item={item} onClick={() => goTopic(item.topicId)} />)}
              </div>
            </section>
          )}

          {/* ── Up Next ───────────────────────────────────────────── */}
          {upNext.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>⏭ Up Next — {summary.notStarted} topics</h2>
              <div className={styles.topicGrid}>
                {upNext.map((item) => <TopicCard key={item.topicId} item={item} onClick={() => goTopic(item.topicId)} />)}
              </div>
              {summary.notStarted > 20 && (
                <p className={styles.moreHint}>+{summary.notStarted - 20} more topics — open a category to see all</p>
              )}
            </section>
          )}

          {/* ── Mastered ──────────────────────────────────────────── */}
          {mastered.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>⭐ Mastered — {mastered.length} topics</h2>
              <div className={styles.masteredList}>
                {mastered.map((item) => {
                  const cat = CAT_META[item.category] || { icon: '📘', color: '#888' };
                  return (
                    <button
                      key={item.topicId}
                      className={styles.masteredItem}
                      onClick={() => goTopic(item.topicId)}
                    >
                      <span>{cat.icon}</span>
                      <span className={styles.masteredTitle}>{item.title}</span>
                      <span className={styles.masteredCheck}>✓</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {focusNow.length === 0 && upNext.length === 0 && mastered.length === 0 && (
            <div className={styles.empty}>
              <p>No topics found. Make sure topics are seeded in the admin panel.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function TopicCard({ item, onClick }) {
  const cat = CAT_META[item.category] || { icon: '📘', color: '#888' };
  const stg = STAGE_META[item.stage]  || STAGE_META.THEORY;

  return (
    <button className={styles.topicCard} onClick={onClick}>
      <div className={styles.cardTop}>
        <span className={styles.cardCatIcon}>{cat.icon}</span>
        <span className={styles.cardTitle}>{item.title}</span>
        <span className={styles.cardStageBadge} style={{ color: stg.color, borderColor: stg.color }}>
          {stg.label}
        </span>
      </div>
      {item.subCategory && <div className={styles.cardSub}>{item.subCategory}</div>}
      <div className={styles.cardAction}>{item.action}</div>
      {item.progressText && (
        <div className={styles.cardProgress}>
          <div className={styles.progressMini}>
            <div className={styles.progressMiniFill} style={{ width: progressPct(item) + '%', background: stg.color }} />
          </div>
          <span className={styles.progressMiniLabel}>{item.progressText}</span>
        </div>
      )}
    </button>
  );
}

function progressPct(item) {
  if (!item.progressText) return 0;
  const m = item.progressText.match(/(\d+)\/(\d+)/);
  if (!m) return 0;
  return Math.round((parseInt(m[1]) / parseInt(m[2])) * 100);
}
