import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { systemDesignApi } from '../../api';
import toast from 'react-hot-toast';
import styles from './SystemDesignPage.module.css';

// ── Node catalogue ────────────────────────────────────────────────────────────
const NODE_TYPES = {
  CLIENT:       { icon: '💻', label: 'Client',         color: '#3b82f6', desc: 'Browser / Mobile' },
  LB:           { icon: '⚖️', label: 'Load Balancer',  color: '#f59e0b', desc: 'Traffic distribution' },
  API_GW:       { icon: '🚪', label: 'API Gateway',    color: '#8b5cf6', desc: 'Routing + rate-limit' },
  SERVER:       { icon: '🖥️', label: 'App Server',     color: '#10b981', desc: 'Business logic' },
  DB_SQL:       { icon: '🗄️', label: 'SQL Database',   color: '#ef4444', desc: 'MySQL / Postgres' },
  DB_NOSQL:     { icon: '📦', label: 'NoSQL DB',       color: '#ec4899', desc: 'MongoDB / DynamoDB' },
  CACHE:        { icon: '⚡', label: 'Cache',           color: '#f97316', desc: 'Redis / Memcached' },
  QUEUE:        { icon: '📨', label: 'Message Queue',  color: '#6366f1', desc: 'Kafka / RabbitMQ' },
  CDN:          { icon: '🌐', label: 'CDN',            color: '#14b8a6', desc: 'Edge cache / delivery' },
  STORAGE:      { icon: '🗂️', label: 'Object Store',   color: '#84cc16', desc: 'S3 / GCS' },
  MICROSERVICE: { icon: '🔷', label: 'Microservice',   color: '#06b6d4', desc: 'Domain service' },
  AUTH:         { icon: '🔐', label: 'Auth Service',   color: '#d946ef', desc: 'JWT / OAuth2' },
};

const PALETTE_GROUPS = [
  { label: 'Client',    types: ['CLIENT', 'CDN'] },
  { label: 'Gateway',   types: ['LB', 'API_GW'] },
  { label: 'Compute',   types: ['SERVER', 'MICROSERVICE', 'AUTH'] },
  { label: 'Storage',   types: ['DB_SQL', 'DB_NOSQL', 'CACHE', 'STORAGE'] },
  { label: 'Async',     types: ['QUEUE'] },
];

const NODE_W = 148;
const NODE_H = 62;

function genId() { return Math.random().toString(36).slice(2, 9); }

