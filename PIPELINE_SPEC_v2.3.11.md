# PIPELINE_SPEC_v2.3.11.md — Battle Cats 資料管線核心協定規格（v2.3.11）

- **規格狀態**：v2.3.11 草案，待獨立審查（**尚未凍結**）
- **上游來源目標**：`https://github.com/battlecatsinfo/battlecatsinfo.github.io`
- **目標快照 Commit**：`9441997393ebe2bd7fb2e9b19a97eed7d7b4a3ee`

---

## 1. 系統詞彙、生命週期與狀態合法組合

### 1.1 `record_class`（資料紀錄成熟度）
`source_manifest.json` 與 `build_manifest.json` 皆含 `record_class`：`illustrative`、`provisional`、`formal`。此欄位描述來源證據／資料成熟度，不描述建置階段、封存或發布。
`build_manifest.record_class=formal` 的必要條件：來源 Manifest `bootstrap_trust=anchored` 且 `record_class=formal`；正式 step 0 基準存在且 hashes 相符；本次全量而非局部執行；所有 blocking 數為 0；所有要求的結構、roundtrip、重現性與發布前 gate 測試結果皆為實際 PASS。封存是獨立狀態；Manifest 可在 staging 中寫成完整且 formal，隨後只有封存程序能移入 sealed root。`formal` 不聲稱 build 已封存或已發布。
`provisional` source 可以產生 private candidate 與 diagnostics，但永遠不能通過 publication gate。`illustrative` 只准用於規格範例，禁止發布。

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
| `builds/<build_id>/anomalies/` | **每次建置版本化產物** | 成功 build 的 anomaly artifacts 隨 build 一併雜湊與封存；失敗 build 的診斷另存 `state/failures/` 與 `diagnostics/failed/`。 |
| `anomalies/anomaly_dispositions.jsonl` | **僅新增（Append-Only）** | 人工處置事件僅能逐行追加，既有行不可修改或刪除。 |

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
`anomalies/` is inside each staging/sealed build and included in its inventory. No shared writable `anomalies/anomalies.json` exists. `state/`, `diagnostics/`, staging, sealed builds, and pointer must remain outside the Public Repository and on the same local filesystem. `allocations/` and `events/` are append-only; no GC deletes them.

#### State machines
Allocation/event lifecycle: the immutable allocation record establishes `allocated`; after the active lease is acquired, append `building`; terminal outcomes are `failed` (only before seal), `superseded` (stale before seal), or `sealed`. A sealed build may receive append-only publication attempt events `published`, `publish_failed`, or `stale`; these do not mutate the sealed build. `published` is emitted only after pointer commit; `publish_failed` records an attempt whose pointer did not commit; `stale` records a candidate older than the current pointer. A sealed build may be retried after `publish_failed`, while stale is terminal for that sequence. A later build becoming current never edits an earlier event or sealed build. Current/latest means exactly the build named by the valid `parsed_current.json`; its generation is the greatest successfully published `build_sequence`. Highest allocated/complete sequence is not necessarily latest/current.

`build_manifest.json` has `build_state=candidate` while in staging; it is atomically replaced by the final `build_state=complete` manifest only after build gates pass. External append-only event plus directory location distinguish lifecycle state: a complete manifest in staging is not yet sealed; a complete manifest under `builds/<build_id>/` is sealed only when its `sealed` event exists or recovery reconciles that event. Failed state is never written into or patched into the candidate manifest. Failure records/events live outside build contents. A sealed build is immutable even after publication failure, stale rejection, or later pointer changes.

