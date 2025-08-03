// CustomDebugUIManager handles custom debug UI features for the N3Logic debug adapter
import { OutputEvent } from '@vscode/debugadapter';

export class CustomDebugUIManager {
  private sendEvent: (event: OutputEvent) => void;

  constructor(sendEvent: (event: OutputEvent) => void) {
    this.sendEvent = sendEvent;
  }

  // Send a custom command message to the Debug Console
  public sendCustomCommandInfo(command: string, description: string): void {
    this.sendEvent(new OutputEvent(`[Command] ${command}: ${description}\n`));
  }

  // Send an inline value (with optional type and formatting)
  public sendInlineValue(variable: string, value: string, opts?: { type?: string, format?: string }): void {
    let msg = `[Inline] ${variable} = ${value}`;
    if (opts?.type) msg += ` (${opts.type})`;
    if (opts?.format) msg += ` [${opts.format}]`;
    this.sendEvent(new OutputEvent(msg + '\n'));
  }

  // Send a tooltip message (supports markdown)
  public sendTooltip(message: string, opts?: { markdown?: boolean }): void {
    if (opts?.markdown) {
      this.sendEvent(new OutputEvent(`[Tooltip:Markdown]\n${message}\n`));
    } else {
      this.sendEvent(new OutputEvent(`[Tooltip] ${message}\n`));
    }
  }

  // Send a custom status message (e.g., for status bar or notifications)
  public sendStatus(message: string, opts?: { type?: 'info' | 'warning' | 'error', durationMs?: number }): void {
    let prefix = '[Status]';
    if (opts?.type) prefix = `[Status:${opts.type}]`;
    let msg = `${prefix} ${message}`;
    if (opts?.durationMs) msg += ` (for ${opts.durationMs}ms)`;
    this.sendEvent(new OutputEvent(msg + '\n'));
  }

  // Send a custom panel message (for future custom UI panels)
  public sendPanel(title: string, content: string, opts?: { markdown?: boolean }): void {
    let msg = `[Panel] ${title}\n`;
    if (opts?.markdown) {
      msg += content + '\n';
    } else {
      msg += content + '\n';
    }
    this.sendEvent(new OutputEvent(msg));
  }
}
