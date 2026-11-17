# AGENTS.md — AI Stock Watcher（台股小幫手）

## 1. 專案目標
本專案是以臺灣證券交易所（TWSE）OpenAPI 的股票資料為依據，結合 LLM 的個人股票觀察網站。使用者透過繁體中文自然語言查詢行情、管理自選股、設定價格提醒，並取得基於資料的個人化觀察摘要。

本專案是學習與資訊整理工具，不提供自動交易或保證報酬的投資建議。

**開發優先順序：能正常運作 > 資料正確性與安全 > 簡潔易用 > 未來擴充。**

## 2. 第一版範圍（MVP）
必須完成：
1. 行情查詢：依股票代碼或可明確辨識的名稱查詢最新可取得的資料，顯示資料日期與價格種類。
2. 自選股：加入、移除、顯示股票；以瀏覽器 localStorage 儲存。
3. 價格提醒：建立「高於／低於指定價格」的條件；於開啟頁面、手動刷新或網頁開啟期間的定期更新時檢查；在頁面顯示提示。
4. 觀察摘要：根據已取得的自選股及提醒狀態，由 LLM 產生有依據的繁體中文摘要。
5. 公開可瀏覽的網站；AI 服務可用時提供真實 LLM 對話，服務不可用時清楚顯示錯誤而非捏造成功結果。

第一版不做：會員系統、跨裝置同步、券商下單、全天候背景監控、Email/LINE 推播、自動推薦買賣、複雜技術指標。

## 3. 技術原則
- 前端使用原生 HTML、CSS、JavaScript（ES Modules），不因小功能額外導入大型框架。
- 靜態網頁部署於 GitHub Pages。
- 使用 Cloudflare Worker 作為輕量 API 後端；LLM Key 只保存在 Worker Secrets，不提交 Git。
- AI 優先使用有可用免費額度的 Gemini 模型；**2026-11-17 在使用者 Colab 環境成功完成文字生成測試的模型是 `gemini-3.5-flash-lite`**。這是已測試的開發預設值，不代表未來永遠可用或保證免費。
- 模型名稱集中管理：Colab 測試使用 `GEMINI_MODEL = "gemini-3.5-flash-lite"`，Cloudflare Worker 使用 `GEMINI_MODEL` 環境變數；不得散落在前端或各模組中。
- Colab 測試與公開網站是不同執行環境：Colab 使用 Python SDK，部署後 Worker 透過 Gemini API 服務端呼叫；**在 Colab 成功不代表 Worker／GitHub Pages 已經完成整合或測試**。
- 股票資料來源為官方 TWSE OpenAPI；請先核對 Swagger 定義及實際回傳欄位，不得臆測欄位或更新頻率。
- 跨來源存取、HTTP 錯誤、限流、暫時無資料要有處理；優先讓 Worker 代理 TWSE 請求，以避免前端 CORS 問題。
- localStorage 僅存自選股代碼、提醒設定與必要偏好，不存 API Key 或敏感資訊。

## 4. 網頁風格
- 語言：繁體中文；字體使用系統字體。
- 風格：乾淨、簡潔、友善，帶有小型 AI 助手圖示；不要仿照複雜的證券交易終端。
- 配色：米白／淺色背景、薄荷綠或柔和藍綠為主要點綴；價格漲跌使用文字與符號共同區分，不只靠顏色。
- 版面：桌機以聊天區＋自選股／提醒卡片為主；手機改為上下排版。
- 保持足夠留白、清楚字級、易點擊按鈕及鍵盤可操作性。
- 每個行情卡片必須顯示資料日期；資料未取得時標示「暫無資料」，不能顯示虛構價格。

## 5. 檔案結構與命名
採用小型專案結構：

