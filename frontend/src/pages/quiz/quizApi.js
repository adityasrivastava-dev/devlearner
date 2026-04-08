import axios from 'axios';

// Standalone HTTP client — uses same base URL and JWT as the main app
const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 15000,
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('devlearn_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

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

export const quizApi = {
  // Get all quiz sets, optionally filtered by category
  getSets: (category) =>
    http.get('/api/quiz/sets', {
      params: category && category !== 'ALL' ? { category } : {},
    }).then((r) => r.data),

  // Get a quiz set with its questions (ready to play)
  getSet: (id) =>
    http.get(`/api/quiz/sets/${id}`).then((r) => r.data),

  // Submit a completed quiz attempt
  submit: (setId, answers, timeTakenSecs) =>
    http.post('/api/quiz/submit', { setId, answers, timeTakenSecs })
       .then((r) => r.data),

  // Get user's quiz history
  getHistory: () =>
    http.get('/api/quiz/history').then((r) => r.data).catch(() => []),

  // Admin: seed a quiz set
  seedSet: (payload) =>
    http.post('/api/admin/quiz/seed', payload).then((r) => r.data),
};

export const QUIZ_CATEGORIES = [
  { key: 'ALL',          label: 'All',          icon: '🎯' },
  { key: 'JAVA',         label: 'Java',          icon: '☕' },
  { key: 'DSA',          label: 'DSA',           icon: '📊' },
  { key: 'SPRING',       label: 'Spring',        icon: '🌱' },
  { key: 'SQL',          label: 'SQL',           icon: '🗃️'  },
  { key: 'SYSTEM_DESIGN',label: 'System Design', icon: '🏗️'  },
];

export const DIFFICULTY_META = {
  BEGINNER:     { color: 'var(--success)', bg: 'rgba(74,222,128,.1)',  label: 'Beginner'     },
  INTERMEDIATE: { color: 'var(--yellow)',  bg: 'rgba(251,191,36,.1)',  label: 'Intermediate' },
  ADVANCED:     { color: 'var(--red)',     bg: 'rgba(248,113,113,.1)', label: 'Advanced'     },
};