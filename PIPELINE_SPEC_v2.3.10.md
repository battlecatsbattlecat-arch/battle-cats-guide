# PIPELINE_SPEC_v2.3.10.md — Battle Cats 資料管線完整自足規格（v2.3.10）

- **規格狀態**：v2.3.10 草案，待獨立審查（**尚未凍結**）
- **上游來源目標**：`https://github.com/battlecatsinfo/battlecatsinfo.github.io`
- **目標快照 Commit**：`9441997393ebe2bd7fb2e9b19a97eed7d7b4a3ee`

---

## 1. 系統詞彙、生命週期與狀態合法組合

### 1.1 `record_class`（資料紀錄生命週期）
`source_manifest.json` 與 `build_manifest.json` 皆必須包含 `record_class`：
- `illustrative`：規格文件內示意，須使用明顯佔位符。
- `provisional`：尚未達正式來源錨定／步驟 0 基準的紀錄。
- `formal`：來源 Manifest 已 `anchored` 且 `formal`、正式步驟 0 完成；build 另要求全量執行、`blocking == 0`、結構與 roundtrip 驗證成功並完成建置產物封存。
- `record_class` 是來源成熟度標記，不代表目前已對下游發布。發布狀態由第 2.2 節的 build 狀態及 `parsed_current.json` 定義。完整但未發布的 build 可為 `record_class: "formal"` 且狀態為 complete/unpublished；不得以 `record_class` 代替發布狀態。

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

### 2.2 版本化 build 與 `parsed_current.json` 發布協定

#### 狀態模型
- `build_state` 存於 `build_manifest.json`，允許 `candidate` → `complete`。`candidate` 目錄尚在寫入／驗證；`complete` 表示所有產物與閘門通過且 Manifest 已最終化。complete Manifest 不得再原地修改。
- `candidate` 失敗時，不切換目前指標；保留失敗目錄作診斷，標記可寫的失敗紀錄或保留 candidate 狀態，不得對讀取端提供。
- `complete` 代表建置完整，不代表發布。
- `published` 是發布狀態，由成功提交之 `parsed_current.json` 表示；不得寫入或回寫 build_manifest，避免 Manifest 自我雜湊循環。complete build 未被目前指標引用時為 unpublished。可另有唯一命名的追加式發布 receipt；receipt 失敗不改變已成功的指標提交。

