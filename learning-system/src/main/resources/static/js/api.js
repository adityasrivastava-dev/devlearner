/* ══════════════════════════════════════════════════════════════════════════════
   api.js — All HTTP calls to the Spring Boot backend
   Base URL is empty because frontend is served by the same server (monolithic)
══════════════════════════════════════════════════════════════════════════════ */

// ── Auth helpers (used throughout the app) ──────────────────────────────────

const Auth = {
  getToken()  { return localStorage.getItem('devlearn_token'); },
  getUser()   {
    try { return JSON.parse(localStorage.getItem('devlearn_user') || 'null'); }
    catch { return null; }
  },
  isLoggedIn(){ return !!this.getToken(); },
  isAdmin()   { const u = this.getUser(); return u && u.role === 'ADMIN'; },

  /** Clear token from storage and redirect to login. */
  logout(redirectUrl = '/login.html') {
    localStorage.removeItem('devlearn_token');
    localStorage.removeItem('devlearn_user');
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    window.location.replace(redirectUrl);
  },

  /**
   * Silently refresh the JWT from DB — call on every page load.
   * If DB roles changed (e.g. admin granted via SQL), the new token
   * is saved automatically. No re-login needed.
   */
  async syncToken() {
    const token = this.getToken();
    if (!token) return;         // not logged in — skip
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: this.headers()
      });
      if (res.status === 401) {
        this.logout();           // token truly expired — force re-login
        return;
      }
      if (!res.ok) return;       // server error — keep current token

      const data = await res.json();

      // Update token in localStorage with fresh one
      localStorage.setItem('devlearn_token', data.token);

      // Update user info — role may have changed
      const current = this.getUser() || {};
      const updated = {
        ...current,
        id:     data.id,
        name:   data.name,
        email:  data.email,
        role:   data.role,
        roles:  data.roles,
        avatar: data.avatar || current.avatar || '',
      };
      localStorage.setItem('devlearn_user', JSON.stringify(updated));

    } catch (_e) {
      // Network error — keep current token, don't log out
    }
  },

  /** Attach Bearer token to headers if user is logged in */
  headers(extra = {}) {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
      ...extra,
    };
  },

  /** fetch() wrapper — auto-attaches token, redirects on 401 */
  async fetch(url, options = {}) {
    const token = this.getToken();
    const headers = {
      ...(options.headers || {}),
      ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
    };
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      // Token expired or invalid — send to login
      this.logout();
      throw new Error('Session expired — please log in again');
    }
    return res;
  },
};

const API = {

  // ── Topics ────────────────────────────────────────────────────────────────
  async getTopics(category = null) {
    const url = category && category !== 'ALL'
      ? `/api/topics?category=${category}`
      : '/api/topics';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch topics');
    return res.json();
  },

  async getTopic(id) {
    const res = await fetch(`/api/topics/${id}`);
    if (!res.ok) throw new Error('Topic not found');
    return res.json();
  },

  async getExamples(topicId) {
    const res = await fetch(`/api/topics/${topicId}/examples`);
    if (!res.ok) throw new Error('Failed to fetch examples');
    return res.json();
  },

  async getProblems(topicId) {
    const res = await fetch(`/api/topics/${topicId}/problems`);
    if (!res.ok) throw new Error('Failed to fetch problems');
    return res.json();
  },

  async getProblem(problemId) {
    const res = await fetch(`/api/topics/problems/${problemId}`);
    if (!res.ok) throw new Error('Problem not found');
    return res.json();
  },

  // ── Execute (free run) — now carries javaVersion ─────────────────────────
  async execute(code, stdin = '', javaVersion = '17') {
    const res = await fetch('/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, stdin, javaVersion })
    });
    return res.json();
  },

  // ── Submit (evaluate against test cases) ─────────────────────────────────
  async submit(problemId, code) {
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ problemId, code })
    });
    return res.json();
  },

  // ── Syntax Check — now carries javaVersion ───────────────────────────────
  async syntaxCheck(code, javaVersion = '17') {
    const res = await fetch('/api/syntax-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, javaVersion })
    });
    if (!res.ok) throw new Error('Syntax check failed');
    return res.json();
  },

  // ── Complexity Analysis ───────────────────────────────────────────────────
  async analyzeComplexity(code) {
    const res = await fetch('/api/analyze-complexity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
    if (!res.ok) throw new Error('Complexity analysis failed');
    return res.json();
  },

  // ── Visualize ─────────────────────────────────────────────────────────────
  async visualize(algorithm, array, target) {
    const body = { algorithm };
    if (array && array.length)  body.array  = array;
    if (target !== undefined)   body.target = target;
    const res = await fetch('/api/visualize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('Visualization failed');
    return res.json();
  },

  // ── Trace (step-by-step variable state) ──────────────────────────────────
  async trace(algorithm, array, target) {
    const body = { algorithm };
    if (array && array.length) body.array  = array;
    if (target !== undefined)  body.target = target;
    const res = await fetch('/api/trace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('Trace failed');
    return res.json();
  }
};