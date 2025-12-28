import assert from "assert/strict";
import path from "path";
import { readFile } from "fs/promises";
import { evaluateTaste } from "../src/rules/taste";
import { DesignIntentTaste, RendererOutputManifest, VisualConstitution } from "../src/types";

async function readJson<T>(filePath: string): Promise<T> {
  const content = await readFile(filePath, "utf8");
  return JSON.parse(content) as T;
}

async function run(): Promise<void> {
  const fixturesDir = path.join(process.cwd(), "tests", "taste");
  const constitution = await readJson<VisualConstitution>(path.join(fixturesDir, "visual-constitution.json"));
  const intent = await readJson<DesignIntentTaste>(path.join(fixturesDir, "design-intent.json"));
  const manifestValid = await readJson<RendererOutputManifest>(path.join(fixturesDir, "manifest.valid.json"));
  const manifestInvalid = await readJson<RendererOutputManifest>(path.join(fixturesDir, "manifest.invalid.json"));

  const validReport = await evaluateTaste(manifestValid, constitution, intent, { verbose: true });
  assert.equal(validReport.status, "passed", "Expected compliant taste manifest to pass.");

  const invalidReport = await evaluateTaste(manifestInvalid, constitution, intent, { verbose: true, failFast: false });
  assert.equal(invalidReport.status, "failed", "Expected taste validation to fail.");
  const errorIds = invalidReport.errors.map((rule) => rule.id);
  assert.ok(errorIds.includes("typography.max-sizes.rule"), "Typography max sizes rule should fail.");
  assert.ok(errorIds.includes("density.limit.rule"), "Density limit rule should fail.");
  assert.ok(errorIds.includes("patterns.intent.rule"), "Pattern intent rule should fail.");

  console.log("Taste rule tests passed.");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