#### Sequence allocation and crash windows
`build_sequence.json.next_sequence` means the **next number to allocate**; initial value is 1. Allocation of N gives the caller N, then advances the counter to N+1. Sequence gaps are valid; values never wrap, decrease, or repeat.
1. Acquire `build_sequence.lock` with OS `FileShare.None`, bounded wait of 30 seconds (100 ms polling). Timeout produces `BUILD_SEQUENCE_LOCK_TIMEOUT`, exit 14, no allocation.
2. While holding this lock only, reconcile the counter from the append-only allocation ledger, reserve N=`next_sequence`, construct unique build_id, serialize the complete allocation record to unique same-directory temp, flush and close, then atomic no-replace rename to `state/allocations/<seq>.json` (CreateNew destination). This rename is the allocation commit point: before it N is not consumed; after it N is consumed permanently.
3. Update `build_sequence.json` atomically to N+1 and read back. Then acquire the per-build active lease `state/active/<build_id>.lock` (`FileShare.None`) while still holding the sequence lock. The only allowed nested order is `build_sequence.lock` → per-build lease; no code may acquire them in reverse. Release sequence lock immediately after both the durable allocation record and lease are confirmed. If counter update or lease acquisition fails, leave the allocation record, write a best-effort `allocation_failed` event, consume N and stop; never reuse it.
4. Counter update/crash cases: crash before allocation rename leaves no committed allocation and N may be reused; crash after ledger rename but before counter update leaves N committed, next allocator heals counter to at least N+1; crash after counter update leaves a harmless gap if no build continues. Directory creation happens only after ledger commit and lease acquisition, so failure/crash remains traceable by allocation record even if no staging directory exists.

The allocation ledger record and counter are both written with UTF-8 canonical JSON (Appendix schemas). Allocation filenames must be canonical zero-padded decimal sequence and unique. For valid counter C and parseable ledger sequences S, repaired `next_sequence = max(C, max(S)+1, highest_sequence_in_verified_sealed_builds+1, parsed_current.generation+1)`; allocation ledger is never pruned, so its maximum is the normal source of truth. A corrupt counter is copied byte-for-byte to `state/recoveries/` with SHA-256, then under the sequence lock reconstructed from valid allocation filenames and cross-checked against sealed manifests, diagnostics, events and pointer. Append a recovery record with old hash, evidence, computed value and operator identity before replacing the counter. If ledger filenames/records and other evidence cannot establish a safe upper bound, fail closed (exit 13); restore a trusted backup or require a separately reviewed new storage root. Never reset sequence to 1 over existing evidence.

**Ledger proposal and crash/uniqueness analysis.** The ledger is used as a write-ahead reservation because writing the counter first can consume N without leaving evidence, while writing an ordinary append-only line can leave a torn tail. The reservation becomes committed only when the complete temp has been flushed/closed and atomically renamed to its canonical, previously absent sequence filename while the exclusive sequence lock is held. The exclusive lock serializes allocators; destination no-replace semantics independently reject duplicate N. Before that rename, no allocation exists and N may be retried; after it, even if counter update, lease acquisition, event writing, or directory creation fails, N remains permanently consumed and recoverable. Recovery never infers an allocation from an uncommitted temp. If rename atomicity/no-replace or flush behavior cannot be established on the chosen filesystem, allocation is disabled rather than weakening uniqueness. The counter is a recoverable cache of the ledger high-water mark, not the uniqueness authority.

#### Candidate liveness, failure, and recovery
After allocation, `state/active/<build_id>.lock` is held for the entire build-through-seal/failure transition. Its OS handle, not a PID or heartbeat timestamp, indicates a live owner; process termination releases it. GC first snapshots allocations while holding sequence lock, releases that lock, then probes each per-build lease exclusively. A live lease means skip. An unlocked allocation with no terminal event is an orphan and can be reconciled as failed; GC must never hold sequence lock while acquiring a per-build lease. Staging candidates older than any age threshold are not failed solely by age while a lease is held.
After the lease is acquired, append `building`, then CreateNew `builds/.staging/<build_id>/` and write a candidate manifest atomically as the first file. Build artifacts, including `anomalies/`, are private to that build. On any failure before seal, write a uniquely named same-directory temporary failure JSON, flush/close, validate against §7.3, then atomically no-replace rename to `state/failures/<build_id>.json`; the record includes error_id, stage, UTC time, allocation id, diagnostics refs, staging/destination paths and original OS error. Next move staging to `diagnostics/failed/<build_id>/` by same-volume no-replace directory rename, then CreateNew the immutable `failed` event. If staging never existed, still write failure record and event. If recording/rename itself fails, preserve the original failure and append a secondary `failure_record_write_failed` diagnostic/event where possible; do not claim the failure transition is complete. A crash between any steps is reconciled from allocation, failure record, staging and diagnostics path; GC appends missing records/events only after verifying existing evidence, never rewriting an existing failure record or event. Allocation temp files are eligible for cleanup only while holding the sequence lock and only when no ledger reservation exists; incomplete uncommitted temps never consume a sequence. Build/pointer temps are owned by UUID and may be removed only by their owner after failed pre-commit or by recovery after proving no live owner and no commit occurred.

