import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { algorithmsApi } from '../../api';
import FlowchartViewer from '../../components/editor/FlowchartViewer';
import AlgorithmVisualizer from './AlgorithmVisualizer';
import VisualizationPlan from './VisualizationPlan';
import ComplexityVisualizer from './ComplexityVisualizer';
import styles from './AlgorithmsPage.module.css';

// ─── Category metadata (icons/labels only — counts come from DB) ──────────────
const CATEGORY_META = {
  'ALL':                  { icon: '🎯', label: 'All' },
  'Searching':            { icon: '🔍', label: 'Searching' },
  'Sorting':              { icon: '📊', label: 'Sorting' },
  'Two Pointer':          { icon: '👆', label: 'Two Pointer' },
  'Sliding Window':       { icon: '🪟', label: 'Sliding Window' },
  'Dynamic Programming':  { icon: '🧩', label: 'Dynamic Prog.' },
  'Graph':                { icon: '🕸️',  label: 'Graph' },
  'Trees':                { icon: '🌳', label: 'Trees' },
  'Tree':                 { icon: '🌲', label: 'Tree' },
  'Greedy':               { icon: '💰', label: 'Greedy' },
  'Backtracking':         { icon: '↩️',  label: 'Backtracking' },
  'Math':                 { icon: '🔢', label: 'Math' },
  'Linked List':          { icon: '🔗', label: 'Linked List' },
  'Stack':                { icon: '📚', label: 'Stack' },
  'Stack & Queue':        { icon: '📦', label: 'Stack & Queue' },
  'Heap':                 { icon: '⛰️',  label: 'Heap' },
  'Bit Manipulation':     { icon: '⚡', label: 'Bit Tricks' },
  'String':               { icon: '📝', label: 'String' },
  'Hashing':              { icon: '#️⃣',  label: 'Hashing' },
  'Design':               { icon: '🏗️',  label: 'Design' },
  'Range Query':          { icon: '📐', label: 'Range Query' },
};

// ─── Parse JSON fields (tags, useCases, pitfalls, variants) ──────────────────
function parseJSON(str, fallback = []) {
  if (!str) return fallback;
  try { return JSON.parse(str); } catch { return fallback; }
}

// ─── Complexity colour ────────────────────────────────────────────────────────
function complexityColor(val = '') {
  if (val.includes('1)'))   return 'var(--success)';
  if (val.includes('log'))  return '#34d399';
  if (val.includes('n)'))   return 'var(--yellow)';
  if (val.includes('n²') || val.includes('n!') || val.includes('2ⁿ')) return 'var(--red)';
  return 'var(--text2)';
}

function ComplexityBadge({ label, value }) {
  return (
    <div className={styles.complexityBox}>
      <span className={styles.complexityLabel}>{label}</span>
      <span className={styles.complexityValue} style={{ color: complexityColor(value) }}>
        {value}
      </span>
    </div>
  );
}

// ─── Algorithm card ───────────────────────────────────────────────────────────
function AlgorithmCard({ algo, onClick }) {
  const tags = parseJSON(algo.tags, []);
  const diffColor = {
    BEGINNER:     'var(--success)',
    INTERMEDIATE: 'var(--yellow)',
    ADVANCED:     'var(--red)',
  }[algo.difficulty] || 'var(--text2)';

  const avgColor = complexityColor(algo.timeComplexityAverage || '');

  return (
    <div className={styles.card} onClick={() => onClick(algo)}>
      <div className={styles.cardTop}>
        <span className={styles.cardEmoji}>{algo.emoji}</span>
        <span className={styles.cardCategory}>{algo.category}</span>
      </div>
      <div className={styles.cardName}>{algo.name}</div>
      <div className={styles.cardAnalogy}>{algo.analogy}</div>
      <div className={styles.cardComplexityRow}>
        <span className={styles.cardComplexity} style={{ color: avgColor }}>
          avg {algo.timeComplexityAverage}
        </span>
        <span className={styles.cardSpace}>{algo.spaceComplexity?.split('·')[0].trim()}</span>
      </div>
      <div className={styles.cardTags}>
        {tags.slice(0, 3).map(t => (
          <span key={t} className={styles.tag}>{t}</span>
        ))}
      </div>
      <div className={styles.cardFooter}>
        <span className={styles.diffBadge} style={{ color: diffColor, borderColor: diffColor + '44' }}>
          {algo.difficulty?.charAt(0) + algo.difficulty?.slice(1).toLowerCase()}
        </span>
      </div>
    </div>
  );
}

