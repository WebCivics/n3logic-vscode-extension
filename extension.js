"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const renameProvider_1 = require("./n3logic/providers/renameProvider");
const definitionProvider_1 = require("./n3logic/providers/definitionProvider");
const signatureHelpProvider_1 = require("./n3logic/providers/signatureHelpProvider");
const DebugIntegrationManager_1 = require("./n3logic/providers/DebugIntegrationManager");
function activate(context) {
    // Integrate diagnostics/code actions with debugger via component
    new DebugIntegrationManager_1.DebugIntegrationManager(context);
    // Register 'n3logic.stepToRule' command
    const stepToRuleCommand = vscode.commands.registerCommand('n3logic.stepToRule', async () => {
        // This is where you would send a custom debug adapter request if needed
        // For now, just show an info message
        vscode.window.showInformationMessage('Step to the next N3Logic rule (command invoked).');
        // Optionally: send a custom debug adapter request here
        // Example: vscode.debug.activeDebugSession?.customRequest('stepToRule');
    });
    context.subscriptions.push(stepToRuleCommand);
    // Register language providers
    context.subscriptions.push(vscode.languages.registerRenameProvider('n3logic', renameProvider_1.n3logicRenameProvider), vscode.languages.registerDefinitionProvider('n3logic', definitionProvider_1.n3logicDefinitionProvider), vscode.languages.registerSignatureHelpProvider('n3logic', signatureHelpProvider_1.n3logicSignatureHelpProvider, '(', ',')
    // Add other providers here as you modularize them
    );
}
function deactivate() { }
//# sourceMappingURL=extension.js.map