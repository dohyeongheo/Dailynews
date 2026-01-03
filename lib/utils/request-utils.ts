/**
 * Request 유틸리티 함수
 */

import { NextRequest } from 'next/server';

/**
 * 클라이언트 IP 주소 추출
 * Vercel, Cloudflare 등 프록시 환경을 고려
 */
export function getClientIp(request: NextRequest): string | null {
  // x-forwarded-for 헤더 확인 (프록시 환경)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // 여러 IP가 있을 수 있으므로 첫 번째 IP 사용
    const ips = forwardedFor.split(',').map((ip) => ip.trim());
    return ips[0] || null;
  }

  // x-real-ip 헤더 확인
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // request.ip 확인 (Next.js 기본)
  if (request.ip) {
    return request.ip;
  }

  return null;
}






