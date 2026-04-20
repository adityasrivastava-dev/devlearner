import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { smartInterviewApi } from '../../api';
import styles from './SmartInterviewPage.module.css';

// ─── Constants ─────────────────────────────────────────────────────────────────
const PHASES = ['INTRO', 'THEORY', 'PROJECT', 'CODING', 'SYSTEM_DESIGN', 'BEHAVIORAL', 'CLOSING'];
const PHASE_LABEL = {
  INTRO: 'Intro', THEORY: 'Theory', PROJECT: 'Project',
  CODING: 'Coding', SYSTEM_DESIGN: 'System Design', BEHAVIORAL: 'Behavioral', CLOSING: 'Closing',
};
const PHASE_COLOR = {
  INTRO: '#60a5fa', THEORY: '#818cf8', PROJECT: '#a78bfa',
  CODING: '#4ade80', SYSTEM_DESIGN: '#fb923c', BEHAVIORAL: '#fbbf24', CLOSING: '#f472b6',
};
const SCORE_COLOR = { 5:'#4ade80', 4:'#60a5fa', 3:'#fbbf24', 2:'#fb923c', 1:'#f87171' };
const GRADE_COLOR = { Excellent:'#4ade80', Good:'#60a5fa', 'Needs Work':'#fbbf24', 'Keep Practicing':'#f87171' };

// ─── Speech hooks ──────────────────────────────────────────────────────────────

