Project Decision Log

This document records important decisions made for the Battle Cats Guide project.

Its purpose is to preserve project direction, prevent repeated discussions, and ensure that all AI agents follow the same approved decisions.

Decision Status

* PROPOSED: Suggested but not approved.
* APPROVED: Formally accepted.
* SUPERSEDED: Replaced by a newer approved decision.
* REJECTED: Considered but not accepted.

Only approved decisions should be treated as authoritative project direction.

⸻

D-001: Initial Target Audience and Game Region

Status: APPROVED

Decision:

The initial target audience is players of the Taiwan version of The Battle Cats.

Traditional Chinese (Taiwan) is the primary initial website language.

Rationale:

Starting with a clearly defined audience makes initial data validation and content quality easier to manage.

Constraints:

* Do not assume Japanese-version data is identical to Taiwan-version data.
* Preserve regional distinctions in the data architecture.
* Future regional expansion must not require redesigning the core system.

⸻

D-002: Multilingual Architecture

Status: APPROVED

Decision:

The website must support multiple languages at the architectural level from the beginning.

The initial language is Traditional Chinese (Taiwan).

Potential future languages include Japanese, English, and Korean.

Rationale:

Adding internationalization later may require extensive changes to data structures and interfaces.

Constraints:

Language and game-region version must be modeled independently.

⸻

D-003: Player Box as a Core Differentiator

Status: APPROVED

Decision:

The player-owned unit collection (Box) and guide matching system are core product features.

Players should eventually be able to record:

* Owned units.
* Unit forms.
* Levels.
* Plus levels.
* Talents and special upgrades.

The website should use this information to identify relevant strategy guides.

Rationale:

A guide recommendation system based on actual player progression provides more practical value than a conventional collection of unfiltered stage guides.

Constraints:

Do not claim a guide is compatible if its required units or progression levels are missing.

⸻

D-004: Structured Strategy Guide Submissions

Status: APPROVED

Decision:

Strategy guides should use structured records rather than relying exclusively on free-form text.

Relevant fields may include:

* Stage.
* Video link.
* Unit lineup.
* Unit levels and upgrades.
* Talents.
* Combos.
* Cannon configuration.
* Items.
* Execution requirements.
* Verification status.

Rationale:

Structured guide information enables filtering, comparison, and future Box-based recommendations.

The final schema must be validated before implementation.

⸻

D-005: Public Repository and Source Data Restrictions

Status: APPROVED

Decision:

The GitHub repository is public.

Raw third-party game data and derived datasets with unclear redistribution rights must not be uploaded to the public repository.

Rationale:

Project development must respect source ownership and redistribution restrictions.

Constraints:

* Keep restricted source data in an appropriately private location.
* Clarify licensing before public redistribution.
* Do not assume that publicly accessible data is automatically free to redistribute.
* Keep project documentation separate from restricted datasets when necessary.

⸻

D-006: AI Team Responsibilities

Status: APPROVED

Decision:

The planned AI team responsibilities are:

Agent	Responsibility
ChatGPT	Project coordination, architecture planning, task management, and acceptance
Gemini Pro	Frontend implementation, UI development, quality planning, SEO, and operational analysis
Antigravity	Backend, data pipeline, APIs, and system integration
Claude	Independent UI/UX reviews at important milestones
Codex	Code review, testing, debugging, and engineering quality
Manus	Repetitive batch processing and structured data tasks

Constraints:

* One primary owner per task.
* Only one agent edits a given file at a time.
* All agents must follow the same project documentation.
* Independent reviewers provide recommendations but do not automatically override approved decisions.

⸻

D-007: Incremental Development and Data Validation

Status: APPROVED

Decision:

The project must establish a reliable and verifiable data foundation before depending on game data for production website features.

Rationale:

Incorrect game data can undermine databases, calculators, guide matching, and user trust.

Constraints:

* Preserve source provenance.
* Distinguish raw, parsed, and derived data.
* Record anomalies and unresolved uncertainties.
* Require actual test evidence before accepting data-processing results.

⸻

D-008: Technology Selection

Status: PROPOSED

Decision:

The frontend framework, backend framework, database, hosting provider, and deployment architecture have not yet been formally finalized.

Next action:

Evaluate suitable options after reviewing the data pipeline and completing the initial architecture requirements.

Do not treat any proposed technology as approved until a separate decision is recorded.

⸻

D-009: Current Development Phase

Status: APPROVED

Decision:

The project is currently in the project foundation and data pipeline preparation phase.

The next major milestone is reviewing and accepting Task 001 data pipeline deliverables.

Full website feature development should begin after the data foundation, licensing boundaries, and core technical contracts have been reviewed.

⸻

How to Add Future Decisions

Every new decision should follow this structure:

D-XXX: Decision Title

Status: PROPOSED / APPROVED / SUPERSEDED / REJECTED

Date: YYYY-MM-DD

Context:

Why this decision is needed.

Decision:

The selected direction.

Alternatives:

Other options considered.

Rationale:

Why this option was selected.

Consequences:

Expected benefits, limitations, and affected components.

Related Documents:

Links to relevant specifications or architecture documents.

⸻

Fundamental rule: Important decisions must be recorded, and approved decisions must not be silently changed.
