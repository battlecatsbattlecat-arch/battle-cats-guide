# PIPELINE_OPEN_ISSUES.md — 尚未解決與尚未驗證事項

> v2.3.11 僅修訂規格文字；不代表 Parser、publisher、Windows 行為、Public Repo 安全或授權已驗證。所有未實際執行的項目均標記 NOT RUN。

## P0 — Public Repo 與授權阻斷（全部保留）

1. Public Repository 完整 Git 歷史 tree/blob 安全掃描未完成；尚無涵蓋全歷史的可稽核結果。若有不允許內容，須處理完整歷史，不能只刪最新檔。
2. 預設分支 Branch Protection 或 Rulesets、禁止直推、必要 reviewer/status checks 尚未以可驗證設定確認。
3. `CODEOWNERS`、default-deny `registry/publish_allowlist.json`、追蹤檔案 allowlist CI、全歷史掃描 CI 尚未落地或驗證。allowlist 與 CI 驗證各自列為 NOT RUN。
4. 固定上游 Commit 的 LICENSE，以及遊戲原始資料與第三方資料再散布權利仍未知。`rights_class=unknown` 的 source/衍生物不得公開。

## P1 — 規格已有文字，實作／平台驗證未完成

1. Build sequence ledger/counter transaction、crash windows、併發唯一性、損毀復原與 stale policy 尚無實作與故障注入驗證。
2. Candidate/complete/sealed/published/failed/stale lifecycle、failure records、append-only events、完整 inventory sealing 與 receipt recovery 尚無實作。
3. parsed_current 首次建立、併發發布、同卷 atomic replace、lock、reader hash validation、失敗復原、人工 recovery 尚無 Windows/目標檔案系統測試；crash durability 也未證明。
4. `raw_line_base64`、EOL replay、BOM、LF/CRLF/NONE、裸 CR、invalid UTF-8、blank、offset、byte equations 尚無 Parser 或 byte fixture 驗證。
5. TSV 原始 token split/join（尾端／連續空欄、異常欄數）尚無逐位元組 roundtrip 驗證。此 dialect 不能區分零 byte blank 與單欄空字串，單欄空字串不受支援。
6. `CreateDirectoryW` P/Invoke 父路徑、183 race、錯誤 3 修復、16 次上限、reparse/path containment 與 TOCTOU 威脅模型尚無 Windows 測試。
7. 多錯誤 diagnostics 完整收集與 PowerShell `-File` exit code priority 尚未執行。
8. UTF-8/canonical JSON 在支援 PowerShell/.NET 版本間的可重現性及 schema validator 驗證尚未執行。
9. 來源錨定、固定 upstream bytes、LICENSE、10 檔 manifest、formal step 0 與 `-Finalize` 尚未完成。

## P2 — 語意／測試覆蓋待完成

1. Physical-line primary reason、每行唯一分類、file-level empty/header diagnostics 及 line/byte 對帳式需要 fixtures 驗證。
2. Placeholder ASCII regex 的 Arabic-Indic、Devanagari、Fullwidth、mixed-digit 負面 cases 尚未測試。
3. GC lease liveness 與 orphan reconciliation 競爭條件尚需併發／故障注入測試。
4. Versioned `field_registry.json`、`anomaly_rules.json`、`expected_anomalies.json` 的具體資料、schema 與 hash-pinned baseline 尚需建立和驗證。

## 上游遊戲語意未解（G-01 至 G-10）

| ID | 尚未解決項目 |
|---|---|
| G-01 | `max_plus_level_tw` 空值語意與無後綴等級欄位 scope |
| G-02 | catstat/tcat 多語名稱及地區歸屬、886/887 日文內容及 174 筆空 `name_jp` 成因 |
| G-03 | 887 與全表單位分類 |
| G-04 | `tcat.tsv` 第 889 行 placeholder 與第 359 行異常成因 |
| G-05 | `orb_count` 空值及 `egg_id` 格式語意 |
| G-06 | ability/trait/immunity/talents/ability_enabled/version 編碼 |
| G-07 | 戰鬥時間欄位單位、DPS 公式與負距離含義 |
| G-08 | XP/level curve 公式 |
| G-09 | limited_cats、cat_guide_ids、rarities 語意 |
| G-10 | cat/catstat 全欄位空值與值域 profile |

任何未解欄位均不得靠猜測升為 verified；P0 未解除前不得發布 source 或解析產物。
