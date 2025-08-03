import * as vscode from 'vscode';

export const n3logicRenameProvider: vscode.RenameProvider = {
  provideRenameEdits(document: vscode.TextDocument, position: vscode.Position, newName: string) {
    const wordRange = document.getWordRangeAtPosition(position, /[\w:]+/);
    if (!wordRange) return;
    const word = document.getText(wordRange);
    const edits = new vscode.WorkspaceEdit();
    // 1. Variable: ?var
    if (word.startsWith('?')) {
      const varPattern = new RegExp(`\\?${word.slice(1)}\\b`, 'g');
      for (let i = 0; i < document.lineCount; i++) {
        const lineText = document.lineAt(i).text;
        let match;
        while ((match = varPattern.exec(lineText)) !== null) {
          edits.replace(document.uri, new vscode.Range(i, match.index, i, match.index + match[0].length), '?' + newName.replace(/^\?/, ''));
        }
      }
    } else if (/^[a-zA-Z_][\w\-]*$/.test(word)) {
      // 2. Prefix or rule name
      const prefixPattern = new RegExp(`\\b${word}\\b`, 'g');
      for (let i = 0; i < document.lineCount; i++) {
        const lineText = document.lineAt(i).text;
        let match;
        while ((match = prefixPattern.exec(lineText)) !== null) {
          edits.replace(document.uri, new vscode.Range(i, match.index, i, match.index + match[0].length), newName);
        }
      }
    }
    return edits;
  },
  prepareRename(document: vscode.TextDocument, position: vscode.Position) {
    const wordRange = document.getWordRangeAtPosition(position, /[\w:]+/);
    if (!wordRange) return undefined;
    const word = document.getText(wordRange);
    if (word.startsWith('?') || /^[a-zA-Z_][\w\-]*$/.test(word)) {
      return wordRange;
    }
    return undefined;
  }
};
