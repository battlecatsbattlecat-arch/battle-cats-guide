# Competitor and Cross-Game Website Research

Research date: 2026-11-26. Product research only; no code was written and no site owner was contacted.

## How to read this report

Every claim carries one of three tags.

- **[O] Observed**: stated on a page I fetched, quoted or paraphrased from that page. The URL is given.
- **[A] Analysis**: my interpretation for the Battle Cats project.
- **[U] Unverified**: plausible but not confirmed. Do not rely on it.

### Method limits (important)

- I read pages through a text fetcher. Many of these sites are JavaScript apps. Where a page showed only a shell, I wrote "not visible", which means **not observed, not proven absent**.
- I could not log in, save a team, import a box or test mobile layout and loading speed on a device. Anything that needs an account, interaction or measurement is therefore **[U]** unless a page or official README describes it.
- Traffic, revenue and popularity are not claimed anywhere. Where a site publishes its own figures I report them as the site's own claim.
- Public availability does not make code, text, images or data reusable. Several sites state separate licences for data and art (see battlecatsdb.com below).

---

## Part 1. Battle Cats landscape (direct competitors)

Reviewed first, because the rest of the research only matters relative to what already exists.

### BattleCatsLab
- URL: https://battlecatslab.fun/
- Game: The Battle Cats (English version). Audience: players who compare units and plan stages.
- **[O] Features**: compare up to eight cats with form and level set per unit, effective stats against a chosen trait; stat calculator with custom unit and treasure levels; frame-by-frame 1v1 simulator; gacha seed tracker; **"Stage Lab: pick a stage to get Safe, Budget, and Rush lineups built from cats the user owns"**; PvP arena with drafted five-cat teams (ranked needs an account); shareable tier list maker; unit rankings; stage database with enemy lineups, spawn timings, drops; trait-based strategy guides. Catalog: 881 cats, 797 enemies, 1,302 maps, 6,415 stages up to Ver 16.0 (site's own figures). Data credited to the Global game and community databases such as BCU.
- Monetization: not stated on the page.
- **[A] Why it matters**: a Box-driven stage lineup recommender already exists. "Recommend guides from the player's Box" is therefore not a unique idea on its own. Whether Stage Lab output is accurate or explained is **[U]**; I could not run it.

### GachaData (Battle Cats section)
- URL: https://gacha-data.com/battle-cats/
- **[O]** Team Builder, Stat Calculator (Lv 1-130), "Where to Farm" (3,891 drop sources), Compare, patch changelog (4 builds archived), public API endpoint, dataset counts (760 cats, 2,294 forms, 1,053 talents, 222 combos, 5,853 stages, etc.), "Live · Patch 15.7.0 · Global (EN)". Labels itself independent and fan-made.
- **[O] Gap**: how the Team Builder works is not described on the landing page.
- **[A]** The public API and visible patch/version stamp are good trust signals.

### Battle Cats Guide Hub (anypupil)
- URL: https://battlecats.anypupil.com/?lang=en
- **[O]** Task-oriented entry points: "Find cats or replacements" (filter by counters, control, damage, event source), "Check enemies and counters", "Look up a stuck stage" (category, map, stage, then enemies, rules, rewards and guide links), gacha and collab lookup, a "Combo optimizer" (choose effects, required cats, exclusions). Data covers 861 cat groups, 778 enemies, 1,264 stage maps. Multilingual labels (EN, JP, TW) appear on entries.
- **[A]** Strong example of organising the home page by player intent ("I'm stuck") instead of by database table. Cat "Replacements" is close to the substitution idea we want.

### Battle Cats Stats
- URL: https://battlecatsstats.com/
- **[O]** "True damage" calculator including talents, strengthen, savage blow, procs; comparisons with talent toggles and saved comparisons; metal-enemy critical math; DPS and status duration by range; a Seed Tracker with "smart planning" that switches banners; feedback link. Describes itself as an unofficial fan site.

### Battle Cats Rolls
- URL: https://bc.godfat.org/ and help at https://bc.godfat.org/help
- **[O]** Gacha seed tracker and roll simulator. The help page documents seeking the seed, guaranteed events, highlighting rolls, a Traditional Chinese UI option (`?ui=tw`).
- **[A]** The seed problem is a mature, separate niche. Treat as a link-out, not something to rebuild.

### Battle Cats DB (Taiwan)
- URL: https://battlecatsdb.com/about/ and https://battlecatsdb.com/zh-tw/units/
- **[O]** Traditional Chinese UI; unit and form lookup, trait and ability filters, level and plus-value comparison (882 units listed). Documents its formulas: HP is multiplied by level then rounded, then by treasure multiplier and floored; DPS = summed attack × 30 ÷ attack cycle frames. Shows a data version ("community DB 15070101, TW 15.5 / JP 15.7.1") and update date. Handles version gaps ("some forms not yet released in TW; plus caps use TW fields first"). Data is MIT licensed; images are explicitly not (copyright PONOS and collab owners).
- **[A]** Best example in the Battle Cats space of transparent calculation and multi-region version handling. The data/image licence split is a model to copy for our own legal posture.

### Battle Cats stages by name (mygamatoto)
- URL: https://mygamatoto.com/allstages/search-by-stage-name
- **[O]** Paginated table (Category, Chapter, Stage, Enemies, Energy), 127 pages at 50 per page, states "This website is supported by ads". The enemies column was empty in the rows I saw.
- **[A]** Plain table with no visible filter; weak discovery.

### Gap assessment for Battle Cats (analysis)
- **[A]** Existing sites are strong on stats, calculators, seed tools and databases. In what I observed, none showed **human-written, versioned, verified stage strategies tied to structured team slots**, nor a visible guide-review process. The Fandom wiki page I tried to open returned "couldn't find an English wiki at this URL", so I did not evaluate it. **[U]** that no such feature exists elsewhere: I did not test every site.

---

## Part 2. Collection / Box trackers and Box-aware recommenders

### Dokkan.fyi (Dragon Ball Z Dokkan Battle)
- URL: https://dokkan.fyi/teams/create
- Audience: players building teams in a gacha RPG.
- **[O]** Team builder with "Basic Mode" and "Advanced Mode" (rotations), sections "Selected Characters", "Rotation 1", "Rotation 2", "Floaters", "Leader Skill". Automatic team build (changelog notes a fix so it stops choosing weak leaders or friends whose leader skill boosts only part of the team). Filters "Stacks ATK/DEF". **"Rebuild With My Box"** button on character, category, stage and event pages: builds the same kind of team using characters in the user's box (requires verified email sign-in). Battle Calculator with explained steps and a "What We Don't Model Yet" section; shareable calculation links; saved teams. Release Timeline. Dated changelog. Invites reports of calculator mismatches by comment or Discord.
- Monetization: not stated (the Amazon trademark line is not evidence of affiliate links).
- **Does well [A]**: ties a published example team to the viewer's own collection ("rebuild") rather than replacing the guide. Honest calculator limitations.
- **Weakness [A/U]**: the voting card ("Hidden Potential Skill Voting") is mentioned but rules are not stated; I could not test the Box import.
- **Adapt**: the "Rebuild with my Box" interaction on stage guides. This is the closest analogue to our planned Box plus recommendation feature.

### Krooster / ak-roster (Arknights)
- URLs: https://www.krooster.com/ , https://github.com/neeia/ak-roster
- **[O]** Collection and progress tracker. "Update your information in one click" by connecting to Yostar (EN/JP/KR) or Skland (CN); sign-in with Discord; data migration after an account-provider change. Sponsored by the MirrorChyan and MAA teams (sponsorship terms not stated).
- **[A]** The ready-made importer is the reason this exists as a site rather than a spreadsheet. Battle Cats has no equivalent official API. **[U]** whether a save-file import is realistic for us; it needs legal and technical investigation.

### Novena (Arknights, open source)
- URL: https://github.com/VanAstraea/novena
- **[O]** README describes: operator database with filters; 2-4 operator comparison with per-operator build and a shareable link; materials planner; farming planner using Penguin Statistics rates with an in-browser linear program; roster entry manually, by import, or a sample roster; imports and exports of several formats (own files, Krooster profiles and depot exports, Penguin Statistics depot); **screenshot reading done on the user's device without upload**; "priorities: after import, builds a list of upgrades that unlock the most community clears"; community usage and "lift" (operators used more than their ownership rate suggests), derived from the MAA Copilot guide database by counting usage only. Data stays in the browser, no sign-up.
- **Does well [A]**: closes the loop **Box → what to upgrade next**, using community clear data. Local-first storage removes accounts and privacy risk.
- **Adapt**: Box-driven "what unlocks the most guides" ranking; local-first Box with export files.
- **Risk [A]**: it is a README; I did not run the site.

### Chaldea (Fate/Grand Order)
- URLs: https://chaldea.center/ , https://github.com/chaldea-center/chaldea
- **[O]** Plans materials, servants, events; "Laplace" battle simulator for building teams and 3-turn farming; profiles for servants, craft essences, command codes, mystic codes, items; owned items feed material planning; import from captured traffic of CN/TW/JP/NA login or from screenshots; free quest solver (least AP or fewest battles) with item weights; summon simulator. Accepts donations; issues and PRs on GitHub.
- **[A]** The 3-turn farming team simulation is a deterministic-stage idea that maps to Battle Cats "cheapest reliable clear" but needs a combat model we should not attempt early.

### Genshin Optimizer
- URL: https://frzyc.github.io/genshin-optimizer/ , repo https://github.com/frzyc/genshin-optimizer
- **[O]** Tracks character, weapon and artifact inventory; page shows counts for Characters, Weapons, Artifacts, Teams, Loadouts, Builds; "Teams + Loadouts" marked complete; imports the community **GOOD** format ("Genshin Open Object Description") from scanners; artifact upgrade probability calculator; patch notes with version number.
- **[A]** Two lessons: a published, versioned interchange format for box data (GOOD, SROD) lets third-party tools feed it; and separating Teams from Loadouts avoids duplicating character builds per team.

### Fribbels HSR Optimizer
- URL: https://fribbels.github.io/hsr-optimizer/
- **[O]** Character Showcase by UID via Enka; optimization engine for relic sets; damage calculator with rotations and teammate buffs; benchmarks ("realistic" and "perfection" tiers); warp (gacha) planner; changelog, roadmap, GitHub contributors.
- **[A]** "Compare your build against a benchmark" is a pattern we can adapt: compare a user's Box unit to the guide's recommended level.

### Enka.Network
- URL: https://enka.network/
- **[O]** (search listing) fetches data from a player's in-game showcase and displays a build card for Genshin, HSR, ZZZ and Arknights: Endfield.
- **[U]** Details beyond the landing description.
- **[A]** Works because the games expose showcase data. Not directly applicable.

### Paimon.moe
- URL: https://paimon.moe/
- **[O]** Ascension calculator that adds items to a Todo list and shows resin cost, wish counter with pity statistics, import of wish history so it is kept beyond six months, achievements and furnishing trackers, reminders. Some statistics are computed from data submitted by its users.
- **[A]** The "todo list from calculators" pattern suits Battle Cats XP, NP and catfood planning.

### light.gg (Destiny 2)
- URL: https://light.gg/
- **[O]** Collection Manager with custom scoring, season-pass and bounty trackers, Roll Appraiser, Collection Leaderboards, God Roll Finder with many filters, loadout database and analytics, user item reviews. Ad-supported with an ad-free "Heroic" membership at $2/month (site's own banner).
- **[A]** Shows how far a collection product can go. Leaderboards are probably out of scope; the "appraise this roll against popular choices" concept is analogous to rating a Cat's talents or plus level.

---

## Part 3. Structured guide submission and community data

### MAA Copilot (prts.plus) for Arknights
- URL: https://prts.plus/
- **[O]** A job (guide) library for stages: "Create a new Job", sort control, per-stage listings that name required operators and group roles (e.g. tank, healer), original author and "json author" credits, descriptions, Bilibili video links, and a vote indicator ("Overwhelmingly Positive" with a number and relative post time). Site-wide announcements about stage compatibility. No review process stated.
- **[A]** Strongest structured-submission model I found: a guide is a machine-readable operator list plus the actions to run it, attached to a stage. Novena then counts usage from these jobs, which shows structured data has a second life as analytics.
- **[U]** How votes are cast, how stale guides are retired, moderation rules.

### Overframe (Warframe)
- URLs: https://overframe.gg/ , https://overframe.gg/builds/warframes/
- **[O]** Build listing cards show Forma count, guide length label (Short, Medium, Long) and **Votes** (e.g. 2,638). Titles carry update markers ("UPDATED FOR KOUMEI", "[Updated 14/05/2021]"). Third-party descriptions state a modding simulator, tier lists from votes and a companion app (https://app.overframe.gg/, snippet only).
- **[A]** Two problems visible from the listing: update status lives in free-text titles, and a build dated 2021 can still be listed. A structured "last verified for version X" field is the fix.

### Maxroll D4 Planner
- URL: https://maxroll.gg/d4/news/d4planner-is-live
- **[O]** Planner with paperdoll, skill tree and paragon board; save profiles; share to a Public Database where builds can be searched and ranked ("popular builds rise"); bug reports via Discord.
- **[A]** Pairs editorial guides (staff) with a user database (community) under one planner.

### Smogon Strategy Dex (Pokémon)
- URL: https://www.smogon.com/dex/sv/pokemon/garchomp/
- **[O]** Per-format strategy pages (OU, VGC, Monotype and others), named sets with moves, item, ability, nature, EVs, "Export" button; write-up explaining set choice and teammates; credits: contributors, "Quality checked by …", "Grammar checked by …"; "Added Mar 9, 2025, last edited Aug 17, 2025"; speed benchmark panel. Generation switcher; search syntax listed on the dex index (https://www.smogon.com/dex/sv/pokemon/).
- **[A]** The visible credits pipeline (author, quality checkers) is a transparent verification model; our submissions could show "Reviewed by" in the same way. How a set enters the dex is not stated on the page.

### Pikalytics (Pokémon)
- URL: https://pikalytics.com/pokedex
- **[O]** Format selector, rating cutoff selector, usage and win rate, common 2/3/4 Pokémon cores with team counts, "Recent Top Teams" ranked by performance with player, record, tournament and placement; "How to read this page" explains terms; team builder link; links to Limitless.
- **[A]** "Cores" (which items appear together on winning teams) maps directly to Battle Cats "which cats appear together in clears of this stage". The "How to read this page" explainer is a good model for complex data.

### Spire Codex (Slay the Spire 2)
- URL: https://spire-codex.com/stats
- **[O]** Community stats from 1,773,438 submitted runs with cohort filters (bracket, player count, character), win rate by character and ascension, "How players vote" per event; the page states "a naive snapshot of the data, not a verdict on what is correct".
- **[A]** Sample-size disclosure and a caution line are worth copying if we ever show clear-rate data.

### Penguin Statistics (Arknights drops)
- URL: https://penguin-stats.io/
- **[O]** Item and stage drop rates, farming planner, "Report Drops"; data from manual reports, screenshot recognition, API uploads; feedback via GitHub Issues; donations requested for server fees; an official mobile app is mentioned.
- **[A]** Crowd-sourced measurement works when each submission is a small, structured, checkable fact.

### BTD6 Index
- URL: https://btd6index.win/
- **[O]** Community-tracked challenge list (for example "2 Million Pops CHIMPS", "2 Towers CHIMPS"), "Latest Video", asks supporters to use the creator code BTD6INDEX.
- **[A]** A video-first, challenge-tagged index run on a creator-code support model.

---

## Part 4. Large editorial platforms

### Game8
- URL: https://game8.co/games/fire-emblem-heroes (member features), https://game8global.com/ads (advertiser page)
- **[O]** Free account unlocks Article Watchlist (notified on update), game bookmarks, cross-device sync, comment ratings and notifications, dark theme, premium articles for members, many tools (Team Builder, Build Planner, Stat Calculator, Tier List Maker, Weapon/Armor Wishlist). Community boards include a "Build Submission Board (194)". A "Last updated on" stamp appears on pages. Advertiser page lists sponsored articles, overlay and sidebar ads, sponsored wikis, video production at $700 per video, and claims 100,000,000 page views and 14,000,000 users per month (March 2025, the company's own figure). Also a partnership to embed publisher web-shop links (https://globalfintechedge.com/news/xsolla-and-game8-add-direct-web-shops-to-game-guides/).
- **[A]** Free-account "watch this article" is a low-cost way to keep guides honest: users learn about changes. Build submission is separate from the editorial wiki.
- **Weakness [U]**: ad density and speed not measured by me.

### Prydwen Institute
- URL: https://www.prydwen.gg/
- **[O]** Tier lists and guides for several gacha games, Discord with over 70,000 members, Ko-fi supporter benefits.

### GameTora (Uma Musume)
- URL: https://gametora.com/umamusume
- **[O]** Character and support card lists, Training Event Helper, Compatibility Calculator, starter/intermediate/advanced guide sections, news archive, "last updated 2026-11-23", contact for inaccurate content, Patreon supporter list.
- **[A]** The beginner/intermediate/advanced split on one hub is a ready model for guide difficulty labels.

### Epic7x
- URL: https://epic7x.com/
- **[O]** Tier list, patch notes with dates, buffs and debuffs reference, "Premium Guides" section.

---

## Part 5. Databases and calculators

### SchaleDB (Blue Archive)
- URL: https://schaledb.com/
- **[O]** Students, raids, items, stages (maps, enemies, rewards), crafting, damage calculator, settings for language and region (JP, Global, CN), event timers, changelog. Ads, premium and donations not visible.
- **[A]** A strong example of region switching on one dataset; relevant to JP/EN/TW/KR Battle Cats version differences.

### Atlas Academy DB (FGO)
- URL: https://apps.atlasacademy.io/db/
- **[O]** Raw game data, six UI languages, data refreshed within an hour of a release, translations editable via Weblate.

### Kiranico (Monster Hunter Wilds)
- URL: https://mhwilds.kiranico.com/
- **[O]** Database sections for Missions, Quests, Monsters, Items, Weapons, Armor, Skills, Decorations, Charms; shows "Game Ver. 1.040"; theme toggle. A build/armor-set search was not visible to me.

### Starrailstation, Genshin.gg
- URLs: https://www.starrailstation.com/en/characters , https://genshin.gg/
- **[O]** Character directories ("NEW" badges); Genshin.gg shows Rarity, Element and Weapon filter labels and calls itself a database and tier list site. Other functions were not visible to me.

### poe.ninja (Path of Exile)
- URL: https://poe.ninja/
- **[O]** Build meta explorer with filters by class, skills, items; Path of Building import/export and share links; passive tree planning; historical economy graphs; favorites.
- **[A]** "Meta of what players actually use" with filters; for Battle Cats the analogue is which cats clear a stage, if we ever collect structured clears.

### Smaller utilities
- Misode generators (https://misode.github.io/): generator and converter tools for Minecraft data, version selector, Supporters section [O]. Pattern: version selector on every tool.
- Minecraft Wiki (https://www.minecraft.wiki/): community-run, "Anyone can contribute", edit buttons, calculators under "Wiki tools", version overviews [O].
- warframe.market (https://warframe.market/): player marketplace with order placement and top 5 buy/sell orders [O]. Not relevant to Battle Cats.
- Mobalytics (https://mobalytics.gg/): says it offers personalised recommendations by skill level and a free desktop app [O, marketing claims only].

---

## Part 6. What I did not manage to verify

- Interactive features behind JavaScript: Genshin.gg and Starrailstation filters, Overframe's builder, Kiranico set search, GameTora tools, Atlas Academy search, SchaleDB detail pages. The fetcher failed on several of these pages.
- Anything requiring login (Dokkan.fyi box import, Krooster, Game8 account tools).
- Mobile layout, loading performance and accessibility. All **[U]**; treat any UI conclusion below as based on page structure and published descriptions only.
- Maxroll premium page and Smogon QC threads (fetch failed). Maxroll and Smogon monetization is **not established** here.
- Hoyolab, Warframe Wiki, Bulbapedia, Serebii, Pokémon Showdown teambuilder (fetched page showed only news posts), Dotabuff and Fandom Battle Cats Wiki were not meaningfully assessed.
