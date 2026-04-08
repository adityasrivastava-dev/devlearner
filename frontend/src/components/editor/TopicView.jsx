import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { topicsApi, submissionsApi, QUERY_KEYS } from '../../api';
import { getCategoryMeta, getDiffMeta } from '../../utils/helpers';
import TracerPlayer from './TracerPlayer';
import FlowchartViewer from './FlowchartViewer';
import styles from './TopicView.module.css';
import ReadOnlyCodeViewer from './ReadOnlyCodeViewer';

export default function TopicView({ topic, onProblemOpen }) {
  const [tab, setTab]               = useState('theory');
  const [activeExample, setActiveExample] = useState(null); // null = list, number = detail view
  const [diffFilter, setDiffFilter] = useState('ALL');

  // Reset example detail on topic change
  useEffect(() => { setActiveExample(null); setTab('theory'); }, [topic.id]);

  const { data: examples = [], isLoading: exLoading } = useQuery({
    queryKey: QUERY_KEYS.examples(topic.id),
    queryFn:  () => topicsApi.getExamples(topic.id),
    enabled:  tab === 'examples',
    staleTime: 10 * 60 * 1000,
  });

  const { data: problems = [], isLoading: prLoading } = useQuery({
    queryKey: QUERY_KEYS.problems(topic.id),
    queryFn:  () => topicsApi.getProblems(topic.id),
    enabled:  tab === 'practice',
    staleTime: 5 * 60 * 1000,
  });

  const { data: solvedIdsFromServer = [] } = useQuery({
    queryKey: QUERY_KEYS.solvedIds,
    queryFn:  submissionsApi.getSolvedIds,
    staleTime: 60 * 1000,
    enabled:  tab === 'practice',
  });
  const localSolved = JSON.parse(localStorage.getItem('devlearn_solved') || '[]');
  const solvedSet   = new Set([...solvedIdsFromServer, ...localSolved]);

  const catMeta         = getCategoryMeta(topic.category);
  const filteredProblems = diffFilter === 'ALL' ? problems
    : problems.filter((p) => p.difficulty === diffFilter);

  // If in example detail view, show full-screen example
  if (tab === 'examples' && activeExample !== null) {
    const ex = examples[activeExample];
    if (ex) {
      return (
        <ExampleDetailView
          ex={ex}
          index={activeExample}
          total={examples.length}
          onBack={() => setActiveExample(null)}
          onPrev={() => setActiveExample(i => Math.max(0, i - 1))}
          onNext={() => setActiveExample(i => Math.min(examples.length - 1, i + 1))}
        />
      );
    }
  }

  return (
    <div className={styles.topicView}>

      {/* ── Compact header ─────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <span className={`badge ${catMeta.cls}`}>{catMeta.label}</span>
          <h1 className={styles.title}>{topic.title}</h1>
        </div>
        {topic.description && (
          <p className={styles.desc}>{topic.description}</p>
        )}
      </div>

      {/* ── Tab bar ────────────────────────────────────────────────────── */}
      <div className={styles.tabBar}>
        {[
          { key: 'theory',   label: 'Theory',   icon: '📖' },
          { key: 'examples', label: 'Examples', icon: '💡' },
          { key: 'practice', label: 'Practice', icon: '🎯' },
          { key: 'optimize', label: 'Approach', icon: '⚡' },
        ].map(({ key, label, icon }) => (
          <button
            key={key}
            className={`${styles.tabBtn} ${tab === key ? styles.tabActive : ''}`}
            onClick={() => { setTab(key); setActiveExample(null); }}
          >
            <span className={styles.tabIcon}>{icon}</span>
            <span className={styles.tabLabel}>{label}</span>
          </button>
        ))}
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className={styles.body}>

        {/* THEORY */}
        {tab === 'theory' && (
          <div className={styles.theoryPanel}>
            {topic.memoryAnchor && (
              <div className={styles.anchorCard}>
                <div className={styles.anchorLabel}>⚡ Memory Anchor</div>
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
              <TheoryCard icon="🔬" title="First Principles" text={topic.firstPrinciples} />
            )}
            {topic.starterCode && (
              <div className={styles.theoryCard}>
                <div className={styles.cardTitle}>🧩 Starter Template</div>
                <pre className={styles.codeBlock}>{topic.starterCode}</pre>
              </div>
            )}
            {!topic.memoryAnchor && !topic.story && !topic.analogy && !topic.firstPrinciples && !topic.starterCode && (
              <div className={styles.emptyState}>
                <span>✍️</span>
                <p>Theory content not yet written.</p>
                <button className={styles.emptyBtn} onClick={() => setTab('examples')}>
                  Go to Examples →
                </button>
              </div>
            )}
            {/* Quick-jump to practice */}
            <div className={styles.theoryFooter}>
              <button className={styles.jumpBtn} onClick={() => setTab('examples')}>
                💡 View Examples
              </button>
              <button className={styles.jumpBtnPrimary} onClick={() => setTab('practice')}>
                🎯 Start Practising
              </button>
            </div>
          </div>
        )}

        {/* EXAMPLES — card grid */}
        {tab === 'examples' && (
          <div className={styles.examplesPanel}>
            {exLoading ? (
              <ExamplesSkeletons />
            ) : examples.length === 0 ? (
              <div className={styles.emptyState}><span>📭</span><p>No examples yet.</p></div>
            ) : (
              <>
                <div className={styles.examplesGrid}>
                  {examples.map((ex, i) => (
                    <button
                      key={ex.id || i}
                      className={styles.exCard}
                      onClick={() => setActiveExample(i)}
                    >
                      <div className={styles.exCardNum}>Example {ex.displayOrder || i + 1}</div>
                      <div className={styles.exCardTitle}>{ex.title}</div>
                      <div className={styles.exCardTags}>
                        {ex.tracerSteps && <span className={styles.exTag}>▶ Tracer</span>}
                        {ex.flowchartMermaid && <span className={styles.exTag}>◈ Diagram</span>}
                        {ex.pseudocode && <span className={styles.exTag}>≡ Pseudocode</span>}
                      </div>
                      <div className={styles.exCardArrow}>Open →</div>
                    </button>
                  ))}
                </div>
                <p className={styles.exHint}>Click any example for full code, tracer, and diagram</p>
              </>
            )}
          </div>
        )}

        {/* PRACTICE */}
        {tab === 'practice' && (
          <div className={styles.practicePanel}>
            <div className={styles.practiceHeader}>
              <div className={styles.practiceStats}>
                <span className={styles.practiceStat}>
                  <strong>{problems.length}</strong> problems
                </span>
                {problems.length > 0 && (
                  <span className={styles.practiceStat}>
                    <strong style={{ color: 'var(--accent)' }}>
                      {[...solvedSet].filter(id => problems.some(p => p.id === id)).length}
                    </strong> solved
                  </span>
                )}
              </div>
              <div className={styles.diffFilters}>
                {['ALL', 'EASY', 'MEDIUM', 'HARD'].map((d) => {
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
              <div className={styles.loadingRow}><span className="spinner" />Loading…</div>
            ) : filteredProblems.length === 0 ? (
              <div className={styles.emptyState}><span>🎯</span><p>No problems yet.</p></div>
            ) : (
              <div className={styles.problemsList}>
                {filteredProblems.map((p, i) => {
                  const diff    = getDiffMeta(p.difficulty);
                  const isSolved = solvedSet.has(p.id);
                  return (
                    <div
                      key={p.id}
                      className={`${styles.problemRow} ${isSolved ? styles.problemSolved : ''}`}
                      onClick={() => onProblemOpen(p.id)}
                    >
                      <span className={styles.probNum}>{p.displayOrder || i + 1}</span>
                      <div className={`${styles.solvedDot} ${isSolved ? styles.solved : ''}`}>
                        {isSolved ? '✓' : ''}
                      </div>
                      <span className={styles.probTitle}>{p.title}</span>
                      <div className={styles.probMeta}>
                        {p.pattern && <span className={styles.patternChip}>{p.pattern}</span>}
                        <span className={`badge ${diff.cls}`}>{diff.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* OPTIMIZE */}
        {tab === 'optimize' && (
          <div className={styles.optimizePanel}>
            {[
              { icon: '🐌', title: 'Brute Force',        key: 'bruteForce',        accent: false },
              { icon: '⚡', title: 'Optimized Approach',  key: 'optimizedApproach', accent: true  },
              { icon: '🎯', title: 'When to Use',         key: 'whenToUse',         accent: false },
              { icon: '📈', title: 'Complexity',          key: '__complexity__',    accent: false },
            ].map(({ icon, title, key, accent }) => (
              <div key={key} className={`${styles.optCard} ${accent ? styles.optAccent : ''}`}>
                <div className={styles.optTitle}>{icon} {title}</div>
                <div className={styles.optContent}>
                  {key === '__complexity__' ? (
                    <>
                      <div><span className={styles.optLabel}>Time</span>{topic.timeComplexity || '—'}</div>
                      <div><span className={styles.optLabel}>Space</span>{topic.spaceComplexity || '—'}</div>
                    </>
                  ) : (
                    topic[key] || <span style={{ color: 'var(--text3)' }}>Not specified</span>
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

// ── Example Detail View (full-page) ──────────────────────────────────────────
function ExampleDetailView({ ex, index, total, onBack, onPrev, onNext }) {
  const [activeSection, setActiveSection] = useState('code');

  const sections = [
    ex.pseudocode      && { key: 'pseudo',    label: '≡ Pseudocode' },
    { key: 'code',       label: '{ } Code'    },
    ex.tracerSteps     && { key: 'tracer',    label: '▶ Tracer'     },
    ex.flowchartMermaid && { key: 'diagram',  label: '◈ Diagram'    },
  ].filter(Boolean);

  return (
    <div className={styles.exDetailView}>

      {/* Top nav bar */}
      <div className={styles.exDetailNav}>
        <button className={styles.exBackBtn} onClick={onBack}>
          ← All Examples
        </button>
        <div className={styles.exDetailMeta}>
          <span className={styles.exDetailNum}>Example {ex.displayOrder || index + 1}</span>
          <span className={styles.exDetailTitle}>{ex.title}</span>
        </div>
        <div className={styles.exNavBtns}>
          <button className={styles.exNavBtn} onClick={onPrev} disabled={index === 0}>
            ‹ Prev
          </button>
          <span className={styles.exNavCount}>{index + 1} / {total}</span>
          <button className={styles.exNavBtn} onClick={onNext} disabled={index === total - 1}>
            Next ›
          </button>
        </div>
      </div>

      {/* Section tabs */}
      <div className={styles.exSectionBar}>
        {sections.map(({ key, label }) => (
          <button
            key={key}
            className={`${styles.exSectionBtn} ${activeSection === key ? styles.exSectionActive : ''}`}
            onClick={() => setActiveSection(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className={styles.exDetailBody}>

        {activeSection === 'pseudo' && ex.pseudocode && (
          <div className={styles.exSection}>
            <div className={styles.exSectionLabel}>Pseudocode</div>
            <pre className={styles.pseudoBlock}>{ex.pseudocode}</pre>
          </div>
        )}

        {activeSection === 'code' && (
          <div className={styles.exSection}>
            <div className={styles.exSectionLabel}>Java Code</div>
            <ReadOnlyCodeViewer code={ex.code} theme="dark" />
          </div>
        )}

        {activeSection === 'tracer' && ex.tracerSteps && (
          <div className={styles.exSection}>
            <div className={styles.exSectionLabel}>Step-by-Step Tracer</div>
            <TracerPlayer code={ex.code} tracerSteps={ex.tracerSteps} />
          </div>
        )}

        {activeSection === 'diagram' && ex.flowchartMermaid && (
          <div className={styles.exSection}>
            <div className={styles.exSectionLabel}>Flow Diagram</div>
            <FlowchartViewer definition={ex.flowchartMermaid} />
          </div>
        )}

        {/* Always-visible insight + real world */}
        <div className={styles.exInsightRow}>
          {ex.explanation && (
            <div className={styles.exInsightCard}>
              <div className={styles.exInsightLabel}>💡 Key Insight</div>
              <p className={styles.exInsightText}>{ex.explanation}</p>
            </div>
          )}
          {ex.realWorldUse && (
            <div className={styles.exRealCard}>
              <div className={styles.exInsightLabel}>🌍 Real World Use</div>
              <p className={styles.exInsightText}>{ex.realWorldUse}</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// CodeBlock replaced by ReadOnlyCodeViewer

// ── Sub-components ────────────────────────────────────────────────────────────
function TheoryCard({ icon, title, text }) {
  return (
    <div className={styles.theoryCard}>
      <div className={styles.cardTitle}>{icon} {title}</div>
      <div className={styles.cardBody}>{text}</div>
    </div>
  );
}

function ExamplesSkeletons() {
  return (
    <div className={styles.examplesGrid}>
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className={styles.exCardSkeleton}>
          <div className="skeleton" style={{ width: 60, height: 10, borderRadius: 4, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: '80%', height: 14, borderRadius: 4, marginBottom: 12 }} />
          <div style={{ display: 'flex', gap: 6 }}>
            <div className="skeleton" style={{ width: 55, height: 18, borderRadius: 10 }} />
            <div className="skeleton" style={{ width: 55, height: 18, borderRadius: 10 }} />
          </div>
        </div>
      ))}
    </div>
  );
}