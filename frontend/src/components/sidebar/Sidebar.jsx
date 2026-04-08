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

        <div className={styles.header}>
          <button className={styles.logoBtn} onClick={() => { navTo('/'); onTopicSelect?.(null); }} title="Dashboard">
            <span className={styles.logo}>⟨dev<span>learn</span>⟩</span>
          </button>
          <div className={styles.headerActions}>
            <button className={`${styles.iconBtn} ${isHome && !selectedTopicId ? styles.iconActive : ''}`}
              onClick={() => { navTo('/'); onTopicSelect?.(null); }} title="Dashboard">⌂</button>
            <button className={`${styles.iconBtn} ${isActive('/roadmap') ? styles.iconActive : ''}`}
              onClick={() => navTo('/roadmap')} title="Roadmaps">🗺</button>
            <button className={`${styles.iconBtn} ${isActive('/quiz') ? styles.iconActive : ''}`}
              onClick={() => navTo('/quiz')} title="MCQ Quiz">🧠</button>
            <button className={`${styles.iconBtn} ${isActive('/problems') ? styles.iconActive : ''}`}
              onClick={() => navTo('/problems')} title="All Problems">📋</button>
            <button className={`${styles.iconBtn} ${isActive('/playground') ? styles.iconActive : ''}`}
              onClick={() => navTo('/playground')} title="Playground">{'</>'}</button>
            {isAdmin && (
              <button className={`${styles.iconBtn} ${isActive('/admin') ? styles.iconActive : ''}`}
                onClick={() => navTo('/admin')} title="Admin">⚙</button>
            )}
            <button className={`${styles.iconBtn} ${styles.closeBtn}`} onClick={onClose} title="Close">✕</button>
          </div>
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