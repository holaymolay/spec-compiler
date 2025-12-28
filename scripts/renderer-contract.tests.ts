import assert from "assert/strict";
import path from "path";
import { readFile } from "fs/promises";
import { buildRendererValidationReport } from "../src/utils/renderer-contract";

async function readJson(filePath: string): Promise<unknown> {
  const content = await readFile(filePath, "utf8");
  return JSON.parse(content) as unknown;
}

async function run(): Promise<void> {
  const fixturesDir = path.join(process.cwd(), "tests", "renderer-contract");

  const registry = await readJson(path.join(fixturesDir, "registry.valid.json"));
  const validManifest = await readJson(path.join(fixturesDir, "manifest.valid.json"));
  const invalidManifest = await readJson(path.join(fixturesDir, "manifest.invalid.json"));

  const validReport = await buildRendererValidationReport(validManifest, registry);
  assert.equal(validReport.status, "passed", "Expected valid renderer manifest to pass.");

  const invalidReport = await buildRendererValidationReport(invalidManifest, registry);
  assert.equal(invalidReport.status, "failed", "Expected invalid renderer manifest to fail.");

  const errorIds = invalidReport.errors.map((rule) => rule.id);
  assert.ok(
    errorIds.includes("token-usage.declared.rule"),
    "Expected token usage rule to fail for invalid manifest.",
  );
  assert.ok(
    errorIds.includes("deterministic-output.rule"),
    "Expected determinism rule to fail for invalid manifest.",
  );

  console.log("Renderer contract tests passed.");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
