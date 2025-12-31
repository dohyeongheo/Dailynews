"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ToastProvider";
import { clientLog } from "@/lib/utils/client-logger";

interface Release {
  id: number;
  tag_name: string;
  name: string;
  body: string;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string | null;
  html_url: string;
  author: {
    login: string;
    avatar_url: string;
  };
}

export default function GitHubReleases() {
  const { showError, showSuccess } = useToast();
  const [releases, setReleases] = useState<Release[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRelease, setNewRelease] = useState({
    tagName: "",
    name: "",
    body: "",
    draft: false,
    prerelease: false,
  });

  useEffect(() => {
    loadReleases();
  }, []);

  async function loadReleases() {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/github/releases?perPage=30", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("릴리즈 목록을 불러올 수 없습니다.");
      }

      const data = await response.json();
      if (data.success) {
        setReleases(data.data || []);
      }
    } catch (error) {
      clientLog.error("릴리즈 목록 로드 실패", error);
      showError("릴리즈 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateRelease() {
    try {
      const response = await fetch("/api/admin/github/releases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(newRelease),
      });

      if (!response.ok) {
        throw new Error("릴리즈 생성에 실패했습니다.");
      }

      showSuccess("릴리즈가 생성되었습니다.");
      setShowCreateForm(false);
      setNewRelease({ tagName: "", name: "", body: "", draft: false, prerelease: false });
      loadReleases();
    } catch (error) {
      clientLog.error("릴리즈 생성 실패", error);
      showError("릴리즈 생성 중 오류가 발생했습니다.");
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return "미발행";
    return new Date(dateString).toLocaleString("ko-KR");
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">릴리즈 관리</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            릴리즈 생성
          </button>
          <button
            onClick={loadReleases}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            새로고침
          </button>
        </div>
      </div>

      {/* 릴리즈 생성 폼 */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">새 릴리즈 생성</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                태그 이름
              </label>
              <input
                type="text"
                value={newRelease.tagName}
                onChange={(e) =>
                  setNewRelease({ ...newRelease, tagName: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="v1.0.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                릴리즈 이름
              </label>
              <input
                type="text"
                value={newRelease.name}
                onChange={(e) => setNewRelease({ ...newRelease, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Version 1.0.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                릴리즈 노트
              </label>
              <textarea
                value={newRelease.body}
                onChange={(e) => setNewRelease({ ...newRelease, body: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={8}
                placeholder="릴리즈 노트를 입력하세요 (Markdown 지원)"
              />
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newRelease.draft}
                  onChange={(e) =>
                    setNewRelease({ ...newRelease, draft: e.target.checked })
                  }
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">초안</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newRelease.prerelease}
                  onChange={(e) =>
                    setNewRelease({ ...newRelease, prerelease: e.target.checked })
                  }
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">프리릴리즈</span>
              </label>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleCreateRelease}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                생성
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 릴리즈 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">릴리즈 목록</h3>
        </div>
        {isLoading ? (
          <div className="p-6 text-center text-gray-500">로딩 중...</div>
        ) : releases.length === 0 ? (
          <div className="p-6 text-center text-gray-500">릴리즈가 없습니다.</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {releases.map((release) => (
              <div key={release.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <a
                        href={release.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg font-semibold text-gray-900 hover:text-blue-600"
                      >
                        {release.name} ({release.tag_name})
                      </a>
                      {release.draft && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full text-gray-600 bg-gray-50">
                          초안
                        </span>
                      )}
                      {release.prerelease && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full text-yellow-600 bg-yellow-50">
                          프리릴리즈
                        </span>
                      )}
                    </div>
                    <div
                      className="text-sm text-gray-600 mb-3 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: release.body
                          .replace(/\n/g, "<br />")
                          .replace(/```([^`]+)```/g, "<pre><code>$1</code></pre>"),
                      }}
                    />
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>작성자: {release.author.login}</span>
                      <span>생성: {formatDate(release.created_at)}</span>
                      <span>발행: {formatDate(release.published_at)}</span>
                    </div>
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