```text
ai-stock-watcher/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js           # 前端操作、自選股、提醒與畫面事件（現行版）
│   ├── api.js           # Worker API 呼叫
│   └── config.js        # 公開設定：只存 Worker 網址，不含 API Key
├── worker/
│   ├── index.js         # 後端代理與 LLM 請求
│   └── wrangler.toml    # Worker 公開部署設定（不可含密鑰）
├── AGENTS.md
├── README.md
└── .gitignore
```

- 檔案使用英文小寫與 kebab-case；JavaScript 函式使用 camelCase，常數用 UPPER_SNAKE_CASE。
- 需要新功能時先判斷是否能加到既有模組；只有不同職責時才新增檔案。未來如功能增長，可以再將 `app.js` 分拆成 `watchlist.js`、`alerts.js`、`ui.js`，但不是第一版必要條件。
- 不要無故重命名既有檔案、改變對外 API 或刪除既有功能。
- 靜態資源使用相對路徑，以確保 GitHub Pages 的專案子路徑可運作。

## 6. AI 回應與資料可靠性規則
- LLM 負責理解使用者語意及說明資料；不可用模型記憶當成即時行情來源。
- 股價、漲跌、資料日期必須來自通過驗證的 API 回傳資料；不得自行編造。
- 日期以 Asia/Taipei 解讀；區分「今日」「最新交易日」「歷史日期」。
- 依實際 API 欄位標示「收盤價」「參考價」等正確種類，不可一律稱即時價。
- AI 的操作意圖應由 Worker 轉為經驗證的結構化資料，例如 `add_watchlist`、`set_alert`；前端再執行確定的本機操作。
- 股票代碼、條件方向、數值範圍都必須驗證；資訊不足先請使用者釐清。
- 個人化觀察摘要以條件觸發、價格變化及風險提醒為主，不給出保證報酬或確定性的買賣指示。
- 如果資料過期或 API／LLM 無法使用，明確告知，保留使用者既有清單與設定。

## 7. API、金鑰與基本安全
- 前端不可直接包含 Gemini API Key，也不能把 Key 存到 localStorage。
- 後端須限制 CORS 來源、單次輸入長度、回應大小；公開服務應設計基本的速率限制或使用量保護，避免免費額度被濫用。
- **密鑰名稱要區分環境**：Colab Secrets 名稱為 `Gemini`（大小寫須一致）；Cloudflare Worker 的 Secret 名稱為 `GEMINI_API_KEY`。兩者用途不同，不會自動同步。
- 使用 Cloudflare Worker Secrets 存機密；本地開發的 `.dev.vars`、`.env` 必須加入 `.gitignore`。
- `js/config.js` 只可設定公開的 `API_BASE`（Worker URL），絕不可放 Gemini API Key。
- 不可把使用者輸入直接當成可信任的系統指令；AI 輸出不等於可信的程式操作。
- 不使用 `eval` 執行模型輸出；渲染聊天內容時避免未消毒的 `innerHTML`。
- 如果某個 API 欄位、權限、配額或 CORS 行為尚未驗證，先標示待驗證，不可宣稱已正常支援。

## 8. 已驗證的 Colab 開發環境與模型故障處理
### 8.1 Colab 基準（2026-11-17 使用者實測）
- `google-genai==2.12.1`：成功進行文字生成。
- `google-auth==2.49.0`：目前環境版本；非 Gemini 模型名稱的一部分。
- `google-adk`：未安裝，本專案不依賴它，不要為了執行 Gemini 文字生成而額外安裝。
- Colab API Key 由 `google.colab.userdata.get("Gemini")` 讀取；不得輸出、寫入任何檔案或上傳 GitHub。
- **禁止在 Notebook 預設執行 `!pip install -U google-genai`**：曾使環境升級到 `google-genai==3.4.0`、`google-auth==2.62.2`，與既有 Colab/ADK 版本需求衝突。
- 優先使用 Colab 現有可運作的 SDK；需要安裝時先檢查版本與相依性，不要無條件更新；變更後執行 `%pip check` 和最小 API 測試。
- Colab 測試範例（**僅在 Colab 中執行**）：

