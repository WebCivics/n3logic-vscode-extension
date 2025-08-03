
import * as vscode from 'vscode';
import { builtinSignatures, builtinDocs } from './shared';

const RULE_TEMPLATE = {
  label: '{ ... } => { ... }.',
  kind: vscode.CompletionItemKind.Snippet,
  insertText: '{ $1 } => { $2 }.',
  detail: 'N3Logic rule template',
  documentation: 'Insert a rule template.'
};

const PREFIX_TEMPLATE = {
  label: '@prefix ...',
  kind: vscode.CompletionItemKind.Snippet,
  insertText: '@prefix $1: <$2> .',
  detail: 'Prefix declaration',
  documentation: 'Insert a prefix declaration.'
};

export const n3logicCompletionProvider: vscode.CompletionItemProvider = {
  provideCompletionItems(document, position, token, context) {
    const completions: vscode.CompletionItem[] = [];

    // Add all builtins from shared.ts
    for (const [label, sig] of Object.entries(builtinSignatures)) {
      const item = new vscode.CompletionItem(label, vscode.CompletionItemKind.Function);
      item.detail = sig.label;
      item.documentation = builtinDocs[label] || '';
      completions.push(item);
    }

    // Add rule template
    const ruleItem = new vscode.CompletionItem(RULE_TEMPLATE.label, RULE_TEMPLATE.kind);
    ruleItem.insertText = new vscode.SnippetString(RULE_TEMPLATE.insertText);
    ruleItem.detail = RULE_TEMPLATE.detail;
    ruleItem.documentation = RULE_TEMPLATE.documentation;
    completions.push(ruleItem);

    // Add prefix template
    const prefixItem = new vscode.CompletionItem(PREFIX_TEMPLATE.label, PREFIX_TEMPLATE.kind);
    prefixItem.insertText = new vscode.SnippetString(PREFIX_TEMPLATE.insertText);
    prefixItem.detail = PREFIX_TEMPLATE.detail;
    prefixItem.documentation = PREFIX_TEMPLATE.documentation;
    completions.push(prefixItem);

    // Add variable completion (simple example: ?var)
    const varItem = new vscode.CompletionItem('?$VAR', vscode.CompletionItemKind.Variable);
    varItem.insertText = new vscode.SnippetString('?$1');
    varItem.detail = 'Variable';
    varItem.documentation = 'Insert a variable.';
    completions.push(varItem);

    // TODO: Add context-aware suggestions for in-scope variables and prefixes

    return completions;
  }
};
