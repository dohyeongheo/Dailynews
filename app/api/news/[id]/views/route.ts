import { NextRequest, NextResponse } from "next/server";
import { getViewCount } from "@/lib/db/views";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const viewCount = await getViewCount(params.id);
    const response = NextResponse.json({ viewCount });

    // 조회수는 자주 변경되므로 매우 짧은 캐시 (10초)
    response.headers.set('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30');

    return response;
  } catch (error) {
    console.error("Get view count error:", error);
    const response = NextResponse.json({ viewCount: 0 });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  }
}
