import * as assert from 'node:assert';
import { cleanResponse } from '../geminiService';

describe('geminiService', () => {
  describe('cleanResponse', () => {
    it('should trim whitespace from response', () => {
      const result = cleanResponse('  feat(auth): giriş ekranı eklendi  ');
      assert.strictEqual(result, 'feat(auth): giriş ekranı eklendi');
    });

    it('should strip surrounding double quotes', () => {
      const result = cleanResponse('"feat(auth): giriş ekranı eklendi"');
      assert.strictEqual(result, 'feat(auth): giriş ekranı eklendi');
    });

    it('should strip surrounding single quotes', () => {
      const result = cleanResponse("'feat(auth): giriş ekranı eklendi'");
      assert.strictEqual(result, 'feat(auth): giriş ekranı eklendi');
    });

    it('should strip surrounding backticks', () => {
      const result = cleanResponse('`feat(auth): giriş ekranı eklendi`');
      assert.strictEqual(result, 'feat(auth): giriş ekranı eklendi');
    });

    it('should strip multiple layers of wrapping', () => {
      const result = cleanResponse(`"'feat(auth): giriş ekranı eklendi'"`);
      assert.strictEqual(result, 'feat(auth): giriş ekranı eklendi');
    });

    it('should handle response with no wrapping', () => {
      const result = cleanResponse('fix(api): token hatası düzeltildi');
      assert.strictEqual(result, 'fix(api): token hatası düzeltildi');
    });

    it('should handle empty string', () => {
      const result = cleanResponse('');
      assert.strictEqual(result, '');
    });

    it('should handle response with backticks and whitespace combined', () => {
      const result = cleanResponse('  `feat(auth): giriş ekranı eklendi`  ');
      assert.strictEqual(result, 'feat(auth): giriş ekranı eklendi');
    });
  });
});
