export type NewsCategory = '태국뉴스' | '관련뉴스' | '한국뉴스';
export type NewsTopicCategory = '과학' | '사회' | '정치' | '경제' | '스포츠' | '문화' | '기술' | '건강' | '환경' | '국제' | '기타';

export interface News {
  id: string;
  published_date: string;
  source_country: string;
  source_media: string;
  title: string;
  content: string;
  category: NewsCategory;
  news_category: NewsTopicCategory | null;
  image_url: string | null;
  created_at: string;
}

export interface NewsInput {
  published_date: string;
  source_country: string;
  source_media: string;
  title: string;
  content: string;
  category: NewsCategory;
  news_category?: NewsTopicCategory | null;
  // NewsAPI 및 네이버 API 통합을 위한 추가 필드
  source_api?: 'newsapi' | 'naver' | 'gemini'; // 소스 API 식별
  original_url?: string;  // 원문 URL (번역/이미지용)
  url_to_image?: string;  // NewsAPI 이미지 URL
}

export interface GeminiNewsResponse {
  news: Array<{
    title: string;
    content: string;
    source_country: string;
    source_media: string;
    category: NewsCategory;
    news_category?: NewsTopicCategory | null;
    published_date: string;
  }>;
}

