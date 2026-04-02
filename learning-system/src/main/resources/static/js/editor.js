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
  bindCategoryTabs();
  bindTabBar();
  bindSearch();
  bindOutTabs();
  // Run button bound once inside initMonaco callback
  // PS buttons bound after monaco loaded

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

    const COMMON = {
      language: 'java', theme: 'vs-dark', fontSize: 13,
      fontFamily: "'JetBrains Mono', monospace",
      minimap: { enabled: false }, scrollBeyondLastLine: false,
      lineNumbers: 'on', renderLineHighlight: 'line',
      automaticLayout: true, padding: { top: 10 }, glyphMargin: true,
      // ── IDE-quality settings ──────────────────────────────────────────────
      quickSuggestions: { other: false, comments: false, strings: false },
      wordBasedSuggestions: 'off',
      suggestOnTriggerCharacters: true,   // keep '.' and '@' triggers
      acceptSuggestionOnCommitCharacter: false,
      parameterHints: { enabled: true },
      hover: { enabled: true },           // show type-on-hover
      formatOnPaste: true,
      formatOnType:  false,               // don't auto-format mid-type (annoying)
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

    // Bind run button ONCE here (after monaco ready)
    document.getElementById('runBtn')?.addEventListener('click', runCode);
    document.getElementById('resetBtn')?.addEventListener('click', resetEditor);

    // PS buttons
    document.getElementById('psRunBtn')?.addEventListener('click', psRunCode);
    document.getElementById('psSubmitBtn')?.addEventListener('click', psSubmit);
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
  const m = { DSA:'tag-dsa', JAVA:'tag-java', ADVANCED_JAVA:'tag-adv', MYSQL:'tag-mysql', AWS:'tag-aws' };
  return m[cat] || 'tag-dsa';
}
function tagLbl(cat) {
  const m = { DSA:'DSA', JAVA:'Java', ADVANCED_JAVA:'Adv', MYSQL:'SQL', AWS:'AWS' };
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
    if (r.allPassed) setTimeout(showRecallDrill, 700);
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
function saveRecall() {
  const modal = document.getElementById('recallModal');
  if (modal) modal.style.display = 'none';
  showToast('🧠 Recall saved — great practice!');
}
function skipRecall() {
  const modal = document.getElementById('recallModal');
  if (modal) modal.style.display = 'none';
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