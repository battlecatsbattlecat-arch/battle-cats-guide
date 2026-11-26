# PIPELINE_VALIDATION_STATUS.md — 驗證狀態清冊

本文件嚴格區分各項工作的真實狀態，避免將「規格文字審查」或「舊版原型測試」誤認為「正式實作已驗證」。

---

## 一、已實際執行並確認（Read-Only Observed）

以下項目皆於本機直接執行唯讀檢查並觀察到實際輸出：

1. **Task 001 檔案盤點與備份一致性**
   - 確認 `C:\Users\user\.gemini\antigravity\scratch\battlecatsinfo\data-pipeline\` 包含 20 個檔案與 5 個子目錄，與同層 `data-pipeline.7z` 內容一致（`tar -tf`）。
   - 確認本機尚未建立 `.git` 目錄，環境未安裝 `git`。
2. **來源檔案雜湊核對（本機自洽檢查，非上游交叉驗證）**
   - 以 `Get-FileHash -Algorithm SHA256` 確認 `source/checksums.json` 中 7 個檔案（`cat.tsv`、`catstat.tsv`、`tcat.tsv`、`units_scheme.json`、`combos.tsv`、`combos_scheme.json`、`collab.json`）與磁碟檔案相符；並計算出未列入該檔的 `medal.tsv` 與 `tmedal.tsv` 之 SHA-256。
3. **原始 TSV 純 TAB 切分結構觀察（Task 001 第三輪唯讀檢查）**
   - `cat.tsv`：889 行（1 標頭 + 888 資料），全部 20 欄。
   - `catstat.tsv`：2,190 行（1 標頭 + 2,189 資料），全部 26 欄；`id` 範圍 `0..887`（888 個唯一值）、連續出現，且與 `cat.tsv#form_count` 筆數吻合。
   - `tcat.tsv`：889 行（1 標頭 + 888 資料），888 行為 4 欄、**第 359 行（`tcat_row_index=357`）為 5 欄**。
   - `cat.tsv` 特定欄位空白數（純 TAB 切分）：`orb_count` 空 695 筆（0 筆字面 `"0"`）、`egg_id` 空 862 筆（26 筆非空）、`max_plus_level_tw` 空 81 筆（發現舊 `Import-Csv` 於第 889 行對無尾端換行空欄回傳 `$null` 導致少算 1 筆之風險）。
   - `catstat.tsv` 與 `tcat.tsv` 跨語系混用實證：全表 174 列 `name_jp` 為空；`cat_id=886`、`887` 的 `name_tw`/`description` 含日文，`tcat.tsv` 第 889 行為 `"888_1"`。
4. **`units_scheme.json` 結構盤點**
   - 確認頂層 13 個鍵與基本型別（`rarities` 6 元素、`xp_curves` 5 鍵、`levelcurves` 8×20、`limited_cats` 395、`cat_guide_ids` 861 等）。
5. **公開 GitHub Repository（`battlecatsbattlecat-arch/battle-cats-guide`）唯讀存取確認**
   - 透過 GitHub REST API 確認該 Repo 為 `public`（HTTP `200`）、預設分支 `main`，並取得根目錄與 `docs/`、`data-pipeline/` 目前清單。
6. **Task 001 舊版原型測試（已過時，不代表 v2.3.9）**
   - 舊版 `tests/test_sample_validation.ps1` 對舊版 `parsed/sample_30.json` 執行通過 19/19 斷言。

---

## 二、僅完成文字邏輯審查（未實作、未執行程式）

以下項目僅存在於規格文件（`PIPELINE_SPEC_v2.3.9.md`）中，**尚未撰寫任何程式碼，亦未通過任何實測**：

- `v2.3.8` 前之核心架構與大部分規則經 Claude 獨立文字審查通過；`v2.3.9` 對以下 5 項之最新局部修訂**尚未經外部最終複審**：
  1. Win32 `CreateDirectoryW` 排他目錄建立與統一 `attempt-<seq>-<uuid_v4>` 命名。
  2. `rights_class` 修正為 6 種分類。
  3. ASCII `strict_int` 正則 `^(0|-?[1-9][0-9]*)$`。
  4. 版本化 `builds/<build_id>/parsed/` ＋ 原子指標 `parsed_current.json` 發布機制。
  5. `source/checksums.json` 實體儲存位置與雙重身分規則。

---

## 三、尚未執行與未驗證項目（`pending`）

1. **規格最終凍結確認**（Pending Claude / Codex 對 v2.3.9 複審）。
2. **Public Repo 歷史檢查、Branch Protection / Rulesets、`CODEOWNERS` 與 `publish_allowlist.json` CI 建置**。
3. **隔離舊版 `verify_checksums.ps1`**。
4. **12 步驟來源錨定與 `-Anchor`**（Commit API、完整遞迴 Tree API、`LICENSE` 確認、9 檔路徑與 Blob SHA-1、暫存重下載逐位元組比對）。
5. **錨定後正式步驟 0 與 `-Finalize`**（10 檔 BOM/EOL/嚴格 UTF-8/全欄位 Profile、第 359 行正式基準）。
6. **新版腳本實作與全套自動化測試**：
   - `verify_source.ps1`（`-Init` / `-Verify` / `-Anchor` / `-Finalize` + OS 獨占鎖 + `CreateDirectoryW` + Exit Code 負面測試）。
   - `parse_units.ps1`（純位元組切割 + 逐行嚴格 UTF-8 + 五類物理行 + 原子版本化發布）。
   - `tests/fixtures/` 合成測資（空檔、單 BOM、LF/CRLF/混合、裸 CR、無效 UTF-8、非 ASCII Unicode 數字、未登記 `rule_id`）。
   - `test_roundtrip_raw.ps1`、`test_column_mapping.ps1`、`test_reproducibility.ps1`。
7. **上游前端 JS 閱讀與遊戲數值公式／語意驗證**（所有 `G-01`～`G-10` 項目）。
