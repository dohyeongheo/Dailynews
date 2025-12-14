import { GET, POST, DELETE } from "@/app/api/bookmarks/route";
import { NextRequest } from "next/server";

// Mock dependencies
jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/db/bookmarks", () => ({
  getUserBookmarks: jest.fn(),
  addBookmark: jest.fn(),
  removeBookmark: jest.fn(),
  isBookmarked: jest.fn(),
}));

jest.mock("@/lib/utils/rate-limit-helper", () => ({
  applyRateLimit: jest.fn().mockResolvedValue(null),
  RATE_LIMIT_CONFIGS: {
    BOOKMARKS: { maxRequests: 30, windowMs: 60000 },
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

describe("북마크 API", () => {
  const mockSession = {
    user: {
      id: "user1",
      email: "test@example.com",
      name: "Test User",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const { auth } = require("@/auth");
    auth.mockResolvedValue(mockSession);
  });

  describe("GET /api/bookmarks", () => {
    it("북마크 목록 조회 성공", async () => {
      const { getUserBookmarks } = require("@/lib/db/bookmarks");
      getUserBookmarks.mockResolvedValue([{ id: "1", news_id: "news1", created_at: "2024-01-01" }]);

      const request = new NextRequest("http://localhost:3000/api/bookmarks");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.bookmarks).toBeDefined();
      expect(Array.isArray(data.bookmarks)).toBe(true);
    });

    it("로그인하지 않은 사용자는 401 반환", async () => {
      const { auth } = require("@/auth");
      auth.mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/bookmarks");
      const response = await GET(request);

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/bookmarks", () => {
    it("북마크 추가 성공", async () => {
      const { addBookmark, isBookmarked } = require("@/lib/db/bookmarks");
      isBookmarked.mockResolvedValue(false);
      addBookmark.mockResolvedValue({ id: "1" });

      const request = new NextRequest("http://localhost:3000/api/bookmarks", {
        method: "POST",
        body: JSON.stringify({ newsId: "news1" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("이미 북마크된 뉴스는 400 반환", async () => {
      const { isBookmarked } = require("@/lib/db/bookmarks");
      isBookmarked.mockResolvedValue(true);

      const request = new NextRequest("http://localhost:3000/api/bookmarks", {
        method: "POST",
        body: JSON.stringify({ newsId: "news1" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("이미 북마크된");
    });
  });

  describe("DELETE /api/bookmarks", () => {
    it("북마크 삭제 성공", async () => {
      const { removeBookmark } = require("@/lib/db/bookmarks");
      removeBookmark.mockResolvedValue(undefined);

      const request = new NextRequest("http://localhost:3000/api/bookmarks?newsId=news1", {
        method: "DELETE",
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
