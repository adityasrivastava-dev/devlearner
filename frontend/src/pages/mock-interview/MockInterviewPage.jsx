import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { mockInterviewApi, resumeApi } from '../../api';
import useFocusTrap from '../../hooks/useFocusTrap';
import styles from './MockInterviewPage.module.css';

// ── Voice constants ───────────────────────────────────────────────────────────
const VOICE_STORAGE_KEY   = 'devlearn_interview_voice';
const NEURAL_KEYWORDS     = ['natural', 'neural', 'online', 'enhanced', 'premium'];
const PREFERRED_FALLBACKS = [
  'Microsoft Aria', 'Microsoft Guy', 'Google US English',
  'Microsoft Jenny', 'Microsoft David', 'Karen', 'Daniel', 'Samantha',
];

function isNeuralVoice(voice) {
  return NEURAL_KEYWORDS.some(k => voice.name.toLowerCase().includes(k));
}

// ── Web Speech API TTS ────────────────────────────────────────────────────────
function useTTS() {
  const voicesRef = useRef([]);

  useEffect(() => {
    function load() { voicesRef.current = window.speechSynthesis?.getVoices() || []; }
    load();
    if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = load;
  }, []);

  function getBestVoice() {
    const voices = voicesRef.current;
    const saved  = localStorage.getItem(VOICE_STORAGE_KEY);
    if (saved) {
      const v = voices.find(v => v.name === saved);
      if (v) return v;
    }
    // Auto-select: neural English first
    const neuralEn = voices.filter(v => v.lang?.startsWith('en') && isNeuralVoice(v));
    if (neuralEn.length > 0) return neuralEn[0];
    for (const name of PREFERRED_FALLBACKS) {
      const v = voices.find(v => v.name.includes(name));
      if (v) return v;
    }
    return voices.find(v => v.lang?.startsWith('en')) || voices[0] || null;
  }

  const speak = useCallback((text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/[*_`#]/g, '').trim();
    const utt   = new SpeechSynthesisUtterance(clean);
    const voice = getBestVoice();
    if (voice) utt.voice = voice;
    utt.rate   = 0.92;
    utt.pitch  = 0.95;
    utt.volume = 1;
    window.speechSynthesis.speak(utt);
  }, []); // eslint-disable-line

  const stop = useCallback(() => window.speechSynthesis?.cancel(), []);

  return { speak, stop };
}

// ── useVoices — loads all browser voices ──────────────────────────────────────
function useVoices() {
  const [voices, setVoices] = useState([]);
  useEffect(() => {
    function load() { setVoices([...(window.speechSynthesis?.getVoices() || [])]); }
    load();
    if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = load;
  }, []);
  return voices;
}

// ── VoicePicker modal ─────────────────────────────────────────────────────────
function VoicePicker({ onClose }) {
  const voices   = useVoices();
  const [search,      setSearch]      = useState('');
  const [selected,    setSelected]    = useState(() => localStorage.getItem(VOICE_STORAGE_KEY) || '');
  const trapRef = useFocusTrap(true);
  const [previewName, setPreviewName] = useState('');

  function preview(voice) {
    window.speechSynthesis?.cancel();
    const utt = new SpeechSynthesisUtterance(
      "Hello, I'll be your interviewer today. Ready when you are."
    );
    utt.voice   = voice;
    utt.rate    = 0.92;
    utt.pitch   = 0.95;
    utt.volume  = 1;
    setPreviewName(voice.name);
    utt.onend = () => setPreviewName('');
    window.speechSynthesis?.speak(utt);
  }

  function pick(voice) {
    localStorage.setItem(VOICE_STORAGE_KEY, voice.name);
    setSelected(voice.name);
    preview(voice);
  }

  function resetAuto() {
    localStorage.removeItem(VOICE_STORAGE_KEY);
    setSelected('');
  }

  const enNeural   = voices.filter(v => v.lang?.startsWith('en') && isNeuralVoice(v));
  const enStandard = voices.filter(v => v.lang?.startsWith('en') && !isNeuralVoice(v));
  const other      = voices.filter(v => !v.lang?.startsWith('en'));
  const ordered    = [...enNeural, ...enStandard, ...other];

  const filtered = search
    ? ordered.filter(v =>
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.lang?.toLowerCase().includes(search.toLowerCase())
      )
    : ordered;

  return (
    <div className={styles.voicePickerOverlay} role="presentation" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={trapRef} className={styles.voicePickerModal} role="dialog" aria-modal="true" aria-label="Interviewer Voice">
        <div className={styles.voicePickerHeader}>
          <span className={styles.voicePickerTitle}>🎙 Interviewer Voice</span>
          <button className={styles.voicePickerClose} onClick={onClose}>✕</button>
        </div>

        <p className={styles.voicePickerHint}>
          <strong>⚡ Neural</strong> voices sound much more human. On Windows 11 look for <em>Microsoft Aria (Natural)</em> or <em>Microsoft Guy (Natural)</em>. On Mac try <em>Samantha</em> or <em>Daniel</em>.
        </p>

        <input
          className={styles.voiceSearch}
          placeholder="Search by name or language…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
        />

        <div className={styles.voiceList}>
          {filtered.length === 0 && (
            <div className={styles.voiceEmpty}>No voices match your search.</div>
          )}
          {filtered.map(v => {
            const neural = isNeuralVoice(v);
            const isSel  = selected === v.name;
            const isPrev = previewName === v.name;
            return (
              <div
                key={v.name}
                className={`${styles.voiceItem} ${isSel ? styles.voiceItemSelected : ''}`}
                onClick={() => pick(v)}
              >
                <div className={styles.voiceItemLeft}>
                  <span className={styles.voiceItemCheck}>{isSel ? '✓' : ''}</span>
                  <div>
                    <div className={styles.voiceItemName}>{v.name}</div>
                    <div className={styles.voiceItemLang}>{v.lang}</div>
                  </div>
                </div>
                <div className={styles.voiceItemRight}>
                  {neural && <span className={styles.neuralBadge}>⚡ Neural</span>}
                  <button
                    className={`${styles.previewBtn} ${isPrev ? styles.previewBtnActive : ''}`}
                    onClick={e => { e.stopPropagation(); preview(v); }}
                    title="Preview this voice"
                    type="button"
                  >
                    {isPrev ? '⏹' : '▶'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.voicePickerFooter}>
          <span className={styles.voicePickerSaved}>
            {selected
              ? `✓ ${selected}`
              : 'Auto (best available neural voice)'}
          </span>
          <div className={styles.voicePickerActions}>
            <button className={styles.voiceResetBtn} onClick={resetAuto}>Reset to Auto</button>
            <button className={styles.voiceDoneBtn}  onClick={onClose}>Done</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: 'DSA',           label: 'Data Structures & Algorithms', icon: '🎯' },
  { key: 'JAVA',          label: 'Core Java',                    icon: '☕' },
  { key: 'SPRING_BOOT',   label: 'Spring Boot',                  icon: '🍃' },
  { key: 'SYSTEM_DESIGN', label: 'System Design',                icon: '🏗' },
  { key: 'MYSQL',         label: 'MySQL / SQL',                  icon: '🗄' },
];
const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];
const DURATIONS    = [20, 30, 45, 60];

const DIFF_COLOR = { EASY: '#4ade80', MEDIUM: '#fbbf24', HARD: '#f87171' };

// ── Score circle ──────────────────────────────────────────────────────────────
function ScoreCircle({ score, label, color }) {
  return (
    <div className={styles.scoreCircle} style={{ borderColor: color + '66' }}>
      <span className={styles.scoreNum} style={{ color }}>{score}</span>
      <span className={styles.scoreLabel}>{label}</span>
    </div>
  );
}

// ── Resume-to-category mapping ────────────────────────────────────────────────
const RESUME_CAT_KEYWORDS = {
  DSA:           ['linked list','binary tree','graph','dynamic programming','recursion','sorting','heap','trie','stack','queue','arrays','algorithm','data structure'],
  JAVA:          ['java','jvm','oop','generics','collections','streams','lambda','multithreading','concurrency','garbage collection','exception handling'],
  SPRING_BOOT:   ['spring','spring boot','spring security','hibernate','jpa','rest','microservices','actuator','spring mvc'],
  SYSTEM_DESIGN: ['system design','distributed','caching','kafka','load balancing','message queue','oauth','jwt'],
  MYSQL:         ['mysql','sql','postgresql','database','indexing','joins','normalization','transactions','query optimization'],
};

function inferCategories(extractedTech) {
  const found = new Set();
  const lower = extractedTech.map(k => k.toLowerCase());
  for (const [cat, keywords] of Object.entries(RESUME_CAT_KEYWORDS)) {
    if (keywords.some(kw => lower.some(t => t.includes(kw)))) found.add(cat);
  }
  return found.size > 0 ? [...found] : ['DSA'];
}

// ── Shared difficulty + duration picker ───────────────────────────────────────
function DiffDurationPicker({ diff, setDiff, duration, setDuration }) {
  return (
    <div className={styles.setupRow}>
      <div className={styles.setupSection}>
        <div className={styles.setupLabel}>Difficulty</div>
        <div className={styles.diffRow}>
          {DIFFICULTIES.map(d => (
            <button
              key={d}
              className={`${styles.diffBtn} ${diff === d ? styles.diffBtnActive : ''}`}
              style={diff === d ? { borderColor: DIFF_COLOR[d], color: DIFF_COLOR[d] } : {}}
              onClick={() => setDiff(d)}
            >{d}</button>
          ))}
        </div>
      </div>
      <div className={styles.setupSection}>
        <div className={styles.setupLabel}>Duration</div>
        <div className={styles.diffRow}>
          {DURATIONS.map(d => (
            <button
              key={d}
              className={`${styles.diffBtn} ${duration === d ? styles.diffBtnActive : ''}`}
              onClick={() => setDuration(d)}
            >{d} min</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Setup screen ──────────────────────────────────────────────────────────────
function SetupScreen({ onStart }) {
  // mode: null | 'resume' | 'custom'
  const [mode,            setMode]            = useState(null);
  const [showVoicePicker, setShowVoicePicker] = useState(false);

  // resume flow state
  const [resumeStep,  setResumeStep]  = useState('upload'); // upload | confirm
  const [resumeData,  setResumeData]  = useState(null);
  const [inferredCats,setInferredCats]= useState([]);
  const [dragging,    setDragging]    = useState(false);
  const fileRef = useRef(null);

  // shared
  const [diff,     setDiff]     = useState('MEDIUM');
  const [duration, setDuration] = useState(45);
  const [cat,      setCat]      = useState('DSA');   // custom mode
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  // ── Resume upload handler
  async function handleResumeFile(file) {
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a PDF file.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await resumeApi.analyze(file);
      const cats  = inferCategories(data.extractedTech || []);
      setResumeData(data);
      setInferredCats(cats);
      setResumeStep('confirm');
    } catch (e) {
      setError(e.response?.data?.error || 'Could not read resume. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Start interview
  async function handleStart() {
    setLoading(true);
    setError(null);
    try {
      const category      = mode === 'resume' ? inferredCats[0] : cat;
      const resumeContext = mode === 'resume' && resumeData
        ? (resumeData.extractedTech || []).join(', ')
        : null;
      const data = await mockInterviewApi.start(category, diff, duration, resumeContext);
      onStart({ ...data, durationMinutes: duration });
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to start interview. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Mode picker
  if (!mode) return (
    <div className={styles.setup}>
      <div className={styles.setupCard}>
        <div className={styles.setupIcon}>🎤</div>
        <h1 className={styles.setupTitle}>Mock Interview Simulator</h1>
        <p className={styles.setupSubtitle}>AI interviewer · Real questions · Voice feedback</p>

        <div className={styles.modeGrid}>
          <button className={styles.modeCard} onClick={() => setMode('resume')}>
            <span className={styles.modeCardIcon}>📄</span>
            <span className={styles.modeCardTitle}>Based on My Resume</span>
            <span className={styles.modeCardDesc}>
              Upload your resume PDF — we'll extract your tech stack and ask questions tailored to what you've built.
            </span>
            <span className={styles.modeCardTag}>Personalised</span>
          </button>

          <button className={styles.modeCard} onClick={() => setMode('custom')}>
            <span className={styles.modeCardIcon}>🎯</span>
            <span className={styles.modeCardTitle}>Custom Setup</span>
            <span className={styles.modeCardDesc}>
              Choose the topic area, difficulty level, and duration yourself. Full control over your practice.
            </span>
            <span className={styles.modeCardTag}>Manual</span>
          </button>
        </div>

        <p className={styles.setupNote}>
          🎙 Browser voice reads questions aloud · No API cost · Works offline
        </p>

        <div className={styles.voiceSettingsRow}>
          <button className={styles.voiceSettingsBtn} onClick={() => setShowVoicePicker(true)}>
            ⚙ Voice Settings
          </button>
        </div>

        {showVoicePicker && <VoicePicker onClose={() => setShowVoicePicker(false)} />}
      </div>
    </div>
  );

  // ── Resume: upload step
  if (mode === 'resume' && resumeStep === 'upload') return (
    <div className={styles.setup}>
      <div className={styles.setupCard}>
        <button className={styles.backLink} onClick={() => { setMode(null); setError(null); }}>← Back</button>
        <div className={styles.setupIcon}>📄</div>
        <h1 className={styles.setupTitle}>Upload Your Resume</h1>
        <p className={styles.setupSubtitle}>We'll extract your tech stack and personalise the interview questions.</p>

        {loading ? (
          <div className={styles.analysingWrap}>
            <span className={styles.spinLg} />
            <span className={styles.analysingText}>Analysing your resume…</span>
          </div>
        ) : (
          <div
            className={`${styles.dropZone} ${dragging ? styles.dropZoneDrag : ''}`}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); handleResumeFile(e.dataTransfer.files[0]); }}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept=".pdf" className={styles.hiddenInput}
              onChange={e => handleResumeFile(e.target.files[0])} />
            <div className={styles.dropIcon}>📁</div>
            <div className={styles.dropLabel}>Drop your resume PDF here</div>
            <div className={styles.dropHint}>or click to browse · max 5 MB · PDF only</div>
          </div>
        )}

        {error && <div className={styles.errMsg}>{error}</div>}
      </div>
    </div>
  );

  // ── Resume: confirm inferred categories
  if (mode === 'resume' && resumeStep === 'confirm') return (
    <div className={styles.setup}>
      <div className={styles.setupCard}>
        <button className={styles.backLink} onClick={() => { setResumeStep('upload'); setResumeData(null); setError(null); }}>← Upload different resume</button>
        <div className={styles.setupIcon}>✅</div>
        <h1 className={styles.setupTitle}>Resume Analysed</h1>
        <p className={styles.setupSubtitle}>Found {resumeData?.totalFound || 0} tech keywords on your resume.</p>

        {/* Extracted tech pills */}
        <div className={styles.setupSection}>
          <div className={styles.setupLabel}>Extracted Tech Stack</div>
          <div className={styles.techPills}>
            {(resumeData?.extractedTech || []).map(kw => (
              <span key={kw} className={styles.techPill}>{kw}</span>
            ))}
          </div>
        </div>

        {/* Inferred focus areas */}
        <div className={styles.setupSection}>
          <div className={styles.setupLabel}>Interview will focus on</div>
          <div className={styles.inferredCats}>
            {inferredCats.map(key => {
              const c = CATEGORIES.find(c => c.key === key);
              return c ? (
                <span key={key} className={styles.inferredCatPill}>
                  {c.icon} {c.label}
                </span>
              ) : null;
            })}
          </div>
          <p className={styles.inferHint}>
            Questions are drawn from your primary area: <strong>{CATEGORIES.find(c => c.key === inferredCats[0])?.label}</strong>.
            The AI will reference your resume background in follow-ups.
          </p>
        </div>

        <DiffDurationPicker diff={diff} setDiff={setDiff} duration={duration} setDuration={setDuration} />

        {error && <div className={styles.errMsg}>{error}</div>}

        <button className={styles.startBtn} onClick={handleStart} disabled={loading}>
          {loading ? <><span className={styles.spinSm} /> Starting…</> : '▶  Start Interview'}
        </button>
      </div>
    </div>
  );

  // ── Custom setup
  return (
    <div className={styles.setup}>
      <div className={styles.setupCard}>
        <button className={styles.backLink} onClick={() => { setMode(null); setError(null); }}>← Back</button>
        <div className={styles.setupIcon}>🎯</div>
        <h1 className={styles.setupTitle}>Custom Interview Setup</h1>
        <p className={styles.setupSubtitle}>Choose what to be tested on.</p>

        <div className={styles.setupSection}>
          <div className={styles.setupLabel}>Topic Area</div>
          <div className={styles.catGrid}>
            {CATEGORIES.map(c => (
              <button
                key={c.key}
                className={`${styles.catBtn} ${cat === c.key ? styles.catBtnActive : ''}`}
                onClick={() => setCat(c.key)}
              >
                <span>{c.icon}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        <DiffDurationPicker diff={diff} setDiff={setDiff} duration={duration} setDuration={setDuration} />

        {error && <div className={styles.errMsg}>{error}</div>}

        <button className={styles.startBtn} onClick={handleStart} disabled={loading}>
          {loading ? <><span className={styles.spinSm} /> Starting…</> : '▶  Start Interview'}
        </button>

        <p className={styles.setupNote}>
          🎙 Browser voice reads questions aloud · No API cost
        </p>
      </div>
    </div>
  );
}

// ── Interview room ────────────────────────────────────────────────────────────
// ── Speech Recognition (voice input) ─────────────────────────────────────────
function useSpeechInput(onTranscript) {
  const recogRef  = useRef(null);
  const [active, setActive] = useState(false);

  function start() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Speech recognition not supported in this browser. Use Chrome or Edge.'); return; }
    const r = new SR();
    r.lang = 'en-US';
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (e) => {
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + ' ';
      }
      if (final) onTranscript(final);
    };
    r.onerror = () => setActive(false);
    r.onend   = () => setActive(false);
    r.start();
    recogRef.current = r;
    setActive(true);
  }

  function stop() {
    recogRef.current?.stop();
    setActive(false);
  }

  function toggle() { active ? stop() : start(); }

  return { active, toggle, stop };
}

// ── Mic button ────────────────────────────────────────────────────────────────
function MicButton({ active, onToggle, disabled }) {
  return (
    <button
      className={`${styles.micBtn} ${active ? styles.micBtnActive : ''}`}
      onClick={onToggle}
      disabled={disabled}
      title={active ? 'Stop recording' : 'Speak your answer'}
      type="button"
    >
      {active ? '⏹ Stop' : '🎙 Speak'}
      {active && <span className={styles.micPulse} />}
    </button>
  );
}

// ── Type config ───────────────────────────────────────────────────────────────
const TYPE_META = {
  APPROACH:   { label: 'Approach',    color: '#60a5fa', icon: '💬', lang: null },
  MCQ:        { label: 'MCQ',         color: '#a78bfa', icon: '🔘', lang: null },
  CODE:       { label: 'Write Code',  color: '#4ade80', icon: '✏️', lang: 'java' },
  SQL:        { label: 'Write SQL',   color: '#fbbf24', icon: '🗄',  lang: 'sql'  },
  FIND_OUTPUT:{ label: 'Find Output', color: '#f87171', icon: '🔍', lang: 'java' },
  PSEUDOCODE: { label: 'Pseudocode',  color: '#34d399', icon: '📋', lang: 'plaintext' },
  STEPS:      { label: 'Trace Steps', color: '#fb923c', icon: '👣', lang: 'plaintext' },
  DESIGN:     { label: 'Design',      color: '#e879f9', icon: '🏗',  lang: 'plaintext' },
};

// ── Answer widgets ─────────────────────────────────────────────────────────────

function MCQWidget({ options = [], selected, onSelect, disabled }) {
  const labels = ['A', 'B', 'C', 'D'];

  const { active, toggle } = useSpeechInput((transcript) => {
    const t = transcript.trim().toUpperCase();
    // Accept "A", "B", "C", "D" or option text match
    const byLabel = labels.findIndex(l => t.startsWith(l));
    if (byLabel >= 0 && byLabel < options.length) { onSelect(options[byLabel]); return; }
    const byText  = options.findIndex(o => t.includes(o.replace(/^[A-D]\)\s*/, '').toUpperCase().slice(0, 12)));
    if (byText >= 0) onSelect(options[byText]);
  });

  return (
    <div>
      <div className={styles.mcqToolbar}>
        <span className={styles.mcqHint}>Click an option or speak "A", "B", "C", or "D"</span>
        <MicButton active={active} onToggle={toggle} disabled={disabled} />
      </div>
      <div className={styles.mcqGrid}>
        {options.map((opt, i) => (
          <button
            key={i}
            className={`${styles.mcqOption} ${selected === opt ? styles.mcqSelected : ''}`}
            onClick={() => !disabled && onSelect(opt)}
            disabled={disabled}
          >
            <span className={styles.mcqLabel}>{labels[i]}</span>
            <span className={styles.mcqText}>{opt.replace(/^[A-D]\)\s*/, '')}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function CodePad({ value, onChange, language = 'java', readOnly = false, label }) {
  return (
    <div className={styles.codePadWrap}>
      <div className={styles.codePadHeader}>
        <span className={styles.codePadLabel}>{label || '📝 Notepad'}</span>
        <span className={styles.codePadHint}>✏️ Whiteboard — no execution</span>
      </div>
      <div className={styles.codePadEditor}>
        <Editor
          height="100%"
          language={language}
          value={value}
          onChange={v => onChange && onChange(v || '')}
          theme="vs-dark"
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            lineNumbers: 'on',
            wordWrap: 'on',
            readOnly,
            scrollBeyondLastLine: false,
            padding: { top: 10 },
            renderLineHighlight: readOnly ? 'none' : 'line',
          }}
        />
      </div>
    </div>
  );
}

function TextPad({ value, onChange, placeholder, rows = 8, disabled }) {
  const { active, toggle } = useSpeechInput((transcript) => {
    onChange((value || '') + transcript);
  });

  return (
    <div className={styles.textPadWrap}>
      <div className={styles.textPadToolbar}>
        <span className={styles.textPadLabel}>📝 Answer Pad</span>
        <MicButton active={active} onToggle={toggle} disabled={disabled} />
      </div>
      <textarea
        className={styles.textPad}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={active ? '🎙 Listening… speak your answer' : placeholder}
        rows={rows}
        disabled={disabled}
      />
    </div>
  );
}

function normalizeCode(raw) {
  if (!raw) return '';
  // AI sometimes returns literal \n instead of actual newlines; fix both cases
  return raw.replace(/\\n/g, '\n').replace(/\\t/g, '    ');
}

function FindOutputWidget({ code, answer, onAnswer, disabled }) {
  const { active, toggle } = useSpeechInput((transcript) => {
    onAnswer((answer || '') + transcript);
  });

  return (
    <div className={styles.findOutputWrap}>
      <div className={styles.foCodeLabel}>Given code:</div>
      <CodePad value={normalizeCode(code)} language="java" readOnly label="📄 Code (read-only)" />
      <div className={styles.foAnswerRow}>
        <div className={styles.foAnswerLabel}>What is the output?</div>
        <MicButton active={active} onToggle={toggle} disabled={disabled} />
      </div>
      <textarea
        className={styles.foAnswerInput}
        value={answer}
        onChange={e => onAnswer(e.target.value)}
        placeholder={active ? '🎙 Listening…' : 'Type or speak the exact output…'}
        rows={3}
        disabled={disabled}
      />
    </div>
  );
}

// ── Feedback toast ────────────────────────────────────────────────────────────
function FeedbackToast({ text, onNext, loading }) {
  return (
    <div className={styles.feedbackToast}>
      <div className={styles.feedbackToastIcon}>🤖</div>
      <div className={styles.feedbackToastText}>{text}</div>
      <button className={styles.feedbackToastNext} onClick={onNext} disabled={loading}>
        {loading ? <><span className={styles.spinSm} /> Loading next…</> : 'Next Question →'}
      </button>
    </div>
  );
}

// ── Interview Panel ───────────────────────────────────────────────────────────
function InterviewPanel({ session, onDebrief }) {
  const { speak, stop } = useTTS();

  const [qIndex,          setQIndex]          = useState(session.questionIndex ?? 0);
  const [question,        setQuestion]        = useState(session.question);
  const [answer,          setAnswer]          = useState('');
  const [feedback,        setFeedback]        = useState(null);
  const [loading,         setLoading]         = useState(false);
  const [finishing,       setFinishing]       = useState(false);
  const [timeLeft,        setTimeLeft]        = useState((session.durationMinutes ?? 45) * 60);
  const [muted,           setMuted]           = useState(false);
  const [speaking,        setSpeaking]        = useState(false);
  const [showVoicePicker, setShowVoicePicker] = useState(false);
  const timerRef = useRef(null);

  const total = session.totalQuestions ?? 5;
  const type  = question?.type || 'APPROACH';
  const meta  = TYPE_META[type] || TYPE_META.APPROACH;

  // Auto-speak intro when question changes
  useEffect(() => {
    if (!muted && question?.spokenIntro) speakText(question.spokenIntro);
  }, [question?.spokenIntro]); // eslint-disable-line

  // Countdown
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { clearInterval(timerRef.current); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  function speakText(text) {
    if (muted) return;
    setSpeaking(true);
    stop();
    speak(text);
    const check = setInterval(() => {
      if (!window.speechSynthesis?.speaking) { setSpeaking(false); clearInterval(check); }
    }, 300);
  }

  // Reset answer when question changes
  useEffect(() => { setAnswer(''); }, [qIndex]);

  async function handleSubmitAnswer() {
    const ans = answer.trim();
    if (!ans && type !== 'MCQ') return;
    setLoading(true);
    try {
      const data = await mockInterviewApi.answer(session.sessionId, ans, qIndex);
      setFeedback(data.feedback);
      speakText(data.feedback);
      if (data.done) {
        // All questions answered — go to finish
        setLoading(false);
      } else {
        setLoading(false);
        // Wait for user to click Next
        // Store next question for after toast
        session._nextQuestion = data.question;
        session._nextIndex    = data.questionIndex;
      }
    } catch {
      setFeedback('Could not evaluate answer. Please continue.');
      setLoading(false);
    }
  }

  async function handleNext() {
    if (session._nextQuestion) {
      setQuestion(session._nextQuestion);
      setQIndex(session._nextIndex);
      setFeedback(null);
      session._nextQuestion = null;
      session._nextIndex    = null;
    }
  }

  async function handleFinish() {
    setFinishing(true);
    stop();
    try {
      const data = await mockInterviewApi.finish(session.sessionId);
      onDebrief(data);
    } catch {
      setFinishing(false);
    }
  }

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs = String(timeLeft % 60).padStart(2, '0');
  const timerDanger = timeLeft < 300;
  const answered = !!feedback;
  const allDone  = answered && !session._nextQuestion;

  return (
    <div className={styles.panel}>
      {/* ── Top bar ── */}
      <div className={styles.panelBar}>
        <div className={styles.panelBarLeft}>
          <span className={styles.typeBadge} style={{ background: meta.color + '22', color: meta.color, borderColor: meta.color + '55' }}>
            {meta.icon} {meta.label}
          </span>
          <div className={styles.qProgress}>
            {Array.from({ length: total }, (_, i) => (
              <div key={i} className={`${styles.qDot} ${i < qIndex ? styles.qDotDone : i === qIndex ? styles.qDotActive : ''}`} />
            ))}
            <span className={styles.qCount}>Question {qIndex + 1} / {total}</span>
          </div>
        </div>
        <div className={styles.panelBarRight}>
          <span className={`${styles.timer} ${timerDanger ? styles.timerDanger : ''}`}>⏱ {mins}:{secs}</span>
          <button
            className={styles.voiceGearBtn}
            onClick={() => setShowVoicePicker(true)}
            title="Change voice"
            type="button"
          >⚙</button>
          <button className={`${styles.muteBtn} ${muted ? styles.muteBtnActive : ''}`}
            onClick={() => { setMuted(m => !m); if (!muted) stop(); }}>
            {muted ? '🔇' : '🔊'}
          </button>
          {speaking && !muted && <span className={styles.speakingDot} />}
          {showVoicePicker && <VoicePicker onClose={() => setShowVoicePicker(false)} />}
        </div>
      </div>

      {/* ── Main area ── */}
      <div className={styles.panelBody}>

        {/* ── Question card ── */}
        <div className={styles.questionCard}>
          <div className={styles.interviewerRow}>
            <span className={styles.interviewerAvatar}>🤖</span>
            <div>
              <div className={styles.interviewerName}>Interviewer</div>
              <div className={styles.interviewerSpeech}>{question?.spokenIntro}</div>
            </div>
            <button className={styles.replayVoice} onClick={() => speakText(question?.spokenIntro)} title="Replay">▶</button>
          </div>
          <div className={styles.questionText}>{question?.question}</div>
        </div>

        {/* ── Answer widget ── */}
        <div className={styles.answerArea}>
          {type === 'MCQ' && (
            <MCQWidget
              options={question?.options || []}
              selected={answer}
              onSelect={v => !answered && setAnswer(v)}
              disabled={answered}
            />
          )}

          {type === 'FIND_OUTPUT' && (
            <FindOutputWidget
              code={question?.code || '// (no code provided)'}
              answer={answer}
              onAnswer={v => !answered && setAnswer(v)}
              disabled={answered}
            />
          )}

          {(type === 'CODE' || type === 'SQL' || type === 'PSEUDOCODE') && (
            <CodePad
              value={answer || (question?.code ? normalizeCode(question.code) + '\n\n// Your solution:\n' : type === 'CODE' ? '// Write your solution here\n' : type === 'SQL' ? '-- Write your query here\n' : '// Write pseudocode here\n')}
              onChange={v => !answered && setAnswer(v)}
              language={meta.lang}
              label={type === 'SQL' ? '🗄 SQL Notepad' : type === 'PSEUDOCODE' ? '📋 Pseudocode Pad' : '✏️ Code Notepad (no execution)'}
            />
          )}

          {(type === 'APPROACH' || type === 'STEPS' || type === 'DESIGN') && (
            <TextPad
              value={answer}
              onChange={v => !answered && setAnswer(v)}
              disabled={answered}
              placeholder={
                type === 'STEPS'
                  ? 'Step 1: ...\nStep 2: ...\nStep 3: ...'
                  : type === 'DESIGN'
                  ? 'Draw your design here (ASCII, schema, class names, arrows...)'
                  : 'Type your answer here...'
              }
              rows={type === 'DESIGN' || type === 'STEPS' ? 12 : 8}
            />
          )}
        </div>

        {/* ── Feedback toast ── */}
        {feedback && !allDone && (
          <FeedbackToast text={feedback} onNext={handleNext} loading={loading} />
        )}

        {/* ── All done banner ── */}
        {allDone && (
          <div className={styles.allDoneBanner}>
            <span>🎉 All questions answered!</span>
            <button className={styles.finishBtn} onClick={handleFinish} disabled={finishing}>
              {finishing ? <><span className={styles.spinSm} /> Generating debrief…</> : 'Get Full Feedback →'}
            </button>
          </div>
        )}

        {/* ── Submit button ── */}
        {!answered && (
          <div className={styles.submitRow}>
            <button
              className={styles.submitAnswerBtn}
              onClick={handleSubmitAnswer}
              disabled={loading || (type !== 'MCQ' && !answer.trim())}
            >
              {loading
                ? <><span className={styles.spinSm} /> Evaluating…</>
                : '✓  Submit Answer'}
            </button>
            {type !== 'MCQ' && !answer.trim() && (
              <span className={styles.submitHint}>Write your answer above before submitting</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Debrief screen ────────────────────────────────────────────────────────────
function DebriefScreen({ debrief, onRetry, speak }) {
  const overall = debrief.overallScore;
  const color   = overall >= 8 ? '#4ade80' : overall >= 5 ? '#fbbf24' : '#f87171';

  // Parse strengths/improvements
  let strengths    = [];
  let improvements = [];
  try { strengths    = JSON.parse(debrief.strengths    || '[]'); } catch {}
  try { improvements = JSON.parse(debrief.improvements || '[]'); } catch {}

  useEffect(() => {
    speak(debrief.debriefSpeech || debrief.debriefText || 'Interview complete.');
  }, []); // eslint-disable-line

  return (
    <div className={styles.debrief}>
      <div className={styles.debriefCard}>
        <div className={styles.debriefHeader}>
          <span className={styles.debriefIcon}>🎯</span>
          <h2 className={styles.debriefTitle}>Interview Complete</h2>
        </div>

        <div className={styles.scoreRow}>
          <div className={styles.overallCircle} style={{ borderColor: color }}>
            <span className={styles.overallNum} style={{ color }}>{overall}</span>
            <span className={styles.overallLabel}>Overall</span>
          </div>
          <div className={styles.subScores}>
            <ScoreCircle score={debrief.approachScore}      label="Approach"      color="#60a5fa" />
            <ScoreCircle score={debrief.communicationScore} label="Communication" color="#a78bfa" />
            <ScoreCircle score={debrief.codeScore}          label="Code Quality"  color="#4ade80" />
          </div>
        </div>

        <div className={styles.debriefText}>{debrief.debriefText}</div>

        {strengths.length > 0 && (
          <div className={styles.feedbackBlock}>
            <div className={styles.feedbackTitle} style={{ color: '#4ade80' }}>✓ Strengths</div>
            <ul className={styles.feedbackList}>
              {strengths.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}

        {improvements.length > 0 && (
          <div className={styles.feedbackBlock}>
            <div className={styles.feedbackTitle} style={{ color: '#fbbf24' }}>↑ Areas to Improve</div>
            <ul className={styles.feedbackList}>
              {improvements.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}

        <div className={styles.debriefActions}>
          <button className={styles.retryBtn} onClick={onRetry}>Start New Interview</button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MockInterviewPage() {
  const navigate = useNavigate();
  const { speak } = useTTS();
  const [view,    setView]    = useState('setup');   // setup | room | debrief
  const [session, setSession] = useState(null);
  const [debrief, setDebrief] = useState(null);

  function handleStart(data) {
    setSession(data);
    setView('room');
  }

  function handleDebrief(data) {
    setDebrief(data);
    setView('debrief');
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.back} onClick={() => navigate(-1)}>← Back</button>
        <span className={styles.topBarTitle}>Mock Interview Simulator</span>
      </div>

      {view === 'setup'   && <SetupScreen onStart={handleStart} />}
      {view === 'room'    && session && (
        <InterviewPanel session={session} onDebrief={handleDebrief} />
      )}
      {view === 'debrief' && debrief && (
        <DebriefScreen
          debrief={debrief}
          onRetry={() => { setSession(null); setDebrief(null); setView('setup'); }}
          speak={speak}
        />
      )}
    </div>
  );
}
