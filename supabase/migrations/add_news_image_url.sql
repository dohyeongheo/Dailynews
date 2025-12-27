-- news 테이블에 image_url 컬럼 추가
ALTER TABLE news ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 인덱스 추가 (이미지 URL이 있는 뉴스 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_news_image_url ON news(image_url) WHERE image_url IS NOT NULL;

