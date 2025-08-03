// StepManager handles step execution state for the N3Logic debug adapter
export class StepManager {
  private executionIndex: number = 0;
  private maxIndex: number = 10; // Placeholder for demo

  public next(): number {
    if (this.executionIndex < this.maxIndex) {
      this.executionIndex++;
    }
    return this.executionIndex;
  }

  public reset(): void {
    this.executionIndex = 0;
  }

  public getIndex(): number {
    return this.executionIndex;
  }
}
