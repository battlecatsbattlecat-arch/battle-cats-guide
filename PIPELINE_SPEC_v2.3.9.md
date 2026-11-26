# PIPELINE_SPEC_v2.3.9.md — Battle Cats 資料管線完整自足規格（v2.3.9）

- **規格狀態**：待最終技術確認後凍結（**尚未凍結**）
- **上游來源目標**：`https://github.com/battlecatsinfo/battlecatsinfo.github.io`
- **目標快照 Commit**：`9441997393ebe2bd7fb2e9b19a97eed7d7b4a3ee`

---

## 1. 系統詞彙、生命週期與狀態合法組合

### 1.1 `record_class`（資料紀錄生命週期）
`source_manifest.json` 與 `build_manifest.json` **皆必須包含 `record_class`**：
- `illustrative`：規格文件內之示意範例（必須使用明顯佔位符，如 `<PLACEHOLDER_SHA256>`、`999999`）。
- `provisional`：完成來源錨定與正式步驟 0 前之暫時紀錄。
- `formal`：正式紀錄。`build_manifest.json` 的 `record_class` 為 `formal` 之必要條件：
  1. `source_manifest.json` 必須為 `bootstrap_trust == "anchored"` **且** `record_class == "formal"`。
  2. 已對錨定後快照完成正式步驟 0（`expected_anomalies.json` 與 `field_registry.json` 值域已由錨定後位元組產出）。
  3. 本次為全量執行（禁止 `-CatIds` 局部執行）、`blocking` 異常數（含 `rejected_rows` 與 `blank_lines`）為 `0`、通過全部結構與逐位元組回放測試，且已完成版本化建置與指標切換。

### 1.2 `status` 與 `evidence_level` 合法組合
- `status`：`present` | `pending` | `unavailable` | `not_applicable`
- `evidence_level`：`unverified` | `reported` | `computed` | `cross_checked`（須附 `evidence_ref`）

| `status` | `value` | 合法的 `evidence_level` | 說明 |
|---|---|---|---|
| `present` | 非 `null` | `reported` \| `computed` \| `cross_checked` | 有值時始可依來源給定證據強度 |
| `pending` | 必為 `null` | **僅限 `unverified`** | 尚未計算或尚未查詢 |
| `unavailable` | 必為 `null` | **僅限 `unverified`** | 來源未提供或無法取得 |
| `not_applicable` | 必為 `null` | **僅限 `unverified`** | 該欄位不適用於此項目（如本機檔無 `git_blob_sha1`） |

- `semantic_status`（僅用於 `registry/field_registry.json`）：`unverified` | `partially_verified` | `verified` | `conflicting`。

---

## 2. 公開與私有資料發布邊界、授權分類與儲存權限

### 2.1 `checksums.json` 實體位置與 Private Vault 讀寫權限
Private Vault 目前暫定為**本機隔離目錄**（不假設目前環境具備 Git 或私有 Repo）。**唯讀／不可變的是錨定後的 `source/` 原始來源快照，而非整個 Private Vault**：

- **`checksums.json` 儲存位置與雙重身分規則**：
  - `checksums.json` 為 Task 001 遺留之本機產生附屬檔，**其實體儲存位置明確位於 `source/checksums.json`**。
  - 因此：在本地端 `source/` 唯讀保護、集合相等檢查（`expected_file_count = 10`）與 `source_dir_pre_hash`/`post_hash` 計算中，**包含 `source/checksums.json`**；但在上游快照身分（`upstream_snapshot_file_count = 9`）、固定 Commit Tree 查詢與 `git_blob_sha1` 比對中，**排除 `source/checksums.json`**（標註 `origin: "local_generated"`、`path_status: "not_applicable"`）。

| 路徑 | 權限模型 | 說明 |
|---|---|---|
| `source/`（含 `source/checksums.json`） | **唯讀（Read-Only）** | 設 OS 唯讀屬性；Parser、`-Anchor`、`-Finalize` 與 `-Verify` 皆嚴禁寫入或覆寫。 |
| `source_snapshots/` | **僅新增（Append-Only）** | 錨定失敗紀錄、API 原始回應與不一致時另開之快照目錄僅能新增，不得覆寫既有紀錄。 |
| `source_manifest.json` | **受控狀態機更新** | 僅能透過 `-Init`、`-Anchor`、`-Finalize` 進行單向原子轉換（全程持有 OS 獨占鎖）；`-Verify` 與 Parser 唯讀。 |
| `builds/<build_id>/` | **版本化唯讀產物** | 每次建置寫入獨立 `<build_id>` 目錄（含 `parsed/`、`derived/`、`build_manifest.json`），完成後不再修改。 |
| `parsed_current.json` | **原子發布指標** | 僅於全部檢查通過且無 `blocking` 後，以同檔案系統原子替換切換指向最新完整 `<build_id>`。 |
| `anomalies/anomalies.json` | **每次建置產生** | 每次執行建置時產出當次偵測之異常、隔離列、拒絕列、空白行與診斷報告。 |
| `anomalies/anomaly_dispositions.jsonl` | **僅新增（Append-Only）** | 人工處置事件僅能逐行追加，既有行不可修改或刪除。 |

