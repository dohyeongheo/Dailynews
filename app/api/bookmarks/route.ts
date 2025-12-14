import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { addBookmark, removeBookmark, getUserBookmarks } from "@/lib/db/bookmarks";
import { applyRateLimit, RATE_LIMIT_CONFIGS } from "@/lib/utils/rate-limit-helper";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookmarks = await getUserBookmarks(session.user.id);
  return NextResponse.json({ bookmarks });
}

export async function POST(request: NextRequest) {
  // Rate Limiting 적용
  const rateLimitResponse = await applyRateLimit(request, RATE_LIMIT_CONFIGS.BOOKMARKS);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { newsId } = await request.json();

    if (!newsId) {
      return NextResponse.json({ error: "newsId is required" }, { status: 400 });
    }

    // 중복 북마크 체크
    const { isBookmarked } = await import("@/lib/db/bookmarks");
    const alreadyBookmarked = await isBookmarked(session.user.id, newsId);

    if (alreadyBookmarked) {
      return NextResponse.json({ error: "이미 북마크된 뉴스입니다." }, { status: 400 });
    }

    await addBookmark(session.user.id, newsId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Add bookmark error:", error);
    // 중복 키 에러 처리
    if (error instanceof Error && error.message.includes("duplicate")) {
      return NextResponse.json({ error: "이미 북마크된 뉴스입니다." }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to add bookmark" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  // Rate Limiting 적용
  const rateLimitResponse = await applyRateLimit(request, RATE_LIMIT_CONFIGS.BOOKMARKS);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const newsId = searchParams.get("newsId");

  if (!newsId) {
    return NextResponse.json({ error: "newsId is required" }, { status: 400 });
  }

  try {
    await removeBookmark(session.user.id, newsId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove bookmark error:", error);
    return NextResponse.json({ error: "Failed to remove bookmark" }, { status: 500 });
  }
}
