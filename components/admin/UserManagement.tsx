"use client";

import { useState, useEffect } from "react";
import { getAllUsersAction } from "@/lib/actions";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setIsLoading(true);
    try {
      const res = await getAllUsersAction();
      if (res.success && res.data) {
        setUsers(res.data);
      }
    } catch (error) {
      console.error("Failed to load users", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRoleChange(userId: string, newRole: "user" | "admin") {
    if (!confirm(`사용자 권한을 ${newRole === "admin" ? "관리자" : "일반 사용자"}로 변경하시겠습니까?`)) {
      return;
    }

    setUpdatingUserId(userId);
    try {
      const { updateUserRoleAction } = await import("@/lib/actions");
      const res = await updateUserRoleAction(userId, newRole);

      if (res.success) {
        setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
        alert("권한이 변경되었습니다.");
      } else {
        alert("권한 변경에 실패했습니다: " + res.error);
      }
    } catch (error) {
      console.error("Failed to update user role", error);
      alert("오류가 발생했습니다.");
    } finally {
      setUpdatingUserId(null);
    }
  }

  if (isLoading) return <div className="p-8 text-center">로딩 중...</div>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">회원 관리 ({users.length}명)</h2>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">가입일</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">권한</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(user.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as "user" | "admin")}
                    disabled={updatingUserId === user.id}
                    className={`px-2 py-1 border rounded text-xs ${
                      user.role === "admin" ? "bg-purple-100 text-purple-800 border-purple-300" : "bg-gray-100 text-gray-800 border-gray-300"
                    } disabled:opacity-50`}
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                  {updatingUserId === user.id && <span className="ml-2 text-xs text-gray-500">변경 중...</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
