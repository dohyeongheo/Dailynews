/**
 * comments API 라우트 통합 테스트
 */

import { NextRequest } from 'next/server';
import { GET, POST, PATCH, DELETE } from '@/app/api/comments/route';

// 인증 모킹
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

// DB 모듈 모킹
jest.mock('@/lib/db/comments', () => ({
  createComment: jest.fn(),
  getCommentsByNewsId: jest.fn(),
  getCommentById: jest.fn(),
  updateComment: jest.fn(),
  deleteComment: jest.fn(),
}));

// Rate limiting 모킹
jest.mock('@/lib/utils/rate-limit-helper', () => ({
  applyRateLimit: jest.fn(() => null), // Rate limit 통과
  RATE_LIMIT_CONFIGS: {
    COMMENTS: { maxRequests: 20, windowMs: 60000 },
  },
}));

describe('API /api/comments', () => {
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
    it('뉴스 ID로 댓글 목록을 조회해야 함', async () => {
      const { getCommentsByNewsId } = await import('@/lib/db/comments');
      const mockComments = [
        {
          id: 'comment-1',
          news_id: 'news-123',
          user_id: 'user-123',
          content: 'Test comment',
          created_at: '2025-01-15T00:00:00Z',
        },
      ];
      (getCommentsByNewsId as jest.Mock).mockResolvedValueOnce(mockComments);

      const request = new NextRequest('http://localhost:3000/api/comments?newsId=news-123');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.comments).toEqual(mockComments);
    });

    it('newsId가 없으면 400 에러를 반환해야 함', async () => {
      const request = new NextRequest('http://localhost:3000/api/comments');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('POST', () => {
    it('댓글 생성에 성공해야 함', async () => {
      const { auth } = await import('@/auth');
      (auth as jest.Mock).mockResolvedValueOnce(mockSession);

      const { createComment } = await import('@/lib/db/comments');
      const mockComment = {
        id: 'comment-123',
        news_id: 'news-123',
        user_id: 'user-123',
        content: 'New comment',
        created_at: '2025-01-15T00:00:00Z',
      };
      (createComment as jest.Mock).mockResolvedValueOnce(mockComment);

      const request = new NextRequest('http://localhost:3000/api/comments', {
        method: 'POST',
        body: JSON.stringify({
          newsId: 'news-123',
          content: 'New comment',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.comment).toEqual(mockComment);
    });

    it('인증되지 않은 사용자는 401 에러를 받아야 함', async () => {
      const { auth } = await import('@/auth');
      (auth as jest.Mock).mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/comments', {
        method: 'POST',
        body: JSON.stringify({
          newsId: 'news-123',
          content: 'New comment',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.type).toBe('AUTH_ERROR');
    });
  });

  describe('PATCH', () => {
    it('댓글 수정에 성공해야 함', async () => {
      const { auth } = await import('@/auth');
      (auth as jest.Mock).mockResolvedValueOnce(mockSession);

      const { getCommentById, updateComment } = await import('@/lib/db/comments');
      const mockComment = {
        id: 'comment-123',
        news_id: 'news-123',
        user_id: 'user-123',
        content: 'Original comment',
      };
      const updatedComment = {
        ...mockComment,
        content: 'Updated comment',
      };

      (getCommentById as jest.Mock).mockResolvedValueOnce(mockComment);
      (updateComment as jest.Mock).mockResolvedValueOnce(updatedComment);

      const request = new NextRequest('http://localhost:3000/api/comments', {
        method: 'PATCH',
        body: JSON.stringify({
          commentId: 'comment-123',
          content: 'Updated comment',
        }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.comment.content).toBe('Updated comment');
    });

    it('작성자가 아닌 사용자는 403 에러를 받아야 함', async () => {
      const { auth } = await import('@/auth');
      (auth as jest.Mock).mockResolvedValueOnce(mockSession);

      const { getCommentById } = await import('@/lib/db/comments');
      const mockComment = {
        id: 'comment-123',
        news_id: 'news-123',
        user_id: 'other-user-123', // 다른 사용자
        content: 'Original comment',
      };

      (getCommentById as jest.Mock).mockResolvedValueOnce(mockComment);

      const request = new NextRequest('http://localhost:3000/api/comments', {
        method: 'PATCH',
        body: JSON.stringify({
          commentId: 'comment-123',
          content: 'Updated comment',
        }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });
  });

  describe('DELETE', () => {
    it('댓글 삭제에 성공해야 함', async () => {
      const { auth } = await import('@/auth');
      (auth as jest.Mock).mockResolvedValueOnce(mockSession);

      const { getCommentById, deleteComment } = await import('@/lib/db/comments');
      const mockComment = {
        id: 'comment-123',
        news_id: 'news-123',
        user_id: 'user-123',
      };

      (getCommentById as jest.Mock).mockResolvedValueOnce(mockComment);
      (deleteComment as jest.Mock).mockResolvedValueOnce(undefined);

      const request = new NextRequest('http://localhost:3000/api/comments?commentId=comment-123', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
