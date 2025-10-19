# 快速测试修复 - 3 步验证

## 🚀 快速开始

### 步骤 1: 清除旧数据（30秒）

打开浏览器开发者工具（F12），在 Console 中执行：

```javascript
localStorage.clear()
alert('✅ 已清除！请重新登录。')
location.reload()
```

### 步骤 2: 重新登录（1分钟）

1. 访问 `http://localhost:3000/signin`
2. 输入测试账号：
   ```
   Email: admin@portalops.com
   Password: password
   ```
3. 点击 "Sign In"

### 步骤 3: 验证修复（30秒）

登录成功后，打开浏览器控制台，应该看到类似这样的日志：

```
✅ [Auth Provider] Logging in with email: admin@portalops.com
✅ [Auth Provider] Login successful, received token
✅ [API Client] Token set and stored in localStorage: eyJhbGc...
✅ [Auth Provider] Token set in API client
✅ [Auth Provider] Token stored in cookie
✅ [API Request] GET /auth/me - With Auth Token: eyJhbGc...
✅ [API Response] GET /auth/me - Status: 200
✅ [Auth Provider] ✓ User data and token stored in localStorage
```

**然后访问任何页面（如 Services），应该看到：**

```
✅ [API Request] GET /services - With Auth Token: eyJhbGc...
✅ [API Response] GET /services - Status: 200
```

---

## ✅ 成功标志

如果看到以上日志，并且：
- ✅ 页面数据正常加载
- ✅ 没有 403 错误
- ✅ 控制台没有红色错误信息

**恭喜！修复成功！** 🎉

---

## ❌ 如果仍然失败

### 场景 1: 仍然看到 403 错误

控制台显示：
```
❌ [API Request] GET /services - ⚠️  NO TOKEN! Request will likely fail with 403
❌ [API Response] GET /services - Status: 403
```

**原因：** Token 未正确保存

**解决方法：**
1. 确认前端代码已更新（检查 `lib/api.ts` 和 `providers/auth-provider.tsx`）
2. 重启前端开发服务器：
   ```bash
   # 在终端按 Ctrl+C 停止服务
   # 然后重新启动
   pnpm dev
   ```
3. 清除浏览器缓存并重试

### 场景 2: Token 存在但仍然 403

控制台显示：
```
✅ [API Request] GET /services - With Auth Token: eyJhbGc...
❌ [API Response] GET /services - Status: 403
```

**原因：** Token 验证失败（后端问题）

**解决方法：**
1. 检查后端日志，查找 JWT 验证错误
2. 确认后端 `.env` 中的 `JWT_SECRET_KEY` 配置正确
3. 检查 token 是否过期：
   ```javascript
   // 在浏览器控制台执行
   const token = localStorage.getItem('portalops_token')
   const payload = JSON.parse(atob(token.split('.')[1]))
   console.log('Token expires:', new Date(payload.exp * 1000))
   console.log('Is expired:', new Date(payload.exp * 1000) < new Date())
   ```

### 场景 3: 登录就失败

控制台显示：
```
❌ [Auth Provider] ✗ Login failed: ...
```

**原因：** 后端登录接口问题

**解决方法：**
1. 确认后端服务正在运行：`http://127.0.0.1:8000/docs`
2. 检查后端数据库中是否有测试用户
3. 查看后端日志的错误信息

---

## 🔧 使用诊断工具

打开 `debug-auth.html` 文件（在浏览器中打开）：

```
file:///path/to/frontend/debug-auth.html
```

或者在浏览器中访问：
```
http://localhost:3000/debug-auth.html
```

这个工具可以：
- ✅ 检查 token 是否存在
- ✅ 解码并显示 token 内容
- ✅ 测试 API 请求
- ✅ 清除认证数据

---

## 📞 需要帮助？

如果问题仍未解决，请提供：

1. **浏览器控制台日志**（复制所有 `[API` 和 `[Auth` 开头的日志）
2. **后端终端日志**（最近 20 行）
3. **localStorage 内容**：
   ```javascript
   console.log('Token:', localStorage.getItem('portalops_token'))
   console.log('User:', localStorage.getItem('portalops_user'))
   ```

---

## 📚 更多信息

- [详细修复指南](./AUTH_FIX_GUIDE.md)
- [修复总结](./FIX_SUMMARY.md)
- [之前的 403 修复](./API_403_FIX.md)

