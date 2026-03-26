/* ══════════════════════════════════════════════════════════════════════════════
   editor.js — App Controller
   Handles: sidebar, tabs, Monaco + real-time syntax check, LeetCode-style output
══════════════════════════════════════════════════════════════════════════════ */

let monacoEditor        = null;
let practiceEditor      = null;
let currentTopic        = null;
let currentProblems     = [];
let currentProblem      = null;
let activeCategory      = 'ALL';
let syntaxDebounceTimer = null;

// ── Bootstrap ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initMonaco();
  loadTopics().then(() => {
    // Deep-link: /?topic=123
    const params  = new URLSearchParams(window.location.search);
    const topicId = params.get('topic');
    if (topicId) {
      const waitForMonaco = setInterval(() => {
        if (monacoEditor) {
          clearInterval(waitForMonaco);
          selectTopic(parseInt(topicId));
        }
      }, 150);
    }
  });
  bindCategoryTabs();
  bindTabBar();
  bindSearch();
  bindRunButton();
  bindOutputTabs();
  bindPracticeButtons();
});

// ── Monaco Setup ──────────────────────────────────────────────────────────────
function initMonaco() {
  require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' } });
  require(['vs/editor/editor.main'], () => {

    const commonOptions = {
      language: 'java',
      theme: 'vs-dark',
      fontSize: 13,
      fontFamily: "'JetBrains Mono', monospace",
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      lineNumbers: 'on',
      renderLineHighlight: 'line',
      automaticLayout: true,
      padding: { top: 10 },
      glyphMargin: true,
      folding: true,
    };

    monacoEditor = monaco.editor.create(document.getElementById('monacoEditor'), {
      ...commonOptions,
      value: '// Select a topic to load starter code\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}'
    });

    practiceEditor = monaco.editor.create(document.getElementById('practiceEditor'), {
      ...commonOptions,
      value: '// Select a problem to load starter code'
    });

    // Real-time syntax check — fires 800ms after user stops typing
    monacoEditor.onDidChangeModelContent(() => {
      clearTimeout(syntaxDebounceTimer);
      setStatusBar('checking');
      syntaxDebounceTimer = setTimeout(() => runSyntaxCheck(monacoEditor, 'main'), 800);
    });

    practiceEditor.onDidChangeModelContent(() => {
      clearTimeout(syntaxDebounceTimer);
      syntaxDebounceTimer = setTimeout(() => runSyntaxCheck(practiceEditor, 'practice'), 800);
    });
  });
}

// ── Real-time Syntax Check ────────────────────────────────────────────────────
async function runSyntaxCheck(editor, context) {
  if (!editor) return;
  const code = editor.getValue();
  if (!code.trim()) { clearMarkers(editor); setStatusBar('ok', 0, 0); return; }
  try {
    const result = await API.syntaxCheck(code, getJavaVersion());
    applyMarkers(editor, result.errors || []);
    if (context === 'main') {
      setStatusBar(result.valid ? 'ok' : 'errors', result.errorCount, result.warningCount);
      renderErrorPanel(result.errors || []);
    }
  } catch (e) { /* silent — server may not be running during dev */ }
}

function applyMarkers(editor, errors) {
  if (!window.monaco || !editor?.getModel()) return;
  const model = editor.getModel();
  const markers = errors.map(err => ({
    severity:        err.severity === 'error' ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning,
    startLineNumber: err.line,
    startColumn:     err.column || 1,
    endLineNumber:   err.line,
    endColumn:       err.column ? err.column + 15 : model.getLineMaxColumn(err.line),
    message:         err.message,
    source:          'javac',
  }));
  monaco.editor.setModelMarkers(model, 'javac', markers);
}

function clearMarkers(editor) {
  if (!window.monaco || !editor?.getModel()) return;
  monaco.editor.setModelMarkers(editor.getModel(), 'javac', []);
}

// ── Status Bar ────────────────────────────────────────────────────────────────
function setStatusBar(state, errors = 0, warnings = 0) {
  const el = document.getElementById('statusErrors');
  if (!el) return;
  if (state === 'checking') {
    el.innerHTML = '<span style="color:var(--text3)">⟳ Checking syntax…</span>';
  } else if (state === 'ok') {
    el.innerHTML = '<span style="color:var(--accent)">✓ No errors</span>';
  } else {
    const parts = [];
    if (errors)   parts.push(`<span style="color:var(--red)">✕ ${errors} error${errors>1?'s':''}</span>`);
    if (warnings) parts.push(`<span style="color:var(--yellow)">⚠ ${warnings} warning${warnings>1?'s':''}</span>`);
    el.innerHTML = parts.join('&nbsp;&nbsp;');
  }
  const badge = document.getElementById('errBadge');
  if (badge) {
    badge.textContent = errors;
    badge.classList.toggle('hidden', errors === 0);
  }
}

