# N3Logic VS Code Extension: Extensibility, Guidance, and Testing

## 1. Semantic Token Support
- The extension includes a basic semantic token provider for richer highlighting beyond TextMate grammar.
- To extend: Edit `extension.ts` and enhance the `provideDocumentSemanticTokens` logic for more context-aware tokens.

## 2. Integration with Linting/Diagnostics
- Regex-based diagnostics are implemented in `extension.ts`.
- For advanced diagnostics, restore or implement `N3LogicParser` and re-enable parser-based checks in `updateDiagnostics`.
- To extend: Add or update the parser, then update diagnostics logic to use parse results for semantic checks.

## 3. Extensibility for Future N3Logic Features
- To add new syntax to the grammar: Edit `syntaxes/n3logic.tmLanguage.json` and add new patterns.
- To add new built-ins: Update the relevant `N3Logic*Builtins.ts` file and, if needed, add highlighting patterns.
- To extend the parser: Edit `n3logic/N3LogicParser.ts` and add logic for new constructs.
- Document changes in this file for future contributors.

## 4. User/Contributor Guidance
- For common questions, see below:
  - **How do I add a new built-in?**
    - Add to the appropriate `N3Logic*Builtins.ts` file and update the grammar if you want special highlighting.
  - **How do I test grammar changes?**
    - See the "Automated Testing" section below.
  - **How do I enable advanced diagnostics?**
    - Restore the parser and re-enable parser-based diagnostics in `extension.ts`.
  - **Where do I report bugs?**
    - Open an issue in the GitHub repository.

## 5. Automated Testing for Grammar
- To test the grammar file:
  1. Install the [VS Code TextMate Grammar Test extension](https://marketplace.visualstudio.com/items?itemName=jeff-hykin.better-syntax).
  2. Create test N3Logic files covering all syntax features.
  3. Use the extension to verify correct highlighting.
- For CI: Add a GitHub Actions workflow to run grammar tests on PRs.

---

For more details, see the devdocs and comments in each source file.
