import { useState, useCallback, useRef } from 'react';
import { practiceSetApi } from '../../api/index.js';
import styles from './PracticeSetPage.module.css';

const CATEGORY_META = {
  THEORY:        { label: 'Theory',        icon: '📚', color: '#6366f1' },
  CODING:        { label: 'Coding',         icon: '💻', color: '#10b981' },
  PROJECT:       { label: 'Project',        icon: '🏗️', color: '#f59e0b' },
  BEHAVIORAL:    { label: 'Behavioral',     icon: '🧠', color: '#8b5cf6' },
  SYSTEM_DESIGN: { label: 'System Design',  icon: '🏛️', color: '#06b6d4' },
};

const DIFF_COLOR = { Easy: '#10b981', Medium: '#f59e0b', Hard: '#ef4444' };

// ── Upload Zone ──────────────────────────────────────────────────────────────
function UploadZone({ onFile }) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef();

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === 'application/pdf') onFile(f);
  }, [onFile]);

  return (
    <div
      className={`${styles.uploadZone} ${drag ? styles.dragOver : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current.click()}
    >
      <input ref={inputRef} type="file" accept=".pdf" style={{ display: 'none' }}
        onChange={(e) => e.target.files[0] && onFile(e.target.files[0])} />
      <div className={styles.uploadIcon}>📄</div>
      <p className={styles.uploadTitle}>Drop your resume PDF here</p>
      <p className={styles.uploadSub}>or click to browse · PDF only</p>
    </div>
  );
}

// ── Loading Overlay ──────────────────────────────────────────────────────────
const LOAD_STEPS = [
  'Extracting resume content…',
  'Parsing your tech stack & projects…',
  'Crafting Theory questions…',
  'Building Coding questions…',
  'Generating Project & Behavioral questions…',
  'Finalising your practice set…',
];

function GeneratingView() {
  const [step, setStep] = useState(0);
  useState(() => {
    const id = setInterval(() => setStep(s => Math.min(s + 1, LOAD_STEPS.length - 1)), 4000);
    return () => clearInterval(id);
  });
  return (
    <div className={styles.generating}>
      <div className={styles.genOrb} />
      <p className={styles.genStep}>{LOAD_STEPS[step]}</p>
      <div className={styles.genDots}>
        {[0,1,2].map(i => <span key={i} className={styles.dot} style={{ animationDelay: `${i * 0.15}s` }} />)}
      </div>
    </div>
  );
}

// ── Question Card ────────────────────────────────────────────────────────────
function QuestionCard({ q, index }) {
  const [open, setOpen] = useState(false);
  const cat = CATEGORY_META[q.category] || CATEGORY_META.THEORY;
  const dc  = DIFF_COLOR[q.difficulty] || '#6366f1';

  return (
    <div className={styles.qCard} style={{ '--cat-color': cat.color, '--diff-color': dc }}>
      <button className={styles.qHeader} onClick={() => setOpen(o => !o)}>
        <span className={styles.qNum}>{index + 1}</span>
        <span className={styles.qCatBadge}>{cat.icon} {cat.label}</span>
        <span className={styles.qDiffBadge} style={{ color: dc }}>{q.difficulty}</span>
        <span className={styles.qTopicChip}>{q.topic}</span>
        <span className={styles.qTitle}>{q.question}</span>
        <span className={styles.qChevron}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className={styles.qBody}>
          <div className={styles.answerBlock}>
            <p className={styles.answerText}>{q.answer}</p>
          </div>

          {q.keyPoints?.length > 0 && (
            <div className={styles.keyPoints}>
              <p className={styles.kpLabel}>Key Points</p>
              <ul>
                {q.keyPoints.map((kp, i) => <li key={i}>{kp}</li>)}
              </ul>
            </div>
          )}

          {q.followUp && (
            <div className={styles.followUp}>
              <span className={styles.fuIcon}>💬</span>
              <span>{q.followUp}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Topic Section ────────────────────────────────────────────────────────────
function TopicSection({ topic, questions, sessionId, allQuestionsForTopic }) {
  const [loadingMore, setLoadingMore] = useState(false);
  const [extra, setExtra] = useState([]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const existing = [...questions, ...extra].map(q => q.question);
      const newQs = await practiceSetApi.more(sessionId, topic, existing);
      setExtra(prev => [...prev, ...newQs]);
    } catch {
      // silently ignore
    } finally {
      setLoadingMore(false);
    }
  };

  const all = [...questions, ...extra];

  return (
    <div className={styles.topicSection}>
      <div className={styles.topicHeader}>
        <span className={styles.topicName}>{topic}</span>
        <span className={styles.topicCount}>{all.length} questions</span>
      </div>
      <div className={styles.qList}>
        {all.map((q, i) => <QuestionCard key={q.id ?? i} q={q} index={i} />)}
      </div>
      <button className={styles.moreBtn} onClick={loadMore} disabled={loadingMore}>
        {loadingMore ? (
          <><span className={styles.miniSpinner} /> Loading 10 more…</>
        ) : (
          <>+ Load More on "{topic}"</>
        )}
      </button>
    </div>
  );
}

// ── Profile Banner ───────────────────────────────────────────────────────────
function ProfileBanner({ profile }) {
  const techStack = profile?.techStack || [];
  const projects  = profile?.projects  || [];

  return (
    <div className={styles.profileBanner}>
      <div className={styles.profileLeft}>
        <span className={styles.profileName}>{profile?.name || 'Candidate'}</span>
        <span className={styles.profileRole}>{profile?.currentRole} · {profile?.yearsOfExperience} yrs</span>
      </div>
      <div className={styles.profileChips}>
        {techStack.slice(0,6).map((t, i) => (
          <span key={i} className={styles.techChip}>{t.tech}</span>
        ))}
        {projects.slice(0,3).map((p, i) => (
          <span key={i} className={styles.projChip}>🏗️ {p.name}</span>
        ))}
      </div>
    </div>
  );
}

// ── Category Filter ──────────────────────────────────────────────────────────
function CategoryFilter({ active, onChange, counts }) {
  const cats = ['ALL', ...Object.keys(CATEGORY_META)];
  return (
    <div className={styles.catFilter}>
      {cats.map(c => {
        const meta = CATEGORY_META[c];
        const cnt  = c === 'ALL' ? Object.values(counts).reduce((a,b) => a+b, 0) : (counts[c] || 0);
        return (
          <button
            key={c}
            className={`${styles.catBtn} ${active === c ? styles.catActive : ''}`}
            style={active === c && meta ? { '--cat-color': meta.color } : {}}
            onClick={() => onChange(c)}
          >
            {meta ? `${meta.icon} ${meta.label}` : 'All'} <span className={styles.catCnt}>{cnt}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function PracticeSetPage() {
  const [phase, setPhase]   = useState('upload'); // upload | generating | study
  const [error, setError]   = useState(null);
  const [data, setData]     = useState(null);     // { sessionId, profile, questions, total }
  const [catFilter, setCatFilter] = useState('ALL');

  const handleFile = async (file) => {
    setError(null);
    setPhase('generating');
    try {
      const result = await practiceSetApi.generate(file);
      setData(result);
      setPhase('study');
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Failed to generate practice set.');
      setPhase('upload');
    }
  };

  // Group questions by topic, filtered by category
  const grouped = {};
  if (data?.questions) {
    const filtered = catFilter === 'ALL'
      ? data.questions
      : data.questions.filter(q => q.category === catFilter);

    for (const q of filtered) {
      const t = q.topic || 'General';
      if (!grouped[t]) grouped[t] = [];
      grouped[t].push(q);
    }
  }

  const catCounts = {};
  if (data?.questions) {
    for (const q of data.questions) {
      catCounts[q.category] = (catCounts[q.category] || 0) + 1;
    }
  }

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Practice Set</h1>
          <p className={styles.subtitle}>
            AI-generated Q&amp;A from your resume — all answers visible, go as deep as you want
          </p>
        </div>
        {phase === 'study' && (
          <button className={styles.resetBtn} onClick={() => { setPhase('upload'); setData(null); }}>
            ↩ New Resume
          </button>
        )}
      </div>

      {/* ── Upload ── */}
      {phase === 'upload' && (
        <div className={styles.uploadWrap}>
          <UploadZone onFile={handleFile} />
          {error && <p className={styles.errorMsg}>{error}</p>}
          <div className={styles.featureList}>
            {[
              ['📚', 'Theory',        '12 deep-dive conceptual Q&As'],
              ['💻', 'Coding',        '7 problem-solving questions'],
              ['🏗️', 'Project',       '5 questions about YOUR projects'],
              ['🧠', 'Behavioral',    '4 STAR-format behavioral Q&As'],
              ['🏛️', 'System Design', '4 architecture discussion Q&As'],
            ].map(([icon, label, desc]) => (
              <div key={label} className={styles.featureCard}>
                <span className={styles.featureIcon}>{icon}</span>
                <span className={styles.featureLabel}>{label}</span>
                <span className={styles.featureDesc}>{desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Generating ── */}
      {phase === 'generating' && <GeneratingView />}

      {/* ── Study Mode ── */}
      {phase === 'study' && data && (
        <>
          <ProfileBanner profile={data.profile} />

          <div className={styles.studyMeta}>
            <span className={styles.totalBadge}>{data.total} questions generated</span>
          </div>

          <CategoryFilter active={catFilter} onChange={setCatFilter} counts={catCounts} />

          <div className={styles.topicList}>
            {Object.entries(grouped).map(([topic, qs]) => (
              <TopicSection
                key={topic}
                topic={topic}
                questions={qs}
                sessionId={data.sessionId}
                allQuestionsForTopic={qs}
              />
            ))}
            {Object.keys(grouped).length === 0 && (
              <p className={styles.emptyMsg}>No questions in this category.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
