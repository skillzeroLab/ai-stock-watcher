# AI Stock Watcher｜台股小幫手

課堂作業：以 `AGENTS.md` 規範 AI 後續開發，建立使用 TWSE OpenAPI + Gemini API 的台股觀察網站。

## 功能
- 自選股：股票代碼新增/移除，使用瀏覽器 localStorage 保存。
- 價格提醒：輸入高於/低於指定價格，僅於網站載入或手動更新時檢查。
- 行情查詢：部署 Worker 後取得 TWSE 每日資料，非即時行情。
- AI 對話：部署 Worker 並設定 Gemini Key 後啟用；未設定時會明確提示。

## 部署
1. 將 `index.html`, `css/`, `js/`, `worker/`, `AGENTS.md`, `README.md` 上傳 GitHub Repository。
2. 在 GitHub → Settings → Pages，選擇 Deploy from branch / main / root。
3. Cloudflare Worker（需 Node.js / Wrangler）：在 `worker/wrangler.toml` 把 `SITE_ORIGIN` 改成實際 GitHub Pages 網站**來源**（例如 `https://username.github.io`，不要帶 repo 路徑）。在 `worker/` 執行 `npx wrangler secret put GEMINI_API_KEY`，然後 `npx wrangler deploy`。
4. 修改 `js/config.js` 的 `API_BASE`，填入部署完成的 Worker 網址，提交至 GitHub。
5. 在網站確認自選股行情、價格提醒與 AI 聊天。

### Colab Secrets
Notebook 使用 Colab Secrets 名稱 `Gemini`，只做 Colab API 測試；**不會**把該 Secret 輸出到網站或 GitHub。部署 Worker 時仍需單獨輸入 API Key 作為 Worker Secret。

## 已知限制
- 資料為 TWSE 每日資料，非盤中即時價格；原始資料可能不含日期，則不顯示推定日期。
- 自選股及提醒只保存在當前瀏覽器，沒有跨裝置同步。
- 未部署 Worker 時不能取得股票行情與 AI 回覆。
- Worker 的 CORS 限制不是身分驗證，若要長期公開需加入速率限制、用量保護。
- 部分股票代碼可能不在上市股票 API 的範圍內。
- AI 摘要僅供教育與資訊整理，不構成投資建議。

## AI 協作規則
新增功能前請先閱讀 `AGENTS.md`，保持一致的檔案結構、資料來源與 UI 風格。
