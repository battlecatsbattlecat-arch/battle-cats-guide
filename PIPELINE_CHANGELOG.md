# PIPELINE_CHANGELOG.md — 版本修訂歷史與獨立審查意見彙整

本文件記錄 Battle Cats 資料管線從 Task 001 起至今（v2.3.12）的版本演進與審查脈絡，供接手 AI 追蹤每個設計決策的由來。

---

## 一、版本演進總表

| 版本 | 日期 | 主要內容與里程碑 |
|---|---|---|
| **Task 001 (v1.0.0-draft)** | 2026-11-24 | 完成來源下載（Commit `9441997393ebe2bd7fb2e9b19a97eed7d7b4a3ee`）、產生 `cat.tsv` 等 9 個資料檔 + `checksums.json`、`parse_cats.ps1`、`sample_30.json`（30 筆測試 19/19 通過）與 5 份研究報告。 |
| **第 2–3 輪唯讀核查** | 2026-11-25 | 揭露舊 `verify_checksums.ps1` 會覆寫 `checksums.json`、`medal.tsv`/`tmedal.tsv` 漏檢、`orb_count` 空字串被補 0、`max_plus_level_tw` 靜默 fallback、`tcat.tsv` 第 359 行 5 欄異常、`cat_id=886/887` 跨語系混用與 174 列 `name_jp` 為空。 |
| **v2 / v2.1** | 2026-11-25 | 導入六層架構、`field_registry.json`、`scope` 與 `source_label` 分離、取消 `Import-Csv` 改純 TAB 切分、移除 `parsed/` 牆鐘時間戳。 |
| **v2.2** | 2026-11-25 | 拆分 `source_manifest.json` 與 `build_manifest.json`、取消 `-Update`、定義 `status`×`evidence_level`、`presence`×`parse_status`、三條關聯分離、第 359 行基準與異常結構。 |
| **v2.3** | 2026-11-25 | 補齊 10 檔清單、12 步錨定程序、`tree.sha`/`truncated` 檢查、`raw_line_sha256`、固定嚴重度 `anomaly_rules.json`、逐格發布閘門與移除冗餘 `unit_scoped_values.json`。 |
| **v2.3.1** | 2026-11-25 | 明確 Public Repo 禁止公開 `source/`、區分錨定前初步檢查與錨定後正式步驟 0、導入完整遞迴 Tree 驗證 `actual_repo_path`、`anomaly_dispositions` 序號事件流、補全 `nullable:false` 矩陣。 |
| **v2.3.2** | 2026-11-25 | 整合為單一自足規格；新增 `publish_allowlist.json`、`rights_class`、`record_class`；改為 JSONL 處置流、單一異常工廠、`builds` 暫存原子寫入、區分 `type_range` 與 `snapshot_observed_range`。 |
| **v2.3.3** | 2026-11-25 | 新增 `-Anchor` 單向狀態機、解除本機 Private Vault 對 Git CI 強制依賴、補 `line_eol` 與 `raw_line_base64` 逐位元組回放、定義全域 `tcat` 唯一性、`CODEOWNERS` 保護、修正 `local_generated_metadata` 與 `reported_commit_timestamp_utc`。 |
| **v2.3.4** | 2026-11-25 | 新增 `-Finalize` 正式升級模式、細分 Private Vault 各目錄權限、補 7 種物理行切割邊界、排除 `tcat` 同列重複匹配、要求 Branch Protection / Rulesets、定義 `isolating` 統計與揭露義務。 |
| **v2.3.5** | 2026-11-25 | 定義 `catstat_record` 與 `form_index` 取得依據、物理行三分類（`header_row`、`data_row`、`isolated_row`）、0-based 含 BOM `byte_offset`、失敗目錄 `attempt-NNNN`、分檔物理行統計公式、`-Finalize` 同檔案系統原子替換與並行防線。 |
| **v2.3.6** | 2026-11-25 | `-Init`/`-Anchor`/`-Finalize` 全程 OS 獨占鎖（`FileShare.None`）、`attempt` 併發原子建立與超 9999 擴位、區分 `catstat_id_count(s)`/`catstat_rows_in_id(k,s)`/`catstat_field_occurrences(k,s)`、定義裸 CR（`0x0D`）觸發 `blocking`。 |
| **v2.3.7** | 2026-11-25 | 新增第四類物理行 `rejected_row`、改用 128-bit UUID v4 `attempt_id`、恢復五項互斥物理行統計公式。 |
| **v2.3.8** | 2026-11-26 | 新增第五類物理行 `blank_row`、五類物理行全存 1-based `physical_line`、修正位元組切割先於逐行嚴格 UTF-8 解碼之順序衝突、補齊空白 CRLF `byte_offset`。 |
| **v2.3.9** | 2026-11-26 |改用 Win32 `CreateDirectoryW` 排他建立 `attempt` 目錄、統一 `attempt_id` 與目錄名稱（`attempt-<seq>-<uuid_v4>`）、修正 `rights_class` 為 6 種、修正 ASCII `strict_int` 正則 `^(0\|-?[1-9][0-9]*)$`、新增 `builds/<build_id>/` + `parsed_current.json` 原子發布與明定 `source/checksums.json` 實體位置。 |
| **v2.3.10** | 2026-11-26 | 草案修訂：定義 build candidate/complete 與 indicator published 狀態、build sequence/並行發布/原子替換/讀取驗證、raw payload Base64/TSV roundtrip、CreateDirectoryW 父目錄競爭、統計邊界、ASCII placeholder regex、多重診斷與 exit code。詳見 `PIPELINE_CHANGELOG_v2.3.10.md`；待獨立審查，未凍結。 |
| **v2.3.11** | 2026-11-26 | 回應 Claude v2.3.10 獨立審查：完善物理行/byte 對帳、sequence allocation ledger 與 crash recovery、build lifecycle/failure/seal/receipt、每 build anomalies、七類 JSON Schema、exit code 邊界、CreateDirectoryW 父層錯誤與競爭、pointer 人工復原及完整 publication gates。逐項對照見 `PIPELINE_CODEX_REVIEW.md`；修訂摘要見 `PIPELINE_CHANGELOG_v2.3.11.md`。草案待複審，未凍結；P0 未解除，實作與功能測試 NOT RUN。 |
| **v2.3.12** | 2026-11-26 | 回應 Claude v2.3.11 第二輪：修正 manifest Draft 2020-12 schema composition，新增 Ajv 8.20.0 + 58 synthetic fixtures 真實驗證；補 ACL sealed inventory/event hashes、provisional private terminal、parsed/config/header schemas、byte/TSV/line 契約、GC/recovery matrix 與保留安全規則。對照見 `PIPELINE_CODEX_REVIEW.md`；詳細修訂見 `PIPELINE_CHANGELOG_v2.3.12.md`。待獨立複審、未凍結；P0 保留，Parser/平台測試 NOT RUN。 |

