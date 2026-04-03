/* ═══════════════════════════════════════════════════════════════════════════
   editor.js — DevLearn App Controller
   Phase 1: Theory tab · LeetCode split-panel PS view · 3-tier hints
            · Live syntax check · Recall drill · Compile error cards
   Bugs fixed: no duplicate bindings, correct roadmap selector,
               testCases always array, auth on all admin calls
═══════════════════════════════════════════════════════════════════════════ */

// ── Global State ─────────────────────────────────────────────────────────────
let monacoEditor   = null;   // Code tab editor
let psEditor       = null;   // Problem-solve view editor
let currentTopic   = null;
let currentProblems= [];
let currentProblem = null;
let activeCategory = 'ALL';
let syntaxTimer    = null;
let psSyntaxTimer  = null;
let psHintsShown   = 0;
let psBottomOpen   = true;
let psResizing     = false;

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initMonaco();
  initTheme();
  bindCategoryTabs();
  bindTabBar();
  bindSearch();
  bindOutTabs();
  // Run button bound once inside initMonaco callback
  // PS buttons bound after monaco loaded

  loadHeatmap();
  loadTopics(activeCategory).then(() => {
    // BUG FIX: read BOTH ?topic= and ?openProblem= from the URL.
    // Previously only ?topic= was handled — clicking a problem in problems.html
    // (which navigates to /?topic=X&openProblem=Y) loaded the topic but silently
    // dropped the openProblem param, leaving the user on the Theory tab.
    const params     = new URLSearchParams(window.location.search);
    const urlTopic   = params.get('topic');
    const urlProblem = params.get('openProblem');

    if (urlTopic) {
      const poll = setInterval(() => {
        if (monacoEditor) {
          clearInterval(poll);
          // selectTopic is async — await it so openProblemSolve runs after the topic is ready
          selectTopic(parseInt(urlTopic)).then(async () => {
            if (urlProblem) {
              // BUG FIX: pre-populate currentProblems so "Related problems" works inside
              // the PS view.  Without this, currentProblems is empty when the page loads
              // via URL (loadProblems() normally only runs when the Practice tab is clicked).
              if (!currentProblems.length && currentTopic) {
                try { currentProblems = await API.getProblems(currentTopic.id); } catch {}
              }
              openProblemSolve(parseInt(urlProblem));
            }
          });
        }
      }, 100);
    }
  });
});

// ── Monaco ────────────────────────────────────────────────────────────────────
function initMonaco() {
  require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' } });
  require(['vs/editor/editor.main'], () => {

    // Phase 1: restore saved theme + font size
    const savedTheme    = localStorage.getItem('devlearn_theme');
    const monacoTheme   = savedTheme === 'light' ? 'vs' : 'vs-dark';
    const savedFontSize = parseInt(localStorage.getItem('devlearn_fontsize') || '14');

    const COMMON = {
      language: 'java', theme: monacoTheme, fontSize: savedFontSize,
      fontFamily: "'JetBrains Mono', monospace",
      minimap: { enabled: false }, scrollBeyondLastLine: false,
      lineNumbers: 'on', renderLineHighlight: 'line',
      automaticLayout: true, padding: { top: 10 }, glyphMargin: true,
      // ── Full IDE-quality settings ─────────────────────────────────────────
      quickSuggestions: { other: true, comments: false, strings: true },
      wordBasedSuggestions: 'allDocuments',
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnCommitCharacter: true,
      acceptSuggestionOnEnter: 'on',
      tabCompletion: 'on',
      parameterHints: { enabled: true, cycle: true },
      hover: { enabled: true },
      formatOnPaste: true,
      formatOnType:  false,
      autoIndent: 'full',
      tabSize: 4,
      insertSpaces: true,
      bracketPairColorization: { enabled: true },
      renderWhitespace: 'none',
      smoothScrolling: true,
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
      'semanticHighlighting.enabled': true,
      suggest: {
        showKeywords: true,
        showSnippets: true,
        showClasses:  true,
        showMethods:  true,
        showVariables:true,
        filterGraceful: true,
        insertMode: 'replace',
      },
    };

    // Code tab editor
    monacoEditor = monaco.editor.create(document.getElementById('monacoEditor'), {
      ...COMMON,
      value: '// Select a topic from the sidebar\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}'
    });
    monacoEditor.onDidChangeModelContent(() => {
      setSyntaxDot('checking');
      clearTimeout(syntaxTimer);
      syntaxTimer = setTimeout(() => doSyntaxCheck(monacoEditor, 'main'), 600);
    });

    // Problem-solve editor (create lazy when first problem opened)
    window._monacoReady  = true;
    window._monacoCommon = COMMON;

    // ── Java IntelliSense completions ─────────────────────────────────────
    registerJavaCompletions();

    // Bind run button ONCE here (after monaco ready)
    document.getElementById('runBtn')?.addEventListener('click', runCode);
    document.getElementById('resetBtn')?.addEventListener('click', resetEditor);

    // PS buttons
    document.getElementById('psRunBtn')?.addEventListener('click', psRunCode);
    document.getElementById('psSubmitBtn')?.addEventListener('click', psSubmit);
  });
}

