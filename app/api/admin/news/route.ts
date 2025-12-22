import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { insertNews } from "@/lib/db/news";
import { z } from "zod";

const newsSchema = z.object({
  title: z.string().min(1, "제목은 필수입니다."),
  content: z.string().min(1, "내용은 필수입니다."),
  content_translated: z.string().optional(),
  category: z.enum(["태국뉴스", "관련뉴스", "한국뉴스"]),
  news_category: z.enum(["과학", "사회", "정치", "경제", "스포츠", "문화", "기술", "건강", "환경", "국제", "기타"]).nullable().optional(),
  source_country: z.string().optional(),
  source_media: z.string().optional(),
  original_link: z.string().url().optional().or(z.literal("")),
  published_date: z.string(),
});

/**
 * 뉴스 생성
 */
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session || !session.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = newsSchema.parse(body);

    const result = await insertNews({
      title: validatedData.title,
      content: validatedData.content,
      content_translated: validatedData.content_translated || null,
      category: validatedData.category,
      news_category: validatedData.news_category || null,
      published_date: validatedData.published_date,
      source_country: validatedData.source_country || "",
      source_media: validatedData.source_media || "",
      original_link: validatedData.original_link || "#",
    });

    if (result.success) {
      return NextResponse.json({ success: true, message: "뉴스가 생성되었습니다." });
    } else {
      return NextResponse.json({ error: result.error || "뉴스 생성에 실패했습니다." }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "입력값이 올바르지 않습니다.", details: error.issues }, { status: 400 });
    }

    console.error("Create news error:", error);
    return NextResponse.json({ error: "뉴스 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