// ── Error Panel ───────────────────────────────────────────────────────────────
function renderErrorPanel(errors) {
  const el = document.getElementById('errorsList');
  if (!el) return;
  if (!errors.length) {
    el.innerHTML = '<p class="no-errors-msg">✓ No compile errors</p>';
    return;
  }
  el.innerHTML = errors.map(err => `
    <div class="error-card ${err.severity}" onclick="jumpToLine(${err.line})">
      <div class="error-card-top">
        <span class="error-icon">${err.severity === 'error' ? '✕' : '⚠'}</span>
        <span class="error-msg">${escHtml(err.message)}</span>
        <span class="error-line-badge">Line ${err.line}${err.column > 1 ? ':' + err.column : ''}</span>
      </div>
      ${err.code ? `<pre class="error-source-line">${escHtml(err.code)}<br>${' '.repeat(Math.max(0,(err.column||1)-1))}<span class="error-caret">^</span></pre>` : ''}
    </div>
  `).join('');
}

function jumpToLine(line) {
  if (!monacoEditor) return;
  monacoEditor.revealLineInCenter(line);
  monacoEditor.setPosition({ lineNumber: line, column: 1 });
  monacoEditor.focus();
  switchOutputTab('errors');
}

// ── Output Tab Switcher ───────────────────────────────────────────────────────
function bindOutputTabs() {
  document.querySelectorAll('.lc-out-tab').forEach(btn => {
    btn.addEventListener('click', () => switchOutputTab(btn.dataset.out));
  });
}

function switchOutputTab(name) {
  document.querySelectorAll('.lc-out-tab').forEach(b =>
      b.classList.toggle('active', b.dataset.out === name));
  document.querySelectorAll('.lc-out-panel').forEach(p =>
      p.classList.toggle('hidden', p.id !== `out-${name}`));
}

// ── Java Version Selector helper ─────────────────────────────────────────────
function getJavaVersion() {
  return document.getElementById('javaVersionSelect')?.value || '17';
}

// ── Run Button ────────────────────────────────────────────────────────────────
function bindRunButton() {
  document.getElementById('runBtn')?.addEventListener('click', async () => {
    if (!monacoEditor) return;
    const code    = monacoEditor.getValue();
    const stdin   = document.getElementById('stdinInput')?.value || '';
    const version = getJavaVersion();

    switchOutputTab('output');
    const box       = document.getElementById('outputBox');
    const statusRow = document.getElementById('outStatusRow');
    if (box)       { box.textContent = '⏳ Compiling with Java ' + version + '…'; box.className = 'lc-output-box'; }
    if (statusRow) statusRow.innerHTML = '';
    document.getElementById('execTime').textContent = '';

    try {
      const result = await API.execute(code, stdin, version);
      renderRunResult(result);
      // Auto-analyze complexity after every run (success or runtime error)
      if (result.status !== 'COMPILE_ERROR') {
        analyzeAndRenderComplexity(code);
      }
    } catch (e) {
      if (box) { box.textContent = '⚠ Server unreachable — is the backend running?'; box.className = 'lc-output-box error'; }
    }
  });

  document.getElementById('resetBtn')?.addEventListener('click', () => {
    if (monacoEditor && currentTopic?.starterCode) {
      monacoEditor.setValue(currentTopic.starterCode.trim());
    }
    const box = document.getElementById('outputBox');
    if (box) { box.textContent = '// Press ▶ Run Code to see output here'; box.className = 'lc-output-box'; }
    const sr = document.getElementById('outStatusRow');
    if (sr) sr.innerHTML = '';
    document.getElementById('execTime').textContent = '';
    // Clear complexity panel on reset
    const cp = document.getElementById('complexityPanel');
    if (cp) cp.innerHTML = '<p class="complexity-hint">Run your code to analyze complexity.</p>';
  });
}

