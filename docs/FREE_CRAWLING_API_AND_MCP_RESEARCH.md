# 무료 크롤링 API 및 MCP 서버 활용 방법 조사 보고서

## 개요

현재 시스템의 할루시네이션 문제를 해결하기 위해, Gemini API Grounding 외에도 무료 크롤링 API와 MCP 서버를 활용한 뉴스 수집 방법을 조사했습니다.

## 1. 무료 뉴스 크롤링 API

### 1.1 NewsAPI.org

**개요:**

- 전 세계 80,000개 이상의 뉴스 소스를 통합한 API
- 한국어 및 태국어 뉴스 지원

**무료 티어:**

- 하루 500회 요청 제한
- 개발자 키 필요 (무료 등록)
- HTTPS만 지원

**API 엔드포인트 예시:**

```typescript
// 한국 뉴스 검색
const response = await fetch(Client ID
  `https://newsapi.org/v2/everything?q=한국&language=ko&apiKey=${API_KEY}`
);

// 태국 뉴스 검색
const response = await fetch(
  `https://newsapi.org/v2/everything?q=Thailand&language=th&apiKey=${API_KEY}`
);
```

**장점:**

- 다양한 뉴스 소스 통합
- 한국어/태국어 지원
- 무료 티어 제공

**단점:**

- 하루 500회 제한 (30개 뉴스 수집 시 충분)
- 일부 뉴스 소스는 전체 기사 내용 미제공
- API 키 필요

**비용:**

- 무료: 하루 500회
- 유료: $449/월 (무제한)

### 1.2 Mediastack

**개요:**

- 전 세계 7,500개 이상의 뉴스 소스
- 실시간 뉴스 피드 제공

**무료 티어:**

- 월 500회 요청 제한
- API 키 필요

**API 엔드포인트 예시:**

```typescript
// 한국 뉴스
const response = await fetch(`http://api.mediastack.com/v1/news?access_key=${API_KEY}&countries=kr&languages=ko`);

// 태국 뉴스
const response = await fetch(`http://api.mediastack.com/v1/news?access_key=${API_KEY}&countries=th&languages=th`);
```

**장점:**

- 국가별, 언어별 필터링 지원
- 실시간 뉴스 피드
- 무료 티어 제공

**단점:**

- 월 500회 제한 (하루 약 16회)
- 일부 기능 제한

**비용:**

- 무료: 월 500회
- 유료: $25/월 (10,000회)

### 1.3 GNews API

**개요:**

- Google News 데이터 제공
- 실시간 뉴스 검색

**무료 티어:**

- 하루 100회 요청 제한
- API 키 필요

**API 엔드포인트 예시:**

```typescript
// 한국 뉴스
const response = await fetch(`https://gnews.io/api/v4/search?q=한국&lang=ko&token=${API_KEY}`);

// 태국 뉴스
const response = await fetch(`https://gnews.io/api/v4/search?q=Thailand&lang=th&token=${API_KEY}`);
```

**장점:**

- Google News 기반으로 신뢰도 높음
- 실시간 검색
- 무료 티어 제공

**단점:**

- 하루 100회 제한 (30개 뉴스 수집 시 부족할 수 있음)
- 전체 기사 내용 미제공 (요약만 제공)

**비용:**

- 무료: 하루 100회
- 유료: $49/월 (10,000회)

### 1.4 네이버 뉴스 검색 API

**개요:**

- 네이버 개발자센터에서 제공하는 뉴스 검색 API
- 한국 뉴스 전용

**무료 티어:**

- 하루 25,000회 요청 제한
- 클라이언트 ID/Secret 필요

**API 엔드포인트 예시:**

```typescript
const response = await fetch(`https://openapi.naver.com/v1/search/news.json?query=한국&display=10&start=1&sort=date`, {
  headers: {
    "X-Naver-Client-Id": CLIENT_ID,
    "X-Naver-Client-Secret": CLIENT_SECRET,
  },
});
```

**장점:**

- 한국 뉴스에 특화
- 높은 요청 제한 (하루 25,000회)
- 무료 제공

**단점:**

- 한국 뉴스만 지원 (태국 뉴스 불가)
- 네이버 뉴스 중심

**비용:**

- 무료: 하루 25,000회

## 2. RSS 피드 파싱

### 2.1 RSS 피드란?

RSS (Really Simple Syndication)는 뉴스 사이트에서 제공하는 표준화된 XML 형식의 뉴스 피드입니다. 대부분의 뉴스 사이트에서 무료로 제공합니다.

### 2.2 주요 한국 뉴스 RSS 피드

- **연합뉴스**: `https://www.yna.co.kr/rss/all.xml`
- **조선일보**: `https://www.chosun.com/arc/outboundfeeds/rss/?output=xml`
- **동아일보**: `https://www.donga.com/news/RSS/news.donga?p=1&c=`
- **중앙일보**: `https://rss.joins.com/joins_news_list.xml`
- **한겨레**: `https://www.hani.co.kr/rss/`
- **매일경제**: `https://www.mk.co.kr/rss/30000041/`
- **한국경제**: `https://www.hankyung.com/rss/`

