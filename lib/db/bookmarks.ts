import { createClient } from "@/lib/supabase/server";

export async function addBookmark(userId: string, newsId: string) {
  const supabase = createClient();

  const { data, error } = await supabase.from("bookmarks").insert({ user_id: userId, news_id: newsId }).select().single();

  if (error) throw error;
  return data;
}

export async function removeBookmark(userId: string, newsId: string) {
  const supabase = createClient();

  const { error } = await supabase.from("bookmarks").delete().match({ user_id: userId, news_id: newsId });

  if (error) throw error;
}

export async function getUserBookmarks(userId: string, limit = 20, offset = 0) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("bookmarks")
    .select(
      `
      id,
      created_at,
      news:news_id (*)
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data;
}

export async function isBookmarked(userId: string, newsId: string) {
  const supabase = createClient();

  const { data, error } = await supabase.from("bookmarks").select("id").match({ user_id: userId, news_id: newsId }).single();

  // 에러가 있고 데이터가 없으면 북마크되지 않음
  if (error && error.code !== "PGRST116") {
    // PGRST116은 "no rows returned" 에러이므로 정상
    throw error;
  }

  return !!data;
}
