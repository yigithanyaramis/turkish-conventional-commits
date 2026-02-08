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

export type GeminiModel =
  | 'gemini-3-flash-preview'
  | 'gemini-2.5-flash'
  | 'gemini-2.5-flash-lite'
  | 'gemini-2.0-flash'
  | 'gemini-2.0-flash-lite';

export interface ExtensionConfig {
  enableGemini: boolean;
  geminiApiKey: string;
  geminiModel: GeminiModel;
  includeScope: boolean;
  maxDiffLength: number;
  maxOutputTokens: number;
}