```python
from google.colab import userdata
from google import genai

GEMINI_MODEL = "gemini-3.5-flash-lite"
client = genai.Client(api_key=userdata.get("Gemini"))
response = client.models.generate_content(
    model=GEMINI_MODEL,
    contents="請用繁體中文一句話介紹台股觀察小幫手，不要提供股價。",
)
print(response.text)
```

### 8.2 模型可用性和錯誤處理
- 已在使用者的 Colab 環境成功呼叫 `gemini-3.5-flash-lite`，但還沒有驗證 Worker 上的部署與請求是否成功。
- `404 NOT_FOUND`：模型可能不存在、已退役或對此帳號不可用；先查詢 `client.models.list()`，再以文字生成請求實測。模型出現在清單中**不代表**保證可以生成或免費使用。
- `503 UNAVAILABLE`：服務暫時繁忙；採少量、具上限的指數退避重試；仍失敗時顯示「AI 暫時無法使用」，不應無限重試或假裝成功。
- `429 RESOURCE_EXHAUSTED`：可能是額度／頻率限制；停止密集重試，提示檢查 AI Studio 配額與使用情況。
- `401/403`：優先檢查認證或權限，**不得**將完整 Key 印到日誌中。
- 網站在 Gemini 失敗時仍須保留自選股、既有提醒設定與可取得的股票行情，讓非 AI 功能獨立運作。
- AI 回答不得把 TWSE **每日收盤資料**稱為即時股價；原始 API 未提供可確認日期時應顯示「資料日期未提供」，不得自行推測。
- 如更換模型，須同步更新 Worker 的 `GEMINI_MODEL` 預設／部署設定、Colab 測試設定和 README，並重新實測；**不能只改 Notebook 而假設線上網站已切換模型**。

## 9. 新增／修改功能的固定流程
當使用者要求「新增功能」時，AI 必須：
1. 讀取本 AGENTS.md 與 README.md，確認既有功能和邊界。
2. 用一句話描述新增功能與使用情境。
3. 判斷會修改哪些檔案，盡量只改必要模組。
4. 確認資料來源、欄位、日期及是否需要 LLM；不要假造 API。
5. 遵守既定 UI 配色、版面及繁體中文文案，手機版同步可用。
6. 保留自選股與提醒設定的舊資料相容性；必要時明確執行版本遷移。
7. 驗證成功、錯誤、空資料、離線或 API 限流等情況。
8. 更新 README.md 的功能列表、使用方式與限制。
9. 簡短報告修改的檔案、測試結果與尚未完成的項目。

範例：如果新增「股票比較」功能，優先在 `js/api.js` 增加資料取得，在目前的 `js/app.js` 增加比較卡片，並使聊天對話能引導比較操作；除非有充分理由，不重寫自選股系統。

## 10. 最低驗收標準
- GitHub Pages 網頁可開啟，桌機與手機均不破版。
- 可查詢一檔有效股票，顯示正確資料日期與資料來源。
- 可新增／移除自選股，重新整理後仍保留。
- 可建立高於／低於價格提醒，正確區分「達標／未達標／無資料」；第一版以網頁載入或手動更新時檢查為準，未實作的週期檢查不可宣稱已完成。
- LLM 可對取得的股票資料產生回答；配額不足時會出現明確提示。
- README.md 說明部署方法、所需 Secrets、免費配額限制與免責聲明。
- 沒有將 API Key、個資或本地 Secrets 提交至 GitHub。

## 11. 後續可擴充方向
- 透過排程服務及 Email/LINE 完成關閉網頁後主動通知。
- 增加歷史股價比較、圖表或自選股分類。
- 提供更完善的模型替換機制，以及使用者帳號與跨裝置同步（需另設資料庫與權限管理）。

**重要：未來擴充不得以犧牲第一版的基本功能、資料正確性、安全性與簡潔介面為代價。**
