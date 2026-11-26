Current Task and Project Status

Last updated: 2026-11-26

1. Current Project Phase

Phase: Project Foundation and Data Pipeline Preparation

The project is currently preparing its documentation, development workflow, and data pipeline.

Formal website implementation has not started.

Do not begin large-scale feature development until the existing data pipeline and its validation status have been reviewed.

2. Project Repository

Public GitHub repository:

https://github.com/battlecatsbattlecat-arch/battle-cats-guide

This repository is the primary source of truth for approved project documentation, specifications, code, and decisions.

Important restriction:

The repository is public. Do not upload raw third-party game data or derived datasets with unclear redistribution rights.

Private source data must remain in an appropriately restricted location until its licensing and redistribution permissions are clarified.

3. Project Documentation

The following foundational documents have been created or are being maintained:

* AGENTS.md — General instructions for AI agents.
* README.md — Project introduction.
* AI_TEAM_ROLES.md — AI responsibilities and collaboration rules.
* ARCHITECTURE.md — Overall system architecture planning.
* DEVELOPMENT_RULES.md — Development standards and quality requirements.
* CURRENT_TASK.md — Current project status and task handoff.
* docs/PROJECT_OVERVIEW.md — Project goals and scope.
* reports/README.md — Report directory documentation.
* data-pipeline/README.md — Data pipeline documentation.

Do not assume that a document is complete merely because it exists. Read its actual contents before relying on it.

4. AI Team Responsibilities

The current planned division of responsibilities is:

Agent	Primary Responsibility
ChatGPT	Project management, architecture decisions, task planning, integration, and acceptance
Gemini Pro	Frontend implementation, UI development, quality planning, SEO, and operational analysis
Antigravity	Backend implementation, data pipeline, APIs, and system integration
Claude	Independent UI/UX reviews and milestone-based design assessments
Codex	Code review, testing, debugging, and engineering quality
Manus	Repetitive batch processing, structured data tasks, and report generation

Only one agent should modify a given file at a time.

Claude should primarily participate at important review milestones rather than continuously duplicating frontend implementation work.

5. Current Priority: Task 001 Data Pipeline Review

An earlier data pipeline task was performed in the Antigravity environment.

Reported local project directory:

C:\Users\user\.gemini\antigravity\scratch\battlecatsinfo\

The reported project contains:

* Raw source files.
* Parsing scripts.
* Parsed sample data.
* Validation scripts.
* Data dictionaries.
* Source audit reports.
* Regional difference reports.
* Growth formula research.

The reported source snapshot:

* Upstream repository: battlecatsinfo/battlecatsinfo.github.io
* Commit: 9441997393ebe2bd7fb2e9b19a97eed7d7b4a3ee
* Reported download date: 2026-11-24

These details are historical task information and have not been independently re-verified in this document.

Important pending verification

The latest discussed specification was version v2.3.7.

A proposed v2.3.8 revision was intended to address:

1. Explicit representation of blank physical lines.
2. Physical line numbers for every row type.
3. Byte-level LF splitting before strict UTF-8 decoding.
4. Precise CRLF, LF, bare CR, BOM, and EOF handling.
5. Verification of exclusive directory creation semantics.

The existence and completion status of v2.3.8 are currently unconfirmed.

Do not assume that v2.3.8 has been implemented, tested, or saved locally.

Next actions after Antigravity returns its output

1. Obtain the complete Task 001 output.
2. Confirm the actual specification version.
3. Inspect the complete source manifest and source integrity checks.
4. Review parsing scripts and their actual execution results.
5. Verify validation coverage and unresolved anomalies.
6. Identify any remaining blocking issues.
7. Decide whether Task 001 is ready for acceptance.
8. Record the accepted results and next steps in GitHub.

Do not claim successful validation without actual test evidence.

6. Website Development Is Not Yet Authorized

The following are planned website capabilities, not completed features:

* Unit and enemy databases.
* Stage database and stage guides.
* Video-based strategy guides.
* Player-owned unit collection (Box).
* Guide matching based on player-owned units and upgrade levels.
* Unit statistics and damage calculators.
* Structured guide submissions.
* Guide verification and feedback.
* Multilingual support.
* Separate game-region data management.

Do not begin implementing these features based on assumptions about unverified game data or unfinished architecture.

7. Immediate Next Steps

The current sequence is:

1. Complete the foundational project documentation.
2. Wait for and review Antigravity’s Task 001 deliverables.
3. Resolve data integrity, parsing, and licensing issues.
4. Finalize the core data model and system architecture.
5. Define frontend/backend API contracts.
6. Begin website implementation.
7. Conduct milestone-based independent reviews and testing.

8. Handoff Instructions for AI Agents

Before accepting a new task:

* Read AGENTS.md.
* Read AI_TEAM_ROLES.md.
* Read DEVELOPMENT_RULES.md.
* Read ARCHITECTURE.md when relevant.
* Read this file to understand the current project status.
* Inspect the actual files before assuming previous work is complete.

When a task changes the project status, update this document.

Do not overwrite another agent’s unfinished work.

Do not silently change project priorities or approved architectural decisions.

When information is missing, report the uncertainty and ask for clarification.

⸻

Current priority: Establish a reliable and verifiable data foundation before starting full website development.
