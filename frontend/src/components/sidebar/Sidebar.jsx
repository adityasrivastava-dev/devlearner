import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CATEGORIES, CATEGORY_META } from '../../utils/helpers';
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

// Category display config (icon + color)
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

  const activeCategory = searchParams.get('category');

  const [openSections, setOpenSections] = useState(() => {
    const active = sectionForPath(location.pathname);
    return active ? new Set([active]) : new Set();
  });

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

        {/* ── User bar ──────────────────────────────────────────────────── */}
        <UserBar />

      </aside>
    </>
  );
}
