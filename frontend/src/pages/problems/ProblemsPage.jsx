import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { problemsApi, submissionsApi, bookmarksApi, QUERY_KEYS } from '../../api';
import { getDiffMeta } from '../../utils/helpers';
import { SkeletonTableRow } from '../../components/shared/Skeleton';
import styles from './ProblemsPage.module.css';

const PAGE_SIZE = 20;
const PATTERN_COLLAPSE_COUNT = 12;

const CATEGORY_LABELS = {
  JAVA:          'Java',
  ADVANCED_JAVA: 'Advanced Java',
  SPRING_BOOT:   'Spring Boot',
  DSA:           'DSA',
  MYSQL:         'MySQL',
  AWS:           'AWS',
  SYSTEM_DESIGN: 'System Design',
  TESTING:       'Testing',
};

export default function ProblemsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [patternsExpanded, setPatternsExpanded] = useState(false);

  // ── Filter state driven by URL ───────────────────────────────────────────────
  const filters = useMemo(() => ({
    category:   searchParams.get('category')   || '',
    difficulty: searchParams.get('difficulty') || '',
    pattern:    searchParams.get('pattern')    || '',
    search:     searchParams.get('search')     || '',
    page:       parseInt(searchParams.get('page') || '0', 10),
  }), [searchParams]);

  const [searchInput, setSearchInput] = useState(() => searchParams.get('search') || '');

  // ── Filter metadata ──────────────────────────────────────────────────────────
  const { data: meta = { patternCounts: [], categoryCounts: [], patterns: [], categories: [] } } = useQuery({
    queryKey: QUERY_KEYS.problemFilters,
    queryFn:  problemsApi.getFilters,
    staleTime: 60 * 60 * 1000,
  });

  // ── Paginated problem list ───────────────────────────────────────────────────
  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: QUERY_KEYS.allProblems(filters),
    queryFn:  () => problemsApi.getAll({
      category:   filters.category   || undefined,
      difficulty: filters.difficulty || undefined,
      pattern:    filters.pattern    || undefined,
      search:     filters.search     || undefined,
      page:       filters.page,
      size:       PAGE_SIZE,
    }),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  // ── Solved IDs ───────────────────────────────────────────────────────────────
  const { data: solvedIds = [] } = useQuery({
    queryKey: QUERY_KEYS.solvedIds,
    queryFn:  submissionsApi.getSolvedIds,
    staleTime: 60 * 1000,
  });
  const solvedSet = useMemo(() => new Set([
    ...solvedIds,
    ...JSON.parse(localStorage.getItem('devlearn_solved') || '[]'),
  ]), [solvedIds]);

  // ── Bookmarks ────────────────────────────────────────────────────────────────
  const { data: allBookmarks = [] } = useQuery({
    queryKey: QUERY_KEYS.bookmarks,
    queryFn:  bookmarksApi.getAll,
    staleTime: 60 * 1000,
  });
  const bookmarkedSet = useMemo(
    () => new Set(allBookmarks.filter((b) => b.itemType === 'PROBLEM').map((b) => b.itemId)),
    [allBookmarks]
  );

  const { mutate: toggleBookmark } = useMutation({
    mutationFn: ({ id, title }) => bookmarksApi.toggle('PROBLEM', id, title),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bookmarks }),
  });

  // ── Derived ──────────────────────────────────────────────────────────────────
  const problems      = data?.content      ?? [];
  const totalElements = data?.totalElements ?? 0;
  const totalPages    = data?.totalPages    ?? 0;
  const currentPage   = data?.page         ?? 0;

  const solvedCount = useMemo(
    () => problems.filter((p) => solvedSet.has(p.id)).length,
    [problems, solvedSet]
  );

  const visiblePatterns = useMemo(() => {
    const all = meta.patternCounts || [];
    return patternsExpanded ? all : all.slice(0, PATTERN_COLLAPSE_COUNT);
  }, [meta.patternCounts, patternsExpanded]);

  const hasMorePatterns = (meta.patternCounts?.length || 0) > PATTERN_COLLAPSE_COUNT;

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const setFilter = useCallback((key, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value); else next.delete(key);
      next.delete('page');
      return next;
    });
  }, [setSearchParams]);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (searchInput.trim()) next.set('search', searchInput.trim()); else next.delete('search');
      next.delete('page');
      return next;
    });
  }, [searchInput, setSearchParams]);

  const clearAll = useCallback(() => {
    setSearchParams({});
    setSearchInput('');
  }, [setSearchParams]);

  function openProblem(p) {
    navigate(`/?openProblem=${p.id}&from=problems`);
  }

  const hasActiveFilter = !!(filters.category || filters.difficulty || filters.pattern || filters.search);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={() => navigate('/')}>← Home</button>
          <h1 className={styles.heading}>Problems</h1>
          <span className={styles.totalCount}>{totalElements.toLocaleString()}</span>
        </div>
        <div className={styles.headerRight}>
          {problems.length > 0 && (
            <span className={styles.solvedStat}>
              {solvedCount} / {problems.length} solved this page
            </span>
          )}
        </div>
      </div>

      {/* ── Top filter row: search + difficulty + clear ──────────────────────── */}
      <div className={styles.topFilterBar}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              className={styles.searchInput}
              placeholder="Search problems…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button type="button" className={styles.searchClear}
                onClick={() => { setSearchInput(''); setFilter('search', ''); }}>✕</button>
            )}
          </div>
        </form>

        <div className={styles.diffPills}>
          {['', 'EASY', 'MEDIUM', 'HARD'].map((d) => (
            <button
              key={d || 'ALL'}
              className={`${styles.diffPill} ${filters.difficulty === d ? styles.diffPillActive : ''} ${d ? styles[`diff${d}`] : ''}`}
              onClick={() => setFilter('difficulty', d)}
            >
              {d === '' ? 'All' : d[0] + d.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {hasActiveFilter && (
          <button className={styles.clearBtn} onClick={clearAll}>✕ Clear all</button>
        )}
      </div>

      {/* ── Pattern tags row ────────────────────────────────────────────────── */}
      {(meta.patternCounts?.length > 0) && (
        <div className={styles.tagSection}>
          <div className={styles.tagRow}>
            <button
              className={`${styles.tagPill} ${!filters.pattern ? styles.tagPillActive : ''}`}
              onClick={() => setFilter('pattern', '')}
            >
              All Patterns
            </button>
            {visiblePatterns.map((pt) => (
              <button
                key={pt.name}
                className={`${styles.tagPill} ${filters.pattern === pt.name ? styles.tagPillActive : ''}`}
                onClick={() => setFilter('pattern', filters.pattern === pt.name ? '' : pt.name)}
              >
                {pt.name}
                <span className={styles.tagCount}>{pt.count}</span>
              </button>
            ))}
            {hasMorePatterns && (
              <button
                className={styles.expandBtn}
                onClick={() => setPatternsExpanded((v) => !v)}
              >
                {patternsExpanded
                  ? '⌃ Collapse'
                  : `Expand ∨ ${meta.patternCounts.length - PATTERN_COLLAPSE_COUNT} more`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Category / topic pills row ───────────────────────────────────────── */}
      {(meta.categoryCounts?.length > 0) && (
        <div className={styles.categorySection}>
          <div className={styles.categoryRow}>
            <button
              className={`${styles.catPill} ${!filters.category ? styles.catPillActive : ''}`}
              onClick={() => setFilter('category', '')}
            >
              <span className={styles.catIcon}>⊞</span>
              All Topics
            </button>
            {meta.categoryCounts.map((cat) => (
              <button
                key={cat.name}
                className={`${styles.catPill} ${filters.category === cat.name ? styles.catPillActive : ''}`}
                onClick={() => setFilter('category', filters.category === cat.name ? '' : cat.name)}
              >
                <span className={styles.catIcon}>{getCatIcon(cat.name)}</span>
                {CATEGORY_LABELS[cat.name] || cat.name.replace(/_/g, ' ')}
                <span className={styles.catCount}>{cat.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className={`${styles.tableWrap} ${isFetching ? styles.fetching : ''}`}>
        {isLoading ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: 32 }}></th>
                <th style={{ width: 32 }}></th>
                <th style={{ width: 44 }}>#</th>
                <th>Title</th>
                <th style={{ width: 100 }}>Difficulty</th>
                <th style={{ width: 130 }}>Pattern</th>
                <th style={{ width: 160 }}>Topic</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <SkeletonTableRow key={i} columns={[32, 32, 44, '100%', 100, 130, 120]} />
              ))}
            </tbody>
          </table>
        ) : isError ? (
          <div className={styles.empty}>
            <span>⚠</span><p>Failed to load problems. Try again.</p>
          </div>
        ) : problems.length === 0 ? (
          <div className={styles.empty}>
            <span>🔍</span>
            <p>No problems match your filters.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: 32 }}></th>
                <th style={{ width: 32 }}></th>
                <th style={{ width: 44 }}>#</th>
                <th>Title</th>
                <th style={{ width: 100 }}>Difficulty</th>
                <th style={{ width: 130 }}>Pattern</th>
                <th style={{ width: 160 }}>Topic</th>
              </tr>
            </thead>
            <tbody>
              {problems.map((p, i) => {
                const diff         = getDiffMeta(p.difficulty);
                const isSolved     = solvedSet.has(p.id);
                const isBookmarked = bookmarkedSet.has(p.id);
                const rowNum       = currentPage * PAGE_SIZE + i + 1;
                return (
                  <tr
                    key={p.id}
                    onClick={() => openProblem(p)}
                    className={`${styles.row} ${isSolved ? styles.solvedRow : ''}`}
                  >
                    <td>
                      <div className={`${styles.statusDot} ${isSolved ? styles.statusSolved : ''}`}>
                        {isSolved && '✓'}
                      </div>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        className={`${styles.bmBtn} ${isBookmarked ? styles.bmActive : ''}`}
                        onClick={() => toggleBookmark({ id: p.id, title: p.title })}
                        title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                      >
                        {isBookmarked ? '★' : '☆'}
                      </button>
                    </td>
                    <td className={styles.numCell}>{rowNum}</td>
                    <td>
                      <span className={`${styles.probTitle} ${isSolved ? styles.probTitleSolved : ''}`}>
                        {p.title}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.diffLabel} ${styles[`diff${p.difficulty}`]}`}>
                        {p.difficulty ? p.difficulty[0] + p.difficulty.slice(1).toLowerCase() : '—'}
                      </span>
                    </td>
                    <td>
                      {p.pattern && (
                        <button
                          className={`${styles.patternChip} ${filters.pattern === p.pattern ? styles.patternChipActive : ''}`}
                          onClick={(e) => { e.stopPropagation(); setFilter('pattern', filters.pattern === p.pattern ? '' : p.pattern); }}
                          title={`Filter by: ${p.pattern}`}
                        >
                          {p.pattern}
                        </button>
                      )}
                    </td>
                    <td><span className={styles.topicLabel} title={p.topicTitle}>{p.topicTitle}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ──────────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button className={styles.pageBtn} disabled={currentPage === 0}
            onClick={() => setSearchParams((prev) => { const n = new URLSearchParams(prev); n.set('page', String(currentPage - 1)); return n; })}>
            ◀ Prev
          </button>

          {buildPageRange(currentPage, totalPages).map((p, i) =>
            p === '…' ? (
              <span key={`e${i}`} className={styles.ellipsis}>…</span>
            ) : (
              <button key={p}
                className={`${styles.pageBtn} ${p === currentPage ? styles.pageBtnActive : ''}`}
                onClick={() => setSearchParams((prev) => { const n = new URLSearchParams(prev); n.set('page', String(p)); return n; })}>
                {p + 1}
              </button>
            )
          )}

          <button className={styles.pageBtn} disabled={currentPage >= totalPages - 1}
            onClick={() => setSearchParams((prev) => { const n = new URLSearchParams(prev); n.set('page', String(currentPage + 1)); return n; })}>
            Next ▶
          </button>

          <span className={styles.pageInfo}>
            Page {currentPage + 1} of {totalPages} · {totalElements.toLocaleString()} problems
          </span>
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCatIcon(cat) {
  const icons = {
    JAVA: '☕', ADVANCED_JAVA: '⚡', SPRING_BOOT: '🌱',
    DSA: '🌳', MYSQL: '🗄', AWS: '☁', SYSTEM_DESIGN: '🏗', TESTING: '🧪',
  };
  return icons[cat] || '📁';
}

function buildPageRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  const pages = new Set([0, total - 1, current]);
  for (let d = -2; d <= 2; d++) {
    const p = current + d;
    if (p >= 0 && p < total) pages.add(p);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const result = [];
  let prev = -1;
  for (const p of sorted) {
    if (p - prev > 1) result.push('…');
    result.push(p);
    prev = p;
  }
  return result;
}
