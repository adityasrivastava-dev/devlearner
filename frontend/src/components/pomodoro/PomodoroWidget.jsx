import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './PomodoroWidget.module.css';

// ── Constants ─────────────────────────────────────────────────────────────────
const STORAGE_KEY       = 'devlearn_pomodoro';
const POS_KEY           = 'devlearn_pomodoro_pos';
export const FOCUS_KEY  = 'devlearn_focus_mode';  // read by Sidebar

const PHASES = {
  WORK:        { label: 'Focus',       icon: '🍅', duration: 25 * 60, color: '#ef4444' },
  SHORT_BREAK: { label: 'Short Break', icon: '☕', duration:  5 * 60, color: '#10b981' },
  LONG_BREAK:  { label: 'Long Break',  icon: '🌴', duration: 15 * 60, color: '#3b82f6' },
};

const FOCUS_OPTIONS = [
  { path: '/',               label: 'Home / Dashboard',  icon: '🏠' },
  { path: '/problems',       label: 'Problems',           icon: '🧩' },
  { path: '/review',         label: 'SRS Review',         icon: '🔄' },
  { path: '/quiz',           label: 'MCQ Quiz',           icon: '🧠' },
  { path: '/mock-interview', label: 'Mock Interview',     icon: '🎤' },
  { path: '/interview-mode', label: 'Interview Mode',     icon: '⏱' },
  { path: '/stories',        label: 'Story Builder',      icon: '📖' },
  { path: '/drill',          label: 'Pattern Drill',      icon: '⚔' },
  { path: '/algorithms',     label: 'Algorithms',         icon: '📊' },
  { path: '/playground',     label: 'Playground',         icon: '🛝' },
];

const POMODOROS_BEFORE_LONG = 4;

// ── Chime ─────────────────────────────────────────────────────────────────────
function playChime(type = 'work') {
  try {
    const ctx   = new (window.AudioContext || window.webkitAudioContext)();
    const freqs = type === 'work' ? [523, 659, 784] : [784, 659, 523];
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
  } catch { /* audio blocked */ }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function loadTimer() {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!s) return null;
    if (s.date !== new Date().toDateString()) s.count = 0;
    return s;
  } catch { return null; }
}

function saveTimer(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...s, date: new Date().toDateString() })); }
  catch { /* ignore */ }
}

function loadPos() {
  try { return JSON.parse(localStorage.getItem(POS_KEY) || 'null'); }
  catch { return null; }
}

function loadFocus() {
  try { return JSON.parse(localStorage.getItem(FOCUS_KEY) || 'null'); }
  catch { return null; }
}

function setFocusGlobal(option) {
  if (option) localStorage.setItem(FOCUS_KEY, JSON.stringify(option));
  else        localStorage.removeItem(FOCUS_KEY);
  // Notify Sidebar (same tab)
  window.dispatchEvent(new CustomEvent('devlearn_focus_change'));
}

// ── SVG Ring ──────────────────────────────────────────────────────────────────
function Ring({ progress, color, size = 110 }) {
  const r    = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className={styles.ring}>
      <circle cx={size/2} cy={size/2} r={r} className={styles.ringTrack} strokeWidth={7} />
      <circle
        cx={size/2} cy={size/2} r={r}
        className={styles.ringFill}
        strokeWidth={7}
        stroke={color}
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - progress)}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
      />
    </svg>
  );
}

