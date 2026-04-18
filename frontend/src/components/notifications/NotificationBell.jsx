import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi, QUERY_KEYS } from '../../api';
import styles from './NotificationBell.module.css';

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const { data } = useQuery({
    queryKey: QUERY_KEYS.notifications,
    queryFn:  notificationsApi.getSummary,
    refetchInterval: 5 * 60 * 1000,
    staleTime:       4 * 60 * 1000,
  });

  const total        = data?.total        ?? 0;
  const atRisk       = data?.streak?.atRisk   ?? false;
  const streakDays   = data?.streak?.days     ?? 0;
  const srsDue       = data?.srsDue       ?? 0;
  const dailyPending = data?.dailyPending  ?? false;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  function go(path) { navigate(path); setOpen(false); }

  const items = [
    atRisk && {
      key:     'streak',
      icon:    '🔥',
      urgency: 'warning',
      title:   `Streak at risk — ${streakDays} day${streakDays !== 1 ? 's' : ''}`,
      body:    'Solve at least one problem today to keep your streak.',
      action:  () => go('/problems'),
      cta:     'Go to Problems',
    },
    srsDue > 0 && {
      key:     'srs',
      icon:    '🧠',
      urgency: 'info',
      title:   `${srsDue} topic${srsDue !== 1 ? 's' : ''} due for review`,
      body:    'Your spaced repetition queue has items ready.',
      action:  () => go('/review'),
      cta:     'Start Review',
    },
    dailyPending && {
      key:     'daily',
      icon:    '🎯',
      urgency: 'info',
      title:   "Daily challenge pending",
      body:    "Today's challenge is waiting. Earn XP and climb the leaderboard.",
      action:  () => go('/daily'),
      cta:     'Take Challenge',
    },
  ].filter(Boolean);

  return (
    <div className={styles.wrap} ref={ref}>
      <button
        className={`${styles.bell} ${total > 0 ? styles.bellActive : ''}`}
        onClick={() => setOpen((v) => !v)}
        title="Notifications"
      >
        <span className={styles.bellIcon}>🔔</span>
        {total > 0 && <span className={styles.badge}>{total}</span>}
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.dropHeader}>
            <span className={styles.dropTitle}>Notifications</span>
            {total > 0 && <span className={styles.dropCount}>{total} active</span>}
          </div>

          {items.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>✓</span>
              <p>All caught up!</p>
            </div>
          ) : (
            <div className={styles.items}>
              {items.map((item) => (
                <div key={item.key} className={`${styles.item} ${styles[item.urgency]}`}>
                  <div className={styles.itemHeader}>
                    <span className={styles.itemIcon}>{item.icon}</span>
                    <span className={styles.itemTitle}>{item.title}</span>
                  </div>
                  <p className={styles.itemBody}>{item.body}</p>
                  <button className={styles.itemCta} onClick={item.action}>
                    {item.cta} →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
