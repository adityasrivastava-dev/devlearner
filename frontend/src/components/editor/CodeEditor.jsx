import { useRef, useEffect, useCallback } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { codeApi } from '../../api';
import { debounce } from '../../utils/helpers';
import { getJavaCompletions, HOVER_DOCS } from './JavaCompletions';

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
    // ── Suggest / autocomplete widget ──────────────────────────────────────
    'editorSuggestWidget.background':            '#1a1e26',
    'editorSuggestWidget.border':                '#2e3540',
    'editorSuggestWidget.foreground':            '#e2e8f0',
    'editorSuggestWidget.selectedBackground':    '#1f3a5f',
    'editorSuggestWidget.selectedForeground':    '#ffffff',
    'editorSuggestWidget.highlightForeground':   '#4ade80',
    'editorSuggestWidget.focusHighlightForeground': '#4ade80',
    // ── Hover / parameter hints widget ──────────────────────────────────────
    'editorHoverWidget.background':              '#1a1e26',
    'editorHoverWidget.border':                  '#2e3540',
    'editorHoverWidget.foreground':              '#e2e8f0',
    'editorHoverWidget.statusBarBackground':     '#161b22',
    'editorHoverWidget.highlightForeground':     '#4ade80',
    // ── Generic editor widget (find, replace, go-to-line) ───────────────────
    'editorWidget.background':                   '#1a1e26',
    'editorWidget.border':                       '#2e3540',
    'editorWidget.foreground':                   '#e2e8f0',
    'editorWidget.resizeBorder':                 '#4ade80',
    // ── List (controls rows inside suggest + quickOpen) ──────────────────────
    'list.hoverBackground':                      '#1f2937',
    'list.hoverForeground':                      '#e2e8f0',
    'list.activeSelectionBackground':            '#1f3a5f',
    'list.activeSelectionForeground':            '#ffffff',
    'list.inactiveSelectionBackground':          '#1a2540',
    'list.inactiveSelectionForeground':          '#e2e8f0',
    'list.focusBackground':                      '#1f3a5f',
    'list.focusForeground':                      '#ffffff',
    'list.highlightForeground':                  '#4ade80',
    // ── Input boxes (find widget) ────────────────────────────────────────────
    'input.background':                          '#0d1117',
    'input.border':                              '#2e3540',
    'input.foreground':                          '#e2e8f0',
    'input.placeholderForeground':               '#4d5767',
    'inputOption.activeBackground':              '#1f3a5f',
    'inputOption.activeBorder':                  '#4ade80',
    'inputOption.activeForeground':              '#ffffff',
    // ── Quick pick / command palette ─────────────────────────────────────────
    'quickInput.background':                     '#1a1e26',
    'quickInput.foreground':                     '#e2e8f0',
    'quickInputList.focusBackground':            '#1f3a5f',
    'quickInputTitle.background':                '#161b22',
    // ── Scrollbar ─────────────────────────────────────────────────────────────
    'scrollbarSlider.background':                '#2d333b88',
    'scrollbarSlider.hoverBackground':           '#4d5767aa',
    'scrollbarSlider.activeBackground':          '#6b7280aa',
    // ── Misc ──────────────────────────────────────────────────────────────────
    'widget.shadow':                             '#00000088',
    'editor.wordHighlightBackground':            '#1b3a4a',
    'editor.wordHighlightStrongBackground':      '#1b3a5a',
    'peekView.border':                           '#2e3540',
    'peekViewEditor.background':                 '#0d1117',
    'peekViewResult.background':                 '#1a1e26',
    'peekViewTitle.background':                  '#161b22',
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

