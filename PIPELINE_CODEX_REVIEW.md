# PIPELINE_CODEX_REVIEW.md — v2.3.11 修訂追蹤與問題對照

- 狀態：文件修訂草案；等待 Claude 獨立複審，未凍結。
- 範圍：回應 Claude 對 v2.3.10 報告列出的所有 L/B/F/X 項目及先前 v2.3.10 審查遺留問題。
- 實作狀態：未實作 Parser、publisher 或 verifier；本文件不是行為驗證報告。

## 分級計數差異

Claude 報告摘要稱「11 項 P1、11 項 P2」，但明細中可辨識 P2 共 14 項：L-3、L-4、B-4、B-5、B-6、X-3 至 X-11（9 項），合計 14。為避免遺漏，本次逐條處理摘要及明細中的全部項目；不自行改寫 Claude 的原始計數。本表因此列 11 項 P1、14 個 P2 明細。

## Claude 問題逐項處理

| Claude ID | 級別 | v2.3.11 修訂位置／差異 | 文件層結果 | 實作驗證 |
|---|---|---|---|---|
| L-1 | P1 | §4.1、§5.2：0-byte 與 BOM-only 各 0 行，但均同時產生 file-level `file_empty`、`header_missing` blocking。 | 已寫清；不表示 Parser 已實作 | NOT RUN |
| L-2 | P1 | §4.2：header 僅限 physical line 1；line 1 blank 後不向下找 header。 | 已寫清 | NOT RUN |
| L-3 | P2 | §4.2：每行唯一 primary class/reason，順序 bare CR → invalid UTF-8 → header unavailable → invalid header → blank → isolated → data；file-level diagnostics 不重複計入行類別。 | 已寫清 | NOT RUN |
| L-4 | P2 | §4.2、§5.2：加入 line count、EOL count、payload、BOM、EOL byte 三條對帳恆等式。 | 已寫清 | NOT RUN |
| B-1 | P1 | §2.2、§3.1：sequence lock 只覆蓋配置交易；30 秒／100 ms timeout；exit 14；成功釋放點明定。 | 已寫清 | NOT RUN |
| B-2 | P1 | §2.2：序號先以 no-replace ledger rename commit，再更新 counter；其後目錄或程序失敗仍永久消耗並可追蹤。 | 已寫清 | NOT RUN |
| B-3 | P1 | §2.2：OS lease handle 表示存活；GC 掃描 ledger、釋放 seq lock 後逐一 probe lease；崩潰 orphan reconciliation。 | 已寫清 | NOT RUN |
| B-4 | P2 | §2.2、§7.3：stale 使用 `PUBLISH_STALE_SEQUENCE` / exit 14，事件寫 `state/events/`，seal 前後處置分開。 | 已寫清 | NOT RUN |
| B-5 | P2 | §2.2、§3.1：唯一巢狀順序 seq lock → lease；GC 不得巢狀反向；publish/source/build lock 不互相巢狀。 | 已寫清 | NOT RUN |
| B-6 | P2 | §2.2：counter 損毀先保存原 bytes/hash，從 ledger 與其他證據恢復，留下 recovery record；無法證明上界即 exit 13，不重設為 1。 | 已寫清 | NOT RUN |
| F-1 | P1 | §2.2、§7.3：failure record 位於 `state/failures/<build_id>.json`；失敗時建立；完整 schema 含階段、錯誤、診斷及目錄引用。 | 已寫清 | NOT RUN |
| F-2 | P1 | §2.2：candidate manifest 僅在 staging；完整 gate 後原子替換為 complete；failed 留在外部 failure/event；不回寫 manifest。 | 已寫清 | NOT RUN |
| F-3 | P1 | §2.2：sealed build inventory 精確驗證、ACL、同卷 no-replace rename；receipt/event 外置；sealed build 不因發布狀態修改。 | 已寫清 | NOT RUN |
| F-4 | P1 | §2.1、§2.2：anomalies 歸每個 build 的 staging/sealed artifact，包含 inventory/hash；不使用共享可變 anomalies 檔。 | 已寫清 | NOT RUN |
| X-1 | P1 | §7.1–§7.3：build manifest、sequence、allocation、event、failure、pointer、recovery 的 JSON Schema。 | 已加入；需 schema validator 實測 | NOT RUN |
| X-2 | P1 | §3.2：10 僅 source payload 與可信 manifest 的 byte/hash 不符；13 為 manifest/control/pointer/sequence trust integrity。 | 邊界已寫清 | NOT RUN |
| X-3 | P2 | §1.1、§2.2：formal 是成熟度，不是 sealed/published；先完成 manifest，後封存、寫 sealed event、再發指標。 | 已寫清 | NOT RUN |
| X-4 | P2 | §2.2：current/latest 僅指有效 `parsed_current`；其 generation 為已發布最高序號；allocated/complete 不等於 latest。 | 已寫清 | NOT RUN |
| X-5 | P2 | §7.4：列出 10 個 publication gates；provisional 禁止任何 pointer 發布；Public release 另需 rights、P0 控制及實證。 | 已寫清 | NOT RUN |
| X-6 | P2 | §3.3：區分 parent 與 terminal CreateDirectoryW 的錯誤 3；最多一次 parent repair/重試，terminal 呼叫上限 16；明列競爭、reparse、TOCTOU 模型。 | 已寫清 | NOT RUN |
| X-7 | P2 | §4.5、§5.1：.NET 使用 `\A`/`\z` 及 ASCII `[0-9]`，不使用 `$` 或 Unicode `\d`；增加 Unicode 負面測試。 | 已寫清 | NOT RUN |
| X-8 | P2 | §3.2：unexpected/missing/extra isolated rows 為 blocking、exit 14；exit 表適用工具及工具自有 error_id 範圍明定。 | 已寫清 | NOT RUN |
| X-9 | P2 | 標題改為「核心協定規格」；§6、§7.4 說明核心協定自足、versioned registry 是明確輸入資料且必須依 schema/hash 驗證。 | 範圍界線已寫清 | NOT RUN |
| X-10 | P2 | §2.2：pointer 缺失／損毀時停止 reader/publisher，保存損毀證據，人工 review recovery plan，沿用同一原子替換 gate。 | 已寫清 | NOT RUN |
| X-11 | P2 | `PIPELINE_VALIDATION_STATUS.md` 將 publish allowlist 與 CI 驗證獨立列為 NOT RUN；P0 保留。 | 已列明 | NOT RUN |

