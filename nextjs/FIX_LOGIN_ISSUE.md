# 登录问题修复说明

## 🐛 问题描述

使用 `admin@portalops.com` 和 `password` 登录时遇到两个问题：

### 问题 1：Token 字段名不匹配
- ✅ `/api/auth/login` 返回 200，响应正确
- ❌ `/api/auth/me` 返回 401 未授权错误
- ❌ 无法正常登录进入应用

### 问题 2：登录后无法跳转页面
- ✅ `/api/auth/login` 返回 200
- ✅ `/api/auth/me` 返回 200
- ❌ 登录成功但停留在登录页面，没有跳转到 Dashboard

## 🔍 根本原因

### 问题 1：前后端字段名不匹配

### 后端返回格式（Python/FastAPI）
```python
# /api/auth/login 返回
{
    "accessToken": "eyJ...",  # 驼峰命名
    "user": {
        "id": "...",
        "name": "...",
        "email": "..."
    }
}
```

### 前端期望格式（之前）
```typescript
interface LoginResponse {
  access_token: string;  // ❌ 下划线命名 - 不匹配！
  token_type: string;
}
```

### 问题流程
1. 用户输入凭据并点击登录
2. 前端调用 `POST /api/auth/login`
3. 后端返回 `{ "accessToken": "token...", "user": {...} }`
4. 前端尝试读取 `response.access_token` → **得到 `undefined`**
5. 前端存储 `localStorage.setItem('access_token', undefined)`
6. 前端调用 `GET /api/auth/me`，但因为 token 是 `undefined`，没有发送 `Authorization` header
7. 后端返回 401 未授权错误

### 问题 2：Middleware 与 Token 存储位置不匹配

**Token 存储位置不一致：**

登录成功后的流程：
1. 前端将 token 存储在 `localStorage` 中
2. 前端调用 `router.push('/')` 尝试导航到根路径
3. Next.js Middleware 拦截请求，检查 `request.cookies.get('access_token')`
4. **找不到 token**（因为 token 在 localStorage，不在 cookie）
5. Middleware 认为用户未登录，重定向回 `/signin`
6. 结果：用户看起来"卡"在登录页面

**核心问题：**
- 前端存储 token 在 **localStorage**
- Middleware 检查 token 在 **cookie**
- 两者不一致，导致导航被拦截

## ✅ 解决方案

### 1. 修复 Token 字段名不匹配

**文件：** `nextjs/types/index.ts`

```typescript
// 修改前
export interface LoginResponse {
  access_token: string;
  token_type: string;
}

// 修改后
export interface LoginResponse {
  accessToken: string;  // ✅ 匹配后端的驼峰命名
  user: {
    id: string;
    name: string;
    email: string;
  };
}
```

### 2. 更新 Auth Provider - 修复字段名

**文件：** `nextjs/providers/auth-provider.tsx`

```typescript
// 修改前
const response = await apiClient.login(credentials);
localStorage.setItem('access_token', response.access_token);  // ❌

// 修改后
const response = await apiClient.login(credentials);
localStorage.setItem('access_token', response.accessToken);  // ✅
```

### 3. 修复 Token 存储位置 - 同时存储在 Cookie

**文件：** `nextjs/providers/auth-provider.tsx`

为了让 Next.js Middleware 能够访问 token，我们需要将 token 同时存储在 cookie 中：

