import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookmarksApi, notesApi, ratingsApi, gateApi, interviewApi, adminApi, userVideosApi, QUERY_KEYS } from '../../api';
import { getCategoryMeta } from '../../utils/helpers';
import styles from './TopicView.module.css';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import EmptyState from '../shared/EmptyState';

import TopicTheoryTab  from './TopicTheoryTab';
import TopicExamplesTab from './TopicExamplesTab';
import TopicPracticeTab from './TopicPracticeTab';

// ── Stage labels ──────────────────────────────────────────────────────────────
const STAGE_LABELS = {
  THEORY:   '📖 Theory',
  EASY:     '🟢 Easy',
  MEDIUM:   '🟡 Medium',
  HARD:     '🔴 Hard',
  MASTERED: '🏆 Mastered',
};

// ── Notes Panel ───────────────────────────────────────────────────────────────
function NotesPanel({ topicId }) {
  const queryClient = useQueryClient();
  const [noteText,  setNoteText]  = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText,  setEditText]  = useState('');

  const { data: notes = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.notes(topicId),
    queryFn:  () => notesApi.getByTopic(topicId),
    staleTime: 2 * 60 * 1000,
  });

  const { mutate: createNote, isPending: creating } = useMutation({
    mutationFn: (content) => notesApi.create(topicId, content),
    onSuccess: () => { setNoteText(''); queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notes(topicId) }); },
  });

  const { mutate: updateNote } = useMutation({
    mutationFn: ({ id, content }) => notesApi.update(id, content),
    onSuccess: () => { setEditingId(null); queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notes(topicId) }); },
  });

  const { mutate: deleteNote } = useMutation({
    mutationFn: (id) => notesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notes(topicId) }),
  });

  return (
    <div className={styles.notesPanel}>
      <div className={styles.noteForm}>
        <label htmlFor="note-input" className="sr-only">Write a note</label>
        <textarea
          id="note-input"
          className={`${styles.noteTextarea} ${noteText.length > 0 && noteText.trim().length === 0 ? styles.noteTextareaError : ''}`}
          placeholder="Write a note for this topic…"
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          rows={3}
          aria-label="Write a note for this topic"
          aria-describedby="note-hint"
        />
        <div className={styles.noteFormFooter}>
          {noteText.length > 0 && noteText.trim().length === 0 && (
            <span id="note-hint" className={styles.noteValidationHint} role="alert">
              Note cannot be only whitespace.
            </span>
          )}
          <button
            className="btn btn-primary btn-sm"
            disabled={!noteText.trim() || creating}
            onClick={() => createNote(noteText.trim())}
          >
            {creating ? 'Saving…' : '+ Save Note'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className={styles.loadingRow}><span className="spinner" />Loading notes…</div>
      ) : notes.length === 0 ? (
        <EmptyState icon="📝" title="No notes yet." hint="Write something above to capture your understanding." compact />
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
                    aria-label="Edit note"
                  />
                  <div className={styles.noteActions}>
                    <button className="btn btn-primary btn-sm" onClick={() => { if (editText.trim()) updateNote({ id: note.id, content: editText.trim() }); }}>Save</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.noteContent}>{note.content}</div>
                  <div className={styles.noteMeta}>
                    <span className={styles.noteDate}>{formatNoteDate(note.updatedAt)}</span>
                    <div className={styles.noteActions}>
                      <button className={styles.noteActionBtn} onClick={() => { setEditingId(note.id); setEditText(note.content); }}>Edit</button>
                      <button className={`${styles.noteActionBtn} ${styles.noteDelete}`} onClick={() => deleteNote(note.id)}>Delete</button>
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

function formatNoteDate(str) {
  if (!str) return '';
  try { return new Date(str).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return str; }
}

// ── Interview Q&A tab ─────────────────────────────────────────────────────────
function parseJsonOrLines(value) {
  if (!value) return [];
  const v = value.trim();
  if (v.startsWith('[')) { try { return JSON.parse(v).filter(Boolean); } catch { /**/ } }
  return v.split('\n').map(s => s.trim()).filter(Boolean);
}

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
      <div className={styles.qaHeader}>
        <div className={styles.qaHeaderLeft}>
          <span className={styles.qaHeaderIcon} aria-hidden="true">🎯</span>
          <div>
            <div className={styles.qaHeaderTitle}>Interview Q&amp;A</div>
            <div className={styles.qaHeaderSub}>
              {isLoading ? 'Loading…'
                : questions.length === 0 ? 'No questions found for this topic yet'
                : isTopicSpecific ? `${questions.length} questions specific to "${topicTitle}"`
                : `${questions.length} ${category?.replace(/_/g, ' ')} category questions`}
            </div>
          </div>
        </div>
        {isTopicSpecific && <span className={styles.qaBadgeSpecific}>Topic-specific</span>}
      </div>

      {isLoading && (
        <div className={styles.qaSkeleton}>
          {[1, 2, 3, 4, 5].map(i => <div key={i} className={styles.qaSkeletonItem} />)}
        </div>
      )}

      {!isLoading && questions.length === 0 && (
        <EmptyState
          icon="📭"
          title="No questions imported for this topic yet."
          hint="Ask an admin to import the Q&A batch files."
          compact
        />
      )}

      {!isLoading && questions.length > 0 && (
        <>
          <div className={styles.qaList}>
            {questions.map((q, i) => (
              <div key={q.id ?? i} className={`${styles.qaItem} ${expanded === i ? styles.qaItemOpen : ''}`}>
                <button
                  className={styles.qaQuestion}
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  aria-expanded={expanded === i}
                  aria-controls={`qa-answer-${i}`}
                >
                  <span className={styles.qaNum} aria-hidden="true">{i + 1}</span>
                  <span className={styles.qaText}>{q.question}</span>
                  <span className={styles.qaDiff} style={{ color: diffColor[q.difficulty] || '#94a3b8' }} aria-label={`Difficulty: ${q.difficulty === 'HIGH' ? 'Hard' : 'Medium'}`}>
                    {q.difficulty === 'HIGH' ? 'Hard' : 'Medium'}
                  </span>
                  <span className={`${styles.qaChevron} ${expanded === i ? styles.qaChevronOpen : ''}`} aria-hidden="true">›</span>
                </button>

                {expanded === i && (
                  <div id={`qa-answer-${i}`} className={styles.qaAnswer}>
                    {q.quickAnswer && (
                      <div className={styles.qaAnswerSection}>
                        <div className={styles.qaAnswerLabel}>Answer</div>
                        <div className={styles.qaAnswerText}>{q.quickAnswer}</div>
                      </div>
                    )}
                    {q.spokenAnswer && (
                      <div className={`${styles.qaAnswerSection} ${styles.qaSpokenSection}`}>
                        <div className={styles.qaAnswerLabel}>🗣 Say it like this</div>
                        <div className={styles.qaSpokenText}>{q.spokenAnswer}</div>
                        {q.timeToAnswer && <span className={styles.qaTimeBadge}>⏱ {q.timeToAnswer}</span>}
                      </div>
                    )}
                    {q.keyPoints && (
                      <div className={styles.qaAnswerSection}>
                        <div className={styles.qaAnswerLabel}>Key Points</div>
                        <ul className={styles.qaKeyPoints}>
                          {parseJsonOrLines(q.keyPoints).map((pt, pi) => (
                            <li key={pi} className={styles.qaKeyPoint}>
                              {pt.includes(':')
                                ? <><strong>{pt.split(':')[0]}</strong>:{pt.split(':').slice(1).join(':')}</>
                                : pt}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {q.commonMistakes && (
                      <div className={`${styles.qaAnswerSection} ${styles.qaMistakesSection}`}>
                        <div className={styles.qaAnswerLabel}>⚠ Common Mistakes</div>
                        <div className={styles.qaMistakesText}>{q.commonMistakes}</div>
                      </div>
                    )}
                    {q.seniorExpectation && (
                      <div className={`${styles.qaAnswerSection} ${styles.qaSeniorSection}`}>
                        <div className={styles.qaAnswerLabel}>🎯 Senior Level Adds</div>
                        <div className={styles.qaAnswerText}>{q.seniorExpectation}</div>
                      </div>
                    )}
                    {q.codeExample && (
                      <div className={styles.qaAnswerSection}>
                        <div className={styles.qaAnswerLabel}>Example</div>
                        <pre className={styles.qaCode}><code>{q.codeExample}</code></pre>
                      </div>
                    )}
                    {q.followUpQuestions && parseJsonOrLines(q.followUpQuestions).length > 0 && (
                      <div className={styles.qaAnswerSection}>
                        <div className={styles.qaAnswerLabel}>💬 Likely Follow-ups</div>
                        <ul className={styles.qaFollowUps}>
                          {parseJsonOrLines(q.followUpQuestions).map((fq, fi) => (
                            <li key={fi} className={styles.qaFollowUp}>→ {fq}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {(q.companiesAskThis || q.tags || q.relatedTopics) && (
                      <div className={styles.qaMetaRow}>
                        {q.companiesAskThis && parseJsonOrLines(q.companiesAskThis).length > 0 && (
                          <div className={styles.qaMetaGroup}>
                            <span className={styles.qaMetaLabel}>Asked by</span>
                            {parseJsonOrLines(q.companiesAskThis).map((c, ci) => <span key={ci} className={styles.qaCompanyBadge}>{c}</span>)}
                          </div>
                        )}
                        {q.tags && parseJsonOrLines(q.tags).length > 0 && (
                          <div className={styles.qaMetaGroup}>
                            {parseJsonOrLines(q.tags).map((t, ti) => <span key={ti} className={styles.qaTag}>#{t}</span>)}
                          </div>
                        )}
                        {q.relatedTopics && parseJsonOrLines(q.relatedTopics).length > 0 && (
                          <div className={styles.qaMetaGroup}>
                            <span className={styles.qaMetaLabel}>See also</span>
                            {parseJsonOrLines(q.relatedTopics).map((rt, ri) => <span key={ri} className={styles.qaRelatedTopic}>{rt}</span>)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
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

// ── Videos Tab ────────────────────────────────────────────────────────────────
function extractYoutubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function parseYoutubeUrls(raw) {
  if (!raw) return [];
  try { const p = JSON.parse(raw); if (Array.isArray(p)) return p.filter(Boolean); } catch { /**/ }
  return raw.split(',').map(s => s.trim()).filter(Boolean);
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
            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className={styles.youtubeItem} aria-label={`Watch recommended video ${i + 1}`}>
              {thumb
                ? <img src={thumb} alt="" aria-hidden="true" className={styles.youtubeThumbnail} />
                : <div className={styles.youtubePlaceholder} aria-hidden="true">▶</div>}
              <span className={styles.youtubeLabel}>Video {i + 1}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

function VideosTab({ topic, isAdmin, ytEditing, ytDraft, setYtDraft, setYtEditing, saveYtMutation }) {
  const queryClient = useQueryClient();
  const [addUrl,   setAddUrl]   = useState('');
  const [addTitle, setAddTitle] = useState('');
  const [adding,   setAdding]   = useState(false);

  const { data: userVideos = [], isLoading: uvLoading } = useQuery({
    queryKey: QUERY_KEYS.userVideos(topic.id),
    queryFn:  () => userVideosApi.getForTopic(topic.id),
    staleTime: 60 * 1000,
  });

  const addMutation = useMutation({
    mutationFn: ({ url, title }) => userVideosApi.add(topic.id, url, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userVideos(topic.id) });
      setAddUrl(''); setAddTitle(''); setAdding(false);
      toast.success('Video added');
    },
    onError: () => toast.error('Failed to add video'),
  });

  const removeMutation = useMutation({
    mutationFn: (videoId) => userVideosApi.remove(topic.id, videoId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userVideos(topic.id) }); toast.success('Video removed'); },
    onError: () => toast.error('Failed to remove'),
  });

  return (
    <div className={styles.videosTab}>
      <div className={styles.ytSection}>
        <div className={styles.ytSectionHeader}>
          <span className={styles.ytSectionTitle}>▶ Reference Videos</span>
          <span className={styles.ytSectionSub}>Added by admin · visible to everyone</span>
          {isAdmin && !ytEditing && (
            <button className={styles.ytEditBtn} onClick={() => { setYtDraft(topic.youtubeUrls || ''); setYtEditing(true); }}>
              {topic.youtubeUrls ? '✎ Edit' : '+ Add'}
            </button>
          )}
        </div>
        {ytEditing ? (
          <div className={styles.ytEditBox}>
            <textarea
              className={styles.ytInput}
              value={ytDraft}
              onChange={e => setYtDraft(e.target.value)}
              rows={4}
              placeholder={'Paste YouTube URLs, one per line or JSON array:\n["https://youtu.be/abc", "https://youtu.be/xyz"]'}
              aria-label="YouTube URLs for this topic"
              autoFocus
            />
            <div className={styles.ytBtnRow}>
              <button className="btn btn-primary btn-sm" disabled={saveYtMutation.isPending} onClick={() => saveYtMutation.mutate(ytDraft)}>
                {saveYtMutation.isPending ? 'Saving…' : 'Save'}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setYtEditing(false)}>Cancel</button>
            </div>
          </div>
        ) : topic.youtubeUrls ? (
          <YoutubeVideosCard raw={topic.youtubeUrls} />
        ) : (
          <div className={styles.ytEmpty}>
            {isAdmin ? 'No shared videos yet. Click "+ Add" to add links.' : 'No reference videos added by admin yet.'}
          </div>
        )}
      </div>

      <div className={`${styles.ytSection} ${styles.ytSectionSpaced}`}>
        <div className={styles.ytSectionHeader}>
          <span className={styles.ytSectionTitle}>📌 My Videos</span>
          <span className={styles.ytSectionSub}>Only visible to you</span>
          {!adding && (
            <button className={styles.ytEditBtn} onClick={() => setAdding(true)}>+ Add Video</button>
          )}
        </div>

        {adding && (
          <div className={styles.ytAddBox}>
            <input
              className={`${styles.ytInput} ${styles.ytInputField}`}
              value={addUrl}
              onChange={e => setAddUrl(e.target.value)}
              placeholder="YouTube URL  (e.g. https://youtu.be/abc123)"
              aria-label="YouTube video URL"
              autoFocus
            />
            <input
              className={`${styles.ytInput} ${styles.ytInputFieldTitle}`}
              value={addTitle}
              onChange={e => setAddTitle(e.target.value)}
              placeholder="Title (optional)"
              aria-label="Video title (optional)"
            />
            <div className={styles.ytBtnRow}>
              <button className="btn btn-primary btn-sm" disabled={addMutation.isPending} onClick={() => { if (!addUrl.trim()) return toast.error('Paste a YouTube URL first'); addMutation.mutate({ url: addUrl.trim(), title: addTitle.trim() }); }}>
                {addMutation.isPending ? 'Adding…' : 'Add'}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setAdding(false); setAddUrl(''); setAddTitle(''); }}>Cancel</button>
            </div>
          </div>
        )}

        {uvLoading ? (
          <div className={styles.ytEmpty}>Loading…</div>
        ) : userVideos.length === 0 ? (
          <div className={styles.ytEmpty}>No videos saved yet. Click "+ Add Video" to add your own links.</div>
        ) : (
          <div className={styles.userVideoList}>
            {userVideos.map((v) => {
              const vid = extractYoutubeId(v.url);
              const thumb = vid ? `https://img.youtube.com/vi/${vid}/mqdefault.jpg` : null;
              return (
                <div key={v.id} className={styles.userVideoItem}>
                  <a href={v.url} target="_blank" rel="noopener noreferrer" className={styles.userVideoLink}>
                    {thumb
                      ? <img src={thumb} alt="" aria-hidden="true" className={styles.userVideoThumb} />
                      : <div className={styles.youtubePlaceholder} aria-hidden="true">▶</div>}
                    <span className={styles.userVideoTitle}>{v.title || v.url}</span>
                  </a>
                  {isAdmin && (
                    <button className={styles.userVideoDelete} onClick={() => removeMutation.mutate(v.id)} disabled={removeMutation.isPending} aria-label="Remove video">✕</button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function TopicView({ topic, onProblemOpen, onBack, onPrev, onNext, theme = 'dark', backLabel = '← Home' }) {
  const [tab, setTab] = useState('theory');
  const queryClient = useQueryClient();

  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.roles?.includes('ADMIN');
  const [ytEditing, setYtEditing] = useState(false);
  const [ytDraft, setYtDraft] = useState('');

  useEffect(() => { setTab('theory'); }, [topic.id]);

  // ── Gate ──────────────────────────────────────────────────────────────────
  const { data: gate, isLoading: gateLoading } = useQuery({
    queryKey: QUERY_KEYS.gateStatus(topic.id),
    queryFn:  () => gateApi.getStatus(topic.id),
    staleTime: 30 * 1000,
  });

  const { mutate: completeTheory, isPending: completing, error: completeError } = useMutation({
    mutationFn: ({ note }) => gateApi.completeTheory(topic.id, note),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.gateStatus(topic.id) }),
  });

  // ── Rating ────────────────────────────────────────────────────────────────
  const { data: ratingData, refetch: refetchRating } = useQuery({
    queryKey: QUERY_KEYS.topicRating(topic.id),
    queryFn:  () => ratingsApi.get(topic.id),
    staleTime: 60 * 1000,
  });

  const { mutate: submitRating, isPending: ratingPending } = useMutation({
    mutationFn: (stars) => ratingsApi.rate(topic.id, stars),
    onSuccess: () => refetchRating(),
  });

  // ── Bookmark ──────────────────────────────────────────────────────────────
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

  // ── Videos admin save ─────────────────────────────────────────────────────
  const saveYtMutation = useMutation({
    mutationFn: (urls) => adminApi.updateTopic(topic.id, { ...topic, youtubeUrls: urls }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: QUERY_KEYS.topic(topic.id) }); setYtEditing(false); toast.success('YouTube URLs saved'); },
    onError: () => toast.error('Failed to save'),
  });

  const stage            = gate?.stage ?? 'THEORY';
  const theoryDone       = gate?.theoryCompleted ?? false;
  const practiceUnlocked = theoryDone;
  const catMeta          = getCategoryMeta(topic.category);

  const TABS = [
    { key: 'theory',   label: 'Theory',   icon: '📖' },
    { key: 'examples', label: 'Examples', icon: '💡' },
    { key: 'practice', label: 'Practice', icon: '🎯', locked: !practiceUnlocked },
    { key: 'optimize', label: 'Approach', icon: '⚡' },
    { key: 'qa',       label: 'Q&A',      icon: '🎯' },
    { key: 'notes',    label: 'Notes',    icon: '📝' },
    { key: 'videos',   label: 'Videos',   icon: '▶' },
  ];

  return (
    <div className={styles.topicView}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          {onBack && (
            <button className={styles.backBtn} onClick={onBack} title="Go back">{backLabel}</button>
          )}
          {(onPrev || onNext) && (
            <div className={styles.topicNav}>
              <button className={styles.topicNavBtn} onClick={onPrev} disabled={!onPrev} title="Previous topic">‹ Prev</button>
              <button className={styles.topicNavBtn} onClick={onNext} disabled={!onNext} title="Next topic">Next ›</button>
            </div>
          )}
          <span className={`badge ${catMeta.cls}`}>{catMeta.label}</span>
          <h1 className={styles.title}>{topic.title}</h1>

          {!gateLoading && (
            <span className={`${styles.stageBadge} ${styles[`stage${stage}`]}`}>
              {STAGE_LABELS[stage]}
            </span>
          )}

          <button
            className={`${styles.bookmarkBtn} ${isBookmarked ? styles.bookmarked : ''}`}
            onClick={toggleBookmark}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark this topic'}
            aria-pressed={isBookmarked}
          >
            <span aria-hidden="true">{isBookmarked ? '★' : '☆'}</span>
          </button>

          <div
            className={styles.starRating}
            role="group"
            aria-label={ratingData?.count > 0 ? `Rating: ${ratingData.average} out of 5 (${ratingData.count} ratings)` : 'Rate this topic'}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                className={`${styles.starBtn} ${star <= (ratingData?.myRating ?? 0) ? styles.starFilled : ''}`}
                onClick={() => !ratingPending && submitRating(star)}
                aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                aria-pressed={star <= (ratingData?.myRating ?? 0)}
              ><span aria-hidden="true">★</span></button>
            ))}
            {ratingData?.count > 0 && <span className={styles.ratingAvg}>{ratingData.average}</span>}
          </div>
        </div>
        {topic.description && <p className={styles.desc}>{topic.description}</p>}
      </div>

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <div className={styles.tabBar} role="tablist" aria-label="Topic sections">
        {TABS.map(({ key, label, icon, locked }) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            aria-controls={`tabpanel-${key}`}
            aria-disabled={locked ? true : undefined}
            className={`${styles.tabBtn} ${tab === key ? styles.tabActive : ''} ${locked ? styles.tabLocked : ''}`}
            onClick={() => !locked && setTab(key)}
            title={locked ? 'Complete theory to unlock practice' : undefined}
          >
            <span className={styles.tabIcon} aria-hidden="true">{locked ? '🔒' : icon}</span>
            <span className={styles.tabLabel}>{label}</span>
          </button>
        ))}
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className={styles.body} role="tabpanel" id={`tabpanel-${tab}`} aria-label={tab}>

        {tab === 'theory' && (
          <TopicTheoryTab
            topic={topic}
            gate={gate}
            gateLoading={gateLoading}
            completing={completing}
            completeError={completeError}
            onComplete={({ note }) => completeTheory({ note })}
            onPractice={() => setTab('practice')}
          />
        )}

        {tab === 'examples' && (
          <TopicExamplesTab topicId={topic.id} theme={theme} />
        )}

        {tab === 'practice' && (
          <TopicPracticeTab
            topicId={topic.id}
            gate={gate}
            stage={stage}
            practiceUnlocked={practiceUnlocked}
            onProblemOpen={onProblemOpen}
            onGoToTheory={() => setTab('theory')}
          />
        )}

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
                    topic[key] || <span className={styles.notSpecified}>Not specified</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'qa' && (
          <TopicInterviewQuestions category={topic.category} topicTitle={topic.title} />
        )}

        {tab === 'notes' && (
          <div className={styles.notesTabWrap}>
            <NotesPanel key={topic.id} topicId={topic.id} />
          </div>
        )}

        {tab === 'videos' && (
          <VideosTab
            topic={topic}
            isAdmin={isAdmin}
            ytEditing={ytEditing}
            ytDraft={ytDraft}
            setYtDraft={setYtDraft}
            setYtEditing={setYtEditing}
            saveYtMutation={saveYtMutation}
          />
        )}

      </div>
    </div>
  );
}
