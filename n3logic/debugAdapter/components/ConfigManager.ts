// ConfigManager handles custom arguments, initial data, and environment variables for N3Logic debug sessions
import { DebugProtocol } from '@vscode/debugprotocol';

export interface N3LogicConfig {
  customArgs?: Record<string, any>;
  initialData?: string;
  env?: Record<string, string>;
  breakpoints?: Array<{ file: string, line: number, condition?: string, enabled?: boolean }>;
  logLevel?: 'error' | 'warn' | 'info' | 'debug' | 'log';
  debugOptions?: Record<string, any>;
}

export class ConfigManager {
  private config: N3LogicConfig = {};

  public loadFromLaunchArgs(args: DebugProtocol.LaunchRequestArguments): void {
    // Accept advanced config from launch.json (using index access)
    const anyArgs = args as any;
    if (anyArgs.customArgs && typeof anyArgs.customArgs === 'object') {
      this.config.customArgs = anyArgs.customArgs;
    }
    if (typeof anyArgs.initialData === 'string') {
      this.config.initialData = anyArgs.initialData;
    }
    if (anyArgs.env && typeof anyArgs.env === 'object') {
      this.config.env = anyArgs.env as Record<string, string>;
    }
    if (Array.isArray(anyArgs.breakpoints)) {
      this.config.breakpoints = anyArgs.breakpoints;
    }
    if (typeof anyArgs.logLevel === 'string') {
      this.config.logLevel = anyArgs.logLevel;
    }
    if (anyArgs.debugOptions && typeof anyArgs.debugOptions === 'object') {
      this.config.debugOptions = anyArgs.debugOptions;
    }
  }

  // Allow dynamic config update
  public updateConfig(newConfig: Partial<N3LogicConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  public getCustomArgs(): Record<string, any> | undefined {
    return this.config.customArgs;
  }
  public getInitialData(): string | undefined {
    return this.config.initialData;
  }
  public getEnv(): Record<string, string> | undefined {
    return this.config.env;
  }
  public getBreakpoints(): Array<{ file: string, line: number, condition?: string, enabled?: boolean }> | undefined {
    return this.config.breakpoints;
  }
  public getLogLevel(): 'error' | 'warn' | 'info' | 'debug' | 'log' | undefined {
    return this.config.logLevel;
  }
  public getDebugOptions(): Record<string, any> | undefined {
    return this.config.debugOptions;
  }
}
