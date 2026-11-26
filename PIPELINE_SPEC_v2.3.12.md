# PIPELINE_SPEC_v2.3.12.md — Battle Cats 資料管線核心協定規格（v2.3.12）

- **規格狀態**：v2.3.12 草案，待獨立審查（**尚未凍結**）
- **上游來源目標**：`https://github.com/battlecatsinfo/battlecatsinfo.github.io`
- **目標快照 Commit**：`9441997393ebe2bd7fb2e9b19a97eed7d7b4a3ee`

---

## 1. 系統詞彙、生命週期與狀態合法組合

### 1.1 `record_class`（資料紀錄成熟度）
`source_manifest.json` 與 `build_manifest.json` 皆含 `record_class`：`illustrative`、`provisional`、`formal`。此欄位描述來源證據／資料成熟度，不描述建置階段、封存或發布。
`build_manifest.record_class=formal` 的必要條件：來源 Manifest `bootstrap_trust=anchored` 且 `record_class=formal`；正式 step 0 基準存在且 hashes 相符；本次全量而非局部執行；所有 blocking 數為 0；所有要求的結構、roundtrip、重現性與發布前 gate 測試結果皆為實際 PASS。封存是獨立狀態；Manifest 可在 staging 中寫成完整且 formal，隨後只有封存程序能移入 sealed root。`formal` 不聲稱 build 已封存或已發布。
`provisional` source 可產生 private candidate，並可在 diagnostics/build gates 全通過後形成 sealed、`publication_eligibility=false` 的 private diagnostics build；不得產生 published receipt、不得被 `parsed_current.json` 指向。若 build gates 失敗，才標記 failed。`illustrative` 只准用於規格範例，不能建立真實 build manifest 或發布。

### 1.2 `status` 與 `evidence_level` 合法組合
- `status`：`present` | `pending` | `unavailable` | 
ot_applicable`
- `evidence_level`：`unverified` | `reported` | `computed` | `cross_checked`（須附 `evidence_ref`）

| `status` | `value` | 合法的 `evidence_level` | 說明 |
|---|---|---|---|
| `present` | 非 
ull` | `reported` \| `computed` \| `cross_checked` | 有值時始可依來源給定證據強度 |
| `pending` | 必為 
ull` | **僅限 `unverified`** | 尚未計算或尚未查詢 |
| `unavailable` | 必為 
ull` | **僅限 `unverified`** | 來源未提供或無法取得 |
| 
ot_applicable` | 必為 
ull` | **僅限 `unverified`** | 該欄位不適用於此項目（如本機檔無 `git_blob_sha1`） |

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
| `builds/<build_id>/` | **版本化 sealed build** | `formal` publishable build 或 `provisional` private diagnostics build；均須 sealed event/hash/inventory 驗證，sealed 後不再修改。 |
| `parsed_current.json` | **原子發布指標** | 僅於全部檢查通過且無 `blocking` 後，以同檔案系統原子替換切換指向最新完整 `<build_id>`。 |
| `builds/<build_id>/anomalies/` | **每次建置版本化產物** | 成功 build 的 anomaly artifacts 隨 build 一併雜湊與封存；失敗 build 的診斷另存 `state/failures/` 與 `diagnostics/failed/`。 |
| `state/dispositions/<build_id>.jsonl` | **私有僅新增事件** | triage/disposition 不改變原 anomaly 的 severity、blocking、exit code 或發布 gate。 |

> **本機 Append-Only 限制揭露**：在本機檔案系統尚未移入具備遠端 CI 的私有 Git Repo 前，無法保證本機歷史免於故意改寫，不得宣稱「不可竄改已驗證」。未來移入私有 Git Repo 後，由私有 CI 檢查 Git 已核准版本位元組為新版之嚴格前綴。

### 2.2 Build 生命週期、配置帳本、封存及發布

#### 儲存配置
同一個 private output root、同一個 volume：
```
build_sequence.lock
build_sequence.json
state/allocations/<20-digit-seq>.json
state/active/<build_id>.lock
state/events/<seq>.<event_type>.<event_uuid>.json
state/failures/<build_id>.json
state/recoveries/<recovery_uuid>.json
builds/.staging/<build_id>/
builds/<build_id>/                         # sealed builds only
diagnostics/failed/<build_id>/            # failed staging moved here
diagnostics/superseded/<build_id>/        # pre-seal stale candidate
parsed_current.json
parsed_current.publish.lock
```
`anomalies/` is inside each staging/sealed build and included in its inventory. There is no shared writable anomaly snapshot. External mutable runtime state (`state/`, `diagnostics/`, staging, sealed builds, pointer, private config) is outside the Public Repository and on the same probed local NTFS volume. `allocations/` and `events/` are append-only; no GC deletes them. Exact path policy and role ACLs are in §8.2.

#### State machines
Canonical build lifecycle and state derivation are defined in §8.1 and §8.8. `allocated → building → failed | superseded | complete → sealed`; sealed provisional builds terminate as private diagnostics; sealed formal builds may have publication attempts. Current/latest means exactly the build named by a valid `parsed_current.json`; its generation equals that build's sequence. There is no “latest complete” shortcut.

`build_manifest.json` has `build_state=candidate` while in staging; only the formal/diagnostics completion gates can replace it with `complete`. A complete manifest in staging is unsealed. A directory under `builds/<build_id>/` is considered sealed only when its sealed event's manifest hash matches the exact manifest bytes and recomputed inventory. Failed state is external. A sealed build is immutable after publication failure, stale rejection, or later pointer changes.

#### Sequence allocation and crash windows
`build_sequence.json.next_sequence` means the **next number to allocate**; initial value is 1. Allocation of N gives the caller N, then advances the counter to N+1. Sequence gaps are valid; values never wrap, decrease, or repeat.
1. Acquire `build_sequence.lock` with OS `FileShare.None`, bounded wait of 30 seconds (100 ms polling). Timeout produces `BUILD_SEQUENCE_LOCK_TIMEOUT`, exit 14, no allocation.
2. While holding this lock only, reconcile the counter from the append-only allocation ledger, reserve N=
ext_sequence`, construct unique build_id, serialize the complete allocation record to unique same-directory temp, flush and close, then atomic no-replace rename to `state/allocations/<seq>.json` (CreateNew destination). This rename is the allocation commit point: before it N is not consumed; after it N is consumed permanently.
3. Update `build_sequence.json` atomically to N+1 and read back. Then acquire the per-build active lease `state/active/<build_id>.lock` (`FileShare.None`) while still holding the sequence lock. The only allowed nested order is `build_sequence.lock` → per-build lease; no code may acquire them in reverse. Release sequence lock immediately after both the durable allocation record and lease are confirmed. If counter update or lease acquisition fails, leave the allocation record, write a best-effort `allocation_failed` event, consume N and stop; never reuse it.
4. Counter update/crash cases: crash before allocation rename leaves no committed allocation and N may be reused; crash after ledger rename but before counter update leaves N committed, next allocator heals counter to at least N+1; crash after counter update leaves a harmless gap if no build continues. Directory creation happens only after ledger commit and lease acquisition, so failure/crash remains traceable by allocation record even if no staging directory exists.

The allocation ledger record and counter are both written with UTF-8 canonical JSON (Appendix schemas). Allocation filenames must be canonical zero-padded decimal sequence and unique. For valid counter C and parseable ledger sequences S, repaired 
ext_sequence = max(C, max(S)+1, highest_sequence_in_verified_sealed_builds+1, parsed_current.generation+1)`; allocation ledger is never pruned, so its maximum is the normal source of truth. A corrupt counter is copied byte-for-byte to `state/recoveries/` with SHA-256, then under the sequence lock reconstructed from valid allocation filenames and cross-checked against sealed manifests, diagnostics, events and pointer. Append a recovery record with old hash, evidence, computed value and operator identity before replacing the counter. If ledger filenames/records and other evidence cannot establish a safe upper bound, fail closed (exit 13); restore a trusted backup or require a separately reviewed new storage root. Never reset sequence to 1 over existing evidence.

