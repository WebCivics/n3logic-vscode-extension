export interface BreakpointInfo {
  line: number;
  verified: boolean;
  enabled?: boolean;
  condition?: string;
  hitCount?: number;
  hitCondition?: string;
}

export class BreakpointManager {
  private breakpoints: { [file: string]: BreakpointInfo[] } = {};

  setBreakpoints(file: string, lines: number[], options?: Partial<BreakpointInfo>[]): BreakpointInfo[] {
    const bps: BreakpointInfo[] = lines.map((line, i) => ({
      line,
      verified: true,
      enabled: options && options[i] && options[i].enabled !== undefined ? options[i].enabled : true,
      condition: options && options[i] && options[i].condition,
      hitCount: options && options[i] && options[i].hitCount,
      hitCondition: options && options[i] && options[i].hitCondition
    }));
    this.breakpoints[file] = bps;
    return bps;
  }

  getBreakpoints(file: string): BreakpointInfo[] {
    return this.breakpoints[file] || [];
  }

  getAllBreakpoints(): { [file: string]: BreakpointInfo[] } {
    return this.breakpoints;
  }

  enableBreakpoint(file: string, line: number): void {
    const bps = this.breakpoints[file];
    if (bps) {
      const bp = bps.find(b => b.line === line);
      if (bp) bp.enabled = true;
    }
  }

  disableBreakpoint(file: string, line: number): void {
    const bps = this.breakpoints[file];
    if (bps) {
      const bp = bps.find(b => b.line === line);
      if (bp) bp.enabled = false;
    }
  }

  clearBreakpoints(file: string): void {
    delete this.breakpoints[file];
  }

  clearAll(): void {
    this.breakpoints = {};
  }

  // Check if a breakpoint should trigger (line, file, condition, hit count)
  shouldBreak(file: string, line: number, context?: any): boolean {
    const bps = this.breakpoints[file];
    if (!bps) return false;
    const bp = bps.find(b => b.line === line && b.enabled !== false);
    if (!bp) return false;
    // Evaluate condition if present
    if (bp.condition && context) {
      try {
        // Simple JS eval (for demonstration, replace with safe eval in production)
        if (!eval(bp.condition)) return false;
      } catch {
        return false;
      }
    }
    // Handle hit count
    if (bp.hitCondition) {
      bp.hitCount = (bp.hitCount || 0) + 1;
      if (bp.hitCondition === String(bp.hitCount)) {
        return true;
      } else {
        return false;
      }
    }
    return true;
  }
}