```typescript
const login = async (credentials: LoginRequest) => {
  try {
    const response = await apiClient.login(credentials);
    
    // ✅ 同时存储在 localStorage 和 cookie
    localStorage.setItem('access_token', response.accessToken);
    document.cookie = `access_token=${response.accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    
    const userData = await apiClient.getCurrentUser();
    setUser(userData);
    
    router.push('/');
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

const logout = () => {
  localStorage.removeItem('access_token');
  // ✅ 清除 cookie
  document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  setUser(null);
  router.push('/signin');
};
```

**为什么需要同时存储？**
- **localStorage**：用于客户端 API 调用时添加 Authorization header
- **Cookie**：用于 Next.js Middleware 在服务器端验证用户身份
- Cookie 设置 7 天过期（与 JWT token 过期时间一致）

## 🧪 验证修复

### 测试步骤

1. 启动后端服务器（确保运行在 `http://localhost:8000`）
2. 启动前端开发服务器：
   ```bash
   cd /home/evanzhang/EnterpriseProjects/PortalOps/nextjs
   pnpm dev
   ```
3. 访问 `http://localhost:3000/signin`
4. 使用测试凭据登录：
   - Email: `admin@portalops.com`
   - Password: `password`（或根据后端配置）

### 预期结果

**登录阶段：**
- ✅ `/api/auth/login` 返回 200
- ✅ Token 正确存储在 localStorage 中
- ✅ Token 正确设置在 cookie 中
- ✅ `/api/auth/me` 返回 200（带有用户数据）

**导航阶段：**
- ✅ 成功重定向到 Dashboard (`/`)
- ✅ Middleware 在 cookie 中找到 token，允许访问
- ✅ 页面显示 Dashboard 内容
- ✅ 可以看到用户信息和导航菜单
- ✅ Header 显示用户名和头像

### 调试技巧

在浏览器开发者工具中检查：

1. **Network 标签**：
   - 查看 `/api/auth/login` 响应体，确认包含 `accessToken` 字段
   - 查看 `/api/auth/me` 请求头，确认包含 `Authorization: Bearer <token>`
   - 查看页面导航请求，确认 Middleware 没有重定向

2. **Console 标签**：
   - 检查是否有任何错误消息
   - 运行 `localStorage.getItem('access_token')` 确认 token 已存储
   - 运行 `document.cookie` 查看所有 cookies

3. **Application 标签**：
   - **Local Storage**：查看 `access_token` 的值
   - **Cookies**：查看 `access_token` cookie 是否存在，检查其过期时间
   - 两者应该包含相同的 token 值

4. **常见问题排查**：
   - 如果页面刷新后退出登录：检查 cookie 是否正确设置
   - 如果无法跳转：在 Console 中查看是否有 middleware 重定向
   - 如果 API 返回 401：检查 localStorage 中的 token 是否有效

## 📝 相关文件

修改的文件：
- ✅ `nextjs/types/index.ts` - 更新 `LoginResponse` 接口（修复字段名）
- ✅ `nextjs/providers/auth-provider.tsx` - 更新 token 存储逻辑（localStorage + cookie）
- ✅ `nextjs/QUICK_START.md` - 更新默认登录信息

未修改但相关的文件：
- `nextjs/lib/api.ts` - API 客户端（headers 逻辑正确）
- `nextjs/middleware.ts` - 路由保护中间件（检查 cookie）
- `server/app/api/api_v1/endpoints/auth.py` - 后端登录端点

## 🎯 后续建议

为避免类似问题，建议：

1. **统一命名规范**：前后端使用一致的字段命名（全驼峰或全下划线）
2. **API 文档**：在 `API_Specification_v2.md` 中明确说明所有字段命名
3. **类型生成**：考虑使用工具从后端 schema 自动生成前端类型
4. **集成测试**：添加端到端测试覆盖完整登录流程
5. **Token 管理策略**：
   - 考虑使用 `httpOnly` cookie 来提高安全性（需要后端配合）
   - 或者完全使用 localStorage，但移除 middleware 的 cookie 检查
   - 当前方案是两者混合，需要保持同步

## 💡 技术说明

### 为什么使用 localStorage + Cookie 混合方案？

1. **localStorage 的优势**：
   - 客户端 JavaScript 可以轻松访问
   - 适合在 API 请求中添加 Authorization header
   - 容量较大（5-10MB）

2. **Cookie 的优势**：
   - 自动随请求发送
   - Next.js Middleware 可以在服务器端访问
   - 可以设置 `httpOnly` 提高安全性（需后端支持）

3. **当前架构的权衡**：
   - Middleware 需要在服务器端验证用户，所以需要 cookie
   - API 客户端在浏览器中运行，从 localStorage 读取更方便
   - 未来可以优化为纯 cookie 方案（需要后端设置 httpOnly cookie）

## 📚 参考

- [API Specification v2.0](../doc/design/server/v2/API_Specification_v2.md)
- [Frontend Backend Integration](../FRONTEND_BACKEND_INTEGRATION.md)
- [Quick Start Guide](./QUICK_START.md)

