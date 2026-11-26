# Battle Cats Product Recommendations

Based on COMPETITOR_WEBSITE_RESEARCH.md. Evidence tags: **[O]** observed, **[A]** analysis, **[U]** unverified. Complexity and value ratings are my judgement, not measured.

## Strategic read

1. **[O]** The Battle Cats space already has strong tools: calculators, comparisons, seed trackers, stage databases and even a Box-based lineup generator (BattleCatsLab "Stage Lab", https://battlecatslab.fun/). Competing on "more stats" is a poor bet.
2. **[A]** What I did not observe in the Battle Cats sites: guides that are structured, tied to a game version, reviewed in public and linked to a player's Box. That is the opening. I did not test every site, so confirm this before committing.
3. **[O]** The non-Battle Cats sites that do this best are Dokkan.fyi (guide to "rebuild with my Box"), Novena (Box to upgrade priorities), MAA Copilot (structured per-stage submissions), and Smogon (credited review of sets).
4. **[A]** The hard parts are data modelling and trust, not user interface. Decide them first.

## Priority tiers

### P0: Essential, shape the architecture

#### P0-1. Version and region on every record
- Inspired by: Battle Cats DB TW (separate TW 15.5 and JP 15.7.1 data, "some forms not yet released in TW", https://battlecatsdb.com/about/); SchaleDB region switch (https://schaledb.com/); Kiranico "Game Ver." (https://mhwilds.kiranico.com/).
- Problem: Battle Cats versions differ by region (JP leads EN and TW). Guides and stats go stale with each release or rebalance.
- How: every unit, form, talent, enemy, stage and guide has `region` and `valid_from/valid_to` game versions. UI shows a persistent region/version selector.
- Feasibility: high. Complexity: Medium. Value: High.
- Risk: retrofitting later is painful. Retrieval of version-accurate historic data is a dependency **[U]**.

#### P0-2. Structured guide schema (team slots, not a text blob)
- Inspired by: MAA Copilot jobs (operators and roles per stage, https://prts.plus/); Smogon named sets (https://www.smogon.com/dex/sv/pokemon/garchomp/); Dokkan.fyi slots (https://dokkan.fyi/teams/create).
- Problem: free-text guides cannot be searched, checked against a Box, translated or kept current.
- How **[A]**: a guide has stage, rules assumed (treasures, no continues, restrictions), a deck of slots. Each slot has a role (meat shield, wall, damage, crowd control), preferred unit, minimum form/level/plus/talent, an optional "why it is here" note, and a list of substitutes. Plus timeline notes (when to deploy) and a video link with timestamps.
- Feasibility: high. Complexity: Medium. Value: High.
- Risk: schema must tolerate unusual stages; keep a free-text escape field. Over-rigid forms will deter contributors.

#### P0-3. Box as a versioned, local-first data format with import and export
- Inspired by: Novena (browser-local, no sign-up, many import and export formats, https://github.com/VanAstraea/novena); Genshin Optimizer's open GOOD format (https://github.com/frzyc/genshin-optimizer).
- Problem: players' Boxes are large (hundreds of units). Forcing sign-up before value kills adoption; opaque formats lock users in.
- How: per-unit record of owned form, level, plus level, talents and orbs. Stored locally by default, optional account sync later. Publish a documented JSON schema.
- Feasibility: high. Complexity: Medium. Value: High.
- Dependency: stable unit IDs (see P0-1). Risk: automatic import from a save or app is **[U]** and may be technically or contractually problematic; start manual and via spreadsheet/CSV.

#### P0-4. Guide freshness fields (verified-for-version, last verified, status)
- Inspired by: Overframe shows update markers only inside titles (https://overframe.gg/builds/warframes/), a weakness; Smogon shows "Added / last edited" and quality-checkers; Game8 watchlist (https://game8.co/games/fire-emblem-heroes).
- Problem: outdated guides are the main trust failure in guide sites.
- How: each guide stores `verified_for_version`, `verified_by`, `verified_on`, status (current, needs recheck, outdated, superseded). When a unit used by a guide changes in a new version, mark guides "needs recheck" automatically.
- Feasibility: high. Complexity: Medium. Value: High.
- Dependency: P0-1 and P0-2.

#### P0-5. i18n-ready data, not just translated pages
- Inspired by: Atlas Academy (six UI languages, Weblate translations, https://apps.atlasacademy.io/db/); Battle Cats Guide Hub shows EN/JP/TW names (https://battlecats.anypupil.com/?lang=en).
- Problem: Battle Cats names differ across regions; guides in one language should still find the right unit in another.
- How: stable numeric IDs plus per-language name tables; guide text keyed by language with a fallback.
- Feasibility: high. Complexity: Low if done early, High if retrofitted. Value: Medium now, High later.

#### P0-6. Separate data licence from art assets
- Inspired by: battlecatsdb.com states community data MIT but images are PONOS and collab owners' property (https://battlecatsdb.com/about/); gacha-data.com and others carry non-affiliation disclaimers.
- Problem: legal exposure from game art, and from reuse of other sites' data.
- How **[A]**: architecture that lets images be hosted or swapped separately; clear attribution of data sources; no copying of competitor text or code. Get legal advice **[U]**.
- Complexity: Low. Value: High (risk avoidance).

### P1: High value, initial development

#### P1-1. "Rebuild with my Box" on stage guides
- Inspired by: Dokkan.fyi button on stage and character pages (https://dokkan.fyi/teams/create); BattleCatsLab Stage Lab (https://battlecatslab.fun/).
- Problem: a guide's ideal deck often includes units the player lacks.
- How: show each slot as owned / owned but under-levelled / missing, a "readiness" summary, and the best substitute the player does own. The curated guide stays primary; the Box-driven view only adapts it.
- Feasibility: high given P0. Complexity: Medium. Value: High.
- Risk: a naive substitute can produce a deck that fails. Always display why a substitute fits and a confidence label ("verified substitute" vs "suggested by tags"). Do not call it a guaranteed clear.
- Differentiator vs Stage Lab: guides are human-verified; recommendations explain themselves **[A]**; I could not test Stage Lab's accuracy **[U]**.

#### P1-2. Substitution graph with reasons
- Inspired by: Battle Cats Guide Hub "Find cats or replacements" (https://battlecats.anypupil.com/?lang=en); Smogon alternative moves in sets.
- How: substitution relations authored per slot (verified) plus tag-based suggestions (trait targeting, range, role, cost). Show differences ("lower range, higher cooldown").
- Complexity: Medium. Value: High. Dependency: unit tags and P0-2.

#### P1-3. "Why this works" panel on every slot
- Inspired by: Smogon write-ups explaining set choice; Dokkan.fyi calculator that explains each step (https://dokkan.fyi/teams/create); Pikalytics "How to read this page".
- How: one or two required sentences per slot ("blocks Zombie revive", "outranges boss"), tied to enemy traits and abilities.
- Complexity: Low. Value: High. Risk: authoring burden; make it required but short.

#### P1-4. Difficulty and audience labels on guides
- Inspired by: GameTora starter / intermediate / advanced groups (https://gametora.com/umamusume); Overframe guide length labels.
- How **[A]**: tags such as "Low-level Box", "No Ubers", "Budget", "Fast", "Safe", plus required minimum levels derived from the guide's slots rather than self-declared.
- Complexity: Low. Value: High.

#### P1-5. Unit and enemy database with compare and Box overlay
- Inspired by: BattleCatsLab (compare up to eight), Battle Cats Stats (talents in DPS), Novena (compare at chosen builds with shareable link).
- Genuine value beyond basic info **[A]**: show stats at the player's own level/plus/talents; show which enemies a unit is good against; link unit pages to guides that use it ("used in 14 guides").
- Complexity: Medium. Value: High. Avoid competing on raw stat completeness first.

#### P1-6. Documented calculators with stated limits
- Inspired by: battlecatsdb.com publishes formulas and rounding rules; Dokkan.fyi lists "What We Don't Model Yet".
- How: ship few calculators (stat at level, effective DPS vs trait, treasure effects), show the formula and the cases not covered.
- Complexity: Medium. Value: Medium-High. Risk: this area is crowded; add only what supports guides.

#### P1-7. Video guides with stage-wave timestamps
- Inspired by: MAA Copilot listings carry Bilibili links; BTD6 Index leads with video.
- How: embed (not host) video with per-step timestamps ("wave 2: deploy slot 4").
- Complexity: Low. Value: Medium-High.

#### P1-8. Task-based home page
- Inspired by: Battle Cats Guide Hub quick-starts ("Look up a stuck stage"). See UI_UX_INSPIRATION.md.
- Complexity: Low. Value: High.

### P2: Later, after the core is stable

| Feature | Inspired by | What it does for Battle Cats | Complexity | Value | Notes and risks |
|---|---|---|---|---|---|
| Community guide submission with a review queue | MAA Copilot, Maxroll public database, Smogon credits | Structured submission using the P0-2 schema, reviewed before "verified" | Medium-High | High | Moderation burden; launch with invited contributors **[A]** |
| "Worked / didn't work" outcome reports | Penguin Stats, Spire Codex | Attach reports to guide + version + Box summary; flag guides with rising failures | Medium | High | Needs anti-abuse; show sample size as Spire Codex does |
| Guide watchlist with change alerts | Game8 Article Watchlist | Notify when a followed guide is rechecked or outdated | Low-Medium | Medium | Needs accounts |
| Upgrade priorities from Box | Novena | "Levelling this unit unlocks 6 more guides" | Medium | High | Needs enough structured guides first |
| Share links for decks and comparisons | Novena, Battle Cats Stats saved comparisons | Shareable URL for a configuration | Low | Medium | Encode state in URL |
| Contributor profiles | Smogon credits, MAA Copilot author credits | Credit authors and reviewers per guide | Low-Medium | Medium | Add reputation only after moderation exists |
| Duplicate guide handling | Overframe has many builds per frame | Group guides per stage by approach; merge near-duplicates | Medium | Medium | Do with moderators, not automatically |
| Aggregated usage ("cores") | Pikalytics cores, Novena usage "lift" | Which cats appear together in verified guides | Medium | Medium | Based on guides, not on clears, unless clear data exists |
| Screenshot import of the Box | Novena (reads on device), Chaldea | Faster Box entry | High | Medium | OCR accuracy **[U]**; local-only processing preferred |
| Public API | gacha-data.com API, Atlas Academy | Lets community tools use your IDs and schema | Low-Medium | Medium | Rate limits; licence |

### P3: Optional

- Tier list maker (BattleCatsLab) — low need once stage guides exist.
- Region-aware release timeline (Dokkan.fyi) — modest value.
- Leaderboards (light.gg collection leaderboards) — **[A]** encourages cheating and comparison pressure; skip.
- Premium ad-free tier (light.gg) — see MONETIZATION_RESEARCH.md.

## Features to avoid or defer

| Feature | Why |
|---|---|
| Frame-accurate battle simulator (BattleCatsLab) | Very high cost, easy to get subtly wrong, and wrong output harms trust. Revisit only if guides need it. |
| Gacha seed tracker | Mature tools exist (https://bc.godfat.org/help, https://battlecatsstats.com/). Link out. |
| Automatic account or traffic-capture import (Chaldea does this) | **[U]** legal and security risk for a game with no official API. Start with manual entry and file import. |
| Raw popularity voting to rank guides (Overframe, MAA Copilot) | **[A]** votes reward popularity and age, not correctness. Use verification status as primary rank; votes secondary. |
| Auto-generated lineups without explanation | Players will not trust a deck they cannot understand. |
| Building every database field before guides | Existing DBs already cover this; guides are our differentiator. |
| Gamified reputation points early | Encourages low-quality volume before moderation exists. |

## Three strongest competitive advantages

1. **Verified, versioned, structured guides** (P0-2, P0-4): a visible "verified for version X by Y" label.
2. **Box-aware readiness with explained substitutes** (P1-1, P1-2, P1-3).
3. **Guide health built on feedback**: outcome reports and automatic "needs recheck" when a unit changes (P2).

## Architecture decisions to make before further development

1. Stable IDs and a version/region model for every game entity.
2. A guide schema with slot roles, requirements, substitutes and free-text fallback.
3. A documented, versioned Box schema; local-first storage with optional sync.
4. A rules layer ("readiness evaluation") separate from the interface so recommendations are testable.
5. Translation architecture: IDs, name tables, per-language guide text.
6. Image/data licence separation and source attribution.
7. Moderation and role model (reader, contributor, reviewer, admin) even if only admins exist at launch.
8. Public read API shape, even if it ships later.

## Open questions I could not answer

- Does Stage Lab (BattleCatsLab) explain its choices, and how accurate is it? **[U]**
- Is any structured, verified stage-guide product already live for Battle Cats? I did not exhaustively check. **[U]**
- Can the Box be imported from any official source? **[U]**
- What do real users trust? Validate with 5 to 10 player interviews before building P2.

---

## Executive summary

**1. Five most valuable references**
1. Dokkan.fyi: guide pages that "Rebuild With My Box", explained calculators, public changelog (https://dokkan.fyi/teams/create).
2. Novena (with Krooster): local-first roster, multi-format import/export, upgrade priorities from community clears (https://github.com/VanAstraea/novena).
3. MAA Copilot: structured per-stage submissions with roles, credits, video and votes (https://prts.plus/).
4. Smogon Strategy Dex: named sets with rationale, credited quality checks, edit dates (https://www.smogon.com/dex/sv/pokemon/garchomp/).
5. SchaleDB with Battle Cats DB (TW): region/version handling and documented formulas (https://schaledb.com/, https://battlecatsdb.com/about/).

**2. Ten features to seriously consider**
Version/region on all data; structured guide schema; local-first Box with documented format; guide freshness and verification fields; Box readiness strip on stage guides; substitution graph with reasons; "why this works" notes; unit database with Box overlay and compare; documented calculators with stated limits; timestamped video guides.

**3. Three strongest advantages**
Verified and versioned structured guides; Box-aware readiness with explained substitutes; guide health driven by outcome feedback and automatic "needs recheck".

**4. Avoid or defer**
Battle simulator, gacha seed tools, automatic account or traffic-capture import, popularity-only guide ranking, unexplained auto-generated decks, leaderboards, early paywalls, early reputation points.

**5. Architecture decisions first**
Stable IDs plus version/region validity; the guide slot schema; the Box schema; a separable readiness-rules engine; translation by ID and language tables; separation of data and art licensing; roles for moderation; a public API shape.

**Caveat:** several features were observed only through page text or README descriptions, and mobile performance and logged-in behavior were not tested. Validate the top candidates by using the live tools yourselves before committing.
