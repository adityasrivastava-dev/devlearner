import { useRef, useEffect, useState } from 'react';
import MonacoEditor from '@monaco-editor/react';

const themeReady = { current: false };

const DARK_THEME = {
  base: 'vs-dark', inherit: true,
  rules: [
    { token: 'keyword',           foreground: 'C792EA', fontStyle: 'bold' },
    { token: 'type',              foreground: 'FFCB6B' },
    { token: 'identifier',        foreground: 'EEFFFF' },
    { token: 'string',            foreground: 'C3E88D' },
    { token: 'number',            foreground: 'F78C6C' },
    { token: 'comment',           foreground: '546E7A', fontStyle: 'italic' },
    { token: 'annotation',        foreground: 'FFCB6B', fontStyle: 'italic' },
    { token: 'delimiter',         foreground: '89DDFF' },
    { token: 'delimiter.bracket', foreground: 'FFCB6B' },
    { token: 'operator',          foreground: '89DDFF' },
  ],
  colors: {
    'editor.background':              '#0d1117',
    'editor.foreground':              '#e2e8f0',
    'editor.lineHighlightBackground': '#1a1e2a',
    'editorLineNumber.foreground':    '#4d5767',
    'editorLineNumber.activeForeground': '#a0aec0',
    'editorGutter.background':        '#0d1117',
    'editor.selectionBackground':     '#264f7820',
    'scrollbar.shadow':               '#00000000',
  },
};

const LIGHT_THEME = {
  base: 'vs', inherit: true,
  rules: [
    { token: 'keyword',    foreground: '7c3aed', fontStyle: 'bold' },
    { token: 'string',     foreground: '16a34a' },
    { token: 'number',     foreground: 'ea580c' },
    { token: 'comment',    foreground: '9ca3af', fontStyle: 'italic' },
    { token: 'type',       foreground: '0891b2' },
    { token: 'annotation', foreground: 'b45309', fontStyle: 'italic' },
  ],
  colors: {
    'editor.background':              '#f8fafc',
    'editor.lineHighlightBackground': '#f1f5f9',
    'editorLineNumber.foreground':    '#94a3b8',
  },
};

const LINE_HEIGHT = 21; // px — matches Monaco default at fontSize 13
const PADDING     = 24; // top + bottom padding

/**
 * ReadOnlyCodeViewer — Monaco-powered syntax-highlighted read-only viewer.
 *
 * Props:
 *   code          string   source code
 *   language      string   monaco language (default 'java')
 *   theme         string   'dark' | 'light'
 *   highlightLine number   line to highlight (tracer active line)
 *   maxLines      number   cap height at N lines then scroll inside Monaco
 *                          default: undefined = expand to full height (no inner scroll)
 */
export default function ReadOnlyCodeViewer({
  code = '',
  language = 'java',
  theme = 'dark',
  highlightLine = null,
  maxLines,          // optional cap — if omitted, editor expands fully
}) {
  const editorRef  = useRef(null);
  const monacoRef  = useRef(null);
  const decorRef   = useRef([]);
  const [ready, setReady] = useState(false);

  const lineCount    = Math.max((code || '').split('\n').length, 1);
  // If maxLines given, cap and show inner scrollbar; otherwise full height, no scroll
  const visLines     = maxLines ? Math.min(lineCount, maxLines) : lineCount;
  const editorHeight = visLines * LINE_HEIGHT + PADDING;

  function handleMount(editor, monaco) {
    editorRef.current = editor;
    monacoRef.current = monaco;

    if (!themeReady.current) {
      monaco.editor.defineTheme('rv-dark',  DARK_THEME);
      monaco.editor.defineTheme('rv-light', LIGHT_THEME);
      themeReady.current = true;
    }
    monaco.editor.setTheme(theme === 'light' ? 'rv-light' : 'rv-dark');
    setReady(true);
  }

  // Apply highlight decoration when highlightLine changes
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !ready) return;
    const monaco = monacoRef.current;

    decorRef.current = editorRef.current.deltaDecorations(decorRef.current, []);

    if (highlightLine != null && highlightLine > 0) {
      decorRef.current = editorRef.current.deltaDecorations([], [{
        range: new monaco.Range(highlightLine, 1, highlightLine, 1),
        options: {
          isWholeLine:        true,
          className:          'tracer-active-line',     // row background
          linesDecorationsClassName: 'tracer-active-indicator', // left gutter arrow
        },
      }]);
      editorRef.current.revealLineInCenter(highlightLine);
    }
  }, [highlightLine, ready]);

  // Sync theme
  useEffect(() => {
    if (!monacoRef.current || !ready) return;
    monacoRef.current.editor.setTheme(theme === 'light' ? 'rv-light' : 'rv-dark');
  }, [theme, ready]);

  return (
    <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
      <MonacoEditor
        height={editorHeight}
        language={language}
        value={code}
        theme={theme === 'light' ? 'rv-light' : 'rv-dark'}
        onMount={handleMount}
        options={{
          readOnly:              true,
          readOnlyMessage:       { value: '' },
          fontSize:              13,
          lineHeight:            LINE_HEIGHT,
          fontFamily:            "'JetBrains Mono', 'Fira Code', monospace",
          fontLigatures:         true,
          lineNumbers:           'on',
          lineNumbersMinChars:   4,   // enough room so gutter doesn't touch code
          lineDecorationsWidth:  6,   // small gap between gutter and code
          glyphMargin:           false,
          folding:               false,
          minimap:               { enabled: false },
          // No inner scroll when maxLines not set — editor is exactly full height
          scrollBeyondLastLine:  false,
          scrollbar: {
            vertical:              maxLines ? 'auto' : 'hidden',
            horizontal:            'auto',
            verticalScrollbarSize:  6,
            horizontalScrollbarSize: 6,
            alwaysConsumeMouseWheel: false,  // let page scroll wheel pass through
          },
          overviewRulerLanes:    0,
          hideCursorInOverviewRuler: true,
          renderLineHighlight:   'none',
          renderWhitespace:      'none',
          contextmenu:           false,
          links:                 false,
          quickSuggestions:      false,
          suggestOnTriggerCharacters: false,
          acceptSuggestionOnEnter: 'off',
          wordBasedSuggestions:  'off',
          parameterHints:        { enabled: false },
          hover:                 { enabled: false },
          occurrencesHighlight:  'off',
          selectionHighlight:    false,
          codeLens:              false,
          lightbulb:             { enabled: 'off' },
          padding:               { top: 12, bottom: 12 },
          automaticLayout:       true,
        }}
      />
    </div>
  );
}