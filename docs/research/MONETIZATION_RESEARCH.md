# Monetization Research

Only publicly observable methods are listed. **No revenue, profit or traffic is assumed.** Figures quoted are the sites' own claims. Tags: **[O]** observed, **[A]** analysis, **[U]** unverified.

## Observed methods by site

| Method | Site | Evidence | Effect on user experience |
|---|---|---|---|
| Display ads | mygamatoto (Battle Cats) | **[O]** "This website is supported by ads" at https://mygamatoto.com/allstages/search-by-stage-name | Layout impact not measured **[U]** |
| Ads with an ad-free paid tier | light.gg (Destiny 2) | **[O]** banner asks users to disable ad blocker or become Heroic, ad-free for $2/month, plus private servers and merchandise, https://light.gg/ | Non-intrusive upsell on a free site **[A]**; ad density not measured **[U]** |
| Sponsored content and ad inventory | Game8 | **[O]** rate card with sponsored reviews, tie-up articles, overlay and sidebar ads, sponsored wikis, $700 per video, claimed 100M page views and 14M users per month (March 2025), https://game8global.com/ads | Sponsored articles can blur editorial independence **[A]** |
| Free-account walls | Game8 | **[O]** premium articles for free members; watchlist, sync, comment features, https://game8.co/games/fire-emblem-heroes | Gate exists for some articles; price not stated **[O]** |
| Commerce links | Game8 | **[O]** partnership to embed publisher web-store links into guides, https://globalfintechedge.com/news/xsolla-and-game8-add-direct-web-shops-to-game-guides/; Game8 Store pages claim "42 million monthly users" (own claim), https://business.store.game8.jp/en/ | Conflict risk when recommending purchases **[A]** |
| Supporter benefits | Prydwen | **[O]** Ko-fi with "unique benefits", https://www.prydwen.gg/ | Voluntary |
| Patreon | GameTora | **[O]** Patreon request and supporter list, https://gametora.com/umamusume | Voluntary |
| Donations to cover servers | Penguin Stats | **[O]** donation request for server fees, https://penguin-stats.io/ | Voluntary |
| Donation page | Chaldea | **[O]** https://github.com/chaldea-center/chaldea | Voluntary |
| Creator code | BTD6 Index | **[O]** in-game creator code "BTD6INDEX", https://btd6index.win/ | Zero cost to user; depends on game programme |
| Sponsors | Krooster | **[O]** "Sponsored by the MirrorChyan and MAA teams", https://www.krooster.com/ | Terms not stated |
| Supporters list | Misode | **[O]** "Supporters" section, https://misode.github.io/ | Voluntary |
| "Premium Guides" label | Epic7x | **[O]** label only, https://epic7x.com/ | Terms not stated |
| Tournament prize listings | Pikalytics | **[O]** prizes shown are tournament prizes, not site income | Not monetization |

Nothing monetizing was visible on the pages I read for Dokkan.fyi, Novena, Genshin Optimizer, BattleCatsLab, Battle Cats Stats, SchaleDB, Atlas Academy, Smogon, Pikalytics. This only means I did not see it; it does not mean none exists **[U]**.

## Suitability for our site (analysis)

| Method | Fit | Reasoning |
|---|---|---|
| Voluntary support (Ko-fi, Patreon, donations) | **Good start** | Used by community-maintained sites (Prydwen, GameTora, Penguin Stats). Low friction, no user-experience cost. Income is unknown **[U]**. |
| Light, labelled ads | **Possible later** | Common in Battle Cats sites (mygamatoto). Keep ads off tool screens such as the Box and calculators; never inside guide steps. Measure page speed after adding. |
| Ad-free supporter tier | **Possible later** | light.gg model. Only worthwhile with enough audience and a small price. Keep every guide free. |
| Paywalled guides | **Avoid** | Would undermine the trust pitch (verified, open guides) and conflicts with user submissions. Game8 gates only some articles and states no price. |
| Sponsored guides/reviews | **Avoid early** | Conflict with verification; if ever done, label clearly. |
| Affiliate / game-shop links | **Cautious** | Possible only if clearly labelled; official publisher partnership terms are **[U]**. |
| Creator codes / in-game programmes | **Check** | Whether the Battle Cats offers any such programme is **[U]**. |
| Selling data via API | **Avoid early** | Complicates the licensing position (see P0-6). |

## Rules I would adopt
1. No ads or sponsorships inside verified guide content.
2. Verification status never influenced by payment.
3. Box and calculators free and local-first.
4. Disclose all monetization in an About page.
5. Measure performance before and after introducing any ad.

## Cost side to plan for
**[A]** Penguin Stats and Chaldea ask for help with server fees, which shows hosting and API costs are real for data-heavy tools. Static, pre-computed data and local-first Box storage reduce running costs.
