// StackManager handles call stack state for the N3Logic debug adapter
export interface StackFrameInfo {
  name: string;
  line: number;
}

export class StackManager {
  private stack: StackFrameInfo[] = [{ name: "main", line: 1 }];

  public push(frame: StackFrameInfo): void {
    this.stack.push(frame);
  }

  public pop(): StackFrameInfo | undefined {
    return this.stack.pop();
  }

  public getStack(): StackFrameInfo[] {
    return this.stack;
  }

  public reset(): void {
    this.stack = [{ name: "main", line: 1 }];
  }
}
