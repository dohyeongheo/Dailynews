import { NextRequest, NextResponse } from "next/server";
import { getViewCount } from "@/lib/db/views";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const viewCount = await getViewCount(params.id);
    return NextResponse.json({ viewCount });
  } catch (error) {
    console.error("Get view count error:", error);
    return NextResponse.json({ viewCount: 0 });
  }
}
