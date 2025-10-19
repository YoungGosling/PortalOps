# 关键修复：Cookie 同步问题

## 发现的问题

**根本原因：** Token 存储在 localStorage 中，但 **Next.js middleware 只检查 cookie**！

导致：
- ✅ 登录成功，localStorage 有 token
- ❌ 但 cookie 中没有 token
- ❌ Middleware 认为未登录，阻止访问
- ❌ 所有 API 请求失败（403）

## 修复内容

现在**所有 token 设置的地方都同时设置 cookie**：

1. **邮箱密码登录** - 设置 cookie ✅ (之前已有)
2. **Azure AD 登录** - 设置 cookie ✅ (新增)
3. **从 localStorage 恢复** - 设置 cookie ✅ (新增)
4. **获取用户资料后** - 设置 cookie ✅ (新增)

## 🚨 立即测试（必须）

### 第一步：完全清除（30秒）

```javascript
// 在浏览器控制台（F12）执行
console.log('=== 开始清除 ===')

// 清除 localStorage
localStorage.clear()

// 清除 sessionStorage
sessionStorage.clear()

// 清除所有 cookies
document.cookie.split(";").forEach(function(c) {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});

console.log('✓ 清除完成')
console.log('localStorage:', localStorage.length)
console.log('cookies:', document.cookie)

// 刷新页面
location.reload()
```

### 第二步：登录（1分钟）

访问 http://localhost:3000/signin

使用邮箱登录：
- 邮箱: `admin@portalops.com`
- 密码: `password`

### 第三步：验证成功（30秒）

登录后，**立即**在控制台执行：

```javascript
console.log('=== 验证认证状态 ===')
console.log('✓ Token (localStorage):', localStorage.getItem('portalops_token') ? '存在' : '❌ 不存在')
console.log('✓ User (localStorage):', localStorage.getItem('portalops_user') ? '存在' : '❌ 不存在')
console.log('✓ Cookie (auth_token):', document.cookie.includes('auth_token') ? '存在' : '❌ 不存在')

// 详细检查
if (document.cookie.includes('auth_token')) {
  const authTokenCookie = document.cookie.split('; ').find(row => row.startsWith('auth_token='))
  console.log('Cookie 值:', authTokenCookie ? authTokenCookie.substring(0, 50) + '...' : '未找到')
} else {
  console.error('❌❌❌ COOKIE 不存在！这是问题所在！')
}
```

**期望的结果：**
```
✓ Token (localStorage): 存在
✓ User (localStorage): 存在
✓ Cookie (auth_token): 存在
Cookie 值: auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI...
```

### 第四步：访问页面（30秒）

点击左侧菜单的 "Service Inventory" 或访问 http://localhost:3000/services

**期望的结果：**
- ✅ 页面正常显示
- ✅ 有数据显示
- ✅ 控制台显示：
  ```
  [API Request] GET /services - With Auth Token: eyJhbGc...
  [API Response] GET /services - Status: 200
  ```

### 第五步：刷新测试（30秒）

按 F5 刷新页面

**期望的结果：**
- ✅ 仍然保持登录
- ✅ 数据正常显示
- ✅ 控制台显示：
  ```
  [Auth Provider] ✓ Restoring token from localStorage
  [Auth Provider] ✓ Token restored to cookie for middleware
  ```

## 如果仍然失败

### 检查点 1: Cookie 是否存在

```javascript
// 检查所有 cookies
console.log('所有 cookies:', document.cookie)

// 查找 auth_token
const hasAuthToken = document.cookie.split(';').some(cookie => cookie.trim().startsWith('auth_token='))
console.log('auth_token 存在:', hasAuthToken)
```

**如果 auth_token 不存在：**
- 代码可能未正确加载
- 需要重启前端服务

### 检查点 2: 控制台日志

登录后应该看到：
```
[Auth Provider] Logging in with email: admin@portalops.com
[Auth Provider] Login successful, received token
[API Client] Token set and stored in localStorage: eyJhbGc...
[Auth Provider] Token stored in cookie          ← 关键！
[Auth Provider] ✓ User data and token stored in localStorage
```

**如果没有 "Token stored in cookie" 日志：**
- 代码未生效
- 需要确认文件已保存并重启服务

### 检查点 3: 重启前端服务

```bash
# 在终端
# 1. 停止服务（Ctrl+C）

# 2. 确认代码已保存

# 3. 重新启动
cd /home/evanzhang/EnterpriseProjects/PortalOps/frontend
pnpm dev
```

## 修改的代码位置

在 `providers/auth-provider.tsx` 中，所有设置 token 的地方都加上：

```typescript
// 同时设置 cookie
if (typeof document !== 'undefined') {
  document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
  console.log('[Auth Provider] ✓ Token stored/restored to cookie for middleware')
}
```

位置：
1. 从 localStorage 恢复用户时 ✅
2. 从 localStorage 恢复 token 时 ✅
3. Azure 登录交换 token 后 ✅
4. 邮箱登录后 ✅ (之前已有)

## 为什么需要 Cookie

Next.js **middleware 运行在服务器端**，无法访问 localStorage（浏览器专用）。

```
浏览器 localStorage → ❌ Middleware 看不到
浏览器 Cookie     → ✅ Middleware 可以读取
```

所以我们需要**双重存储**：
- `localStorage` - 供前端 API 客户端使用
- `cookie` - 供 Next.js middleware 使用

## 测试清单

- [ ] 清除所有数据（localStorage + cookies）
- [ ] 重启前端服务（如果需要）
- [ ] 邮箱登录成功
- [ ] 登录后 localStorage 有 token ✅
- [ ] 登录后 cookie 有 auth_token ✅
- [ ] 可以访问 Services 页面 ✅
- [ ] API 请求返回 200（不是 403）✅
- [ ] 刷新页面后仍保持登录 ✅
- [ ] cookie 仍然存在 ✅

如果以上所有项都 ✅，问题解决！

## 如果还是不行

请提供：

1. **登录后的控制台完整日志**（特别是 `[Auth Provider]` 标记的）
2. **Cookie 检查结果**：
   ```javascript
   console.log(document.cookie)
   ```
3. **localStorage 检查结果**：
   ```javascript
   console.log('Token:', localStorage.getItem('portalops_token'))
   console.log('User:', localStorage.getItem('portalops_user'))
   ```
4. **Network 标签中失败的 API 请求的 Headers**

---

**这次修复是关键的！** 必须确保 cookie 被正确设置。

