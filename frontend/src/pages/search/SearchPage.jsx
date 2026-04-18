import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { searchApi, QUERY_KEYS } from '../../api';
import EmptyState from '../../components/shared/EmptyState';
import styles from './SearchPage.module.css';

const DIFFICULTY_COLOR = {
  EASY:         '#4ade80',
  MEDIUM:       '#fbbf24',
  HARD:         '#f87171',
  BEGINNER:     '#4ade80',
  INTERMEDIATE: '#fbbf24',
  ADVANCED:     '#f87171',
};

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get('q') || '';
  const [input, setInput] = useState(initialQ);
  const [query, setQuery] = useState(initialQ);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const q = searchParams.get('q') || '';
    setInput(q);
    setQuery(q);
  }, [searchParams]);

  const { data, isFetching } = useQuery({
    queryKey: QUERY_KEYS.search(query),
    queryFn:  () => searchApi.search(query),
    enabled:  query.length >= 2,
    staleTime: 30 * 1000,
  });

  function submit(e) {
    e.preventDefault();
    const q = input.trim();
    if (q.length < 2) return;
    setSearchParams({ q });
  }

  function goTopic(id) { navigate(`/?topic=${id}`); }
  function goProblem(topicId, problemId) { navigate(`/?topic=${topicId}&problem=${problemId}`); }
  function goAlgorithm(slug) { navigate(`/algorithms?slug=${slug}`); }

  const topics     = data?.topics     || [];
  const problems   = data?.problems   || [];
  const algorithms = data?.algorithms || [];
  const total      = data?.total      ?? 0;
  const hasResults = total > 0;
  const searched   = query.length >= 2;

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
        <h1 className={styles.title}>Global Search</h1>
        <p className={styles.subtitle}>Search topics, problems, and algorithms</p>

        <form className={styles.searchForm} onSubmit={submit}>
          <div className={styles.inputWrap}>
            <span className={styles.searchIcon}>⌕</span>
            <input
              ref={inputRef}
              className={styles.searchInput}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. HashMap, binary search, Spring Boot..."
              autoComplete="off"
              spellCheck={false}
            />
            {input && (
              <button type="button" className={styles.clearBtn} onClick={() => { setInput(''); setSearchParams({}); }}>
                ✕
              </button>
            )}
          </div>
          <button type="submit" className={styles.searchBtn} disabled={input.trim().length < 2}>
            Search
          </button>
        </form>

        {searched && !isFetching && (
          <p className={styles.resultMeta}>
            {hasResults ? `${total} result${total !== 1 ? 's' : ''} for "${query}"` : `No results for "${query}"`}
          </p>
        )}
      </div>

      <div className={styles.scrollBody}>

      {isFetching && (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Searching…</span>
        </div>
      )}

      {!isFetching && searched && (
        <div className={styles.results}>

          {topics.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>📚</span>
                Topics
                <span className={styles.sectionCount}>{topics.length}</span>
              </h2>
              <div className={styles.cards}>
                {topics.map((t) => (
                  <button key={t.id} className={styles.card} onClick={() => goTopic(t.id)}>
                    <div className={styles.cardTop}>
                      <span className={styles.cardTitle}>{t.title}</span>
                      <span className={styles.catBadge}>{t.category}</span>
                    </div>
                    {t.subCategory && <span className={styles.subCat}>{t.subCategory}</span>}
                    {t.description && <p className={styles.cardDesc}>{t.description}</p>}
                  </button>
                ))}
              </div>
            </section>
          )}

          {problems.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>≡</span>
                Problems
                <span className={styles.sectionCount}>{problems.length}</span>
              </h2>
              <div className={styles.cards}>
                {problems.map((p) => (
                  <button key={p.id} className={styles.card} onClick={() => goProblem(p.topicId, p.id)}>
                    <div className={styles.cardTop}>
                      <span className={styles.cardTitle}>{p.title}</span>
                      <span
                        className={styles.diffBadge}
                        style={{ color: DIFFICULTY_COLOR[p.difficulty] }}
                      >
                        {p.difficulty}
                      </span>
                    </div>
                    <div className={styles.cardMeta}>
                      {p.pattern && <span className={styles.patternTag}>{p.pattern}</span>}
                      {p.topicTitle && <span className={styles.topicRef}>in {p.topicTitle}</span>}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {algorithms.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>∑</span>
                Algorithms
                <span className={styles.sectionCount}>{algorithms.length}</span>
              </h2>
              <div className={styles.cards}>
                {algorithms.map((a) => (
                  <button key={a.id} className={styles.card} onClick={() => goAlgorithm(a.slug)}>
                    <div className={styles.cardTop}>
                      <span className={styles.cardTitle}>{a.name}</span>
                      <span
                        className={styles.diffBadge}
                        style={{ color: DIFFICULTY_COLOR[a.difficulty] }}
                      >
                        {a.difficulty}
                      </span>
                    </div>
                    <div className={styles.cardMeta}>
                      <span className={styles.catBadge}>{a.category}</span>
                    </div>
                    {a.description && <p className={styles.cardDesc}>{a.description}</p>}
                  </button>
                ))}
              </div>
            </section>
          )}

          {!hasResults && (
            <EmptyState
              icon="⌕"
              title={`No results for "${query}"`}
              hint="Try a different keyword or broaden your search."
              tips={[
                'Check spelling or try a broader term',
                'Try pattern names like HashMap, BFS, Two Pointers',
                'Try topic names like Spring Boot, Arrays',
              ]}
            />
          )}
        </div>
      )}

      {!searched && (
        <div className={styles.suggestions}>
          <p className={styles.suggestLabel}>Popular searches</p>
          <div className={styles.suggestPills}>
            {['HashMap', 'Binary Search', 'Two Pointers', 'Spring Boot', 'BFS', 'Dynamic Programming', 'MySQL', 'Arrays'].map((s) => (
              <button
                key={s}
                className={styles.suggestPill}
                onClick={() => { setInput(s); setSearchParams({ q: s }); }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
