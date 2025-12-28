import path from "path";
import {
  ConsistencyBand,
  DesignIntentTaste,
  RendererOutputManifest,
  TasteReport,
  TasteRuleResult,
  VisualConstitution,
} from "../../types";
import { FILENAMES } from "../../constants";
import { readJsonFile } from "../../utils/fs";

interface TasteRuleMeta {
  id: string;
  description: string;
  clause: string;
  intent_reference: string;
  remediation: string;
}

interface TasteRuleset {
  version: string;
  rules: TasteRuleMeta[];
}

export interface TasteEvaluationOptions {
  rulesetPath?: string;
  failFast?: boolean;
  verbose?: boolean;
}

function defaultRulesetPath(): string {
  return path.join(process.cwd(), FILENAMES.tasteRuleset);
}

async function loadRuleset(rulesetPath?: string): Promise<TasteRuleset> {
  const resolved = rulesetPath ?? defaultRulesetPath();
  return readJsonFile<TasteRuleset>(resolved);
}

function getRuleMeta(id: string, ruleset: TasteRuleset): TasteRuleMeta {
  const found = ruleset.rules.find((rule) => rule.id === id);
  if (found) {
    return found;
  }
  return {
    id,
    description: "Rule metadata not found; update ruleset.",
    clause: "unspecified",
    intent_reference: "unspecified",
    remediation: "Review rule definition.",
  };
}

function buildResult(meta: TasteRuleMeta, passed: boolean, message: string, counterexample?: string): TasteRuleResult {
  return {
    id: meta.id,
    passed,
    message,
    description: meta.description,
    clause: meta.clause,
    intent_reference: meta.intent_reference,
    remediation: meta.remediation,
    counterexample,
  };
}

function checkAllowedValues(band: ConsistencyBand, values: Array<number | string>): string | null {
  const allowedSet = new Set((band.allowed_values || []).map((value) => String(value)));
  const invalid = values.find((value) => !allowedSet.has(String(value)));
  if (invalid === undefined) {
    return null;
  }
  return `${invalid} not in allowed set: ${Array.from(allowedSet).join(", ")}`;
}

function checkVariance(band: ConsistencyBand, values: Array<number | string>): string | null {
  if (band.max_variance === undefined || values.length === 0) {
    return null;
  }

  const maxVariance = band.max_variance;
  if (typeof values[0] === "number") {
    const numericValues = values as number[];
    const max = Math.max(...numericValues);
    const min = Math.min(...numericValues);
    const variance = max - min;
    if (variance > maxVariance) {
      return `variance ${variance} exceeds max_variance ${maxVariance}`;
    }
    return null;
  }

  const uniqueCount = new Set(values.map((value) => String(value))).size;
  if (uniqueCount > 1 && maxVariance === 0) {
    return `multiple values present but max_variance is ${maxVariance}`;
  }
  return null;
}

