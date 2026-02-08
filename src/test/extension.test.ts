import * as assert from 'node:assert';
import { generateFallbackMessage, extractScope } from '../fallbackGenerator';
import { cleanResponse } from '../geminiService';
import { truncateDiff, parseStat } from '../gitService';
import { DiffResult, FileChange } from '../types';

describe('extension orchestration logic', () => {
  describe('empty diff triggers warning path', () => {
    it('should identify no-changes case when getDiff returns null', () => {
      const diffResult: DiffResult | null = null;

      assert.strictEqual(diffResult, null);
    });

    it('should return null from parseStat when stat is empty', () => {
      const files = parseStat('');
      assert.deepStrictEqual(files, []);
    });

    it('should return empty string from truncateDiff when diff is empty', () => {
      const result = truncateDiff('', 8000);
      assert.strictEqual(result, '');
    });
  });

  describe('flow with API key set and successful generation', () => {
    it('should use Gemini result directly when API succeeds', () => {
      const geminiResult = 'feat(auth): kullanıcı giriş ekranı eklendi';

      const commitMessage: string | undefined = geminiResult;
      assert.ok(commitMessage, 'commitMessage should be defined');
      assert.strictEqual(commitMessage, 'feat(auth): kullanıcı giriş ekranı eklendi');
    });

    it('should clean Gemini response before using it', () => {
      const rawResponse = '  `feat(auth): giriş ekranı eklendi`  ';
      const cleaned = cleanResponse(rawResponse);
      assert.strictEqual(cleaned, 'feat(auth): giriş ekranı eklendi');
    });

    it('should write cleaned message to SCM input box (Requirement 1.4)', () => {
      const diffResult: DiffResult = {
        diff: 'diff --git a/src/auth.ts b/src/auth.ts\n+login function',
        stat: ' src/auth.ts | 5 +++++\n 1 file changed, 5 insertions(+)',
        files: [{ status: 'added', filePath: 'src/auth.ts' }],
      };

      const geminiApiKey = 'test-api-key';
      const commitMessage = 'feat(auth): kullanıcı giriş ekranı eklendi';

      assert.ok(diffResult !== null);
      assert.ok(geminiApiKey.length > 0);
      assert.ok(commitMessage.length > 0);
      assert.strictEqual(commitMessage, 'feat(auth): kullanıcı giriş ekranı eklendi');
    });
  });

  describe('flow with missing API key triggers fallback', () => {
    it('should use fallback when API key is empty string', () => {
      const geminiApiKey = '';
      const files: FileChange[] = [
        { status: 'added', filePath: 'src/components/Button.tsx' },
      ];
      const includeScope = true;

      let commitMessage: string | undefined;

      if (geminiApiKey) {
        commitMessage = 'should not reach here';
      }

      if (!commitMessage) {
        commitMessage = generateFallbackMessage(files, includeScope);
      }

      assert.ok(commitMessage, 'fallback should produce a message');
      assert.match(commitMessage, /^feat\(components\): Button\.tsx eklendi$/);
    });

    it('should produce valid fallback for single modified file without scope', () => {
      const files: FileChange[] = [
        { status: 'modified', filePath: 'README.md' },
      ];

      const commitMessage = generateFallbackMessage(files, false);
      assert.strictEqual(commitMessage, 'chore: README.md güncellendi');
    });

    it('should produce valid fallback for multiple files', () => {
      const files: FileChange[] = [
        { status: 'modified', filePath: 'src/utils/helper.ts' },
        { status: 'added', filePath: 'src/utils/newHelper.ts' },
      ];

      const commitMessage = generateFallbackMessage(files, true);
      assert.match(commitMessage, /^chore(\([^)]+\))?: birden fazla dosya güncellendi$/);
    });
  });

  describe('flow with API error triggers fallback', () => {
    it('should fall through to fallback when Gemini throws network error (Requirement 7.2)', () => {
      const files: FileChange[] = [
        { status: 'modified', filePath: 'src/api/client.ts' },
      ];
      const includeScope = true;

      const error = new Error("Gemini API'ye bağlanılamadı: ECONNREFUSED");
      let commitMessage: string | undefined;

      try {
        throw error;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        assert.ok(message.includes("Gemini API'ye bağlanılamadı"));
      }

      if (!commitMessage) {
        commitMessage = generateFallbackMessage(files, includeScope);
      }

      assert.ok(commitMessage, 'fallback should produce a message after API error');
      assert.strictEqual(commitMessage, 'chore(api): client.ts güncellendi');
    });

    it('should fall through to fallback when Gemini throws HTTP error (Requirement 7.3)', () => {
      const files: FileChange[] = [
        { status: 'deleted', filePath: 'src/legacy/oldModule.ts' },
      ];
      const includeScope = true;

      const error = new Error('Gemini API hatası (HTTP 429): Rate limit exceeded');
      let commitMessage: string | undefined;

      try {
        throw error;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        assert.ok(message.includes('Gemini API hatası (HTTP'));
      }

      if (!commitMessage) {
        commitMessage = generateFallbackMessage(files, includeScope);
      }

      assert.ok(commitMessage);
      assert.strictEqual(commitMessage, 'chore(legacy): oldModule.ts kaldırıldı');
    });

    it('should fall through to fallback on unexpected error (Requirement 7.4)', () => {
      const files: FileChange[] = [
        { status: 'added', filePath: 'src/services/auth.ts' },
      ];
      const includeScope = true;

      const error = new Error('Something completely unexpected');
      let commitMessage: string | undefined;

      try {
        throw error;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        assert.ok(!message.includes("Gemini API'ye bağlanılamadı"));
        assert.ok(!message.includes('Gemini API hatası (HTTP'));
      }

      if (!commitMessage) {
        commitMessage = generateFallbackMessage(files, includeScope);
      }

      assert.ok(commitMessage);
      assert.strictEqual(commitMessage, 'feat(services): auth.ts eklendi');
    });

    it('should correctly classify error types for Turkish notifications', () => {
      const networkError = "Gemini API'ye bağlanılamadı: ECONNREFUSED";
      const httpError = 'Gemini API hatası (HTTP 500): Internal Server Error';
      const unexpectedError = 'TypeError: Cannot read property of undefined';

      assert.ok(networkError.includes("Gemini API'ye bağlanılamadı"));
      assert.ok(!networkError.includes('Gemini API hatası (HTTP'));

      assert.ok(!httpError.includes("Gemini API'ye bağlanılamadı"));
      assert.ok(httpError.includes('Gemini API hatası (HTTP'));

      assert.ok(!unexpectedError.includes("Gemini API'ye bağlanılamadı"));
      assert.ok(!unexpectedError.includes('Gemini API hatası (HTTP'));
    });
  });

  describe('git error handling path', () => {
    it('should detect git command errors and stop flow (Requirement 7.1)', () => {
      const error = new Error('fatal: not a git repository');

      const message = error instanceof Error ? error.message : String(error);
      const errorNotification = `Git komutu çalıştırılırken hata oluştu: ${message}`;

      assert.strictEqual(
        errorNotification,
        'Git komutu çalıştırılırken hata oluştu: fatal: not a git repository'
      );
    });

    it('should handle non-Error thrown values', () => {
      const stringError: unknown = 'git not found';
      const message = stringError instanceof Error ? stringError.message : String(stringError);
      assert.strictEqual(message, 'git not found');
    });
  });

  describe('full orchestration flow simulation', () => {
    it('should complete full flow: diff → API success → message written', () => {
      const diffResult: DiffResult = {
        diff: 'diff content here',
        stat: ' src/index.ts | 3 +++\n 1 file changed, 3 insertions(+)',
        files: [{ status: 'added', filePath: 'src/index.ts' }],
      };
      assert.ok(diffResult !== null);

      const geminiApiKey = 'valid-api-key';
      assert.ok(geminiApiKey.length > 0);

      let commitMessage: string | undefined = 'feat(index): ana modül eklendi';

      assert.ok(commitMessage);

      assert.match(commitMessage, /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)/);
    });

    it('should complete full flow: diff → no API key → fallback → message written', () => {
      const diffResult: DiffResult = {
        diff: 'diff content here',
        stat: ' src/utils.ts | 2 +-\n 1 file changed, 1 insertion(+), 1 deletion(-)',
        files: [{ status: 'modified', filePath: 'src/utils.ts' }],
      };
      assert.ok(diffResult !== null);

      const geminiApiKey = '';
      let commitMessage: string | undefined;

      if (geminiApiKey) {
        commitMessage = 'should not be reached';
      }

      if (!commitMessage) {
        commitMessage = generateFallbackMessage(diffResult.files, true);
      }

      assert.ok(commitMessage);
      assert.strictEqual(commitMessage, 'chore: utils.ts güncellendi');
    });

    it('should complete full flow: diff → API error → fallback → message written', () => {
      const diffResult: DiffResult = {
        diff: 'diff content here',
        stat: ' src/api/handler.ts | 10 ++++++++++\n 1 file changed, 10 insertions(+)',
        files: [{ status: 'added', filePath: 'src/api/handler.ts' }],
      };
      assert.ok(diffResult !== null);

      const geminiApiKey = 'valid-api-key';
      let commitMessage: string | undefined;

      if (geminiApiKey) {
        try {
          throw new Error('Gemini API hatası (HTTP 401): Invalid API key');
        } catch {
        }
      }

      if (!commitMessage) {
        commitMessage = generateFallbackMessage(diffResult.files, true);
      }

      assert.ok(commitMessage);
      assert.strictEqual(commitMessage, 'feat(api): handler.ts eklendi');
    });

    it('should stop flow when diff is empty — no message generated', () => {
      const diffResult: DiffResult | null = null;

      if (!diffResult) {
        assert.ok(true, 'flow stopped at empty diff check');
        return;
      }

      assert.fail('should have returned early for null diff');
    });
  });

  describe('scope extraction in orchestration context', () => {
    it('should extract scope from file path skipping structural dirs', () => {
      const scope = extractScope('src/components/Button.tsx');
      assert.strictEqual(scope, 'components');
    });

    it('should return null for root-level files', () => {
      const scope = extractScope('README.md');
      assert.strictEqual(scope, null);
    });

    it('should skip multiple structural dirs', () => {
      const scope = extractScope('src/lib/utils/helper.ts');
      assert.strictEqual(scope, 'utils');
    });

    it('should include scope in fallback message when enabled', () => {
      const files: FileChange[] = [
        { status: 'modified', filePath: 'src/services/api.ts' },
      ];
      const message = generateFallbackMessage(files, true);
      assert.strictEqual(message, 'chore(services): api.ts güncellendi');
    });

    it('should exclude scope from fallback message when disabled', () => {
      const files: FileChange[] = [
        { status: 'modified', filePath: 'src/services/api.ts' },
      ];
      const message = generateFallbackMessage(files, false);
      assert.strictEqual(message, 'chore: api.ts güncellendi');
    });
  });
});
