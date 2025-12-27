"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function Header() {
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 관리자 인증 상태 확인
    checkAdminAuth();
  }, []);

  async function checkAdminAuth() {
    try {
      const response = await fetch('/api/admin/auth');
      const data = await response.json();
      setIsAdmin(data.success && data.data.authenticated);
    } catch (err) {
      setIsAdmin(false);
    }
  }

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
                <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 relative">
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
                    <defs>
                      <linearGradient id="logoGradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#ff9900"/>
                        <stop offset="0.5" stopColor="#ff7700"/>
                        <stop offset="1" stopColor="#ff5500"/>
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    <rect width="40" height="40" rx="10" fill="url(#logoGradient)" filter="url(#glow)"/>
                    <path d="M10 12h20M10 18h20M10 24h14" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="30" cy="24" r="3.5" fill="white" opacity="0.95"/>
                    <path d="M28 22l4 4M32 22l-4 4" stroke="url(#logoGradient)" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <span className="text-xl font-bold whitespace-nowrap bg-gradient-to-r from-[#ff9900] via-[#ff7700] to-[#ff5500] bg-clip-text text-transparent drop-shadow-sm">Daily News</span>
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
              {/* 카테고리 순서: 태국 뉴스, 한국 뉴스, 태국 관련 뉴스 */}
              <Link
                href="/category/한국뉴스"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  isCategoryActive("한국뉴스") ? "bg-[#ff9900] text-white" : "text-gray-300 hover:bg-[#3a4553] hover:text-white"
                }`}
              >
                한국 뉴스
              </Link>
              <Link
                href="/category/관련뉴스"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  isCategoryActive("관련뉴스") ? "bg-[#ff9900] text-white" : "text-gray-300 hover:bg-[#3a4553] hover:text-white"
                }`}
              >
                태국 관련 뉴스
              </Link>
            </nav>

            {/* 오른쪽: 관리자 메뉴 */}
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Link href="/admin" className="text-sm text-yellow-500 hover:text-yellow-400 font-medium">
                  관리자
                </Link>
              )}
            </div>
          </div>

          {/* 모바일 레이아웃 */}
          <div className="md:hidden">
            {/* 모바일 첫 번째 줄: 로고 */}
            <div className="flex items-center justify-between h-14 py-2">
              <Link href="/" className={`flex items-center gap-2 transition-opacity flex-shrink-0 ${isHomeActive ? "opacity-100" : "hover:opacity-80"}`}>
                <div className="w-9 h-9 flex items-center justify-center relative">
                  <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
                    <defs>
                      <linearGradient id="logoGradientMobile" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#ff9900"/>
                        <stop offset="0.5" stopColor="#ff7700"/>
                        <stop offset="1" stopColor="#ff5500"/>
                      </linearGradient>
                      <filter id="glowMobile">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    <rect width="40" height="40" rx="10" fill="url(#logoGradientMobile)" filter="url(#glowMobile)"/>
                    <path d="M10 12h20M10 18h20M10 24h14" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="30" cy="24" r="3.5" fill="white" opacity="0.95"/>
                    <path d="M28 22l4 4M32 22l-4 4" stroke="url(#logoGradientMobile)" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-[#ff9900] via-[#ff7700] to-[#ff5500] bg-clip-text text-transparent drop-shadow-sm">Daily News</span>
              </Link>

              {/* 모바일 관리자 메뉴 */}
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <Link href="/admin" className="text-xs text-yellow-500 hover:text-yellow-400 font-medium px-2 py-1">
                    관리자
                  </Link>
                )}
              </div>
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
                <option value="/category/한국뉴스">한국 뉴스</option>
                <option value="/category/관련뉴스">태국 관련 뉴스</option>
              </select>
            </div>
          </div>
        </div>
      </div>

    </header>
  );
}
