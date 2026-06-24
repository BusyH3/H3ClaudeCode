/**
 * DeepSeek 余额查询 - 自托管 Node.js 服务器版
 *
 * 适用场景：你有 VPS / 云服务器，可以直接跑这个服务
 * 或者部署到 Railway / Render 等 PaaS 平台
 *
 * 环境变量（同 Vercel 版）：
 *   DEEPSEEK_API_KEY : DeepSeek API Key
 *   AUTH_TOKEN       : 自定义访问密码
 *   PORT             : 监听端口（默认 3000）
 *
 * 启动方式：
 *   export DEEPSEEK_API_KEY=sk-xxxx
 *   export AUTH_TOKEN=myphone666
 *   node server.js
 */

const http = require('http');
const url = require('url');

const DEEPSEEK_API = 'https://api.deepseek.com/user/balance';
const PORT = process.env.PORT || 3000;

// =============================================
// HTTP 服务器
// =============================================
const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Auth-Token');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsed = url.parse(req.url, true);

  if (parsed.pathname === '/api/balance') {
    return handleBalance(req, res, parsed);
  }

  return serveHtml(res);
});

server.listen(PORT, () => {
  console.log(`✅ DeepSeek 余额服务已启动 → http://localhost:${PORT}`);
  console.log(`   本地测试: curl http://localhost:${PORT}/api/balance?token=你的密码`);
  if (!process.env.DEEPSEEK_API_KEY) console.warn('⚠️  未设置 DEEPSEEK_API_KEY');
  if (!process.env.AUTH_TOKEN) console.warn('⚠️  未设置 AUTH_TOKEN');
});

// =============================================
// API 处理器
// =============================================
async function handleBalance(req, res, parsed) {
  const token = req.headers['x-auth-token'] || parsed.query.token;

  if (!token || token !== process.env.AUTH_TOKEN) {
    return sendJson(res, 401, { error: '未授权，请提供正确令牌' });
  }

  try {
    const resp = await fetch(DEEPSEEK_API, {
      headers: {
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        Accept: 'application/json',
      },
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      return sendJson(res, resp.status, {
        error: `DeepSeek API 返回 ${resp.status}`,
        detail: text,
      });
    }

    const data = await resp.json();
    const info = data.balance_infos?.[0] || {};

    return sendJson(res, 200, {
      available: data.is_available,
      total_balance: parseFloat(info.total_balance || 0),
      granted_balance: parseFloat(info.granted_balance || 0),
      topped_up_balance: parseFloat(info.topped_up_balance || 0),
      currency: info.currency || 'CNY',
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    return sendJson(res, 500, { error: `请求失败: ${err.message}` });
  }
}

// =============================================
// HUD 页面
// =============================================
function serveHtml(res) {
  const token = process.env.AUTH_TOKEN || '';
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
<title>DeepSeek 余额</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{
  min-height:100vh;display:flex;justify-content:center;align-items:center;
  background:#0f0f1a;font-family:-apple-system,'PingFang SC','Helvetica Neue',sans-serif;
  color:#fff;padding:16px
}
.card{
  background:linear-gradient(145deg,#1a1a2e,#16213e);border-radius:24px;
  padding:32px 28px;width:100%;max-width:380px;
  box-shadow:0 8px 32px rgba(0,0,0,.45);text-align:center
}
.header{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:20px}
.header .icon{font-size:22px}
.header .title{font-size:16px;font-weight:600;color:#8892b0;letter-spacing:.5px}
.balance-row{display:flex;align-items:baseline;justify-content:center;gap:4px;margin:12px 0 8px 0}
.balance-row .amount{
  font-size:56px;font-weight:800;
  background:linear-gradient(135deg,#4fc3f7,#81d4fa);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;
  background-clip:text;line-height:1.1
}
.balance-row .currency{font-size:22px;font-weight:500;color:#81d4fa}
.status-badge{display:inline-block;font-size:12px;font-weight:500;padding:4px 12px;border-radius:20px;margin:8px 0 16px 0}
.s-ok{background:rgba(76,175,80,.15);color:#66bb6a}
.s-low{background:rgba(255,152,0,.15);color:#ffa726}
.s-empty{background:rgba(244,67,54,.15);color:#ef5350}
.detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,.06)}
.detail-item{background:rgba(255,255,255,.04);border-radius:12px;padding:12px 8px}
.detail-item .label{font-size:11px;color:#666;margin-bottom:4px}
.detail-item .value{font-size:16px;font-weight:600;color:#c9d1d9}
.error-state{color:#ef5350;font-size:18px;padding:20px 0}
.loading-state{color:#666;font-size:16px;padding:20px 0}
.updated-at{font-size:11px;color:#3a3a5a;margin-top:16px}
.refresh-btn{
  margin-top:12px;background:rgba(255,255,255,.06);border:none;color:#666;
  padding:8px 16px;border-radius:20px;font-size:12px;cursor:pointer;transition:background .2s
}
.refresh-btn:active{background:rgba(255,255,255,.1)}
@media(prefers-color-scheme:light){
  body{background:#f0f2f5}
  .card{background:linear-gradient(145deg,#fff,#f5f7fa);box-shadow:0 4px 20px rgba(0,0,0,.1)}
  .header .title{color:#666}.detail-item{background:rgba(0,0,0,.03)}
  .detail-item .label{color:#999}.detail-item .value{color:#333}
  .updated-at{color:#aaa}
}
</style>
</head>
<body>
<div class="card" id="app">
  <div class="header"><span class="icon">🧠</span><span class="title">DeepSeek 余额</span></div>
  <div id="content"><div class="loading-state">加载中...</div></div>
  <div class="updated-at" id="updatedAt"></div>
  <button class="refresh-btn" onclick="fetchBalance()">⟳ 刷新</button>
</div>
<script>
const API_URL='/api/balance?token=${token}';
function getStatus(t){return t>10?{t:'余额充足',c:'s-ok'}:t>1?{t:'余额不足',c:'s-low'}:{t:'即将耗尽',c:'s-empty'}}
function fmt(n){return n.toFixed(2)}
async function fetchBalance(){
  const c=document.getElementById('content'),u=document.getElementById('updatedAt');
  c.innerHTML='<div class="loading-state">加载中...</div>';
  try{
    const r=await fetch(API_URL),d=await r.json();
    if(!r.ok||d.error){c.innerHTML='<div class="error-state">❌ '+(d.error||'请求失败')+'</div>';return}
    const t=d.total_balance||0,g=d.granted_balance||0,p=d.topped_up_balance||0,cur=d.currency||'CNY',s=getStatus(t);
    const time=d.updated_at?new Date(d.updated_at).toLocaleString('zh-CN',{hour12:false}):'--';
    c.innerHTML='<div class="balance-row"><span class="amount">'+fmt(t)+'</span><span class="currency">'+cur+'</span></div>'+
      '<span class="status-badge '+s.c+'">'+s.t+'</span>'+
      '<div class="detail-grid"><div class="detail-item"><div class="label">充值余额</div><div class="value">¥'+fmt(p)+'</div></div>'+
      '<div class="detail-item"><div class="label">赠送余额</div><div class="value">¥'+fmt(g)+'</div></div></div>';
    u.textContent='更新于 '+time;
  }catch(e){c.innerHTML='<div class="error-state">❌ 网络错误</div>'}
}
fetchBalance();setInterval(fetchBalance,600000);
</script>
</body>
</html>`;
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-cache',
  });
  res.end(html);
}

// =============================================
// 工具函数
// =============================================
function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}
