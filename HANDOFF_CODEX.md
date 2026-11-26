# HANDOFF_CODEX.md — Battle Cats 資料管線交接文件（移交 Codex 技術收尾）

- **交接日期**：2026-11-26（Asia/Taipei, UTC+8）
- **交接狀態**：規格已修訂至 **v2.3.9**（**尚未正式凍結**，待最終技術確認後始可凍結）
- **目標專案**：`https://github.com/battlecatsbattlecat-arch/battle-cats-guide`（目前為 **Public** Repository，預設分支 `main`）
- **Antigravity 當時環境限制**：Antigravity 工作環境未安裝 `git` 執行檔，亦未成功載入 GitHub MCP 寫入工具；因此文件最初僅產生於本機 `handoff/` 目錄。**後續已由使用者透過 GitHub Web UI 上傳至 `codex/pipeline-handoff` 分支，並由 ChatGPT GitHub 連線逐一讀取確認。**

---

## 一、交接檔案清單（已提交至 GitHub 分支 `codex/pipeline-handoff`）

1. `HANDOFF_CODEX.md` — 本交接總覽、進度、分工、限制與 Codex 接手步驟。
2. `PIPELINE_SPEC_v2.3.9.md` — **v2.3.9 完整自足技術規格**（涵蓋全部核心規則、狀態機、OS 獨占鎖、`CreateDirectoryW`、五類物理行、逐位元組回放、ASCII `strict_int`、`catstat ↔ tcat` 關聯、公開／私有邊界與授權分類）。
3. `PIPELINE_CHANGELOG.md` — Task 001 → v1 → v2.1 → v2.2 → v2.3 → v2.3.1 → v2.3.2 → v2.3.3 → v2.3.4 → v2.3.5 → v2.3.6 → v2.3.7 → v2.3.8 → v2.3.9 完整版本演進與獨立審查意見記錄。
4. `PIPELINE_OPEN_ISSUES.md` — 所有尚未解決之技術問題、爭議點、授權風險與欄位語意待研究清單。
5. `PIPELINE_VALIDATION_STATUS.md` — 嚴格區分「已實際驗證」、「僅文字邏輯審查」、「尚未執行（`pending`）」之項目清冊。

---

## 二、原始資料來源與本機檔案路徑

### 1. 上游資料來源
- **Repository URL**：`https://github.com/battlecatsinfo/battlecatsinfo.github.io`
- **記錄快照 Commit SHA**：`9441997393ebe2bd7fb2e9b19a97eed7d7b4a3ee`
- **記錄 Commit 時間**：`2026-11-23T14:40:18Z`（註：尚未透過步驟 1 API 重新區分 `author_date_utc` 與 `committer_date_utc`）
- **下載日期**：`2026-11-24`（透過 PowerShell `Invoke-WebRequest` 下載）

