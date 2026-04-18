import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { userVideosApi, QUERY_KEYS } from '../../api';
import { getCategoryMeta, CATEGORIES } from '../../utils/helpers';
import { SkeletonCard } from '../../components/shared/Skeleton';
import EmptyState from '../../components/shared/EmptyState';
import styles from './VideosPage.module.css';

// ── YouTube helpers ────────────────────────────────────────────────────────────
function getYtId(url) {
  const patterns = [
    /youtu\.be\/([^?&\s]{11})/,
    /[?&]v=([^&\s]{11})/,
    /embed\/([^?&\s]{11})/,
    /shorts\/([^?&\s]{11})/,
  ];
  for (const re of patterns) {
    const m = url?.match(re);
    if (m) return m[1];
  }
  return null;
}

export default function VideosPage() {
  const navigate  = useNavigate();
  const [catFilter, setCatFilter] = useState('ALL');
  const [search, setSearch]       = useState('');

  const { data: groups = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.allVideos,
    queryFn:  userVideosApi.getAll,
    staleTime: 60 * 1000,
  });

  // Filter by category and search
  const filtered = groups.filter((g) => {
    if (catFilter !== 'ALL' && g.category !== catFilter) return false;
    if (search && !g.topicTitle.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalVideos = groups.reduce((n, g) => n + g.adminVideos.length + g.userVideos.length, 0);

  return (
    <div className={styles.page}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={() => navigate('/')}>← Home</button>
          <h1 className={styles.title}>▶ Videos</h1>
          <span className={styles.subtitle}>{totalVideos} video{totalVideos !== 1 ? 's' : ''} across {groups.length} topic{groups.length !== 1 ? 's' : ''}</span>
        </div>
        <input
          className={styles.search}
          placeholder="Search topics…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── Category filter ─────────────────────────────────────────────── */}
      <div className={styles.catBar}>
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            className={`${styles.catBtn} ${catFilter === c.key ? styles.catBtnActive : ''}`}
            onClick={() => setCatFilter(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className={styles.groups}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} className={styles.group} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="📹"
          title={search || catFilter !== 'ALL' ? 'No videos match your filter.' : 'No videos saved yet.'}
          hint={search || catFilter !== 'ALL' ? 'Try clearing your search or filter.' : 'Open any topic and go to the Videos tab to add your first link.'}
        />
      ) : (
        <div className={styles.groups}>
          {filtered.map((group) => (
            <TopicGroup
              key={group.topicId}
              group={group}
              onTopicClick={() => navigate(`/?topic=${group.topicId}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Topic group ────────────────────────────────────────────────────────────────
function TopicGroup({ group, onTopicClick }) {
  const catMeta   = getCategoryMeta(group.category);
  const allVideos = [
    ...group.adminVideos.map((v, i) => ({ ...v, type: 'admin',    label: `Video ${i + 1}` })),
    ...group.userVideos.map((v)     => ({ ...v, type: 'personal', label: v.title || 'My Video' })),
  ];

  return (
    <div className={styles.group}>
      {/* Topic heading */}
      <div className={styles.groupHeader}>
        <button className={styles.topicBtn} onClick={onTopicClick}>
          <span className={`badge ${catMeta.cls}`} style={{ fontSize: 10 }}>{catMeta.label}</span>
          <span className={styles.topicTitle}>{group.topicTitle}</span>
        </button>
        <span className={styles.videoCount}>{allVideos.length} video{allVideos.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Video card grid */}
      <div className={styles.videoGrid}>
        {allVideos.map((v, i) => {
          const vid   = getYtId(v.url);
          const thumb = vid ? `https://img.youtube.com/vi/${vid}/mqdefault.jpg` : null;
          return (
            <a
              key={i}
              href={v.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.videoCard}
            >
              {/* Thumbnail */}
              <div className={styles.thumbWrap}>
                {thumb
                  ? <img src={thumb} alt="" className={styles.thumb} />
                  : <div className={styles.thumbFallback}>▶</div>
                }
                <div className={styles.playOverlay}>▶</div>
                <span className={`${styles.typeBadge} ${v.type === 'personal' ? styles.typeBadgePersonal : styles.typeBadgeAdmin}`}>
                  {v.type === 'personal' ? '📌 Mine' : '📚 Ref'}
                </span>
              </div>

              {/* Info */}
              <div className={styles.cardInfo}>
                <span className={styles.cardLabel}>{v.label}</span>
                <span className={styles.cardTopic}>{group.topicTitle}</span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
