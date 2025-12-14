"use client";

import { useState, useEffect } from "react";
import { getAllNewsAction, deleteNewsAction } from "@/lib/actions";
import type { News } from "@/types/news";
import NewsForm from "./NewsForm";

export default function NewsManagement() {
  const [news, setNews] = useState<News[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [limit] = useState(20);

  useEffect(() => {
    loadNews();
  }, []);

  async function loadNews() {
    setIsLoading(true);
    try {
      // getAllNewsAction이 페이지네이션을 제대로 지원해야 함.
      // 현재는 간단히 구현.
      const res = await getAllNewsAction(); // limit 인자 필요할 수 있음
      if (res.success && res.data) {
        setNews(res.data);
      }
    } catch (error) {
      console.error("Failed to load news", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("정말로 이 뉴스를 삭제하시겠습니까?")) return;

    try {
      const res = await deleteNewsAction(id);
      if (res.success) {
        setNews(news.filter((item) => item.id !== id));
      } else {
        alert("삭제 실패: " + res.error);
      }
    } catch (error) {
      alert("오류가 발생했습니다.");
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

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">날짜</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">카테고리</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제목</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {news.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(item.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
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
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">{item.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingNews(item)} className="text-blue-600 hover:text-blue-900">
                      수정
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">
                      삭제
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
