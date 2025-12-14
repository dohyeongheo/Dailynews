"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCsrfToken } from "@/lib/hooks/useCsrfToken";

interface NewsReactionsProps {
  newsId: string;
}

export default function NewsReactions({ newsId }: NewsReactionsProps) {
  const { data: session } = useSession();
  const { getHeaders } = useCsrfToken();
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [userReaction, setUserReaction] = useState<"like" | "dislike" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    async function loadReactions() {
      try {
        const res = await fetch(`/api/news/${newsId}/reactions`);
        if (res.ok) {
          const data = await res.json();
          setLikes(data.counts?.likes || 0);
          setDislikes(data.counts?.dislikes || 0);
          setUserReaction(data.userReaction || null);
        }
      } catch (error) {
        console.error("Failed to load reactions:", error);
      } finally {
        setIsInitialLoading(false);
      }
    }

    loadReactions();
  }, [newsId]);

  const handleReaction = async (reactionType: "like" | "dislike") => {
    if (!session) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/news/${newsId}/reactions`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ reactionType }),
      });

      if (res.ok) {
        const data = await res.json();
        setLikes(data.counts?.likes || 0);
        setDislikes(data.counts?.dislikes || 0);
        setUserReaction(data.userReaction || null);
      } else {
        const error = await res.json();
        alert(error.error || "반응을 저장하는데 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to set reaction:", error);
      alert("오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="flex items-center gap-4 py-4 border-t border-b">
        <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
        <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 py-4 border-t border-b">
      <button
        onClick={() => handleReaction("like")}
        disabled={isLoading}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          userReaction === "like" ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        } disabled:opacity-50`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
          />
        </svg>
        <span className="font-medium">{likes}</span>
      </button>

      <button
        onClick={() => handleReaction("dislike")}
        disabled={isLoading}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          userReaction === "dislike" ? "bg-red-100 text-red-700 hover:bg-red-200" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        } disabled:opacity-50`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"
          />
        </svg>
        <span className="font-medium">{dislikes}</span>
      </button>
    </div>
  );
}
