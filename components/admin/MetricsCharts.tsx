"use client";

import { useState, useEffect } from "react";
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
import { useToast } from "@/components/ToastProvider";
import { clientLog } from "@/lib/utils/client-logger";

interface MetricDataPoint {
  created_at: string;
  metric_value: number;
  metadata?: Record<string, unknown>;
}

interface MetricsHistoryResponse {
  success: boolean;
  data?: {
    metrics: MetricDataPoint[];
    count: number;
    query: {
      metricType?: string;
      metricName?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
    };
  };
  error?: string;
}

interface MetricsChartsProps {
  metricType: "performance" | "business" | "system";
  metricName: string;
  title: string;
  yAxisLabel?: string;
  chartType?: "line" | "bar";
  days?: number; // 기본값: 7
}

export default function MetricsCharts({
  metricType,
  metricName,
  title,
  yAxisLabel,
  chartType = "line",
  days = 7,
}: MetricsChartsProps) {
  const { showError } = useToast();
  const [data, setData] = useState<MetricDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, [metricType, metricName, days]);

  async function loadMetrics() {
    try {
      setIsLoading(true);
      const endDate = new Date();
      const startDate = new Date();
      // UTC 기준으로 날짜 계산
      startDate.setUTCDate(startDate.getUTCDate() - days);
      startDate.setUTCHours(0, 0, 0, 0);
      endDate.setUTCHours(23, 59, 59, 999);

      const params = new URLSearchParams({
        metricType,
        metricName,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: "200",
      });

      const response = await fetch(`/api/admin/metrics/history?${params.toString()}`);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "메트릭 데이터를 불러올 수 없습니다.";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error?.message || errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(`${errorMessage} (HTTP ${response.status})`);
      }

      const result: MetricsHistoryResponse = await response.json();

      clientLog.debug("메트릭 히스토리 API 응답", {
        success: result.success,
        hasData: !!result.data,
        metricsCount: result.data?.metrics?.length || 0,
        metricType,
        metricName,
      });

      if (result.success && result.data && result.data.metrics) {
        // 시간순으로 정렬하고 날짜 형식 변환
        const sortedData = result.data.metrics
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          .map((item) => ({
            ...item,
            time: new Date(item.created_at).toLocaleString("ko-KR", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
          }));

        clientLog.debug("메트릭 데이터 처리 완료", {
          originalCount: result.data.metrics.length,
          sortedCount: sortedData.length,
          metricType,
          metricName,
        });

        setData(sortedData);
      } else {
        // 에러 응답 형식 처리
        let errorMessage = "알 수 없는 오류";
        if (result.error) {
          if (typeof result.error === "string") {
            errorMessage = result.error;
          } else if (typeof result.error === "object" && result.error !== null && "message" in result.error) {
            errorMessage = String((result.error as { message: unknown }).message);
          }
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      clientLog.error("메트릭 로드 실패", error instanceof Error ? error : new Error(String(error)), {
        metricType,
        metricName,
        errorMessage,
      });
      // 차트별로 에러를 표시하지 않고 조용히 실패 (여러 차트가 동시에 로드되므로)
      // showError는 호출하지 않음
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">데이터가 없습니다.</div>
      </div>
    );
  }

  const ChartComponent = chartType === "line" ? LineChart : BarChart;
  const DataComponent = chartType === "line" ? Line : Bar;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ChartComponent data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" angle={-45} textAnchor="end" height={80} />
          <YAxis label={{ value: yAxisLabel || "값", angle: -90, position: "insideLeft" }} />
          <Tooltip
            formatter={(value: number | undefined) => {
              if (value === undefined) return "";
              if (metricName.includes("rate") || metricName.includes("success_rate")) {
                return `${value.toFixed(2)}%`;
              }
              return value.toLocaleString();
            }}
            labelFormatter={(label) => `시간: ${label}`}
          />
          <Legend />
          <DataComponent
            type={chartType === "line" ? "monotone" : undefined}
            dataKey="metric_value"
            stroke="#3b82f6"
            fill="#3b82f6"
            name={yAxisLabel || "값"}
          />
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}