> **本機 Append-Only 限制揭露**：在本機檔案系統尚未移入具備遠端 CI 的私有 Git Repo 前，無法保證本機歷史免於故意改寫，不得宣稱「不可竄改已驗證」。未來移入私有 Git Repo 後，由私有 CI 檢查 Git 已核准版本位元組為新版之嚴格前綴。

### 2.2 `builds/<build_id>/` 與 `parsed_current.json` 原子發布機制
為解決直接移動暫存目錄覆寫既有非空 `parsed/` 無法在 Windows 保證原子性的問題，改採**版本化建置目錄 ＋ 單一發布指標檔案切換**：
1. 每次建置於 `builds/<build_id>/`（如 `build-<utc_compact>-<uuid_v4_short>`）內建立獨立的 `parsed/`、`derived/` 與 `build_manifest.json`。
2. 若建置過程中發生任何 `blocking` 異常或測試失敗，**不切換 `parsed_current.json`**，該未完成之 `builds/<build_id>/` 視為無效殘留（絕不對外發布）。
3. 僅當全部檢查通過且 `blocking == 0` 時，將指標內容寫入 `parsed_current.json.tmp`（與 `parsed_current.json` 位於同一目錄與同一檔案系統），並原子替換 `parsed_current.json`（記錄 `active_build_id`、`parsed_path`、`build_manifest_sha256`）。
4. **讀取端規則**：所有下游讀取端必須透過 `parsed_current.json` 取得目前生效之 `builds/<build_id>/parsed/` 路徑；因此在切換完成前或切換中斷時，讀取端永遠只會讀到上一個完整版本（或尚未存在），絕不會讀到部分更新的半成品。

### 2.3 Public Repository 邊界與 GitHub 保護設定
目前 GitHub Repository（`battle-cats-guide`）為 **Public**：
- **禁止公開**：`source/`、`source_snapshots/`、`builds/`、`parsed_current.json`、完整版 `anomalies.json`、`anomaly_dispositions.jsonl`、完整版 `reports/`。
- **公開報告與測試限制**：公開報告僅可含 `rule_id`、檔名、`physical_line`、欄位名、雜湊與統計數字（**嚴禁包含任何原始文字或儲存格內容**）；測試須使用 `tests/fixtures/` 合成測資。
- **`registry/publish_allowlist.json` 與 Git 歷史檢查**：預設拒絕公開；CI 與 pre-push 檢查 `git ls-files` 所有追蹤檔案必須為 `publish_allowlist.json` 之子集，並掃描追蹤檔案與完整 Git 歷史是否含原始資料（若歷史已含原始資料，不得僅刪最新檔，必須清除歷史或重建乾淨 Repo）。
- **Public Repo 強制保護設定**：必須啟用 **GitHub Branch Protection 或 Repository Rulesets** 保護預設分支；**禁止直接推送**；`CODEOWNERS` 指定路徑（`registry/publish_allowlist.json`、`.github/workflows/`、`CODEOWNERS`）須經必要審核，且必要 CI 檢查通過始可合併。

### 2.4 授權分類 `rights_class`
每個來源檔案皆須標註 `rights_class`（預設 `unknown`，僅限私有），**共區分 6 種授權分類**（衍生資料繼承來源中最嚴格限制）：
1. `code`（上游程式碼授權）
2. `upstream_curated_data`（上游整理資料之授權）
3. `game_source_data`（遊戲原始資料之權利）
4. `third_party_reference`（第三方參考資料之權利）
5. `local_generated_metadata`（本機產生之 metadata，如 `source/checksums.json`）
6. `unknown`（權利未明，預設，僅限私有）

---

## 3. Manifest 狀態機、OS 獨占鎖、12 步驟錨定與 `CreateDirectoryW` 原子目錄

