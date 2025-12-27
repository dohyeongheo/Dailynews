/**
 * 뉴스 반응 컴포넌트 (비활성화)
 * 사용자 인증 시스템 제거로 인해 반응 기능이 비활성화됨
 */

interface NewsReactionsProps {
  newsId: string;
}

export default function NewsReactions({ newsId }: NewsReactionsProps) {
  // 반응 기능이 제거되었으므로 아무것도 렌더링하지 않음
  return null;
}
