import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * 모든 댓글 조회 (관리자 전용)
 */
export async function GET() {
  const session = await auth();

  if (!session || !session.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("comments")
      .select(
        `
        *,
        user:user_id (id, name, email),
        news:news_id (id, title)
      `
      )
      .order("created_at", { ascending: false })
      .limit(100); // 최대 100개

    if (error) {
      console.error("Get all comments error:", error);
      return NextResponse.json({ error: "Failed to get comments" }, { status: 500 });
    }

    return NextResponse.json({ comments: data || [] });
  } catch (error) {
    console.error("Get all comments error:", error);
    return NextResponse.json({ error: "Failed to get comments" }, { status: 500 });
  }
}
