import { POST } from "@/app/api/auth/register/route";
import { NextRequest } from "next/server";

// Mock dependencies
jest.mock("@/lib/db/users", () => ({
  createUser: jest.fn(),
  getUserByEmail: jest.fn(),
}));

jest.mock("@/lib/utils/rate-limit-helper", () => ({
  applyRateLimit: jest.fn().mockResolvedValue(null),
  RATE_LIMIT_CONFIGS: {
    REGISTER: { maxRequests: 5, windowMs: 60000 },
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

describe("회원가입 API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("유효한 데이터로 회원가입 성공", async () => {
    const { createUser, getUserByEmail } = require("@/lib/db/users");
    getUserByEmail.mockResolvedValue(null);
    createUser.mockResolvedValue({
      id: "1",
      email: "test@example.com",
      name: "Test User",
    });

    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.user.email).toBe("test@example.com");
  });

  it("이미 존재하는 이메일로 회원가입 시도 시 실패", async () => {
    const { getUserByEmail } = require("@/lib/db/users");
    getUserByEmail.mockResolvedValue({
      id: "1",
      email: "test@example.com",
      name: "Existing User",
    });

    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("이미 사용 중인 이메일");
  });

  it("유효하지 않은 이메일 형식 시 실패", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "invalid-email",
        password: "password123",
        name: "Test User",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it("비밀번호가 8자 미만일 때 실패", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "short",
        name: "Test User",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });
});
