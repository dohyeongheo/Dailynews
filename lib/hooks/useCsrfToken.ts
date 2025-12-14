"use client";

import { useEffect, useState } from "react";
import { CSRF_TOKEN_HEADER } from "@/lib/utils/csrf";

/**
 * CSRF 토큰을 가져와서 관리하는 훅
 */
export function useCsrfToken() {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCsrfToken() {
      try {
        const response = await fetch("/api/csrf-token");
        const data = await response.json();
        setToken(data.token);
      } catch (error) {
        console.error("Failed to fetch CSRF token:", error);
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
