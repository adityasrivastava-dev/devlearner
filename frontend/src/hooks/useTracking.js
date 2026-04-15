import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackingApi } from '../api';

/**
 * usePageTracking — call once in App.jsx (inside BrowserRouter).
 * Auto-fires a page-view event on every route change.
 */
export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    // Fire-and-forget; ignore errors silently
    trackingApi.pageView(location.pathname).catch(() => {});
  }, [location.pathname]);
}

/**
 * useEventTracking — returns a stable `trackEvent` function.
 * Use in any component to log user interactions.
 *
 * @example
 * const { trackEvent } = useEventTracking();
 * trackEvent('PROBLEM_OPENED', { problemId: 42 });
 */
export function useEventTracking() {
  const location = useLocation();

  const trackEvent = useCallback((eventType, data = {}) => {
    trackingApi.event(eventType, location.pathname, data).catch(() => {});
  }, [location.pathname]);

  return { trackEvent };
}

/**
 * useTimeOnPage — tracks how long a user stays on the current page.
 * Reports a TIME_ON_PAGE event when the component unmounts.
 *
 * @example
 * useTimeOnPage('PROBLEMS');
 */
export function useTimeOnPage(pageName) {
  const location = useLocation();
  const startRef = useRef(Date.now());

  useEffect(() => {
    startRef.current = Date.now();
    return () => {
      const seconds = Math.round((Date.now() - startRef.current) / 1000);
      if (seconds > 3) {
        trackingApi.event('TIME_ON_PAGE', location.pathname, { page: pageName, seconds }).catch(() => {});
      }
    };
  }, [pageName, location.pathname]);
}
