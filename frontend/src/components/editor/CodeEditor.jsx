import { useRef, useEffect, useCallback } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { useQuery } from '@tanstack/react-query';
import { codeApi } from '../../api';
import { debounce } from '../../utils/helpers';

const JAVA_SNIPPETS = [
  { label: 'sout',      detail: 'System.out.println',    insertText: 'System.out.println(${1});' },
  { label: 'main',      detail: 'public static void main', insertText: 'public static void main(String[] args) {\n\t${0}\n}' },
  { label: 'fori',      detail: 'for int loop',           insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n\t${0}\n}' },
  { label: 'fore',      detail: 'for-each',               insertText: 'for (${1:var} ${2:item} : ${3:collection}) {\n\t${0}\n}' },
  { label: 'hashmap',   detail: 'HashMap<K,V>',           insertText: 'Map<${1:String}, ${2:Integer}> ${3:map} = new HashMap<>();' },
  { label: 'arraylist', detail: 'ArrayList<T>',           insertText: 'List<${1:Integer}> ${2:list} = new ArrayList<>();' },
  { label: 'scanner',   detail: 'Scanner input',          insertText: 'Scanner sc = new Scanner(System.in);' },
  { label: 'binary',    detail: 'Binary search',          insertText: 'int ${1:lo} = 0, ${2:hi} = ${3:arr}.length - 1;\nwhile (${1:lo} <= ${2:hi}) {\n\tint ${4:mid} = ${1:lo} + (${2:hi} - ${1:lo}) / 2;\n\tif (${3:arr}[${4:mid}] == ${5:target}) return ${4:mid};\n\telse if (${3:arr}[${4:mid}] < ${5:target}) ${1:lo} = ${4:mid} + 1;\n\telse ${2:hi} = ${4:mid} - 1;\n}\nreturn -1;' },
  { label: 'twopt',     detail: 'Two pointer',            insertText: 'int ${1:left} = 0, ${2:right} = ${3:arr}.length - 1;\nwhile (${1:left} < ${2:right}) {\n\t${0}\n}' },
  { label: 'pq',        detail: 'PriorityQueue min-heap', insertText: 'PriorityQueue<${1:Integer}> ${2:pq} = new PriorityQueue<>();' },
  { label: 'pqmax',     detail: 'PriorityQueue max-heap', insertText: 'PriorityQueue<${1:Integer}> ${2:pq} = new PriorityQueue<>(Collections.reverseOrder());' },
  { label: 'dp',        detail: 'DP array init',          insertText: 'int[] ${1:dp} = new int[${2:n} + 1];\n${1:dp}[0] = ${3:0};\nfor (int i = 1; i <= ${2:n}; i++) {\n\t${1:dp}[i] = ${0};\n}' },
  { label: 'bfs',       detail: 'BFS template',           insertText: 'Queue<${1:Integer}> ${2:queue} = new LinkedList<>();\n${2:queue}.offer(${3:start});\nSet<${1:Integer}> visited = new HashSet<>();\nvisited.add(${3:start});\nwhile (!${2:queue}.isEmpty()) {\n\t${1:Integer} ${4:node} = ${2:queue}.poll();\n\t${0}\n}' },
];

export default function CodeEditor({
  value,
  onChange,
  language = 'java',
  theme,
  fontSize = 14,
  javaVersion = '17',
  onSyntaxChange,
  readOnly = false,
  height = '100%',
  contextId = 'main',
}) {
  const editorRef  = useRef(null);
  const monacoRef  = useRef(null);
  const syntaxTimer = useRef(null);
  const providerRef = useRef(null);

  // Syntax check query (manual trigger)
  const doSyntaxCheck = useCallback(
    debounce(async (code) => {
      if (!code || code.trim().length < 10) { onSyntaxChange?.('ok', []); return; }
      onSyntaxChange?.('checking', []);
      try {
        const res = await codeApi.syntaxCheck(code, javaVersion);
        onSyntaxChange?.(res.valid ? 'ok' : 'error', res.errors || []);
        // Apply Monaco markers
        if (editorRef.current && monacoRef.current) {
          const model = editorRef.current.getModel();
          monacoRef.current.editor.setModelMarkers(model, 'javac',
            (res.errors || []).map((e) => ({
              severity: e.severity === 'error'
                ? monacoRef.current.MarkerSeverity.Error
                : monacoRef.current.MarkerSeverity.Warning,
              startLineNumber: e.line || 1,
              startColumn:     e.column || 1,
              endLineNumber:   e.line || 1,
              endColumn:       model.getLineMaxColumn(e.line || 1),
              message:         e.message || 'Error',
              source: 'javac',
            }))
          );
        }
      } catch { /* network error */ }
    }, 700),
    [javaVersion, onSyntaxChange]
  );

  function handleEditorDidMount(editor, monaco) {
    editorRef.current  = editor;
    monacoRef.current  = monaco;

    // Register Java snippets
    if (providerRef.current) { providerRef.current.dispose(); }
    providerRef.current = monaco.languages.registerCompletionItemProvider('java', {
      triggerCharacters: ['.', ' ', '('],
      provideCompletionItems(model, position) {
        const word  = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber, endLineNumber: position.lineNumber,
          startColumn: word.startColumn, endColumn: word.endColumn,
        };
        return {
          suggestions: JAVA_SNIPPETS.map((s) => ({
            ...s,
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
          })),
        };
      },
    });

    editor.onDidChangeModelContent(() => {
      const code = editor.getValue();
      onChange?.(code);
      if (!readOnly) doSyntaxCheck(code);
    });
  }

  // Update font size on change
  useEffect(() => {
    editorRef.current?.updateOptions({ fontSize });
  }, [fontSize]);

  // Update theme
  useEffect(() => {
    if (monacoRef.current && theme) {
      monacoRef.current.editor.setTheme(theme === 'light' ? 'vs' : 'vs-dark');
    }
  }, [theme]);

  const monacoTheme = theme === 'light' ? 'vs' : 'vs-dark';

  return (
    <MonacoEditor
      height={height}
      language={language}
      value={value}
      theme={monacoTheme}
      onMount={handleEditorDidMount}
      options={{
        fontSize,
        fontFamily: "'JetBrains Mono', monospace",
        fontLigatures: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        lineNumbers: 'on',
        renderLineHighlight: 'line',
        automaticLayout: true,
        padding: { top: 10 },
        glyphMargin: true,
        readOnly,
        quickSuggestions: { other: true, comments: false, strings: true },
        suggestOnTriggerCharacters: true,
        tabCompletion: 'on',
        parameterHints: { enabled: true },
        formatOnPaste: true,
        autoIndent: 'full',
        tabSize: 4,
        bracketPairColorization: { enabled: true },
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        scrollbar: { verticalScrollbarSize: 5, horizontalScrollbarSize: 5 },
        overviewRulerLanes: 0,
        hideCursorInOverviewRuler: true,
        renderWhitespace: 'none',
        'semanticHighlighting.enabled': true,
      }}
      loading={
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '100%', color: 'var(--text3)', fontFamily: 'var(--font-code)',
          gap: 10, fontSize: 13,
        }}>
          <span className="spinner" /> Loading editor…
        </div>
      }
    />
  );
}
