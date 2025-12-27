"use client";

import { useRouter } from "next/navigation";

interface CategoryBadgeProps {
  category: string;
  type: "main" | "topic";
  className?: string;
}

export default function CategoryBadge({ category, type, className = "" }: CategoryBadgeProps) {
  const router = useRouter();

  const getColor = () => {
    if (type === "main") {
      const colorMap: Record<string, string> = {
        태국뉴스: "bg-yellow-100 text-yellow-700 border-yellow-200",
        관련뉴스: "bg-blue-100 text-blue-700 border-blue-200",
        한국뉴스: "bg-red-100 text-red-700 border-red-200",
      };
      return colorMap[category] || "bg-gray-100 text-gray-700 border-gray-200";
    } else {
      const colorMap: Record<string, string> = {
        정치: "bg-red-100 text-red-700 border-red-200",
        경제: "bg-blue-100 text-blue-700 border-blue-200",
        사회: "bg-green-100 text-green-700 border-green-200",
        과학: "bg-purple-100 text-purple-700 border-purple-200",
        스포츠: "bg-orange-100 text-orange-700 border-orange-200",
        문화: "bg-pink-100 text-pink-700 border-pink-200",
        기술: "bg-indigo-100 text-indigo-700 border-indigo-200",
        건강: "bg-teal-100 text-teal-700 border-teal-200",
        환경: "bg-emerald-100 text-emerald-700 border-emerald-200",
        국제: "bg-cyan-100 text-cyan-700 border-cyan-200",
        기타: "bg-gray-100 text-gray-700 border-gray-200",
      };
      return colorMap[category] || "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const handleClick = () => {
    if (type === "main") {
      router.push(`/category/${encodeURIComponent(category)}`);
    } else {
      router.push(`/topic/${encodeURIComponent(category)}`);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`px-3 py-1.5 rounded-md text-sm font-semibold border ${getColor()} hover:opacity-80 transition-opacity cursor-pointer ${className}`}
    >
      {category}
    </button>
  );
}


