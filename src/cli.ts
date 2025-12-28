#!/usr/bin/env node
import { Command } from "commander";
import { runIntent, IntentOptions } from "./stages/intent";
import { runClarify, ClarifyOptions } from "./stages/clarify";
import { runNormalize, NormalizeOptions } from "./stages/normalize";
import { runValidate, ValidateOptions } from "./stages/validate";
import { runRendererValidate, RendererValidateOptions } from "./stages/renderer-validate";
import { runTaste, TasteOptions } from "./stages/taste";
import { runSynthesize, SynthesizeOptions } from "./stages/synthesize";
import packageJson from "../package.json";

const program = new Command();

function handleAction<T>(action: (opts: T) => Promise<void>) {
  return async (opts: T) => {
    try {
      await action(opts);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`ERROR: ${message}`);
      process.exitCode = 1;
    }
  };
}

program.name("spec-compile");
program.description("Deterministic spec compiler for governed specification artifacts.");
program.version(packageJson.version);

program
  .command("intent")
  .description("Capture raw human intent into intent/intent.raw.yaml.")
  .option("-i, --input <path>", "Path to YAML file containing the intent payload.")
  .action(handleAction<IntentOptions>(runIntent));

program
  .command("clarify")
  .description("Derive missing decisions and write clarification/questions.yaml.")
  .option("--force", "Regenerate questions even if responses look complete.")
  .action(handleAction<ClarifyOptions>(runClarify));

program
  .command("normalize")
  .description("Normalize clarified intent into governed spec artifacts.")
  .option("--spec-id <id>", "Override the spec ID to normalize.")
  .action(handleAction<NormalizeOptions>(runNormalize));

program
  .command("validate")
  .description("Validate specs against hard governance rules.")
  .option("--spec-id <id>", "Spec ID to validate (defaults to active normalized spec).")
  .action(handleAction<ValidateOptions>(runValidate));

program
  .command("renderer-validate")
  .description("Validate renderer outputs against the renderer contract.")
  .option("--manifest <path>", "Path to renderer output manifest (defaults to renderers/manifest.json).")
  .option("--registry <path>", "Path to renderer registry (defaults to config/renderer-registry.json).")
  .option("--report <path>", "Path for renderer validation report (defaults to validation/renderer-report.json).")
  .action(handleAction<RendererValidateOptions>(runRendererValidate));

program
  .command("taste")
  .description("Enforce taste rules against renderer outputs and visual constitution.")
  .option("--manifest <path>", "Path to renderer output manifest (defaults to renderers/manifest.json).")
  .option("--constitution <path>", "Path to visual constitution (defaults to config/visual-constitution.json).")
  .option("--intent <path>", "Path to design intent (defaults to config/design-intent.json).")
  .option("--ruleset <path>", "Path to taste ruleset (defaults to rules/taste/ruleset.json).")
  .option("--report <path>", "Path for taste validation report (defaults to validation/taste-report.json).")
  .option("--verbose", "Evaluate all rules even if failures occur.")
  .option("--no-fail-fast", "Do not stop on first failure (default is fail fast).")
  .action(handleAction<TasteOptions>(runTaste));

program
  .command("synthesize")
  .description("Generate the Codex-ready execution prompt from validated artifacts.")
  .option("--spec-id <id>", "Spec ID to synthesize prompts for.")
  .action(handleAction<SynthesizeOptions>(runSynthesize));

program.parseAsync(process.argv).catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`ERROR: ${message}`);
  process.exit(1);
});
