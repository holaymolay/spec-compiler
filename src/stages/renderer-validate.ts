import path from "path";
import { FILENAMES } from "../constants";
import { RendererValidationReport } from "../types";
import { fileExists, readJsonFile, writeJsonFile } from "../utils/fs";
import { buildRendererValidationReport } from "../utils/renderer-contract";

export interface RendererValidateOptions {
  manifest?: string;
  registry?: string;
  report?: string;
}

export async function runRendererValidate(options: RendererValidateOptions): Promise<void> {
  const manifestPath = options.manifest ?? FILENAMES.rendererManifest;
  const registryPath = options.registry ?? FILENAMES.rendererRegistry;
  const reportPath = options.report ?? FILENAMES.rendererValidationReport;

  if (!fileExists(manifestPath)) {
    throw new Error(`Renderer manifest not found at ${manifestPath}. Provide --manifest <path>.`);
  }
  if (!fileExists(registryPath)) {
    throw new Error(`Renderer registry not found at ${registryPath}. Provide --registry <path>.`);
  }

  const contractSchemaPath = path.join(process.cwd(), "contracts", "renderer-contract.schema.json");
  const registrySchemaPath = path.join(process.cwd(), "contracts", "renderer-registry.schema.json");

  if (!fileExists(contractSchemaPath)) {
    throw new Error(`Renderer contract schema missing at ${contractSchemaPath}.`);
  }
  if (!fileExists(registrySchemaPath)) {
    throw new Error(`Renderer registry schema missing at ${registrySchemaPath}.`);
  }

  const manifestRaw = await readJsonFile<unknown>(manifestPath);
  const registryRaw = await readJsonFile<unknown>(registryPath);

  const report: RendererValidationReport = await buildRendererValidationReport(manifestRaw, registryRaw, {
    contractSchemaPath,
    registrySchemaPath,
  });

  await writeJsonFile(reportPath, report);

  if (report.status === "failed") {
    console.error(`Renderer validation failed. See ${reportPath}`);
    process.exitCode = 1;
  } else {
    console.log(`Renderer validation passed. Report written to ${reportPath}`);
  }
}
