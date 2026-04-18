import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { resumeApi } from '../../api';
import styles from './ResumePage.module.css';

const STAGE_COLOR = {
  THEORY:   { color: '#94a3b8', bg: '#94a3b822' },
  EASY:     { color: '#4ade80', bg: '#4ade8022' },
  MEDIUM:   { color: '#fbbf24', bg: '#fbbf2422' },
  HARD:     { color: '#f87171', bg: '#f8717122' },
  MASTERED: { color: '#a78bfa', bg: '#a78bfa22' },
};

const CAT_ICON = {
  JAVA: '☕', ADVANCED_JAVA: '⚡', SPRING_BOOT: '🍃',
  DSA: '🎯', MYSQL: '🗄', AWS: '☁', SYSTEM_DESIGN: '🏗', TESTING: '🧪',
};

function TopicCard({ item, onNavigate }) {
  const sc = STAGE_COLOR[item.stage] || STAGE_COLOR.THEORY;
  return (
    <button className={styles.topicCard} onClick={() => onNavigate(item.topicId)}>
      <div className={styles.cardTop}>
        <span className={styles.cardIcon}>{CAT_ICON[item.category] || '📚'}</span>
        <span className={styles.cardTitle}>{item.title}</span>
        <span className={styles.stageBadge} style={{ color: sc.color, background: sc.bg, borderColor: sc.color + '55' }}>
          {item.stage}
        </span>
      </div>
      {item.action && <div className={styles.cardAction}>{item.action}</div>}
    </button>
  );
}

export default function ResumePage() {
  const navigate  = useNavigate();
  const inputRef  = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [result,   setResult]   = useState(null);
  const [fileName, setFileName] = useState(null);

  async function runAnalysis(file) {
    setLoading(true);
    setError(null);
    setResult(null);
    setFileName(file.name);
    try {
      const data = await resumeApi.analyze(file);
      setResult(data);
    } catch (e) {
      setError(e.response?.data?.error || 'Analysis failed — please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleFile(file) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are supported.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large — maximum 5 MB.');
      return;
    }
    runAnalysis(file);
  }

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, []); // eslint-disable-line

  function navToTopic(topicId) {
    navigate(`/?topic=${topicId}`);
  }

  const pct = result
    ? Math.round((result.strengthCount / Math.max(1, result.strengthCount + result.gapCount)) * 100)
    : 0;

  return (
      <div className={styles.page}>
        <div className={styles.scrollBody}>

          {/* ── Hero ── */}
          <div className={styles.hero}>
            <button className={styles.back} onClick={() => navigate(-1)}>← Back</button>
            <h1 className={styles.title}>Resume Gap Analyzer</h1>
            <p className={styles.subtitle}>
              Upload your resume PDF — we'll extract your tech stack and compare it against your mastery map.
            </p>
          </div>

          <div className={styles.content}>

            {/* ── Upload zone ── */}
            {!loading && !result && (
              <div
                className={`${styles.dropZone} ${dragging ? styles.dropZoneDrag : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf"
                  className={styles.hidden}
                  onChange={(e) => handleFile(e.target.files[0])}
                />
                <div className={styles.dropIcon}>📄</div>
                <div className={styles.dropLabel}>Drop your resume PDF here</div>
                <div className={styles.dropHint}>or click to browse · max 5 MB · PDF only</div>
                {error && <div className={styles.errorMsg}>{error}</div>}
              </div>
            )}

            {/* ── Loading ── */}
            {loading && (
              <div className={styles.loadingWrap}>
                <div className={styles.spinner} />
                <div className={styles.loadingText}>Analyzing <strong>{fileName}</strong>…</div>
              </div>
            )}

            {/* ── Results ── */}
            {result && !loading && (
              <>
                {/* Summary bar */}
                <div className={styles.summaryCard}>
                  <div className={styles.summaryRow}>
                    <div className={styles.pill} style={{ borderColor: '#60a5fa55' }}>
                      <span className={styles.pillNum}>{result.totalFound}</span>
                      <span className={styles.pillLabel}>Tech found</span>
                    </div>
                    <div className={styles.pill} style={{ borderColor: '#4ade8055' }}>
                      <span className={styles.pillNum} style={{ color: '#4ade80' }}>{result.strengthCount}</span>
                      <span className={styles.pillLabel}>Mastered</span>
                    </div>
                    <div className={styles.pill} style={{ borderColor: '#f8717155' }}>
                      <span className={styles.pillNum} style={{ color: '#f87171' }}>{result.gapCount}</span>
                      <span className={styles.pillLabel}>Gaps</span>
                    </div>
                  </div>

                  <div className={styles.progressRow}>
                    <span className={styles.progressLabel}>Mastery coverage</span>
                    <div className={styles.progressTrack}>
                      <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                    </div>
                    <span className={styles.progressPct}>{pct}%</span>
                  </div>
                </div>

                {/* Extracted tech pills */}
                <div className={styles.section}>
                  <div className={styles.sectionTitle}>Extracted Tech Stack</div>
                  <div className={styles.techPills}>
                    {result.extractedTech.map((kw) => (
                      <span key={kw} className={styles.techPill}>{kw}</span>
                    ))}
                  </div>
                </div>

                {/* Gaps */}
                {result.gaps.length > 0 && (
                  <div className={styles.section}>
                    <div className={styles.sectionTitle}>
                      Gaps <span className={styles.sectionCount}>{result.gaps.length}</span>
                    </div>
                    <p className={styles.sectionHint}>Topics on your resume that aren't mastered yet.</p>
                    <div className={styles.topicGrid}>
                      {result.gaps.map((item) => (
                        <TopicCard key={item.topicId} item={item} onNavigate={navToTopic} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {result.suggestions.length > 0 && (
                  <div className={styles.section}>
                    <div className={styles.sectionTitle}>Top 10 Suggested Next Steps</div>
                    <div className={styles.topicGrid}>
                      {result.suggestions.map((item) => (
                        <TopicCard key={item.topicId} item={item} onNavigate={navToTopic} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Strengths */}
                {result.strengths.length > 0 && (
                  <div className={styles.section}>
                    <div className={styles.sectionTitle}>
                      Strengths <span className={styles.sectionCount} style={{ color: '#a78bfa' }}>{result.strengths.length}</span>
                    </div>
                    <div className={styles.strengthList}>
                      {result.strengths.map((item) => (
                        <button key={item.topicId} className={styles.strengthItem} onClick={() => navToTopic(item.topicId)}>
                          <span className={styles.strengthCheck}>✓</span>
                          <span className={styles.strengthIcon}>{CAT_ICON[item.category] || '📚'}</span>
                          <span className={styles.strengthTitle}>{item.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Unmapped */}
                {result.unmapped?.length > 0 && (
                  <div className={styles.section}>
                    <div className={styles.sectionTitle}>Not in DevLearn curriculum</div>
                    <div className={styles.techPills}>
                      {result.unmapped.map((kw) => (
                        <span key={kw} className={`${styles.techPill} ${styles.techPillMuted}`}>{kw}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* No keywords found */}
                {result.message && (
                  <div className={styles.emptyMsg}>{result.message}</div>
                )}

                <button className={styles.reanalyzeBtn} onClick={() => { setResult(null); setError(null); }}>
                  Analyze another resume
                </button>
              </>
            )}

          </div>
        </div>
      </div>
  );
}
