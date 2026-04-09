import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { problemsApi, submissionsApi, bookmarksApi, QUERY_KEYS } from '../../api';
import { getDiffMeta, getCategoryMeta } from '../../utils/helpers';
import styles from './ProblemsPage.module.css';

const PAGE_SIZE = 20;

export default function ProblemsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Filter state driven by URL ───────────────────────────────────────────────
  const filters = useMemo(() => ({
    category:   searchParams.get('category')   || '',
    difficulty: searchParams.get('difficulty') || '',
    pattern:    searchParams.get('pattern')    || '',
    search:     searchParams.get('search')     || '',
    page:       parseInt(searchParams.get('page') || '0', 10),
  }), [searchParams]);

  const [searchInput, setSearchInput] = useState(() => searchParams.get('search') || '');

  // ── Filter metadata ─────────────────────────────────────────────────────────
  const { data: meta = { categories: [], patterns: [] } } = useQuery({
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
    placeholderData: (prev) => prev, // keeps last page visible while fetching next
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

  // ── Derived ─────────────────────────────────────────────────────────────────
  const problems      = data?.content      ?? [];
  const totalElements = data?.totalElements ?? 0;
  const totalPages    = data?.totalPages    ?? 0;
  const currentPage   = data?.page         ?? 0;

  const hasActiveFilter = !!(filters.category || filters.difficulty
    || filters.pattern || filters.search);

  // For the progress bar — only when we know the full count
  const solvedCount = useMemo(
    () => problems.filter((p) => solvedSet.has(p.id)).length,
    [problems, solvedSet]
  );

  // ── Handlers ────────────────────────────────────────────────────────────────
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

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={() => navigate('/')}>← Back</button>
          <div>
            <h1 className={styles.heading}>Problem Set</h1>
            <div className={styles.statsRow}>
              <span className={styles.statPill}>{totalElements.toLocaleString()} total</span>
              <span className={`${styles.statPill} ${styles.easy}`}>Easy</span>
              <span className={`${styles.statPill} ${styles.medium}`}>Medium</span>
              <span className={`${styles.statPill} ${styles.hard}`}>Hard</span>
            </div>
          </div>
        </div>

        {/* Progress bar (page scope) */}
        {problems.length > 0 && (
          <div className={styles.progressWrap}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${(solvedCount / problems.length) * 100}%` }}
              />
            </div>
            <div className={styles.progressLabel}>
              {solvedCount} / {problems.length} solved this page
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input
            className={`input ${styles.searchInput}`}
            placeholder="🔍 Search problems…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="btn btn-primary btn-sm">Search</button>
        </form>

        <select className={styles.select} value={filters.difficulty}
          onChange={(e) => setFilter('difficulty', e.target.value)}>
          <option value="">All Difficulty</option>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>

        <select className={styles.select} value={filters.category}
          onChange={(e) => setFilter('category', e.target.value)}>
          <option value="">All Categories</option>
          {meta.categories.map((c) => (
            <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
          ))}
        </select>

        {meta.patterns.length > 0 && (
          <select className={styles.select} value={filters.pattern}
            onChange={(e) => setFilter('pattern', e.target.value)}>
            <option value="">All Patterns</option>
            {meta.patterns.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        )}

        {hasActiveFilter && (
          <button className="btn btn-ghost btn-sm" onClick={clearAll}>✕ Clear</button>
        )}
      </div>

      {/* Active filter chips */}
      {hasActiveFilter && (
        <div className={styles.chips}>
          {filters.search     && <Chip label={`"${filters.search}"`} onRemove={() => { setFilter('search', ''); setSearchInput(''); }} />}
          {filters.category   && <Chip label={filters.category.replace(/_/g,' ')}  onRemove={() => setFilter('category','')}   />}
          {filters.difficulty && <Chip label={filters.difficulty}                   onRemove={() => setFilter('difficulty','')} />}
          {filters.pattern    && <Chip label={filters.pattern}                      onRemove={() => setFilter('pattern','')}    />}
        </div>
      )}

      {/* Table */}
      <div className={`${styles.tableWrap} ${isFetching ? styles.fetching : ''}`}>
        {isLoading ? (
          <div className={styles.loading}><span className="spinner" />Loading problems…</div>
        ) : isError ? (
          <div className={styles.empty} style={{ color: 'var(--red,#e74c3c)' }}>
            <span>⚠</span><p>Failed to load problems. Try again.</p>
          </div>
        ) : problems.length === 0 ? (
          <div className={styles.empty}>
            <span>🔍</span>
            <p>No problems match your filters. Try adjusting them.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: 28 }}></th>
                <th style={{ width: 28 }}></th>
                <th style={{ width: 40 }}>#</th>
                <th>Title</th>
                <th style={{ width: 100 }}>Difficulty</th>
                <th style={{ width: 130 }}>Pattern</th>
                <th style={{ width: 130 }}>Topic</th>
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
                      <div className={`${styles.checkDot} ${isSolved ? styles.checked : ''}`}>
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
                      <span className={styles.probTitle}>{p.title}</span>
                    </td>
                    <td><span className={`badge ${diff.cls}`}>{diff.label}</span></td>
                    <td>{p.pattern && <span className={styles.patternChip}>{p.pattern}</span>}</td>
                    <td><span className={styles.topicLabel}>{p.topicTitle}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button className="btn btn-ghost btn-sm" disabled={currentPage === 0}
            onClick={() => setSearchParams((prev) => { const n = new URLSearchParams(prev); n.set('page', String(currentPage - 1)); return n; })}>
            ◀ Prev
          </button>

          {buildPageRange(currentPage, totalPages).map((p, i) =>
            p === '…' ? (
              <span key={`e${i}`} className={styles.ellipsis}>…</span>
            ) : (
              <button key={p}
                className={`btn btn-sm ${p === currentPage ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setSearchParams((prev) => { const n = new URLSearchParams(prev); n.set('page', String(p)); return n; })}>
                {p + 1}
              </button>
            )
          )}

          <button className="btn btn-ghost btn-sm" disabled={currentPage >= totalPages - 1}
            onClick={() => setSearchParams((prev) => { const n = new URLSearchParams(prev); n.set('page', String(currentPage + 1)); return n; })}>
            Next ▶
          </button>

          <span className={styles.pageInfo}>
            Page {currentPage + 1} of {totalPages}
            {' · '}{totalElements.toLocaleString()} problems
          </span>
        </div>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function Chip({ label, onRemove }) {
  return (
    <span className={styles.chip}>
      {label}
      <button className={styles.chipX} onClick={onRemove}>×</button>
    </span>
  );
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
