# PIPELINE_VALIDATION_STATUS.md — 驗證狀態清冊

狀態標籤：`PASS` 僅代表實際執行並通過；`FAIL` 實際執行但失敗；`NOT RUN` 未執行；`BLOCKED` 因環境／權限無法執行。文字審查不等於測試。

## 歷史已執行觀察（來自既有交接紀錄；不代表 v2.3.10 測試）

- Task 001 歷史紀錄曾確認來源檔雜湊自洽、TSV 行／欄觀察、scheme JSON 基本結構、Public repo 唯讀可達。
- 舊版 `test_sample_validation.ps1` 曾對舊版 `sample_30.json` 通過 19/19 斷言；該結果不驗證 v2.3.9/v2.3.10。
- 既有交接紀錄指出歷史工作目錄當時沒有 Git；本次接手另以乾淨 clone 取得 `codex/pipeline-handoff`，clone 時 HEAD 為 `a1717bb`。這只證明工作分支可讀，不是 parser 或安全測試。

## v2.3.10 文件修訂（人工規格檢視；非程式測試）

- 已新增 `PIPELINE_SPEC_v2.3.10.md`，並新增 `PIPELINE_CHANGELOG_v2.3.10.md`、`PIPELINE_CODEX_REVIEW.md`，更新 `PIPELINE_CHANGELOG.md`，更新本清冊與 `PIPELINE_OPEN_ISSUES.md`。
- 規格仍為草案，待獨立審查，未凍結。
- 本次修改未寫 Parser、未操作 source、未修改 main。

## 文件檢查（非程式測試）

- `git diff --cached --check`：PASS，未回報空白錯誤或 conflict marker。此項僅是 diff 格式檢查，不代表規格行為或 Parser 測試通過。
## 測試清單 — 全部 NOT RUN

| 項目 | 狀態 | 原因／下一步 |
|---|---|---|
| build candidate→complete→published 狀態機 | NOT RUN | 尚無 publisher 實作；先實作後做失敗注入 |
| 首次發布、兩個 publisher 並行、generation/tie-break | NOT RUN | 尚無 publisher；需 Windows 整合測試 |
| 同卷 replace、讀者持有 handle、replace 失敗復原 | NOT RUN | 目標平台／檔案系統尚未驗證 |
| Crash-durability / flush/write-through | NOT RUN | 不宣稱已具 crash durability |
| 指標 schema、路徑 containment、Manifest/file SHA reader 驗證 | NOT RUN | 尚無 reader/publisher implementation |
| `raw_line_base64` LF/CRLF/NONE roundtrip | NOT RUN | 尚無 Parser/測試 fixtures |
| 裸 CR、invalid UTF-8、blank、BOM-only、空檔及 mixed EOL roundtrip | NOT RUN | 尚無 Parser/測試 fixtures |
| TSV trailing/adjacent empty fields、異常欄數 roundtrip | NOT RUN | 尚無 Parser/測試 fixtures |
| Unicode 數字 placeholder 負面 regex fixtures | NOT RUN | 尚無測試程式；需測 Arabic-Indic、Devanagari、Fullwidth、mixed |
| 物理行所有邊界統計等式 | NOT RUN | 尚無結構分析器與 fixtures |
| `CreateDirectoryW` 父目錄／183 race／reparse/path containment | NOT RUN | 尚無 P/Invoke 程式，需在 Windows 測試 |
| 多重診斷收集及 PowerShell `-File` exit code | NOT RUN | 尚無 verifier 實作 |
| Public repo 完整歷史掃描 | NOT RUN | 未執行完整歷史 blob/tree 掃描 |
| Branch Protection / Rulesets / CODEOWNERS / required CI 驗證 | NOT RUN | GitHub repository settings 尚未取得可驗證證據 |
| 固定來源 Commit LICENSE 及再散布權利 | NOT RUN | 法律／上游授權狀態仍未確認 |
| 來源錨定、正式 step 0 與 `-Finalize` | NOT RUN | 尚未執行 |

## P0 與未解項目

Public Repository 歷史安全、Branch Protection/Rulesets、CODEOWNERS/allowlist/CI 與固定上游 LICENSE／遊戲資料再散布權利仍為阻斷項目。上游遊戲語意 G-01 至 G-10 亦未驗證。細節見 `PIPELINE_OPEN_ISSUES.md`。
