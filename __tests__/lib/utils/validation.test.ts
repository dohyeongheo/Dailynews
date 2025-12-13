import { manualFetchNewsSchema, searchNewsSchema, safeParse, escapeHtml, sanitizeString } from '@/lib/utils/validation';

describe('Input Validation', () => {
  describe('manualFetchNewsSchema', () => {
    it('should validate valid password', () => {
      const result = safeParse(manualFetchNewsSchema, { password: 'test123' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.password).toBe('test123');
      }
    });

    it('should reject empty password', () => {
      const result = safeParse(manualFetchNewsSchema, { password: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('비밀번호는 필수입니다');
      }
    });

    it('should reject missing password', () => {
      const result = safeParse(manualFetchNewsSchema, {});
      expect(result.success).toBe(false);
    });
  });

  describe('searchNewsSchema', () => {
    it('should validate valid search query', () => {
      const result = safeParse(searchNewsSchema, { query: '태국 뉴스' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.query).toBe('태국 뉴스');
        expect(result.data.searchType).toBe('all');
        expect(result.data.limit).toBe(100);
      }
    });

    it('should reject empty query', () => {
      const result = safeParse(searchNewsSchema, { query: '' });
      expect(result.success).toBe(false);
    });

    it('should reject query exceeding max length', () => {
      const longQuery = 'a'.repeat(201);
      const result = safeParse(searchNewsSchema, { query: longQuery });
      expect(result.success).toBe(false);
    });

    it('should validate searchType enum', () => {
      const result = safeParse(searchNewsSchema, { query: 'test', searchType: 'title' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.searchType).toBe('title');
      }
    });
  });

  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
      expect(escapeHtml('Test & Test')).toBe('Test &amp; Test');
    });

    it('should not escape safe text', () => {
      expect(escapeHtml('Hello World')).toBe('Hello World');
    });
  });

  describe('sanitizeString', () => {
    it('should remove SQL injection patterns', () => {
      expect(sanitizeString("'; DROP TABLE news; --")).toBe('DROP TABLE news');
      expect(sanitizeString("test' OR '1'='1")).toBe("test OR 1=1");
    });

    it('should preserve safe strings', () => {
      expect(sanitizeString('태국 뉴스')).toBe('태국 뉴스');
    });
  });
});

