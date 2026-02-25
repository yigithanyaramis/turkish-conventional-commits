import * as assert from 'node:assert';
import { parseStat, truncateDiff } from '../gitService';

describe('gitService', () => {
  describe('parseStat', () => {
    it('should parse stat output with added files (only + indicators)', () => {
      const stat = ' src/newFile.ts | 10 ++++++++++\n 1 file changed, 10 insertions(+)';
      const result = parseStat(stat);
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].filePath, 'src/newFile.ts');
      assert.strictEqual(result[0].status, 'added');
    });

    it('should parse stat output with deleted files (only - indicators)', () => {
      const stat = ' src/oldFile.ts | 5 -----\n 1 file changed, 5 deletions(-)';
      const result = parseStat(stat);
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].filePath, 'src/oldFile.ts');
      assert.strictEqual(result[0].status, 'deleted');
    });

    it('should parse stat output with modified files (both + and - indicators)', () => {
      const stat = ' src/utils.ts | 8 +++-----\n 1 file changed, 3 insertions(+), 5 deletions(-)';
      const result = parseStat(stat);
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].filePath, 'src/utils.ts');
      assert.strictEqual(result[0].status, 'modified');
    });

    it('should parse stat output with multiple files', () => {
      const stat = [
        ' src/a.ts   | 3 +++',
        ' src/b.ts   | 7 -------',
        ' src/c.ts   | 4 ++--',
        ' 3 files changed, 5 insertions(+), 9 deletions(-)',
      ].join('\n');
      const result = parseStat(stat);
      assert.strictEqual(result.length, 3);
      assert.deepStrictEqual(result[0], { filePath: 'src/a.ts', status: 'added' });
      assert.deepStrictEqual(result[1], { filePath: 'src/b.ts', status: 'deleted' });
      assert.deepStrictEqual(result[2], { filePath: 'src/c.ts', status: 'modified' });
    });

    it('should handle empty stat output', () => {
      const result = parseStat('');
      assert.deepStrictEqual(result, []);
    });

    it('should handle binary file additions', () => {
      const stat = ' assets/logo.png | Bin 0 -> 1234 bytes\n 1 file changed, 0 insertions(+), 0 deletions(-)';
      const result = parseStat(stat);
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].filePath, 'assets/logo.png');
      assert.strictEqual(result[0].status, 'added');
    });

    it('should handle binary file deletions', () => {
      const stat = ' assets/old.png | Bin 5678 -> 0 bytes\n 1 file changed, 0 insertions(+), 0 deletions(-)';
      const result = parseStat(stat);
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].filePath, 'assets/old.png');
      assert.strictEqual(result[0].status, 'deleted');
    });

    it('should handle binary file modifications', () => {
      const stat = ' assets/logo.png | Bin 1234 -> 5678 bytes\n 1 file changed, 0 insertions(+), 0 deletions(-)';
      const result = parseStat(stat);
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].filePath, 'assets/logo.png');
      assert.strictEqual(result[0].status, 'modified');
    });
  });

  describe('truncateDiff', () => {
    it('should return original string when within limit', () => {
      const diff = 'short diff content';
      const result = truncateDiff(diff, 100);
      assert.strictEqual(result, diff);
    });

    it('should truncate when exceeding limit', () => {
      const diff = 'abcdefghij'; // 10 chars
      const result = truncateDiff(diff, 5);
      assert.strictEqual(result, 'abcde');
      assert.strictEqual(result.length, 5);
    });

    it('should handle empty string', () => {
      const result = truncateDiff('', 100);
      assert.strictEqual(result, '');
    });

    it('should return empty string for zero maxLength', () => {
      const result = truncateDiff('some content', 0);
      assert.strictEqual(result, '');
    });

    it('should return empty string for negative maxLength', () => {
      const result = truncateDiff('some content', -5);
      assert.strictEqual(result, '');
    });
  });
});
