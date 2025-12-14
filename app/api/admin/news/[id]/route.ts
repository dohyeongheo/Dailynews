import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const updateNewsSchema = z.object({
  title: z.string().min(1, "제목은 필수입니다.").optional(),
  content: z.string().min(1, "내용은 필수입니다.").optional(),
  content_translated: z.string().optional(),
  category: z.enum(["태국뉴스", "관련뉴스", "한국뉴스"]).optional(),
  source_country: z.string().optional(),
  source_media: z.string().optional(),
  original_link: z.string().url().optional().or(z.literal("")),
  published_date: z.string().optional(),
});

/**
 * 뉴스 수정
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();

  if (!session || !session.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = updateNewsSchema.parse(body);

    const supabase = createClient();
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (validatedData.title) updateData.title = validatedData.title;
    if (validatedData.content) updateData.content = validatedData.content;
    if (validatedData.content_translated !== undefined) {
      updateData.content_translated = validatedData.content_translated || null;
    }
    if (validatedData.category) updateData.category = validatedData.category;
    if (validatedData.source_country !== undefined) {
      updateData.source_country = validatedData.source_country;
    }
    if (validatedData.source_media !== undefined) {
      updateData.source_media = validatedData.source_media;
    }
    if (validatedData.original_link !== undefined) {
      updateData.original_link = validatedData.original_link || "#";
    }
    if (validatedData.published_date) {
      updateData.published_date = validatedData.published_date;
    }

    const { error } = await supabase.from("news").update(updateData).eq("id", params.id);

    if (error) {
      console.error("Update news error:", error);
      return NextResponse.json({ error: "뉴스 수정에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "뉴스가 수정되었습니다." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "입력값이 올바르지 않습니다.", details: error.issues }, { status: 400 });
    }

    console.error("Update news error:", error);
    return NextResponse.json({ error: "뉴스 수정 중 오류가 발생했습니다." }, { status: 500 });
  }
}