### 3.1 OS 獨占鎖與並行防護規則
所有會建立或修改 `source_manifest.json` 的模式（`-Init`、`-Anchor`、`-Finalize`）必須以 `[System.IO.File]::Open("<dir>/source_manifest.lock", [System.IO.FileMode]::OpenOrCreate, [System.IO.FileAccess]::ReadWrite, [System.IO.FileShare]::None)` 取得 OS 層級獨占控制代碼（禁止只檢查鎖檔是否存在）：
- 從讀取原始 `source_manifest.json` 起至原子替換完成並於 `finally` 釋放為止，全程持有鎖。
- 無法取得鎖時立即中止（Exit Code `13`），不得修改 Manifest。
- 程序異常終止時，OS 核心自動釋放控制代碼；磁碟殘留的 `.lock` 檔不阻擋後續取得鎖；殘留 `.tmp` 絕不視為有效 Manifest。

### 3.2 四種互斥執行模式與 `-Finalize` 原子替換
`verify_source.ps1` 提供四種互斥模式：
1. **`-Init`**：持鎖確認 `source_manifest.json` 不存在（存在則 Exit Code `13`），建立 `bootstrap_trust: "first_use"`、`record_class: "provisional"`，含寫死之 10 檔清單（9 `upstream` + 1 `local_generated` `source/checksums.json`）。
2. **`-Verify`（預設唯讀）**：100% 唯讀，比對 `source_manifest.json` 與 `source/` 集合及雜湊，忽略殘留 `.tmp`。
3. **`-Anchor`（階段一：來源錨定）**：持鎖確認 `bootstrap_trust == "first_use"` 且 `record_class == "provisional"`（已錨定則 Exit Code `13`）；僅單向寫入步驟 3–9 實測值（禁改既有 `computed`/`cross_checked` 雜湊）；9 份上游檔全數通過重下載逐位元組比對後，重驗 Manifest SHA-256 並原子升級 `bootstrap_trust` 為 `"anchored"`。
4. **`-Finalize`（階段二：正式升級為 `formal`）**：持鎖確認 `bootstrap_trust == "anchored"` 且 `record_class == "provisional"`（已為 `formal` 則 Exit Code `13`，禁覆寫）；驗證 Manifest 完整性、10 檔 SHA-256 與正式步驟 0 產物（位元組 Profile、`field_registry.json` 50 欄、`expected_anomalies.json` 基準）後，僅將位元組 Profile 寫入 `pending` 欄位並將 `record_class` 單向升為 `"formal"`；暫存檔 `source_manifest.json.tmp` 必位於同一檔案系統，替換前重新比對 `source_manifest.json` SHA-256，不符或遭並行修改立即中止（Exit Code `13`）。

### 3.3 12 步驟來源錨定程序與 `CreateDirectoryW` 原子建立
1. 隔離／移除舊 `verify_checksums.ps1`。
2. 錨定前初步唯讀檢查（僅 `provisional` 觀察，不得建立正式基準）。
3. 查詢固定 Commit API（`9441997393ebe2bd7fb2e9b19a97eed7d7b4a3ee`），保存完整原始回應與 SHA-256，取得 `tree.sha`、`author_date_utc`、`committer_date_utc`。
4. 以 `tree.sha` 查詢遞迴 Tree API，保存原始回應與 SHA-256；若 `truncated == true` 改用逐層查詢。
5. 確認 9 份上游檔之 `actual_repo_path`、`git_blob_sha1`、`path_status`（`not_found_at_pinned_commit` 進入失敗處理），並確認及下載根目錄 `LICENSE`。
6. 區分 9 份上游檔（快照身分）與本機 `source/checksums.json`（不要求出現於上游 Tree）。
7. 計算本地 `git_blob_sha1`（`SHA1("blob " + len + "\0" + bytes)`）與 Tree API 比對。
8. 本地 Blob SHA-1 相符後，以 `pinned_download_url` 重新下載至暫存目錄。
9. 重下載與本機 `source/` 逐位元組比對通過後，升為 `cross_checked`。
10. **失敗分支、統一 `attempt_id` 與 `CreateDirectoryW` 真正排他目錄建立**：
    - **統一識別與目錄名稱**：`attempt_id` 與實際目錄名稱**完全一致**，格式皆為 **`attempt-<seq>-<uuid_v4>`**（例：`attempt-0001-<128bit_UUID_v4>`；超過 `9999` 自動擴位為 `attempt-10000-<uuid_v4>`，嚴禁回繞）。路徑為 `source_snapshots/<commit>/attempt-<seq>-<uuid_v4>/anchoring_failure.json`。
    - **真正排他目錄建立機制**：在 Windows 上禁止僅依賴 `New-Item` 或 `Directory::CreateDirectory()` 推論新建所有權，亦不得單獨以 `.attempt_created` 標記檔推論父目錄所有權。必須透過 P/Invoke 直接呼叫 Win32 **`kernel32.dll!CreateDirectoryW(lpPathName, IntPtr.Zero)`**（`SetLastError = true`），並嚴格檢查回傳布林值與 `[System.Runtime.InteropServices.Marshal]::GetLastWin32Error()`：
      - 僅當 `CreateDirectoryW` 回傳 **`true`** 時，才構成「本次呼叫原子且排他地建立了該目錄」之有效證明，始允許寫入 `anchoring_failure.json`。
      - 若 `CreateDirectoryW` 回傳 **`false`**：立即中止該次嘗試（**嚴禁寫入 `anchoring_failure.json`**）。若錯誤碼為 `183`（`ERROR_ALREADY_EXISTS`），重新掃描現有 `attempt-*` 目錄並以 `max + 1` 重試（設重試上限）；若為其他 Win32 錯誤碼，立即失敗中止。
      - 不完整舊目錄絕不覆寫或重用。