**Ledger proposal and crash/uniqueness analysis.** The ledger is used as a write-ahead reservation because writing the counter first can consume N without leaving evidence, while writing an ordinary append-only line can leave a torn tail. The reservation becomes committed only when the complete temp has been flushed/closed and atomically renamed to its canonical, previously absent sequence filename while the exclusive sequence lock is held. The exclusive lock serializes allocators; destination no-replace semantics independently reject duplicate N. Before that rename, no allocation exists and N may be retried; after it, even if counter update, lease acquisition, event writing, or directory creation fails, N remains permanently consumed and recoverable. Recovery never infers an allocation from an uncommitted temp. If rename atomicity/no-replace or flush behavior cannot be established on the chosen filesystem, allocation is disabled rather than weakening uniqueness. The counter is a recoverable cache of the ledger high-water mark, not the uniqueness authority.

#### Candidate liveness, failure, and recovery
After allocation, `state/active/<build_id>.lock` is held for the build-through-seal/failure transition. Its OS handle is the liveness source. GC/recovery triggers and reconciliation table are in §8.8; an unlocked allocation is never called orphan/failed until GC checks the sealed destination first and validates manifest/event/inventory. Age alone never establishes failure.
After the lease is acquired, append `building`, create staging exclusively and write candidate manifest as its first file. On build failure, the §8.5 FailureRecord is written using temp+flush+CreateNew commit, then staging is moved to diagnostics by same-volume no-replace rename and a failed event is appended. Any failure in that sequence remains recoverable; a failure to meet build gates is a failed build, whereas a provisional build that passes its diagnostics gates proceeds to complete/sealed with publication prohibited. Temp cleanup follows §8.8; pointer temps may be cleaned only by their owner or recovery while holding the publish lock.

#### Complete and seal
Publication gates are fully evaluated before final manifest creation (Appendix §7.4). First perform a lock-free atomic read of current pointer as an early stale check; if its generation exceeds this sequence, write stale/superseded diagnostics and stop before sealing. This check is advisory; repeat under publish lock.
Build complete manifest in staging as a unique temp, flush, close, validate schema and exact inventory, then atomically replace candidate manifest with `build_state=complete`. Inventory lists every regular file recursively under the build except `build_manifest.json` itself and no temp/lock/diagnostic/state files; reject symlinks, reparse points, duplicate paths, absolute paths, `.`/`..`, extra or missing files. The reader verifies exact set equality and every byte length/SHA-256.
Seal only under the role-specific NTFS ACL protocol in §8.2. Before same-volume no-replace rename, the seal coordinator validates the final DACL, owner, inheritance protection, no ADS/hardlinks/reparse points and complete filesystem-object inventory. The sealed event stores `manifest_sha256` over exact canonical UTF-8 manifest bytes and `inventory_sha256`; it is written only after rename and destination verification. ACL/rename failure does not publish; if rename already succeeded but receipt/event is missing, recovery validates and appends the sealed event without changing the directory. Release active lease before any publication lock.

#### Stale and publication protocol
Stale is `PUBLISH_STALE_SEQUENCE`, exit 14. Stale policy only applies to formal publication candidates. A sealed provisional diagnostics build is terminal private-only and never enters pointer ordering. For formal builds, compare pointer before seal and under publish lock; a lower sequence after a higher successful generation is stale, never modifies the sealed build, and remains available for manual audit. Equal generation plus equal build_id is idempotent; equal generation with another build_id is exit 13.
Acquire publish lock using FileShare.None with 30 second bounded wait. Timeout `PUBLISH_LOCK_TIMEOUT`, exit 14. Under it validate prior pointer/current build, create unique `parsed_current.<uuid>.tmp` with CreateNew, flush/close/readback, validate the full gate and manifest hash, then first publish uses same-volume atomic no-replace rename; subsequent publish uses a platform operation experimentally established to atomically replace one file with another. Never delete target before move. The operation success is the pointer commit point. `parsed_current.generation` MUST equal both the sealed manifest's `build_sequence` and the decimal sequence embedded in `active_build_id`; the reader verifies all three, exact `parsed_path`, manifest hash and full inventory before exposing data. Before commit failure: current pointer unchanged, remove only this publisher's temp; append `publish_failed` event/record; sealed build remains. After commit, failure to write `published` receipt/event does not roll back; pointer is authoritative and recovery appends missing event after validating it. If replace returns error, reread pointer: candidate pointer means success; prior valid pointer means failed retryable; missing/corrupt target is fail closed exit 13. Receipt is CreateNew at `state/events/<seq>.published.<uuid>.json`, outside sealed build.

#### Manual pointer recovery
Missing pointer is first-publish eligible only when no prior published event/receipt exists and no prior pointer evidence exists. If it is missing after prior publication, or malformed/hash-invalid, stop all readers/publishers and fail closed (13); do not select a build automatically. Preserve damaged bytes (or a signed `missing` marker), hash them, and record them under `state/recoveries/`. An authorized operator reviews every sealed candidate's complete manifest, exact inventory and hashes plus published event history and chooses the last known valid pointer state; write a recovery plan with selected build_id/generation, evidence, operator, time and reason under `state/recoveries/`. Under the publish lock, revalidate, construct a fresh unique pointer temp and commit by the same tested atomic replace/no-replace operation; append a `pointer_recovered` event after commit. Readers remain stopped until pointer and receipt validate. Never hand-edit the pointer or lower generation without separately reviewed rollback authorization.

### 2.3 Public Repository 邊界與 GitHub 保護設定
目前 GitHub Repository（`battle-cats-guide`）為 **Public**：
- **禁止公開**：`source/`、`source_snapshots/`、`builds/`、`parsed_current.json`、完整版 `anomalies.json`、`anomaly_dispositions.jsonl`、完整版 `reports/`。
- **公開報告與測試限制**：公開報告僅可含 `rule_id`、檔名、`physical_line`、欄位名、雜湊與統計數字（**嚴禁包含任何原始文字或儲存格內容**）；測試須使用 `tests/fixtures/` 合成測資。
- **公開 allowlist 與私有 config 路徑分離**：公開政策檔唯一路徑為 `.github/policy/publish_allowlist.json`；private vault config 唯一路徑為 `<vault>/config/{field_registry,anomaly_rules,expected_anomalies}.json`。私有 config 不放在 repo 的 `registry/`，schema 在本文索引所列 `schemas/v2.3.12/`。CI/pre-push default-deny 驗證所有追蹤路徑與完整 Git 歷史。
- **Public Repo 強制保護設定**：必須啟用 **GitHub Branch Protection 或 Repository Rulesets** 保護預設分支；**禁止直接推送**；`CODEOWNERS` 指定路徑（`.github/policy/publish_allowlist.json`、`.github/workflows/`、`CODEOWNERS`）須經必要審核，且必要 CI 檢查通過始可合併。

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

### 3.1 OS 獨占鎖、鎖範圍及禁止巢狀
所有會建立／修改 source_manifest 的 `-Init/-Anchor/-Finalize` 以 OS handle `FileShare.None` 取得 `source_manifest.lock`，從狀態驗證至 atomic manifest replacement 全程持有；timeout 30 秒、100 ms polling，失敗 no-write、`SOURCE_MANIFEST_LOCK_TIMEOUT` exit 14。`-Verify` 不取得鎖，唯讀。
Build sequence allocation 僅持有 `build_sequence.lock` 做 ledger/counter transaction，§2.2 唯一允許的 nested 次序是 sequence lock → active-build lease，拿到 lease 後立即釋放 sequence lock。Builder 持 active lease 至 seal/failure event 完成，釋放後才可取 publish lock；GC 先取 seq lock 建立清單、釋放後再逐一取 lease。source manifest lock 與 build locks 不得巢狀；publish lock 不得與 build lease/sequence/source lock 巢狀。所有鎖均用 kernel FileShare，不看 lock 檔是否存在；timeout 不刪除實體 lock 檔，handle 關閉後可重用。

