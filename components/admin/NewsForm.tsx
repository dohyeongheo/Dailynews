"use client";

import { useState, useRef } from "react";
import type { News, NewsCategory, NewsTopicCategory } from "@/types/news";
import { clientLog } from "@/lib/utils/client-logger";
import { useToast } from "@/components/ToastProvider";
import Image from "next/image";

interface NewsFormProps {
  news?: News;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function NewsForm({ news, onSuccess, onCancel }: NewsFormProps) {
  const isEditMode = !!news;
  const { showSuccess, showError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: news?.title || "",
    content: news?.content || "",
    content_translated: news?.content_translated || "",
    category: (news?.category || "태국뉴스") as NewsCategory,
    news_category: (news?.news_category || null) as NewsTopicCategory | null,
    source_country: news?.source_country || "",
    source_media: news?.source_media || "",
    published_date: news?.published_date || new Date().toISOString().split("T")[0],
  });
  const [imageUrl, setImageUrl] = useState<string | null>(news?.image_url || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isImageDeleting, setIsImageDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const url = isEditMode ? `/api/admin/news/${news.id}` : "/api/admin/news";

      const method = isEditMode ? "PATCH" : "POST";

      // image_url도 함께 전송
      const submitData = {
        ...formData,
        image_url: imageUrl,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isEditMode || !news?.id) return;

    // 파일 타입 검증
    if (!file.type.startsWith("image/")) {
      showError("이미지 파일만 업로드 가능합니다.");
      return;
    }

    // 파일 크기 제한 (10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      showError("이미지 크기는 10MB를 초과할 수 없습니다.");
      return;
    }

    setIsImageUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(`/api/admin/news/${news.id}/image`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setImageUrl(data.data.imageUrl);
        showSuccess("이미지가 업로드되었습니다.");
      } else {
        showError(data.error || "이미지 업로드에 실패했습니다.");
      }
    } catch (err) {
      showError("이미지 업로드 중 오류가 발생했습니다.");
      clientLog.error("Image upload error", err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsImageUploading(false);
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleImageDelete = async () => {
    if (!isEditMode || !news?.id || !imageUrl) return;

    if (!confirm("이미지를 삭제하시겠습니까?")) return;

    setIsImageDeleting(true);

    try {
      const res = await fetch(`/api/admin/news/${news.id}/image`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setImageUrl(null);
        showSuccess("이미지가 삭제되었습니다.");
      } else {
        showError(data.error || "이미지 삭제에 실패했습니다.");
      }
    } catch (err) {
      showError("이미지 삭제 중 오류가 발생했습니다.");
      clientLog.error("Image delete error", err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsImageDeleting(false);
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
            onChange={(e) => {
              const value = e.target.value;
              const validCategories: NewsTopicCategory[] = ["과학", "사회", "정치", "경제", "스포츠", "문화", "기술", "건강", "환경", "국제", "기타"];
              const newsCategory: NewsTopicCategory | null = value && validCategories.includes(value as NewsTopicCategory) ? (value as NewsTopicCategory) : null;
              setFormData({ ...formData, news_category: newsCategory });
            }}
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


      {/* 이미지 관리 섹션 (수정 모드에서만 표시) */}
      {isEditMode && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">뉴스 이미지</label>
          <div className="space-y-4">
            {imageUrl ? (
              <div className="relative">
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <div className="relative w-full h-64 mb-4">
                    <Image
                      src={imageUrl}
                      alt="뉴스 이미지"
                      fill
                      className="object-contain rounded-lg"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  <div className="flex gap-2">
                    <label className="flex-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isImageUploading || isImageDeleting}
                        className="hidden"
                      />
                      <span className="block w-full px-4 py-2 text-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
                        {isImageUploading ? "업로드 중..." : "이미지 변경"}
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={handleImageDelete}
                      disabled={isImageUploading || isImageDeleting}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      {isImageDeleting ? "삭제 중..." : "이미지 삭제"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                <p className="text-sm text-gray-500 mb-4">이미지가 없습니다.</p>
                <label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isImageUploading}
                    className="hidden"
                  />
                  <span className="block w-full px-4 py-2 text-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
                    {isImageUploading ? "업로드 중..." : "이미지 업로드"}
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>
      )}

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
