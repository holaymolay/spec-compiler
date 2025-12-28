import path from "path";
import Ajv2020 from "ajv/dist/2020";
import { ErrorObject } from "ajv";
import {
  RendererOutputManifest,
  RendererRegistry,
  RendererValidationReport,
  ValidationRuleResult,
} from "../types";
import { readJsonFile } from "./fs";

export interface RendererValidationOptions {
  contractSchemaPath?: string;
  registrySchemaPath?: string;
}

function ruleResult(
  id: string,
  passed: boolean,
  message: string,
  counterexample?: string,
): ValidationRuleResult {
  return { id, passed, message, counterexample };
}

function formatInstancePath(instancePath: string): string {
  if (!instancePath) {
    return "(root)";
  }
  return instancePath.replace(/\//g, ".").replace(/^\./, "");
}

function formatSchemaErrors(errors: ErrorObject[] | null | undefined): string[] {
  if (!errors || errors.length === 0) {
    return [];
  }

  return errors.map((error) => {
    const basePath = formatInstancePath(error.instancePath);
    if (error.keyword === "additionalProperties") {
      const params = error.params as { additionalProperty?: string };
      if (params.additionalProperty) {
        const path = basePath === "(root)" ? params.additionalProperty : `${basePath}.${params.additionalProperty}`;
        return `${path} is not allowed`;
      }
    }
    const message = error.message ? error.message : "is invalid";
    return `${basePath} ${message}`.trim();
  });
}

function defaultContractSchemaPath(): string {
  return path.join(process.cwd(), "contracts", "renderer-contract.schema.json");
}

function defaultRegistrySchemaPath(): string {
  return path.join(process.cwd(), "contracts", "renderer-registry.schema.json");
}

function unknownRenderer(): RendererValidationReport["renderer"] {
  return {
    name: "unknown",
    version: "unknown",
    target: "unknown",
  };
}

export async function buildRendererValidationReport(
  manifestRaw: unknown,
  registryRaw: unknown,
  options: RendererValidationOptions = {},
): Promise<RendererValidationReport> {
  const contractSchemaPath = options.contractSchemaPath ?? defaultContractSchemaPath();
  const registrySchemaPath = options.registrySchemaPath ?? defaultRegistrySchemaPath();

  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const contractSchema = await readJsonFile<Record<string, unknown>>(contractSchemaPath);
  const registrySchema = await readJsonFile<Record<string, unknown>>(registrySchemaPath);

  const contractValidator = ajv.compile(contractSchema);
  const registryValidator = ajv.compile(registrySchema);

  const rules: ValidationRuleResult[] = [];

  const manifestValid = contractValidator(manifestRaw) as boolean;
  const manifestErrors = formatSchemaErrors(contractValidator.errors);
  rules.push(
    ruleResult(
      "renderer-manifest.schema",
      manifestValid,
      manifestValid
        ? "Renderer manifest matches contracts/renderer-contract.schema.json."
        : "Renderer manifest fails contracts/renderer-contract.schema.json validation.",
      manifestValid ? undefined : manifestErrors[0],
    ),
  );

  const registryValid = registryValidator(registryRaw) as boolean;
  const registryErrors = formatSchemaErrors(registryValidator.errors);
  rules.push(
    ruleResult(
      "renderer-registry.schema",
      registryValid,
      registryValid
        ? "Renderer registry matches contracts/renderer-registry.schema.json."
        : "Renderer registry fails contracts/renderer-registry.schema.json validation.",
      registryValid ? undefined : registryErrors[0],
    ),
  );

  if (!manifestValid || !registryValid) {
    const errors = rules.filter((rule) => !rule.passed);
    return {
      status: "failed",
      generated_at: new Date().toISOString(),
      renderer: unknownRenderer(),
      rules,
      errors,
    };
  }

  const manifest = manifestRaw as RendererOutputManifest;
  const registry = registryRaw as RendererRegistry;

  const rendererInfo = {
    name: manifest.renderer.name,
    version: manifest.renderer.version,
    target: manifest.renderer.target,
  };

  const contractDeclared = manifest.renderer.declares_contract === manifest.contract.id;
  rules.push(
    ruleResult(
      "renderer-contract.declared.rule",
      contractDeclared,
      contractDeclared
        ? "Renderer declares the active renderer contract."
        : "Renderer declares a contract that does not match the manifest contract.",
      contractDeclared
        ? undefined
        : `declares_contract=${manifest.renderer.declares_contract}, contract.id=${manifest.contract.id}`,
    ),
  );

  const registeredRenderer = registry.renderers.find(
    (entry) =>
      entry.name === manifest.renderer.name &&
      entry.version === manifest.renderer.version &&
      entry.target === manifest.renderer.target,
  );
  const rendererRegistered = Boolean(registeredRenderer);
  rules.push(
    ruleResult(
      "renderer-registration.rule",
      rendererRegistered,
      rendererRegistered
        ? "Renderer is registered for this target and version."
        : "Renderer is not registered; add it to config/renderer-registry.json.",
      rendererRegistered
        ? undefined
        : `${manifest.renderer.name}@${manifest.renderer.version} target=${manifest.renderer.target}`,
    ),
  );

  const registryContractMatch =
    rendererRegistered && registeredRenderer?.contract_id === manifest.contract.id;
  rules.push(
    ruleResult(
      "renderer-contract.registry.rule",
      registryContractMatch,
      registryContractMatch
        ? "Renderer registry contract matches the manifest contract."
        : "Renderer registry contract does not match the manifest contract.",
      registryContractMatch
        ? undefined
        : registeredRenderer
          ? `registry.contract_id=${registeredRenderer.contract_id}, manifest.contract.id=${manifest.contract.id}`
          : "Renderer entry missing from registry.",
    ),
  );

  const undeclaredTokens = manifest.outputs.token_usage.undeclared;
  const tokenUsageValid = undeclaredTokens.length === 0;
  rules.push(
    ruleResult(
      "token-usage.declared.rule",
      tokenUsageValid,
      tokenUsageValid
        ? "Token usage is fully declared."
        : "Undeclared token usage detected; declare all tokens or remove undeclared usage.",
      tokenUsageValid ? undefined : undeclaredTokens[0],
    ),
  );

  const constitutionViolations = manifest.outputs.constitution.violations;
  const constitutionValid = constitutionViolations.length === 0;
  rules.push(
    ruleResult(
      "constitution-compliance.rule",
      constitutionValid,
      constitutionValid
        ? "No constitution violations reported."
        : "Renderer reports constitution violations; resolve them before compiling.",
      constitutionValid ? undefined : constitutionViolations[0],
    ),
  );

  const determinismMarkers = manifest.outputs.determinism.markers;
  const deterministicFlag = manifest.outputs.determinism.deterministic;
  const determinismValid = deterministicFlag === true && determinismMarkers.length === 0;
  rules.push(
    ruleResult(
      "deterministic-output.rule",
      determinismValid,
      determinismValid
        ? "Renderer output is marked deterministic and free of nondeterminism markers."
        : "Renderer output is marked nondeterministic; remove markers or set deterministic=true.",
      determinismValid
        ? undefined
        : determinismMarkers.length > 0
          ? determinismMarkers[0]
          : "deterministic=false",
    ),
  );

  const errors = rules.filter((rule) => !rule.passed);
  return {
    status: errors.length === 0 ? "passed" : "failed",
    generated_at: new Date().toISOString(),
    renderer: rendererInfo,
    rules,
    errors,
  };
}
