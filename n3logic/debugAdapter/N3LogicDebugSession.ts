// ...existing code from debugAdapter/N3LogicDebugSession.ts, but update all imports to './components/...' and update relative paths as needed...
import { ConfigManager } from './components/ConfigManager';

import { CustomDebugUIManager } from './components/CustomDebugUIManager';
import { ExceptionManager } from './components/ExceptionManager';

import {
  DebugSession,
  InitializedEvent,
  TerminatedEvent,
  StoppedEvent,
  BreakpointEvent,
  OutputEvent
} from '@vscode/debugadapter';
import { BreakpointManager, BreakpointInfo } from './components/BreakpointManager';
import { DebugProtocol } from '@vscode/debugprotocol';
import { StepManager } from './components/StepManager';
import { VariableManager } from './components/VariableManager';
import { StackManager } from './components/StackManager';
import { OutputManager } from './components/OutputManager';





export class N3LogicDebugSession extends DebugSession {
  private breakpointManager = new BreakpointManager();
  private stepManager = new StepManager();
  private variableManager = new VariableManager();
  private stackManager = new StackManager();
  private outputManager: OutputManager;
  private exceptionManager: ExceptionManager;
  private customDebugUIManager: CustomDebugUIManager;
  private configManager: ConfigManager;

  public constructor() {
    super();
    // Bind OutputManager, ExceptionManager, and CustomDebugUIManager to this.sendEvent
    this.outputManager = new OutputManager(this.sendEvent.bind(this));
    this.exceptionManager = new ExceptionManager(this.sendEvent.bind(this));
    this.customDebugUIManager = new CustomDebugUIManager(this.sendEvent.bind(this));
  this.configManager = new ConfigManager();
  }

  protected initializeRequest(
    response: DebugProtocol.InitializeResponse,
    args: DebugProtocol.InitializeRequestArguments
  ): void {
    response.body = response.body || {};
    response.body.supportsConfigurationDoneRequest = true;
    this.sendResponse(response);
    this.sendEvent(new InitializedEvent());
  }

  protected setBreakpointsRequest(
    response: DebugProtocol.SetBreakpointsResponse,
    args: DebugProtocol.SetBreakpointsArguments
  ): void {
    const path = args.source.path || '';
    const clientLines = args.lines || [];
    const bps = this.breakpointManager.setBreakpoints(path, clientLines);
    const breakpoints: DebugProtocol.Breakpoint[] = bps.map(bp => ({
      verified: bp.verified,
      line: bp.line
    }));
    response.body = { breakpoints };
    this.sendResponse(response);
    for (const bp of breakpoints) {
      this.sendEvent(new BreakpointEvent('changed', bp));
    }
  }

