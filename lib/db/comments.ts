import { createClient } from "@/lib/supabase/server";
import { getCache, setCache, invalidateCommentCache, CACHE_NAMESPACES } from "@/lib/utils/cache";
import bcrypt from "bcryptjs";

export async function createComment(
  newsId: string,
  userId: string | null,
  content: string,
  guestName?: string,
  password?: string
) {
  const supabase = createClient();

  const insertData: {
    news_id: string;
    user_id: string | null;
    content: string;
    guest_name?: string;
    password_hash?: string;
  } = {
    news_id: newsId,
    user_id: userId,
    content,
  };

  // 비회원 댓글인 경우
  if (!userId) {
    if (!guestName || !password) {
      throw new Error("비회원 댓글은 이름과 비밀번호가 필요합니다.");
    }
    if (password.length !== 4 || !/^\d{4}$/.test(password)) {
      throw new Error("비밀번호는 4자리 숫자여야 합니다.");
    }
    insertData.guest_name = guestName;
    // 비밀번호 해시화 (간단한 4자리 숫자이므로 낮은 salt rounds 사용)
    insertData.password_hash = await bcrypt.hash(password, 8);
  }

  const { data, error } = await supabase
    .from("comments")
    .insert(insertData)
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

  // 비밀번호 해시는 반환하지 않음
  if (data && data.password_hash) {
    delete (data as any).password_hash;
  }

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

  // 비밀번호 해시는 반환하지 않음, 비회원 댓글 처리
  const sanitizedData = data?.map((comment: any) => {
    if (comment.password_hash) {
      delete comment.password_hash;
    }
    // user_id가 null인 경우 user도 null로 설정
    if (!comment.user_id && !comment.user) {
      comment.user = null;
    }
    return comment;
  });

  // 캐시에 저장 (TTL: 30초 - 댓글은 자주 변경될 수 있으므로 짧은 TTL)
  await setCache(CACHE_NAMESPACES.COMMENTS_NEWS, newsId, sanitizedData, 30);

  return sanitizedData || [];
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

  // 비밀번호 해시는 반환하지 않음
  if (data && data.password_hash) {
    delete (data as any).password_hash;
  }

  // user_id가 null인 경우 user도 null로 설정
  if (!data.user_id && !data.user) {
    (data as any).user = null;
  }

  // 댓글 수정 시 해당 뉴스의 댓글 캐시 무효화
  if (newsId) {
    await invalidateCommentCache(newsId);
  }

  return data;
}

export async function getCommentById(commentId: string, includePasswordHash: boolean = false) {
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

  // 비밀번호 해시는 기본적으로 반환하지 않음
  if (!includePasswordHash && data && data.password_hash) {
    delete (data as any).password_hash;
  }

  return data;
}

/**
 * 비회원 댓글 비밀번호 검증
 */
export async function verifyGuestCommentPassword(commentId: string, password: string): Promise<boolean> {
  const comment = await getCommentById(commentId, true);
  
  if (!comment || !comment.password_hash) {
    return false;
  }

  return bcrypt.compare(password, comment.password_hash);
}
