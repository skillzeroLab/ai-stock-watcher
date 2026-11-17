window.StockAPI = (() => {
  const base = () => (window.APP_CONFIG?.API_BASE || "").replace(/\/$/, "");
  async function request(path, options={}) {
    if (!base()) throw new Error("尚未設定 Worker 網址。請編輯 js/config.js 的 API_BASE。");
    const res = await fetch(base()+path, {...options,headers:{"Content-Type":"application/json",...(options.headers||{})}});
    let data; try { data = await res.json(); } catch { throw new Error("服務回傳格式不正確"); }
    if (!res.ok) throw new Error(data.error || "服務暫時無法使用");
    return data;
  }
  return { enabled:()=>Boolean(base()), stocks:()=>request('/api/stocks'), chat:(message,stocks,history)=>request('/api/chat',{method:'POST',body:JSON.stringify({message,stocks,history})}) };
})();
