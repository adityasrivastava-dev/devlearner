import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ALGORITHMS, ALGORITHM_CATEGORIES } from './algorithmData';
import styles from './AlgorithmsPage.module.css';

// ── Complexity badge ──────────────────────────────────────────────────────────
function ComplexityBadge({ label, value }) {
  const color =
    value.includes('1)')   ? 'var(--success)' :
    value.includes('log')  ? '#34d399' :
    value.includes('n)')   ? 'var(--yellow)' :
    value.includes('n²)')  ? 'var(--red)' :
    value.includes('2ⁿ')   ? 'var(--red)' :
                             'var(--text2)';
  return (
    <div className={styles.complexityBox}>
      <span className={styles.complexityLabel}>{label}</span>
      <span className={styles.complexityValue} style={{ color }}>{value}</span>
    </div>
  );
}

// ── Algorithm card in grid ────────────────────────────────────────────────────
function AlgorithmCard({ algo, onClick }) {
  const avgColor =
    algo.timeComplexity.average.includes('1)')  ? 'var(--success)' :
    algo.timeComplexity.average.includes('log') ? '#34d399' :
    algo.timeComplexity.average.includes('n)')  ? 'var(--yellow)' :
                                                  'var(--red)';
  return (
    <div className={styles.card} onClick={() => onClick(algo)}>
      <div className={styles.cardTop}>
        <span className={styles.cardEmoji}>{algo.emoji}</span>
        <span className={styles.cardCategory}>{algo.category}</span>
      </div>
      <div className={styles.cardName}>{algo.name}</div>
      <div className={styles.cardAnalogy}>{algo.analogy}</div>
      <div className={styles.cardFooter}>
        <span className={styles.cardComplexity} style={{ color: avgColor }}>
          avg {algo.timeComplexity.average}
        </span>
        <span className={styles.cardSpace}>
          space {algo.spaceComplexity.split(' ')[0]}
        </span>
      </div>
      <div className={styles.cardTags}>
        {algo.tags.slice(0, 3).map((t) => (
          <span key={t} className={styles.tag}>{t}</span>
        ))}
      </div>
    </div>
  );
}

