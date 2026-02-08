import * as assert from 'node:assert';
import * as fc from 'fast-check';
import { generateFallbackMessage, extractScope } from '../fallbackGenerator';
import { FileChange, FileStatus } from '../types';

const VALID_TYPES = [
  'feat', 'fix', 'docs', 'style', 'refactor',
  'perf', 'test', 'build', 'ci', 'chore', 'revert',
];

const CONVENTIONAL_COMMIT_REGEX = /^([a-z]+)(?:\(([^)]+)\))?: (.+)$/;

const FILE_STATUSES: FileStatus[] = ['added', 'modified', 'deleted'];

const pathSegmentArb: fc.Arbitrary<string> = fc
  .stringOf(
    fc.constantFrom(
      ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_.'.split('')
    ),
    { minLength: 1, maxLength: 20 }
  );

const filePathArb: fc.Arbitrary<string> = fc
  .array(pathSegmentArb, { minLength: 1, maxLength: 5 })
  .map((segments) => segments.join('/'));

const fileStatusArb: fc.Arbitrary<FileStatus> = fc.constantFrom(...FILE_STATUSES);

const fileChangeArb: fc.Arbitrary<FileChange> = fc.record({
  status: fileStatusArb,
  filePath: filePathArb,
});

const fileChangesArb: fc.Arbitrary<FileChange[]> = fc.array(fileChangeArb, {
  minLength: 0,
  maxLength: 10,
});

