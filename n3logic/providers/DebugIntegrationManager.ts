// DebugIntegrationManager: links diagnostics and code actions to the debugger for N3Logic
import * as vscode from 'vscode';

export class DebugIntegrationManager {
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.registerDebugAtErrorCommand();
  }

  private registerDebugAtErrorCommand() {
    this.context.subscriptions.push(
      vscode.commands.registerCommand('n3logic.startDebugAtError', async (uri: vscode.Uri, range: vscode.Range) => {
        await vscode.debug.startDebugging(undefined, {
          type: 'n3logic',
          request: 'launch',
          name: 'Debug N3Logic file (Jump to Error)',
          program: uri.fsPath,
          stopOnEntry: true,
          errorLine: range.start.line + 1
        });
        const doc = await vscode.workspace.openTextDocument(uri);
        const editor = await vscode.window.showTextDocument(doc);
        editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
        editor.selection = new vscode.Selection(range.start, range.end);
      })
    );
  }
}
