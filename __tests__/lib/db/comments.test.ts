/**
 * comments 모듈 테스트
 */

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: [], error: null })),
          single: jest.fn(),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  })),
}));

describe("comments", () => {
  const mockComment = {
    id: "comment-123",
    news_id: "news-123",
    user_id: "user-123",
    content: "Test comment",
    created_at: "2025-01-15T00:00:00Z",
    updated_at: "2025-01-15T00:00:00Z",
    user: {
      id: "user-123",
      name: "Test User",
      email: "test@example.com",
      role: "user",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createComment", () => {
    it("댓글 생성에 성공해야 함", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      const mockClient = createClient();
      const mockFrom = mockClient.from as jest.Mock;
      const mockInsert = mockFrom().insert as jest.Mock;
      const mockSelect = mockInsert().select as jest.Mock;
      mockSelect().single.mockResolvedValueOnce({ data: mockComment, error: null });

      const { createComment } = await import("@/lib/db/comments");
      const result = await createComment("news-123", "user-123", "Test comment");

      expect(result).toEqual(mockComment);
      expect(mockFrom).toHaveBeenCalledWith("comments");
    });

    it("데이터베이스 오류 시 에러를 throw해야 함", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      const mockClient = createClient();
      const mockFrom = mockClient.from as jest.Mock;
      const mockInsert = mockFrom().insert as jest.Mock;
      const mockSelect = mockInsert().select as jest.Mock;
      mockSelect().single.mockResolvedValueOnce({
        data: null,
        error: { message: "Database error" },
      });

      const { createComment } = await import("@/lib/db/comments");

      await expect(createComment("news-123", "user-123", "Test comment")).rejects.toEqual({
        message: "Database error",
      });
    });
  });

  describe("getCommentsByNewsId", () => {
    it("뉴스 ID로 댓글 목록을 조회해야 함", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      const mockClient = createClient();
      const mockFrom = mockClient.from as jest.Mock;
      const mockSelect = mockFrom().select as jest.Mock;
      mockSelect()
        .eq()
        .order.mockResolvedValueOnce({
          data: [mockComment],
          error: null,
        });

      const { getCommentsByNewsId } = await import("@/lib/db/comments");
      const result = await getCommentsByNewsId("news-123");

      expect(result).toEqual([mockComment]);
      expect(mockSelect).toHaveBeenCalled();
    });

    it("댓글이 없으면 빈 배열을 반환해야 함", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      const mockClient = createClient();
      const mockFrom = mockClient.from as jest.Mock;
      const mockSelect = mockFrom().select as jest.Mock;
      mockSelect().eq().order.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const { getCommentsByNewsId } = await import("@/lib/db/comments");
      const result = await getCommentsByNewsId("news-123");

      expect(result).toEqual([]);
    });
  });

  describe("getCommentById", () => {
    it("댓글 ID로 댓글을 조회해야 함", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      const mockClient = createClient();
      const mockFrom = mockClient.from as jest.Mock;
      const mockSelect = mockFrom().select as jest.Mock;
      mockSelect().eq().single.mockResolvedValueOnce({
        data: mockComment,
        error: null,
      });

      const { getCommentById } = await import("@/lib/db/comments");
      const result = await getCommentById("comment-123");

      expect(result).toEqual(mockComment);
    });

    it("댓글이 없으면 null을 반환해야 함", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      const mockClient = createClient();
      const mockFrom = mockClient.from as jest.Mock;
      const mockSelect = mockFrom().select as jest.Mock;
      mockSelect()
        .eq()
        .single.mockResolvedValueOnce({
          data: null,
          error: { code: "PGRST116" }, // Not found error code
        });

      const { getCommentById } = await import("@/lib/db/comments");
      const result = await getCommentById("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("updateComment", () => {
    it("댓글 수정에 성공해야 함", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      const mockClient = createClient();
      const mockFrom = mockClient.from as jest.Mock;
      const mockUpdate = mockFrom().update as jest.Mock;
      const updatedComment = { ...mockComment, content: "Updated comment" };
      mockUpdate().eq().select().single.mockResolvedValueOnce({
        data: updatedComment,
        error: null,
      });

      const { updateComment } = await import("@/lib/db/comments");
      const result = await updateComment("comment-123", "Updated comment");

      expect(result.content).toBe("Updated comment");
    });
  });

  describe("deleteComment", () => {
    it("댓글 삭제에 성공해야 함", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      const mockClient = createClient();
      const mockFrom = mockClient.from as jest.Mock;
      const mockDelete = mockFrom().delete as jest.Mock;
      mockDelete().eq.mockResolvedValueOnce({ error: null });

      const { deleteComment } = await import("@/lib/db/comments");

      await expect(deleteComment("comment-123")).resolves.not.toThrow();
    });

    it("삭제 오류 시 에러를 throw해야 함", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      const mockClient = createClient();
      const mockFrom = mockClient.from as jest.Mock;
      const mockDelete = mockFrom().delete as jest.Mock;
      mockDelete().eq.mockResolvedValueOnce({
        error: { message: "Delete failed" },
      });

      const { deleteComment } = await import("@/lib/db/comments");

      await expect(deleteComment("comment-123")).rejects.toEqual({
        message: "Delete failed",
      });
    });
  });
});