  protected launchRequest(
    response: DebugProtocol.LaunchResponse,
    args: DebugProtocol.LaunchRequestArguments
  ): void {
    // Load configuration enhancements
    this.configManager.loadFromLaunchArgs(args);
    const customArgs = this.configManager.getCustomArgs();
    const initialData = this.configManager.getInitialData();
    const env = this.configManager.getEnv();
    const breakpoints = this.configManager.getBreakpoints();
    const logLevel = this.configManager.getLogLevel();
    const debugOptions = this.configManager.getDebugOptions();

    if (logLevel) {
      this.outputManager.setMinLevel(logLevel);
      this.outputManager.info(`Log level set to ${logLevel}`, { category: 'Config' });
    }
    this.outputManager.info('N3Logic Debugger started');
    // Use initialData to pre-populate the variable manager (simulate loading data)
    if (initialData) {
      this.variableManager.setVariable('initialData', initialData);
      this.outputManager.info(`Loaded Initial Data: ${initialData}`, { category: 'Config' });
    }
    // Use customArgs to set up execution options (simulate custom behavior)
    if (customArgs) {
      Object.keys(customArgs).forEach(key => {
        this.variableManager.setVariable(key, customArgs[key]);
      });
      this.outputManager.info(`Custom Args Applied: ${JSON.stringify(customArgs)}`, { category: 'Config', data: customArgs });
    }
    // Use env to simulate environment variable setup (log for now)
    if (env) {
      this.outputManager.info(`Environment Variables: ${JSON.stringify(env)}`, { category: 'Config', data: env });
    }
    // Set breakpoints from config
    if (breakpoints && Array.isArray(breakpoints)) {
      for (const bp of breakpoints) {
        this.breakpointManager.setBreakpoints(bp.file, [bp.line], [{ condition: bp.condition, enabled: bp.enabled }]);
        this.outputManager.info(`Breakpoint set from config: ${bp.file}:${bp.line}`, { category: 'Config', data: bp });
      }
    }
    // Use debugOptions for future advanced debug features
    if (debugOptions) {
      this.outputManager.info(`Debug options: ${JSON.stringify(debugOptions)}`, { category: 'Config', data: debugOptions });
    }

    // Allow dynamic config reload (example: listen for a custom event or method)
    // this.configManager.updateConfig({ logLevel: 'debug' });

    // Example: send custom command info, inline value, and tooltip
  this.customDebugUIManager.sendCustomCommandInfo('n3logic.stepToRule', 'Step to the next N3Logic rule');
  this.customDebugUIManager.sendInlineValue('varX', String(this.variableManager.getVariable('varX') ?? '42'), { type: 'number', format: 'decimal' });
  this.customDebugUIManager.sendTooltip('**Hover over a rule** to see details.\n- Shows rule info\n- Shows variable bindings', { markdown: true });
  this.customDebugUIManager.sendStatus('N3Logic Debugger Ready', { type: 'info', durationMs: 3000 });
  this.customDebugUIManager.sendPanel('N3Logic Debug Info', 'Debugger started.\n- Use step/continue to execute rules.\n- Breakpoints supported.\n', { markdown: false });
    // Example: simulate an exception on launch for demonstration
    // this.exceptionManager.reportException('Example N3Logic execution error');
    this.stepManager.reset();
    this.variableManager.reset();
    this.stackManager.reset();
    this.sendResponse(response);
    this.sendEvent(new StoppedEvent('entry', 1));
  }

