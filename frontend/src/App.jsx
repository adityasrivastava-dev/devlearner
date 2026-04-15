import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute, GuestRoute } from './components/shared/RouteGuards';
import ErrorBoundary from './components/shared/ErrorBoundary';
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
    <ErrorBoundary label="Application">
      <Routes>
        <Route path="/login"          element={<GuestRoute><ErrorBoundary label="Login" minimal><LoginPage /></ErrorBoundary></GuestRoute>} />
        <Route path="/"               element={<ProtectedRoute><ErrorBoundary label="Home"><HomePage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/problems"       element={<ProtectedRoute><ErrorBoundary label="Problems"><ProblemsPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/roadmap"        element={<ProtectedRoute><ErrorBoundary label="Roadmap"><RoadmapPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/playground"     element={<ProtectedRoute><ErrorBoundary label="Playground"><PlaygroundPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/profile"        element={<ProtectedRoute><ErrorBoundary label="Profile"><ProfilePage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/quiz"           element={<ProtectedRoute><ErrorBoundary label="Quiz"><QuizPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/algorithms"     element={<ProtectedRoute><ErrorBoundary label="Algorithms"><AlgorithmsPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/quick-win"      element={<ProtectedRoute><ErrorBoundary label="Quick Win"><QuickWinPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/drill"          element={<ProtectedRoute><ErrorBoundary label="Drill"><DrillPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/interview-prep" element={<ProtectedRoute><ErrorBoundary label="Interview Prep"><InterviewPrepPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/revision"       element={<ProtectedRoute><ErrorBoundary label="Revision"><RevisionPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/complexity"     element={<ProtectedRoute><ErrorBoundary label="Complexity"><ComplexityPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/mastery"        element={<ProtectedRoute><ErrorBoundary label="Mastery Map"><MasteryPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/review"         element={<ProtectedRoute><ErrorBoundary label="Review"><ReviewPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/interview-mode" element={<ProtectedRoute><ErrorBoundary label="Interview Mode"><InterviewModePage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/analytics"      element={<ProtectedRoute><ErrorBoundary label="Analytics"><AnalyticsPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/videos"         element={<ProtectedRoute><ErrorBoundary label="Videos"><VideosPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/system-design"  element={<ProtectedRoute><ErrorBoundary label="System Design"><SystemDesignPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/daily"          element={<ProtectedRoute><ErrorBoundary label="Daily Challenge"><DailyChallengePage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/timetable"      element={<ProtectedRoute><ErrorBoundary label="Timetable"><TimetablePage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/admin"          element={<AdminRoute><ErrorBoundary label="Admin Panel"><AdminPage /></ErrorBoundary></AdminRoute>} />
        <Route path="*"               element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      </Routes>
    </ErrorBoundary>
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