// ── Detail view ───────────────────────────────────────────────────────────────
function AlgorithmDetail({ algo, onBack }) {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { key: 'overview',  label: '📖 Overview'   },
    { key: 'howitworks', label: '⚙️ How it Works' },
    { key: 'code',      label: '💻 Code'        },
    { key: 'usecases',  label: '🌍 Use Cases'   },
    { key: 'pitfalls',  label: '⚠️ Pitfalls'    },
  ];

  return (
    <div className={styles.detail}>

      {/* Header */}
      <div className={styles.detailHeader}>
        <button className={styles.backBtn} onClick={onBack}>← All Algorithms</button>
        <div className={styles.detailTitle}>
          <span className={styles.detailEmoji}>{algo.emoji}</span>
          <div>
            <h1 className={styles.detailName}>{algo.name}</h1>
            <span className={styles.detailCat}>{algo.category}</span>
          </div>
        </div>
      </div>

      {/* Complexity strip */}
      <div className={styles.complexityStrip}>
        <ComplexityBadge label="Best"    value={algo.timeComplexity.best}    />
        <ComplexityBadge label="Average" value={algo.timeComplexity.average} />
        <ComplexityBadge label="Worst"   value={algo.timeComplexity.worst}   />
        <div className={styles.complexityDivider} />
        <ComplexityBadge label="Space"   value={algo.spaceComplexity.split('·')[0].trim()} />
        {algo.stability !== 'N/A' && (
          <ComplexityBadge label="Stable" value={algo.stability} />
        )}
      </div>

      {/* Analogy callout */}
      <div className={styles.analogyBox}>
        <span className={styles.analogyIcon}>💡</span>
        <span className={styles.analogyText}>{algo.analogy}</span>
      </div>

      {/* Tab bar */}
      <div className={styles.tabBar}>
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`${styles.tabBtn} ${activeTab === t.key ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className={styles.tabContent}>

        {activeTab === 'overview' && (
          <div className={styles.section}>
            <div className={styles.storyBox}>
              <h3 className={styles.sectionTitle}>The Story</h3>
              <p className={styles.storyText}>{algo.story}</p>
            </div>
            <div className={styles.whenBox}>
              <h3 className={styles.sectionTitle}>When to Use</h3>
              <div className={styles.whenText}>
                {algo.whenToUse.split('\n').map((line, i) => (
                  <div key={i} className={styles.whenLine}>{line}</div>
                ))}
              </div>
            </div>
            <div className={styles.tagsRow}>
              {algo.tags.map((t) => (
                <span key={t} className={styles.tagLg}>{t}</span>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'howitworks' && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Step by Step</h3>
            <div className={styles.stepsBox}>
              {algo.howItWorks.split('\n').map((line, i) => {
                const isHeader = !line.match(/^\d+\.|^•/) && line.endsWith(':');
                const isStep = line.match(/^\d+\./);
                const isBullet = line.startsWith('•');
                if (!line.trim()) return <div key={i} style={{ height: 8 }} />;
                if (isHeader) return (
                  <div key={i} className={styles.stepHeader}>{line}</div>
                );
                if (isStep) {
                  const [num, ...rest] = line.split('.');
                  return (
                    <div key={i} className={styles.step}>
                      <span className={styles.stepNum}>{num}</span>
                      <span className={styles.stepText}>{rest.join('.').trim()}</span>
                    </div>
                  );
                }
                if (isBullet) return (
                  <div key={i} className={styles.stepBullet}>{line}</div>
                );
                return <div key={i} className={styles.stepText}>{line}</div>;
              })}
            </div>

            {algo.mermaid && (
              <div className={styles.mermaidWrap}>
                <h3 className={styles.sectionTitle} style={{ marginBottom: 10 }}>Flowchart</h3>
                <MermaidDiagram chart={algo.mermaid} />
              </div>
            )}
          </div>
        )}

        {activeTab === 'code' && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Java Implementation</h3>
            <pre className={styles.codeBlock}>
              <code>{algo.code}</code>
            </pre>
          </div>
        )}

        {activeTab === 'usecases' && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Real-World Use Cases</h3>
            <div className={styles.useCaseGrid}>
              {algo.useCases.map((uc, i) => (
                <div key={i} className={styles.useCaseCard}>
                  <div className={styles.useCaseTitle}>{uc.title}</div>
                  <div className={styles.useCaseDesc}>{uc.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'pitfalls' && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Common Mistakes</h3>
            <div className={styles.pitfallList}>
              {algo.pitfalls.map((p, i) => (
                <div key={i} className={styles.pitfall}>
                  <span className={styles.pitfallIcon}>⚠️</span>
                  <span className={styles.pitfallText}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Mermaid diagram (lazy render) ─────────────────────────────────────────────
function MermaidDiagram({ chart }) {
  const [rendered, setRendered] = useState(null);
  const [error, setError] = useState(false);

  useState(() => {
    import('mermaid').then((m) => {
      m.default.initialize({ startOnLoad: false, theme: 'dark', themeVariables: {
        primaryColor: '#6366f1', primaryTextColor: '#e2e8f4',
        background: '#0f1117', edgeLabelBackground: '#161b25',
      }});
      m.default.render('mermaid-algo', chart)
        .then(({ svg }) => setRendered(svg))
        .catch(() => setError(true));
    }).catch(() => setError(true));
  }, [chart]);

  if (error) return (
    <pre className={styles.codeBlock} style={{ fontSize: 11 }}>{chart}</pre>
  );
  if (!rendered) return (
    <div style={{ padding: 20, color: 'var(--text3)', fontSize: 12 }}>
      <span className="spinner" /> Rendering diagram…
    </div>
  );
  return <div dangerouslySetInnerHTML={{ __html: rendered }} className={styles.mermaidSvg} />;
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AlgorithmsPage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('ALL');
  const [search,   setSearch]   = useState('');
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    return ALGORITHMS.filter((a) => {
      const matchCat = category === 'ALL' || a.category === category;
      const q = search.toLowerCase();
      const matchSearch = !q
        || a.name.toLowerCase().includes(q)
        || a.category.toLowerCase().includes(q)
        || a.tags.some((t) => t.toLowerCase().includes(q))
        || a.analogy.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [category, search]);

  if (selected) {
    return <AlgorithmDetail algo={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <button className="btn-back" onClick={() => navigate('/')}>← Home</button>
        <div className={styles.headerCenter}>
          <h1 className={styles.pageTitle}>Algorithms</h1>
          <p className={styles.pageSub}>
            {ALGORITHMS.length} algorithms · understand how they work, when to use them, and how to code them
          </p>
        </div>
        <div className={styles.headerRight} />
      </div>

      {/* Search */}
      <div className={styles.searchBar}>
        <input
          className={`input ${styles.searchInput}`}
          placeholder="🔍 Search algorithms, complexity, use case…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Category filter */}
      <div className={styles.catBar}>
        {ALGORITHM_CATEGORIES.map((c) => (
          <button
            key={c.key}
            className={`${styles.catBtn} ${category === c.key ? styles.catActive : ''}`}
            onClick={() => setCategory(c.key)}
          >
            {c.icon} {c.label}
            {c.key !== 'ALL' && (
              <span className={styles.catCount}>
                {ALGORITHMS.filter((a) => a.category === c.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className={styles.body}>
        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🔍</div>
            <div className={styles.emptyTitle}>No algorithms found</div>
            <div className={styles.emptySub}>Try a different search or category</div>
          </div>
        ) : (
          <>
            <div className={styles.resultCount}>
              {filtered.length} algorithm{filtered.length !== 1 ? 's' : ''}
              {category !== 'ALL' && ` in ${category}`}
              {search && ` matching "${search}"`}
            </div>
            <div className={styles.grid}>
              {filtered.map((algo) => (
                <AlgorithmCard key={algo.id} algo={algo} onClick={setSelected} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}