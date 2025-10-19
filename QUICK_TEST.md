# 快速测试指南 - Azure 认证修复

## ⚡ 快速开始

### 第 1 步: 重启前端服务器

```bash
# 在运行 pnpm dev 的终端按 Ctrl+C
# 然后重新启动：
cd /home/evanzhang/EnterpriseProjects/PortalOps/frontend
pnpm dev
```

**为什么要重启？** 环境变量 `NEXT_PUBLIC_API_URL` 已更新，需要重启才能生效。

---

## ✅ 测试清单

### 测试 1: Azure AD 登录 (2分钟)

1. 打开浏览器访问: http://localhost:3000
2. 应该自动重定向到 `/signin`
3. 点击 **"Sign in with Microsoft"** 按钮
4. 使用你的 Azure AD 账号登录
5. ✅ **期望结果**: 
   - 成功重定向到 Dashboard
   - 看到欢迎信息显示你的名字
   - 没有错误提示

---

### 测试 2: Dashboard 数据加载 (1分钟)

1. 在 Dashboard 页面
2. 打开浏览器开发者工具 (F12)
3. 切换到 **Console** 标签
4. ✅ **期望结果**:
   - 看到 `✅ Dashboard stats loaded from API`
   - **没有** "Not authenticated" 错误
   - Dashboard 显示统计数据（服务数、用户数等）

**如果看到 "Waiting for backend token..."**:
- 这是正常的，表示正在交换 token
- 几秒钟后应该会看到 `✅ Dashboard stats loaded from API`

---

### 测试 3: Payment Register 页面 (1分钟)

1. 在左侧导航栏点击 **Payment Register**
2. 打开浏览器控制台 (F12)
3. ✅ **期望结果**:
   - 页面正常加载
   - 没有 "Failed to fetch" 错误
   - 没有 500 错误
   - 显示支付记录或空状态

---

### 测试 4: Sign Out 功能 (1分钟)

1. 点击右上角的**用户头像**
2. 在下拉菜单中点击 **"Sign Out"**
3. 等待跳转
4. ✅ **期望结果**:
   - 成功跳转到 `/signin` 页面
   - 地址栏显示 `http://localhost:3000/signin`
   
5. **验证完全登出**:
   - 按 F5 刷新页面
   - ✅ 应该停留在登录页面（不会自动登录）
   - 尝试访问 http://localhost:3000/dashboard
   - ✅ 应该被重定向回登录页面

---

### 测试 5: 重新登录 (1分钟)

1. 在 `/signin` 页面
2. 再次点击 **"Sign in with Microsoft"**
3. ✅ **期望结果**:
   - 成功登录（可能需要重新授权）
   - 回到 Dashboard
   - 一切正常工作

---

## 🔍 检查点

### 浏览器控制台应该看到:

```javascript
// 成功的日志示例：
✅ Dashboard stats loaded from API
Waiting for backend token...  // 只在首次登录时出现
```

### 浏览器控制台 **不应该** 看到:

```javascript
❌ Not authenticated  // 应该没有这个错误
❌ Failed to fetch    // 应该没有这个错误
❌ 500 Internal Server Error  // 应该没有这个错误
```

---

## 📝 验证 Token

在浏览器控制台运行以下命令：

```javascript
// 1. 检查用户信息和 token
console.log(JSON.parse(localStorage.getItem('portalops_user')))
// 应该看到: { id, email, name, accessToken, ... }

// 2. 检查 token 是否设置
import { apiClient } from '@/lib/api'
console.log(apiClient.getToken())
// 应该看到: 一个 JWT token 字符串

// 3. 检查环境变量
console.log(process.env.NEXT_PUBLIC_API_URL)
// 应该看到: http://127.0.0.1:8000/api
```

---

## ❌ 如果测试失败

### 问题 1: 前端启动失败

```bash
# 检查端口是否被占用
lsof -i :3000

# 强制停止
kill -9 <PID>

# 重新启动
pnpm dev
```

### 问题 2: 后端未运行

```bash
# 检查后端状态
curl http://127.0.0.1:8000/health

# 如果失败，启动后端
cd /home/evanzhang/EnterpriseProjects/PortalOps/server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 问题 3: 仍然显示 "Not authenticated"

1. **清除浏览器缓存**:
   - Chrome: Ctrl+Shift+Delete
   - 选择 "Cached images and files" 和 "Cookies and other site data"
   - 点击 "Clear data"

2. **清除 localStorage**:
   ```javascript
   localStorage.clear()
   ```

3. **重新登录**:
   - 刷新页面
   - 使用 Azure AD 重新登录

### 问题 4: Sign Out 不工作

1. **手动清除 session**:
   ```javascript
   localStorage.clear()
   // 删除所有 cookies
   document.cookie.split(";").forEach(c => {
     document.cookie = c.trim().split("=")[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/'
   })
   ```

2. **刷新页面** 应该回到登录页面

---

## 🎯 成功标准

所有以下条件都满足：

- ✅ Azure AD 登录成功
- ✅ Dashboard 显示正确的数据
- ✅ 没有 "Not authenticated" 错误
- ✅ Payment Register 页面正常加载
- ✅ Sign Out 功能正常工作
- ✅ 登出后不会自动重新登录

---

## 📊 测试报告模板

测试完成后，可以填写以下报告：

```
测试日期: ___________
测试人员: ___________

[ ] Azure AD 登录 - 通过/失败: _____
[ ] Dashboard 数据 - 通过/失败: _____
[ ] Payment Register - 通过/失败: _____
[ ] Sign Out - 通过/失败: _____
[ ] 重新登录 - 通过/失败: _____

遇到的问题:
_________________________________
_________________________________

备注:
_________________________________
_________________________________
```

---

## 🚀 下一步

测试通过后，可以：

1. 部署到测试环境
2. 通知团队更新已完成
3. 开始使用新功能
4. 提供反馈和建议

---

**预计测试时间**: 5-10 分钟  
**前提条件**: 前端和后端都在运行  
**联系支持**: 查看 [ALL_FIXES_SUMMARY.md](./ALL_FIXES_SUMMARY.md) 获取详细信息