### 2. 本機工作目錄（不可任意修改 `source/`）
- **本機專案根目錄**：`C:\Users\user\.gemini\antigravity\scratch\battlecatsinfo\`
  - `data-pipeline/source/`：包含 9 個上游資料檔（`cat.tsv`、`catstat.tsv`、`tcat.tsv`、`units_scheme.json`、`collab.json`、`combos.tsv`、`combos_scheme.json`、`medal.tsv`、`tmedal.tsv`）與 1 個 Task 001 本機產生檔（`checksums.json`）。
  - `data-pipeline/scripts/verify_checksums.ps1`：**已知具覆寫 `source/checksums.json` 副作用之舊腳本，必須於來源錨定前隔離或移除**。
  - `data-pipeline/scripts/parse_cats.ps1`：Task 001 舊版原型（使用 `Import-Csv`、補 `orb_count=0`、靜默 fallback `max_plus_level_tw`、含動態時間戳），**將由 v2.3.9 新版 `parse_units.ps1` 取代**。
  - `data-pipeline/parsed/sample_30.json`：Task 001 舊版 30 筆樣本輸出（僅供參考，非 v2.3.9 輸出）。
  - `data-pipeline/tests/test_sample_validation.ps1`：Task 001 舊版 19 項斷言測試（僅測舊版 `sample_30.json`）。
  - `data-pipeline.7z`：Task 001 備份壓縮檔（248,869 bytes）。
- **GitHub API 暫存檔**：`C:\Users\user\.gemini\antigravity\scratch\bc_commit.json`（25,783 bytes，Task 001 下載之 HEAD commit JSON）。

### 3. 公開 GitHub Repository 現況（`battlecatsbattlecat-arch/battle-cats-guide`）
經唯讀 GitHub REST API 查詢（2026-11-26）：
- `visibility: public`，`default_branch: main`。
- 根目錄現有檔案：`AGENTS.md`、`AI_TEAM_ROLES.md`、`ARCHITECTURE.md`、`CURRENT_TASK.md`、`DECISION_LOG.md`、`DEVELOPMENT_RULES.md`、`README.md`。
- 根目錄現有資料夾：`docs/`（含 `PROJECT_OVERVIEW.md`、`reports/`、`research/` 與 6 份 PDF）、`data-pipeline/`（目前僅含 `README.md`）。

---

## 三、重要技術決策摘要（不可推翻之既有共識）

1. **語言與遊戲地區徹底分離**：`_tw`、`_jp` 欄位名稱僅能作為 `source_label`，在取得上游固定 Commit 前端 JS 或遊戲實測證據前，`scope` 一律為 `"unknown"`（已實測 `catstat.tsv` id=886/887 之 `name_tw` 與 `description` 含日文，且全表 174 列 `name_jp` 為空）。
2. **嚴禁靜默 Fallback 與補 0**：`orb_count` 空字串（695 筆）與 `max_plus_level_tw` 空字串（81 筆）必須保留 `raw=""` 與 `parsed=null`，不得補 0 或借用日版數值。
3. **純位元組層級讀取（淘汰 `Import-Csv`）**：使用 `ReadAllBytes` → 剝除 BOM → `0x0A` 切物理行 → 分離結尾單一 `0x0D` → 檢查裸 CR / 空白行 → 逐行獨立嚴格 UTF-8 解碼（`UTF8Encoding($false, $true)`）。
4. **五類互斥物理行與統一 `physical_line`**：`header_row`、`data_row`、`isolated_row`、`rejected_row`、`blank_row` 全部保存 1-based `physical_line`、`byte_offset`（0-based 含 BOM）、`line_eol`；統計公式嚴格 1-to-1 對應，不混計單位／形態數。
5. **雙 Manifest 與單向狀態機**：`source_manifest.json`（僅 `-Init`、`-Anchor`、`-Finalize` 持 OS 獨占鎖 `FileShare.None` 單向更新）與 `build_manifest.json`（每次建置產生）分離；`parsed/` 採版本化 `builds/<build_id>/parsed/` ＋ 原子切換 `parsed_current.json` 發布。
6. **Public vs Private 嚴格邊界**：在授權未釐清前，`source/`、`source_snapshots/`、`builds/`、`parsed_current.json`、完整 `anomalies/` 與含原文之報告**嚴禁推送至公開 GitHub Repository**。

---

## 四、嚴格限制（Codex 接手時必須遵守）

- ❌ **不可**直接開始實作 Parser，必須先完成：**規格凍結確認 → Public Repo 歷史檢查與保護設定 → 隔離舊 `verify_checksums.ps1` → 來源錨定與 `-Anchor` → 正式步驟 0 與 `-Finalize`**。
- ❌ **不可**修改或覆寫 `data-pipeline/source/` 內既有檔案。
- ❌ **不可**將尚未執行的項目或僅經文字審查的規則標記為「已實際驗證通過」。
- ❌ **不可**在公開 Repository 測試中使用上游真實原文，測試資料須用 `tests/fixtures/` 合成測資。

---

## 五、Codex 接手起點（建議執行順序）

1. **檢視並確認 v2.3.9 規格無剩餘阻斷問題**：先核對 `PIPELINE_SPEC_v2.3.9.md` 與 `PIPELINE_OPEN_ISSUES.md`，確認是否需做最終微調後正式凍結規格。
2. **檢查公開 Repo 歷史與安全護欄**：在具備 `git` 與 GitHub 權限的環境下，檢查 `battlecatsbattlecat-arch/battle-cats-guide` 完整 Git 歷史是否乾淨，並配置 Branch Protection / Rulesets、`CODEOWNERS`、`.gitignore`、`registry/publish_allowlist.json` 與敏感資料掃描 CI。
3. **隔離舊腳本與實作 `verify_source.ps1`**：停用／移除舊 `verify_checksums.ps1`，依 v2.3.9 第 3 節實作 `-Init`、`-Verify`、`-Anchor`、`-Finalize`（含 OS 獨占鎖、`CreateDirectoryW` 排他目錄建立與 `attempt-<seq>-<uuid_v4>`），並先以負面測試與合成環境驗證 PowerShell 版本及 `FileSystem` Provider 行為。
4. **執行 12 步驟來源錨定與 `-Anchor`**：向 GitHub API 查詢 Commit `9441997393ebe2bd7fb2e9b19a97eed7d7b4a3ee` 與完整 Tree（保存原始回應），比對 9 份上游檔實際路徑與 Blob SHA-1、確認根目錄 `LICENSE`、重新下載比對後升級 `bootstrap_trust` 為 `anchored`。
5. **執行正式步驟 0 與 `-Finalize`**：對已錨定快照產出正式位元組 Profile、50 欄 `field_registry.json`（含 `type_range` 與 `snapshot_observed_range`）、`expected_anomalies.json`（第 359 行實測基準），並執行 `-Finalize` 升級為 `formal`。
6. **最後才實作新版 Parser（`parse_units.ps1`）與全套自動化測試**：包含 `test_roundtrip_raw.ps1`、`test_column_mapping.ps1`、`test_reproducibility.ps1` 與合成異常測資（空檔、單 BOM、裸 CR、無效 UTF-8、非 ASCII Unicode 數字、未登記 `rule_id`）。
