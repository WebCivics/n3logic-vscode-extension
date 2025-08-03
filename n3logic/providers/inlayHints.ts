import * as vscode from 'vscode';
import { builtinSignatures } from './shared';

export const n3logicInlayHintsProvider: vscode.InlayHintsProvider = {
  provideInlayHints(document, range) {
    const hints: vscode.InlayHint[] = [];
    for (let line = range.start.line; line <= range.end.line; line++) {
      const text = document.lineAt(line).text;
      // Builtin argument hints and inferred value hints
      const builtinCall = text.match(/([a-zA-Z0-9\-]+:[a-zA-Z0-9\-]*)\s*\(([^)]*)\)/);
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
        // Inferred value hint (after closing paren)
        const endParen = text.indexOf(')', pos);
        if (endParen !== -1) {
          let inferred = '';
          if (/^math:/.test(builtinCall[1])) inferred = ': number';
          else if (/^string:/.test(builtinCall[1])) inferred = ': string';
          else if (/^log:/.test(builtinCall[1])) inferred = ': boolean';
          else if (/^list:/.test(builtinCall[1])) inferred = ': list';
          else if (/^time:/.test(builtinCall[1])) inferred = ': date/time';
          else if (/^type:/.test(builtinCall[1])) inferred = ': type';
          if (inferred)
            hints.push(new vscode.InlayHint(new vscode.Position(line, endParen + 1), inferred, vscode.InlayHintKind.Type));
        }
      }
      // Variable type hints (detect ?var in subject/object positions)
      const varMatches = [...text.matchAll(/\?(\w+)/g)];
      for (const m of varMatches) {
        // Heuristic: if variable is in subject position (start of line or after {, [, or whitespace)
        const before = text.slice(0, m.index!);
        let vtype = ': variable';
        if (/^\s*\?\w+/.test(text)) vtype = ': subject variable';
        else if (/\s\?\w+\s/.test(text)) vtype = ': object variable';
        hints.push(new vscode.InlayHint(new vscode.Position(line, m.index! + m[0].length), vtype, vscode.InlayHintKind.Type));
      }
    }
    return hints;
  }
};
