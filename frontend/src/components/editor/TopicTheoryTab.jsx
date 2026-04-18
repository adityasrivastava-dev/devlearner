import { useState } from 'react';
import EmptyState from '../shared/EmptyState';
import styles from './TopicView.module.css';

// ── YouTube helpers ───────────────────────────────────────────────────────────
function extractYoutubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function parseYoutubeUrls(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
  } catch {
    return raw.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
}

function splitSentences(text) {
  return text.split(/\.\s+(?=[A-Z0-9])/).map(s => s.replace(/\.$/, '').trim()).filter(Boolean);
}

// ── Theory card sub-components ────────────────────────────────────────────────
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

function StoryCard({ text }) {
  return (
    <div className={`${styles.theoryCard} ${styles.storyCard}`}>
      <div className={styles.cardTitle}>📖 The Story</div>
      <div className={`${styles.cardBody} ${styles.storyBody}`}>{text}</div>
    </div>
  );
}

function AnalogyCard({ text }) {
  const sentences = splitSentences(text);
  return (
    <div className={`${styles.theoryCard} ${styles.analogyCard}`}>
      <div className={styles.cardTitle}>🔗 Visual Analogy</div>
      <div className={styles.analogyList}>
        {sentences.map((s, i) => {
          const eqIdx = s.indexOf(' = ');
          if (eqIdx > 0 && eqIdx < 60) {
            return (
              <div key={i} className={styles.analogyRow}>
                <span className={styles.analogyConcept}>{s.slice(0, eqIdx).trim()}</span>
                <span className={styles.analogyEq}>≡</span>
                <span className={styles.analogyMeaning}>{s.slice(eqIdx + 3).trim()}</span>
              </div>
            );
          }
          return <p key={i} className={`${styles.cardBody} ${styles.analogyNote}`}>{s}.</p>;
        })}
      </div>
    </div>
  );
}

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
              aria-label={`Watch recommended video ${i + 1}`}
            >
              {thumb ? (
                <img src={thumb} alt="" aria-hidden="true" className={styles.youtubeThumbnail} />
              ) : (
                <div className={styles.youtubePlaceholder} aria-hidden="true">▶</div>
              )}
              <span className={styles.youtubeLabel}>Video {i + 1}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

// ── Theory Gate ───────────────────────────────────────────────────────────────
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
      <label htmlFor="gate-note" className={styles.gateFormTitle}>
        ✍️ Write what you understood
      </label>
      <p id="gate-note-hint" className={styles.gateFormHint}>
        Before unlocking practice problems, write a short summary in your own words (minimum 20 characters).
        This forces active recall — the single best way to make knowledge stick.
      </p>
      <textarea
        id="gate-note"
        className={styles.gateTextarea}
        placeholder="e.g. Two pointers work when the array is sorted and we need to find a pair. We move left/right based on the sum comparison..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={4}
        aria-describedby="gate-note-hint gate-note-count"
      />
      <div className={styles.gateFormFooter}>
        <span
          id="gate-note-count"
          className={`${styles.gateCharCount} ${note.length >= 20 ? styles.gateCharOk : ''}`}
          aria-live="polite"
          aria-atomic="true"
        >
          {note.length >= 20
            ? '✓ Ready to unlock'
            : note.length === 0
              ? '20 characters minimum'
              : `${20 - note.length} more character${20 - note.length !== 1 ? 's' : ''} needed`}
        </span>
        <button
          className={styles.gateUnlockBtn}
          disabled={note.trim().length < 20 || completing}
          onClick={() => onComplete({ note: note.trim() })}
          aria-describedby="gate-note-count"
        >
          {completing ? 'Unlocking…' : '🔓 I Understood This — Unlock Practice'}
        </button>
      </div>
      {error && (
        <p className={styles.gateError} role="alert">
          {error?.response?.data?.error ?? 'Failed to save. Try again.'}
        </p>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function TopicTheoryTab({ topic, gate, gateLoading, completing, completeError, onComplete, onPractice }) {
  return (
    <div className={styles.theoryPanel}>
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
      {topic.memoryAnchor    && <MemoryAnchorCard text={topic.memoryAnchor} />}
      {topic.story           && <StoryCard text={topic.story} />}
      {topic.analogy         && <AnalogyCard text={topic.analogy} />}
      {topic.firstPrinciples && <PrinciplesCard text={topic.firstPrinciples} />}
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
      {topic.youtubeUrls && <YoutubeVideosCard raw={topic.youtubeUrls} />}
      {!topic.description && !topic.memoryAnchor && !topic.story && !topic.analogy && !topic.firstPrinciples && !topic.starterCode && (
        <EmptyState icon="✍️" title="Theory content not yet written." hint="An admin needs to add content for this topic." compact />
      )}
      {!gateLoading && (
        <TheoryGate
          gate={gate}
          completing={completing}
          error={completeError}
          onComplete={onComplete}
          onPractice={onPractice}
        />
      )}
    </div>
  );
}