#### Complete and seal
Publication gates are fully evaluated before final manifest creation (Appendix §7.4). First perform a lock-free atomic read of current pointer as an early stale check; if its generation exceeds this sequence, write stale/superseded diagnostics and stop before sealing. This check is advisory; repeat under publish lock.
Build complete manifest in staging as a unique temp, flush, close, validate schema and exact inventory, then atomically replace candidate manifest with `build_state=complete`. Inventory lists every regular file recursively under the build except `build_manifest.json` itself and no temp/lock/diagnostic/state files; reject symlinks, reparse points, duplicate paths, absolute paths, `.`/`..`, extra or missing files. The reader verifies exact set equality and every byte length/SHA-256.
Seal only by applying the configured Windows ACL that removes write/delete access from the builder identity while granting read to consumer and narrowly scoped seal service, verifying resulting ACL and inventory, then same-volume no-replace rename of staging to `builds/<build_id>/`. This is an operational immutability control, not protection against an administrator intentionally changing ACLs; all readers re-hash the full inventory. If ACL/rename/verification fails, do not publish; write external failure record/event and move the unsealed candidate to diagnostics. After successful rename, CreateNew a `sealed` event; recovery can infer and add this event only after validating the complete manifest, exact inventory and ACL. Release active lease before any publication lock is acquired.

#### Stale and publication protocol
Stale is `PUBLISH_STALE_SEQUENCE`, exit 14. Before expensive finalization, compare valid pointer generation as an optimization; under `parsed_current.publish.lock`, compare again as the authoritative gate. If active generation > candidate sequence, do not modify sealed build; append a `stale` event/attempt record in `state/events/`, retain sealed build, return 14. If stale is found before seal, move staging to `diagnostics/superseded/` and append `superseded`. High sequence published first permanently makes later lower-sequence attempts stale. Equal sequence/equal build_id is idempotent success; equal sequence/different build_id is integrity error 13.
Acquire publish lock using FileShare.None with 30 second bounded wait. Timeout `PUBLISH_LOCK_TIMEOUT`, exit 14. Under it validate prior pointer/current build, create unique `parsed_current.<uuid>.tmp` with CreateNew, flush/close/readback, validate the full gate and manifest hash, then first publish uses same-volume atomic no-replace rename; subsequent publish uses a platform operation experimentally established to atomically replace one file with another. Never delete target before move. The operation success is the pointer commit point. `parsed_current.generation` MUST equal both the sealed manifest's `build_sequence` and the decimal sequence embedded in `active_build_id`; the reader verifies all three, exact `parsed_path`, manifest hash and full inventory before exposing data. Before commit failure: current pointer unchanged, remove only this publisher's temp; append `publish_failed` event/record; sealed build remains. After commit, failure to write `published` receipt/event does not roll back; pointer is authoritative and recovery appends missing event after validating it. If replace returns error, reread pointer: candidate pointer means success; prior valid pointer means failed retryable; missing/corrupt target is fail closed exit 13. Receipt is CreateNew at `state/events/<seq>.published.<uuid>.json`, outside sealed build.

