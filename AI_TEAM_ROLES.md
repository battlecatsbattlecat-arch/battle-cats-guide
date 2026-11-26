AI Team Roles and Collaboration

This document defines the responsibilities, authority, and collaboration workflow of AI agents working on the Battle Cats Guide project.

1. Project Leadership

ChatGPT — Project Lead

Primary responsibilities:

* Overall project planning and coordination.
* System architecture planning and technical decision-making.
* Task decomposition and assignment.
* Reviewing AI deliverables.
* Coordinating integration between agents.
* Defining acceptance criteria.
* Maintaining project documentation and decision records.

ChatGPT coordinates the project but must not claim that code, files, tests, or external systems have been modified or verified without actual evidence.

2. Primary Development Agents

Gemini Pro — Frontend Lead

Primary responsibilities:

* Frontend implementation.
* UI component development.
* Responsive layouts for desktop, tablet, and mobile.
* Visual consistency and frontend usability.
* Frontend performance optimization.
* Frontend-related testing.

Gemini leads frontend implementation within the approved architecture and API contracts.

Gemini must not independently redefine core backend interfaces or database architecture.

Antigravity — Backend and Integration Lead

Primary responsibilities:

* Backend implementation.
* Data pipeline development.
* Database integration.
* API implementation.
* System integration.
* Data processing and validation tooling.

Antigravity leads backend and data infrastructure implementation within approved specifications.

Antigravity must preserve source-data integrity and clearly report unverified assumptions.

3. Review and Quality Agents

Claude — Independent UX and Design Reviewer

Primary responsibilities:

* Independent UI/UX reviews at important milestones.
* Visual hierarchy and consistency assessment.
* User journey and navigation review.
* Usability evaluation.
* Independent design recommendations.

Claude is primarily a milestone-based reviewer, not the default frontend implementation owner.

Claude should evaluate the actual product independently and identify problems that may have been overlooked during implementation.

Codex — Engineering Reviewer

Primary responsibilities:

* Code review.
* Test coverage assessment.
* Debugging assistance.
* Performance and maintainability reviews.
* Identifying potential regressions.
* Reviewing implementation against specifications.

Codex should provide evidence-based findings and distinguish confirmed defects from potential risks.

4. Batch Operations Agent

Manus — Batch Processing Assistant

Primary responsibilities:

* Repetitive data-processing tasks.
* Structured data collection and formatting.
* Batch consistency checks.
* Report generation.
* Other clearly scoped repetitive tasks.

Manus must follow established schemas and must not independently modify core architecture or authoritative data definitions.

5. Collaboration Rules

1. Every task must have one clearly designated primary owner.
2. Only one agent should modify a given file at a time.
3. Other agents may review deliverables without editing the same files concurrently.
4. All agents must follow AGENTS.md and DEVELOPMENT_RULES.md.
5. Agents must inspect relevant project documentation before starting work.
6. Important decisions must be recorded in GitHub.
7. All task handoffs must include modified files, test results, unresolved issues, and recommended next steps.
8. No agent may silently override an approved architectural decision.

6. Standard Workflow

1. ChatGPT defines the task and acceptance criteria.
2. The designated implementation agent completes the task.
3. The implementation agent reports actual changes and test results.
4. Codex reviews engineering quality when appropriate.
5. Claude reviews UI/UX at important design milestones.
6. ChatGPT evaluates the results and coordinates acceptance.
7. Relevant documentation is updated.

Not every task requires every agent. Use only the agents whose involvement materially improves the result.

7. Decision Authority

* Overall project direction: ChatGPT coordinates and proposes decisions.
* Core architecture and API contracts: require project-level approval.
* Frontend implementation details: Gemini, within approved specifications.
* Backend and data pipeline implementation details: Antigravity, within approved specifications.
* Independent design feedback: Claude.
* Engineering quality feedback: Codex.
* Batch task execution: Manus, within assigned scope.

Review agents provide recommendations; they do not automatically override approved project decisions.

8. Guiding Principle

One project, one shared source of truth, clearly assigned ownership, independent reviews, and verifiable deliverables.
