import { useRef, useEffect, useCallback, lazy, Suspense } from 'react';
// Lazy-load Monaco so it doesn't bloat the initial JS bundle (~5MB).
// Pages that don't use the editor (login, algorithms, interview-prep, etc.)
// will never download Monaco at all.
const MonacoEditor = lazy(() => import('@monaco-editor/react'));
import { codeApi } from '../../api';
import { debounce } from '../../utils/helpers';
import { HOVER_DOCS } from './JavaCompletions';

// ─── Themes ──────────────────────────────────────────────────────────────────
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
    'editor.selectionBackground':     '#264f78',
    'editorLineNumber.foreground':    '#4d5767',
    'editorLineNumber.activeForeground': '#a0aec0',
    'editorCursor.foreground':        '#4ade80',
    'editorBracketMatch.background':  '#2b3a4a',
    'editorBracketMatch.border':      '#4ade80',
    'editorGutter.background':        '#0d1117',
    'editorError.foreground':         '#f87171',
    'editorWarning.foreground':       '#fbbf24',
    'editorSuggestWidget.background':            '#1a1e26',
    'editorSuggestWidget.border':                '#2e3540',
    'editorSuggestWidget.foreground':            '#e2e8f0',
    'editorSuggestWidget.selectedBackground':    '#1f3a5f',
    'editorSuggestWidget.selectedForeground':    '#ffffff',
    'editorSuggestWidget.highlightForeground':   '#4ade80',
    'editorSuggestWidget.focusHighlightForeground': '#4ade80',
    'editorHoverWidget.background':              '#1a1e26',
    'editorHoverWidget.border':                  '#2e3540',
    'editorHoverWidget.foreground':              '#e2e8f0',
    'editorHoverWidget.statusBarBackground':     '#161b22',
    'editorWidget.background':                   '#1a1e26',
    'editorWidget.border':                       '#2e3540',
    'editorWidget.foreground':                   '#e2e8f0',
    'editorWidget.resizeBorder':                 '#4ade80',
    'list.hoverBackground':                      '#1f2937',
    'list.hoverForeground':                      '#e2e8f0',
    'list.activeSelectionBackground':            '#1f3a5f',
    'list.activeSelectionForeground':            '#ffffff',
    'list.inactiveSelectionBackground':          '#1a2540',
    'list.focusBackground':                      '#1f3a5f',
    'list.highlightForeground':                  '#4ade80',
    'input.background':                          '#0d1117',
    'input.border':                              '#2e3540',
    'input.foreground':                          '#e2e8f0',
    'inputOption.activeBackground':              '#1f3a5f',
    'inputOption.activeBorder':                  '#4ade80',
    'quickInput.background':                     '#1a1e26',
    'quickInput.foreground':                     '#e2e8f0',
    'scrollbarSlider.background':                '#2d333b88',
    'scrollbarSlider.hoverBackground':           '#4d5767aa',
    'widget.shadow':                             '#00000088',
    'editor.wordHighlightBackground':            '#1b3a4a',
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
    'editor.background':              '#ffffff',
    'editor.lineHighlightBackground': '#f8fafc',
    'editorLineNumber.foreground':    '#94a3b8',
    'editorCursor.foreground':        '#22c55e',
  },
};

const themeRegistered = { current: false };

// ─── Completion kind mapping ──────────────────────────────────────────────────
function resolveKind(monaco, kind) {
  const K = monaco.languages.CompletionItemKind;
  return ({ snippet:K.Snippet, method:K.Method, function:K.Function,
    class:K.Class, interface:K.Interface, keyword:K.Keyword,
    constant:K.Constant, variable:K.Variable })[kind] ?? K.Text;
}

// ─── Backend completion cache (key = version string) ─────────────────────────
const completionCache = {};
async function fetchCompletions(version) {
  const key = version || '17';
  if (!completionCache[key]) {
    completionCache[key] = codeApi.getJavaCompletions(key)
      .then((d) => d.items || [])
      .catch(() => []);
  }
  return completionCache[key];
}

