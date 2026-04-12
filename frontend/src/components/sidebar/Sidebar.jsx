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
      { path: '/mastery',     icon: '◉',  label: 'Mastery Map'    },
      { path: '/review',      icon: '↻',  label: 'Review Queue'   },
      { path: '/analytics',   icon: '▲',  label: 'Analytics'      },
      { path: '/roadmap',     icon: '🗺', label: 'Roadmap'        },
    ],
  },
  {
    label: 'Practice',
    items: [
      { path: '/problems',    icon: '≡',  label: 'Problems'       },
      { path: '/quiz',        icon: '🧠', label: 'MCQ Quiz'       },
      { path: '/playground',  icon: '{}', label: 'Playground'     },
      { path: '/complexity',  icon: '∑',  label: 'Complexity'     },
      { path: '/quick-win',   icon: '⚡', label: '5-Min Mode'     },
    ],
  },
  {
    label: 'Interview',
    items: [
      { path: '/interview-mode', icon: '⏱', label: 'Interview Mode' },
      { path: '/interview-prep', icon: '📋', label: 'Q&A Bank'       },
      { path: '/revision',       icon: '↺',  label: 'Revision'      },
      { path: '/drill',          icon: '⚔',  label: 'Pattern Drill'  },
    ],
  },
  {
    label: 'Account',
    items: [
      { path: '/profile', icon: '👤', label: 'Profile' },
    ],
  },
];

// Which nav section label contains a given path?
function sectionForPath(pathname) {
  for (const s of NAV_SECTIONS) {
    if (s.items.some((i) => i.path === pathname || (i.path !== '/' && pathname.startsWith(i.path)))) {
      return s.label;
    }
  }
  return null;
}

export default function Sidebar({ selectedTopicId, onTopicSelect, isOpen, onClose }) {
  const [category, setCategory] = useState('ALL');
  const [search, setSearch]     = useState('');
  const navigate  = useNavigate();
  const location  = useLocation();
  const { isAdmin } = useAuth();

  // Accordion: only the section containing the active route starts open
  const [openSections, setOpenSections] = useState(() => {
    const active = sectionForPath(location.pathname);
    return active ? new Set([active]) : new Set();
  });

  // When route changes, auto-open that section
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

  // Group topics for display.
  // searching → flat list, no headers
  // ALL tab   → group by category (Java, DSA, SQL …)
  // specific  → group by subCategory (OOP, Collections …)
  const grouped = useMemo(() => {
    if (search.trim()) {
      return [{ sectionName: null, sectionColor: null, topics: filtered }];
    }
    if (category === 'ALL') {
      const map = new Map();
      for (const t of filtered) {
        const cat = t.category || 'OTHER';
        if (!map.has(cat)) map.set(cat, []);
        map.get(cat).push(t);
      }
      return Array.from(map.entries()).map(([cat, catTopics]) => {
        const meta = getCategoryMeta(cat);
        return { sectionName: meta.label, sectionColor: meta.color, topics: catTopics };
      });
    }
    const map = new Map();
    for (const t of filtered) {
      const sec = t.subCategory || '';
      if (!map.has(sec)) map.set(sec, []);
      map.get(sec).push(t);
    }
    return Array.from(map.entries()).map(([sectionName, secTopics]) => ({
      sectionName: sectionName || null,
      sectionColor: null,
      topics: secTopics,
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

        {/* ── User bar ──────────────────────────────────────────────────── */}
        <UserBar />

        {/* ── Topics ────────────────────────────────────────────────────── */}
        <div className={styles.topicsArea}>
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
              grouped.map(({ sectionName, sectionColor, topics: sectionTopics }) => (
                <li key={sectionName || '__ungrouped'} className={styles.topicGroup}>
                  {sectionName && (
                    <div
                      className={styles.topicGroupLabel}
                      style={sectionColor ? { color: sectionColor, opacity: 1 } : undefined}
                    >
                      {sectionName}
                    </div>
                  )}
                  <ul className={styles.topicGroupList}>
                    {sectionTopics.map((topic) => (
                      <li key={topic.id}
                        className={`${styles.topicItem} ${selectedTopicId === topic.id ? styles.selected : ''}`}
                        onClick={() => { onTopicSelect(topic.id); onClose?.(); }}>
                        <span className={styles.topicDot} />
                        <span className={styles.topicName}>{topic.title}</span>
                      </li>
                    ))}
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
