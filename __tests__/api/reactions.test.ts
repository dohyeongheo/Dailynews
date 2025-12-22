/**
 * reactions API 라우트 통합 테스트
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/news/[id]/reactions/route';

// 인증 모킹
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

// DB 모듈 모킹
jest.mock('@/lib/db/news-reactions', () => ({
  setNewsReaction: jest.fn(),
  getNewsReactionCounts: jest.fn(),
  getUserNewsReaction: jest.fn(),
}));

// Rate limiting 모킹
jest.mock('@/lib/utils/rate-limit-helper', () => ({
  applyRateLimit: jest.fn(() => null), // Rate limit 통과
  RATE_LIMIT_CONFIGS: {
    BOOKMARKS: { maxRequests: 30, windowMs: 60000 },
  },
}));

describe('API /api/news/[id]/reactions', () => {
  const mockSession = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('뉴스 반응 조회에 성공해야 함', async () => {
      const { auth } = await import('@/auth');
      (auth as jest.Mock).mockResolvedValueOnce(mockSession);

      const { getNewsReactionCounts, getUserNewsReaction } = await import('@/lib/db/news-reactions');
      (getNewsReactionCounts as jest.Mock).mockResolvedValueOnce({ likes: 10, dislikes: 2 });
      (getUserNewsReaction as jest.Mock).mockResolvedValueOnce('like');

      const request = new NextRequest('http://localhost:3000/api/news/news-123/reactions');
      const response = await GET(request, { params: { id: 'news-123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.counts).toEqual({ likes: 10, dislikes: 2 });
      expect(data.data.userReaction).toBe('like');
    });

    it('비로그인 사용자도 반응 조회가 가능해야 함', async () => {
      const { auth } = await import('@/auth');
      (auth as jest.Mock).mockResolvedValueOnce(null);

      const { getNewsReactionCounts } = await import('@/lib/db/news-reactions');
      (getNewsReactionCounts as jest.Mock).mockResolvedValueOnce({ likes: 10, dislikes: 2 });

      const request = new NextRequest('http://localhost:3000/api/news/news-123/reactions');
      const response = await GET(request, { params: { id: 'news-123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.userReaction).toBeNull();
    });
  });

  describe('POST', () => {
    it('뉴스 반응 설정에 성공해야 함', async () => {
      const { auth } = await import('@/auth');
      (auth as jest.Mock).mockResolvedValueOnce(mockSession);

      const { setNewsReaction, getNewsReactionCounts, getUserNewsReaction } = await import('@/lib/db/news-reactions');
      (setNewsReaction as jest.Mock).mockResolvedValueOnce(true);
      (getNewsReactionCounts as jest.Mock).mockResolvedValueOnce({ likes: 11, dislikes: 2 });
      (getUserNewsReaction as jest.Mock).mockResolvedValueOnce('like');

      const request = new NextRequest('http://localhost:3000/api/news/news-123/reactions', {
        method: 'POST',
        body: JSON.stringify({
          reactionType: 'like',
        }),
      });

      const response = await POST(request, { params: { id: 'news-123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.counts.likes).toBe(11);
    });

    it('인증되지 않은 사용자는 401 에러를 받아야 함', async () => {
      const { auth } = await import('@/auth');
      (auth as jest.Mock).mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/news/news-123/reactions', {
        method: 'POST',
        body: JSON.stringify({
          reactionType: 'like',
        }),
      });

      const response = await POST(request, { params: { id: 'news-123' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.type).toBe('AUTH_ERROR');
    });

    it('유효하지 않은 reactionType은 400 에러를 받아야 함', async () => {
      const { auth } = await import('@/auth');
      (auth as jest.Mock).mockResolvedValueOnce(mockSession);

      const request = new NextRequest('http://localhost:3000/api/news/news-123/reactions', {
        method: 'POST',
        body: JSON.stringify({
          reactionType: 'invalid',
        }),
      });

      const response = await POST(request, { params: { id: 'news-123' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });
});

