import axios from 'axios';

// ─── Axios instance ──────────────────────────────────────────────────────────
const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || ''
});

// Attach JWT on every request
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('devlearn_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('devlearn_token');
      localStorage.removeItem('devlearn_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email, password) =>
    http.post('/api/auth/login', { email, password }).then((r) => r.data),

  register: (name, email, password) =>
    http.post('/api/auth/register', { name, email, password }).then((r) => r.data),

  check: () =>
    http.get('/api/auth/check').then((r) => r.data),

  refresh: () =>
    http.post('/api/auth/refresh').then((r) => r.data),

  logout: () =>
    http.post('/api/auth/logout').catch(() => {}),
};

// ─── Topics ───────────────────────────────────────────────────────────────────
export const topicsApi = {
  getAll: (category) =>
    http.get('/api/topics', { params: category && category !== 'ALL' ? { category } : {} })
        .then((r) => r.data),

  getById: (id) =>
    http.get(`/api/topics/${id}`).then((r) => r.data),

  getExamples: (topicId) =>
    http.get(`/api/topics/${topicId}/examples`).then((r) => r.data),

  getProblems: (topicId) =>
    http.get(`/api/topics/${topicId}/problems`).then((r) => r.data),

  getProblem: (problemId) =>
    http.get(`/api/topics/problems/${problemId}`).then((r) => r.data),
};

// ─── Problems ─────────────────────────────────────────────────────────────────
export const problemsApi = {
  // Global paginated + filtered listing  (GET /api/problems)
  getAll: (filters = {}) =>
    http.get('/api/problems', { params: filters }).then((r) => r.data),

  // Filter metadata for dropdowns  (GET /api/problems/filters)
  getFilters: () =>
    http.get('/api/problems/filters').then((r) => r.data),

  // Bug 7 fix: editorial served only after user has an ACCEPTED submission
  getEditorial: (problemId) =>
    http.get(`/api/problems/${problemId}/editorial`).then((r) => r.data),
};

// ─── Code Execution ───────────────────────────────────────────────────────────
export const codeApi = {
  execute: (code, stdin = '', javaVersion = '17') =>
    http.post('/api/execute', { code, stdin, javaVersion }).then((r) => r.data),

  submit: (problemId, code, solveTimeSecs, hintAssisted, javaVersion = '17', approachText = '') =>
    http.post('/api/submissions/submit', {
      problemId, code,
      solveTimeSecs: solveTimeSecs || null,
      hintAssisted: !!hintAssisted,
      javaVersion,
      approachText: approachText || null,
    }).then((r) => r.data),

  syntaxCheck: (code, javaVersion = '17') =>
    http.post('/api/syntax-check', { code, javaVersion }).then((r) => r.data),

  getJavaCompletions: (javaVersion = '17') =>
    http.get('/api/java/completions', { params: { version: javaVersion } }).then((r) => r.data),

  analyzeComplexity: (code) =>
    http.post('/api/analyze-complexity', { code }).then((r) => r.data),
};

// ─── Submissions ──────────────────────────────────────────────────────────────
export const submissionsApi = {
  getHistory: (problemId) =>
    http.get('/api/submissions', { params: problemId ? { problemId } : {} }).then((r) => r.data),

  getSolvedIds: () =>
    http.get('/api/submissions/solved').then((r) => r.data).catch(() => []),

  getHeatmap: () =>
    http.get('/api/submissions/heatmap').then((r) => r.data).catch(() => ({})),

  getPercentile: (problemId, ms) =>
    http.get('/api/submissions/percentile', { params: { problemId, ms } }).then((r) => r.data),
};

// ─── Streak / Phase 2 ─────────────────────────────────────────────────────────
export const streakApi = {
  getStatus: () =>
    http.get('/api/streak/status').then((r) => r.data),

  usePauseDay: () =>
    http.post('/api/streak/pause-day').then((r) => r.data),

  recover: () =>
    http.post('/api/streak/recover').then((r) => r.data),
};

// ─── Bookmarks ────────────────────────────────────────────────────────────────
export const bookmarksApi = {
  getAll: () =>
    http.get('/api/bookmarks').then((r) => r.data),

  toggle: (itemType, itemId, itemTitle = '') =>
    http.post('/api/bookmarks/toggle', { itemType, itemId, itemTitle }).then((r) => r.data),

  check: (itemType, itemId) =>
    http.get('/api/bookmarks/check', { params: { itemType, itemId } }).then((r) => r.data),
};

// ─── Notes ────────────────────────────────────────────────────────────────────
export const notesApi = {
  getByTopic: (topicId) =>
    http.get('/api/notes', { params: { topicId } }).then((r) => r.data),

  create: (topicId, content) =>
    http.post('/api/notes', { topicId, content }).then((r) => r.data),

  update: (id, content) =>
    http.put(`/api/notes/${id}`, { content }).then((r) => r.data),

  delete: (id) =>
    http.delete(`/api/notes/${id}`).then((r) => r.data),
};

// ─── User Topic Videos ────────────────────────────────────────────────────────
export const userVideosApi = {
  getForTopic: (topicId) =>
    http.get(`/api/topics/${topicId}/videos/user`).then((r) => r.data),

  add: (topicId, url, title = '') =>
    http.post(`/api/topics/${topicId}/videos/user`, { url, title }).then((r) => r.data),

  remove: (topicId, videoId) =>
    http.delete(`/api/topics/${topicId}/videos/user/${videoId}`).then((r) => r.data),
};

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminApi = {
  getUsers: () =>
    http.get('/api/admin/users').then((r) => r.data),

  grantAdmin: (userId) =>
    http.post(`/api/admin/users/${userId}/grant-admin`).then((r) => r.data),

  revokeAdmin: (userId) =>
    http.post(`/api/admin/users/${userId}/revoke-admin`).then((r) => r.data),

  getStats: () =>
    http.get('/api/admin/data/stats').then((r) => r.data),

  seedBatch: (payload) =>
    http.post('/api/admin/seed-batch', payload).then((r) => r.data),

  clearAllData: () =>
    http.delete('/api/admin/seed-batch/clear').then((r) => r.data),

  getSeedFiles: () =>
    http.get('/api/admin/seed-files').then((r) => r.data),

  importSeedFile: (filename) =>
    http.post(`/api/admin/seed-files/${encodeURIComponent(filename)}`).then((r) => r.data),

  getTopicsFromSeedFile: (filename) =>
    http.get(`/api/admin/seed-files/${encodeURIComponent(filename)}/topics`).then((r) => r.data),

  // Topic CRUD
  createTopic: (data) =>
    http.post('/api/admin/topics', data).then((r) => r.data),

  updateTopic: (id, data) =>
    http.put(`/api/admin/topics/${id}`, data).then((r) => r.data),

  deleteTopic: (id) =>
    http.delete(`/api/admin/topics/${id}`).then((r) => r.data),

  // Example CRUD
  createExample: (topicId, data) =>
    http.post(`/api/admin/topics/${topicId}/examples`, data).then((r) => r.data),

  updateExample: (id, data) =>
    http.put(`/api/admin/examples/${id}`, data).then((r) => r.data),

  deleteExample: (id) =>
    http.delete(`/api/admin/examples/${id}`).then((r) => r.data),

  // Problem CRUD
  createProblem: (topicId, data) =>
    http.post(`/api/admin/topics/${topicId}/problems`, data).then((r) => r.data),

  updateProblem: (id, data) =>
    http.put(`/api/admin/problems/${id}`, data).then((r) => r.data),

  deleteProblem: (id) =>
    http.delete(`/api/admin/problems/${id}`).then((r) => r.data),

  // Quiz admin CRUD
  getQuizFiles: () =>
    http.get('/api/admin/quiz/files').then((r) => r.data),

  importQuizFile: (filename) =>
    http.post(`/api/admin/quiz/files/${encodeURIComponent(filename)}`).then((r) => r.data),

  previewQuizFile: (filename) =>
    http.get(`/api/admin/quiz/files/${encodeURIComponent(filename)}/preview`).then((r) => r.data),

  pasteQuizSet: (payload) =>
    http.post('/api/admin/quiz/paste', payload).then((r) => r.data),

  getQuizSets: () =>
    http.get('/api/admin/quiz/sets').then((r) => r.data),

  updateQuizSet: (id, data) =>
    http.put(`/api/admin/quiz/sets/${id}`, data).then((r) => r.data),

  deleteQuizSet: (id) =>
    http.delete(`/api/admin/quiz/sets/${id}`).then((r) => r.data),

  getQuizQuestions: (setId) =>
    http.get(`/api/admin/quiz/sets/${setId}/questions`).then((r) => r.data),

  addQuizQuestion: (setId, data) =>
    http.post(`/api/admin/quiz/sets/${setId}/questions`, data).then((r) => r.data),

  updateQuizQuestion: (questionId, data) =>
    http.put(`/api/admin/quiz/questions/${questionId}`, data).then((r) => r.data),

  deleteQuizQuestion: (questionId) =>
    http.delete(`/api/admin/quiz/questions/${questionId}`).then((r) => r.data),
};

// ─── Algorithm Admin API ─────────────────────────────────────────────────────
export const algorithmAdminApi = {
  getAll:         () =>
    http.get('/api/algorithms').then(r => r.data),

  getSeedFiles:   () =>
    http.get('/api/algorithms/admin/seed-files').then(r => r.data),

  importSeedFile: (filename) =>
    http.post(`/api/algorithms/admin/seed-file/${encodeURIComponent(filename)}`).then(r => r.data),

  seedBatch:      (payload) =>
    http.post('/api/algorithms/admin/seed-batch', payload).then(r => r.data),

  create:         (data) =>
    http.post('/api/algorithms/admin', data).then(r => r.data),

  update:         (id, data) =>
    http.put(`/api/algorithms/admin/${id}`, data).then(r => r.data),

  delete:         (id) =>
    http.delete(`/api/algorithms/admin/${id}`).then(r => r.data),

  deleteAll:      () =>
    http.delete('/api/algorithms/admin/all').then(r => r.data),
};

// ─── Algorithms ───────────────────────────────────────────────────────────────
export const algorithmsApi = {
  getAll: () =>
    http.get('/api/algorithms').then((r) => r.data),

  getBySlug: (slug) =>
    http.get(`/api/algorithms/${encodeURIComponent(slug)}`).then((r) => r.data),
};

// ─── Live Debugger ────────────────────────────────────────────────────────────
export const debugApi = {
  // POST /api/debug — step-by-step variable trace for Java code
  debug: (code, stdin = '', javaVersion = '17') =>
    http.post('/api/debug', { code, stdin, javaVersion }).then((r) => r.data),
};

// ─── Study Planner ────────────────────────────────────────────────────────────
export const studyPlansApi = {
  // GET /api/study-plans?start=YYYY-MM-DD&end=YYYY-MM-DD  (calendar range)
  getByRange: (start, end) =>
    http.get('/api/study-plans', { params: { start, end } }).then((r) => r.data),

  getUpcoming: () =>
    http.get('/api/study-plans/upcoming').then((r) => r.data),

  getAll: () =>
    http.get('/api/study-plans/all').then((r) => r.data),

  create: (data) =>
    http.post('/api/study-plans', data).then((r) => r.data),

  update: (id, data) =>
    http.put(`/api/study-plans/${id}`, data).then((r) => r.data),

  complete: (id) =>
    http.patch(`/api/study-plans/${id}/complete`).then((r) => r.data),

  delete: (id) =>
    http.delete(`/api/study-plans/${id}`).then((r) => r.data),
};

// ─── Roadmaps ─────────────────────────────────────────────────────────────────
export const roadmapsApi = {
  getAll: () =>
    http.get('/api/roadmaps').then((r) => r.data),

  getById: (id) =>
    http.get(`/api/roadmaps/${id}`).then((r) => r.data),

  create: (data) =>
    http.post('/api/roadmaps', data).then((r) => r.data),

  update: (id, data) =>
    http.put(`/api/roadmaps/${id}`, data).then((r) => r.data),

  addTopic: (id, topicId, orderIndex = 999) =>
    http.post(`/api/roadmaps/${id}/topics/${topicId}`, { orderIndex }).then((r) => r.data),

  removeTopic: (id, topicId) =>
    http.delete(`/api/roadmaps/${id}/topics/${topicId}`).then((r) => r.data),

  toggleDone: (id, topicId) =>
    http.patch(`/api/roadmaps/${id}/topics/${topicId}/done`).then((r) => r.data),

  delete: (id) =>
    http.delete(`/api/roadmaps/${id}`).then((r) => r.data),
};

// ─── Analytics ────────────────────────────────────────────────────────────────
export const analyticsApi = {
  getDashboard: () =>
    http.get('/api/analytics/dashboard').then((r) => r.data).catch(() => ({})),

  getMistakes: () =>
    http.get('/api/analytics/mistakes').then((r) => r.data).catch(() => []),
};

// ─── Topic Ratings ────────────────────────────────────────────────────────────
export const ratingsApi = {
  get: (topicId) =>
    http.get(`/api/topics/${topicId}/rating`).then((r) => r.data).catch(() => ({ average: 0, count: 0, myRating: 0 })),

  rate: (topicId, rating) =>
    http.post(`/api/topics/${topicId}/rate`, { rating }).then((r) => r.data),
};

// ─── Similar Problems ─────────────────────────────────────────────────────────
export const similarApi = {
  getSimilar: (problemId) =>
    http.get(`/api/problems/${problemId}/similar`).then((r) => r.data).catch(() => []),
};

// ─── React Query Keys ─────────────────────────────────────────────────────────
export const QUERY_KEYS = {
  topics:            (cat)  => ['topics', cat],
  topic:             (id)   => ['topic', id],
  examples:          (tid)  => ['examples', tid],
  problems:          (tid)  => ['problems', tid],
  problem:           (pid)  => ['problem', pid],
  editorial:         (pid)  => ['editorial', pid],
  allProblems:       (f)    => ['allProblems', f],
  problemFilters:           ['problemFilters'],
  submissionHistory: (pid)  => ['submissionHistory', pid],
  heatmap:                  ['heatmap'],
  solvedIds:                ['solvedIds'],
  streak:                   ['streak'],
  bookmarks:                ['bookmarks'],
  notes:             (tid)  => ['notes', tid],
  adminUsers:               ['adminUsers'],
  adminStats:               ['adminStats'],
  seedFiles:                ['seedFiles'],
  roadmaps:                 ['roadmaps'],
  studyPlans:               ['studyPlans'],
  srsQueue:                 ['srsQueue'],
  topicRating:   (tid)  => ['topicRating', tid],
  similarProblems:(pid) => ['similarProblems', pid],
  gateStatus:       (tid)  => ['gateStatus', tid],
  allGateStages:           ['allGateStages'],
  interviewQuestions:      ['interviewQuestions'],
  analyticsDashboard:      ['analyticsDashboard'],
  analyticsMistakes:       ['analyticsMistakes'],
  userVideos:    (tid)  => ['userVideos', tid],
};
// ─── Spaced Repetition ────────────────────────────────────────────────────────
export const srsApi = {
  getQueue: () =>
    http.get('/api/srs/queue').then((r) => r.data).catch(() => ({ dueCount: 0, due: [], upcoming: [] })),

  review: (itemType, itemId, quality) =>
    http.post('/api/srs/review', { itemType, itemId, quality }).then((r) => r.data),
};

// ─── Recall Drill ─────────────────────────────────────────────────────────────
export const recallApi = {
  save: (topicId, topicTitle, text) =>
    http.post('/api/recall', { topicId, topicTitle, text }).then((r) => r.data),
};

// ─── Interview Questions ──────────────────────────────────────────────────────
export const interviewApi = {
  getAll: (params = {}) =>
    http.get('/api/interview-questions', { params }).then((r) => r.data),

  create: (data) =>
    http.post('/api/admin/interview-questions', data).then((r) => r.data),

  update: (id, data) =>
    http.put(`/api/admin/interview-questions/${id}`, data).then((r) => r.data),

  delete: (id) =>
    http.delete(`/api/admin/interview-questions/${id}`).then((r) => r.data),

  bulkImport: (questions) =>
    http.post('/api/admin/interview-questions/bulk', questions).then((r) => r.data),

  deleteAll: () =>
    http.delete('/api/admin/interview-questions').then((r) => r.data),

  getFiles: () =>
    http.get('/api/admin/interview-questions/files').then((r) => r.data),

  importFile: (filename) =>
    http.post(`/api/admin/interview-questions/files/${encodeURIComponent(filename)}`).then((r) => r.data),
};

// ─── Learning Gate ────────────────────────────────────────────────────────────
export const gateApi = {
  getStatus: (topicId) =>
    http.get(`/api/topics/${topicId}/gate`).then((r) => r.data),

  completeTheory: (topicId, note) =>
    http.post(`/api/topics/${topicId}/gate/theory`, { note }).then((r) => r.data),

  // Returns { [topicId]: stage } for all topics the user has touched (single request)
  getAllStages: () =>
    http.get('/api/gate/all').then((r) => r.data),
};
