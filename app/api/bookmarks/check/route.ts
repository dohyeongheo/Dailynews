import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isBookmarked } from "@/lib/db/bookmarks";
import { log } from "@/lib/utils/logger";

/**
 * 특정 뉴스의 북마크 상태 확인
 */
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ isBookmarked: false });
  }

  const { searchParams } = new URL(request.url);
  const newsId = searchParams.get("newsId");

  if (!newsId) {
    return NextResponse.json({ error: "newsId is required" }, { status: 400 });
  }

  try {
    const bookmarked = await isBookmarked(session.user.id, newsId);
    return NextResponse.json({ isBookmarked: bookmarked });
  } catch (error) {
    log.error("Check bookmark error", error instanceof Error ? error : new Error(String(error)), { newsId });
    return NextResponse.json({ isBookmarked: false });
  }
}