// ── Complexity Analysis ───────────────────────────────────────────────────────
async function analyzeAndRenderComplexity(code) {
  const panel = document.getElementById('complexityPanel');
  if (!panel) return;
  panel.innerHTML = '<p class="complexity-hint">⏳ Analyzing complexity…</p>';

  try {
    const r = await API.analyzeComplexity(code);
    const confColor = { HIGH: 'var(--accent)', MEDIUM: 'var(--yellow)', LOW: 'var(--text3)' }[r.confidence] || 'var(--text3)';
    const patternTags = (r.detectedPatterns || []).map(p =>
        `<span class="complexity-tag">${escHtml(p)}</span>`).join('');

    panel.innerHTML = `
      <div class="complexity-cards">

        <div class="cx-card cx-time">
          <div class="cx-label">⏱ Time Complexity</div>
          <div class="cx-notation">${escHtml(r.timeComplexity || 'O(?)')}</div>
          <div class="cx-explanation">${escHtml(r.timeExplanation || '')}</div>
        </div>

        <div class="cx-card cx-space">
          <div class="cx-label">💾 Space Complexity</div>
          <div class="cx-notation cx-space-val">${escHtml(r.spaceComplexity || 'O(?)')}</div>
          <div class="cx-explanation">${escHtml(r.spaceExplanation || '')}</div>
        </div>

      </div>

      ${patternTags ? `
      <div class="cx-patterns">
        <span class="cx-patterns-label">Detected patterns:</span>
        ${patternTags}
      </div>` : ''}

      <div class="cx-confidence" style="color:${confColor}">
        Confidence: ${r.confidence || 'LOW'}
        <span class="cx-note"> — based on static code structure</span>
      </div>
    `;
  } catch(e) {
    panel.innerHTML = '<p class="complexity-hint">⚠ Could not analyze complexity.</p>';
  }
}

function renderRunResult(result) {
  const box       = document.getElementById('outputBox');
  const statusRow = document.getElementById('outStatusRow');
  const timeEl    = document.getElementById('execTime');
  if (!box) return;

  if (result.status === 'COMPILE_ERROR') {
    applyMarkers(monacoEditor, result.compileErrors || []);
    renderErrorPanel(result.compileErrors || []);
    const ec = (result.compileErrors||[]).filter(e=>e.severity==='error').length;
    const wc = (result.compileErrors||[]).filter(e=>e.severity==='warning').length;
    setStatusBar('errors', ec, wc);
    box.textContent = result.error || 'Compilation failed';
    box.className   = 'lc-output-box error';
    if (statusRow) statusRow.innerHTML = statusBadge('COMPILE_ERROR');
    switchOutputTab('errors');
    return;
  }

  if (result.status === 'TIMEOUT') {
    box.textContent = result.error;
    box.className   = 'lc-output-box error';
    if (statusRow) statusRow.innerHTML = statusBadge('TIMEOUT');
  } else if (result.status === 'RUNTIME_ERROR') {
    box.textContent = result.error || 'Runtime error';
    box.className   = 'lc-output-box error';
    if (statusRow) statusRow.innerHTML = statusBadge('RUNTIME_ERROR');
  } else {
    box.textContent = result.output || '(no output)';
    box.className   = 'lc-output-box success';
    if (statusRow) statusRow.innerHTML = statusBadge('SUCCESS');
  }
  if (timeEl && result.executionTimeMs) {
    timeEl.textContent = `⏱ ${result.executionTimeMs}ms`;
  }
}

function statusBadge(status) {
  const map = {
    SUCCESS:       ['var(--accent)',  '✓ Accepted'],
    COMPILE_ERROR: ['var(--red)',     '✕ Compile Error'],
    RUNTIME_ERROR: ['var(--red)',     '✕ Runtime Error'],
    TIMEOUT:       ['var(--yellow)',  '⏱ Time Limit Exceeded'],
  };
  const [color, label] = map[status] || ['var(--text2)', status];
  return `<span class="out-status-badge" style="color:${color};border-color:${color}20;background:${color}12">${label}</span>`;
}

// ── Load Topics into Sidebar ──────────────────────────────────────────────────
async function loadTopics(category = 'ALL') {
  const list = document.getElementById('topicList');
  list.innerHTML = '<li class="loading-item">Loading…</li>';
  try {
    const topics = await API.getTopics(category === 'ALL' ? null : category);
    renderTopicList(topics);
    return topics;
  } catch (e) {
    list.innerHTML = '<li class="loading-item">⚠ Could not load topics</li>';
    return [];
  }
}

