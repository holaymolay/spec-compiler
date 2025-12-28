# Usage Guide — Spec Compiler Framework

This guide assumes no prior context. Follow it literally to run the deterministic pipeline. No LLMs are invoked; everything is mechanical.

## Prerequisites
- Node.js 20+
- `npm install` from repo root
- The CLI runs from `dist/cli.js` (built via `npm run build`)

## Pipeline Overview (never skip stages)
1) **intent** — Input-only. Accepts human-provided YAML. No normalization.
   - Input: `intent/intent.raw.yaml` (you create it).
   - Command: `node dist/cli.js intent --input intent/intent.raw.yaml`
   - Output: persisted copy at the same path. No other artifacts.
2) **clarify** — Surfaces missing decisions as blocking questions.
   - Command: `node dist/cli.js clarify`
   - Outputs:
     - `clarification/questions.yaml` (read-only, regenerated).
     - `clarification/responses.yaml` (you edit answers manually).
   - Rule: If questions exist, you must edit `clarification/responses.yaml` and rerun clarify until status is ready.
3) **normalize** — Compiles clarified intent into a governed spec.
   - Command: `node dist/cli.js normalize --spec-id <spec-id>`
   - Output: `specs/<spec-id>.md`
   - Refuses if clarification is incomplete or implicit behavior remains.
4) **validate** — Mechanical rule checks.
   - Command: `node dist/cli.js validate --spec-id <spec-id>`
   - Output: `validation/report.json`
   - Fails on: missing concept, missing synchronizations, missing tests/acceptance, missing security defaults, placeholders/implicit behavior.
5) **synthesize** — Generates the Codex execution prompt.
   - Command: `node dist/cli.js synthesize --spec-id <spec-id>`
   - Output: `synthesis/codex.prompt.md`
   - Refuses if validation failed.
6) **renderer-validate** — Validates renderer outputs against the Renderer Contract.
   - Command: `node dist/cli.js renderer-validate`
   - Output: `validation/renderer-report.json`
   - Fails on: schema violations, undeclared token usage, constitution violations, nondeterminism, or unregistered renderers.
7) **taste** — Enforces taste rules against renderer outputs and design constraints.
   - Command: `node dist/cli.js taste`
   - Output: `validation/taste-report.json`
   - Fails on: typography, spacing, color, density, consistency, or pattern compliance violations declared in metadata.

## Creating the intent file (required)
Create `intent/intent.raw.yaml` manually. Schema:
```yaml
intent:
  user_goal: "Plain statement of what you want"
  context: "Supporting background"
  stated_constraints: []
  unstated_assumptions: []
  uncertainties: []
  out_of_scope: []
```
Keep language plain; do not normalize or invent details.

## What “refusal” looks like
- Clarify: reports blocking questions and stops.
- Normalize: stops if clarifications unresolved or implicit assumptions remain.
- Validate: writes `validation/report.json` with failing rules and exits non-zero.
- Synthesize: refuses unless validation status is `passed`.
- Renderer-validate: writes `validation/renderer-report.json` with failing rules and exits non-zero.
- Taste: writes `validation/taste-report.json` with failing rules and exits non-zero.

## Common errors (and fixes)
- `intent/` missing: create the folder and the YAML file yourself.
- Clarify keeps blocking: fill `clarification/responses.yaml` with specific decisions, not “yes/no”.
- Validation fails on security: ensure security defaults from `config/framework.yaml` appear in the spec and `security.defaults_applied` is true in responses.
- Implicit behavior detected: remove placeholders (TBD/??) and clear unstated assumptions/uncertainties.
- Renderer validation fails on registration: add the renderer entry to `config/renderer-registry.json`.
- Taste validation fails on taste rules: align `renderers/manifest.json` taste declarations with `config/visual-constitution.json` and `config/design-intent.json`.

## Integration notes
- Run locally or in CI; no external services are called.
- Outputs (`specs/`, `validation/`, `synthesis/`) are git-ignored by default—commit them only if you intend to publish the artifacts.
- Downstream context-engineering flows consume these artifacts; this CLI only produces governed, validated contracts.
- Renderer contract details live in `docs/renderer-contract.md`.
- Taste rules and guidance live in `docs/taste-rules.md`.
