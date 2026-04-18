import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { topicsApi, QUERY_KEYS } from '../../api';
import EmptyState from '../shared/EmptyState';
import TracerPlayer from './TracerPlayer';
import FlowchartViewer from './FlowchartViewer';
import SqlTableVisualizer from '../sql/SqlTableVisualizer';
import ReadOnlyCodeViewer from './ReadOnlyCodeViewer';
import styles from './TopicView.module.css';

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

function ExampleDetailView({ ex, index, total, theme, onBack, onPrev, onNext }) {
  const [activeSection, setActiveSection] = useState(ex.tableData ? 'tables' : 'code');

  const sections = [
    ex.tableData        && { key: 'tables',  label: '⊞ Tables'     },
    ex.pseudocode       && { key: 'pseudo',  label: '≡ Pseudocode' },
    { key: 'code',         label: '{ } Code'    },
    ex.tracerSteps      && { key: 'tracer',  label: '▶ Tracer'     },
    ex.flowchartMermaid && { key: 'diagram', label: '◈ Diagram'    },
  ].filter(Boolean);

  return (
    <div className={styles.exDetailView}>
      <div className={styles.exDetailNav}>
        <button className={styles.exBackBtn} onClick={onBack}>← All Examples</button>
        <div className={styles.exDetailMeta}>
          <span className={styles.exDetailNum}>Example {ex.displayOrder || index + 1}</span>
          <span className={styles.exDetailTitle}>{ex.title}</span>
        </div>
        <div className={styles.exNavBtns}>
          <button className={styles.exNavBtn} onClick={onPrev} disabled={index === 0}>‹ Prev</button>
          <span className={styles.exNavCount}>{index + 1} / {total}</span>
          <button className={styles.exNavBtn} onClick={onNext} disabled={index === total - 1}>Next ›</button>
        </div>
      </div>

      <div className={styles.exSectionBar} role="tablist" aria-label="Example sections">
        {sections.map(({ key, label }) => (
          <button
            key={key}
            role="tab"
            aria-selected={activeSection === key}
            className={`${styles.exSectionBtn} ${activeSection === key ? styles.exSectionActive : ''}`}
            onClick={() => setActiveSection(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={styles.exDetailBody}>
        {activeSection === 'tables' && ex.tableData && (
          <div className={styles.exSection}>
            <div className={styles.exSectionLabel}>Table Visualization</div>
            <SqlTableVisualizer data={ex.tableData} />
          </div>
        )}
        {activeSection === 'pseudo' && ex.pseudocode && (
          <div className={styles.exSection}>
            <div className={styles.exSectionLabel}>Pseudocode</div>
            <pre className={styles.pseudoBlock}>{ex.pseudocode}</pre>
          </div>
        )}
        {activeSection === 'code' && (
          <div className={styles.exSection}>
            <div className={styles.exSectionLabel}>Java Code</div>
            <ReadOnlyCodeViewer code={ex.code} theme={theme} />
          </div>
        )}
        {activeSection === 'tracer' && ex.tracerSteps && (
          <div className={styles.exSection}>
            <div className={styles.exSectionLabel}>Step-by-Step Tracer</div>
            <TracerPlayer code={ex.code} tracerSteps={ex.tracerSteps} theme={theme} />
          </div>
        )}
        {activeSection === 'diagram' && ex.flowchartMermaid && (
          <div className={styles.exSection}>
            <div className={styles.exSectionLabel}>Flow Diagram</div>
            <FlowchartViewer definition={ex.flowchartMermaid} />
          </div>
        )}

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

export default function TopicExamplesTab({ topicId, theme }) {
  const [activeExample, setActiveExample] = useState(null);

  const { data: examples = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.examples(topicId),
    queryFn:  () => topicsApi.getExamples(topicId),
    staleTime: 10 * 60 * 1000,
  });

  if (activeExample !== null && examples[activeExample]) {
    return (
      <ExampleDetailView
        ex={examples[activeExample]}
        index={activeExample}
        total={examples.length}
        theme={theme}
        onBack={() => setActiveExample(null)}
        onPrev={() => setActiveExample(i => Math.max(0, i - 1))}
        onNext={() => setActiveExample(i => Math.min(examples.length - 1, i + 1))}
      />
    );
  }

  return (
    <div className={styles.examplesPanel}>
      {isLoading ? (
        <ExamplesSkeletons />
      ) : examples.length === 0 ? (
        <EmptyState icon="💡" title="No examples yet." hint="Ask an admin to add code examples for this topic." compact />
      ) : (
        <>
          <div className={styles.examplesGrid}>
            {examples.map((ex, i) => (
              <button
                key={ex.id || i}
                className={styles.exCard}
                onClick={() => setActiveExample(i)}
                aria-label={`Open example ${ex.displayOrder || i + 1}: ${ex.title}`}
              >
                <div className={styles.exCardNum}>Example {ex.displayOrder || i + 1}</div>
                <div className={styles.exCardTitle}>{ex.title}</div>
                <div className={styles.exCardTags}>
                  {ex.tableData        && <span className={styles.exTag}>⊞ Tables</span>}
                  {ex.tracerSteps      && <span className={styles.exTag}>▶ Tracer</span>}
                  {ex.flowchartMermaid && <span className={styles.exTag}>◈ Diagram</span>}
                  {ex.pseudocode       && <span className={styles.exTag}>≡ Pseudocode</span>}
                </div>
                <div className={styles.exCardArrow} aria-hidden="true">Open →</div>
              </button>
            ))}
          </div>
          <p className={styles.exHint}>Click any example for full code, tracer, and diagram</p>
        </>
      )}
    </div>
  );
}
