/* ══════════════════════════════════════════════════════════════════════════════
   visualizer.js — Binary Search Canvas Animator
══════════════════════════════════════════════════════════════════════════════ */

const Visualizer = (() => {
  // ── State ──────────────────────────────────────────────────────────────────
  let steps        = [];
  let currentStep  = 0;
  let autoTimer    = null;
  let canvas, ctx;

  // ── Colours (match CSS variables) ─────────────────────────────────────────
  const C = {
    bg:       '#13161b',
    bgElem:   '#1a1e25',
    border:   '#252930',
    text:     '#e2e8f0',
    text2:    '#8892a4',
    accent:   '#4ade80',
    yellow:   '#fbbf24',
    blue:     '#60a5fa',
    red:      '#f87171',
    purple:   '#a78bfa',
    low:      '#60a5fa',
    high:     '#f87171',
    mid:      '#fbbf24',
    found:    '#4ade80',
  };

  // ── Init ───────────────────────────────────────────────────────────────────
  function init() {
    canvas = document.getElementById('vizCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    document.getElementById('vizRunBtn')?.addEventListener('click', run);
    document.getElementById('vizPrevBtn')?.addEventListener('click', prev);
    document.getElementById('vizNextBtn')?.addEventListener('click', next);
    document.getElementById('vizAutoBtn')?.addEventListener('click', toggleAuto);
  }

  function resizeCanvas() {
    const container = canvas?.parentElement;
    if (!container) return;
    canvas.width  = container.clientWidth - 40;
    canvas.height = 220;
    if (steps.length) drawStep(steps[currentStep]);
  }

  // ── Load steps from backend ────────────────────────────────────────────────
  async function run() {
    stopAuto();
    const arrayInput  = document.getElementById('vizArray')?.value?.trim();
    const targetInput = document.getElementById('vizTarget')?.value?.trim();

    let array  = [];
    let target = undefined;

    if (arrayInput) {
      array = arrayInput.split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
    }
    if (targetInput) {
      target = parseInt(targetInput, 10);
    }

    try {
      steps = await API.visualize('BINARY_SEARCH', array, target);
      currentStep = 0;
      updateButtons();
      drawStep(steps[0]);
      updateStepCounter();
    } catch (e) {
      drawError('Failed to load visualization. Is the server running?');
    }
  }

  // ── Navigation ─────────────────────────────────────────────────────────────
  function prev() {
    if (currentStep > 0) {
      currentStep--;
      drawStep(steps[currentStep]);
      updateButtons();
      updateStepCounter();
    }
  }

  function next() {
    if (currentStep < steps.length - 1) {
      currentStep++;
      drawStep(steps[currentStep]);
      updateButtons();
      updateStepCounter();
    }
  }

  function toggleAuto() {
    if (autoTimer) {
      stopAuto();
    } else {
      const btn = document.getElementById('vizAutoBtn');
      if (btn) btn.textContent = '⏸ Pause';
      autoTimer = setInterval(() => {
        if (currentStep < steps.length - 1) {
          next();
        } else {
          stopAuto();
        }
      }, 900);
    }
  }

  function stopAuto() {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
    const btn = document.getElementById('vizAutoBtn');
    if (btn) btn.textContent = '⏵ Auto';
  }

  function updateButtons() {
    const prev = document.getElementById('vizPrevBtn');
    const next = document.getElementById('vizNextBtn');
    const auto = document.getElementById('vizAutoBtn');
    if (prev) prev.disabled = currentStep === 0;
    if (next) next.disabled = currentStep === steps.length - 1;
    if (auto) auto.disabled = steps.length === 0;
  }

  function updateStepCounter() {
    const el = document.getElementById('stepCounter');
    if (el) el.textContent = `Step ${currentStep + 1} / ${steps.length}`;
    const desc = document.getElementById('stepDescription');
    if (desc && steps[currentStep]) {
      desc.textContent = steps[currentStep].description;
    }
  }

  // ── Drawing ────────────────────────────────────────────────────────────────
  function drawStep(step) {
    if (!ctx || !step) return;

    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    const arr    = step.array;
    const n      = arr.length;
    const cellW  = Math.min(64, Math.floor((W - 40) / n));
    const cellH  = 52;
    const startX = Math.floor((W - n * cellW) / 2);
    const startY = 80;

    // ── Draw pointer labels above ──────────────────────────────────────────
    const pointers = [];
    if (step.low  >= 0) pointers.push({ idx: step.low,  label: 'L', color: C.low });
    if (step.high >= 0) pointers.push({ idx: step.high, label: 'H', color: C.high });
    if (step.mid  >= 0 && step.action !== 'INIT') pointers.push({ idx: step.mid, label: 'M', color: C.mid });

    // Draw pointer arrows
    pointers.forEach(p => {
      const cx = startX + p.idx * cellW + cellW / 2;
      ctx.fillStyle = p.color;
      ctx.font = 'bold 12px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(p.label, cx, startY - 28);

      // Arrow
      ctx.beginPath();
      ctx.moveTo(cx, startY - 18);
      ctx.lineTo(cx, startY - 6);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.stroke();
      // Arrowhead
      ctx.beginPath();
      ctx.moveTo(cx - 5, startY - 10);
      ctx.lineTo(cx, startY - 4);
      ctx.lineTo(cx + 5, startY - 10);
      ctx.fillStyle = p.color;
      ctx.fill();
    });

    // ── Draw array cells ───────────────────────────────────────────────────
    for (let i = 0; i < n; i++) {
      const x = startX + i * cellW;
      const y = startY;

      let bgColor   = C.bgElem;
      let textColor = C.text;
      let borderCol = C.border;

      if (step.action === 'FOUND' && i === step.foundIndex) {
        bgColor   = 'rgba(74,222,128,.25)';
        borderCol = C.found;
        textColor = C.found;
      } else if (i === step.mid && step.action !== 'INIT') {
        bgColor   = 'rgba(251,191,36,.15)';
        borderCol = C.mid;
        textColor = C.mid;
      } else if (i < step.low || i > step.high) {
        bgColor   = 'rgba(13,15,18,.6)';
        textColor = C.text2;
        borderCol = C.border;
      } else if (i === step.low) {
        borderCol = C.low;
      } else if (i === step.high) {
        borderCol = C.high;
      }

      // Cell background
      ctx.fillStyle = bgColor;
      roundRect(ctx, x + 2, y, cellW - 4, cellH, 6);
      ctx.fill();

      // Cell border
      ctx.strokeStyle = borderCol;
      ctx.lineWidth = i === step.mid && step.action !== 'INIT' ? 2 : 1;
      roundRect(ctx, x + 2, y, cellW - 4, cellH, 6);
      ctx.stroke();

      // Value
      ctx.fillStyle = textColor;
      ctx.font = 'bold 15px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(arr[i], x + cellW / 2, y + cellH / 2);

      // Index below
      ctx.fillStyle = C.text2;
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillText(i, x + cellW / 2, y + cellH + 14);
    }

    // ── Legend ─────────────────────────────────────────────────────────────
    const legend = [
      { label: 'Low (L)',  color: C.low },
      { label: 'High (H)', color: C.high },
      { label: 'Mid (M)',  color: C.mid },
    ];
    ctx.font = '11px Syne, sans-serif';
    ctx.textBaseline = 'middle';
    let lx = startX;
    legend.forEach(item => {
      ctx.fillStyle = item.color;
      ctx.fillRect(lx, H - 22, 10, 10);
      ctx.fillStyle = C.text2;
      ctx.fillText(item.label, lx + 14, H - 17);
      lx += 80;
    });

    // Target indicator
    ctx.fillStyle = C.text2;
    ctx.textAlign = 'right';
    ctx.font = '12px JetBrains Mono, monospace';
    ctx.fillText(`target = ${step.target}`, W - 10, H - 17);
  }

  function drawError(msg) {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = C.red;
    ctx.font = '13px Syne, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(msg, canvas.width / 2, canvas.height / 2);
  }

  // ── Util: rounded rect path ────────────────────────────────────────────────
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => Visualizer.init());
