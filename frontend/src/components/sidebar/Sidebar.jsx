import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { CATEGORIES } from '../../utils/helpers';
import { topicsApi, userVideosApi, QUERY_KEYS } from '../../api';
import UserBar from './UserBar';
import NotificationBell from '../notifications/NotificationBell';
import styles from './Sidebar.module.css';

// ── Nav structure ─────────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    label: 'Learn',
    items: [
      { path: '/',            icon: '⌂',  label: 'Dashboard'      },
      { path: '/algorithms',  icon: '∑',  label: 'Algorithms'     },
      { path: '/mastery',     icon: '◉',  label: 'Mastery Map'    },
      { path: '/review',      icon: '↻',  label: 'Review Queue'   },
      { path: '/analytics',   icon: '▲',  label: 'Analytics'      },
      { path: '/path',        icon: '🛤', label: 'Learning Path'   },
      { path: '/roadmap',     icon: '🗺', label: 'Roadmap'        },
      { path: '/timetable',   icon: '📅', label: 'Timetable'      },
      { path: '/videos',      icon: '▶',  label: 'Videos'         },
    ],
  },
  {
    label: 'Practice',
    items: [
      { path: '/daily',        icon: '🔥', label: 'Daily Challenge' },
      { path: '/problems',    icon: '≡',  label: 'Problems'       },
      { path: '/quiz',        icon: '🧠', label: 'MCQ Quiz'       },
      { path: '/playground',  icon: '{}', label: 'Playground'     },
      { path: '/complexity',  icon: '∑',  label: 'Complexity'     },
      { path: '/quick-win',   icon: '⚡', label: '5-Min Mode'     },
      { path: '/system-design', icon: '🏗', label: 'System Design' },
    ],
  },
  {
    label: 'Interview',
    items: [
      { path: '/interview-mode',  icon: '⏱', label: 'Interview Mode'      },
      { path: '/mock-interview',  icon: '🎤', label: 'Mock Interview'      },
      { path: '/stories',        icon: '📖', label: 'Story Builder'        },
      { path: '/interview-prep', icon: '📋', label: 'Q&A Bank'       },
      { path: '/revision',       icon: '↺',  label: 'Revision'      },
      { path: '/drill',          icon: '⚔',  label: 'Pattern Drill'  },
      { path: '/resume',         icon: '📄', label: 'Resume Analyzer' },
    ],
  },
  {
    label: 'Account',
    items: [
      { path: '/profile', icon: '👤', label: 'Profile' },
    ],
  },
];