describe('fallbackGenerator - Property-Based Tests', () => {
  describe('Property 3: Fallback messages are Conventional Commits compliant', () => {
    it('should produce output matching Conventional Commits format for any FileChange[] and boolean', () => {
      fc.assert(
        fc.property(
          fileChangesArb,
          fc.boolean(),
          (files, includeScope) => {
            const result = generateFallbackMessage(files, includeScope);

            const match = result.match(CONVENTIONAL_COMMIT_REGEX);
            assert.ok(
              match !== null,
              `Output "${result}" does not match Conventional Commits format <type>[(<scope>)]: <description>`
            );

            const type = match![1];
            assert.ok(
              VALID_TYPES.includes(type),
              `Type "${type}" is not a valid Conventional Commits type. Valid types: ${VALID_TYPES.join(', ')}`
            );

            const description = match![3];
            assert.ok(
              description.length > 0,
              `Description should be non-empty, got empty string`
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always have a valid type from the allowed set', () => {
      fc.assert(
        fc.property(
          fileChangesArb,
          fc.boolean(),
          (files, includeScope) => {
            const result = generateFallbackMessage(files, includeScope);

            const typeMatch = result.match(/^([a-z]+)/);
            assert.ok(typeMatch !== null, `Could not extract type from "${result}"`);

            const type = typeMatch![1];
            assert.ok(
              VALID_TYPES.includes(type),
              `Type "${type}" extracted from "${result}" is not in the valid types list`
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have scope in parentheses when scope is present', () => {
      fc.assert(
        fc.property(
          fileChangesArb,
          fc.boolean(),
          (files, includeScope) => {
            const result = generateFallbackMessage(files, includeScope);
            const match = result.match(CONVENTIONAL_COMMIT_REGEX);
            assert.ok(match !== null, `Output "${result}" does not match Conventional Commits format`);

            const scope = match![2];

            if (scope !== undefined) {
              assert.ok(
                result.includes(`(${scope})`),
                `Scope "${scope}" should appear in parentheses in "${result}"`
              );
              assert.ok(
                scope.length > 0,
                `Scope should be non-empty when present`
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 5: Multi-file fallback uses generic description', () => {
    const multiFileChangesArb: fc.Arbitrary<FileChange[]> = fc.array(fileChangeArb, {
      minLength: 2,
      maxLength: 10,
    });

    it('should produce description "birden fazla dosya güncellendi" for any 2+ file changes with includeScope=false', () => {
      fc.assert(
        fc.property(
          multiFileChangesArb,
          (files) => {
            const result = generateFallbackMessage(files, false);

            assert.ok(
              result.endsWith('birden fazla dosya güncellendi'),
              `Expected "${result}" to end with "birden fazla dosya güncellendi"`
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce description "birden fazla dosya güncellendi" for any 2+ file changes with includeScope=true', () => {
      fc.assert(
        fc.property(
          multiFileChangesArb,
          (files) => {
            const result = generateFallbackMessage(files, true);

            assert.ok(
              result.endsWith('birden fazla dosya güncellendi'),
              `Expected "${result}" to end with "birden fazla dosya güncellendi"`
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce description "birden fazla dosya güncellendi" for any 2+ file changes and any includeScope value', () => {
      fc.assert(
        fc.property(
          multiFileChangesArb,
          fc.boolean(),
          (files, includeScope) => {
            const result = generateFallbackMessage(files, includeScope);

            const colonIndex = result.indexOf(': ');
            assert.ok(
              colonIndex !== -1,
              `Expected "${result}" to contain ": " separator`
            );
            const description = result.substring(colonIndex + 2);
            assert.strictEqual(
              description,
              'birden fazla dosya güncellendi',
              `Expected description to be "birden fazla dosya güncellendi", got "${description}"`
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 6: Scope extraction produces meaningful directory name', () => {
    const STRUCTURAL_DIRS = ['src', 'lib', 'test', 'tests'];

    const meaningfulDirArb: fc.Arbitrary<string> = fc
      .stringOf(
        fc.constantFrom(
          ...'abcdefghijklmnopqrstuvwxyz0123456789-_'.split('')
        ),
        { minLength: 1, maxLength: 20 }
      )
      .filter((s) => !STRUCTURAL_DIRS.includes(s) && s.length > 0);

    const structuralDirArb: fc.Arbitrary<string> = fc.constantFrom(...STRUCTURAL_DIRS);

    const fileNameArb: fc.Arbitrary<string> = fc
      .stringOf(
        fc.constantFrom(
          ...'abcdefghijklmnopqrstuvwxyz0123456789-_.'.split('')
        ),
        { minLength: 1, maxLength: 20 }
      );

    const pathWithMeaningfulDirArb: fc.Arbitrary<string> = fc
      .tuple(
        fc.array(structuralDirArb, { minLength: 0, maxLength: 2 }),
        meaningfulDirArb,
        fc.array(pathSegmentArb, { minLength: 0, maxLength: 2 }),
        fileNameArb
      )
      .map(([structuralPrefixes, meaningfulDir, extraDirs, fileName]) =>
        [...structuralPrefixes, meaningfulDir, ...extraDirs, fileName].join('/')
      );

    const statusArb: fc.Arbitrary<FileStatus> = fc.constantFrom('added', 'modified', 'deleted');

    it('should extract a non-empty, non-structural scope when includeScope is true', () => {
      fc.assert(
        fc.property(
          pathWithMeaningfulDirArb,
          (filePath) => {
            const scope = extractScope(filePath);

            assert.ok(
              scope !== null,
              `Expected non-null scope for path "${filePath}", got null`
            );

            assert.ok(
              scope!.length > 0,
              `Expected non-empty scope for path "${filePath}", got empty string`
            );

            assert.ok(
              !STRUCTURAL_DIRS.includes(scope!),
              `Scope "${scope}" should not be a structural directory name (src, lib, test, tests) for path "${filePath}"`
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include scope in parentheses in the output message when includeScope is true', () => {
      fc.assert(
        fc.property(
          pathWithMeaningfulDirArb,
          statusArb,
          (filePath, status) => {
            const file: FileChange = { status, filePath };
            const result = generateFallbackMessage([file], true);

            const scope = extractScope(filePath);

            assert.ok(
              scope !== null,
              `Expected non-null scope for path "${filePath}"`
            );
            assert.ok(
              result.includes(`(${scope})`),
              `Expected output "${result}" to contain scope "(${scope})" for path "${filePath}"`
            );

            const match = result.match(CONVENTIONAL_COMMIT_REGEX);
            assert.ok(
              match !== null,
              `Output "${result}" does not match Conventional Commits format`
            );

            const capturedScope = match![2];
            assert.strictEqual(
              capturedScope,
              scope,
              `Captured scope "${capturedScope}" should equal extracted scope "${scope}" for path "${filePath}"`
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT include scope in the output message when includeScope is false', () => {
      fc.assert(
        fc.property(
          pathWithMeaningfulDirArb,
          statusArb,
          (filePath, status) => {
            const file: FileChange = { status, filePath };
            const result = generateFallbackMessage([file], false);

            assert.ok(
              !result.includes('('),
              `Expected no scope in output "${result}" when includeScope is false for path "${filePath}"`
            );
            assert.ok(
              !result.includes(')'),
              `Expected no closing parenthesis in output "${result}" when includeScope is false for path "${filePath}"`
            );

            const match = result.match(CONVENTIONAL_COMMIT_REGEX);
            assert.ok(
              match !== null,
              `Output "${result}" does not match Conventional Commits format`
            );

            assert.strictEqual(
              match![2],
              undefined,
              `Expected no scope group in "${result}" when includeScope is false`
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
