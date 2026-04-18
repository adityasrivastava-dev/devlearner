import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { topicsApi, submissionsApi, QUERY_KEYS } from '../../api';
import { getDiffMeta } from '../../utils/helpers';
import styles from './TopicView.module.css';

function StageProgressBar({ gate, stage }) {
  const config = {
    EASY:   { solved: gate.easySolved,   required: gate.easyRequiredToUnlockMedium,   label: 'Easy',   next: 'Medium'   },
    MEDIUM: { solved: gate.mediumSolved, required: gate.mediumRequiredToUnlockHard,   label: 'Medium', next: 'Hard'     },
    HARD:   { solved: gate.hardSolved,   required: gate.hardRequiredToMaster,         label: 'Hard',   next: 'Mastered' },
  }[stage];

  if (!config) return null;
  const pct = Math.min(100, Math.round((config.solved / config.required) * 100));

  return (
    <div className={styles.stageProgress}>
      <div className={styles.stageProgressText}>
        <span>
          Solve <strong>{config.required - config.solved}</strong> more {config.label}{' '}
          problem{config.required - config.solved !== 1 ? 's' : ''} to unlock <strong>{config.next}</strong>
        </span>
        <span className={styles.stageProgressCount}>{config.solved} / {config.required}</span>
      </div>
      <div className={styles.stageProgressBar}>
        <div className={styles.stageProgressFill} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function LockedPractice({ onGoToTheory }) {
  return (
    <div className={styles.lockedState}>
      <span className={styles.lockedIcon}>🔒</span>
      <h3 className={styles.lockedTitle}>Complete Theory First</h3>
      <p className={styles.lockedDesc}>
        Read the theory, understand the concept, then write what you learned in your own words.
        This unlocks your first practice problems.
      </p>
      <button className={styles.lockedBtn} onClick={onGoToTheory}>
        📖 Go to Theory
      </button>
    </div>
  );
}

function LockedDifficultyTeaser({ difficulty, gate }) {
  const hint = difficulty === 'Medium'
    ? `Solve ${gate.easyRequiredToUnlockMedium - gate.easySolved} more Easy problem${gate.easyRequiredToUnlockMedium - gate.easySolved !== 1 ? 's' : ''} to unlock Medium`
    : `Solve ${gate.mediumRequiredToUnlockHard - gate.mediumSolved} more Medium problem${gate.mediumRequiredToUnlockHard - gate.mediumSolved !== 1 ? 's' : ''} to unlock Hard`;

  return (
    <div className={styles.lockedTeaser}>
      <span className={styles.lockedTeaserIcon}>🔒</span>
      <span className={styles.lockedTeaserLabel}>{difficulty} problems locked</span>
      <span className={styles.lockedTeaserHint}>{hint}</span>
    </div>
  );
}

export default function TopicPracticeTab({ topicId, gate, stage, practiceUnlocked, onProblemOpen, onGoToTheory }) {
  const [diffFilter, setDiffFilter] = useState('ALL');

  const { data: problems = [], isLoading: prLoading } = useQuery({
    queryKey: QUERY_KEYS.problems(topicId),
    queryFn:  () => topicsApi.getProblems(topicId),
    staleTime: 5 * 60 * 1000,
  });

  const { data: solvedIdsFromServer = [] } = useQuery({
    queryKey: QUERY_KEYS.solvedIds,
    queryFn:  submissionsApi.getSolvedIds,
    staleTime: 60 * 1000,
  });

  const localSolved = JSON.parse(localStorage.getItem('devlearn_solved') || '[]');
  const solvedSet   = new Set([...solvedIdsFromServer, ...localSolved]);

  const visibleProblems = (() => {
    if (!practiceUnlocked) return [];
    if (stage === 'MASTERED') return problems;
    const allowed = { EASY: ['EASY'], MEDIUM: ['EASY', 'MEDIUM'], HARD: ['EASY', 'MEDIUM', 'HARD'] };
    return problems.filter(p => (allowed[stage] ?? ['EASY', 'MEDIUM', 'HARD']).includes(p.difficulty));
  })();

  const filteredProblems = diffFilter === 'ALL'
    ? visibleProblems
    : visibleProblems.filter(p => p.difficulty === diffFilter);

  return (
    <div className={styles.practicePanel}>
      {!practiceUnlocked ? (
        <LockedPractice onGoToTheory={onGoToTheory} />
      ) : (
        <>
          {gate && stage !== 'MASTERED' && <StageProgressBar gate={gate} stage={stage} />}
          {gate && stage === 'MASTERED' && (
            <div className={styles.masteredBanner}>
              🏆 Topic Mastered! You've solved problems at all difficulty levels.
            </div>
          )}

          <div className={styles.practiceHeader}>
            <div className={styles.practiceStats}>
              <span className={styles.practiceStat}>
                <strong>{visibleProblems.length}</strong> problems{stage !== 'MASTERED' && stage !== 'HARD' && ' unlocked'}
              </span>
              {visibleProblems.length > 0 && (
                <span className={styles.practiceStat}>
                  <strong className={styles.solvedCount}>
                    {[...solvedSet].filter(id => visibleProblems.some(p => p.id === id)).length}
                  </strong> solved
                </span>
              )}
            </div>
            <div className={styles.diffFilters}>
              {['ALL', 'EASY', 'MEDIUM', 'HARD'].map((d) => {
                const m = d !== 'ALL' ? getDiffMeta(d) : null;
                return (
                  <button
                    key={d}
                    className={`${styles.diffBtn} ${diffFilter === d ? styles.activeDiff : ''}`}
                    style={diffFilter === d && m ? { color: m.color, borderColor: m.color, background: `${m.color}15` } : {}}
                    onClick={() => setDiffFilter(d)}
                    aria-pressed={diffFilter === d}
                  >
                    {d === 'ALL' ? 'All' : d.charAt(0) + d.slice(1).toLowerCase()}
                  </button>
                );
              })}
            </div>
          </div>

          {prLoading ? (
            <div className={styles.loadingRow}><span className="spinner" />Loading…</div>
          ) : filteredProblems.length === 0 ? (
            <div className={styles.emptyState}><span>🎯</span><p>No problems at this difficulty yet.</p></div>
          ) : (
            <div className={styles.problemsList}>
              {filteredProblems.map((p, i) => {
                const diff = getDiffMeta(p.difficulty);
                const isSolved = solvedSet.has(p.id);
                return (
                  <div
                    key={p.id}
                    className={`${styles.problemRow} ${isSolved ? styles.problemSolved : ''}`}
                    onClick={() => onProblemOpen(p.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && onProblemOpen(p.id)}
                    aria-label={`${p.title} — ${diff.label}${isSolved ? ', solved' : ''}`}
                  >
                    <span className={styles.probNum} aria-hidden="true">{p.displayOrder || i + 1}</span>
                    <div className={`${styles.solvedDot} ${isSolved ? styles.solved : ''}`} aria-hidden="true">
                      {isSolved ? '✓' : ''}
                    </div>
                    <span className={styles.probTitle}>{p.title}</span>
                    <div className={styles.probMeta}>
                      {p.pattern && <span className={styles.patternChip}>{p.pattern}</span>}
                      <span className={`badge ${diff.cls}`}>{diff.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {stage === 'EASY' && problems.some(p => p.difficulty === 'MEDIUM') && (
            <LockedDifficultyTeaser difficulty="Medium" gate={gate} />
          )}
          {(stage === 'EASY' || stage === 'MEDIUM') && problems.some(p => p.difficulty === 'HARD') && (
            <LockedDifficultyTeaser difficulty="Hard" gate={gate} />
          )}
        </>
      )}
    </div>
  );
}
