/**
 * 환경 변수 로드 (다른 모듈 import 전에 실행되어야 함)
 */
import { config } from "dotenv";
import { resolve } from "path";

// .env.local 파일 로드
config({ path: resolve(process.cwd(), ".env.local") });

