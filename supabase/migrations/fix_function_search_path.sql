-- Function Search Path 보안 경고 해결
-- increment_view_count 함수에 search_path 설정 추가

-- search_path를 명시적으로 설정하여 SQL injection 공격 방지
CREATE OR REPLACE FUNCTION increment_view_count(p_news_id UUID)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count BIGINT;
BEGIN
  INSERT INTO news_views (news_id, view_count, last_viewed_at)
  VALUES (p_news_id, 1, NOW())
  ON CONFLICT (news_id)
  DO UPDATE SET
    view_count = news_views.view_count + 1,
    last_viewed_at = NOW()
  RETURNING view_count INTO v_count;

  RETURN v_count;
END;
$$;

