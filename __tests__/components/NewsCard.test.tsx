/**
 * NewsCard 컴포넌트 테스트
 */

import { render, screen } from '@testing-library/react';
import NewsCard from '@/components/NewsCard';
import type { News } from '@/types/news';

// Next.js Router 모킹
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
}));

const mockNews: News = {
  id: '1',
  published_date: '2024-01-01',
  source_country: '태국',
  source_media: 'Test Media',
  title: '테스트 뉴스 제목',
  content: '테스트 뉴스 내용입니다.',
  content_translated: null,
  category: '태국뉴스',
  news_category: null,
  image_url: null,
  original_link: 'https://example.com/news/1',
  created_at: '2024-01-01T00:00:00Z',
};

describe('NewsCard', () => {
  it('뉴스 제목을 렌더링해야 함', () => {
    render(<NewsCard news={mockNews} />);
    expect(screen.getByText('테스트 뉴스 제목')).toBeInTheDocument();
  });

  it('뉴스 내용을 렌더링해야 함', () => {
    render(<NewsCard news={mockNews} />);
    expect(screen.getByText('테스트 뉴스 내용입니다.')).toBeInTheDocument();
  });

  it('카테고리를 렌더링해야 함', () => {
    render(<NewsCard news={mockNews} />);
    expect(screen.getByText('태국뉴스')).toBeInTheDocument();
  });

  it('원문 보기 링크가 표시되어야 함 (showOriginalLink=true)', () => {
    render(<NewsCard news={mockNews} showOriginalLink={true} />);
    const link = screen.getByText('원문 보기 →');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://example.com/news/1');
  });

  it('원문 보기 링크가 표시되지 않아야 함 (showOriginalLink=false)', () => {
    render(<NewsCard news={mockNews} showOriginalLink={false} />);
    expect(screen.queryByText('원문 보기 →')).not.toBeInTheDocument();
  });

  it('번역된 내용이 있으면 번역된 내용을 표시해야 함', () => {
    const newsWithTranslation: News = {
      ...mockNews,
      content_translated: '번역된 뉴스 내용입니다.',
    };
    render(<NewsCard news={newsWithTranslation} />);
    expect(screen.getByText('번역된 뉴스 내용입니다.')).toBeInTheDocument();
    expect(screen.queryByText('테스트 뉴스 내용입니다.')).not.toBeInTheDocument();
  });

  it('날짜를 올바르게 포맷팅해야 함', () => {
    render(<NewsCard news={mockNews} />);
    // 날짜 포맷팅은 브라우저 환경에 따라 다를 수 있으므로
    // 날짜가 포함된 텍스트가 있는지 확인
    const dateElement = screen.getByText(/2024/);
    expect(dateElement).toBeInTheDocument();
  });
});

