# CERES Spec Compiler
Part of the CERES (Coordinated Emergent Reasoning System). Umbrella repo: [CERES](https://github.com/holaymolay/ceres-coordinated-emergent-reasoning-system).
**Hub entry:** Load CERES via the umbrella `PROMPTLOADER.md` + `CONSTITUTION.md` (hub repo) and use hub todo templates/init script when bootstrapping; this component stays independent and is pulled via hub clone/run scripts.




## Why This Exists

Deterministic CLI pipeline that converts raw human intent into governed specification artifacts.

## Audience

**Include**
- Repository maintainers who need enforceable, audit-friendly specs from human intent.
- Governance and platform engineers standardizing spec workflows for downstream automation.
- Operators running deterministic pipelines that must refuse ambiguous inputs.

**Exclude**
- Teams seeking automatic requirement generation or creative drafting.
- Workflows that allow LLMs or tools to fill in missing decisions implicitly.

## Problem

Specs generated with ad hoc prompts or LLM retries drift, hide assumptions, and cannot be audited or trusted for downstream automation.

## Solution

A compiler-style CLI with hard stage gates (intent capture, clarification, normalization, validation, prompt synthesis) that refuses to proceed on missing decisions, enforces governance rules mechanically, and emits Codex-ready prompts only after deterministic checks pass. Entry point: README.md (you are here); drill-down runbook: docs/usage.md.

## Outcomes

Expected outcomes:

- Capture raw human intent without normalization or enrichment.
- Surface missing decisions as deterministic blocking questions until resolved.
- Normalize clarified intent into governed specs with traceable validation and security defaults.
- Validate specs against non-negotiable rules and synthesize Codex prompts only on passing validation.
- Validate renderer outputs against the Renderer Contract for deterministic UI artifacts.
- Enforce taste rules from the visual constitution and design intent; fail builds on taste regressions.
- Document how to operate the pipeline (local or CI) without LLMs or implicit assumptions.
- Guide users from README.md into detailed docs/usage.md for step-by-step execution.

## Quick Start

Run these steps:

1. npm install
2. npm run build
3. node dist/cli.js intent --input intent/intent.raw.yaml
4. node dist/cli.js clarify
5. node dist/cli.js normalize --spec-id <id> && node dist/cli.js validate --spec-id <id>
6. node dist/cli.js renderer-validate && node dist/cli.js taste
7. node dist/cli.js synthesize --spec-id <id>

## Repository Map

| Path | Description | Exists |
| --- | --- | --- |
| README.md | Start here; links into docs/usage.md for full pipeline walkthrough. | yes |
| README_SPEC.yaml | Authoritative input for README generation via readme-spec-engine. | yes |
| src/ | TypeScript sources for the compiler stages and CLI entrypoint. | yes |
| config/framework.yaml | Framework concepts, synchronizations, and security defaults. | yes |
| config/renderer-registry.json | Renderer registry declaring approved renderers and targets. | yes |
| config/visual-constitution.json | Visual constitution referenced by taste enforcement rules. | yes |
| config/design-intent.json | Immutable design intent constraints for taste enforcement. | yes |
| contracts/ | Machine-readable schemas for renderer contracts and registries. | yes |
| scripts/ | Run-record helpers for deterministic audit logs. | yes |
| runs/ | Run receipts captured per task. | yes |
| docs/context/ | Agent context ledgers per governance workflow (see also docs/usage.md for operational steps). | yes |
| docs/renderer-contract.md | Renderer Contract definition and compliance guidance. | yes |
| docs/taste-rules.md | Taste enforcement rules, inputs, and extension guidance. | yes |
| rules/ | Versioned taste ruleset metadata. | yes |
| todo.md | AI-managed task list; populate via todo-inbox.md. | yes |
| backlog.md | AI-managed backlog of future work. | yes |
| completed.md | AI-managed log of completed tasks. | yes |
| handover.md | Current focus, recent progress, and next steps. | yes |
| CHANGELOG.md | Changelog entries per completed task. | yes |
| tsconfig.json | TypeScript compiler settings for the CLI. | yes |
| package.json | Project metadata, scripts, and runtime dependencies. | yes |
| spec/ | README generation templates (sections, rules, tone) for readme-spec-engine. | yes |
| docs/usage.md | Step-by-step instructions for running the compiler pipeline and interpreting artifacts. | yes |

## Non-Goals

This tool explicitly avoids:

- Generate application code or business logic.
- Invoke LLMs or infer requirements automatically.
- Proceed past stage gates when clarification is incomplete.
- Bypass governance validation or acceptance criteria mapping.
- Serve as a general-purpose documentation generator beyond this compiler.

## Constraints

Hard constraints:

- Max length: 5200 chars
- Banned terms: magic, automagic
- Tone profile: neutral
## Hub schemas
- Consume CERES hub schemas for Objective Contract, Gap Ledger, Task Plan, Completed entry, and Prompt Debug Report (`schemas/` in the hub). Align generated specs to these artifacts.

## Hub schema sync
- Use hub `scripts/sync-schemas.sh <target-repo>` to copy Objective Contract, Gap Ledger, Task Plan, Completed entry, Prompt Debug Report schemas into this repo when needed.

## Observability (local)
- Use  to emit stage events via hub .