## v2.3.10 / 先前審查問題對照

| 先前問題 | v2.3.11 處理 | 狀態 |
|---|---|---|
| Manifest / parsed_current 狀態協定 | §2.2 lifecycle、candidate/complete/sealed/published/stale 及失敗復原順序；pointer 才表示 current publication。 | 規格已修訂；實作 NOT RUN |
| raw line byte replay | §4.1–§4.2 定義 BOM、payload、EOL、裸 CR、invalid UTF-8、EOF NONE 與 offset。 | 規格已修訂；roundtrip NOT RUN |
| TSV 尾端空欄及異常欄數 | §4.4 定義保留空 token 的 byte split/join；異常列以原 payload 回放。 | 規格已修訂；roundtrip NOT RUN |
| 首次／並行 publication、暫存、替換及讀者驗證 | §2.2 定義唯一 temp、locks、no-replace 首發、後續 replace、readback、hash 驗證與復原。 | 規格已修訂；平台測試 NOT RUN |
| CreateDirectoryW 父目錄 | §3.3 定義逐層建立、183、3、retry、TOCTOU、path containment。 | 規格已修訂；Windows 測試 NOT RUN |
| Public Repository 歷史安全／保護 | §2.3 仍要求完整掃描、Branch Protection/Rulesets、CODEOWNERS、allowlist、CI；未作任何驗證或解除阻斷。 | P0 OPEN |
| Physical line／statistics／hash／offset／error collection | §3.2、§4、§5 加入對帳、優先序與範圍。 | 規格已修訂；測試 NOT RUN |

## 新增或修改的狀態機

- 配置與生命週期：`allocated → building → failed | sealed`; `sealed → published | publish_failed | stale`；seal 前 stale 可進 `superseded`。事件外置、append-only；sealed contents 不隨 lifecycle 更新。
- Manifest：staging `candidate` → gate 成功後 `complete` → ACL/inventory 驗證與目錄 rename 後 sealed；published 只由 pointer commit 表示。
- Pointer：首次 no-replace rename；後續同卷 atomic replace；generation 單調遞增；低序號後到視為 stale。
- Sequence：ledger reservation 是 commit point；counter 是可修復 high-water cache；序號永不重用或倒退。

## 錯誤碼對照摘要

完整工具範圍及優先序見規格 §3.2：`13 > 11 > 12 > 10 > 14 > 0`。13=trust/control integrity；11=source 缺檔；12=source 多檔；10=可信 manifest 下 source bytes mismatch；14=blocking data、stale、lock timeout、I/O/API/未分類錯誤；0=適用 gates 通過。這是規格定義，PowerShell 實際退出行為 NOT RUN。

## 測試案例新增要求

物理行：空檔、BOM-only、line1 blank+合法-looking line2、全空行、BOM 後第二個 U+FEFF、LF/CRLF/NONE、裸 CR、invalid UTF-8。另需 TSV 連續／尾端空欄與欄數異常、Unicode 數字拒絕、每行 primary reason 唯一及 byte 對帳。

序號與生命週期：ledger rename 前後 crash、counter write 前後 crash、併發 allocator uniqueness、counter corruption repair、lock timeout、live lease GC、orphan recovery、stale 高低序號競爭、seal/pointer 各寫入窗口 crash、首發競爭、replace failure、receipt failure、pointer corruption recovery、inventory 多檔／少檔及 event append failure。

以上測試全為 NOT RUN；逐項狀態見 `PIPELINE_VALIDATION_STATUS.md`。

## 保留的 P0

Public Repository 完整 Git 歷史掃描、Branch Protection/Rulesets 實際狀態、CODEOWNERS/allowlist/CI 落地與驗證、固定上游 LICENSE 及遊戲／第三方資料再散布權利均未解。不得公開 source 或解析產物；不得把本次規格修訂視為 P0 通過。