11. 透過 `-Anchor` 將 `bootstrap_trust` 升級為 `anchored`。
12. 對已 `anchored` 快照執行正式步驟 0 後，透過 `-Finalize` 將 `record_class` 升級為 `formal`。

- **Exit Code**（優先序 `13 > 11 > 12 > 10 > 14`，`$ErrorActionPreference = 'Stop'`、`PowerShell -File`）：`0` 通過、`13` Manifest 錯誤 / 鎖定失敗 / 狀態機違規 / 並行修改 / `-Init` 或 `-Finalize` 重複執行 / `-ExpectedManifestSha256` 不符、`11` 缺檔、`12` 多檔、`10` 雜湊或大小不符、`14` 其他例外或 `blocking` 異常。

---

## 4. 位元組層級切割、UTF-8 順序、五類物理行與 ASCII `strict_int`

### 4.1 位元組層級處理順序
**嚴禁先對整份檔案執行嚴格 UTF-8 解碼**。必須嚴格依以下位元組順序處理：
1. `[System.IO.File]::ReadAllBytes($path)` 讀入完整 `byte[]`。
2. 檢查開頭 `0xEF 0xBB 0xBF`（`bom: true/false`，`cursor = bom ? 3 : 0`）；若檔案為空或僅含 BOM（`cursor == bytes.Length`），`total_physical_lines = 0`、`trailing_eol = false`。
3. 從 `cursor` 開始純依 `0x0A`（LF）切割物理行（檔尾最終 `0x0A` 設 `trailing_eol = true`，不產生額外空白行）。
4. 逐行計算 1-based `physical_line` 與 0-based `byte_offset`（從第 0 位元組含 BOM 起算，指向該行第一個內容位元組；空白 CRLF 指向 `0x0D`、空白 LF 指向 `0x0A`）。若行尾緊接單一 `0x0D`，剝除並記 `line_eol = "CRLF"`（否則 `"LF"` 或無終止符末行 `"NONE"`）。
5. 逐行檢查與獨立嚴格 UTF-8 解碼：
   - 剩餘內容位元組仍含任何 `0x0D`（裸 CR）→ 保存 `raw_line_base64`，歸類 `rejected_row`（`blocking`）。
   - 剩餘內容位元組長度為 `0` → 歸類 `blank_row`（`blocking`）。
   - 對非空且無裸 CR 之行內容位元組獨立執行 `UTF8Encoding($false, $true).GetString($contentBytes)`；若拋出 `DecoderFallbackException`，保存完整原始位元組為 `raw_line_base64`，歸類 `rejected_row`（`blocking`），**不影響其他物理行的定位資訊**。

### 4.2 五類互斥物理行與逐位元組回放
所有五類物理行（`header_row`、`data_row`、`isolated_row`、`rejected_row`、`blank_row`）皆必存 1-based `physical_line`、`byte_offset`、`line_eol`，並區分 `physical_line`、`physical_row_index`（`physical_line - 2` 當 line 1 為有效 `header_row`）與邏輯資料列索引。
- **`test_roundtrip_raw.ps1`**：以 `System.Text.Json` 讀回，輸出 BOM（若 `bom == true`），將五類物理行**嚴格依 `physical_line` 昇序**重建（`header_row` 依 `original_headers`、`data_row` 依 `raw_values` 原始欄位順序、`blank_row` 寫 0 位元組、`isolated_row`/`rejected_row` 解碼 `raw_line_base64`，再補上該行 `line_eol`），與 `ReadAllBytes($sourceFile)` 逐位元組比對必須 100% 相等。

