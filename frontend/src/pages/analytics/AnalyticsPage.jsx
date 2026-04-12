import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi, QUERY_KEYS } from '../../api';
import styles from './AnalyticsPage.module.css';

// ── Helpers ───────────────────────────────────────────────────────────────────

function confidenceColor(score) {
  if (score >= 70) return '#4ade80';
  if (score >= 40) return '#fbbf24';
  return '#f87171';
}

function confidenceLabel(score) {
  if (score >= 70) return 'Strong';
  if (score >= 40) return 'Developing';
  return 'Weak';
}

const ERROR_META = {
  WRONG_ANSWER:   { color: '#f87171', label: 'Wrong Answer'   },
  COMPILE_ERROR:  { color: '#fbbf24', label: 'Compile Error'  },
  RUNTIME_ERROR:  { color: '#fb923c', label: 'Runtime Error'  },
  TLE:            { color: '#a78bfa', label: 'Time Limit'     },
  ACCEPTED:       { color: '#4ade80', label: 'Accepted'       },
};

function errorMeta(type) {
  return ERROR_META[type] || { color: 'var(--text3)', label: type || 'Other' };
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ConfidenceCard({ topic, onClick }) {
  const color = confidenceColor(topic.confidenceScore);
  const label = confidenceLabel(topic.confidenceScore);
  return (
    <div className={styles.confCard} onClick={onClick} title="Go to topic">
      <div className={styles.confTop}>
        <span className={styles.confTitle}>{topic.topicTitle}</span>
        <span className={styles.confTag} style={{ color }}>{label}</span>
      </div>
      <div className={styles.confMeta}>
        <span>{topic.topicCategory}</span>
        <span>{topic.accepted}/{topic.attempts} solved</span>
        <span>{topic.accuracyRate}% accuracy</span>
      </div>
      <div className={styles.confBarTrack}>
        <div
          className={styles.confBarFill}
          style={{ width: `${topic.confidenceScore}%`, background: color }}
        />
      </div>
      <div className={styles.confScore} style={{ color }}>{topic.confidenceScore}/100</div>
    </div>
  );
}

function EmptyState({ text }) {
  return <div className={styles.empty}>{text}</div>;
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const [mistakeFilter, setMistakeFilter] = useState('ALL');
  const [mistakeSearch, setMistakeSearch] = useState('');

  const { data: dash = {}, isLoading: dashLoading } = useQuery({
    queryKey: QUERY_KEYS.analyticsDashboard,
    queryFn:  analyticsApi.getDashboard,
    staleTime: 2 * 60_000,
  });

  const { data: mistakes = [], isLoading: mistakesLoading } = useQuery({
    queryKey: QUERY_KEYS.analyticsMistakes,
    queryFn:  analyticsApi.getMistakes,
    staleTime: 2 * 60_000,
  });

  const weakAreas   = dash.weakAreas   || [];
  const strongAreas = dash.strongAreas || [];
  const errorBreakdown    = dash.errorBreakdown    || [];
  const patternConfusions = dash.patternConfusions || [];
  const totalTopicsTried  = dash.totalTopicsTried  || 0;

  // Max count for error bar scaling
  const maxErrorCount = Math.max(...errorBreakdown.map((e) => e.count), 1);

  // Mistake filter options from data
  const errorTypes = useMemo(() => {
    const types = [...new Set(mistakes.map((m) => m.errorType).filter(Boolean))];
    return types;
  }, [mistakes]);

  const filteredMistakes = useMemo(() => {
    return mistakes.filter((m) => {
      const matchType   = mistakeFilter === 'ALL' || m.errorType === mistakeFilter;
      const q = mistakeSearch.toLowerCase();
      const matchSearch = !q
        || m.problemTitle?.toLowerCase().includes(q)
        || m.topicTitle?.toLowerCase().includes(q)
        || m.detectedPattern?.toLowerCase().includes(q);
      return matchType && matchSearch;
    });
  }, [mistakes, mistakeFilter, mistakeSearch]);

  const loading = dashLoading || mistakesLoading;

  return (
    <div className={styles.page}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>← Back</button>
        <div className={styles.headerText}>
          <h1 className={styles.heading}>Performance Analytics</h1>
          <p className={styles.subheading}>Your submission history, confidence scores, and weak spots</p>
        </div>
        <div className={styles.statPills}>
          <div className={styles.statPill}>
            <span className={styles.statNum}>{totalTopicsTried}</span>
            <span className={styles.statLabel}>Topics tried</span>
          </div>
          <div className={styles.statPill}>
            <span className={styles.statNum}>{mistakes.length}</span>
            <span className={styles.statLabel}>Mistakes logged</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingWrap}>
          <div className={styles.spinner} />
          <span>Loading your analytics…</span>
        </div>
      ) : (
        <>
          {/* ── Weak / Strong Areas ──────────────────────────────────────── */}
          <div className={styles.twoCol}>
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <span className={styles.panelIcon} style={{ color: '#f87171' }}>↓</span>
                <h2 className={styles.panelTitle}>Weak Areas</h2>
                <span className={styles.panelSub}>Lowest confidence scores</span>
              </div>
              {weakAreas.length === 0
                ? <EmptyState text="No data yet — solve some problems to see weak areas." />
                : weakAreas.map((t) => (
                    <ConfidenceCard
                      key={t.topicId}
                      topic={t}
                      onClick={() => navigate(`/?topic=${t.topicId}`)}
                    />
                  ))
              }
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <span className={styles.panelIcon} style={{ color: '#4ade80' }}>↑</span>
                <h2 className={styles.panelTitle}>Strong Areas</h2>
                <span className={styles.panelSub}>Highest confidence scores</span>
              </div>
              {strongAreas.length === 0
                ? <EmptyState text="Keep solving problems to build strong areas." />
                : strongAreas.map((t) => (
                    <ConfidenceCard
                      key={t.topicId}
                      topic={t}
                      onClick={() => navigate(`/?topic=${t.topicId}`)}
                    />
                  ))
              }
            </section>
          </div>

          {/* ── Error Breakdown + Pattern Confusions ─────────────────────── */}
          <div className={styles.twoCol}>
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <span className={styles.panelIcon}>⚠</span>
                <h2 className={styles.panelTitle}>Error Breakdown</h2>
                <span className={styles.panelSub}>What's causing failures</span>
              </div>
              {errorBreakdown.length === 0
                ? <EmptyState text="No submission errors logged yet." />
                : (
                  <div className={styles.errorList}>
                    {errorBreakdown.map((e) => {
                      const meta = errorMeta(e.type);
                      const pct  = Math.round((e.count / maxErrorCount) * 100);
                      return (
                        <div key={e.type} className={styles.errorRow}>
                          <span className={styles.errorLabel} style={{ color: meta.color }}>
                            {meta.label}
                          </span>
                          <div className={styles.errorBarTrack}>
                            <div
                              className={styles.errorBarFill}
                              style={{ width: `${pct}%`, background: meta.color }}
                            />
                          </div>
                          <span className={styles.errorCount}>{e.count}</span>
                        </div>
                      );
                    })}
                  </div>
                )
              }
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <span className={styles.panelIcon}>⇄</span>
                <h2 className={styles.panelTitle}>Pattern Confusions</h2>
                <span className={styles.panelSub}>Where you mislabel patterns</span>
              </div>
              {patternConfusions.length === 0
                ? <EmptyState text="No pattern confusion data yet." />
                : (
                  <table className={styles.confusionTable}>
                    <thead>
                      <tr>
                        <th>You wrote</th>
                        <th>Should be</th>
                        <th>#</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patternConfusions.map((row, i) => (
                        <tr key={i}>
                          <td>
                            <span className={styles.patternChip} style={{ background: 'rgba(248,113,113,0.12)', color: '#f87171' }}>
                              {row.detected || '—'}
                            </span>
                          </td>
                          <td>
                            <span className={styles.patternChip} style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80' }}>
                              {row.correct || '—'}
                            </span>
                          </td>
                          <td className={styles.confusionCount}>{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              }
            </section>
          </div>

          {/* ── Mistake Journal ──────────────────────────────────────────── */}
          <section className={`${styles.panel} ${styles.panelFull}`}>
            <div className={styles.panelHeader}>
              <span className={styles.panelIcon}>📋</span>
              <h2 className={styles.panelTitle}>Mistake Journal</h2>
              <span className={styles.panelSub}>Last 50 wrong submissions</span>
              <div className={styles.mistakeControls}>
                <input
                  className={styles.mistakeSearch}
                  type="text"
                  placeholder="Search problem or topic…"
                  value={mistakeSearch}
                  onChange={(e) => setMistakeSearch(e.target.value)}
                />
                <div className={styles.filterTabs}>
                  <button
                    className={`${styles.filterTab} ${mistakeFilter === 'ALL' ? styles.filterTabActive : ''}`}
                    onClick={() => setMistakeFilter('ALL')}
                  >
                    All
                  </button>
                  {errorTypes.map((t) => (
                    <button
                      key={t}
                      className={`${styles.filterTab} ${mistakeFilter === t ? styles.filterTabActive : ''}`}
                      onClick={() => setMistakeFilter(t)}
                    >
                      {errorMeta(t).label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {filteredMistakes.length === 0 ? (
              <EmptyState text={
                mistakes.length === 0
                  ? "No mistakes logged yet — errors from future submissions will appear here."
                  : "No mistakes match the current filter."
              } />
            ) : (
              <div className={styles.mistakeTableWrap}>
                <table className={styles.mistakeTable}>
                  <thead>
                    <tr>
                      <th>Problem</th>
                      <th>Topic</th>
                      <th>Error</th>
                      <th>Pattern detected</th>
                      <th>Correct pattern</th>
                      <th>When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMistakes.map((m) => {
                      const meta = errorMeta(m.errorType);
                      const date = m.createdAt
                        ? new Date(m.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                        : '—';
                      const mismatch = m.detectedPattern && m.correctPattern
                        && m.detectedPattern !== m.correctPattern;
                      return (
                        <tr key={m.id}>
                          <td className={styles.mistakeProblem}>{m.problemTitle || '—'}</td>
                          <td className={styles.mistakeTopic}>{m.topicTitle || '—'}</td>
                          <td>
                            <span className={styles.errorPill} style={{ background: `${meta.color}20`, color: meta.color }}>
                              {meta.label}
                            </span>
                          </td>
                          <td>
                            {m.detectedPattern
                              ? <span className={`${styles.patternChip} ${mismatch ? styles.patternMismatch : ''}`}>
                                  {m.detectedPattern}
                                </span>
                              : <span className={styles.dash}>—</span>
                            }
                          </td>
                          <td>
                            {m.correctPattern
                              ? <span className={styles.patternChip}>{m.correctPattern}</span>
                              : <span className={styles.dash}>—</span>
                            }
                          </td>
                          <td className={styles.mistakeDate}>{date}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
