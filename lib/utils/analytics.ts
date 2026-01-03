/**
 * 웹 분석(Web Analytics) 유틸리티 함수
 */

import type { DeviceInfo } from '@/lib/types/analytics';

/**
 * 세션 ID 생성
 * 브라우저 로컬 스토리지에 저장하여 재방문 시 동일한 세션 유지
 */
export function generateSessionId(): string {
  if (typeof window === 'undefined') {
    // 서버 사이드에서는 랜덤 UUID 생성
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  // 클라이언트 사이드: 로컬 스토리지에서 기존 세션 ID 확인
  const storageKey = 'analytics_session_id';
  const existingSessionId = localStorage.getItem(storageKey);

  if (existingSessionId) {
    // 세션 만료 시간 확인 (30분)
    const sessionData = JSON.parse(existingSessionId);
    const now = Date.now();
    const sessionTimeout = 30 * 60 * 1000; // 30분

    if (now - sessionData.created_at < sessionTimeout) {
      return sessionData.id;
    }
  }

  // 새 세션 ID 생성
  const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  localStorage.setItem(
    storageKey,
    JSON.stringify({
      id: newSessionId,
      created_at: Date.now(),
    })
  );

  return newSessionId;
}

/**
 * 세션 ID 가져오기 (없으면 생성)
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') {
    return generateSessionId();
  }

  const storageKey = 'analytics_session_id';
  const existingSessionId = localStorage.getItem(storageKey);

  if (existingSessionId) {
    try {
      const sessionData = JSON.parse(existingSessionId);
      return sessionData.id;
    } catch {
      // 파싱 실패 시 새로 생성
      return generateSessionId();
    }
  }

  return generateSessionId();
}

/**
 * User Agent에서 디바이스 정보 파싱
 */
export function parseDeviceInfo(userAgent: string | null): DeviceInfo {
  if (!userAgent) {
    return {
      device_type: null,
      browser: null,
      os: null,
      screen_width: typeof window !== 'undefined' ? window.screen.width : null,
      screen_height: typeof window !== 'undefined' ? window.screen.height : null,
    };
  }

  const ua = userAgent.toLowerCase();

  // 디바이스 타입 감지
  let device_type: 'desktop' | 'mobile' | 'tablet' | null = null;
  if (ua.includes('tablet') || ua.includes('ipad')) {
    device_type = 'tablet';
  } else if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    device_type = 'mobile';
  } else {
    device_type = 'desktop';
  }

  // 브라우저 감지
  let browser: string | null = null;
  if (ua.includes('chrome') && !ua.includes('edg')) {
    browser = 'Chrome';
  } else if (ua.includes('firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'Safari';
  } else if (ua.includes('edg')) {
    browser = 'Edge';
  } else if (ua.includes('opera') || ua.includes('opr')) {
    browser = 'Opera';
  }

  // 운영체제 감지
  let os: string | null = null;
  if (ua.includes('windows')) {
    os = 'Windows';
  } else if (ua.includes('mac os') || ua.includes('macos')) {
    os = 'macOS';
  } else if (ua.includes('linux')) {
    os = 'Linux';
  } else if (ua.includes('android')) {
    os = 'Android';
  } else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) {
    os = 'iOS';
  }

  // 화면 크기 (클라이언트 사이드에서만 가능)
  const screen_width = typeof window !== 'undefined' ? window.screen.width : null;
  const screen_height = typeof window !== 'undefined' ? window.screen.height : null;

  return {
    device_type,
    browser,
    os,
    screen_width,
    screen_height,
  };
}

/**
 * IP 주소 해시화 (개인정보 보호)
 * 마지막 옥텟을 제거하여 개인정보 보호
 */
export function hashIpAddress(ip: string | null): string | null {
  if (!ip) return null;

  // IPv4 주소 처리
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    }
  }

  // IPv6 주소 처리 (간단한 해시)
  if (ip.includes(':')) {
    // IPv6는 전체 해시 처리
    return '::0';
  }

  return ip;
}

/**
 * Referrer 정규화
 */
export function normalizeReferrer(referrer: string | null): string | null {
  if (!referrer) return null;

  try {
    const url = new URL(referrer);
    // 같은 도메인인 경우 null 반환
    if (typeof window !== 'undefined' && url.hostname === window.location.hostname) {
      return null;
    }
    return referrer;
  } catch {
    return referrer;
  }
}

/**
 * 페이지 경로 정규화
 */
export function normalizePagePath(path: string): string {
  // 쿼리 파라미터 제거 (선택사항)
  // 예: /news/123?utm_source=google -> /news/123
  try {
    const url = new URL(path, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    return url.pathname;
  } catch {
    return path;
  }
}

/**
 * 클라이언트 사이드에서 수집 가능한 정보 가져오기
 */
export function getClientInfo(): {
  user_agent: string;
  screen_width: number;
  screen_height: number;
  referrer: string | null;
} {
  if (typeof window === 'undefined') {
    return {
      user_agent: '',
      screen_width: 0,
      screen_height: 0,
      referrer: null,
    };
  }

  return {
    user_agent: navigator.userAgent,
    screen_width: window.screen.width,
    screen_height: window.screen.height,
    referrer: normalizeReferrer(document.referrer),
  };
}






