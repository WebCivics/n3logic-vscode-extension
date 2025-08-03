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
    // 6. Suggest best practices and anti-patterns for rules
    if (parseResult.rules && Array.isArray(parseResult.rules)) {
      for (const rule of parseResult.rules) {
        const antTriples = rule.antecedent && rule.antecedent.triples ? rule.antecedent.triples.length : 0;
        const conTriples = rule.consequent && rule.consequent.triples ? rule.consequent.triples.length : 0;
        // Empty antecedent/consequent
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
        // Inefficient: too many triples in antecedent or consequent
        if (antTriples > 10) {
          diags.push(new vscode.Diagnostic(
            new vscode.Range(0, 0, 1, 1),
            `Rule antecedent has ${antTriples} triples. Consider splitting for clarity and efficiency.`,
            vscode.DiagnosticSeverity.Hint
          ));
        }
        if (conTriples > 10) {
          diags.push(new vscode.Diagnostic(
            new vscode.Range(0, 0, 1, 1),
            `Rule consequent has ${conTriples} triples. Consider splitting for clarity and efficiency.`,
            vscode.DiagnosticSeverity.Hint
          ));
        }
        // No-op rule: identical antecedent and consequent
        if (antTriples > 0 && conTriples > 0 && JSON.stringify(rule.antecedent.triples) === JSON.stringify(rule.consequent.triples)) {
          diags.push(new vscode.Diagnostic(
            new vscode.Range(0, 0, 1, 1),
            'Rule antecedent and consequent are identical (no-op rule).',
            vscode.DiagnosticSeverity.Warning
          ));
        }
        // Always-true antecedent: antecedent is {}
        if (antTriples === 0 && conTriples > 0) {
          diags.push(new vscode.Diagnostic(
            new vscode.Range(0, 0, 1, 1),
            'Rule antecedent is always true ({}). Use with caution.',
            vscode.DiagnosticSeverity.Information
          ));
        }
        // Deeply nested lists (anti-pattern)
        if (rule.antecedent && rule.antecedent.triples) {
          for (const triple of rule.antecedent.triples) {
            if (triple.object && typeof triple.object === 'object' && triple.object.type === 'List') {
              let depth = 0;
              let obj = triple.object;
              while (obj && obj.type === 'List') {
                depth++;
                obj = obj.items && obj.items[0];
                if (depth > 5) {
                  diags.push(new vscode.Diagnostic(
                    new vscode.Range(0, 0, 1, 1),
                    'Deeply nested list detected in rule antecedent (depth > 5). Consider flattening.',
                    vscode.DiagnosticSeverity.Hint
                  ));
                  break;
                }
              }
            }
          }
        }
        // Variable naming: suggest more explicit names
        const allVars: string[] = [];
        if (rule.antecedent && rule.antecedent.triples) {
          for (const triple of rule.antecedent.triples) {
            for (const v of [triple.subject, triple.predicate, triple.object]) {
              if (v && typeof v === 'object' && v.type === 'Variable') {
                allVars.push(v.value);
                if (/^\?([a-zA-Z])$/.test('?' + v.value)) {
                  diags.push(new vscode.Diagnostic(
                    new vscode.Range(0, 0, 1, 1),
                    `Variable '?${v.value}' is very short. Use more descriptive variable names for clarity.`,
                    vscode.DiagnosticSeverity.Hint
                  ));
                }
              }
            }
          }
        }
        // Too many variables in a rule
        const uniqueVars = new Set(allVars);
        if (uniqueVars.size > 8) {
          diags.push(new vscode.Diagnostic(
            new vscode.Range(0, 0, 1, 1),
            `Rule uses ${uniqueVars.size} variables. Consider simplifying or splitting the rule.`,
            vscode.DiagnosticSeverity.Hint
          ));
        }
        // Repeated variable names in a rule
        const varCounts: Record<string, number> = {};
        for (const v of allVars) {
          varCounts[v] = (varCounts[v] || 0) + 1;
        }
        for (const v in varCounts) {
          if (varCounts[v] > 3) {
            diags.push(new vscode.Diagnostic(
              new vscode.Range(0, 0, 1, 1),
              `Variable '?${v}' appears ${varCounts[v]} times in this rule. Consider refactoring for clarity.`,
              vscode.DiagnosticSeverity.Hint
            ));
          }
        }
        // Suggest adding comments for complex rules (many triples or variables)
        const ruleStartLine = 0; // Could be improved with parser support
        if ((antTriples + conTriples > 8 || uniqueVars.size > 6)) {
          let hasComment = false;
          for (let l = Math.max(0, ruleStartLine - 2); l <= ruleStartLine; l++) {
            if (document.lineAt(l).text.trim().startsWith('#')) {
              hasComment = true;
              break;
            }
          }
          if (!hasComment) {
            diags.push(new vscode.Diagnostic(
              new vscode.Range(ruleStartLine, 0, ruleStartLine, 1),
              'Consider adding a comment to explain this complex rule.',
              vscode.DiagnosticSeverity.Hint
            ));
          }
        }
      }
    }
  }
  return diags;
}
