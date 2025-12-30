"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ToastProvider";
import { clientLog } from "@/lib/utils/client-logger";

interface Workflow {
  id: number;
  name: string;
  path: string;
  state: string;
  created_at: string;
  updated_at: string;
}

interface WorkflowRun {
  id: number;
  name: string;
  head_branch: string;
  head_sha: string;
  run_number: number;
  event: string;
  status: string;
  conclusion: string | null;
  created_at: string;
  updated_at: string;
  html_url: string;
}

export default function GitHubWorkflows() {
  const { showError, showSuccess } = useToast();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<{
    status?: string;
    conclusion?: string;
  }>({});

  useEffect(() => {
    loadWorkflows();
    loadWorkflowRuns();
  }, [selectedWorkflow, filter]);

  async function loadWorkflows() {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/github/workflows", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("워크플로우 목록을 불러올 수 없습니다.");
      }

      const data = await response.json();
      if (data.success) {
        setWorkflows(data.data.workflows || []);
      }
    } catch (error) {
      clientLog.error("워크플로우 목록 로드 실패", error);
      showError("워크플로우 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadWorkflowRuns() {
    try {
      const params = new URLSearchParams();
      if (selectedWorkflow) {
        params.append("workflowId", selectedWorkflow.toString());
      }
      if (filter.status) {
        params.append("status", filter.status);
      }
      if (filter.conclusion) {
        params.append("conclusion", filter.conclusion);
      }
      params.append("perPage", "20");

      const response = await fetch(
        `/api/admin/github/workflows/runs?${params.toString()}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("워크플로우 실행 기록을 불러올 수 없습니다.");
      }

      const data = await response.json();
      if (data.success) {
        setRuns(data.data.workflow_runs || []);
      }
    } catch (error) {
      clientLog.error("워크플로우 실행 기록 로드 실패", error);
      showError("워크플로우 실행 기록을 불러오는 중 오류가 발생했습니다.");
    }
  }

  async function handleRerun(runId: number) {
    try {
      const response = await fetch(`/api/admin/github/workflows/runs/${runId}/rerun`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("워크플로우 재실행에 실패했습니다.");
      }

      showSuccess("워크플로우가 재실행되었습니다.");
      loadWorkflowRuns();
    } catch (error) {
      clientLog.error("워크플로우 재실행 실패", error);
      showError("워크플로우 재실행 중 오류가 발생했습니다.");
    }
  }

  function getConclusionColor(conclusion: string | null) {
    switch (conclusion) {
      case "success":
        return "text-green-600 bg-green-50";
      case "failure":
        return "text-red-600 bg-red-50";
      case "cancelled":
        return "text-gray-600 bg-gray-50";
      case "skipped":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString("ko-KR");
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">워크플로우 관리</h2>
        <button
          onClick={loadWorkflowRuns}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          새로고침
        </button>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              워크플로우 선택
            </label>
            <select
              value={selectedWorkflow || ""}
              onChange={(e) =>
                setSelectedWorkflow(e.target.value ? Number(e.target.value) : null)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">전체</option>
              {workflows.map((workflow) => (
                <option key={workflow.id} value={workflow.id}>
                  {workflow.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상태
            </label>
            <select
              value={filter.status || ""}
              onChange={(e) =>
                setFilter({ ...filter, status: e.target.value || undefined })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">전체</option>
              <option value="queued">대기 중</option>
              <option value="in_progress">실행 중</option>
              <option value="completed">완료</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              결과
            </label>
            <select
              value={filter.conclusion || ""}
              onChange={(e) =>
                setFilter({ ...filter, conclusion: e.target.value || undefined })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">전체</option>
              <option value="success">성공</option>
              <option value="failure">실패</option>
              <option value="cancelled">취소됨</option>
              <option value="skipped">건너뜀</option>
            </select>
          </div>
        </div>
      </div>

      {/* 실행 기록 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">실행 기록</h3>
        </div>
        {isLoading ? (
          <div className="p-6 text-center text-gray-500">로딩 중...</div>
        ) : runs.length === 0 ? (
          <div className="p-6 text-center text-gray-500">실행 기록이 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    실행 번호
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    워크플로우
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    브랜치
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이벤트
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    실행 시간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {runs.map((run) => (
                  <tr key={run.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{run.run_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {run.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {run.head_branch}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {run.event}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getConclusionColor(
                          run.conclusion
                        )}`}
                      >
                        {run.conclusion || run.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(run.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <a
                          href={run.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900"
                        >
                          보기
                        </a>
                        {run.conclusion === "failure" && (
                          <button
                            onClick={() => handleRerun(run.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            재실행
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