// ── Java IntelliSense: snippets + stdlib completions ──────────────────────────
function registerJavaCompletions() {
  if (typeof monaco === 'undefined') return;

  // Snippet helper
  const snip = (label, detail, insert, doc) => ({
    label, detail, kind: monaco.languages.CompletionItemKind.Snippet,
    insertText: insert, insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: doc || label, sortText: '0' + label,
  });
  // Method helper
  const meth = (label, detail, insert, doc) => ({
    label, detail, kind: monaco.languages.CompletionItemKind.Method,
    insertText: insert, insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    documentation: doc || label,
  });
  // Class helper
  const cls = (label, detail, insert) => ({
    label, detail, kind: monaco.languages.CompletionItemKind.Class,
    insertText: insert, insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
  });
  // Keyword helper
  const kw = (label, insert) => ({
    label, kind: monaco.languages.CompletionItemKind.Keyword,
    insertText: insert || label,
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
  });

  monaco.languages.registerCompletionItemProvider('java', {
    triggerCharacters: ['.', ' ', '(', '<', '@'],

    provideCompletionItems(model, position) {
      const word    = model.getWordUntilPosition(position);
      const range   = { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber,
                        startColumn: word.startColumn, endColumn: word.endColumn };
      const lineText = model.getLineContent(position.lineNumber).substring(0, position.column - 1);

      const items = [];

      // ── Structure snippets ──────────────────────────────────────────────
      items.push(snip('main', 'public static void main', 'public static void main(String[] args) {\n\t$0\n}', 'Main method'));
      items.push(snip('psvm', 'public static void main', 'public static void main(String[] args) {\n\t$0\n}', 'Main method shortcut'));
      items.push(snip('sout', 'System.out.println', 'System.out.println($0);', 'Print to console'));
      items.push(snip('souf', 'System.out.printf', 'System.out.printf("$1%n"$2);', 'Printf'));
      items.push(snip('fori', 'for int loop', 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n\t$0\n}', 'Indexed for loop'));
      items.push(snip('fore', 'for-each loop', 'for (${1:var} ${2:item} : ${3:collection}) {\n\t$0\n}', 'Enhanced for loop'));
      items.push(snip('while', 'while loop', 'while (${1:condition}) {\n\t$0\n}', 'While loop'));
      items.push(snip('iff', 'if statement', 'if (${1:condition}) {\n\t$0\n}', 'If statement'));
      items.push(snip('ifelse', 'if-else', 'if (${1:condition}) {\n\t$2\n} else {\n\t$0\n}', 'If-else'));
      items.push(snip('try', 'try-catch', 'try {\n\t$1\n} catch (${2:Exception} ${3:e}) {\n\t${4:e.printStackTrace();}\n}', 'Try-catch'));
      items.push(snip('trycatch', 'try-catch-finally', 'try {\n\t$1\n} catch (${2:Exception} ${3:e}) {\n\t$4\n} finally {\n\t$0\n}', 'Try-catch-finally'));
      items.push(snip('class', 'class declaration', 'public class ${1:ClassName} {\n\t$0\n}', 'Class'));
      items.push(snip('iface', 'interface', 'public interface ${1:InterfaceName} {\n\t$0\n}', 'Interface'));
      items.push(snip('lambda', 'lambda expression', '(${1:param}) -> $0', 'Lambda'));
      items.push(snip('switch', 'switch statement', 'switch (${1:var}) {\n\tcase ${2:val}:\n\t\t$0\n\t\tbreak;\n\tdefault:\n\t\tbreak;\n}', 'Switch'));

      // ── Common DSA patterns ─────────────────────────────────────────────
      items.push(snip('scanner', 'Scanner setup', 'Scanner sc = new Scanner(System.in);\nint ${1:n} = sc.nextInt();', 'Scanner input'));
      items.push(snip('hashmap', 'HashMap<K,V>', 'Map<${1:String}, ${2:Integer}> ${3:map} = new HashMap<>();', 'HashMap'));
      items.push(snip('hashset', 'HashSet<T>', 'Set<${1:Integer}> ${2:set} = new HashSet<>();', 'HashSet'));
      items.push(snip('arraylist', 'ArrayList<T>', 'List<${1:Integer}> ${2:list} = new ArrayList<>();', 'ArrayList'));
      items.push(snip('linkedlist', 'LinkedList<T>', 'LinkedList<${1:Integer}> ${2:list} = new LinkedList<>();', 'LinkedList'));
      items.push(snip('pq', 'PriorityQueue (min-heap)', 'PriorityQueue<${1:Integer}> ${2:pq} = new PriorityQueue<>();', 'Min-heap'));
      items.push(snip('pqmax', 'PriorityQueue (max-heap)', 'PriorityQueue<${1:Integer}> ${2:pq} = new PriorityQueue<>(Collections.reverseOrder());', 'Max-heap'));
      items.push(snip('deque', 'ArrayDeque (stack/queue)', 'Deque<${1:Integer}> ${2:dq} = new ArrayDeque<>();', 'Deque'));
      items.push(snip('treemap', 'TreeMap<K,V>', 'TreeMap<${1:Integer}, ${2:Integer}> ${3:tm} = new TreeMap<>();', 'TreeMap (sorted)'));
      items.push(snip('sb', 'StringBuilder', 'StringBuilder ${1:sb} = new StringBuilder();\n${1:sb}.append($0);', 'StringBuilder'));
      items.push(snip('intarr', 'int array', 'int[] ${1:arr} = new int[${2:n}];', 'int array'));
      items.push(snip('twopt', 'two pointer', 'int ${1:left} = 0, ${2:right} = ${3:arr}.length - 1;\nwhile (${1:left} < ${2:right}) {\n\t$0\n\t${1:left}++;\n\t${2:right}--;\n}', 'Two pointer pattern'));
      items.push(snip('binary', 'binary search', 'int ${1:lo} = 0, ${2:hi} = ${3:arr}.length - 1;\nwhile (${1:lo} <= ${2:hi}) {\n\tint ${4:mid} = ${1:lo} + (${2:hi} - ${1:lo}) / 2;\n\tif (${3:arr}[${4:mid}] == ${5:target}) return ${4:mid};\n\telse if (${3:arr}[${4:mid}] < ${5:target}) ${1:lo} = ${4:mid} + 1;\n\telse ${2:hi} = ${4:mid} - 1;\n}\nreturn -1;', 'Binary search'));
      items.push(snip('dp', 'DP array init', 'int[] ${1:dp} = new int[${2:n} + 1];\n${1:dp}[0] = ${3:0}; // base case\nfor (int i = 1; i <= ${2:n}; i++) {\n\t${1:dp}[i] = $0;\n}', 'DP tabulation'));
      items.push(snip('bfs', 'BFS template', 'Queue<${1:Integer}> ${2:queue} = new LinkedList<>();\n${2:queue}.offer(${3:start});\nSet<${1:Integer}> visited = new HashSet<>();\nvisited.add(${3:start});\nwhile (!${2:queue}.isEmpty()) {\n\t${1:Integer} ${4:node} = ${2:queue}.poll();\n\t$0\n}', 'BFS pattern'));
      items.push(snip('dfs', 'DFS template', 'private void ${1:dfs}(${2:int node}, ${3:boolean[] visited}) {\n\tif (${3:visited}[${2:node}]) return;\n\t${3:visited}[${2:node}] = true;\n\t$0\n}', 'DFS pattern'));

      // ── Keywords ────────────────────────────────────────────────────────
      ['public','private','protected','static','final','void','int','long','double',
       'boolean','String','return','new','null','true','false','this','super',
       'instanceof','extends','implements','abstract','interface','class','enum',
       'throws','throw','import','package'].forEach(k => items.push(kw(k)));

      // ── Collections methods (triggered after '.') ───────────────────────
      if (lineText.endsWith('.')) {
        items.push(meth('add', 'add(element)', 'add($1)', 'Add element'));
        items.push(meth('get', 'get(index/key)', 'get($1)', 'Get by index or key'));
        items.push(meth('put', 'put(key, value)', 'put($1, $2)', 'Put key-value'));
        items.push(meth('remove', 'remove(index/key)', 'remove($1)', 'Remove element'));
        items.push(meth('size', 'size()', 'size()', 'Get size'));
        items.push(meth('isEmpty', 'isEmpty()', 'isEmpty()', 'Check if empty'));
        items.push(meth('contains', 'contains(element)', 'contains($1)', 'Contains check'));
        items.push(meth('containsKey', 'containsKey(key)', 'containsKey($1)', 'Map key check'));
        items.push(meth('getOrDefault', 'getOrDefault(key, def)', 'getOrDefault($1, $2)', 'Map get with default'));
        items.push(meth('merge', 'merge(key, val, fn)', 'merge($1, 1, Integer::sum)', 'Map merge'));
        items.push(meth('keySet', 'keySet()', 'keySet()', 'Get key set'));
        items.push(meth('values', 'values()', 'values()', 'Get values'));
        items.push(meth('entrySet', 'entrySet()', 'entrySet()', 'Get entry set'));
        items.push(meth('sort', 'sort(comparator)', 'sort($1)', 'Sort'));
        items.push(meth('forEach', 'forEach(action)', 'forEach(${1:item} -> $2)', 'For each'));
        items.push(meth('stream', 'stream()', 'stream()', 'Get stream'));
        items.push(meth('substring', 'substring(start, end)', 'substring($1, $2)', 'Substring'));
        items.push(meth('split', 'split(regex)', 'split("$1")', 'Split string'));
        items.push(meth('trim', 'trim()', 'trim()', 'Trim whitespace'));
        items.push(meth('toLowerCase', 'toLowerCase()', 'toLowerCase()', 'To lower'));
        items.push(meth('toUpperCase', 'toUpperCase()', 'toUpperCase()', 'To upper'));
        items.push(meth('charAt', 'charAt(index)', 'charAt($1)', 'Get char'));
        items.push(meth('length', 'length()', 'length()', 'String/array length'));
        items.push(meth('indexOf', 'indexOf(str)', 'indexOf($1)', 'Find index'));
        items.push(meth('toCharArray', 'toCharArray()', 'toCharArray()', 'To char array'));
        items.push(meth('append', 'append(str)', 'append($1)', 'StringBuilder append'));
        items.push(meth('toString', 'toString()', 'toString()', 'To string'));
        items.push(meth('offer', 'offer(element)', 'offer($1)', 'Queue offer'));
        items.push(meth('poll', 'poll()', 'poll()', 'Queue poll'));
        items.push(meth('peek', 'peek()', 'peek()', 'Queue/Stack peek'));
        items.push(meth('push', 'push(element)', 'push($1)', 'Stack push'));
        items.push(meth('pop', 'pop()', 'pop()', 'Stack pop'));
        items.push(meth('parseInt', 'parseInt(str)', 'parseInt($1)', 'Parse int'));
      }

      // ── Static method completions ───────────────────────────────────────
      items.push(cls('Arrays', 'java.util.Arrays', 'Arrays'));
      items.push(cls('Collections', 'java.util.Collections', 'Collections'));
      items.push(cls('Math', 'java.lang.Math', 'Math'));
      items.push(cls('Integer', 'java.lang.Integer', 'Integer'));
      items.push(cls('String', 'java.lang.String', 'String'));

      items.push(meth('Arrays.sort', 'Arrays.sort(array)', 'Arrays.sort($1)', 'Sort array'));
      items.push(meth('Arrays.fill', 'Arrays.fill(array, val)', 'Arrays.fill($1, $2)', 'Fill array'));
      items.push(meth('Arrays.copyOf', 'Arrays.copyOf(array, len)', 'Arrays.copyOf($1, $2)', 'Copy array'));
      items.push(meth('Arrays.asList', 'Arrays.asList(...)', 'Arrays.asList($1)', 'Array to list'));
      items.push(meth('Arrays.binarySearch', 'Arrays.binarySearch(arr, key)', 'Arrays.binarySearch($1, $2)', 'Binary search'));
      items.push(meth('Collections.sort', 'Collections.sort(list)', 'Collections.sort($1)', 'Sort list'));
      items.push(meth('Collections.reverse', 'Collections.reverse(list)', 'Collections.reverse($1)', 'Reverse list'));
      items.push(meth('Collections.max', 'Collections.max(coll)', 'Collections.max($1)', 'Max element'));
      items.push(meth('Collections.min', 'Collections.min(coll)', 'Collections.min($1)', 'Min element'));
      items.push(meth('Collections.frequency', 'Collections.frequency(coll, o)', 'Collections.frequency($1, $2)', 'Count occurrences'));
      items.push(meth('Math.max', 'Math.max(a, b)', 'Math.max($1, $2)', 'Maximum'));
      items.push(meth('Math.min', 'Math.min(a, b)', 'Math.min($1, $2)', 'Minimum'));
      items.push(meth('Math.abs', 'Math.abs(n)', 'Math.abs($1)', 'Absolute value'));
      items.push(meth('Math.pow', 'Math.pow(base, exp)', 'Math.pow($1, $2)', 'Power'));
      items.push(meth('Math.sqrt', 'Math.sqrt(n)', 'Math.sqrt($1)', 'Square root'));
      items.push(meth('Math.floor', 'Math.floor(n)', 'Math.floor($1)', 'Floor'));
      items.push(meth('Math.ceil', 'Math.ceil(n)', 'Math.ceil($1)', 'Ceiling'));
      items.push(meth('Integer.MAX_VALUE', 'Integer.MAX_VALUE', 'Integer.MAX_VALUE', '2147483647'));
      items.push(meth('Integer.MIN_VALUE', 'Integer.MIN_VALUE', 'Integer.MIN_VALUE', '-2147483648'));
      items.push(meth('Integer.parseInt', 'Integer.parseInt(str)', 'Integer.parseInt($1)', 'String to int'));
      items.push(meth('String.valueOf', 'String.valueOf(n)', 'String.valueOf($1)', 'Number to string'));

      return { suggestions: items.map(s => ({ ...s, range })) };
    }
  });
}

function ensurePsEditor(starterCode) {
  if (psEditor) {
    psEditor.setValue(starterCode || '// Write your solution here\n');
    return;
  }
  if (!window._monacoReady) { setTimeout(() => ensurePsEditor(starterCode), 100); return; }
  psEditor = monaco.editor.create(document.getElementById('psEditor'), {
    ...window._monacoCommon,
    value: starterCode || '// Write your solution here\n',
  });
  psEditor.onDidChangeModelContent(() => {
    setPsSyntaxDot('checking');
    clearTimeout(psSyntaxTimer);
    psSyntaxTimer = setTimeout(() => doSyntaxCheck(psEditor, 'ps'), 600);
  });
}

// ── Syntax Check ──────────────────────────────────────────────────────────────
async function doSyntaxCheck(editor, ctx) {
  if (!editor) return;
  const code = editor.getValue();
  const ver  = ctx === 'ps'
    ? (document.getElementById('psJavaVersion')?.value || '17')
    : (document.getElementById('javaVersionSelect')?.value || '17');

  if (!code.trim() || code.trim().length < 10) {
    clearMarkers(editor);
    if (ctx === 'main') { setSyntaxDot('ok'); updateErrBadge(0); renderErrCards([]); }
    if (ctx === 'ps')   { setPsSyntaxDot('ok'); renderPsErrors([]); }
    return;
  }
  try {
    const r = await API.syntaxCheck(code, ver);
    setMarkers(editor, r.errors || []);
    if (ctx === 'main') {
      setSyntaxDot(r.valid ? 'ok' : 'errors');
      updateErrBadge(r.errorCount || 0);
      renderErrCards(r.errors || []);
    }
    if (ctx === 'ps') {
      setPsSyntaxDot(r.valid ? 'ok' : 'errors', r.errorCount);
      renderPsErrors(r.errors || []);
    }
  } catch { /* network — stay silent */ }
}

function setMarkers(editor, errors) {
  if (!window.monaco || !editor?.getModel()) return;
  const model = editor.getModel();
  monaco.editor.setModelMarkers(model, 'javac', errors.map(e => {
    const lineLen = model.getLineMaxColumn(e.line || 1) || 200;
    const startCol = e.column || 1;
    // Squiggle from error column to end of line (or +30 chars for readability)
    const endCol = lineLen;
    return {
      severity: e.severity === 'error'
        ? monaco.MarkerSeverity.Error
        : monaco.MarkerSeverity.Warning,
      startLineNumber: e.line || 1,
      startColumn:     startCol,
      endLineNumber:   e.line || 1,
      endColumn:       endCol,
      message:         e.message || 'Compile error',
      source:          'javac',
    };
  }));
}
function clearMarkers(editor) {
  if (window.monaco && editor?.getModel())
    monaco.editor.setModelMarkers(editor.getModel(), 'javac', []);
}

function setSyntaxDot(state) {
  const dot = document.getElementById('syntaxDot');
  const lbl = document.getElementById('syntaxStatus');
  if (!dot) return;
  dot.className = `status-dot ${state}`;
  if (lbl) {
    if (state === 'checking') lbl.textContent = 'Checking…';
    else if (state === 'ok')  lbl.textContent = '✓ No errors';
    else                      lbl.textContent = 'Compile errors';
  }
}
function setPsSyntaxDot(state, count) {
  const dot = document.getElementById('psSyntaxDot');
  const lbl = document.getElementById('psSyntaxLabel');
  if (!dot) return;
  dot.className = `ps-syntax-dot ${state}`;
  if (lbl) {
    if (state === 'checking') lbl.textContent = 'Checking…';
    else if (state === 'ok')  lbl.textContent = 'No errors';
    else lbl.textContent = `${count || ''} error${count !== 1 ? 's' : ''}`;
  }
}

// ── PS Error Panel ────────────────────────────────────────────────────────────
// Shows live compile errors below the editor (like an IDE Problems panel)
function renderPsErrors(errors) {
  const panel = document.getElementById('psErrorPanel');
  if (!panel) return;

  if (!errors || errors.length === 0) {
    panel.style.display = 'none';
    panel.innerHTML = '';
    return;
  }

  panel.style.display = 'block';
  const errOnly  = errors.filter(e => e.severity === 'error');
  const warnOnly = errors.filter(e => e.severity === 'warning');

  panel.innerHTML = `
    <div class="ps-err-header">
      <span class="ps-err-title">
        ${errOnly.length  ? `<span class="ps-err-count err">${errOnly.length} error${errOnly.length!==1?'s':''}</span>` : ''}
        ${warnOnly.length ? `<span class="ps-err-count warn">${warnOnly.length} warning${warnOnly.length!==1?'s':''}</span>` : ''}
      </span>
      <button class="ps-err-close" onclick="document.getElementById('psErrorPanel').style.display='none'" title="Close">✕</button>
    </div>
    <div class="ps-err-list">
      ${errors.map(e => `
        <div class="ps-err-row ${e.severity}" onclick="psJumpToLine(${e.line})">
          <span class="ps-err-icon">${e.severity==='error' ? '✕' : '⚠'}</span>
          <span class="ps-err-loc">Line ${e.line}${e.column > 1 ? ':' + e.column : ''}</span>
          <span class="ps-err-msg">${esc(e.message)}</span>
          ${e.code ? `<div class="ps-err-code">${esc(e.code)}${e.column>1 ? '<br>' + ' '.repeat(e.column-1) + '^' : ''}</div>` : ''}
        </div>`).join('')}
    </div>`;
}
function updateErrBadge(n) {
  const b = document.getElementById('errCountBadge');
  if (b) { b.textContent = n; b.style.display = n > 0 ? 'inline' : 'none'; }
}
function renderErrCards(errors) {
  const panel = document.getElementById('errorsPanel');
  if (!panel) return;
  if (!errors.length) { panel.innerHTML = '<p class="no-errors-msg">✓ No compile errors</p>'; return; }
  panel.innerHTML = errors.map(e => `
    <div class="compile-err-card" onclick="jumpToLine(${e.line})">
      <div style="display:flex;align-items:flex-start;gap:6px">
        <span class="err-badge ${e.severity}">${e.severity === 'error' ? '✕ Error' : '⚠ Warning'}</span>
        <span class="err-line-badge">Line ${e.line}${e.column > 1 ? ':' + e.column : ''}</span>
        <span class="err-msg">${esc(e.message)}</span>
      </div>
      ${e.code ? `<div class="err-src-line">${esc(e.code)}\n${' '.repeat(Math.max(0,(e.column||1)-1))}^</div>` : ''}
    </div>`).join('');
}
function jumpToLine(line) {
  if (!monacoEditor) return;
  monacoEditor.revealLineInCenter(line);
  monacoEditor.setPosition({ lineNumber: line, column: 1 });
  monacoEditor.focus();
  switchOutTab('errors');
}

// ── Output Tabs (Code tab) ────────────────────────────────────────────────────
function bindOutTabs() {
  document.querySelectorAll('.out-tab').forEach(btn =>
    btn.addEventListener('click', () => switchOutTab(btn.dataset.out)));
}
function switchOutTab(name) {
  document.querySelectorAll('.out-tab').forEach(b => b.classList.toggle('active', b.dataset.out === name));
  ['testcase','output','errors'].forEach(n => {
    const p = document.getElementById(`out-${n}`);
    if (p) p.classList.toggle('hidden', n !== name);
  });
}

// ── Run / Reset (Code tab) ───────────────────────────────────────────────────
async function runCode() {
  if (!monacoEditor) return;
  const code  = monacoEditor.getValue();
  const stdin = document.getElementById('stdinInput')?.value || '';
  const ver   = document.getElementById('javaVersionSelect')?.value || '17';

  switchOutTab('output');
  setOutputStatus(null, '⏳ Compiling…');
  const box = document.getElementById('outputBox');
  if (box) { box.textContent = ''; box.className = 'output-box'; }
  const tb = document.getElementById('execTimeBadge');
  if (tb) tb.style.display = 'none';

  try {
    const r = await API.execute(code, stdin, ver);
    renderRunResult(r);
    if (r.status !== 'COMPILE_ERROR' && r.status !== 'RUNTIME_ERROR') {
      showInlineComplexity(code);
    }
  } catch {
    setOutputStatus('error', '⚠ Server unreachable');
    if (box) { box.textContent = 'Make sure the Spring Boot server is running on port 8080.'; box.className = 'output-box error'; }
  }
}

function renderRunResult(r) {
  const box = document.getElementById('outputBox');
  const tb  = document.getElementById('execTimeBadge');
  if (!box) return;

  if (r.status === 'COMPILE_ERROR') {
    setMarkers(monacoEditor, r.compileErrors || []);
    renderErrCards(r.compileErrors || []);
    updateErrBadge((r.compileErrors || []).filter(e => e.severity === 'error').length);
    setOutputStatus('compile-error', '✕ Compile Error');
    box.textContent = r.error || 'Compilation failed'; box.className = 'output-box error';
    switchOutTab('errors');
  } else if (r.status === 'TIMEOUT') {
    setOutputStatus('error', '⏱ Time Limit');
    box.textContent = r.error || 'Time limit exceeded'; box.className = 'output-box error';
  } else if (r.status === 'RUNTIME_ERROR') {
    setOutputStatus('error', '✕ Runtime Error');
    box.textContent = r.error || 'Runtime error'; box.className = 'output-box error';
  } else {
    setOutputStatus('success', '✓ Accepted');
    box.textContent = r.output || '(no output)'; box.className = 'output-box success';
  }
  if (r.executionTimeMs && tb) { tb.textContent = `⏱ ${r.executionTimeMs}ms`; tb.style.display = 'inline'; }
}

async function showInlineComplexity(code) {
  const el = document.getElementById('inlineComplexity');
  if (!el) return;
  try {
    const r = await API.analyzeComplexity(code);
    if (!r || !r.timeComplexity) { el.style.display = 'none'; return; }
    el.innerHTML =
      `<span title="Time complexity">⏱ ${esc(r.timeComplexity)}</span>` +
      (r.spaceComplexity ? `<span title="Space complexity" style="margin-left:10px">💾 ${esc(r.spaceComplexity)}</span>` : '');
    el.style.display = 'flex';
  } catch { el.style.display = 'none'; }
}

function setOutputStatus(type, text) {
  const row = document.getElementById('outputStatusRow');
  if (!row) return;
  if (!text) { row.innerHTML = ''; return; }
  const colors = { success: 'var(--accent)', error: 'var(--red)', 'compile-error': 'var(--red)', warning: 'var(--yellow)' };
  const c = colors[type] || 'var(--text2)';
  row.innerHTML = `<span class="out-status-badge" style="color:${c};border-color:${c}20;background:${c}12">${esc(text)}</span>`;
}

function resetEditor() {
  if (monacoEditor && currentTopic?.starterCode)
    monacoEditor.setValue(currentTopic.starterCode.trim());
  const box = document.getElementById('outputBox');
  if (box) { box.textContent = '// Press ▶ Run Code to execute'; box.className = 'output-box'; }
  const row = document.getElementById('outputStatusRow');
  if (row) row.innerHTML = '';
  const tb = document.getElementById('execTimeBadge');
  if (tb) tb.style.display = 'none';
}

// ── Sidebar & Topic Loading ───────────────────────────────────────────────────
async function loadTopics(category = 'ALL') {
  const list = document.getElementById('topicList');
  list.innerHTML = '<li class="loading-item">Loading…</li>';
  try {
    const topics = await API.getTopics(category === 'ALL' ? null : category);
    renderTopicList(topics);
    return topics;
  } catch {
    list.innerHTML = '<li class="loading-item">⚠ Could not load topics</li>';
    return [];
  }
}

function renderTopicList(topics) {
  const list = document.getElementById('topicList');
  if (!topics.length) { list.innerHTML = '<li class="loading-item">No topics found.</li>'; return; }
  list.innerHTML = topics.map(t => `
    <li class="topic-item" data-id="${t.id}" onclick="selectTopic(${t.id})">
      <span class="item-name">${esc(t.title)}</span>
      <span class="item-tag ${tagCls(t.category)}">${tagLbl(t.category)}</span>
    </li>`).join('');
}

function tagCls(cat) {
  const m = {
    DSA:'tag-dsa', JAVA:'tag-java', ADVANCED_JAVA:'tag-adv',
    MYSQL:'tag-mysql', AWS:'tag-aws',
    // New categories — map to closest visual style
    SPRING:'tag-java', SPRING_BOOT:'tag-java', SPRING_MVC:'tag-java',
    SPRING_SECURITY:'tag-java', HIBERNATE:'tag-mysql', SPRING_DATA:'tag-mysql',
    MICROSERVICES:'tag-aws', JAVASCRIPT:'tag-dsa'
  };
  return m[cat] || 'tag-dsa';
}
function tagLbl(cat) {
  const m = {
    DSA:'DSA', JAVA:'Java', ADVANCED_JAVA:'Adv', MYSQL:'SQL', AWS:'AWS',
    SPRING:'Spring', SPRING_BOOT:'Boot', SPRING_MVC:'MVC',
    SPRING_SECURITY:'Sec', HIBERNATE:'JPA', SPRING_DATA:'Data',
    MICROSERVICES:'μSvc', JAVASCRIPT:'JS'
  };
  return m[cat] || cat;
}

async function selectTopic(id) {
  document.querySelectorAll('.topic-item').forEach(el => el.classList.toggle('active', +el.dataset.id === id));
  // Exit PS view if open
  if (document.getElementById('problemSolveView')?.style.display !== 'none') exitProblemSolve();
  try {
    currentTopic = await API.getTopic(id);
    renderTopicView(currentTopic);
    switchTab('theory');
  } catch (e) { console.error('selectTopic failed', e); }
}

function renderTopicView(t) {
  document.getElementById('welcomeScreen').style.display = 'none';
  document.getElementById('topicView').style.display    = 'flex';

  document.getElementById('topicTitle').textContent = t.title;
  document.getElementById('topicDesc').textContent  = t.description || '';

  const badge = document.getElementById('topicBadge');
  if (badge) {
    badge.textContent = tagLbl(t.category);
    badge.className   = `topic-category-badge badge-${(t.category||'dsa').toLowerCase()}`;
  }
  const cx = document.getElementById('topicComplexity');
  if (cx) cx.textContent = t.timeComplexity
    ? `⏱ ${t.timeComplexity}  |  💾 ${t.spaceComplexity || ''}` : '';

  if (monacoEditor && t.starterCode)
    monacoEditor.setValue(t.starterCode.trim());
}

// ── Category Tabs ─────────────────────────────────────────────────────────────
function bindCategoryTabs() {
  document.querySelectorAll('.cat-btn').forEach(btn =>
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.cat;
      loadTopics(activeCategory);
    }));
}

