import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { topicsApi, submissionsApi, bookmarksApi, notesApi, ratingsApi, gateApi, interviewApi, QUERY_KEYS } from '../../api';
import { getCategoryMeta, getDiffMeta } from '../../utils/helpers';
import TracerPlayer from './TracerPlayer';
import FlowchartViewer from './FlowchartViewer';
import SqlTableVisualizer from '../sql/SqlTableVisualizer';
import styles from './TopicView.module.css';
import ReadOnlyCodeViewer from './ReadOnlyCodeViewer';

export default function TopicView({ topic, onProblemOpen, onBack, theme = 'dark' }) {
  const [tab, setTab]               = useState('theory');
  const [activeExample, setActiveExample] = useState(null);
  const [diffFilter, setDiffFilter] = useState('ALL');
  const queryClient = useQueryClient();

  useEffect(() => { setActiveExample(null); setTab('theory'); }, [topic.id]);

  // ── Gate status ───────────────────────────────────────────────────────────────
  const { data: gate, isLoading: gateLoading } = useQuery({
    queryKey: QUERY_KEYS.gateStatus(topic.id),
    queryFn:  () => gateApi.getStatus(topic.id),
    staleTime: 30 * 1000,
  });

  const { mutate: completeTheory, isPending: completing, error: completeError } = useMutation({
    mutationFn: ({ note }) => gateApi.completeTheory(topic.id, note),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.gateStatus(topic.id) }),
  });

  // ── Rating ────────────────────────────────────────────────────────────────────
  const { data: ratingData, refetch: refetchRating } = useQuery({
    queryKey: QUERY_KEYS.topicRating(topic.id),
    queryFn:  () => ratingsApi.get(topic.id),
    staleTime: 60 * 1000,
  });

  const { mutate: submitRating, isPending: ratingPending } = useMutation({
    mutationFn: (stars) => ratingsApi.rate(topic.id, stars),
    onSuccess: () => refetchRating(),
  });

  // ── Bookmark ──────────────────────────────────────────────────────────────────
  const { data: bmData } = useQuery({
    queryKey: ['bookmark', 'TOPIC', topic.id],
    queryFn:  () => bookmarksApi.check('TOPIC', topic.id),
    staleTime: 60 * 1000,
  });
  const isBookmarked = bmData?.bookmarked ?? false;

  const { mutate: toggleBookmark } = useMutation({
    mutationFn: () => bookmarksApi.toggle('TOPIC', topic.id, topic.title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmark', 'TOPIC', topic.id] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bookmarks });
    },
  });

  const { data: examples = [], isLoading: exLoading } = useQuery({
    queryKey: QUERY_KEYS.examples(topic.id),
    queryFn:  () => topicsApi.getExamples(topic.id),
    enabled:  tab === 'examples',
    staleTime: 10 * 60 * 1000,
  });

  const { data: problems = [], isLoading: prLoading } = useQuery({
    queryKey: QUERY_KEYS.problems(topic.id),
    queryFn:  () => topicsApi.getProblems(topic.id),
    enabled:  tab === 'practice',
    staleTime: 5 * 60 * 1000,
  });

  const { data: solvedIdsFromServer = [] } = useQuery({
    queryKey: QUERY_KEYS.solvedIds,
    queryFn:  submissionsApi.getSolvedIds,
    staleTime: 60 * 1000,
    enabled:  tab === 'practice',
  });
  const localSolved = JSON.parse(localStorage.getItem('devlearn_solved') || '[]');
  const solvedSet   = new Set([...solvedIdsFromServer, ...localSolved]);

  const catMeta = getCategoryMeta(topic.category);

  // ── Derived gate state ────────────────────────────────────────────────────────
  const stage           = gate?.stage ?? 'THEORY';
  const theoryDone      = gate?.theoryCompleted ?? false;
  const practiceUnlocked = theoryDone; // any stage beyond THEORY unlocks Practice tab

  // Problems visible per stage
  const visibleProblems = (() => {
    if (!practiceUnlocked) return [];
    if (stage === 'MASTERED') return problems;
    const allowed = { EASY: ['EASY'], MEDIUM: ['EASY', 'MEDIUM'], HARD: ['EASY', 'MEDIUM', 'HARD'] };
    const allowedDiffs = allowed[stage] ?? ['EASY', 'MEDIUM', 'HARD'];
    return problems.filter((p) => allowedDiffs.includes(p.difficulty));
  })();

  const filteredProblems = diffFilter === 'ALL' ? visibleProblems
    : visibleProblems.filter((p) => p.difficulty === diffFilter);

  // If in example detail view, show full-screen example
  if (tab === 'examples' && activeExample !== null) {
    const ex = examples[activeExample];
    if (ex) {
      return (
        <ExampleDetailView
          ex={ex}
          index={activeExample}
          total={examples.length}
          theme={theme}
          onBack={() => setActiveExample(null)}
          onPrev={() => setActiveExample(i => Math.max(0, i - 1))}
          onNext={() => setActiveExample(i => Math.min(examples.length - 1, i + 1))}
        />
      );
    }
  }

  return (
    <div className={styles.topicView}>

      {/* ── Compact header ────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          {onBack && (
            <button className={styles.backBtn} onClick={onBack} title="Back to Dashboard">
              ← Home
            </button>
          )}
          <span className={`badge ${catMeta.cls}`}>{catMeta.label}</span>
          <h1 className={styles.title}>{topic.title}</h1>

          {/* Gate stage badge */}
          {!gateLoading && (
            <span className={`${styles.stageBadge} ${styles[`stage${stage}`]}`}>
              {STAGE_LABELS[stage]}
            </span>
          )}

          <button
            className={`${styles.bookmarkBtn} ${isBookmarked ? styles.bookmarked : ''}`}
            onClick={toggleBookmark}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark this topic'}
          >
            {isBookmarked ? '★' : '☆'}
          </button>

          {/* Star rating */}
          <div className={styles.starRating} title={ratingData?.count > 0 ? `${ratingData.average} avg (${ratingData.count} ratings)` : 'Rate this topic'}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                className={`${styles.starBtn} ${star <= (ratingData?.myRating ?? 0) ? styles.starFilled : ''}`}
                onClick={() => !ratingPending && submitRating(star)}
                title={`Rate ${star} star${star !== 1 ? 's' : ''}`}
              >★</button>
            ))}
            {ratingData?.count > 0 && (
              <span className={styles.ratingAvg}>{ratingData.average}</span>
            )}
          </div>
        </div>
        {topic.description && (
          <p className={styles.desc}>{topic.description}</p>
        )}
      </div>

      {/* ── Tab bar ───────────────────────────────────────────────────────── */}
      <div className={styles.tabBar}>
        {[
          { key: 'theory',   label: 'Theory',   icon: '📖' },
          { key: 'examples', label: 'Examples', icon: '💡' },
          { key: 'practice', label: 'Practice', icon: '🎯', locked: !practiceUnlocked },
          { key: 'optimize', label: 'Approach', icon: '⚡' },
          { key: 'qa',       label: 'Q&A',      icon: '🎯' },
          { key: 'notes',    label: 'Notes',    icon: '📝' },
        ].map(({ key, label, icon, locked }) => (
          <button
            key={key}
            className={`${styles.tabBtn} ${tab === key ? styles.tabActive : ''} ${locked ? styles.tabLocked : ''}`}
            onClick={() => { setTab(key); setActiveExample(null); }}
            title={locked ? 'Complete theory to unlock practice' : undefined}
          >
            <span className={styles.tabIcon}>{locked ? '🔒' : icon}</span>
            <span className={styles.tabLabel}>{label}</span>
          </button>
        ))}
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className={styles.body}>

        {/* THEORY */}
        {tab === 'theory' && (
          <div className={styles.theoryPanel}>
            {/* Overview — always show description as lead-in */}
            {topic.description && (
              <div className={`${styles.theoryCard} ${styles.overviewCard}`}>
                <div className={styles.cardTitle}>💡 Overview</div>
                <div className={styles.cardBody}>{topic.description}</div>
                {(topic.timeComplexity || topic.spaceComplexity) && (
                  <div className={styles.complexityRow}>
                    {topic.timeComplexity && (
                      <span className={styles.complexityBadge}>⏱ Time: {topic.timeComplexity}</span>
                    )}
                    {topic.spaceComplexity && (
                      <span className={styles.complexityBadge}>💾 Space: {topic.spaceComplexity}</span>
                    )}
                  </div>
                )}
              </div>
            )}
            {topic.memoryAnchor && (
              <MemoryAnchorCard text={topic.memoryAnchor} />
            )}
            {topic.story && (
              <StoryCard text={topic.story} />
            )}
            {topic.analogy && (
              <AnalogyCard text={topic.analogy} />
            )}
            {topic.firstPrinciples && (
              <PrinciplesCard text={topic.firstPrinciples} />
            )}
            {topic.whenToUse && (
              <div className={`${styles.theoryCard} ${styles.whenToUseCard}`}>
                <div className={styles.cardTitle}>🎯 When to Use</div>
                <div className={styles.cardBody}>{topic.whenToUse}</div>
              </div>
            )}
            {topic.starterCode && (
              <div className={styles.theoryCard}>
                <div className={styles.cardTitle}>🧩 Starter Template</div>
                <pre className={styles.codeBlock}>{topic.starterCode}</pre>
              </div>
            )}
            {topic.youtubeUrls && (
              <YoutubeVideosCard raw={topic.youtubeUrls} />
            )}
            {!topic.description && !topic.memoryAnchor && !topic.story && !topic.analogy && !topic.firstPrinciples && !topic.starterCode && (
              <div className={styles.emptyState}>
                <span>✍️</span>
                <p>Theory content not yet written.</p>
              </div>
            )}

            {/* Gate: theory completion form */}
            {!gateLoading && (
              <TheoryGate
                gate={gate}
                completing={completing}
                error={completeError}
                onComplete={({ note }) => completeTheory({ note })}
                onPractice={() => setTab('practice')}
              />
            )}
          </div>
        )}

        {/* EXAMPLES — card grid */}
        {tab === 'examples' && (
          <div className={styles.examplesPanel}>
            {exLoading ? (
              <ExamplesSkeletons />
            ) : examples.length === 0 ? (
              <div className={styles.emptyState}><span>📭</span><p>No examples yet.</p></div>
            ) : (
              <>
                <div className={styles.examplesGrid}>
                  {examples.map((ex, i) => (
                    <button
                      key={ex.id || i}
                      className={styles.exCard}
                      onClick={() => setActiveExample(i)}
                    >
                      <div className={styles.exCardNum}>Example {ex.displayOrder || i + 1}</div>
                      <div className={styles.exCardTitle}>{ex.title}</div>
                      <div className={styles.exCardTags}>
                        {ex.tableData && <span className={styles.exTag}>⊞ Tables</span>}
                        {ex.tracerSteps && <span className={styles.exTag}>▶ Tracer</span>}
                        {ex.flowchartMermaid && <span className={styles.exTag}>◈ Diagram</span>}
                        {ex.pseudocode && <span className={styles.exTag}>≡ Pseudocode</span>}
                      </div>
                      <div className={styles.exCardArrow}>Open →</div>
                    </button>
                  ))}
                </div>
                <p className={styles.exHint}>Click any example for full code, tracer, and diagram</p>
              </>
            )}
          </div>
        )}

        {/* PRACTICE */}
        {tab === 'practice' && (
          <div className={styles.practicePanel}>
            {!practiceUnlocked ? (
              <LockedPractice onGoToTheory={() => setTab('theory')} />
            ) : (
              <>
                {/* Stage progress bar */}
                {gate && stage !== 'MASTERED' && (
                  <StageProgressBar gate={gate} stage={stage} />
                )}
                {gate && stage === 'MASTERED' && (
                  <div className={styles.masteredBanner}>
                    🏆 Topic Mastered! You've solved problems at all difficulty levels.
                  </div>
                )}

                <div className={styles.practiceHeader}>
                  <div className={styles.practiceStats}>
                    <span className={styles.practiceStat}>
                      <strong>{visibleProblems.length}</strong> problems{stage !== 'MASTERED' && stage !== 'HARD' && ` unlocked`}
                    </span>
                    {visibleProblems.length > 0 && (
                      <span className={styles.practiceStat}>
                        <strong style={{ color: 'var(--accent)' }}>
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
                      const diff    = getDiffMeta(p.difficulty);
                      const isSolved = solvedSet.has(p.id);
                      return (
                        <div
                          key={p.id}
                          className={`${styles.problemRow} ${isSolved ? styles.problemSolved : ''}`}
                          onClick={() => onProblemOpen(p.id)}
                        >
                          <span className={styles.probNum}>{p.displayOrder || i + 1}</span>
                          <div className={`${styles.solvedDot} ${isSolved ? styles.solved : ''}`}>
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

                {/* Locked harder problems teaser */}
                {stage === 'EASY' && problems.some(p => p.difficulty === 'MEDIUM') && (
                  <LockedDifficultyTeaser difficulty="Medium" gate={gate} />
                )}
                {(stage === 'EASY' || stage === 'MEDIUM') && problems.some(p => p.difficulty === 'HARD') && (
                  <LockedDifficultyTeaser difficulty="Hard" gate={gate} />
                )}
              </>
            )}
          </div>
        )}

        {/* OPTIMIZE */}
        {tab === 'optimize' && (
          <div className={styles.optimizePanel}>
            {[
              { icon: '🐌', title: 'Brute Force',        key: 'bruteForce',        accent: false },
              { icon: '⚡', title: 'Optimized Approach',  key: 'optimizedApproach', accent: true  },
              { icon: '🎯', title: 'When to Use',         key: 'whenToUse',         accent: false },
              { icon: '📈', title: 'Complexity',          key: '__complexity__',    accent: false },
            ].map(({ icon, title, key, accent }) => (
              <div key={key} className={`${styles.optCard} ${accent ? styles.optAccent : ''}`}>
                <div className={styles.optTitle}>{icon} {title}</div>
                <div className={styles.optContent}>
                  {key === '__complexity__' ? (
                    <>
                      <div><span className={styles.optLabel}>Time</span>{topic.timeComplexity || '—'}</div>
                      <div><span className={styles.optLabel}>Space</span>{topic.spaceComplexity || '—'}</div>
                    </>
                  ) : (
                    topic[key] || <span style={{ color: 'var(--text3)' }}>Not specified</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Q&A */}
        {tab === 'qa' && (
          <TopicInterviewQuestions category={topic.category} topicTitle={topic.title} />
        )}

        {/* NOTES */}
        {tab === 'notes' && (
          <div className={styles.notesTabWrap}>
            <NotesPanel key={topic.id} topicId={topic.id} />
            {topic.youtubeUrls && <YoutubeVideosCard raw={topic.youtubeUrls} />}
          </div>
        )}

      </div>
    </div>
  );
}

// ── Stage labels ──────────────────────────────────────────────────────────────
const STAGE_LABELS = {
  THEORY:   '📖 Theory',
  EASY:     '🟢 Easy',
  MEDIUM:   '🟡 Medium',
  HARD:     '🔴 Hard',
  MASTERED: '🏆 Mastered',
};

// ── Theory Gate Component ─────────────────────────────────────────────────────
function TheoryGate({ gate, completing, error, onComplete, onPractice }) {
  const [note, setNote] = useState(gate?.theoryNote ?? '');
  const isCompleted = gate?.theoryCompleted ?? false;

  if (isCompleted) {
    return (
      <div className={styles.gateCompleted}>
        <div className={styles.gateCompletedIcon}>✅</div>
        <div className={styles.gateCompletedText}>
          <strong>Theory completed!</strong>
          {gate.theoryNote && (
            <p className={styles.gateCompletedNote}>Your understanding: "{gate.theoryNote}"</p>
          )}
        </div>
        <button className={styles.gatePracticeBtn} onClick={onPractice}>
          🎯 Start Practising →
        </button>
      </div>
    );
  }

  return (
    <div className={styles.gateForm}>
      <div className={styles.gateFormTitle}>
        ✍️ Write what you understood
      </div>
      <p className={styles.gateFormHint}>
        Before unlocking practice problems, write a short summary in your own words (minimum 20 characters).
        This forces active recall — the single best way to make knowledge stick.
      </p>
      <textarea
        className={styles.gateTextarea}
        placeholder="e.g. Two pointers work when the array is sorted and we need to find a pair. We move left/right based on the sum comparison..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={4}
      />
      <div className={styles.gateFormFooter}>
        <span className={`${styles.gateCharCount} ${note.length >= 20 ? styles.gateCharOk : ''}`}>
          {note.length} / 20 min
        </span>
        <button
          className={styles.gateUnlockBtn}
          disabled={note.trim().length < 20 || completing}
          onClick={() => onComplete({ note: note.trim() })}
        >
          {completing ? 'Unlocking…' : '🔓 I Understood This — Unlock Practice'}
        </button>
      </div>
      {error && (
        <p className={styles.gateError}>
          {error?.response?.data?.error ?? 'Failed to save. Try again.'}
        </p>
      )}
    </div>
  );
}

// ── Stage Progress Bar ────────────────────────────────────────────────────────
function StageProgressBar({ gate, stage }) {
  const config = {
    EASY:   { solved: gate.easySolved,   required: gate.easyRequiredToUnlockMedium,   label: 'Easy',   next: 'Medium' },
    MEDIUM: { solved: gate.mediumSolved, required: gate.mediumRequiredToUnlockHard,   label: 'Medium', next: 'Hard'   },
    HARD:   { solved: gate.hardSolved,   required: gate.hardRequiredToMaster,         label: 'Hard',   next: 'Mastered' },
  }[stage];

  if (!config) return null;

  const pct = Math.min(100, Math.round((config.solved / config.required) * 100));

  return (
    <div className={styles.stageProgress}>
      <div className={styles.stageProgressText}>
        <span>Solve <strong>{config.required - config.solved}</strong> more {config.label} problem{config.required - config.solved !== 1 ? 's' : ''} to unlock <strong>{config.next}</strong></span>
        <span className={styles.stageProgressCount}>{config.solved} / {config.required}</span>
      </div>
      <div className={styles.stageProgressBar}>
        <div className={styles.stageProgressFill} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Locked Practice State ─────────────────────────────────────────────────────
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

// ── Locked Difficulty Teaser ──────────────────────────────────────────────────
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

// ── Notes Panel ───────────────────────────────────────────────────────────────
function NotesPanel({ topicId }) {
  const queryClient = useQueryClient();
  const [noteText,   setNoteText]   = useState('');
  const [editingId,  setEditingId]  = useState(null);
  const [editText,   setEditText]   = useState('');

  const { data: notes = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.notes(topicId),
    queryFn:  () => notesApi.getByTopic(topicId),
    staleTime: 2 * 60 * 1000,
  });

  const { mutate: createNote, isPending: creating } = useMutation({
    mutationFn: (content) => notesApi.create(topicId, content),
    onSuccess: () => {
      setNoteText('');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notes(topicId) });
    },
  });

  const { mutate: updateNote } = useMutation({
    mutationFn: ({ id, content }) => notesApi.update(id, content),
    onSuccess: () => {
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notes(topicId) });
    },
  });

  const { mutate: deleteNote } = useMutation({
    mutationFn: (id) => notesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notes(topicId) }),
  });

  return (
    <div className={styles.notesPanel}>
      <div className={styles.noteForm}>
        <textarea
          className={styles.noteTextarea}
          placeholder="Write a note for this topic…"
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          rows={3}
        />
        <button
          className="btn btn-primary btn-sm"
          disabled={!noteText.trim() || creating}
          onClick={() => createNote(noteText.trim())}
        >
          {creating ? 'Saving…' : '+ Save Note'}
        </button>
      </div>

      {isLoading ? (
        <div className={styles.loadingRow}><span className="spinner" />Loading notes…</div>
      ) : notes.length === 0 ? (
        <div className={styles.emptyState}>
          <span>📝</span>
          <p>No notes yet. Write something above to remember this topic.</p>
        </div>
      ) : (
        <div className={styles.notesList}>
          {notes.map((note) => (
            <div key={note.id} className={styles.noteCard}>
              {editingId === note.id ? (
                <>
                  <textarea
                    className={styles.noteTextarea}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={3}
                    autoFocus
                  />
                  <div className={styles.noteActions}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => { if (editText.trim()) updateNote({ id: note.id, content: editText.trim() }); }}
                    >Save</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.noteContent}>{note.content}</div>
                  <div className={styles.noteMeta}>
                    <span className={styles.noteDate}>{formatNoteDate(note.updatedAt)}</span>
                    <div className={styles.noteActions}>
                      <button
                        className={styles.noteActionBtn}
                        onClick={() => { setEditingId(note.id); setEditText(note.content); }}
                      >Edit</button>
                      <button
                        className={`${styles.noteActionBtn} ${styles.noteDelete}`}
                        onClick={() => deleteNote(note.id)}
                      >Delete</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Interview Q&A tab (standalone panel) ──────────────────────────────────────
function TopicInterviewQuestions({ category, topicTitle }) {
  const [expanded, setExpanded] = useState(null);
  const [size, setSize]         = useState(15);

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['interviewQ', category, topicTitle, size],
    queryFn:  () => interviewApi.getAll({ category, topicTitle, size }),
    staleTime: 10 * 60 * 1000,
    enabled:  !!category,
  });

  const diffColor = { EASY: '#4ade80', MEDIUM: '#fbbf24', HARD: '#f87171', HIGH: '#f87171', LOW: '#4ade80' };
  const isTopicSpecific = questions.length > 0 && questions[0]?.topicTitle === topicTitle;

  return (
    <div className={styles.qaPanel}>
      {/* Header */}
      <div className={styles.qaHeader}>
        <div className={styles.qaHeaderLeft}>
          <span className={styles.qaHeaderIcon}>🎯</span>
          <div>
            <div className={styles.qaHeaderTitle}>Interview Q&amp;A</div>
            <div className={styles.qaHeaderSub}>
              {isLoading
                ? 'Loading…'
                : questions.length === 0
                  ? 'No questions found for this topic yet'
                  : isTopicSpecific
                    ? `${questions.length} questions specific to "${topicTitle}"`
                    : `${questions.length} ${category?.replace(/_/g, ' ')} category questions`}
            </div>
          </div>
        </div>
        {isTopicSpecific && (
          <span className={styles.qaBadgeSpecific}>Topic-specific</span>
        )}
      </div>

      {/* Skeleton */}
      {isLoading && (
        <div className={styles.qaSkeleton}>
          {[1, 2, 3, 4, 5].map(i => <div key={i} className={styles.qaSkeletonItem} />)}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && questions.length === 0 && (
        <div className={styles.qaEmpty}>
          <div className={styles.qaEmptyIcon}>📭</div>
          <div className={styles.qaEmptyText}>No questions imported for this topic yet.</div>
          <div className={styles.qaEmptyHint}>Ask an admin to import the Q&amp;A batch files.</div>
        </div>
      )}

      {/* List */}
      {!isLoading && questions.length > 0 && (
        <>
          <div className={styles.qaList}>
            {questions.map((q, i) => (
              <div key={q.id ?? i} className={`${styles.qaItem} ${expanded === i ? styles.qaItemOpen : ''}`}>
                {/* Question row */}
                <button
                  className={styles.qaQuestion}
                  onClick={() => setExpanded(expanded === i ? null : i)}
                >
                  <span className={styles.qaNum}>{i + 1}</span>
                  <span className={styles.qaText}>{q.question}</span>
                  <span className={styles.qaDiff} style={{ color: diffColor[q.difficulty] || '#94a3b8' }}>
                    {q.difficulty === 'HIGH' ? 'Hard' : 'Medium'}
                  </span>
                  <span className={`${styles.qaChevron} ${expanded === i ? styles.qaChevronOpen : ''}`}>›</span>
                </button>

                {/* Expanded answer */}
                {expanded === i && (
                  <div className={styles.qaAnswer}>
                    {/* Quick answer */}
                    {q.quickAnswer && (
                      <div className={styles.qaAnswerSection}>
                        <div className={styles.qaAnswerLabel}>Answer</div>
                        <div className={styles.qaAnswerText}>{q.quickAnswer}</div>
                      </div>
                    )}

                    {/* Key points */}
                    {q.keyPoints && (
                      <div className={styles.qaAnswerSection}>
                        <div className={styles.qaAnswerLabel}>Key Points</div>
                        <ul className={styles.qaKeyPoints}>
                          {q.keyPoints.split('\n').filter(Boolean).map((pt, pi) => (
                            <li key={pi} className={styles.qaKeyPoint}>
                              {pt.includes(':')
                                ? <><strong>{pt.split(':')[0]}</strong>:{pt.split(':').slice(1).join(':')}</>
                                : pt}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Code example */}
                    {q.codeExample && (
                      <div className={styles.qaAnswerSection}>
                        <div className={styles.qaAnswerLabel}>Example</div>
                        <pre className={styles.qaCode}><code>{q.codeExample}</code></pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Load more */}
          {questions.length >= size && (
            <button className={styles.qaLoadMore} onClick={() => setSize(s => s + 15)}>
              Load more questions
            </button>
          )}
        </>
      )}
    </div>
  );
}

function formatNoteDate(str) {
  if (!str) return '';
  try {
    return new Date(str).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return str;
  }
}

// ── Example Detail View (full-page) ──────────────────────────────────────────
function ExampleDetailView({ ex, index, total, theme = 'dark', onBack, onPrev, onNext }) {
  const [activeSection, setActiveSection] = useState(ex.tableData ? 'tables' : 'code');

  const sections = [
    ex.tableData       && { key: 'tables',    label: '⊞ Tables'     },
    ex.pseudocode      && { key: 'pseudo',    label: '≡ Pseudocode' },
    { key: 'code',       label: '{ } Code'    },
    ex.tracerSteps     && { key: 'tracer',    label: '▶ Tracer'     },
    ex.flowchartMermaid && { key: 'diagram',  label: '◈ Diagram'    },
  ].filter(Boolean);

  return (
    <div className={styles.exDetailView}>

      <div className={styles.exDetailNav}>
        <button className={styles.exBackBtn} onClick={onBack}>
          ← All Examples
        </button>
        <div className={styles.exDetailMeta}>
          <span className={styles.exDetailNum}>Example {ex.displayOrder || index + 1}</span>
          <span className={styles.exDetailTitle}>{ex.title}</span>
        </div>
        <div className={styles.exNavBtns}>
          <button className={styles.exNavBtn} onClick={onPrev} disabled={index === 0}>
            ‹ Prev
          </button>
          <span className={styles.exNavCount}>{index + 1} / {total}</span>
          <button className={styles.exNavBtn} onClick={onNext} disabled={index === total - 1}>
            Next ›
          </button>
        </div>
      </div>

      <div className={styles.exSectionBar}>
        {sections.map(({ key, label }) => (
          <button
            key={key}
            className={`${styles.exSectionBtn} ${activeSection === key ? styles.exSectionActive : ''}`}
            onClick={() => setActiveSection(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={styles.exDetailBody}>

        {activeSection === 'tables' && ex.tableData && (
          <div className={styles.exSection}>
            <div className={styles.exSectionLabel}>Table Visualization</div>
            <SqlTableVisualizer data={ex.tableData} />
          </div>
        )}

        {activeSection === 'pseudo' && ex.pseudocode && (
          <div className={styles.exSection}>
            <div className={styles.exSectionLabel}>Pseudocode</div>
            <pre className={styles.pseudoBlock}>{ex.pseudocode}</pre>
          </div>
        )}

        {activeSection === 'code' && (
          <div className={styles.exSection}>
            <div className={styles.exSectionLabel}>Java Code</div>
            <ReadOnlyCodeViewer code={ex.code} theme={theme} />
          </div>
        )}

        {activeSection === 'tracer' && ex.tracerSteps && (
          <div className={styles.exSection}>
            <div className={styles.exSectionLabel}>Step-by-Step Tracer</div>
            <TracerPlayer code={ex.code} tracerSteps={ex.tracerSteps} theme={theme} />
          </div>
        )}

        {activeSection === 'diagram' && ex.flowchartMermaid && (
          <div className={styles.exSection}>
            <div className={styles.exSectionLabel}>Flow Diagram</div>
            <FlowchartViewer definition={ex.flowchartMermaid} />
          </div>
        )}

        <div className={styles.exInsightRow}>
          {ex.explanation && (
            <div className={styles.exInsightCard}>
              <div className={styles.exInsightLabel}>💡 Key Insight</div>
              <p className={styles.exInsightText}>{ex.explanation}</p>
            </div>
          )}
          {ex.realWorldUse && (
            <div className={styles.exRealCard}>
              <div className={styles.exInsightLabel}>🌍 Real World Use</div>
              <p className={styles.exInsightText}>{ex.realWorldUse}</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

// ── YouTube helpers ───────────────────────────────────────────────────────────
function extractYoutubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

function parseYoutubeUrls(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
  } catch {
    // fallback: comma-separated
    return raw.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
}

function YoutubeVideosCard({ raw }) {
  const urls = parseYoutubeUrls(raw);
  if (!urls.length) return null;
  return (
    <div className={`${styles.theoryCard} ${styles.youtubeCard}`}>
      <div className={styles.cardTitle}>▶ Recommended Videos</div>
      <div className={styles.youtubeGrid}>
        {urls.map((url, i) => {
          const vid = extractYoutubeId(url);
          const thumb = vid ? `https://img.youtube.com/vi/${vid}/mqdefault.jpg` : null;
          return (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.youtubeItem}
              title={`Watch video ${i + 1}`}
            >
              {thumb ? (
                <img src={thumb} alt={`Video ${i + 1}`} className={styles.youtubeThumbnail} />
              ) : (
                <div className={styles.youtubePlaceholder}>▶</div>
              )}
              <span className={styles.youtubeLabel}>Video {i + 1}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

// Split text into sentences on ". " boundaries (only where next char is uppercase or end)
function splitSentences(text) {
  const raw = text.split(/\.\s+(?=[A-Z0-9])/);
  return raw.map(s => s.replace(/\.$/, '').trim()).filter(Boolean);
}

// Memory Anchor → scannable chips
function MemoryAnchorCard({ text }) {
  const chips = splitSentences(text);
  return (
    <div className={styles.anchorCard}>
      <div className={styles.anchorLabel}>⚡ Memory Anchor</div>
      <div className={styles.anchorChips}>
        {chips.map((chip, i) => {
          const colonIdx = chip.indexOf(':');
          const hasKey = colonIdx > 0 && colonIdx < 40;
          return (
            <span key={i} className={styles.anchorChip}>
              {hasKey ? (
                <>
                  <strong className={styles.chipKey}>{chip.slice(0, colonIdx)}</strong>
                  <span className={styles.chipVal}>{chip.slice(colonIdx)}</span>
                </>
              ) : chip}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// Story → narrative card with italic/amber feel
function StoryCard({ text }) {
  return (
    <div className={`${styles.theoryCard} ${styles.storyCard}`}>
      <div className={styles.cardTitle}>📖 The Story</div>
      <div className={`${styles.cardBody} ${styles.storyBody}`}>{text}</div>
    </div>
  );
}

// Analogy → key = value pairs
function AnalogyCard({ text }) {
  const sentences = splitSentences(text);
  return (
    <div className={`${styles.theoryCard} ${styles.analogyCard}`}>
      <div className={styles.cardTitle}>🔗 Visual Analogy</div>
      <div className={styles.analogyList}>
        {sentences.map((s, i) => {
          const eqIdx = s.indexOf(' = ');
          if (eqIdx > 0 && eqIdx < 60) {
            const concept = s.slice(0, eqIdx).trim();
            const meaning = s.slice(eqIdx + 3).trim();
            return (
              <div key={i} className={styles.analogyRow}>
                <span className={styles.analogyConcept}>{concept}</span>
                <span className={styles.analogyEq}>≡</span>
                <span className={styles.analogyMeaning}>{meaning}</span>
              </div>
            );
          }
          return <p key={i} className={`${styles.cardBody} ${styles.analogyNote}`}>{s}.</p>;
        })}
      </div>
    </div>
  );
}

// First Principles → numbered list with teal accent
function PrinciplesCard({ text }) {
  const sentences = splitSentences(text);
  return (
    <div className={`${styles.theoryCard} ${styles.principlesCard}`}>
      <div className={styles.cardTitle}>🔬 First Principles</div>
      <ol className={styles.principlesList}>
        {sentences.map((s, i) => (
          <li key={i} className={styles.principlesItem}>{s}.</li>
        ))}
      </ol>
    </div>
  );
}

// Generic fallback card (kept for any unexpected usage)
function TheoryCard({ icon, title, text }) {
  return (
    <div className={styles.theoryCard}>
      <div className={styles.cardTitle}>{icon} {title}</div>
      <div className={styles.cardBody}>{text}</div>
    </div>
  );
}

function ExamplesSkeletons() {
  return (
    <div className={styles.examplesGrid}>
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className={styles.exCardSkeleton}>
          <div className="skeleton" style={{ width: 60, height: 10, borderRadius: 4, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: '80%', height: 14, borderRadius: 4, marginBottom: 12 }} />
          <div style={{ display: 'flex', gap: 6 }}>
            <div className="skeleton" style={{ width: 55, height: 18, borderRadius: 10 }} />
            <div className="skeleton" style={{ width: 55, height: 18, borderRadius: 10 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
