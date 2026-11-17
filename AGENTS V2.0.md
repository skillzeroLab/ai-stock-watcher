# AGENTS.md — AI Stock Watcher（台股小幫手）

> 版本：v2.0｜更新日期：2026-11-17  
> 本文件是本專案的**開發操作規則**，供 ChatGPT、Claude、Copilot 及其他 AI 程式助手閱讀。  
> **核心原則：簡單完成優先；每次變更都要能維持既有功能與安全性。**

## 1. 專案目標與範圍

AI Stock Watcher 是供學習與個人觀察使用的台股網站，結合臺灣證券交易所（TWSE）每日行情 OpenAPI 與 Gemini LLM，使用繁體中文提供：

1. **股票行情查詢**：顯示 TWSE 提供的股票名稱、代碼、價格、資料日期與來源。
2. **自選股清單**：加入、移除股票，在本機瀏覽器保存。
3. **價格條件提醒**：開啟網站或手動更新資料時檢查目標價；不是背景持續推播。
4. **AI 聊天與觀察整理**：Gemini 只能根據取得的資料說明行情、回答一般股票知識，不得虛構股價。

第一版**不包括**：真實下單、自動交易、會員登入、跨裝置同步、盤中即時報價、背景推播、技術指標回測或個別化投資決策。

使用者最優先看到的是能操作、簡潔且友善的網站；不是專業券商交易終端。

## 2. 已採用的技術及部署位置

| 層級 | 技術或位置 | 開發規則 |
| --- | --- | --- |
| 前端 | 原生 HTML、CSS、JavaScript | 未經必要性評估，不引入 React、Vue、建置系統或其他大型框架 |
| 前端託管 | GitHub Pages | 使用 `main` 分支根目錄發布；`index.html` 位於專案根目錄 |
| 後端 | Cloudflare Worker | 統一代理 TWSE 與 Gemini 請求；不得將 API Key 放入瀏覽器 |
| 股票來源 | TWSE OpenAPI `STOCK_DAY_ALL` | 是**每日**資料，非即時資料；應核對欄位、日期及可取得範圍 |
| LLM | Gemini | 已在 Colab 驗證 `gemini-3.5-flash-lite` 能產生回覆；正式模型以 Worker 的 `GEMINI_MODEL` 為準 |
| 本機儲存 | Browser `localStorage` | 僅存放自選股、提醒等非敏感設定；無跨裝置同步 |
| Colab | 輔助測試／產生檔案 | 不是正式網站伺服器；測試版金鑰從 `userdata.get("Gemini")` 讀取 |

正式連結：
- Repository：<https://github.com/skillzeroLab/ai-stock-watcher>
- 網站：<https://skillzerolab.github.io/ai-stock-watcher/>
- Worker：<https://ai-stock-watcher-api.skillzero008.workers.dev>

網址可能隨未來部署調整；變更後同步更新 `README.md` 與必要設定。

## 3. 專案結構及責任分工

```text
ai-stock-watcher/
├── index.html              # 網站結構與載入順序
├── css/
│   └── style.css           # 共用樣式、RWD
├── js/
│   ├── config.js           # 公開 Worker API_BASE，禁止任何密鑰
│   ├── api.js              # 前端 HTTP /api/stocks、/api/chat 呼叫
│   └── app.js              # 畫面互動、自選股、提醒、聊天與 localStorage
├── worker/
│   ├── index.js            # TWSE 代理、Gemini 呼叫、CORS、安全檢查
│   └── wrangler.jsonc      # Worker 部署及非敏感環境設定
├── AGENTS.md               # 本開發規範（唯一主要版本）
└── README.md               # 使用說明、部署說明與限制
```

**以實際 Repository 為準。** 修改前應讀取現有檔案，不得假設 `js/watchlist.js`、`js/alerts.js`、`js/ui.js` 等檔案存在。小修改直接更新既有模組；只有當檔案明顯過長或重用需求確實出現時才拆分，並同步修改 HTML 載入順序。

`AGENTS V1.1.md` 等舊版可作歷史紀錄，但所有新規則均以根目錄的 `AGENTS.md` 為準，避免雙重標準。

## 4. 網頁介面與文字風格

- 使用**繁體中文**，語氣親切、簡潔、可信；避免過度行銷或保證收益的措辭。
- 主視覺以**米白背景、柔和薄荷綠、圓角卡片、適度留白**為主。
- 桌面版維持「左側聊天、右側自選股與提醒」；手機版改為上下排列。
- 新功能優先延續現有 CSS class 與元件，勿任意替換整體設計。
- 控制訊息長度，清楚標示載入、成功、空清單、資料不足及錯誤狀態。
- 操作元件需可用鍵盤使用，輸入欄位要有適當標籤；以 `textContent` 等安全方式顯示外部文字，避免 HTML 注入。
- 圖表或新頁面只有在確實增進可讀性時才加入，不能讓首頁變成繁雜交易儀表板。