// ── Search ────────────────────────────────────────────────────────────────────
function bindSearch() {
  document.getElementById('topicSearch')?.addEventListener('input', async e => {
    const q = e.target.value.trim().toLowerCase();
    if (!q) { loadTopics(activeCategory); return; }
    try {
      const all = await API.getTopics(activeCategory === 'ALL' ? null : activeCategory);
      renderTopicList(all.filter(t => t.title.toLowerCase().includes(q)));
    } catch {}
  });
}

// ── Tab Switching ─────────────────────────────────────────────────────────────
function bindTabBar() {
  document.querySelectorAll('.tab-btn').forEach(btn =>
    btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
}

function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('hidden', p.id !== `tab-${tab}`));
  if (tab === 'theory')    loadTheory();
  if (tab === 'examples')  loadExamples();
  if (tab === 'practice')  loadProblems();
  if (tab === 'optimize')  loadOptimize();
  if (tab === 'flowchart') Flowchart.render(currentTopic?.title);
  if (tab === 'trace')     syncTraceAlgo(currentTopic?.title);
  if (tab === 'visual')    loadDSAVisual();
}

// ── DSA Visual Tab ───────────────────────────────────────────────────────────
function loadDSAVisual() {
  if (!currentTopic) return;
  const vizTab = document.getElementById('tab-visual');
  if (!vizTab) return;
  let vContainer = document.getElementById('dsaVisualContainer');
  if (!vContainer) {
    vContainer = document.createElement('div');
    vContainer.id = 'dsaVisualContainer';
    vContainer.style.cssText = 'padding:4px 0';
    const existing = vizTab.querySelector('.visual-controls');
    if (existing) vizTab.insertBefore(vContainer, existing);
    else vizTab.appendChild(vContainer);
  }
  if (typeof DSAVisuals !== 'undefined') {
    DSAVisuals.render(vContainer, currentTopic.title);
  }
}

