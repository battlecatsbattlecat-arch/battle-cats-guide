# PIPELINE_OPEN_ISSUES — v2.3.12

規格修訂不等於實作或平台驗證。本版未凍結。Claude review ID 對照見 `PIPELINE_CODEX_REVIEW.md`。

## P0 — 未解阻斷（保留）

| ID | 問題 | 狀態 |
|---|---|---|
| P0-1 | Public repository 全 Git 歷史敏感資料 scan 無可稽核證據 | OPEN / NOT RUN |
| P0-2 | 預設分支 Branch Protection/Rulesets、禁直推、required checks 未驗證 | OPEN / NOT RUN |
| P0-3 | CODEOWNERS、default-deny publish allowlist、allowlist/history CI 未驗證 | OPEN / NOT RUN |
| P0-4 | 上游 LICENSE、遊戲與第三方資料再散布權利不明 | OPEN / NOT RUN |

上述 P0 不因本版 schema validation 關閉。禁止公開 source/parsed outputs。

## P1 — 文件規格已補，實作驗證仍未完成

| 分類 | 開放工作 | 狀態 |
|---|---|---|
| Pipeline implementation | Parser、builder、publisher、reader、state reconciliation/GC/recovery 均未實作 | NOT RUN |
| NTFS security | ACL roles, sealed ACL, owner, WRITE_DAC, rename, ADS/hardlink/reparse controls 未實測 | NOT RUN |
| Durability | FlushFileBuffers、power-loss/crash durability及同卷原子操作未實測 | NOT RUN；禁止宣稱 crash-durable |
| Source evidence | 固定上游 bytes、LICENSE、9 header contracts、formal baseline 未取得/核定 | OPEN；headers unknown |
| Public safety | 歷史掃描、branch rules、CODEOWNERS、allowlist、CI 未落地/驗證 | OPEN / NOT RUN |

## P2 — schema／契約剩餘缺口

1. `parsed_artifacts.schema.json` 是 row 基礎結構，不驗整檔 roundtrip、offset 單調、byte equation、header mapping/欄數一致性；須由 semantic validator 實作。
2. Anomaly disposition 的 canonical anomaly key hash、rule/ref consistency、severity/blocking/exit code與註冊規則一致性需 semantic validator，單靠 JSON Schema 無法 cross-document 驗證。
3. `LifecycleEvent`、manifest `statistics` 與事件序列跨紀錄一致性、UUID allocation relation、path canonicalization需 semantic validator。
4. Fixture generator 已可重建 synthetic JSON fixtures；byte-level TSV fixtures 及 Unicode digit negatives 尚待生成並執行。
5. CLI exit/error_id mapping、CreateDirectoryW、locks、ACL、GC recovery、pointer atomicity及 capability probe integration tests均 NOT RUN。

## 未解上游語意

G-01 至 G-10 仍照 v2.3.11 原分類保持未解；本版不以猜測填補欄位語意。實際 source rows 未納入 repo。
