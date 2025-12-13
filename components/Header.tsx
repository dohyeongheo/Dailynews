"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"title" | "content" | "all">("all");
  const router = useRouter();
  const pathname = usePathname();

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

  const isCategoryActive = (category: string) => {
    return pathname === `/category/${encodeURIComponent(category)}`;
  };

  const isHomeActive = pathname === "/";

  return (
    <header className="bg-[#232f3e] text-white shadow-lg sticky top-0 z-50" role="banner">
      {/* 첫 번째 줄: 로고, 카테고리 버튼 */}
      <div className="border-b border-[#3a4553]">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          {/* 데스크톱 레이아웃 */}
          <div className="hidden md:flex items-center justify-between h-16">
            {/* 왼쪽: 로고 및 텍스트 */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <Link href="/" className={`flex items-center gap-2 transition-opacity ${isHomeActive ? "opacity-100" : "hover:opacity-80"}`}>
                <div className="w-8 h-8 bg-[#ff9900] rounded flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">DN</span>
                </div>
                <span className="text-lg font-semibold whitespace-nowrap">Daily News</span>
              </Link>
            </div>

            {/* 가운데: 카테고리 버튼 */}
            <nav className="flex items-center gap-1 flex-1 justify-center px-4" role="navigation" aria-label="카테고리 메뉴">
              <Link
                href="/category/태국뉴스"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  isCategoryActive("태국뉴스") ? "bg-[#ff9900] text-white" : "text-gray-300 hover:bg-[#3a4553] hover:text-white"
                }`}
              >
                태국 뉴스
              </Link>
              <Link
                href="/category/관련뉴스"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  isCategoryActive("관련뉴스") ? "bg-[#ff9900] text-white" : "text-gray-300 hover:bg-[#3a4553] hover:text-white"
                }`}
              >
                한국 뉴스 (태국 관련)
              </Link>
              <Link
                href="/category/한국뉴스"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  isCategoryActive("한국뉴스") ? "bg-[#ff9900] text-white" : "text-gray-300 hover:bg-[#3a4553] hover:text-white"
                }`}
              >
                한국 뉴스
              </Link>
            </nav>
          </div>

          {/* 모바일 레이아웃 */}
          <div className="md:hidden">
            {/* 모바일 첫 번째 줄: 로고 */}
            <div className="flex items-center justify-between h-14 py-2">
              <Link href="/" className={`flex items-center gap-2 transition-opacity flex-shrink-0 ${isHomeActive ? "opacity-100" : "hover:opacity-80"}`}>
                <div className="w-7 h-7 bg-[#ff9900] rounded flex items-center justify-center">
                  <span className="text-white font-bold text-xs">DN</span>
                </div>
                <span className="text-base font-semibold">Daily News</span>
              </Link>
            </div>

            {/* 모바일 두 번째 줄: 카테고리 드롭다운 */}
            <div className="pb-2">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    router.push(e.target.value);
                  }
                }}
                value={pathname.startsWith("/category/") ? pathname : ""}
                className="w-full px-3 py-2 bg-[#3a4553] text-white rounded-md text-sm border border-[#4a5568] focus:outline-none focus:ring-2 focus:ring-[#ff9900] appearance-none"
              >
                <option value="">카테고리 선택</option>
                <option value="/category/태국뉴스">태국 뉴스</option>
                <option value="/category/관련뉴스">한국 뉴스 (태국 관련)</option>
                <option value="/category/한국뉴스">한국 뉴스</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 두 번째 줄: 검색 기능 */}
      <div className="bg-[#232f3e] border-b border-[#3a4553]">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-2.5 sm:py-3">
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
              className="px-4 sm:px-6 py-2 bg-[#ff9900] text-white rounded-md hover:bg-[#e68900] transition-colors font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0"
            >
              검색
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
