import { useEffect, useRef } from 'react';
import useVisualizerStore from './useVisualizerStore';
import styles from './PlaybackControls.module.css';

const SPEED_OPTIONS = [
  { label: '0.5×', value: 2.0 },
  { label: '1×',   value: 1.0 },
  { label: '1.5×', value: 0.7 },
  { label: '2×',   value: 0.5 },
  { label: '3×',   value: 0.33 },
];

// Base interval in ms — modified by speed (delay multiplier)
const BASE_MS = 900;

export default function PlaybackControls() {
  const {
    frames, currentFrame, isPlaying, speed,
    nextFrame, prevFrame, togglePlay, setSpeed, reset, goToFrame,
  } = useVisualizerStore();

  const total = frames.length;
  const atEnd  = currentFrame >= total - 1;
  const atStart = currentFrame === 0;
  const timerRef = useRef(null);

  // Auto-advance when playing
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (isPlaying && !atEnd) {
      timerRef.current = setInterval(() => {
        useVisualizerStore.getState().nextFrame();
      }, Math.round(BASE_MS * speed));
    }

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, speed, atEnd]);

  if (total === 0) return null;

  const progress = total > 1 ? (currentFrame / (total - 1)) * 100 : 100;

  return (
    <div className={styles.wrap}>
      {/* Progress bar */}
      <div className={styles.progressOuter}>
        <div className={styles.progressInner} style={{ width: `${progress}%` }} />
      </div>

      {/* Step counter */}
      <div className={styles.stepCounter}>
        Step <strong>{currentFrame + 1}</strong> / {total}
      </div>

      {/* Controls row */}
      <div className={styles.controls}>
        {/* Reset */}
        <button
          className={`${styles.btn} ${styles.btnSecondary}`}
          onClick={reset}
          title="Reset to start"
          disabled={atStart && !isPlaying}
        >
          ⏮
        </button>

        {/* Prev */}
        <button
          className={`${styles.btn} ${styles.btnSecondary}`}
          onClick={prevFrame}
          disabled={atStart}
          title="Previous step"
        >
          ◀
        </button>

        {/* Play / Pause */}
        <button
          className={`${styles.btn} ${styles.btnPrimary} ${isPlaying ? styles.btnPause : ''}`}
          onClick={atEnd ? reset : togglePlay}
          title={atEnd ? 'Restart' : isPlaying ? 'Pause' : 'Play'}
        >
          {atEnd ? '↺' : isPlaying ? '⏸' : '▶'}
        </button>

        {/* Next */}
        <button
          className={`${styles.btn} ${styles.btnSecondary}`}
          onClick={nextFrame}
          disabled={atEnd}
          title="Next step"
        >
          ▶
        </button>

        {/* Speed */}
        <div className={styles.speedGroup}>
          {SPEED_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              className={`${styles.speedBtn} ${speed === opt.value ? styles.speedActive : ''}`}
              onClick={() => setSpeed(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrubber */}
      <div className={styles.scrubWrap}>
        <input
          type="range"
          min={0}
          max={total - 1}
          value={currentFrame}
          onChange={(e) => goToFrame(Number(e.target.value))}
          className={styles.scrubber}
          title="Drag to jump to any step"
        />
      </div>
    </div>
  );
}
