"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ToastProvider";
import { clientLog } from "@/lib/utils/client-logger";

interface SystemStats {
  totalNews: number;
  newsByCategory: {
    태국뉴스: number;
    한국뉴스: number;
    관련뉴스: number;
  };
  failedTranslationCount: number;
  newsWithoutImage: number;
  recentNews: number;
  todayNews: number;
}

export default function Monitoring() {
  const { showError } = useToast();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    loadStats();
    // 30초마다 자동 새로고침
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadStats() {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/metrics");
      if (!response.ok) {
        throw new Error("메트릭 데이터를 불러올 수 없습니다.");
      }
      const data = await response.json();
      if (data.success && data.data) {
        setStats(data.data);
        setLastUpdated(new Date());
      } else {
        throw new Error(data.error || "알 수 없는 오류");
      }
    } catch (error) {
      clientLog.error("메트릭 로드 실패", error instanceof Error ? error : new Error(String(error)));
      showError("메트릭 데이터를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-500">데이터를 불러올 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">시스템 모니터링</h2>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <span className="text-sm text-gray-500">
              마지막 업데이트: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={loadStats}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "새로고침 중..." : "새로고침"}
          </button>
        </div>
      </div>

      {/* 통계 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 전체 뉴스 */}
        <StatCard
          title="전체 뉴스"
          value={stats.totalNews.toLocaleString()}
          icon="📰"
          color="blue"
        />

        {/* 오늘 수집된 뉴스 */}
        <StatCard
          title="오늘 수집된 뉴스"
          value={stats.todayNews.toLocaleString()}
          icon="🆕"
          color="green"
        />

        {/* 최근 7일 뉴스 */}
        <StatCard
          title="최근 7일 뉴스"
          value={stats.recentNews.toLocaleString()}
          icon="📅"
          color="purple"
        />

        {/* 번역 실패 뉴스 */}
        <StatCard
          title="번역 실패 뉴스"
          value={stats.failedTranslationCount.toLocaleString()}
          icon="⚠️"
          color={stats.failedTranslationCount > 0 ? "red" : "gray"}
        />

        {/* 이미지 없는 뉴스 */}
        <StatCard
          title="이미지 없는 뉴스"
          value={stats.newsWithoutImage.toLocaleString()}
          icon="🖼️"
          color={stats.newsWithoutImage > 0 ? "yellow" : "gray"}
        />
      </div>

      {/* 카테고리별 통계 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">카테고리별 뉴스 개수</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CategoryStat
            category="태국뉴스"
            count={stats.newsByCategory.태국뉴스}
            color="yellow"
          />
          <CategoryStat
            category="한국뉴스"
            count={stats.newsByCategory.한국뉴스}
            color="red"
          />
          <CategoryStat
            category="관련뉴스"
            count={stats.newsByCategory.관련뉴스}
            color="blue"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: string;
  color: "blue" | "green" | "purple" | "red" | "yellow" | "gray";
}) {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    green: "bg-green-50 border-green-200 text-green-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
    red: "bg-red-50 border-red-200 text-red-700",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
    gray: "bg-gray-50 border-gray-200 text-gray-700",
  };

  return (
    <div className={`bg-white rounded-lg shadow p-6 border-2 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}

function CategoryStat({
  category,
  count,
  color,
}: {
  category: string;
  count: number;
  color: "yellow" | "red" | "blue";
}) {
  const colorClasses = {
    yellow: "bg-yellow-100 text-yellow-800",
    red: "bg-red-100 text-red-800",
    blue: "bg-blue-100 text-blue-800",
  };

  return (
    <div className={`p-4 rounded-lg ${colorClasses[color]}`}>
      <div className="text-sm font-medium opacity-75">{category}</div>
      <div className="text-2xl font-bold mt-1">{count.toLocaleString()}</div>
    </div>
  );
}