### 2.3 주요 태국 뉴스 RSS 피드

- **Bangkok Post**: `https://www.bangkokpost.com/rss/data/topstories.xml`
- **The Nation**: `https://www.nationthailand.com/rss`
- **Thai PBS**: `https://www.thaipbs.or.th/rss`
- **Thairath**: `https://www.thairath.co.th/rss/news`

### 2.4 RSS 파싱 라이브러리

**rss-parser (Node.js):**

```typescript
import Parser from "rss-parser";

const parser = new Parser();

// RSS 피드 파싱
const feed = await parser.parseURL("https://www.yna.co.kr/rss/all.xml");

feed.items.forEach((item) => {
  console.log(item.title);
  console.log(item.content);
  console.log(item.link);
  console.log(item.pubDate);
});
```

**설치:**

```bash
npm install rss-parser
npm install --save-dev @types/rss-parser
```

**장점:**

- 무료 (API 키 불필요)
- 실시간 뉴스 수집
- 신뢰할 수 있는 출처

**단점:**

- 각 뉴스 사이트마다 RSS 형식이 다를 수 있음
- 전체 기사 내용이 아닌 요약만 제공하는 경우가 많음
- 기사 본문을 가져오려면 추가 크롤링 필요

## 3. 웹 크롤링 (Cheerio + Puppeteer)

### 3.1 Cheerio

**개요:**

- 서버 사이드 jQuery 구현
- HTML 파싱 및 DOM 조작

**사용 예시:**

```typescript
import * as cheerio from "cheerio";
import fetch from "node-fetch";

// 뉴스 페이지 가져오기
const response = await fetch("https://www.yna.co.kr/news/article");
const html = await response.text();
const $ = cheerio.load(html);

// 뉴스 제목 추출
$(".news-list li").each((i, elem) => {
  const title = $(elem).find(".title").text();
  const link = $(elem).find("a").attr("href");
  const date = $(elem).find(".date").text();

  console.log({ title, link, date });
});
```

**설치:**

```bash
npm install cheerio
npm install --save-dev @types/cheerio
```

**장점:**

- 빠른 HTML 파싱
- jQuery와 유사한 API
- 서버 사이드에서 실행

**단점:**

- JavaScript 렌더링이 필요한 페이지는 처리 불가
- robots.txt 준수 필요
- 법적 문제 가능성

### 3.2 Puppeteer

**개요:**

- Headless Chrome 제어
- JavaScript 렌더링 지원

**사용 예시:**

```typescript
import puppeteer from "puppeteer";

const browser = await puppeteer.launch();
const page = await browser.newPage();

await page.goto("https://www.yna.co.kr/news");

// 뉴스 제목 추출
const news = await page.evaluate(() => {
  const items = Array.from(document.querySelectorAll(".news-list li"));
  return items.map((item) => ({
    title: item.querySelector(".title")?.textContent,
    link: item.querySelector("a")?.href,
    date: item.querySelector(".date")?.textContent,
  }));
});

await browser.close();
```

**설치:**

```bash
npm install puppeteer
```

**장점:**

- JavaScript 렌더링 지원
- 실제 브라우저 환경
- 스크린샷, PDF 생성 가능

**단점:**

- 리소스 사용량 높음
- 느린 실행 속도
- Chrome 설치 필요

### 3.3 법적 고려사항

**robots.txt 확인:**

- 각 뉴스 사이트의 `robots.txt` 파일 확인
- 크롤링 허용 여부 확인

**이용 약관 확인:**

- 각 뉴스 사이트의 이용 약관 확인
- 크롤링 허용 여부 확인

**저작권 준수:**

- 뉴스 기사는 저작권 보호 대상
- 인용 시 출처 명시 필수

## 4. MCP 서버 활용 방법

### 4.1 현재 프로젝트의 MCP 서버

현재 프로젝트에서 사용 중인 MCP 서버:

- **Supabase MCP**: 데이터베이스 쿼리 실행
- **Vercel MCP**: 배포 관리
- **Sentry MCP**: 에러 추적
- **GitHub MCP**: GitHub 작업 자동화

### 4.2 MCP 서버를 활용한 뉴스 수집 전략

