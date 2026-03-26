/* ══════════════════════════════════════════════════════════════════════════════
   tracer.js  —  Step-by-step variable state viewer
   Shows: code (highlighted line) + variable table (changed vars glow)
══════════════════════════════════════════════════════════════════════════════ */

const Tracer = (() => {

  let steps       = [];
  let current     = 0;
  let autoTimer   = null;

  // Phase → accent colour
  const PHASE_COLOR = {
    INIT:       '#60a5fa',   // blue
    LOOP_CHECK: '#a78bfa',   // purple
    COMPUTE:    '#fbbf24',   // yellow
    COMPARE:    '#fb923c',   // orange
    GO_RIGHT:   '#34d399',   // teal
    GO_LEFT:    '#f472b6',   // pink
    FOUND:      '#4ade80',   // green
    NOT_FOUND:  '#f87171',   // red
  };

  function init() {
    document.getElementById('traceRunBtn') ?.addEventListener('click', run);
    document.getElementById('tracePrevBtn')?.addEventListener('click', prev);
    document.getElementById('traceNextBtn')?.addEventListener('click', next);
    document.getElementById('traceAutoBtn')?.addEventListener('click', toggleAuto);
  }

  // ── Load steps ────────────────────────────────────────────────────────────
  async function run() {
    stopAuto();
    const algo   = document.getElementById('traceAlgo')?.value || 'BINARY_SEARCH';
    const arrRaw = document.getElementById('traceArray')?.value?.trim();
    const tgtRaw = document.getElementById('traceTarget')?.value?.trim();

    const array  = arrRaw ? arrRaw.split(/[\s,]+/).map(Number).filter(n => !isNaN(n)) : [];
    const target = tgtRaw ? parseInt(tgtRaw) : undefined;

    setStatus('Loading…');
    try {
      steps   = await API.trace(algo, array, target);
      current = 0;
      render();
      updateButtons();
    } catch(e) {
      setStatus('⚠ ' + e.message + '. Is the server running?');
    }
  }

  function prev() { if (current > 0) { current--; render(); updateButtons(); } }
  function next() { if (current < steps.length - 1) { current++; render(); updateButtons(); } }

  function toggleAuto() {
    if (autoTimer) { stopAuto(); return; }
    document.getElementById('traceAutoBtn').textContent = '⏸ Pause';
    autoTimer = setInterval(() => {
      if (current < steps.length - 1) { next(); }
      else stopAuto();
    }, 1000);
  }

  function stopAuto() {
    clearInterval(autoTimer); autoTimer = null;
    const b = document.getElementById('traceAutoBtn');
    if (b) b.textContent = '⏵ Auto';
  }

  function updateButtons() {
    const p = document.getElementById('tracePrevBtn');
    const n = document.getElementById('traceNextBtn');
    const a = document.getElementById('traceAutoBtn');
    if (p) p.disabled = current === 0;
    if (n) n.disabled = current === steps.length - 1;
    if (a) a.disabled = steps.length === 0;
    const ctr = document.getElementById('traceCounter');
    if (ctr) ctr.textContent = steps.length ? `Step ${current + 1} / ${steps.length}` : '';
  }

  // ── Render ────────────────────────────────────────────────────────────────
  function render() {
    if (!steps.length) return;
    const step = steps[current];
    renderCode(step);
    renderVars(step);
    renderDesc(step);
  }

  function renderCode(step) {
    const el = document.getElementById('traceCodePanel');
    if (!el) return;
    const lines = step.codeLines || [];
    el.innerHTML = lines.map((line, i) => {
      const isActive = i === step.highlightLine;
      const color    = isActive ? (PHASE_COLOR[step.phase] || '#4ade80') : '';
      return `<div class="trace-line ${isActive ? 'trace-line-active' : ''}"
                   style="${isActive ? `border-left-color:${color};background:${color}1a` : ''}">
                <span class="trace-ln">${String(i + 1).padStart(2, ' ')}</span>
                <span class="trace-code-text" style="${isActive ? `color:${color}` : ''}">${escHtml(line)}</span>
              </div>`;
    }).join('');

    // Scroll active line into view
    requestAnimationFrame(() => {
      const active = el.querySelector('.trace-line-active');
      active?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }

  function renderVars(step) {
    const el = document.getElementById('traceVarsPanel');
    if (!el) return;
    const vars    = step.variables || {};
    const changed = new Set(step.changedVars || []);
    const phase   = step.phase || '';
    const color   = PHASE_COLOR[phase] || '#4ade80';

    if (!Object.keys(vars).length) {
      el.innerHTML = '<p class="trace-vars-empty">No variables yet</p>';
      return;
    }

    el.innerHTML = `
      <div class="trace-vars-grid">
        ${Object.entries(vars).map(([k, v]) => {
          const hot = changed.has(k);
          return `
            <div class="trace-var-row ${hot ? 'trace-var-changed' : ''}"
                 style="${hot ? `border-color:${color};box-shadow:0 0 8px ${color}40` : ''}">
              <span class="trace-var-name">${escHtml(k)}</span>
              <span class="trace-var-eq">=</span>
              <span class="trace-var-value" style="${hot ? `color:${color}` : ''}">${escHtml(v)}</span>
              ${hot ? `<span class="trace-var-badge" style="background:${color}22;color:${color}">changed</span>` : ''}
            </div>`;
        }).join('')}
      </div>
    `;
  }

  function renderDesc(step) {
    const el    = document.getElementById('traceDescPanel');
    if (!el) return;
    const color = PHASE_COLOR[step.phase] || '#4ade80';
    el.style.borderLeftColor = color;
    el.innerHTML = `
      <span class="trace-phase-badge" style="background:${color}22;color:${color}">${step.phase}</span>
      <span class="trace-desc-text">${escHtml(step.description || '')}</span>
    `;
  }

  function setStatus(msg) {
    const el = document.getElementById('traceDescPanel');
    if (el) el.innerHTML = `<span class="trace-desc-text" style="color:var(--text2)">${msg}</span>`;
  }

  function escHtml(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  return { init, run };
})();

document.addEventListener('DOMContentLoaded', () => Tracer.init());
