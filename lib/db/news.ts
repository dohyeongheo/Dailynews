import type { News, NewsInput, NewsCategory } from '@/types/news';

// 환경 변수로 DB 타입 선택 (기본값: sqlite)
const DB_TYPE = process.env.DB_TYPE || 'sqlite';

// Supabase를 사용하는 경우 동적 import
const useSupabase = DB_TYPE === 'supabase' && process.env.NEXT_PUBLIC_SUPABASE_URL;

/**
 * 뉴스를 데이터베이스에 저장
 */
export async function insertNews(news: NewsInput): Promise<{ success: boolean; error?: string }> {
  // Supabase를 사용하는 경우
  if (useSupabase) {
    const supabaseNews = await import('./supabase-news');
    return await supabaseNews.insertNews(news);
  }

  // SQLite 사용 (로컬 개발용)
  try {
    const db = (await import('./database')).default;
    const { randomUUID } = await import('crypto');
    
    const id = randomUUID();
    const stmt = db.prepare(`
      INSERT INTO news (
        id, published_date, source_country, source_media,
        title, content, content_translated, category, original_link
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      news.published_date,
      news.source_country,
      news.source_media,
      news.title,
      news.content,
      news.content_translated || null,
      news.category,
      news.original_link
    );

    return { success: true };
  } catch (error) {
    console.error('Error inserting news:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 여러 뉴스를 배치로 저장
 */
export async function insertNewsBatch(newsItems: NewsInput[]): Promise<{ success: number; failed: number }> {
  // Supabase를 사용하는 경우
  if (useSupabase) {
    const supabaseNews = await import('./supabase-news');
    return await supabaseNews.insertNewsBatch(newsItems);
  }

  // SQLite 사용 (로컬 개발용)
  const db = (await import('./database')).default;
  const { randomUUID } = await import('crypto');
  
  let successCount = 0;
  let failedCount = 0;

  const insert = db.prepare(`
    INSERT INTO news (
      id, published_date, source_country, source_media,
      title, content, content_translated, category, original_link
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((items: NewsInput[]) => {
    const counts = { success: 0, failed: 0 };

    for (const news of items) {
      try {
        const id = randomUUID();
        insert.run(
          id,
          news.published_date,
          news.source_country,
          news.source_media,
          news.title,
          news.content,
          news.content_translated || null,
          news.category,
          news.original_link
        );
        counts.success++;
      } catch (error) {
        console.error('Error inserting news:', error);
        counts.failed++;
      }
    }

    return counts;
  });

  try {
    const result = insertMany(newsItems);

    // transaction이 반환값을 제공하는 경우 사용
    if (result && typeof result === 'object' && 'success' in result && 'failed' in result) {
      return { success: result.success, failed: result.failed };
    }
  } catch (error) {
    console.error('Error in insertNewsBatch transaction:', error);
  }

  // fallback: 직접 계산 (transaction이 실패한 경우)
  return { success: successCount, failed: failedCount };
}

/**
 * 카테고리별로 뉴스 조회
 */
export async function getNewsByCategory(
  category: NewsCategory,
  limit: number = 10
): Promise<News[]> {
  // Supabase를 사용하는 경우
  if (useSupabase) {
    const supabaseNews = await import('./supabase-news');
    return await supabaseNews.getNewsByCategory(category, limit);
  }

  // SQLite 사용 (로컬 개발용)
  const db = (await import('./database')).default;
  const stmt = db.prepare(`
    SELECT * FROM news
    WHERE category = ?
    ORDER BY created_at DESC
    LIMIT ?
  `);

  const rows = stmt.all(category, limit) as News[];
  return rows;
}

/**
 * 모든 뉴스 조회
 */
export async function getAllNews(limit: number = 30): Promise<News[]> {
  // Supabase를 사용하는 경우
  if (useSupabase) {
    const supabaseNews = await import('./supabase-news');
    return await supabaseNews.getAllNews(limit);
  }

  // SQLite 사용 (로컬 개발용)
  const db = (await import('./database')).default;
  const stmt = db.prepare(`
    SELECT * FROM news
    ORDER BY created_at DESC
    LIMIT ?
  `);

  const rows = stmt.all(limit) as News[];
  return rows;
}

/**
 * 검색어로 뉴스 조회
 * @param query 검색어
 * @param searchType 검색 타입: 'title' | 'content' | 'all'
 * @param limit 결과 제한
 */
export async function searchNews(query: string, searchType: 'title' | 'content' | 'all' = 'all', limit: number = 100): Promise<News[]> {
  // Supabase를 사용하는 경우
  if (useSupabase) {
    const supabaseNews = await import('./supabase-news');
    return await supabaseNews.searchNews(query, searchType, limit);
  }

  // SQLite 사용 (로컬 개발용)
  const db = (await import('./database')).default;
  const searchTerm = `%${query}%`;
  let stmt;

  switch (searchType) {
    case 'title':
      stmt = db.prepare(`
        SELECT * FROM news
        WHERE title LIKE ?
        ORDER BY created_at DESC
        LIMIT ?
      `);
      return stmt.all(searchTerm, limit) as News[];

    case 'content':
      stmt = db.prepare(`
        SELECT * FROM news
        WHERE content LIKE ?
           OR content_translated LIKE ?
        ORDER BY created_at DESC
        LIMIT ?
      `);
      return stmt.all(searchTerm, searchTerm, limit) as News[];

    case 'all':
    default:
      stmt = db.prepare(`
        SELECT * FROM news
        WHERE title LIKE ?
           OR content LIKE ?
           OR content_translated LIKE ?
        ORDER BY created_at DESC
        LIMIT ?
      `);
      return stmt.all(searchTerm, searchTerm, searchTerm, limit) as News[];
  }
}

/**
 * 뉴스 개수 조회
 */
export async function getNewsCount(category?: NewsCategory): Promise<number> {
  // Supabase를 사용하는 경우
  if (useSupabase) {
    const supabaseNews = await import('./supabase-news');
    return await supabaseNews.getNewsCount(category);
  }

  // SQLite 사용 (로컬 개발용)
  const db = (await import('./database')).default;
  if (category) {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM news WHERE category = ?');
    const result = stmt.get(category) as { count: number };
    return result.count;
  } else {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM news');
    const result = stmt.get() as { count: number };
    return result.count;
  }
}

