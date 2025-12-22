-- 비회원 댓글 지원을 위한 마이그레이션
-- 1. user_id를 nullable로 변경 (비회원 댓글 허용)
-- 2. password_hash 필드 추가 (비회원 댓글 비밀번호 저장)
-- 3. guest_name 필드 추가 (비회원 이름)

-- user_id를 nullable로 변경
ALTER TABLE comments 
ALTER COLUMN user_id DROP NOT NULL;

-- password_hash 필드 추가 (비회원 댓글 비밀번호 해시 저장)
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- guest_name 필드 추가 (비회원 이름)
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS guest_name TEXT;

-- 인덱스 추가 (비회원 댓글 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_comments_user_id_null ON comments(user_id) WHERE user_id IS NULL;

-- 기존 댓글의 user_id가 null인 경우를 대비한 체크 제약 조건
-- (user_id가 null이면 password_hash와 guest_name이 필수)
-- PostgreSQL에서는 CHECK 제약 조건으로 구현 가능하지만, 
-- 애플리케이션 레벨에서 검증하는 것이 더 유연함