### 4.3 `presence` × `parse_rule` × `parse_status` 矩陣（ASCII `strict_int`）
- **ASCII 整數正則**：`^(0|-?[1-9][0-9]*)$`（禁止使用匹配 Unicode 數字之 `\d`），且區分 `type_range` 與 `snapshot_observed_range`（`range_basis: "observed_in_snapshot"`）。
- 全空白字串為 `presence: "non_empty"`；任何 `failed` 必觸發 `blocking` 且不得切換 `parsed_current.json`。

| `parse_rule` | `presence` | 條件 | `parse_status` | `parsed` | 異常 / 行為 |
|---|---|---|---|---|---|
| `string_empty_to_null` | `non_empty` | 合法 UTF-8（無裸 CR） | `ok` | 等同 `raw` | 無 |
| `string_empty_to_null` | `empty_string` | `nullable: true` | `null_by_rule` | `null` | 無 |
| `string_empty_to_null` | `empty_string` | `nullable: false` | `failed` | `null` | `blocking` |
| `strict_int` | `non_empty` | 符合 `^(0\|-?[1-9][0-9]*)$` 且在 `[min, max]` | `ok` | `int` | 無 |
| `strict_int` | `non_empty` | 全空白、前導零、`-0`、Unicode 數字、非數字或超範圍 | `failed` | `null` | `blocking` |
| `strict_int` | `empty_string` | `nullable: true` | `null_by_rule` | `null` | 無 |
| `strict_int` | `empty_string` | `nullable: false` | `failed` | `null` | `blocking` |
| `none` | `non_empty` / `empty_string` | 暫不解析 | `skipped` | `null` | 無 |
| 任何規則 | `column_absent` | 僅合成測資可達 | `skipped` | `null` | `blocking` |
| 任何規則 | `row_isolated` | 已登記單一物理行欄數異常之基準列 | `skipped` | `null` | `isolating` |
| 任何規則 | `row_rejected` | 裸 CR、無效 UTF-8 等拒絕列 | `skipped` | `null` | `blocking` |
| 任何規則 | `row_blank` | 實質空白物理行 | `skipped` | `null` | `blocking` |

---

## 5. `catstat` 形態定位、`tcat` 唯一性與完整物理行統計公式

### 5.1 `catstat_record` 與 `catstat ↔ tcat` 唯一性條件
- `catstat_record`：`physical_row_index`（0-based）、`catstat_id`（`id` 欄整數）、`form_index`（僅在同 `catstat_id = k` 連續排列且列數等於 `cat.tsv` 之 `form_count` 時暫記 `0..(form_count - 1)`，標註 `form_index_basis: "row_order_within_id_unverified_order"`；否則標 `no_signal`）。
- 三項唯一性指標：`catstat_id_count(s)`（不同 `catstat_id` 數）、`catstat_rows_in_id(k, s)`（ID `k` 內不同資料列數）、`catstat_field_occurrences(k, s)`（僅供診斷）。
- `matched` 嚴格條件：`catstat` 該列與 `tcat(k)` 第 `j` 段存在逐位元組相等之非空非佔位符（`!^\d+_\d+$`）字串 `s`，且 `tcat_row_count(s) == 1`、`catstat_id_count(s) == 1`、`tcat_segment_indices_in_row(k, s) == {j}`、`catstat_rows_in_id(k, s) == 1`。雙方非空無交集 → `mismatch_observed`；其餘 → `no_signal`（隔離列記 `unavailable_due_to_isolation`）。

### 5.2 物理行統計公式
按來源檔案 $F$ 各自獨立計算，每筆物理行嚴格只歸屬五類之一（不混淆物理行數、單位數與形態數）：
$$\text{total\_physical\_lines}(F) = \text{header\_lines}(F) + \text{blank\_lines}(F) + \text{normal\_data\_rows}(F) + \text{isolated\_rows}(F) + \text{rejected\_rows}(F)$$
`reports/structural_checks.json` 與去識別化 `reports/public_summary.json` 皆須按檔案輸出上述 6 項統計欄位（公開摘要嚴禁包含任何原始文字）。

---

## 6. 異常工廠與規則目錄
- 所有異常經由單一函式 `New-PipelineAnomaly` 查詢 `registry/anomaly_rules.json` 產生；未登記 `rule_id` 一律強制 `blocking` 且不可覆寫嚴重度。
- `anomalies/anomaly_dispositions.jsonl` 採 JSONL 一行一筆，處置事件不影響 `severity`、`blocking` 或 Exit Code。