#### Manual pointer recovery
Missing pointer is first-publish eligible only when no prior published event/receipt exists and no prior pointer evidence exists. If it is missing after prior publication, or malformed/hash-invalid, stop all readers/publishers and fail closed (13); do not select a build automatically. Preserve damaged bytes (or a signed `missing` marker), hash them, and record them under `state/recoveries/`. An authorized operator reviews every sealed candidate's complete manifest, exact inventory and hashes plus published event history and chooses the last known valid pointer state; write a recovery plan with selected build_id/generation, evidence, operator, time and reason under `state/recoveries/`. Under the publish lock, revalidate, construct a fresh unique pointer temp and commit by the same tested atomic replace/no-replace operation; append a `pointer_recovered` event after commit. Readers remain stopped until pointer and receipt validate. Never hand-edit the pointer or lower generation without separately reviewed rollback authorization.

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
- `file_byte_length = bom_bytes + sum(payload_byte_length) + lf_lines + 2*crlf_lines`；`none_lines` 貢獻 0 EOL bytes。
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
| `string_empty_to_null` | `non_empty` | 合法 UTF-8（無裸 CR） | `ok` | 等同 `raw` | 無 |
| `string_empty_to_null` | `empty_string` | `nullable: true` | `null_by_rule` | `null` | 無 |
| `string_empty_to_null` | `empty_string` | `nullable: false` | `failed` | `null` | `blocking` |
| `strict_int` | `non_empty` | 符合 `\A(?:0|-?[1-9][0-9]*)\z` 且在 `[min, max]` | `ok` | `int` | 無 |
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
- `matched` 嚴格條件：`catstat` 該列與 `tcat(k)` 第 `j` 段存在逐位元組相等之非空非佔位符（.NET 判斷 `Regex.IsMatch(s, '\A[0-9]+_[0-9]+\z')`；整串錨定且僅 ASCII 數字）字串 `s`，且 `tcat_row_count(s) == 1`、`catstat_id_count(s) == 1`、`tcat_segment_indices_in_row(k, s) == {j}`、`catstat_rows_in_id(k, s) == 1`。雙方非空無交集 → `mismatch_observed`；其餘 → `no_signal`（隔離列記 `unavailable_due_to_isolation`）。

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

Schemas 為 Draft 2020-12；額外欄位拒絕。JSON bytes 為 UTF-8 no BOM、property 順序固定、無多餘空白、不加尾端 newline；拒絕 unpaired surrogate。hash 對實際落盤 bytes 計算，reader 先 hash 原 bytes 再 parse。

### 7.1 build_manifest.json schema

