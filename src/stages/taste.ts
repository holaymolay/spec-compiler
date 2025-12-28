import path from "path";
import { FILENAMES } from "../constants";
import { DesignIntentTaste, RendererOutputManifest, TasteReport, VisualConstitution } from "../types";
import { evaluateTaste, TasteEvaluationOptions } from "../rules/taste";
import { fileExists, readJsonFile, writeJsonFile } from "../utils/fs";

export interface TasteOptions extends TasteEvaluationOptions {
  manifest?: string;
  constitution?: string;
  intent?: string;
  report?: string;
  ruleset?: string;
}

export async function runTaste(options: TasteOptions): Promise<void> {
  const manifestPath = options.manifest ?? FILENAMES.rendererManifest;
  const constitutionPath = options.constitution ?? FILENAMES.visualConstitution;
  const intentPath = options.intent ?? FILENAMES.designIntent;
  const reportPath = options.report ?? FILENAMES.tasteReport;
  const rulesetPath = options.rulesetPath ?? options.ruleset ?? path.join(process.cwd(), FILENAMES.tasteRuleset);

  if (!fileExists(manifestPath)) {
    throw new Error(`Renderer manifest not found at ${manifestPath}.`);
  }
  if (!fileExists(constitutionPath)) {
    throw new Error(`Visual constitution not found at ${constitutionPath}.`);
  }
  if (!fileExists(intentPath)) {
    throw new Error(`Design intent not found at ${intentPath}.`);
  }
  if (!fileExists(rulesetPath)) {
    throw new Error(`Taste ruleset not found at ${rulesetPath}.`);
  }

  const manifest = await readJsonFile<RendererOutputManifest>(manifestPath);
  const constitution = await readJsonFile<VisualConstitution>(constitutionPath);
  const intent = await readJsonFile<DesignIntentTaste>(intentPath);

  const report: TasteReport = await evaluateTaste(manifest, constitution, intent, {
    rulesetPath,
    failFast: options.failFast ?? true,
    verbose: options.verbose ?? false,
  });

  await writeJsonFile(reportPath, report);

  if (report.status === "failed") {
    const first = report.errors[0];
    console.error(
      `Taste validation failed (${first.id}): ${first.message} | clause=${first.clause} intent=${first.intent_reference}`,
    );
    console.error(`See ${reportPath}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Taste validation passed. Report written to ${reportPath}`);
}