#### 建置及發布順序
1. 在輸出根目錄持 `build_sequence.lock`（OS `FileShare.None`）配置遞增 `build_sequence`：讀 schema 固定且 `next_sequence` 為非負整數的 `build_sequence.json`、加一、以唯一同目錄 tmp + 原子 no-replace/replace 更新並讀回確認。sequence gaps 合法且永不回收；更新結果不確定時重讀計數，禁止倒退或重用號碼；整數溢位、損毀或無法確認寫入結果均 fail closed。counter 缺失時只可在無任何 build/指標的首次初始化原子建立為 0；counter 損毀時 fail closed。之後以 sequence 與 UUID v4 產生唯一 `build_id`（`build-<至少 20 位十進位 sequence>-<UUIDv4>`，僅 `[A-Za-z0-9-]`）並排他建立 `builds/<build_id>/`。分配成功但目錄建立失敗仍消耗該 sequence。
2. 所有產物寫入該候選目錄。解析、驗證或 I/O 任一失敗：保留舊指標不變，將候選留作未發布診斷殘留；不得標 complete 或切換指標。
3. 閘門全部通過後，計算檔案雜湊及固定序列化之 Manifest，寫入唯一 `build_manifest.tmp.<uuid_v4>`，flush、讀回驗證後以同目錄原子移入 `build_manifest.json`，狀態寫為 complete。此後 Manifest、parsed、derived 皆封存唯讀。Manifest 包含 build_id、`build_sequence`、來源 Manifest 雜湊、規格版號、檔案清單及統計，不含「已發布」聲明。
4. 取得輸出根目錄 OS 獨占鎖 `parsed_current.publish.lock`（handle 使用 `FileShare.None`；不可用 lock 檔是否存在判斷）。由讀取目前指標、檢查發布順位至指標替換完成全程持鎖。無法取得鎖時保留 complete/unpublished build，回報 13，不碰目前指標。
5. 持鎖驗證現有指標及它所指 build。指標 `generation` 必須等於 build Manifest 的 `build_sequence`。候選 sequence 大於目前 generation 才可發布；相同 sequence 且 build_id 相同為冪等成功；sequence 小於或相同但 build_id 不同時拒絕，禁止舊 build 回退。刻意回退需另行明確授權操作，不屬一般發布。若高 sequence build 先發布，尚未發布的較低 sequence build 隨後一律 stale/rejected；sequence gaps 合法。
6. 在指標同一目錄以 CreateNew 建立唯一 `parsed_current.<publisher_uuid_v4>.tmp`，寫完整 JSON、flush 並關閉，讀回驗證 schema、生成序號與目標 Manifest 雜湊。禁止共用固定 `.tmp` 名稱。
7. 首次發布（目標不存在）使用同 volume、no-replace 原子 rename；目標已由競爭者建立時不得覆寫，重讀並驗證後依序號規則決定重試或停止。後續發布使用同 volume 原子 replace（Windows 使用 `ReplaceFileW` 或等價保證原子替換 API）；禁止先刪目標再 Move。暫存檔必須與目標同目錄；平台不能保證原子語意即拒絕發布。
8. 原子 rename/replace 成功是唯一提交點。提交前失敗：舊指標維持有效，只刪本 publisher 自己建立的暫存檔；完整 build 保留待重試。提交成功後即為 published；後續 receipt、清理或日誌失敗不反轉提交。中斷留下的 tmp 不得當有效指標，只可由持發布鎖的 GC 在驗證命名、年齡與歸屬後清理。
9. replace 回報失敗時，重新讀取並驗證目標：若已指向本 build，視為已提交；若仍是舊完整指標，視為未提交，可保留 build 待重試；若目標缺失／損毀則 fail closed、回報 13 並停止下游讀取。不得猜測覆寫或自動退回舊 build。

#### 指標內容與讀取端驗證
`parsed_current.json` 至少包含 `schema_version`、單調 `generation`（等於所指 build 的 `build_sequence`）、`publication_state: "published"`、`active_build_id`、相對 `parsed_path`、`build_manifest_sha256`、`published_at_utc`、`publisher_uuid`。指標 JSON 以 UTF-8 無 BOM 寫入，屬性依上述列舉順序，無多餘空白且不加尾端換行；字串以 JSON 必需跳脫規則序列化，Unicode scalar 直接 UTF-8，拒絕未配對 surrogate；數值只允許整數。`build_manifest.json` 的屬性順序由其 schema 固定，亦使用 UTF-8 無 BOM、無非必要空白、無尾端換行及相同字串規則；其 SHA-256 計算實際最終檔案 bytes。讀取端先 hash 原 bytes 再 parse，不重新序列化後比 hash。建置可重現雜湊不得包含發布時間或 publisher UUID。
讀取端只透過此指標讀取，不掃描 `builds/` 猜最新版。先將指標完整讀入，再驗證 schema/型別、狀態、generation、嚴格 build_id pattern、拒絕 `.`/`..`、路徑正規化後仍在 builds root、`parsed_path` 為固定相對子路徑、目錄及 Manifest 存在、Manifest SHA-256 相符、Manifest build_id 相同且 build_state=complete、所有檔案及雜湊通過。任一步失敗即 fail closed，不讀半成品、不自行退回上一版。Windows 讀 handle 允許 delete sharing；已讀取舊完整指標的 reader 可繼續讀舊 build。一般發布不得刪除舊 builds；GC 需獨立政策並證明無活躍讀者依賴。