export async function evaluateTaste(
  manifest: RendererOutputManifest,
  constitution: VisualConstitution,
  intent: DesignIntentTaste,
  options: TasteEvaluationOptions = {},
): Promise<TasteReport> {
  const ruleset = await loadRuleset(options.rulesetPath);
  const results: TasteRuleResult[] = [];
  const failFast = options.failFast ?? true;
  const verbose = options.verbose ?? false;

  const addResult = (result: TasteRuleResult) => {
    results.push(result);
    if (!result.passed && failFast && !verbose) {
      return true;
    }
    return false;
  };

  // Typography: max sizes
  {
    const meta = getRuleMeta("typography.max-sizes.rule", ruleset);
    const sizes = new Set(manifest.taste.typography.roles.map((role) => role.size));
    const allowed = constitution.typography.max_font_sizes;
    const passed = sizes.size <= allowed;
    const message = passed
      ? "Typography size count within allowed maximum."
      : `Used ${sizes.size} font sizes; allowed maximum is ${allowed}.`;
    const shouldStop = addResult(buildResult(meta, passed, message, passed ? undefined : message));
    if (shouldStop) {
      return {
        status: "failed",
        generated_at: new Date().toISOString(),
        renderer: {
          name: manifest.renderer.name,
          version: manifest.renderer.version,
          target: manifest.renderer.target,
        },
        ruleset_version: ruleset.version,
        rules: results,
        errors: results.filter((rule) => !rule.passed),
      };
    }
  }

  // Typography hierarchy and ranges
  {
    const meta = getRuleMeta("typography.hierarchy.rule", ruleset);
    const roleDefs = constitution.typography.roles;
    const hierarchy = constitution.typography.hierarchy;
    const declaredRoles = manifest.taste.typography.roles;

    let passed = true;
    let counterexample: string | undefined;

    for (const role of declaredRoles) {
      const def = roleDefs.find((entry) => entry.name === role.role);
      if (!def) {
        passed = false;
        counterexample = `Role '${role.role}' is not defined in constitution.`;
        break;
      }
      if (role.size < def.min || role.size > def.max) {
        passed = false;
        counterexample = `Role '${role.role}' size ${role.size} outside ${def.min}-${def.max}.`;
        break;
      }
    }

    if (passed && hierarchy.length > 1) {
      const sizeByRole = new Map<string, number>();
      hierarchy.forEach((roleName) => {
        const declared = declaredRoles.find((entry) => entry.role === roleName);
        if (declared) {
          sizeByRole.set(roleName, declared.size);
        }
      });

      for (let i = 0; i < hierarchy.length - 1; i += 1) {
        const current = sizeByRole.get(hierarchy[i]);
        const next = sizeByRole.get(hierarchy[i + 1]);
        if (current !== undefined && next !== undefined && current < next) {
          passed = false;
          counterexample = `${hierarchy[i]} (${current}) should not be smaller than ${hierarchy[i + 1]} (${next}).`;
          break;
        }
      }
    }

    const message = passed
      ? "Typography roles satisfy hierarchy ranges."
      : counterexample || "Typography hierarchy violated.";
    const shouldStop = addResult(buildResult(meta, passed, message, passed ? undefined : message));
    if (shouldStop) {
      return {
        status: "failed",
        generated_at: new Date().toISOString(),
        renderer: {
          name: manifest.renderer.name,
          version: manifest.renderer.version,
          target: manifest.renderer.target,
        },
        ruleset_version: ruleset.version,
        rules: results,
        errors: results.filter((rule) => !rule.passed),
      };
    }
  }

  // Spacing allowed values
  {
    const meta = getRuleMeta("spacing.allowed-values.rule", ruleset);
    const allowed = new Set(constitution.spacing.allowed_values);
    const invalid = manifest.taste.spacing.values.find((value) => !allowed.has(value));
    const passed = invalid === undefined;
    const message = passed
      ? "Spacing values are enumerated in the constitution."
      : `Spacing value ${invalid} not allowed.`;
    const shouldStop = addResult(buildResult(meta, passed, message, passed ? undefined : message));
    if (shouldStop) {
      return {
        status: "failed",
        generated_at: new Date().toISOString(),
        renderer: {
          name: manifest.renderer.name,
          version: manifest.renderer.version,
          target: manifest.renderer.target,
        },
        ruleset_version: ruleset.version,
        rules: results,
        errors: results.filter((rule) => !rule.passed),
      };
    }
  }

  // Spacing variance
  {
    const meta = getRuleMeta("spacing.variance.rule", ruleset);
    const values = manifest.taste.spacing.values;
    const variance = values.length > 0 ? Math.max(...values) - Math.min(...values) : 0;
    const allowedVariance = constitution.spacing.max_variance;
    const passed = variance <= allowedVariance;
    const message = passed
      ? "Spacing variance within allowed range."
      : `Spacing variance ${variance} exceeds allowed ${allowedVariance}.`;
    const shouldStop = addResult(buildResult(meta, passed, message, passed ? undefined : message));
    if (shouldStop) {
      return {
        status: "failed",
        generated_at: new Date().toISOString(),
        renderer: {
          name: manifest.renderer.name,
          version: manifest.renderer.version,
          target: manifest.renderer.target,
        },
        ruleset_version: ruleset.version,
        rules: results,
        errors: results.filter((rule) => !rule.passed),
      };
    }
  }

  // Color allowed tokens
  {
    const meta = getRuleMeta("color.allowed.rule", ruleset);
    const allowed = new Set(constitution.color.allowed_tokens);
    const invalid = manifest.taste.color.tokens.find((token) => !allowed.has(token));
    const passed = invalid === undefined;
    const message = passed
      ? "All colors mapped to allowed tokens."
      : `Color token '${invalid}' is not allowed.`;
    const shouldStop = addResult(buildResult(meta, passed, message, passed ? undefined : message));
    if (shouldStop) {
      return {
        status: "failed",
        generated_at: new Date().toISOString(),
        renderer: {
          name: manifest.renderer.name,
          version: manifest.renderer.version,
          target: manifest.renderer.target,
        },
        ruleset_version: ruleset.version,
        rules: results,
        errors: results.filter((rule) => !rule.passed),
      };
    }
  }

  // Color contrast floor
  {
    const meta = getRuleMeta("color.contrast.rule", ruleset);
    const floor = constitution.color.contrast_floor;
    const failing = manifest.taste.color.contrast.find((entry) => entry.ratio < floor);
    const passed = !failing;
    const message = passed
      ? "All contrast ratios meet the floor."
      : `Contrast ratio ${failing?.ratio} for ${failing?.pair} below floor ${floor}.`;
    const shouldStop = addResult(buildResult(meta, passed, message, passed ? undefined : message));
    if (shouldStop) {
      return {
        status: "failed",
        generated_at: new Date().toISOString(),
        renderer: {
          name: manifest.renderer.name,
          version: manifest.renderer.version,
          target: manifest.renderer.target,
        },
        ruleset_version: ruleset.version,
        rules: results,
        errors: results.filter((rule) => !rule.passed),
      };
    }
  }

  // Density limit (intent)
  {
    const meta = getRuleMeta("density.limit.rule", ruleset);
    const intentLimit = intent.density?.max_interactions_per_view;
    if (intentLimit === undefined || intentLimit === null) {
      const message = "Design intent missing density limit.";
      const shouldStop = addResult(buildResult(meta, false, message, message));
      if (shouldStop) {
        return {
          status: "failed",
          generated_at: new Date().toISOString(),
          renderer: {
            name: manifest.renderer.name,
            version: manifest.renderer.version,
            target: manifest.renderer.target,
          },
          ruleset_version: ruleset.version,
          rules: results,
          errors: results.filter((rule) => !rule.passed),
        };
      }
    } else {
      const actual = manifest.taste.density.interactions_per_view;
      const passed = actual <= intentLimit;
      const message = passed
        ? "Interaction density within intent limits."
        : `Interactions per view ${actual} exceeds intent limit ${intentLimit}.`;
      const shouldStop = addResult(buildResult(meta, passed, message, passed ? undefined : message));
      if (shouldStop) {
        return {
          status: "failed",
          generated_at: new Date().toISOString(),
          renderer: {
            name: manifest.renderer.name,
            version: manifest.renderer.version,
            target: manifest.renderer.target,
          },
          ruleset_version: ruleset.version,
          rules: results,
          errors: results.filter((rule) => !rule.passed),
        };
      }
    }
  }

  // Consistency allowed values
  {
    const meta = getRuleMeta("consistency.allowed.rule", ruleset);
    const consistency = manifest.taste.consistency;
    const constitutionConsistency = constitution.consistency;

    const radiusError = checkAllowedValues(constitutionConsistency.radius, consistency.radius);
    const elevationError = checkAllowedValues(constitutionConsistency.elevation, consistency.elevation);
    const motionError = checkAllowedValues(constitutionConsistency.motion, consistency.motion);
    const firstError = radiusError || elevationError || motionError;
    const passed = !firstError;
    const message = passed ? "Consistency values align with allowed sets." : firstError!;
    const shouldStop = addResult(buildResult(meta, passed, message, passed ? undefined : message));
    if (shouldStop) {
      return {
        status: "failed",
        generated_at: new Date().toISOString(),
        renderer: {
          name: manifest.renderer.name,
          version: manifest.renderer.version,
          target: manifest.renderer.target,
        },
        ruleset_version: ruleset.version,
        rules: results,
        errors: results.filter((rule) => !rule.passed),
      };
    }
  }

  // Consistency variance
  {
    const meta = getRuleMeta("consistency.variance.rule", ruleset);
    const consistency = manifest.taste.consistency;
    const constitutionConsistency = constitution.consistency;

    const radiusVariance = checkVariance(constitutionConsistency.radius, consistency.radius);
    const elevationVariance = checkVariance(constitutionConsistency.elevation, consistency.elevation);
    const motionVariance = checkVariance(constitutionConsistency.motion, consistency.motion);
    const firstError = radiusVariance || elevationVariance || motionVariance;
    const passed = !firstError;
    const message = passed ? "Consistency variance within limits." : firstError!;
    const shouldStop = addResult(buildResult(meta, passed, message, passed ? undefined : message));
    if (shouldStop) {
      return {
        status: "failed",
        generated_at: new Date().toISOString(),
        renderer: {
          name: manifest.renderer.name,
          version: manifest.renderer.version,
          target: manifest.renderer.target,
        },
        ruleset_version: ruleset.version,
        rules: results,
        errors: results.filter((rule) => !rule.passed),
      };
    }
  }

  // Patterns vs intent and constitution
  {
    const meta = getRuleMeta("patterns.intent.rule", ruleset);
    const usage = manifest.taste.patterns.usage;
    const allowedPatterns = new Set(constitution.patterns?.allowed ?? []);

    let passed = true;
    let counterexample: string | undefined;

    for (const entry of usage) {
      if (!constitution.patterns) {
        passed = false;
        counterexample = "Constitution patterns not provided; cannot authorize usage.";
        break;
      }
      if (!allowedPatterns.has(entry.pattern)) {
        passed = false;
        counterexample = `Pattern '${entry.pattern}' is not allowed by constitution.`;
        break;
      }
      const allowedIntents = intent.allowed_patterns?.[entry.pattern] ?? constitution.patterns.intents?.[entry.pattern] ?? [];
      if (!allowedIntents.includes(entry.intent)) {
        passed = false;
        counterexample = `Pattern '${entry.pattern}' not permitted for intent '${entry.intent}'. Allowed: ${allowedIntents.join(", ")}`;
        break;
      }
    }

    const message = passed ? "Pattern usage aligns with intent and constitution." : counterexample || "Pattern usage violation.";
    addResult(buildResult(meta, passed, message, passed ? undefined : message));
  }

  const errors = results.filter((rule) => !rule.passed);
  return {
    status: errors.length === 0 ? "passed" : "failed",
    generated_at: new Date().toISOString(),
    renderer: {
      name: manifest.renderer.name,
      version: manifest.renderer.version,
      target: manifest.renderer.target,
    },
    ruleset_version: ruleset.version,
    rules: results,
    errors,
  };
}
