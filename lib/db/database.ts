import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// 데이터베이스 파일 경로
const dbPath = path.join(process.cwd(), 'data', 'news.db');
const dbDir = path.dirname(dbPath);

// 데이터 디렉토리가 없으면 생성
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// SQLite 데이터베이스 인스턴스 생성
const db = new Database(dbPath);

// WAL 모드 활성화 (성능 향상)
db.pragma('journal_mode = WAL');

// 외래 키 제약 조건 활성화
db.pragma('foreign_keys = ON');

/**
 * 데이터베이스 초기화 (테이블 생성)
 */
export function initializeDatabase() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS news (
      id TEXT PRIMARY KEY,
      published_date TEXT NOT NULL,
      source_country TEXT NOT NULL,
      source_media TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      content_translated TEXT,
      category TEXT NOT NULL,
      original_link TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_news_published_date ON news(published_date);
    CREATE INDEX IF NOT EXISTS idx_news_source_country ON news(source_country);
    CREATE INDEX IF NOT EXISTS idx_news_category ON news(category);
    CREATE INDEX IF NOT EXISTS idx_news_created_at ON news(created_at DESC);
  `;

  db.exec(createTableSQL);
  console.log('Database initialized successfully');
}

/**
 * 데이터베이스 인스턴스 반환
 */
export function getDatabase() {
  return db;
}

/**
 * 데이터베이스 연결 종료
 */
export function closeDatabase() {
  db.close();
}

// 서버 사이드에서만 데이터베이스 초기화
// Next.js는 서버 사이드에서 실행되므로 window는 undefined입니다
// Supabase를 사용하는 경우 SQLite 초기화를 건너뜀
if (typeof window === 'undefined') {
  const DB_TYPE = process.env.DB_TYPE || 'sqlite';
  const useSupabase = DB_TYPE === 'supabase' && process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  // Supabase를 사용하지 않는 경우에만 SQLite 초기화
  if (!useSupabase) {
    try {
      initializeDatabase();
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }
}

export default db;

