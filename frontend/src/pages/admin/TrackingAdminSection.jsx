import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { trackingApi } from '../../api';
import { SkeletonCard } from '../../components/shared/Skeleton';
import styles from './AdminPage.module.css';

const PAGE_LABELS = {
  '/':               'Home',
  '/problems':       'Problems',
  '/algorithms':     'Algorithms',
  '/quiz':           'Quiz',
  '/interview-prep': 'Interview Prep',
  '/videos':         'Videos',
  '/roadmap':        'Roadmap',
  '/profile':        'Profile',
  '/analytics':      'Analytics',
  '/mastery':        'Mastery Map',
  '/review':         'Review',
  '/drill':          'Drill',
  '/playground':     'Playground',
  '/complexity':     'Complexity',
  '/revision':       'Revision',
  '/interview-mode': 'Interview Mode',
  '/quick-win':      'Quick Win',
  '/admin':          'Admin',
};

function label(path) {
  return PAGE_LABELS[path] || path;
}

function bar(value, max, color = 'var(--accent)') {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        flex: 1, height: 8, background: 'var(--bg3, #1e2130)',
        borderRadius: 4, overflow: 'hidden',
      }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: 12, color: 'var(--text2)', minWidth: 40, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

export default function TrackingAdminSection() {
  const [days, setDays] = useState(7);

  const { data: pageStats, isLoading: loadingPages } = useQuery({
    queryKey: ['admin-tracking-pages', days],
    queryFn: () => trackingApi.getPageStats(days),
    staleTime: 60 * 1000,
  });

  const { data: eventStats, isLoading: loadingEvents } = useQuery({
    queryKey: ['admin-tracking-events', days],
    queryFn: () => trackingApi.getEventStats(days),
    staleTime: 60 * 1000,
  });

  const { data: daily = [], isLoading: loadingDaily } = useQuery({
    queryKey: ['admin-tracking-daily', days],
    queryFn: () => trackingApi.getDailyVisits(days),
    staleTime: 60 * 1000,
  });

  const { data: recent = [], isLoading: loadingRecent } = useQuery({
    queryKey: ['admin-tracking-recent'],
    queryFn: trackingApi.getRecentViews,
    staleTime: 30 * 1000,
  });

  const recentPages  = pageStats?.[`last${days}Days`] ?? [];
  const allTimePages = pageStats?.allTime ?? [];
  const recentEvents = eventStats?.recent ?? [];
  const totalVisits  = pageStats?.totalVisits ?? 0;
  const totalEvents  = eventStats?.totalEvents ?? 0;

  const maxPageVisits = recentPages[0]?.visits ?? 1;
  const maxEventCount = recentEvents[0]?.count  ?? 1;
  const maxDaily      = Math.max(...daily.map((d) => d.visits ?? 0), 1);

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>Usage Analytics</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              className={`${styles.filterBtn} ${days === d ? styles.filterBtnActive : ''}`}
              onClick={() => setDays(d)}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* ── Summary cards ────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Page Views', value: totalVisits.toLocaleString(), icon: '👁' },
          { label: 'Total Events',     value: totalEvents.toLocaleString(), icon: '⚡' },
          { label: 'Pages Tracked',   value: allTimePages.length,           icon: '📄' },
          { label: 'Event Types',     value: (eventStats?.allTime ?? []).length, icon: '🎯' },
        ].map((card) => (
          <div key={card.label} className={styles.statCard}>
            <div className={styles.statIcon}>{card.icon}</div>
            <div className={styles.statNum}>{card.value}</div>
            <div className={styles.statLabel}>{card.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

        {/* ── Page visit chart ──────────────────────────────────────────── */}
        <div className={styles.subSection}>
          <div className={styles.subTitle}>Most Visited Pages (last {days}d)</div>
          {loadingPages ? (
            <SkeletonCard />
          ) : recentPages.length === 0 ? (
            <p className={styles.emptyNote}>No page visits recorded yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentPages.slice(0, 12).map((row) => (
                <div key={row.path}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 13, color: 'var(--text)' }}>{label(row.path)}</span>
                    <span style={{ fontSize: 11, color: 'var(--text2)' }}>{row.path}</span>
                  </div>
                  {bar(row.visits, maxPageVisits, 'var(--accent)')}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Event type chart ──────────────────────────────────────────── */}
        <div className={styles.subSection}>
          <div className={styles.subTitle}>Top Events (last {days}d)</div>
          {loadingEvents ? (
            <SkeletonCard />
          ) : recentEvents.length === 0 ? (
            <p className={styles.emptyNote}>No events recorded yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentEvents.slice(0, 12).map((row) => (
                <div key={row.eventType}>
                  <div style={{ marginBottom: 3, fontSize: 13, color: 'var(--text)' }}>
                    {row.eventType.replace(/_/g, ' ')}
                  </div>
                  {bar(row.count, maxEventCount, 'var(--accent3, #00d4a8)')}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Daily visits sparkline ────────────────────────────────────────── */}
      <div className={styles.subSection} style={{ marginBottom: 24 }}>
        <div className={styles.subTitle}>Daily Page Views (last {days}d)</div>
        {loadingDaily ? (
          <SkeletonCard />
        ) : daily.length === 0 ? (
          <p className={styles.emptyNote}>No data yet.</p>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 }}>
            {daily.map((d) => {
              const h = Math.max(4, Math.round((d.visits / maxDaily) * 72));
              return (
                <div
                  key={d.date}
                  title={`${d.date}: ${d.visits} visits`}
                  style={{
                    flex: 1,
                    height: h,
                    background: 'var(--accent)',
                    borderRadius: '3px 3px 0 0',
                    opacity: 0.8,
                    cursor: 'default',
                    minWidth: 6,
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* ── Recent page views feed ────────────────────────────────────────── */}
      <div className={styles.subSection}>
        <div className={styles.subTitle}>Recent Page Views (last 50)</div>
        {loadingRecent ? (
          <SkeletonCard />
        ) : recent.length === 0 ? (
          <p className={styles.emptyNote}>No page views yet.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Page</th>
                  <th>Path</th>
                  <th>Time</th>
                  <th>Session</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r, i) => (
                  <tr key={i}>
                    <td>{r.userId}</td>
                    <td>{label(r.path)}</td>
                    <td style={{ color: 'var(--text2)', fontSize: 12 }}>{r.path}</td>
                    <td style={{ fontSize: 11, color: 'var(--text2)' }}>
                      {r.viewedAt ? new Date(r.viewedAt).toLocaleString() : '—'}
                    </td>
                    <td style={{ fontSize: 11, color: 'var(--text3, #555)', fontFamily: 'monospace' }}>
                      {r.sessionId ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