// ── Theory Tab ────────────────────────────────────────────────────────────────
function loadTheory() {
  const t = currentTopic;
  if (!t) return;
  showHideCard('theoryAnchor',     'theoryAnchorText',     t.memoryAnchor);
  showHideCard('theoryStory',      'theoryStoryText',      t.story);
  showHideCard('theoryAnalogy',    'theoryAnalogyText',    t.analogy);
  showHideCard('theoryPrinciples', 'theoryPrinciplesText', t.firstPrinciples);
  showHideCard('theoryDefinition', 'theoryDefinitionText', t.story ? '' : t.description);
  const empty = !t.memoryAnchor && !t.story && !t.analogy && !t.firstPrinciples;
  const e = document.getElementById('theoryEmpty');
  if (e) e.style.display = empty ? 'block' : 'none';
}
function showHideCard(cardId, textId, content) {
  const card = document.getElementById(cardId);
  const text = document.getElementById(textId);
  if (!card) return;
  if (content && content.trim()) { text.textContent = content; card.style.display = 'block'; }
  else card.style.display = 'none';
}

// ── Examples Tab ──────────────────────────────────────────────────────────────
async function loadExamples() {
  if (!currentTopic) return;
  const grid = document.getElementById('examplesGrid');
  grid.innerHTML = '<p class="loading-text">Loading examples…</p>';
  try {
    const examples = await API.getExamples(currentTopic.id);
    if (!examples.length) { grid.innerHTML = '<p class="loading-text">No examples yet for this topic.</p>'; return; }
    grid.innerHTML = examples.map((ex, i) => `
      <div class="example-card">
        <div class="example-card-header" onclick="toggleEx(${i})">
          <div>
            <span class="example-num">EXAMPLE ${ex.displayOrder || i + 1}</span>
            <div class="example-title">${esc(ex.title || '')}</div>
          </div>
          <span class="example-toggle" id="exTog-${i}">▼</span>
        </div>
        <div class="example-body" id="exBody-${i}">
          <p class="example-desc">${esc(ex.description || '')}</p>
          ${ex.pseudocode ? `
            <div class="pseudo-section">
              <div class="pseudo-label">📝 Pseudocode</div>
              <pre class="pseudo-block">${esc(ex.pseudocode)}</pre>
            </div>` : ''}
          <pre class="example-code-block">${esc(ex.code || '')}</pre>
          <div class="example-meta">
            <span><strong>💡 Key Insight:</strong> ${esc(ex.explanation || '')}</span>
            <span class="rw-tag">🌍 ${esc(ex.realWorldUse || '')}</span>
          </div>
        </div>
      </div>`).join('');
    toggleEx(0);
  } catch { grid.innerHTML = '<p class="loading-text">⚠ Could not load examples.</p>'; }
}
function toggleEx(i) {
  const body = document.getElementById(`exBody-${i}`);
  const tog  = document.getElementById(`exTog-${i}`);
  if (!body) return;
  const open = body.classList.toggle('open');
  if (tog) tog.classList.toggle('open', open);
}

