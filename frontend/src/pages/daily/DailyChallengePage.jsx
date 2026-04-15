import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { dailyApi, codeApi, QUERY_KEYS } from '../../api';
import { getDiffMeta } from '../../utils/helpers';
import toast from 'react-hot-toast';
import styles from './DailyChallengePage.module.css';

function formatMs(ms) {
  if (!ms || ms <= 0) return '—';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

export default function DailyChallengePage() {
  const navigate   = useNavigate();
  const qc         = useQueryClient();
  const startRef   = useRef(null); // when the user first saw the challenge
  const [tab, setTab] = useState('problem'); // problem | leaderboard | history

  const { data: challenge, isLoading: loadingChallenge } = useQuery({
    queryKey: QUERY_KEYS.dailyChallenge,
    queryFn:  dailyApi.getToday,
    staleTime: 5 * 60 * 1000,
    onSuccess: () => { if (!startRef.current) startRef.current = Date.now(); },
  });

  const { data: status, isLoading: loadingStatus } = useQuery({
    queryKey: QUERY_KEYS.dailyStatus,
    queryFn:  dailyApi.getMyStatus,
    staleTime: 60 * 1000,
  });

  const { data: leaderboard = [], isLoading: loadingBoard } = useQuery({
    queryKey: QUERY_KEYS.dailyLeaderboard,
    queryFn:  dailyApi.getLeaderboard,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000, // live updates every 30s
  });

  const { data: history = [] } = useQuery({
    queryKey: QUERY_KEYS.dailyHistory,
    queryFn:  dailyApi.getHistory,
    staleTime: 10 * 60 * 1000,
  });

  // Track solve time — set start when the page loads
  useEffect(() => {
    if (challenge?.available && !startRef.current) {
      startRef.current = Date.now();
    }
  }, [challenge]);

  const diff = challenge ? getDiffMeta(challenge.difficulty) : null;

  if (loadingChallenge) return <div className={styles.loadingPage}><span className="spinner" /> Loading today's challenge…</div>;

  if (!challenge?.available) return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>← Home</button>
        <span className={styles.pageTitle}>🔥 Daily Challenge</span>
      </div>
      <div className={styles.noChallenge}>
        <div className={styles.noChallengeIcon}>📅</div>
        <h2>No challenge today yet</h2>
        <p>Check back later — the admin sets today's challenge fresh each day.</p>
        {history.length > 0 && (
          <button className={styles.historyBtn} onClick={() => setTab('history')}>View Past Challenges →</button>
        )}
      </div>
    </div>
  );

  return (
    <div className={styles.page}>

      {/* ── Toolbar ── */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <button className={styles.backBtn} onClick={() => navigate('/')}>← Home</button>
          <div className={styles.titleWrap}>
            <span className={styles.flame}>🔥</span>
            <span className={styles.pageTitle}>Daily Challenge</span>
            <span className={styles.dateLabel}>{formatDate(challenge.date)}</span>
          </div>
        </div>
        <div className={styles.toolbarRight}>
          <span className={styles.solveCount}>
            👥 {challenge.solveCount} solved today
          </span>
          {status?.solved && (
            <span className={styles.solvedBadge}>✓ You solved it!</span>
          )}
          <button
            className={styles.openBtn}
            onClick={() => navigate(`/?openProblem=${challenge.problemId}&from=daily`)}
          >
            Open in Editor →
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className={styles.tabs}>
        {[
          { key: 'problem',     label: '📋 Problem' },
          { key: 'leaderboard', label: `🏆 Leaderboard (${leaderboard.length})` },
          { key: 'history',     label: '📅 History' },
        ].map(t => (
          <button key={t.key}
            className={`${styles.tab} ${tab === t.key ? styles.tabActive : ''}`}
            onClick={() => setTab(t.key)}
          >{t.label}</button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className={styles.content}>

        {/* PROBLEM TAB */}
        {tab === 'problem' && (
          <div className={styles.problemView}>
            <div className={styles.problemHeader}>
              <h1 className={styles.problemTitle}>{challenge.title}</h1>
              <div className={styles.problemMeta}>
                {diff && <span className={styles.diffBadge} style={{ color: diff.color, borderColor: diff.color + '44', background: diff.color + '15' }}>{diff.label}</span>}
                {challenge.pattern && <span className={styles.patternBadge}>{challenge.pattern}</span>}
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionTitle}>Problem</div>
              <div className={styles.description}>{challenge.description}</div>
            </div>

            {challenge.inputFormat && (
              <div className={styles.section}>
                <div className={styles.sectionTitle}>Input Format</div>
                <div className={styles.description}>{challenge.inputFormat}</div>
              </div>
            )}
            {challenge.outputFormat && (
              <div className={styles.section}>
                <div className={styles.sectionTitle}>Output Format</div>
                <div className={styles.description}>{challenge.outputFormat}</div>
              </div>
            )}
            {challenge.constraints && (
              <div className={styles.section}>
                <div className={styles.sectionTitle}>Constraints</div>
                <pre className={styles.pre}>{challenge.constraints}</pre>
              </div>
            )}

            {(challenge.sampleInput || challenge.sampleOutput) && (
              <div className={styles.ioGrid}>
                {challenge.sampleInput && (
                  <div className={styles.ioBox}>
                    <div className={styles.ioLabel}>Sample Input</div>
                    <pre className={styles.ioCode}>{challenge.sampleInput}</pre>
                  </div>
                )}
                {challenge.sampleOutput && (
                  <div className={styles.ioBox}>
                    <div className={styles.ioLabel}>Sample Output</div>
                    <pre className={styles.ioCode}>{challenge.sampleOutput}</pre>
                  </div>
                )}
              </div>
            )}

            {status?.solved && (
              <div className={styles.solvedSummary}>
                <div className={styles.solvedSummaryIcon}>🎉</div>
                <div>
                  <div className={styles.solvedSummaryTitle}>You solved it in {formatMs(status.timeMs)}</div>
                  <div className={styles.solvedSummaryDesc}>{status.attempts} attempt{status.attempts !== 1 ? 's' : ''} · Total participations: {status.totalParticipations}</div>
                </div>
              </div>
            )}

            <button
              className={styles.solveBtn}
              onClick={() => navigate(`/?openProblem=${challenge.problemId}&from=daily`)}
            >
              {status?.solved ? '✓ View Solution & Editorial →' : '⚡ Solve Now →'}
            </button>
          </div>
        )}

        {/* LEADERBOARD TAB */}
        {tab === 'leaderboard' && (
          <div className={styles.leaderboardView}>
            <div className={styles.leaderboardHeader}>
              <span className={styles.leaderboardTitle}>Today's Leaderboard</span>
              <span className={styles.leaderboardSub}>Fastest accepted solutions · updates every 30s</span>
            </div>

            {loadingBoard ? (
              <div className={styles.loading}><span className="spinner" /> Loading…</div>
            ) : leaderboard.length === 0 ? (
              <div className={styles.emptyBoard}>
                <span>🏁</span>
                <p>No solves yet — be the first!</p>
                <button className={styles.openBtn} onClick={() => navigate(`/?openProblem=${challenge.problemId}&from=daily`)}>
                  Solve Now →
                </button>
              </div>
            ) : (
              <div className={styles.boardTable}>
                <div className={styles.boardRow + ' ' + styles.boardHead}>
                  <span className={styles.rankCol}>#</span>
                  <span className={styles.nameCol}>Solver</span>
                  <span className={styles.timeCol}>Time</span>
                  <span className={styles.attemptsCol}>Attempts</span>
                  <span className={styles.whenCol}>Solved At</span>
                </div>
                {leaderboard.map((row) => {
                  const isTop = row.rank <= 3;
                  const medal = row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : null;
                  return (
                    <div
                      key={row.rank}
                      className={`${styles.boardRow} ${isTop ? styles.boardRowTop : ''}`}
                    >
                      <span className={styles.rankCol}>
                        {medal || <span className={styles.rankNum}>{row.rank}</span>}
                      </span>
                      <span className={styles.nameCol}>
                        <span className={styles.username}>{row.username}</span>
                      </span>
                      <span className={styles.timeCol}>
                        <span className={styles.timeVal}>{formatMs(row.timeMs)}</span>
                      </span>
                      <span className={styles.attemptsCol}>{row.attempts}</span>
                      <span className={styles.whenCol}>
                        {row.solvedAt ? new Date(row.solvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {tab === 'history' && (
          <div className={styles.historyView}>
            <div className={styles.historyTitle}>Past 7 Challenges</div>
            {history.length === 0 ? (
              <p className={styles.emptyHistory}>No past challenges yet.</p>
            ) : history.map((h) => {
              const d = getDiffMeta(h.difficulty);
              return (
                <div key={h.date} className={styles.historyRow}
                  onClick={() => navigate(`/?openProblem=${h.problemId}`)}>
                  <div className={styles.historyDate}>{formatDate(h.date)}</div>
                  <div className={styles.historyInfo}>
                    <span className={styles.historyTitle2}>{h.title}</span>
                    <span className={styles.historyMeta}>
                      {d && <span style={{ color: d.color }}>{d.label}</span>}
                      {h.pattern && <span className={styles.historyPattern}>{h.pattern}</span>}
                    </span>
                  </div>
                  <div className={styles.historySolves}>{h.solves} solved</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
