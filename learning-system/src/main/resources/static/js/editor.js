/* ══════════════════════════════════════════════════════════════════════════════
   editor.js — App Controller
   Handles: sidebar loading, tab switching, Monaco editor, run/submit
══════════════════════════════════════════════════════════════════════════════ */

let monacoEditor      = null;
let practiceEditor    = null;
let currentTopic      = null;
let currentProblems   = [];
let currentProblem    = null;
let activeCategory    = 'ALL';

// ── Bootstrap ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initMonaco();
  loadTopics();
  bindCategoryTabs();
  bindTabBar();
  bindSearch();
  bindRunButton();
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
    };

    monacoEditor = monaco.editor.create(document.getElementById('monacoEditor'), {
      ...commonOptions,
      value: '// Select a topic to load starter code\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}'
    });

    practiceEditor = monaco.editor.create(document.getElementById('practiceEditor'), {
      ...commonOptions,
      value: '// Select a problem to load starter code'
    });
  });
}

// ── Load Topics into Sidebar ──────────────────────────────────────────────────
async function loadTopics(category = 'ALL') {
  const list = document.getElementById('topicList');
  list.innerHTML = '<li class="loading-item">Loading…</li>';
  try {
    const topics = await API.getTopics(category === 'ALL' ? null : category);
    renderTopicList(topics);
  } catch (e) {
    list.innerHTML = '<li class="loading-item">⚠ Could not load topics</li>';
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
  return { DSA: 'tag-dsa', JAVA: 'tag-java', ADVANCED_JAVA: 'tag-adv' }[cat] || 'tag-dsa';
}
function tagLabel(cat) {
  return { DSA: 'DSA', JAVA: 'Java', ADVANCED_JAVA: 'Adv' }[cat] || cat;
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
  badge.className   = `topic-category-badge badge-${topic.category === 'ADVANCED_JAVA' ? 'adv' : topic.category.toLowerCase()}`;

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
