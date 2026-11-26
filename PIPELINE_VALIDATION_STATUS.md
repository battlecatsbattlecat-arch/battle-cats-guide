# PIPELINE_VALIDATION_STATUS.md — v2.3.11 驗證狀態

狀態標籤：`PASS` 僅代表確實執行並通過；`FAIL` 是實際失敗；`NOT RUN` 未執行；`BLOCKED` 無法執行。文字推理及文件審查不代表實作通過。

## v2.3.11 文件修訂範圍

- 已修訂規格、逐項 review、open issues、驗證清冊及總 changelog。
- 沒有實作 Parser／publisher/verifier，沒有修改 `main`、source 或發布解析產物。
- 文件草案等待 Claude 獨立審查，未凍結。

## 文件檢查

| 檢查 | 狀態 | 範圍 |
|---|---|---|
| 分支及起始工作樹檢查 | PASS | 確認 local branch 為 `codex/pipeline-handoff`；其上含 v2.3.10 提交，初始工作樹乾淨（v2.3.11 新文件除外）。 |
| 逐項文件交叉檢視 | PASS | 人工核對 L/B/F/X 對照及版本文件之間的聲明；這是文件審閱，不是 parser 測試。 |
| `git diff --cached --check` | PASS | 已對本次 staged 文檔差異執行，無 whitespace error 或 conflict marker。僅格式檢查。 |
| JSON Schema parser／validator | NOT RUN | 尚未以實際 Draft 2020-12 validator 驗證範例/Schema。 |

## 功能／整合測試 — 全部 NOT RUN

| 測試 | 狀態 | 尚需執行內容 |
|---|---|---|
| Empty bytes、BOM-only、line1 blank + line2 合法-looking header、全空行 | NOT RUN | 檢查 file-level diagnostics、header line 1 規則與行統計。 |
| BOM 後第二個 U+FEFF | NOT RUN | 驗證只剝除初始 BOM，其餘 bytes 留在 payload。 |
| LF、CRLF、無尾端 EOL、裸 CR、invalid UTF-8 | NOT RUN | 驗證 raw bytes replay、reason priority、offset 與 byte equations。 |
| TSV 連續空欄、尾端空欄、多尾空欄、TAB-only、少欄／多欄 | NOT RUN | 驗證 token 數、原始 bytes 與 EOL 完整 roundtrip。 |
| ASCII placeholder regex Unicode 負面集 | NOT RUN | Arabic-Indic、Devanagari、Fullwidth 及混合數字。 |
| 每行唯一 primary class/reason 與 rejected 優先序 | NOT RUN | 建立同一行多種錯誤的合成 fixtures。 |
| Line/BOM/payload/EOL byte 對帳 | NOT RUN | 每個 physical-line fixture 比較三個規格恆等式。 |
| Sequence ledger 原子 no-replace 與並行配置 | NOT RUN | 多程序競爭，確認唯一序號、無倒退與無重用。 |
| Sequence allocation crash window | NOT RUN | ledger rename 前後、counter write 前後、lease/event/staging 建立時終止程序。 |
| Counter corruption/recovery | NOT RUN | 損毀 bytes 保存、ledger 證據重建、證據不足 fail-closed。 |
| Lock timeout、巢狀順序與 GC lease | NOT RUN | OS lock 壓力、反向鎖死防止、live lease skip、orphan recovery。 |
| Stale 高序號先發布、低序號後到 | NOT RUN | 確認低序號失敗且不修改 sealed build/pointer。 |
| Lifecycle failure records/events | NOT RUN | 每個 write/rename/ACL/receipt crash window 與恢復。 |
| 首次 parsed_current 建立及並行 publisher | NOT RUN | 首發 no-replace race、lock timeout、generation compare。 |
| Atomic replace、讀者持有 handle、替換錯誤 | NOT RUN | 目標 Windows/filesystem 原子可見性、retry 與 pointer reread。 |
| Read-side manifest、inventory、artifact hash 驗證 | NOT RUN | missing/extra file、錯誤 hash、路徑穿越皆拒絕。 |
| parsed_current 損毀／缺失人工恢復 | NOT RUN | 保存證據、operator plan、原子恢復且 reader 停止條件。 |
| CreateDirectoryW 父路徑／183 race／錯誤 3／reparse | NOT RUN | Windows P/Invoke、重試上限與 path containment。 |
| 多重錯誤收集及 PowerShell `-File` exit mapping | NOT RUN | 錯誤並存時診斷完整、優先序 `13 > 11 > 12 > 10 > 14 > 0`。 |
| Public Repository 完整歷史安全掃描 | NOT RUN | 需完整歷史 tree/blob 掃描並留存可稽核結果。 |
| Publish allowlist 驗證 | NOT RUN | 獨立檢查所有追蹤檔是否屬 default-deny allowlist。 |
| CI / pre-push allowlist 與歷史掃描 workflow 驗證 | NOT RUN | 獨立執行 CI/pre-push gate，驗證負面 fixtures。 |
| Branch Protection / Rulesets / CODEOWNERS / required CI | NOT RUN | GitHub 設定與實際必要狀態檢查未取得證據。 |
| 上游 LICENSE 與遊戲／第三方資料散布權利 | NOT RUN | 尚未完成權利確認。 |
| Formal source anchoring 與 step 0 | NOT RUN | 尚未執行固定來源比對及 formal baseline。 |

## P0 與停止條件

Public Repo 完整歷史掃描、Branch Protection/Rulesets、CODEOWNERS/allowlist/CI、上游 LICENSE 與資料再散布權利維持 OPEN。未解除 P0，不得公開 source 或解析產物。本文件提交後等待 Claude 獨立審查；不進入 Parser 實作。