function renderTopicList(topics) {
  const list = document.getElementById('topicList');
  if (!topics.length) {
    list.innerHTML = '<li class="loading-item">No topics found.</li>';
    return;
  }
  list.innerHTML = topics.map(t => `
    <li class="topic-item" data-id="${t.id}" onclick="selectTopic(${t.id})">
      <span class="item-name">${t.title}</span>
      <span class="item-tag ${tagClass(t.category)}">${tagLabel(t.category)}</span>
    </li>
  `).join('');
}

function tagClass(cat) {
  const m = { DSA:'tag-dsa', JAVA:'tag-java', ADVANCED_JAVA:'tag-adv', MYSQL:'tag-mysql', AWS:'tag-aws' };
  return m[cat] || 'tag-dsa';
}
function tagLabel(cat) {
  const m = { DSA:'DSA', JAVA:'Java', ADVANCED_JAVA:'Adv', MYSQL:'MySQL', AWS:'AWS' };
  return m[cat] || cat;
}

// ── Select Topic ──────────────────────────────────────────────────────────────
async function selectTopic(id) {
  // Highlight sidebar item
  document.querySelectorAll('.topic-item').forEach(el => {
    el.classList.toggle('active', el.dataset.id == id);
  });

  try {
    currentTopic = await API.getTopic(id);
    showTopicView(currentTopic);
    // Activate visual tab by default
    switchTab('visual');
  } catch (e) {
    console.error('Failed to load topic', e);
  }
}

function showTopicView(topic) {
  document.getElementById('welcomeScreen').style.display = 'none';
  document.getElementById('topicView').style.display     = 'block';

  document.getElementById('topicTitle').textContent = topic.title;
  document.getElementById('topicDesc').textContent  = topic.description || '';

  const badge = document.getElementById('topicCategoryBadge');
  badge.textContent = tagLabel(topic.category);
  const catSuffix = topic.category === 'ADVANCED_JAVA' ? 'adv'
      : topic.category === 'MYSQL' ? 'mysql'
          : topic.category === 'AWS'   ? 'aws'
              : topic.category.toLowerCase();
  badge.className = `topic-category-badge badge-${catSuffix}`;

  const complexity = document.getElementById('topicComplexity');
  complexity.textContent = topic.timeComplexity ? `⏱ ${topic.timeComplexity}  |  💾 ${topic.spaceComplexity}` : '';

  // Load starter code into editor
  if (monacoEditor && topic.starterCode) {
    monacoEditor.setValue(topic.starterCode.trim());
  }
}

// ── Tab Switching ─────────────────────────────────────────────────────────────
function bindTabBar() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
}

function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab-panel').forEach(p => {
    p.classList.toggle('hidden', p.id !== `tab-${tab}`);
  });

  if (tab === 'examples')  loadExamples();
  if (tab === 'practice')  loadProblems();
  if (tab === 'optimize')  loadOptimize();
  if (tab === 'flowchart') Flowchart.render(currentTopic?.title);
  if (tab === 'trace')     syncTraceAlgo(currentTopic?.title);
}

// ── Category Tabs ─────────────────────────────────────────────────────────────
function bindCategoryTabs() {
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.cat;
      loadTopics(activeCategory);
    });
  });
}

// ── Search ────────────────────────────────────────────────────────────────────
function bindSearch() {
  document.getElementById('topicSearch')?.addEventListener('input', async (e) => {
    const q = e.target.value.trim().toLowerCase();
    if (!q) { loadTopics(activeCategory); return; }
    try {
      const all = await API.getTopics(activeCategory === 'ALL' ? null : activeCategory);
      renderTopicList(all.filter(t => t.title.toLowerCase().includes(q)));
    } catch {}
  });
}

// ── Load Examples ─────────────────────────────────────────────────────────────
async function loadExamples() {
  if (!currentTopic) return;
  const grid = document.getElementById('examplesGrid');
  grid.innerHTML = '<p class="loading-text">Loading…</p>';
  try {
    const examples = await API.getExamples(currentTopic.id);
    grid.innerHTML = examples.map((ex, i) => `
      <div class="example-card">
        <div class="example-card-header" onclick="toggleExample(${i})">
          <div>
            <span class="example-num">EXAMPLE ${ex.displayOrder || i + 1}</span>
            <div class="example-title">${ex.title}</div>
          </div>
          <span class="example-toggle" id="toggle-${i}">▼</span>
        </div>
        <div class="example-body" id="example-body-${i}">
          <p class="example-desc">${ex.description || ''}</p>
          <pre class="example-code-block">${escHtml(ex.code || '')}</pre>
          <div class="example-meta">
            <span><strong>💡 Insight:</strong> ${ex.explanation || ''}</span>
            <span class="real-world-tag">🌍 ${ex.realWorldUse || ''}</span>
          </div>
        </div>
      </div>
    `).join('');
    // Open first example by default
    if (examples.length) toggleExample(0);
  } catch (e) {
    grid.innerHTML = '<p class="loading-text">⚠ Could not load examples</p>';
  }
}

