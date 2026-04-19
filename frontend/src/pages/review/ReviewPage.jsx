import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { srsApi, QUERY_KEYS } from '../../api';
import styles from './ReviewPage.module.css';

// SM-2 quality ratings exposed to user
const RATINGS = [
  { label: 'Forgot',  sub: 'Complete blank',        quality: 1, cls: 'rForgot' },
  { label: 'Hard',    sub: 'Recalled with effort',  quality: 2, cls: 'rHard'   },
  { label: 'Got it',  sub: 'Correct with hesitation',quality: 4, cls: 'rGotIt'  },
  { label: 'Easy',    sub: 'Perfect recall',         quality: 5, cls: 'rEasy'   },
];

// ── Setup screen ──────────────────────────────────────────────────────────────
function SetupScreen({ dueItems, onStart, onBack }) {
  return (
    <div className={styles.setupPage}>
      <div className={styles.setupCard}>
        <div className={styles.setupIcon}>🧠</div>
        <h1 className={styles.setupTitle}>Spaced Repetition Review</h1>
        <p className={styles.setupDesc}>
          {dueItems.length === 0
            ? 'You\'re all caught up — nothing due today!'
            : `You have ${dueItems.length} item${dueItems.length !== 1 ? 's' : ''} due for review.`}
        </p>
        <p className={styles.setupHint}>
          For each item, try to recall it from memory before rating yourself.
          Honest ratings train the algorithm to schedule reviews at the right time.
        </p>

        <div className={styles.setupRatings}>
          {RATINGS.map(r => (
            <div key={r.label} className={`${styles.setupRatingRow} ${styles[r.cls]}`}>
              <span className={styles.setupRatingLabel}>{r.label}</span>
              <span className={styles.setupRatingSub}>{r.sub}</span>
            </div>
          ))}
        </div>

        <div className={styles.setupActions}>
          <button className={styles.backBtn} onClick={onBack}>← Back</button>
          <button
            className={styles.startBtn}
            onClick={onStart}
            disabled={dueItems.length === 0}
          >
            {dueItems.length === 0 ? 'All caught up ✓' : `Start ${dueItems.length} review${dueItems.length !== 1 ? 's' : ''} →`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Card screen ───────────────────────────────────────────────────────────────
function CardScreen({ item, index, total, onRate, isRating }) {
  const [revealed, setRevealed] = useState(false);
  const isTopic = item.itemType === 'TOPIC';

  // Reset reveal state when item changes
  // (handled by key on parent)

  return (
    <div className={styles.cardPage}>
      {/* Progress */}
      <div className={styles.progressRow}>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${(index / total) * 100}%` }}
          />
        </div>
        <span className={styles.progressLabel}>{index + 1} / {total}</span>
      </div>

      {/* Card */}
      <div className={styles.card}>
        <div className={styles.cardType}>
          <span className={styles.cardTypeIcon}>{isTopic ? '📖' : '🎯'}</span>
          <span className={styles.cardTypeLabel}>{isTopic ? 'Topic' : 'Problem'}</span>
          {item.repetitions > 0 && (
            <span className={styles.cardRep}>rep {item.repetitions}×</span>
          )}
        </div>

        <div className={styles.cardTitle}>{item.itemTitle}</div>

        <div className={styles.cardMeta}>
          {item.intervalDays === 1
            ? 'First review'
            : `Last interval: ${item.intervalDays} days`}
        </div>

        {!revealed ? (
          <button className={styles.revealBtn} onClick={() => setRevealed(true)}>
            Recall it? Tap to reveal rating
          </button>
        ) : (
          <div className={styles.ratings}>
            <p className={styles.ratingsPrompt}>How well did you recall this?</p>
            <div className={styles.ratingBtns}>
              {RATINGS.map(r => (
                <button
                  key={r.quality}
                  className={`${styles.ratingBtn} ${styles[r.cls]}`}
                  onClick={() => onRate(item, r.quality)}
                  disabled={isRating}
                >
                  <span className={styles.ratingLabel}>{r.label}</span>
                  <span className={styles.ratingSub}>{r.sub}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Skip link */}
      <button
        className={styles.skipBtn}
        onClick={() => onRate(item, 3)}
        disabled={isRating}
      >
        Skip (mark as Got it)
      </button>
    </div>
  );
}

// ── Results screen ────────────────────────────────────────────────────────────
function ResultsScreen({ results, upcomingItems, onRestart, onBack }) {
  const counts = { forgot: 0, hard: 0, gotit: 0, easy: 0 };
  for (const r of results) {
    if (r.quality <= 1)      counts.forgot++;
    else if (r.quality <= 2) counts.hard++;
    else if (r.quality <= 4) counts.gotit++;
    else                     counts.easy++;
  }

  const nextDue = upcomingItems?.[0]?.nextReviewDate;

  return (
    <div className={styles.resultsPage}>
      <div className={styles.resultsCard}>
        <div className={styles.resultsIcon}>
          {counts.forgot === 0 ? '🎉' : counts.easy + counts.gotit > counts.forgot + counts.hard ? '✅' : '📚'}
        </div>
        <h2 className={styles.resultsTitle}>Session Complete!</h2>
        <p className={styles.resultsSub}>You reviewed {results.length} item{results.length !== 1 ? 's' : ''}</p>

        <div className={styles.resultsCounts}>
          {counts.easy   > 0 && <div className={`${styles.countChip} ${styles.rEasy}`}>{counts.easy} Easy</div>}
          {counts.gotit  > 0 && <div className={`${styles.countChip} ${styles.rGotIt}`}>{counts.gotit} Got it</div>}
          {counts.hard   > 0 && <div className={`${styles.countChip} ${styles.rHard}`}>{counts.hard} Hard</div>}
          {counts.forgot > 0 && <div className={`${styles.countChip} ${styles.rForgot}`}>{counts.forgot} Forgot</div>}
        </div>

        {nextDue && (
          <p className={styles.nextReview}>
            Next review scheduled:{' '}
            <strong>{new Date(nextDue + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</strong>
          </p>
        )}

        {counts.forgot > 0 && (
          <p className={styles.resultsHint}>
            Items you forgot have been reset — they'll appear again tomorrow.
          </p>
        )}

        <div className={styles.resultsActions}>
          <button className={styles.backBtn} onClick={onBack}>← Dashboard</button>
          {results.length > 0 && (
            <button className={styles.startBtn} onClick={onRestart}>Review again</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ReviewPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [phase,   setPhase]   = useState('setup');   // setup | session | results
  const [queue,   setQueue]   = useState([]);
  const [index,   setIndex]   = useState(0);
  const [results, setResults] = useState([]);

  const { data: srs, isLoading } = useQuery({
    queryKey: QUERY_KEYS.srsQueue,
    queryFn:  srsApi.getQueue,
    staleTime: 60_000,
  });

  const reviewMut = useMutation({
    mutationFn: ({ itemType, itemId, quality }) =>
      srsApi.review(itemType, itemId, quality),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.srsQueue });
    },
  });

  const dueItems     = srs?.due      ?? [];
  const upcomingItems = srs?.upcoming ?? [];

  function startSession() {
    setQueue([...dueItems]);
    setIndex(0);
    setResults([]);
    setPhase('session');
  }

  const handleRate = useCallback(async (item, quality) => {
    try {
      await reviewMut.mutateAsync({
        itemType: item.itemType,
        itemId:   item.itemId,
        quality,
      });
    } catch {
      // continue even on error
    }

    const newResults = [...results, { ...item, quality }];
    setResults(newResults);

    const nextIndex = index + 1;
    if (nextIndex >= queue.length) {
      setPhase('results');
    } else {
      setIndex(nextIndex);
    }
  }, [index, queue, results, reviewMut]);

  if (isLoading) {
    return (
      <div className={styles.loadingPage}>
        <span className={styles.spinner} />
        <span>Loading review queue…</span>
      </div>
    );
  }

  if (phase === 'setup') {
    return (
      <SetupScreen
        dueItems={dueItems}
        onStart={startSession}
        onBack={() => navigate('/')}
      />
    );
  }

  if (phase === 'session') {
    const currentItem = queue[index];
    return (
      <CardScreen
        key={currentItem.id}      // reset revealed state on item change
        item={currentItem}
        index={index}
        total={queue.length}
        onRate={handleRate}
        isRating={reviewMut.isPending}
      />
    );
  }

  return (
    <ResultsScreen
      results={results}
      upcomingItems={upcomingItems}
      onRestart={startSession}
      onBack={() => navigate('/')}
    />
  );
}
