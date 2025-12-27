/**
 * 관리자 인증 유틸리티
 * 쿠키 기반 관리자 세션 관리
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/config/env';

const ADMIN_SESSION_COOKIE_NAME = 'admin_session';
const SESSION_SECRET_LENGTH = 32;
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7일

/**
 * 관리자 비밀번호 검증
 */
export function verifyAdminPassword(password: string): boolean {
  try {
    // 환경 변수는 런타임에만 필요하므로 직접 접근
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return false;
    }

    return password === adminPassword;
  } catch (error) {
    return false;
  }
}

/**
 * 세션 토큰 생성
 */
function generateSessionToken(): string {
  // Edge Runtime 호환성을 위해 crypto.randomUUID() 또는 간단한 랜덤 문자열 사용
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: 간단한 랜덤 문자열 생성
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

/**
 * 세션 쿠키 설정
 */
export function setAdminSessionCookie(response: NextResponse): void {
  const sessionToken = generateSessionToken();

  response.cookies.set(ADMIN_SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

/**
 * 세션 쿠키 읽기
 */
export function getAdminSessionCookie(request: NextRequest): string | null {
  return request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value || null;
}

/**
 * 세션 쿠키 삭제
 */
export function clearAdminSessionCookie(response: NextResponse): void {
  response.cookies.delete(ADMIN_SESSION_COOKIE_NAME);
}

/**
 * 관리자 인증 상태 확인
 * 간단한 쿠키 존재 여부로 확인 (프로덕션에서는 더 강력한 검증 필요)
 */
export function isAdminAuthenticated(request: NextRequest): boolean {
  const sessionCookie = getAdminSessionCookie(request);
  return !!sessionCookie;
}

