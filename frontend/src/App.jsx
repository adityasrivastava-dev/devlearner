import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute, GuestRoute } from './components/shared/RouteGuards';
import { usePageTracking } from './hooks/useTracking';

import LoginPage          from './pages/login/LoginPage';
import HomePage           from './pages/home/HomePage';
import ProblemsPage       from './pages/problems/ProblemsPage';
import AdminPage          from './pages/admin/AdminPage';
import RoadmapPage        from './pages/roadmap/RoadmapPage';
import PlaygroundPage     from './pages/playground/PlaygroundPage';
import ProfilePage        from './pages/profile/ProfilePage';
import QuizPage           from './pages/quiz/QuizPage';
import AlgorithmsPage     from './pages/algorithms/AlgorithmsPage';
import QuickWinPage       from './pages/quickwin/QuickWinPage';
import DrillPage          from './pages/drill/DrillPage';
import InterviewPrepPage  from './pages/interview/InterviewPrepPage';
import RevisionPage       from './pages/interview/RevisionPage';
import ComplexityPage     from './pages/complexity/ComplexityPage';
import MasteryPage        from './pages/mastery/MasteryPage';
import ReviewPage         from './pages/review/ReviewPage';
import InterviewModePage  from './pages/interview-mode/InterviewModePage';
import AnalyticsPage        from './pages/analytics/AnalyticsPage';
import VideosPage           from './pages/videos/VideosPage';
import SystemDesignPage     from './pages/system-design/SystemDesignPage';
import DailyChallengePage   from './pages/daily/DailyChallengePage';
import TimetablePage        from './pages/timetable/TimetablePage';

// Apply saved theme on load
const savedTheme = localStorage.getItem('devlearn_theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

/** Inner component — needs to live inside BrowserRouter so hooks can read location */
function AppRoutes() {
  usePageTracking();

  return (
    <Routes>
      <Route path="/login"          element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/"               element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="/problems"       element={<ProtectedRoute><ProblemsPage /></ProtectedRoute>} />
      <Route path="/roadmap"        element={<ProtectedRoute><RoadmapPage /></ProtectedRoute>} />
      <Route path="/playground"     element={<ProtectedRoute><PlaygroundPage /></ProtectedRoute>} />
      <Route path="/profile"        element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/quiz"           element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
      <Route path="/algorithms"     element={<ProtectedRoute><AlgorithmsPage /></ProtectedRoute>} />
      <Route path="/quick-win"      element={<ProtectedRoute><QuickWinPage /></ProtectedRoute>} />
      <Route path="/drill"          element={<ProtectedRoute><DrillPage /></ProtectedRoute>} />
      <Route path="/interview-prep" element={<ProtectedRoute><InterviewPrepPage /></ProtectedRoute>} />
      <Route path="/revision"       element={<ProtectedRoute><RevisionPage /></ProtectedRoute>} />
      <Route path="/complexity"     element={<ProtectedRoute><ComplexityPage /></ProtectedRoute>} />
      <Route path="/mastery"        element={<ProtectedRoute><MasteryPage /></ProtectedRoute>} />
      <Route path="/review"         element={<ProtectedRoute><ReviewPage /></ProtectedRoute>} />
      <Route path="/interview-mode" element={<ProtectedRoute><InterviewModePage /></ProtectedRoute>} />
      <Route path="/analytics"      element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
      <Route path="/videos"         element={<ProtectedRoute><VideosPage /></ProtectedRoute>} />
      <Route path="/system-design"  element={<ProtectedRoute><SystemDesignPage /></ProtectedRoute>} />
      <Route path="/daily"           element={<ProtectedRoute><DailyChallengePage /></ProtectedRoute>} />
      <Route path="/timetable"      element={<ProtectedRoute><TimetablePage /></ProtectedRoute>} />
      <Route path="/admin"          element={<AdminRoute><AdminPage /></AdminRoute>} />
      <Route path="*"               element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppRoutes />
        </BrowserRouter>

        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'var(--bg2)',
              color: 'var(--text)',
              border: '1px solid var(--border2)',
              fontSize: '13px',
              fontFamily: 'var(--font-ui)',
              borderRadius: '8px',
            },
            success: { iconTheme: { primary: 'var(--accent3)', secondary: '#0f1117' } },
            error:   { iconTheme: { primary: 'var(--red)',     secondary: '#0f1117' } },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
