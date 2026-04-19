import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { resumeApi } from '../../api';
import styles from './ResumePage.module.css';

// ─── Shared upload widget ──────────────────────────────────────────────────────
function UploadZone({ onFile, accept = '.pdf', hint = 'PDF only · max 5 MB', error }) {
  const inputRef  = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback((file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) { onFile(null, 'Only PDF files are supported.'); return; }
    if (file.size > 5 * 1024 * 1024)              { onFile(null, 'File too large — maximum 5 MB.'); return; }
    onFile(file, null);
  }, [onFile]);

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  return (
    <div
      className={`${styles.dropZone} ${dragging ? styles.dropZoneDrag : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" accept={accept} className={styles.hidden}
        onChange={(e) => handleFile(e.target.files[0])} />
      <div className={styles.dropIcon}>📄</div>
      <div className={styles.dropLabel}>Drop your resume PDF here</div>
      <div className={styles.dropHint}>or click to browse · {hint}</div>
      {error && <div className={styles.errorMsg}>{error}</div>}
    </div>
  );
}

// ─── Gap Analysis mode (original feature) ─────────────────────────────────────
const STAGE_COLOR = {
  THEORY:   { color: '#94a3b8', bg: '#94a3b822' },
  EASY:     { color: '#4ade80', bg: '#4ade8022' },
  MEDIUM:   { color: '#fbbf24', bg: '#fbbf2422' },
  HARD:     { color: '#f87171', bg: '#f8717122' },
  MASTERED: { color: '#a78bfa', bg: '#a78bfa22' },
};
const CAT_ICON = { JAVA:'☕',ADVANCED_JAVA:'⚡',SPRING_BOOT:'🍃',DSA:'🎯',MYSQL:'🗄',AWS:'☁',SYSTEM_DESIGN:'🏗',TESTING:'🧪' };

function TopicCard({ item, onNavigate }) {
  const sc = STAGE_COLOR[item.stage] || STAGE_COLOR.THEORY;
  return (
    <button className={styles.topicCard} onClick={() => onNavigate(item.topicId)}>
      <div className={styles.cardTop}>
        <span className={styles.cardIcon}>{CAT_ICON[item.category] || '📚'}</span>
        <span className={styles.cardTitle}>{item.title}</span>
        <span className={styles.stageBadge} style={{ color: sc.color, background: sc.bg, borderColor: sc.color+'55' }}>{item.stage}</span>
      </div>
      {item.action && <div className={styles.cardAction}>{item.action}</div>}
    </button>
  );
}

function GapAnalysisMode({ onReset }) {
  const navigate = useNavigate();
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState(null);
  const [result,  setResult]    = useState(null);
  const [fileName, setFileName] = useState(null);

  async function runAnalysis(file) {
    setLoading(true); setError(null); setResult(null); setFileName(file.name);
    try { setResult(await resumeApi.analyze(file)); }
    catch (e) { setError(e.response?.data?.error || 'Analysis failed — please try again.'); }
    finally { setLoading(false); }
  }

  const pct = result ? Math.round((result.strengthCount / Math.max(1, result.strengthCount + result.gapCount)) * 100) : 0;

  if (loading) return (
    <div className={styles.loadingWrap}>
      <div className={styles.loadingSpinner} />
      <div className={styles.loadingTitle}>Analyzing <strong>{fileName}</strong>…</div>
      <div className={styles.loadingHint}>Extracting tech stack and comparing against your mastery map</div>
    </div>
  );

  if (!result) return (
    <UploadZone onFile={(f, err) => { if (err) setError(err); else runAnalysis(f); }} error={error} />
  );

  return (
    <>
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
          <div className={styles.progressTrack}><div className={styles.progressFill} style={{ width: `${pct}%` }} /></div>
          <span className={styles.progressPct}>{pct}%</span>
        </div>
      </div>

      {result.extractedTech?.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Extracted Tech Stack</div>
          <div className={styles.techPills}>{result.extractedTech.map(kw => <span key={kw} className={styles.techPill}>{kw}</span>)}</div>
        </div>
      )}

      {result.gaps?.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Gaps <span className={styles.sectionCount}>{result.gaps.length}</span></div>
          <p className={styles.sectionHint}>Topics on your resume that aren't mastered yet.</p>
          <div className={styles.topicGrid}>{result.gaps.map(item => <TopicCard key={item.topicId} item={item} onNavigate={id => navigate(`/?topic=${id}`)} />)}</div>
        </div>
      )}

      {result.suggestions?.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Top 10 Suggested Next Steps</div>
          <div className={styles.topicGrid}>{result.suggestions.map(item => <TopicCard key={item.topicId} item={item} onNavigate={id => navigate(`/?topic=${id}`)} />)}</div>
        </div>
      )}

      {result.strengths?.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Strengths <span className={styles.sectionCount} style={{ color: '#a78bfa' }}>{result.strengths.length}</span></div>
          <div className={styles.strengthList}>
            {result.strengths.map(item => (
              <button key={item.topicId} className={styles.strengthItem} onClick={() => navigate(`/?topic=${item.topicId}`)}>
                <span className={styles.strengthCheck}>✓</span>
                <span className={styles.strengthIcon}>{CAT_ICON[item.category] || '📚'}</span>
                <span className={styles.strengthTitle}>{item.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {result.unmapped?.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Not in DevLearn curriculum</div>
          <div className={styles.techPills}>{result.unmapped.map(kw => <span key={kw} className={`${styles.techPill} ${styles.techPillMuted}`}>{kw}</span>)}</div>
        </div>
      )}

      {result.message && <div className={styles.emptyMsg}>{result.message}</div>}
      <button className={styles.reanalyzeBtn} onClick={() => { setResult(null); setError(null); }}>Analyze another resume</button>
    </>
  );
}

// ─── Interview Prep mode ───────────────────────────────────────────────────────

const TYPE_META = {
  THEORY:       { label: 'Theory',       icon: '📖', color: '#60a5fa', bg: 'rgba(96,165,250,.12)' },
  CODING:       { label: 'Coding',       icon: '💻', color: '#4ade80', bg: 'rgba(74,222,128,.12)' },
  PROJECT:      { label: 'Project',      icon: '🚀', color: '#a78bfa', bg: 'rgba(167,139,250,.12)' },
  BEHAVIORAL:   { label: 'Behavioral',   icon: '🎤', color: '#fbbf24', bg: 'rgba(251,191,36,.12)'  },
  SYSTEM_DESIGN:{ label: 'System Design',icon: '🏗',  color: '#fb923c', bg: 'rgba(251,146,60,.12)'  },
};

const DIFF_COLOR = { Easy:'#4ade80', Medium:'#fbbf24', Hard:'#f87171' };

function ScoreBar({ score }) {
  const colors = ['#f87171','#fb923c','#fbbf24','#60a5fa','#4ade80'];
  return (
    <div className={styles.scoreBar}>
      {[1,2,3,4,5].map(n => (
        <div key={n} className={styles.scoreDot} style={{ background: n <= score ? colors[score-1] : 'var(--bg4)' }} />
      ))}
      <span className={styles.scoreNum} style={{ color: colors[score-1] }}>{score}/5</span>
    </div>
  );
}

function QuestionSession({ questions, candidateName, onFinish }) {
  const [current,    setCurrent]    = useState(0);
  const [answer,     setAnswer]     = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [evaluating, setEvaluating] = useState(false);
  const [skipped,    setSkipped]    = useState(new Set());
  const [scores,     setScores]     = useState([]);
  const [evalError,  setEvalError]  = useState(null);

  const q    = questions[current];
  const meta = TYPE_META[q?.type] || TYPE_META.THEORY;
  const total = questions.length;

  async function submitAnswer() {
    if (!answer.trim()) return;
    setEvaluating(true); setEvalError(null);
    try {
      const ev = await resumeApi.evaluateAnswer(q.question, answer, q.type, q.expectedPoints);
      setEvaluation(ev);
      setScores(prev => [...prev, { idx: current, score: ev.score, type: q.type }]);
    } catch {
      setEvalError('Evaluation failed. You can still move to the next question.');
    } finally {
      setEvaluating(false);
    }
  }

  function next() {
    setAnswer(''); setEvaluation(null); setEvalError(null);
    if (current + 1 >= total) onFinish(scores);
    else setCurrent(c => c + 1);
  }

  function skip() {
    setSkipped(s => new Set([...s, current]));
    setAnswer(''); setEvaluation(null); setEvalError(null);
    if (current + 1 >= total) onFinish(scores);
    else setCurrent(c => c + 1);
  }

  const typeBreakdown = Object.entries(
    questions.reduce((acc, q) => { acc[q.type] = (acc[q.type] || 0) + 1; return acc; }, {})
  );

  return (
    <div className={styles.sessionWrap}>
      {/* Progress header */}
      <div className={styles.sessionHeader}>
        <div className={styles.sessionMeta}>
          <span className={styles.sessionName}>{candidateName}'s Interview</span>
          <div className={styles.typeCounts}>
            {typeBreakdown.map(([type, count]) => {
              const m = TYPE_META[type] || {};
              return <span key={type} className={styles.typeCount} style={{ color: m.color }}>{m.icon} {count}</span>;
            })}
          </div>
        </div>
        <div className={styles.progressHeader}>
          <span className={styles.qCounter}>Q{current + 1} of {total}</span>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${((current) / total) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Question card */}
      <div className={styles.questionCard}>
        <div className={styles.questionMeta}>
          <span className={styles.typeBadge} style={{ color: meta.color, background: meta.bg }}>
            {meta.icon} {meta.label}
          </span>
          <span className={styles.topicLabel}>{q.topic}</span>
          <span className={styles.diffLabel} style={{ color: DIFF_COLOR[q.difficulty] || 'var(--text3)' }}>
            {q.difficulty}
          </span>
        </div>
        <p className={styles.questionText}>{q.question}</p>

        {/* Expected points (shown as hint, collapsed by default) */}
        <details className={styles.hintDetails}>
          <summary className={styles.hintSummary}>💡 Show expected key points</summary>
          <ul className={styles.hintList}>
            {(q.expectedPoints || []).map((pt, i) => <li key={i}>{pt}</li>)}
          </ul>
        </details>
      </div>

      {/* Answer area — hide if already evaluated */}
      {!evaluation && (
        <div className={styles.answerWrap}>
          <textarea
            className={styles.answerTextarea}
            placeholder={
              q.type === 'CODING'
                ? 'Write your approach, pseudocode, or Java solution…'
                : q.type === 'BEHAVIORAL'
                ? 'Use the STAR format: Situation → Task → Action → Result…'
                : 'Type your answer here…'
            }
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            rows={7}
          />
          <div className={styles.answerActions}>
            <button className={styles.skipBtn} onClick={skip}>Skip</button>
            <button
              className={styles.submitBtn}
              disabled={!answer.trim() || evaluating}
              onClick={submitAnswer}
            >
              {evaluating ? <><span className={styles.miniSpinner} /> Evaluating…</> : 'Submit Answer →'}
            </button>
          </div>
          {evalError && <div className={styles.evalError}>{evalError} <button className={styles.nextBtn} onClick={next}>Next →</button></div>}
        </div>
      )}

      {/* Evaluation result */}
      {evaluation && (
        <div className={styles.evaluationCard}>
          <div className={styles.evalHeader}>
            <span className={styles.gradeLabel} style={{
              color: { Excellent:'#4ade80',Good:'#60a5fa','Needs Work':'#fbbf24',Poor:'#f87171' }[evaluation.grade] || 'var(--text)'
            }}>{evaluation.grade}</span>
            <ScoreBar score={evaluation.score} />
          </div>

          {evaluation.strengths?.length > 0 && (
            <div className={styles.evalSection}>
              <div className={styles.evalSectionTitle}>✅ What you got right</div>
              <ul className={styles.evalList}>
                {evaluation.strengths.map((s, i) => <li key={i} className={styles.evalStrength}>{s}</li>)}
              </ul>
            </div>
          )}

          {evaluation.gaps?.length > 0 && (
            <div className={styles.evalSection}>
              <div className={styles.evalSectionTitle}>⚠️ What was missing</div>
              <ul className={styles.evalList}>
                {evaluation.gaps.map((g, i) => <li key={i} className={styles.evalGap}>{g}</li>)}
              </ul>
            </div>
          )}

          {evaluation.modelAnswer && (
            <div className={styles.evalSection}>
              <div className={styles.evalSectionTitle}>📝 Model Answer</div>
              <div className={styles.modelAnswer}>{evaluation.modelAnswer}</div>
            </div>
          )}

          {evaluation.followUp && (
            <div className={styles.followUpBox}>
              <span className={styles.followUpLabel}>Interviewer follow-up:</span>
              <span className={styles.followUpText}>"{evaluation.followUp}"</span>
            </div>
          )}

          <button className={styles.nextBtn} onClick={next}>
            {current + 1 >= total ? '🏁 See Results' : 'Next Question →'}
          </button>
        </div>
      )}
    </div>
  );
}

function InterviewResults({ questions, scores, onRestart }) {
  const avg = scores.length > 0 ? (scores.reduce((s, x) => s + x.score, 0) / scores.length).toFixed(1) : 0;
  const answered = scores.length;
  const skipped  = questions.length - answered;

  const byType = scores.reduce((acc, s) => {
    if (!acc[s.type]) acc[s.type] = [];
    acc[s.type].push(s.score);
    return acc;
  }, {});

  const gradeColor = avg >= 4.5 ? '#4ade80' : avg >= 3.5 ? '#60a5fa' : avg >= 2.5 ? '#fbbf24' : '#f87171';
  const gradeLabel = avg >= 4.5 ? 'Excellent' : avg >= 3.5 ? 'Good' : avg >= 2.5 ? 'Needs Work' : 'Keep Practicing';

  return (
    <div className={styles.resultsWrap}>
      <div className={styles.resultHero}>
        <div className={styles.resultGrade} style={{ color: gradeColor }}>{gradeLabel}</div>
        <div className={styles.resultScore} style={{ color: gradeColor }}>{avg}<span className={styles.resultScoreMax}>/5</span></div>
        <div className={styles.resultMeta}>{answered} answered · {skipped} skipped · {questions.length} total</div>
      </div>

      <div className={styles.typeBreakdown}>
        {Object.entries(byType).map(([type, s]) => {
          const m = TYPE_META[type] || {};
          const typeAvg = (s.reduce((a,b)=>a+b,0)/s.length).toFixed(1);
          return (
            <div key={type} className={styles.typeScore}>
              <span className={styles.typeScoreIcon}>{m.icon}</span>
              <div className={styles.typeScoreInfo}>
                <span className={styles.typeScoreLabel}>{m.label}</span>
                <div className={styles.typeScoreBar}>
                  <div className={styles.typeScoreBarFill} style={{ width: `${(typeAvg/5)*100}%`, background: m.color }} />
                </div>
              </div>
              <span className={styles.typeScoreNum} style={{ color: m.color }}>{typeAvg}</span>
            </div>
          );
        })}
      </div>

      <div className={styles.resultActions}>
        <button className={styles.reanalyzeBtn} onClick={onRestart}>Try Another Resume</button>
      </div>
    </div>
  );
}

function InterviewPrepMode() {
  const [step,    setStep]    = useState('upload');  // upload | generating | session | results
  const [error,   setError]   = useState(null);
  const [session, setSession] = useState(null);
  const [scores,  setScores]  = useState([]);

  async function generate(file) {
    setStep('generating'); setError(null);
    try {
      const data = await resumeApi.generateInterview(file);
      setSession(data);
      setStep('session');
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to generate interview. Please try again.');
      setStep('upload');
    }
  }

  if (step === 'generating') return (
    <div className={styles.loadingWrap}>
      <div className={styles.loadingSpinner} />
      <div className={styles.loadingTitle}>Generating your personalized interview…</div>
      <div className={styles.loadingHint}>AI is reading your resume and crafting questions across theory, coding, projects, and system design</div>
      <div className={styles.loadingSteps}>
        <span className={styles.loadingStep}>📄 Parsing resume</span>
        <span className={styles.loadingStep}>🧠 Identifying tech stack & projects</span>
        <span className={styles.loadingStep}>✍️ Writing personalized questions</span>
      </div>
    </div>
  );

  if (step === 'session' && session) return (
    <QuestionSession
      questions={session.questions}
      candidateName={session.candidateName || 'Your'}
      onFinish={(s) => { setScores(s); setStep('results'); }}
    />
  );

  if (step === 'results') return (
    <InterviewResults
      questions={session?.questions || []}
      scores={scores}
      onRestart={() => { setStep('upload'); setSession(null); setScores([]); }}
    />
  );

  return (
    <UploadZone
      onFile={(f, err) => { if (err) setError(err); else generate(f); }}
      error={error}
    />
  );
}

// ─── Landing / mode selector ───────────────────────────────────────────────────
function ModePicker({ onPick }) {
  return (
    <div className={styles.modePicker}>
      <button className={styles.modeCard} onClick={() => onPick('interview')}>
        <span className={styles.modeIcon}>🎯</span>
        <div className={styles.modeName}>AI Interview Prep</div>
        <div className={styles.modeDesc}>
          Upload your resume and get a personalized set of 20 interview questions — theory, coding, project deep-dives, behavioral, and system design — all generated by AI based on your actual experience.
        </div>
        <div className={styles.modeTags}>
          <span>Theory Q&A</span><span>Coding</span><span>Project</span><span>Behavioral</span><span>System Design</span>
        </div>
        <div className={styles.modeCta}>Start Interview →</div>
      </button>

      <button className={styles.modeCard} onClick={() => onPick('gap')}>
        <span className={styles.modeIcon}>🔍</span>
        <div className={styles.modeName}>Gap Analyzer</div>
        <div className={styles.modeDesc}>
          Upload your resume and we'll extract your tech stack, compare it against your mastery map, and show you exactly what to study next before your interview.
        </div>
        <div className={styles.modeTags}>
          <span>Skill gaps</span><span>Mastery map</span><span>Study plan</span>
        </div>
        <div className={styles.modeCta}>Analyze Resume →</div>
      </button>
    </div>
  );
}

// ─── Root page ─────────────────────────────────────────────────────────────────
export default function ResumePage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState(null);

  const modeTitle = mode === 'interview' ? 'AI Interview Prep'
                  : mode === 'gap'       ? 'Resume Gap Analyzer'
                  : 'Resume Tools';

  return (
    <div className={styles.page}>
      <div className={styles.scrollBody}>
        <div className={styles.hero}>
          <button className={styles.back} onClick={() => mode ? setMode(null) : navigate(-1)}>
            ← {mode ? 'Back' : 'Back'}
          </button>
          <h1 className={styles.title}>{modeTitle}</h1>
          {!mode && (
            <p className={styles.subtitle}>Choose a mode to get started with your interview preparation.</p>
          )}
        </div>

        <div className={styles.content}>
          {!mode && <ModePicker onPick={setMode} />}
          {mode === 'gap'       && <GapAnalysisMode onReset={() => setMode(null)} />}
          {mode === 'interview' && <InterviewPrepMode />}
        </div>
      </div>
    </div>
  );
}
