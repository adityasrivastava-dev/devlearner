import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { streakApi, submissionsApi, analyticsApi, QUERY_KEYS } from '../../api';
import styles from './ProfilePage.module.css';

// ── Heatmap ───────────────────────────────────────────────────────────────────
function Heatmap({ data }) {
  const today = new Date();
  const weeks = [];
  const start = new Date(today);
  start.setDate(start.getDate() - 363);
  start.setDate(start.getDate() - start.getDay());
  let cursor = new Date(start);

  while (cursor <= today) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const key = cursor.toISOString().slice(0, 10);
      week.push({
        date:   key,
        count:  data?.[key] || 0,
        future: cursor > today,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  const months = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const m = new Date(week[0].date + 'T00:00:00').getMonth();
    if (m !== lastMonth) {
      months.push({
        wi,
        label: new Date(week[0].date + 'T00:00:00')
          .toLocaleString('en', { month: 'short' }),
      });
      lastMonth = m;
    }
  });

  function intensity(count) {
    if (!count)     return 0;
    if (count === 1) return 1;
    if (count <= 3)  return 2;
    if (count <= 6)  return 3;
    return 4;
  }

  return (
    <div className={styles.heatmapWrap}>
      <div className={styles.heatmapMonths}>
        {months.map(({ wi, label }) => (
          <span key={wi} style={{ gridColumn: wi + 1 }}>{label}</span>
        ))}
      </div>
      <div className={styles.heatmapGrid}>
        {weeks.map((week, wi) => (
          <div key={wi} className={styles.heatmapWeek}>
            {week.map((cell) => (
              <div
                key={cell.date}
                className={styles.heatmapCell}
                data-intensity={cell.future ? 'future' : intensity(cell.count)}
                title={
                  cell.future
                    ? ''
                    : `${cell.date}: ${cell.count} submission${cell.count !== 1 ? 's' : ''}`
                }
              />
            ))}
          </div>
        ))}
      </div>
      <div className={styles.heatmapLegend}>
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={styles.heatmapCell} data-intensity={i} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

// ── Confidence bar ────────────────────────────────────────────────────────────
function ConfidenceBar({ topic }) {
  const score = topic.confidenceScore ?? 0;
  const color = score >= 75
    ? 'var(--success)'
    : score >= 40
      ? 'var(--yellow)'
      : 'var(--red)';

  return (
    <div className={styles.skillRow}>
      <div className={styles.skillLeft}>
        <div className={styles.skillName}>{topic.topicTitle}</div>
        <div className={styles.skillMeta}>
          {topic.attempts} attempt{topic.attempts !== 1 ? 's' : ''}
          {' · '}
          {topic.accepted} solved
        </div>
      </div>
      <div className={styles.skillRight}>
        <div className={styles.barWrap}>
          <div
            className={styles.barFill}
            style={{ width: `${score}%`, background: color }}
          />
        </div>
        <span className={styles.scoreLabel} style={{ color }}>{score}%</span>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(isoStr) {
  if (!isoStr) return '';
  const diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function levelEmoji(level) {
  const map = {
    Beginner:     '🌱',
    Learner:      '📗',
    Practitioner: '⚡',
    Engineer:     '🔧',
    Senior:       '🏆',
    Architect:    '🚀',
  };
  return map[level] || '🌱';
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const initial  = (user?.name || user?.email || 'U')[0].toUpperCase();

  const { data: streak } = useQuery({
    queryKey: QUERY_KEYS.streak,
    queryFn:  streakApi.getStatus,
    staleTime: 60_000,
  });

  const { data: heatmap = {} } = useQuery({
    queryKey: QUERY_KEYS.heatmap,
    queryFn:  submissionsApi.getHeatmap,
    staleTime: 10 * 60_000,
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn:  analyticsApi.getDashboard,
    staleTime: 5 * 60_000,
  });

  const { data: mistakes = [], isLoading: mistakesLoading } = useQuery({
    queryKey: ['analytics-mistakes'],
    queryFn:  analyticsApi.getMistakes,
    staleTime: 5 * 60_000,
  });

  // Merge strong + weak areas, deduplicate by topicId, sort by confidence desc
  const allTopics = [
    ...(analytics?.strongAreas ?? []),
    ...(analytics?.weakAreas   ?? []),
  ]
    .filter((t, i, arr) => arr.findIndex((x) => x.topicId === t.topicId) === i)
    .sort((a, b) => (b.confidenceScore ?? 0) - (a.confidenceScore ?? 0));

  const xp          = streak?.xp          ?? 0;
  const nextLevelXp = streak?.nextLevelXp ?? 0;
  const xpPct       = nextLevelXp > 0
    ? Math.min(100, Math.round((xp / nextLevelXp) * 100))
    : 100;
  const xpRemain    = nextLevelXp > 0
    ? `${nextLevelXp - xp} XP to next level`
    : 'Max level reached!';

  return (
    <div className={styles.page}>
      <div className={styles.inner}>

        {/* ── Back ─────────────────────────────────────────────────── */}
        <button className="btn-back" onClick={() => navigate(-1)}>← Back</button>

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <div className={styles.hero}>
          <div className={styles.heroLeft}>
            {user?.avatar ? (
              <img src={user.avatar} alt="" className={styles.avatar}
                onError={(e) => { e.target.style.display = 'none'; }} />
            ) : (
              <div className={styles.avatarInitial}>{initial}</div>
            )}
            <div>
              <h1 className={styles.heroName}>{user?.name || 'Developer'}</h1>
              <div className={styles.heroEmail}>{user?.email}</div>
              <div className={styles.heroBadges}>
                <span className="badge badge-accent">
                  {streak?.level ?? 'Beginner'} {levelEmoji(streak?.level)}
                </span>
                {(streak?.streakDays ?? 0) > 0 && (
                  <span className="badge badge-success">
                    🔥 {streak.streakDays} day streak
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatNum}>{user?.solved ?? 0}</span>
              <span className={styles.heroStatLbl}>Solved</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatNum}>{streak?.streakDays ?? 0}</span>
              <span className={styles.heroStatLbl}>Streak</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatNum}>{xp.toLocaleString()}</span>
              <span className={styles.heroStatLbl}>XP</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatNum}>{analytics?.totalTopicsTried ?? 0}</span>
              <span className={styles.heroStatLbl}>Topics</span>
            </div>
          </div>

          {/* XP progress bar */}
          <div className={styles.xpSection}>
            <div className={styles.xpLabels}>
              <span>{streak?.level ?? 'Beginner'}</span>
              <span className={styles.xpRemain}>{xpRemain}</span>
            </div>
            <div className={styles.xpBarWrap}>
              <div className={styles.xpBar} style={{ width: `${xpPct}%` }} />
            </div>
          </div>
        </div>

        {/* ── Skill Confidence ─────────────────────────────────────── */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Skill Confidence</h2>
            <span className={styles.sectionSub}>Based on your submission history</span>
          </div>

          {analyticsLoading ? (
            <div className={styles.loading}>
              <div className="spinner" /> Loading skills…
            </div>
          ) : allTopics.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📊</div>
              <div className={styles.emptyTitle}>No skill data yet</div>
              <div className={styles.emptySub}>
                Solve a few problems to see your confidence scores here.
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate('/')}
              >
                Start Learning →
              </button>
            </div>
          ) : (
            <div className={styles.skillList}>
              {allTopics.map((t) => (
                <ConfidenceBar key={t.topicId} topic={t} />
              ))}
            </div>
          )}
        </div>

        {/* ── Mistake Journal ──────────────────────────────────────── */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Mistake Journal</h2>
            <span className={styles.sectionSub}>
              Last {Math.min(mistakes.length, 10)} wrong submissions
            </span>
          </div>

          {mistakesLoading ? (
            <div className={styles.loading}>
              <div className="spinner" /> Loading mistakes…
            </div>
          ) : mistakes.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🎯</div>
              <div className={styles.emptyTitle}>No mistakes recorded</div>
              <div className={styles.emptySub}>
                Keep submitting — wrong answers help us detect your weak spots.
              </div>
            </div>
          ) : (
            <div className={styles.mistakeList}>
              {mistakes.slice(0, 10).map((m) => (
                <div key={m.id} className={styles.mistakeRow}>
                  <div className={styles.mistakeLeft}>
                    <div className={styles.mistakeProblem}>
                      {m.problemTitle || 'Problem'}
                    </div>
                    {m.topicTitle && (
                      <div className={styles.mistakeTopic}>{m.topicTitle}</div>
                    )}
                  </div>
                  <div className={styles.mistakeRight}>
                    {m.errorType && (
                      <span className={styles.errorTag}>
                        {m.errorType.replace(/_/g, ' ')}
                      </span>
                    )}
                    {m.detectedPattern
                      && m.correctPattern
                      && m.detectedPattern !== m.correctPattern && (
                      <span className={styles.patternMismatch}>
                        used {m.detectedPattern} · expected {m.correctPattern}
                      </span>
                    )}
                    <span className={styles.mistakeTime}>
                      {timeAgo(m.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Activity Heatmap ─────────────────────────────────────── */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Activity</h2>
            <span className={styles.sectionSub}>Last 12 months of submissions</span>
          </div>
          <Heatmap data={heatmap} />
        </div>

      </div>
    </div>
  );
}