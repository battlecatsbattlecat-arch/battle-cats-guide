# PIPELINE_OPEN_ISSUES.md — 尚未解決之技術問題與風險清單

> [!WARNING]
> 本文件列出**所有尚未解決或未經實測確認的問題**。在取得明確證據前，**嚴禁**將任何一項標記為已解決。

---

## 一、環境與流程阻斷問題（P0 — 開始實作前必須處理）

1. **v2.3.9 規格尚未完成最終獨立複審與凍結**
   - 影響：需確認 v2.3.9 對 `CreateDirectoryW`、`builds/<build_id>/` + `parsed_current.json`、`source/checksums.json` 之修訂無新缺陷後，始可正式凍結。
2. **本機環境缺少 `git` 與 GitHub 寫入權限**
   - 影響：目前本機無法執行 `git log` 歷史檢查、`.gitattributes` 設定或直接推送至 `battlecatsbattlecat-arch/battle-cats-guide`。
3. **Public Repository（`battle-cats-guide`）安全性與歷史檢查尚未完成**
   - 影響：目前預設分支 `main` 尚未設定 Branch Protection / Rulesets、`CODEOWNERS`、`registry/publish_allowlist.json` 與敏感資料 CI 掃描；亦尚未確認歷史提交是否完全無上游原始資料。
4. **舊版寫入型腳本 `data-pipeline/scripts/verify_checksums.ps1` 仍存在於工作區**
   - 影響：若被誤執行，將直接覆寫 `source/checksums.json`，破壞快照基準。必須在來源錨定前隔離或移除。
5. **12 步驟來源錨定與正式步驟 0 尚未執行**
   - 影響：
     - 本機 `source/` 9 個上游檔尚未與 Commit `9441997393ebe2bd7fb2e9b19a97eed7d7b4a3ee` 之 GitHub Tree API、`git_blob_sha1` 及重新下載位元組比對。
     - `bootstrap_trust` 仍為 `first_use`；`record_class` 仍為 `provisional`。
     - `author_date_utc` 與 `committer_date_utc` 尚未透過 Commit API 區分。
     - `medal.tsv`、`tmedal.tsv`、`checksums.json` 之正式 `source_manifest.json` 基準尚未建立（目前僅有 Task 001 期間的 `Get-FileHash` 檢查結果，尚未納入正式 Manifest）。
     - `tcat.tsv` 第 359 行（`tcat_row_index=357`）之 `raw_line_sha256`、`byte_offset` 及實際物理成因（是否為單純多餘 TAB 且前後列皆 4 欄）尚未於錨定後之正式步驟 0 產出基準。

---

## 二、授權與資料發布權利問題（P0/P1 — 影響公開與衍生發布）

1. **上游 Commit `9441997393ebe2bd7fb2e9b19a97eed7d7b4a3ee` 之 `LICENSE` 狀態未確認**
   - 影響：雖然上游 `master` 首頁顯示 MIT，但尚未查詢固定 Commit 根目錄樹確認該 Commit 當時是否已有 `LICENSE` 及其全文。
2. **遊戲原始資料與外部資源再散布權利未確認（`rights_class: "unknown"`）**
   - 影響：即使上游程式碼為 MIT，遊戲本體數值、文本與第三方轉載資料之著作權未必允許再散布。在釐清前，`source/`、`builds/`、`parsed_current.json` 嚴禁公開。

---

## 三、待驗證之遊戲語意與資料結構問題（需閱讀固定 Commit 上游 JS 或遊戲實測）

在解決下列問題前，相關欄位在 `field_registry.json` 僅能維持 `unverified` 或 `partially_verified`，**不可發布至正式網站**：

| 編號 | 問題項目 | 影響範圍 |
|---|---|---|
| **G-01** | `max_plus_level_tw` 空白（原始 TAB 統計 81 筆）之真實含義，以及無後綴 `max_plus_level` / `max_base_level` 之真實 `scope` | 台版／日版等級上限資料正確性 |
| **G-02** | `catstat.tsv` 之 `name_tw`、`description` 及 `tcat.tsv` 之 `en`、`kr` 真實地區歸屬；`cat_id=886/887` 含日文及 174 列 `name_jp` 空白之成因 | 多語言與台版名稱／說明發布閘門 |
| **G-03** | `cat_id=887`（及全表 888 筆）真實單位分類（是否為召喚精靈及是否還有其他非貓咪單位） | `derived/unit_hints.json` 與資料表拆分 |
| **G-04** | `tcat.tsv` 第 889 行 `888_1` 佔位符規則與 `tcat` 第 359 行異常成因 | 關聯診斷與異常處置 |
| **G-05** | `orb_count` 空白（695 筆、0 筆字面 `"0"`）語意與 `egg_id`（26 筆如 `0,1`）格式 | 欄位 `nullable` 與型別規則 |
| **G-06** | `ability`、`trait`、`immunity`、`talents`、`ability_enabled`、`version` 完整編碼與位元配置 | 技能／特性／才能結構化解析 |
| **G-07** | `cd`、`preswing_*`、`backswing`、`time_between_attacks`、`attack_frequency` 單位（是否 30 FPS）與 DPS 公式；`long_distance_2` 負數含義 | 戰鬥數值與 DPS 推導 |
| **G-08** | `xp_curve`（含 Lv11+ 計算）與 `level_curve`（`units_scheme.json` 8×20 陣列）計算公式 | 等級成長計算 |
| **G-09** | `limited_cats` 地區適用性、`cat_guide_ids` 含義、`rarities` 索引之遊戲內部語意 | 圖鑑排序與限定標記 |
| **G-10** | `cat.tsv` 全 20 欄與 `catstat.tsv` 全 26 欄完整空值／值域 Profile（含 `strict_int` 雙層範圍確認） | `field_registry.json` 正式定義 |

---

## 四、實作面待驗證技術細節

1. **Windows PowerShell 版本與 `CreateDirectoryW` P/Invoke 行為**：需實測確認 `CreateDirectoryW` 回傳值與 `Marshal.GetLastWin32Error()`（錯誤碼 `183`）在目標 PowerShell 環境下之表現。
2. **同檔案系統原子替換機制**：需實測確認 `source_manifest.json.tmp` → `source_manifest.json` 與 `parsed_current.json.tmp` → `parsed_current.json` 在 Windows 上之原子替換及並行鎖表現。
3. **跨環境可重現性**：需確認自訂 JSON 寫入器（或 `System.Text.Json.Utf8JsonWriter`）在不同機器／PowerShell 版本下產出完全一致的位元組雜湊。
