import Link from "next/link";
import type { News } from "@/types/news";
import NewsCard from "./NewsCard";

interface RelatedNewsProps {
  news: News[];
  currentNewsId: string;
}

export default function RelatedNews({ news, currentNewsId }: RelatedNewsProps) {
  if (news.length === 0) {
    return null;
  }

  // 현재 뉴스 제외
  const filteredNews = news.filter((item) => item.id !== currentNewsId);

  if (filteredNews.length === 0) {
    return null;
  }

  return (
    <section className="mt-12 border-t pt-8">
      <h3 className="text-xl font-bold mb-6">관련 뉴스</h3>
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {filteredNews.slice(0, 5).map((item) => (
          <NewsCard key={item.id} news={item} showOriginalLink={true} />
        ))}
      </div>
    </section>
  );
}
