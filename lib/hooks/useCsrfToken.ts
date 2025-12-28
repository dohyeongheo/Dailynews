"use client";

import { useEffect, useState } from "react";
import { CSRF_TOKEN_HEADER } from "@/lib/utils/csrf-constants";
import { clientLog } from "@/lib/utils/client-logger";

/**
 * CSRF 토큰을 가져와서 관리하는 훅
 */
export function useCsrfToken() {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCsrfToken() {
      try {
        const response = await fetch("/api/csrf-token", {
          credentials: "include", // 쿠키를 포함하여 요청
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch CSRF token: ${response.status}`);
        }
        const data = await response.json();
        if (data.token) {
          setToken(data.token);
        } else {
          clientLog.error("CSRF token not found in response", undefined, { data });
        }
      } catch (error) {
        clientLog.error("Failed to fetch CSRF token", error instanceof Error ? error : new Error(String(error)));
      } finally {
        setIsLoading(false);
      }
    }

    fetchCsrfToken();
  }, []);

  /**
   * 요청 헤더에 CSRF 토큰을 추가
   */
  const getHeaders = (): HeadersInit => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers[CSRF_TOKEN_HEADER] = token;
    }

    return headers;
  };

  return { token, isLoading, getHeaders };
}