function toggleExample(i) {
  const body   = document.getElementById(`example-body-${i}`);
  const toggle = document.getElementById(`toggle-${i}`);
  if (!body) return;
  const open = body.classList.toggle('open');
  if (toggle) toggle.classList.toggle('open', open);
}

// ── Load Problems ─────────────────────────────────────────────────────────────
async function loadProblems() {
  if (!currentTopic) return;
  const list = document.getElementById('problemList');
  list.innerHTML = '';
  try {
    currentProblems = await API.getProblems(currentTopic.id);
    list.innerHTML = currentProblems.map(p => `
      <li class="problem-item" data-pid="${p.id}" onclick="selectProblem(${p.id})">
        <div class="problem-item-title">${p.title}</div>
        <span class="diff-badge diff-${p.difficulty?.toLowerCase()}">${p.difficulty}</span>
      </li>
    `).join('');
  } catch {}
}

async function selectProblem(pid) {
  document.querySelectorAll('.problem-item').forEach(el => {
    el.classList.toggle('active', el.dataset.pid == pid);
  });
  try {
    currentProblem = await API.getProblem(pid);
    renderProblemStatement(currentProblem);
    if (practiceEditor && currentProblem.starterCode) {
      practiceEditor.setValue(currentProblem.starterCode.trim());
    }
    document.getElementById('practiceResults').classList.add('hidden');
  } catch {}
}

function renderProblemStatement(p) {
  const el = document.getElementById('problemStatement');
  el.innerHTML = `
    <div class="problem-statement">
      <h3>${p.title} <span class="diff-badge diff-${p.difficulty?.toLowerCase()}">${p.difficulty}</span></h3>
      <p>${p.description || ''}</p>
      <div class="problem-io">
        <div class="io-box">
          <h4>Sample Input</h4>
          <pre>${escHtml(p.sampleInput || '')}</pre>
        </div>
        <div class="io-box">
          <h4>Sample Output</h4>
          <pre>${escHtml(p.sampleOutput || '')}</pre>
        </div>
      </div>
      ${p.inputFormat ? `<p style="font-size:12px;color:var(--text2);margin-top:8px">📥 <strong>Input:</strong> ${p.inputFormat}</p>` : ''}
      ${p.outputFormat ? `<p style="font-size:12px;color:var(--text2)">📤 <strong>Output:</strong> ${p.outputFormat}</p>` : ''}
    </div>
  `;
}

// ── Load Optimize Tab ─────────────────────────────────────────────────────────
function loadOptimize() {
  if (!currentTopic) return;
  setOptContent('optBruteContent',     currentTopic.bruteForce      || 'N/A');
  setOptContent('optOptimizedContent', currentTopic.optimizedApproach || 'N/A');
  setOptContent('optWhenContent',      currentTopic.whenToUse        || 'N/A');
  setOptContent('optComplexityContent',
      `<strong style="color:var(--accent)">Time:</strong> ${currentTopic.timeComplexity || 'N/A'}<br>
     <strong style="color:var(--blue)">Space:</strong> ${currentTopic.spaceComplexity || 'N/A'}`);
}

function setOptContent(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = `<div class="opt-content">${html}</div>`;
}

