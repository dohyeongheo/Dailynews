/**
 * Rate Limiting 유틸리티
 * 메모리 기반 간단한 Rate Limiter 구현
 */

interface RateLimitStore {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitStore>();

/**
 * Rate Limiting 체크
 * @param identifier 요청 식별자 (IP 주소 등)
 * @param maxRequests 최대 요청 수
 * @param windowMs 시간 윈도우 (밀리초)
 * @returns rate limit 초과 여부
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000 // 기본 1분
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;

  // 기존 레코드 확인
  const record = store.get(key);

  if (!record || now > record.resetTime) {
    // 새 레코드 생성 또는 리셋
    const resetTime = now + windowMs;
    store.set(key, {
      count: 1,
      resetTime,
    });

    // 오래된 레코드 정리 (메모리 누수 방지)
    cleanupExpiredRecords(now);

    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime,
    };
  }

  // 카운트 증가
  record.count += 1;

  if (record.count > maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * 만료된 레코드 정리
 */
function cleanupExpiredRecords(now: number): void {
  // 주기적으로 정리 (10% 확률로 실행하여 성능 영향 최소화)
  if (Math.random() < 0.1) {
    for (const [key, record] of store.entries()) {
      if (now > record.resetTime) {
        store.delete(key);
      }
    }
  }
}

/**
 * Rate Limit 정보 초기화 (테스트용)
 */
export function clearRateLimitStore(): void {
  store.clear();
}

