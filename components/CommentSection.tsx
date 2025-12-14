"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  updated_at?: string | null;
  user: User;
}

interface CommentSectionProps {
  newsId: string;
  initialComments: Comment[];
  session: {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role?: string;
    };
  } | null;
}

export default function CommentSection({ newsId, initialComments, session }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !session) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newsId, content }),
      });

      const data = await res.json();

      if (res.ok && data.comment) {
        setComments([data.comment, ...comments]);
        setContent("");
        router.refresh(); // 서버 데이터와 동기화
      } else {
        alert("댓글 작성에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to post comment", error);
      alert("오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("정말로 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/comments?commentId=${commentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setComments(comments.filter((c) => c.id !== commentId));
        router.refresh();
      } else {
        alert("댓글 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to delete comment", error);
      alert("오류가 발생했습니다.");
    }
  };

  const handleEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditingContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingContent("");
  };

  const handleUpdate = async (commentId: string) => {
    if (!editingContent.trim()) return;

    setIsUpdating(true);
    try {
      const res = await fetch("/api/comments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, content: editingContent }),
      });

      const data = await res.json();

      if (res.ok && data.comment) {
        setComments(comments.map((c) => (c.id === commentId ? data.comment : c)));
        setEditingId(null);
        setEditingContent("");
        router.refresh();
      } else {
        alert("댓글 수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to update comment", error);
      alert("오류가 발생했습니다.");
    } finally {
      setIsUpdating(false);
    }
  };

  const canDelete = (commentUser: User) => {
    if (!session) return false;
    return session.user.id === commentUser.id || session.user.role === "admin";
  };

  const canEdit = (commentUser: User) => {
    if (!session) return false;
    return session.user.id === commentUser.id;
  };

  return (
    <div className="mt-12 border-t pt-8">
      <h3 className="text-xl font-bold mb-6">댓글 {comments.length}개</h3>

      {/* 댓글 작성 폼 */}
      {session ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="mb-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="댓글을 작성해주세요..."
              className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-24"
              required
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading || !content.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "작성 중..." : "댓글 작성"}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-gray-50 p-6 rounded-lg text-center mb-8">
          <p className="text-gray-600 mb-2">댓글을 작성하려면 로그인이 필요합니다.</p>
          <a href="/auth/signin" className="text-blue-600 hover:underline font-medium">
            로그인하기
          </a>
        </div>
      )}

      {/* 댓글 목록 */}
      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{comment.user.name}</span>
                <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
                {comment.updated_at && comment.updated_at !== comment.created_at && <span className="text-xs text-gray-400">(수정됨)</span>}
              </div>
              <div className="flex gap-2">
                {editingId === comment.id ? (
                  <>
                    <button
                      onClick={() => handleUpdate(comment.id)}
                      disabled={isUpdating || !editingContent.trim()}
                      className="text-xs text-blue-500 hover:text-blue-700 disabled:opacity-50"
                    >
                      {isUpdating ? "저장 중..." : "저장"}
                    </button>
                    <button onClick={handleCancelEdit} disabled={isUpdating} className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50">
                      취소
                    </button>
                  </>
                ) : (
                  <>
                    {canEdit(comment.user) && (
                      <button onClick={() => handleEdit(comment)} className="text-xs text-blue-500 hover:text-blue-700">
                        수정
                      </button>
                    )}
                    {canDelete(comment.user) && (
                      <button onClick={() => handleDelete(comment.id)} className="text-xs text-red-500 hover:text-red-700">
                        삭제
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
            {editingId === comment.id ? (
              <textarea
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-24"
                disabled={isUpdating}
              />
            ) : (
              <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
            )}
          </div>
        ))}
        {comments.length === 0 && <p className="text-center text-gray-500 py-8">첫 번째 댓글을 남겨보세요!</p>}
      </div>
    </div>
  );
}
