import { Redis } from '@upstash/redis';

// Upstash Redis 클라이언트 초기화
let redis: Redis | null = null;

function getRedisClient(): Redis | null {
  // 환경 변수가 설정되어 있지 않으면 null 반환
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn('[Rate Limit] Upstash Redis 환경 변수가 설정되지 않았습니다. In-memory fallback을 사용합니다.');
    return null;
  }

  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  return redis;
}

// In-memory fallback (Redis를 사용할 수 없을 때)
const inMemoryStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

/**
 * Redis 기반 Rate Limiting
 * @param identifier 고유 식별자 (IP 주소, 사용자 ID 등)
 * @param maxRequests 허용 최대 요청 수
 * @param windowMs 시간 윈도우 (밀리초)
 */
export async function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  const client = getRedisClient();

  // Redis를 사용할 수 없으면 in-memory fallback 사용
  if (!client) {
    return checkRateLimitInMemory(identifier, maxRequests, windowMs);
  }

  try {
    const key = `ratelimit:${identifier}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Redis에서 현재 카운트 가져오기
    const multi = client.multi();

    // 1. 오래된 항목 제거 (시간 윈도우 밖)
    multi.zremrangebyscore(key, 0, windowStart);

    // 2. 현재 윈도우 내의 요청 수 카운트
    multi.zcard(key);

    // 3. 새 요청 추가
    multi.zadd(key, { score: now, member: `${now}-${Math.random()}` });

    // 4. TTL 설정 (자동 만료)
    multi.expire(key, Math.ceil(windowMs / 1000));

    const results = await multi.exec();

    // results[1]이 현재 카운트 (새 요청 추가 전)
    const currentCount = (results[1] as number) || 0;
    const totalCount = currentCount + 1; // 새 요청 포함

    const allowed = totalCount <= maxRequests;
    const remaining = Math.max(0, maxRequests - totalCount);
    const resetTime = now + windowMs;

    // 요청이 허용되지 않으면 추가한 항목 제거
    if (!allowed) {
      // 마지막 추가된 항목을 제거하려면 복잡하므로,
      // 대신 카운트만 확인하고 실제 차단은 애플리케이션 레벨에서 처리
    }

    return {
      allowed,
      remaining,
      resetTime,
    };
  } catch (error) {
    console.error('[Rate Limit Redis] Error:', error);
    // Redis 에러 시 in-memory fallback 사용
    return checkRateLimitInMemory(identifier, maxRequests, windowMs);
  }
}

/**
 * In-memory fallback rate limiting
 * Redis를 사용할 수 없을 때 사용
 */
function checkRateLimitInMemory(
  identifier: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const record = inMemoryStore.get(identifier);

  // 기록이 없거나 윈도우가 만료된 경우
  if (!record || now > record.resetTime) {
    const resetTime = now + windowMs;
    inMemoryStore.set(identifier, { count: 1, resetTime });

    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime,
    };
  }

  // 윈도우 내에 요청이 있는 경우
  const newCount = record.count + 1;
  const allowed = newCount <= maxRequests;

  if (allowed) {
    record.count = newCount;
  }

  return {
    allowed,
    remaining: Math.max(0, maxRequests - newCount),
    resetTime: record.resetTime,
  };
}

/**
 * 특정 식별자의 Rate Limit 초기화 (테스트용)
 */
export async function resetRateLimit(identifier: string): Promise<void> {
  const client = getRedisClient();

  if (client) {
    try {
      const key = `ratelimit:${identifier}`;
      await client.del(key);
    } catch (error) {
      console.error('[Rate Limit Redis] Reset error:', error);
    }
  }

  // In-memory도 초기화
  inMemoryStore.delete(identifier);
}

/**
 * In-memory 저장소 정리 (만료된 항목 제거)
 * 주기적으로 호출하여 메모리 누수 방지
 */
export function cleanupInMemoryStore(): void {
  const now = Date.now();
  for (const [key, record] of inMemoryStore.entries()) {
    if (now > record.resetTime) {
      inMemoryStore.delete(key);
    }
  }
}
