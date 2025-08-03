import * as vscode from 'vscode';

export const n3logicFormattingProvider: vscode.DocumentFormattingEditProvider = {
  provideDocumentFormattingEdits(document) {
    const edits: vscode.TextEdit[] = [];
    let indent = 0;
    for (let i = 0; i < document.lineCount; i++) {
      let line = document.lineAt(i).text;
      let trimmed = line.trim();
      if (trimmed === '') continue;
      if (/^[}\]].*/.test(trimmed)) indent = Math.max(0, indent - 1);
      const newText = '  '.repeat(indent) + trimmed;
      if (newText !== line) {
        edits.push(vscode.TextEdit.replace(document.lineAt(i).range, newText));
      }
      if (/[{\[]\s*$/.test(trimmed)) indent++;
    }
    return edits;
  }
};
