import { createClient } from '@/lib/supabase/server';

export async function incrementViewCount(newsId: string) {
  const supabase = createClient();

  // UPSERT: 존재하면 증가, 없으면 생성
  // RPC 함수 호출 (schema.sql에 정의됨)
  const { data, error } = await supabase.rpc('increment_view_count', {
    p_news_id: newsId,
  });

  if (error) {
    console.error('Error incrementing view count:', error);
    return 0;
  }
  return data;
}

export async function getViewCount(newsId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('news_views')
    .select('view_count')
    .eq('news_id', newsId)
    .single();

  if (error) return 0;
  return data?.view_count || 0;
}
