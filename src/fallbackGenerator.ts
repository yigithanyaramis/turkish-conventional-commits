import { FileChange } from './types';

const STRUCTURAL_DIRS = new Set(['src', 'lib', 'test', 'tests']);

export function extractScope(filePath: string): string | null {
  const segments = filePath.replace(/\\/g, '/').split('/');

  const dirSegments = segments.slice(0, -1);

  if (dirSegments.length === 0) {
    return null;
  }

  for (const segment of dirSegments) {
    if (segment && !STRUCTURAL_DIRS.has(segment)) {
      return segment;
    }
  }

  return null;
}

function getFileName(filePath: string): string {
  const segments = filePath.replace(/\\/g, '/').split('/');
  return segments[segments.length - 1] || filePath;
}

export function generateFallbackMessage(
  files: FileChange[],
  includeScope: boolean
): string {
  if (files.length === 0) {
    return 'chore: dosyalar güncellendi';
  }

  let type: string;
  let description: string;
  let scope: string | null = null;

  if (files.length === 1) {
    const file = files[0];
    const fileName = getFileName(file.filePath);

    switch (file.status) {
      case 'added':
        type = 'feat';
        description = `${fileName} eklendi`;
        break;
      case 'deleted':
        type = 'chore';
        description = `${fileName} kaldırıldı`;
        break;
      case 'modified':
      default:
        type = 'chore';
        description = `${fileName} güncellendi`;
        break;
    }

    if (includeScope) {
      scope = extractScope(file.filePath);
    }
  } else {
    type = 'chore';
    description = 'birden fazla dosya güncellendi';

    if (includeScope) {
      scope = extractScope(files[0].filePath);
    }
  }

  if (scope) {
    return `${type}(${scope}): ${description}`;
  }

  return `${type}: ${description}`;
}
