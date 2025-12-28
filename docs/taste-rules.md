# Taste Enforcement

Taste enforcement treats design quality as a compile-time policy gate. Rules evaluate declared metadata (from renderer manifest, design intent, and visual constitution) instead of rendered pixels so CI can reject taste regressions deterministically.

## Inputs
- Renderer manifest (`renderers/manifest.json`) — must comply with the Renderer Contract and include `taste` declarations (typography, spacing, color, density, consistency, patterns).
- Visual constitution (`config/visual-constitution.json`) — versioned constraints for tokens, ranges, and hierarchy.
- Design intent (`config/design-intent.json`) — immutable limits such as density and pattern intents.
- Taste ruleset (`rules/taste/ruleset.json`) — versioned rule metadata (id, clause, remediation).

## Rule set (initial)
Rules fail fast by default and report clause + intent references:
- Typography: max font-size variants; hierarchy/range alignment.
- Spacing: non-enumerated spacing values; variance beyond constitution limit.
- Color: unauthorized tokens; contrast below floor.
- Density: interactions per view above design intent limit.
- Consistency: radius/elevation/motion outside allowed sets or exceeding variance.
- Patterns: usage outside constitution or design-intent intent scope.

## Running taste checks
```
node dist/cli.js taste \
  --manifest renderers/manifest.json \
  --constitution config/visual-constitution.json \
  --intent config/design-intent.json \
  --ruleset rules/taste/ruleset.json
```
- Output: `validation/taste-report.json`
- Flags: `--verbose` to evaluate all rules, `--no-fail-fast` to avoid early exit.

## Failure reporting
- CLI exits non-zero and prints the first failure with rule id, clause, and intent reference.
- `validation/taste-report.json` lists all evaluated rules, remediation guidance, and counterexamples.

## Extending safely
1. Add or edit rule metadata in `rules/taste/ruleset.json` (bump `version`).
2. Implement deterministic checks in `src/rules/taste/index.ts` that consume declared metadata only.
3. Add fixtures under `tests/taste/` to cover pass/fail behavior.
4. Run `npm test` and `npm run build` before wiring new rules into CI.

## CI integration
Run `node dist/cli.js renderer-validate` then `node dist/cli.js taste` in CI. If either fails, the build fails with actionable errors; no manual review required.