// ── Practice Tab (problem list) ───────────────────────────────────────────────
async function loadProblems() {
  if (!currentTopic) return;
  const table = document.getElementById('problemsTable');
  table.innerHTML = '<p class="loading-text">Loading…</p>';
  const titleEl = document.getElementById('practiceTopicTitle');
  if (titleEl) titleEl.textContent = currentTopic.title + ' — Problems';
  try {
    currentProblems = await API.getProblems(currentTopic.id);
    if (!currentProblems.length) { table.innerHTML = '<p class="loading-text">No problems for this topic yet.</p>'; return; }
    renderProblemsTable(currentProblems);
  } catch { table.innerHTML = '<p class="loading-text">⚠ Could not load problems.</p>'; }
}
function renderProblemsTable(list) {
  const table = document.getElementById('problemsTable');
  table.innerHTML = list.map((p, i) => `
    <div class="prob-row" onclick="openProblemSolve(${p.id})">
      <span class="prob-num">${p.displayOrder || i + 1}</span>
      <span class="prob-title">${esc(p.title)}</span>
      <div class="prob-meta">
        ${p.pattern ? `<span class="pattern-chip">${esc(p.pattern)}</span>` : ''}
        <span class="diff-badge diff-${(p.difficulty || 'MEDIUM').toLowerCase()}">${p.difficulty}</span>
      </div>
    </div>`).join('');
}
function filterDiff(btn, diff) {
  document.querySelectorAll('.diff-filter').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (!currentProblems.length) return;
  renderProblemsTable(diff === 'ALL' ? currentProblems : currentProblems.filter(p => p.difficulty === diff));
}

// ── Optimize Tab ──────────────────────────────────────────────────────────────
function loadOptimize() {
  if (!currentTopic) return;
  setContent('optBrute',   currentTopic.bruteForce        || 'N/A');
  setContent('optOpt',     currentTopic.optimizedApproach || 'N/A');
  setContent('optWhen',    currentTopic.whenToUse         || 'N/A');
  setContent('optComplex', `<strong style="color:var(--accent)">Time:</strong> ${currentTopic.timeComplexity||'N/A'}<br><strong style="color:var(--blue)">Space:</strong> ${currentTopic.spaceComplexity||'N/A'}`);
}
function setContent(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = `<div class="opt-content">${html}</div>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PROBLEM SOLVE VIEW
// ═══════════════════════════════════════════════════════════════════════════════

async function openProblemSolve(pid) {
  try {
    currentProblem = await API.getProblem(pid);
    const p = currentProblem;

    // Breadcrumb & badges
    const breadTopic = document.getElementById('psBreadTopic');
    if (breadTopic) {
      breadTopic.textContent = currentTopic?.title || '';
      breadTopic.style.cursor = currentTopic ? 'pointer' : 'default';
      breadTopic.style.textDecoration = currentTopic ? 'underline' : 'none';
      breadTopic.onclick = currentTopic ? () => goStudyTopic() : null;
    }
    document.getElementById('psBreadTitle').textContent = p.title;
    const dc = `diff-${(p.difficulty||'MEDIUM').toLowerCase()}`;
    document.getElementById('psDiffBadge').textContent  = p.difficulty;
    document.getElementById('psDiffBadge').className    = `diff-badge ${dc}`;

    // Problem header
    document.getElementById('psProbNum').textContent    = `#${p.displayOrder || pid}`;
    document.getElementById('psProbTitle').textContent  = p.title;
    document.getElementById('psDiffBadge2').textContent = p.difficulty;
    document.getElementById('psDiffBadge2').className   = `diff-badge ${dc}`;
    const patEl = document.getElementById('psProbPattern');
    if (p.pattern) { patEl.textContent = p.pattern; patEl.style.display = ''; }
    else patEl.style.display = 'none';

    // Description
    document.getElementById('psProbDesc').textContent = p.description || '';

    // Example block
    document.getElementById('psProbExample').innerHTML = `
      <div class="ps-prob-example">
        <div class="ps-ex-label">Example</div>
        <div class="ps-ex-row"><span class="ps-ex-key">Input:</span><pre class="ps-ex-val">${esc(p.sampleInput || 'N/A')}</pre></div>
        <div class="ps-ex-row"><span class="ps-ex-key">Output:</span><pre class="ps-ex-val">${esc(p.sampleOutput || 'N/A')}</pre></div>
      </div>`;

    // Input/output format
    document.getElementById('psProbFormats').innerHTML =
      (p.inputFormat  ? `<p style="font-size:12px;color:var(--text2);margin-bottom:5px"><strong>Input:</strong> ${esc(p.inputFormat)}</p>` : '') +
      (p.outputFormat ? `<p style="font-size:12px;color:var(--text2)"><strong>Output:</strong> ${esc(p.outputFormat)}</p>` : '');

    // Similar problems (other problems from same topic with same pattern)
    renderSimilarProblems(p);

    // Hints
    buildHints(p);
    psHintsShown = 0;

    // Set testcase input
    const si = document.getElementById('psStdinInput');
    if (si) si.value = p.sampleInput || '';

    // Clear result
    const rc = document.getElementById('psResultContent');
    if (rc) rc.innerHTML = '<p style="color:var(--text3);font-size:12px;text-align:center;padding:16px 0">Run or Submit to see results.</p>';
    const pe = document.getElementById('psExecTime');
    if (pe) pe.textContent = '';

    // Reset tabs
    switchDescTab(document.querySelector('.ps-dtab[data-dtab="desc"]'), 'desc');
    switchPsTab(document.querySelector('.ps-btab'), 'testcase');
    setPsSyntaxDot('ready');

    // Phase 1: restore saved approach from localStorage
    const approachEl  = document.getElementById('approachText');
    const approachKey = `devlearn_approach_${pid}`;
    if (approachEl) approachEl.value = localStorage.getItem(approachKey) || '';
    const statusEl = document.getElementById('approachSaveStatus');
    if (statusEl) statusEl.textContent = localStorage.getItem(approachKey) ? '✓ Previously saved' : '';

    // Init/reset PS editor
    const starter = p.starterCode || 'public class Main {\n    public static void main(String[] args) {\n        // TODO: implement solution\n        Scanner sc = new Scanner(System.in);\n        \n    }\n}';
    ensurePsEditor(starter);

    // Restore panel open
    psBottomOpen = true;
    const body = document.getElementById('psBottomBody');
    const btn  = document.getElementById('psCollapseBtn');
    if (body) body.style.display = '';
    if (btn)  btn.textContent = '▼';
    const bottom = document.getElementById('psBottom');
    if (bottom) bottom.classList.remove('collapsed');

    // Init resize
    initPsResize();

    // Show PS view
    document.getElementById('topicView').style.display         = 'none';
    document.getElementById('welcomeScreen').style.display     = 'none';
    document.getElementById('problemSolveView').style.display  = 'flex';
    document.getElementById('mainContent').style.overflow      = 'hidden';

  } catch (e) {
    console.error('openProblemSolve failed', e);
    showToast('⚠ Failed to load problem');
  }
}

