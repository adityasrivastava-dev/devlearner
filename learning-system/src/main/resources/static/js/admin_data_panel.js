/*
 * DevLearn — Admin Data Management Panel
 *
 * HOW TO USE:
 * In admin.html, add this line inside a <script> tag (or as a separate file):
 *   <script src="/js/admin_data_panel.js"></script>
 *
 * Then in your admin sidebar HTML, call:
 *   renderDataManagementPanel('yourContainerDivId')
 *
 * API Endpoints used (all require ADMIN JWT):
 *   GET    /api/admin/data/stats
 *   DELETE /api/admin/data/all
 *   DELETE /api/admin/data/topics
 *   DELETE /api/admin/data/examples
 *   DELETE /api/admin/data/problems
 *   DELETE /api/admin/data/category/:cat
 *   DELETE /api/admin/data/topic/:id
 */

/* ─── Shared auth header helper (works standalone or alongside admin.html) ─── */
function _adminHeaders() {
  const token = localStorage.getItem('devlearn_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
  };
}

/* ─── Main: inject the panel HTML into a container ─────────────────────────── */
function renderDataManagementPanel(containerId) {
  const container = document.getElementById(containerId);
  if (!container) { console.error('Container not found:', containerId); return; }

  container.innerHTML = `
    <div id="dmPanel" style="font-family:var(--font-ui,system-ui)">

      <!-- Stats row -->
      <div style="margin-bottom:16px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
          <h3 style="font-size:13px;font-weight:800;color:var(--text,#e2e8f0)">📊 Database Stats</h3>
          <button onclick="dmRefreshStats()" style="padding:3px 10px;background:var(--bg3,#333);border:1px solid var(--border2,#444);border-radius:4px;color:var(--text2,#a0a0a0);font-size:11px;font-weight:700;cursor:pointer">↻ Refresh</button>
        </div>
        <div id="dmStatsRow" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
          <div class="dm-stat-card" id="dmStatTopics">
            <div class="dm-stat-num">—</div>
            <div class="dm-stat-label">Topics</div>
          </div>
          <div class="dm-stat-card" id="dmStatExamples">
            <div class="dm-stat-num">—</div>
            <div class="dm-stat-label">Examples</div>
          </div>
          <div class="dm-stat-card" id="dmStatProblems">
            <div class="dm-stat-num">—</div>
            <div class="dm-stat-label">Problems</div>
          </div>
        </div>
        <!-- Category breakdown -->
        <div id="dmCategoryBreakdown" style="margin-top:8px;display:none">
          <div style="font-size:10px;font-weight:700;color:var(--text3,#666);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">By Category</div>
          <div id="dmCategoryList" style="display:flex;flex-wrap:wrap;gap:5px"></div>
        </div>
      </div>

      <!-- Granular delete operations -->
      <div style="margin-bottom:16px">
        <div style="font-size:13px;font-weight:800;color:var(--text,#e2e8f0);margin-bottom:10px">🗑 Delete Operations</div>

        <!-- Delete by category -->
        <div style="background:var(--bg2,#222);border:1px solid var(--border,#333);border-radius:6px;padding:12px 14px;margin-bottom:8px">
          <div style="font-size:12px;font-weight:700;margin-bottom:8px">Delete by Category</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap" id="dmCatButtons">
            ${['DSA','JAVA','ADVANCED_JAVA','MYSQL','AWS'].map(cat => `
              <button onclick="dmDeleteCategory('${cat}')"
                style="padding:5px 12px;background:rgba(239,71,67,.08);border:1px solid rgba(239,71,67,.2);border-radius:4px;color:var(--red,#ef4743);font-size:11px;font-weight:700;cursor:pointer;transition:.15s"
                onmouseover="this.style.background='rgba(239,71,67,.18)'"
                onmouseout="this.style.background='rgba(239,71,67,.08)'">
                ${cat}
              </button>`).join('')}
          </div>
        </div>

        <!-- Delete specific topic by ID -->
        <div style="background:var(--bg2,#222);border:1px solid var(--border,#333);border-radius:6px;padding:12px 14px;margin-bottom:8px">
          <div style="font-size:12px;font-weight:700;margin-bottom:8px">Delete Specific Topic by ID</div>
          <div style="display:flex;gap:6px">
            <input id="dmTopicIdInput" type="number" placeholder="Topic ID (e.g. 42)"
              style="flex:1;background:var(--bg3,#333);border:1px solid var(--border2,#444);border-radius:4px;padding:6px 10px;color:var(--text,#e2e8f0);font-family:var(--font-code,'monospace');font-size:12px;outline:none"/>
            <button onclick="dmDeleteTopicById()"
              style="padding:6px 14px;background:rgba(239,71,67,.08);border:1px solid rgba(239,71,67,.2);border-radius:4px;color:var(--red,#ef4743);font-size:11px;font-weight:700;cursor:pointer">
              Delete Topic
            </button>
          </div>
        </div>

        <!-- Partial deletes -->
        <div style="background:var(--bg2,#222);border:1px solid var(--border,#333);border-radius:6px;padding:12px 14px;margin-bottom:8px">
          <div style="font-size:12px;font-weight:700;margin-bottom:8px">Partial Delete</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button onclick="dmDeleteExamples()"
              style="padding:5px 12px;background:rgba(255,184,0,.08);border:1px solid rgba(255,184,0,.2);border-radius:4px;color:var(--yellow,#ffb800);font-size:11px;font-weight:700;cursor:pointer">
              🗑 Delete All Examples
            </button>
            <button onclick="dmDeleteProblems()"
              style="padding:5px 12px;background:rgba(255,184,0,.08);border:1px solid rgba(255,184,0,.2);border-radius:4px;color:var(--yellow,#ffb800);font-size:11px;font-weight:700;cursor:pointer">
              🗑 Delete All Problems
            </button>
          </div>
        </div>
      </div>

      <!-- Danger zone: nuclear option -->
      <div style="background:rgba(239,71,67,.05);border:1px solid rgba(239,71,67,.25);border-radius:6px;padding:14px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <span style="font-size:14px">⚠</span>
          <span style="font-size:12px;font-weight:800;color:var(--red,#ef4743)">DANGER ZONE</span>
        </div>
        <p style="font-size:11px;color:var(--text2,#a0a0a0);line-height:1.6;margin-bottom:12px">
          This deletes <strong>all topics, examples, and problems</strong> from the database.
          This action cannot be undone. Use before re-importing with fresh JSON data.
        </p>
        <button onclick="dmDeleteAll()"
          style="width:100%;padding:9px;background:rgba(239,71,67,.12);border:1px solid rgba(239,71,67,.35);border-radius:5px;color:var(--red,#ef4743);font-size:12px;font-weight:800;cursor:pointer;transition:.15s"
          onmouseover="this.style.background='rgba(239,71,67,.22)'"
          onmouseout="this.style.background='rgba(239,71,67,.12)'">
          🗑 DELETE ALL DATA
        </button>
      </div>

      <!-- Activity log -->
      <div style="margin-top:14px">
        <div style="font-size:10px;font-weight:700;color:var(--text3,#666);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Activity Log</div>
        <div id="dmLog"
          style="background:var(--bg,#1a1a1a);border:1px solid var(--border,#333);border-radius:5px;padding:8px 10px;font-family:'JetBrains Mono',monospace;font-size:11px;line-height:1.7;max-height:160px;overflow-y:auto">
          <div style="color:var(--text3,#666)">Ready. Click an operation to begin.</div>
        </div>
      </div>

    </div>

    <style>
      .dm-stat-card {
        background: var(--bg2, #222);
        border: 1px solid var(--border, #333);
        border-radius: 6px;
        padding: 10px 12px;
        text-align: center;
      }
      .dm-stat-num {
        font-size: 22px;
        font-weight: 900;
        color: var(--accent, #00b8a3);
        font-family: 'JetBrains Mono', monospace;
        line-height: 1.2;
      }
      .dm-stat-label {
        font-size: 10px;
        font-weight: 700;
        color: var(--text3, #666);
        text-transform: uppercase;
        letter-spacing: .5px;
        margin-top: 3px;
      }
    </style>
  `;

  // Auto-load stats on render
  dmRefreshStats();
}

