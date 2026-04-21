import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ReactFlow, Background,
  Handle, Position,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { topicsApi, gateApi, QUERY_KEYS } from '../../api';
import styles from './VisualRoadmapPage.module.css';

// ── Layout constants ──────────────────────────────────────────────────────────
const CATEGORY_ORDER = [
  'JAVA', 'ADVANCED_JAVA', 'DSA', 'SPRING_BOOT',
  'MYSQL', 'SYSTEM_DESIGN', 'TESTING', 'AWS',
];

const CATEGORY_META = {
  JAVA:          { label: 'Core Java',        color: '#f59e0b' },
  ADVANCED_JAVA: { label: 'Advanced Java',    color: '#06b6d4' },
  DSA:           { label: 'DSA',              color: '#8b5cf6' },
  SPRING_BOOT:   { label: 'Spring Boot',      color: '#22c55e' },
  MYSQL:         { label: 'MySQL',            color: '#f97316' },
  SYSTEM_DESIGN: { label: 'System Design',    color: '#ec4899' },
  TESTING:       { label: 'Testing',          color: '#14b8a6' },
  AWS:           { label: 'AWS',              color: '#64748b' },
};

// ── Gate stage → ring color ───────────────────────────────────────────────────
const STAGE_COLOR = {
  THEORY:   '#3b82f6',
  EASY:     '#eab308',
  MEDIUM:   '#f97316',
  HARD:     '#ef4444',
  MASTERED: '#22c55e',
};

// ── Root node ──────────────────────────────────────────────────────────────
function RootNode() {
  return (
    <div className={styles.rootNode}>
      <Handle type="source" position={Position.Bottom} id="b" style={{ background: '#6366f1', width: 10, height: 10 }} />
      Backend Engineer Roadmap
    </div>
  );
}

// ── Category node ──────────────────────────────────────────────────────────
function CategoryNode({ data }) {
  return (
    <div className={styles.categoryNode} style={{ borderColor: data.color, '--cat-color': data.color }}>
      <Handle type="target" position={Position.Top}    id="t" style={{ background: data.color, width: 8, height: 8 }} />
      <span className={styles.catLabel}>{data.label}</span>
      <Handle type="source" position={Position.Bottom} id="b" style={{ background: data.color, width: 8, height: 8 }} />
    </div>
  );
}

// ── Topic node ──────────────────────────────────────────────────────────────
function TopicNode({ data }) {
  const stageColor = data.stage ? STAGE_COLOR[data.stage] : null;
  const catColor   = data.catColor || '#6b7280';
  const mastered   = data.stage === 'MASTERED';
  const revision   = data.isRevision;

  const borderColor = stageColor || (revision ? '#f59e0b' : catColor);
  const bgColor = mastered
    ? 'rgba(34,197,94,0.13)'
    : revision
      ? 'rgba(245,158,11,0.10)'
      : 'rgba(255,255,255,0.03)';

  return (
    <div className={styles.topicNode} style={{ borderColor, '--cat-color': catColor, background: bgColor }} title={data.label}>
      <Handle type="target" position={Position.Top}    id="t" style={{ background: borderColor, width: 6, height: 6 }} />
      <Handle type="target" position={Position.Left}   id="l" style={{ background: borderColor, width: 6, height: 6 }} />
      <div className={styles.nodeInner}>
        {stageColor && <span className={styles.stageDot} style={{ background: stageColor }} />}
        <div className={styles.nodeBody}>
          <span className={styles.nodeTitle}>{data.label}</span>
          {data.subCategory && <span className={styles.nodeSub}>{data.subCategory}</span>}
        </div>
        {mastered  && <span className={styles.checkmark}>✓</span>}
        {revision && !mastered && <span className={styles.revisionPin}>↻</span>}
      </div>
      <Handle type="source" position={Position.Bottom} id="b" style={{ background: borderColor, width: 6, height: 6 }} />
      <Handle type="source" position={Position.Right}  id="r" style={{ background: borderColor, width: 6, height: 6 }} />
    </div>
  );
}

const NODE_TYPES = { rootNode: RootNode, categoryNode: CategoryNode, topic: TopicNode };

