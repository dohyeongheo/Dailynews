/**
 * 뉴스 데이터 변환 유틸리티
 * News와 NewsInput 간의 변환 로직 통합
 */

import type { News, NewsInput } from "@/types/news";

/**
 * News 객체를 NewsInput으로 변환
 * @param news News 객체
 * @returns NewsInput 객체
 */
export function createNewsInputFromDB(news: News): NewsInput {
  return {
    published_date: news.published_date,
    source_country: news.source_country,
    source_media: news.source_media,
    title: news.title,
    content: news.content,
    content_translated: news.content_translated,
    category: news.category,
    news_category: news.news_category,
    original_link: news.original_link,
  };
}