### 3.2 四種互斥執行模式與 `-Finalize` 原子替換
`verify_source.ps1` 提供四種互斥模式：
1. **`-Init`**：持鎖確認 `source_manifest.json` 不存在（存在則 Exit Code `13`），建立 `bootstrap_trust: "first_use"`、`record_class: "provisional"`，含寫死之 10 檔清單（9 `upstream` + 1 `local_generated` `source/checksums.json`）。
2. **`-Verify`（預設唯讀）**：100% 唯讀，比對 `source_manifest.json` 與 `source/` 集合及雜湊，忽略殘留 `.tmp`。
3. **`-Anchor`（階段一：來源錨定）**：持鎖確認 `bootstrap_trust == "first_use"` 且 `record_class == "provisional"`（已錨定則 Exit Code `13`）；僅單向寫入步驟 3–9 實測值（禁改既有 `computed`/`cross_checked` 雜湊）；9 份上游檔全數通過重下載逐位元組比對後，重驗 Manifest SHA-256 並原子升級 `bootstrap_trust` 為 `"anchored"`。
4. **`-Finalize`（階段二：正式升級為 `formal`）**：持鎖確認 `bootstrap_trust == "anchored"` 且 `record_class == "provisional"`（已為 `formal` 則 Exit Code `13`，禁覆寫）；驗證 Manifest 完整性、10 檔 SHA-256 與正式步驟 0 產物（位元組 Profile、`field_registry.json` 50 欄、`expected_anomalies.json` 基準）後，僅將位元組 Profile 寫入 `pending` 欄位並將 `record_class` 單向升為 `"formal"`；暫存檔 `source_manifest.json.tmp` 必位於同一檔案系統，替換前重新比對 `source_manifest.json` SHA-256，不符或遭並行修改立即中止（Exit Code `13`）。

### 3.3 來源錨定程序與 `CreateDirectoryW` 父路徑競爭
1. 隔離舊寫入型 `verify_checksums.ps1`；2. provisional 唯讀觀察；3. 固定 Commit API/tree 原文及雜湊；4. recursive tree，truncated 時逐層；5. 確認九份 upstream path/blob SHA 與固定 Commit LICENSE；6. `source/checksums.json` 為第十個 local_generated 檔，不參與 upstream identity；7. 計算九個 Git blob SHA；8. 相符後 pinned-download；9. 逐 bytes 相等後才標 cross_checked；10. 僅完整通過後 `-Anchor`；11. 執行 anchored step 0；12. `-Finalize` 升為 formal。所有 `-Init/-Anchor/-Finalize` 仍依 §3.1 同一 source_manifest OS lock。`-Anchor` 持鎖期間的 attempt 序號掃描與建目錄因此序列化，不另巢狀取得 source lock。

**Attempt directory**：先驗證既有 private vault root 為普通目錄且不在 Public repo。對 `source_snapshots`、`<commit>` 每一層分開 `CreateDirectoryW`；成功時及 183 後都要立即檢查屬性、非 reparse point 及標準化 path containment。每次 false 必須立即保存 `Marshal.GetLastWin32Error()`；只將 183 視為名稱競爭／既有物件，重新掃描完整 attempt 名稱、嚴格取 max sequence + 1 並新 UUID v4。attempt 終端目錄最多 16 次呼叫；超限回 `ATTEMPT_CREATE_RETRY_EXHAUSTED` (14)。若 parent component 建立回 3 (`ERROR_PATH_NOT_FOUND`)，停止，因預期 parent 階層缺失；不得盲目再試。若最終 attempt 呼叫回 3，重新驗證／建立已知 `<commit>` parent 一次，再重試一次（仍受 16 次上限）；第二次 3 即停止。5/123/206 等其他 Win32 error 記錄原碼後停止，exit 14。只有 attempt 這一層 `CreateDirectoryW` 回 true 才證明本次擁有該目錄；failure JSON 用 CreateNew。

**TOCTOU 範圍**：路徑屬性檢查與下一個 Win32 呼叫間仍有 TOCTOU。規格威脅模型是 private local vault，ACL 僅允許 pipeline identity 與受控 administrators 寫入；程序防範意外競爭、錯誤路徑與 reparse redirection，不宣稱抵抗同權限惡意程序。若 vault 可被不可信 identity 寫入，必須改用 handle-relative、已釘選 parent handle 的 API 或拒絕執行，單靠 CreateDirectoryW + GetFileAttributesW 不足。

#### Exit code 與多重錯誤
此表適用 `verify_source.ps1`、parser build、seal 及 publisher CLI；每個工具仍須列出自己可產生的 error_id。能安全繼續時先收集所有 diagnostics；fatal trust/path/lock integrity error 可停止後續副作用，但輸出已收集項。多類並存只回最高優先碼，仍保留全部 error_id：`13 > 11 > 12 > 10 > 14 > 0`。

| Exit | 邊界／主要 error_id |
|---|---|
| 0 | 所有該模式適用的 gate 通過；冪等同一 build 指標亦成功 |
| 10 | manifest 本身可信且可解析，但 source 檔實際 byte length/SHA-256 不符 manifest：`SOURCE_SIZE_MISMATCH` / `SOURCE_HASH_MISMATCH` |
| 11 | 必需 source file 缺失：`SOURCE_FILE_MISSING` |
| 12 | source directory 有非允許額外檔：`SOURCE_FILE_EXTRA` |
| 13 | 信任／控制狀態無法成立：source/build manifest schema/hash/expected-manifest SHA 不符、狀態非法、sequence ledger/counter 不可安全修復、pointer 缺失/損毀且非首次發布、path containment/reparse violation、同 sequence 不同 build_id。error_id 例如 `MANIFEST_INVALID`、`EXPECTED_MANIFEST_SHA_MISMATCH`、`SEQUENCE_STATE_CORRUPT`、`POINTER_INVALID` |
| 14 | blocking 資料異常（`file_empty`、`header_missing`、裸 CR、invalid UTF-8、非基準 isolated row、超出 expected anomalies）、stale sequence、鎖 timeout/暫時衝突、CreateDirectory/其他 I/O/API error、未分類例外。error_id 例如 `PUBLISH_STALE_SEQUENCE`、`BUILD_SEQUENCE_LOCK_TIMEOUT`、`PUBLISH_LOCK_TIMEOUT` |

來源檔 payload hash mismatch 是 10；引用該 hash 的 manifest 自身或 caller 提供的 `-ExpectedManifestSha256` mismatch 是 13。預期 isolated row 只有在 `expected_anomalies` 完整 identity（source id、physical_line、byte_offset、raw line hash、欄數及 rule id）相符、數量無多無少時才可為 nonblocking；任一未預期、多餘、缺失或欄位不符都產 blocking diagnostic 並 exit 14。Exit 11/12 的優先高於 10，13 高於全部；diagnostic 都要輸出。

## 4. 位元組層級切割、UTF-8 順序、五類物理行與 ASCII `strict_int`

### 4.1 位元組掃描及檔案級 gate
使用 `ReadAllBytes`。只剝除檔案最前方一個 BOM `EF BB BF`；`bom_bytes` 為 3 或 0。BOM 後任何 U+FEFF bytes 均屬 payload，逐行解碼後原樣保留，不能再當 BOM 移除。
在掃描 physical lines 前產生 file-level diagnostics：剝除單一初始 BOM 後 payload bytes 長度為 0 時必有 blocking `file_empty`（適用 0-byte 與 BOM-only）；若 physical line 1 不成為合法 header，必有 blocking `header_missing`。這些是 file-level anomaly，`physical_line=null`，不增加 physical line 類別計數。兩者可同時發生。

### 4.2 五類 physical line、唯一 rejected 主因與 byte 對帳
Header **只能**是 `physical_line == 1`。絕不跳過空白、拒絕或無效的首行尋找後續 header。physical line 1 空 payload → `blank_row` + file-level `header_missing`；其後每一非空列因無 header 歸 `rejected_row/header_unavailable`。第一行格式不是合法 header → `rejected_row/header_invalid` 並 file-level `header_missing`。空行本身仍只列 blank，不額外列 rejected。

逐行先從 bytes 界定 payload/EOL，再按唯一主要分類順序：1) payload 含任一裸 `0x0D` → rejected reason `bare_cr`；2) strict UTF-8 解碼失敗 → rejected `invalid_utf8`；3) 無有效 line-1 header 且 payload 非空 → rejected `header_unavailable`；4) line 1 欄名空／重複或其他標頭格式錯 → rejected `header_invalid`；5) payload 長度 0 → blank；6) 有效 header 後欄數不符 → isolated；7) 有效 header 後欄數相符 → data。每行只能有一個 primary class 和一個 primary rejected reason；diagnostic 附屬 metadata 可列次要觀察，但不得產生重複主分類。前四項優先序特別適用同列多錯誤。