Candidate schema 僅位於 builds/.staging/<build_id>/；complete schema 在通過 gate 後寫入 staging，seal 後不可變。Manifest 自身不列在 artifacts（避免自我雜湊）；pointer 記錄其 byte SHA-256。交叉欄位規則：build_id 所含 sequence 必須等於 build_sequence；完整 inventory 必須與磁碟檔案集合相等。

    {
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      "$id": "https://battlecatsbattlecat-arch.github.io/schemas/build_manifest-1.0.json",
      "oneOf": [{"$ref":"#/$defs/candidate"},{"$ref":"#/$defs/complete"}],
      "$defs": {
        "sha": {"type":"string","pattern":"^[0-9a-f]{64}$"},
        "uuid": {"type":"string","pattern":"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},
        "build_id": {"type":"string","pattern":"^build-[0-9]{20,}-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},
        "utc": {"type":"string","format":"date-time","pattern":"Z$"},
        "source": {
          "type":"object","additionalProperties":false,
          "required":["manifest_sha256","record_class","bootstrap_trust","snapshot_commit","step0_status","files"],
          "properties":{
            "manifest_sha256":{"$ref":"#/$defs/sha"},
            "record_class":{"enum":["provisional","formal"]},
            "bootstrap_trust":{"enum":["first_use","anchored"]},
            "snapshot_commit":{"type":["string","null"],"pattern":"^[0-9a-f]{40}$"},
            "step0_status":{"enum":["pending","formal"]},
            "files":{"type":"array","minItems":10,"maxItems":10,"items":{
              "type":"object","additionalProperties":false,"required":["path","sha256","origin","rights_class"],
              "properties":{
                "path":{"type":"string","minLength":1},"sha256":{"$ref":"#/$defs/sha"},
                "origin":{"enum":["upstream","local_generated"]},
                "rights_class":{"enum":["code","upstream_curated_data","game_source_data","third_party_reference","local_generated_metadata","unknown"]}
              }
            }}
          }
        },
        "execution":{
          "type":"object","additionalProperties":false,"required":["scope","pipeline_revision","selected_ids"],
          "properties":{
            "scope":{"enum":["full","partial"]},"pipeline_revision":{"type":"string","minLength":1},
            "selected_ids":{"type":"array","uniqueItems":true,"items":{"type":"integer","minimum":0}}
          }
        },
        "common":{
          "type":"object",
          "required":["schema_version","spec_version","record_class","build_state","build_id","build_sequence","created_at_utc","owner_uuid","source","execution"],
          "properties":{
            "schema_version":{"const":"1.0"},"spec_version":{"const":"2.3.11"},
            "record_class":{"enum":["provisional","formal"]},"build_state":{"enum":["candidate","complete"]},
            "build_id":{"$ref":"#/$defs/build_id"},"build_sequence":{"type":"integer","minimum":1},
            "created_at_utc":{"$ref":"#/$defs/utc"},"owner_uuid":{"$ref":"#/$defs/uuid"},
            "source":{"$ref":"#/$defs/source"},"execution":{"$ref":"#/$defs/execution"}
          }
        },
        "candidate":{
          "allOf":[{"$ref":"#/$defs/common"},
            {"type":"object","properties":{"build_state":{"const":"candidate"}},"required":["build_state"],"unevaluatedProperties":false}]
        },
        "complete":{
          "allOf":[{"$ref":"#/$defs/common"},
            {
          "type":"object","unevaluatedProperties":false,
              "required":["build_state","completed_at_utc","configuration_inputs","artifacts","statistics","gate_results","test_results"],
              "properties":{
                "build_state":{"const":"complete"},"completed_at_utc":{"$ref":"#/$defs/utc"},
                "configuration_inputs":{"type":"array","minItems":3,"maxItems":3,"items":{
                  "type":"object","additionalProperties":false,"required":["path","schema_version","byte_length","sha256"],
                  "properties":{
                    "path":{"enum":["registry/field_registry.json","registry/anomaly_rules.json","registry/expected_anomalies.json"]},
                    "schema_version":{"type":"string","minLength":1},"byte_length":{"type":"integer","minimum":0},"sha256":{"$ref":"#/$defs/sha"}
                  }
                }},
                "artifacts":{"type":"array","minItems":1,"items":{
                  "type":"object","additionalProperties":false,"required":["path","byte_length","sha256","kind"],
                  "properties":{
                    "path":{"type":"string","minLength":1},"byte_length":{"type":"integer","minimum":0},"sha256":{"$ref":"#/$defs/sha"},
                    "kind":{"enum":["parsed","derived","anomalies","reports","registry_snapshot"]}
                  }
                }},
                "statistics":{
                  "type":"object","additionalProperties":false,"required":["blocking_count","isolated_rows","unexpected_isolated_rows","files"],
                  "properties":{
                    "blocking_count":{"type":"integer","minimum":0},"isolated_rows":{"type":"integer","minimum":0},
                    "unexpected_isolated_rows":{"type":"integer","minimum":0},
                    "files":{"type":"array","items":{
                      "type":"object","additionalProperties":false,
                      "required":["source_id","file_byte_length","bom_bytes","payload_bytes_total","eol_bytes_total","total_physical_lines","header_lines","blank_lines","normal_data_rows","isolated_rows","rejected_rows","lf_lines","crlf_lines","none_lines"],
                      "properties":{
                        "source_id":{"type":"string"},"file_byte_length":{"type":"integer","minimum":0},"bom_bytes":{"enum":[0,3]},
                        "payload_bytes_total":{"type":"integer","minimum":0},"eol_bytes_total":{"type":"integer","minimum":0},
                        "total_physical_lines":{"type":"integer","minimum":0},"header_lines":{"type":"integer","minimum":0,"maximum":1},
                        "blank_lines":{"type":"integer","minimum":0},"normal_data_rows":{"type":"integer","minimum":0},
                        "isolated_rows":{"type":"integer","minimum":0},"rejected_rows":{"type":"integer","minimum":0},
                        "lf_lines":{"type":"integer","minimum":0},"crlf_lines":{"type":"integer","minimum":0},"none_lines":{"type":"integer","minimum":0}
                      }
                    }}
                  }
                },
                "gate_results":{"type":"array","minItems":1,"items":{
                  "type":"object","additionalProperties":false,"required":["gate_id","status","evidence_sha256"],
                  "properties":{"gate_id":{"type":"string","minLength":1},"status":{"const":"PASS"},"evidence_sha256":{"$ref":"#/$defs/sha"}}
                }},
                "test_results":{"type":"array","minItems":1,"items":{
                  "type":"object","additionalProperties":false,"required":["test_id","status","evidence_sha256"],
                  "properties":{"test_id":{"type":"string","minLength":1},"status":{"const":"PASS"},"evidence_sha256":{"$ref":"#/$defs/sha"}}
                }}
              },
              "allOf":[{
                "if":{"properties":{"record_class":{"const":"formal"}}},
                "then":{"properties":{
                  "source":{"properties":{"record_class":{"const":"formal"},"bootstrap_trust":{"const":"anchored"},"step0_status":{"const":"formal"}}},
                  "execution":{"properties":{"scope":{"const":"full"},"selected_ids":{"maxItems":0}}},
                  "statistics":{"properties":{"blocking_count":{"const":0},"unexpected_isolated_rows":{"const":0}}}
                }}
              }]
            }
          ]
        }
      }
    }

Candidate schema contains common fields only. Complete schema adds the final inventory, stats and actual PASS evidence; event/receipt state is never written back into it.

### 7.2 build_sequence.json schema

next_sequence means next-to-allocate; initial value is 1. Allocation of N commits the ledger first, then counter becomes N+1.

    {
      "$schema":"https://json-schema.org/draft/2020-12/schema",
      "$id":"https://battlecatsbattlecat-arch.github.io/schemas/build_sequence-1.0.json",
      "type":"object","additionalProperties":false,
      "required":["schema_version","next_sequence","updated_at_utc","last_allocation_sha256"],
      "properties":{
        "schema_version":{"const":"1.0"},
        "next_sequence":{"type":"integer","minimum":1},
        "updated_at_utc":{"type":"string","format":"date-time","pattern":"Z$"},
        "last_allocation_sha256":{"type":["string","null"],"pattern":"^[0-9a-f]{64}$"}
      }
    }

### 7.3 Allocation, event, failure, pointer, recovery schemas

Each named definition below is a separate schema, uses additionalProperties=false and canonical JSON; IDs are UUIDv4; sequence filenames use 20-digit zero-padded ASCII decimal. `parsed_path` must equal exactly `builds/<active_build_id>/parsed/` after substituting the identifier; readers reject any other relative path even where the generic string schema accepts it.

    {
      "AllocationRecord":{
        "$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","additionalProperties":false,
        "required":["schema_version","event_type","build_sequence","build_id","allocation_uuid","owner_uuid","created_at_utc","spec_version"],
        "properties":{
          "schema_version":{"const":"1.0"},"event_type":{"const":"allocated"},"build_sequence":{"type":"integer","minimum":1},
          "build_id":{"type":"string","pattern":"^build-[0-9]{20,}-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},
          "allocation_uuid":{"type":"string","format":"uuid"},"owner_uuid":{"type":"string","format":"uuid"},
          "created_at_utc":{"type":"string","format":"date-time","pattern":"Z$"},"spec_version":{"const":"2.3.11"}
        }
      },
      "LifecycleEvent":{
        "$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","additionalProperties":false,
        "required":["schema_version","event_type","event_uuid","build_sequence","build_id","created_at_utc","actor_uuid"],
        "properties":{
          "schema_version":{"const":"1.0"},
          "event_type":{"enum":["building","failed","failure_record_write_failed","sealed","published","publish_failed","stale","superseded","allocation_failed","sequence_recovered","pointer_recovered"]},
          "event_uuid":{"type":"string","format":"uuid"},"build_sequence":{"type":"integer","minimum":1},"build_id":{"type":"string"},
          "created_at_utc":{"type":"string","format":"date-time","pattern":"Z$"},"actor_uuid":{"type":"string","format":"uuid"},
          "error_id":{"type":["string","null"]},"diagnostic_path":{"type":["string","null"]},
          "pointer_sha256":{"type":["string","null"],"pattern":"^[0-9a-f]{64}$"},
          "generation":{"type":["integer","null"],"minimum":1},"reason":{"type":["string","null"]}
        }
      },
      "FailureRecord":{
        "$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","additionalProperties":false,
        "required":["schema_version","build_id","build_sequence","allocation_uuid","failed_at_utc","stage","error_id","diagnostics","staging_path","diagnostic_path","original_os_error"],
        "properties":{
          "schema_version":{"const":"1.0"},"build_id":{"type":"string"},"build_sequence":{"type":"integer","minimum":1},"allocation_uuid":{"type":"string","format":"uuid"},
          "failed_at_utc":{"type":"string","format":"date-time","pattern":"Z$"},"stage":{"type":"string"},"error_id":{"type":"string"},
          "diagnostics":{"type":"array","items":{"type":"object","additionalProperties":false,"required":["message_code","os_code"],"properties":{"message_code":{"type":"string"},"os_code":{"type":["integer","null"]}}}},
          "staging_path":{"type":["string","null"]},"diagnostic_path":{"type":"string"},
          "original_os_error":{"oneOf":[{"type":"null"},{"type":"object","additionalProperties":false,"required":["api","code","message_code"],"properties":{"api":{"enum":["Win32","HRESULT","other"]},"code":{"type":["integer","null"]},"message_code":{"type":"string"}}}]}
        }
      },
      "ParsedCurrent":{
        "$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","additionalProperties":false,
        "required":["schema_version","generation","publication_state","active_build_id","parsed_path","build_manifest_sha256","published_at_utc","publisher_uuid"],
        "properties":{
          "schema_version":{"const":"1.0"},"generation":{"type":"integer","minimum":1},"publication_state":{"const":"published"},
          "active_build_id":{"type":"string","pattern":"^build-[0-9]{20,}-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"},
          "parsed_path":{"type":"string","minLength":1},"build_manifest_sha256":{"type":"string","pattern":"^[0-9a-f]{64}$"},
          "published_at_utc":{"type":"string","format":"date-time","pattern":"Z$"},"publisher_uuid":{"type":"string","format":"uuid"}
        }
      },
      "RecoveryRecord":{
        "$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","additionalProperties":false,
        "required":["schema_version","recovery_uuid","recovery_type","created_at_utc","operator","evidence","decision"],
        "properties":{
          "schema_version":{"const":"1.0"},"recovery_uuid":{"type":"string","format":"uuid"},
          "recovery_type":{"enum":["sequence_counter","parsed_current"]},
          "created_at_utc":{"type":"string","format":"date-time","pattern":"Z$"},
          "operator":{"type":"string","minLength":1},"evidence":{"type":"array","minItems":1,"items":{"type":"string"}},
          "decision":{"type":"string","minLength":1},"damaged_bytes_sha256":{"type":["string","null"],"pattern":"^[0-9a-f]{64}$"}
        }
      }
    }

The object above groups independent schemas for readability; implementations store and validate each separately.

### 7.4 External config contracts and full publication gate

field_registry.json: schema_version="1.0", fields has exactly 50 entries; each requires field_name, source_file, zero-based source_column_index, source_label, scope (unknown/unit/form/global), value_type, nullable, parse_rule, type_range, snapshot_observed_range, semantic_status and evidence_refs. Unresolved semantic entries remain explicitly unverified with null ranges. This contract does not invent field meaning.

anomaly_rules.json: schema_version="1.0", rules array with unique rule_id; each rule requires severity (info/warning/isolating/blocking), blocking boolean and description. The core IDs in §6 are mandatory and cannot be weakened.

expected_anomalies.json: schema_version="1.0", source_manifest_sha256 and anomalies array. Each expected row requires rule_id, source_id, physical_line, byte_offset, raw_line_sha256, observed_column_count and expected_column_count. Identity tuple (rule_id, source_id, physical_line, byte_offset, raw_line_sha256) is unique. Only exact identity and matching counts are expected; any missing, extra or changed member is blocking.

Every build intended for parsed_current must pass all gates:
1. Source manifest schema/hash valid, anchored and formal; provisional source never publishes.
2. All ten source file byte lengths and SHA-256 values match.
3. Formal step 0 profile, 50-field registry, anomaly rules and expected anomaly snapshots exist, pass schema validation and are hash-pinned in build.
4. Execution scope is full.
5. No file_empty, header_missing, rejected row, parse failure, byte-accounting failure, or unexpected/missing/extra isolation; blocking_count is zero.
6. Required structural, exact mapping, byte-roundtrip, repeatability, manifest inventory/schema and publish-reader tests have actual PASS evidence in this build.
7. Complete manifest and exact artifact inventory validate.
8. Build is sealed under builds/<build_id>.
9. Under the publisher lock, previous pointer validates and candidate sequence is greater than its generation; exact same generation plus same build_id is idempotent success, same generation with a different build_id is integrity failure.
10. Rights gate: private pointer publication stays inside ACL-isolated private vault and exposes no file outside it. Any public/external release additionally requires rights explicitly cleared and P0 repo protections, allowlist, history scan and CI actually verified. Unknown rights never permit public release. Provisional source may not publish any pointer.
