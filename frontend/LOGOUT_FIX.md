# Sign Out 功能修复

## 问题描述

点击 Sign Out 按钮后，系统虽然清除了用户数据和 token，但没有重定向到登录页面，导致用户停留在当前页面，看起来像是退出失败。

## 根本原因

在 `providers/auth-provider.tsx` 中的 `logout()` 函数只执行了以下操作：
1. 清除用户状态 (`setUser(null)`)
2. 清除 API 客户端 token (`apiClient.clearToken()`)
3. 删除 localStorage 中的用户数据
4. 清除认证 cookie

但**没有重定向到登录页面**，导致用户退出后仍然停留在受保护的页面上。

## 修复方案

### 修改文件：`providers/auth-provider.tsx`

1. **添加 Next.js 路由导入**
```typescript
import { useRouter } from 'next/navigation'
```

2. **在 AuthProvider 组件中使用路由**
```typescript
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter() // 添加这一行
```

3. **在 logout 函数中添加重定向**
```typescript
const logout = () => {
  setUser(null)
  apiClient.clearToken()
  if (typeof window !== 'undefined') {
    localStorage.removeItem('portalops_user')
  }
  // Clear auth cookie
  if (typeof document !== 'undefined') {
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  }
  // Redirect to signin page
  router.push('/signin') // 添加这一行
}
```

## 工作流程

修复后的退出流程：
1. 用户点击 Header 中的 "Sign Out" 按钮
2. 调用 `handleLogout()` → `logout()`
3. `logout()` 函数执行：
   - 清除所有用户状态和存储
   - 清除认证 cookie
   - **重定向到 `/signin` 页面**
4. Middleware 检测到没有 token，允许访问 `/signin` 页面

## 相关组件

### 1. AuthProvider (`providers/auth-provider.tsx`)
- ✅ 已修复：添加路由重定向
- 清除用户数据、token 和 cookie
- 重定向到登录页面

### 2. Header (`components/layout/Header.tsx`)
- ✅ 无需修改
- 调用 `logout()` 函数
- 显示 Sign Out 按钮（仅已登录用户可见）

### 3. Middleware (`middleware.ts`)
- ✅ 无需修改
- 已正确配置保护路由
- 未认证用户自动重定向到 `/signin`
- 已认证用户访问 `/signin` 会重定向到 `/dashboard`

## 测试步骤

1. ✅ 登录系统
2. ✅ 点击右上角用户下拉菜单
3. ✅ 点击 "Sign Out" 按钮
4. ✅ 验证：
   - 页面自动跳转到登录页面 (`/signin`)
   - LocalStorage 中的 `portalops_user` 已删除
   - Cookie 中的 `auth_token` 已删除
   - 无法通过浏览器后退按钮访问受保护页面
   - 可以重新登录

## 技术细节

### Next.js App Router 导航
使用 `useRouter()` from `next/navigation`（不是 `next/router`）：
- `router.push('/signin')` - 客户端导航，保持单页应用体验
- 不会造成整页刷新
- 支持浏览器前进/后退

### Cookie 清除
```typescript
document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
```
- 设置过期时间为过去，浏览器会自动删除 cookie
- `path=/` 确保清除根路径下的 cookie

### Middleware 保护
即使用户在退出前复制了受保护页面的 URL：
- Middleware 会检查 cookie 中的 token
- 没有 token 会自动重定向到 `/signin`
- 双重保护机制

## 构建验证

✅ 构建成功，无错误
```bash
pnpm build
# ✓ Compiled successfully in 19.6s
```

## 其他登出场景

此修复也适用于以下场景：
1. **Token 过期**：Middleware 会自动重定向
2. **手动清除浏览器存储**：下次访问会被重定向
3. **多标签页**：每个标签页都会独立检查认证状态

## 相关文件

- ✅ `providers/auth-provider.tsx` - 已修复
- ✅ `components/layout/Header.tsx` - 无需修改
- ✅ `middleware.ts` - 无需修改

## 注意事项

- 退出后的重定向是客户端导航，不会丢失应用状态
- Azure AD 登录的用户退出时只清除本地 token，不会退出 Azure AD 会话
- 如需完全退出 Azure AD，需要调用 Azure AD 的登出端点

