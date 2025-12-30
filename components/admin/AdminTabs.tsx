"use client";

import { useState } from "react";
import NewsManagement from "./NewsManagement";
import UserManagement from "./UserManagement";
import Monitoring from "./Monitoring";
import GitHubTabs from "./github/GitHubTabs";

export default function AdminTabs() {
  const [activeTab, setActiveTab] = useState<"news" | "users" | "monitoring" | "github">("news");

  return (
    <div>
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("news")}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === "news" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}
            `}
          >
            뉴스 관리
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === "users" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}
            `}
          >
            회원 관리
          </button>
          <button
            onClick={() => setActiveTab("monitoring")}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === "monitoring" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}
            `}
          >
            모니터링
          </button>
          <button
            onClick={() => setActiveTab("github")}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === "github" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}
            `}
          >
            GitHub 관리
          </button>
        </nav>
      </div>

      <div>
        {activeTab === "news" && <NewsManagement />}
        {activeTab === "users" && <UserManagement />}
        {activeTab === "monitoring" && <Monitoring />}
        {activeTab === "github" && <GitHubTabs />}
      </div>
    </div>
  );
}
