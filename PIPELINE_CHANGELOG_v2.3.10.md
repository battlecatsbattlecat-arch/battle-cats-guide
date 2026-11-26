# PIPELINE_CHANGELOG_v2.3.10.md — v2.3.10 修訂記錄

- 日期：2026-11-26（Asia/Taipei）
- 版本：v2.3.10 草案，待獨立審查，尚未凍結。
- 基準：`PIPELINE_SPEC_v2.3.9.md`

## 修訂內容

1. 將 `record_class` 與發布狀態拆開；定義 build `candidate` → `complete`，以及由已提交 `parsed_current.json` 表示的 `published` 狀態，避免將未發布 build 誤稱已發布及 build manifest 自我雜湊。
2. 定義完整 build 封存後的發布順序、OS 獨占發布鎖、唯一發布暫存檔、首次 no-replace rename、後續原子 replace、並行順位規則、失敗復原、讀取端 fail-closed 驗證及 GC 邊界。
3. 明定 `raw_line_base64` 僅含 payload bytes、不含 LF/CRLF；列明裸 CR、無效 UTF-8、空白行、混合 EOL、BOM、空檔、BOM-only、EOF 無尾 EOL 等邊界與 roundtrip 回放順序。
4. 定義 TSV 無 quote/escape 契約、保留尾端與連續空 token、欄數異常行 byte-preserving 回放，並揭露單欄空值與空白物理行不可區分的表達限制。
5. 擴充 `CreateDirectoryW` 父目錄逐層建立、競爭後屬性重驗、reparse/path containment 檢查、ERROR_ALREADY_EXISTS 重試、重試上限與 CreateNew failure 檔寫入規則。
6. 補齊物理行統計對空檔、僅 BOM、空／無效 header、header 缺失、分隔符相鄰、末尾 LF、無尾 EOL 的計數規則。
7. `catstat ↔ tcat` placeholder 判斷改用 ASCII `^[0-9]+_[0-9]+$`，並指定 Arabic-Indic、Devanagari、Fullwidth 與混合數字負面 fixtures。
8. 定義多重診斷收集、fatal stop 邊界及 exit code `13 > 11 > 12 > 10 > 14 > 0` 的選碼方式。

## 明確未改項目

- 未修改原始 source 資料、Parser 或 `main`。
- 未宣告規格凍結。
- 保留 Public Repository 歷史／Branch Protection / Rulesets / CODEOWNERS / CI 與來源授權的 P0 阻斷問題。
- 本版本僅修訂文字規格與驗證清冊；規格中的平台原子替換、Win32 與 roundtrip 規則尚待實作測試，不得視為實測通過。
