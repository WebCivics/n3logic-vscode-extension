import * as vscode from 'vscode';
import { N3LogicParser } from '../N3LogicParser';

// Lint patterns for regex-based diagnostics
const lintPatterns = [
  {
    regex: /"[^"]*$/g,
    message: 'Unclosed double-quoted string',
    severity: vscode.DiagnosticSeverity.Error
  },
  {
    regex: /'[^']*$/g,
    message: 'Unclosed single-quoted string',
    severity: vscode.DiagnosticSeverity.Error
  },
  {
    regex: /[{}][^{}]*$/g,
    message: 'Unmatched brace',
    severity: vscode.DiagnosticSeverity.Error
  }
];

export function getDiagnostics(document: vscode.TextDocument): vscode.Diagnostic[] {
  const diags: vscode.Diagnostic[] = [];
  // Run regex-based linting
  for (let line = 0; line < document.lineCount; line++) {
    const text = document.lineAt(line).text;
    for (const { regex, message, severity } of lintPatterns) {
      regex.lastIndex = 0;
      let match;
      while ((match = regex.exec(text)) !== null) {
        diags.push(new vscode.Diagnostic(
          new vscode.Range(line, match.index, line, match.index + match[0].length),
          message,
          severity
        ));
        if (match.index === regex.lastIndex) regex.lastIndex++;
      }
    }
  }
  // Parser-based diagnostics
  let parseResult: any = null;
  let parserError: any = null;
  try {
    const parser = new N3LogicParser();
    parseResult = parser.parse(document.getText());
  } catch (err: any) {
    parserError = err;
    let range: vscode.Range;
    const msg = err && err.message ? String(err.message) : String(err);
    const lineMatch = msg.match(/line (\d+)/i);
    if (lineMatch) {
      const lineNum = parseInt(lineMatch[1], 10) - 1;
      range = new vscode.Range(lineNum, 0, lineNum, document.lineAt(lineNum).text.length);
    } else {
      range = new vscode.Range(0, 0, Math.min(1, document.lineCount), 1);
    }
    diags.push(new vscode.Diagnostic(
      range,
      '[N3LogicParser] ' + msg,
      vscode.DiagnosticSeverity.Error
    ));
    return diags;
  }

  // Advanced diagnostics if parse succeeded
  if (parseResult && typeof parseResult === 'object') {
    const text = document.getText();
    // 1. Unknown/unsupported builtins
    const knownBuiltins = (parseResult.builtins || []).map((b: any) => b.uri);
    const builtinRegex = /([a-zA-Z0-9\-]+):([a-zA-Z0-9\-]+)/g;
    for (let line = 0; line < document.lineCount; line++) {
      const lineText = document.lineAt(line).text;
      let match: RegExpExecArray | null;
      while ((match = builtinRegex.exec(lineText)) !== null) {
        const full = match[0];
        if (/^(math|string|log|time|list|type):/.test(full)) {
          const found = knownBuiltins.some((uri: string) => uri.endsWith('#' + match![2]));
          if (!found) {
            diags.push(new vscode.Diagnostic(
              new vscode.Range(line, match.index, line, match.index + full.length),
              `Unknown or unsupported builtin: ${full}`,
              vscode.DiagnosticSeverity.Warning
            ));
          }
        }
      }
    }
    // 2. Undefined prefixes
    const prefixRegex = /([a-zA-Z_][\w\-]*):[a-zA-Z_][\w\-]*/g;
    const prefixMap: Record<string, string> = {};
    const prefixLineRegex = /^\s*@prefix\s+(\w+):\s*<([^>]+)>\s*\./;
    for (let line = 0; line < document.lineCount; line++) {
      const lineText = document.lineAt(line).text;
      const prefixMatch = prefixLineRegex.exec(lineText);
      if (prefixMatch) {
        prefixMap[prefixMatch[1]] = prefixMatch[2];
      }
    }
    for (let line = 0; line < document.lineCount; line++) {
      const lineText = document.lineAt(line).text;
      let match: RegExpExecArray | null;
      while ((match = prefixRegex.exec(lineText)) !== null) {
        const prefix = match[1];
        if (!prefixMap || !(prefix in prefixMap)) {
          if (!/^(math|string|log|time|list|type)$/.test(prefix)) {
            diags.push(new vscode.Diagnostic(
              new vscode.Range(line, match.index, line, match.index + prefix.length),
              `Undefined prefix: ${prefix}`,
              vscode.DiagnosticSeverity.Warning
            ));
          }
        }
      }
    }
    // 3. Undefined variables in rules (simple check)
    if (parseResult.rules && Array.isArray(parseResult.rules)) {
      for (const rule of parseResult.rules) {
        const antecedentVars = new Set<string>();
        if (rule.antecedent && rule.antecedent.triples) {
          for (const triple of rule.antecedent.triples) {
            const subj = (triple as any).subject;
            const pred = (triple as any).predicate;
            const obj = (triple as any).object;
            for (const v of [subj, pred, obj]) {
              if (v && typeof v === 'object' && v.type === 'Variable') {
                antecedentVars.add(v.value);
              }
            }
          }
        }
        if (rule.consequent && rule.consequent.triples) {
          for (const triple of rule.consequent.triples) {
            const subj = (triple as any).subject;
            const pred = (triple as any).predicate;
            const obj = (triple as any).object;
            for (const v of [subj, pred, obj]) {
              if (v && typeof v === 'object' && v.type === 'Variable') {
                if (!antecedentVars.has(v.value)) {
                  const varPattern = new RegExp(`\\?${v.value}\\b`);
                  for (let line = 0; line < document.lineCount; line++) {
                    const lineText = document.lineAt(line).text;
                    const idx = lineText.search(varPattern);
                    if (idx !== -1) {
                      diags.push(new vscode.Diagnostic(
                        new vscode.Range(line, idx, line, idx + v.value.length + 1),
                        `Variable ?${v.value} in rule consequent is not bound in antecedent`,
                        vscode.DiagnosticSeverity.Warning
                      ));
                      break;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    // 4. Warn for deprecated builtins (example: log:implies)
    for (let line = 0; line < document.lineCount; line++) {
      const lineText = document.lineAt(line).text;
      if (lineText.includes('log:implies')) {
        diags.push(new vscode.Diagnostic(
          new vscode.Range(line, lineText.indexOf('log:implies'), line, lineText.indexOf('log:implies') + 'log:implies'.length),
          'log:implies is discouraged; use rules instead.',
          vscode.DiagnosticSeverity.Information
        ));
      }
    }
    // 5. Warn for unused prefixes and duplicate prefix declarations
    const usedPrefixes = new Set<string>();
    for (let line = 0; line < document.lineCount; line++) {
      const lineText = document.lineAt(line).text;
      let match: RegExpExecArray | null;
      while ((match = prefixRegex.exec(lineText)) !== null) {
        usedPrefixes.add(match[1]);
      }
    }
    const declaredPrefixes: Record<string, number> = {};
    for (let line = 0; line < document.lineCount; line++) {
      const lineText = document.lineAt(line).text;
      const prefixMatch = prefixLineRegex.exec(lineText);
      if (prefixMatch) {
        const prefix = prefixMatch[1];
        if (declaredPrefixes[prefix] !== undefined) {
          diags.push(new vscode.Diagnostic(
            new vscode.Range(line, 0, line, lineText.length),
            `Duplicate prefix declaration: ${prefix}`,
            vscode.DiagnosticSeverity.Warning
          ));
        } else {
          declaredPrefixes[prefix] = line;
        }
      }
    }
    for (const prefix in declaredPrefixes) {
      if (!usedPrefixes.has(prefix)) {
        const line = declaredPrefixes[prefix];
        const lineText = document.lineAt(line).text;
        diags.push(new vscode.Diagnostic(
          new vscode.Range(line, 0, line, lineText.length),
          `Prefix '${prefix}' is declared but never used`,
          vscode.DiagnosticSeverity.Hint
        ));
      }
    }
    // 6. Suggest best practices for rules
    if (parseResult.rules && Array.isArray(parseResult.rules)) {
      for (const rule of parseResult.rules) {
        const antTriples = rule.antecedent && rule.antecedent.triples ? rule.antecedent.triples.length : 0;
        const conTriples = rule.consequent && rule.consequent.triples ? rule.consequent.triples.length : 0;
        if (antTriples === 0) {
          diags.push(new vscode.Diagnostic(
            new vscode.Range(0, 0, 1, 1),
            'Rule antecedent is empty. Rules should have at least one triple in the antecedent.',
            vscode.DiagnosticSeverity.Hint
          ));
        }
        if (conTriples === 0) {
          diags.push(new vscode.Diagnostic(
            new vscode.Range(0, 0, 1, 1),
            'Rule consequent is empty. Rules should have at least one triple in the consequent.',
            vscode.DiagnosticSeverity.Hint
          ));
        }
      }
    }
  }
  return diags;
}