// ── Templates ─────────────────────────────────────────────────────────────────
const TEMPLATES = {
  urlShortener: {
    label: '🔗 URL Shortener',
    nodes: [
      { key: 'client',  type: 'CLIENT',  x: 40,  y: 200, label: 'Browser' },
      { key: 'cdn',     type: 'CDN',     x: 240, y: 80,  label: 'CDN' },
      { key: 'lb',      type: 'LB',      x: 240, y: 280, label: 'Load Balancer' },
      { key: 'api',     type: 'API_GW',  x: 460, y: 180, label: 'API Gateway' },
      { key: 'svc',     type: 'SERVER',  x: 680, y: 80,  label: 'Shortener Service' },
      { key: 'redir',   type: 'SERVER',  x: 680, y: 280, label: 'Redirect Service' },
      { key: 'cache',   type: 'CACHE',   x: 920, y: 80,  label: 'Cache (Redis)' },
      { key: 'db',      type: 'DB_SQL',  x: 920, y: 280, label: 'URL Database' },
    ],
    edges: [
      { from: 'client', to: 'cdn',   label: 'static' },
      { from: 'client', to: 'lb',    label: 'HTTPS' },
      { from: 'lb',     to: 'api',   label: '' },
      { from: 'api',    to: 'svc',   label: 'create' },
      { from: 'api',    to: 'redir', label: 'resolve' },
      { from: 'svc',    to: 'cache', label: 'write' },
      { from: 'svc',    to: 'db',    label: 'persist' },
      { from: 'redir',  to: 'cache', label: 'read' },
      { from: 'redir',  to: 'db',    label: 'fallback' },
    ],
  },
  twitterFeed: {
    label: '🐦 Social Feed',
    nodes: [
      { key: 'client',   type: 'CLIENT',       x: 40,  y: 260, label: 'Mobile / Web' },
      { key: 'cdn',      type: 'CDN',          x: 40,  y: 80,  label: 'CDN' },
      { key: 'gw',       type: 'API_GW',       x: 260, y: 260, label: 'API Gateway' },
      { key: 'user',     type: 'MICROSERVICE', x: 480, y: 100, label: 'User Service' },
      { key: 'tweet',    type: 'MICROSERVICE', x: 480, y: 260, label: 'Tweet Service' },
      { key: 'feed',     type: 'MICROSERVICE', x: 480, y: 420, label: 'Feed Service' },
      { key: 'queue',    type: 'QUEUE',        x: 720, y: 260, label: 'Kafka' },
      { key: 'cache',    type: 'CACHE',        x: 960, y: 100, label: 'Feed Cache' },
      { key: 'db_user',  type: 'DB_SQL',       x: 720, y: 100, label: 'User DB' },
      { key: 'db_tweet', type: 'DB_NOSQL',     x: 960, y: 260, label: 'Tweet Store' },
      { key: 'storage',  type: 'STORAGE',      x: 960, y: 420, label: 'Media (S3)' },
    ],
    edges: [
      { from: 'client', to: 'cdn',      label: 'media' },
      { from: 'client', to: 'gw',       label: 'API' },
      { from: 'gw',     to: 'user',     label: '' },
      { from: 'gw',     to: 'tweet',    label: '' },
      { from: 'gw',     to: 'feed',     label: '' },
      { from: 'user',   to: 'db_user',  label: '' },
      { from: 'tweet',  to: 'queue',    label: 'publish' },
      { from: 'tweet',  to: 'storage',  label: 'media' },
      { from: 'queue',  to: 'feed',     label: 'fan-out' },
      { from: 'feed',   to: 'cache',    label: 'write' },
      { from: 'feed',   to: 'db_tweet', label: '' },
    ],
  },
  ecommerce: {
    label: '🛒 E-Commerce',
    nodes: [
      { key: 'client',   type: 'CLIENT',       x: 40,  y: 260, label: 'Customer' },
      { key: 'lb',       type: 'LB',           x: 240, y: 260, label: 'Load Balancer' },
      { key: 'auth',     type: 'AUTH',         x: 460, y: 80,  label: 'Auth Service' },
      { key: 'catalog',  type: 'MICROSERVICE', x: 460, y: 220, label: 'Catalog Service' },
      { key: 'order',    type: 'MICROSERVICE', x: 460, y: 360, label: 'Order Service' },
      { key: 'payment',  type: 'MICROSERVICE', x: 460, y: 500, label: 'Payment Service' },
      { key: 'queue',    type: 'QUEUE',        x: 700, y: 360, label: 'Order Queue' },
      { key: 'cache',    type: 'CACHE',        x: 700, y: 220, label: 'Product Cache' },
      { key: 'db_prod',  type: 'DB_SQL',       x: 940, y: 220, label: 'Product DB' },
      { key: 'db_order', type: 'DB_SQL',       x: 940, y: 360, label: 'Order DB' },
      { key: 'notif',    type: 'MICROSERVICE', x: 700, y: 500, label: 'Notification' },
    ],
    edges: [
      { from: 'client',  to: 'lb',       label: 'HTTPS' },
      { from: 'lb',      to: 'auth',     label: '' },
      { from: 'lb',      to: 'catalog',  label: '' },
      { from: 'lb',      to: 'order',    label: '' },
      { from: 'catalog', to: 'cache',    label: 'read' },
      { from: 'cache',   to: 'db_prod',  label: 'miss' },
      { from: 'order',   to: 'queue',    label: 'emit' },
      { from: 'order',   to: 'db_order', label: '' },
      { from: 'order',   to: 'payment',  label: 'charge' },
      { from: 'queue',   to: 'notif',    label: 'email/SMS' },
    ],
  },
};

