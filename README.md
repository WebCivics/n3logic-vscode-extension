
# N3Logic VSCode Extension

N3Logic VSCode Extension provides comprehensive language support for N3Logic files, including:

- Syntax highlighting (TextMate grammar and semantic tokens)
- Completions/IntelliSense for builtins, prefixes, variables, and rule templates
- Hover tooltips with documentation for builtins, prefixes, and rules
- Signature help for builtins and functions
- Go to Definition/Peek Definition for prefixes, rules, and builtins
- Rename symbol for variables, prefixes, and rule names
- Code actions/quick fixes for undefined prefixes, unbound variables, and syntax errors
- Document formatting for consistent indentation and spacing
- Inlay hints for variable types, builtin argument types, and inferred values
- Diagnostics for syntax errors, best practices, anti-patterns, and deprecated features
- Snippets for common N3Logic patterns, rules, and builtin usage
- Built-in self-test runner (command: `N3Logic: Run Self-Tests`)
- Integrated debugger for N3Logic rules

## Features

### Language Support
- **Syntax Highlighting:** via TextMate grammar and semantic tokens for rules, builtins, variables, etc.
- **Completions/IntelliSense:** context-aware suggestions for IRIs, prefixes, variables, builtins, and rule templates.
- **Hover Tooltips:** documentation for builtins, prefixes, and rule constructs.
- **Signature Help:** argument types and descriptions for builtins/functions.
- **Go to Definition/Peek Definition:** navigate to prefix declarations, rule definitions, and builtin docs.
- **Rename Symbol:** rename variables, prefixes, and rule names across the document.
- **Code Actions/Quick Fixes:** quick fixes for undefined prefixes, unbound variables, and syntax errors.
- **Formatting:** auto-format N3Logic code for consistency.
- **Inlay Hints:** parameter/type hints for builtins and variables, inferred values.
- **Diagnostics:** errors/warnings for undefined prefixes, unknown builtins, invalid syntax, anti-patterns, and deprecated features.
- **Snippets:** code snippets for common N3Logic patterns and builtins.

### Debugging
- Integrated N3Logic debugger with step-to-rule and start-at-error commands.
- Debugger UI and components are modularized under `n3logic/debugAdapter/`.

### Self-Test Runner
- Run built-in self-tests with the `N3Logic: Run Self-Tests` command.
- View results in a webview panel.

## Getting Started

1. **Install dependencies:**
	```sh
	npm install
	```
2. **Build the extension:**
	```sh
	npm run compile
	```
3. **Launch in VS Code:**
	- Press `F5` to open a new Extension Development Host.
4. **Run self-tests:**
	- Open the Command Palette (`Ctrl+Shift+P`), search for `N3Logic: Run Self-Tests`.

## Project Structure

- `extension.ts` — Main extension entry point
- `n3logic/` — All language, provider, and debug adapter code
  - `providers/` — Language feature providers (completion, hover, diagnostics, etc.)
  - `debugAdapter/` — Debugger session and components
  - `syntax/` — Language configuration and grammar files
  - `snippets/` — N3Logic code snippets
  - `selfTest.ts` — Modular self-test runner
- `package.json` — Extension manifest and configuration

## Development

- **Add new builtins:** Update `n3logic/providers/shared.ts` for completions, signature help, and docs.
- **Add new diagnostics:** Edit `n3logic/providers/diagnostics.ts` to expand best-practice checks.
- **Add new snippets:** Edit `n3logic/snippets/n3logic.code-snippets`.
- **Update grammar:** Edit `n3logic/syntax/n3logic.tmLanguage.json` for syntax highlighting.
- **Debugging:** Debugger code is under `n3logic/debugAdapter/`.

## Contributing

Contributions are welcome! Please see `devdocs/CONTRIBUTING.md` for guidelines.

## See Also [History of N3 Logic](./HistoryOfN3Logic.md)

## License

MIT