// ── Build tree nodes + edges ───────────────────────────────────────────────
function buildTree(topics, stages, revisionTopics) {
  const nodes = [];
  const edges = [];

  // Group & sort topics by category
  const cols = {};
  for (const t of topics) {
    if (!cols[t.category]) cols[t.category] = [];
    cols[t.category].push(t);
  }
  for (const cat of Object.keys(cols)) {
    cols[cat].sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));
  }

  // Layout constants — must match CSS node dimensions
  const ROOT_W      = 280;
  const ROOT_H      = 48;
  const CAT_W       = 200;
  const CAT_H       = 44;
  const TOPIC_W     = 240;
  const TOPIC_H     = 56;
  const TOPIC_ROW_GAP  = 12;
  const CAT_SUBTREE_GAP = 60;
  const ROOT_TO_CAT = 90;
  const CAT_TO_TOPIC = 60;

  // Total width: each category gets TOPIC_W + CAT_SUBTREE_GAP
  const totalWidth = CATEGORY_ORDER.reduce((acc, cat) => {
    return acc + TOPIC_W + CAT_SUBTREE_GAP;
  }, 0) - CAT_SUBTREE_GAP;

  // Root node — centered
  const rootX = totalWidth / 2 - ROOT_W / 2;
  nodes.push({
    id: 'root',
    type: 'rootNode',
    position: { x: rootX, y: 0 },
    data: {},
    selectable: false,
    draggable: false,
    style: { width: ROOT_W, height: ROOT_H },
  });

  let xCursor = 0;
  for (const cat of CATEGORY_ORDER) {
    const meta     = CATEGORY_META[cat] || { label: cat, color: '#6b7280' };
    const catTopics = cols[cat] || [];
    const catX     = xCursor + (TOPIC_W - CAT_W) / 2;
    const catY     = ROOT_H + ROOT_TO_CAT;

    // Category node
    nodes.push({
      id: `cat-${cat}`,
      type: 'categoryNode',
      position: { x: catX, y: catY },
      data: { label: meta.label, color: meta.color },
      selectable: false,
      draggable: false,
      style: { width: CAT_W, height: CAT_H },
    });

    // Edge: root → category
    edges.push({
      id: `root-${cat}`,
      source: 'root',
      sourceHandle: 'b',
      target: `cat-${cat}`,
      targetHandle: 't',
      type: 'smoothstep',
      style: { stroke: meta.color, strokeWidth: 2, opacity: 0.6 },
      markerEnd: { type: MarkerType.ArrowClosed, color: meta.color, width: 10, height: 10 },
    });

    // Topic nodes stacked below category
    const topicX     = xCursor;
    const topicStartY = catY + CAT_H + CAT_TO_TOPIC;

    for (const [i, t] of catTopics.entries()) {
      const topicY = topicStartY + i * (TOPIC_H + TOPIC_ROW_GAP);

      nodes.push({
        id: String(t.id),
        type: 'topic',
        position: { x: topicX, y: topicY },
        data: {
          label:       t.title,
          subCategory: t.subCategory || '',
          stage:       stages[t.id] || null,
          catColor:    meta.color,
          isRevision:  revisionTopics?.has(t.id) ?? false,
          topic:       t,
        },
        style: { width: TOPIC_W, height: TOPIC_H },
      });

      // Edge: category → first topic, then sequential
      const src    = i === 0 ? `cat-${cat}` : String(catTopics[i - 1].id);
      const srcHandle = i === 0 ? 'b' : 'b';
      edges.push({
        id:           `tree-${src}-${t.id}`,
        source:       src,
        sourceHandle: srcHandle,
        target:       String(t.id),
        targetHandle: 't',
        type:         'smoothstep',
        style:        { stroke: meta.color, strokeWidth: 1.2, opacity: i === 0 ? 0.6 : 0.35 },
        markerEnd:    { type: MarkerType.ArrowClosed, color: meta.color, width: 9, height: 9 },
      });
    }

    xCursor += TOPIC_W + CAT_SUBTREE_GAP;
  }

  return { nodes, edges };
}

