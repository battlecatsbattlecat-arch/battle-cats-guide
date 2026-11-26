# UI/UX Inspiration

Evidence tags: **[O]** observed on page text, **[A]** my interpretation, **[U]** unverified. I inspected pages as text, not as rendered mobile or desktop layouts, so layout comments describe structure and labels only. Performance, accessibility and mobile behavior were not measured.

## 1. Intent-based home page
- Source: https://battlecats.anypupil.com/?lang=en
- **[O]** Quick Start cards: "Find cats or replacements", "Check enemies and counters", "Look up a stuck stage", "Check gacha and collabs", "Build a combo row", each with 2-3 links; random and daily picks; short "Where to Start When You Are Stuck" guides.
- **[A]** Organising by what the player is trying to do shortens the path from a stuck stage to an answer.
- Adapt: home cards "I'm stuck on a stage", "What can I use with my Box", "Compare units", "Learn the basics".

## 2. "Rebuild with my Box" button in context
- Source: https://dokkan.fyi/teams/create
- **[O]** The button sits on character, category, stage and event pages.
- **[A]** The Box feature appears where decisions happen instead of in a separate tool. Place a readiness strip on every stage guide: "7 of 10 slots ready, 2 substitutes, 1 missing".

## 3. Basic and Advanced mode
- Source: https://dokkan.fyi/teams/create
- **[O]** "Basic Mode" and "Advanced Mode" (rotations), with labelled areas.
- **[A]** Progressive disclosure: simple deck view first, deployment timing and conditions in an advanced tab.

## 4. Calculator honesty panel
- Source: https://dokkan.fyi/teams/create and https://battlecatsdb.com/about/
- **[O]** Dokkan.fyi lists "What We Don't Model Yet"; Battle Cats DB explains rounding order and the DPS formula.
- **[A]** A short "How this is calculated / what is not included" section beneath each calculator reduces mistrust.

## 5. Comparison with shareable link
- Source: https://github.com/VanAstraea/novena (README), https://battlecatslab.fun/
- **[O]** Compare 2-4 operators with a chosen build each and a shareable link; BattleCatsLab compares up to eight cats and flags the best.
- **[A]** Mark the best value per row; keep the compare tray persistent while browsing; encode state in the URL.

## 6. Explain-the-data headers
- Source: https://pikalytics.com/pokedex
- **[O]** "How to read this page" defines usage, winrate and cores in plain language.
- **[A]** Use for Battle Cats terms (plus levels, talents, orb effects) so new players do not bounce.

## 7. Credit line with reviewer and dates
- Source: https://www.smogon.com/dex/sv/pokemon/garchomp/
- **[O]** "Added Mar 9, 2025, last edited Aug 17, 2025", contributors, "Quality checked by", "Grammar checked by".
- **[A]** Our equivalent: a guide header chip "Verified for 15.7 · reviewed by X · checked 2026-11-20".

## 8. Named sets with Export
- Source: https://www.smogon.com/dex/sv/pokemon/garchomp/
- **[O]** Each set is a compact card (moves, item, ability, spread) with an Export button.
- **[A]** Deck cards with an "Add to my notes / copy as text" action.

## 9. Guide listing card with meaningful metadata
- Source: https://overframe.gg/builds/warframes/
- **[O]** Each card shows Forma count, guide length (Short, Medium, Long) and Votes.
- **[A]** Copy the idea of at-a-glance cost and length. Avoid its weakness: update info lives in titles. Show structured version badges instead.

## 10. Stage-keyed submission list with credits
- Source: https://prts.plus/
- **[O]** Listings show stage code, mode, operator list, original author and json author, a link to video, a vote indicator and age.
- **[A]** Our list rows: stage, required units (icons), difficulty chip, verified status, video indicator, age.

## 11. Account-gated watch and notify
- Source: https://game8.co/games/fire-emblem-heroes
- **[O]** Article Watchlist, bookmarks, cross-device sync, comment ratings.
- **[A]** Keep core reading free and anonymous; add accounts for watchlist and sync only.

## 12. Region and version selector
- Sources: https://schaledb.com/ (Settings: language and region; JP/Global/CN tabs), https://apps.atlasacademy.io/db/ (UI language button)
- **[A]** One persistent control shows region, version and language; the whole site adapts.

## 13. Task-grouped tool menus and "popular pages"
- Source: https://gametora.com/umamusume
- **[O]** Database, Tools, Guides grouped by level, and a Popular Pages list.
- **[A]** Group navigation as Guides, Database, Tools, My Box.

## 14. Collapsible menu for a feature-heavy site
- Source: https://penguin-stats.io/
- **[O]** A button expands the menu to reveal more features; search for stage, zone or item at the top.
- **[A]** Keep the top bar minimal (Search, My Box) and put the rest in a drawer.

## 15. Cohort filters and sample size
- Source: https://spire-codex.com/stats
- **[O]** Filters (bracket, players, character), totals, and the warning "A naive snapshot of the data, not a verdict on what is correct."
- **[A]** If you show outcome data, show N and the caveat.

## 16. Dated patch notes and feature changelogs on the page
- Sources: https://dokkan.fyi/teams/create (dated changelog), https://frzyc.github.io/genshin-optimizer/ (patch notes with version), https://gacha-data.com/battle-cats/ ("Live · Patch 15.7.0 · Global (EN) · updated November 1, 2026")
- **[A]** Freshness stamp on every data page.

## 17. Local-first, no sign-up promise
- Source: https://github.com/VanAstraea/novena
- **[O]** "No sign-up; your data stays in your browser" and on-device screenshot reading.
- **[A]** Put the privacy promise next to the Box entry point.

## Patterns to avoid
- **[O]** A raw table of every stage with no visible filter (https://mygamatoto.com/allstages/search-by-stage-name).
- **[O]** Vote counts without a stated meaning (Overframe, MAA Copilot) — if we show votes, explain them.
- **[U]** Dense ad layouts: I did not measure ad density on any site. Test with Lighthouse and on real phones before copying any layout.

## Items to test before designing
1. Render the top five reference sites on a phone and measure load time and layout shift.
2. Check contrast and keyboard use on the Box entry screen of our own prototype.
3. Test whether new players understand "plus level" and "talent" with no help text.
