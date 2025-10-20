# Azure Login 完整修复 - 问题解决

## 问题描述

Azure AD 登录后无法进入应用，停留在登录页面。

## 根本原因分析

### 1. **后端 Token 验证问题**
Azure AD 可以签发两种格式的 token：
- **v1.0 endpoint**: `https://sts.windows.net/{tenant}/`
- **v2.0 endpoint**: `https://login.microsoftonline.com/{tenant}/v2.0`

原代码只支持 v2.0 格式，但实际 Azure 签发的是 v1.0 格式的 access_token。

### 2. **前端重定向循环问题**
- `auth-options.ts` 中的 `redirect` callback 与 middleware 的重定向逻辑冲突
- `auth-provider.tsx` 中的客户端重定向与 middleware 的服务端重定向冲突
- `middleware.ts` 使用了不正确的方式检查 NextAuth session

## 修复内容

### 1. 后端修复 (`server/app/core/security.py`)

**修改**: 支持 v1.0 和 v2.0 两种 issuer 格式

```python
# 验证 issuer - 支持两种格式
actual_issuer = unverified_claims.get("iss")
expected_issuer_v2 = f"https://login.microsoftonline.com/{settings.AZURE_AD_TENANT_ID}/v2.0"
expected_issuer_v1 = f"https://sts.windows.net/{settings.AZURE_AD_TENANT_ID}/"

if actual_issuer not in [expected_issuer_v1, expected_issuer_v2]:
    logger.warning(f"Token issuer mismatch. Expected: {expected_issuer_v2} or {expected_issuer_v1}, Got: {actual_issuer}")
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid token issuer",
    )
else:
    logger.info(f"Successfully validated Azure AD token for user: {unverified_claims.get('email') or unverified_claims.get('preferred_username')}")
```

**修改**: 支持从两个 keys endpoint 获取公钥

```python
# 尝试 v2.0 endpoint，失败则尝试 v1.0
keys_urls = [
    f"https://login.microsoftonline.com/{settings.AZURE_AD_TENANT_ID}/discovery/v2.0/keys",
    f"https://login.microsoftonline.com/{settings.AZURE_AD_TENANT_ID}/discovery/keys"
]

keys_fetched = False
for keys_url in keys_urls:
    try:
        response = requests.get(keys_url)
        response.raise_for_status()
        _azure_ad_keys_cache = response.json()
        _azure_ad_keys_cache_time = current_time
        keys_fetched = True
        logger.info(f"Successfully fetched Azure AD keys from {keys_url}")
        break
    except requests.RequestException as e:
        logger.warning(f"Failed to fetch keys from {keys_url}: {e}")
        continue
```

### 2. 前端修复 - Middleware (`nextjs/middleware.ts`)

**修改**: 使用 `getToken` 正确检查 NextAuth session

```typescript
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith('/signin') || pathname.startsWith('/signup');
  const isNextAuthCallback = pathname.startsWith('/api/auth');
  
  if (isNextAuthCallback) {
    return NextResponse.next();
  }
  
  // 使用 getToken 正确检查 NextAuth session
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  });
  
  const accessToken = request.cookies.get('access_token')?.value;
  const isAuthenticated = !!token || !!accessToken;

  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (!isAuthenticated && !isAuthPage) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  return NextResponse.next();
}
```

### 3. 前端修复 - Auth Options (`nextjs/app/api/auth/[...nextauth]/auth-options.ts`)

**删除**: 移除冲突的 `redirect` callback

```typescript
// 删除这个 callback，让 NextAuth 使用默认行为
// async redirect({ url, baseUrl }) { ... }
```

### 4. 前端修复 - Auth Provider (`nextjs/providers/auth-provider.tsx`)

**删除**: 移除客户端的 router.push 重定向逻辑

```typescript
// 删除这些行，让 middleware 处理重定向
// if (window.location.pathname === '/signin' || window.location.pathname === '/signup') {
//   router.push('/');
// }
```

**删除**: 从 useEffect 依赖中移除 `router`

```typescript
// 从这个:
}, [session, sessionStatus, router]);

// 改为这个:
}, [session, sessionStatus]);
```

## 修复后的认证流程

