import { getEnv, initEnv } from '@/lib/config/env';

describe('Environment Variables', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // 환경 변수 초기화
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should validate required environment variables', () => {
    process.env.GOOGLE_GEMINI_API_KEY = 'test-key';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

    expect(() => {
      initEnv();
      const env = getEnv();
      expect(env.GOOGLE_GEMINI_API_KEY).toBe('test-key');
    }).not.toThrow();
  });

  it('should throw error for missing required environment variables', () => {
    delete process.env.GOOGLE_GEMINI_API_KEY;

    expect(() => {
      initEnv();
    }).toThrow();
  });

  it('should validate URL format for Supabase URL', () => {
    process.env.GOOGLE_GEMINI_API_KEY = 'test-key';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'invalid-url';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

    expect(() => {
      initEnv();
    }).toThrow();
  });
});

