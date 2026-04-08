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
    'editor.lineHighlightBackground': '#0d1117',
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
    'editor.lineHighlightBackground': '#f8fafc',
    'editorLineNumber.foreground':    '#94a3b8',
  },
};

const LINE_HEIGHT = 21;
const PADDING     = 24;

/**
 * Walk up the DOM to find the nearest scrollable ancestor.
 * Returns null if none found (falls back to document.documentElement).
 */
function getScrollParent(el) {
  if (!el) return document.documentElement;
  let node = el.parentElement;
  while (node && node !== document.body) {
    const style = window.getComputedStyle(node);
    const overflow = style.overflow + style.overflowY;
    if (/auto|scroll/.test(overflow) && node.scrollHeight > node.clientHeight) {
      return node;
    }
    node = node.parentElement;
  }
  return document.documentElement;
}

export default function ReadOnlyCodeViewer({
  code = '',
  language = 'java',
  theme = 'dark',
  highlightLine = null,
  maxLines,
}) {
  const editorRef  = useRef(null);
  const monacoRef  = useRef(null);
  const wrapperRef = useRef(null);
  const decorRef   = useRef([]);
  const [ready, setReady] = useState(false);

  const lineCount         = Math.max((code || '').split('\n').length, 1);
  const visLines          = maxLines ? Math.min(lineCount, maxLines) : lineCount;
  const editorHeight      = visLines * LINE_HEIGHT + PADDING;
  const hasInternalScroll = !!maxLines && lineCount > maxLines;

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

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !ready) return;
    const monaco = monacoRef.current;
    const editor = editorRef.current;

    // Clear old decoration
    decorRef.current = editor.deltaDecorations(decorRef.current, []);

    if (highlightLine == null || highlightLine <= 0) return;

    // Apply highlight
    decorRef.current = editor.deltaDecorations([], [{
      range: new monaco.Range(highlightLine, 1, highlightLine, 1),
      options: {
        isWholeLine:               true,
        className:                 'tracer-active-line',
        linesDecorationsClassName: 'tracer-active-indicator',
      },
    }]);

    if (hasInternalScroll) {
      // Monaco owns the scroll — use its API
      editor.revealLineInCenter(highlightLine);
    } else {
      // Full-height Monaco: find the real scrollable parent div and scroll it
      requestAnimationFrame(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return;

        const scrollParent = getScrollParent(wrapper);

        // Position of wrapper top relative to the scroll parent's content top
        const wrapperRect      = wrapper.getBoundingClientRect();
        const parentRect       = scrollParent === document.documentElement
          ? { top: 0 }
          : scrollParent.getBoundingClientRect();

        // Pixel offset of the active line from the top of the wrapper
        const lineOffsetInEditor = PADDING / 2 + (highlightLine - 1) * LINE_HEIGHT + LINE_HEIGHT / 2;

        // Absolute position of the line in the scroll container's coordinate space
        const lineAbsTop = wrapperRect.top - parentRect.top + scrollParent.scrollTop + lineOffsetInEditor;

        // Centre it in the visible area of the scroll parent
        const visibleHeight = scrollParent === document.documentElement
          ? window.innerHeight
          : scrollParent.clientHeight;

        const targetScroll = Math.max(0, lineAbsTop - visibleHeight / 2);

        scrollParent.scrollTo({ top: targetScroll, behavior: 'smooth' });
      });
    }
  }, [highlightLine, ready, hasInternalScroll]);

  useEffect(() => {
    if (!monacoRef.current || !ready) return;
    monacoRef.current.editor.setTheme(theme === 'light' ? 'rv-light' : 'rv-dark');
  }, [theme, ready]);

  return (
    <div
      ref={wrapperRef}
      style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}
    >
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
          lineNumbersMinChars:   4,
          lineDecorationsWidth:  8,
          glyphMargin:           false,
          folding:               false,
          minimap:               { enabled: false },
          scrollBeyondLastLine:  false,
          scrollbar: {
            vertical:                hasInternalScroll ? 'auto' : 'hidden',
            horizontal:              'auto',
            verticalScrollbarSize:   6,
            horizontalScrollbarSize: 6,
            alwaysConsumeMouseWheel: hasInternalScroll,
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