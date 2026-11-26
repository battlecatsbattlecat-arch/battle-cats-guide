System Architecture

This document describes the planned system architecture of the Battle Cats Guide project.

It establishes architectural principles and system boundaries. It does not authorize agents to select or implement unapproved technologies.

All technology choices must be evaluated against project requirements before implementation.

1. Project Overview

Battle Cats Guide is a data-driven website designed to provide:

* Unit and enemy databases.
* Stage information and strategy guides.
* Video-based strategy demonstrations.
* Player-owned unit collection management (Box).
* Strategy recommendations based on player collections.
* Game-stat calculators.
* Community guide submissions and verification.
* Multilingual content and regional game-version support.

The primary initial audience is players using the Taiwan version of The Battle Cats.

2. High-Level System Structure

The planned system consists of the following logical layers:

Frontend

Responsible for:

* Website pages and navigation.
* User interface and responsive layouts.
* Unit, enemy, and stage browsing.
* Search and filtering.
* Player Box management.
* Strategy guide discovery and display.
* User interactions and account-related interfaces.

Gemini leads frontend implementation.

Backend

Responsible for:

* Business logic.
* User accounts and permissions.
* Box data management.
* Guide submissions and verification.
* Search and recommendation services.
* API endpoints.
* Data access and validation.

Antigravity leads backend implementation.

Data Layer

Responsible for:

* Unit and form records.
* Enemy records.
* Stage and stage-enemy relationships.
* Game-version-specific data.
* Localized text.
* Strategy guide records.
* User-owned unit records.
* Data source attribution and provenance.

Raw source data, parsed data, and derived data must remain distinguishable.

External Services

Potential integrations include:

* Video hosting platforms.
* Analytics services.
* Search engine tools.
* Authentication providers.
* Advertising services.

These integrations are optional and must be evaluated before adoption.

3. Core Data Domains

The system should organize its data around the following domains.

Units and Forms

A unit may have multiple forms.

The architecture must distinguish:

* Unit identity.
* Individual form identity.
* Form-specific statistics.
* Form-specific names and descriptions.
* Upgrade and progression information.

Do not assume that one unit always corresponds to one form.

Enemies

Enemy records should support:

* Enemy identity.
* Localized names.
* Statistics and abilities.
* Source attribution.
* Game-version differences.

Stages

Stage records should support:

* Stage identity.
* Stage names and descriptions.
* Stage grouping and progression.
* Stage-specific enemy appearances.
* Stage conditions and rewards.
* Regional and version differences.

Strategy Guides

A guide should support structured information such as:

* Associated stage.
* Video or demonstration link.
* Unit lineup.
* Unit forms and levels.
* Plus levels.
* Talents and special upgrades.
* Combos.
* Cannon configuration.
* Items.
* Required operations and timing.
* Author information.
* Verification status.

A guide must be distinguishable from the stage itself. Multiple guides may exist for the same stage.

Player Box

The Box system is a major differentiating feature.

It should support:

* Owned units.
* Unit forms.
* Levels.
* Plus levels.
* Talents and special upgrades.
* Relevant progression information.

The system should eventually use this information to identify guides that match a player’s available units and progression.

The Box should not assume that every player owns every unit or has identical upgrade levels.

4. Guide Matching and Recommendation

The recommendation system should consider:

* Whether the player owns the required units.
* Unit levels and upgrade levels.
* Required talents and special upgrades.
* Required combos.
* Required items and equipment.
* Guide difficulty and execution requirements.

Recommendations should distinguish between:

* Fully compatible guides.
* Guides requiring minor progression differences.
* Guides requiring units the player does not own.
* Guides with unknown or incomplete requirements.

Do not present a guide as fully compatible when essential requirements are missing or unverified.

The initial recommendation system should prioritize explainable matching rules over unnecessary complexity.

5. Internationalization and Regional Versions

Language and game-region version must be modeled independently.

For example:

* Taiwan game version + Traditional Chinese.
* Japanese game version + Japanese.
* Japanese game version + English interface.

The architecture must not assume that language determines game-region data.

Localized text should be stored separately from core entity identity and game statistics wherever practical.

The initial website language is Traditional Chinese (Taiwan).

Future languages may include:

* Japanese.
* English.
* Korean.

6. API and Module Boundaries

Frontend and backend communication must use clearly defined API contracts.

Before implementation, define:

* Endpoint responsibilities.
* Request and response formats.
* Shared data types.
* Validation rules.
* Error response conventions.
* Authentication and authorization requirements.

Do not allow frontend and backend agents to independently invent incompatible data structures.

Changes to shared API contracts must be documented and approved.

7. Data Integrity and Provenance

Every important game-data record should be traceable to its source.

The system should preserve:

* Source identity.
* Source version or snapshot.
* Retrieval or processing information.
* Regional version.
* Language information.
* Validation status.
* Known anomalies.

Data should be classified as:

* Raw source data.
* Parsed data.
* Derived data.
* User-submitted data.
* Manually verified data.

Unverified data must not silently become authoritative data.

Data redistribution and licensing restrictions must be respected.

8. Security and User Data

The system must consider:

* Authentication.
* Authorization.
* Input validation.
* Protection against common web vulnerabilities.
* Secure storage of credentials.
* Appropriate handling of personal data.
* Backup and recovery.
* Rate limiting for sensitive endpoints.

Users should only be able to modify data they are authorized to manage.

Secrets must never be stored in public source code.

9. Scalability and Maintainability

The architecture should favor:

* Clear module boundaries.
* Reusable components.
* Consistent data contracts.
* Testable business logic.
* Explicit dependencies.
* Documented decisions.

Avoid premature microservices, unnecessary abstractions, and speculative infrastructure.

Start with the simplest architecture that satisfies actual requirements while preserving reasonable expansion paths.

10. Technology Selection Policy

No specific framework, database, hosting provider, or deployment platform is finalized by this document.

Technology selection must consider:

* Project complexity.
* Development and maintenance costs.
* Performance.
* Reliability.
* Security.
* Available AI development tooling.
* Long-term portability.
* Deployment requirements.

Proposals must include trade-offs and explain why the selected option is appropriate.

Major technology decisions must be recorded in DECISION_LOG.md after approval.

11. Implementation Principles

* Build and validate the data foundation before depending on it for production features.
* Establish shared types and API contracts before parallel frontend/backend implementation.
* Implement core functionality incrementally.
* Keep frontend presentation separate from business logic.
* Keep data-source-specific parsing separate from application logic.
* Test modules independently before integration.
* Avoid implementing features that depend on unverified assumptions.

⸻

Architecture principle: Clear boundaries, traceable data, consistent contracts, and incremental development.

Recommendation algorithms and other extensible features should be designed as independent modules with stable interfaces. The core application should not depend on a specific algorithm implementation. Modules should be replaceable or upgradeable without requiring changes to unrelated core systems.
