/**
 * 비회원 댓글 API 테스트
 */

import { POST, PATCH, DELETE } from "@/app/api/comments/route";
import { NextRequest } from "next/server";
import { createComment, verifyGuestCommentPassword } from "@/lib/db/comments";
import { auth } from "@/auth";

// Mock dependencies
jest.mock("@/lib/db/comments");
jest.mock("@/auth");
jest.mock("@/lib/utils/api-middleware", () => ({
  withRateLimit: (config: any) => (handler: any) => handler,
  withErrorHandling: (handler: any) => handler,
}));
jest.mock("@/lib/utils/rate-limit-helper", () => ({
  RATE_LIMIT_CONFIGS: {
    COMMENTS: {},
  },
}));
jest.mock("@/lib/utils/api-response", () => ({
  createSuccessResponse: (data: any, message?: string) => {
    return new Response(JSON.stringify({ success: true, data, message }), { status: 200 });
  },
  createErrorResponse: (error: any, status: number) => {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status });
  },
}));
jest.mock("@/lib/utils/api-helpers", () => ({
  parseJsonBody: async (req: NextRequest, schema?: any) => {
    const body = await req.json();
    return { data: body };
  },
  requireQueryParam: (req: NextRequest, key: string) => {
    const url = new URL(req.url);
    const value = url.searchParams.get(key);
    return value ? { value } : { value: "", error: new Response(JSON.stringify({ error: `${key} is required` }), { status: 400 }) };
  },
  requireResource: (resource: any, message: string) => {
    return resource ? { resource } : { resource: null, error: new Response(JSON.stringify({ error: message }), { status: 404 }) };
  },
}));

const mockCreateComment = createComment as jest.MockedFunction<typeof createComment>;
const mockVerifyPassword = verifyGuestCommentPassword as jest.MockedFunction<typeof verifyGuestCommentPassword>;
const mockAuth = auth as jest.MockedFunction<typeof auth>;

describe("비회원 댓글 API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue(null); // 비회원
  });

  describe("POST /api/comments - 비회원 댓글 작성", () => {
    it("비회원이 이름과 비밀번호로 댓글을 작성할 수 있어야 함", async () => {
      const mockComment = {
        id: "comment-1",
        news_id: "news-1",
        user_id: null,
        guest_name: "테스트",
        content: "비회원 댓글",
        created_at: new Date().toISOString(),
      };

      mockCreateComment.mockResolvedValue(mockComment as any);

      const request = new NextRequest("http://localhost/api/comments", {
        method: "POST",
        body: JSON.stringify({
          newsId: "news-1",
          content: "비회원 댓글",
          guestName: "테스트",
          password: "1234",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockCreateComment).toHaveBeenCalledWith("news-1", null, "비회원 댓글", "테스트", "1234");
    });

    it("비회원이 이름 없이 댓글을 작성하면 에러가 발생해야 함", async () => {
      const request = new NextRequest("http://localhost/api/comments", {
        method: "POST",
        body: JSON.stringify({
          newsId: "news-1",
          content: "비회원 댓글",
          password: "1234",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("이름");
    });

    it("비회원이 비밀번호 없이 댓글을 작성하면 에러가 발생해야 함", async () => {
      const request = new NextRequest("http://localhost/api/comments", {
        method: "POST",
        body: JSON.stringify({
          newsId: "news-1",
          content: "비회원 댓글",
          guestName: "테스트",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("비밀번호");
    });

    it("비밀번호가 4자리 숫자가 아니면 에러가 발생해야 함", async () => {
      const request = new NextRequest("http://localhost/api/comments", {
        method: "POST",
        body: JSON.stringify({
          newsId: "news-1",
          content: "비회원 댓글",
          guestName: "테스트",
          password: "123",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("4자리 숫자");
    });
  });

  describe("PATCH /api/comments - 비회원 댓글 수정", () => {
    it("비회원이 올바른 비밀번호로 댓글을 수정할 수 있어야 함", async () => {
      const mockComment = {
        id: "comment-1",
        news_id: "news-1",
        user_id: null,
        guest_name: "테스트",
        content: "수정된 댓글",
        created_at: new Date().toISOString(),
      };

      jest.spyOn(require("@/lib/db/comments"), "getCommentById").mockResolvedValue(mockComment as any);
      jest.spyOn(require("@/lib/db/comments"), "updateComment").mockResolvedValue(mockComment as any);
      mockVerifyPassword.mockResolvedValue(true);

      const request = new NextRequest("http://localhost/api/comments", {
        method: "PATCH",
        body: JSON.stringify({
          commentId: "comment-1",
          content: "수정된 댓글",
          password: "1234",
        }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockVerifyPassword).toHaveBeenCalledWith("comment-1", "1234");
    });

    it("비회원이 잘못된 비밀번호로 댓글을 수정하면 에러가 발생해야 함", async () => {
      const mockComment = {
        id: "comment-1",
        news_id: "news-1",
        user_id: null,
        guest_name: "테스트",
        content: "원본 댓글",
        created_at: new Date().toISOString(),
      };

      jest.spyOn(require("@/lib/db/comments"), "getCommentById").mockResolvedValue(mockComment as any);
      mockVerifyPassword.mockResolvedValue(false);

      const request = new NextRequest("http://localhost/api/comments", {
        method: "PATCH",
        body: JSON.stringify({
          commentId: "comment-1",
          content: "수정된 댓글",
          password: "9999",
        }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain("비밀번호");
    });
  });

  describe("DELETE /api/comments - 비회원 댓글 삭제", () => {
    it("비회원이 올바른 비밀번호로 댓글을 삭제할 수 있어야 함", async () => {
      const mockComment = {
        id: "comment-1",
        news_id: "news-1",
        user_id: null,
        guest_name: "테스트",
        content: "삭제될 댓글",
        created_at: new Date().toISOString(),
      };

      jest.spyOn(require("@/lib/db/comments"), "getCommentById").mockResolvedValue(mockComment as any);
      jest.spyOn(require("@/lib/db/comments"), "deleteComment").mockResolvedValue(undefined);
      mockVerifyPassword.mockResolvedValue(true);

      const request = new NextRequest("http://localhost/api/comments?commentId=comment-1", {
        method: "DELETE",
        body: JSON.stringify({
          password: "1234",
        }),
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockVerifyPassword).toHaveBeenCalledWith("comment-1", "1234");
    });
  });
});

