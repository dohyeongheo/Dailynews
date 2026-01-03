/**
 * Supabase 데이터베이스 타입 정의
 * schema.sql을 기반으로 생성된 타입 정의
 */

import type { NewsCategory, NewsTopicCategory } from "@/types/news";

/**
 * news 테이블의 행 타입
 */
export interface NewsRow {
  id: string;
  published_date: string; // DATE -> string (ISO format)
  source_country: string;
  source_media: string;
  title: string;
  content: string;
  category: NewsCategory;
  news_category: NewsTopicCategory | null;
  image_url: string | null;
  created_at: string; // TIMESTAMPTZ -> string (ISO format)
  updated_at?: string; // TIMESTAMPTZ -> string (ISO format), optional
}

/**
 * users 테이블의 행 타입
 */
export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: "user" | "admin";
  created_at: string; // TIMESTAMPTZ -> string (ISO format)
  updated_at: string; // TIMESTAMPTZ -> string (ISO format)
}

/**
 * bookmarks 테이블의 행 타입
 */
export interface BookmarkRow {
  id: string;
  user_id: string;
  news_id: string;
  created_at: string; // TIMESTAMPTZ -> string (ISO format)
}

/**
 * news_reactions 테이블의 행 타입
 */
export interface NewsReactionRow {
  id: string;
  news_id: string;
  user_id: string;
  reaction_type: "like" | "dislike";
  created_at: string; // TIMESTAMPTZ -> string (ISO format)
}

/**
 * Supabase 쿼리 결과 타입 (select 사용 시)
 */
export type SupabaseQueryResult<T> = {
  data: T[] | null;
  error: {
    message: string;
    details?: string;
    hint?: string;
    code?: string;
  } | null;
};

/**
 * Supabase 단일 행 쿼리 결과 타입
 */
export type SupabaseSingleResult<T> = {
  data: T | null;
  error: {
    message: string;
    details?: string;
    hint?: string;
    code?: string;
  } | null;
};

