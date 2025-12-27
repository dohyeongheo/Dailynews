-- Supabase PostgreSQL 스키마

-- 뉴스 테이블 생성
CREATE TABLE IF NOT EXISTS news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  published_date DATE NOT NULL,
  source_country TEXT NOT NULL,
  source_media TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_translated TEXT,
  category TEXT NOT NULL,
  news_category TEXT,
  original_link TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_news_published_date ON news(published_date);
CREATE INDEX IF NOT EXISTS idx_news_source_country ON news(source_country);
CREATE INDEX IF NOT EXISTS idx_news_category ON news(category);
CREATE INDEX IF NOT EXISTS idx_news_news_category ON news(news_category);
CREATE INDEX IF NOT EXISTS idx_news_category_news_category ON news(category, news_category);
CREATE INDEX IF NOT EXISTS idx_news_created_at ON news(created_at DESC);

-- original_link 유니크 제약 조건 추가 (중복 뉴스 방지)
CREATE UNIQUE INDEX IF NOT EXISTS idx_news_original_link_unique ON news(original_link);

-- 1. users 테이블 (회원 정보)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user', -- 'user' | 'admin'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. bookmarks 테이블 (북마크)
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  news_id UUID NOT NULL REFERENCES news(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, news_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_news_id ON bookmarks(news_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(created_at DESC);

-- 3. comments 테이블 (댓글)
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id UUID NOT NULL REFERENCES news(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_news_id ON comments(news_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- 4. 기존 news 테이블 최적화 (추가 인덱스)
CREATE INDEX IF NOT EXISTS idx_news_id_created_at ON news(id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_category_created_at ON news(category, created_at DESC);

-- 5. news_reactions 테이블 (뉴스 좋아요/싫어요)
CREATE TABLE IF NOT EXISTS news_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id UUID NOT NULL REFERENCES news(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(news_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_news_reactions_news_id ON news_reactions(news_id);
CREATE INDEX IF NOT EXISTS idx_news_reactions_user_id ON news_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_news_reactions_type ON news_reactions(reaction_type);

-- 8. comment_reactions 테이블 (댓글 좋아요/싫어요)
CREATE TABLE IF NOT EXISTS comment_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment_id ON comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_user_id ON comment_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_type ON comment_reactions(reaction_type);

