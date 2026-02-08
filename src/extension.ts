import * as vscode from 'vscode';
import { getDiff } from './gitService';
import { generateCommitMessage } from './geminiService';
import { generateFallbackMessage } from './fallbackGenerator';

export function activate(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand(
    'turkishCommits.generate',
    async () => {
      const workspaceRoot =
        vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

      if (!workspaceRoot) {
        vscode.window.showErrorMessage(
          'Açık bir çalışma alanı bulunamadı.'
        );
        return;
      }

      const config = vscode.workspace.getConfiguration('turkishCommits');
      const enableGemini = config.get<boolean>('enableGemini', true);
      const geminiApiKey = config.get<string>('geminiApiKey', '');
      const includeScope = config.get<boolean>('includeScope', true);
      const maxDiffLength = config.get<number>('maxDiffLength', 8000);
      const maxOutputTokens = config.get<number>('maxOutputTokens', 8192);

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Commit mesajı üretiliyor...',
          cancellable: false,
        },
        async () => {
          let diffResult;
          try {
            diffResult = await getDiff(workspaceRoot, maxDiffLength);
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(
              `Git komutu çalıştırılırken hata oluştu: ${message}`
            );
            return;
          }

          if (!diffResult) {
            vscode.window.showWarningMessage(
              'Commit edilecek değişiklik bulunamadı'
            );
            return;
          }

          let commitMessage: string | undefined;

          if (enableGemini && geminiApiKey) {
            try {
              commitMessage = await generateCommitMessage(
                diffResult.diff,
                diffResult.stat,
                geminiApiKey,
                maxOutputTokens
              );
            } catch (error) {
              const message =
                error instanceof Error ? error.message : String(error);

              if (message.includes("Gemini API'ye bağlanılamadı")) {
                vscode.window.showErrorMessage(
                  `Gemini API'ye bağlanılamadı: ${message}`
                );
              } else if (message.includes('Gemini API hatası (HTTP')) {
                vscode.window.showErrorMessage(message);
              } else {
                vscode.window.showErrorMessage(
                  'Commit mesajı üretilirken beklenmeyen bir hata oluştu'
                );
              }
            }
          } else if (enableGemini && !geminiApiKey) {
            vscode.window.showInformationMessage(
              'Gemini API anahtarı ayarlanmamış. Ayarlardan yapılandırın veya Gemini\'yi kapatın.'
            );
          }

          if (!commitMessage) {
            commitMessage = generateFallbackMessage(
              diffResult.files,
              includeScope
            );
          }

          const gitExtension =
            vscode.extensions.getExtension('vscode.git');

          if (gitExtension) {
            const git = gitExtension.exports.getAPI(1);
            if (git.repositories.length > 0) {
              git.repositories[0].inputBox.value = commitMessage;
            }
          }
        }
      );
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate(): void {
}
