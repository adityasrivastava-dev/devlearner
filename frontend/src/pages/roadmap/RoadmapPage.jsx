import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { roadmapsApi, topicsApi, QUERY_KEYS } from '../../api';
import toast from 'react-hot-toast';
import styles from './RoadmapPage.module.css';

export default function RoadmapPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formName, setFormName] = useState('');

  const { data: roadmaps = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.roadmaps,
    queryFn: roadmapsApi.getAll,
    staleTime: 2 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (name) => roadmapsApi.create({ name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.roadmaps });
      toast.success('Roadmap created!');
      setIsCreating(false);
      setFormName('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => roadmapsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.roadmaps });
      setSelected(null);
      toast.success('Roadmap deleted');
    },
  });

  function startRoadmap(rm) {
    if (!rm.topics?.length) { toast.error('This roadmap has no topics yet'); return; }
    const topicIds = rm.topics.map((t) => t.id);
    navigate(`/?topic=${topicIds[0]}&rmId=${rm.id}&rmName=${encodeURIComponent(rm.name)}&rmTopics=${topicIds.join(',')}`);
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>← Back</button>
        <h1 className={styles.heading}>🗺 Roadmaps</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setIsCreating(true)}>+ New Roadmap</button>
      </div>

      <div className={styles.body}>
        {/* Create form */}
        {isCreating && (
          <div className={styles.createCard}>
            <input
              className="input"
              placeholder="Roadmap name, e.g. 'Java Backend Engineer'"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && formName && createMutation.mutate(formName)}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary btn-sm" disabled={!formName || createMutation.isPending}
                onClick={() => createMutation.mutate(formName)}>
                {createMutation.isPending ? 'Creating…' : 'Create'}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setIsCreating(false); setFormName(''); }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className={styles.loading}><span className="spinner" />Loading roadmaps…</div>
        ) : roadmaps.length === 0 && !isCreating ? (
          <div className={styles.empty}>
            <span>🗺</span>
            <h3>No roadmaps yet</h3>
            <p>Create a custom learning path to guide your study.</p>
            <button className="btn btn-primary" onClick={() => setIsCreating(true)}>+ Create Roadmap</button>
          </div>
        ) : (
          <div className={styles.grid}>
            {roadmaps.map((rm) => (
              <div
                key={rm.id}
                className={`${styles.card} ${selected?.id === rm.id ? styles.selectedCard : ''}`}
                onClick={() => setSelected(rm)}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.cardName}>{rm.name}</div>
                  <div className={styles.cardMeta}>{rm.topics?.length || 0} topics</div>
                </div>
                {rm.topics?.length > 0 && (
                  <div className={styles.topicPills}>
                    {rm.topics.slice(0, 5).map((t) => (
                      <span key={t.id} className={styles.topicPill}>{t.title}</span>
                    ))}
                    {rm.topics.length > 5 && (
                      <span className={styles.topicPill} style={{ color: 'var(--text3)' }}>
                        +{rm.topics.length - 5} more
                      </span>
                    )}
                  </div>
                )}
                <div className={styles.cardActions} onClick={(e) => e.stopPropagation()}>
                  <button className="btn btn-primary btn-sm" onClick={() => startRoadmap(rm)}>
                    ▶ Start
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => window.confirm(`Delete "${rm.name}"?`) && deleteMutation.mutate(rm.id)}
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
