export interface DiffResult {
  diff: string;
  stat: string;
  files: FileChange[];
}

export interface FileChange {
  status: FileStatus;
  filePath: string;
}

export type FileStatus = 'added' | 'modified' | 'deleted';

export interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message: string;
    code: number;
  };
}

export interface ExtensionConfig {
  enableGemini: boolean;
  geminiApiKey: string;
  includeScope: boolean;
  maxDiffLength: number;
  maxOutputTokens: number;
}
