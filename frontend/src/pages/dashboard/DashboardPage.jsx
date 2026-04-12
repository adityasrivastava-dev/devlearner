import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { streakApi, srsApi, submissionsApi, QUERY_KEYS } from '../../api';
import styles from './DashboardPage.module.css';

// ── helpers ──────────────────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short',
  });
}

function daysAgo(isoDate) {
  if (!isoDate) return null;
  const diff = Math.round(
    (Date.now() - new Date(isoDate + 'T00:00:00').getTime()) / 86400000
  );
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return `${diff} days ago`;
}

function xpBar(xp, nextLevelXp) {
  if (!nextLevelXp || nextLevelXp <= 0) return 100;
  return Math.min(100, Math.round((xp / nextLevelXp) * 100));
}

// ── Heatmap ──────────────────────────────────────────────────────────────────
function Heatmap({ data }) {
  // data = { "2025-04-01": 3, "2025-04-02": 1, ... }
  const today = new Date();
  // build last 52 weeks × 7 days
  const weeks = [];
  const start = new Date(today);
  start.setDate(start.getDate() - 363); // ~52 weeks back
  // align to Sunday
  start.setDate(start.getDate() - start.getDay());

  let cursor = new Date(start);
  while (cursor <= today) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const key = cursor.toISOString().slice(0, 10);
      week.push({ date: key, count: data?.[key] || 0, future: cursor > today });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  function intensity(count) {
    if (count === 0) return 0;
    if (count === 1) return 1;
    if (count <= 3) return 2;
    if (count <= 6) return 3;
    return 4;
  }

  const months = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const m = new Date(week[0].date + 'T00:00:00').getMonth();
    if (m !== lastMonth) {
      months.push({ wi, label: new Date(week[0].date + 'T00:00:00').toLocaleString('en', { month: 'short' }) });
      lastMonth = m;
    }
  });

  return (
    <div className={styles.heatmapWrap}>
      {/* Month labels */}
      <div className={styles.heatmapMonths}>
        {months.map(({ wi, label }) => (
          <span key={wi} style={{ gridColumn: wi + 1 }}>{label}</span>
        ))}
      </div>
      {/* Grid */}
      <div className={styles.heatmapGrid}>
        {weeks.map((week, wi) => (
          <div key={wi} className={styles.heatmapWeek}>
            {week.map((cell) => (
              <div
                key={cell.date}
                className={styles.heatmapCell}
                data-intensity={cell.future ? 'future' : intensity(cell.count)}
                title={cell.future ? '' : `${cell.date}: ${cell.count} submission${cell.count !== 1 ? 's' : ''}`}
              />
            ))}
          </div>
        ))}
      </div>
      {/* Legend */}
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

// ── SRS Item ──────────────────────────────────────────────────────────────────
function SrsItem({ item, onNavigate }) {
  const isTopic = item.itemType === 'TOPIC';
  return (
    <button className={styles.srsItem} onClick={() => onNavigate(item)}>
      <div className={styles.srsItemLeft}>
        <span className={styles.srsItemIcon}>{isTopic ? '📖' : '🎯'}</span>
        <div>
          <div className={styles.srsItemTitle}>{item.itemTitle}</div>
          <div className={styles.srsItemMeta}>
            {isTopic ? 'Topic' : 'Problem'} · interval {item.intervalDays}d · rep {item.repetitions}×
          </div>
        </div>
      </div>
      <div className={styles.srsItemRight}>
        <span className={styles.srsItemDue}>Review now</span>
        <span className={styles.srsItemArrow}>→</span>
      </div>
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showPauseConfirm,    setShowPauseConfirm]    = useState(false);
  const [showRecoveryConfirm, setShowRecoveryConfirm] = useState(false);

  // ── Data fetching ────────────────────────────────────────────────────────
  const { data: streak, isLoading: streakLoading } = useQuery({
    queryKey: QUERY_KEYS.streak,
    queryFn: streakApi.getStatus,
    staleTime: 60 * 1000,
  });

  const { data: srs, isLoading: srsLoading } = useQuery({
    queryKey: QUERY_KEYS.srsQueue,
    queryFn: srsApi.getQueue,
    staleTime: 5 * 60 * 1000,
  });

  const { data: heatmapRaw = {}, isLoading: heatLoading } = useQuery({
    queryKey: QUERY_KEYS.heatmap,
    queryFn: submissionsApi.getHeatmap,
    staleTime: 10 * 60 * 1000,
  });

  // ── Mutations ────────────────────────────────────────────────────────────
  const pauseMut = useMutation({
    mutationFn: streakApi.usePauseDay,
    onSuccess: (res) => {
      if (res.success) {
        qc.invalidateQueries({ queryKey: QUERY_KEYS.streak });
        setShowPauseConfirm(false);
      }
    },
  });

  const recoverMut = useMutation({
    mutationFn: streakApi.recover,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.streak });
      setShowRecoveryConfirm(false);
    },
  });

  // ── Navigate to SRS item ─────────────────────────────────────────────────
  function navigateToItem(item) {
    if (item.itemType === 'TOPIC') {
      navigate(`/?topic=${item.itemId}`);
    } else {
      navigate(`/?openProblem=${item.itemId}`);
    }
  }

  // ── Streak flame size ────────────────────────────────────────────────────
  const days = streak?.streakDays ?? 0;
  const flameSize = days === 0 ? 56 : days < 7 ? 64 : days < 30 ? 72 : 80;

  const dueItems = srs?.due ?? [];
  const upcomingItems = srs?.upcoming ?? [];
  const xpPct = xpBar(streak?.xp ?? 0, streak?.nextLevelXp ?? 100);

  return (
    <div className={styles.page}>
      <div className={styles.inner}>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.greeting}>
              {getGreeting()}, {(user?.name || 'Coder').split(' ')[0]} 👋
            </h1>
            <p className={styles.subtitle}>Here's where you stand today.</p>
          </div>
          {dueItems.length > 0 && (
            <div className={styles.dueBadge}>
              <span className={styles.dueDot} />
              {dueItems.length} item{dueItems.length !== 1 ? 's' : ''} due for review
            </div>
          )}
        </div>

        {/* ── Quick Win banner ─────────────────────────────────────────── */}
        <button className={styles.quickWinBanner} onClick={() => navigate('/quick-win')}>
          <span className={styles.quickWinIcon}>⚡</span>
          <div className={styles.quickWinText}>
            <span className={styles.quickWinTitle}>5-Minute Mode</span>
            <span className={styles.quickWinSub}>One problem + one quiz to keep your streak alive</span>
          </div>
          <span className={styles.quickWinArrow}>→</span>
        </button>

        {/* ── Top row: Streak + XP + Pause ────────────────────────────── */}
        <div className={styles.topRow}>

          {/* Streak card */}
          <div className={styles.streakCard}>
            {streakLoading ? (
              <div className={styles.skeletonBlock} style={{ height: 80 }} />
            ) : (
              <>
                <div className={styles.flameWrap}>
                  <span style={{ fontSize: flameSize, lineHeight: 1, filter: days === 0 ? 'grayscale(1) opacity(.4)' : 'none' }}>🔥</span>
                  <div className={styles.flameCount}>{days}</div>
                </div>
                <div className={styles.streakInfo}>
                  <div className={styles.streakLabel}>
                    {days === 0 ? 'Start your streak!' : days === 1 ? '1 day streak' : `${days} day streak`}
                  </div>
                  <div className={styles.streakSub}>
                    {streak?.activeToday
                      ? '✅ Active today'
                      : streak?.lastActiveDate
                        ? `Last active ${daysAgo(streak.lastActiveDate)}`
                        : 'No activity yet'}
                  </div>
                  {/* Pause days */}
                  {streak?.pauseDaysBanked > 0 && (
                    <div className={styles.pauseRow}>
                      {[...Array(streak.pauseDaysBanked)].map((_, i) => (
                        <span key={i} className={styles.pauseDot} title="Banked pause day" />
                      ))}
                      <button
                        className={styles.pauseBtn}
                        onClick={() => setShowPauseConfirm(true)}
                        disabled={streak?.activeToday}
                      >
                        Use pause day
                      </button>
                    </div>
                  )}
                  {/* Recovery */}
                  {streak?.recoveryAvailable && !streak?.activeToday && (
                    <button
                      className={styles.recoveryBtn}
                      onClick={() => setShowRecoveryConfirm(true)}
                    >
                      ⚡ Recover streak
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* XP + Level card */}
          <div className={styles.xpCard}>
            {streakLoading ? (
              <div className={styles.skeletonBlock} style={{ height: 80 }} />
            ) : (
              <>
                <div className={styles.xpTop}>
                  <div>
                    <div className={styles.levelLabel}>{streak?.level ?? 'Beginner'}</div>
                    <div className={styles.xpValue}>{(streak?.xp ?? 0).toLocaleString()} XP</div>
                  </div>
                  <div className={styles.levelBadge}>{levelEmoji(streak?.level)}</div>
                </div>
                <div className={styles.xpBarWrap}>
                  <div className={styles.xpBar} style={{ width: `${xpPct}%` }} />
                </div>
                <div className={styles.xpSub}>
                  {streak?.nextLevelXp
                    ? `${streak.nextLevelXp - (streak?.xp ?? 0)} XP to next level`
                    : 'Max level reached!'}
                </div>
              </>
            )}
          </div>

          {/* Quick stats card */}
          <div className={styles.statsCard}>
            <div className={styles.statsRow}>
              <div className={styles.statBox}>
                <div className={styles.statNum}>{srs?.dueCount ?? '—'}</div>
                <div className={styles.statLbl}>Due Today</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statNum}>{srs?.totalQueued ?? '—'}</div>
                <div className={styles.statLbl}>In SRS Queue</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statNum}>{streak?.pauseDaysBanked ?? 0}</div>
                <div className={styles.statLbl}>Pause Days</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Heatmap ─────────────────────────────────────────────────── */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Activity</h2>
            <span className={styles.cardSub}>Submission history</span>
          </div>
          {heatLoading
            ? <div className={styles.skeletonBlock} style={{ height: 100 }} />
            : <Heatmap data={heatmapRaw} />}
        </div>

        {/* ── SRS Queue ───────────────────────────────────────────────── */}
        <div className={styles.srsSection}>

          {/* Due now */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                Due for Review
                {dueItems.length > 0 && <span className={styles.countBadge}>{dueItems.length}</span>}
              </h2>
              {dueItems.length > 0 ? (
                <button
                  className={styles.startReviewBtn}
                  onClick={() => navigate('/review')}
                >
                  Start session →
                </button>
              ) : (
                <span className={styles.cardSub}>Spaced repetition queue</span>
              )}
            </div>
            {srsLoading ? (
              <div className={styles.skeletonBlock} style={{ height: 80 }} />
            ) : dueItems.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>✅</div>
                <div className={styles.emptyText}>All caught up! Nothing due today.</div>
                {upcomingItems.length > 0 && (
                  <div className={styles.emptyHint}>Next review: {fmtDate(upcomingItems[0]?.nextReviewDate)}</div>
                )}
              </div>
            ) : (
              <div className={styles.srsList}>
                {dueItems.slice(0, 4).map((item) => (
                  <SrsItem key={item.id} item={item} onNavigate={navigateToItem} />
                ))}
                {dueItems.length > 4 && (
                  <button className={styles.srsMoreBtn} onClick={() => navigate('/review')}>
                    +{dueItems.length - 4} more — start full session →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Upcoming */}
          {upcomingItems.length > 0 && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Coming Up</h2>
                <span className={styles.cardSub}>Next scheduled reviews</span>
              </div>
              <div className={styles.upcomingList}>
                {upcomingItems.slice(0, 6).map((item) => (
                  <div key={item.id} className={styles.upcomingItem}>
                    <span className={styles.upcomingIcon}>{item.itemType === 'TOPIC' ? '📖' : '🎯'}</span>
                    <span className={styles.upcomingTitle}>{item.itemTitle}</span>
                    <span className={styles.upcomingDate}>{fmtDate(item.nextReviewDate)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ── Pause day confirm modal ────────────────────────────────────── */}
      {showPauseConfirm && (
        <div className={styles.modalOverlay} onClick={() => setShowPauseConfirm(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalIcon}>🛡️</div>
            <h3 className={styles.modalTitle}>Use a pause day?</h3>
            <p className={styles.modalBody}>
              This will protect your streak for today. You have{' '}
              <strong>{streak?.pauseDaysBanked}</strong> pause day{streak?.pauseDaysBanked !== 1 ? 's' : ''} banked.
              Pause days cannot cover consecutive days.
            </p>
            <div className={styles.modalActions}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowPauseConfirm(false)}>Cancel</button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => pauseMut.mutate()}
                disabled={pauseMut.isPending}
              >
                {pauseMut.isPending ? 'Using…' : 'Use pause day'}
              </button>
            </div>
            {pauseMut.data && !pauseMut.data.success && (
              <p className={styles.modalError}>{pauseMut.data.message}</p>
            )}
          </div>
        </div>
      )}

      {/* ── Streak recovery modal ──────────────────────────────────────── */}
      {showRecoveryConfirm && (
        <div className={styles.modalOverlay} onClick={() => setShowRecoveryConfirm(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalIcon}>⚡</div>
            <h3 className={styles.modalTitle}>Recover your streak?</h3>
            <p className={styles.modalBody}>
              You missed yesterday, but your{' '}
              <strong>{streak?.streakDays ?? 0}-day streak</strong> can be restored.
              Complete any problem or quiz today to lock it back in.
            </p>
            <div className={styles.modalBullets}>
              <div className={styles.modalBullet}>✅ Streak restored immediately</div>
              <div className={styles.modalBullet}>⏱ Stay active today to keep it</div>
              <div className={styles.modalBullet}>🗓 One recovery allowed per 30 days</div>
            </div>
            <div className={styles.modalActions}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowRecoveryConfirm(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => recoverMut.mutate()}
                disabled={recoverMut.isPending}
              >
                {recoverMut.isPending ? 'Recovering…' : '⚡ Recover streak'}
              </button>
            </div>
            {recoverMut.data && !recoverMut.data.success && (
              <p className={styles.modalError}>{recoverMut.data.message}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function levelEmoji(level) {
  const map = {
    Beginner: '🌱', Learner: '📗', Practitioner: '⚡',
    Engineer: '🔧', Senior: '🏆', Architect: '🚀',
  };
  return map[level] || '🌱';
}