import { useState, useEffect, useRef } from 'react';
import { recallApi } from '../../api';
import styles from './RecallDrillModal.module.css';

/**
 * RecallDrillModal — fires after first Accepted submission on a problem.
 *
 * Props:
 *   isOpen      — boolean
 *   onClose     — () => void
 *   topicId     — number | null
 *   topicTitle  — string  (used as label, e.g. "Sliding Window")
 *   problemTitle — string (the problem just solved)
 */
export default function RecallDrillModal({
  isOpen, onClose, topicId, topicTitle, problemTitle,
}) {
  const [text,    setText]    = useState('');
  const [phase,   setPhase]   = useState('write'); // 'write' | 'saving' | 'done'
  const [elapsed, setElapsed] = useState(0);
  const textareaRef = useRef(null);
  const timerRef    = useRef(null);

  // Reset when opened
  useEffect(() => {
    if (!isOpen) return;
    setText('');
    setPhase('write');
    setElapsed(0);

    // Focus textarea after enter animation
    const t = setTimeout(() => textareaRef.current?.focus(), 80);

    // 30-second countdown (for motivation, not a hard limit)
    timerRef.current = setInterval(() => {
      setElapsed((s) => s + 1);
    }, 1000);

    return () => {
      clearTimeout(t);
      clearInterval(timerRef.current);
    };
  }, [isOpen]);

  // Stop timer at 30
  useEffect(() => {
    if (elapsed >= 30) clearInterval(timerRef.current);
  }, [elapsed]);

  // Keyboard: Escape = close, Ctrl+Enter = save
  useEffect(() => {
    function onKey(e) {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleSave();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, text]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave() {
    if (!text.trim()) { onClose(); return; }
    setPhase('saving');
    clearInterval(timerRef.current);
    try {
      await recallApi.save(topicId, topicTitle || 'Unknown', text.trim());
    } catch {
      // silent — recall is best-effort, never block the user
    }
    setPhase('done');
    // Auto-close after 1.2s on done
    setTimeout(onClose, 1200);
  }

  function handleSkip() {
    clearInterval(timerRef.current);
    onClose();
  }

  if (!isOpen) return null;

  // Progress ring
  const pct    = Math.min(elapsed / 30, 1);
  const radius = 18;
  const circ   = 2 * Math.PI * radius;
  const dash   = circ * (1 - pct);
  const ringColor = elapsed < 20 ? 'var(--accent)' : elapsed < 28 ? '#f59e0b' : 'var(--red)';

  return (
    <div className={styles.overlay} onClick={handleSkip}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

        {phase === 'done' ? (
          /* ── Done state ─────────────────────────────────────── */
          <div className={styles.doneWrap}>
            <div className={styles.doneCheck}>✓</div>
            <div className={styles.doneText}>Recall saved!</div>
            <div className={styles.doneSub}>Memory reinforced 🧠</div>
          </div>

        ) : (
          <>
            {/* ── Header ──────────────────────────────────────── */}
            <div className={styles.header}>
              <div className={styles.headerLeft}>
                <div className={styles.badge}>Recall Drill</div>
                <div className={styles.problemTag}>✅ {problemTitle}</div>
              </div>

              {/* Countdown ring */}
              <div className={styles.timerWrap} title={`${Math.max(0, 30 - elapsed)}s`}>
                <svg width="44" height="44" viewBox="0 0 44 44">
                  <circle cx="22" cy="22" r={radius} fill="none" stroke="var(--bg4)" strokeWidth="3" />
                  <circle
                    cx="22" cy="22" r={radius} fill="none"
                    stroke={ringColor} strokeWidth="3"
                    strokeDasharray={circ}
                    strokeDashoffset={dash}
                    strokeLinecap="round"
                    transform="rotate(-90 22 22)"
                    style={{ transition: 'stroke-dashoffset 1s linear, stroke .3s' }}
                  />
                </svg>
                <span className={styles.timerLabel} style={{ color: ringColor }}>
                  {elapsed < 30 ? 30 - elapsed : '🎉'}
                </span>
              </div>
            </div>

            {/* ── Prompt ──────────────────────────────────────── */}
            <div className={styles.prompt}>
              Explain{topicTitle ? <><strong> {topicTitle} </strong></> : ' this algorithm '}
              in your own words.
            </div>
            <div className={styles.promptSub}>
              No right or wrong answer. Just pure retrieval — the single most effective memory technique.
            </div>

            {/* ── Textarea ────────────────────────────────────── */}
            <textarea
              ref={textareaRef}
              className={styles.textarea}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`e.g. "Sliding Window keeps a running sum — subtract what leaves, add what arrives, never recompute what you already know..."`}
              rows={5}
              disabled={phase === 'saving'}
            />

            <div className={styles.footer}>
              <div className={styles.charCount}>
                {text.length > 0 && <span>{text.length} chars</span>}
                <span className={styles.hint}>Ctrl+Enter to save</span>
              </div>
              <div className={styles.actions}>
                <button className={styles.skipBtn} onClick={handleSkip} disabled={phase === 'saving'}>
                  Skip
                </button>
                <button
                  className={styles.saveBtn}
                  onClick={handleSave}
                  disabled={phase === 'saving'}
                >
                  {phase === 'saving' ? 'Saving…' : text.trim() ? 'Save & Close' : 'Close'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}