
import * as vscode from 'vscode';
import { builtinDocs } from './shared';

export const n3logicCodeActionProvider: vscode.CodeActionProvider = {
  provideCodeActions(document, range, context, token) {
    const actions: vscode.CodeAction[] = [];
  for (const diag of context.diagnostics) {
      // Add Quick Fix: Start Debugging and Jump to Error
      if (diag.severity === vscode.DiagnosticSeverity.Error || diag.severity === vscode.DiagnosticSeverity.Warning) {
        const debugAction = new vscode.CodeAction('Start Debugging and Jump to Error', vscode.CodeActionKind.QuickFix);
        debugAction.command = {
          command: 'n3logic.startDebugAtError',
          title: 'Start Debugging and Jump to Error',
          arguments: [document.uri, diag.range]
        };
        debugAction.diagnostics = [diag];
        actions.push(debugAction);
      }
      if (diag.message.startsWith('Undefined prefix: ')) {
        const prefix = diag.message.split(': ')[1];
        const fix = new vscode.CodeAction(`Add @prefix ${prefix}: <...> .`, vscode.CodeActionKind.QuickFix);
        fix.edit = new vscode.WorkspaceEdit();
        fix.edit.insert(document.uri, new vscode.Position(0, 0), `@prefix ${prefix}: <http://example.org/${prefix}#> .\n`);
        fix.diagnostics = [diag];
        // Do NOT set fix.command at all
  // Remove 'command' property at runtime to satisfy VS Code API typing
  Object.defineProperty(fix, 'command', { value: undefined, configurable: true, enumerable: false, writable: true });
  actions.push(fix);
      }
      if (diag.message.startsWith('Unknown or unsupported builtin: ')) {
        const builtin = diag.message.split(': ')[1];
        const prefix = builtin.split(':')[0];
        const candidates = Object.keys(builtinDocs).filter(b => b.startsWith(prefix + ':'));
        if (candidates.length > 0) {
          const fix = new vscode.CodeAction(`Replace with '${candidates[0]}'`, vscode.CodeActionKind.QuickFix);
          fix.edit = new vscode.WorkspaceEdit();
          fix.edit.replace(document.uri, diag.range, candidates[0]);
          fix.diagnostics = [diag];
          // Do NOT set fix.command at all
          Object.defineProperty(fix, 'command', { value: undefined, configurable: true, enumerable: false, writable: true });
          actions.push(fix);
        }
      }
    }
  return actions;
  }
};