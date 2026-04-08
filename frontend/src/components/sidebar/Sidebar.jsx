import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { topicsApi, QUERY_KEYS } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { CATEGORIES, getCategoryMeta } from '../../utils/helpers';
import UserBar from './UserBar';
import styles from './Sidebar.module.css';

export default function Sidebar({ selectedTopicId, onTopicSelect }) {
  const [category, setCategory] = useState('ALL');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const { data: topics = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.topics(category),
    queryFn: () => topicsApi.getAll(category),
    staleTime: 5 * 60 * 1000, // 5 min cache
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return topics;
    const q = search.toLowerCase();
    return topics.filter((t) => t.title.toLowerCase().includes(q));
  }, [topics, search]);

  return (
    <aside className={styles.sidebar}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.logo}>
          ⟨dev<span>learn</span>⟩
        </span>
        <div className={styles.headerActions}>
          <a href="/roadmap" onClick={(e) => { e.preventDefault(); navigate('/roadmap'); }}
            className={styles.iconBtn} title="Roadmaps">🗺</a>
          <a href="/problems" onClick={(e) => { e.preventDefault(); navigate('/problems'); }}
            className={styles.iconBtn} title="All Problems">📋</a>
          <a href="/playground" onClick={(e) => { e.preventDefault(); navigate('/playground'); }}
            className={styles.iconBtn} title="Playground">{'</>'}</a>
          {isAdmin && (
            <a href="/admin" onClick={(e) => { e.preventDefault(); navigate('/admin'); }}
              className={styles.iconBtn} title="Admin">⚙</a>
          )}
        </div>
      </div>

      {/* User bar */}
      <UserBar />

      {/* Category tabs */}
      <div className={styles.catTabs}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            className={`${styles.catBtn} ${category === cat.key ? styles.active : ''}`}
            onClick={() => { setCategory(cat.key); setSearch(''); }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className={styles.searchBox}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="🔍 Search topics…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Topic list */}
      <ul className={styles.topicList}>
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <li key={i} className={styles.skeleton} />
          ))
        ) : filtered.length === 0 ? (
          <li className={styles.empty}>
            {search ? 'No topics match your search' : 'No topics in this category'}
          </li>
        ) : (
          filtered.map((topic) => {
            const meta = getCategoryMeta(topic.category);
            return (
              <li
                key={topic.id}
                className={`${styles.topicItem} ${selectedTopicId === topic.id ? styles.selected : ''}`}
                onClick={() => onTopicSelect(topic.id)}
              >
                <span className={styles.topicName}>{topic.title}</span>
                <span className={`badge ${meta.cls}`} style={{ fontSize: 9, padding: '1px 6px' }}>
                  {meta.label}
                </span>
              </li>
            );
          })
        )}
      </ul>
    </aside>
  );
}
