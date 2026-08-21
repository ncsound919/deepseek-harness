---
name: science-reproducible-pipeline
description: Use when building multi-step computational pipelines, statistical regressions, or data transformations to ensure deterministic output, unit safety, and full trajectory auditability.
---

# Reproducible Scientific Computation Skill

Guarantees dimensional safety, statistical verification, and execution reproducibility across agent turns.

## Protocol

1. **Dimensional Analysis & Unit Validation**:
   - Before executing formulas, explicitly verify unit consistency.
   - Use `convert_unit` to normalize all inputs into canonical SI base units before computation.
   - Retrieve physical constants using `lookup_physical_constant` rather than hardcoding values.

2. **Verifiable Compute Execution**:
   - For summary metrics and data sanity checks, execute `stats_summary`.
   - For trend analysis or experimental fitting, execute `stats_linear_regression`.
   - In Code Mode, write self-contained TypeScript scripts that import `@deepseek-ai/dsh-skill-science` tools to execute multi-step calculations in one turn.

3. **Reproducibility Audit**:
   - DeepSeek Harness logs every tool invocation in the append-only session log.
   - Clearly state input data arrays, calculated parameters, and output metrics in the final summary response.
