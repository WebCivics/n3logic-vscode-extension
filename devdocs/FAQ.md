# N3Logic VS Code Extension: Quick Reference / FAQ

## Frequently Asked Questions

### How do I add a new built-in?
- Add the implementation to the appropriate file in `n3logic/builtins/` (e.g., `N3LogicMathBuiltins.ts`).
- If you want special syntax highlighting, update `syntaxes/n3logic.tmLanguage.json` to include the new built-in or its namespace.

### How do I test changes to the grammar file?
- Use the [VS Code TextMate Grammar Test extension](https://marketplace.visualstudio.com/items?itemName=jeff-hykin.better-syntax) to verify highlighting.
- Create test `.n3` or `.n3logic` files with all relevant syntax features.
- Reload the extension and check for correct highlighting.

### How do I enable advanced diagnostics?
- Ensure `N3LogicParser.ts` exists and is imported in `extension.ts`.
- Uncomment and update the parser-based diagnostics code in `updateDiagnostics`.
- Advanced diagnostics will then provide warnings for undefined prefixes, unbound variables, unknown builtins, and more.

### How do I extend the grammar for new N3Logic features?
- Edit `syntaxes/n3logic.tmLanguage.json` and add new patterns for any new syntax.
- For nested or recursive constructs, use recursive `include` patterns.
- Test changes as described above.

### Where do I report bugs or request features?
- Open an issue or pull request in the GitHub repository for this extension.

---

For more details, see `devdocs/CONTRIBUTING.md` and comments in the source files.
