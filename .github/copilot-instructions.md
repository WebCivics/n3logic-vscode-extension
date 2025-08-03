
# Copilot Instructions for N3Logic (2025)

## General Guidance
- Generate N3Logic code using correct syntax for rules, prefixes, variables, and builtins.
- Use `@prefix` for namespace declarations at the top of the file.
- Use `{ ... } => { ... }.` for rules.
- Variables start with `?` (e.g., `?x`).
- Use builtins like `math:sum(x, y)` or `string:contains(s, t)` as functions in rule bodies.
- Support multi-line strings, Unicode identifiers, and custom datatypes/language tags.
- Use clear, consistent indentation and variable naming.

## Builtins
- Suggest builtins from these namespaces: `math:`, `string:`, `log:`, `list:`, `time:`, `type:`.
- Show argument signatures and types for builtins (e.g., `math:sum(x: number, y: number)`).
- Prefer builtins that match the context of the rule.
- Avoid deprecated builtins (e.g., `log:implies`).

## Prefixes
- Always declare prefixes before using them.
- Use `<...>` for full IRIs and `prefix:name` for prefixed names.

## Rules
- Rules have the form:
  ```
  { ?x a ex:Person . } => { ?x ex:isHuman true . }.
  ```
- Bind all variables in the antecedent before using them in the consequent.
- Add comments for complex or non-obvious logic.

## Language Features
- **Syntax Highlighting**: Provided via TextMate grammar and semantic tokens for rules, builtins, variables, etc.
- **Diagnostics**: Show errors/warnings for undefined prefixes, unknown builtins, and invalid syntax.
- **Code Actions**: Suggest fixes for undefined prefixes and unknown builtins.
- **Inlay Hints**: Show parameter/type hints for builtins and variables.
- **Formatting**: Auto-format N3Logic code for consistency.
- **Snippets**: Offer code snippets for common N3Logic patterns and builtins.
- **Hover/Signature Help**: Show builtin documentation and signatures.
- **Debugging**: Integrate with the N3Logic debugger; code actions can start debugging at error locations.

## Example
```
@prefix ex: <http://example.org/> .
@prefix math: <http://www.w3.org/2000/10/swap/math#> .

{ ?x ex:age ?age . math:greaterThan(?age, 18) } => { ?x ex:isAdult true }.
```

## Best Practices
- Use clear variable names and consistent indentation.
- Add comments for complex logic.
- Prefer explicit, readable rules.

## Documentation
- For more, see: https://www.w3.org/2000/10/swap/doc/
