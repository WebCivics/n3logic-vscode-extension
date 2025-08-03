// ...existing code...

export class N3LogicParser {
    // Type guard: checks if a value is a non-null object (not array) with a string 'value' property
    private isObjectWithValue(x: unknown): x is { value: string } {
      return (
        typeof x === 'object' &&
        x !== null &&
        !Array.isArray(x) &&
        'value' in x &&
        typeof (x as any).value === 'string'
      );
    }
    // Debug support
    private DEBUG = false;
    private debugLog(...args: any[]) {
      if (typeof console !== 'undefined' && typeof console.log === 'function') {
        console.log('[N3LogicParser]', ...args);
      }
    }
    // Helper: extract prefix mappings from N3 text
    private extractPrefixes(n3Text: string): Record<string, string> {
      const prefixMap: Record<string, string> = {};
      const prefixRegex = /@prefix\s+(\w+):\s*<([^>]+)>\s*\./g;
      let match;
      while ((match = prefixRegex.exec(n3Text)) !== null) {
        prefixMap[match[1]] = match[2];
      }
      return prefixMap;
    }
    // Stub for parseBuiltins to resolve lint error
    private parseBuiltins(n3Text: string): any[] {
      // Dynamically import all builtins arrays
      // @ts-ignore: dynamic import for self-contained extension
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { MathBuiltins } = require('./builtins/N3LogicMathBuiltins');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { StringBuiltins } = require('./builtins/N3LogicStringBuiltins');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { ListBuiltins } = require('./builtins/N3LogicListBuiltins');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { TimeBuiltins } = require('./builtins/N3LogicTimeBuiltins');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { LogicBuiltins } = require('./builtins/N3LogicLogicBuiltins');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { TypeBuiltins } = require('./builtins/N3LogicTypeBuiltins');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { OtherBuiltins } = require('./builtins/N3LogicOtherBuiltins');

      const allBuiltins = [
        ...MathBuiltins,
        ...StringBuiltins,
        ...ListBuiltins,
        ...TimeBuiltins,
        ...LogicBuiltins,
        ...TypeBuiltins,
        ...OtherBuiltins,
      ];

      // Find all builtins whose URI appears in the N3 text
      const usedBuiltins = allBuiltins.filter(b => n3Text.includes(b.uri) || n3Text.includes(`<${b.uri}>`));
      return usedBuiltins;
    }
  constructor() {
    if (typeof console !== 'undefined' && typeof console.log === 'function') {
      console.log('[FORCE][N3LogicParser][CONSTRUCTOR] N3LogicParser instance created');
    }
  }
  setDebug(debug: boolean) {
    this.DEBUG = debug;
    this.debugLog('Debug mode set to', debug);
  }