`raw_line_base64` 僅含 payload bytes，不含 separator：LF 去掉 `0A`；CRLF 去掉末尾一組 `0D 0A`；NONE 保存 EOF 前所有 payload bytes。裸 CR 其餘 bytes 留在 payload。空 payload 的 base64 為空字串。Replay 先 payload bytes、再按 line_eol 補 `0A` / `0D 0A` / zero bytes。`byte_offset` 從原檔 byte 0（含 BOM）算，指向 payload 第一個 byte；空 payload 指向 separator 第一個 byte；physical_line 1 有 BOM 時 offset 為 3。每行 `payload_byte_length` 與 `eol_byte_length` 可推導且需輸出。

**恆等式**（每個檔案）：
- `total_physical_lines = header_lines + blank_lines + normal_data_rows + isolated_rows + rejected_rows`。
- `total_physical_lines = lf_lines + crlf_lines + none_lines`。
- `file_byte_length = bom_bytes + sum(payload_byte_length) + lf_lines + 2*crlf_lines`；
one_lines` 貢獻 0 EOL bytes。
- `payload_bytes_total = sum(payload_byte_length)`、`eol_bytes_total = lf_lines + 2*crlf_lines`，且 `file_byte_length = bom_bytes + payload_bytes_total + eol_bytes_total`。三式每次掃描即驗，不依賴 roundtrip 測試；任一失衡是 `BYTE_ACCOUNTING_MISMATCH` blocking/exit 14。

**邊界與期待結果**：
| Input bytes | Lines / class / file-level outcome |
|---|---|
| empty bytes | 0 lines；`file_empty` + `header_missing` blocking |
| BOM only | 0 lines；`file_empty` + `header_missing` blocking；3 BOM bytes |
| `LF + valid-header + LF` | line 1 blank；line 2 rejected/header_unavailable；`header_missing`；不把 line 2 當 header |
| all blank lines | each physical line blank；`header_missing`；每筆只計 blank |
| initial BOM + another UTF-8 BOM sequence in line-1 payload | strip only first BOM; decoded leading U+FEFF remains in header token and normally causes header_invalid; bytes preserved |
| `header LF data CRLF tail-NONE` | EOL counts 1 LF, 1 CRLF, 1 NONE; no virtual final line |
| bare CR within payload / terminal EOF CR | rejected/bare_cr; CR retained in base64 |
| invalid UTF-8 payload | rejected/invalid_utf8; original payload bytes retained |

A final LF closes the current line and creates no virtual following empty line. Two consecutive separators do create an empty physical line between them. Strict UTF-8 decoding is per line only after byte scanning. `test_roundtrip_raw` must reconstruct BOM + ordered payload + EOL and byte-compare to source; the independent byte equations above must also pass.

### 4.4 TSV 欄位解析與序列化契約
定義為無 quoting、無 escaping 的 UTF-8 TSV。`0x09` 是唯一欄位分隔 byte，LF/CRLF 是物理行分隔；欄位不能含 TAB/LF/CR，遇 TAB 即欄位邊界，不得推測為欄內跳脫。有效 payload 每行獨立 strict UTF-8 解碼；不得 trim、正規化 Unicode、轉大小寫、補空值或以解析後數值回寫。
Split 必須保留所有空 token（等價於 `Split(TAB, StringSplitOptions.None)`），包含首尾空欄與連續空欄。例如 `A<TAB><TAB>B<TAB>` 是 4 欄 `A`, `""`, `B`, `""`。零 byte payload 是 blank；一個或更多 TAB 的 payload 不是 blank，先切為空欄再依欄數分類。空或重複 header 名稱使標頭 rejected。
序列化時原順序 UTF-8（無 BOM）編碼每個 raw field，欄間插一個 TAB，空值輸出零 bytes，不 quote/escape；必須保留尾端空 tokens，序列化欄位數須等於原 token 數。欄數異常行不得從欄陣列序列化，改用原 payload base64。最後附原 EOL。合法 UTF-8 記錄以此可 roundtrip；拒絕列保留原 bytes。
合成 fixtures：空 payload、連續空欄、首空欄、尾空欄、多個尾空欄、TAB-only、欄數少／多、混合 EOL、無尾 EOL。零 byte payload 一律是 blank，故無法與單欄、單一空值資料列區分；此 TSV dialect 不支援該種單欄空值記錄，schema 不得要求其作為可表達資料值。Unicode 數字 raw 字串仍原樣保留；strict_int 另行判定。

### 4.5 `presence` × `parse_rule` × `parse_status` 矩陣（ASCII `strict_int`）
- **.NET ASCII 整數 regex**：`\A(?:0|-?[1-9][0-9]*)\z`，明用 `\A`/`\z` 全字串錨定；禁止 `$` 與 Unicode 數字 `\d`，且區分 `type_range` 與 `snapshot_observed_range`（`range_basis: "observed_in_snapshot"`）。
- 僅使用 ASCII `[0-9]`；不得使用 .NET Unicode `\d`。負面 fixtures 使用 Arabic-Indic `١`、Devanagari `१`、Fullwidth `１` 與 ASCII/Unicode 混合數字，皆須 failed/blocking 並保留 raw。全空白字串為 `presence: "non_empty"`；任何 failed 都 blocking 且不得切換指標。

| `parse_rule` | `presence` | 條件 | `parse_status` | `parsed` | 異常 / 行為 |
|---|---|---|---|---|---|
| `string_empty_to_null` | 
on_empty` | 合法 UTF-8（無裸 CR） | `ok` | 等同 `raw` | 無 |
| `string_empty_to_null` | `empty_string` | 
ullable: true` | 
ull_by_rule` | 
ull` | 無 |
| `string_empty_to_null` | `empty_string` | 
ullable: false` | `failed` | 
ull` | `blocking` |
| `strict_int` | 
on_empty` | 符合 `\A(?:0|-?[1-9][0-9]*)\z` 且在 `[min, max]` | `ok` | `int` | 無 |
| `strict_int` | 
on_empty` | 全空白、前導零、`-0`、Unicode 數字、非數字或超範圍 | `failed` | 
ull` | `blocking` |
| `strict_int` | `empty_string` | 
ullable: true` | 
ull_by_rule` | 
ull` | 無 |
| `strict_int` | `empty_string` | 
ullable: false` | `failed` | 
ull` | `blocking` |
| 
one` | 
on_empty` / `empty_string` | 暫不解析 | `skipped` | 
ull` | 無 |
| 任何規則 | `column_absent` | 僅合成測資可達 | `skipped` | 
ull` | `blocking` |
| 任何規則 | `row_isolated` | 已登記單一物理行欄數異常之基準列 | `skipped` | 
ull` | `isolating` |
| 任何規則 | `row_rejected` | 裸 CR、無效 UTF-8 等拒絕列 | `skipped` | 
ull` | `blocking` |
| 任何規則 | `row_blank` | 實質空白物理行 | `skipped` | 
ull` | `blocking` |

---

## 5. `catstat` 形態定位、`tcat` 唯一性與完整物理行統計公式

### 5.1 `catstat_record` 與 `catstat ↔ tcat` 唯一性條件
- `catstat_record`：`physical_row_index`（0-based）、`catstat_id`（`id` 欄整數）、`form_index`（僅在同 `catstat_id = k` 連續排列且列數等於 `cat.tsv` 之 `form_count` 時暫記 `0..(form_count - 1)`，標註 `form_index_basis: "row_order_within_id_unverified_order"`；否則標 
o_signal`）。
- 三項唯一性指標：`catstat_id_count(s)`（不同 `catstat_id` 數）、`catstat_rows_in_id(k, s)`（ID `k` 內不同資料列數）、`catstat_field_occurrences(k, s)`（僅供診斷）。
- `matched` 嚴格條件：`catstat` 該列與 `tcat(k)` 第 `j` 段存在逐位元組相等之非空非佔位符（.NET 判斷 `Regex.IsMatch(s, '\A[0-9]+_[0-9]+\z')`；整串錨定且僅 ASCII 數字）字串 `s`，且 `tcat_row_count(s) == 1`、`catstat_id_count(s) == 1`、`tcat_segment_indices_in_row(k, s) == {j}`、`catstat_rows_in_id(k, s) == 1`。雙方非空無交集 → `mismatch_observed`；其餘 → 
o_signal`（隔離列記 `unavailable_due_to_isolation`）。