**1. Supabase MCP를 활용한 데이터 저장:**

```typescript
// MCP 서버를 통해 Supabase에 뉴스 저장
// (현재는 직접 Supabase 클라이언트 사용 중)
```

**2. 커스텀 MCP 서버 개발:**

- 뉴스 크롤링 전용 MCP 서버 개발 가능
- RSS 피드 파싱, 웹 크롤링 로직을 MCP 서버로 분리
- AI 에이전트가 직접 뉴스를 수집할 수 있도록 지원

**3. GitHub MCP를 활용한 자동화:**

- 뉴스 수집 스크립트를 GitHub Actions로 실행
- 수집된 뉴스를 GitHub에 커밋하여 버전 관리

### 4.3 커스텀 MCP 서버 개발 예시

**뉴스 크롤링 MCP 서버 구조:**

```typescript
// mcp-server-news-crawler/index.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { RSSParser } from "./rss-parser.js";
import { WebCrawler } from "./web-crawler.js";

const server = new Server({
  name: "news-crawler",
  version: "1.0.0",
});

// RSS 피드 파싱 도구
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "parse_rss_feed",
      description: "RSS 피드를 파싱하여 뉴스를 수집합니다.",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "RSS 피드 URL" },
          limit: { type: "number", description: "수집할 뉴스 개수" },
        },
      },
    },
    {
      name: "crawl_news_page",
      description: "뉴스 페이지를 크롤링하여 기사 내용을 추출합니다.",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "뉴스 기사 URL" },
        },
      },
    },
  ],
}));

// 도구 실행 핸들러
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "parse_rss_feed") {
    const parser = new RSSParser();
    const news = await parser.parse(args.url, args.limit);
    return { content: [{ type: "text", text: JSON.stringify(news) }] };
  }

  if (name === "crawl_news_page") {
    const crawler = new WebCrawler();
    const article = await crawler.crawl(args.url);
    return { content: [{ type: "text", text: JSON.stringify(article) }] };
  }
});
```

**장점:**

- AI 에이전트가 직접 뉴스를 수집할 수 있음
- 코드 재사용성 향상
- 다른 프로젝트에서도 활용 가능

**단점:**

- 개발 시간 필요
- 유지보수 필요

## 5. 방법별 비교

| 방법           | 비용            | 구현 난이도 | 신뢰도 | 한국어 지원 | 태국어 지원 | 제한사항         |
| -------------- | --------------- | ----------- | ------ | ----------- | ----------- | ---------------- |
| **NewsAPI**    | 무료 (500회/일) | 낮음        | 높음   | ✅          | ✅          | 일일 제한        |
| **Mediastack** | 무료 (500회/월) | 낮음        | 높음   | ✅          | ✅          | 월 제한          |
| **GNews**      | 무료 (100회/일) | 낮음        | 높음   | ✅          | ✅          | 일일 제한        |
| **네이버 API** | 무료 (25K회/일) | 낮음        | 높음   | ✅          | ❌          | 한국만           |
| **RSS 피드**   | 무료            | 중간        | 높음   | ✅          | ✅          | 본문 크롤링 필요 |
| **웹 크롤링**  | 무료            | 높음        | 중간   | ✅          | ✅          | 법적 문제 가능   |
| **MCP 서버**   | 무료            | 높음        | 높음   | ✅          | ✅          | 개발 시간 필요   |

## 6. 권장 구현 방안

### 6.1 하이브리드 접근법 (권장)

**1단계: RSS 피드로 뉴스 목록 수집**

- 주요 한국/태국 뉴스 사이트의 RSS 피드 파싱
- 뉴스 제목, 링크, 발행일 수집

**2단계: 웹 크롤링으로 기사 본문 수집**

- RSS에서 얻은 링크로 기사 본문 크롤링
- Cheerio 또는 Puppeteer 사용

**3단계: 할루시네이션 필터링**

- 기존 `hallucination-detector.ts` 로직 활용
- 수집된 뉴스 검증

**4단계: 데이터베이스 저장**

- Supabase에 저장
- 기존 `lib/news-fetcher.ts` 로직 활용

### 6.2 구현 예시 코드

