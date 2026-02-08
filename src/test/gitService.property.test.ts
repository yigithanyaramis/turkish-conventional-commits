import * as assert from 'node:assert';
import * as fc from 'fast-check';
import { truncateDiff } from '../gitService';

describe('gitService - Property-Based Tests', () => {
  describe('truncateDiff', () => {
    it('should always produce output with length <= maxDiffLength for any diff and any positive maxDiffLength', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 20000 }),
          fc.integer({ min: 1, max: 20000 }),
          (diff: string, maxDiffLength: number) => {
            const result = truncateDiff(diff, maxDiffLength);
            assert.ok(
              result.length <= maxDiffLength,
              `Expected result.length (${result.length}) <= maxDiffLength (${maxDiffLength})`
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce output with length exactly equal to maxDiffLength when input exceeds maxDiffLength', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 20000 }),
          fc.integer({ min: 1, max: 20000 }),
          (diff: string, maxDiffLength: number) => {
            const result = truncateDiff(diff, maxDiffLength);
            if (diff.length > maxDiffLength) {
              assert.strictEqual(
                result.length,
                maxDiffLength,
                `Expected result.length (${result.length}) === maxDiffLength (${maxDiffLength}) when input.length (${diff.length}) > maxDiffLength`
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