### 5.2 物理行與 bytes 統計恆等式
每檔逐類統計：`total_physical_lines = header_lines + blank_lines + normal_data_rows + isolated_rows + rejected_rows = lf_lines + crlf_lines + none_lines`。Byte 層另驗：`file_byte_length = bom_bytes + payload_bytes_total + eol_bytes_total`，其中 `bom_bytes ∈ {0,3}`、`payload_bytes_total = Σ(payload_byte_length)`、`eol_bytes_total = lf_lines + 2*crlf_lines`；NONE 行 EOL 長度為 0。三式必在掃描當下成立，否則 `BYTE_ACCOUNTING_MISMATCH` blocking/exit14。
0-byte 與 BOM-only 檔均 0 physical lines 且皆觸發 file-level `file_empty` 與 `header_missing` blocking，不將 BOM 算作行。Header 只可能是物理行1；line1空白計 blank 並觸發 header_missing，後續 nonempty 列 rejected/header_unavailable；全 blank 檔每行只計 blank 並有 header_missing。invalid header line1 rejected/header_invalid 且 header_missing。末尾 LF 不造虛行；連續 separators 之間的每個空 payload 計 blank；未終止的非空末行計 NONE。物理行 primary class/reason 順序見 §4.2。`physical_row_index=physical_line-2` 僅適用有效 line-1 header 之後的資料物理行；其它為 null，不推算邏輯 index。

## 6. Anomaly 規則、規格自足邊界與 pinned config
所有 anomaly 經由單一 `New-PipelineAnomaly`。severity/blocking 由本規格核心規則或已 hash-pinned `anomaly_rules.json` 決定，呼叫端不可覆寫。若 rule id 不在 pinned catalog，使用 `UNKNOWN_RULE_ID`，強制 blocking。
本規格定義 lifecycle、byte protocol、schemas、error ids 與下列不可變核心規則；field semantic values 及 snapshot-specific expected anomaly rows 是 versioned private configuration input，不是隱藏行為規格。每次 build 必須在 private build artifacts 中保存輸入快照及 hash，以便重現；不得將 rights unknown 的 snapshot 公開。

| Core rule_id | 觸發 | Severity / blocking |
|---|---|---|
| `file_empty` | BOM 後 payload bytes 為 0（空檔或 BOM-only） | blocking |
| `header_missing` | physical line 1 不是合法 header | blocking |
| `bare_cr` | payload 有 CR 非 CRLF separator | blocking |
| `invalid_utf8` | 單行 strict UTF-8 decode fail | blocking |
| `header_invalid` | line 1 UTF-8 有效但欄名空／重複／格式錯 | blocking |
| `header_unavailable` | 無有效 line-1 header 的 nonempty 後續行 | blocking |
| `row_isolated` | 有效 header 後欄數錯；精確命中 expected baseline 時可 isolating/nonblocking | 由 exact expected rule 決定；unexpected 必 blocking |
| `parse_failed` | registered parse rule failed | blocking |
| `BYTE_ACCOUNTING_MISMATCH` | §4/§5 byte/line identity 不成立 | blocking |
| `UNKNOWN_RULE_ID` | 未註冊 rule id | blocking，不可降級 |

完整自足範圍：本文件完整定義 pipeline protocol 與上述 core behavior；`field_registry.json`、`anomaly_rules.json`、`expected_anomalies.json` 是明確列出的 versioned input data，不是本規格全文的一部分。它們必須各依 §7 JSON Schema interface 驗證，build manifest 記錄相對 input path、schema_version、byte length 及 SHA-256；Parser不得在 input 缺失、schema/hash不符時自行 fallback。

## 7. JSON Schema 與 publication gate

> **v2.3.12 schema precedence:** 本節舊版內嵌範例的非完整片段僅屬 v2.3.11 歷史，不是有效 schema。唯一可執行 schema 是 `schemas/v2.3.12/*.schema.json`；本版附錄 §9 是衝突時的規範文字。若外部 schema 與文字不一致，需先修訂並重新驗證，不可自行猜測。

Schemas 為 Draft 2020-12；額外欄位拒絕。JSON bytes 為 UTF-8 no BOM、property 順序固定、無多餘空白、不加尾端 newline；拒絕 unpaired surrogate。hash 對實際落盤 bytes 計算，reader 先 hash 原 bytes 再 parse。

### 7.1–7.3 External schema files

The executable Draft 2020-12 schemas are indexed in §9.1 under `schemas/v2.3.12/`. Candidate and complete manifests are the two branches of `build_manifest.schema.json`; sequence, allocation-related lifecycle, parsed rows, configs, dispositions, failure and recovery records have separate schemas. This section intentionally does not embed a second copy of schema JSON.

### 7.4 External config contracts and full publication gate

field_registry.json: schema_version="1.0", fields has exactly 50 entries; each requires field_name, source_file, zero-based source_column_index, source_label, scope (unknown/unit/form/global), value_type, nullable, parse_rule, type_range, snapshot_observed_range, semantic_status and evidence_refs. Unresolved semantic entries remain explicitly unverified with null ranges. This contract does not invent field meaning.

anomaly_rules.json: schema_version="1.0", rules array with unique rule_id; each rule requires severity (info/warning/isolating/blocking), blocking boolean and description. The core IDs in §6 are mandatory and cannot be weakened.

expected_anomalies.json: schema_version="1.0", source_manifest_sha256 and anomalies array. Each expected row requires rule_id, source_id, physical_line, byte_offset, raw_line_sha256, observed_column_count and expected_column_count. Identity tuple (rule_id, source_id, physical_line, byte_offset, raw_line_sha256) is unique. Only exact identity and matching counts are expected; any missing, extra or changed member is blocking.

Every build intended for parsed_current must pass all gates:
1. Source manifest schema/hash valid, anchored and formal; provisional source never publishes.
2. All ten source file byte lengths and SHA-256 values match.
3. Formal step 0 profile, 50-field registry, anomaly rules and expected anomaly snapshots exist, pass schema validation and are hash-pinned in build.
4. Execution scope is full.
5. No file_empty, header_missing, blank_row, rejected row, column_absent, parse failure, byte-accounting failure, or unexpected/missing/extra isolation; blocking_count is zero.
6. Required structural, exact mapping, byte-roundtrip, repeatability, manifest inventory/schema and publish-reader tests have actual PASS evidence in this build.
7. Complete manifest and exact artifact inventory validate.
8. Build is sealed under builds/<build_id>.
9. Under the publisher lock, previous pointer validates and candidate sequence is greater than its generation; exact same generation plus same build_id is idempotent success, same generation with a different build_id is integrity failure.
10. Rights gate: private pointer publication stays inside ACL-isolated private vault and exposes no file outside it. Any public/external release additionally requires rights explicitly cleared and P0 repo protections, allowlist, history scan and CI actually verified. Unknown rights never permit public release. Provisional source may not publish any pointer.

---

## 9. v2.3.12 規範補遺（覆蓋與本版衝突的舊文字）

本節與 `schemas/v2.3.12/` 是本版本唯一權威定義。§7.1–§7.3 內嵌 JSON 只作歷史解釋，不可直接作驗證輸入。所有 JSON Schema 為 Draft 2020-12，`$ref` 皆使用 schema 內部 JSON Pointer；validator 必須以 2020-12 dialect 載入。`build_manifest.schema.json` 的 candidate/complete 各自於含 `allOf` 的外層節點放 `unevaluatedProperties:false`，不放在單一 allOf child，避免 common properties 被錯拒。

### 9.1 Schema 索引與檔案布局

