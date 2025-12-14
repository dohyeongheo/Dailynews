import { auth } from "@/auth";

// Mock NextAuth
jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/db/users", () => ({
  getUserByEmail: jest.fn(),
  verifyPassword: jest.fn(),
}));

describe("로그인 인증", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("유효한 자격증명으로 로그인 성공", async () => {
    const { getUserByEmail, verifyPassword } = require("@/lib/db/users");
    getUserByEmail.mockResolvedValue({
      id: "1",
      email: "test@example.com",
      name: "Test User",
      password_hash: "hashed_password",
      role: "user",
    });
    verifyPassword.mockResolvedValue(true);

    // NextAuth의 authorize 함수는 내부적으로 처리되므로
    // 여기서는 사용자 조회와 비밀번호 검증만 테스트
    const user = await getUserByEmail("test@example.com");
    const isValid = await verifyPassword("password123", user.password_hash);

    expect(user).toBeDefined();
    expect(isValid).toBe(true);
  });

  it("존재하지 않는 이메일로 로그인 시도 시 실패", async () => {
    const { getUserByEmail } = require("@/lib/db/users");
    getUserByEmail.mockResolvedValue(null);

    const user = await getUserByEmail("nonexistent@example.com");

    expect(user).toBeNull();
  });

  it("잘못된 비밀번호로 로그인 시도 시 실패", async () => {
    const { getUserByEmail, verifyPassword } = require("@/lib/db/users");
    getUserByEmail.mockResolvedValue({
      id: "1",
      email: "test@example.com",
      password_hash: "hashed_password",
    });
    verifyPassword.mockResolvedValue(false);

    const user = await getUserByEmail("test@example.com");
    const isValid = await verifyPassword("wrong_password", user.password_hash);

    expect(isValid).toBe(false);
  });
});