export default function CodeEditor({
  value, onChange, language = 'java', theme, fontSize = 14,
  javaVersion = '17', onSyntaxChange, onCursorChange,
  readOnly = false, height = '100%',
}) {
  const editorRef     = useRef(null);
  const monacoRef     = useRef(null);
  const completionRef = useRef(null);
  const hoverRef      = useRef(null);
  const signatureRef  = useRef(null);

  const doSyntaxCheck = useCallback(
    debounce(async (code) => {
      if (!code || code.trim().length < 15) { onSyntaxChange?.('ok', []); return; }
      onSyntaxChange?.('checking', []);
      try {
        const res = await codeApi.syntaxCheck(code, javaVersion);
        const errors = res.errors || [];
        onSyntaxChange?.(res.valid ? 'ok' : 'error', errors);
        if (editorRef.current && monacoRef.current) {
          const model = editorRef.current.getModel();
          if (!model) return;
          const lineCount = model.getLineCount();
          monacoRef.current.editor.setModelMarkers(model, 'javac',
            errors.map((e) => {
              const line     = Math.min(Math.max(e.line || 1, 1), lineCount);
              const maxCol   = model.getLineMaxColumn(line);
              const startCol = Math.min(Math.max(e.column || 1, 1), maxCol);
              return {
                severity: e.severity === 'warning'
                  ? monacoRef.current.MarkerSeverity.Warning
                  : monacoRef.current.MarkerSeverity.Error,
                startLineNumber: line, startColumn: startCol,
                endLineNumber:   line, endColumn:   maxCol,
                message: e.message || 'Compilation error',
                source:  'javac',
              };
            })
          );
        }
      } catch { /* network error */ }
    }, 600),
    [javaVersion, onSyntaxChange]
  );

  function handleEditorDidMount(editor, monaco) {
    editorRef.current  = editor;
    monacoRef.current  = monaco;

    // Themes already registered in beforeMount — just apply correct one
    // (beforeMount runs before onMount, so themes are always ready here)
    monaco.editor.setTheme(theme === 'light' ? 'devlearn-light' : 'devlearn-dark');

    // ── Completion provider ─────────────────────────────────────────────────
    completionRef.current?.dispose();
    completionRef.current = monaco.languages.registerCompletionItemProvider('java', {
      triggerCharacters: ['.', ' ', '(', '<'],
      provideCompletionItems(model, position) {
        const word  = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber, endLineNumber: position.lineNumber,
          startColumn: word.startColumn, endColumn: word.endColumn,
        };
        return { suggestions: getJavaCompletions(monaco, range) };
      },
    });

    // ── Hover documentation provider ────────────────────────────────────────
    hoverRef.current?.dispose();
    hoverRef.current = monaco.languages.registerHoverProvider('java', {
      provideHover(model, position) {
        const word = model.getWordAtPosition(position);
        if (!word) return null;
        const lineContent = model.getLineContent(position.lineNumber);
        const before = lineContent.substring(Math.max(0, position.column - 20), position.column + word.word.length);
        let doc = null;
        for (const key of Object.keys(HOVER_DOCS)) {
          if (before.includes(key) || word.word === key) { doc = HOVER_DOCS[key]; break; }
        }
        if (!doc) return null;
        return {
          range: new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn),
          contents: [{ value: `**${word.word}**` }, { value: doc }],
        };
      },
    });

    // ── Signature help provider ─────────────────────────────────────────────
    signatureRef.current?.dispose();
    signatureRef.current = monaco.languages.registerSignatureHelpProvider('java', {
      signatureHelpTriggerCharacters: ['(', ','],
      provideSignatureHelp(model, position) {
        const lineContent = model.getLineContent(position.lineNumber);
        const before      = lineContent.substring(0, position.column - 1);
        const lastParen   = before.lastIndexOf('(');
        if (lastParen < 0) return null;
        const methodPart  = before.substring(0, lastParen).trim();
        const methodName  = methodPart.split(/[\s.]+/).pop() || '';
        const SIGS = {
          println:   { label:'println(Object x)', params:['x: any type — prints followed by newline'] },
          printf:    { label:'printf(String fmt, ...args)', params:['fmt: %d=int %s=str %f=float %.2f=2dec %n=newline','...args: values'] },
          sort:      { label:'sort(T[] arr, [Comparator])', params:['arr: array to sort in-place','comparator (optional) — lambda (a,b)->a-b'] },
          fill:      { label:'fill(T[] arr, T val)', params:['arr: target array','val: fill value for all positions'] },
          copyOf:    { label:'copyOf(T[] arr, int newLen)', params:['arr: source','newLen: new length (truncates or zero-pads)'] },
          binarySearch:{label:'binarySearch(T[] arr, T key)', params:['arr: MUST be sorted first','key: target value']},
          parseInt:  { label:'parseInt(String s)', params:['s: numeric string e.g. "42"'] },
          max:       { label:'max(a, b)', params:['a: first number','b: second number — returns larger'] },
          min:       { label:'min(a, b)', params:['a: first number','b: second number — returns smaller'] },
          abs:       { label:'abs(x)', params:['x: number — returns absolute value'] },
          pow:       { label:'pow(double base, double exp)', params:['base','exp — returns base^exp as double'] },
          sqrt:      { label:'sqrt(double x)', params:['x: non-negative — returns square root'] },
          substring: { label:'substring(int begin, int end)', params:['begin: inclusive start index','end: exclusive end index'] },
          indexOf:   { label:'indexOf(String str)', params:['str: substring to find — returns -1 if not found'] },
          split:     { label:'split(String regex)', params:['regex: delimiter pattern e.g. "," or "\\\\s+"'] },
          append:    { label:'append(Object obj)', params:['obj: value to append — returns this (chainable)'] },
          getOrDefault:{ label:'getOrDefault(K key, V defaultVal)', params:['key','defaultVal: returned if key absent'] },
          merge:     { label:'merge(K key, V value, BiFunction fn)', params:['key','value: if absent','fn: (old,new)->result if present'] },
          offer:     { label:'offer(E e)', params:['e: element to add to queue/heap'] },
          comparingInt:{label:'comparingInt(ToIntFunction keyExtractor)', params:['keyExtractor: lambda e.g. a->a[0]']},
        };
        const sig = SIGS[methodName];
        if (!sig) return null;
        const activeParam = before.substring(lastParen + 1).split(',').length - 1;
        return {
          value: {
            signatures: [{ label: sig.label, parameters: sig.params.map((p) => ({ label: p })) }],
            activeSignature: 0,
            activeParameter: Math.min(activeParam, sig.params.length - 1),
          },
          dispose: () => {},
        };
      },
    });

    // ── Keyboard shortcuts ───────────────────────────────────────────────────
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
    editor.addAction({
      id: 'select-occurrences', label: 'Select All Occurrences',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.F2],
      run: () => editor.trigger('', 'editor.action.selectHighlights', null),
    });

    // ── Cursor tracking ──────────────────────────────────────────────────────
    editor.onDidChangeCursorPosition((e) => {
      onCursorChange?.(e.position.lineNumber, e.position.column);
    });

    // ── Content change ───────────────────────────────────────────────────────
    editor.onDidChangeModelContent(() => {
      onChange?.(editor.getValue());
      if (!readOnly) doSyntaxCheck(editor.getValue());
    });
  }

  useEffect(() => {
    if (!monacoRef.current || !themeRegistered.current) return;
    monacoRef.current.editor.setTheme(theme === 'light' ? 'devlearn-light' : 'devlearn-dark');
  }, [theme]);

  useEffect(() => { editorRef.current?.updateOptions({ fontSize }); }, [fontSize]);

  useEffect(() => {
    const code = editorRef.current?.getValue();
    if (code && !readOnly) doSyntaxCheck(code);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [javaVersion]);

  useEffect(() => {
    return () => {
      completionRef.current?.dispose();
      hoverRef.current?.dispose();
      signatureRef.current?.dispose();
    };
  }, []);

  // Register themes BEFORE first render — fixes white editor on initial load
  // If we only register in onMount, the first paint uses an unknown theme name
  // and Monaco falls back to default 'vs' (white). beforeMount runs synchronously
  // before Monaco initializes, so the theme is ready for the first paint.
  function handleBeforeMount(monaco) {
    if (!themeRegistered.current) {
      monaco.editor.defineTheme('devlearn-dark',  DARK_THEME);
      monaco.editor.defineTheme('devlearn-light', LIGHT_THEME);
      themeRegistered.current = true;
    }
  }

  return (
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
        // IntelliSense
        quickSuggestions: {
          other:    true,   // trigger in code
          comments: false,  // no suggestions inside /* */ or //
          strings:  false,  // no suggestions inside "string literals"
        },
        quickSuggestionsDelay: 100,
        suggestOnTriggerCharacters: true,
        tabCompletion: 'on',
        acceptSuggestionOnEnter: 'on',
        parameterHints: { enabled: true, cycle: true },
        snippetSuggestions: 'top',
        suggest: {
          showSnippets:  true,
          showKeywords:  true,
          showMethods:   true,
          showClasses:   true,
          showConstants: true,
          localityBonus: true,
          insertMode:    'replace',
          preview:       false, // disable ghost text preview — it overlays mid-string
          filterGraceful: true,
          showIcons:     true,
        },
        // Editing
        formatOnPaste:   true,
        autoIndent:      'full',
        tabSize:         4,
        insertSpaces:    true,
        // Brackets
        bracketPairColorization: { enabled: true, independentColorPoolPerBracketType: true },
        matchBrackets:   'always',
        autoClosingBrackets: 'always',
        autoClosingQuotes:   'always',
        autoSurround:    'languageDefined',
        // Cursor
        cursorBlinking:  'smooth',
        cursorSmoothCaretAnimation: 'on',
        cursorStyle:     'line',
        cursorWidth:     2,
        multiCursorModifier: 'ctrlCmd',
        // Scrollbar
        scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
        overviewRulerLanes: 3,
        // Other
        smoothScrolling:   true,
        mouseWheelZoom:    true,
        wordWrap:          'off',
        dragAndDrop:       true,
        renderWhitespace:  'none',
        colorDecorators:   true,
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
  );
}