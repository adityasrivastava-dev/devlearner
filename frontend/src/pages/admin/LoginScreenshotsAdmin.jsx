import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { screenshotsApi, QUERY_KEYS } from '../../api';
import toast from 'react-hot-toast';

const SLIDE_KEYS = [
  'overview', 'gate-system', 'interview-mode', 'spaced-repetition',
  'analytics', 'algorithms', 'complexity', 'habit-engine',
  'interview-qa', 'mastery-map', 'daily-challenge', 'timetable',
  'mcq-quiz', 'roadmap', 'quick-win',
];

const LABELS = {
  'overview':           'Overview',
  'gate-system':        'Gate System',
  'interview-mode':     'Interview Mode',
  'spaced-repetition':  'Spaced Repetition',
  'analytics':          'Analytics',
  'algorithms':         'Algorithms',
  'complexity':         'Complexity',
  'habit-engine':       'Habit Engine',
  'interview-qa':       'Interview Q&A',
  'mastery-map':        'Mastery Map',
  'daily-challenge':    'Daily Challenge',
  'timetable':          'Timetable',
  'mcq-quiz':           'MCQ Quiz',
  'roadmap':            'Roadmap',
  'quick-win':          'Quick Win',
};

export default function LoginScreenshotsAdmin() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [caption, setCaption] = useState('');
  const [base64Data, setBase64Data] = useState(null);
  const fileRef = useRef(null);

  const { data: screenshots = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.screenshots,
    queryFn: screenshotsApi.getAll,
    staleTime: 60 * 1000,
  });

  const screenshotMap = Object.fromEntries(
    screenshots.map((s) => [s.slideKey, s])
  );

  const saveMutation = useMutation({
    mutationFn: (data) => screenshotsApi.save(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.screenshots });
      toast.success('Screenshot saved');
    },
    onError: () => toast.error('Failed to save screenshot'),
  });

  const deleteMutation = useMutation({
    mutationFn: (slideKey) => screenshotsApi.delete(slideKey),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.screenshots });
      toast.success('Screenshot deleted');
      closeForm();
    },
    onError: () => toast.error('Failed to delete screenshot'),
  });

  function openCard(slideKey) {
    const existing = screenshotMap[slideKey];
    setSelected(slideKey);
    setCaption(existing?.caption || '');
    setPreviewUrl(existing?.imageData || null);
    setBase64Data(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  function closeForm() {
    setSelected(null);
    setPreviewUrl(null);
    setCaption('');
    setBase64Data(null);
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setBase64Data(dataUrl);
      setPreviewUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  function handleSave() {
    if (!selected) return;
    const imageData = base64Data || screenshotMap[selected]?.imageData || '';
    if (!imageData) { toast.error('Please select an image first'); return; }
    saveMutation.mutate({ slideKey: selected, imageData, caption });
  }

  function handleDelete() {
    if (!selected) return;
    deleteMutation.mutate(selected);
  }

  const isBusy = saveMutation.isPending || deleteMutation.isPending;
  const hasExisting = !!screenshotMap[selected]?.imageData;

  return (
    <div style={{ padding: '24px 28px', color: 'var(--text)', maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Login Screenshots</h2>
        <p style={{ margin: '5px 0 0', color: 'var(--text2)', fontSize: '13px' }}>
          Click a feature to upload or replace its screenshot on the login page carousel.
        </p>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

        {/* Left — card list */}
        <div style={{
          flex: '0 0 340px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          maxHeight: 'calc(100vh - 160px)',
          overflowY: 'auto',
          paddingRight: 4,
        }}>
          {isLoading
            ? <div style={{ color: 'var(--text2)', padding: '12px 0' }}>Loading…</div>
            : SLIDE_KEYS.map((key) => {
                const has = !!screenshotMap[key]?.imageData;
                const isActive = selected === key;
                return (
                  <button
                    key={key}
                    onClick={() => openCard(key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      background: isActive ? 'var(--accent3)' : 'var(--bg2)',
                      border: `1.5px solid ${isActive ? 'var(--accent3)' : 'var(--border2)'}`,
                      borderRadius: 8,
                      cursor: 'pointer',
                      color: isActive ? '#fff' : 'var(--text)',
                      textAlign: 'left',
                      transition: 'all 0.12s',
                      width: '100%',
                    }}
                  >
                    {/* Status dot */}
                    <span style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      flexShrink: 0,
                      background: has ? '#4ade80' : (isActive ? 'rgba(255,255,255,0.4)' : 'var(--border2)'),
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 12,
                        fontWeight: 700,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {LABELS[key]}
                      </div>
                      <div style={{
                        fontSize: 10,
                        opacity: 0.55,
                        marginTop: 1,
                        fontFamily: 'var(--font-code)',
                      }}>
                        {key}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 10,
                      padding: '1px 7px',
                      borderRadius: 10,
                      fontWeight: 700,
                      background: has
                        ? (isActive ? 'rgba(255,255,255,0.2)' : 'rgba(74,222,128,0.12)')
                        : (isActive ? 'rgba(255,255,255,0.15)' : 'var(--bg3)'),
                      color: has
                        ? (isActive ? '#fff' : '#4ade80')
                        : (isActive ? 'rgba(255,255,255,0.7)' : 'var(--text3)'),
                      flexShrink: 0,
                    }}>
                      {has ? '✓ set' : 'empty'}
                    </span>
                  </button>
                );
              })
          }
        </div>

        {/* Right — editor panel */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {!selected ? (
            <div style={{
              height: 320,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              background: 'var(--bg2)',
              border: '1.5px dashed var(--border2)',
              borderRadius: 12,
              color: 'var(--text3)',
            }}>
              <div style={{ fontSize: 32 }}>🖼</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Select a feature to edit</div>
              <div style={{ fontSize: 12 }}>Click any item on the left to upload or change its screenshot</div>
            </div>
          ) : (
            <div style={{
              background: 'var(--bg2)',
              border: '1.5px solid var(--border2)',
              borderRadius: 12,
              overflow: 'hidden',
            }}>
              {/* Panel header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--bg3)',
              }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{LABELS[selected]}</span>
                  <span style={{
                    marginLeft: 8,
                    fontSize: 11,
                    color: 'var(--text3)',
                    fontFamily: 'var(--font-code)',
                  }}>
                    {selected}
                  </span>
                </div>
                <button
                  onClick={closeForm}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text3)',
                    cursor: 'pointer',
                    fontSize: 20,
                    lineHeight: 1,
                    padding: '0 2px',
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Image preview */}
                {previewUrl ? (
                  <div style={{
                    borderRadius: 8,
                    overflow: 'hidden',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                  }}>
                    <img
                      src={previewUrl}
                      alt="Preview"
                      style={{
                        width: '100%',
                        maxHeight: 260,
                        objectFit: 'contain',
                        display: 'block',
                      }}
                    />
                  </div>
                ) : (
                  <div
                    onClick={() => fileRef.current?.click()}
                    style={{
                      height: 140,
                      background: 'var(--bg)',
                      border: '1.5px dashed var(--border2)',
                      borderRadius: 8,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      color: 'var(--text3)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: 24 }}>📁</div>
                    <div style={{ fontSize: 13 }}>Click to select an image</div>
                    <div style={{ fontSize: 11 }}>PNG, JPG, WebP</div>
                  </div>
                )}

                {/* File input */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6 }}>
                    Image file
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '8px 10px',
                      background: 'var(--bg)',
                      border: '1px solid var(--border2)',
                      borderRadius: 6,
                      color: 'var(--text)',
                      fontSize: 13,
                      cursor: 'pointer',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Caption */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6 }}>
                    Caption <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                  </div>
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Short description shown below the image…"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--bg)',
                      border: '1px solid var(--border2)',
                      borderRadius: 6,
                      color: 'var(--text)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                  <button
                    onClick={handleSave}
                    disabled={isBusy}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: 'var(--accent3)',
                      border: 'none',
                      borderRadius: 7,
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: isBusy ? 'not-allowed' : 'pointer',
                      opacity: isBusy ? 0.6 : 1,
                      fontFamily: 'var(--font-ui)',
                    }}
                  >
                    {saveMutation.isPending ? 'Saving…' : 'Save Screenshot'}
                  </button>

                  {hasExisting && (
                    <button
                      onClick={handleDelete}
                      disabled={isBusy}
                      style={{
                        padding: '10px 16px',
                        background: 'transparent',
                        border: '1px solid rgba(239,68,68,0.4)',
                        borderRadius: 7,
                        color: '#f87171',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: isBusy ? 'not-allowed' : 'pointer',
                        opacity: isBusy ? 0.6 : 1,
                        fontFamily: 'var(--font-ui)',
                      }}
                    >
                      {deleteMutation.isPending ? 'Deleting…' : 'Remove'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
