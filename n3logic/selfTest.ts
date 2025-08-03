import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export interface SelfTestResult {
  name: string;
  passed: boolean;
  message?: string;
}

export async function runN3LogicSelfTests(context: vscode.ExtensionContext): Promise<SelfTestResult[]> {
  const results: SelfTestResult[] = [];
  const debug: string[] = [];
  function logResult(name: string, passed: boolean, message?: string) {
    results.push({ name, passed, message });
    debug.push(`[${passed ? 'PASS' : 'FAIL'}] ${name}${message ? ': ' + message : ''}`);
  }
  // 1. Language registration
  try {
    const doc = await vscode.workspace.openTextDocument({ language: 'n3logic', content: '# comment\n{ ?x ex:age ?age . }' });
    logResult('Language registration', doc.languageId === 'n3logic', doc.languageId);
  } catch (e: any) {
    logResult('Language registration', false, String(e));
  }
  // 2. Open canonical test file
  let doc: vscode.TextDocument | undefined;
  const testFile = path.join(__dirname, '../test/n3logic-all-features.n3');
  if (fs.existsSync(testFile)) {
    try {
      doc = await vscode.workspace.openTextDocument(testFile);
      await vscode.window.showTextDocument(doc, { preview: false });
      await new Promise(res => setTimeout(res, 500));
      logResult('Open canonical test file', true);
    } catch (e: any) {
      logResult('Open canonical test file', false, String(e));
    }
  } else {
    logResult('Open canonical test file', false, 'Test file missing');
  }
  // 3. Diagnostics
  if (doc) {
    try {
      const diagnostics = vscode.languages.getDiagnostics(doc.uri);
      const diagMsgs = diagnostics.map(d => `[${vscode.DiagnosticSeverity[d.severity]}] ${d.message} (Line ${d.range.start.line + 1})`).join('\n');
      const hasDiag = diagnostics.some(d => d.message.includes('undefined prefix') || d.message.includes('unknown') || d.severity === vscode.DiagnosticSeverity.Error || d.severity === vscode.DiagnosticSeverity.Warning);
      logResult('Diagnostics for undefined prefix/unknown builtin', hasDiag, diagMsgs || 'No diagnostics');
      debug.push('All diagnostics:\n' + diagMsgs);
    } catch (e: any) {
      logResult('Diagnostics for undefined prefix/unknown builtin', false, String(e));
    }
    // ...other tests as before (code actions, inlay hints, etc.)
  }
  // ...other tests as before
  // Write debug log to file
  try {
    const logPath = path.join((vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || __dirname), 'n3logic-selftest.log');
    fs.writeFileSync(logPath, debug.join('\n'), 'utf8');
    logResult('Debug log written', true, logPath);
  } catch (e: any) {
    logResult('Debug log written', false, String(e));
  }
  return results;
}