| Schema | 對應資料／路徑 | 主要 schema 檔 |
|---|---|---|
| Manifest | staging/builds `<id>/build_manifest.json` | `build_manifest.schema.json` |
| Sequence | `<vault>/build_sequence.json` | `build_sequence.schema.json` |
| Parsed row | `builds/<id>/parsed/<source_id>.jsonl` 每行一 JSON object | `parsed_artifacts.schema.json` |
| Lifecycle event | `<vault>/state/events/<20-digit-event-seq>.<uuid>.json` | `lifecycle_event.schema.json` |
| Field registry | 私有 `<vault>/config/field_registry.json` | `field_registry.schema.json` |
| Anomaly rules | 私有 `<vault>/config/anomaly_rules.json` | `anomaly_rules.schema.json` |
| Expected anomalies | 私有 `<vault>/config/expected_anomalies.json` | `expected_anomalies.schema.json` |
| Disposition | `<vault>/state/dispositions/<build_id>.jsonl` 每行一 event | `anomaly_disposition.schema.json` |
| Failure record | `<vault>/state/failures/<build_id>.json` | `failure_record.schema.json` |
| Recovery record | `<vault>/state/recoveries/<recovery_uuid>.json` | `recovery_record.schema.json` |
| Header contract | 私有 config 的每個 source header contract | `source_header_contract.schema.json` |

所有 schema/fixture 目錄均為合成規格資產，不含來源或解析資料。JSON Lines 使用 UTF-8 no BOM；每個 object 一行、LF 分隔且最後一行亦有 LF。JSON 字串依 RFC 8259 escape；禁止未配對 surrogate；JSON 數字僅有限整數或有限 decimal，不接受 NaN/Infinity。Property 順序由 serializer 契約固定；schema 本身不證明 canonical bytes。

Manifest schema 欄位完整性由 `build_manifest.schema.json` 定義：共同欄含 `schema_version/spec_version/record_class/publication_eligibility/build_disposition/build_state/build_id/build_sequence/created_at_utc/owner_uuid/source/execution`；complete 另含完成時間、三份 hash-pinned config、artifact inventory、statistics、gate/test evidence。Candidate 不得帶 complete 欄。跨欄位規則為 formal → `publication_eligibility=true` 與 `build_disposition=publishable`；provisional → `false` 與 `private_diagnostics`。Provisional publication-only gate 必標 `NOT_APPLICABLE`，不得生成 published receipt 或 pointer。Schema 不替代跨文件語意檢查：build_id sequence、source file inventory、unique paths、source/header/config hashes、gate evidence 實際 PASS 都須由 validator 檢查。

### 9.2 Physical line、bytes、TSV 與 parsed rows

輸入視為 byte array，不先解碼。只有檔案 offset 0 的 `EF BB BF` 是 BOM；最多移除這三個檔案級 bytes 一次。第二個 BOM 保留在 line payload，嚴格 UTF-8 解碼為 U+FEFF，若出現在 header 欄名則依 exact header mapping 判 `header_invalid`。BOM 不是物理行、不是 payload，也不放入 `raw_line_base64`。`raw_line_base64` 精確編碼該物理行 payload bytes，不含 BOM/EOL；包含無效 UTF-8、TAB、空白及空 payload（空 payload 的 Base64 是空字串）。`line_eol` 為 LF=`0A`、CRLF=`0D 0A`、NONE=`0 bytes`；任何非 CRLF 的 `0D` 都是 `bare_cr` blocking，仍保留於 payload 回放 bytes。

掃描規則：只以 `0A` 切行；緊鄰前一個 `0D` 併入 CRLF EOL。每個 LF 終止一行；末尾 LF 不另造虛行；連續 LF 間每段空 payload 是一個 blank physical line；剩餘未終止 bytes 若非空則為 NONE 行；0-byte 與 BOM-only 檔均為零行。`physical_line` 1-based，`byte_offset` 0-based 且以原檔 BOM 也計入；line 1 offset 為 BOM 長度（若有）。

每檔必須滿足：`file_byte_length = bom_bytes + payload_bytes_total + eol_bytes_total`；`payload_bytes_total = Σ payload_byte_length`；`eol_bytes_total = lf_lines + 2*crlf_lines`；`physical_lines = lf_lines + crlf_lines + none_lines = header_lines + blank_lines + normal_data_rows + isolated_rows + rejected_rows`。`bom_bytes ∈ {0,3}`。所有和為 64-bit checked arithmetic；溢位即 integrity failure，不飽和、不環繞。0-byte/BOM-only 均產生 file-level blocking `file_empty`、`header_missing`；它們不算物理行 primary class。全空行檔每行只算 blank，另有 file-level header_missing。

header 只能是物理行 1，絕不向後搜尋。現有工作樹未含任何上游 TSV 檔，因此無證據宣稱 9 個檔案有 header。對每個來源，`header_policy` 初始為 `unknown`、expected_columns 空陣列、evidence hash null；unknown 不可正式建置或發布。若後續證據支持 required，expected_columns 必須逐欄位 exact match，不 trim、不正規化、不忽略大小寫；空欄、重複欄、雙 BOM、非法 UTF-8 或欄數不符均拒絕。headerless 只可由經 evidence pin 的 `forbidden` contract 允許。診斷判定次序：policy unknown → `header_unavailable`（file-level blocking）；line 1 缺失/空 → `header_missing`；line 1 含裸 CR → `bare_cr`；UTF-8 無效 → `invalid_utf8`；policy required 下 UTF-8 可解碼但名稱/欄數不符 → `header_invalid`。line 1 不合法時後續非空行 `header_unavailable`，空行仍 `blank_row`。

每物理行恰有一個 primary class。primary reason 先後序：`bare_cr`、`invalid_utf8`、`header_invalid/header_unavailable`、`blank_row`、欄數異常（expected anomaly exact match 才為 isolated，否則 rejected）、欄位 parse failure（rejected）、正常 data。此序只決定單一主因；其它可安全收集的診斷另列 `secondary_diagnostics[]`，不得增加物理行主分類數。Byte 結構錯誤阻止對該行做語意轉換，但仍收集 source/file 級可安全錯誤。

TSV parser 對行 payload byte 以單一 TAB (`09`) 切分並保留每一 segment，不丟棄任何末端空欄。非空 payload 的 N 個 TAB 恆有 N+1 個 raw token；`a<TAB><TAB>b<TAB>` 必須是 `a`,``, `b`,`` 四欄。零 payload 是 `blank_row`、token 數為 0；本 dialect 不允許用非空 payload 表示單欄零長字串（歧義由 source contract 判為 unsupported）。`raw_fields` 是每 token 嚴格 UTF-8 解碼後字串，僅當整行 UTF-8 有效；原 byte 仍由 Base64 欄保存。序列化 raw TSV 行為 `UTF8(raw_fields[0]) + TAB + ...`，且必須等於 Base64 payload bytes；不能用 CSV/TSV library 的 trim 或 null conversion。異常欄數保留完整 token array，不補齊、不截斷。欄位超出 header mapping 時為 `column_absent` blocking，沒有合成 raw 欄位；缺欄列只保存實際 raw tokens。回放整個檔案時只在檔案開頭重建 BOM，按 physical line 次序串接 Base64 payload 與指定 EOL bytes；必須 byte-for-byte 等於 source SHA-256/length。

Parsed layout：`parsed/<source_id>.jsonl` 保存所有 physical line row record；`parsed/header_map.json` 保存 source_id、header physical_line、ordered raw header names 到 registry field ids 映射及 evidence hash；`parsed/statistics.json` 保存上列 byte/row equations與 file-level diagnostics；`derived/<name>.jsonl` 只存 build/source/physical_line/field-id references 與經 schema 定義的 parsed values，不複製無法追溯的原文。每個 row record 必含 build_id/build_sequence、source_id/path/byte_length/sha256、physical_line/byte_offset/line_eol、row_class/primary_reason、raw_line_base64/payload_byte_length/eol_byte_length、raw_fields 及 fields array。欄位 entry 必含 header index/name、raw、parsed、presence=`present|empty|absent`、parse_status=`parsed|empty|invalid|not_applicable` 及 parse_rule。blank/rejected/header-invalid 保留 raw bytes；fields 可空，但不產生虛構 parsed 值。`parsed_artifacts.schema.json` 是基礎 row schema；cross-record replay/offset 等需額外一致性驗證。

### 9.3 Header evidence 與外部 config schema

