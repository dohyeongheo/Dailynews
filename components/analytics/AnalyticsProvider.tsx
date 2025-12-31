"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { generateSessionId, getSessionId } from '@/lib/utils/analytics';
import { clientLog } from '@/lib/utils/client-logger';

interface AnalyticsContextType {
  sessionId: string;
  trackEvent: (eventName: string, metadata?: Record<string, unknown>) => void;
  trackPageView: () => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within AnalyticsProvider');
  }
  return context;
}

interface AnalyticsProviderProps {
  children: ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const [sessionId, setSessionId] = useState<string>('');
  const pathname = usePathname();

  // 세션 ID 초기화
  useEffect(() => {
    const id = getSessionId();
    setSessionId(id);

    // 세션 시작 이벤트 전송
    fetch('/api/analytics/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'start',
        session_id: id,
      }),
    }).catch((error) => {
      clientLog.warn('세션 시작 이벤트 전송 실패', { error });
    });
  }, []);

  // 페이지뷰 추적
  const trackPageView = useCallback(() => {
    if (!sessionId || typeof window === 'undefined') return;

    const pageTitle = document.title || '';
    const pagePath = pathname || window.location.pathname;

    fetch('/api/analytics/pageview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        page_path: pagePath,
        page_title: pageTitle,
        referrer: document.referrer || undefined,
        user_agent: navigator.userAgent,
        screen_width: window.screen.width,
        screen_height: window.screen.height,
      }),
    }).catch((error) => {
      clientLog.warn('페이지뷰 추적 실패', { error, pagePath });
    });
  }, [sessionId, pathname]);

  // 이벤트 추적
  const trackEvent = useCallback(
    (eventName: string, metadata?: Record<string, unknown>) => {
      if (!sessionId || typeof window === 'undefined') return;

      fetch('/api/analytics/event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          event_type: eventName,
          event_name: eventName,
          page_path: pathname || window.location.pathname,
          metadata: metadata || {},
        }),
      }).catch((error) => {
        clientLog.warn('이벤트 추적 실패', { error, eventName });
      });
    },
    [sessionId, pathname]
  );

  return (
    <AnalyticsContext.Provider value={{ sessionId, trackEvent, trackPageView }}>
      {children}
    </AnalyticsContext.Provider>
  );
}
