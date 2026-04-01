/* ═══════════════════════════════════════════════════════════════════════════
   focus_mode.js — DevLearn Focus Mode (Pomodoro Timer)
   Features: 25-min focus / 5-min break cycles · floating widget · keyboard shortcut
   Toggle: click 🎯 button in toolbar OR press F
═══════════════════════════════════════════════════════════════════════════ */

const FocusMode = (() => {

  const DURATIONS = {
    focus: 25 * 60,   // 25 minutes
    break:  5 * 60,   // 5 minutes
    long:  15 * 60,   // 15 min long break (every 4 sessions)
  };

  const C = {
    accent:  '#00b8a3',
    blue:    '#5b8af5',
    yellow:  '#ffb800',
    red:     '#ef4743',
    bg2:     '#282828',
    border:  '#3e3e3e',
  };

  let state = {
    visible:    false,
    running:    false,
    mode:       'focus',  // 'focus' | 'break' | 'long'
    remaining:  DURATIONS.focus,
    sessions:   0,
    timer:      null,
    minimized:  false,
  };

  let widget = null;

  // ── Create the floating widget DOM ──────────────────────────────────────────
  function init() {
    if (document.getElementById('focusWidget')) return;

    // Inject CSS
    if (!document.getElementById('focusModeCSS')) {
      const style = document.createElement('style');
      style.id = 'focusModeCSS';
      style.textContent = `
        /* ── Focus Mode Button (in page header) ── */
        #focusToggleBtn {
          display: flex; align-items: center; gap: 5px;
          padding: 5px 10px; background: var(--bg3, #333);
          border: 1px solid var(--border2, #4a4a4a);
          border-radius: 5px; color: var(--text2, #a8afbf);
          font-family: var(--font-ui, system-ui); font-size: 11px; font-weight: 700;
          cursor: pointer; transition: .15s; white-space: nowrap;
        }
        #focusToggleBtn:hover { border-color: #00b8a3; color: #00b8a3; }
        #focusToggleBtn.active { background: rgba(0,184,163,.1); border-color: #00b8a3; color: #00b8a3; }

        /* ── Widget ── */
        #focusWidget {
          position: fixed; bottom: 24px; right: 24px; z-index: 8888;
          width: 240px; background: #1e1e1e;
          border: 1px solid #3e3e3e; border-radius: 14px;
          box-shadow: 0 8px 32px rgba(0,0,0,.6);
          font-family: var(--font-ui, system-ui);
          transition: transform .25s cubic-bezier(.34,1.56,.64,1), opacity .2s;
          user-select: none;
        }
        #focusWidget.hidden { display: none; }
        #focusWidget.minimized { width: 140px; }

        /* ── Drag handle ── */
        .fw-header {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 12px 8px; cursor: grab; border-radius: 14px 14px 0 0;
          border-bottom: 1px solid #2e2e2e;
        }
        .fw-header:active { cursor: grabbing; }
        .fw-mode-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .fw-mode-label { font-size: 11px; font-weight: 800; text-transform: uppercase;
                         letter-spacing: .5px; flex: 1; }
        .fw-session-badge { font-size: 9px; font-weight: 700;
                            background: rgba(255,255,255,.06); color: #666c7c;
                            padding: 2px 6px; border-radius: 8px; }
        .fw-close { font-size: 13px; color: #444; cursor: pointer; padding: 0 2px;
                    background: none; border: none; line-height: 1; }
        .fw-close:hover { color: #ef4743; }
        .fw-minimize { font-size: 13px; color: #444; cursor: pointer; padding: 0 2px;
                       background: none; border: none; line-height: 1; }
        .fw-minimize:hover { color: #a8afbf; }

        /* ── Ring timer ── */
        .fw-ring-wrap {
          display: flex; align-items: center; justify-content: center;
          padding: 16px 12px 8px;
        }
        .fw-ring { position: relative; width: 100px; height: 100px; }
        .fw-ring-svg { position: absolute; inset: 0; transform: rotate(-90deg); }
        .fw-ring-bg   { fill: none; stroke: #2e2e2e; stroke-width: 6; }
        .fw-ring-fill { fill: none; stroke-width: 6; stroke-linecap: round;
                        transition: stroke-dashoffset .8s linear; }
        .fw-ring-inner {
          position: absolute; inset: 0; display: flex; flex-direction: column;
          align-items: center; justify-content: center; text-align: center;
        }
        .fw-time { font-family: 'JetBrains Mono', monospace; font-size: 22px;
                   font-weight: 800; letter-spacing: -1px; line-height: 1; }
        .fw-time-label { font-size: 9px; color: #666c7c; font-weight: 700;
                         text-transform: uppercase; letter-spacing: .5px; margin-top: 3px; }

        /* ── Controls ── */
        .fw-controls {
          display: flex; align-items: center; justify-content: center;
          gap: 8px; padding: 0 12px 12px;
        }
        .fw-btn {
          flex: 1; padding: 7px; border-radius: 7px; border: none;
          font-family: var(--font-ui, system-ui); font-size: 12px; font-weight: 800;
          cursor: pointer; transition: .15s;
        }
        .fw-btn-start { background: #00b8a3; color: #031a17; }
        .fw-btn-start:hover { background: #00d4bc; }
        .fw-btn-pause { background: rgba(255,184,0,.15); color: #ffb800;
                        border: 1px solid rgba(255,184,0,.25); }
        .fw-btn-pause:hover { background: rgba(255,184,0,.25); }
        .fw-btn-reset { background: #282828; color: #a8afbf;
                        border: 1px solid #3e3e3e; flex: 0 0 auto; width: 34px; font-size:14px; }
        .fw-btn-reset:hover { border-color: #ef4743; color: #ef4743; }
        .fw-btn-skip  { background: #282828; color: #666c7c;
                        border: 1px solid #3e3e3e; flex: 0 0 auto; width: 34px; font-size:11px; }
        .fw-btn-skip:hover { color: #a8afbf; }

        /* ── Session dots ── */
        .fw-sessions {
          display: flex; gap: 5px; justify-content: center;
          padding: 0 12px 10px;
        }
        .fw-sess-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #2e2e2e; transition: .2s;
        }
        .fw-sess-dot.done { background: #00b8a3; }
        .fw-sess-dot.current { background: #ffb800; animation: fw-pulse 1s ease-in-out infinite; }

        /* ── Task label ── */
        .fw-task {
          padding: 0 12px 12px;
          font-size: 11px; color: #666c7c; text-align: center; line-height: 1.5;
        }
        .fw-task-edit {
          width: 100%; background: #282828; border: 1px solid #3e3e3e;
          border-radius: 5px; padding: 5px 8px; color: #eff1f6;
          font-family: inherit; font-size: 11px; outline: none; text-align: center;
        }
        .fw-task-edit:focus { border-color: #00b8a3; }

        @keyframes fw-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .4; }
        }

        /* ── Notification ── */
        .fw-notify {
          position: fixed; top: 20px; right: 20px; z-index: 9999;
          background: #00b8a3; color: #031a17;
          padding: 12px 20px; border-radius: 10px;
          font-family: var(--font-ui, system-ui); font-size: 14px; font-weight: 800;
          box-shadow: 0 4px 16px rgba(0,184,163,.4);
          animation: fw-slide-in .3s ease;
        }
        @keyframes fw-slide-in {
          from { transform: translateX(120%); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }

        /* ── minimized state ── */
        #focusWidget.minimized .fw-ring-wrap,
        #focusWidget.minimized .fw-controls,
        #focusWidget.minimized .fw-sessions,
        #focusWidget.minimized .fw-task { display: none; }
        #focusWidget.minimized .fw-header {
          border-bottom: none; padding: 10px 12px;
        }

        /* ── Focus overlay (dims non-editor area) ── */
        .focus-overlay {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(0,0,0,.55); backdrop-filter: blur(1px);
          pointer-events: none; opacity: 0;
          transition: opacity .4s;
        }
        .focus-overlay.active { opacity: 1; }
      `;
      document.head.appendChild(style);
    }

    // Build widget
    widget = document.createElement('div');
    widget.id = 'focusWidget';
    widget.className = 'hidden';
    updateWidgetHTML();
    document.body.appendChild(widget);

    // Make draggable
    makeDraggable(widget, widget.querySelector('.fw-header'));

    // Keyboard shortcut
    document.addEventListener('keydown', e => {
      if (e.key === 'F' && !e.ctrlKey && !e.metaKey &&
          !['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)) {
        toggleWidget();
      }
    });
  }

  function updateWidgetHTML() {
    if (!widget) return;
    const remaining = state.remaining;
    const total = DURATIONS[state.mode];
    const pct = 1 - remaining / total;
    const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
    const secs = String(remaining % 60).padStart(2, '0');
    const modeColor = state.mode === 'focus' ? C.accent
                    : state.mode === 'break' ? C.blue
                    : C.yellow;
    const modeLabel = state.mode === 'focus' ? '🎯 Focus' : state.mode === 'break' ? '☕ Break' : '🏖 Long Break';

    const circumference = 2 * Math.PI * 42; // radius 42
    const dashOffset = circumference * (1 - pct);

    widget.innerHTML = `
      <div class="fw-header" id="fwDragHandle">
        <div class="fw-mode-dot" style="background:${modeColor}"></div>
        <span class="fw-mode-label" style="color:${modeColor}">${modeLabel}</span>
        <span class="fw-session-badge">Session ${state.sessions + 1}</span>
        <button class="fw-minimize" onclick="FocusMode.toggleMinimize()" title="Minimize">─</button>
        <button class="fw-close" onclick="FocusMode.hide()" title="Close">✕</button>
      </div>

      <div class="fw-ring-wrap">
        <div class="fw-ring">
          <svg class="fw-ring-svg" viewBox="0 0 100 100">
            <circle class="fw-ring-bg" cx="50" cy="50" r="42"/>
            <circle class="fw-ring-fill"
              cx="50" cy="50" r="42"
              style="stroke:${modeColor};
                     stroke-dasharray:${circumference};
                     stroke-dashoffset:${dashOffset}"/>
          </svg>
          <div class="fw-ring-inner">
            <div class="fw-time" style="color:${state.running ? modeColor : '#a8afbf'}">${mins}:${secs}</div>
            <div class="fw-time-label">${state.running ? 'running' : 'ready'}</div>
          </div>
        </div>
      </div>

      <div class="fw-controls">
        <button class="fw-btn fw-btn-skip" onclick="FocusMode.skip()" title="Skip to next">⏭</button>
        <button class="fw-btn ${state.running ? 'fw-btn-pause' : 'fw-btn-start'}"
                onclick="FocusMode.toggleTimer()">
          ${state.running ? '⏸ Pause' : '▶ Start'}
        </button>
        <button class="fw-btn fw-btn-reset" onclick="FocusMode.reset()" title="Reset">↺</button>
      </div>

      <div class="fw-sessions">
        ${[0,1,2,3].map(i => `
          <div class="fw-sess-dot ${i < state.sessions % 4 ? 'done' : i === state.sessions % 4 && state.mode === 'focus' ? 'current' : ''}"></div>`
        ).join('')}
      </div>

      <div class="fw-task">
        <input class="fw-task-edit" id="fwTask" type="text"
               placeholder="What are you working on?"
               value="${state.task || ''}"
               onchange="FocusMode.setTask(this.value)"/>
      </div>`;
  }

  // ── Timer logic ─────────────────────────────────────────────────────────────
  function toggleTimer() {
    if (state.running) {
      clearInterval(state.timer);
      state.running = false;
    } else {
      state.running = true;
      state.timer = setInterval(() => {
        state.remaining--;
        if (state.remaining <= 0) {
          onTimerComplete();
        }
        updateWidgetHTML();
        makeDraggable(widget, widget.querySelector('.fw-header'));
      }, 1000);
    }
    updateWidgetHTML();
    makeDraggable(widget, widget.querySelector('.fw-header'));
  }

  function onTimerComplete() {
    clearInterval(state.timer);
    state.running = false;

    if (state.mode === 'focus') {
      state.sessions++;
      const isLongBreak = state.sessions % 4 === 0;
      state.mode = isLongBreak ? 'long' : 'break';
      state.remaining = isLongBreak ? DURATIONS.long : DURATIONS.break;
      notify(isLongBreak ? '🏖 Long break time! (15 min)' : '☕ Break time! (5 min)');
    } else {
      state.mode = 'focus';
      state.remaining = DURATIONS.focus;
      notify('🎯 Focus time! (25 min)');
    }

    updateWidgetHTML();
    makeDraggable(widget, widget.querySelector('.fw-header'));

    // Auto-start break/next session
    setTimeout(() => toggleTimer(), 1500);
  }

  function reset() {
    clearInterval(state.timer);
    state.running = false;
    state.remaining = DURATIONS[state.mode];
    updateWidgetHTML();
    makeDraggable(widget, widget.querySelector('.fw-header'));
  }

  function skip() {
    clearInterval(state.timer);
    state.running = false;
    if (state.mode === 'focus') {
      state.sessions++;
      state.mode = 'break';
      state.remaining = DURATIONS.break;
    } else {
      state.mode = 'focus';
      state.remaining = DURATIONS.focus;
    }
    updateWidgetHTML();
    makeDraggable(widget, widget.querySelector('.fw-header'));
  }

  function setTask(val) { state.task = val; }

  // ── Widget show/hide ─────────────────────────────────────────────────────────
  function toggleWidget() {
    state.visible ? hide() : show();
  }

  function show() {
    if (!widget) init();
    state.visible = true;
    state.minimized = false;
    widget.classList.remove('hidden', 'minimized');
    updateWidgetHTML();
    makeDraggable(widget, widget.querySelector('.fw-header'));
    // Update toggle button
    const btn = document.getElementById('focusToggleBtn');
    if (btn) btn.classList.add('active');
  }

  function hide() {
    clearInterval(state.timer);
    state.running = false;
    state.visible = false;
    if (widget) widget.classList.add('hidden');
    const btn = document.getElementById('focusToggleBtn');
    if (btn) btn.classList.remove('active');
  }

  function toggleMinimize() {
    state.minimized = !state.minimized;
    if (widget) {
      widget.classList.toggle('minimized', state.minimized);
    }
  }

  // ── Notification toast ───────────────────────────────────────────────────────
  function notify(msg) {
    const n = document.createElement('div');
    n.className = 'fw-notify';
    n.textContent = msg;
    document.body.appendChild(n);

    // Play a gentle notification sound (optional, silent fallback)
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5);
    } catch (e) { /* no audio context — silent */ }

    setTimeout(() => n.remove(), 4000);
  }

  // ── Drag support ─────────────────────────────────────────────────────────────
  function makeDraggable(el, handle) {
    if (!handle) return;
    let ox = 0, oy = 0, dragging = false;
    handle.onmousedown = e => {
      if (e.target.tagName === 'BUTTON') return;
      dragging = true;
      ox = e.clientX - el.getBoundingClientRect().left;
      oy = e.clientY - el.getBoundingClientRect().top;
      document.body.style.userSelect = 'none';
    };
    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      let x = e.clientX - ox;
      let y = e.clientY - oy;
      const maxX = window.innerWidth - el.offsetWidth;
      const maxY = window.innerHeight - el.offsetHeight;
      x = Math.max(0, Math.min(x, maxX));
      y = Math.max(0, Math.min(y, maxY));
      el.style.left   = x + 'px';
      el.style.right  = 'auto';
      el.style.bottom = 'auto';
      el.style.top    = y + 'px';
    });
    document.addEventListener('mouseup', () => {
      dragging = false;
      document.body.style.userSelect = '';
    });
  }

  // ── Auto-inject toggle button into page ─────────────────────────────────────
  function injectToggleButton() {
    // Add to tab bar area or sidebar header
    const sidebar = document.querySelector('.sidebar-header');
    if (sidebar && !document.getElementById('focusToggleBtn')) {
      const btn = document.createElement('button');
      btn.id = 'focusToggleBtn';
      btn.innerHTML = '🎯 Focus';
      btn.title = 'Toggle Focus Mode (F)';
      btn.onclick = toggleWidget;
      // Insert before admin link
      const adminLink = document.getElementById('adminLink');
      if (adminLink) {
        sidebar.insertBefore(btn, adminLink);
      } else {
        const iconBtns = sidebar.querySelector('div[style]');
        if (iconBtns) iconBtns.prepend(btn);
        else sidebar.appendChild(btn);
      }
    }
  }

  // ── Public API ───────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    init();
    injectToggleButton();
  });

  return { show, hide, toggleWidget, toggleTimer, reset, skip, setTask, toggleMinimize };

})();