  parse(n3Text: string): any {
    if (typeof console !== 'undefined' && typeof console.log === 'function') {
      console.log('[FORCE][N3LogicParser][ENTRY] parse called. DEBUG:', this.DEBUG, 'Input:', n3Text);
    }
    this.debugLog('[DEBUG][ENTRY] N3LogicParser.parse called. DEBUG:', this.DEBUG, 'Input:', n3Text);
    this.debugLog('Parsing input', n3Text);
    if (typeof n3Text !== 'string') {
      this.debugLog('Input is not a string');
      throw new TypeError('N3LogicParser.parse: Input must be a string');
    }
    // Remove comments only (preserve newlines for rule extraction)
    const commentStripped = n3Text.replace(/#[^\n]*/g, '');
    // Extract prefix mappings from the input
    const prefixMap = this.extractPrefixes(n3Text);
    this.debugLog('[N3LogicParser][PREFIX] Extracted prefix map:', prefixMap);

    // --- Robust triple and rule extraction ---
    // 1. Split into statements at "." (dot) that are not inside braces or quotes
    // 2. For each statement, determine if it's a rule (contains "=>") or a triple
    // 3. Parse rules and triples separately, collecting all

    // Helper: split at top-level dots
    const splitStatements = (input: string): string[] => {
      this.debugLog('[SPLIT][DEBUG] Raw input to splitStatements:', JSON.stringify(input));
      const stmts: string[] = [];
      let buf = '';
      let inQuote = false;
      let braceDepth = 0;
      let iriDepth = 0;
      let inRule = false;
      for (let i = 0; i < input.length; i++) {
        const c = input[i];
        if (c === '"') inQuote = !inQuote;
        if (!inQuote) {
          if (c === '{') {
            braceDepth++;
            if (braceDepth === 1 && !inRule && input.slice(i).includes('=>')) {
              inRule = true;
            }
          }
          if (c === '}') {
            braceDepth--;
            if (braceDepth === 0 && inRule) {
              // Look ahead for ' .' after closing rule block
              let j = i + 1;
              while (j < input.length && /\s/.test(input[j])) j++;
              if (input[j] === '.' && !inQuote && iriDepth === 0) {
                buf += c;
                buf += input[j];
                stmts.push(buf.trim());
                buf = '';
                i = j; // skip the dot
                inRule = false;
                continue;
              }
            }
          }
        }
        if (!inQuote && c === '<') iriDepth++;
        if (!inQuote && c === '>') iriDepth = Math.max(0, iriDepth - 1);
        // Only split at dot if not in quote, not in braces, not in IRI, and not in a rule
        if (c === '.' && !inQuote && braceDepth === 0 && iriDepth === 0 && !inRule) {
          if (buf.trim()) {
            stmts.push(buf.trim());
          }
          buf = '';
        } else {
          buf += c;
        }
      }
      if (buf.trim()) stmts.push(buf.trim());
      this.debugLog('[SPLIT][DEBUG] stmts after split:', JSON.stringify(stmts));
      return stmts;
    };

    // Remove all @prefix statements for triple/rule parsing, but keep for prefixMap
    const lines = commentStripped.split(/\r?\n/);
    const nonPrefixLines = lines.filter(line => !/^\s*@prefix\b/.test(line));
    const nonPrefixText = nonPrefixLines.join(' ');
    const statements = splitStatements(nonPrefixText);
    this.debugLog('[N3LogicParser][SPLIT][PATCHED] Statements:', JSON.stringify(statements, null, 2));
    if (typeof console !== 'undefined' && typeof console.log === 'function') {
      console.log('[FORCE][N3LogicParser][SPLIT][PATCHED] Statements:', JSON.stringify(statements, null, 2));
    }

    const triples: any[] = [];
    const rules: any[] = [];

    this.debugLog('[N3LogicParser][SPLIT][PATCHED] Number of statements:', statements.length);
    if (typeof console !== 'undefined' && typeof console.log === 'function') {
      console.log('[FORCE][N3LogicParser][SPLIT][PATCHED] Number of statements:', statements.length);
    }
    for (const [stmtIdx, stmt] of statements.entries()) {
  this.debugLog(`[N3LogicParser][SPLIT][PATCHED] Statement #${stmtIdx}:`, stmt);
  if (!stmt) continue;
  this.debugLog('[DEBUG][LOOP] Statement:', stmt);
      if (stmt.includes('=>')) {
        this.debugLog('[DEBUG][RULE] Rule statement detected:', stmt);
        // Robustly extract { ... } => { ... } blocks with balanced braces
        let i = 0;
        const n = stmt.length;
        const extractBlock = (start: number): { block: string, end: number } | null => {
          if (stmt[start] !== '{') return null;
          let depth = 0;
          let end = start;
          for (; end < n; end++) {
            if (stmt[end] === '{') depth++;
            if (stmt[end] === '}') depth--;
            if (depth === 0) break;
          }
          if (depth !== 0) return null;
          return { block: stmt.slice(start + 1, end), end };
        };
        // Extract antecedent
        while (i < n && stmt[i] !== '{') i++;
        const antecedent = extractBlock(i);
        if (!antecedent) {
          this.debugLog('[DEBUG][RULE][ERROR] Could not extract antecedent block:', stmt);
          continue;
        }
        i = antecedent.end + 1;
        // Skip whitespace and '=>'
        while (i < n && /\s/.test(stmt[i])) i++;
        if (stmt.slice(i, i + 2) !== '=>') {
          this.debugLog('[DEBUG][RULE][ERROR] No => after antecedent:', stmt);
          continue;
        }
        i += 2;
        while (i < n && /\s/.test(stmt[i])) i++;
        if (stmt[i] !== '{') {
          this.debugLog('[DEBUG][RULE][ERROR] No { after =>:', stmt);
          continue;
        }
        const consequent = extractBlock(i);
        if (!consequent) {
          this.debugLog('[DEBUG][RULE][ERROR] Could not extract consequent block:', stmt);
          continue;
        }
  this.debugLog('[DEBUG][RULE][PARSED] antecedent:', antecedent.block, 'consequent:', consequent.block);
        // Now parse as before
        const antecedentBlock = antecedent.block.trim();
        const consequentBlock = consequent.block.trim();
        const splitRuleBlock = (block: string): string[] => {
          const stmts: string[] = [];
          let buf = '';
          let inQuote = false;
          let braceDepth = 0;
          for (let i = 0; i < block.length; i++) {
            const c = block[i];
            if (c === '"') inQuote = !inQuote;
            if (!inQuote) {
              if (c === '{') braceDepth++;
              if (c === '}') braceDepth--;
            }
            if (c === '.' && !inQuote && braceDepth === 0) {
              if (buf.trim()) stmts.push(buf.trim());
              buf = '';
            } else {
              buf += c;
            }
          }
          if (buf.trim()) stmts.push(buf.trim());
          return stmts;
        };
        const parseRuleLine = (stmt: string) => {
          const logCallMatch = stmt.match(/^log:call\s*\(([^)]+)\)\s*$/);
          if (logCallMatch) {
            const args = logCallMatch[1].split(',').map(s => s.trim());
            return [{
              subject: { type: "IRI", value: "log:call" },
              predicate: { type: "IRI", value: args[0] },
              object: args.length > 2
                ? { type: "List", elements: args.slice(1).map(v => ({ type: "Literal", value: v })) }
                : { type: "Literal", value: args[1] || "" }
            }];
          }
          const fnMatch = stmt.match(/^<([^>]+)>\s*\(([^)]*)\)\s*$/);
          if (fnMatch) {
            const fnIRI = fnMatch[1];
            const args = fnMatch[2].split(',').map(s => s.trim()).filter(Boolean);
            return [{
              subject: { type: "IRI", value: fnIRI },
              predicate: { type: "IRI", value: "call" },
              object: args.length > 1
                ? { type: "List", elements: args.map(v => ({ type: "Literal", value: v })) }
                : { type: "Literal", value: args[0] || "" }
            }];
          }
          return this.parseTriples(stmt, true, prefixMap);
        };
        const antecedentStmts = splitRuleBlock(antecedentBlock);
        const consequentStmts = splitRuleBlock(consequentBlock);
        this.debugLog('[N3LogicParser][RULE][PATCH] antecedentStmts:', antecedentStmts, 'consequentStmts:', consequentStmts);
        const antecedentTriples = antecedentStmts.flatMap(parseRuleLine);
        const consequentTriples = consequentStmts.flatMap(parseRuleLine);
        this.debugLog('[N3LogicParser][RULE][DEBUG] Parsed antecedent triples:', JSON.stringify(antecedentTriples, null, 2));
        antecedentTriples.forEach((triple, idx) => {
          let predType = typeof triple.predicate === 'object' && triple.predicate !== null && 'type' in triple.predicate ? triple.predicate.type : typeof triple.predicate;
          let predValue = typeof triple.predicate === 'object' && triple.predicate !== null && 'value' in triple.predicate ? triple.predicate.value : triple.predicate;
          this.debugLog(`[N3LogicParser][RULE][DEBUG] Antecedent triple #${idx} FULL:`, JSON.stringify(triple, null, 2));
          this.debugLog(`[N3LogicParser][RULE][DEBUG] Antecedent triple #${idx} predicate:`, triple.predicate, 'type:', predType, 'value:', predValue);
          if (predType === 'IRI' && typeof predValue === 'string' && predValue.startsWith('http')) {
            this.debugLog(`[N3LogicParser][RULE][DEBUG][CUSTOM BUILTIN] Antecedent triple #${idx} has custom builtin predicate:`, predValue);
          }
        });
        this.debugLog('[N3LogicParser][RULE][DEBUG] Parsed consequent triples:', JSON.stringify(consequentTriples, null, 2));
        consequentTriples.forEach((triple, idx) => {
          let predType = typeof triple.predicate === 'object' && triple.predicate !== null && 'type' in triple.predicate ? triple.predicate.type : typeof triple.predicate;
          let predValue = typeof triple.predicate === 'object' && triple.predicate !== null && 'value' in triple.predicate ? triple.predicate.value : triple.predicate;
          this.debugLog(`[N3LogicParser][RULE][DEBUG] Consequent triple #${idx} predicate:`, triple.predicate, 'type:', predType, 'value:', predValue);
        });
        rules.push({
          type: 'Rule',
          antecedent: { type: 'Formula', triples: antecedentTriples },
          consequent: { type: 'Formula', triples: consequentTriples }
        });
        continue;
      } else {
        // Triple: parse as normal
        const tripleCandidates = this.parseTriples(stmt, false, prefixMap);
        tripleCandidates.forEach((triple, idx) => {
          this.debugLog(`[N3LogicParser][TRIPLE][DEBUG] Parsed triple #${idx}:`, JSON.stringify(triple));
          this.debugLog(`[N3LogicParser][TRIPLE][DEBUG] Triple #${idx} predicate:`, triple.predicate);
        });
        triples.push(...tripleCandidates);
      }
    }