// ── Main widget ───────────────────────────────────────────────────────────────
export default function PomodoroWidget() {
  const saved = loadTimer();

  const [phase,    setPhase]    = useState(saved?.phase    || 'WORK');
  const [timeLeft, setTimeLeft] = useState(saved?.timeLeft ?? PHASES.WORK.duration);
  const [running,  setRunning]  = useState(false);
  const [count,    setCount]    = useState(saved?.count    || 0);
  const [open,     setOpen]     = useState(false);
  const [flash,    setFlash]    = useState(false);
  const [view,     setView]     = useState('timer'); // 'timer' | 'focus'
  const [focus,    setFocus]    = useState(() => loadFocus());

  // ── Position (drag) ────────────────────────────────────────────────────────
  const defaultPos = { x: window.innerWidth - 200, y: window.innerHeight - 80 };
  const savedPos   = loadPos();
  const [pos,      setPos]      = useState(savedPos || defaultPos);
  const dragging   = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const rootRef    = useRef(null);

  // Interval
  const intervalRef = useRef(null);
  const phaseData   = PHASES[phase];
  const progress    = timeLeft / phaseData.duration;
  const mins        = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs        = String(timeLeft % 60).padStart(2, '0');

  // Persist timer
  useEffect(() => { saveTimer({ phase, timeLeft, count }); }, [phase, timeLeft, count]);

  // Persist position
  useEffect(() => {
    try { localStorage.setItem(POS_KEY, JSON.stringify(pos)); } catch { /* ignore */ }
  }, [pos]);

  // Tick
  useEffect(() => {
    if (!running) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(intervalRef.current); handlePhaseEnd(); return 0; }
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
      const newCount  = phase === 'WORK' ? prev + 1 : prev;
      const nextPhase = phase === 'WORK'
        ? (newCount % POMODOROS_BEFORE_LONG === 0 ? 'LONG_BREAK' : 'SHORT_BREAK')
        : 'WORK';
      playChime(nextPhase === 'WORK' ? 'break' : 'work');
      setPhase(nextPhase);
      setTimeLeft(PHASES[nextPhase].duration);
      return newCount;
    });
  }, [phase]);

  function toggle()    { setRunning(r => !r); }
  function reset()     { setRunning(false); setTimeLeft(phaseData.duration); }
  function skip()      { setRunning(false); handlePhaseEnd(); }
  function switchPhase(p) { setRunning(false); setPhase(p); setTimeLeft(PHASES[p].duration); }

  function selectFocus(option) {
    setFocus(option);
    setFocusGlobal(option);
    setView('timer');
  }

  function clearFocus() {
    setFocus(null);
    setFocusGlobal(null);
  }

  // ── Drag handlers ──────────────────────────────────────────────────────────
  function onDragStart(e) {
    if (e.button !== 0) return;
    dragging.current = true;
    const rect = rootRef.current?.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - (rect?.left || pos.x), y: e.clientY - (rect?.top || pos.y) };
    e.preventDefault();
  }

  useEffect(() => {
    function onMouseMove(e) {
      if (!dragging.current) return;
      const x = Math.max(0, Math.min(window.innerWidth  - 60, e.clientX - dragOffset.current.x));
      const y = Math.max(0, Math.min(window.innerHeight - 40, e.clientY - dragOffset.current.y));
      setPos({ x, y });
    }
    function onMouseUp() { dragging.current = false; }
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup',   onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup',   onMouseUp);
    };
  }, []);

  const dots = Array.from({ length: POMODOROS_BEFORE_LONG }, (_, i) => i < (count % POMODOROS_BEFORE_LONG));

  return (
    <div
      ref={rootRef}
      className={styles.root}
      style={{ left: pos.x, top: pos.y }}
    >
      {/* ── Collapsed pill ── */}
      {!open && (
        <button
          className={`${styles.pill} ${running ? styles.pillRunning : ''}`}
          style={running ? { borderColor: phaseData.color + '88' } : {}}
          onMouseDown={onDragStart}
          onClick={() => setOpen(true)}
          title="Pomodoro Timer — drag to move"
          type="button"
        >
          <span className={styles.pillIcon}>{focus ? focus.icon : phaseData.icon}</span>
          <span className={styles.pillTime} style={running ? { color: phaseData.color } : {}}>
            {focus && !running
              ? <span className={styles.pillFocusLabel}>{focus.label}</span>
              : `${mins}:${secs}`}
          </span>
          {running && <span className={styles.pillDot} style={{ background: phaseData.color }} />}
        </button>
      )}

      {/* ── Expanded card ── */}
      {open && (
        <div className={`${styles.card} ${flash ? styles.cardFlash : ''}`}>
          {/* Drag handle + header */}
          <div className={styles.cardHeader} onMouseDown={onDragStart}>
            <div className={styles.cardHeaderLeft}>
              <span className={styles.dragHandle}>⠿</span>
              <span className={styles.cardTitle}>🍅 Pomodoro</span>
            </div>
            <div className={styles.cardHeaderRight}>
              <button
                className={`${styles.focusModeBtn} ${focus ? styles.focusModeBtnActive : ''}`}
                onClick={() => setView(v => v === 'focus' ? 'timer' : 'focus')}
                title="Set focus task"
                type="button"
              >
                🎯 {focus ? focus.label : 'Set Focus'}
              </button>
              <button className={styles.closeBtn} onClick={() => setOpen(false)} type="button">✕</button>
            </div>
          </div>

          {/* ── Focus picker view ── */}
          {view === 'focus' && (
            <div className={styles.focusPicker}>
              <div className={styles.focusPickerTitle}>What are you focusing on?</div>
              <div className={styles.focusGrid}>
                {FOCUS_OPTIONS.map(opt => (
                  <button
                    key={opt.path}
                    className={`${styles.focusOption} ${focus?.path === opt.path ? styles.focusOptionActive : ''}`}
                    onClick={() => selectFocus(opt)}
                    type="button"
                  >
                    <span className={styles.focusOptionIcon}>{opt.icon}</span>
                    <span className={styles.focusOptionLabel}>{opt.label}</span>
                  </button>
                ))}
              </div>
              {focus && (
                <button className={styles.clearFocusBtn} onClick={() => { clearFocus(); setView('timer'); }} type="button">
                  ✕ Clear Focus
                </button>
              )}
            </div>
          )}

          {/* ── Timer view ── */}
          {view === 'timer' && (
            <>
              {/* Active focus badge */}
              {focus && (
                <div className={styles.focusBadge}>
                  <span>{focus.icon} Focusing on <strong>{focus.label}</strong></span>
                  <button className={styles.focusBadgeClear} onClick={clearFocus} type="button">✕</button>
                </div>
              )}

              {/* Phase tabs */}
              <div className={styles.phaseTabs}>
                {Object.entries(PHASES).map(([key, p]) => (
                  <button
                    key={key}
                    className={`${styles.phaseTab} ${phase === key ? styles.phaseTabActive : ''}`}
                    style={phase === key ? { color: p.color, borderColor: p.color + '55' } : {}}
                    onClick={() => switchPhase(key)}
                    type="button"
                  >
                    {p.icon} {p.label}
                  </button>
                ))}
              </div>

              {/* Ring */}
              <div className={styles.ringWrap}>
                <Ring progress={progress} color={phaseData.color} size={120} />
                <div className={styles.timeDisplay}>
                  <span className={styles.timeText} style={{ color: phaseData.color }}>{mins}:{secs}</span>
                  <span className={styles.phaseLabel}>{phaseData.label}</span>
                </div>
              </div>

              {/* Dots */}
              <div className={styles.dots}>
                {dots.map((filled, i) => (
                  <div key={i} className={`${styles.dot} ${filled ? styles.dotFilled : ''}`}
                    style={filled ? { background: PHASES.WORK.color } : {}} />
                ))}
              </div>
              <div className={styles.countLabel}>{count} pomodoro{count !== 1 ? 's' : ''} today</div>

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
                <button className={styles.skipBtn} onClick={skip} title="Skip phase" type="button">⏭</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