// ── Study Topic from PS view ─────────────────────────────────────────────────
// Goes back to the topic learning view (Theory tab) without losing context
function goStudyTopic() {
  if (!currentTopic) { exitProblemSolve(); return; }
  // Hide PS view
  document.getElementById('problemSolveView').style.display = 'none';
  document.getElementById('mainContent').style.overflow     = '';
  // Show topic view on Theory tab
  document.getElementById('welcomeScreen').style.display = 'none';
  document.getElementById('topicView').style.display     = 'flex';
  switchTab('theory');
  // Show a toast so user knows how to come back
  showToast('📖 Studying ' + currentTopic.title + ' — click Practice to return');
}

function exitProblemSolve() {
  document.getElementById('problemSolveView').style.display = 'none';
  document.getElementById('mainContent').style.overflow     = '';
  if (currentTopic) {
    document.getElementById('topicView').style.display = 'flex';
    switchTab('practice');
  } else {
    document.getElementById('welcomeScreen').style.display = 'flex';
  }
}

// ── Hints ─────────────────────────────────────────────────────────────────────
function buildHints(p) {
  const container = document.getElementById('psHintsList');
  if (!container) return;
  const tiers = [
    { num: 1, title: 'Hint 1 — Direction',   sub: 'Always free',                text: p.hint1 },
    { num: 2, title: 'Hint 2 — Approach',    sub: 'Reveals the pattern',        text: p.hint2 },
    { num: 3, title: 'Hint 3 — Pseudocode',  sub: 'Marks as hint-assisted',     text: p.hint3 },
  ];
  container.innerHTML = '';
  tiers.forEach(tier => {
    if (!tier.text && !p.hint) return; // skip if no content
    const actualText = tier.text || (tier.num === 1 ? p.hint : '');
    if (!actualText) return;
    const div = document.createElement('div');
    div.innerHTML = `
      <button class="ps-hint-btn" id="psHintBtn-${tier.num}" onclick="showPsHint(${tier.num})">
        <span class="ps-hint-btn-icon">💡</span>
        <div style="flex:1">
          <div class="ps-hint-btn-title">${esc(tier.title)}</div>
          <div class="ps-hint-btn-sub">${esc(tier.sub)}</div>
        </div>
        <span style="color:var(--text3)">›</span>
      </button>
      <div class="ps-hint-content" id="psHintContent-${tier.num}">${esc(actualText)}</div>`;
    container.appendChild(div);
  });
}

function showPsHint(tier) {
  const content = document.getElementById(`psHintContent-${tier}`);
  const btn     = document.getElementById(`psHintBtn-${tier}`);
  if (content) content.classList.add('visible');
  if (btn)     btn.classList.add('used');
  psHintsShown = Math.max(psHintsShown, tier);
  if (tier === 3) {
    const badge = document.getElementById('psHintAssistedBadge');
    if (badge) badge.classList.add('visible');
  }
  // Switch to hints tab
  const hintsTab = document.querySelector('.ps-dtab[data-dtab="hints"]');
  if (hintsTab) switchDescTab(hintsTab, 'hints');
}

// ── PS Run ────────────────────────────────────────────────────────────────────
async function psRunCode() {
  if (!psEditor || !currentProblem) return;
  const code  = psEditor.getValue();
  const stdin = document.getElementById('psStdinInput')?.value || currentProblem.sampleInput || '';
  const ver   = document.getElementById('psJavaVersion')?.value || '17';

  // BUG FIX: querySelector('.ps-btab:last-child') returns null because the .ps-btab buttons
  // are NOT the last children of .ps-bottom-bar (a spacer div and collapse button follow them).
  // null passed to switchPsTab meant the result panel showed but no button got the active class.
  switchPsTab(document.querySelectorAll('.ps-btab')[1], 'result');
  renderPsLoading('▶ Running…');
  const pe = document.getElementById('psExecTime');
  if (pe) pe.textContent = '';

  try {
    const r = await API.execute(code, stdin, ver);
    renderPsRunResult(r);
  } catch {
    renderPsLoading('⚠ Server error');
  }
}

function renderPsRunResult(r) {
  const el = document.getElementById('psResultContent');
  if (!el) return;
  const pe = document.getElementById('psExecTime');

  if (r.status === 'COMPILE_ERROR') {
    setMarkers(psEditor, r.compileErrors || []);
    const errs = r.compileErrors || [];
    el.innerHTML = `
      <div class="ps-result-row">
        <span class="ps-result-icon">✕</span>
        <div><div class="ps-result-title error">Compile Error</div><div class="ps-result-sub">${errs.length} error${errs.length !== 1 ? 's' : ''}</div></div>
      </div>
      <div class="ps-compile-errs">${errs.map(e => `
        <div class="ps-ce">
          <div class="ps-ce-top">
            <span class="ps-ce-line" onclick="psJumpToLine(${e.line})">Line ${e.line}</span>
            <span class="ps-ce-msg">${esc(e.message)}</span>
          </div>
          ${e.code ? `<div class="ps-ce-code">${esc(e.code)}\n${' '.repeat(Math.max(0,(e.column||1)-1))}^</div>` : ''}
        </div>`).join('')}
      </div>`;
    return;
  }
  if (r.status === 'TIMEOUT') {
    el.innerHTML = `<div class="ps-result-row"><span class="ps-result-icon">⏱</span><div><div class="ps-result-title fail">Time Limit Exceeded</div></div></div>`;
    return;
  }
  if (r.status === 'RUNTIME_ERROR') {
    el.innerHTML = `<div class="ps-result-row"><span class="ps-result-icon">✕</span><div><div class="ps-result-title error">Runtime Error</div></div></div>
      <pre style="font-family:var(--font-code);font-size:12px;color:var(--red);white-space:pre-wrap;margin-top:8px">${esc(r.error || '')}</pre>`;
    return;
  }
  if (pe && r.executionTimeMs) pe.textContent = `⏱ ${r.executionTimeMs}ms`;
  el.innerHTML = `
    <div class="ps-result-row">
      <span class="ps-result-icon">▶</span>
      <div><div class="ps-result-title pass">Output</div>${r.executionTimeMs ? `<div class="ps-result-sub">${r.executionTimeMs}ms</div>` : ''}</div>
    </div>
    <div class="ps-output-label">Your output</div>
    <pre class="ps-output-val pass">${esc(r.output || '(no output)')}</pre>`;
}

// ── PS Submit ─────────────────────────────────────────────────────────────────
async function psSubmit() {
  if (!psEditor || !currentProblem) return;
  const code = psEditor.getValue();
  switchPsTab(document.querySelectorAll('.ps-btab')[1], 'result');
  renderPsLoading('⏳ Evaluating all test cases…');

  try {
    // BUG FIX: previously called as submit(problemId, code) — missing javaVersion and
    // hintAssisted.  The Java version dropdown in the PS toolbar was silently ignored and
    // hint-assisted tracking was never sent.
    const ver = document.getElementById('psJavaVersion')?.value || '17';
    const r = await API.submit(currentProblem.id, code, null, psHintsShown >= 3, ver);
    renderPsSubmitResult(r);
    if (r.allPassed) {
      try {
        const solved = new Set(JSON.parse(localStorage.getItem('devlearn_solved') || '[]'));
        solved.add(currentProblem.id);
        localStorage.setItem('devlearn_solved', JSON.stringify([...solved]));
      } catch (_) {}
      setTimeout(showRecallDrill, 700);
    }
  } catch {
    renderPsLoading('⚠ Submit failed — server error');
  }
}