// ── Edge path helpers ─────────────────────────────────────────────────────────
function getEdgePath(from, to) {
  const x1 = from.x + NODE_W;
  const y1 = from.y + NODE_H / 2;
  const x2 = to.x;
  const y2 = to.y + NODE_H / 2;
  const cp = Math.max(Math.abs(x2 - x1) * 0.55, 70);
  return `M ${x1} ${y1} C ${x1 + cp} ${y1}, ${x2 - cp} ${y2}, ${x2} ${y2}`;
}

function edgeMidpoint(from, to) {
  const x1 = from.x + NODE_W, y1 = from.y + NODE_H / 2;
  const x2 = to.x,            y2 = to.y  + NODE_H / 2;
  return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 - 8 };
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SystemDesignPage() {
  const navigate = useNavigate();

  const [nodes,       setNodes]       = useState([]);
  const [edges,       setEdges]       = useState([]);
  const [selected,    setSelected]    = useState(null);   // { type:'node'|'edge', id }
  const [connectMode, setConnectMode] = useState(null);   // fromNodeId
  const [mousePos,    setMousePos]    = useState({ x: 0, y: 0 });
  const [designName,  setDesignName]  = useState('Untitled Design');
  const [editingName, setEditingName] = useState(false);
  const [savedDesigns,setSavedDesigns]= useState([]);
  const [showSaved,   setShowSaved]   = useState(false);
  const [dirty,       setDirty]       = useState(false);
  const [saving,      setSaving]      = useState(false);

  const canvasRef = useRef(null);
  const dragRef   = useRef(null);  // { id, offsetX, offsetY }
  const savedId   = useRef(null);  // backend id of current design

  // Load saved designs list
  useEffect(() => {
    systemDesignApi.list().then(setSavedDesigns).catch(() => {});
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e) {
      if ((e.key === 'Delete' || e.key === 'Backspace') &&
          !['INPUT','TEXTAREA'].includes(e.target.tagName)) {
        deleteSelected();
      }
      if (e.key === 'Escape') { setConnectMode(null); setSelected(null); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // ── Add node from palette ──────────────────────────────────────────────────
  const addNode = useCallback((type) => {
    const canvas = canvasRef.current;
    const cx = canvas ? canvas.scrollLeft + canvas.clientWidth  / 2 - NODE_W / 2 : 300;
    const cy = canvas ? canvas.scrollTop  + canvas.clientHeight / 2 - NODE_H / 2 : 200;
    const j  = () => (Math.random() - 0.5) * 80;
    setNodes(prev => [...prev, {
      id: genId(), type, label: NODE_TYPES[type].label, x: Math.round(cx + j()), y: Math.round(cy + j()),
    }]);
    setDirty(true);
  }, []);

  // ── Apply template ─────────────────────────────────────────────────────────
  function applyTemplate(key) {
    const t = TEMPLATES[key];
    const idMap = {};
    const ns = t.nodes.map(n => {
      const id = genId();
      idMap[n.key] = id;
      return { id, type: n.type, x: n.x, y: n.y, label: n.label || NODE_TYPES[n.type].label };
    });
    const es = t.edges.map(e => ({
      id: genId(), fromId: idMap[e.from], toId: idMap[e.to], label: e.label || '',
    }));
    setNodes(ns); setEdges(es); setSelected(null); setConnectMode(null); setDirty(true);
    savedId.current = null;
  }

  // ── Node drag ─────────────────────────────────────────────────────────────
  function handleNodeMouseDown(e, nodeId) {
    e.stopPropagation();
    if (connectMode) {
      if (connectMode !== nodeId) {
        setEdges(prev => [...prev, { id: genId(), fromId: connectMode, toId: nodeId, label: '' }]);
        setDirty(true);
      }
      setConnectMode(null);
      return;
    }
    const rect = canvasRef.current.getBoundingClientRect();
    const node = nodes.find(n => n.id === nodeId);
    dragRef.current = {
      id: nodeId,
      offsetX: (e.clientX - rect.left + canvasRef.current.scrollLeft) - node.x,
      offsetY: (e.clientY - rect.top  + canvasRef.current.scrollTop)  - node.y,
    };
    setSelected({ type: 'node', id: nodeId });
  }

  function handleCanvasMouseMove(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + canvasRef.current.scrollLeft;
    const y = e.clientY - rect.top  + canvasRef.current.scrollTop;
    setMousePos({ x, y });
    if (dragRef.current) {
      const { id, offsetX, offsetY } = dragRef.current;
      setNodes(prev => prev.map(n =>
        n.id === id ? { ...n, x: Math.round(x - offsetX), y: Math.round(y - offsetY) } : n
      ));
      setDirty(true);
    }
  }

  function handleCanvasMouseUp() { dragRef.current = null; }

  function handleCanvasClick(e) {
    if (connectMode) { setConnectMode(null); return; }
    setSelected(null);
  }

  // ── Delete selected ────────────────────────────────────────────────────────
  function deleteSelected() {
    if (!selected) return;
    if (selected.type === 'node') {
      setNodes(prev => prev.filter(n => n.id !== selected.id));
      setEdges(prev => prev.filter(e => e.fromId !== selected.id && e.toId !== selected.id));
    } else {
      setEdges(prev => prev.filter(e => e.id !== selected.id));
    }
    setSelected(null); setDirty(true);
  }

  // ── Inline label edit ──────────────────────────────────────────────────────
  function updateNodeLabel(id, label) {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, label } : n));
    setDirty(true);
  }
  function updateEdgeLabel(id, label) {
    setEdges(prev => prev.map(e => e.id === id ? { ...e, label } : e));
    setDirty(true);
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  async function saveDesign() {
    setSaving(true);
    const canvasData = JSON.stringify({ nodes, edges });
    try {
      if (savedId.current) {
        await systemDesignApi.update(savedId.current, { name: designName, canvasData });
        toast.success('Design saved');
      } else {
        const res = await systemDesignApi.create({ name: designName, canvasData });
        savedId.current = res.id;
        toast.success('Design saved');
      }
      setDirty(false);
      const list = await systemDesignApi.list();
      setSavedDesigns(list);
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  }

  // ── Load design ────────────────────────────────────────────────────────────
  async function loadDesign(id, name) {
    try {
      const d = await systemDesignApi.get(id);
      const parsed = JSON.parse(d.canvasData || '{}');
      setNodes(parsed.nodes || []);
      setEdges(parsed.edges || []);
      setDesignName(name);
      savedId.current = id;
      setDirty(false);
      setShowSaved(false);
      toast.success(`Loaded "${name}"`);
    } catch {
      toast.error('Failed to load design');
    }
  }

  async function deleteDesign(id, e) {
    e.stopPropagation();
    await systemDesignApi.remove(id);
    setSavedDesigns(prev => prev.filter(d => d.id !== id));
    if (savedId.current === id) { savedId.current = null; setDirty(false); }
    toast.success('Deleted');
  }

  // ── SVG helpers ────────────────────────────────────────────────────────────
  const tempEdgeSrc = nodes.find(n => n.id === connectMode);

  return (
    <div className={styles.page}>

      {/* ── Toolbar ── */}
      <header className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <button className={styles.backBtn} onClick={() => navigate('/')}>← Home</button>
          <div className={styles.titleWrap}>
            {editingName ? (
              <input
                autoFocus
                className={styles.nameInput}
                value={designName}
                onChange={(e) => setDesignName(e.target.value)}
                onBlur={() => setEditingName(false)}
                onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
              />
            ) : (
              <span className={styles.designName} onClick={() => setEditingName(true)} title="Click to rename">
                {designName} {dirty && <span className={styles.dirtyDot} />}
              </span>
            )}
          </div>
        </div>

        <div className={styles.toolbarCenter}>
          {/* Templates */}
          {Object.entries(TEMPLATES).map(([key, t]) => (
            <button key={key} className={styles.templateBtn} onClick={() => applyTemplate(key)}>
              {t.label}
            </button>
          ))}
        </div>

        <div className={styles.toolbarRight}>
          {nodes.length > 0 && (
            <button className={styles.clearBtn} onClick={() => { setNodes([]); setEdges([]); setSelected(null); setConnectMode(null); setDirty(true); }}>
              Clear
            </button>
          )}
          <button className={styles.savedBtn} onClick={() => setShowSaved(!showSaved)}>
            📂 My Designs {savedDesigns.length > 0 && <span className={styles.badge}>{savedDesigns.length}</span>}
          </button>
          <button className={`${styles.saveBtn} ${saving ? styles.saving : ''}`} onClick={saveDesign} disabled={saving}>
            {saving ? 'Saving…' : '💾 Save'}
          </button>
        </div>
      </header>

      {/* ── Saved Designs Dropdown ── */}
      {showSaved && (
        <div className={styles.savedPanel}>
          <div className={styles.savedHeader}>
            <span>My Saved Designs</span>
            <button className={styles.savedClose} onClick={() => setShowSaved(false)}>✕</button>
          </div>
          {savedDesigns.length === 0 ? (
            <p className={styles.savedEmpty}>No designs saved yet.</p>
          ) : savedDesigns.map(d => (
            <div key={d.id} className={styles.savedItem} onClick={() => loadDesign(d.id, d.name)}>
              <span className={styles.savedItemName}>{d.name}</span>
              <span className={styles.savedItemDate}>{d.updatedAt ? new Date(d.updatedAt).toLocaleDateString() : ''}</span>
              <button className={styles.savedItemDel} onClick={(e) => deleteDesign(d.id, e)}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* ── Body ── */}
      <div className={styles.body}>

        {/* ── Palette ── */}
        <aside className={styles.palette}>
          <div className={styles.paletteTitle}>Components</div>
          {PALETTE_GROUPS.map(group => (
            <div key={group.label} className={styles.paletteGroup}>
              <div className={styles.paletteGroupLabel}>{group.label}</div>
              {group.types.map(type => {
                const meta = NODE_TYPES[type];
                return (
                  <button
                    key={type}
                    className={styles.paletteItem}
                    style={{ '--node-color': meta.color }}
                    onClick={() => addNode(type)}
                    title={meta.desc}
                  >
                    <span className={styles.paletteIcon}>{meta.icon}</span>
                    <div className={styles.paletteText}>
                      <div className={styles.paletteLabel}>{meta.label}</div>
                      <div className={styles.paletteDesc}>{meta.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}

          {/* Help */}
          <div className={styles.help}>
            <p><kbd>Click</kbd> palette to add</p>
            <p><kbd>Drag</kbd> nodes to move</p>
            <p><kbd>→</kbd> on node to connect</p>
            <p><kbd>Del</kbd> to delete selected</p>
            <p><kbd>Esc</kbd> to cancel</p>
          </div>
        </aside>

        {/* ── Canvas ── */}
        <div
          ref={canvasRef}
          className={`${styles.canvasWrap} ${connectMode ? styles.connectCursor : ''}`}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onClick={handleCanvasClick}
        >
          <div className={styles.canvas}>

            {/* SVG layer for edges */}
            <svg className={styles.edgeSvg}>
              <defs>
                <marker id="arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="var(--border2, #334155)" />
                </marker>
                <marker id="arrow-sel" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="#f87171" />
                </marker>
                <marker id="arrow-conn" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="#4ade80" />
                </marker>
              </defs>

              {/* Existing edges */}
              {edges.map(edge => {
                const from = nodes.find(n => n.id === edge.fromId);
                const to   = nodes.find(n => n.id === edge.toId);
                if (!from || !to) return null;
                const d    = getEdgePath(from, to);
                const mid  = edgeMidpoint(from, to);
                const isSel = selected?.type === 'edge' && selected?.id === edge.id;
                return (
                  <g key={edge.id}>
                    {/* Fat invisible hitbox */}
                    <path d={d} fill="none" stroke="transparent" strokeWidth={18}
                      style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
                      onClick={(e) => { e.stopPropagation(); setSelected({ type: 'edge', id: edge.id }); }}
                    />
                    <path
                      d={d} fill="none"
                      stroke={isSel ? '#f87171' : 'var(--border2, #334155)'}
                      strokeWidth={isSel ? 2.5 : 1.5}
                      markerEnd={isSel ? 'url(#arrow-sel)' : 'url(#arrow)'}
                    />
                    {/* Edge label */}
                    {isSel ? (
                      <foreignObject x={mid.x - 50} y={mid.y - 12} width={100} height={24}>
                        <input
                          className={styles.edgeLabelInput}
                          defaultValue={edge.label}
                          onBlur={(e) => updateEdgeLabel(edge.id, e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                          onClick={(ev) => ev.stopPropagation()}
                          autoFocus
                          placeholder="label…"
                        />
                      </foreignObject>
                    ) : edge.label ? (
                      <text x={mid.x} y={mid.y} textAnchor="middle"
                        fill="var(--text2)" fontSize="10" className={styles.edgeLabel}>
                        {edge.label}
                      </text>
                    ) : null}
                  </g>
                );
              })}

              {/* Temporary connection line */}
              {connectMode && tempEdgeSrc && (
                <line
                  x1={tempEdgeSrc.x + NODE_W} y1={tempEdgeSrc.y + NODE_H / 2}
                  x2={mousePos.x} y2={mousePos.y}
                  stroke="#4ade80" strokeWidth={1.5} strokeDasharray="6 4"
                  markerEnd="url(#arrow-conn)"
                />
              )}
            </svg>

            {/* Nodes */}
            {nodes.map(node => {
              const meta    = NODE_TYPES[node.type] || NODE_TYPES.SERVER;
              const isSel   = selected?.type === 'node' && selected?.id === node.id;
              const isConnSrc = connectMode === node.id;
              return (
                <div
                  key={node.id}
                  className={`${styles.node} ${isSel ? styles.nodeSelected : ''} ${isConnSrc ? styles.nodeConnSrc : ''} ${connectMode && !isConnSrc ? styles.nodeConnTarget : ''}`}
                  style={{ left: node.x, top: node.y, '--nc': meta.color }}
                  onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                >
                  <div className={styles.nodeColorBar} />
                  <div className={styles.nodeBody}>
                    <span className={styles.nodeIcon}>{meta.icon}</span>
                    <div className={styles.nodeText}>
                      {isSel && !connectMode ? (
                        <input
                          className={styles.nodeLabelInput}
                          value={node.label}
                          onChange={(e) => updateNodeLabel(node.id, e.target.value)}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div className={styles.nodeLabel}>{node.label}</div>
                      )}
                      <div className={styles.nodeDesc}>{meta.desc}</div>
                    </div>
                  </div>

                  {/* Connect button (shows on selected) */}
                  {isSel && !connectMode && (
                    <button
                      className={styles.connectBtn}
                      onMouseDown={(e) => { e.stopPropagation(); setConnectMode(node.id); setSelected(null); }}
                      title="Connect to another node"
                    >→</button>
                  )}

                  {/* Delete button */}
                  {isSel && !connectMode && (
                    <button
                      className={styles.deleteNodeBtn}
                      onMouseDown={(e) => { e.stopPropagation(); deleteSelected(); }}
                      title="Delete (Del)"
                    >✕</button>
                  )}
                </div>
              );
            })}

            {/* Empty hint */}
            {nodes.length === 0 && (
              <div className={styles.emptyHint}>
                <div className={styles.emptyIcon}>🏗️</div>
                <p className={styles.emptyTitle}>Click a component to add it</p>
                <p className={styles.emptyDesc}>or load a template from the toolbar</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Info bar ── */}
        {(selected || connectMode) && (
          <div className={styles.infoBar}>
            {connectMode && (
              <span className={styles.infoConnect}>
                🔗 Click any node to connect from <b>{nodes.find(n => n.id === connectMode)?.label}</b> — Esc to cancel
              </span>
            )}
            {selected?.type === 'edge' && !connectMode && (
              <span className={styles.infoEdge}>
                ✏️ Click the label to edit it — <kbd>Del</kbd> to remove edge
              </span>
            )}
            {selected?.type === 'node' && !connectMode && (
              <span className={styles.infoNode}>
                ✏️ Edit label inline — click <b>→</b> to connect — <kbd>Del</kbd> to delete
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
