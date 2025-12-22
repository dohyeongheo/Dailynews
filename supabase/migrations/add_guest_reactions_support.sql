-- 비회원 좋아요 지원을 위한 마이그레이션
-- 1. user_id를 nullable로 변경 (비회원 좋아요 허용)
-- 2. guest_ip 필드 추가 (비회원 IP 추적)

-- news_reactions 테이블 수정
ALTER TABLE news_reactions 
ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE news_reactions 
ADD COLUMN IF NOT EXISTS guest_ip TEXT;

-- comment_reactions 테이블 수정
ALTER TABLE comment_reactions 
ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE comment_reactions 
ADD COLUMN IF NOT EXISTS guest_ip TEXT;

-- UNIQUE 제약 조건 수정 (user_id가 null인 경우 guest_ip로 구분)
-- 기존 UNIQUE 제약 조건 제거 후 재생성
ALTER TABLE news_reactions DROP CONSTRAINT IF EXISTS news_reactions_news_id_user_id_key;
ALTER TABLE comment_reactions DROP CONSTRAINT IF EXISTS comment_reactions_comment_id_user_id_key;

-- 새로운 UNIQUE 제약 조건 추가 (user_id가 null이 아닌 경우만 user_id로, null이면 guest_ip로)
-- PostgreSQL에서는 부분 인덱스를 사용하여 구현
CREATE UNIQUE INDEX IF NOT EXISTS idx_news_reactions_user_unique 
ON news_reactions(news_id, user_id) 
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_news_reactions_guest_unique 
ON news_reactions(news_id, guest_ip) 
WHERE user_id IS NULL AND guest_ip IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_comment_reactions_user_unique 
ON comment_reactions(comment_id, user_id) 
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_comment_reactions_guest_unique 
ON comment_reactions(comment_id, guest_ip) 
WHERE user_id IS NULL AND guest_ip IS NOT NULL;