function renderPsSubmitResult(r) {
  const el = document.getElementById('psResultContent');
  if (!el) return;
  const pass   = r.allPassed;
  const dots   = (r.results || []).map(tc =>
    `<span class="ps-dot ${tc.passed ? 'pass' : 'fail'}" title="Test ${tc.testNumber}: ${tc.passed ? 'PASS' : 'FAIL'}"></span>`).join('');
  const failed = (r.results || []).filter(tc => !tc.passed);
  const hintedBadge = psHintsShown >= 3 ? '<div style="font-size:11px;color:var(--text3);margin-bottom:8px">⚑ Hint-assisted submission</div>' : '';

  // Phase 1: smart feedback — detected algorithm pattern
  const patternLabels = {
    TWO_POINTER:'Two Pointer', SLIDING_WINDOW:'Sliding Window', BINARY_SEARCH:'Binary Search',
    HASH_MAP:'HashMap / Hashing', RECURSION:'Recursion', DYNAMIC_PROGRAMMING:'Dynamic Programming',
    BFS:'BFS', DFS:'DFS', GREEDY:'Greedy', PREFIX_SUM:'Prefix Sum',
    BRUTE_FORCE:'Brute Force', UNKNOWN:'Custom Approach'
  };
  const patternLabel = r.detectedPattern ? (patternLabels[r.detectedPattern] || r.detectedPattern) : null;
  const smartFeedbackHtml = patternLabel ? `
    <div style="margin:10px 0;padding:10px 12px;background:rgba(0,184,163,.06);border:1px solid rgba(0,184,163,.18);border-radius:6px;font-size:12px">
      <div style="font-weight:700;color:var(--accent);margin-bottom:4px">🔍 Detected: ${esc(patternLabel)}</div>
      ${r.methodologyExplanation ? `<div style="color:var(--text2);line-height:1.5">${esc(r.methodologyExplanation)}</div>` : ''}
      ${r.optimizationNote ? `<div style="margin-top:6px;color:var(--yellow);line-height:1.5">💡 ${esc(r.optimizationNote)}</div>` : ''}
    </div>` : '';

  el.innerHTML = `
    <div class="ps-result-row">
      <span class="ps-result-icon">${pass ? '✅' : '❌'}</span>
      <div>
        <div class="ps-result-title ${pass ? 'pass' : 'fail'}">${pass ? 'Accepted' : 'Wrong Answer'}</div>
        <div class="ps-result-sub">${r.passedTests} / ${r.totalTests} test cases passed</div>
      </div>
    </div>
    ${dots ? `<div class="ps-tc-dots">${dots}</div>` : ''}
    ${hintedBadge}
    ${smartFeedbackHtml}
    ${r.hint ? `<div style="padding:8px 10px;background:rgba(255,184,0,.06);border:1px solid rgba(255,184,0,.15);border-radius:5px;font-size:12px;color:var(--yellow);margin-bottom:10px"><strong>💡 Hint: </strong>${esc(r.hint)}</div>` : ''}
    ${failed.slice(0, 3).map(tc => `
      <div class="ps-fail-case">
        <div class="ps-fail-header">Test ${tc.testNumber} — FAILED</div>
        <div class="ps-fail-detail">
          <span class="ps-fail-key">Input</span>    <span class="ps-fail-val">${esc(String(tc.input || ''))}</span>
          <span class="ps-fail-key">Expected</span> <span class="ps-fail-val expected">${esc(String(tc.expected || ''))}</span>
          <span class="ps-fail-key">Got</span>      <span class="ps-fail-val got">${esc(String(tc.actual || ''))}</span>
        </div>
      </div>`).join('')}`;
}

function renderSimilarProblems(p) {
  const el = document.getElementById('psSimilarProblems');
  if (!el) return;
  if (!currentProblems || currentProblems.length <= 1) { el.style.display = 'none'; return; }

  // Other problems from same topic, different from current
  const similar = currentProblems
    .filter(q => q.id !== p.id)
    .sort((a, b) => {
      // Same pattern first
      const aMatch = a.pattern && a.pattern === p.pattern ? 0 : 1;
      const bMatch = b.pattern && b.pattern === p.pattern ? 0 : 1;
      return aMatch - bMatch;
    })
    .slice(0, 5);

  if (!similar.length) { el.style.display = 'none'; return; }

  el.style.display = '';
  el.innerHTML = `
    <div class="ps-similar-header">Related problems in ${esc(currentTopic?.title || 'this topic')}</div>
    <div class="ps-similar-list">
      ${similar.map(q => `
        <div class="ps-similar-item" onclick="openProblemSolve(${q.id})">
          <span class="ps-similar-title">${esc(q.title)}</span>
          <span class="diff-badge diff-${(q.difficulty||'MEDIUM').toLowerCase()}">${q.difficulty||'MEDIUM'}</span>
        </div>`).join('')}
    </div>`;
}

function renderPsLoading(msg) {
  const el = document.getElementById('psResultContent');
  if (el) el.innerHTML = `<p style="color:var(--text3);font-size:12px;padding:16px 0">${esc(msg)}</p>`;
}

// Clear PS error panel when errors are resolved
function clearPsErrors() {
  const panel = document.getElementById('psErrorPanel');
  if (panel) { panel.style.display = 'none'; panel.innerHTML = ''; }
}
function psJumpToLine(line) {
  if (!psEditor) return;
  psEditor.revealLineInCenter(line);
  psEditor.setPosition({ lineNumber: line, column: 1 });
  psEditor.focus();
}

// ── PS Panel UI ───────────────────────────────────────────────────────────────
function switchDescTab(btn, name) {
  document.querySelectorAll('.ps-dtab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.ps-dpanel').forEach(p => { p.classList.remove('active'); p.style.display = 'none'; });
  if (btn) btn.classList.add('active');
  const panel = document.getElementById(`dtab-${name}`);
  if (panel) { panel.classList.add('active'); panel.style.display = 'block'; }
}
function switchPsTab(btn, name) {
  document.querySelectorAll('.ps-btab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.ps-bpanel').forEach(p => { p.classList.remove('active'); p.style.display = 'none'; });
  if (btn) btn.classList.add('active');
  const panel = document.getElementById(`pstab-${name}`);
  if (panel) { panel.classList.add('active'); panel.style.display = 'block'; }
  if (!psBottomOpen) togglePsBottom();
}
function togglePsBottom() {
  psBottomOpen = !psBottomOpen;
  const body   = document.getElementById('psBottomBody');
  const btn    = document.getElementById('psCollapseBtn');
  const bottom = document.getElementById('psBottom');
  if (psBottomOpen) {
    if (body)   body.style.display = '';
    if (btn)    btn.textContent = '▼';
    if (bottom) bottom.classList.remove('collapsed');
  } else {
    if (body)   body.style.display = 'none';
    if (btn)    btn.textContent = '▲';
    if (bottom) bottom.classList.add('collapsed');
  }
}

// ── Resize Handle ─────────────────────────────────────────────────────────────
let _resizeInit = false;
function initPsResize() {
  if (_resizeInit) return;
  _resizeInit = true;
  const handle = document.getElementById('psResizeHandle');
  const left   = document.getElementById('psLeft');
  const split  = document.getElementById('psSplit');
  if (!handle || !left || !split) return;

  handle.addEventListener('mousedown', e => {
    psResizing = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!psResizing) return;
    const rect = split.getBoundingClientRect();
    let w = e.clientX - rect.left;
    w = Math.max(260, Math.min(w, rect.width - 320));
    left.style.width = w + 'px';
    left.style.maxWidth = 'none';
  });
  document.addEventListener('mouseup', () => {
    if (psResizing) { psResizing = false; document.body.style.cursor = ''; document.body.style.userSelect = ''; }
  });
}

// ── Recall Drill ──────────────────────────────────────────────────────────────
function showRecallDrill() {
  const modal = document.getElementById('recallModal');
  if (!modal) return;
  const nm = document.getElementById('recallAlgoName');
  if (nm) nm.textContent = currentTopic?.title || 'this algorithm';
  const txt = document.getElementById('recallText');
  if (txt) txt.value = '';
  modal.style.display = 'flex';
}
// ── Phase 1: Approach Write Box ───────────────────────────────────────────────
function saveApproach() {
  const approachEl = document.getElementById('approachText');
  const statusEl   = document.getElementById('approachSaveStatus');
  const text = approachEl?.value?.trim();
  if (!text) { if (statusEl) statusEl.textContent = '⚠ Nothing to save'; return; }
  localStorage.setItem(`devlearn_approach_${currentProblem?.id}`, text);
  if (statusEl) { statusEl.textContent = '✓ Saved'; setTimeout(() => { statusEl.textContent = ''; }, 2000); }
  showToast('✍️ Approach saved!');
}

