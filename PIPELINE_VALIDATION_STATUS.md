# PIPELINE_VALIDATION_STATUS — v2.3.12

`PASS` 僅表示指定命令實際成功；文件 review 記為 AUTHOR SELF-REVIEW。Parser、source、production artifacts 未執行/修改。本版未凍結。

## 基準與文件審查

| 檢查 | 狀態 | 記錄 |
|---|---|---|
| Git branch | PASS | `codex/pipeline-handoff` |
| 開工時最新遠端 HEAD / tree | PASS | GitHub API branch HEAD `e8b14750dba9eab490c75913e402b398e7b71309`; tree 等同本地基準內容。 |
| Source TSV 探查 | PASS | 在工作樹檔案清單查找 `.tsv`/上游 source 未發現來源 bytes；不據此宣稱 header。 |
| Claude ID crosswalk 自我檢視 | AUTHOR SELF-REVIEW | `PIPELINE_CODEX_REVIEW.md`; 不是獨立審查。 |
| v2.3.10/11 safety rule disposition | AUTHOR SELF-REVIEW | 8 項保留/明確化見 review §7。 |

## Draft 2020-12 JSON Schema fixture validation

| 測試 | 狀態 | 結果 |
|---|---|---|
| N1 原 v2.3.11 schema positive candidate/complete | FAIL (reproduction) | Ajv 8.20.0 拒絕兩份合法形狀 manifest，確認 `unevaluatedProperties` placement 缺陷。 |
| v2.3.12 schema fixture harness | PASS | Ajv 8.20.0 `ajv/dist/2020`; ajv-formats 3.0.1; Node.js v24.22.3。命令見下。58 fixtures、0 failures、exit 0。 |
| `$schema/$ref/allOf/unevaluatedProperties` semantic check | PASS (schema compile via Ajv) | `allOf` common refs compile; positive candidate/complete accepted; unknown root property rejected. |
| Full JSON schema files | PASS | All 11 Draft 2020-12 schemas compiled by Ajv harness and exercised by positive/negative synthetic fixtures. |

Reproduce in PowerShell, with Ajv runtime in temporary directory (not part of repository):

```powershell
node scripts/generate_v2_3_12_fixtures.cjs
$env:NODE_PATH='C:\Users\user\Documents\Codex\2026-11-26\battle-cats-github-repository-https-github\work\_ajv2020_runtime\node_modules'
node scripts/validate_v2_3_12_schemas.cjs
```

Expected test meaning is fixture validity agreement; this does not assert business semantics or implementation correctness. Ajv is Draft 2020-12 implementation and `ajv-formats` registers date-time/UUID formats.

## Schema fixture suites

| Suite | 狀態 | Scope |
|---|---|---|
| Manifest positive candidate + complete | PASS | 合法 provisional candidate, formal complete |
| Manifest negative unknown/missing/type/enum/UUID | PASS | 5 個負向 fixtures |
| Sequence positive/negative | PASS | synthetic positive + negative |
| Parsed artifact positive/negative | PASS | structural and base64 syntax; not byte replay |
| Field registry / anomaly rules / expected anomalies | PASS | synthetic structural examples |
| Disposition / lifecycle / header contract | PASS | synthetic structural examples |
| RecoveryRecord / FailureRecord | PASS | Structural positive/negative fixtures; HMAC signing behavior and OS error capture remain implementation NOT RUN. |
| Cross-file semantic constraints | NOT RUN | Must be implemented by future validator |

## Tests NOT RUN

| Test | Status |
|---|---|
| TSV byte fixtures: LF/CRLF/NONE/bare CR/invalid UTF-8/BOM/blank/roundtrip | NOT RUN |
| Physical line counts and byte accounting equations against bytes | NOT RUN |
| TSV trailing/consecutive empty columns and abnormal field counts | NOT RUN |
| Unicode digit placeholder negative tests | NOT RUN |
| Exact header rules on 9 upstream sources | NOT RUN (source bytes unavailable) |
| Gate 6 repeatability / exact mapping | NOT RUN |
| ACL seal validity; builder write denied on sealed build | NOT RUN |
| Filesystem capability probe | NOT RUN |
| Staging→builds same-volume no-replace rename | NOT RUN |
| FlushFileBuffers / crash durability | NOT RUN |
| Recovery/GC reconciliation/crash windows | NOT RUN |
| ADS/hardlink/reparse point tests | NOT RUN |
| Provisional lifecycle integration | NOT RUN |
| Exit code/error_id mapping | NOT RUN |
| parsed_current initial/concurrent/replace/read-side integrity | NOT RUN |
| Publish allowlist | NOT RUN |
| Public history scan and CI/pre-push checks | NOT RUN |
| Branch protection/rulesets/CODEOWNERS | NOT RUN |
| Source anchoring/license/rights clearance | NOT RUN |

P0 remain OPEN. Do not publish source or parse outputs. No test is inferred PASS from prose.
