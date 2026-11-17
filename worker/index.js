/** Cloudflare Worker：TWSE 股票資料 + Gemini AI 代理。
 * 部署前設定：wrangler secret put GEMINI_API_KEY，及 SITE_ORIGIN、GEMINI_MODEL。
 */
const TWSE='https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL';
function cors(origin,allow){return {'Access-Control-Allow-Origin':allow?origin:'null','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'};}
function json(data,status,headers){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8',...headers}})}
function number(v){const n=Number(String(v??'').replace(/,/g,''));return Number.isFinite(n)?n:null}
export default { async fetch(request,env){
 const origin=request.headers.get('Origin')||'';const allowed=Boolean(env.SITE_ORIGIN && origin===env.SITE_ORIGIN);const headers=cors(origin,allowed);
 if(request.method==='OPTIONS')return new Response(null,{status:allowed?204:403,headers});
 if(!allowed)return json({error:'來源不允許。請在 Worker 設定 SITE_ORIGIN 為實際網站網址。'},403,headers);
 const path=new URL(request.url).pathname;
 if(path==='/api/stocks' && request.method==='GET'){
  try{const response=await fetch(TWSE,{headers:{'Accept':'application/json'},cf:{cacheTtl:300,cacheEverything:true}});if(!response.ok)throw Error('TWSE HTTP '+response.status);const raw=await response.json();if(!Array.isArray(raw))throw Error('TWSE 格式不符');const stocks=raw.map(r=>({code:String(r.Code||r.證券代號||'').trim(),name:String(r.Name||r.證券名稱||''),close:number(r.ClosingPrice??r.收盤價),date:String(r.Date||r.日期||'')})).filter(r=>/^\d{4,6}$/.test(r.code));return json({stocks,source:'TWSE STOCK_DAY_ALL',realtime:false},200,headers)}catch(e){return json({error:'TWSE 資料讀取失敗：'+e.message},502,headers)}
 }
 if(path==='/api/chat' && request.method==='POST'){
  if(!env.GEMINI_API_KEY)return json({error:'尚未設定 GEMINI_API_KEY Secret'},503,headers);
  try{const payload=await request.json();const message=String(payload.message||'').slice(0,500);if(!message)return json({error:'訊息不可為空'},400,headers);
   const stocks=(Array.isArray(payload.stocks)?payload.stocks:[]).slice(0,20).map(s=>({code:String(s.code||''),name:String(s.name||''),close:number(s.close),date:String(s.date||'')}));
   const history=(Array.isArray(payload.history)?payload.history:[]).slice(-8).map(h=>({role:h.role==='model'?'model':'user',parts:[{text:String(h.text||'').slice(0,500)}]}));
   const instruction='你是親切且謹慎的繁體中文台股觀察助手。只能使用提供的行情 JSON 引用價格，沒有資料必須說無法確認，切勿捏造行情、即時性、日期或投資報酬。解釋資料時附上資料日期（若無日期則說未提供日期）。不得下達保證收益或直接交易建議。可以解釋股票概念，但不得假裝執行自選股或提醒寫入。若用戶要求設定，請引導使用畫面右側欄位。';
   const model=env.GEMINI_MODEL||'gemini-2.5-flash';const api='https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent';
   const contents=[...history,{role:'user',parts:[{text:'目前可靠的自選股資料 JSON：'+JSON.stringify(stocks)+'\n使用者問題：'+message}]}];
   const res=await fetch(api,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':env.GEMINI_API_KEY},body:JSON.stringify({systemInstruction:{parts:[{text:instruction}]},contents,generationConfig:{temperature:0.3,maxOutputTokens:700}})});
   const result=await res.json();if(!res.ok)throw Error('Gemini API HTTP '+res.status+'：'+(result.error?.message||'未知錯誤'));
   const reply=(result.candidates?.[0]?.content?.parts||[]).map(p=>p.text||'').join('').trim();if(!reply)throw Error('模型未回傳文字');return json({reply},200,headers);
  }catch(e){return json({error:'AI 服務失敗：'+e.message},502,headers)}
 }
 return json({error:'找不到此服務'},404,headers);
}};
