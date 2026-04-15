import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dailyApi, problemsApi, QUERY_KEYS } from '../../api';
import toast from 'react-hot-toast';
import styles from './AdminPage.module.css';

function diffColor(d) {
  if (!d) return 'var(--text3)';
  if (d === 'EASY')   return '#4ade80';
  if (d === 'MEDIUM') return '#fbbf24';
  if (d === 'HARD')   return '#f87171';
  return 'var(--text3)';
}

export default function DailyAdminSection() {
  const qc = useQueryClient();
  const [problemId, setProblemId] = useState('');
  const [date, setDate]           = useState('');
  const [search, setSearch]       = useState('');

  const { data: history = [], isLoading: histLoading } = useQuery({
    queryKey: ['adminDailyList'],
    queryFn:  dailyApi.adminList,
    staleTime: 30 * 1000,
  });

  const { data: allProblems = [], isLoading: probsLoading } = useQuery({
    queryKey: QUERY_KEYS.allProblems({}),
    queryFn:  () => problemsApi.getAll({ page: 0, size: 200 }).then((r) => r.content || r),
    staleTime: 5 * 60 * 1000,
  });

  const setMutation = useMutation({
    mutationFn: ({ pid, d }) => dailyApi.adminSetChallenge(pid, d || null),
    onSuccess: (data) => {
      toast.success(`Daily challenge set: ${data.problem?.title || 'done'}`);
      qc.invalidateQueries({ queryKey: ['adminDailyList'] });
      setProblemId('');
      setDate('');
      setSearch('');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to set challenge'),
  });

  const filteredProblems = allProblems
    .filter((p) => {
      if (!search.trim()) return false;
      const q = search.toLowerCase();
      return p.title?.toLowerCase().includes(q) || String(p.id).includes(q);
    })
    .slice(0, 30);

  function handleSubmit(e) {
    e.preventDefault();
    if (!problemId) { toast.error('Select a problem first'); return; }
    setMutation.mutate({ pid: Number(problemId), d: date || null });
  }

  function selectProblem(p) {
    setProblemId(String(p.id));
    setSearch(p.title);
  }

  const selectedProblem = allProblems.find((p) => String(p.id) === problemId);

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>🔥 Daily Challenge Manager</span>
        <span className={styles.sectionSub}>Set today's (or any date's) coding challenge</span>
      </div>

      <div className={styles.twoCol}>

        {/* ── Left: Set challenge form ── */}
        <div className={styles.leftCol}>
          <div className={styles.colHeader}>
            <span className={styles.colTitle}>Set a Challenge</span>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Problem search */}
            <div style={{ position: 'relative' }}>
              <div className={styles.fieldLabel} style={{ marginBottom: 4 }}>Problem</div>
              <input
                className={styles.input}
                placeholder="Search by title or ID…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setProblemId(''); }}
                autoComplete="off"
              />
              {/* Dropdown suggestions */}
              {search && !selectedProblem && (
                <div className={styles.dailySuggestions}>
                  {probsLoading
                    ? <div className={styles.dailySuggestItem} style={{ color: 'var(--text3)' }}>Loading…</div>
                    : filteredProblems.length === 0
                      ? <div className={styles.dailySuggestItem} style={{ color: 'var(--text3)' }}>No matches</div>
                      : filteredProblems.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            className={styles.dailySuggestItem}
                            onClick={() => selectProblem(p)}
                          >
                            <span style={{ flex: 1, textAlign: 'left' }}>{p.title}</span>
                            <span style={{ color: diffColor(p.difficulty), fontSize: 11, fontWeight: 700 }}>
                              {p.difficulty}
                            </span>
                          </button>
                        ))
                  }
                </div>
              )}
            </div>

            {/* Selected problem preview */}
            {selectedProblem && (
              <div className={styles.dailyPreview}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{selectedProblem.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>ID: {selectedProblem.id}</div>
                </div>
                <span style={{ color: diffColor(selectedProblem.difficulty), fontWeight: 700, fontSize: 12 }}>
                  {selectedProblem.difficulty}
                </span>
                <button
                  type="button"
                  className={styles.iconBtn}
                  title="Clear selection"
                  onClick={() => { setProblemId(''); setSearch(''); }}
                >
                  ✕
                </button>
              </div>
            )}

            {/* Optional date */}
            <div>
              <div className={styles.fieldLabel} style={{ marginBottom: 4 }}>
                Date{' '}
                <span style={{ color: 'var(--text3)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                  (leave blank = today)
                </span>
              </div>
              <input
                type="date"
                className={styles.input}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={setMutation.isPending || !problemId}
              style={{ alignSelf: 'flex-start' }}
            >
              {setMutation.isPending ? 'Setting…' : '🔥 Set Challenge'}
            </button>
          </form>
        </div>

        {/* ── Right: Past challenges ── */}
        <div className={styles.rightCol}>
          <div className={styles.colHeader}>
            <span className={styles.colTitle}>Recent Challenges</span>
          </div>

          {histLoading
            ? <p className={styles.emptyNote}>Loading…</p>
            : history.length === 0
              ? <p className={styles.emptyNote}>No challenges set yet</p>
              : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Problem</th>
                        <th>Diff</th>
                        <th>Solves</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((h) => (
                        <tr key={h.id || h.challengeDate}>
                          <td style={{ whiteSpace: 'nowrap', color: 'var(--text2)', fontSize: 12 }}>
                            {h.challengeDate}
                          </td>
                          <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {h.problem?.title || '—'}
                          </td>
                          <td>
                            <span style={{ color: diffColor(h.problem?.difficulty), fontWeight: 700, fontSize: 11 }}>
                              {h.problem?.difficulty || '—'}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text2)', fontSize: 12 }}>{h.solveCount ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
          }
        </div>
      </div>
    </div>
  );
}
