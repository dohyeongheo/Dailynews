-- RLS (Row Level Security) 활성화 및 정책 설정
-- Supabase Security Advisor 경고 해결
--
-- 참고: 이 애플리케이션은 NextAuth를 사용하며, 서버 사이드에서 Service Role Key로
-- 데이터베이스에 접근합니다. Service Role Key는 RLS를 우회하므로 서버 사이드 로직에는
-- 영향이 없습니다. RLS는 anon key로 직접 접근하는 경우에만 적용됩니다.
--
-- 보안을 위해 anon key로의 직접 접근을 차단하고, 모든 데이터 접근은 서버 사이드 API를
-- 통해 처리되도록 합니다.

-- 1. news 테이블: RLS 활성화 (서버 사이드 접근은 Service Role Key로 RLS 우회)
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

-- news: anon key로의 직접 접근 차단 (서버 사이드 API를 통해서만 접근 가능)
-- Service Role Key로 접근하는 서버 사이드 로직에는 영향 없음
CREATE POLICY "news_block_anon" ON public.news
  FOR ALL
  USING (false);

-- 2. users 테이블: RLS 활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- users: anon key로의 직접 접근 차단
CREATE POLICY "users_block_anon" ON public.users
  FOR ALL
  USING (false);

-- 3. bookmarks 테이블: RLS 활성화
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- bookmarks: anon key로의 직접 접근 차단
CREATE POLICY "bookmarks_block_anon" ON public.bookmarks
  FOR ALL
  USING (false);

-- 4. comments 테이블: RLS 활성화
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- comments: anon key로의 직접 접근 차단
CREATE POLICY "comments_block_anon" ON public.comments
  FOR ALL
  USING (false);

-- 5. news_reactions 테이블: RLS 활성화
ALTER TABLE public.news_reactions ENABLE ROW LEVEL SECURITY;

-- news_reactions: anon key로의 직접 접근 차단
CREATE POLICY "news_reactions_block_anon" ON public.news_reactions
  FOR ALL
  USING (false);

-- 7. comment_reactions 테이블: RLS 활성화
ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;

-- comment_reactions: anon key로의 직접 접근 차단
CREATE POLICY "comment_reactions_block_anon" ON public.comment_reactions
  FOR ALL
  USING (false);

