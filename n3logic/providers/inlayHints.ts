import * as vscode from 'vscode';
import { builtinSignatures } from './shared';

export const n3logicInlayHintsProvider: vscode.InlayHintsProvider = {
  provideInlayHints(document, range) {
    const hints: vscode.InlayHint[] = [];
    for (let line = range.start.line; line <= range.end.line; line++) {
      const text = document.lineAt(line).text;
      // Builtin argument hints
      const builtinCall = text.match(/([a-zA-Z0-9\-]+:[a-zA-Z0-9\-]*)\s*\(([^)]*)/);
      if (builtinCall && builtinSignatures[builtinCall[1]]) {
        const sig = builtinSignatures[builtinCall[1]];
        const args = builtinCall[2].split(',');
        let idx = 0, pos = text.indexOf('(') + 1;
        for (const param of sig.parameters) {
          if (idx < args.length) {
            const argStart = pos + args.slice(0, idx).join(',').length + (idx > 0 ? 1 : 0);
            hints.push(new vscode.InlayHint(new vscode.Position(line, argStart), param, vscode.InlayHintKind.Parameter));
          }
          idx++;
        }
      }
      // Variable type hints (simple: ?var in rule head)
      const varMatches = [...text.matchAll(/\?(\w+)/g)];
      for (const m of varMatches) {
        hints.push(new vscode.InlayHint(new vscode.Position(line, m.index! + m[0].length), ': variable', vscode.InlayHintKind.Type));
      }
    }
    return hints;
  }
};