  /**
   * Step execution: step through N3Logic rules/triples, update stack/variables, check breakpoints, emit DAP events
   */
  protected nextRequest(
    response: DebugProtocol.NextResponse,
    args: DebugProtocol.NextArguments
  ): void {
    // Simulate loading the current N3Logic document (in real use, would track the file under debug)
    // For demo, use a static test file or last known state
    const testFile = require('path').join(__dirname, '../../test/n3logic-all-features.n3');
    const fs = require('fs');
    let n3Text = '';
    try {
      n3Text = fs.readFileSync(testFile, 'utf8');
    } catch (e) {
      this.outputManager.error('Could not load test N3Logic file for stepping.');
      this.sendResponse(response);
      return;
    }
    // Parse rules/triples
    const { N3LogicParser } = require('../N3LogicParser');
    const parser = new N3LogicParser();
    let parseResult: any;
    try {
      parseResult = parser.parse(n3Text);
    } catch (e) {
      this.outputManager.error('Parse error during step execution', { category: 'Exception', data: e });
      this.exceptionManager.reportException('Parse error: ' + String(e));
      this.sendResponse(response);
      return;
    }
    // Step through rules one by one
    const rules = parseResult.rules || [];
    const idx = this.stepManager.next();
    if (idx > rules.length) {
    this.outputManager.info('End of rules reached.', { category: 'Step' });
      this.sendEvent(new TerminatedEvent());
      this.sendResponse(response);
      return;
    }
    const rule = rules[idx - 1];
    try {
      // Update stack: push rule frame
      this.stackManager.push({ name: `Rule #${idx}`, line: 1 });
      // Update variables: bind all antecedent variables to demo values
      if (rule && rule.antecedent && rule.antecedent.triples) {
        for (const triple of rule.antecedent.triples) {
          for (const v of [triple.subject, triple.predicate, triple.object]) {
            if (v && typeof v === 'object' && v.type === 'Variable') {
              this.variableManager.setVariable(v.value, `demo_${v.value}_${idx}`);
            }
          }
        }
      }
      // Check breakpoints: simulate by line number = rule index (for demo)
      const file = testFile;
      const line = idx; // Simulate each rule as a line
      const shouldBreak = this.breakpointManager.shouldBreak(file, line, this.variableManager.getAllVariables());
      if (shouldBreak) {
        this.outputManager.warn(`Hit breakpoint at rule #${idx} (line ${line})`, { category: 'Breakpoint', data: { rule: idx, line } });
        this.sendEvent(new StoppedEvent('breakpoint', 1));
      } else {
        this.outputManager.debug(`Stepped to rule #${idx}`, { category: 'Step', data: { rule: idx } });
        this.sendEvent(new StoppedEvent('step', 1));
      }
      // Pop stack frame after step (simulate stack unwinding)
      this.stackManager.pop();
      this.sendResponse(response);
    } catch (err) {
      this.outputManager.error('Exception during rule execution', { category: 'Exception', data: err });
      this.exceptionManager.reportException('Exception during rule execution: ' + String(err));
      this.sendResponse(response);
    }
    // Check breakpoints: simulate by line number = rule index (for demo)
    const file = testFile;
    const line = idx; // Simulate each rule as a line
    const shouldBreak = this.breakpointManager.shouldBreak(file, line, this.variableManager.getAllVariables());
    if (shouldBreak) {
  this.outputManager.warn(`Hit breakpoint at rule #${idx} (line ${line})`, { category: 'Breakpoint', data: { rule: idx, line } });
      this.sendEvent(new StoppedEvent('breakpoint', 1));
    } else {
  this.outputManager.debug(`Stepped to rule #${idx}`, { category: 'Step', data: { rule: idx } });
      this.sendEvent(new StoppedEvent('step', 1));
    }
    // Pop stack frame after step (simulate stack unwinding)
    this.stackManager.pop();
    this.sendResponse(response);
  }

  protected continueRequest(
    response: DebugProtocol.ContinueResponse,
    args: DebugProtocol.ContinueArguments
  ): void {
    try {
      this.outputManager.info('Continuing execution...', { category: 'Step' });
      // Simulate running all remaining rules (for demo)
      // In real use, would loop and step through all rules, handling exceptions
      // Here, just terminate
      this.sendEvent(new TerminatedEvent());
      this.sendResponse(response);
    } catch (err) {
      this.outputManager.error('Exception during continue execution', { category: 'Exception', data: err });
      this.exceptionManager.reportException('Exception during continue execution: ' + String(err));
      this.sendResponse(response);
    }
  }

  protected scopesRequest(
    response: DebugProtocol.ScopesResponse,
    args: DebugProtocol.ScopesArguments
  ): void {
    response.body = {
      scopes: [
        {
          name: 'Local',
          variablesReference: 1,
          expensive: false
        }
      ]
    };
    this.sendResponse(response);
  }

