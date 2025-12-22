-- 뉴스 테이블에 news_category 필드 추가
-- 기존 category: 태국뉴스, 한국뉴스, 관련뉴스 (국가/지역 분류)
-- 새로운 news_category: 과학, 사회, 정치, 경제 등 (뉴스 주제 분류)

ALTER TABLE news
ADD COLUMN IF NOT EXISTS news_category TEXT;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_news_news_category ON news(news_category);

-- 복합 인덱스 추가 (category와 news_category 함께 조회 시 성능 향상)
CREATE INDEX IF NOT EXISTS idx_news_category_news_category ON news(category, news_category);

-- 기존 데이터의 news_category를 NULL로 유지 (선택적 필드)