  this.debugLog('N3LogicParser: Parsed triples:', JSON.stringify(triples, null, 2));
  this.debugLog('N3LogicParser: Parsed rules:', JSON.stringify(rules, null, 2));
  this.debugLog('[N3LogicParser][SPLIT][PATCHED] Number of parsed rules:', rules.length);
    if (typeof console !== 'undefined' && typeof console.log === 'function') {
      console.log('[FORCE][N3LogicParser][SPLIT][PATCHED] Number of parsed rules:', rules.length);
      rules.forEach((rule, idx) => {
        console.log(`[FORCE][N3LogicParser][SPLIT][PATCHED] Rule #${idx}:`, JSON.stringify(rule, null, 2));
      });
    }
    rules.forEach((rule, idx) => {
      this.debugLog(`[N3LogicParser][EXTRA] Rule #${idx} antecedent:`, JSON.stringify(rule.antecedent, null, 2));
      this.debugLog(`[N3LogicParser][EXTRA] Rule #${idx} consequent:`, JSON.stringify(rule.consequent, null, 2));
      rule.antecedent.triples.forEach((triple, tIdx) => {
        this.debugLog(`[N3LogicParser][EXTRA] Rule #${idx} antecedent triple #${tIdx}:`, JSON.stringify(triple, null, 2));
      });
      rule.consequent.triples.forEach((triple, tIdx) => {
        this.debugLog(`[N3LogicParser][EXTRA] Rule #${idx} consequent triple #${tIdx}:`, JSON.stringify(triple, null, 2));
      });
    });
    const builtins = this.parseBuiltins(commentStripped);
    const builtinUris = new Set<string>();
    for (const rule of rules) {
      if (rule.antecedent && Array.isArray(rule.antecedent.triples)) {
        for (const triple of rule.antecedent.triples) {
          const pred = triple.predicate;
          if (this.isObjectWithValue(pred)) {
            const p = pred as { value: string };
            if (p.value.startsWith('http') && p.value.includes('#')) {
              builtinUris.add(p.value);
            }
          }
        }
      }
    }
    const mergedBuiltins = Array.isArray(builtins)
      ? builtins.filter((b: any) => typeof b === 'object' && b !== null && 'uri' in b && 'apply' in b)
      : [];
  this.debugLog('N3LogicParser: Parsed builtins:', JSON.stringify(mergedBuiltins, null, 2));
  return { triples, rules, builtins: mergedBuiltins };
  }

  private parseTriples(n3Text: string, allowNoDot = false, prefixMap: Record<string, string> = {}): any[] {
    const triples: any[] = [];
    let statements: string[];
    let text = n3Text;
    if (text.startsWith('{') && text.endsWith('}')) {
      text = text.slice(1, -1);
    }
    statements = text.split('.').map(s => s.trim()).filter(Boolean);
    for (const stmt of statements) {
      if (!stmt) continue;
      const tokens = (stmt.match(/<[^>]+>|"(?:[^"\\]|\\.)*"|\S+/g) || []).map((t) => t.trim());
      if (tokens.length === 0) continue;
      for (let i = 0; i + 2 < tokens.length; i += 3) {
        const t0 = tokens[i], t1 = tokens[i + 1], t2 = tokens[i + 2];
        if ([t0, t1, t2].some((t) => t === '{' || t === '}' || t === '=>' || t === '' || t === '(' || t === ')')) {
          continue;
        }
        const triple = {
          subject: this.parseTerm(t0),
          predicate: this.parseTerm(t1),
          object: this.parseTerm(t2),
        };
        triples.push(triple);
      }
    }
    return triples;
  }

  private parseTerm(token: string): any {
    token = token.trim();
    if (!token) {
      throw new Error('parseTerm: Empty token');
    }
    if (token.startsWith('<') && token.endsWith('>')) {
      return { type: 'IRI', value: token.slice(1, -1) };
    } else if (token.startsWith('"')) {
      const litMatch = token.match(/^"([^"]*)"(?:\^\^<([^>]+)>|@([a-zA-Z\-]+))?/);
      if (litMatch) {
        return {
          type: 'Literal',
          value: litMatch[1],
          datatype: litMatch[2],
          language: litMatch[3],
        };
      } else {
        throw new Error(`parseTerm: Invalid literal format: '${token}'`);
      }
    } else if (token.startsWith('?')) {
      if (token.length < 2) throw new Error('parseTerm: Variable name missing after ?');
      return { type: 'Variable', value: token.slice(1) };
    } else if (token.startsWith('_:')) {
      if (token.length < 3) throw new Error('parseTerm: Blank node id missing after _:');
      return { type: 'BlankNode', value: token.slice(2) };
    } else if (token.startsWith('(') && token.endsWith(')')) {
      const inner = token.slice(1, -1).trim();
      if (!inner) return { type: 'List', elements: [] };
      const elements = inner.split(/\s+/).map((t) => this.parseTerm(t));
      return { type: 'List', elements };
    }
    return { type: 'IRI', value: token };
  }
}