#### 並行與持久性邊界
OS 鎖序列化發布者，唯一暫存名避免互相覆寫，原子替換保證讀者見到完整舊檔或新檔；不等於掉電後目錄項目已持久化。需在目標檔案系統實測 flush/write-through；未驗證前不得聲稱 crash-durable。跨 volume、無原子替換保證的網路檔案系統或同步工具介入時拒絕發布。

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
1. 隔離／停用舊 `verify_checksums.ps1`。
2. 錨定前初步唯讀檢查（僅 provisional 觀察，不建正式基準）。
3. 查固定 Commit API，保存原始回應及 SHA-256，取得 tree SHA 與 author/committer 時間。
4. 查遞迴 Tree；若 truncated，改逐層查詢並記錄完整性。
5. 驗證 9 份上游檔實際路徑、blob SHA-1 與固定 Commit 根目錄 LICENSE。
6. 區分 9 份 upstream 與 `source/checksums.json` local_generated。
7. 計算 Git blob SHA-1 並與 Tree 比對。
8. 相符後將上游 9 檔重新下載至隔離暫存目錄。
9. 逐位元組比對通過後才記為 cross_checked。
10. **失敗目錄父路徑與 attempt 目錄分層建立。** 目標為 `source_snapshots/<commit>/attempt-<seq>-<uuid_v4>/anchoring_failure.json`；attempt_id 與目錄名一致。先標準化並驗證 vault root 在預定根目錄下，再對 `source_snapshots`、`<commit>` 逐層呼叫 Win32 `CreateDirectoryW`。若呼叫回傳 true，該層由本呼叫建立；須在建立下一層前再用 `GetFileAttributesW` 驗證它是普通目錄、非 reparse point 且標準化路徑仍在 vault root 下（成功時不讀 stale LastError）。若回傳 false，必須立即呼叫 `Marshal.GetLastWin32Error()` 保存原碼；且僅在 LastError=183 時，才可用 `GetFileAttributesW` 證明該路徑現為普通目錄、非 reparse point，且標準化路徑仍在 vault root 下，才可把它當作競爭者建立的共享父目錄。其它錯誤（含 5、3、123、206）記錄原 Win32 code 並停止；缺少父目錄不得被視為 attempt 成功。
    - 最終 attempt 目錄只用 `CreateDirectoryW(attemptPath, NULL)` 排他建立。回傳 false 時立即保存 `Marshal.GetLastWin32Error()`；僅回傳 true 才證明本次建立成功並允許寫 failure JSON，成功後不讀取 stale LastError。新建後仍須驗證普通目錄、非 reparse point 及 root containment。failure JSON 用 CreateNew，若檔案已存在不覆寫。
    - 回傳 false/183 時絕不寫入該目錄；重掃完整命名模式的現有 attempt 目錄、嚴格讀取最大 seq、採 max+1 與新 UUID v4 重試。若相同路徑已有檔案或 reparse point，同樣不碰觸並換新序號。seq 不回繞，重試有上限。
    - ERROR_PATH_NOT_FOUND 代表父路徑消失：重新驗證／建立父層一次後重試；其餘錯誤立即停止。只有最後一層 CreateDirectoryW 回傳 true 才證明本程序取得該 attempt 目錄，不完整舊目錄不得覆用。
11. 全部 9 檔錨定證據完備後透過 `-Anchor` 升為 anchored。
12. 對 anchored 快照完成正式步驟 0，再依條件透過 `-Finalize` 升為 formal。

#### 多重錯誤收集與 Exit Code
每筆診斷記錄 `error_id`、檔案／路徑、物理行（適用時）、分類、severity/blocking 與 Win32／例外原碼。除無法安全繼續的 fatal 條件（鎖取得失敗、Manifest 不可讀或狀態違規、輸出根路徑安全性失敗）外，驗證器應繼續檢查其它可安全檢查項目、累積多重診斷，最後統一輸出；資料列有 rejected/blank/型別錯誤時仍掃描後續物理行但禁止發布。Exit code 只回傳一碼，依序 `13 > 11 > 12 > 10 > 14 > 0`，診斷輸出保留全部錯誤類別：
- `13` Manifest 無效、鎖定失敗、狀態違規、expected SHA 不符、並行更新衝突、發布鎖／指標安全錯誤。
- `11` 一個以上預期來源檔缺失。
- `12` 一個以上非預期來源檔存在。
- `10` 一個以上存在檔案大小或雜湊不符。
- `14` blocking 結構／解析異常、Win32／I/O／API 其它錯誤、未分類例外。
- `0` 無失敗診斷。
如同時缺檔、多檔、雜湊不符，回傳 11 但完整列出三類。Fatal 13 可阻止後續副作用步驟，但輸出已收集診斷。`$ErrorActionPreference='Stop'`；最外層 catch 保留原例外，finally 釋放鎖與 handle。PowerShell `-File` 的實際 exit code 行為須在目標版本測試。

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

