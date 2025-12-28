export const DIRECTORIES = {
  intent: "intent",
  clarification: "clarification",
  specs: "specs",
  validation: "validation",
  synthesis: "synthesis",
  config: "config",
  renderers: "renderers",
  rules: "rules",
} as const;

export const FILENAMES = {
  intentRaw: `${DIRECTORIES.intent}/intent.raw.yaml`,
  clarificationQuestions: `${DIRECTORIES.clarification}/questions.yaml`,
  clarificationResponses: `${DIRECTORIES.clarification}/responses.yaml`,
  validationReport: `${DIRECTORIES.validation}/report.json`,
  rendererValidationReport: `${DIRECTORIES.validation}/renderer-report.json`,
  tasteReport: `${DIRECTORIES.validation}/taste-report.json`,
  synthesisPrompt: `${DIRECTORIES.synthesis}/codex.prompt.md`,
  config: `${DIRECTORIES.config}/framework.yaml`,
  rendererManifest: `${DIRECTORIES.renderers}/manifest.json`,
  rendererRegistry: `${DIRECTORIES.config}/renderer-registry.json`,
  visualConstitution: `${DIRECTORIES.config}/visual-constitution.json`,
  designIntent: `${DIRECTORIES.config}/design-intent.json`,
  tasteRuleset: `${DIRECTORIES.rules}/taste/ruleset.json`,
} as const;

export const DEFAULT_PDCA_PHASE = "Plan";
export const DEFAULT_SPEC_TEMPLATE_VERSION = "v1";
