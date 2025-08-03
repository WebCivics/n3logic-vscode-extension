import * as vscode from 'vscode';
import { builtinSignatures, builtinDocs } from './shared';

export const n3logicSignatureHelpProvider: vscode.SignatureHelpProvider = {
  provideSignatureHelp(document: vscode.TextDocument, position: vscode.Position) {
    const line = document.lineAt(position).text;
    // Find the function name before the cursor
    const textBefore = line.slice(0, position.character);
    const match = /([a-zA-Z0-9\-]+:[a-zA-Z0-9\-]*)\s*\([^\(]*$/.exec(textBefore);
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