// ─── Apply error markers to Monaco editor ─────────────────────────────────────
export function applyMarkers(editorRef, monacoRef, errors) {
  if (!editorRef?.current || !monacoRef?.current) return;
  const model     = editorRef.current.getModel();
  if (!model) return;
  const lineCount = model.getLineCount();
  monacoRef.current.editor.setModelMarkers(model, 'javac',
    (errors || []).map((e) => {
      const line   = Math.min(Math.max(Number(e.line)   || 1, 1), lineCount);
      const maxCol = model.getLineMaxColumn(line);
      const col    = Math.min(Math.max(Number(e.column) || 1, 1), maxCol);
      return {
        severity: e.severity === 'warning'
          ? monacoRef.current.MarkerSeverity.Warning
          : monacoRef.current.MarkerSeverity.Error,
        startLineNumber: line, startColumn: col,
        endLineNumber:   line, endColumn:   maxCol,
        message: e.message || 'Compilation error',
        source:  'javac',
      };
    })
  );
}

// ─── Main CodeEditor component ────────────────────────────────────────────────
export default function CodeEditor({
  value, onChange, language = 'java', theme, fontSize = 14,
  javaVersion = '17', onSyntaxChange, onCursorChange,
  readOnly = false, height = '100%',
  // expose refs so ProblemSolveView can call applyMarkers after Run/Submit
  editorRefOut, monacoRefOut,
}) {
  const editorRef     = useRef(null);
  const monacoRef     = useRef(null);
  const completionRef = useRef(null);
  const hoverRef      = useRef(null);
  const signatureRef  = useRef(null);

  // ── KEY FIX: use a ref to hold the latest doSyntaxCheck ──────────────────
  // Monaco's onDidChangeModelContent listener is registered ONCE on mount.
  // If we close over doSyntaxCheck directly, the listener keeps calling the
  // initial version — java version changes are never seen.
  // Solution: store the function in a ref; the listener calls syntaxCheckRef.current.
  const syntaxCheckRef = useRef(null);

  // Rebuild the syntax check function whenever javaVersion or onSyntaxChange changes
  useEffect(() => {
    syntaxCheckRef.current = debounce(async (code) => {
      if (!code || code.trim().length < 15) { onSyntaxChange?.('ok', []); return; }
      onSyntaxChange?.('checking', []);
      try {
        const res = await codeApi.syntaxCheck(code, javaVersion);
        const errors = res.errors || [];
        onSyntaxChange?.(res.valid ? 'ok' : 'error', errors);
        applyMarkers(editorRef, monacoRef, errors);
      } catch { /* network error — keep existing markers */ }
    }, 600);
  }, [javaVersion, onSyntaxChange]);

  // Export refs if caller wants them (for applying markers from run result)
  useEffect(() => {
    if (editorRefOut) editorRefOut.current = editorRef.current;
    if (monacoRefOut) monacoRefOut.current = monacoRef.current;
  });

  // Pre-fetch completions on mount / version change
  useEffect(() => { fetchCompletions(javaVersion); }, [javaVersion]);

  // ── Theme registration ────────────────────────────────────────────────────
  function handleBeforeMount(monaco) {
    if (!themeRegistered.current) {
      monaco.editor.defineTheme('devlearn-dark',  DARK_THEME);
      monaco.editor.defineTheme('devlearn-light', LIGHT_THEME);
      themeRegistered.current = true;
    }
  }

  // ── Editor mount ──────────────────────────────────────────────────────────
  function handleEditorDidMount(editor, monaco) {
    editorRef.current  = editor;
    monacoRef.current  = monaco;
    if (editorRefOut) editorRefOut.current = editor;
    if (monacoRefOut) monacoRefOut.current = monaco;

    monaco.editor.setTheme(theme === 'light' ? 'devlearn-light' : 'devlearn-dark');

    registerProviders(monaco, javaVersion);

    // Keyboard shortcuts
    editor.addAction({
      id: 'toggle-comment', label: 'Toggle Comment',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash],
      run: () => editor.getAction('editor.action.commentLine')?.run(),
    });
    editor.addAction({
      id: 'format', label: 'Format Code',
      keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.KeyF],
      run: () => editor.getAction('editor.action.formatDocument')?.run(),
    });

    // Cursor tracking
    editor.onDidChangeCursorPosition((e) =>
      onCursorChange?.(e.position.lineNumber, e.position.column));

    // Content change — ALWAYS call syntaxCheckRef.current (never stale)
    editor.onDidChangeModelContent(() => {
      const code = editor.getValue();
      onChange?.(code);
      if (!readOnly && syntaxCheckRef.current) {
        syntaxCheckRef.current(code);
      }
    });
  }

  // ── Re-register providers when Java version changes ───────────────────────
  useEffect(() => {
    if (monacoRef.current) registerProviders(monacoRef.current, javaVersion);
    // Trigger syntax check with new version
    const code = editorRef.current?.getValue();
    if (code && !readOnly && syntaxCheckRef.current) {
      syntaxCheckRef.current(code);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [javaVersion]);

  function registerProviders(monaco, version) {
    completionRef.current?.dispose();
    hoverRef.current?.dispose();
    signatureRef.current?.dispose();

    completionRef.current = monaco.languages.registerCompletionItemProvider('java', {
      triggerCharacters: ['.', ' ', '(', '<'],
      async provideCompletionItems(model, position) {
        const word  = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber, endLineNumber: position.lineNumber,
          startColumn: word.startColumn, endColumn: word.endColumn,
        };
        const items = await fetchCompletions(version);
        return {
          suggestions: items.map((item) => ({
            label:           item.label,
            kind:            resolveKind(monaco, item.kind),
            detail:          item.detail || '',
            documentation:   item.documentation ? { value: item.documentation } : undefined,
            insertText:      item.insertText || item.label,
            insertTextRules: item.isSnippet
              ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
              : undefined,
            sortText: item.kind === 'snippet' ? '0' + item.label : item.label,
            range,
          })),
        };
      },
    });

    hoverRef.current = monaco.languages.registerHoverProvider('java', {
      async provideHover(model, position) {
        const word = model.getWordAtPosition(position);
        if (!word) return null;
        const lineContent = model.getLineContent(position.lineNumber);
        const lineCtx = lineContent.substring(
          Math.max(0, position.column - 60),
          position.column + word.word.length + 10,
        );

        // ── 1. HOVER_DOCS: full key match (e.g. "Arrays.sort", "Math.max") ──
        let hoverDoc = null;
        for (const key of Object.keys(HOVER_DOCS)) {
          if (lineCtx.includes(key)) { hoverDoc = HOVER_DOCS[key]; break; }
        }
        // ── 2. HOVER_DOCS: word-only match (e.g. word "sort" → "Arrays.sort",
        //       or key "add" directly) ─────────────────────────────────────────
        if (!hoverDoc) {
          // Exact key (un-prefixed instance methods like 'add', 'put', 'filter')
          if (HOVER_DOCS[word.word]) {
            hoverDoc = HOVER_DOCS[word.word];
          } else {
            // Suffix match: word matches the last segment of a "Class.method" key
            for (const key of Object.keys(HOVER_DOCS)) {
              if (key.includes('.') && key.split('.').pop() === word.word) {
                hoverDoc = HOVER_DOCS[key]; break;
              }
            }
          }
        }

        if (hoverDoc) {
          return {
            range: new monaco.Range(position.lineNumber, word.startColumn,
                                    position.lineNumber, word.endColumn),
            contents: [{ value: hoverDoc }],
          };
        }

        // ── 3. Fallback: JSON completion items hover ──────────────────────────
        const items = await fetchCompletions(version);
        const match = items.find((item) =>
          item.documentation &&
          (lineCtx.includes(item.label) || word.word === item.label));
        if (!match) return null;
        return {
          range: new monaco.Range(position.lineNumber, word.startColumn,
                                  position.lineNumber, word.endColumn),
          contents: [
            { value: `**${match.label}**  \`${match.detail || ''}\`` },
            { value: match.documentation },
          ],
        };
      },
    });

    signatureRef.current = monaco.languages.registerSignatureHelpProvider('java', {
      signatureHelpTriggerCharacters: ['(', ','],
      async provideSignatureHelp(model, position) {
        const lineContent = model.getLineContent(position.lineNumber);
        const before      = lineContent.substring(0, position.column - 1);
        const lastParen   = before.lastIndexOf('(');
        if (lastParen < 0) return null;
        const methodName  = before.substring(0, lastParen).trim().split(/[\s.]+/).pop() || '';
        const items       = await fetchCompletions(version);
        const match       = items.find((item) =>
          item.label === methodName || item.label.replace(/\(.*/, '') === methodName);
        if (!match || !match.detail) return null;
        const activeParam = before.substring(lastParen + 1).split(',').length - 1;
        return {
          value: {
            signatures: [{ label: match.detail,
              documentation: match.documentation ? { value: match.documentation } : undefined,
              parameters: [] }],
            activeSignature: 0, activeParameter: activeParam,
          },
          dispose: () => {},
        };
      },
    });
  }

  // ── Theme / font effects ──────────────────────────────────────────────────
  useEffect(() => {
    if (!monacoRef.current || !themeRegistered.current) return;
    monacoRef.current.editor.setTheme(theme === 'light' ? 'devlearn-light' : 'devlearn-dark');
  }, [theme]);

  useEffect(() => { editorRef.current?.updateOptions({ fontSize }); }, [fontSize]);

  useEffect(() => () => {
    completionRef.current?.dispose();
    hoverRef.current?.dispose();
    signatureRef.current?.dispose();
  }, []);

  return (
    <Suspense fallback={
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'center',
        height: height || '100%', color:'#4d5767',
        fontFamily:"'JetBrains Mono',monospace",
        gap:12, fontSize:13, background:'#0d1117',
        borderRadius: 8,
      }}>
        <span className="spinner" /> Loading IDE…
      </div>
    }>
    <MonacoEditor
      height={height}
      language={language}
      value={value}
      theme={theme === 'light' ? 'devlearn-light' : 'devlearn-dark'}
      beforeMount={handleBeforeMount}
      onMount={handleEditorDidMount}
      options={{
        fontSize,
        fontFamily:   "'JetBrains Mono', 'Fira Code', monospace",
        fontLigatures: true,
        lineHeight:    1.7,
        minimap:       { enabled: false },
        scrollBeyondLastLine: false,
        lineNumbers:   'on',
        lineNumbersMinChars: 3,
        glyphMargin:   true,
        folding:       true,
        renderLineHighlight: 'line',
        automaticLayout: true,
        padding:       { top: 12, bottom: 12 },
        readOnly,
        quickSuggestions: { other: true, comments: false, strings: false },
        quickSuggestionsDelay: 100,
        suggestOnTriggerCharacters: true,
        tabCompletion: 'on',
        acceptSuggestionOnEnter: 'on',
        parameterHints: { enabled: true, cycle: true },
        snippetSuggestions: 'top',
        suggest: {
          showSnippets: true, showKeywords: true, showMethods: true,
          showClasses: true, showConstants: true, localityBonus: true,
          insertMode: 'replace', preview: false, showIcons: true,
        },
        formatOnPaste: true,
        autoIndent:    'full',
        tabSize: 4, insertSpaces: true,
        bracketPairColorization: { enabled: true },
        matchBrackets: 'always',
        autoClosingBrackets: 'always',
        autoClosingQuotes:   'always',
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        cursorWidth: 2,
        multiCursorModifier: 'ctrlCmd',
        scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
        overviewRulerLanes: 3,
        smoothScrolling: true,
        mouseWheelZoom: true,
        wordWrap: 'off',
        renderWhitespace: 'none',
        'semanticHighlighting.enabled': true,
      }}
      loading={
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'center',
          height:'100%', color:'#4d5767',
          fontFamily:"'JetBrains Mono',monospace",
          gap:12, fontSize:13, background:'#0d1117',
        }}>
          <span className="spinner" /> Loading IDE…
        </div>
      }
    />
    </Suspense>
  );
}
