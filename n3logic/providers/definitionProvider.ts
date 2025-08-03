import * as vscode from 'vscode';
import { builtinDocs } from './shared';

export const n3logicDefinitionProvider: vscode.DefinitionProvider = {
  provideDefinition(document: vscode.TextDocument, position: vscode.Position) {
    const wordRange = document.getWordRangeAtPosition(position, /[\w:]+/);
    if (!wordRange) return;
    const word = document.getText(wordRange);
    // 1. Prefix: jump to @prefix declaration
    if (/^[a-zA-Z_][\w\-]*$/.test(word)) {
      const prefixPattern = new RegExp(`^\s*@prefix\s+${word}:\s*<`, 'm');
      for (let i = 0; i < document.lineCount; i++) {
        if (prefixPattern.test(document.lineAt(i).text)) {
          return new vscode.Location(document.uri, new vscode.Position(i, 0));
        }
      }
    }
    // 2. Builtin: show doc as definition (peek)
    if (builtinDocs[word]) {
      // Return a location to a virtual doc with the docstring
      // (VS Code will show the doc in the peek window)
      // For now, just return the first line as a dummy location
      return new vscode.Location(document.uri, new vscode.Position(0, 0));
    }
    // 3. Rule: jump to rule definition (simple: look for label at start of line)
    const rulePattern = new RegExp(`^${word}\\b`);
    for (let i = 0; i < document.lineCount; i++) {
      if (rulePattern.test(document.lineAt(i).text)) {
        return new vscode.Location(document.uri, new vscode.Position(i, 0));
      }
    }
    return undefined;
  }
};