// Text-to-Speech: speak a string, returns a cancel fn
function useTTS() {
  const [enabled, setEnabled] = useState(true);
  const utterRef = useRef(null);

  const speak = useCallback((text) => {
    if (!enabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.95;
    utt.pitch = 1.05;
    // Prefer a natural English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang.startsWith('en') && v.localService);
    if (preferred) utt.voice = preferred;
    utterRef.current = utt;
    window.speechSynthesis.speak(utt);
  }, [enabled]);

  const cancel = useCallback(() => {
    window.speechSynthesis?.cancel();
  }, []);

  const toggle = useCallback(() => {
    window.speechSynthesis?.cancel();
    setEnabled(e => !e);
  }, []);

  return { speak, cancel, toggle, enabled };
}

// Speech-to-Text: returns { listening, start, stop, supported }
function useSTT(onTranscript) {
  const recogRef = useRef(null);
  const [listening, setListening] = useState(false);
  const supported = typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const start = useCallback(() => {
    if (!supported || listening) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SR();
    r.lang = 'en-US';
    r.interimResults = true;
    r.continuous = true;
    recogRef.current = r;

    let finalTranscript = '';
    r.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalTranscript += e.results[i][0].transcript + ' ';
        else interim = e.results[i][0].transcript;
      }
      onTranscript(finalTranscript + interim);
    };
    r.onerror = () => setListening(false);
    r.onend   = () => setListening(false);
    r.start();
    setListening(true);
  }, [supported, listening, onTranscript]);

  const stop = useCallback(() => {
    recogRef.current?.stop();
    setListening(false);
  }, []);

  return { listening, start, stop, supported };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function useTimer() {
  const [seconds, setSeconds] = useState(0);
  const active = useRef(false);
  useEffect(() => {
    active.current = true;
    const id = setInterval(() => { if (active.current) setSeconds(s => s + 1); }, 1000);
    return () => { active.current = false; clearInterval(id); };
  }, []);
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function ScoreDots({ score }) {
  return (
    <div className={styles.scoreDots}>
      {[1,2,3,4,5].map(n => (
        <div key={n} className={styles.scoreDot}
          style={{ background: n <= score ? SCORE_COLOR[score] || '#60a5fa' : 'var(--bg4)' }} />
      ))}
      <span className={styles.scoreNum} style={{ color: SCORE_COLOR[score] || '#60a5fa' }}>{score}/5</span>
    </div>
  );
}

// ─── Step 1: Setup / Upload ────────────────────────────────────────────────────
function SetupStep({ onStart }) {
  const inputRef = useRef(null);
  const [dragging,  setDragging]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [loadPhase, setLoadPhase] = useState(0);

  const LOAD_MESSAGES = [
    '📄 Parsing your resume…',
    '🧠 Analyzing tech stack, projects & experience…',
    '🎯 Building your personalized question set…',
    '🤝 Preparing your interviewer Alex…',
  ];

  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => setLoadPhase(p => Math.min(p + 1, LOAD_MESSAGES.length - 1)), 3500);
    return () => clearInterval(id);
  }, [loading]);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) { setError('Only PDF files are supported.'); return; }
    if (file.size > 5 * 1024 * 1024)              { setError('File too large — max 5 MB.'); return; }

    setLoading(true); setError(null); setLoadPhase(0);
    try {
      const data = await smartInterviewApi.start(file);
      onStart(data);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to analyze resume. Please try again.');
      setLoading(false);
    }
  }, [onStart]);

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  if (loading) return (
    <div className={styles.loadingRoom}>
      <div className={styles.loadingOrb} />
      <div className={styles.loadingTitle}>Preparing your interview…</div>
      <div className={styles.loadingMessages}>
        {LOAD_MESSAGES.map((msg, i) => (
          <div key={i} className={`${styles.loadingMsg} ${i <= loadPhase ? styles.loadingMsgActive : ''}`}>
            {msg}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={styles.setupWrap}>
      <div className={styles.setupHero}>
        <div className={styles.heroIcon}>🧠</div>
        <h1 className={styles.heroTitle}>Smart AI Interview Engine</h1>
        <p className={styles.heroSubtitle}>
          Upload your resume. Our AI interviewer Alex reads every line — your projects, tech stack,
          achievements — and conducts a real adaptive interview that evolves based on your answers.
        </p>
        <div className={styles.heroFeatures}>
          <div className={styles.heroFeature}><span>🎯</span> Personalized to YOUR resume</div>
          <div className={styles.heroFeature}><span>🔄</span> Adaptive — harder when you're strong, easier when you struggle</div>
          <div className={styles.heroFeature}><span>🤖</span> Both Groq + Gemini AI for maximum intelligence</div>
          <div className={styles.heroFeature}><span>📊</span> 20 questions covering Theory, Coding, Projects, Behavioral & System Design</div>
        </div>
      </div>

      <div
        className={`${styles.dropZone} ${dragging ? styles.dropZoneDrag : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept=".pdf" className={styles.hidden}
          onChange={e => handleFile(e.target.files[0])} />
        <div className={styles.dropIcon}>📄</div>
        <div className={styles.dropLabel}>Drop your resume PDF here</div>
        <div className={styles.dropHint}>or click to browse · PDF only · max 5 MB</div>
        {error && <div className={styles.dropError}>{error}</div>}
      </div>
    </div>
  );
}

// ─── Profile banner shown after upload ────────────────────────────────────────
function ProfileBanner({ profile }) {
  const techStack = Array.isArray(profile?.techStack) ? profile.techStack.slice(0, 6) : [];
  const projects  = Array.isArray(profile?.projects)  ? profile.projects.slice(0, 3)  : [];
  return (
    <div className={styles.profileBanner}>
      <div className={styles.profileName}>{profile?.name || 'Candidate'}</div>
      <div className={styles.profileRole}>{profile?.currentRole} · {profile?.yearsOfExperience}y exp</div>
      <div className={styles.profileTech}>
        {techStack.map((t, i) => (
          <span key={i} className={styles.techChip}
            style={{ '--level-color': t.level === 'Advanced' ? '#4ade80' : t.level === 'Intermediate' ? '#fbbf24' : '#94a3b8' }}>
            {t.tech}
          </span>
        ))}
      </div>
      {projects.length > 0 && (
        <div className={styles.profileProjects}>
          {projects.map((p, i) => (
            <span key={i} className={styles.projectChip}>🚀 {p.name}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Evaluation panel ─────────────────────────────────────────────────────────
function EvalPanel({ evaluation }) {
  if (!evaluation) return null;
  const { score, briefFeedback, pointsHit = [], pointsMissed = [] } = evaluation;
  return (
    <div className={styles.evalPanel}>
      <div className={styles.evalHeader}>
        <ScoreDots score={score} />
        <span className={styles.evalFeedback}>{briefFeedback}</span>
      </div>
      <div className={styles.evalDetails}>
        {pointsHit.length > 0 && (
          <div className={styles.evalSection}>
            {pointsHit.map((p, i) => <div key={i} className={styles.evalHit}>✓ {p}</div>)}
          </div>
        )}
        {pointsMissed.length > 0 && (
          <div className={styles.evalSection}>
            {pointsMissed.map((p, i) => <div key={i} className={styles.evalMiss}>✗ {p}</div>)}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className={styles.typingWrap}>
      <div className={styles.interviewerAvatar}>A</div>
      <div className={styles.typingBubble}>
        <span className={styles.dot} /><span className={styles.dot} /><span className={styles.dot} />
      </div>
      <span className={styles.typingLabel}>Alex is thinking…</span>
    </div>
  );
}

// ─── Interview room ────────────────────────────────────────────────────────────
function InterviewRoom({ session, onComplete }) {
  const timer = useTimer();
  const scrollRef    = useRef(null);
  const textareaRef  = useRef(null);

  const [messages,   setMessages]   = useState([
    { role: 'interviewer', content: session.firstQuestion, id: 0 }
  ]);
  const [answer,     setAnswer]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [evaluations,setEvaluations]= useState({});  // msgId → eval
  const [qCount,     setQCount]     = useState(0);
  const [phase,      setPhase]      = useState('INTRO');
  const [complete,   setComplete]   = useState(false);
  const [skipped,    setSkipped]    = useState(new Set());

  // Speech
  const tts = useTTS();
  const stt = useSTT(useCallback((transcript) => {
    setAnswer(transcript);
  }, []));

  // Speak the first question on mount
  useEffect(() => {
    tts.speak(session.firstQuestion);
    return () => tts.cancel();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sessionId = session.sessionId;
  const profile   = session.profile;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function submitAnswer(skipMode = false) {
    const text = skipMode ? '[skipped — no answer provided]' : answer.trim();
    if (!text || submitting) return;

    const candidateId = messages.length;
    setMessages(prev => [...prev, { role: 'candidate', content: skipMode ? '(skipped)' : answer.trim(), id: candidateId, skipped: skipMode }]);
    setAnswer('');
    setSubmitting(true);

    // Add typing indicator
    const typingId = candidateId + 1;
    setMessages(prev => [...prev, { role: 'typing', id: typingId }]);

    try {
      const data = await smartInterviewApi.respond(sessionId, text);
      setQCount(data.questionCount);
      setPhase(data.phase || 'THEORY');

      // Remove typing, add AI question + store eval
      const aiMsgId = typingId;
      setMessages(prev => prev.filter(m => m.id !== typingId).concat(
        { role: 'interviewer', content: data.nextQuestion, id: aiMsgId }
      ));
      tts.speak(data.nextQuestion);
      if (data.evaluation && !skipMode) {
        setEvaluations(prev => ({ ...prev, [candidateId]: data.evaluation }));
      }

      if (data.isComplete) {
        setComplete(true);
        setTimeout(() => onComplete(sessionId), 2500);
      }
    } catch (e) {
      setMessages(prev => prev.filter(m => m.id !== typingId).concat(
        { role: 'interviewer', content: 'I apologize — there was a connection issue. Could you repeat your answer?', id: typingId, error: true }
      ));
    } finally {
      setSubmitting(false);
      textareaRef.current?.focus();
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submitAnswer();
  };

  const phaseIdx = PHASES.indexOf(phase);

  return (
    <div className={styles.interviewRoom}>

      {/* Top bar */}
      <div className={styles.topBar}>
        <div className={styles.interviewerInfo}>
          <div className={styles.avatarSm}>A</div>
          <div>
            <div className={styles.interviewerName}>Alex · Senior Engineer · MAANG</div>
            <div className={styles.interviewerRole}>AI Adaptive Interviewer</div>
          </div>
        </div>

        {/* Phase progress */}
        <div className={styles.phaseBar}>
          {PHASES.slice(0, -1).map((p, i) => (
            <div key={p} className={`${styles.phaseStep} ${i < phaseIdx ? styles.phaseDone : i === phaseIdx ? styles.phaseCurrent : ''}`}
              style={{ '--phase-color': PHASE_COLOR[p] }}>
              <div className={styles.phaseStepDot} />
              <span className={styles.phaseStepLabel}>{PHASE_LABEL[p]}</span>
            </div>
          ))}
        </div>

        <div className={styles.topStats}>
          <button
            className={`${styles.speakerBtn} ${tts.enabled ? styles.speakerOn : styles.speakerOff}`}
            onClick={tts.toggle}
            title={tts.enabled ? 'Mute Alex' : 'Unmute Alex'}
          >
            {tts.enabled ? '🔊' : '🔇'}
          </button>
          <span className={styles.qStat}>Q{qCount + 1}<span className={styles.qTotal}>/20</span></span>
          <span className={styles.timerStat}>⏱ {timer}</span>
        </div>
      </div>

      {/* Profile strip */}
      <ProfileBanner profile={profile} />

      {/* Conversation */}
      <div className={styles.conversation} ref={scrollRef}>
        {messages.map(msg => {
          if (msg.role === 'typing') return <TypingIndicator key={msg.id} />;

          if (msg.role === 'interviewer') return (
            <div key={msg.id} className={styles.interviewerMsg}>
              <div className={styles.interviewerAvatar}>A</div>
              <div className={styles.bubble} style={{ '--bubble-accent': PHASE_COLOR[phase] }}>
                <div className={styles.bubbleText}>{msg.content}</div>
                {msg.error && <div className={styles.bubbleError}>Connection issue</div>}
              </div>
            </div>
          );

          // Candidate message + evaluation below it
          const eval_ = evaluations[msg.id];
          return (
            <div key={msg.id} className={styles.candidateBlock}>
              <div className={styles.candidateMsg}>
                <div className={`${styles.candidateBubble} ${msg.skipped ? styles.skippedBubble : ''}`}>
                  {msg.content}
                </div>
              </div>
              {eval_ && <EvalPanel evaluation={eval_} />}
            </div>
          );
        })}

        {complete && (
          <div className={styles.completeOverlay}>
            <div className={styles.completeIcon}>🎉</div>
            <div className={styles.completeText}>Interview complete! Generating your report…</div>
          </div>
        )}
      </div>

      {/* Answer input */}
      {!complete && (
        <div className={styles.answerBar}>
          <div className={styles.phaseTag} style={{ color: PHASE_COLOR[phase], borderColor: PHASE_COLOR[phase] + '55' }}>
            {PHASE_LABEL[phase]}
          </div>
          <div className={styles.answerInputWrap}>
            <textarea
              ref={textareaRef}
              className={styles.answerInput}
              placeholder={
                phase === 'CODING'        ? 'Write your approach, pseudocode, or Java solution… (Ctrl+Enter to submit)' :
                phase === 'BEHAVIORAL'    ? 'Use STAR format: Situation → Task → Action → Result… (Ctrl+Enter to submit)' :
                phase === 'SYSTEM_DESIGN' ? 'Think out loud — mention components, trade-offs, scale considerations… (Ctrl+Enter to submit)' :
                'Type your answer… (Ctrl+Enter to submit)'
              }
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              onKeyDown={handleKey}
              rows={4}
              disabled={submitting}
            />
            <div className={styles.answerActions}>
              {stt.supported && (
                <button
                  className={`${styles.micBtn} ${stt.listening ? styles.micActive : ''}`}
                  onClick={stt.listening ? stt.stop : stt.start}
                  disabled={submitting}
                  title={stt.listening ? 'Stop recording' : 'Speak your answer'}
                >
                  {stt.listening ? (
                    <><span className={styles.micPulse} />Stop</>
                  ) : (
                    '🎤 Speak'
                  )}
                </button>
              )}
              <button className={styles.skipBtn} onClick={() => submitAnswer(true)} disabled={submitting}>
                Skip
              </button>
              <button className={styles.submitBtn} onClick={() => submitAnswer(false)}
                disabled={!answer.trim() || submitting}>
                {submitting
                  ? <><span className={styles.miniSpin} /> Evaluating…</>
                  : 'Submit Answer →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 3: Summary ───────────────────────────────────────────────────────────
function SummaryView({ sessionId, onRestart }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    smartInterviewApi.getSummary(sessionId)
      .then(d => { setSummary(d); setLoading(false); })
      .catch(e => { setError(e.response?.data?.error || 'Failed to load summary.'); setLoading(false); });
  }, [sessionId]);

  if (loading) return (
    <div className={styles.summaryLoading}>
      <div className={styles.loadingOrb} />
      <div className={styles.loadingTitle}>Generating your performance report…</div>
      <div className={styles.loadingHint}>Gemini AI is analyzing your full interview…</div>
    </div>
  );

  if (error) return (
    <div className={styles.summaryError}>
      <div>⚠️ {error}</div>
      <button className={styles.restartBtn} onClick={onRestart}>Start New Interview</button>
    </div>
  );

  const overallScore = Number(summary.overallScore || 0).toFixed(1);
  const grade  = summary.grade || 'Good';
  const gc     = GRADE_COLOR[grade] || '#60a5fa';
  const phaseScores   = summary.phaseScores   || {};
  const strengths     = summary.strengths     || [];
  const gaps          = summary.gaps          || [];
  const studyPlan     = summary.studyPlan     || [];
  const topicBreakdown= summary.topicBreakdown|| [];

  return (
    <div className={styles.summaryWrap}>
      {/* Hero score */}
      <div className={styles.summaryHero}>
        <div className={styles.summaryGrade} style={{ color: gc }}>{grade}</div>
        <div className={styles.summaryScore} style={{ color: gc }}>
          {overallScore}<span className={styles.summaryScoreMax}>/5</span>
        </div>
        <div className={styles.summaryName}>{summary.candidateName}</div>
        <p className={styles.summarySummary}>{summary.summary}</p>
        <div className={styles.summaryMeta}>
          {summary.totalQuestionsAnswered} questions answered
        </div>
      </div>

      {/* Phase scores */}
      {Object.keys(phaseScores).length > 0 && (
        <div className={styles.summaryCard}>
          <div className={styles.summaryCardTitle}>Performance by Phase</div>
          {Object.entries(phaseScores).map(([phase, score]) => {
            const s = Number(score).toFixed(1);
            const pct = (Number(score) / 5) * 100;
            const color = PHASE_COLOR[phase] || '#818cf8';
            return (
              <div key={phase} className={styles.phaseScoreRow}>
                <span className={styles.phaseScoreName} style={{ color }}>{PHASE_LABEL[phase] || phase}</span>
                <div className={styles.phaseScoreTrack}>
                  <div className={styles.phaseScoreFill} style={{ width: `${pct}%`, background: color }} />
                </div>
                <span className={styles.phaseScoreVal} style={{ color }}>{s}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Strengths + Gaps */}
      <div className={styles.summaryGrid}>
        {strengths.length > 0 && (
          <div className={styles.summaryCard}>
            <div className={styles.summaryCardTitle}>Strengths</div>
            {strengths.map((s, i) => (
              <div key={i} className={styles.strengthItem}>
                <span className={styles.strengthIcon}>✓</span>{s}
              </div>
            ))}
          </div>
        )}
        {gaps.length > 0 && (
          <div className={styles.summaryCard}>
            <div className={styles.summaryCardTitle}>Areas to Improve</div>
            {gaps.map((g, i) => (
              <div key={i} className={styles.gapItem}>
                <span className={styles.gapIcon}>△</span>{g}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Topic breakdown */}
      {topicBreakdown.length > 0 && (
        <div className={styles.summaryCard}>
          <div className={styles.summaryCardTitle}>Topic-by-Topic Breakdown</div>
          <div className={styles.topicGrid}>
            {topicBreakdown.map((t, i) => {
              const sc = Number(t.score) || 3;
              const color = SCORE_COLOR[sc] || '#fbbf24';
              return (
                <div key={i} className={styles.topicItem}>
                  <div className={styles.topicItemHeader}>
                    <span className={styles.topicName}>{t.topic}</span>
                    <span className={styles.topicScore} style={{ color }}>{sc}/5</span>
                  </div>
                  {t.note && <div className={styles.topicNote}>{t.note}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Study plan */}
      {studyPlan.length > 0 && (
        <div className={styles.summaryCard}>
          <div className={styles.summaryCardTitle}>📚 Your Personalized Study Plan</div>
          {studyPlan.map((item, i) => (
            <div key={i} className={styles.studyItem}>
              <span className={styles.studyNum}>{i + 1}</span>
              <span className={styles.studyText}>{item}</span>
            </div>
          ))}
        </div>
      )}

      {/* Hiring suggestion */}
      {summary.hiringSuggestion && (
        <div className={styles.hiringSuggestion}>
          <span className={styles.hiringLabel}>Interviewer's Take:</span>
          <span className={styles.hiringText}>"{summary.hiringSuggestion}"</span>
        </div>
      )}

      <button className={styles.restartBtn} onClick={onRestart}>Start New Interview</button>
    </div>
  );
}

// ─── Root page ─────────────────────────────────────────────────────────────────
export default function SmartInterviewPage() {
  const navigate = useNavigate();
  const [step,    setStep]    = useState('setup');   // setup | interview | summary
  const [session, setSession] = useState(null);
  const [doneId,  setDoneId]  = useState(null);

  const handleStart = (data) => {
    setSession(data);
    setStep('interview');
  };

  const handleComplete = (sessionId) => {
    setDoneId(sessionId);
    setStep('summary');
  };

  const handleRestart = () => {
    setStep('setup');
    setSession(null);
    setDoneId(null);
  };

  return (
    <div className={styles.page}>
      <div className={styles.topNav}>
        <button className={styles.backBtn} onClick={() => step === 'setup' ? navigate(-1) : handleRestart()}>
          {step === 'setup' ? '← Back' : '← New Interview'}
        </button>
        <div className={styles.navTitle}>
          {step === 'setup' ? 'Smart AI Interview' : step === 'interview' ? 'Live Interview' : 'Interview Report'}
        </div>
        <div style={{ width: 100 }} />
      </div>

      <div className={styles.body}>
        {step === 'setup'     && <SetupStep   onStart={handleStart} />}
        {step === 'interview' && session && (
          <InterviewRoom session={session} onComplete={handleComplete} />
        )}
        {step === 'summary'   && doneId && (
          <SummaryView sessionId={doneId} onRestart={handleRestart} />
        )}
      </div>
    </div>
  );
}