### 4.2 五類互斥物理行、EOL 與原始位元組回放
每筆物理行記錄 1-based `physical_line`、0-based `byte_offset`（含 BOM；指向 payload 首 byte；payload 為空時指向 EOL 第一 byte）、`line_eol`（`LF`/`CRLF`/`NONE`）。只以 `0x0A` 定行界；每個 LF 關閉一行，末尾 LF 不額外合成空行。LF 前緊鄰的一個 `0x0D` 是 CRLF 分隔符並從 payload 移除；payload 內其它 `0x0D` 都是裸 CR。
`raw_line_base64` **只包含 payload bytes，不含 EOL**：CRLF 排除末尾 `0D 0A`，LF 排除末尾 `0A`，NONE 保存 EOF 前全部 bytes。回放先 Base64 decode payload，再依 `line_eol` 附加 `0A`、`0D 0A` 或空 bytes。isolated/rejected/blank 均保存此欄位；空 payload 編碼為空字串。嚴禁把行尾 delimiter 放入 base64 又重複附加。
分類順序：payload 含裸 CR 或 strict UTF-8 解碼失敗 → `rejected_row`（blocking）；payload 長度 0 → `blank_row`（blocking）；第一筆只有在非空、UTF-8 合法且標頭欄名非空唯一時為 `header_row`；有效 header 後欄數相符的有效列為 `data_row`，欄數不足／過多為 `isolated_row`（保存 payload base64、isolating）；第一筆非空但 header 格式不符則 rejected；缺失／無效 header 後的非空可解碼行均為 `rejected_row` (`header_unavailable`)；空 payload 無論位置皆為 blank。
邊界：0 bytes 與僅 BOM 都是 0 physical lines；BOM 後 EOF 不產空行；BOM 後一個 LF 是一筆 blank；`a\n` 是一行；`\n` 是一筆 blank；`a` 是一筆 `NONE` 末行；`a\r\n` 是 CRLF；`a\rb\n`、`a\r\r\n`（只剝除最後一 CR 作 CRLF）及 EOF 前裸 CR 均 rejected；相鄰分隔符之間各形成 blank；混合 LF/CRLF 逐行接受並保留。byte_offset 對 BOM 後第一筆為 3；空 payload 指向 delimiter byte；不含 BOM 檔第一筆為 0。
roundtrip 必先輸出 BOM（若有），再按 physical_line：有效 header/data 依原欄位值序列化；isolated/rejected/blank 依 base64 payload；最後補原 line_eol。結果與原始 ReadAllBytes 必須逐 byte 相等。Fixtures 應覆蓋上述每個邊界。

