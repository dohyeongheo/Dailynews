"use client";

import { useState, useEffect } from "react";
import { getAllNewsAction, deleteNewsAction, searchNewsAction } from "@/lib/actions";
import type { News } from "@/types/news";
import NewsForm from "./NewsForm";
import { clientLog } from "@/lib/utils/client-logger";

const PAGE_SIZE = 20;

export default function NewsManagement() {
  const [news, setNews] = useState<News[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"title" | "content" | "all">("all");
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchResults, setSearchResults] = useState<News[]>([]); // 전체 검색 결과 저장
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // 초기 로드 또는 페이지 변경 시
    if (isSearchMode && searchResults.length > 0) {
      // 검색 모드이고 검색 결과가 있으면 클라이언트 측 페이지네이션만 업데이트
      updateSearchPagination(searchResults, currentPage);
    } else if (isSearchMode && searchQuery.trim()) {
      // 검색 모드이지만 검색 결과가 없으면 새로 검색 (예: 검색어 변경 시)
      handleSearch();
    } else if (!isSearchMode) {
      // 검색 모드가 아니면 일반 로드
      loadNews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  async function loadNews() {
    setIsLoading(true);
    try {
      const offset = (currentPage - 1) * PAGE_SIZE;
      const res = await getAllNewsAction(PAGE_SIZE + 1, offset); // +1은 hasMore 판단용

      if (res.success && res.data) {
        // 페이지네이션 판단: 한 페이지 크기보다 많으면 다음 페이지가 있음
        const hasMore = res.data.length > PAGE_SIZE;
        const newsData = hasMore ? res.data.slice(0, PAGE_SIZE) : res.data;

        setNews(newsData);
        // 다음 페이지가 있으면 현재 페이지 + 1을 총 페이지로 설정, 없으면 현재 페이지
        setTotalPages(hasMore ? currentPage + 1 : currentPage);
        // 페이지 변경 시 선택 초기화 (페이지 로드 완료 후)
        setSelectedIds(new Set());
      }
    } catch (error) {
      clientLog.error("Failed to load news", error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSearch(forcePage?: number) {
    const targetPage = forcePage !== undefined ? forcePage : currentPage;

    if (!searchQuery.trim()) {
      setIsSearchMode(false);
      setCurrentPage(1);
      setSearchResults([]);
      loadNews();
      return;
    }

    setIsLoading(true);
    setIsSearchMode(true);
    try {
      const res = await searchNewsAction(searchQuery.trim(), searchType, 1000); // 검색은 최대 1000개
      if (res.success && res.data) {
        // 전체 검색 결과를 저장
        setSearchResults(res.data);

        // 지정된 페이지에 맞는 데이터만 표시
        updateSearchPagination(res.data, targetPage);
        if (forcePage !== undefined) {
          setCurrentPage(targetPage);
        }
      }
    } catch (error) {
      clientLog.error("Failed to search news", error instanceof Error ? error : new Error(String(error)), { searchQuery, searchType });
    } finally {
      setIsLoading(false);
    }
  }

  function updateSearchPagination(results: News[], page: number) {
    const startIndex = (page - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    const paginatedNews = results.slice(startIndex, endIndex);

    setNews(paginatedNews);
    setTotalPages(Math.ceil(results.length / PAGE_SIZE) || 1);
    // 페이지 변경 시 선택 초기화
    setSelectedIds(new Set());
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      return;
    }
    handleSearch(1); // 항상 1페이지부터 검색
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setIsSearchMode(false);
    setSearchResults([]);
    setCurrentPage(1);
    setSelectedIds(new Set()); // 검색 초기화 시 선택도 초기화
    loadNews();
  };

  function toggleSelect(id: string) {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  }

  function toggleSelectAll() {
    if (selectedIds.size === news.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(news.map((n) => n.id)));
    }
  }

  async function handleDeleteSelected() {
    if (selectedIds.size === 0) {
      alert("삭제할 뉴스를 선택해주세요.");
      return;
    }

    if (!confirm(`선택한 ${selectedIds.size}개의 뉴스를 삭제하시겠습니까?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const deletePromises = Array.from(selectedIds).map((id) => deleteNewsAction(id));
      const results = await Promise.allSettled(deletePromises);

      const successCount = results.filter((r) => r.status === "fulfilled" && r.value.success).length;

      if (successCount === selectedIds.size) {
        setSelectedIds(new Set());
        alert(`${successCount}개의 뉴스가 삭제되었습니다.`);
        // 목록 새로고침
        if (isSearchMode && searchQuery.trim()) {
          handleSearch();
        } else {
          loadNews();
        }
      } else {
        alert(`${successCount}/${selectedIds.size}개의 뉴스가 삭제되었습니다.`);
        setSelectedIds(new Set());
        // 목록 새로고침
        if (isSearchMode && searchQuery.trim()) {
          handleSearch();
        } else {
          loadNews();
        }
      }
    } catch (error) {
      clientLog.error("Failed to delete news", error instanceof Error ? error : new Error(String(error)), { selectedCount: selectedIds.size });
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleManualFetch() {
    setIsFetching(true);
    try {
      const res = await fetch("/api/manual/fetch-news", { method: "POST" });
      const data = await res.json();

      if (data.success) {
        alert(data.message);
        loadNews(); // 목록 갱신
      } else {
        alert("뉴스 수집 실패: " + data.message);
      }
    } catch (error) {
      alert("오류가 발생했습니다.");
    } finally {
      setIsFetching(false);
    }
  }

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    loadNews();
  };

  const handleEditSuccess = () => {
    setEditingNews(null);
    loadNews();
  };

  if (isLoading) return <div className="p-8 text-center">로딩 중...</div>;

  if (showCreateForm) {
    return (
      <div>
        <div className="mb-6">
          <button onClick={() => setShowCreateForm(false)} className="text-blue-600 hover:text-blue-800 mb-4">
            ← 목록으로
          </button>
          <h2 className="text-xl font-bold">뉴스 생성</h2>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <NewsForm onSuccess={handleCreateSuccess} onCancel={() => setShowCreateForm(false)} />
        </div>
      </div>
    );
  }

  if (editingNews) {
    return (
      <div>
        <div className="mb-6">
          <button onClick={() => setEditingNews(null)} className="text-blue-600 hover:text-blue-800 mb-4">
            ← 목록으로
          </button>
          <h2 className="text-xl font-bold">뉴스 수정</h2>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <NewsForm news={editingNews} onSuccess={handleEditSuccess} onCancel={() => setEditingNews(null)} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">뉴스 관리</h2>
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              {isDeleting ? "삭제 중..." : `선택한 ${selectedIds.size}개 삭제`}
            </button>
          )}
          <button onClick={() => setShowCreateForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            뉴스 생성
          </button>
          <button
            onClick={handleManualFetch}
            disabled={isFetching}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {isFetching ? "수집 중..." : "뉴스 수동 수집"}
          </button>
        </div>
      </div>

      {/* 검색 영역 */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="검색어를 입력하세요..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as "title" | "content" | "all")}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">전체</option>
              <option value="title">제목</option>
              <option value="content">내용</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              검색
            </button>
            {isSearchMode && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                검색 초기화
              </button>
            )}
          </div>
        </form>
        {isSearchMode && (
          <div className="mt-2 text-sm text-gray-600">
            검색 결과: &quot;{searchQuery}&quot; (전체 {searchResults.length}개, 현재 페이지 {news.length}개)
          </div>
        )}
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={news.length > 0 && selectedIds.size === news.length}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">날짜</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">카테고리</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제목</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {news.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  {isSearchMode ? "검색 결과가 없습니다." : "뉴스가 없습니다."}
                </td>
              </tr>
            ) : (
              news.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(item.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`px-1 py-0.5 inline-flex items-center justify-center text-xs leading-tight font-semibold rounded whitespace-nowrap
                        ${
                          item.category === "태국뉴스"
                            ? "bg-blue-100 text-blue-800"
                            : item.category === "한국뉴스"
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {item.category}
                      </span>
                      {item.news_category && (
                        <span className="px-1 py-0.5 inline-flex items-center justify-center text-xs leading-tight font-semibold rounded bg-purple-100 text-purple-800 whitespace-nowrap">
                          {item.news_category}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                    <button
                      onClick={() => setEditingNews(item)}
                      className="text-left hover:text-blue-600 hover:underline truncate block w-full"
                    >
                      {item.title}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        if (confirm("정말로 이 뉴스를 삭제하시겠습니까?")) {
                          const deletePromise = deleteNewsAction(item.id);
                          deletePromise.then((res) => {
                            if (res.success) {
                              if (isSearchMode && searchQuery.trim()) {
                                handleSearch();
                              } else {
                                loadNews();
                              }
                            } else {
                              alert("삭제 실패: " + res.error);
                            }
                          });
                        }
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center items-center gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            이전
          </button>

          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-4 py-2 border rounded-md ${
                    currentPage === pageNum
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음
          </button>
        </div>
      )}

      {/* 페이지 정보 */}
      <div className="mt-4 text-sm text-gray-600 text-center">
        {isSearchMode ? (
          <span>검색 결과: 전체 {searchResults.length}개 | 페이지 {currentPage} / {totalPages}</span>
        ) : (
          <span>페이지 {currentPage} / {totalPages}</span>
        )}
      </div>
    </div>
  );
}
