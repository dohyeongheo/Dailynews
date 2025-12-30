/**
 * Analytics Hook
 * 이벤트 추적을 위한 편의 함수 제공
 */

import { useAnalytics as useAnalyticsContext } from '@/components/analytics/AnalyticsProvider';

/**
 * Analytics Hook
 * 이벤트 추적 함수를 제공합니다.
 */
export function useAnalytics() {
  const { trackEvent, sessionId } = useAnalyticsContext();

  /**
   * 클릭 이벤트 추적
   */
  const trackClick = (eventName: string, metadata?: Record<string, unknown>) => {
    trackEvent(eventName, { ...metadata, event_type: 'click' });
  };

  /**
   * 검색 이벤트 추적
   */
  const trackSearch = (query: string, resultsCount?: number) => {
    trackEvent('search', { query, results_count: resultsCount, event_type: 'search' });
  };

  /**
   * 북마크 이벤트 추적
   */
  const trackBookmark = (newsId: string, action: 'add' | 'remove') => {
    trackEvent('bookmark', { news_id: newsId, action, event_type: 'bookmark' });
  };

  /**
   * 댓글 이벤트 추적
   */
  const trackComment = (newsId: string, action: 'create' | 'update' | 'delete') => {
    trackEvent('comment', { news_id: newsId, action, event_type: 'comment' });
  };

  /**
   * 반응(좋아요/싫어요) 이벤트 추적
   */
  const trackReaction = (newsId: string, reactionType: 'like' | 'dislike') => {
    trackEvent('reaction', { news_id: newsId, reaction_type: reactionType, event_type: 'reaction' });
  };

  /**
   * 공유 이벤트 추적
   */
  const trackShare = (newsId: string, platform?: string) => {
    trackEvent('share', { news_id: newsId, platform, event_type: 'share' });
  };

  /**
   * 스크롤 이벤트 추적
   */
  const trackScroll = (percentage: number) => {
    trackEvent('scroll', { percentage, event_type: 'scroll' });
  };

  /**
   * 커스텀 이벤트 추적
   */
  const trackCustom = (eventName: string, metadata?: Record<string, unknown>) => {
    trackEvent(eventName, { ...metadata, event_type: 'custom' });
  };

  return {
    sessionId,
    trackEvent,
    trackClick,
    trackSearch,
    trackBookmark,
    trackComment,
    trackReaction,
    trackShare,
    trackScroll,
    trackCustom,
  };
}

