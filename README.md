[README.md](https://github.com/user-attachments/files/29277031/README.md)
# DeepSeek 余额小组件

在小米手机上通过桌面小组件实时查看 DeepSeek API 钱包余额。

**原理：**
```
[手机小组件] → [中间服务（安全代理）] → [DeepSeek 余额 API]
```

> 🚩 **针对中国用户优化**：以下方案在中国广西均可正常使用。

---

## 🚀 部署方式一：Vercel（推荐，免费，最简单）

[Vercel](https://vercel.com/) 是全球流行的前端托管平台，国内可正常访问，免费额度足够。

### 1️⃣ 把代码上传到 GitHub

在你的 GitHub 上创建一个新仓库，然后上传本项目文件。

或者直接在当前电脑操作：

```bash
# 进入项目目录
cd deepseek-balance-widget

# 初始化 git
git init
git add .
git commit -m "DeepSeek 余额查询服务"

# 关联你的 GitHub 仓库并推送
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
```

### 2️⃣ 在 Vercel 导入并部署

1. 打开 [vercel.com](https://vercel.com) 并登录（可以用 GitHub 账号登录）
2. 点击 **Add New → Project**
3. 选择你刚才推送的 GitHub 仓库
4. **关键：在部署前设置环境变量**——点击 **Environment Variables** 按钮：

| 变量名 | 值 | 说明 |
|-------|----|------|
| `DEEPSEEK_API_KEY` | `sk-xxxxxxxxxxxxxxxx` | 你的 DeepSeek API Key |
| `AUTH_TOKEN` | `myphone666`（自定义） | 手机端访问密码，随便设一个 |

5. 点击 **Deploy**，等几十秒就部署完成

部署成功后 Vercel 会给你一个域名，格式如 `https://你的项目.vercel.app`。

### 3️⃣ 验证

用浏览器打开 Vercel 给你的域名，会看到漂亮的余额卡片。

或者用命令行测试：
```bash
curl "https://你的项目.vercel.app/api/balance?token=你设的密码"
```

正常返回示例：
```json
{
  "available": true,
  "total_balance": 88.5,
  "currency": "CNY",
  ...
}
```

---

## 📱 小米手机设置桌面小组件

### 方案 A：KWGT 原生小组件（推荐 ⭐）

[KWGT (Kustom Widget Maker)](https://play.google.com/store/apps/details?id=org.kustom.widget) 是 Android 最强自定义小组件工具。

#### 安装
- 从 [Google Play](https://play.google.com/store/apps/details?id=org.kustom.widget) 安装 KWGT
- 小米应用商店可能搜不到，从酷安搜索「KWGT Kustom」安装

#### 创建小组件

1. **桌面上添加空白组件**
   - 桌面长按空白处 → **添加小部件**
   - 找到 KWGT，选一个 4×1 或 4×2 的尺寸添加到桌面
   - 点击空白组件打开编辑器

2. **配置 Flow 自动更新数据**
   - 切换到 **Flow（流程）** 标签页
   - 点击 **+** 新建流程：

   | 步骤 | 设置内容 |
   |------|---------|
   | **触发器** → **时间** | 间隔设 **30 分钟**（或选屏幕解锁触发） |
   | **动作①** → **请求** | URL: `https://你的项目.vercel.app/api/balance` |
   | | 添加请求头: `X-Auth-Token` = `你设的密码` |
   | **动作②** → **设置全局变量** | 名称: `ds_raw`，值: `$rsp()` |

3. **在组件上显示余额**
   - 回到 **编辑器** 标签页
   - 点击 **+** 添加文本图层
   - 输入公式：

   ```
   $tc(json, gv(ds_raw, "{}"), ".total_balance")$ ¥
   ```

   就会显示如 `88.50 ¥`

   - 加第二个文本显示余额状态（充足/不足）：

   ```
   $if(tc(json, gv(ds_raw, "{}"), ".available") = "true", "✔ 正常", "✘ 不可用")$
   ```

4. **美化**：在编辑器中自由调整字体大小、颜色、背景透明度。建议把金额数字设大、加粗。

### 方案 B：浏览器 HUD 页面（最简单，无需安装 App）

Vercel 部署后自带了手机适配的 HUD 页面：

1. **手机浏览器**打开 `https://你的项目.vercel.app`
2. 看到深色主题的余额卡片，自动实时刷新
3. 浏览器菜单 → **添加到主屏幕** → 命名为「DeepSeek 余额」
4. 桌面图标一点就能看

### 方案 C：Web Widget 小组件 App

安装 [Web Widget](https://play.google.com/store/apps/details?id=com.webwidget) 或 **Awesome Widgets**（酷安可搜到）：

1. 安装后选添加组件
2. 填入网址: `https://你的项目.vercel.app`
3. 设置刷新间隔 30 分钟
4. 桌面上直接显示余额卡片

---

## 🚀 部署方式二：自托管 Node.js 服务器

如果你有 VPS（云服务器），可以直接跑 server.js。

### 1️⃣ 上传并运行

```bash
# 在你的服务器上
git clone https://github.com/你的用户名/你的仓库名.git
cd deepseek-balance-widget

# 设置环境变量
export DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx
export AUTH_TOKEN=myphone666
export PORT=3000

# 启动（建议用 pm2 守护进程）
npm install -g pm2
pm2 start server.js --name deepseek-balance

# 设置开机自启
pm2 save
pm2 startup
```

### 2️⃣ 配置反向代理（Nginx）

```nginx
server {
    listen 80;
    server_name 你的域名.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 🌐 部署方式三：Railway / Zeabur（国内友好）

[Railway](https://railway.app) 和 [Zeabur](https://zeabur.com) 在国内访问速度不错，也有免费额度。

### Railway 部署

1. 登录 [Railway](https://railway.app)（GitHub 登录）
2. **New Project** → **Deploy from GitHub repo**
3. 选择本项目仓库
4. 在项目设置 → **Variables** 中添加环境变量：
   - `DEEPSEEK_API_KEY = sk-xxxx`
   - `AUTH_TOKEN = myphone666`
5. 部署自动完成，Railway 会给一个域名

### Zeabur 部署

Zeabur 是国产 PaaS 平台，国内访问速度极快：

1. 登录 [Zeabur](https://zeabur.com)
2. 创建项目 → 绑定 GitHub 仓库
3. 在环境变量中添加 `DEEPSEEK_API_KEY` 和 `AUTH_TOKEN`
4. 部署后即可获得国内访问飞快的域名

---

## 🔒 安全说明

| 风险 | 防护措施 |
|------|---------|
| DeepSeek API Key 泄露 | ✅ Key 只存在服务端（Vercel/服务器），手机永远接触不到 |
| 他人滥用你的接口 | ✅ `AUTH_TOKEN` 验证，不知道密码无法访问 |
| 通信被窃听 | ✅ 全程 HTTPS |

---

## 📂 项目文件结构

```
deepseek-balance-widget/
├── api/
│   └── index.js       # Vercel Serverless 函数（核心）
├── server.js          # 自托管 Node.js 版（VPS/服务器用）
├── vercel.json        # Vercel 配置
├── package.json
└── README.md
```

---

## ⚙️ 常见问题

**Q: Vercel 免费额度够用吗？**
A: 绰绰有余。小组件每 30 分钟查一次，一天 48 次请求，Vercel 免费版每天有 10 万次请求额度。

**Q: 余额显示不刷新？**
A: KWGT Flow 里点右上角播放按钮手动测试一次，看返回值是否正常。如果返回 401，检查 `AUTH_TOKEN` 是否一致。

**Q: 手机端需要科学上网吗？**
A: Vercel 域名在国内可以访问，如果偶尔慢，考虑用 Zeabur 或自建服务器。

**Q: 没有信用卡怎么注册 Vercel？**
A: Vercel 免费版不需要绑定信用卡，直接用 GitHub 账号登录即可。
