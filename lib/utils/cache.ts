/**
 * 캐싱 유틸리티 모듈
 * Redis 기반 캐싱 (Upstash Redis) + In-memory fallback
 */

import { Redis } from '@upstash/redis';

// Upstash Redis 클라이언트 초기화
let redis: Redis | null = null;

/**
 * Redis 클라이언트 가져오기
 */
function getRedisClient(): Redis | null {
  // 환경 변수가 설정되어 있지 않으면 null 반환
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
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
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const inMemoryStore = new Map<string, CacheEntry<unknown>>();

/**
 * 캐시 키 생성 (네임스페이스 포함)
 */
function createCacheKey(namespace: string, key: string): string {
  return `cache:${namespace}:${key}`;
}

/**
 * 캐시에서 값 가져오기
 */
export async function getCache<T>(namespace: string, key: string): Promise<T | null> {
  const cacheKey = createCacheKey(namespace, key);
  const client = getRedisClient();

  // Redis를 사용할 수 있으면 Redis에서 가져오기
  if (client) {
    try {
      const cached = await client.get<T>(cacheKey);
      return cached;
    } catch (error) {
      console.error('[Cache] Redis get error:', error);
      // Redis 에러 시 in-memory fallback
    }
  }

  // In-memory fallback
  const entry = inMemoryStore.get(cacheKey);
  if (!entry) {
    return null;
  }

  // 만료 확인
  if (Date.now() > entry.expiresAt) {
    inMemoryStore.delete(cacheKey);
    return null;
  }

  return entry.value as T;
}

/**
 * 캐시에 값 저장하기
 */
export async function setCache<T>(namespace: string, key: string, value: T, ttlSeconds: number = 60): Promise<void> {
  const cacheKey = createCacheKey(namespace, key);
  const client = getRedisClient();

  // Redis를 사용할 수 있으면 Redis에 저장
  if (client) {
    try {
      await client.setex(cacheKey, ttlSeconds, value);
      return;
    } catch (error) {
      console.error('[Cache] Redis set error:', error);
      // Redis 에러 시 in-memory fallback
    }
  }

  // In-memory fallback
  const expiresAt = Date.now() + ttlSeconds * 1000;
  inMemoryStore.set(cacheKey, {
    value,
    expiresAt,
  });

  // 메모리 누수 방지: 만료된 항목 정리 (5% 확률로 실행)
  if (Math.random() < 0.05) {
    cleanupExpiredEntries();
  }
}

/**
 * 캐시에서 값 삭제하기
 */
export async function deleteCache(namespace: string, key: string): Promise<void> {
  const cacheKey = createCacheKey(namespace, key);
  const client = getRedisClient();

  // Redis를 사용할 수 있으면 Redis에서 삭제
  if (client) {
    try {
      await client.del(cacheKey);
      return;
    } catch (error) {
      console.error('[Cache] Redis delete error:', error);
      // Redis 에러 시 in-memory fallback
    }
  }

  // In-memory fallback
  inMemoryStore.delete(cacheKey);
}

/**
 * 네임스페이스의 모든 캐시 삭제 (패턴 매칭)
 */
export async function invalidateNamespace(namespace: string): Promise<void> {
  const pattern = createCacheKey(namespace, '*');
  const client = getRedisClient();

  // Redis를 사용할 수 있으면
  if (client) {
    try {
      // Redis SCAN으로 패턴 매칭하는 키들 찾기
      const keys: string[] = [];
      let cursor = 0;

      do {
        const result = await client.scan(cursor, { match: pattern, count: 100 });
        cursor = result[0] as number;
        keys.push(...(result[1] as string[]));
      } while (cursor !== 0);

      // 찾은 키들 삭제
      if (keys.length > 0) {
        await client.del(...keys);
      }
      return;
    } catch (error) {
      console.error('[Cache] Redis invalidate namespace error:', error);
      // Redis 에러 시 in-memory fallback
    }
  }

  // In-memory fallback: 네임스페이스로 시작하는 모든 키 삭제
  const prefix = createCacheKey(namespace, '');
  for (const key of inMemoryStore.keys()) {
    if (key.startsWith(prefix)) {
      inMemoryStore.delete(key);
    }
  }
}

/**
 * 만료된 항목 정리 (in-memory fallback용)
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of inMemoryStore.entries()) {
    if (now > entry.expiresAt) {
      inMemoryStore.delete(key);
    }
  }
}

/**
 * 캐시 통계 가져오기 (디버깅용)
 */
export function getCacheStats(): { redis: boolean; inMemorySize: number } {
  return {
    redis: getRedisClient() !== null,
    inMemorySize: inMemoryStore.size,
  };
}

/**
 * 뉴스 관련 캐시 네임스페이스
 */
export const CACHE_NAMESPACES = {
  NEWS: 'news',
  NEWS_CATEGORY: 'news:category',
  NEWS_ID: 'news:id',
  NEWS_RELATED: 'news:related',
  COMMENTS: 'comments',
  COMMENTS_NEWS: 'comments:news',
} as const;

/**
 * 뉴스 캐시 무효화 헬퍼
 */
export async function invalidateNewsCache(newsId?: string): Promise<void> {
  if (newsId) {
    // 특정 뉴스 캐시 무효화
    await deleteCache(CACHE_NAMESPACES.NEWS_ID, newsId);
    await deleteCache(CACHE_NAMESPACES.NEWS_RELATED, newsId);
    // 카테고리별 캐시도 무효화 (카테고리를 모르므로 전체 무효화)
    await invalidateNamespace(CACHE_NAMESPACES.NEWS_CATEGORY);
  } else {
    // 모든 뉴스 캐시 무효화
    await invalidateNamespace(CACHE_NAMESPACES.NEWS);
  }
}

/**
 * 카테고리별 뉴스 캐시 무효화
 */
export async function invalidateCategoryCache(category: string): Promise<void> {
  await deleteCache(CACHE_NAMESPACES.NEWS_CATEGORY, category);
}

/**
 * 댓글 캐시 무효화
 */
export async function invalidateCommentCache(newsId: string): Promise<void> {
  await deleteCache(CACHE_NAMESPACES.COMMENTS_NEWS, newsId);
}

