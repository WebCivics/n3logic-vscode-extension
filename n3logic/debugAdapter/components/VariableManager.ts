// VariableManager handles variable state for the N3Logic debug adapter
export class VariableManager {
  private variables: { [name: string]: any } = {};

  public setVariable(name: string, value: any): void {
    this.variables[name] = value;
  }

  public getVariable(name: string): any {
    return this.variables[name];
  }

  public getAllVariables(): { [name: string]: any } {
    return this.variables;
  }

  public reset(): void {
    this.variables = {};
  }
}
