Development Rules

This document defines the development standards for the Battle Cats Guide project.

All AI agents and developers participating in this project must follow these rules. If this document conflicts with an approved project decision or a higher-priority specification, stop the affected work and request clarification instead of choosing one interpretation independently.

1. Core Principles

* Prioritize correctness, maintainability, and verifiability.
* Understand the existing architecture before making changes.
* Prefer the simplest solution that fully satisfies the requirements.
* Do not introduce unnecessary features or speculative complexity.
* Never invent game data, field meanings, version differences, or user requirements.
* Clearly distinguish confirmed facts, assumptions, hypotheses, and unknowns.

2. Pre-Development Requirements

Before starting any development task:

1. Read AGENTS.md.
2. Read docs/PROJECT_OVERVIEW.md.
3. Read all architecture documents and specifications relevant to the task.
4. Inspect the existing code and related functionality.
5. Confirm the task scope, expected outcome, and acceptance criteria.

If essential information is missing, ask for clarification. Do not independently make major design decisions.

3. Code Modification Rules

* Prefer extending existing modules over rewriting entire systems.
* Avoid duplicate implementations of existing functionality.
* Do not arbitrarily change interfaces or data formats used by other modules.
* Keep frontend, backend, API contracts, database schemas, and shared types consistent.
* Obtain approval before making major architectural changes.
* Do not leave undocumented temporary code, test data, or debugging output.
* Never commit passwords, API keys, access tokens, or other secrets.

4. AI Collaboration Rules

* By default, only one AI agent should modify a given file at a time.
* Other agents may review the file but must not edit it concurrently.
* Every task must have a clearly designated owner.
* All deliverables must be integrated into the same project documentation and codebase.
* Do not rely on conversational memory to preserve important project decisions.
* Important specifications, decisions, and progress updates must be recorded in GitHub.
* AI agents must not assume that another agent’s work has been completed or verified without evidence.

5. Testing and Acceptance

After completing a feature or code modification:

1. Run relevant tests.
2. Check for regressions in existing functionality.
3. Test error handling and invalid inputs where applicable.
4. Verify that the actual result meets the acceptance criteria.
5. Document any tests that could not be executed and explain why.

Never claim that a feature works simply because the code appears correct.

Use these test status labels:

* PASS: Actually executed and passed.
* FAIL: Actually executed and failed.
* NOT RUN: Not executed.
* BLOCKED: Could not be executed due to environmental or other limitations.

6. Game Data Integrity

* Never fabricate unit, enemy, stage, or game-stat data.
* Never present inferred information as official data.
* Preserve source attribution, game version, language, and regional information.
* Clearly separate raw source data, parsed data, and derived data.
* Preserve uncertainty when data has not been verified.
* Never automatically treat Japanese-version data as Taiwan-version data.
* A field name containing _tw does not prove that its contents are Traditional Chinese or Taiwan-localized.
* Do not publicly distribute third-party raw or derived data until its licensing and redistribution rights have been clarified.
* Preserve original values whenever parsing or normalization could lose information.

7. Internationalization and Regional Versions

* The architecture must support multiple languages from the beginning.
* Language and game-region version are separate concepts and must not be conflated.
* Traditional Chinese (Taiwan) is the initial primary website language.
* Future support should include Japanese, English, Korean, and other languages without requiring a rewrite of the core system.
* Do not hardcode translatable text into core business logic.
* Data belonging to different regional game versions must be independently identifiable and manageable.
* Never assume that a translation is identical to the official localization.

8. GitHub and Data Security

* GitHub is the primary version-controlled source of truth for project documentation, specifications, code, and decisions.
* Do not place raw source data with unclear redistribution rights in the public repository.
* Never commit private data, credentials, API keys, or other confidential information.
* Do not delete important files or overwrite existing data without authorization.
* Use clear and descriptive commit messages.
* Verify the working directory and target repository before making changes.
* Keep public documentation separate from private source-data storage when necessary.

9. Task Completion Report

Every completed task must include:

1. Task name and completion status.
2. Files created or modified.
3. Features or changes actually implemented.
4. Tests executed and their results.
5. Any changes to architecture, data formats, or API contracts.
6. Unresolved issues.
7. Known risks and limitations.
8. Recommended next steps.

Do not hide incomplete work. Never claim that tests passed if they were not executed.

10. Major Decision Control

Execution agents must not independently decide to:

* Replace the core technical architecture.
* Change the primary frontend or backend framework.
* Significantly redesign the database.
* Change core data formats or API contracts.
* Remove existing features or important data.
* Change data sources or licensing strategies.
* Change the fundamental internationalization or regional-version architecture.

For major decisions, present the proposed solution, alternatives, trade-offs, and impact before implementation.

Wait for approval from the project lead before proceeding.

⸻

Fundamental Rule

Understand before changing. Test after changing. Document before handing off.

Correctness and long-term maintainability take priority over implementation speed.
