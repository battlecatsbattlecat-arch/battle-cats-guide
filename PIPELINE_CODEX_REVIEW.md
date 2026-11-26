# PIPELINE_CODEX_REVIEW.md — v2.3.10 文件修訂審查紀錄

- 審查範圍：第一階段獨立審查提出的 P1/P2 規格缺口。
- 狀態：文件層已作對應修訂；v2.3.10 仍待獨立審查，未凍結。
- 執行範圍：僅修改文件，沒有實作 Parser、操作 source、執行平台測試或修改 `main`。

## 第一階段問題逐項處理

| 第一階段發現 | v2.3.10 處理 | 實作驗證狀態 |
|---|---|---|
| P1 build_manifest / parsed_current 狀態及提交順序不一致 | `build_manifest.build_state` 定義 candidate→complete；published 僅由成功提交指標表示，`record_class` 不再代替發布狀態。complete build 可未發布；Manifest 封存，不回寫發布狀態。失敗及復原順序已逐步定義。 | NOT RUN：無 build/publisher 實作 |
| P1 首次發布、並行發布、tmp、鎖、替換失敗、reader 驗證未定義 | 增加發布鎖、UUID 唯一 tmp、首發 no-replace rename、後續同卷原子 replace、build sequence allocation、generation compare、防回退、替換前後失敗處理、讀取端路徑與雜湊 fail-closed 驗證及舊 build 保留規則。 | NOT RUN：未在 Windows／目標檔案系統測原子性、鎖或 crash durability |
| P1 `raw_line_base64` 是否含 EOL 不清楚 | 固定為 payload bytes，不含 LF/CRLF delimiter；回放先解碼 payload 再依 `line_eol` 補 bytes。新增裸 CR、無效 UTF-8、blank、EOF NONE、BOM、混合 EOL 邊界。 | NOT RUN：未執行 bytes roundtrip |
| P1 TSV 原始欄位序列化規則未充分指定 | 明定無 quote/escape、strict UTF-8、TAB split 保留尾端／連續空 token、不正規化、異常欄數保存整行 bytes；增加合成 fixture 清單。指出單欄空值與 blank 無法區分，該資料形態不受此 dialect 支援。 | NOT RUN：未執行欄位 roundtrip / fixtures |
| P1 `CreateDirectoryW` 父目錄與競爭流程缺漏 | 增加父路徑逐段建立、`ERROR_ALREADY_EXISTS` 後目錄/reparse/root containment 驗證、父路徑消失處理、attempt UUID/seq 重試上限、只有最後一層回 true 才證明所有權、failure JSON CreateNew。 | NOT RUN：未執行 Win32 P/Invoke 行為測試 |
| P2 物理行統計邊界案例不足 | 明定 empty、BOM-only、BOM+LF、空/錯誤/缺失 header、header unavailable 後續列、連續 separator、trailing EOL、NONE 末行及 index 不適用規則。 | NOT RUN：未執行統計測試 |
| P2 placeholder 數字 regex 使用 `\d` | 改為 `^[0-9]+_[0-9]+$`；加入 Arabic-Indic `١`、Devanagari `१`、Fullwidth `１`、混合數字負面測試要求。 | NOT RUN：未執行 .NET regex 測試 |
| P2 多重錯誤及 exit code 優先序定義不足 | 定義診斷欄位、可安全繼續時累積錯誤、fatal stop 情況、選碼優先 `13 > 11 > 12 > 10 > 14 > 0` 並保留所有診斷。 | NOT RUN：未執行 PowerShell `-File` exit mapping 測試 |

## 保留的 P0 阻斷事項

1. Public Repository 完整 Git 歷史原始資料掃描未完成；目前仍未有可證明安全的歷史審計結果。
2. Branch Protection / Rulesets 實際設定、必要審核、required CI 尚未驗證；`CODEOWNERS`、publish allowlist 及掃描 workflow 仍待建立／驗證。
3. 固定上游 Commit 的 `LICENSE` 與遊戲資料／第三方內容再散布權利尚未釐清。`rights_class: unknown` 的資料與衍生物仍不得公開。

## 測試聲明

本次沒有執行自動化測試。以上「處理」僅指規格文字已新增／修訂，不代表其程式行為已驗證。各項測試均為 NOT RUN；詳見 `PIPELINE_VALIDATION_STATUS.md`。
