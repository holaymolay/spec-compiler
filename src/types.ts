export interface IntentRaw {
  user_goal: string;
  context: string;
  stated_constraints: string[];
  unstated_assumptions: string[];
  uncertainties: string[];
  out_of_scope: string[];
}

export interface IntentFile {
  intent: IntentRaw;
}

export type QuestionType = "binary" | "multiple-choice";

export interface ClarificationQuestion {
  id: string;
  prompt: string;
  type: QuestionType;
  options: string[];
  allowMultiple?: boolean;
  answer?: string | string[] | null;
  blocking: boolean;
  issue: string;
}

export interface ClarificationState {
  status: "pending" | "ready";
  generated_at: string;
  questions: ClarificationQuestion[];
  notes?: string[];
}

export interface RequirementValidation {
  tests: string[];
  acceptance_criteria: string[];
}

export interface Requirement {
  id: string;
  description: string;
  owner?: string;
  validation: RequirementValidation;
}

export interface ClarificationResponses {
  metadata: {
    spec_id: string;
    concept_id: string;
    synchronizations: string[];
    pdca_phase?: string;
  };
  intent: IntentRaw;
  decisions: {
    data_ownership: string;
    implicit_behaviors?: string[];
  };
  requirements: Requirement[];
  security: {
    defaults_applied: boolean;
    additional_constraints: string[];
  };
}

export interface ValidationRuleResult {
  id: string;
  passed: boolean;
  message: string;
  counterexample?: string;
}

export interface ValidationReport {
  status: "passed" | "failed";
  generated_at: string;
  rules: ValidationRuleResult[];
  errors: ValidationRuleResult[];
}

export interface FrameworkConcept {
  id: string;
  name: string;
  description?: string;
}

export interface FrameworkSynchronization {
  id: string;
  description?: string;
}

export interface FrameworkConfig {
  concepts: FrameworkConcept[];
  synchronizations: FrameworkSynchronization[];
  security_defaults: string[];
  allowed_paths: string[];
  disallowed_actions: string[];
}

export interface RendererContract {
  id: string;
  version: string;
}

export interface RendererReference {
  id: string;
  version: string;
  checksum?: string;
}

export interface RendererImmutableReference {
  id: string;
  version: string;
  checksum: string;
}

export interface RendererMetadata {
  name: string;
  version: string;
  target: string;
  declares_contract: string;
}

export interface RendererArtifact {
  format: string;
  uri: string;
  checksum?: string;
}

export interface RendererTokenUsage {
  declared: string[];
  undeclared: string[];
}

export interface RendererPatternUsage {
  declared: string[];
}

export interface RendererDeterminism {
  deterministic: boolean;
  markers: string[];
}

export interface RendererTasteTypographyRole {
  role: string;
  size: number;
}

export interface RendererTasteTypography {
  roles: RendererTasteTypographyRole[];
}

export interface RendererTasteSpacing {
  values: number[];
}

export interface RendererTasteColorContrast {
  pair: string;
  ratio: number;
}

export interface RendererTasteColor {
  tokens: string[];
  contrast: RendererTasteColorContrast[];
}

export interface RendererTasteDensity {
  interactions_per_view: number;
}

export interface RendererTasteConsistency {
  radius: number[];
  elevation: number[];
  motion: string[];
}

export interface RendererTastePatternUsage {
  pattern: string;
  intent: string;
}

export interface RendererTastePatterns {
  usage: RendererTastePatternUsage[];
}

export interface RendererTaste {
  typography: RendererTasteTypography;
  spacing: RendererTasteSpacing;
  color: RendererTasteColor;
  density: RendererTasteDensity;
  consistency: RendererTasteConsistency;
  patterns: RendererTastePatterns;
}

export interface RendererOutputManifest {
  contract: RendererContract;
  renderer: RendererMetadata;
  inputs: {
    design_intent: RendererImmutableReference;
    visual_constitution: RendererReference;
    pattern_registries?: RendererReference[];
  };
  outputs: {
    artifact: RendererArtifact;
    token_usage: RendererTokenUsage;
    pattern_usage: RendererPatternUsage;
    constitution: {
      violations: string[];
    };
    determinism: RendererDeterminism;
  };
  taste: RendererTaste;
  generated_at?: string;
  notes?: string[];
}

export interface RendererRegistryEntry {
  name: string;
  version: string;
  target: string;
  contract_id: string;
}

export interface RendererRegistry {
  registry_version: string;
  renderers: RendererRegistryEntry[];
}

export interface RendererValidationReport {
  status: "passed" | "failed";
  generated_at: string;
  renderer: {
    name: string;
    version: string;
    target: string;
  };
  rules: ValidationRuleResult[];
  errors: ValidationRuleResult[];
}

export interface TypographyConstitution {
  max_font_sizes: number;
  roles: {
    name: string;
    min: number;
    max: number;
  }[];
  hierarchy: string[];
}

export interface SpacingConstitution {
  allowed_values: number[];
  max_variance: number;
}

export interface ColorConstitution {
  allowed_tokens: string[];
  contrast_floor: number;
}

export interface DensityConstitution {
  max_interactions_per_view: number;
}

export interface ConsistencyBand {
  allowed_values: number[] | string[];
  max_variance?: number;
}

export interface PatternsConstitution {
  allowed: string[];
  intents?: Record<string, string[]>;
}

export interface VisualConstitution {
  id: string;
  version: string;
  typography: TypographyConstitution;
  spacing: SpacingConstitution;
  color: ColorConstitution;
  density: DensityConstitution;
  consistency: {
    radius: ConsistencyBand;
    elevation: ConsistencyBand;
    motion: ConsistencyBand;
  };
  patterns?: PatternsConstitution;
}

export interface DesignIntentTaste {
  id: string;
  version: string;
  density: {
    max_interactions_per_view: number;
  };
  allowed_patterns?: Record<string, string[]>;
}

export interface TasteRuleResult {
  id: string;
  passed: boolean;
  message: string;
  description: string;
  clause: string;
  intent_reference: string;
  remediation: string;
  counterexample?: string;
}

export interface TasteReport {
  status: "passed" | "failed";
  generated_at: string;
  renderer: {
    name: string;
    version: string;
    target: string;
  };
  ruleset_version: string;
  rules: TasteRuleResult[];
  errors: TasteRuleResult[];
}
