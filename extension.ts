// --- Rename Provider for Variables, Prefixes, Rule Names ---
const n3logicRenameProvider: vscode.RenameProvider = {
  provideRenameEdits(document, position, newName) {
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
  prepareRename(document, position) {
    const wordRange = document.getWordRangeAtPosition(position, /[\w:]+/);
    if (!wordRange) return undefined;
    const word = document.getText(wordRange);
    if (word.startsWith('?') || /^[a-zA-Z_][\w\-]*$/.test(word)) {
      return wordRange;
    }
    return undefined;
  }
};
// --- Definition Provider for Prefixes, Rules, Builtins ---
const n3logicDefinitionProvider: vscode.DefinitionProvider = {
  provideDefinition(document, position) {
    const wordRange = document.getWordRangeAtPosition(position, /[\w:]+/);
    if (!wordRange) return;
    const word = document.getText(wordRange);
    // 1. Prefix: jump to @prefix declaration
    if (/^[a-zA-Z_][\w\-]*$/.test(word)) {
      const prefixPattern = new RegExp(`^\\s*@prefix\\s+${word}:\\s*<`, 'm');
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
// --- Signature Help Provider for Builtins ---
const builtinSignatures: Record<string, { label: string, parameters: string[] }> = {
  'math:greaterThan': { label: 'math:greaterThan(x, y)', parameters: ['x: number', 'y: number'] },
  'math:lessThan': { label: 'math:lessThan(x, y)', parameters: ['x: number', 'y: number'] },
  'math:equalTo': { label: 'math:equalTo(x, y)', parameters: ['x: number', 'y: number'] },
  'math:notEqualTo': { label: 'math:notEqualTo(x, y)', parameters: ['x: number', 'y: number'] },
  'math:sum': { label: 'math:sum(x, y)', parameters: ['x: number', 'y: number'] },
  'math:difference': { label: 'math:difference(x, y)', parameters: ['x: number', 'y: number'] },
  'math:product': { label: 'math:product(x, y)', parameters: ['x: number', 'y: number'] },
  'math:quotient': { label: 'math:quotient(x, y)', parameters: ['x: number', 'y: number'] },
  'string:concatenation': { label: 'string:concatenation(x, y)', parameters: ['x: string', 'y: string'] },
  'string:contains': { label: 'string:contains(x, y)', parameters: ['x: string', 'y: string'] },
  'string:startsWith': { label: 'string:startsWith(x, y)', parameters: ['x: string', 'y: string'] },
  'string:endsWith': { label: 'string:endsWith(x, y)', parameters: ['x: string', 'y: string'] },
  'string:substring': { label: 'string:substring(s, start, len)', parameters: ['s: string', 'start: number', 'len: number'] },
  'string:replace': { label: 'string:replace(s, search, replace)', parameters: ['s: string', 'search: string', 'replace: string'] },
  'string:matches': { label: 'string:matches(s, pattern)', parameters: ['s: string', 'pattern: regex'] },
  'string:length': { label: 'string:length(s)', parameters: ['s: string'] },
  'string:toLowerCase': { label: 'string:toLowerCase(s)', parameters: ['s: string'] },
  'string:toUpperCase': { label: 'string:toUpperCase(s)', parameters: ['s: string'] },
  'string:trim': { label: 'string:trim(s)', parameters: ['s: string'] },
  'log:implies': { label: 'log:implies(x, y)', parameters: ['x: formula', 'y: formula'] },
  'log:equalTo': { label: 'log:equalTo(x, y)', parameters: ['x: any', 'y: any'] },
  'log:not': { label: 'log:not(x)', parameters: ['x: formula'] },
  'list:length': { label: 'list:length(list, n)', parameters: ['list: List', 'n: number'] },
  'list:contains': { label: 'list:contains(list, x)', parameters: ['list: List', 'x: any'] },
  'list:first': { label: 'list:first(list, x)', parameters: ['list: List', 'x: any'] },
  'list:rest': { label: 'list:rest(list, rest)', parameters: ['list: List', 'rest: List'] },
  'list:append': { label: 'list:append(list, x)', parameters: ['list: List', 'x: any'] },
  'list:remove': { label: 'list:remove(list, x)', parameters: ['list: List', 'x: any'] },
  'list:reverse': { label: 'list:reverse(list)', parameters: ['list: List'] },
  'time:now': { label: 'time:now(x)', parameters: ['x: dateTime'] },
  'time:before': { label: 'time:before(a, b)', parameters: ['a: dateTime', 'b: dateTime'] },
  'time:after': { label: 'time:after(a, b)', parameters: ['a: dateTime', 'b: dateTime'] },
  'time:duration': { label: 'time:duration(a, b, d)', parameters: ['a: dateTime', 'b: dateTime', 'd: number'] },
  'time:hour': { label: 'time:hour(date, h)', parameters: ['date: dateTime', 'h: number'] },
  'time:minute': { label: 'time:minute(date, m)', parameters: ['date: dateTime', 'm: number'] },
  'time:second': { label: 'time:second(date, s)', parameters: ['date: dateTime', 's: number'] },
  'time:year': { label: 'time:year(date, y)', parameters: ['date: dateTime', 'y: number'] },
  'time:month': { label: 'time:month(date, m)', parameters: ['date: dateTime', 'm: number'] },
  'time:day': { label: 'time:day(date, d)', parameters: ['date: dateTime', 'd: number'] },
  'type:isLiteral': { label: 'type:isLiteral(x)', parameters: ['x: any'] },
  'type:isIRI': { label: 'type:isIRI(x)', parameters: ['x: any'] },
  'type:isBlank': { label: 'type:isBlank(x)', parameters: ['x: any'] },
  'type:toString': { label: 'type:toString(x)', parameters: ['x: any'] },
  'type:toNumber': { label: 'type:toNumber(x)', parameters: ['x: any'] },
  'type:toBoolean': { label: 'type:toBoolean(x)', parameters: ['x: any'] },
};

const n3logicSignatureHelpProvider: vscode.SignatureHelpProvider = {
  provideSignatureHelp(document, position) {
    const line = document.lineAt(position).text;
    // Find the function name before the cursor
    const textBefore = line.slice(0, position.character);
    const match = /([a-zA-Z0-9\-]+:[a-zA-Z0-9\-]*)\s*\([^(]*$/.exec(textBefore);
    if (!match) return undefined;
    const func = match[1];
    const sig = builtinSignatures[func];
    if (!sig) return undefined;
    // Count commas before cursor to determine active parameter
    const paramsBefore = textBefore.split('(').pop() || '';
    const commaCount = (paramsBefore.match(/,/g) || []).length;
    const signature = new vscode.SignatureInformation(sig.label, builtinDocs[func] || '');
    signature.parameters = sig.parameters.map(p => new vscode.ParameterInformation(p));
    const help = new vscode.SignatureHelp();
    help.signatures = [signature];
    help.activeSignature = 0;
    help.activeParameter = Math.min(commaCount, sig.parameters.length - 1);
    return help;
  }
};
// --- Completion and Hover Providers ---
const builtinCompletions = [
  'math:greaterThan', 'math:lessThan', 'math:equalTo', 'math:notEqualTo', 'math:sum', 'math:difference', 'math:product', 'math:quotient',
  'string:concatenation', 'string:contains', 'string:startsWith', 'string:endsWith', 'string:substring', 'string:replace', 'string:matches', 'string:length', 'string:toLowerCase', 'string:toUpperCase', 'string:trim',
  'log:implies', 'log:equalTo', 'log:not',
  'list:length', 'list:contains', 'list:first', 'list:rest', 'list:append', 'list:remove', 'list:reverse',
  'time:now', 'time:before', 'time:after', 'time:duration', 'time:hour', 'time:minute', 'time:second', 'time:year', 'time:month', 'time:day',
  'type:isLiteral', 'type:isIRI', 'type:isBlank', 'type:toString', 'type:toNumber', 'type:toBoolean'
];

const builtinDocs: Record<string, string> = {
  'math:greaterThan': 'math:greaterThan(x, y) is true if x > y',
  'math:lessThan': 'math:lessThan(x, y) is true if x < y',
  'math:equalTo': 'math:equalTo(x, y) is true if x == y',
  'math:notEqualTo': 'math:notEqualTo(x, y) is true if x != y',
  'math:sum': 'math:sum(x, y) returns x + y',
  'math:difference': 'math:difference(x, y) returns x - y',
  'math:product': 'math:product(x, y) returns x * y',
  'math:quotient': 'math:quotient(x, y) returns x / y',
  'string:concatenation': 'string:concatenation(x, y) returns x + y',
  'string:contains': 'string:contains(x, y) is true if x contains y',
  'string:startsWith': 'string:startsWith(x, y) is true if x starts with y',
  'string:endsWith': 'string:endsWith(x, y) is true if x ends with y',
  'string:substring': 'string:substring(s, start, len) returns substring',
  'string:replace': 'string:replace(s, search, replace) returns s with search replaced by replace',
  'string:matches': 'string:matches(s, pattern) is true if s matches regex pattern',
  'string:length': 'string:length(s) returns the length of s',
  'string:toLowerCase': 'string:toLowerCase(s) returns s in lower case',
  'string:toUpperCase': 'string:toUpperCase(s) returns s in upper case',
  'string:trim': 'string:trim(s) returns s with whitespace trimmed',
  'log:implies': 'log:implies(x, y) is true if x implies y (handled by rule engine)',
  'log:equalTo': 'log:equalTo(x, y) is true if x === y',
  'log:not': 'log:not(x) is true if x is false',
  'list:length': 'list:length(list, n) is true if list has length n',
  'list:contains': 'list:contains(list, x) is true if list contains x',
  'list:first': 'list:first(list, x) is true if x is the first element',
  'list:rest': 'list:rest(list, rest) returns the rest of the list after the first element',
  'list:append': 'list:append(list, x) returns a new list with x appended',
  'list:remove': 'list:remove(list, x) returns a new list with x removed',
  'list:reverse': 'list:reverse(list) returns a new list with elements reversed',
  'time:now': 'time:now(x) is true if x is the current ISO date string',
  'time:before': 'time:before(a, b) is true if a < b (date)',
  'time:after': 'time:after(a, b) is true if a > b (date)',
  'time:duration': 'time:duration(a, b, d) is true if d is the difference in ms between a and b',
  'time:hour': 'time:hour(date, h) is true if date has hour h',
  'time:minute': 'time:minute(date, m) is true if date has minute m',
  'time:second': 'time:second(date, s) is true if date has second s',
  'time:year': 'time:year(date, y) is true if date has year y',
  'time:month': 'time:month(date, m) is true if date has month m (1-12)',
  'time:day': 'time:day(date, d) is true if date has day d',
  'type:isLiteral': 'type:isLiteral(x) is true if x is a literal',
  'type:isIRI': 'type:isIRI(x) is true if x is an IRI',
  'type:isBlank': 'type:isBlank(x) is true if x is a blank node',
  'type:toString': 'type:toString(x) returns x as string',
  'type:toNumber': 'type:toNumber(x) returns x as number literal',
  'type:toBoolean': 'type:toBoolean(x) returns x as boolean literal'
};

const n3logicCompletionProvider: vscode.CompletionItemProvider = {
  provideCompletionItems(document, position) {
    const line = document.lineAt(position).text;
    // Suggest builtins after a colon or at start of line
    if (/[:\s]$/.test(line.slice(0, position.character))) {
      return builtinCompletions.map(b => {
        const item = new vscode.CompletionItem(b, vscode.CompletionItemKind.Function);
        item.detail = builtinDocs[b] || 'N3Logic builtin';
        return item;
      });
    }
    return undefined;
  }
};

const n3logicHoverProvider: vscode.HoverProvider = {
  provideHover(document, position) {
    const wordRange = document.getWordRangeAtPosition(position, /[\w:]+/);
    if (!wordRange) return;
    const word = document.getText(wordRange);
    if (builtinDocs[word]) {
      return new vscode.Hover(`**${word}**\n\n${builtinDocs[word]}`);
    }
    // TODO: Add prefix and rule hover info
    return undefined;
  }
};
import { getDiagnostics } from './n3logic/providers/diagnostics';
import { n3logicInlayHintsProvider } from './n3logic/providers/inlayHints';
import { n3logicFormattingProvider } from './n3logic/providers/formatting';
import { n3logicCodeActionProvider } from './n3logic/providers/codeActions';
// Diagnostics: regexes for simple linting
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
import * as vscode from 'vscode';


export function activate(context: vscode.ExtensionContext) {
  // Register completion and hover providers
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider('n3logic', n3logicCompletionProvider),
    vscode.languages.registerHoverProvider('n3logic', n3logicHoverProvider),
    vscode.languages.registerSignatureHelpProvider('n3logic', n3logicSignatureHelpProvider, '(', ','),
    vscode.languages.registerDefinitionProvider('n3logic', n3logicDefinitionProvider),
    vscode.languages.registerRenameProvider('n3logic', n3logicRenameProvider),
    vscode.languages.registerCodeActionsProvider('n3logic', n3logicCodeActionProvider, { providedCodeActionKinds: [vscode.CodeActionKind.QuickFix] }),
    vscode.languages.registerDocumentFormattingEditProvider('n3logic', n3logicFormattingProvider),
    vscode.languages.registerInlayHintsProvider('n3logic', n3logicInlayHintsProvider)
  );
  // Define token types and modifiers for N3Logic
  const tokenTypes = [
    'variable', 'function', 'string', 'number', 'keyword', 'comment', 'operator', 'type', 'class', 'parameter', 'property', 'builtin', 'punctuation', 'namespace', 'boolean', 'enum', 'interface', 'struct', 'typeParameter', 'event', 'modifier', 'regexp', 'decorator'
  ];
  const tokenModifiers = ['declaration', 'readonly', 'static', 'deprecated', 'abstract', 'async', 'modification', 'documentation', 'defaultLibrary'];
  const legend = new vscode.SemanticTokensLegend(tokenTypes, tokenModifiers);

  const selector = { language: 'n3logic', scheme: 'file' };

  const provider: vscode.DocumentSemanticTokensProvider = {
    provideDocumentSemanticTokens(document: vscode.TextDocument): vscode.ProviderResult<vscode.SemanticTokens> {
      const tokensBuilder = new vscode.SemanticTokensBuilder(legend);
      // Track if we're in a rule head or body for context-aware highlighting
      let inRuleHead = false;
      let inRuleBody = false;
      for (let line = 0; line < document.lineCount; line++) {
        const text = document.lineAt(line).text;
        // Detect rule head and body by curly braces and =>
        if (/^\s*\{/.test(text)) {
          if (!inRuleHead && !inRuleBody) {
            inRuleHead = true;
            inRuleBody = false;
          } else if (inRuleHead && /=>/.test(text)) {
            inRuleHead = false;
            inRuleBody = true;
          }
        }
        if (/=>/.test(text)) {
          inRuleHead = false;
          inRuleBody = true;
        }
        if (/^\s*\}/.test(text)) {
          inRuleHead = false;
          inRuleBody = false;
        }

        // Highlight built-ins distinctly
        let match;
        const builtinRegex = /(math|string|log|time|list|type):[a-zA-Z_][\w\-]*/g;
        while ((match = builtinRegex.exec(text)) !== null) {
          tokensBuilder.push(
            line,
            match.index,
            match[0].length,
            tokenTypes.indexOf('builtin'),
            0
          );
        }
        // Highlight rule head and body with different modifiers
        const tripleRegex = /([\p{L}_][\p{L}\p{N}\-]*:[\p{L}_][\p{L}\p{N}\-]*|<[^>]+>|\?[\p{L}_][\p{L}\p{N}_\-]*)/gu;
        while ((match = tripleRegex.exec(text)) !== null) {
          let modifier = 0;
          if (inRuleHead) modifier = tokenModifiers.indexOf('declaration');
          if (inRuleBody) modifier = tokenModifiers.indexOf('modification');
          tokensBuilder.push(
            line,
            match.index,
            match[0].length,
            tokenTypes.indexOf('type'),
            modifier >= 0 ? 1 << modifier : 0
          );
        }
        // Highlight variables
        const varRegex = /\?[\p{L}_][\p{L}\p{N}_\-]*/gu;
        while ((match = varRegex.exec(text)) !== null) {
          tokensBuilder.push(
            line,
            match.index,
            match[0].length,
            tokenTypes.indexOf('variable'),
            0
          );
        }
        // Highlight IRIs
        const iriRegex = /<[^>]+>/g;
        while ((match = iriRegex.exec(text)) !== null) {
          tokensBuilder.push(
            line,
            match.index,
            match[0].length,
            tokenTypes.indexOf('namespace'),
            0
          );
        }
        // Highlight comments
        const commentRegex = /#.*$/g;
        while ((match = commentRegex.exec(text)) !== null) {
          tokensBuilder.push(
            line,
            match.index,
            match[0].length,
            tokenTypes.indexOf('comment'),
            0
          );
        }
        // Highlight strings
        const stringRegex = /"""(?:[^\\]|\\.)*?"""|"(?:[^\\"]|\\.)*"|'(?:[^\\']|\\.)*'/g;
        while ((match = stringRegex.exec(text)) !== null) {
          tokensBuilder.push(
            line,
            match.index,
            match[0].length,
            tokenTypes.indexOf('string'),
            0
          );
        }
        // Highlight numbers
        const numberRegex = /-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/g;
        while ((match = numberRegex.exec(text)) !== null) {
          tokensBuilder.push(
            line,
            match.index,
            match[0].length,
            tokenTypes.indexOf('number'),
            0
          );
        }
        // Highlight booleans
        const boolRegex = /\b(true|false)\b/g;
        while ((match = boolRegex.exec(text)) !== null) {
          tokensBuilder.push(
            line,
            match.index,
            match[0].length,
            tokenTypes.indexOf('boolean'),
            0
          );
        }
        // Highlight punctuation
        const punctRegex = /[.{}()\[\];,]/g;
        while ((match = punctRegex.exec(text)) !== null) {
          tokensBuilder.push(
            line,
            match.index,
            match[0].length,
            tokenTypes.indexOf('punctuation'),
            0
          );
        }
      }
      return tokensBuilder.build();
    }
  };

  context.subscriptions.push(
    vscode.languages.registerDocumentSemanticTokensProvider(selector, provider, legend)
  );

  // Diagnostics (linting) integration
  const diagnostics = vscode.languages.createDiagnosticCollection('n3logic');
  context.subscriptions.push(diagnostics);

  function updateDiagnostics(document: vscode.TextDocument) {
    if (document.languageId !== 'n3logic') return;
    const diags = getDiagnostics(document);
    diagnostics.set(document.uri, diags);
  }

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(updateDiagnostics),
    vscode.workspace.onDidChangeTextDocument(e => updateDiagnostics(e.document)),
    vscode.workspace.onDidSaveTextDocument(updateDiagnostics)
  );

  // Run diagnostics on all open N3Logic docs at activation
  vscode.workspace.textDocuments.forEach(updateDiagnostics);
}

export function deactivate() {}