// ─── Full detail view ─────────────────────────────────────────────────────────
function AlgorithmDetail({ algo, onBack }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [copied, setCopied] = useState(false);

  const tags        = parseJSON(algo.tags, []);
  const useCases    = parseJSON(algo.useCases, []);
  const pitfalls    = parseJSON(algo.pitfalls, []);
  const variants    = parseJSON(algo.variants, []);

  const tabs = [
    { key: 'overview',    label: '📖 Overview'      },
    { key: 'howitworks',  label: '⚙️ How It Works'   },
    { key: 'complexity',  label: '🔢 Complexity'     },
    { key: 'visual',      label: '📊 Visual'         },
    { key: 'code',        label: '💻 Java Code'      },
    { key: 'usecases',    label: '🌍 Use Cases'      },
    { key: 'pitfalls',    label: '⚠️ Pitfalls'       },
    { key: 'interview',   label: '🎤 Interview Tips'  },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(algo.javaCode || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderLines = (text = '') =>
    (text || '').split('\n').map((line, i) => {
      if (!line.trim()) return <div key={i} style={{ height: 6 }} />;
      const stepMatch = line.match(/^(\d+)\.\s+(.*)/);
      if (stepMatch) return (
        <div key={i} className={styles.step}>
          <span className={styles.stepNum}>{stepMatch[1]}</span>
          <span className={styles.stepText}>{stepMatch[2]}</span>
        </div>
      );
      if (line.startsWith('•')) return (
        <div key={i} className={styles.bullet}>{line}</div>
      );
      return <div key={i} className={styles.plainLine}>{line}</div>;
    });

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
        <span className={styles.diffPill} style={{
          color: { BEGINNER: 'var(--success)', INTERMEDIATE: 'var(--yellow)', ADVANCED: 'var(--red)' }[algo.difficulty],
          borderColor: ({ BEGINNER: 'var(--success)', INTERMEDIATE: 'var(--yellow)', ADVANCED: 'var(--red)' }[algo.difficulty] || 'transparent') + '55',
        }}>
          {algo.difficulty?.charAt(0) + algo.difficulty?.slice(1).toLowerCase()}
        </span>
      </div>

      {/* Complexity strip */}
      <div className={styles.complexityStrip}>
        <ComplexityBadge label="Best"    value={algo.timeComplexityBest}    />
        <ComplexityBadge label="Average" value={algo.timeComplexityAverage} />
        <ComplexityBadge label="Worst"   value={algo.timeComplexityWorst}   />
        <div className={styles.complexityDivider} />
        <ComplexityBadge label="Space"   value={algo.spaceComplexity?.split('·')[0].trim()} />
        {algo.stability && algo.stability !== 'N/A' && (
          <ComplexityBadge label="Stable" value={algo.stability} />
        )}
      </div>

      {/* Analogy */}
      <div className={styles.analogyBox}>
        <span className={styles.analogyIcon}>💡</span>
        <span className={styles.analogyText}>{algo.analogy}</span>
      </div>

      {/* Tab bar */}
      <div className={styles.tabBar}>
        {tabs.map(t => (
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
              <div>{renderLines(algo.whenToUse)}</div>
            </div>
            {variants.length > 0 && (
              <div className={styles.variantsBox}>
                <h3 className={styles.sectionTitle}>Variants</h3>
                {variants.map((v, i) => (
                  <div key={i} className={styles.variantItem}>
                    <span className={styles.variantName}>{v.name}</span>
                    <span className={styles.variantDesc}>{v.desc}</span>
                  </div>
                ))}
              </div>
            )}
            <div className={styles.tagsRow}>
              {tags.map(t => <span key={t} className={styles.tagLg}>{t}</span>)}
            </div>
          </div>
        )}

        {activeTab === 'howitworks' && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Step by Step</h3>
            <div className={styles.stepsBox}>
              {renderLines(algo.howItWorks)}
            </div>
          </div>
        )}

        {activeTab === 'complexity' && (
          <ComplexityVisualizer algo={algo} />
        )}

        {activeTab === 'visual' && (
          <div className={styles.section}>
            {/* ── Interactive Step Player ── */}
            <AlgorithmVisualizer algoName={algo.name} />

            {/* ── Fallback: mermaid flowchart for algorithms without a custom visualizer ── */}
            {!algo.name?.toLowerCase().match(/binary search|linear search|bubble|insertion|quick|merge|two.pointer|sliding window|bfs|breadth|dfs|depth|fibonacci|dynamic/) && (
              algo.mermaidDiagram ? (
                <>
                  <h3 className={styles.sectionTitle}>Step-by-Step Visualization</h3>
                  <p className={styles.visualHint}>Follow the flow to trace how the algorithm executes.</p>
                  <FlowchartViewer definition={algo.mermaidDiagram} />
                </>
              ) : null
            )}

            {/* ── Visualization Blueprint: always shown ── */}
            <VisualizationPlan algo={algo} />
          </div>
        )}

        {activeTab === 'code' && (
          <div className={styles.section}>
            <div className={styles.codeHeader}>
              <h3 className={styles.sectionTitle}>Java Implementation</h3>
              <button className={styles.copyBtn} onClick={handleCopy}>
                {copied ? '✅ Copied!' : '📋 Copy'}
              </button>
            </div>
            <pre className={styles.codeBlock}><code>{algo.javaCode}</code></pre>
          </div>
        )}

        {activeTab === 'usecases' && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Real-World Use Cases</h3>
            <div className={styles.useCaseGrid}>
              {useCases.map((uc, i) => (
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
              {pitfalls.map((p, i) => (
                <div key={i} className={styles.pitfall}>
                  <span className={styles.pitfallIcon}>⚠️</span>
                  <span className={styles.pitfallText}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'interview' && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>What Interviewers Actually Care About</h3>
            <div className={styles.interviewBox}>
              {(algo.interviewTips || '').split('\n').filter(Boolean).map((tip, i) => (
                <div key={i} className={styles.interviewTip}>
                  <span className={styles.interviewIcon}>🎤</span>
                  <span className={styles.interviewText}>{tip.replace(/^•\s*/, '')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Empty state when no algorithms are seeded yet ────────────────────────────
function EmptySeeded({ onAdmin, isAdmin }) {
  return (
    <div className={styles.emptySeeded}>
      <div className={styles.emptyIcon}>📭</div>
      <div className={styles.emptyTitle}>No algorithms seeded yet</div>
      <div className={styles.emptySub}>
        Import seed files from the Admin Panel to populate this page.
      </div>
      {isAdmin && (
        <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={onAdmin}>
          Go to Admin Panel
        </button>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AlgorithmsPage() {
  const navigate = useNavigate();

  const [allAlgorithms, setAllAlgorithms] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [category, setCategory]           = useState('ALL');
  const [search, setSearch]               = useState('');
  const [selected, setSelected]           = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Fetch all algorithms from backend on mount
  useEffect(() => {
    algorithmsApi.getAll()
      .then(data => {
        setAllAlgorithms(data);
        setLoading(false);
      })
      .catch(e => {
        setError(e?.response?.data?.message || e?.message || 'Failed to load algorithms');
        setLoading(false);
      });
  }, []);

  // Derive categories that actually exist in the data
  const presentCategories = useMemo(() => {
    const cats = new Set(allAlgorithms.map(a => a.category));
    return ['ALL', ...Array.from(cats).sort()];
  }, [allAlgorithms]);

  // Category counts
  const catCounts = useMemo(() => {
    const counts = {};
    allAlgorithms.forEach(a => {
      counts[a.category] = (counts[a.category] || 0) + 1;
    });
    return counts;
  }, [allAlgorithms]);

  // Filtered list
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allAlgorithms.filter(a => {
      const matchCat = category === 'ALL' || a.category === category;
      const tags = parseJSON(a.tags, []);
      const matchSearch = !q
        || a.name.toLowerCase().includes(q)
        || a.category.toLowerCase().includes(q)
        || (a.difficulty || '').toLowerCase().includes(q)
        || tags.some(t => t.toLowerCase().includes(q))
        || (a.analogy || '').toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [allAlgorithms, category, search]);

  const isAdmin = (() => {
    try {
      const u = JSON.parse(localStorage.getItem('devlearn_user') || '{}');
      return u.role === 'ADMIN';
    } catch { return false; }
  })();

  const handleCardClick = (summaryAlgo) => {
    setDetailLoading(true);
    algorithmsApi.getBySlug(summaryAlgo.slug)
      .then(full => { setSelected(full); setDetailLoading(false); })
      .catch(() => { setSelected(summaryAlgo); setDetailLoading(false); });
  };

  if (detailLoading) {
    return (
      <div className={styles.page} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <span style={{ color: 'var(--text2)' }}>Loading…</span>
      </div>
    );
  }

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
            {loading ? 'Loading…' : `${allAlgorithms.length} algorithm${allAlgorithms.length !== 1 ? 's' : ''} · click any to see the full breakdown`}
          </p>
        </div>
        <div style={{ width: 80 }} />
      </div>

      {/* Error */}
      {error && (
        <div className={styles.errorBanner}>⚠️ Failed to load algorithms: {error}</div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className={styles.body}>
          <div className={styles.grid}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={styles.skeletonCard} />
            ))}
          </div>
        </div>
      )}

      {/* Empty — no algorithms in DB */}
      {!loading && !error && allAlgorithms.length === 0 && (
        <div className={styles.body}>
          <EmptySeeded isAdmin={isAdmin} onAdmin={() => navigate('/admin')} />
        </div>
      )}

      {/* Populated */}
      {!loading && !error && allAlgorithms.length > 0 && (
        <>
          {/* Search */}
          <div className={styles.searchBar}>
            <input
              className={`input ${styles.searchInput}`}
              placeholder="🔍 Search algorithms, complexity, technique…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Category filter */}
          <div className={styles.catBar}>
            {presentCategories.map(cat => {
              const meta = CATEGORY_META[cat] || { icon: '📌', label: cat };
              return (
                <button
                  key={cat}
                  className={`${styles.catBtn} ${category === cat ? styles.catActive : ''}`}
                  onClick={() => setCategory(cat)}
                >
                  {meta.icon} {meta.label}
                  {cat !== 'ALL' && catCounts[cat] && (
                    <span className={styles.catCount}>{catCounts[cat]}</span>
                  )}
                </button>
              );
            })}
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
                  {filtered.map(algo => (
                    <AlgorithmCard key={algo.id} algo={algo} onClick={handleCardClick} />
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
