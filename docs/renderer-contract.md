# Renderer Contract

The Renderer Contract is the compile-time ABI for UI output. It defines the required inputs, declared usage, and determinism markers a renderer must emit so the compiler can validate UI artifacts without inspecting the artifact itself.

## Required inputs and outputs
A compliant renderer manifest must include:
- Inputs: design intent reference (versioned + immutable checksum), visual constitution reference (versioned), optional pattern registry references.
- Outputs: artifact descriptor, declared token usage, declared pattern usage, constitution violations list, determinism markers.
- Taste declarations: typography roles and sizes, spacing values, color tokens and contrast checks, density counts, consistency values, and pattern usage intents (consumed by taste enforcement).
- Metadata: renderer name, version, target, and explicit contract declaration.

See `contracts/renderer-contract.schema.json` for the canonical schema.

## Registry and compliance
Renderers must be registered in `config/renderer-registry.json` with name, version, target, and contract id. Unregistered renderers are rejected even if their manifests are otherwise valid.

See `contracts/renderer-registry.schema.json` for registry structure.

## Validation rules (hard failures)
Renderer validation fails if any of the following are true:
- Required inputs are missing or schema-invalid.
- Undeclared token usage is reported.
- Constitution violations are reported.
- Nondeterministic markers are present or deterministic=false.
- Renderer is not registered for the declared target/version.
- Renderer contract declaration does not match the manifest contract.

## Running validation
Default paths:
- Manifest: `renderers/manifest.json`
- Registry: `config/renderer-registry.json`
- Report: `validation/renderer-report.json`

Command:
```
node dist/cli.js renderer-validate
```

Optional overrides:
```
node dist/cli.js renderer-validate --manifest <path> --registry <path> --report <path>
```

## Failure reporting
Validation emits `validation/renderer-report.json` with rule results, error ids, and counterexamples. The CLI exits non-zero on failure and prints the report path for inspection.
