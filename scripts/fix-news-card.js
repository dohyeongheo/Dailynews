const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'components', 'NewsCard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. useRouter import 추가
content = content.replace(
  'import Link from "next/link";',
  'import Link from "next/link";\nimport { useRouter } from "next/navigation";'
);

// 2. router 인스턴스 추가
content = content.replace(
  '  const [viewCount, setViewCount] = useState<number | null>(null);',
  '  const [viewCount, setViewCount] = useState<number | null>(null);\n  const router = useRouter();'
);

// 3. getMainCategoryColor 함수 추가
content = content.replace(
  '    return colorMap[category] || "bg-gray-100 text-gray-700 border-gray-200";\n  };\n\n  return (',
  '    return colorMap[category] || "bg-gray-100 text-gray-700 border-gray-200";\n  };\n\n  // 기본 카테고리 색상 매핑\n  const getMainCategoryColor = (category: string) => {\n    const colorMap: Record<string, string> = {\n      태국뉴스: "bg-yellow-100 text-yellow-700 border-yellow-200",\n      관련뉴스: "bg-blue-100 text-blue-700 border-blue-200",\n      한국뉴스: "bg-red-100 text-red-700 border-red-200",\n    };\n    return colorMap[category] || "bg-gray-100 text-gray-700 border-gray-200";\n  };\n\n  return ('
);

// 4. 카테고리 표시 영역 수정
const oldPattern = /<div className="flex items-center gap-2 mb-2">\s*{news\.news_category && \(\s*<Link\s+href=\{\`\/topic\/\$\{encodeURIComponent\(news\.news_category\)\}\`\}\s+onClick=\{\s*\(e\)\s*=>\s*e\.stopPropagation\(\)\s*\}\s+className=\{\`px-2\.5 py-1 rounded-md text-xs font-semibold border \$\{getCategoryColor\(news\.news_category\)\} hover:opacity-80 transition-opacity cursor-pointer\`\}\s*>\s*{news\.news_category}\s*<\/Link>\s*\)}\s*<\/div>/s;

const newContent = `<div className="flex items-center gap-2 mb-2 flex-wrap">
              {/* 기본 카테고리 (category) */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(\`/category/\${encodeURIComponent(news.category)}\`);
                }}
                className={\`px-2.5 py-1 rounded-md text-xs font-semibold border \${getMainCategoryColor(news.category)} hover:opacity-80 transition-opacity cursor-pointer\`}
              >
                {news.category}
              </button>

              {/* 상세 카테고리 (news_category) */}
              {news.news_category && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    router.push(\`/topic/\${encodeURIComponent(news.news_category!)}\`);
                  }}
                  className={\`px-2.5 py-1 rounded-md text-xs font-semibold border \${getCategoryColor(news.news_category)} hover:opacity-80 transition-opacity cursor-pointer\`}
                >
                  {news.news_category}
                </button>
              )}
            </div>`;

content = content.replace(oldPattern, newContent);

fs.writeFileSync(filePath, content, 'utf8');
console.log('NewsCard.tsx 수정 완료');


