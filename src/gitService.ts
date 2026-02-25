import { execSync } from 'node:child_process';
import { DiffResult, FileChange, FileStatus } from './types';

export function truncateDiff(diff: string, maxLength: number): string {
  if (maxLength <= 0) {
    return '';
  }
  if (diff.length <= maxLength) {
    return diff;
  }
  return diff.substring(0, maxLength);
}

export function parseStat(stat: string): FileChange[] {
  const files: FileChange[] = [];
  const lines = stat.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    if (/^\d+ files? changed/.test(trimmed)) {
      continue;
    }

    const pipeIndex = trimmed.indexOf('|');
    if (pipeIndex === -1) {
      continue;
    }

    const filePath = trimmed.substring(0, pipeIndex).trim();
    const changeInfo = trimmed.substring(pipeIndex + 1).trim();

    const status = detectFileStatus(changeInfo);

    if (filePath) {
      files.push({ status, filePath });
    }
  }

  return files;
}

function detectFileStatus(changeInfo: string): FileStatus {
  if (/Bin\s+0\s*->/.test(changeInfo)) {
    return 'added';
  }
  if (/Bin\s+\d+\s*->\s*0\s/.test(changeInfo)) {
    return 'deleted';
  }
  if (/Bin\s/.test(changeInfo)) {
    return 'modified';
  }

  const hasPlus = changeInfo.includes('+');
  const hasMinus = changeInfo.includes('-');

  if (hasPlus && !hasMinus) {
    return 'added';
  }
  if (hasMinus && !hasPlus) {
    return 'deleted';
  }

  return 'modified';
}

function execGitCommand(command: string, cwd: string): string {
  try {
    return execSync(command, {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return '';
  }
}

export async function getDiff(
  workspaceRoot: string,
  maxDiffLength: number
): Promise<DiffResult | null> {
  let diff = execGitCommand('git diff --cached', workspaceRoot);
  let stat = execGitCommand('git diff --cached --stat', workspaceRoot);

  if (!diff) {
    diff = execGitCommand('git diff', workspaceRoot);
    stat = execGitCommand('git diff --stat', workspaceRoot);
  }

  if (!diff) {
    return null;
  }

  const files = parseStat(stat);

  const truncatedDiff = truncateDiff(diff, maxDiffLength);

  return {
    diff: truncatedDiff,
    stat,
    files,
  };
}