## 5. 股票資料：真實性第一

- 正式行情以 TWSE API 回傳內容為唯一股價依據；目前由 Worker 使用 `https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL`。
- 不得從使用者問句、LLM 回答、舊快取或想像填補缺失的數字。
- 要明確顯示**來源、資料日期，以及非即時**；日期不明時寫「資料日期未提供」，不可自行以當天日期代替交易日期。
- 價格解析前要檢查資料格式及有效性；無效、空值或缺欄位顯示 `—`，不可轉成 `0`。
- 休市日、非交易日、上游失敗、ETF／上市範圍限制，都要明確提示。
- 更新時間是「程式取得資料的時間」，**不等於交易資料日期**；畫面要避免混淆兩者。
- 價格提醒採 `<=` 或 `>=` 與有效價格比較；只在網站開啟／手動更新等明確操作時檢查，不宣稱關閉網頁後仍能通知。
- 如將來擴充即時行情、歷史線圖或其他市場，必須先核實新的 API 規格、授權與更新頻率，再修改本規範。

## 6. Gemini 回答行為

- Gemini 的工作是**理解問題、解釋已取得的資料、整理個人觀察重點**，不是自行生成股價。
- 回答涉及股價時，必須引用輸入資料中的股票代碼、名稱、價格、資料日期；缺資料要明說無法確認。
- 不得把每日收盤資料稱為盤中即時價格，不保證投資報酬、不代替使用者做交易決策。
- 自選股及提醒的新增、刪除應由可驗證的程式邏輯處理；不能因 LLM 說「已完成」就視為操作成功。
- 模型名稱由 Worker `GEMINI_MODEL` 統一管理，避免在不同檔案散落寫死；目前經測試可用的模型為 `gemini-3.5-flash-lite`。
- Gemini 回傳 404、429、503、無文字或逾時時，應回報適當錯誤；只對適合重試的暫時性失敗進行**有限次數、帶退避**的重試。
- AI 故障時，自選股與價格提醒仍應可在本機操作；股票服務與 AI 服務的狀態應分開理解。

## 7. 安全性：Secrets、CORS 與公開服務

1. **禁止公開金鑰。** GitHub、HTML、JavaScript、`wrangler.jsonc`、README、ZIP、Notebook 輸出不得包含真實 Gemini API Key。
2. Colab 使用 Secret 名稱 `Gemini`，透過 `userdata.get("Gemini")` 讀取。**不可列印 Key**。
3. Cloudflare Worker 使用 **Secret** `GEMINI_API_KEY`；只能在 Cloudflare Secrets 管理，不得寫入 `vars`。
4. Cloudflare 非敏感設定：
   - `SITE_ORIGIN = https://skillzerolab.github.io`（**不含** `/ai-stock-watcher/` 與結尾 `/`）
   - `GEMINI_MODEL = gemini-3.5-flash-lite`
5. 若使用 GitHub 自動部署，需將**非敏感** `vars` 與 `worker/wrangler.jsonc` 同步，避免控制台與原始碼不同步；變更後確認 Secret 仍然存在。
6. Worker 目前根據請求 `Origin` 與 `SITE_ORIGIN` 完全比對，並處理 `OPTIONS` 預檢。瀏覽器直接打開 Worker URL 可能因缺少 `Origin` 得到 403；這**不能單獨判斷網站連線失敗**。
7. **CORS 不是身分驗證或配額保護。** 若要長期公開使用 AI API，應增加速率限制、請求量限制及成本監控。不要只依靠 `SITE_ORIGIN` 防止濫用。
8. 對外只回傳必要的錯誤資訊；不要把金鑰、請求標頭或內部敏感資料寫入回應或紀錄。
9. 如果金鑰疑似曾公開，應立即撤銷與重新產生，單純刪除 GitHub 檔案不足以解除風險。

## 8. GitHub / Cloudflare 部署規範

### 前端 GitHub Pages
- Repository：`skillzeroLab/ai-stock-watcher`。
- 發布來源：`main` 分支、`/ (root)`；必須保留根目錄 `index.html`。
- `js/config.js` 的 `window.APP_CONFIG.API_BASE` 指向公開 Worker 根網址：
  `https://ai-stock-watcher-api.skillzero008.workers.dev`。
- 修改前端、提交 GitHub 後，要重新開啟公開網址並強制重新整理，驗證更新是否生效。

### Cloudflare Worker
- 來源：同一個 GitHub Repository 的 `worker/` 資料夾。
- Worker 名稱：`ai-stock-watcher-api`。
- 已採用的 GitHub 連線部署方式：根目錄 `/`，部署命令：

  ```bash
  npx wrangler deploy --config worker/wrangler.jsonc
  ```

