"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ToastProvider";
import { clientLog } from "@/lib/utils/client-logger";
import type { AnalyticsStats } from "@/lib/types/analytics";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function AnalyticsDashboard() {
  const { showError } = useToast();
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    loadStats();
  }, [dateRange]);

  async function loadStats() {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        start_date: dateRange.start,
        end_date: dateRange.end,
      });

      const response = await fetch(`/api/admin/analytics?${params.toString()}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Analytics 데이터를 불러올 수 없습니다.");
      }

      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      clientLog.error("Analytics 데이터 로드 실패", error);
      showError("Analytics 데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">데이터가 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 날짜 범위 선택 */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">기간 선택:</label>
        <input
          type="date"
          value={dateRange.start}
          onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
        <span className="text-gray-500">~</span>
        <input
          type="date"
          value={dateRange.end}
          onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="총 페이지뷰" value={stats.total_page_views.toLocaleString()} />
        <StatCard title="고유 방문자" value={stats.unique_visitors.toLocaleString()} />
        <StatCard title="고유 사용자" value={stats.unique_users.toLocaleString()} />
        <StatCard title="총 세션" value={stats.total_sessions.toLocaleString()} />
        <StatCard
          title="평균 세션 시간"
          value={stats.avg_session_duration ? `${Math.round(stats.avg_session_duration)}초` : "N/A"}
        />
        <StatCard
          title="이탈률"
          value={stats.bounce_rate ? `${stats.bounce_rate.toFixed(1)}%` : "N/A"}
        />
      </div>

      {/* 인기 페이지 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">인기 페이지</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.top_pages.slice(0, 10)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="path" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="views" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 인기 이벤트 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">인기 이벤트</h3>
        <div className="space-y-2">
          {stats.top_events.slice(0, 10).map((event) => (
            <div key={event.event_name} className="flex items-center justify-between p-2 hover:bg-gray-50">
              <span className="text-sm">{event.event_name}</span>
              <span className="text-sm font-medium">{event.count.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 디바이스 타입별 통계 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">디바이스 타입별 통계</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={Object.entries(stats.device_types).map(([type, count]) => ({ type, count }))}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="type" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 국가별 통계 */}
      {Object.keys(stats.countries).length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">국가별 통계</h3>
          <div className="space-y-2">
            {Object.entries(stats.countries)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 10)
              .map(([country, count]) => (
                <div key={country} className="flex items-center justify-between p-2 hover:bg-gray-50">
                  <span className="text-sm">{country}</span>
                  <span className="text-sm font-medium">{count.toLocaleString()}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h4 className="text-sm font-medium text-gray-500 mb-2">{title}</h4>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}





