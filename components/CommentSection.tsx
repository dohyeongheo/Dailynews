"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email?: string | null;
}

interface Comment {
  id: string;
  news_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user: User;
}

interface CommentSectionProps {
  newsId: string;
  initialComments: Comment[];
}

export default function CommentSection({ newsId, initialComments }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
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

  return (
    <div className="mt-12 border-t pt-8">
      <h3 className="text-xl font-bold mb-6">댓글 {comments.length}개</h3>

      {/* 댓글 목록 */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>아직 댓글이 없습니다.</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="border-b border-gray-200 pb-6 last:border-b-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {comment.user.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{comment.user.name || "익명"}</div>
                    <div className="text-sm text-gray-500">{formatDate(comment.created_at)}</div>
                  </div>
                </div>
              </div>
              <div className="ml-13 text-gray-700 whitespace-pre-wrap break-words">{comment.content}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
