import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './PomodoroWidget.module.css';

// ── Constants ─────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'devlearn_pomodoro';

const PHASES = {
  WORK:        { label: 'Focus',       icon: '🍅', duration: 25 * 60, color: '#ef4444' },
  SHORT_BREAK: { label: 'Short Break', icon: '☕', duration:  5 * 60, color: '#10b981' },
  LONG_BREAK:  { label: 'Long Break',  icon: '🌴', duration: 15 * 60, color: '#3b82f6' },
};

const POMODOROS_BEFORE_LONG = 4;

// ── Chime via Web Audio API (no external file needed) ─────────────────────────
function playChime(type = 'work') {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const freqs = type === 'work' ? [523, 659, 784] : [784, 659, 523]; // C-E-G up or down
    freqs.forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.start(t);
      osc.stop(t + 0.5);
    });
  } catch { /* audio blocked — silently ignore */ }
}

// ── Persistence helpers ───────────────────────────────────────────────────────
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    // Reset daily count if last saved on a different day
    const today = new Date().toDateString();
    if (s.date !== today) s.count = 0;
    return s;
  } catch { return null; }
}

function saveState(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...s, date: new Date().toDateString() })); }
  catch { /* quota exceeded — ignore */ }
}

// ── SVG ring progress ─────────────────────────────────────────────────────────
function Ring({ progress, color, size = 96 }) {
  const r      = (size - 8) / 2;
  const circ   = 2 * Math.PI * r;
  const offset = circ * (1 - progress);
  return (
    <svg width={size} height={size} className={styles.ring}>
      <circle cx={size / 2} cy={size / 2} r={r} className={styles.ringTrack} strokeWidth={6} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        className={styles.ringFill}
        strokeWidth={6}
        stroke={color}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

// ── Main widget ───────────────────────────────────────────────────────────────
export default function PomodoroWidget() {
  const saved = loadState();

  const [phase,    setPhase]    = useState(saved?.phase    || 'WORK');
  const [timeLeft, setTimeLeft] = useState(saved?.timeLeft ?? PHASES.WORK.duration);
  const [running,  setRunning]  = useState(false);   // never auto-resume on load
  const [count,    setCount]    = useState(saved?.count    || 0);
  const [open,     setOpen]     = useState(false);
  const [flash,    setFlash]    = useState(false);   // blink on phase change

  const intervalRef = useRef(null);
  const phaseData   = PHASES[phase];
  const progress    = timeLeft / phaseData.duration;
  const mins        = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs        = String(timeLeft % 60).padStart(2, '0');

  // Persist on every state change
  useEffect(() => {
    saveState({ phase, timeLeft, count });
  }, [phase, timeLeft, count]);

  // Tick
  useEffect(() => {
    if (!running) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(intervalRef.current);
          handlePhaseEnd();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, phase]); // eslint-disable-line

  const handlePhaseEnd = useCallback(() => {
    setRunning(false);
    setFlash(true);
    setTimeout(() => setFlash(false), 1200);

    setCount(prev => {
      const newCount = phase === 'WORK' ? prev + 1 : prev;
      const nextPhase = phase === 'WORK'
        ? (newCount % POMODOROS_BEFORE_LONG === 0 ? 'LONG_BREAK' : 'SHORT_BREAK')
        : 'WORK';
      playChime(nextPhase === 'WORK' ? 'break' : 'work');
      setPhase(nextPhase);
      setTimeLeft(PHASES[nextPhase].duration);
      return newCount;
    });
  }, [phase]);

  function toggle() {
    setRunning(r => !r);
  }

  function reset() {
    setRunning(false);
    setTimeLeft(phaseData.duration);
  }

  function skip() {
    setRunning(false);
    handlePhaseEnd();
  }

  function switchPhase(p) {
    setRunning(false);
    setPhase(p);
    setTimeLeft(PHASES[p].duration);
  }

  // Dot indicators — 4 slots, filled = completed
  const dots = Array.from({ length: POMODOROS_BEFORE_LONG }, (_, i) => i < (count % POMODOROS_BEFORE_LONG));

  return (
    <div className={`${styles.root} ${open ? styles.rootOpen : ''}`}>

      {/* ── Collapsed pill ── */}
      {!open && (
        <button
          className={`${styles.pill} ${running ? styles.pillRunning : ''}`}
          style={running ? { borderColor: phaseData.color + '88' } : {}}
          onClick={() => setOpen(true)}
          title="Pomodoro Timer"
          type="button"
        >
          <span className={styles.pillIcon}>{phaseData.icon}</span>
          <span className={styles.pillTime} style={running ? { color: phaseData.color } : {}}>
            {mins}:{secs}
          </span>
          {running && <span className={styles.pillDot} style={{ background: phaseData.color }} />}
        </button>
      )}

      {/* ── Expanded card ── */}
      {open && (
        <div className={`${styles.card} ${flash ? styles.cardFlash : ''}`}>
          {/* Header */}
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>🍅 Pomodoro</span>
            <button className={styles.closeBtn} onClick={() => setOpen(false)} type="button">✕</button>
          </div>

          {/* Phase tabs */}
          <div className={styles.phaseTabs}>
            {Object.entries(PHASES).map(([key, p]) => (
              <button
                key={key}
                className={`${styles.phaseTab} ${phase === key ? styles.phaseTabActive : ''}`}
                style={phase === key ? { color: p.color, borderColor: p.color + '66' } : {}}
                onClick={() => switchPhase(key)}
                type="button"
              >
                {p.icon} {p.label}
              </button>
            ))}
          </div>

          {/* Ring + time */}
          <div className={styles.ringWrap}>
            <Ring progress={progress} color={phaseData.color} size={120} />
            <div className={styles.timeDisplay}>
              <span className={styles.timeText} style={{ color: phaseData.color }}>{mins}:{secs}</span>
              <span className={styles.phaseLabel}>{phaseData.label}</span>
            </div>
          </div>

          {/* Pomodoro dots */}
          <div className={styles.dots}>
            {dots.map((filled, i) => (
              <div
                key={i}
                className={`${styles.dot} ${filled ? styles.dotFilled : ''}`}
                style={filled ? { background: PHASES.WORK.color } : {}}
              />
            ))}
          </div>
          <div className={styles.countLabel}>
            {count} pomodoro{count !== 1 ? 's' : ''} today
          </div>

          {/* Controls */}
          <div className={styles.controls}>
            <button className={styles.resetBtn} onClick={reset} title="Reset" type="button">↺</button>
            <button
              className={`${styles.startBtn} ${running ? styles.startBtnPause : ''}`}
              style={{ background: phaseData.color }}
              onClick={toggle}
              type="button"
            >
              {running ? '⏸ Pause' : '▶ Start'}
            </button>
            <button className={styles.skipBtn} onClick={skip} title="Skip to next phase" type="button">⏭</button>
          </div>
        </div>
      )}
    </div>
  );
}
