"use client";

import { useState } from "react";
import GitHubWorkflows from "./GitHubWorkflows";
import GitHubIssues from "./GitHubIssues";
import GitHubPulls from "./GitHubPulls";
import GitHubReleases from "./GitHubReleases";

type GitHubTabType = "workflows" | "issues" | "pulls" | "releases";

export default function GitHubTabs() {
  const [activeTab, setActiveTab] = useState<GitHubTabType>("workflows");

  return (
    <div>
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("workflows")}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === "workflows"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }
            `}
          >
            워크플로우
          </button>
          <button
            onClick={() => setActiveTab("issues")}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === "issues"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }
            `}
          >
            이슈
          </button>
          <button
            onClick={() => setActiveTab("pulls")}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === "pulls"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }
            `}
          >
            Pull Requests
          </button>
          <button
            onClick={() => setActiveTab("releases")}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === "releases"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }
            `}
          >
            릴리즈
          </button>
        </nav>
      </div>

      <div>
        {activeTab === "workflows" && <GitHubWorkflows />}
        {activeTab === "issues" && <GitHubIssues />}
        {activeTab === "pulls" && <GitHubPulls />}
        {activeTab === "releases" && <GitHubReleases />}
      </div>
    </div>
  );
}

