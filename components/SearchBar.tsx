"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"title" | "content" | "all">("all");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const params = new URLSearchParams({
        q: searchQuery.trim(),
        type: searchType,
      });
      router.push(`/search?${params.toString()}`);
    }
  };

  return (
    <div className="bg-[#232f3e] border-t border-[#3a4553]">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-5">
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-2xl mx-auto">
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as "title" | "content" | "all")}
            className="px-2 sm:px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ff9900] focus:border-transparent text-gray-900 text-xs sm:text-sm flex-shrink-0"
          >
            <option value="all">제목 + 내용</option>
            <option value="title">제목</option>
            <option value="content">내용</option>
          </select>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="뉴스 검색..."
            className="flex-1 min-w-0 px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ff9900] focus:border-transparent text-gray-900 placeholder-gray-500 text-sm"
          />
          <button
            type="submit"
            className="px-4 sm:px-6 py-2 bg-[#ff9900] text-white rounded-md hover:bg-[#e68900] transition-colors font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            검색
          </button>
        </form>
      </div>
    </div>
  );
}
