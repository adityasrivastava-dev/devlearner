import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute, GuestRoute } from './components/shared/RouteGuards';

import LoginPage      from './pages/login/LoginPage';
import HomePage       from './pages/home/HomePage';
import ProblemsPage   from './pages/problems/ProblemsPage';
import AdminPage      from './pages/admin/AdminPage';
import RoadmapPage    from './pages/roadmap/RoadmapPage';
import PlaygroundPage from './pages/playground/PlaygroundPage';
import ProfilePage    from './pages/profile/ProfilePage';
import QuizPage       from './pages/quiz/QuizPage';

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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/login"      element={<GuestRoute><LoginPage /></GuestRoute>} />
            <Route path="/"           element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/problems"   element={<ProtectedRoute><ProblemsPage /></ProtectedRoute>} />
            <Route path="/roadmap"    element={<ProtectedRoute><RoadmapPage /></ProtectedRoute>} />
            <Route path="/playground" element={<ProtectedRoute><PlaygroundPage /></ProtectedRoute>} />
            <Route path="/profile"    element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/quiz"       element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
            <Route path="/admin"      element={<AdminRoute><AdminPage /></AdminRoute>} />
            <Route path="*"           element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          </Routes>
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