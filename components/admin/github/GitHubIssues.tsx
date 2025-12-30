"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ToastProvider";
import { clientLog } from "@/lib/utils/client-logger";

interface Issue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: string;
  labels: Array<{ name: string; color: string }>;
  created_at: string;
  updated_at: string;
  html_url: string;
  user: {
    login: string;
    avatar_url: string;
  };
}

export default function GitHubIssues() {
  const { showError, showSuccess } = useToast();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<{ state: string }>({ state: "all" });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newIssue, setNewIssue] = useState({ title: "", body: "", labels: "" });

  useEffect(() => {
    loadIssues();
  }, [filter]);

  async function loadIssues() {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append("state", filter.state);
      params.append("perPage", "30");

      const response = await fetch(`/api/admin/github/issues?${params.toString()}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("이슈 목록을 불러올 수 없습니다.");
      }

      const data = await response.json();
      if (data.success) {
        setIssues(data.data || []);
      }
    } catch (error) {
      clientLog.error("이슈 목록 로드 실패", error);
      showError("이슈 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateIssue() {
    try {
      const labels = newIssue.labels
        .split(",")
        .map((label) => label.trim())
        .filter((label) => label.length > 0);

      const response = await fetch("/api/admin/github/issues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: newIssue.title,
          body: newIssue.body,
          labels,
        }),
      });

      if (!response.ok) {
        throw new Error("이슈 생성에 실패했습니다.");
      }

      showSuccess("이슈가 생성되었습니다.");
      setShowCreateForm(false);
      setNewIssue({ title: "", body: "", labels: "" });
      loadIssues();
    } catch (error) {
      clientLog.error("이슈 생성 실패", error);
      showError("이슈 생성 중 오류가 발생했습니다.");
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString("ko-KR");
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">이슈 관리</h2>
        <div className="flex space-x-2">
          <select
            value={filter.state}
            onChange={(e) => setFilter({ state: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">전체</option>
            <option value="open">열림</option>
            <option value="closed">닫힘</option>
          </select>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            이슈 생성
          </button>
          <button
            onClick={loadIssues}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            새로고침
          </button>
        </div>
      </div>

      {/* 이슈 생성 폼 */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">새 이슈 생성</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제목
              </label>
              <input
                type="text"
                value={newIssue.title}
                onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="이슈 제목을 입력하세요"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                내용
              </label>
              <textarea
                value={newIssue.body}
                onChange={(e) => setNewIssue({ ...newIssue, body: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={5}
                placeholder="이슈 내용을 입력하세요"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                라벨 (쉼표로 구분)
              </label>
              <input
                type="text"
                value={newIssue.labels}
                onChange={(e) => setNewIssue({ ...newIssue, labels: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="bug, enhancement"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleCreateIssue}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                생성
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 이슈 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">이슈 목록</h3>
        </div>
        {isLoading ? (
          <div className="p-6 text-center text-gray-500">로딩 중...</div>
        ) : issues.length === 0 ? (
          <div className="p-6 text-center text-gray-500">이슈가 없습니다.</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {issues.map((issue) => (
              <div key={issue.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <a
                        href={issue.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg font-semibold text-gray-900 hover:text-blue-600"
                      >
                        #{issue.number} {issue.title}
                      </a>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          issue.state === "open"
                            ? "text-green-600 bg-green-50"
                            : "text-gray-600 bg-gray-50"
                        }`}
                      >
                        {issue.state === "open" ? "열림" : "닫힘"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {issue.body || "내용 없음"}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>작성자: {issue.user.login}</span>
                      <span>생성: {formatDate(issue.created_at)}</span>
                      <span>수정: {formatDate(issue.updated_at)}</span>
                    </div>
                    {issue.labels.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {issue.labels.map((label) => (
                          <span
                            key={label.name}
                            className="px-2 py-1 text-xs font-medium rounded-full"
                            style={{
                              backgroundColor: `#${label.color}20`,
                              color: `#${label.color}`,
                            }}
                          >
                            {label.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

