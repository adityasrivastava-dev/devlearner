import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute, GuestRoute } from './components/shared/RouteGuards';
import ErrorBoundary from './components/shared/ErrorBoundary';
import { usePageTracking } from './hooks/useTracking';
import PomodoroWidget from './components/pomodoro/PomodoroWidget';
import { useLocation } from 'react-router-dom';

// Critical-path pages — loaded eagerly (always needed on first paint)
import LoginPage from './pages/login/LoginPage';
import HomePage  from './pages/home/HomePage';

// All other pages — code-split, loaded on demand
const ProblemsPage       = lazy(() => import('./pages/problems/ProblemsPage'));
const AdminPage          = lazy(() => import('./pages/admin/AdminPage'));
const RoadmapPage        = lazy(() => import('./pages/roadmap/RoadmapPage'));
const VisualRoadmapPage  = lazy(() => import('./pages/roadmap/VisualRoadmapPage'));
const PlaygroundPage     = lazy(() => import('./pages/playground/PlaygroundPage'));
const ProfilePage        = lazy(() => import('./pages/profile/ProfilePage'));
const QuizPage           = lazy(() => import('./pages/quiz/QuizPage'));
const AlgorithmsPage     = lazy(() => import('./pages/algorithms/AlgorithmsPage'));
const QuickWinPage       = lazy(() => import('./pages/quickwin/QuickWinPage'));
const DrillPage          = lazy(() => import('./pages/drill/DrillPage'));
const InterviewPrepPage  = lazy(() => import('./pages/interview/InterviewPrepPage'));
const RevisionPage       = lazy(() => import('./pages/interview/RevisionPage'));
const ComplexityPage     = lazy(() => import('./pages/complexity/ComplexityPage'));
const MasteryPage        = lazy(() => import('./pages/mastery/MasteryPage'));
const ReviewPage         = lazy(() => import('./pages/review/ReviewPage'));
const InterviewModePage  = lazy(() => import('./pages/interview-mode/InterviewModePage'));
const AnalyticsPage      = lazy(() => import('./pages/analytics/AnalyticsPage'));
const VideosPage         = lazy(() => import('./pages/videos/VideosPage'));
const SystemDesignPage   = lazy(() => import('./pages/system-design/SystemDesignPage'));
const DailyChallengePage = lazy(() => import('./pages/daily/DailyChallengePage'));
const TimetablePage      = lazy(() => import('./pages/timetable/TimetablePage'));
const SearchPage         = lazy(() => import('./pages/search/SearchPage'));
const AssessmentPage     = lazy(() => import('./pages/assessment/AssessmentPage'));
const LearningPathPage   = lazy(() => import('./pages/path/LearningPathPage'));
const ResumePage           = lazy(() => import('./pages/resume/ResumePage'));
const MockInterviewPage    = lazy(() => import('./pages/mock-interview/MockInterviewPage'));
const SmartInterviewPage   = lazy(() => import('./pages/smart-interview/SmartInterviewPage'));
const StoriesPage        = lazy(() => import('./pages/stories/StoriesPage'));
const PracticeSetPage    = lazy(() => import('./pages/practice-set/PracticeSetPage'));
const CheatSheetPage     = lazy(() => import('./pages/cheatsheet/CheatSheetPage'));
const MyInterviewsPage   = lazy(() => import('./pages/my-interviews/MyInterviewsPage'));

// Apply saved theme on load; fall back to OS preference, then dark
const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const savedTheme = localStorage.getItem('devlearn_theme') || (systemPrefersDark ? 'dark' : 'light');
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

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', background: 'var(--bg)' }}>
      <span className="spinner" />
    </div>
  );
}

function AppRoutes() {
  usePageTracking();

  return (
    <ErrorBoundary label="Application">
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login"          element={<GuestRoute><ErrorBoundary label="Login" minimal><LoginPage /></ErrorBoundary></GuestRoute>} />
          <Route path="/"               element={<ProtectedRoute><ErrorBoundary label="Home"><HomePage /></ErrorBoundary></ProtectedRoute>} />
          <Route path="/problems"       element={<ProtectedRoute><ErrorBoundary label="Problems"><ProblemsPage /></ErrorBoundary></ProtectedRoute>} />
          <Route path="/roadmap"        element={<ProtectedRoute><ErrorBoundary label="Roadmap"><RoadmapPage /></ErrorBoundary></ProtectedRoute>} />
          <Route path="/visual-roadmap" element={<ProtectedRoute><ErrorBoundary label="VisualRoadmap"><VisualRoadmapPage /></ErrorBoundary></ProtectedRoute>} />
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
          <Route path="/search"         element={<ProtectedRoute><ErrorBoundary label="Search"><SearchPage /></ErrorBoundary></ProtectedRoute>} />
          <Route path="/assessment"     element={<ProtectedRoute><ErrorBoundary label="Assessment"><AssessmentPage /></ErrorBoundary></ProtectedRoute>} />
          <Route path="/path"           element={<ProtectedRoute><ErrorBoundary label="Learning Path"><LearningPathPage /></ErrorBoundary></ProtectedRoute>} />
          <Route path="/resume"         element={<ProtectedRoute><ErrorBoundary label="Resume Analyzer"><ResumePage /></ErrorBoundary></ProtectedRoute>} />
          <Route path="/mock-interview"    element={<ProtectedRoute><ErrorBoundary label="Mock Interview"><MockInterviewPage /></ErrorBoundary></ProtectedRoute>} />
          <Route path="/smart-interview"  element={<ProtectedRoute><ErrorBoundary label="Smart Interview"><SmartInterviewPage /></ErrorBoundary></ProtectedRoute>} />
          <Route path="/stories"        element={<ProtectedRoute><ErrorBoundary label="Stories"><StoriesPage /></ErrorBoundary></ProtectedRoute>} />
          <Route path="/practice-set"   element={<ProtectedRoute><ErrorBoundary label="Practice Set"><PracticeSetPage /></ErrorBoundary></ProtectedRoute>} />
          <Route path="/cheat-sheet"    element={<ProtectedRoute><ErrorBoundary label="Cheat Sheet"><CheatSheetPage /></ErrorBoundary></ProtectedRoute>} />
          <Route path="/my-interviews"  element={<ProtectedRoute><ErrorBoundary label="My Interviews"><MyInterviewsPage /></ErrorBoundary></ProtectedRoute>} />
          <Route path="/admin"          element={<AdminRoute><ErrorBoundary label="Admin Panel"><AdminPage /></ErrorBoundary></AdminRoute>} />
          <Route path="*"               element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

const HIDE_POMODORO_PATHS = ['/visual-roadmap'];
function PomodoroGuard() {
  const { pathname } = useLocation();
  if (HIDE_POMODORO_PATHS.includes(pathname)) return null;
  return <PomodoroWidget />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppRoutes />
          <PomodoroGuard />
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
