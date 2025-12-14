import { createClient } from "@/lib/supabase/server";

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
  return data;
}

export async function getCommentsByNewsId(newsId: string) {
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
  return data;
}

export async function deleteComment(commentId: string) {
  const supabase = createClient();

  const { error } = await supabase.from("comments").delete().eq("id", commentId);

  if (error) throw error;
}

export async function updateComment(commentId: string, content: string) {
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
