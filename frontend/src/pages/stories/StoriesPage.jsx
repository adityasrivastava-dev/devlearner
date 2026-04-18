import { useState, useEffect } from 'react';
import { storyApi } from '../../api';
import styles from './StoriesPage.module.css';

// ── Constants ─────────────────────────────────────────────────────────────────

const THEMES = [
  { key: 'LEADERSHIP',     label: 'Leadership',     icon: '👑', color: '#f59e0b', desc: 'Led a team, drove a decision, took charge' },
  { key: 'FAILURE',        label: 'Failure',         icon: '🔥', color: '#ef4444', desc: 'Made a mistake, learned from it' },
  { key: 'CONFLICT',       label: 'Conflict',        icon: '⚡', color: '#8b5cf6', desc: 'Disagreement with a colleague or stakeholder' },
  { key: 'OWNERSHIP',      label: 'Ownership',       icon: '🎯', color: '#3b82f6', desc: 'Took responsibility beyond your role' },
  { key: 'COLLABORATION',  label: 'Collaboration',   icon: '🤝', color: '#10b981', desc: 'Cross-team work, mentoring, helping others' },
  { key: 'INITIATIVE',     label: 'Initiative',      icon: '🚀', color: '#06b6d4', desc: 'Did something without being asked' },
  { key: 'IMPACT',         label: 'Impact',          icon: '💥', color: '#f97316', desc: 'Delivered measurable business or technical value' },
  { key: 'GROWTH',         label: 'Growth',          icon: '🌱', color: '#22c55e', desc: 'Learned something new, adapted to change' },
];

const STAR_FIELDS = [
  {
    key: 'situation',
    label: 'Situation',
    icon: '📍',
    placeholder: 'Set the context. What was happening? When? What was at stake?\n\nExample: "In Q3 2023, our payments service was experiencing intermittent failures affecting 3% of transactions during peak hours…"',
    tip: 'Be specific about the timeline and scale. Mention team size, traffic numbers, or business impact to ground the story.',
  },
  {
    key: 'task',
    label: 'Task',
    icon: '📋',
    placeholder: 'What was YOUR specific responsibility in this situation?\n\nExample: "I was the on-call engineer and owned the investigation and fix with a 4-hour SLA…"',
    tip: 'Distinguish your role from the team\'s role. Interviewers want to know what YOU specifically were accountable for.',
  },
  {
    key: 'action',
    label: 'Action',
    icon: '⚙️',
    placeholder: 'What steps did YOU take? Walk through your decision-making.\n\nExample: "First, I added distributed tracing to isolate the bottleneck. I discovered a race condition in the idempotency key logic. I wrote a targeted fix, added a regression test, and deployed to canary…"',
    tip: 'Use "I" not "we". Include technical decisions, trade-offs considered, and why you chose this approach.',
  },
  {
    key: 'result',
    label: 'Result',
    icon: '🏆',
    placeholder: 'What was the outcome? Quantify where possible.\n\nExample: "Payment failures dropped to 0.01% within 30 minutes. The fix saved an estimated ₹2.4L/day in failed transaction fees. I documented the post-mortem and presented it to the team."',
    tip: 'Numbers land harder than adjectives. Time saved, money saved, error rate reduced, users unblocked — pick the strongest metric.',
  },
];

const EMPTY_FORM = { theme: 'IMPACT', title: '', situation: '', task: '', action: '', result: '', tags: '' };

// ── Theme badge ───────────────────────────────────────────────────────────────
function ThemeBadge({ themeKey, size = 'md' }) {
  const t = THEMES.find(t => t.key === themeKey) || THEMES[6];
  return (
    <span
      className={`${styles.themeBadge} ${size === 'sm' ? styles.themeBadgeSm : ''}`}
      style={{ background: t.color + '22', color: t.color, borderColor: t.color + '44' }}
    >
      {t.icon} {t.label}
    </span>
  );
}

