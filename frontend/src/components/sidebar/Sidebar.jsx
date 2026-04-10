import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { topicsApi, QUERY_KEYS } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { CATEGORIES, getCategoryMeta } from '../../utils/helpers';
import UserBar from './UserBar';
import styles from './Sidebar.module.css';

export default function Sidebar({ selectedTopicId, onTopicSelect, isOpen, onClose }) {
  const [category, setCategory] = useState('ALL');
  const [search, setSearch] = useState('');
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

  const isActive = (path) => location.pathname === path;
  const isHome   = location.pathname === '/';

  function navTo(path) { navigate(path); onClose?.(); }

  return (
    <>
      {isOpen && <div className={styles.backdrop} onClick={onClose} />}

      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>

        {/* Row 1: logo + mobile close */}
        <div className={styles.header}>
          <button className={styles.logoBtn} onClick={() => { navTo('/'); onTopicSelect?.(null); }} title="Dashboard">
            <span className={styles.logo}>⟨dev<span>learn</span>⟩</span>
          </button>
          <button className={`${styles.iconBtn} ${styles.closeBtn}`} onClick={onClose} title="Close">✕</button>
        </div>

        {/* Row 2: nav icons — full width, always visible */}
        <div className={styles.navRow}>
          <button className={`${styles.navBtn} ${isHome && !selectedTopicId ? styles.navActive : ''}`}
            onClick={() => { navTo('/'); onTopicSelect?.(null); }} title="Dashboard">⌂</button>
          <button className={`${styles.navBtn} ${isActive('/roadmap') ? styles.navActive : ''}`}
            onClick={() => navTo('/roadmap')} title="Roadmaps">🗺</button>
          <button className={`${styles.navBtn} ${isActive('/quiz') ? styles.navActive : ''}`}
            onClick={() => navTo('/quiz')} title="MCQ Quiz">🧠</button>
          <button className={`${styles.navBtn} ${isActive('/algorithms') ? styles.navActive : ''}`}
            onClick={() => navTo('/algorithms')} title="Algorithms">⚡</button>
          <button className={`${styles.navBtn} ${isActive('/problems') ? styles.navActive : ''}`}
            onClick={() => navTo('/problems')} title="Problems">📋</button>
          <button className={`${styles.navBtn} ${isActive('/playground') ? styles.navActive : ''}`}
            onClick={() => navTo('/playground')} title="Playground">{'</>'}</button>
          <button className={`${styles.navBtn} ${isActive('/quick-win') ? styles.navActive : ''}`}
            onClick={() => navTo('/quick-win')} title="5-Minute Mode">🎯</button>
          <button className={`${styles.navBtn} ${isActive('/drill') ? styles.navActive : ''}`}
            onClick={() => navTo('/drill')} title="Pattern Drill">⚔</button>
          <button className={`${styles.navBtn} ${isActive('/profile') ? styles.navActive : ''}`}
            onClick={() => navTo('/profile')} title="Profile">👤</button>
          {isAdmin && (
            <button className={`${styles.navBtn} ${isActive('/admin') ? styles.navActive : ''}`}
              onClick={() => navTo('/admin')} title="Admin">⚙</button>
          )}
        </div>

        <UserBar />

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
          <input className={styles.searchInput} type="text" placeholder="🔍 Search topics…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <ul className={styles.topicList}>
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => <li key={i} className={styles.skeleton} />)
          ) : filtered.length === 0 ? (
            <li className={styles.empty}>
              {search ? 'No topics match your search' : 'No topics in this category'}
            </li>
          ) : (
            filtered.map((topic) => {
              const meta = getCategoryMeta(topic.category);
              return (
                <li key={topic.id}
                  className={`${styles.topicItem} ${selectedTopicId === topic.id ? styles.selected : ''}`}
                  onClick={() => { onTopicSelect(topic.id); onClose?.(); }}>
                  <span className={styles.topicName}>{topic.title}</span>
                  <span className={`badge ${meta.cls}`} style={{ fontSize: 9, padding: '1px 6px' }}>{meta.label}</span>
                </li>
              );
            })
          )}
        </ul>
      </aside>
    </>
  );
}