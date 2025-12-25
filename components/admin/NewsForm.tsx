"use client";

import { useState } from "react";
import type { News, NewsCategory, NewsTopicCategory } from "@/types/news";
import { clientLog } from "@/lib/utils/client-logger";

interface NewsFormProps {
  news?: News;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function NewsForm({ news, onSuccess, onCancel }: NewsFormProps) {
  const isEditMode = !!news;
  const [formData, setFormData] = useState({
    title: news?.title || "",
    content: news?.content || "",
    content_translated: news?.content_translated || "",
    category: (news?.category || "태국뉴스") as NewsCategory,
    news_category: (news?.news_category || null) as NewsTopicCategory | null,
    source_country: news?.source_country || "",
    source_media: news?.source_media || "",
    original_link: news?.original_link || "",
    published_date: news?.published_date || new Date().toISOString().split("T")[0],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const url = isEditMode ? `/api/admin/news/${news.id}` : "/api/admin/news";

      const method = isEditMode ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(data.error || "뉴스 저장에 실패했습니다.");
      }
    } catch (err) {
      setError("오류가 발생했습니다.");
      clientLog.error("News form error", err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          제목 *
        </label>
        <input
          id="title"
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
          내용 *
        </label>
        <textarea
          id="content"
          required
          rows={6}
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      <div>
        <label htmlFor="content_translated" className="block text-sm font-medium text-gray-700 mb-1">
          번역된 내용
        </label>
        <textarea
          id="content_translated"
          rows={6}
          value={formData.content_translated}
          onChange={(e) => setFormData({ ...formData, content_translated: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            카테고리 *
          </label>
          <select
            id="category"
            required
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as NewsCategory })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="태국뉴스">태국뉴스</option>
            <option value="관련뉴스">관련뉴스</option>
            <option value="한국뉴스">한국뉴스</option>
          </select>
        </div>

        <div>
          <label htmlFor="news_category" className="block text-sm font-medium text-gray-700 mb-1">
            뉴스 주제 분류
          </label>
          <select
            id="news_category"
            value={formData.news_category || ""}
            onChange={(e) => setFormData({ ...formData, news_category: e.target.value || null as NewsTopicCategory | null })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">선택 안 함</option>
            <option value="과학">과학</option>
            <option value="사회">사회</option>
            <option value="정치">정치</option>
            <option value="경제">경제</option>
            <option value="스포츠">스포츠</option>
            <option value="문화">문화</option>
            <option value="기술">기술</option>
            <option value="건강">건강</option>
            <option value="환경">환경</option>
            <option value="국제">국제</option>
            <option value="기타">기타</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="published_date" className="block text-sm font-medium text-gray-700 mb-1">
            발행일 *
          </label>
          <input
            id="published_date"
            type="date"
            required
            value={formData.published_date}
            onChange={(e) => setFormData({ ...formData, published_date: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="source_country" className="block text-sm font-medium text-gray-700 mb-1">
            출처 국가
          </label>
          <input
            id="source_country"
            type="text"
            value={formData.source_country}
            onChange={(e) => setFormData({ ...formData, source_country: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="source_media" className="block text-sm font-medium text-gray-700 mb-1">
            출처 미디어
          </label>
          <input
            id="source_media"
            type="text"
            value={formData.source_media}
            onChange={(e) => setFormData({ ...formData, source_media: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label htmlFor="original_link" className="block text-sm font-medium text-gray-700 mb-1">
          원문 링크
        </label>
        <input
          id="original_link"
          type="url"
          value={formData.original_link}
          onChange={(e) => setFormData({ ...formData, original_link: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            취소
          </button>
        )}
        <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {isLoading ? "저장 중..." : isEditMode ? "수정" : "생성"}
        </button>
      </div>
    </form>
  );
}
