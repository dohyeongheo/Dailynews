import { checkRateLimit, clearRateLimitStore } from '@/lib/utils/rate-limit';

describe('Rate Limiting', () => {
  beforeEach(() => {
    clearRateLimitStore();
  });

  it('should allow requests within limit', () => {
    const identifier = 'test-ip-1';
    const maxRequests = 5;
    const windowMs = 60000;

    for (let i = 0; i < maxRequests; i++) {
      const result = checkRateLimit(identifier, maxRequests, windowMs);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(maxRequests - i - 1);
    }
  });

  it('should block requests exceeding limit', () => {
    const identifier = 'test-ip-2';
    const maxRequests = 3;
    const windowMs = 60000;

    // 최대 요청 수만큼 허용
    for (let i = 0; i < maxRequests; i++) {
      checkRateLimit(identifier, maxRequests, windowMs);
    }

    // 초과 요청은 차단
    const result = checkRateLimit(identifier, maxRequests, windowMs);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('should reset after window expires', (done) => {
    const identifier = 'test-ip-3';
    const maxRequests = 2;
    const windowMs = 100; // 100ms

    // 최대 요청 수만큼 사용
    checkRateLimit(identifier, maxRequests, windowMs);
    checkRateLimit(identifier, maxRequests, windowMs);

    // 초과 요청 차단 확인
    const blocked = checkRateLimit(identifier, maxRequests, windowMs);
    expect(blocked.allowed).toBe(false);

    // 윈도우가 만료된 후 다시 허용되는지 확인
    setTimeout(() => {
      const result = checkRateLimit(identifier, maxRequests, windowMs);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(maxRequests - 1);
      done();
    }, windowMs + 10);
  });
});

