import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { topicsApi, gateApi, QUERY_KEYS } from '../../api';
import { CATEGORIES, CATEGORY_META } from '../../utils/helpers';
import styles from './TopicBrowser.module.css';

const GATE_META = {
  THEORY:   { label: 'Theory',   color: '#64748b' },
  EASY:     { label: 'Easy',     color: '#4ade80' },
  MEDIUM:   { label: 'Medium',   color: '#fbbf24' },
  HARD:     { label: 'Hard',     color: '#f87171' },
  MASTERED: { label: 'Mastered', color: '#a78bfa' },
};

const CAT_CONFIG = {
  JAVA:          { icon: '☕', color: '#fbbf24' },
  ADVANCED_JAVA: { icon: '⚡', color: '#a78bfa' },
  MYSQL:         { icon: '🗄', color: '#60a5fa' },
  DSA:           { icon: '🎯', color: '#60a5fa' },
  SPRING_BOOT:   { icon: '🍃', color: '#4ade80' },
  AWS:           { icon: '☁',  color: '#fb923c' },
  SYSTEM_DESIGN: { icon: '🏗', color: '#f472b6'  },
  TESTING:       { icon: '🧪', color: '#34d399'  },
};

export default function TopicBrowser({ category, onTopicSelect }) {
  const [search, setSearch] = useState('');

  const catLabel = CATEGORIES.find((c) => c.key === category)?.label || category;
  const cfg = CAT_CONFIG[category] || { icon: '📚', color: '#94a3b8' };

  const { data: topics = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.topics(category),
    queryFn:  () => topicsApi.getAll(category),
    staleTime: 5 * 60 * 1000,
  });

  // Gate stages: { topicId -> 'THEORY' | 'EASY' | ... | 'MASTERED' }
  const { data: gateStages = {} } = useQuery({
    queryKey: QUERY_KEYS.allGateStages,
    queryFn:  gateApi.getAllStages,
    staleTime: 60 * 1000,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return topics;
    const q = search.toLowerCase();
    return topics.filter(
      (t) => t.title.toLowerCase().includes(q) || t.subCategory?.toLowerCase().includes(q)
    );
  }, [topics, search]);

  // Group by subCategory
  const grouped = useMemo(() => {
    if (search.trim()) {
      return [{ sub: null, topics: filtered }];
    }
    const map = new Map();
    for (const t of filtered) {
      const sub = t.subCategory || '';
      if (!map.has(sub)) map.set(sub, []);
      map.get(sub).push(t);
    }
    return Array.from(map.entries()).map(([sub, list]) => ({
      sub: sub || null,
      topics: list,
    }));
  }, [filtered, search]);

  const masteredCount = topics.filter((t) => gateStages[t.id] === 'MASTERED').length;
  const progressPct   = topics.length ? Math.round((masteredCount / topics.length) * 100) : 0;

  return (
    <div className={styles.root}>
    <div className={styles.inner}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerIcon} style={{ background: cfg.color + '18', borderColor: cfg.color + '44' }}>
          <span style={{ fontSize: 28 }}>{cfg.icon}</span>
        </div>
        <div className={styles.headerText}>
          <h1 className={styles.title}>{catLabel} Topics</h1>
          <p className={styles.sub}>
            {isLoading ? 'Loading…' : `${topics.length} topics`}
            {!isLoading && masteredCount > 0 && (
              <span className={styles.masteredNote}>
                {' '}· {masteredCount} mastered
              </span>
            )}
          </p>
        </div>
        {!isLoading && topics.length > 0 && (
          <div className={styles.progressWrap}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${progressPct}%`, background: cfg.color }}
              />
            </div>
            <span className={styles.progressLabel} style={{ color: cfg.color }}>
              {progressPct}%
            </span>
          </div>
        )}
      </div>

      {/* Search */}
      <div className={styles.searchRow}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          className={styles.search}
          type="text"
          placeholder={`Search ${catLabel} topics…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className={styles.clearBtn} onClick={() => setSearch('')}>✕</button>
        )}
        <span className={styles.countBadge}>{filtered.length}</span>
      </div>

      {/* Topic groups */}
      {isLoading ? (
        <div className={styles.grid}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className={styles.skeletonCard} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🔍</div>
          <div className={styles.emptyText}>No topics match "{search}"</div>
          <button className={styles.emptyReset} onClick={() => setSearch('')}>Clear search</button>
        </div>
      ) : (
        <div className={styles.groups}>
          {grouped.map(({ sub, topics: groupTopics }) => (
            <div key={sub || '__all'} className={styles.group}>
              {sub && (
                <div className={styles.groupLabel}>
                  <span className={styles.groupLine} />
                  <span>{sub}</span>
                  <span className={styles.groupLine} />
                </div>
              )}
              <div className={styles.grid}>
                {groupTopics.map((topic) => (
                  <TopicCard
                    key={topic.id}
                    topic={topic}
                    gateStage={gateStages[topic.id]}
                    accentColor={cfg.color}
                    onClick={() => onTopicSelect(topic.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </div>
  );
}

function TopicCard({ topic, gateStage, accentColor, onClick }) {
  const gate      = GATE_META[gateStage] || null;
  const isMastered = gateStage === 'MASTERED';

  return (
    <button
      className={`${styles.card} ${isMastered ? styles.cardMastered : ''}`}
      onClick={onClick}
      style={isMastered ? { borderColor: '#a78bfa33' } : undefined}
    >
      {/* Gate progress indicator — top-right dot */}
      {gate && (
        <span
          className={styles.gateDot}
          style={{ background: gate.color }}
          title={gate.label}
        />
      )}

      <div className={styles.cardBody}>
        <div className={styles.cardTitle}>{topic.title}</div>
        {topic.subCategory && (
          <div className={styles.cardSub}>{topic.subCategory}</div>
        )}
      </div>

      <div className={styles.cardFooter}>
        {gate ? (
          <span className={styles.gateLabel} style={{ color: gate.color, borderColor: gate.color + '44' }}>
            {gate.label}
          </span>
        ) : (
          <span className={styles.gateLabel} style={{ color: '#64748b', borderColor: '#64748b44' }}>
            Not started
          </span>
        )}
        <span className={styles.arrow}>→</span>
      </div>
    </button>
  );
}
