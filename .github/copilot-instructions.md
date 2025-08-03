# Copilot Instructions for N3Logic

## General Guidance
- Generate N3Logic code using correct syntax for rules, prefixes, variables, and builtins.
- Use `@prefix` for namespace declarations at the top of the file.
- Use `{ ... } => { ... }.` for rules.
- Variables start with `?` (e.g., `?x`).
- Use builtins like `math:sum(x, y)` or `string:contains(s, t)` as functions in rule bodies.

## Builtins
- Suggest builtins from the following namespaces: `math:`, `string:`, `log:`, `list:`, `time:`, `type:`.
- Show argument signatures and types for builtins (e.g., `math:sum(x: number, y: number)`).
- Prefer builtins that match the context of the rule.

## Prefixes
- Always declare prefixes before using them.
- Use `<...>` for full IRIs and `prefix:name` for prefixed names.

## Rules
- Rules have the form:
  ```
  { ?x a ex:Person . } => { ?x ex:isHuman true . }.
  ```
- Bind all variables in the antecedent before using them in the consequent.

## Best Practices
- Avoid deprecated builtins (e.g., `log:implies`).
- Use clear variable names and consistent indentation.
- Add comments for complex logic.

## Example
```
@prefix ex: <http://example.org/> .
@prefix math: <http://www.w3.org/2000/10/swap/math#> .

{ ?x ex:age ?age . math:greaterThan(?age, 18) } => { ?x ex:isAdult true }.
```

## Documentation
- For more, see: https://www.w3.org/2000/10/swap/doc/