// ── Coverage meter ────────────────────────────────────────────────────────────
function CoverageMeter({ counts }) {
  return (
    <div className={styles.coverage}>
      <div className={styles.coverageTitle}>Theme Coverage</div>
      <div className={styles.coverageGrid}>
        {THEMES.map(t => {
          const n = counts[t.key] || 0;
          return (
            <div key={t.key} className={`${styles.coverageDot} ${n > 0 ? styles.coverageDotFilled : ''}`}
              style={n > 0 ? { borderColor: t.color, background: t.color + '22' } : {}}
              title={`${t.label}: ${n} stor${n === 1 ? 'y' : 'ies'}`}
            >
              <span>{t.icon}</span>
              {n > 1 && <span className={styles.coverageCount}>{n}</span>}
            </div>
          );
        })}
      </div>
      <div className={styles.coverageHint}>
        {Object.values(counts).filter(n => n > 0).length} / {THEMES.length} themes covered
      </div>
    </div>
  );
}

// ── Story card ────────────────────────────────────────────────────────────────
function StoryCard({ story, selected, onClick, onDelete }) {
  const snippet = story.situation || story.action || '(no content yet)';
  return (
    <div className={`${styles.storyCard} ${selected ? styles.storyCardActive : ''}`} onClick={onClick}>
      <div className={styles.storyCardHeader}>
        <ThemeBadge themeKey={story.theme} size="sm" />
        <button
          className={styles.deleteBtn}
          onClick={e => { e.stopPropagation(); onDelete(story.id); }}
          title="Delete story"
          type="button"
        >✕</button>
      </div>
      <div className={styles.storyCardTitle}>{story.title}</div>
      <div className={styles.storyCardSnippet}>
        {snippet.length > 100 ? snippet.slice(0, 100) + '…' : snippet}
      </div>
    </div>
  );
}