`field_registry.schema.json` 固定 50 fields。`type_range` 與 `snapshot_observed_range` 使用 discriminated object：
umeric(minimum,maximum)`、`string_length(minimum_length,maximum_length)`、`allowed_values(values)`、`unbounded`；未驗證語意仍使用 explicit `unbounded` 或 null bounds，不推論值域。`value_type` enum 為 string/integer/decimal/boolean/enum/list/unknown；`evidence_refs` 每項含 source id、relative path、physical line、byte offset、source SHA-256。`anomaly_rules` 含 rule id/severity/blocking/description/row class/value type；semantic validator 強制固定核心規則 severity/blocking 不可弱化且 rule id 唯一。`expected_anomalies` 必須 pin source manifest 和 anomaly rules SHA-256；每條依 rule/source/physical line/byte offset/raw-line SHA 唯一，觀察與預期欄數必填。三份 config 都在 vault/config，不在 repository registry。公開 `.github/policy/publish_allowlist.json` 只是一份 repo path policy，不能充當私有資料 registry。

`anomaly_disposition` 是只追加 triage event；`anomaly_key` 包含 build_id（外層）、source_id、physical_line、byte_offset、rule_id、raw_line_sha256 及對上述 canonical tuple 計算的 SHA-256。Disposition 不改變 rule severity、blocking、exit code、expected anomaly membership 或 gate 結果。Schema 驗證只證明 shape；跨檔 key/hash/rule-reference 一致性必須由 semantic validator 驗證。

### 9.4 Sequence、lifecycle、seal、publication 與復原

採用 allocation ledger 為序號唯一權威的 write-ahead 設計：sequence lock 下將完整 allocation JSON 寫唯一 temp、FlushFileBuffers、同目錄 no-replace rename 為 `<20-digit>.json`；rename 成功即消耗序號，之後即使 counter/staging/程序失敗也永不重用。再更新 counter、read-back，記錄 allocation UUID；build_id 是 `build-<20 digit sequence>-<同一 allocation UUID v4>`。Counter 缺失只允許全新空 vault、無 ledger/events/builds/pointer 的一次初始化為 1；否則以 ledger 檔名高水位與交叉證據復原，任何 uint64 overflow、檔名/內容歧異或無法證明安全上界一律 fail closed (13)。未驗證實際 FlushFileBuffers/volume crash 行為前不得稱 crash-durable。

Lock 順序唯一允許 `build_sequence.lock → active lease`，後者取得即釋放前者；builder 在完整 sealed/failed transition 前持 active lease，釋放後才可取 publish lock。GC/recovery 先以 sequence lock snapshot，再釋放，然後逐一取得 lease；不得巢狀反向鎖、publish lock 不與其它 lock 巢狀。鎖等待 30 秒、100 ms poll，timeout exit 14。Lock file 本身保留，僅 OS handle 表示活鎖；不得以 age 或刪 lock file 解鎖。

狀態推導函式以已驗證 evidence 為準，優先：若有 valid published event 且 current pointer 同 generation/build/hash → published；有 valid sealed event + sealed path/manifest/inventory hash → sealed；若 diagnostics failure record+failed event 成對一致 → failed；若 staging candidate 且 live lease → building；若 allocation exists but no build dir/event → allocated/recoverable；其餘為 inconsistent/needs-recovery，絕不推斷 failed。event type `sequence_recovered` 是 system event，build_id/build_sequence null 並帶 recovery id；build lifecycle event 均需 build identity。Events immutable、CreateNew，event_sequence 單調不重複；同一 build 允許多次 publish_failed 後成功 publish，但 sealed 只一次。LifecycleEvent 必填 schema_version/event_type/event_uuid/event_sequence/timestamp/actor/build identity nullable fields/manifest_sha256/inventory_sha256/error_id；seal event 的兩個 hash 必非 null。

狀態轉換合法序列：`allocated → building → complete → sealed → published` (formal)；`allocated → building → complete → sealed(private diagnostics)` (provisional)；任何 pre-seal gate/build error → `failed`；已分配但執行不可繼續 → failed 或可復原，不可遺失 allocation；低 sequence 在高 sequence 發布後嘗試 → `stale/superseded` 診斷狀態，不改已封存 build。Manifest candidate 先落 staging；gate 成功後以完整 complete manifest temp/flush/rename 替換，驗證 schema/hash/inventory，再建立 sealed ACL，將 staging 同卷 no-replace rename 至 builds/<id>，最後讀回驗證後 append sealed event。事件寫失敗可 recovery 補 event，不能回寫/修改 sealed build。FailureRecord 在嘗試移動診斷目錄前寫至 `state/failures/<build_id>.json`，CreateNew/flush/readback；內含 schema/build/sequence/allocation UUID/UTC/stage/error_id/診斷陣列/staging_path/diagnostic_path nullable/original_os_error。diagnostic_path 只有 staging 未建立或 move 失敗可 null。原 OS error 唯一來源為觸發失敗 Win32/API 呼叫當下擷取的 last-error；不可從後續檢查覆寫。

封存模型為 NTFS DACL ACL-hardening + same-volume rename。Vault custodian/admin 建根並核 ACL；builder 僅對 staging 內容有寫權，無 WRITE_DAC/WRITE_OWNER，且不得是可改 ACL 的 owner；seal coordinator 身分可建立目錄、設定 staging DACL、做 rename、寫 sealed event，但不能在封存後修改內容。Publisher 只讀 sealed build 並改 pointer/state；reader 只有 traverse/read；GC 對 sealed build 無 delete/write。Disable inheritance 並使用明確 DACL；sealed tree owner 採受控 custodian，OWNER RIGHTS 不授可寫權，拒絕 builder 的 WRITE_DAC/WRITE_OWNER。先套 final DACL、驗證 owner/inheritance/rights，再 rename；rename 失敗時 sealed DACL 留在 staging，重試或由 custodian 依 recovery record 恢復 staging ACL，再 move failed diagnostics，絕不改內容 bytes。拒絕 ADS（列舉 stream，僅允許 `::$DATA`）、hardlink count !=1、所有 reparse points、junction/symlink；colon/ADS path 禁止。Inventory 必含每個目錄與檔案的正規相對 path、kind、length、SHA-256、file identity/link count/stream list；實際 filesystem enumeration 必與 inventory exact-set 相等，extra/missing object blocking。ACL 只降低一般 builder 修改能力，不構成抗具管理員權限攻擊保證。

Seal event 的 `manifest_sha256` 是 SHA-256 對 `build_manifest.json` 精確落盤 bytes（UTF-8 no BOM；不 parse/reserialize）；`inventory_sha256` 對 canonical sorted inventory JSON bytes。Reader/GC/recovery 對 sealed、stale、unpublished、publish_failed build 一律先驗 event→build_id/sequence→manifest exact hash/schema→inventory hash→filesystem set/content hashes；無有效 seal event 不視為 sealed。sealed event 缺失但 sealed directory 已存在時，GC 不得標 failed；recovery 驗證全套後追加唯一 sealed event。`builds/<id>` 必須在將 allocation 稱 orphan 前先檢查。

已選模型 A：provisional build 可以 complete/seal 成 private diagnostics build，`publication_eligibility=false`、gate 為 NOT_APPLICABLE；不產生 parsed_current 或 published receipt。Gate fail 才是 failed；不得永久留 candidate，也不得把通過 diagnostics gate 的 provisional 誤標 failed。Stale 只適用 formal publisher。Provisional sealed build 受同一 ACL/inventory 規則保護。

GC/recovery 由 `pipeline_state.ps1 -Reconcile` (read-only)、`-Recover` (需 operator plan) 或 `-Gc -Apply` 明確觸發；builder/publisher startup 可呼叫唯讀 reconcile；無背景自動刪除。GC 前須 snapshot ledger/events/pointer，確認 builds/<id>、檢查 lease handle 後再決定；不刪 sealed build、allocation ledger、events 或 active lock file。Ledger allocation corruption 原 bytes 搬存 `state/recoveries/<id>/allocation.corrupt.bin`，對應 RecoveryRecord 記 hash、原 path、evidence、actor、decision、UTC 及 recovery UUID；不得從損毀 JSON猜序號。Counter rebuild 只有在 ledger 高水位足證不倒退時可做。RecoveryRecord 另包含 marker type (`missing|corrupt`)、missing signed marker HMAC-SHA256/key id、損毀 bytes保存相對路徑/hash；金鑰受 DPAPI/ACL 保護，無 key 即 fail closed。Pointer 壞/缺時停止 readers/publishers，保存 bytes 或 signed missing marker；人工 review sealed build、receipts 與事件後在 publish lock 下以原子 replace/no-replace 修復，讀者在 pointer/receipt 重驗前保持停止。Pointer temp 僅 owner 或 recovery 且持 publish lock 可清理。舊 sealed build不做自動 GC。

### 9.5 Error collection、exit codes、CreateDirectoryW 與 regex

同一 operation 盡量收集所有不依賴失效前置條件且不造成額外 I/O 的 diagnostics；每項含 `error_id/severity/blocking/stage/source_id/physical_line/byte_offset` nullable context 和唯一 OS error record。建立 deterministic exit code 時按下列優先度選最高優先錯誤，但不得丟棄其它已收集 diagnostics：13 integrity/config/schema/identity/counter corruption；11 required input missing；12 forbidden extra input; 10 trusted source byte length/hash mismatch；14 other blocking data/I/O/ACL/lock/FS capability/seal/publish/stale/unexpected exception；0 success。Exit table 只適用 pipeline command-line tools；schema validator harness 自身 0=所有 fixture expected result match，1=fixture mismatch/runner failure。Gate 8 超出 `expected_anomalies` 的 isolated rows 為 blocking、exit 14 (`UNEXPECTED_ISOLATION`)。

主要 error_id mapping：`SCHEMA_INVALID`/`CONFIG_SCHEMA_INVALID`/`MANIFEST_INVALID`/`SEQUENCE_CORRUPT`/`SEQUENCE_OVERFLOW`/`UUID_INVALID`/`PATH_INVALID`→13；`SOURCE_MISSING`→11；`SOURCE_EXTRA`→12；`SOURCE_HASH_MISMATCH`/`SOURCE_LENGTH_MISMATCH`→10；`FS_CAPABILITY_UNSUPPORTED`、`ACL_SEAL_FAILED`、`INVENTORY_MISMATCH`、`BUILD_GATE_FAILED`、`UNEXPECTED_ISOLATION`、`CREATE_DIRECTORY_FAILED`、`ATTEMPT_CREATE_RETRY_EXHAUSTED`、`BUILD_SEQUENCE_LOCK_TIMEOUT`、`PUBLISH_LOCK_TIMEOUT`、`PUBLISH_STALE_SEQUENCE`、`ATOMIC_REPLACE_FAILED`、`IO_FAILED`→14。

`CreateDirectoryW` 每個 parent/leaf component 分別建立並驗證標準化 containment、directory attribute、非 reparse point。回 183 僅表示競爭/已存在，必重新開啟驗證；既有 leaf attempt 名稱算 collision，取已驗證 max seq+1 和新 UUID，有限 16 次。ERROR_PATH_NOT_FOUND(3) 若 parent 建立步驟回傳，僅在已知 parent hierarchy 上最多重建/驗證一次；若 leaf call 回 3，先驗已知 parent，再重試 leaf 一次，第二次即 error 14。ERROR_ALREADY_EXISTS(183) 對 parent 不代表成功，若 parent 不是普通目錄或越界/reparse 即拒絕。5/123/206 及其它 Win32 error 不盲目重試；當次立即保存 GetLastWin32Error。TOCTOU 僅以 private vault trusted identities 為威脅模型；不可信 writer 可寫 vault 時拒絕執行或改 handle-relative API。所有 .NET regex 必須使用 `\A...\z` 全字串錨定；placeholder 數字只接受 ASCII `[0-9]`，Unicode digits（Arabic-Indic U+0661、Devanagari U+0967、Fullwidth U+FF11）及混合數字均負面 fixture。

### 9.6 v2.3.10 規則保留判定

| 規則 | 判定 | v2.3.12 處置 |
|---|---|---|
| 未實證不得宣稱 crash-durable | 保留 | FlushFileBuffers/volume crash 測試未 PASS 前只作必要前置，不宣稱保證。 |
| 整數溢位 fail closed | 保留並擴充 | 所有 counter/offset/stat sum 使用 checked uint64，溢位 exit 13。 |
| counter 缺失首次建立 | 明確化 | 僅完全空 vault 建 1；否則 recovery，無安全上界 fail closed。 |
| JSON escaping / integer-only | 保留 | RFC 8259 UTF-8 canonical bytes，拒絕 NaN/Infinity/unpaired surrogate。 |
| reader 不掃描 builds | 保留 | reader 僅讀 pointer 指定 build 和其 event/manifest/inventory；不挑選「最新」。 |
| reader 以 delete-sharing 開啟舊 build | 保留 | sealed 檔 read handle 使用 FILE_SHARE_READ|FILE_SHARE_DELETE，deny write；確保舊 reader 可在 pointer 切換後完成。 |
| 舊 build GC 政策 | 保留 | 不自動刪除 sealed builds；人工 retention 設計另行審查。 |
| pointer tmp 僅鎖內清理 | 保留 | owner 可在 publish lock 內清自身 temp；recovery 可在同鎖驗證後清理。 |

### 9.7 完整工具 exit code 範圍

| Tool / command | code 0 | code 10 | code 11 | code 12 | code 13 | code 14 |
|---|---|---|---|---|---|---|
| source verify/anchor/finalize | 正常 | anchored bytes mismatch | 必需 source 缺 | 多餘 source | manifest/schema/trust/counter identity | lock/API/IO/attempt failure |
| builder | complete/sealed 合法結果 | source hash/length mismatch | source missing | source extra | invalid schema/config/path/sequence | data gate/FS/ACL/IO/lock/stale |
| publisher | pointer commit/idempotent success | N/A | N/A | N/A | pointer/build integrity | gate/ACL/lock/atomic operation/stale |
| read/recovery/state | validation/reconcile success | N/A | N/A | N/A | corruption/inconsistent evidence | unavailable IO/lock/capability |
| schema fixture harness | fixture expectations all match | N/A | N/A | N/A | N/A | N/A |

### 9.8 N8 reconciliation matrix與流程

| Ledger/allocation | Lease | staging | builds/<id> | events/pointer | Reconcile/Recovery action |
|---|---|---|---|---|---|
| absent | none | absent | absent | none | 不存在 build；不推演 allocation。 |
| valid allocation | live | candidate/complete | absent | building | building；不得 GC。 |
| valid allocation | absent | candidate | absent | no terminal event | orphan 候選，先保全、人工 recovery；不得直接 failed。 |
| valid allocation | absent | absent | sealed directory | no sealed event | 先完整驗 manifest/hash/inventory/ACL，成功則追加 sealed event；失敗隔離並生成 recovery record。 |
| valid allocation | absent | absent | valid sealed build | sealed event, no receipt | sealed；formal 可重試 publish，provisional terminal private。 |
| valid allocation | absent | absent | valid sealed build | publish_failed | build 仍 sealed；只允許正式 build 在新 publish attempt retry。 |
| valid allocation | absent | absent | valid sealed build | published receipt + pointer matches | published/current。 |
| allocation bytes/schema corrupt | any | any | any | any | 保留 corrupt bytes/hash，exit 13；operator recovery only，不猜序號、不 GC。 |
| counter missing/corrupt | none | any | any | evidence exists | 根據 ledger高水位 + cross-check 修復並記 recovery，否則 exit 13。 |
| no allocation | none | orphan staging | absent | none | 非 pipeline-owned；隔離留存，人工調查，不標 build failed。 |

先讀 `builds/<build_id>/` 是 orphan 判斷必要步驟。GC 不可將可恢復 build 誤標 failed。Active lock cleanup 是關閉/釋放 OS handle，不刪檔。Ledger 常態讀 counter+last hash；只在 counter mismatch/恢復時掃描全 ledger O(N)，並先驗 filename、schema、hash chain；allocation corruption fail closed。Capability probe 在第一次建置前及 vault volume identity 改變後執行，測 same-volume no-replace rename、atomic replace visibility、FlushFileBuffers、DACL、ADS enumeration、hardlink count、reparse enumeration、delete-sharing 與 exclusive lock；報告存 state/fs-capability，未支援 exit 14，不以文字推理替代。