---

## 二、v2.3.8 → v2.3.9 修訂對照

## 三、v2.3.10 修訂摘要（歷史）

v2.3.10 的詳細規格修訂見 `PIPELINE_CHANGELOG_v2.3.10.md`。Claude 對該版提出的問題及 v2.3.11 的逐項處理見 `PIPELINE_CODEX_REVIEW.md`；v2.3.10 不代表實作或平台測試通過。

## 四、v2.3.10 → v2.3.11 修訂摘要

詳細內容見 `PIPELINE_CHANGELOG_v2.3.11.md`；Claude 每項意見與先前審查問題的對照見 `PIPELINE_CODEX_REVIEW.md`。v2.3.11 是規格修訂草案，等待 Claude 獨立複審，尚未凍結。P0 Public Repository 歷史／防護及授權阻斷保持未解；規格文字修訂不代表實作或測試通過。v2.3.10 歷史修訂摘要見該版本文件。

## 五、v2.3.9 歷史審查紀錄

### Claude 對 v2.3.8 審查之主要發現與處理
1. **P1-2（實質問題）：`attempt` 目錄的建立證明不成立**
   - 原 v2.3.8 設計「先建目錄再建 `.attempt_created` 標記檔」存在程序 A/B 競爭漏洞。
   - **v2.3.9 修正**：改用 Win32 `kernel32.dll!CreateDirectoryW` 檢查回傳布林值與 `ERROR_ALREADY_EXISTS (183)`，並統一 `attempt_id` 與目錄名稱皆為 `attempt-<seq>-<uuid_v4>`。
2. **`rights_class` 數量文案不一致**
   - 原文寫「5 層權利」卻列 6 項；**v2.3.9 已修正為 6 種授權分類**。
3. **`strict_int` 正則未鎖定 ASCII**
   - 原 `\d` 在 .NET 會匹配 Unicode 數字；**v2.3.9 已修正為 `^(0|-?[1-9][0-9]*)$`**。
4. **`parsed/` 原子發布機制不完整**
   - 直接覆寫非空 `parsed/` 在 Windows 無法保證原子性；**v2.3.9 改採 `builds/<build_id>/parsed/` ＋ 單一指標 `parsed_current.json` 同檔案系統原子切換**。
5. **`checksums.json` 實體儲存位置未明定**
   - **v2.3.9 明定其實體位於 `source/checksums.json`**，納入本地 `source/` 10 檔唯讀防護與集合檢查，排除於 9 檔上游快照身分之外。

### v2.3.9 完成時的待複審狀態
- **v2.3.9 複審紀錄（歷史）**：v2.3.9 完成時尚待最終複審；後續審查意見見 `PIPELINE_CODEX_REVIEW.md`，目前 v2.3.11 仍待獨立審查。
