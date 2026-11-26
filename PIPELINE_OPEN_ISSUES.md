# PIPELINE_OPEN_ISSUES.md — 尚未解決之問題與驗證清單

> 本文件列出仍未解決或尚未實測之工作。v2.3.10 只修訂規格文字，沒有完成程式實作、授權釐清或 repo 安全驗證；不得將文字修訂當成技術驗證。

## P0 — Public Repo 與授權阻斷

1. **Public Repository 完整 Git 歷史安全掃描未完成。** 尚未以完整 clone 對所有歷史 tree/blob 搜尋上游原始資料、解析物、異常原文、秘密或其他不允許的內容；搜尋 commit 列表不等於歷史掃描。若發現敏感資料，需制定歷史清理／乾淨重建方案，不能只刪最新檔。
2. **Branch Protection / Rulesets 與審核閘門未確認。** 必須驗證預設分支禁止直推、必需 reviewer / status checks、對 CODEOWNERS / workflow / publish allowlist 的審查，以及實際 required CI。此工作需 GitHub settings 管理權限；API 可見度不足不能當成已啟用。
3. **CODEOWNERS、publish allowlist、敏感資料 CI 尚未落地並驗證。** Public repo 需 default-deny allowlist、追蹤檔案 allowlist 檢查、全歷史掃描及合成 fixtures policy。
4. **固定上游 Commit 的 LICENSE 未核實；遊戲原始資料及第三方資料散布權利仍 unknown。** 在權利釐清前不得公開 `source/`、`builds/`、`parsed_current.json`、完整 anomalies 或含原文的 reports。

## P1 — 規格文字已修訂，尚待程式與平台驗證

1. **發布協定實作未存在。** v2.3.10 已定義 candidate→complete、指標提交代表 published、OS publish lock、UUID 暫存檔、首發 no-replace rename、後續原子 replace、順位、錯誤復原和 reader 驗證。仍須實作並在目標 Windows / filesystem 驗證：競爭發布、首發 race、replace 失敗、程序中斷、讀者開啟時替換及失敗後重試。
2. **原子性與持久性需區分。** 同卷 replace 的原子可見性、flush/write-through、斷電持久性、網路磁碟與同步軟體行為均未實測。未通過實測前不得宣稱 crash-durable。
3. **`raw_line_base64` 及 TSV roundtrip 未實測。** v2.3.10 已規定 payload 不含 EOL及無 escape TSV token 規則；仍需實作合成 fixtures 並逐 byte 比對 BOM、LF/CRLF/mixed、裸 CR、無效 UTF-8、空白、EOF NONE、尾端空欄、連續空欄與異常欄數。
4. **`CreateDirectoryW` P/Invoke 未實測。** 父路徑逐層建置、183 競爭處理、屬性/reparse/root containment 驗證、path not found 重建、UUID/seq 上限、CreateNew 與 error capture 均需目標 Windows / PowerShell 測試。
5. **多重錯誤和 PowerShell exit code 未實測。** 需以 `PowerShell -File` 對每種錯誤及重疊類別驗證完整診斷集合與 `13 > 11 > 12 > 10 > 14 > 0` 選碼。
6. **跨執行環境 JSON 可重現性未實測。** 固定 UTF-8 序列化、欄位順序、換行與 manifest 雜湊需跨支援的 PowerShell/.NET 版本驗證。
7. **來源錨定及 formal step 0 未完成。** 9 個上游檔與固定 Commit Tree / blob SHA / 重新下載位元組一致性、`LICENSE`、10 檔 source manifest、正式欄位 profile 與 `tcat.tsv` 第 359 行基準均仍待完成。

## P2 — 規格限制／語意仍須確認

1. TSV 無 quoting/escape dialect 無法區分「零 byte 空白行」與「單欄空字串資料列」；v2.3.10 明確不支援該種單欄空值資料。未來若需要此資料形態，須另行核准新格式／表示，不可靜默改寫本規格。
2. placeholder Unicode 數字負面 cases、物理行分類統計邊界與混合錯誤優先序雖已寫入 v2.3.10，仍未被測試覆蓋。
3. `build_sequence.json` 配置、原子更新及損毀復原仍待實作驗證；counter 損毀時規格要求 fail closed。sequence 的正確單調性與不同程序併發配置需整合測試。

## 上游遊戲語意未解（G-01 至 G-10）

以下欄位語意仍需固定 Commit 上游 JS 或遊戲實測確認，未確認前維持 unverified / partially_verified，不發布正式網站：

| ID | 尚未解決項目 |
|---|---|
| G-01 | `max_plus_level_tw` 空值語意與無後綴等級欄位 scope |
| G-02 | catstat/tcat 多語名稱及地區歸屬、886/887 日文內容及 174 筆空 `name_jp` 成因 |
| G-03 | 887 與全表單位分類 |
| G-04 | `tcat.tsv` 第 889 行 placeholder 與第 359 行異常成因 |
| G-05 | `orb_count` 空值及 `egg_id` 格式語意 |
| G-06 | ability/trait/immunity/talents/ability_enabled/version 編碼 |
| G-07 | 戰鬥時間欄位單位、DPS 公式與負距離含義 |
| G-08 | XP/level curve 公式 |
| G-09 | limited_cats、cat_guide_ids、rarities 語意 |
| G-10 | cat/catstat 全欄位空值與值域 profile |
