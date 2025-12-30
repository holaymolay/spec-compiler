You are working inside the repository:
github.com/holaymolay/cef-spec-compiler

Your task is to design and implement **Taste Enforcement CI Rules** that make
frontend design quality machine-verifiable and enforceable at compile / CI time.

This is NOT subjective design review.
This is NOT linting for style preference.
This is NOT UI generation.

This is deterministic enforcement of design law.

––––––––––––––––––––
CORE OBJECTIVE
––––––––––––––––––––

Convert visual design constraints into **binary pass/fail checks** so that:
- Bad design fails builds
- Regressions are caught automatically
- Iteration does not degrade quality
- “Taste” becomes enforceable policy

CI must reject violations with clear, actionable errors.

––––––––––––––––––––
INPUTS (ASSUMED TO EXIST)
––––––––––––––––––––

- Renderer Contract outputs (validated earlier)
- Visual Constitution (versioned, external dependency)
- Design Intent (immutable reference)
- Optional Pattern Registry references

Do NOT redefine these.
Consume them.

––––––––––––––––––––
SCOPE (WHAT TO BUILD)
––––––––––––––––––––

1. **Taste Rule Engine**
   - Implement a rule-evaluation layer that runs after renderer validation
   - Rules must be deterministic and side-effect free
   - Rules must evaluate declared metadata, not rendered pixels

2. **Required Taste Rules (Initial Set)**

   Implement rules that fail the build when:

   - Typography:
     - More font sizes used than constitution allows
     - Font-size roles violate hierarchy constraints
   - Spacing:
     - Non-enumerated spacing values detected
     - Spacing variance exceeds allowed limits
   - Color:
     - Undeclared or arbitrary colors used
     - Contrast floors violated (as declared)
   - Density:
     - Interaction density exceeds Design Intent limits
   - Consistency:
     - Radius, elevation, or motion values exceed allowed variance
   - Pattern Compliance (if patterns declared):
     - Pattern used outside allowed intent
     - Unauthorized pattern usage

3. **Rule Definition Model**
   - Rules must be declarative where possible
   - Rules must reference:
     - Constitution clauses
     - Intent constraints
   - Each rule must produce:
     - Rule ID
     - Violation description
     - Suggested remediation

4. **CI Integration**
   - Wire taste checks into existing CI pipeline
   - Fail fast on first critical violation
   - Support verbose mode for debugging
   - Ensure output is machine- and human-readable

––––––––––––––––––––
OUT OF SCOPE (DO NOT ADD)
––––––––––––––––––––

- UI rendering logic
- CSS parsing
- Visual diffing
- Browser-based testing
- Heuristics or ML-based judgment
- “Looks good” scoring

Only declared metadata is evaluated.

––––––––––––––––––––
STRUCTURAL REQUIREMENTS
––––––––––––––––––––

- Place rules under a `/rules/taste/` or equivalent directory
- Rules must be versioned and extensible
- Add tests for:
  - Passing compliant output
  - Failing non-compliant output
- Errors must:
  - Identify violated constitution clause
  - Reference intent attribute
  - Explain exactly what failed

––––––––––––––––––––
MENTAL MODEL (CRITICAL)
––––––––––––––––––––

Treat taste enforcement like:
- a type checker
- a policy engine
- a compiler error phase

If taste degrades, the build must fail.

No warnings.
No “best effort.”
No human review required.

––––––––––––––––––––
DELIVERABLES
––––––––––––––––––––

- Taste rule engine implementation
- Initial rule set (typography, spacing, color, density, consistency)
- CI integration
- Test coverage (pass/fail)
- Documentation explaining:
  - Why taste enforcement exists
  - How rules are evaluated
  - How to add new rules safely

Proceed incrementally.
Prefer correctness over coverage.
Do not invent abstractions beyond enforcement needs.