// ── YouTube helpers ───────────────────────────────────────────────────────────
function getYtId(url) {
  if (!url) return null;
  const patterns = [
    /youtu\.be\/([^?&\s]{11})/,
    /[?&]v=([^&\s]{11})/,
    /embed\/([^?&\s]{11})/,
    /shorts\/([^?&\s]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

function parseYtUrls(raw) {
  if (!raw) return [];
  try {
    const p = JSON.parse(raw);
    if (Array.isArray(p)) return p.filter(Boolean);
  } catch {
    return raw.split(/[\n,]/).map(s => s.trim()).filter(Boolean);
  }
  return [];
}

// ── Category display config (icon + color)
const CAT_CONFIG = {
  JAVA:          { icon: '☕', color: '#fbbf24' },
  ADVANCED_JAVA: { icon: '⚡', color: '#a78bfa' },
  MYSQL:         { icon: '🗄', color: '#fbbf24' },
  DSA:           { icon: '🎯', color: '#60a5fa' },
  SPRING_BOOT:   { icon: '🍃', color: '#4ade80' },
  AWS:           { icon: '☁', color: '#fb923c'  },
  SYSTEM_DESIGN: { icon: '🏗', color: '#f472b6'  },
  TESTING:       { icon: '🧪', color: '#34d399'  },
};

// ── Videos Section ────────────────────────────────────────────────────────────
function VideosSection({ topicId }) {
  const [open, setOpen] = useState(false);

  const { data: topic } = useQuery({
    queryKey: QUERY_KEYS.topic(topicId),
    queryFn:  () => topicsApi.getById(topicId),
    enabled:  !!topicId,
    staleTime: 15 * 60 * 1000,
  });

  const { data: userVideos = [] } = useQuery({
    queryKey: QUERY_KEYS.userVideos(topicId),
    queryFn:  () => userVideosApi.getForTopic(topicId),
    enabled:  !!topicId,
    staleTime: 60 * 1000,
  });

  // Reset collapsed state when topic changes
  useEffect(() => { setOpen(false); }, [topicId]);

  const adminUrls = parseYtUrls(topic?.youtubeUrls);
  const total     = adminUrls.length + userVideos.length;

  if (total === 0) return null;

  return (
    <div className={styles.videosSection}>
      {/* Accordion header — same style as nav sections */}
      <button className={styles.videosAccordion} onClick={() => setOpen(v => !v)}>
        <div className={styles.videosAccordionLeft}>
          <span className={styles.videosSectionTitle}>Videos</span>
          <span className={styles.videosCount}>{total}</span>
        </div>
        <span className={`${styles.navChevron} ${open ? styles.navChevronOpen : ''}`}>›</span>
      </button>

      {/* Collapsed: show topic name as hint */}
      {!open && (
        <div className={styles.videosCollapsedHint}>{topic?.title}</div>
      )}

      {/* Expanded: full list */}
      {open && (
        <div className={styles.videosList}>
          {adminUrls.map((url, i) => {
            const vid   = getYtId(url);
            const thumb = vid ? `https://img.youtube.com/vi/${vid}/mqdefault.jpg` : null;
            return (
              <a key={`a-${i}`} href={url} target="_blank" rel="noopener noreferrer" className={styles.videoItem}>
                {thumb
                  ? <img src={thumb} alt="" className={styles.videoThumb} />
                  : <div className={styles.videoThumbFallback}>▶</div>
                }
                <div className={styles.videoMeta}>
                  <span className={styles.videoName}>Video {i + 1}</span>
                  <span className={styles.videoTopicName}>{topic?.title}</span>
                </div>
              </a>
            );
          })}

          {userVideos.map((v) => {
            const vid   = getYtId(v.url);
            const thumb = vid ? `https://img.youtube.com/vi/${vid}/mqdefault.jpg` : null;
            return (
              <a key={`u-${v.id}`} href={v.url} target="_blank" rel="noopener noreferrer" className={styles.videoItem}>
                {thumb
                  ? <img src={thumb} alt="" className={styles.videoThumb} />
                  : <div className={styles.videoThumbFallback}>▶</div>
                }
                <div className={styles.videoMeta}>
                  <span className={styles.videoName}>{v.title || 'My Video'}</span>
                  <span className={styles.videoTopicName}>{topic?.title}</span>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

function sectionForPath(pathname) {
  for (const s of NAV_SECTIONS) {
    if (s.items.some((i) => i.path === pathname || (i.path !== '/' && pathname.startsWith(i.path)))) {
      return s.label;
    }
  }
  return null;
}

export default function Sidebar({ isOpen, onClose }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [searchParams] = useSearchParams();
  const { isAdmin } = useAuth();

  const activeCategory  = searchParams.get('category');
  const selectedTopicId = (() => { const v = searchParams.get('topic'); const n = parseInt(v, 10); return v && !isNaN(n) ? n : null; })();

  const [openSections, setOpenSections] = useState(() => {
    const active = sectionForPath(location.pathname);
    return active ? new Set([active]) : new Set();
  });

  // Focus mode — dim non-focused nav items
  const [focusPath, setFocusPath] = useState(() => {
    try { const f = JSON.parse(localStorage.getItem('devlearn_focus_mode') || 'null'); return f?.path || null; }
    catch { return null; }
  });

  useEffect(() => {
    function onFocusChange() {
      try { const f = JSON.parse(localStorage.getItem('devlearn_focus_mode') || 'null'); setFocusPath(f?.path || null); }
      catch { setFocusPath(null); }
    }
    window.addEventListener('devlearn_focus_change', onFocusChange);
    return () => window.removeEventListener('devlearn_focus_change', onFocusChange);
  }, []);

  useEffect(() => {
    const active = sectionForPath(location.pathname);
    if (active) setOpenSections((prev) => new Set([...prev, active]));
    onClose?.();
  }, [location.pathname]); // eslint-disable-line

  function toggleSection(label) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/' && !searchParams.get('topic') && !searchParams.get('category');
    return location.pathname === path;
  };

  function navTo(path) { navigate(path); onClose?.(); }

  function selectCategory(key) {
    navigate(`/?category=${key}`);
    onClose?.();
  }

  // Categories excluding ALL
  const browseCategories = CATEGORIES.filter((c) => c.key !== 'ALL');

  return (
    <>
      {isOpen && <div className={styles.backdrop} onClick={onClose} />}

      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>

        {/* ── Logo ──────────────────────────────────────────────────────── */}
        <div className={styles.header}>
          <button className={styles.logoBtn} onClick={() => navTo('/')} title="Dashboard">
            <span className={styles.logo}>⟨dev<span>learn</span>⟩</span>
          </button>
          <div className={styles.headerActions}>
            <NotificationBell />
            <button className={`${styles.iconBtn} ${styles.closeBtn}`} onClick={onClose} title="Close">✕</button>
          </div>
        </div>

        {/* ── Scrollable body ───────────────────────────────────────────── */}
        <div className={styles.scrollArea}>

        {/* ── Search bar ────────────────────────────────────────────────── */}
        <form
          className={styles.searchBar}
          onSubmit={(e) => { e.preventDefault(); const q = e.target.q.value.trim(); if (q.length >= 2) { navigate(`/search?q=${encodeURIComponent(q)}`); onClose?.(); } }}
        >
          <span className={styles.searchBarIcon}>⌕</span>
          <input
            name="q"
            className={styles.searchBarInput}
            placeholder="Search topics, problems…"
            autoComplete="off"
            spellCheck={false}
          />
        </form>

        {/* ── Nav ───────────────────────────────────────────────────────── */}
        <nav className={styles.nav}>
          {NAV_SECTIONS.map((section) => {
            const isExpanded = openSections.has(section.label);
            const hasActive  = section.items.some((i) => isActive(i.path));
            return (
              <div key={section.label} className={styles.navSection}>
                <button
                  className={`${styles.navAccordion} ${hasActive ? styles.navAccordionActive : ''}`}
                  onClick={() => toggleSection(section.label)}
                >
                  <span className={styles.navAccordionLabel}>{section.label}</span>
                  <span className={`${styles.navChevron} ${isExpanded ? styles.navChevronOpen : ''}`}>›</span>
                </button>
                {isExpanded && (
                  <div className={styles.navItems}>
                    {section.items.map(({ path, icon, label }) => {
                      const dimmed = focusPath && focusPath !== path;
                      return (
                        <button
                          key={path}
                          className={`${styles.navItem} ${isActive(path) ? styles.navItemActive : ''} ${dimmed ? styles.navItemDimmed : ''}`}
                          onClick={() => navTo(path)}
                        >
                          <span className={styles.navIcon}>{icon}</span>
                          <span className={styles.navLabel}>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {isAdmin && (
            <div className={styles.navSection}>
              <button
                className={`${styles.navAccordion} ${isActive('/admin') ? styles.navAccordionActive : ''}`}
                onClick={() => navTo('/admin')}
              >
                <span className={styles.navAccordionLabel}>⚙ Admin</span>
              </button>
            </div>
          )}
        </nav>

        {/* ── Videos for current topic ──────────────────────────────────── */}
        {selectedTopicId && <VideosSection topicId={selectedTopicId} />}

        {/* ── Topic Categories ──────────────────────────────────────────── */}
        <div className={styles.catSection}>
          <div className={styles.catSectionHeader}>Topics</div>
          <div className={styles.catGrid}>
            {browseCategories.map((cat) => {
              const cfg = CAT_CONFIG[cat.key] || { icon: '📚', color: '#94a3b8' };
              const isActiveCat = activeCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  className={`${styles.catPill} ${isActiveCat ? styles.catPillActive : ''}`}
                  style={isActiveCat ? { borderColor: cfg.color + '66', background: cfg.color + '18', color: cfg.color } : {}}
                  onClick={() => selectCategory(cat.key)}
                  title={cat.label}
                >
                  <span className={styles.catPillIcon}>{cfg.icon}</span>
                  <span className={styles.catPillLabel}>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        </div>{/* end scrollArea */}

        {/* ── User bar ──────────────────────────────────────────────────── */}
        <UserBar />

      </aside>
    </>
  );
}
