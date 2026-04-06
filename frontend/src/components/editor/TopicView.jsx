import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { topicsApi, submissionsApi, QUERY_KEYS } from '../../api';
import { getCategoryMeta, getDiffMeta } from '../../utils/helpers';
import TracerPlayer from './TracerPlayer';
import FlowchartViewer from './FlowchartViewer';
import styles from './TopicView.module.css';

export default function TopicView({ topic, onProblemOpen }) {
  const [tab, setTab] = useState('theory');
  const [openExample, setOpenExample] = useState(0);
  const [diffFilter, setDiffFilter] = useState('ALL');

  const { data: examples = [], isLoading: exLoading } = useQuery({
    queryKey: QUERY_KEYS.examples(topic.id),
    queryFn: () => topicsApi.getExamples(topic.id),
    enabled: tab === 'examples',
    staleTime: 10 * 60 * 1000,
  });

  const { data: problems = [], isLoading: prLoading } = useQuery({
    queryKey: QUERY_KEYS.problems(topic.id),
    queryFn: () => topicsApi.getProblems(topic.id),
    enabled: tab === 'practice',
    staleTime: 5 * 60 * 1000,
  });

  // BUG FIX: previously read localStorage inside map() — N reads per render cycle
  // and stale after solving without navigating away. Now use React Query solvedIds
  // (reactive — updates immediately after a submission) merged with localStorage
  // (offline fallback when not logged in or cache is cold).
  const { data: solvedIdsFromServer = [] } = useQuery({
    queryKey: QUERY_KEYS.solvedIds,
    queryFn: submissionsApi.getSolvedIds,
    staleTime: 60 * 1000,
    enabled: tab === 'practice',
  });
  const localSolved = JSON.parse(localStorage.getItem('devlearn_solved') || '[]');
  const solvedSet = new Set([...solvedIdsFromServer, ...localSolved]);

  const catMeta = getCategoryMeta(topic.category);
  const filteredProblems = diffFilter === 'ALL' ? problems
    : problems.filter((p) => p.difficulty === diffFilter);

  const TABS = ['theory','examples','practice','optimize'];

  return (
    <div className={styles.topicView}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.meta}>
          <span className={`badge ${catMeta.cls}`}>{catMeta.label}</span>
          {topic.timeComplexity && (
            <span className={styles.complexity}>
              ⏱ {topic.timeComplexity}
              {topic.spaceComplexity && ` · 💾 ${topic.spaceComplexity}`}
            </span>
          )}
        </div>
        <h1 className={styles.title}>{topic.title}</h1>
        {topic.description && (
          <p className={styles.desc}>{topic.description}</p>
        )}
        <div className={styles.actionRow}>
          <button className="btn btn-primary btn-sm" onClick={() => setTab('practice')}>
            🎯 Practice Problems
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setTab('optimize')}>
            ⚡ Approach
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="tab-bar">
        {TABS.map((t) => (
          <button
            key={t}
            className={`tab-btn ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'theory' ? '📖 Theory'
             : t === 'examples' ? '💡 Examples'
             : t === 'practice' ? '🎯 Practice'
             : '⚡ Optimize'}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div className={styles.body}>

        {/* Theory */}
        {tab === 'theory' && (
          <div className={styles.theoryPanel}>
            {topic.memoryAnchor && (
              <div className={styles.anchorCard}>
                <div className={styles.anchorLabel}>💡 Memory Anchor</div>
                <div className={styles.anchorText}>{topic.memoryAnchor}</div>
              </div>
            )}
            {topic.story && (
              <TheoryCard icon="📖" title="The Story" text={topic.story} />
            )}
            {topic.analogy && (
              <TheoryCard icon="🎨" title="Visual Analogy" text={topic.analogy} />
            )}
            {topic.firstPrinciples && (
              <TheoryCard icon="🔬" title="First Principles — WHY it works" text={topic.firstPrinciples} />
            )}
            {!topic.memoryAnchor && !topic.story && !topic.analogy && !topic.firstPrinciples && (
              <div className={styles.emptyState}>
                <span>✍️</span>
                <p>Story content not yet written for this topic.</p>
                <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
                  Switch to Examples or Practice to start learning.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Examples */}
        {tab === 'examples' && (
          <div className={styles.examplesPanel}>
            {exLoading ? (
              <div className={styles.loadingRow}><span className="spinner" />Loading examples…</div>
            ) : examples.length === 0 ? (
              <div className={styles.emptyState}><span>📭</span><p>No examples yet.</p></div>
            ) : (
              examples.map((ex, i) => (
                <div key={ex.id || i} className={styles.exampleCard}>
                  <button
                    className={styles.exHeader}
                    onClick={() => setOpenExample(openExample === i ? -1 : i)}
                  >
                    <div>
                      <div className={styles.exNum}>EXAMPLE {ex.displayOrder || i + 1}</div>
                      <div className={styles.exTitle}>{ex.title}</div>
                    </div>
                    <span className={`${styles.exToggle} ${openExample === i ? styles.open : ''}`}>▼</span>
                  </button>
                  {openExample === i && (
                    <div className={styles.exBody}>
                      <p className={styles.exDesc}>{ex.description}</p>
                      {ex.pseudocode && (
                        <div className={styles.pseudoSection}>
                          <div className={styles.pseudoLabel}>📝 Pseudocode</div>
                          <pre className="code-block" style={{ fontSize: 12 }}>{ex.pseudocode}</pre>
                        </div>
                      )}
                      <pre className="code-block">{ex.code}</pre>

                      {/* Tracer player — shown when pre-recorded steps exist */}
                      {ex.tracerSteps && (
                        <TracerPlayer code={ex.code} tracerSteps={ex.tracerSteps} />
                      )}

                      {/* Mermaid flowchart — shown when diagram definition exists */}
                      {ex.flowchartMermaid && (
                        <FlowchartViewer
                          definition={ex.flowchartMermaid}
                          title="Flow Diagram"
                        />
                      )}

                      <div className={styles.exMeta}>
                        <div><strong>💡 Key Insight:</strong> {ex.explanation}</div>
                        {ex.realWorldUse && (
                          <div className={styles.rwTag}>🌍 {ex.realWorldUse}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Practice */}
        {tab === 'practice' && (
          <div className={styles.practicePanel}>
            <div className={styles.practiceHeader}>
              <h3 className={styles.practiceTitle}>{topic.title} — Problems</h3>
              <div className={styles.diffFilters}>
                {['ALL','EASY','MEDIUM','HARD'].map((d) => {
                  const m = d !== 'ALL' ? getDiffMeta(d) : null;
                  return (
                    <button
                      key={d}
                      className={`${styles.diffBtn} ${diffFilter === d ? styles.activeDiff : ''}`}
                      style={diffFilter === d && m ? { color: m.color, borderColor: m.color, background: `${m.color}15` } : {}}
                      onClick={() => setDiffFilter(d)}
                    >
                      {d === 'ALL' ? 'All' : d.charAt(0) + d.slice(1).toLowerCase()}
                    </button>
                  );
                })}
              </div>
            </div>
            {prLoading ? (
              <div className={styles.loadingRow}><span className="spinner" />Loading problems…</div>
            ) : filteredProblems.length === 0 ? (
              <div className={styles.emptyState}><span>🎯</span><p>No problems yet.</p></div>
            ) : (
              <div className={styles.problemsList}>
                {filteredProblems.map((p, i) => {
                  const diff = getDiffMeta(p.difficulty);
                  const isSolved = solvedSet.has(p.id);
                  return (
                    <div
                      key={p.id}
                      className={styles.problemRow}
                      onClick={() => onProblemOpen(p.id)}
                    >
                      <span className={styles.probNum}>{p.displayOrder || i + 1}</span>
                      <span className={`${styles.solvedDot} ${isSolved ? styles.solved : ''}`}>
                        {isSolved ? '✓' : ''}
                      </span>
                      <span className={styles.probTitle}>{p.title}</span>
                      <div className={styles.probMeta}>
                        {p.pattern && (
                          <span className={styles.patternChip}>{p.pattern}</span>
                        )}
                        <span className={`badge ${diff.cls}`}>{diff.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Optimize */}
        {tab === 'optimize' && (
          <div className={styles.optimizeGrid}>
            {[
              { icon: '🐌', title: 'Brute Force',       key: 'bruteForce',        highlight: false },
              { icon: '⚡', title: 'Optimized Approach', key: 'optimizedApproach', highlight: true  },
              { icon: '🎯', title: 'When to Use',        key: 'whenToUse',         highlight: false },
              { icon: '📈', title: 'Complexity',         key: '__complexity__',    highlight: false },
            ].map(({ icon, title, key, highlight }) => (
              <div key={key} className={`${styles.optCard} ${highlight ? styles.optHighlight : ''}`}>
                <h3 className={styles.optTitle}>{icon} {title}</h3>
                <div className={styles.optContent}>
                  {key === '__complexity__' ? (
                    <>
                      <div><strong style={{ color: 'var(--accent)' }}>Time:</strong> {topic.timeComplexity || 'N/A'}</div>
                      <div><strong style={{ color: 'var(--blue)' }}>Space:</strong> {topic.spaceComplexity || 'N/A'}</div>
                    </>
                  ) : (
                    topic[key] || 'N/A'
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TheoryCard({ icon, title, text }) {
  return (
    <div className={styles.theoryCard}>
      <div className={styles.cardTitle}>{icon} {title}</div>
      <div className={styles.cardBody}>{text}</div>
    </div>
  );
}