// ── Detail panel — fetches full topic by ID ───────────────────────────────────
function TopicPanel({ topicId, stageSummary, isRevision, onClose, onStudy, onMarkRevision }) {
  const qc = useQueryClient();

  const { data: topic, isLoading } = useQuery({
    queryKey: QUERY_KEYS.topic(topicId),
    queryFn:  () => topicsApi.getById(topicId),
    enabled:  !!topicId,
    staleTime: 5 * 60 * 1000,
  });

  const studiedMutation = useMutation({
    mutationFn: () => gateApi.completeTheory(topicId, 'Marked as studied from visual roadmap'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.allGateStages });
      toast.success('Marked as studied!');
    },
    onError: () => toast.error('Already past theory stage or error'),
  });

  const stage      = stageSummary[topicId] || null;
  const stageColor = stage ? STAGE_COLOR[stage] : '#6b7280';

  // Reset scroll to top whenever the selected topic changes
  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [topicId]);

  return (
    <div className={styles.panel}>

      {/* Sticky top bar — always visible */}
      <div className={styles.panelTopBar}>
        <div className={styles.panelBadges}>
          <span className={styles.panelStage} style={{ background: stageColor }}>
            {stage || 'Not Started'}
          </span>
          {topic && (
            <span className={styles.panelCategory}>
              {CATEGORY_META[topic.category]?.label || topic.category}
            </span>
          )}
        </div>
        <button className={styles.panelClose} onClick={onClose}>✕</button>
      </div>

      {/* Scrollable content */}
      <div className={styles.panelScroll} ref={scrollRef}>
        {isLoading && <div className={styles.panelLoading}>Loading…</div>}

        {topic && (
          <>
            <h2 className={styles.panelTitle}>{topic.title}</h2>

            {topic.subCategory && (
              <p className={styles.panelSub}>{topic.subCategory}</p>
            )}

            {topic.description && (
              <p className={styles.panelDesc}>{topic.description}</p>
            )}

            {topic.memoryAnchor && (
              <div className={styles.panelSection}>
                <h4>Memory Anchors</h4>
                <div className={styles.pillRow}>
                  {topic.memoryAnchor
                    .split(/\n|;/)
                    .map((l) => l.trim())
                    .filter(Boolean)
                    .map((p, i) => {
                      const colonIdx = p.indexOf(': ');
                      if (colonIdx === -1) return <span key={i} className={styles.pill}>{p}</span>;
                      const key  = p.slice(0, colonIdx);
                      const rest = p.slice(colonIdx + 2);
                      return (
                        <span key={i} className={styles.pill}>
                          <strong>{key}</strong>: {rest}
                        </span>
                      );
                    })}
                </div>
              </div>
            )}

            {topic.story && (
              <div className={styles.panelSection}>
                <h4>Story</h4>
                <p className={styles.panelText}>{topic.story}</p>
              </div>
            )}

            {topic.analogy && (
              <div className={styles.panelSection}>
                <h4>Analogy</h4>
                <p className={styles.panelText}>{topic.analogy}</p>
              </div>
            )}

            {topic.firstPrinciples && (
              <div className={styles.panelSection}>
                <h4>First Principles</h4>
                <p className={styles.panelText}>{topic.firstPrinciples}</p>
              </div>
            )}

            {topic.whenToUse && (
              <div className={styles.panelSection}>
                <h4>When to Use</h4>
                <p className={styles.panelText}>{topic.whenToUse}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Sticky footer — always visible */}
      {topic && (
        <div className={styles.panelFooter}>
          <div className={styles.actionRow}>
            <button
              className={styles.studiedBtn}
              disabled={studiedMutation.isPending || !!stage}
              onClick={() => studiedMutation.mutate()}
              title={stage ? `Already at ${stage} stage` : 'Mark as studied'}
            >
              {stage ? `✓ ${stage}` : studiedMutation.isPending ? '…' : '✓ Studied'}
            </button>
            <button
              className={`${styles.revisionBtn} ${isRevision ? styles.revisionBtnActive : ''}`}
              onClick={() => onMarkRevision(topic.id)}
            >
              {isRevision ? '↻ In Revision' : '↻ Revision'}
            </button>
          </div>
          <button className={styles.studyBtn} onClick={() => onStudy(topic.id)}>
            Study This Topic →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function VisualRoadmapPage() {
  const navigate = useNavigate();
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [revisionTopics, setRevisionTopics] = useState(() => {
    try {
      const stored = localStorage.getItem('devlearn_revision_topics');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });

  const toggleRevision = useCallback((topicId) => {
    setRevisionTopics((prev) => {
      const next = new Set(prev);
      next.has(topicId) ? next.delete(topicId) : next.add(topicId);
      localStorage.setItem('devlearn_revision_topics', JSON.stringify([...next]));
      toast.success(next.has(topicId) ? 'Added to revision' : 'Removed from revision');
      return next;
    });
  }, []);

  const { data: topics = [], isLoading: topicsLoading } = useQuery({
    queryKey: QUERY_KEYS.topics('ALL'),
    queryFn:  () => topicsApi.getAll(),
    staleTime: 10 * 60 * 1000,
  });

  const { data: stages = {} } = useQuery({
    queryKey: QUERY_KEYS.allGateStages,
    queryFn:  gateApi.getAllStages,
    staleTime: 2 * 60 * 1000,
  });

  const { nodes, edges } = useMemo(
    () => buildTree(topics, stages, revisionTopics),
    [topics, stages, revisionTopics],
  );

  const onNodeClick = useCallback((_, node) => {
    if (node.type !== 'topic') return;
    setSelectedTopicId(node.data.topic.id);
  }, []);

  const onPaneClick = useCallback(() => setSelectedTopicId(null), []);

  if (topicsLoading) {
    return <div className={styles.loading}>Building roadmap…</div>;
  }

  return (
    <div className={styles.page}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate('/roadmap')}>
          ← Roadmap
        </button>
        <h1 className={styles.topTitle}>Backend Engineer Visual Roadmap</h1>
        <div className={styles.legend}>
          {Object.entries(STAGE_COLOR).map(([s, c]) => (
            <span key={s} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: c }} />
              {s}
            </span>
          ))}
          <span className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: '#374151' }} />
            Not Started
          </span>
        </div>
      </div>

      {/* Canvas */}
      <div className={styles.canvas} style={{ marginRight: selectedTopicId ? 400 : 0 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={NODE_TYPES}
          defaultViewport={{ x: 40, y: 40, zoom: 0.75 }}
          minZoom={0.15}
          maxZoom={2}
          defaultEdgeOptions={{ type: 'smoothstep' }}
        >
          <Background color="#2d3748" gap={20} size={1} />
        </ReactFlow>
      </div>

      {/* Detail panel */}
      {selectedTopicId && (
        <TopicPanel
          topicId={selectedTopicId}
          stageSummary={stages}
          isRevision={revisionTopics.has(selectedTopicId)}
          onClose={() => setSelectedTopicId(null)}
          onStudy={(id) => navigate(`/?topic=${id}`)}
          onMarkRevision={toggleRevision}
        />
      )}
    </div>
  );
}
