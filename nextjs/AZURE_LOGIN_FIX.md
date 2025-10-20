# Azure Login Redirect Fix

## 问题描述

用户通过"Sign in with Microsoft"按钮成功登录Azure AD后，页面停留在登录界面(`/signin`)，无法自动跳转到应用主界面。

## 根本原因

1. **Auth Provider缺少重定向逻辑**: `auth-provider.tsx`中的Azure登录处理逻辑在获取用户信息后没有执行页面跳转
2. **中间件API路由处理**: middleware对NextAuth的API回调路由(`/api/auth/*`)处理不当，可能导致认证流程中断
3. **异步头部获取**: API客户端的`downloadAttachment`方法没有正确等待异步的`getHeaders()`调用

## 修复内容

### 1. 修复 `providers/auth-provider.tsx`

**变更**: 在Azure AD认证成功后添加自动重定向逻辑

```typescript
// 在fetchAzureUser函数中添加重定向
const userData = await apiClient.getCurrentUser();
setUser(userData);

// Redirect to dashboard after successful authentication
if (window.location.pathname === '/signin' || window.location.pathname === '/signup') {
  router.push('/');
}
```

**关键点**:
- 无论后端API调用成功还是使用fallback用户数据，都执行重定向
- 检查当前路径是否为登录/注册页面，避免在其他页面触发不必要的跳转
- 在useEffect的依赖数组中添加`router`

### 2. 修复 `middleware.ts`

**变更**: 优化NextAuth API路由的处理

```typescript
// 明确检测并跳过NextAuth API路由
const isNextAuthCallback = pathname.startsWith('/api/auth');

if (isNextAuthCallback) {
  return NextResponse.next();
}
```

**变更**: 更新matcher配置

```typescript
// 移除对api路由的全局排除，在middleware函数中手动处理
'/((?!_next/static|_next/image|favicon.ico).*)',
```

**关键点**:
- NextAuth的回调路由(`/api/auth/callback/customazure`, `/api/auth/session`等)需要被middleware处理，但要允许通过
- 保持对session token和JWT token的双重检查逻辑

### 3. 修复 `lib/api.ts`

**变更**: 修复`downloadAttachment`方法的异步头部获取

```typescript
async downloadAttachment(fileId: string): Promise<Blob> {
  const url = `${this.baseUrl}/api/master-files/attachments/${fileId}`;
  const headers = await this.getHeaders(); // 添加await
  const response = await fetch(url, {
    headers,
  });
  // ...
}
```

## 认证流程

### Azure AD登录流程

1. 用户点击"Sign in with Microsoft"按钮
2. 触发`signIn("customazure", { callbackUrl: "/" })`
3. 重定向到Microsoft登录页面
4. 用户在Microsoft页面完成认证
5. Microsoft重定向回应用的回调URL: `/api/auth/callback/customazure`
6. NextAuth创建session并设置`next-auth.session-token` cookie
7. 重定向到callbackUrl或默认页面
8. `auth-provider.tsx`检测到`sessionStatus === 'authenticated'`
9. 调用`apiClient.getCurrentUser()`获取用户信息
10. **[新增]** 检查当前路径，如果在`/signin`则执行`router.push('/')`跳转到首页

### Middleware认证检查

```
Request → Middleware
  ↓
  检查是否为NextAuth API路由? 
    Yes → 允许通过
    No → 继续
  ↓
  检查session token或JWT token?
    有token且访问/signin → 重定向到 /
    无token且访问protected route → 重定向到 /signin
    其他 → 允许通过
```

## 测试步骤

1. **清除现有session**
   ```bash
   # 在浏览器开发者工具中
   # Application → Cookies → 删除所有cookies
   # Application → Local Storage → 清空
   ```

2. **测试Azure登录**
   - 访问 http://localhost:3000/signin
   - 点击"Sign in with Microsoft"
   - 在Microsoft登录页面完成认证
   - 验证是否自动跳转到Dashboard (`/`)

3. **验证后端集成**
   ```bash
   # 检查后端日志，应该看到:
   INFO: Auto-creating Azure AD user: <email>
   INFO: Created Azure AD user with ID: <uuid>
   ```

4. **测试session持久化**
   - 刷新页面，验证仍保持登录状态
   - 关闭浏览器重新打开，验证session是否保持

## 后端支持

后端已支持Azure AD token验证:

- `app/core/security.py`: `verify_azure_ad_token()` - 验证Azure AD ID token
- `app/core/deps.py`: `get_current_user()` - 自动识别Azure token并创建/更新用户
- 用户表已包含`azure_id`字段用于关联Azure AD用户

## 配置要求

确保以下环境变量已正确配置:

### Frontend (nextjs/.env.local)
```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<your-secret>
AZURE_AD_CLIENT_ID=<your-client-id>
AZURE_AD_CLIENT_SECRET=<your-client-secret>
AZURE_AD_TENANT_ID=<your-tenant-id>
```

### Backend (server/.env)
```bash
AZURE_AD_ENABLED=true
AZURE_AD_TENANT_ID=<your-tenant-id>
AZURE_AD_CLIENT_ID=<your-client-id>
```

## 故障排查

### 问题: 仍然停留在登录页面

1. 检查浏览器控制台是否有错误
2. 检查Network标签中`/api/auth/session`请求是否返回有效session
3. 检查是否有`next-auth.session-token` cookie
4. 查看auth-provider的console.log输出

### 问题: 后端返回401 Unauthorized

1. 检查后端日志，确认是否收到Azure ID token
2. 验证`AZURE_AD_ENABLED=true`和`AZURE_AD_TENANT_ID`已正确配置
3. 检查Azure AD token的有效期(通常1小时)

### 问题: 用户未自动创建

1. 检查后端日志中的"Auto-creating Azure AD user"消息
2. 验证数据库连接是否正常
3. 确认`azure_id`字段已添加到users表

## 相关文件

- `/home/evanzhang/EnterpriseProjects/PortalOps/nextjs/providers/auth-provider.tsx`
- `/home/evanzhang/EnterpriseProjects/PortalOps/nextjs/middleware.ts`
- `/home/evanzhang/EnterpriseProjects/PortalOps/nextjs/lib/api.ts`
- `/home/evanzhang/EnterpriseProjects/PortalOps/server/app/core/security.py`
- `/home/evanzhang/EnterpriseProjects/PortalOps/server/app/core/deps.py`

## 日期

2025-10-20

