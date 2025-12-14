import { GET, POST, PATCH, DELETE } from "@/app/api/comments/route";
import { NextRequest } from "next/server";

// Mock dependencies
jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/db/comments", () => ({
  getCommentsByNewsId: jest.fn(),
  createComment: jest.fn(),
  updateComment: jest.fn(),
  deleteComment: jest.fn(),
  getCommentById: jest.fn(),
}));

jest.mock("@/lib/utils/rate-limit-helper", () => ({
  applyRateLimit: jest.fn().mockResolvedValue(null),
  RATE_LIMIT_CONFIGS: {
    COMMENTS: { maxRequests: 20, windowMs: 60000 },
  },
}));

// Mock NextRequest
jest.mock("next/server", () => ({
  NextRequest: class MockNextRequest {
    url: string;
    method: string;
    headers: Headers;
    body: string | null;

    constructor(input: string | Request, init?: RequestInit) {
      const url = typeof input === "string" ? input : input.url;
      this.url = url;
      this.method = init?.method || "GET";
      this.headers = new Headers(init?.headers);
      this.body = (init?.body as string) || null;
    }

    async json() {
      return this.body ? JSON.parse(this.body) : {};
    }

    async text() {
      return this.body || "";
    }
  },
  NextResponse: {
    json: jest.fn((body, init) => ({
      json: async () => body,
      status: init?.status || 200,
      headers: new Headers(init?.headers),
    })),
  },
}));

describe("댓글 API", () => {
  const mockSession = {
    user: {
      id: "user1",
      email: "test@example.com",
      name: "Test User",
      role: "user",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const { auth } = require("@/auth");
    auth.mockResolvedValue(mockSession);
  });

  describe("GET /api/comments", () => {
    it("댓글 목록 조회 성공", async () => {
      const { getCommentsByNewsId } = require("@/lib/db/comments");
      getCommentsByNewsId.mockResolvedValue([
        {
          id: "1",
          content: "Test comment",
          news_id: "news1",
          user_id: "user1",
          created_at: "2024-01-01",
        },
      ]);

      const request = new NextRequest("http://localhost:3000/api/comments?newsId=news1");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.comments).toBeDefined();
      expect(Array.isArray(data.comments)).toBe(true);
    });
  });

  describe("POST /api/comments", () => {
    it("댓글 작성 성공", async () => {
      const { createComment } = require("@/lib/db/comments");
      createComment.mockResolvedValue({
        id: "1",
        content: "New comment",
        news_id: "news1",
        user_id: "user1",
      });

      const request = new NextRequest("http://localhost:3000/api/comments", {
        method: "POST",
        body: JSON.stringify({ newsId: "news1", content: "New comment" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.comment).toBeDefined();
    });

    it("로그인하지 않은 사용자는 401 반환", async () => {
      const { auth } = require("@/auth");
      auth.mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/comments", {
        method: "POST",
        body: JSON.stringify({ newsId: "news1", content: "Comment" }),
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });
  });

  describe("PATCH /api/comments", () => {
    it("댓글 수정 성공 (작성자 본인)", async () => {
      const { getCommentById, updateComment } = require("@/lib/db/comments");
      getCommentById.mockResolvedValue({
        id: "1",
        content: "Old comment",
        news_id: "news1",
        user_id: "user1",
      });
      updateComment.mockResolvedValue({
        id: "1",
        content: "Updated comment",
        news_id: "news1",
        user_id: "user1",
      });

      const request = new NextRequest("http://localhost:3000/api/comments", {
        method: "PATCH",
        body: JSON.stringify({ commentId: "1", content: "Updated comment" }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.comment).toBeDefined();
      expect(data.comment.content).toBe("Updated comment");
    });

    it("다른 사용자의 댓글 수정 시 403 반환", async () => {
      const { getCommentById } = require("@/lib/db/comments");
      getCommentById.mockResolvedValue({
        id: "1",
        content: "Old comment",
        news_id: "news1",
        user_id: "other_user",
      });

      const request = new NextRequest("http://localhost:3000/api/comments", {
        method: "PATCH",
        body: JSON.stringify({ commentId: "1", content: "Updated comment" }),
      });

      const response = await PATCH(request);

      expect(response.status).toBe(403);
    });
  });

  describe("DELETE /api/comments", () => {
    it("댓글 삭제 성공 (작성자 본인)", async () => {
      const { getCommentById, deleteComment } = require("@/lib/db/comments");
      getCommentById.mockResolvedValue({
        id: "1",
        news_id: "news1",
        user_id: "user1",
      });
      deleteComment.mockResolvedValue(undefined);

      const request = new NextRequest("http://localhost:3000/api/comments?commentId=1", {
        method: "DELETE",
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("관리자는 모든 댓글 삭제 가능", async () => {
      const { auth } = require("@/auth");
      auth.mockResolvedValue({
        user: {
          id: "admin1",
          role: "admin",
        },
      });

      const { getCommentById, deleteComment } = require("@/lib/db/comments");
      getCommentById.mockResolvedValue({
        id: "1",
        news_id: "news1",
        user_id: "user1",
      });
      deleteComment.mockResolvedValue(undefined);

      const request = new NextRequest("http://localhost:3000/api/comments?commentId=1", {
        method: "DELETE",
      });

      const response = await DELETE(request);

      expect(response.status).toBe(200);
    });
  });
});