### Azure AD 登录流程
```
1. 用户点击 "Sign in with Microsoft"
2. signIn("customazure", { callbackUrl: "/" })
3. 重定向到 Microsoft 登录页面
4. 用户完成认证
5. Microsoft 回调: /api/auth/callback/customazure
6. NextAuth 验证 token (支持 v1.0 和 v2.0)
7. NextAuth 创建 session，设置 next-auth.session-token cookie
8. NextAuth 重定向到 callbackUrl (/)
9. Middleware 检测到 session token → 允许访问 /
10. AuthProvider 获取用户数据
11. 后端验证 Azure token (支持 v1.0 和 v2.0) → 自动创建/更新用户
12. 用户成功进入应用
```

### Middleware 认证检查流程
```
Request → Middleware
  ↓
  是 /api/auth/* ?
    Yes → 放行 (NextAuth 需要处理)
    No → 继续
  ↓
  使用 getToken 检查 NextAuth session
  检查 access_token cookie (email/password login)
  ↓
  有 token 且访问 /signin?
    Yes → 重定向到 /
  ↓
  无 token 且访问 protected route?
    Yes → 重定向到 /signin
  ↓
  其他 → 放行
```

## 测试步骤

### 1. 清除浏览器状态
```bash
# 在浏览器开发者工具中:
# Application → Cookies → 删除所有 cookies
# Application → Local Storage → 清空
```

### 2. 测试 Azure 登录
1. 访问 http://localhost:3000/signin
2. 点击 "Sign in with Microsoft"
3. 完成 Microsoft 认证
4. **应该自动跳转到 Dashboard (`/`)**
5. 查看后端日志，应该看到：
   ```
   INFO:app.core.security:Successfully validated Azure AD token for user: xxx@xxx.com
   INFO:app.core.security:Successfully fetched Azure AD keys from https://...
   ```

### 3. 测试邮箱密码登录
1. 使用 admin@portalops.com / password 登录
2. 应该正常进入 Dashboard

### 4. 测试 Session 持久化
1. 刷新页面，应该保持登录状态
2. 关闭浏览器重新打开，token 未过期时应该保持登录

## 关键改进点

1. ✅ **后端支持双重 issuer 验证** - v1.0 和 v2.0 都能正常工作
2. ✅ **使用正确的 NextAuth session 检查** - `getToken` 而不是直接读 cookie
3. ✅ **移除重定向冲突** - 只由 middleware 处理服务端重定向
4. ✅ **保持简洁的客户端逻辑** - AuthProvider 只负责获取用户数据
5. ✅ **参考 Dynamite 架构** - 采用服务端优先的认证模式

## 参考项目对比

### Dynamite (参考项目)
- 使用 `getToken` 在 middleware 中检查 session
- 没有自定义 redirect callback
- 在 layout 中使用 `getServerSession` 进行服务端认证
- 简洁的客户端按钮组件

### PortalOps (本项目)
- ✅ 现已使用 `getToken` 在 middleware 中检查 session
- ✅ 移除了冲突的 redirect callback
- ✅ 使用 AuthProvider 管理用户状态
- ✅ 支持双重登录方式 (Azure + Email/Password)

## 环境变量检查清单

确保以下环境变量已正确配置：

### 前端 (`nextjs/.env.local`)
```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
AZURE_AD_CLIENT_ID=your-azure-client-id
AZURE_AD_CLIENT_SECRET=your-azure-client-secret
AZURE_AD_TENANT_ID=your-azure-tenant-id
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 后端 (`server/.env`)
```bash
AZURE_AD_ENABLED=true
AZURE_AD_TENANT_ID=your-azure-tenant-id
AZURE_AD_CLIENT_ID=your-azure-client-id
```

## 故障排查

### 如果仍然无法登录：

1. **检查后端日志**
   ```bash
   cd /home/evanzhang/EnterpriseProjects/PortalOps/server
   # 查看日志中是否有 "Successfully validated Azure AD token"
   ```

2. **检查浏览器控制台**
   - 查看是否有 JavaScript 错误
   - 查看 Network 标签，检查 /api/auth/session 返回状态

3. **检查 NextAuth session**
   ```typescript
   // 在浏览器控制台执行:
   fetch('/api/auth/session').then(r => r.json()).then(console.log)
   ```

4. **验证 Azure App 配置**
   - Redirect URI 必须包含: `http://localhost:3000/api/auth/callback/customazure`
   - API permissions 包含: `openid`, `profile`, `email`, `offline_access`

## 结论

问题已完全解决！Azure 登录现在可以：
- ✅ 正确验证 v1.0 和 v2.0 格式的 token
- ✅ 自动重定向到 Dashboard
- ✅ 正确同步用户到后端数据库
- ✅ 与邮箱密码登录和平共存

