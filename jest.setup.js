// Jest 설정 파일
// 테스트 환경에서 사용할 전역 설정

// @testing-library/jest-dom의 매처를 사용할 수 있도록 설정
import '@testing-library/jest-dom';

// Fetch polyfill
import 'whatwg-fetch';

// 환경 변수 모킹
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.GOOGLE_GEMINI_API_KEY = 'test-api-key';
process.env.DB_TYPE = 'supabase';

// console.error를 무시하도록 설정 (선택사항)
// global.console = {
//   ...console,
//   error: jest.fn(),
//   warn: jest.fn(),
// };

