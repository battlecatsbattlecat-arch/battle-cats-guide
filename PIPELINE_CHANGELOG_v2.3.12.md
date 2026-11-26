# PIPELINE_CHANGELOG_v2.3.12.md

- 狀態：規格草案，待 Claude 獨立複審；未凍結。
- 基準：GitHub 工作分支 `codex/pipeline-handoff` 內容 tree 與 commit `e8b14750dba9eab490c75913e402b398e7b71309` 相同；遠端最新 HEAD 開工時為該 commit。

## 變更摘要

1. 修正 manifest Schema N1：candidate/complete 各自於含 `allOf` 的外層放 `unevaluatedProperties:false`；新增 Ajv Draft 2020-12 真實驗證和 positive/negative 合成 fixtures。
2. 新增 ACL/seal 身分權限、DACL/owner/WRITE_DAC、inheritance、ADS/hardlink/reparse、inventory 物件集合及失敗復原模型。
3. Sealed event 加入精確落盤 manifest bytes SHA-256 及 inventory SHA-256；定義 reader 對 event/manifest/inventory 驗證。
4. 選擇 provisional build 可封存為 private diagnostics、永不可發布的終態，並對齊 lifecycle/gate/receipt/recovery/GC。
5. 新增 parsed row/artifact、source/header、allocation ledger、parsed_current pointer、seal inventory、failure/recovery、field registry/anomaly rules/expected anomalies/disposition 等 14 個 Draft 2020-12 schema 與 fixtures。
6. 明定目前來源 TSV 不在工作樹；9 個上游 header policy 未有 bytes evidence 前均為 unknown，阻止 formal build，不假稱有標頭。
7. 補齊 line/BOM/payload/EOL 對帳式、TSV empty token 保留、header 主因、error code、CreateDirectoryW 183/3 與 retry 邊界、reconciliation matrix。
8. 明確保留 v2.3.10 八項安全規則，另定義 build_sequence ledger、恢復、capability probe 等要求。

## N1 驗證紀錄

使用 Ajv 8.20.0（`ajv/dist/2020`，Draft 2020-12）與 ajv-formats 3.0.1，Node.js v24.22.3。命令：

```powershell
$env:NODE_PATH='<temporary Ajv runtime>\node_modules'
node scripts/generate_v2_3_12_fixtures.cjs
node scripts/validate_v2_3_12_schemas.cjs
```

首輪依 Claude 指摘重現 v2.3.11 schema 問題：合法 candidate 與 complete 都被 `unevaluatedProperties:false` 放在 allOf child 的 schema 拒絕。可重現命令為 `node scripts/repro_v2_3_11_manifest_schema.cjs PIPELINE_SPEC_v2.3.11.md`。修正版最終 73 fixtures（兩個正向 manifest、六個 manifest 負向、其餘 schema 正負向）由 Ajv 實跑，0 mismatch、exit 0；結果記錄於 `PIPELINE_VALIDATION_STATUS.md`。這只是 schema 對 fixtures 驗證，不是 Parser/ACL/Windows 發布實作測試。

## 修訂前後

| 主題 | v2.3.11/v2.3.10 缺口 | v2.3.12 定義 |
|---|---|---|
| Schema composition | allOf 子 schema 關閉 properties，合法共用欄被拒 | 外層 unevaluated closure + Ajv 測試 |
| Seal | ACL/manifest hash/inventory未形成可驗證證據鏈 | 角色 DACL、object inventory、manifest/inventory hash anchor |
| Provisional | 無可達終態或與 failed 混淆 | 可 sealed 私有 diagnostics，publication N/A |
| Parsed output | 沒有完整輸出 schema與跨檔回放契約 | JSONL rows/header map/statistics/derived layout與bytes replay |
| Header | 上游檔是否有標頭未有 evidence | unknown policy 阻擋 formal；exact line-1 validation |
| GC/recovery | orphan 判斷及 seal-event crash window衝突 | reconciliation matrix，先查 sealed destination，恢復不可恢復態 |
| Diagnostics | exit code/primary reason/多錯誤處理不完整 | deterministic reason+exit priority，副錯誤保留 |

未實作 Parser、publisher、ACL、GC/recovery、CI 或 Public Repository controls。P0 授權與歷史安全問題未解除。
