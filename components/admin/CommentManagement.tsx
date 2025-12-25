"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { clientLog } from "@/lib/utils/client-logger";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  news_id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  news?: {
    id: string;
    title: string;
  };
}

export default function CommentManagement() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadComments();
  }, []);

  async function loadComments() {
    setIsLoading(true);
    try {
      // 모든 뉴스의 댓글을 가져오기 위해 각 뉴스별로 조회
      // 실제로는 API에서 모든 댓글을 한 번에 가져오는 것이 더 효율적
      const res = await fetch("/api/admin/comments");
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      clientLog.error("Failed to load comments", error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteSelected() {
    if (selectedIds.size === 0) {
      alert("삭제할 댓글을 선택해주세요.");
      return;
    }

    if (!confirm(`선택한 ${selectedIds.size}개의 댓글을 삭제하시겠습니까?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const deletePromises = Array.from(selectedIds).map((id) => fetch(`/api/comments?commentId=${id}`, { method: "DELETE" }));

      const results = await Promise.allSettled(deletePromises);
      const successCount = results.filter((r) => r.status === "fulfilled" && r.value.ok).length;

      if (successCount === selectedIds.size) {
        setComments(comments.filter((c) => !selectedIds.has(c.id)));
        setSelectedIds(new Set());
        alert(`${successCount}개의 댓글이 삭제되었습니다.`);
      } else {
        alert(`${successCount}/${selectedIds.size}개의 댓글이 삭제되었습니다.`);
        loadComments(); // 목록 새로고침
      }
    } catch (error) {
      clientLog.error("Failed to delete comments", error instanceof Error ? error : new Error(String(error)), { selectedCount: selectedIds.size });
    } finally {
      setIsDeleting(false);
    }
  }

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
    if (selectedIds.size === comments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(comments.map((c) => c.id)));
    }
  }

  if (isLoading) return <div className="p-8 text-center">로딩 중...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">댓글 관리 ({comments.length}개)</h2>
        {selectedIds.size > 0 && (
          <button onClick={handleDeleteSelected} disabled={isDeleting} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50">
            {isDeleting ? "삭제 중..." : `선택 삭제 (${selectedIds.size}개)`}
          </button>
        )}
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedIds.size === comments.length && comments.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작성자</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">내용</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">뉴스</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작성일</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {comments.map((comment) => (
              <tr key={comment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(comment.id)}
                    onChange={() => toggleSelect(comment.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{comment.user.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">{comment.content}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {comment.news ? (
                    <Link href={`/news/${comment.news.id}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                      {comment.news.title.substring(0, 30)}...
                    </Link>
                  ) : (
                    <span className="text-gray-400">뉴스 없음</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(comment.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {comments.length === 0 && <div className="p-8 text-center text-gray-500">댓글이 없습니다.</div>}
      </div>
    </div>
  );
}