async function saveRecall() {
  const modal = document.getElementById('recallModal');
  const txt   = document.getElementById('recallText');
  const text  = txt?.value?.trim();
  if (modal) modal.style.display = 'none';
  if (text && text.length > 3) {
    try {
      await fetch('/api/recall', {
        method: 'POST',
        headers: Auth.headers(),
        body: JSON.stringify({
          topicId:    currentTopic?.id    || null,
          topicTitle: currentTopic?.title || '',
          text
        })
      });
    } catch (_) {}
    showToast('🧠 Recall saved — great practice!');
  }
}

function skipRecall() {
  const modal = document.getElementById('recallModal');
  if (modal) modal.style.display = 'none';
}

// ── Phase 1: Activity Heatmap ─────────────────────────────────────────────────
async function loadHeatmap() {
  try {
    const res = await fetch('/api/submissions/heatmap', { headers: Auth.headers() });
    if (!res.ok) return;
    renderHeatmap(await res.json());
  } catch (_) {}
}

function renderHeatmap(data) {
  const grid     = document.getElementById('heatmapGrid');
  const wrap     = document.getElementById('activityHeatmap');
  const monthBar = document.getElementById('heatmapMonths');
  if (!grid || !wrap) return;

  const today  = new Date();
  const MS_DAY = 86400000;
  const start  = new Date(today - 364 * MS_DAY);
  start.setDate(start.getDate() - start.getDay()); // align to Sunday

  const cells = [], months = [];
  let lastMon = -1, col = 0;
  const d = new Date(start);

  while (d <= today) {
    const key = d.toISOString().slice(0, 10);
    const cnt = data[key] || 0;
    if (d.getMonth() !== lastMon) {
      months.push({ col, label: d.toLocaleString('default', { month: 'short' }) });
      lastMon = d.getMonth();
    }
    cells.push({ key, cnt, col, row: d.getDay() });
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 0) col++;
  }

  const color = c => c === 0 ? 'var(--bg4)' : c === 1 ? '#1a6640' : c <= 3 ? '#26a65b' : c <= 6 ? '#2ecc71' : '#52d98a';
  grid.innerHTML = cells.map(c =>
    `<div title="${c.key}: ${c.cnt} submission${c.cnt !== 1 ? 's' : ''}"
      style="width:100%;padding-bottom:100%;border-radius:2px;background:${color(c.cnt)};grid-column:${c.col+1};grid-row:${c.row+1}"></div>`
  ).join('');
  if (monthBar) {
    monthBar.innerHTML = months.filter((_, i) => i % 2 === 0)
      .map(m => `<span style="font-size:9px;color:var(--text3)">${m.label}</span>`).join('');
  }
  wrap.style.display = 'block';
}

// ── Phase 1: Theme Toggle + Font Size ─────────────────────────────────────────
const THEME_KEY    = 'devlearn_theme';
const FONTSIZE_KEY = 'devlearn_fontsize';
const FONT_SIZES   = [12, 13, 14, 15, 16, 18];
let   currentFontIdx = 2;

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) document.documentElement.setAttribute('data-theme', saved);
  updateThemeBtn();
  const savedSize = localStorage.getItem(FONTSIZE_KEY);
  if (savedSize) {
    const idx = FONT_SIZES.indexOf(parseInt(savedSize));
    if (idx >= 0) { currentFontIdx = idx; applyFontSize(false); }
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const isDark  = current === 'dark' ||
    (!current && !window.matchMedia('(prefers-color-scheme: light)').matches);
  const next = isDark ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(THEME_KEY, next);
  updateThemeBtn();
  if (typeof monaco !== 'undefined') monaco.editor.setTheme(next === 'light' ? 'vs' : 'vs-dark');
}

function updateThemeBtn() {
  const btn   = document.getElementById('themeToggleBtn');
  if (!btn) return;
  const theme  = document.documentElement.getAttribute('data-theme');
  const isDark = theme === 'dark' || (!theme && !window.matchMedia('(prefers-color-scheme: light)').matches);
  btn.textContent = isDark ? '☀️' : '🌙';
  btn.title       = isDark ? 'Switch to light mode' : 'Switch to dark mode';
}

function adjustFontSize(delta) {
  currentFontIdx = Math.max(0, Math.min(FONT_SIZES.length - 1, currentFontIdx + delta));
  applyFontSize(true);
}

function applyFontSize(save) {
  const size = FONT_SIZES[currentFontIdx];
  document.documentElement.style.setProperty('--font-size-base', size + 'px');
  if (save) localStorage.setItem(FONTSIZE_KEY, String(size));
  if (typeof monacoEditor !== 'undefined' && monacoEditor) monacoEditor.updateOptions({ fontSize: size });
  if (typeof psEditor     !== 'undefined' && psEditor)     psEditor.updateOptions({ fontSize: size });
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(msg, ms = 3000) {
  const t = document.getElementById('devlearnToast');
  if (!t) return;
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), ms);
}

// ── Trace tab auto-sync ───────────────────────────────────────────────────────
const TRACE_MAP = [
  [['binary search'], 'BINARY_SEARCH'],
  [['sliding window'], 'SLIDING_WINDOW'],
  [['two pointer'], 'TWO_POINTER'],
  [['linear search'], 'LINEAR_SEARCH'],
  [['bubble sort'], 'BUBBLE_SORT'],
  [['selection sort'], 'SELECTION_SORT'],
  [['insertion sort'], 'INSERTION_SORT'],
  [['fibonacci'], 'FIBONACCI'],
  [['factorial'], 'FACTORIAL'],
  [['prefix sum'], 'PREFIX_SUM'],
  [['two sum', 'hashmap'], 'TWO_SUM_HASH'],
  [['stack'], 'STACK_OPS'],
  [['queue'], 'QUEUE_OPS'],
  [['recursion'], 'FIBONACCI'],
  [['arrays'], 'BUBBLE_SORT'],
  [['sorting'], 'INSERTION_SORT'],
];
const NO_TRACE = [
  'classes','objects','inheritance','polymorphism','abstraction','interface','encapsulation',
  'exception','generics','streams','lambda','multithreading','executor','completable',
  'jvm','design pattern','trees','graphs','dynamic programming','greedy','trie',
  'knapsack','lcs','edit distance','mysql','sql','aws',
];

function syncTraceAlgo(title) {
  if (!title) return;
  const key = title.toLowerCase();
  const sel = document.getElementById('traceAlgo');
  if (!sel) return;
  if (NO_TRACE.some(kw => key.includes(kw))) { showNoTrace(title); return; }
  let matched;
  for (const [kws, algo] of TRACE_MAP) {
    if (kws.some(kw => key.includes(kw))) { matched = algo; break; }
  }
  if (!matched) showNoTrace(title);
  else { hideNoTrace(); sel.value = matched; setTimeout(() => { if (window.Tracer) Tracer.run(); }, 100); }
}
function showNoTrace(title) {
  const tc = document.querySelector('.trace-controls');
  let msg = document.getElementById('noTraceMsg');
  if (!msg) {
    msg = document.createElement('div');
    msg.id = 'noTraceMsg';
    msg.style.cssText = 'margin:20px auto;max-width:460px;padding:22px;text-align:center;border:1px solid var(--border2);border-radius:8px;background:var(--bg2)';
    tc?.parentNode?.insertBefore(msg, tc.nextSibling);
  }
  msg.innerHTML = `<div style="font-size:24px;margin-bottom:8px">🔍</div>
    <div style="font-size:13px;font-weight:800;margin-bottom:5px">${esc(title)}</div>
    <div style="font-size:11px;color:var(--text3);margin-bottom:14px;line-height:1.6">No step tracer for this topic yet.</div>
    <button onclick="hideNoTrace();document.getElementById('traceAlgo').value='BINARY_SEARCH';Tracer.run()" style="padding:6px 14px;background:var(--adim);color:var(--accent);border:1px solid rgba(0,184,163,.3);border-radius:5px;font-family:var(--font-ui);font-size:11px;font-weight:700;cursor:pointer">▶ Try Binary Search Trace</button>`;
  msg.style.display = 'block';
  if (tc) tc.style.display = 'none';
}
function hideNoTrace() {
  const msg = document.getElementById('noTraceMsg');
  if (msg) msg.style.display = 'none';
  const tc = document.querySelector('.trace-controls');
  if (tc) tc.style.display = '';
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function esc(str) {
  return String(str ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}