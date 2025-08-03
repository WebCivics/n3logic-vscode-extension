import * as vscode from 'vscode';

export const n3logicFormattingProvider: vscode.DocumentFormattingEditProvider = {
  provideDocumentFormattingEdits(document) {
    const edits: vscode.TextEdit[] = [];
    let indent = 0;
    let inMultiLineString = false;
    for (let i = 0; i < document.lineCount; i++) {
      let line = document.lineAt(i).text;
      let trimmed = line.trim();
      if (trimmed === '') continue;
      // Handle multi-line strings ("""...""")
      if (/^"""/.test(trimmed)) inMultiLineString = !inMultiLineString;
      if (inMultiLineString) continue;
      // Outdent for closing braces/brackets/parentheses
      if (/^[}\]\)].*/.test(trimmed)) indent = Math.max(0, indent - 1);
      // Special handling for rule heads/bodies
      if (/^\{.*\} => \{.*\}\./.test(trimmed)) {
        // One-line rule, no indent
        if (line !== trimmed) {
          edits.push(vscode.TextEdit.replace(document.lineAt(i).range, trimmed));
        }
        continue;
      }
      const newText = '  '.repeat(indent) + trimmed;
      if (newText !== line) {
        edits.push(vscode.TextEdit.replace(document.lineAt(i).range, newText));
      }
      // Indent after opening braces/brackets/parentheses
      if (/[{\[\(]\s*$/.test(trimmed)) indent++;
    }
    return edits;
  }
};