// ── STAR editor ───────────────────────────────────────────────────────────────
function StarEditor({ initial, onSave, onCancel, saving, polishing, onPolish, polishResult }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [activeField, setActiveField] = useState('situation');

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  function applyPolish() {
    if (!polishResult) return;
    setForm(f => ({
      ...f,
      situation: polishResult.situation || f.situation,
      task:      polishResult.task      || f.task,
      action:    polishResult.action    || f.action,
      result:    polishResult.result    || f.result,
    }));
  }

  const activeFieldMeta = STAR_FIELDS.find(f => f.key === activeField);
  const wordCount = (form[activeField] || '').split(/\s+/).filter(Boolean).length;

  return (
    <div className={styles.editor}>
      {/* Header */}
      <div className={styles.editorHeader}>
        <div className={styles.editorHeaderLeft}>
          <select
            className={styles.themeSelect}
            value={form.theme}
            onChange={e => set('theme', e.target.value)}
          >
            {THEMES.map(t => (
              <option key={t.key} value={t.key}>{t.icon} {t.label}</option>
            ))}
          </select>
          <input
            className={styles.titleInput}
            placeholder="Story title (e.g. 'Fixed critical payment bug on-call')"
            value={form.title}
            onChange={e => set('title', e.target.value)}
          />
        </div>
        <div className={styles.editorHeaderRight}>
          <button
            className={styles.polishBtn}
            onClick={onPolish}
            disabled={polishing || !form.situation}
            type="button"
            title="AI strengthens each section — adds specificity, quantification, impact"
          >
            {polishing ? <><span className={styles.spinSm} /> Polishing…</> : '✨ AI Polish'}
          </button>
        </div>
      </div>

      {/* Polish result banner */}
      {polishResult && (
        <div className={styles.polishBanner}>
          <span className={styles.polishBannerIcon}>✨</span>
          <div className={styles.polishBannerText}>
            <strong>AI Suggestion ready.</strong>
            {polishResult.tip && <> {polishResult.tip}</>}
          </div>
          <button className={styles.polishApplyBtn} onClick={applyPolish} type="button">Apply Changes</button>
        </div>
      )}

      {/* STAR tabs */}
      <div className={styles.starTabs}>
        {STAR_FIELDS.map(f => {
          const filled = !!(form[f.key] || '').trim();
          return (
            <button
              key={f.key}
              className={`${styles.starTab} ${activeField === f.key ? styles.starTabActive : ''} ${filled ? styles.starTabFilled : ''}`}
              onClick={() => setActiveField(f.key)}
              type="button"
            >
              <span>{f.icon}</span>
              <span>{f.label}</span>
              {filled && <span className={styles.starTabCheck}>✓</span>}
            </button>
          );
        })}
      </div>

      {/* Active field */}
      <div className={styles.fieldWrap}>
        <div className={styles.fieldTip}>
          <span className={styles.fieldTipIcon}>💡</span>
          {activeFieldMeta?.tip}
        </div>
        <textarea
          className={styles.starTextarea}
          placeholder={activeFieldMeta?.placeholder}
          value={form[activeField] || ''}
          onChange={e => set(activeField, e.target.value)}
          rows={8}
        />
        <div className={styles.fieldFooter}>
          <span className={styles.wordCount}>{wordCount} words</span>
          {wordCount < 30 && <span className={styles.wordHint}>Aim for 50–100 words per section</span>}
        </div>
      </div>

      {/* Tags */}
      <div className={styles.tagsRow}>
        <span className={styles.tagsLabel}>Tags:</span>
        <input
          className={styles.tagsInput}
          placeholder="e.g. on-call, production, java (comma-separated)"
          value={form.tags}
          onChange={e => set('tags', e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className={styles.editorActions}>
        <button className={styles.cancelBtn} onClick={onCancel} type="button">Cancel</button>
        <button
          className={styles.saveBtn}
          onClick={() => onSave(form)}
          disabled={saving || !form.title.trim()}
          type="button"
        >
          {saving ? <><span className={styles.spinSm} /> Saving…</> : '✓ Save Story'}
        </button>
      </div>
    </div>
  );
}

// ── Review modal — pre-interview quick view ───────────────────────────────────
function ReviewModal({ stories, onClose }) {
  const [filter, setFilter] = useState('ALL');
  const visible = filter === 'ALL' ? stories : stories.filter(s => s.theme === filter);

  return (
    <div className={styles.reviewOverlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.reviewModal}>
        <div className={styles.reviewHeader}>
          <span className={styles.reviewTitle}>📖 Pre-Interview Review</span>
          <button className={styles.reviewClose} onClick={onClose}>✕</button>
        </div>
        <div className={styles.reviewFilters}>
          <button className={`${styles.reviewFilter} ${filter === 'ALL' ? styles.reviewFilterActive : ''}`}
            onClick={() => setFilter('ALL')}>All ({stories.length})</button>
          {THEMES.filter(t => stories.some(s => s.theme === t.key)).map(t => (
            <button
              key={t.key}
              className={`${styles.reviewFilter} ${filter === t.key ? styles.reviewFilterActive : ''}`}
              onClick={() => setFilter(t.key)}
            >{t.icon} {t.label}</button>
          ))}
        </div>
        <div className={styles.reviewList}>
          {visible.map(s => (
            <div key={s.id} className={styles.reviewItem}>
              <div className={styles.reviewItemHeader}>
                <ThemeBadge themeKey={s.theme} size="sm" />
                <strong className={styles.reviewItemTitle}>{s.title}</strong>
              </div>
              {STAR_FIELDS.map(f => s[f.key] && (
                <div key={f.key} className={styles.reviewStarRow}>
                  <span className={styles.reviewStarLabel}>{f.icon} {f.label}</span>
                  <p className={styles.reviewStarText}>{s[f.key]}</p>
                </div>
              ))}
            </div>
          ))}
          {visible.length === 0 && (
            <div className={styles.reviewEmpty}>No stories for this theme yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function StoriesPage() {
  const [stories,      setStories]      = useState([]);
  const [counts,       setCounts]       = useState({});
  const [selectedId,   setSelectedId]   = useState(null);
  const [mode,         setMode]         = useState('list');   // list | new | edit
  const [saving,       setSaving]       = useState(false);
  const [polishing,    setPolishing]    = useState(false);
  const [polishResult, setPolishResult] = useState(null);
  const [showReview,   setShowReview]   = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  const selectedStory = stories.find(s => s.id === selectedId);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [list, themeData] = await Promise.all([storyApi.list(), storyApi.themes()]);
      setStories(list);
      setCounts(themeData.themes || {});
    } catch { setError('Could not load stories.'); }
    finally   { setLoading(false); }
  }

  async function handleSave(form) {
    setSaving(true);
    setError(null);
    try {
      const tags = form.tags ? JSON.stringify(form.tags.split(',').map(t => t.trim()).filter(Boolean)) : '[]';
      const payload = { ...form, tags };
      let updated;
      if (mode === 'new') {
        updated = await storyApi.create(payload);
        setStories(s => [updated, ...s]);
        setSelectedId(updated.id);
      } else {
        updated = await storyApi.update(selectedId, payload);
        setStories(s => s.map(x => x.id === selectedId ? updated : x));
      }
      const themeData = await storyApi.themes();
      setCounts(themeData.themes || {});
      setMode('list');
      setPolishResult(null);
    } catch { setError('Could not save. Please try again.'); }
    finally  { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this story?')) return;
    try {
      await storyApi.remove(id);
      setStories(s => s.filter(x => x.id !== id));
      if (selectedId === id) { setSelectedId(null); setMode('list'); }
      const themeData = await storyApi.themes();
      setCounts(themeData.themes || {});
    } catch { setError('Could not delete.'); }
  }

  async function handlePolish() {
    if (!selectedId && mode !== 'edit') return;
    setPolishing(true);
    setPolishResult(null);
    try {
      const result = await storyApi.polish(selectedId);
      setPolishResult(result);
    } catch { setError('AI polish failed. Try again.'); }
    finally  { setPolishing(false); }
  }

  function startNew() {
    setSelectedId(null);
    setPolishResult(null);
    setMode('new');
  }

  function startEdit(id) {
    setSelectedId(id);
    setPolishResult(null);
    setMode('edit');
  }

  const editorInitial = mode === 'edit' && selectedStory
    ? {
        theme:     selectedStory.theme,
        title:     selectedStory.title,
        situation: selectedStory.situation || '',
        task:      selectedStory.task      || '',
        action:    selectedStory.action    || '',
        result:    selectedStory.result    || '',
        tags:      (() => {
          try { return JSON.parse(selectedStory.tags || '[]').join(', '); } catch { return ''; }
        })(),
      }
    : null;

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.headerTitle}>📖 Interview Story Builder</h1>
          <p className={styles.headerSub}>STAR-format behavioral answers · AI-powered polish · Pre-interview review</p>
        </div>
        <div className={styles.headerRight}>
          {stories.length > 0 && (
            <button className={styles.reviewBtn} onClick={() => setShowReview(true)}>
              ▶ Pre-Interview Review
            </button>
          )}
          <button className={styles.newBtn} onClick={startNew}>+ New Story</button>
        </div>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.body}>
        {/* ── Left panel ── */}
        <div className={styles.leftPanel}>
          <CoverageMeter counts={counts} />

          {loading && <div className={styles.loadingMsg}>Loading stories…</div>}

          {!loading && stories.length === 0 && mode !== 'new' && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📖</div>
              <div className={styles.emptyTitle}>No stories yet</div>
              <p className={styles.emptyText}>
                MAANG interviews are 50% behavioral. Write your first STAR story before your next interview.
              </p>
              <button className={styles.emptyNewBtn} onClick={startNew}>Write Your First Story</button>
            </div>
          )}

          <div className={styles.storyList}>
            {stories.map(s => (
              <StoryCard
                key={s.id}
                story={s}
                selected={selectedId === s.id && mode === 'edit'}
                onClick={() => startEdit(s.id)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className={styles.rightPanel}>
          {(mode === 'new' || mode === 'edit') && (
            <StarEditor
              key={mode === 'edit' ? selectedId : 'new'}
              initial={editorInitial}
              onSave={handleSave}
              onCancel={() => { setMode('list'); setPolishResult(null); }}
              saving={saving}
              polishing={polishing}
              onPolish={mode === 'edit' ? handlePolish : null}
              polishResult={polishResult}
            />
          )}

          {mode === 'list' && !loading && stories.length > 0 && (
            <div className={styles.rightPlaceholder}>
              <div className={styles.placeholderIcon}>💬</div>
              <div className={styles.placeholderTitle}>Select a story to edit</div>
              <div className={styles.placeholderText}>or click <strong>+ New Story</strong> to write a new one</div>

              <div className={styles.starGuide}>
                <div className={styles.starGuideTitle}>The STAR Framework</div>
                {STAR_FIELDS.map(f => (
                  <div key={f.key} className={styles.starGuideRow}>
                    <span className={styles.starGuideIcon}>{f.icon}</span>
                    <div>
                      <strong>{f.label}</strong> — {f.tip}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showReview && <ReviewModal stories={stories} onClose={() => setShowReview(false)} />}
    </div>
  );
}
