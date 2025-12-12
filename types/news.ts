export type NewsCategory = '태국뉴스' | '관련뉴스' | '한국뉴스';

export interface News {
  id: string;
  published_date: string;
  source_country: string;
  source_media: string;
  title: string;
  content: string;
  content_translated: string | null;
  category: NewsCategory;
  original_link: string;
  created_at: string;
}

export interface NewsInput {
  published_date: string;
  source_country: string;
  source_media: string;
  title: string;
  content: string;
  content_translated?: string | null;
  category: NewsCategory;
  original_link: string;
}

export interface GeminiNewsResponse {
  news: Array<{
    title: string;
    content: string;
    content_translated?: string;
    source_country: string;
    source_media: string;
    category: NewsCategory;
    original_link: string;
    published_date: string;
  }>;
}