- 此命令與「Root directory 設定為 `worker` 後執行 `npx wrangler deploy`」是**二擇一**，不得重複指定子路徑。
- `worker/wrangler.jsonc` 至少包含 `name`、`main`、`compatibility_date`、`workers_dev`，並建議同步非敏感 `vars`。如已存在 `vars`，請保留有效設定，不要整份覆蓋。
- GitHub Commit 可觸發 Worker 重新部署；部署後必須查驗 Deploy Logs 是否成功、Secret 是否仍存在。
- 不要將 `.env`、`.dev.vars` 或私人憑證提交至 Repository。

## 9. API 契約（修改時需維持相容）

- `GET /api/stocks`：傳回 `stocks` 陣列及來源資訊，個別股票至少有 `code`、`name`、`close`、`date`；目前回傳 `realtime:false`。
- `POST /api/chat`：前端傳送 `message`、`stocks`、`history`，成功時取得 `reply`。
- 錯誤回應採 JSON，包含可理解的 `error` 字串與合適 HTTP 狀態。
- 不得默默更改端點名稱或欄位格式；若必要，需同步修改 `worker/index.js`、`js/api.js`、`js/app.js` 和 README 並測試。
- 對使用者輸入、股票代碼、提醒價格、聊天長度、歷史長度及資料格式做驗證；不得直接信任外部輸入。

## 10. AI 新增或修改功能的標準流程

AI 每次接到任務時，請依下列順序工作：

1. **先閱讀本檔**與相關既有檔案，了解目前程式真正如何運作。
2. **界定需求**：用一兩句話說明新增功能、使用情境、是否與第一版範圍衝突。
3. **列出修改範圍**：指出要動到哪些檔案、需要的 API 與可能影響。
4. **最小修改實作**：優先沿用既有 HTML、CSS、JS、Worker，避免不必要依賴、重構及新頁面。
5. **處理失敗狀況**：無資料、休市、AI 額度不足、CORS、網路中斷、輸入錯誤都要有使用者可理解的回饋。
6. **測試既有功能**：行情、自選股新增與刪除、提醒、聊天，以及重新整理後資料保留。
7. **確認安全**：沒有 Key 外洩、CORS 與 Wrangler 設定正確、未新增高風險外部請求。
8. **更新文件**：同步更新 `README.md`；如變更架構、部署或規則，更新 `AGENTS.md`。
9. **回報結果**：列出修改檔案、測試項目、已通過項目、尚未驗證之處；不可把未執行的測試說成成功。

## 11. 每次部署後的驗收清單

- [ ] GitHub Pages 首頁正常開啟，桌機／手機版面正常。
- [ ] `js/config.js` 只包含公開 Worker URL，無任何 API Key。
- [ ] Worker 部署成功，`SITE_ORIGIN`、`GEMINI_MODEL`、`GEMINI_API_KEY` 設定仍有效。
- [ ] 從 **GitHub Pages 網站內**發出股票請求，沒有 CORS 403 或 `Failed to fetch`。
- [ ] `GET /api/stocks` 取得可解析行情；股票代碼、名稱、價格與來源相符。
- [ ] 畫面正確標示每日資料日期及「非即時」，不把更新時間當交易日期。
- [ ] 自選股可新增、刪除、更新；重整頁面後仍存在。
- [ ] 價格提醒能依有效行情正確判定；缺資料不誤判為達標。
- [ ] Gemini 能根據提供的資料回答；無資料不亂報數字。
- [ ] AI 或 TWSE 發生錯誤時顯示說明，不讓整個頁面失效。
- [ ] Console 沒有影響主要功能的錯誤；例如 favicon 404 可視為非阻斷項目。
- [ ] README 與本文件反映實際部署方式及限制。

## 12. 已知限制與未來擴充方向

- TWSE `STOCK_DAY_ALL` 是每日資料，不是盤中即時報價；部分股票種類可能不在此來源的涵蓋範圍。
- 本機 `localStorage` 不提供不同瀏覽器或設備的同步。
- 提醒只在網站開啟或更新時檢查；未串接 Email、LINE、排程與背景通知。
- 公開 Worker 可能面臨額度或濫用風險，未來應優先評估用量保護。
- 可考慮擴充歷史行情、股票比較、更多股票來源、提醒推播，但**每次只新增一小項並完成驗收**。
- 所有內容僅供學習與資訊觀察，不構成投資建議。

## 13. AI 任務範本

> 請先閱讀專案根目錄的 `AGENTS.md` 及相關原始碼，再完成下列功能：［描述需求］。保留現有網頁風格、TWSE 資料真實性、Cloudflare Secret 與 API 契約；盡量只修改必要檔案。完成後列出修改內容、驗證步驟及仍需人工測試的項目，並同步更新 README。
