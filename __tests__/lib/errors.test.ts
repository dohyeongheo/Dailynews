import { ErrorType, getErrorMessage, toAppError, isRetryableError } from '@/lib/errors';

describe('Error Handling', () => {
  describe('getErrorMessage', () => {
    it('should return user-friendly message for quota exceeded error', () => {
      const error = new Error('429 quota exceeded');
      const message = getErrorMessage(error);
      expect(message).toContain('할당량');
    });

    it('should return user-friendly message for network error', () => {
      const error = new Error('network error');
      const message = getErrorMessage(error);
      expect(message).toContain('네트워크');
    });

    it('should return user-friendly message for timeout error', () => {
      const error = new Error('timeout');
      const message = getErrorMessage(error);
      expect(message).toContain('시간이 초과');
    });

    it('should return error message for unknown error', () => {
      const error = new Error('Unknown error');
      const message = getErrorMessage(error);
      expect(message).toBe('Unknown error');
    });
  });

  describe('toAppError', () => {
    it('should convert quota exceeded error correctly', () => {
      const error = new Error('429 quota exceeded');
      const appError = toAppError(error);
      expect(appError.type).toBe(ErrorType.QUOTA_EXCEEDED);
      expect(appError.retryable).toBe(false);
    });

    it('should convert database error correctly', () => {
      const error = new Error('database connection failed');
      const appError = toAppError(error, ErrorType.DATABASE_ERROR);
      expect(appError.type).toBe(ErrorType.DATABASE_ERROR);
    });

    it('should convert network error correctly', () => {
      const error = new Error('network fetch failed');
      const appError = toAppError(error);
      expect(appError.retryable).toBe(true);
    });
  });

  describe('isRetryableError', () => {
    it('should return false for duplicate error', () => {
      const error = new Error('duplicate key');
      expect(isRetryableError(error)).toBe(false);
    });

    it('should return true for network error', () => {
      const error = new Error('network error');
      expect(isRetryableError(error)).toBe(true);
    });
  });
});

