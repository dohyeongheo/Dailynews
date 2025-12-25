import { createClient } from "@/lib/supabase/server";
import { getCache, setCache, invalidateCommentCache, CACHE_NAMESPACES } from "@/lib/utils/cache";

export async function createComment(newsId: string, userId: string, content: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("comments")
    .insert({ news_id: newsId, user_id: userId, content })
    .select(
      `
      *,
      user:user_id (id, name, email)
    `
    )
    .single();

  if (error) throw error;

  // 댓글 생성 시 해당 뉴스의 댓글 캐시 무효화
  await invalidateCommentCache(newsId);

  return data;
}

export async function getCommentsByNewsId(newsId: string) {
  // 캐시에서 조회
  const cached = await getCache<Awaited<ReturnType<typeof getCommentsByNewsId>>>(CACHE_NAMESPACES.COMMENTS_NEWS, newsId);
  if (cached) {
    return cached;
  }

  const supabase = createClient();

  const { data, error } = await supabase
    .from("comments")
    .select(
      `
      *,
      user:user_id (id, name, email, role)
    `
    )
    .eq("news_id", newsId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // 캐시에 저장 (TTL: 30초 - 댓글은 자주 변경될 수 있으므로 짧은 TTL)
  await setCache(CACHE_NAMESPACES.COMMENTS_NEWS, newsId, data, 30);

  return data;
}

export async function deleteComment(commentId: string) {
  // 삭제 전에 댓글 정보 조회 (newsId를 얻기 위해)
  const comment = await getCommentById(commentId);
  const newsId = comment?.news_id;

  const supabase = createClient();

  const { error } = await supabase.from("comments").delete().eq("id", commentId);

  if (error) throw error;

  // 댓글 삭제 시 해당 뉴스의 댓글 캐시 무효화
  if (newsId) {
    await invalidateCommentCache(newsId);
  }
}

export async function updateComment(commentId: string, content: string) {
  // 업데이트 전에 댓글 정보 조회 (newsId를 얻기 위해)
  const comment = await getCommentById(commentId);
  const newsId = comment?.news_id;

  const supabase = createClient();

  const { data, error } = await supabase
    .from("comments")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", commentId)
    .select(
      `
      *,
      user:user_id (id, name, email, role)
    `
    )
    .single();

  if (error) throw error;

  // 댓글 수정 시 해당 뉴스의 댓글 캐시 무효화
  if (newsId) {
    await invalidateCommentCache(newsId);
  }

  return data;
}

export async function getCommentById(commentId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("comments")
    .select(
      `
      *,
      user:user_id (id, name, email, role)
    `
    )
    .eq("id", commentId)
    .single();

  if (error) throw error;
  return data;
}
