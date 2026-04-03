import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { problemsApi, submissionsApi, QUERY_KEYS } from '../../api';
import { getDiffMeta, getCategoryMeta, CATEGORIES } from '../../utils/helpers';
import styles from './ProblemsPage.module.css';

export default function ProblemsPage() {
  const navigate = useNavigate();
  const [diffFilter,  setDiffFilter]  = useState('');
  const [catFilter,   setCatFilter]   = useState('');
  const [patFilter,   setPatFilter]   = useState('');
  const [search,      setSearch]      = useState('');
  const [sort,        setSort]        = useState('default');

  const { data: problems = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.allProblems({ diffFilter, catFilter }),
    queryFn:  () => problemsApi.getAll({
      difficulty: diffFilter || undefined,
      category:   catFilter  || undefined,
    }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: solvedIds = [] } = useQuery({
    queryKey: QUERY_KEYS.solvedIds,
    queryFn:  submissionsApi.getSolvedIds,
    staleTime: 60 * 1000,
  });

  const solvedSet = useMemo(() => new Set(solvedIds), [solvedIds]);

  const filtered = useMemo(() => {
    let list = [...problems];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.title?.toLowerCase().includes(q));
    }
    if (patFilter) {
      list = list.filter((p) => p.pattern === patFilter);
    }
    if (sort === 'difficulty') {
      const order = { EASY: 0, MEDIUM: 1, HARD: 2 };
      list.sort((a, b) => (order[a.difficulty] ?? 1) - (order[b.difficulty] ?? 1));
    } else if (sort === 'title') {
      list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }
    return list;
  }, [problems, search, patFilter, sort]);

  const patterns = useMemo(() => {
    const s = new Set(problems.map((p) => p.pattern).filter(Boolean));
    return Array.from(s).sort();
  }, [problems]);

  const stats = useMemo(() => ({
    total:  filtered.length,
    easy:   filtered.filter((p) => p.difficulty === 'EASY').length,
    medium: filtered.filter((p) => p.difficulty === 'MEDIUM').length,
    hard:   filtered.filter((p) => p.difficulty === 'HARD').length,
    solved: filtered.filter((p) => solvedSet.has(p.id)).length,
  }), [filtered, solvedSet]);

  function openProblem(p) {
    navigate(`/?topic=${p.topicId}&openProblem=${p.id}`);
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={() => navigate('/')}>← Back</button>
          <div>
            <h1 className={styles.heading}>Problem Set</h1>
            <div className={styles.statsRow}>
              <span className={styles.statPill}>{stats.total} total</span>
              <span className={`${styles.statPill} ${styles.easy}`}>{stats.easy} Easy</span>
              <span className={`${styles.statPill} ${styles.medium}`}>{stats.medium} Medium</span>
              <span className={`${styles.statPill} ${styles.hard}`}>{stats.hard} Hard</span>
              {stats.solved > 0 && <span className={`${styles.statPill} ${styles.solved}`}>✓ {stats.solved} Solved</span>}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {stats.total > 0 && (
          <div className={styles.progressWrap}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${(stats.solved / stats.total) * 100}%` }}
              />
            </div>
            <div className={styles.progressLabel}>
              {Math.round((stats.solved / stats.total) * 100)}% complete
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        {/* Search */}
        <input
          className={`input ${styles.searchInput}`}
          placeholder="🔍 Search problems…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Difficulty */}
        <select className={styles.select} value={diffFilter} onChange={(e) => setDiffFilter(e.target.value)}>
          <option value="">All Difficulty</option>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>

        {/* Category */}
        <select className={styles.select} value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.filter((c) => c.key !== 'ALL').map((c) => (
            <option key={c.key} value={c.key}>{c.label}</option>
          ))}
        </select>

        {/* Pattern */}
        {patterns.length > 0 && (
          <select className={styles.select} value={patFilter} onChange={(e) => setPatFilter(e.target.value)}>
            <option value="">All Patterns</option>
            {patterns.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        )}

        {/* Sort */}
        <select className={styles.select} value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="default">Default Sort</option>
          <option value="difficulty">By Difficulty</option>
          <option value="title">By Title</option>
        </select>

        {(diffFilter || catFilter || patFilter || search) && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { setDiffFilter(''); setCatFilter(''); setPatFilter(''); setSearch(''); }}
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className={styles.tableWrap}>
        {isLoading ? (
          <div className={styles.loading}><span className="spinner" />Loading problems…</div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <span>🔍</span>
            <p>No problems found. Try adjusting filters.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th style={{ width: 28 }}></th>
                <th>Title</th>
                <th style={{ width: 100 }}>Category</th>
                <th style={{ width: 90 }}>Pattern</th>
                <th style={{ width: 80 }}>Difficulty</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const diff    = getDiffMeta(p.difficulty);
                const cat     = p.topicCategory ? getCategoryMeta(p.topicCategory) : null;
                const isSolved = solvedSet.has(p.id);
                return (
                  <tr key={p.id} onClick={() => openProblem(p)} className={styles.row}>
                    <td className={styles.numCell}>{i + 1}</td>
                    <td>
                      <div className={`${styles.checkDot} ${isSolved ? styles.checked : ''}`}>
                        {isSolved && '✓'}
                      </div>
                    </td>
                    <td>
                      <div className={styles.titleCell}>
                        <span className={styles.probTitle}>{p.title}</span>
                        {p.topicTitle && (
                          <span className={styles.topicLabel}>{p.topicTitle}</span>
                        )}
                      </div>
                    </td>
                    <td>{cat && <span className={`badge ${cat.cls}`}>{cat.label}</span>}</td>
                    <td>{p.pattern && <span className={styles.patternChip}>{p.pattern}</span>}</td>
                    <td><span className={`badge ${diff.cls}`}>{diff.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