/* ─── Stats ──────────────────────────────────────────────────────────────── */
async function dmRefreshStats() {
  try {
    const res  = await fetch('/api/admin/data/stats', { headers: _adminHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();

    _setStatCard('dmStatTopics',   data.topics);
    _setStatCard('dmStatExamples', data.examples);
    _setStatCard('dmStatProblems', data.problems);

    // Category breakdown
    if (data.byCategory) {
      const breakdown = document.getElementById('dmCategoryBreakdown');
      const list      = document.getElementById('dmCategoryList');
      if (breakdown && list) {
        const hasData = Object.values(data.byCategory).some(n => n > 0);
        breakdown.style.display = hasData ? 'block' : 'none';
        list.innerHTML = Object.entries(data.byCategory)
          .filter(([, n]) => n > 0)
          .map(([cat, n]) => `
            <div style="padding:3px 9px;background:var(--bg3,#333);border:1px solid var(--border2,#444);border-radius:10px;font-size:10px;font-weight:700;color:var(--text2,#a0a0a0)">
              ${cat}: <span style="color:var(--accent,#00b8a3)">${n}</span>
            </div>`).join('');
      }
    }
    _dmLog(`✓ Stats refreshed — ${data.topics} topics, ${data.examples} examples, ${data.problems} problems`);
  } catch (err) {
    _dmLog(`✕ Stats failed: ${err.message}`, 'error');
  }
}

function _setStatCard(id, value) {
  const el = document.getElementById(id);
  if (el) {
    const num = el.querySelector('.dm-stat-num');
    if (num) num.textContent = value ?? '—';
  }
}

/* ─── Delete All ─────────────────────────────────────────────────────────── */
async function dmDeleteAll() {
  const first  = confirm('⚠ DELETE ALL DATA\n\nThis will permanently delete ALL topics, examples, and problems.\n\nThis cannot be undone. Are you sure?');
  if (!first) return;
  const second = confirm('Second confirmation required.\n\nProceed with deleting ALL data?');
  if (!second) return;

  _dmLog('🗑 Deleting all data…', 'warn');
  try {
    const res  = await fetch('/api/admin/data/all', { method: 'DELETE', headers: _adminHeaders() });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    const d    = data.deleted || {};
    _dmLog(`✅ ${data.message} (${d.topics||0} topics, ${d.examples||0} examples, ${d.problems||0} problems)`, 'ok');
    dmRefreshStats();
    if (typeof loadAllTopics === 'function') loadAllTopics();
  } catch (err) {
    _dmLog(`✕ Delete all failed: ${err.message}`, 'error');
  }
}

/* ─── Delete by Category ─────────────────────────────────────────────────── */
async function dmDeleteCategory(category) {
  if (!confirm(`Delete ALL topics in category "${category}"?\n\nThis will also delete their examples and problems.`)) return;

  _dmLog(`🗑 Deleting category: ${category}…`, 'warn');
  try {
    const res  = await fetch(`/api/admin/data/category/${category}`, { method: 'DELETE', headers: _adminHeaders() });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    const d    = data.deleted || {};
    _dmLog(`✅ ${data.message} (${d.topics||0} topics, ${d.examples||0} examples, ${d.problems||0} problems)`, 'ok');
    dmRefreshStats();
    if (typeof loadAllTopics === 'function') loadAllTopics();
  } catch (err) {
    _dmLog(`✕ Delete category failed: ${err.message}`, 'error');
  }
}

/* ─── Delete Topic by ID ──────────────────────────────────────────────────── */
async function dmDeleteTopicById() {
  const input = document.getElementById('dmTopicIdInput');
  const id    = input?.value?.trim();
  if (!id || isNaN(id)) { _dmLog('✕ Enter a valid numeric topic ID', 'error'); return; }
  if (!confirm(`Delete topic with ID ${id} (and all its examples + problems)?`)) return;

  _dmLog(`🗑 Deleting topic ID: ${id}…`, 'warn');
  try {
    const res  = await fetch(`/api/admin/data/topic/${id}`, { method: 'DELETE', headers: _adminHeaders() });
    if (res.status === 404) { _dmLog(`✕ Topic ID ${id} not found`, 'error'); return; }
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    _dmLog(`✅ ${data.message}`, 'ok');
    if (input) input.value = '';
    dmRefreshStats();
    if (typeof loadAllTopics === 'function') loadAllTopics();
  } catch (err) {
    _dmLog(`✕ Delete topic failed: ${err.message}`, 'error');
  }
}

/* ─── Delete Only Examples ───────────────────────────────────────────────── */
async function dmDeleteExamples() {
  if (!confirm('Delete ALL examples from the database?\n\nTopics and problems will be kept.')) return;

  _dmLog('🗑 Deleting all examples…', 'warn');
  try {
    const res  = await fetch('/api/admin/data/examples', { method: 'DELETE', headers: _adminHeaders() });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    _dmLog(`✅ ${data.message}`, 'ok');
    dmRefreshStats();
  } catch (err) {
    _dmLog(`✕ Delete examples failed: ${err.message}`, 'error');
  }
}

/* ─── Delete Only Problems ───────────────────────────────────────────────── */
async function dmDeleteProblems() {
  if (!confirm('Delete ALL problems from the database?\n\nTopics and examples will be kept.')) return;

  _dmLog('🗑 Deleting all problems…', 'warn');
  try {
    const res  = await fetch('/api/admin/data/problems', { method: 'DELETE', headers: _adminHeaders() });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    _dmLog(`✅ ${data.message}`, 'ok');
    dmRefreshStats();
  } catch (err) {
    _dmLog(`✕ Delete problems failed: ${err.message}`, 'error');
  }
}

/* ─── Log helper ──────────────────────────────────────────────────────────── */
function _dmLog(msg, type) {
  const log = document.getElementById('dmLog');
  if (!log) return;
  const line = document.createElement('div');
  const colors = { ok: 'var(--accent,#00b8a3)', error: 'var(--red,#ef4743)', warn: 'var(--yellow,#ffb800)' };
  const time   = new Date().toLocaleTimeString();
  line.style.color = colors[type] || 'var(--text2,#a0a0a0)';
  line.textContent = `${time}  ${msg}`;
  // Clear placeholder if it's the first real log
  if (log.children.length === 1 && log.children[0].style.color === 'var(--text3, #666)') log.innerHTML = '';
  log.appendChild(line);
  log.scrollTop = log.scrollHeight;
}