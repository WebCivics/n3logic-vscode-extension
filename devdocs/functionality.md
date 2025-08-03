# N3Logic VSCode Extension: Functionality Overview

This document provides a comprehensive list of features and functionality enabled by the N3Logic VSCode Extension.

## Language Support
- **Syntax Highlighting**: Provides syntax highlighting for N3Logic files using a custom TextMate grammar.
- **File Recognition**: Recognizes `.n3` and `.n3logic` file extensions and associates them with the N3Logic language mode.
- **Language Configuration**: Supports language-specific configuration (comments, brackets, etc.) via `language-configuration.json`.

## Editing Assistance
- **Diagnostics**: 
  - Detects undefined prefixes and unknown/unsupported builtins in N3Logic code.
  - Displays inline error and warning messages in the editor.
- **Quick Fixes (Code Actions)**:
  - Suggests and applies fixes for undefined prefixes by inserting appropriate `@prefix` declarations.
  - Suggests replacements for unknown or unsupported builtins with valid alternatives.
- **Inlay Hints**:
  - Shows parameter and type hints inline for N3Logic builtins and variables, improving code readability.
- **Formatting**:
  - Provides document formatting for N3Logic files, ensuring consistent code style and indentation.

## Semantic Features
- **Semantic Tokens**:
  - Enables semantic highlighting for N3Logic constructs (rules, builtins, variables, etc.) for enhanced code clarity.

## Snippets
- **Code Snippets**:
  - Offers ready-to-use code snippets for common N3Logic patterns and builtins to speed up authoring.

## Documentation Integration
- **Builtin Documentation**:
  - Integrates documentation for N3Logic builtins, including signatures and descriptions, for use in hover and inlay hints.

## Testing & Automation
- **Automated Grammar Testing**:
  - Includes a GitHub Actions workflow for automated testing of the N3Logic grammar and language features.

## Extensibility & Maintainability
- **Modular Providers**:
  - All major features (diagnostics, code actions, inlay hints, formatting) are implemented as modular providers for maintainability and extensibility.
- **Shared Constants**:
  - Centralized documentation and signature data for builtins to ensure consistency across features.

## Debugging Support
- **N3Logic Debugger (Experimental)**:
  - Provides a basic debug adapter for N3Logic files, allowing you to launch a debug session from VS Code.
  - Debug configuration is contributed for N3Logic, with a placeholder backend ready for future breakpoint and execution support.
  - To use: select "N3Logic Debugger" in your launch configuration and start debugging an `.n3` or `.n3logic` file.

## Packaging & Publishing
- **VSIX Packaging**:
  - Supports packaging the extension as a `.vsix` file for local installation or distribution.
- **Marketplace Publishing**:
  - Ready for publishing to the Visual Studio Code Marketplace with proper metadata, licensing, and repository links.

For more details, see the README.md and the documentation in the `devdocs/` folder.


## To Do: Debugger Enhancements

- **Breakpoint Support**: Allow users to set, remove, and hit breakpoints in N3Logic files. Implement the setBreakpointsRequest and breakpoint events in your debug adapter.
- **Step Execution**: Add support for stepping through N3Logic rules (step over, step in, step out). Implement next, stepIn, stepOut, and continue requests.
- **Variable Inspection**: Show the values of variables and builtins in the VARIABLES panel. Implement scopes and variables requests to expose N3Logic state.
- **Call Stack**: Display the current rule or function call stack. Implement the stackTrace and threads requests.
- **Output and Logging**: Send evaluation results, errors, and debug output to the Debug Console using OutputEvent.
- **Exception Handling**: Detect and report errors in N3Logic execution as exceptions in the debugger.
- **Custom Debug UI**: Add custom commands, tooltips, or inline values for a richer debugging experience.
- **Configuration Enhancements**: Allow users to pass custom arguments, initial data, or environment variables in the launch configuration.
- **Integration with Language Features**: Link diagnostics and code actions to the debugger (e.g., jump to error and start debugging).
