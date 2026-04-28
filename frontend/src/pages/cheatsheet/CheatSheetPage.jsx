import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { topicsApi, QUERY_KEYS } from '../../api';
import styles from './CheatSheetPage.module.css';

function parseMemoryAnchor(text) {
  if (!text) return [];
  return text.split(/\.\s+(?=[A-Z0-9])/).map(s => s.replace(/\.$/, '').trim()).filter(Boolean);
}

export default function CheatSheetPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const topicId = params.get('topic') ? parseInt(params.get('topic'), 10) : null;

  const { data: allTopics = [] } = useQuery({
    queryKey: QUERY_KEYS.topics,
    queryFn: () => topicsApi.getAll(),
    staleTime: 10 * 60 * 1000,
  });

  const { data: topic, isLoading } = useQuery({
    queryKey: QUERY_KEYS.topic(topicId),
    queryFn: () => topicsApi.getById(topicId),
    enabled: !!topicId,
    staleTime: 5 * 60 * 1000,
  });

  if (!topicId) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate('/')}>← Home</button>
          <h1 className={styles.title}>Cheat Sheets</h1>
        </div>
        <p className={styles.hint}>Select a topic to view its cheat sheet.</p>
        <div className={styles.topicGrid}>
          {allTopics.map((t) => (
            <button
              key={t.id}
              className={styles.topicCard}
              onClick={() => navigate(`/cheat-sheet?topic=${t.id}`)}
            >
              <span className={styles.topicTitle}>{t.title}</span>
              <span className={styles.topicCat}>{t.category}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <div className={styles.page}><div className={styles.loading}>Loading…</div></div>;
  }

  if (!topic) {
    return <div className={styles.page}><p>Topic not found.</p></div>;
  }

  const anchors = parseMemoryAnchor(topic.memoryAnchor);

  return (
    <div className={styles.page}>
      <div className={styles.header + ' no-print'}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
        <h1 className={styles.title}>{topic.title} — Cheat Sheet</h1>
        <button className={styles.printBtn} onClick={() => window.print()}>🖨 Print</button>
      </div>

      <div className={styles.sheet}>
        <div className={styles.sheetTitle}>{topic.title}</div>
        {topic.category && <div className={styles.sheetCat}>{topic.category}</div>}

        {/* Memory Anchors */}
        {anchors.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>⚡ Key Points</h2>
            <div className={styles.anchorGrid}>
              {anchors.map((chip, i) => {
                const colonIdx = chip.indexOf(':');
                const hasKey = colonIdx > 0 && colonIdx < 40;
                return (
                  <div key={i} className={styles.anchorChip}>
                    {hasKey ? (
                      <>
                        <strong className={styles.chipKey}>{chip.slice(0, colonIdx)}</strong>
                        <span className={styles.chipVal}>{chip.slice(colonIdx + 1).trim()}</span>
                      </>
                    ) : chip}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Complexity */}
        {(topic.timeComplexity || topic.spaceComplexity) && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>📊 Complexity</h2>
            <div className={styles.complexityRow}>
              {topic.timeComplexity && (
                <div className={styles.complexityBadge}>
                  <span className={styles.compLabel}>Time</span>
                  <span className={styles.compVal}>{topic.timeComplexity}</span>
                </div>
              )}
              {topic.spaceComplexity && (
                <div className={styles.complexityBadge}>
                  <span className={styles.compLabel}>Space</span>
                  <span className={styles.compVal}>{topic.spaceComplexity}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* When to Use */}
        {topic.whenToUse && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>🎯 When to Use</h2>
            <p className={styles.body}>{topic.whenToUse}</p>
          </section>
        )}

        {/* Starter Code */}
        {topic.starterCode && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>🧩 Template</h2>
            <pre className={styles.codeBlock}>{topic.starterCode}</pre>
          </section>
        )}

        {/* First Principles */}
        {topic.firstPrinciples && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>🔬 Why It Works</h2>
            <p className={styles.body}>{topic.firstPrinciples}</p>
          </section>
        )}
      </div>
    </div>
  );
}
