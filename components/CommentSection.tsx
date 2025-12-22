"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCsrfToken } from "@/lib/hooks/useCsrfToken";
import CommentReactions from "@/components/CommentReactions";

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
  user: User | null;
  guest_name?: string | null;
  user_id?: string | null;
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
  const [guestName, setGuestName] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [editingPassword, setEditingPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const { getHeaders, isLoading: isCsrfTokenLoading } = useCsrfToken();

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
    if (!content.trim() || isCsrfTokenLoading) return;

    // 비회원인 경우 이름과 비밀번호 확인
    if (!session) {
      if (!guestName.trim()) {
        alert("이름을 입력해주세요.");
        return;
      }
      if (!password || password.length !== 4 || !/^\d{4}$/.test(password)) {
        alert("비밀번호는 4자리 숫자여야 합니다.");
        return;
      }
    }

    setIsLoading(true);
    try {
      const requestBody: { newsId: string; content: string; guestName?: string; password?: string } = {
        newsId,
        content,
      };

      // 비회원인 경우 이름과 비밀번호 추가
      if (!session) {
        requestBody.guestName = guestName.trim();
        requestBody.password = password;
      }

      const res = await fetch("/api/comments", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(requestBody),
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok && data.comment) {
        setComments([data.comment, ...comments]);
        setContent("");
        setGuestName("");
        setPassword("");
        router.refresh();
      } else {
        console.error("댓글 작성 실패:", data);
        if (res.status === 403 && data.error === "Invalid CSRF token") {
          alert("보안 토큰이 만료되었습니다. 페이지를 새로고침한 후 다시 시도해주세요.");
          window.location.reload();
        } else {
          alert(data.error?.message || data.error || "댓글 작성에 실패했습니다.");
        }
      }
    } catch (error) {
      console.error("Failed to post comment", error);
      alert("오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (commentId: string, comment: Comment) => {
    if (comment.user_id) {
      // 회원 댓글인 경우
      if (confirm("정말로 삭제하시겠습니까?")) {
        handleDelete(commentId);
      }
    } else {
      // 비회원 댓글인 경우 비밀번호 입력 모달 표시
      setDeletingId(commentId);
      setDeletePassword("");
    }
  };

  const handleDelete = async (commentId: string, passwordForDelete?: string) => {
    setIsDeleting(true);
    try {
      const requestBody: { password?: string } = {};
      if (passwordForDelete) {
        requestBody.password = passwordForDelete;
      }

      const res = await fetch(`/api/comments?commentId=${commentId}`, {
        method: "DELETE",
        headers: getHeaders(),
        body: JSON.stringify(requestBody),
        credentials: "include",
      });

      if (res.ok) {
        setComments(comments.filter((c) => c.id !== commentId));
        setDeletingId(null);
        setDeletePassword("");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        if (res.status === 403 && (data as any).error === "Invalid CSRF token") {
          alert("보안 토큰이 만료되었습니다. 페이지를 새로고침한 후 다시 시도해주세요.");
          window.location.reload();
        } else {
          alert((data as any).error?.message || (data as any).error || "댓글 삭제에 실패했습니다.");
        }
      }
    } catch (error) {
      console.error("Failed to delete comment", error);
      alert("오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (comment: Comment) => {
    if (comment.user_id) {
      // 회원 댓글인 경우 바로 수정 모드로
      setEditingId(comment.id);
      setEditingContent(comment.content);
      setEditingPassword("");
    } else {
      // 비회원 댓글인 경우 비밀번호 입력 모달 표시
      setEditingId(comment.id);
      setEditingContent(comment.content);
      setEditingPassword("");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingContent("");
  };

  const handleUpdate = async (commentId: string) => {
    if (!editingContent.trim() || isCsrfTokenLoading) return;

    const comment = comments.find((c) => c.id === commentId);
    if (!comment) return;

    // 비회원 댓글인 경우 비밀번호 확인
    if (!comment.user_id) {
      if (!editingPassword || editingPassword.length !== 4 || !/^\d{4}$/.test(editingPassword)) {
        alert("비밀번호는 4자리 숫자여야 합니다.");
        return;
      }
    }

    setIsUpdating(true);
    try {
      const requestBody: { commentId: string; content: string; password?: string } = {
        commentId,
        content: editingContent,
      };

      // 비회원 댓글인 경우 비밀번호 추가
      if (!comment.user_id) {
        requestBody.password = editingPassword;
      }

      const res = await fetch("/api/comments", {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify(requestBody),
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok && data.comment) {
        setComments(comments.map((c) => (c.id === commentId ? data.comment : c)));
        setEditingId(null);
        setEditingContent("");
        setEditingPassword("");
        router.refresh();
      } else {
        alert(data.error?.message || data.error || "댓글 수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to update comment", error);
      alert("오류가 발생했습니다.");
    } finally {
      setIsUpdating(false);
    }
  };

  const canDelete = (comment: Comment) => {
    if (comment.user_id) {
      // 회원 댓글인 경우
      if (!session) return false;
      return session.user.id === comment.user_id || session.user.role === "admin";
    } else {
      // 비회원 댓글인 경우 항상 삭제 가능 (비밀번호로 검증)
      return true;
    }
  };

  const canEdit = (comment: Comment) => {
    if (comment.user_id) {
      // 회원 댓글인 경우
      if (!session) return false;
      return session.user.id === comment.user_id;
    } else {
      // 비회원 댓글인 경우 항상 수정 가능 (비밀번호로 검증)
      return true;
    }
  };

  const getCommentAuthorName = (comment: Comment): string => {
    if (comment.user) {
      return comment.user.name;
    } else if (comment.guest_name) {
      return comment.guest_name;
    }
    return "익명";
  };

  return (
    <div className="mt-12 border-t pt-8">
      <h3 className="text-xl font-bold mb-6">댓글 {comments.length}개</h3>

      {/* 댓글 작성 폼 */}
      <form onSubmit={handleSubmit} className="mb-8">
        {!session && (
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="guestName" className="block text-sm font-medium text-gray-700 mb-1">
                이름 *
              </label>
              <input
                id="guestName"
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="이름을 입력하세요"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required={!session}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호 (4자리 숫자) *
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setPassword(value);
                }}
                placeholder="0000"
                maxLength={4}
                pattern="\d{4}"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required={!session}
              />
              <p className="text-xs text-gray-500 mt-1">수정/삭제 시 필요합니다</p>
            </div>
          </div>
        )}
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
            disabled={isLoading || !content.trim() || isCsrfTokenLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading || isCsrfTokenLoading ? "작성 중..." : "댓글 작성"}
          </button>
        </div>
      </form>

      {/* 댓글 목록 */}
      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{getCommentAuthorName(comment)}</span>
                {!comment.user_id && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">비회원</span>}
                <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
                {comment.updated_at && comment.updated_at !== comment.created_at && <span className="text-xs text-gray-400">(수정됨)</span>}
              </div>
              <div className="flex gap-2">
                {editingId === comment.id ? (
                  <>
                    {!comment.user_id && (
                      <div className="mr-2">
                        <input
                          type="password"
                          value={editingPassword}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                            setEditingPassword(value);
                          }}
                          placeholder="비밀번호"
                          maxLength={4}
                          pattern="\d{4}"
                          className="w-20 px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    )}
                    <button
                      onClick={() => handleUpdate(comment.id)}
                      disabled={isUpdating || !editingContent.trim() || (!comment.user_id && editingPassword.length !== 4)}
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
                    {canEdit(comment) && (
                      <button onClick={() => handleEdit(comment)} className="text-xs text-blue-500 hover:text-blue-700">
                        수정
                      </button>
                    )}
                    {canDelete(comment) && (
                      <button onClick={() => handleDeleteClick(comment.id, comment)} className="text-xs text-red-500 hover:text-red-700">
                        삭제
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
            {editingId === comment.id ? (
              <div>
                <textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-24 mb-2"
                  disabled={isUpdating}
                />
              </div>
            ) : (
              <>
                <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                <CommentReactions commentId={comment.id} />
              </>
            )}
            {/* 비회원 댓글 삭제 비밀번호 입력 모달 */}
            {deletingId === comment.id && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                <p className="text-sm text-gray-700 mb-2">비밀번호를 입력하세요:</p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setDeletePassword(value);
                    }}
                    placeholder="0000"
                    maxLength={4}
                    pattern="\d{4}"
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && deletePassword.length === 4) {
                        handleDelete(comment.id, deletePassword);
                      }
                    }}
                  />
                  <button
                    onClick={() => handleDelete(comment.id, deletePassword)}
                    disabled={isDeleting || deletePassword.length !== 4}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {isDeleting ? "삭제 중..." : "삭제"}
                  </button>
                  <button
                    onClick={() => {
                      setDeletingId(null);
                      setDeletePassword("");
                    }}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {comments.length === 0 && <p className="text-center text-gray-500 py-8">첫 번째 댓글을 남겨보세요!</p>}
      </div>
    </div>
  );
}