```typescript
// lib/news-crawler/rss-crawler.ts
import Parser from "rss-parser";
import * as cheerio from "cheerio";
import { log } from "../utils/logger";
import { NewsInput } from "@/types/news";

const parser = new Parser();

// 한국 뉴스 RSS 피드 목록
const KOREAN_RSS_FEEDS = [
  "https://www.yna.co.kr/rss/all.xml",
  "https://www.chosun.com/arc/outboundfeeds/rss/?output=xml",
  // ... 기타 RSS 피드
];

// 태국 뉴스 RSS 피드 목록
const THAI_RSS_FEEDS = [
  "https://www.bangkokpost.com/rss/data/topstories.xml",
  "https://www.nationthailand.com/rss",
  // ... 기타 RSS 피드
];

export async function crawlNewsFromRSS(date: string, category: "태국뉴스" | "관련뉴스" | "한국뉴스"): Promise<NewsInput[]> {
  const feeds = category === "태국뉴스" ? THAI_RSS_FEEDS : KOREAN_RSS_FEEDS;
  const newsItems: NewsInput[] = [];

  for (const feedUrl of feeds) {
    try {
      const feed = await parser.parseURL(feedUrl);

      for (const item of feed.items) {
        // 날짜 필터링
        const itemDate = new Date(item.pubDate || "").toISOString().split("T")[0];
        if (itemDate !== date) continue;

        // 기사 본문 크롤링
        const content = await crawlArticleContent(item.link || "");

        if (content) {
          newsItems.push({
            title: item.title || "",
            content: content,
            source_country: category === "태국뉴스" ? "태국" : "한국",
            source_media: feed.title || "Unknown",
            category: category,
            published_date: date,
            // ... 기타 필드
          });
        }
      }
    } catch (error) {
      log.error("RSS 피드 파싱 실패", error instanceof Error ? error : new Error(String(error)), {
        feedUrl,
      });
    }
  }

  return newsItems;
}

async function crawlArticleContent(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    // 뉴스 사이트마다 본문 선택자가 다름
    const content = $(".article-body, .news-content, .article-content").text();

    return content || null;
  } catch (error) {
    log.error("기사 본문 크롤링 실패", error instanceof Error ? error : new Error(String(error)), {
      url,
    });
    return null;
  }
}
```

## 7. 장단점 종합 분석

### 7.1 무료 API 활용

**장점:**

- 빠른 구현
- 신뢰할 수 있는 출처
- API 제공자가 관리

**단점:**

- 요청 제한
- 비용 증가 가능성
- API 의존성

### 7.2 RSS 피드 + 웹 크롤링

**장점:**

- 완전 무료
- 제한 없음
- 유연한 구현

**단점:**

- 구현 복잡도 높음
- 유지보수 필요
- 법적 문제 가능성
- 뉴스 사이트 구조 변경 시 수정 필요

### 7.3 MCP 서버 개발

**장점:**

- 재사용 가능
- AI 에이전트 통합
- 확장성

**단점:**

- 개발 시간 필요
- 초기 투자 필요

## 8. 결론 및 권장사항

### 8.1 즉시 적용 가능한 방법

1. **RSS 피드 파싱** (우선 추천)

   - 무료
   - 신뢰할 수 있는 출처
   - 구현 난이도 중간
   - 기사 본문은 추가 크롤링 필요

2. **NewsAPI 활용**
   - 빠른 구현
   - 하루 500회 제한 (30개 뉴스 수집 시 충분)
   - 한국어/태국어 지원

### 8.2 장기적 개선 방안

1. **하이브리드 접근법**

   - RSS 피드로 뉴스 목록 수집
   - 웹 크롤링으로 기사 본문 수집
   - 할루시네이션 필터링 적용

2. **커스텀 MCP 서버 개발**
   - 뉴스 크롤링 전용 MCP 서버
   - AI 에이전트가 직접 뉴스 수집 가능
   - 재사용성 및 확장성 향상

### 8.3 최종 권장사항

**단기 (1-2주):**

- RSS 피드 파싱 구현
- 주요 한국/태국 뉴스 사이트 RSS 피드 목록 작성
- 기사 본문 크롤링 로직 구현

**중기 (1-2개월):**

- 할루시네이션 필터링 강화
- 뉴스 사이트별 크롤링 로직 최적화
- 에러 처리 및 재시도 로직 추가

**장기 (3개월 이상):**

- 커스텀 MCP 서버 개발
- AI 에이전트 통합
- 자동화 및 모니터링 강화

## 9. 참고 자료

- [NewsAPI 공식 문서](https://newsapi.org/docs)
- [Mediastack 공식 문서](https://mediastack.com/documentation)
- [GNews API 문서](https://gnews.io/docs/v4)
- [네이버 개발자센터](https://developers.naver.com/)
- [rss-parser npm 패키지](https://www.npmjs.com/package/rss-parser)
- [Cheerio 공식 문서](https://cheerio.js.org/)
- [Puppeteer 공식 문서](https://pptr.dev/)
- [Model Context Protocol 공식 문서](https://modelcontextprotocol.io/)
