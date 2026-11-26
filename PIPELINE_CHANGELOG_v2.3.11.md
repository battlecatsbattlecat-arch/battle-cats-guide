# PIPELINE_CHANGELOG_v2.3.11.md

- 日期：2026-11-26
- 狀態：文件修訂草案，等待 Claude 獨立複審；未凍結。
- 基礎：v2.3.10；本版只修訂規格與審查追蹤文件。

## 修訂摘要與前後差異

| 範圍 | v2.3.10 缺口 | v2.3.11 修訂 |
|---|---|---|
| Physical lines | 空檔/header 規則、同列多錯優先序及 bytes 對帳式不足 | 檔案級 blocking、header 僅第 1 行、每行單一 primary reason、BOM/payload/EOL 恆等式與完整邊界例。 |
| Sequence allocation | lock 範圍、消耗痕跡、counter 損毀及 crash recovery 不完整 | OS lock 範圍、ledger-before-counter commit、唯一性保證、所有崩潰窗口、lease、GC 及復原程序。明確分析 ledger 設計與寫入順序；counter 為可恢復 cache。 |
| Lifecycle / sealing | candidate/complete/failed、failure record、seal/receipt 狀態不一致 | 外部 failure record/event、狀態合法轉換、完整 inventory/ACL/rename gate、sealed immutable、receipt/reconciliation。 |
| Anomalies | 共用檔案可能跨 build 污染 | anomalies 存在 build 私有 staging/sealed artifacts，納入 manifest inventory/hash。 |
| Schema | formal manifest/sequence 等 JSON 結構不完整 | §7 增補 build manifest、sequence、allocation、lifecycle event、failure、parsed_current、recovery JSON Schema。 |
| Error semantics | 10/13、unexpected isolated、工具適用範圍不清 | §3.2 定義 payload mismatch 與 control-integrity 邊界、exit priority 與每工具 error_id 範圍。 |
| Latest/publication | latest 及 provisional gate 不清 | current 僅由有效 pointer 定義；列出完整 10 項 gate；provisional 禁止指標發布。 |
| CreateDirectoryW | error 3、父層競爭、重試及 TOCTOU 不清 | §3.3 區分 parent/terminal operation，限制重試並說明 threat model。 |
| Regex/config/recovery | .NET regex anchor、規格自足邊界、pointer corruption recovery 不清 | 使用 `\A`/`\z` 和 ASCII `[0-9]`；說明 versioned private config；加入人工 pointer recovery procedure。 |
| P0 / CI | allowlist 與 CI 狀態容易與規格敘述混淆 | allowlist、CI 與 Public Repo controls 明列為未驗證 P0/NOT RUN，沒有解除。 |

## 狀態機更新

1. Allocation: ledger atomic no-replace rename 是 sequence 消耗點；永不重用。Counter 落後可從 ledger 恢復；無法安全判定上界就 fail closed。
2. Build: `allocated → building → failed | sealed`；`sealed → published | publish_failed | stale`。事件外置；sealed build 不回寫。
3. Manifest: staging candidate → gates pass 後 complete → ACL/inventory 驗證與 no-replace rename 後 sealed。`parsed_current` commit 才表示 published。
4. Pointer: first publish no-replace；其後 verified atomic replace；generation 單調增加。高序號先成功使低序號後續 stale。

## JSON Schema 及規範位置

完整 JSON Schema 位於 `PIPELINE_SPEC_v2.3.11.md` §7.1–§7.3：`build_manifest.json`、`build_sequence.json`、allocation record、lifecycle event、failure record、`parsed_current.json`、recovery record。外部 config 的 schema contract 與 publication gates 見 §7.4。Schema 實際 validator 尚未執行。

## 新增要求之測試案例

- 物理行：0-byte、BOM-only、首行空白而第二行像合法 header、全空行、重複 U+FEFF、LF/CRLF/NONE、裸 CR、invalid UTF-8。
- TSV：首空欄、連續空欄、尾端／多尾端空欄、TAB-only、少欄、多欄、混合 EOL、NONE。
- Regex：Arabic-Indic、Devanagari、Fullwidth 及 ASCII/Unicode 混合數字拒絕。
- 序號：併發 allocator、ledger/counter/lease/event/staging 多個 crash point、損毀 counter 復原、lock timeout、GC live lease/orphan。
- Publish/lifecycle：高序號先發與低序號 stale、首發 race、兩 publisher、replace failure、讀者驗證、failure/receipt/event crash、sealed inventory 不符、pointer 人工 recovery。
- CreateDirectoryW：父目錄缺失、183 race、錯誤 3、其他 Win32 error、reparse/path escape、重試上限。
- 錯誤：多類 diagnostics 完整收集與 exit precedence。

以上均為測試需求；本次沒有執行這些測試，狀態見 `PIPELINE_VALIDATION_STATUS.md`。

## 未解問題及嚴重程度

- **P0 OPEN**：Public Repo 歷史安全掃描、Branch Protection/Rulesets、CODEOWNERS/allowlist/CI、LICENSE 及再散布權利。
- **P1 OPEN（驗證／實作）**：所有 Parser、publisher、CreateDirectoryW、sequence、lifecycle 與讀者行為均尚未實作或驗證。
- **P2 OPEN（覆蓋／資料）**：規定的 synthetic fixtures 尚未執行；versioned registry/rules/expected anomaly input 尚需建立與 hash pin。
- **G-01 至 G-10 OPEN**：遊戲欄位語意仍未確認。

Claude 報告摘要聲稱 11 個 P2，但明細可辨識 14 個 P2（L-3/L-4、B-4/B-5/B-6、X-3 至 X-11）。本次對照表逐項處理所有明細，不以摘要計數刪減範圍。

規格草案未凍結；等待 Claude 獨立複審。
