# PIPELINE_CODEX_REVIEW — v2.3.12 回應追蹤

狀態：作者自我檢查（AUTHOR SELF-REVIEW），不是獨立審查或實作測試 PASS。Claude 第二輪意見依使用者提供之 ID/checklist；附件報告未作為工作樹中的可引用檔案。未縮減本輪列出的 ID。所有 P0 保留。

## Claude 新 P1（N1–N8）

| ID | 結果 | 修訂位置 / 證據 | 剩餘限制 |
|---|---|---|---|
| N1 Manifest schema | 已修規格與 schema | §7 precedence、§9.1、`schemas/v2.3.12/build_manifest.schema.json`; Ajv 8.20.0 正反 fixtures | 只驗 JSON schema，不驗實作 serializer/semantic constraints |
| N2 ACL seal | 規格已補 | §9.4 identities/rights/DACL/rename recovery/ADS/hardlinks/reparse/inventory | Windows ACL/NTFS 測試 NOT RUN |
| N3 seal manifest hash | 規格/schema 已補 | §9.4 exact manifest bytes SHA-256 + inventory SHA-256；lifecycle event schema | sealed event 實作 NOT RUN |
| N4 provisional terminal | 已決策 A | §1.1、§9.4：private diagnostics sealed，publication N/A | 生命週期實作 NOT RUN |
| N5 parsed output schema | 已新增基礎 row schema與契約 | §9.2、`parsed_artifacts.schema.json`、synthetic fixtures | 全 record semantic / actual artifacts 未實作驗證 |
| N6 config schemas | 已新增 | schemas: registry/rules/expected/disposition；§9.3 定義範圍與跨檔檢查 | 實際 baseline/config 不存在且不得臆造 |
| N7 header assumptions | 已補證據規則 | §9.2–9.3、`source_header_contract.schema.json` | 未找到來源 TSV；9 檔 policy 均 unknown，formal gate blocking |
| N8 GC/recovery conflict | 已補 reconciliation | §9.4、§9.8 matrix | recovery/GC implementation NOT RUN |

## 原有 P1（11）與 P2（14）

| ID | 處理 | 規格對應 | 驗證狀態 |
|---|---|---|---|
| L-1 | 明定 empty/BOM-only file diagnostics/blocking | §9.2 | 文件；byte fixture NOT RUN |
| L-2 | header 僅 physical line 1 | §9.2 | 文件；parser NOT RUN |
| B-1 | sequence lock scope/timeout/order | §9.4 | 文件；concurrency NOT RUN |
| B-2 | ledger rename 即消耗且可追溯 | §9.4 | 文件；crash test NOT RUN |
| B-3 | lease/liveness/recovery | §9.4/9.8 | 文件；OS lock NOT RUN |
| F-1 | FailureRecord 時機/schema/nullable path | §9.4 | 文件；failure injection NOT RUN |
| F-2 | candidate/complete/sealed/failed合法順序 | §9.4 | 文件；lifecycle test NOT RUN |
| F-3 | ACL sealed inventory/receipt | §9.4 | 文件；NTFS test NOT RUN |
| F-4 | anomalies per build | §2.1/9.1 | 文件；artifact creation NOT RUN |
| X-1 | manifest/sequence schema | §9.1 + schemas | schema fixture execution |
| X-2 | exit 10/13 mapping | §9.5/9.7 | 文件；CLI test NOT RUN |
| L-3 | one primary reason, deterministic precedence | §9.2/9.5 | 文件；fixture NOT RUN |
| L-4 | byte equations | §9.2 | 文件；roundtrip NOT RUN |
| B-4 | stale event/error policy | §9.4/9.5 | 文件；publish test NOT RUN |
| B-5 | lock order/no reverse nesting | §9.4 | 文件；deadlock stress NOT RUN |
| B-6 | counter corruption fail closed | §9.4/9.8 | 文件；recovery NOT RUN |
| X-3 | complete-before-seal and events external | §9.4 | 文件；crash test NOT RUN |
| X-4 | current means valid pointer only | §2.2 | 文件；reader test NOT RUN |
| X-5 | publication gate/provisional | §7.4/9.4 | 文件；gate tests NOT RUN |
| X-6 | CreateDirectoryW 3/183/TOCTOU | §9.5 | 文件；Windows test NOT RUN |
| X-7 | regex `\A...\z`, ASCII digits | §9.5 | Unicode regex fixtures NOT RUN |
| X-8 | unexpected isolation exit 14 | §9.5 | 文件；CLI test NOT RUN |
| X-9 | public allowlist vs private config | §2.3/9.3 | 文件；CI NOT RUN |
| X-10 | pointer damage manual recovery | §2.2/9.4 | 文件；recovery NOT RUN |
| X-11 | allowlist and CI separate NOT RUN | `PIPELINE_VALIDATION_STATUS.md` | GitHub CI/control checks NOT RUN |

## Claude 新 P2（M1–M13）

| ID | 結果 | 位置/補充 |
|---|---|---|
| M1 | 已處理 | §9.2 header precedence/line 1/double BOM；parser tests NOT RUN |
| M2 | 已處理 | §2.2 current pointer only，禁止「latest complete」判斷 |
| M3 | 已處理 | §9.5 ERROR_ALREADY_EXISTS 183、錯誤 3、attempt 16 次 |
| M4 | 已處理 | §9.3 disposition schema/key；triage 不改嚴重度/blocking/exit |
| M5 | 八項規則全部保留並逐項決策 | §9.6 |
| M6 | 已補規格/schema/fixtures | §9.4、`recovery_record.schema.json` + fixtures；HMAC 產生/金鑰生命週期 implementation NOT RUN |
| M7 | 已補 schema/推導 | §9.4 lifecycle event / sequence_recovered system event / ordering |
| M8 | 已補規格/schema/fixtures | §9.4、`failure_record.schema.json`; OS capture semantics implementation NOT RUN |
| M9 | 已補規格 | §9.4 UUID/sequence/hash/time/path/inventory；source byte length 在 schema |
| M10 | 已補對照 | §9.5/9.7；command mapping fixture NOT RUN |
| M11 | 已補 | §9.2/§7.4 blank/column_absent/gate5 blocking |
| M12 | 已補 | validation status獨立列全測試及 AUTHOR SELF-REVIEW |
| M13 | 已補 | §9.4 active lock, O(N) recovery scan, flush/probe；平台測試 NOT RUN |

## 7 項 v2.3.10 安全規則裁決

1. Crash-durable claim: **保留**；未做硬體/VM crash test 前禁止此宣稱。
2. Integer overflow: **保留並擴展**到 bytes/stat sums；checked uint64 fail closed。
3. Missing counter: **保留並收窄**至空 vault one-time initialize 1。
4. JSON string escaping/integer: **保留** RFC 8259/canonical; reject non-finite numbers.
5. Reader scans builds: **保留禁止**，只依已驗 pointer。
6. Reader old build delete sharing: **保留** FILE_SHARE_DELETE + read-only handle。
7. Old build GC: **保留不自動刪 sealed builds**。
8. Pointer temp cleanup: **保留**只有 owner/recovery持 publish lock 清理。

## P0 — 未解除

P0 授權、Public Repository 完整歷史安全掃描、Branch Protection/Rulesets、CODEOWNERS、publish allowlist、CI 驗證保持 OPEN/NOT RUN。此修訂不授予公開發布權，不修改 main、不建 PR、不實作 Parser。

新增自我交叉審閱：AUTHOR SELF-REVIEW，不能視為 Claude 獨立複審。
