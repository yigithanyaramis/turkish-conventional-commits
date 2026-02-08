import * as assert from 'node:assert';
import * as fc from 'fast-check';
import { cleanResponse } from '../geminiService';

const wrappingChars = ['"', "'", '`'] as const;
const whitespaceChars = [' ', '\t', '\n', '\r'] as const;

const safeInnerArb: fc.Arbitrary<string> = fc
  .string({ minLength: 0, maxLength: 200 })
  .map((s) => {
    let cleaned = s;
    const wrapSet = new Set(['"', "'", '`', ' ', '\t', '\n', '\r']);
    while (cleaned.length > 0 && wrapSet.has(cleaned[0])) {
      cleaned = cleaned.slice(1);
    }
    while (cleaned.length > 0 && wrapSet.has(cleaned[cleaned.length - 1])) {
      cleaned = cleaned.slice(0, -1);
    }
    return cleaned;
  });

const wrappingLayersArb: fc.Arbitrary<Array<{ prefix: string; suffix: string }>> = fc.array(
  fc.oneof(
    fc.constantFrom(...wrappingChars).map((ch) => ({
      prefix: ch,
      suffix: ch,
    })),
    fc
      .array(fc.constantFrom(...whitespaceChars), { minLength: 1, maxLength: 3 })
      .map((ws) => ({ prefix: ws.join(''), suffix: ws.join('') }))
  ),
  { minLength: 0, maxLength: 5 }
);

function applyWrapping(
  inner: string,
  layers: Array<{ prefix: string; suffix: string }>
): string {
  let result = inner;
  for (const layer of layers) {
    result = layer.prefix + result + layer.suffix;
  }
  return result;
}

describe('geminiService - Property-Based Tests', () => {
  describe('cleanResponse', () => {
    it('should produce a result with no leading or trailing whitespace', () => {
      fc.assert(
        fc.property(
          safeInnerArb,
          wrappingLayersArb,
          (inner, layers) => {
            const wrapped = applyWrapping(inner, layers);
            const result = cleanResponse(wrapped);
            assert.strictEqual(
              result,
              result.trim(),
              `Result should have no leading/trailing whitespace. Got: "${result}"`
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not start and end with the same backtick or quote character (no matching outer pairs remain)', () => {
      fc.assert(
        fc.property(
          safeInnerArb,
          wrappingLayersArb,
          (inner, layers) => {
            const wrapped = applyWrapping(inner, layers);
            const result = cleanResponse(wrapped);

            if (result.length >= 2) {
              for (const ch of wrappingChars) {
                if (result.startsWith(ch) && result.endsWith(ch)) {
                  assert.ok(
                    inner.startsWith(ch) && inner.endsWith(ch),
                    `Result "${result}" has outer ${ch} pair that should have been stripped`
                  );
                }
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should recover the inner content when inner has no leading/trailing wrapping characters', () => {
      fc.assert(
        fc.property(
          safeInnerArb,
          wrappingLayersArb,
          (inner, layers) => {
            const wrapped = applyWrapping(inner, layers);
            const result = cleanResponse(wrapped);
            assert.strictEqual(
              result,
              inner,
              `Expected cleanResponse to recover inner content. Wrapped: "${wrapped}", Result: "${result}", Expected: "${inner}"`
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
