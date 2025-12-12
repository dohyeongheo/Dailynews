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
  original_link TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_news_published_date ON news(published_date);
CREATE INDEX IF NOT EXISTS idx_news_source_country ON news(source_country);
CREATE INDEX IF NOT EXISTS idx_news_category ON news(category);
CREATE INDEX IF NOT EXISTS idx_news_created_at ON news(created_at DESC);

-- original_link 유니크 제약 조건 추가 (중복 뉴스 방지)
CREATE UNIQUE INDEX IF NOT EXISTS idx_news_original_link_unique ON news(original_link);