// ── Run Button (Code Tab) ─────────────────────────────────────────────────────
function bindRunButton() {
  document.getElementById('runBtn')?.addEventListener('click', async () => {
    if (!monacoEditor) return;
    const code  = monacoEditor.getValue();
    const stdin = document.getElementById('stdinInput')?.value || '';
    const box   = document.getElementById('outputBox');
    const time  = document.getElementById('execTime');

    box.textContent = '⏳ Running…';
    box.className   = 'output-box';

    try {
      const result = await API.execute(code, stdin);
      if (result.success) {
        box.textContent = result.output || '(no output)';
        box.className   = 'output-box success';
      } else {
        box.textContent = result.error || 'Unknown error';
        box.className   = 'output-box error';
      }
      if (time) time.textContent = result.executionTimeMs ? `${result.executionTimeMs}ms` : '';
    } catch (e) {
      box.textContent = '⚠ Server unreachable. Is the backend running?';
      box.className   = 'output-box error';
    }
  });

  document.getElementById('resetBtn')?.addEventListener('click', () => {
    if (monacoEditor && currentTopic?.starterCode) {
      monacoEditor.setValue(currentTopic.starterCode.trim());
    }
    const box = document.getElementById('outputBox');
    if (box) { box.textContent = '// Press Run to execute your code'; box.className = 'output-box'; }
  });
}

// ── Practice Buttons ──────────────────────────────────────────────────────────
function bindPracticeButtons() {
  // Run (just execute)
  document.getElementById('practiceRunBtn')?.addEventListener('click', async () => {
    if (!practiceEditor || !currentProblem) return;
    const code  = practiceEditor.getValue();
    const stdin = currentProblem.sampleInput || '';
    showPracticeResult(null, true); // loading

    try {
      const result = await API.execute(code, stdin);
      showRunResult(result);
    } catch {}
  });

  // Submit (evaluate all test cases)
  document.getElementById('practiceSubmitBtn')?.addEventListener('click', async () => {
    if (!practiceEditor || !currentProblem) return;
    const code = practiceEditor.getValue();
    showPracticeResult(null, true);

    try {
      const result = await API.submit(currentProblem.id, code);
      showPracticeResult(result, false);
    } catch {}
  });
}

function showRunResult(execResult) {
  const panel = document.getElementById('practiceResults');
  panel.classList.remove('hidden');
  if (execResult.success) {
    panel.innerHTML = `
      <div class="results-header pass">
        <span class="results-summary">▶ Output</span>
      </div>
      <pre style="padding:12px 16px;font-family:var(--font-code);font-size:12px;color:var(--accent)">${escHtml(execResult.output || '(no output)')}</pre>
    `;
  } else {
    panel.innerHTML = `
      <div class="results-header fail">
        <span class="results-summary">⚠ ${execResult.status}</span>
      </div>
      <pre style="padding:12px 16px;font-family:var(--font-code);font-size:12px;color:var(--red)">${escHtml(execResult.error || '')}</pre>
    `;
  }
}

function showPracticeResult(result, loading) {
  const panel = document.getElementById('practiceResults');
  panel.classList.remove('hidden');
  if (loading) {
    panel.innerHTML = `<div class="results-header"><span class="results-summary">⏳ Evaluating…</span></div>`;
    return;
  }

  const pass = result.allPassed;
  panel.innerHTML = `
    <div class="results-header ${pass ? 'pass' : 'fail'}">
      <span class="results-summary">${pass ? '✅ All Tests Passed!' : '❌ Some Tests Failed'}</span>
      <span class="results-count">${result.passedTests} / ${result.totalTests} passed</span>
    </div>
    ${result.hint ? `<div class="hint-box"><strong>💡 Hint</strong>${escHtml(result.hint)}</div>` : ''}
    ${(result.results || []).map(tc => `
      <div class="test-case-row">
        <span class="tc-status ${tc.passed ? 'tc-pass' : 'tc-fail'}">${tc.passed ? 'PASS' : 'FAIL'}</span>
        <span class="tc-details">
          Test ${tc.testNumber}
          ${tc.passed ? '' : ` | Expected: <span style="color:var(--accent)">${escHtml(tc.expected)}</span> Got: <span style="color:var(--red)">${escHtml(tc.actual || '')}</span>`}
        </span>
        <span style="color:var(--text3);font-size:11px">${tc.executionTimeMs}ms</span>
      </div>
    `).join('')}
  `;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Trace tab: auto-select algorithm dropdown based on topic title ─────────────
function syncTraceAlgo(title) {
  if (!title) return;
  const key = title.toLowerCase();
  const sel = document.getElementById('traceAlgo');
  if (!sel) return;
  if (key.includes('binary'))   sel.value = 'BINARY_SEARCH';
  else if (key.includes('sliding') || key.includes('window')) sel.value = 'SLIDING_WINDOW';
  else if (key.includes('two') || key.includes('pointer'))    sel.value = 'TWO_POINTER';
}