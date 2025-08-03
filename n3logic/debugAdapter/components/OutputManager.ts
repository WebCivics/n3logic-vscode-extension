// OutputManager handles sending output and logging to the VS Code Debug Console
import { OutputEvent } from '@vscode/debugadapter';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'log';
export interface LogOptions {
  level?: LogLevel;
  category?: string;
  data?: any;
}

export class OutputManager {
  private sendEvent: (event: OutputEvent) => void;
  private minLevel: LogLevel = 'info';
  private levelOrder: Record<LogLevel, number> = {
    'error': 0,
    'warn': 1,
    'info': 2,
    'log': 3,
    'debug': 4
  };

  constructor(sendEvent: (event: OutputEvent) => void) {
    this.sendEvent = sendEvent;
  }

  public setMinLevel(level: LogLevel) {
    this.minLevel = level;
  }

  public log(message: string, opts: LogOptions = {}): void {
    const level = opts.level || 'info';
    if (this.levelOrder[level] > this.levelOrder[this.minLevel]) return;
    let prefix = '';
    switch (level) {
      case 'error': prefix = '[Error] '; break;
      case 'warn': prefix = '[Warning] '; break;
      case 'info': prefix = '[Info] '; break;
      case 'debug': prefix = '[Debug] '; break;
      case 'log': default: prefix = ''; break;
    }
    let cat = opts.category ? `[${opts.category}] ` : '';
    let msg = `${prefix}${cat}${message}`;
    if (opts.data !== undefined) {
      msg += `\n[Data] ${JSON.stringify(opts.data, null, 2)}`;
    }
    this.sendEvent(new OutputEvent(msg + '\n'));
  }

  public error(message: string, opts: LogOptions = {}): void {
    this.log(message, { ...opts, level: 'error' });
  }

  public warn(message: string, opts: LogOptions = {}): void {
    this.log(message, { ...opts, level: 'warn' });
  }

  public info(message: string, opts: LogOptions = {}): void {
    this.log(message, { ...opts, level: 'info' });
  }

  public debug(message: string, opts: LogOptions = {}): void {
    this.log(message, { ...opts, level: 'debug' });
  }

  public evalResult(result: string, opts: LogOptions = {}): void {
    this.log(`[Result] ${result}`, { ...opts, level: 'info', category: 'Eval' });
  }
}
