import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { runN3LogicSelfTests, SelfTestResult } from './n3logic/selfTest';

import { n3logicRenameProvider } from './n3logic/providers/renameProvider';
import { n3logicDefinitionProvider } from './n3logic/providers/definitionProvider';
import { n3logicSignatureHelpProvider } from './n3logic/providers/signatureHelpProvider';

import { n3logicCompletionProvider } from './n3logic/providers/completionProvider';
// import { DebugIntegrationManager } from './n3logic/debug/DebugIntegrationManager';


function isSelfTestEnabled(): boolean {
  const config = vscode.workspace.getConfiguration('n3logic');
  return config.get('enableSelfTest', true);
}

// Self-test runner now modularized in ./n3logic/selfTest.ts

async function showSelfTestPanel(context: vscode.ExtensionContext) {
  const panel = vscode.window.createWebviewPanel(
    'n3logicSelfTest',
    'N3Logic Extension Self-Tests',
    vscode.ViewColumn.One,
    { enableScripts: true }
  );
  panel.webview.html = getSelfTestHtml('Running tests...');
  const results: SelfTestResult[] = await runN3LogicSelfTests(context);
  panel.webview.html = getSelfTestHtml(renderTestResults(results));
}

function renderTestResults(results: {name: string, passed: boolean, message?: string}[]): string {
  return `<ul style='font-family:monospace;'>` + results.map(r => `<li style='color:${r.passed ? 'green' : 'red'}'>${r.passed ? '✔' : '✖'} <b>${r.name}</b>${r.message ? ': ' + r.message : ''}</li>`).join('') + '</ul>';
}

function getSelfTestHtml(content: string): string {
  return `<!DOCTYPE html><html><body><h2>N3Logic Extension Self-Tests</h2>${content}<br><button onclick='location.reload()'>Run Again</button></body></html>`;
}

export function activate(context: vscode.ExtensionContext) {
  // Integrate diagnostics/code actions with debugger via component
  // new DebugIntegrationManager(context);

  // Register 'n3logic.stepToRule' command
  const stepToRuleCommand = vscode.commands.registerCommand('n3logic.stepToRule', async () => {
    vscode.window.showInformationMessage('Step to the next N3Logic rule (command invoked).');
  });
  context.subscriptions.push(stepToRuleCommand);

  // Register the self-test command if enabled
  if (isSelfTestEnabled()) {
    context.subscriptions.push(
      vscode.commands.registerCommand('n3logic.runSelfTests', () => showSelfTestPanel(context))
    );
  }

  // Register language providers
  context.subscriptions.push(
    vscode.languages.registerRenameProvider('n3logic', n3logicRenameProvider),
    vscode.languages.registerDefinitionProvider('n3logic', n3logicDefinitionProvider),
    vscode.languages.registerSignatureHelpProvider('n3logic', n3logicSignatureHelpProvider, '(', ','),
    vscode.languages.registerCompletionItemProvider('n3logic', n3logicCompletionProvider, '?', ':', '@', '{', 'm', 's', 'l', 't')
    // Add other providers here as you modularize them
  );
}

export function deactivate() {}