### 4.3 TSV 欄位解析與序列化契約
定義為無 quoting、無 escaping 的 UTF-8 TSV。`0x09` 是唯一欄位分隔 byte，LF/CRLF 是物理行分隔；欄位不能含 TAB/LF/CR，遇 TAB 即欄位邊界，不得推測為欄內跳脫。有效 payload 每行獨立 strict UTF-8 解碼；不得 trim、正規化 Unicode、轉大小寫、補空值或以解析後數值回寫。
Split 必須保留所有空 token（等價於 `Split(TAB, StringSplitOptions.None)`），包含首尾空欄與連續空欄。例如 `A<TAB><TAB>B<TAB>` 是 4 欄 `A`, `""`, `B`, `""`。零 byte payload 是 blank；一個或更多 TAB 的 payload 不是 blank，先切為空欄再依欄數分類。空或重複 header 名稱使標頭 rejected。
序列化時原順序 UTF-8（無 BOM）編碼每個 raw field，欄間插一個 TAB，空值輸出零 bytes，不 quote/escape；必須保留尾端空 tokens，序列化欄位數須等於原 token 數。欄數異常行不得從欄陣列序列化，改用原 payload base64。最後附原 EOL。合法 UTF-8 記錄以此可 roundtrip；拒絕列保留原 bytes。
合成 fixtures：空 payload、連續空欄、首空欄、尾空欄、多個尾空欄、TAB-only、欄數少／多、混合 EOL、無尾 EOL。零 byte payload 一律是 blank，故無法與單欄、單一空值資料列區分；此 TSV dialect 不支援該種單欄空值記錄，schema 不得要求其作為可表達資料值。Unicode 數字 raw 字串仍原樣保留；strict_int 另行判定。

### 4.4 `presence` × `parse_rule` × `parse_status` 矩陣（ASCII `strict_int`）
- **ASCII 整數正則**：`^(0|-?[1-9][0-9]*)$`（禁止使用匹配 Unicode 數字之 `\d`），且區分 `type_range` 與 `snapshot_observed_range`（`range_basis: "observed_in_snapshot"`）。
- 僅使用 ASCII `[0-9]`；不得使用 .NET Unicode `\d`。負面 fixtures 使用 Arabic-Indic `١`、Devanagari `१`、Fullwidth `１` 與 ASCII/Unicode 混合數字，皆須 failed/blocking 並保留 raw。全空白字串為 `presence: "non_empty"`；任何 failed 都 blocking 且不得切換指標。

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
- `matched` 嚴格條件：`catstat` 該列與 `tcat(k)` 第 `j` 段存在逐位元組相等之非空非佔位符（`!^[0-9]+_[0-9]+$`）字串 `s`，且 `tcat_row_count(s) == 1`、`catstat_id_count(s) == 1`、`tcat_segment_indices_in_row(k, s) == {j}`、`catstat_rows_in_id(k, s) == 1`。雙方非空無交集 → `mismatch_observed`；其餘 → `no_signal`（隔離列記 `unavailable_due_to_isolation`）。

### 5.2 物理行統計公式與邊界
每個來源檔獨立統計且互斥：`total_physical_lines = header_lines + blank_lines + normal_data_rows + isolated_rows + rejected_rows`；normal_data_rows 等於 data_row 數。0-byte 與 BOM-only 檔所有計數皆 0；BOM 不算行；末尾 LF 不創造虛構行。單一 LF/CRLF 空 payload 計一 blank；相鄰兩個 separator 表示兩筆行，兩者間為 blank；無尾 EOL 的非空 payload 是一筆末行。
header_lines 只計有效首標頭。空首行計 blank，無效非空標頭計 rejected；沒有有效標頭時所有後續非空列計 rejected/header_unavailable，空列仍計 blank。有效 header 後：有效且欄數吻合為 normal data，欄數不符為 isolated，裸 CR 或無效 UTF-8 為 rejected，零 payload 為 blank。分類優先及回放詳 4.2。
只有存在有效 header 時 `physical_row_index = physical_line - 2`（header 後首行 index 0）；否則該索引為 null/不適用，但 physical_line 仍保留。統計檢查必驗總數等式與互斥性。structural_checks 與去識別 public_summary 每檔輸出六數值欄位；公開摘要不得含原文、欄位內容或 base64。

## 6. 異常工廠與規則目錄
- 所有異常經由單一函式 `New-PipelineAnomaly` 查詢 `registry/anomaly_rules.json` 產生；未登記 `rule_id` 一律強制 `blocking` 且不可覆寫嚴重度。
- `anomalies/anomaly_dispositions.jsonl` 採 JSONL 一行一筆，處置事件不影響 `severity`、`blocking` 或 Exit Code。
