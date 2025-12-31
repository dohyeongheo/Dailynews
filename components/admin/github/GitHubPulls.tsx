"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ToastProvider";
import { clientLog } from "@/lib/utils/client-logger";

interface PullRequest {
  id: number;
  number: number;
  title: string;
  body: string;
  state: string;
  head: { ref: string; sha: string };
  base: { ref: string; sha: string };
  created_at: string;
  updated_at: string;
  html_url: string;
  user: {
    login: string;
    avatar_url: string;
  };
  merged: boolean;
  mergeable: boolean | null;
}

export default function GitHubPulls() {
  const { showError, showSuccess } = useToast();
  const [pulls, setPulls] = useState<PullRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<{ state: string }>({ state: "all" });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPR, setNewPR] = useState({ title: "", head: "", base: "main", body: "" });

  useEffect(() => {
    loadPullRequests();
  }, [filter]);

  async function loadPullRequests() {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append("state", filter.state);
      params.append("perPage", "30");

      const response = await fetch(`/api/admin/github/pulls?${params.toString()}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Pull Request 목록을 불러올 수 없습니다.");
      }

      const data = await response.json();
      if (data.success) {
        setPulls(data.data || []);
      }
    } catch (error) {
      clientLog.error("Pull Request 목록 로드 실패", error);
      showError("Pull Request 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreatePR() {
    try {
      const response = await fetch("/api/admin/github/pulls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: newPR.title,
          head: newPR.head,
          base: newPR.base,
          body: newPR.body,
        }),
      });

      if (!response.ok) {
        throw new Error("Pull Request 생성에 실패했습니다.");
      }

      showSuccess("Pull Request가 생성되었습니다.");
      setShowCreateForm(false);
      setNewPR({ title: "", head: "", base: "main", body: "" });
      loadPullRequests();
    } catch (error) {
      clientLog.error("Pull Request 생성 실패", error);
      showError("Pull Request 생성 중 오류가 발생했습니다.");
    }
  }

  async function handleMerge(prNumber: number) {
    try {
      const response = await fetch(`/api/admin/github/pulls/${prNumber}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          action: "merge",
        }),
      });

      if (!response.ok) {
        throw new Error("Pull Request 머지에 실패했습니다.");
      }

      showSuccess("Pull Request가 머지되었습니다.");
      loadPullRequests();
    } catch (error) {
      clientLog.error("Pull Request 머지 실패", error);
      showError("Pull Request 머지 중 오류가 발생했습니다.");
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString("ko-KR");
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Pull Request 관리</h2>
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
            PR 생성
          </button>
          <button
            onClick={loadPullRequests}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            새로고침
          </button>
        </div>
      </div>

      {/* PR 생성 폼 */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">새 Pull Request 생성</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제목
              </label>
              <input
                type="text"
                value={newPR.title}
                onChange={(e) => setNewPR({ ...newPR, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="PR 제목을 입력하세요"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Head 브랜치
                </label>
                <input
                  type="text"
                  value={newPR.head}
                  onChange={(e) => setNewPR({ ...newPR, head: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="feature-branch"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base 브랜치
                </label>
                <input
                  type="text"
                  value={newPR.base}
                  onChange={(e) => setNewPR({ ...newPR, base: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="main"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                내용
              </label>
              <textarea
                value={newPR.body}
                onChange={(e) => setNewPR({ ...newPR, body: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={5}
                placeholder="PR 내용을 입력하세요"
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
                onClick={handleCreatePR}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                생성
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PR 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Pull Request 목록</h3>
        </div>
        {isLoading ? (
          <div className="p-6 text-center text-gray-500">로딩 중...</div>
        ) : pulls.length === 0 ? (
          <div className="p-6 text-center text-gray-500">Pull Request가 없습니다.</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {pulls.map((pr) => (
              <div key={pr.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <a
                        href={pr.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg font-semibold text-gray-900 hover:text-blue-600"
                      >
                        #{pr.number} {pr.title}
                      </a>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          pr.state === "open"
                            ? "text-green-600 bg-green-50"
                            : pr.merged
                            ? "text-purple-600 bg-purple-50"
                            : "text-gray-600 bg-gray-50"
                        }`}
                      >
                        {pr.merged ? "머지됨" : pr.state === "open" ? "열림" : "닫힘"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {pr.body || "내용 없음"}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                      <span>작성자: {pr.user.login}</span>
                      <span>생성: {formatDate(pr.created_at)}</span>
                      <span>수정: {formatDate(pr.updated_at)}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">{pr.head.ref}</span> →{" "}
                      <span className="font-medium">{pr.base.ref}</span>
                    </div>
                  </div>
                  {pr.state === "open" && pr.mergeable && (
                    <button
                      onClick={() => handleMerge(pr.number)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      머지
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}





