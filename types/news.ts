export type NewsCategory = '태국뉴스' | '관련뉴스' | '한국뉴스';
export type NewsTopicCategory = '과학' | '사회' | '정치' | '경제' | '스포츠' | '문화' | '기술' | '건강' | '환경' | '국제' | '기타';

export interface News {
  id: string;
  published_date: string;
  source_country: string;
  source_media: string;
  title: string;
  content: string;
  content_translated: string | null;
  category: NewsCategory;
  news_category: NewsTopicCategory | null;
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
  news_category?: NewsTopicCategory | null;
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
    news_category?: NewsTopicCategory | null;
    published_date: string;
    original_link?: string;
  }>;
}

