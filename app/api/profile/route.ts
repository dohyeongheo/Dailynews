import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserByEmail, updateUserProfile } from "@/lib/db/users";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(2, "이름은 최소 2자 이상이어야 합니다.").optional(),
  password: z.string().min(8, "비밀번호는 최소 8자 이상이어야 합니다.").optional(),
});

/**
 * 현재 사용자 프로필 조회
 */
export async function GET() {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (!session.user || !session.user.email) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = await getUserByEmail(session.user.email);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 비밀번호 해시는 제외하고 반환
    const { password_hash, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json({ error: "Failed to get profile" }, { status: 500 });
  }
}

/**
 * 프로필 수정
 */
export async function PATCH(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    // 수정할 데이터가 없으면 에러
    if (!validatedData.name && !validatedData.password) {
      return NextResponse.json({ error: "수정할 데이터가 없습니다." }, { status: 400 });
    }

    if (!session.user || !session.user.id || !session.user.email) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!session.user || !session.user.id || !session.user.email) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await updateUserProfile(session.user.id, validatedData);

    // 업데이트된 사용자 정보 반환
    const user = await getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const { password_hash, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      message: "프로필이 성공적으로 업데이트되었습니다.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "입력값이 올바르지 않습니다.", details: error.issues }, { status: 400 });
    }

    console.error("Update profile error:", error);
    return NextResponse.json({ error: "프로필 업데이트 중 오류가 발생했습니다." }, { status: 500 });
  }
}