  /**
   * Comprehensive variable inspection: supports nested objects/lists, type/value display, and variable references
   */
  protected variablesRequest(
    response: DebugProtocol.VariablesResponse,
    args: DebugProtocol.VariablesArguments
  ): void {
    // Variable reference 0 = top-level variables
    const ref = args.variablesReference;
    const vars = this.variableManager.getAllVariables();
    // Use a map to assign unique reference IDs for nested objects/lists
    if (!this._varRefs) this._varRefs = new Map();
    if (!this._varRev) this._varRev = new Map();
    let variables: DebugProtocol.Variable[] = [];
    if (ref === 0 || ref === 1) {
      // Top-level variables
      for (const [name, value] of Object.entries(vars)) {
        const { displayValue, variablesReference } = this._makeVarDisplay(value);
        variables.push({
          name,
          value: displayValue,
          type: typeof value,
          variablesReference
        });
      }
    } else {
      // Nested variable reference
      const value = this._varRefs.get(ref);
      if (value && typeof value === 'object') {
        if (Array.isArray(value)) {
          value.forEach((v, i) => {
            const { displayValue, variablesReference } = this._makeVarDisplay(v);
            variables.push({
              name: `[${i}]`,
              value: displayValue,
              type: typeof v,
              variablesReference
            });
          });
        } else {
          for (const [k, v] of Object.entries(value)) {
            const { displayValue, variablesReference } = this._makeVarDisplay(v);
            variables.push({
              name: k,
              value: displayValue,
              type: typeof v,
              variablesReference
            });
          }
        }
      }
    }
    response.body = { variables };
    this.sendResponse(response);
  }

  // Helper: assign unique reference for nested objects/lists and format value
  private _varRefs: Map<number, any> = new Map();
  private _varRev: Map<any, number> = new Map();
  private _varRefCounter = 1000;
  private _makeVarDisplay(value: any): { displayValue: string, variablesReference: number } {
    if (value && typeof value === 'object') {
      // Avoid circular refs
      if (this._varRev.has(value)) {
        return { displayValue: '[Circular]', variablesReference: 0 };
      }
      const refId = this._varRefCounter++;
      this._varRefs.set(refId, value);
      this._varRev.set(value, refId);
      if (Array.isArray(value)) {
        return { displayValue: `[Array(${value.length})]`, variablesReference: refId };
      } else {
        return { displayValue: '[Object]', variablesReference: refId };
      }
    } else if (typeof value === 'string') {
      return { displayValue: '"' + value + '"', variablesReference: 0 };
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      return { displayValue: String(value), variablesReference: 0 };
    } else if (value === null) {
      return { displayValue: 'null', variablesReference: 0 };
    } else if (value === undefined) {
      return { displayValue: 'undefined', variablesReference: 0 };
    }
    return { displayValue: String(value), variablesReference: 0 };
  }

  /**
   * Robust call stack: maintain real call stack for rule/function execution, support multiple frames, extensible for multi-threading
   */
  protected stackTraceRequest(
    response: DebugProtocol.StackTraceResponse,
    args: DebugProtocol.StackTraceArguments
  ): void {
    // For now, single thread (id: 1). In future, support multiple threads.
    // The stackManager maintains a stack of frames for each thread (future-proofing)
    if (!this._threadStacks) this._threadStacks = new Map();
    const threadId = args.threadId || 1;
    if (!this._threadStacks.has(threadId)) {
      // Initialize with current stackManager stack
      this._threadStacks.set(threadId, [...this.stackManager.getStack()]);
    }
    const stack = this._threadStacks.get(threadId) as any[];
    // Each frame: id, name, line, column, source
    const stackFrames = stack.map((frame, i) => ({
      id: (threadId * 1000) + i + 1,
      name: frame.name,
      line: frame.line,
      column: 1,
      source: frame.source ? { path: frame.source } : undefined
    }));
    response.body = {
      stackFrames,
      totalFrames: stackFrames.length
    };
    this.sendResponse(response);
  }

  /**
   * Robust threads support: single thread for now, extensible for future multi-threading
   */
  protected threadsRequest(
    response: DebugProtocol.ThreadsResponse
  ): void {
    // For now, only one thread. In future, enumerate all _threadStacks keys.
    if (!this._threadStacks) this._threadStacks = new Map();
    const threads = [
      { id: 1, name: 'Main Thread' }
      // Future: ...Array.from(this._threadStacks.keys()).map(id => ({ id, name: `Thread ${id}` }))
    ];
    response.body = { threads };
    this.sendResponse(response);
  }

  // Internal: thread stacks for robust call stack support
  private _threadStacks: Map<number, any[]> = new Map();
}

DebugSession.run(N3LogicDebugSession);
