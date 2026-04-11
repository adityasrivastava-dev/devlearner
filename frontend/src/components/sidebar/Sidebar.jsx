import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { topicsApi, QUERY_KEYS } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { CATEGORIES, getCategoryMeta } from '../../utils/helpers';
import UserBar from './UserBar';
import styles from './Sidebar.module.css';

// ── Nav structure ─────────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    label: 'Learn',
    items: [
      { path: '/',            icon: '⌂',  label: 'Dashboard'      },
      { path: '/algorithms',  icon: '∑',  label: 'Algorithms'     },
      { path: '/roadmap',     icon: '🗺', label: 'Roadmap'        },
    ],
  },
  {
    label: 'Practice',
    items: [
      { path: '/problems',    icon: '≡',  label: 'Problems'       },
      { path: '/quiz',        icon: '🧠', label: 'MCQ Quiz'       },
      { path: '/playground',  icon: '{}', label: 'Playground'     },
      { path: '/quick-win',   icon: '⚡', label: '5-Min Mode'     },
    ],
  },
  {
    label: 'Interview',
    items: [
      { path: '/interview-prep', icon: '📋', label: 'Interview Q&A' },
      { path: '/revision',       icon: '⏱', label: 'Revision'      },
      { path: '/drill',          icon: '⚔', label: 'Pattern Drill'  },
    ],
  },
  {
    label: 'Account',
    items: [
      { path: '/profile', icon: '👤', label: 'Profile' },
    ],
  },
];

export default function Sidebar({ selectedTopicId, onTopicSelect, isOpen, onClose }) {
  const [category, setCategory] = useState('ALL');
  const [search, setSearch]     = useState('');
  const navigate  = useNavigate();
  const location  = useLocation();
  const { isAdmin } = useAuth();

  useEffect(() => { onClose?.(); }, [location.pathname]); // eslint-disable-line

  const { data: topics = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.topics(category),
    queryFn:  () => topicsApi.getAll(category),
    staleTime: 5 * 60 * 1000,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return topics;
    const q = search.toLowerCase();
    return topics.filter((t) => t.title.toLowerCase().includes(q));
  }, [topics, search]);

  // Group topics by subCategory for display.
  // Returns array of { sectionName: string|null, topics: [] }
  // If searching or ALL category: flat (no section headers)
  const grouped = useMemo(() => {
    if (search.trim() || category === 'ALL') {
      return [{ sectionName: null, topics: filtered }];
    }
    const map = new Map(); // preserve insertion order
    for (const t of filtered) {
      const sec = t.subCategory || '';
      if (!map.has(sec)) map.set(sec, []);
      map.get(sec).push(t);
    }
    return Array.from(map.entries()).map(([sectionName, topics]) => ({
      sectionName: sectionName || null,
      topics,
    }));
  }, [filtered, search, category]);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/' && !selectedTopicId;
    return location.pathname === path;
  };

  function navTo(path) { navigate(path); onClose?.(); }

  return (
    <>
      {isOpen && <div className={styles.backdrop} onClick={onClose} />}

      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>

        {/* ── Logo ──────────────────────────────────────────────────────── */}
        <div className={styles.header}>
          <button className={styles.logoBtn} onClick={() => { navTo('/'); onTopicSelect?.(null); }} title="Dashboard">
            <span className={styles.logo}>⟨dev<span>learn</span>⟩</span>
          </button>
          <button className={`${styles.iconBtn} ${styles.closeBtn}`} onClick={onClose} title="Close">✕</button>
        </div>

        {/* ── Nav ───────────────────────────────────────────────────────── */}
        <nav className={styles.nav}>
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className={styles.navSection}>
              <div className={styles.navSectionLabel}>{section.label}</div>
              {section.items.map(({ path, icon, label }) => (
                <button
                  key={path}
                  className={`${styles.navItem} ${isActive(path) ? styles.navItemActive : ''}`}
                  onClick={() => navTo(path)}
                >
                  <span className={styles.navIcon}>{icon}</span>
                  <span className={styles.navLabel}>{label}</span>
                </button>
              ))}
            </div>
          ))}

          {isAdmin && (
            <div className={styles.navSection}>
              <div className={styles.navSectionLabel}>Admin</div>
              <button
                className={`${styles.navItem} ${isActive('/admin') ? styles.navItemActive : ''}`}
                onClick={() => navTo('/admin')}
              >
                <span className={styles.navIcon}>⚙</span>
                <span className={styles.navLabel}>Admin Panel</span>
              </button>
            </div>
          )}
        </nav>

        {/* ── User bar ──────────────────────────────────────────────────── */}
        <UserBar />

        {/* ── Topics ────────────────────────────────────────────────────── */}
        <div className={styles.topicsArea}>
          <div className={styles.topicsHeader}>
            <span className={styles.topicsHeading}>Topics</span>
          </div>

          <div className={styles.catTabs}>
            {CATEGORIES.map((cat) => (
              <button key={cat.key}
                className={`${styles.catBtn} ${category === cat.key ? styles.active : ''}`}
                onClick={() => { setCategory(cat.key); setSearch(''); }}>
                {cat.label}
              </button>
            ))}
          </div>

          <div className={styles.searchBox}>
            <input className={styles.searchInput} type="text" placeholder="Search topics…"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <ul className={styles.topicList}>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => <li key={i} className={styles.skeleton} />)
            ) : filtered.length === 0 ? (
              <li className={styles.empty}>
                {search ? 'No topics match' : 'No topics in this category'}
              </li>
            ) : (
              grouped.map(({ sectionName, topics: sectionTopics }) => (
                <li key={sectionName || '__ungrouped'} className={styles.topicGroup}>
                  {sectionName && (
                    <div className={styles.topicGroupLabel}>{sectionName}</div>
                  )}
                  <ul className={styles.topicGroupList}>
                    {sectionTopics.map((topic) => {
                      const meta = getCategoryMeta(topic.category);
                      return (
                        <li key={topic.id}
                          className={`${styles.topicItem} ${selectedTopicId === topic.id ? styles.selected : ''}`}
                          onClick={() => { onTopicSelect(topic.id); onClose?.(); }}>
                          <span className={styles.topicName}>{topic.title}</span>
                          {category === 'ALL' && (
                            <span className={`badge ${meta.cls}`} style={{ fontSize: 9, padding: '1px 6px' }}>{meta.label}</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))
            )}
          </ul>
        </div>

      </aside>
    </>
  );
}
