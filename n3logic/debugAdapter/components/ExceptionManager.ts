// ExceptionManager handles error reporting as exceptions in the N3Logic debug adapter
import { OutputEvent, StoppedEvent } from '@vscode/debugadapter';

export class ExceptionManager {
  private sendEvent: (event: OutputEvent | StoppedEvent) => void;

  constructor(sendEvent: (event: OutputEvent | StoppedEvent) => void) {
    this.sendEvent = sendEvent;
  }

  public reportException(message: string): void {
    this.sendEvent(new OutputEvent(`[Exception] ${message}\n`));
    this.sendEvent(new StoppedEvent('exception', 1, message));
  }
}
