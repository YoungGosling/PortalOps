# API 403 Forbidden 错误修复

## 问题描述

登录后，所有API请求都返回 `403 Forbidden` 错误，导致页面无法正常显示数据。

```
INFO: 127.0.0.1:60523 - "GET /api/services HTTP/1.1" 403 Forbidden
INFO: 127.0.0.1:60523 - "GET /api/products HTTP/1.1" 403 Forbidden
INFO: 127.0.0.1:60523 - "GET /api/users HTTP/1.1" 403 Forbidden
```

## 根本原因

1. **Token未正确初始化**：API客户端在页面刷新后没有从localStorage恢复token
2. **AuthProvider未恢复token**：在useEffect中只恢复了user对象，但没有调用 `apiClient.setToken()` 恢复token到API客户端
3. **缺少调试信息**：无法追踪token是否正确传递给后端

## 修复方案

### 1. API客户端增强初始化 (`lib/api.ts`)

**修改内容：**

```typescript
class ApiClient {
  private baseURL: string
  private token: string | null = null
  private initialized: boolean = false  // 新增

  constructor(baseURL: string) {
    this.baseURL = baseURL
    // 在构造函数中初始化token
    this.initializeToken()
  }

  // 新增：从localStorage初始化token
  private initializeToken() {
    if (typeof window !== 'undefined' && !this.initialized) {
      const storedToken = localStorage.getItem('portalops_token')
      if (storedToken) {
        this.token = storedToken
        console.log('API Client: Token initialized from localStorage')
      }
      this.initialized = true
    }
  }

  // 增强：确保token已初始化
  getToken(): string | null {
    if (!this.initialized) {
      this.initializeToken()
    }
    
    if (this.token) return this.token
    
    // Fallback: 直接从localStorage获取
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('portalops_token')
      if (storedToken) {
        this.token = storedToken
        return storedToken
      }
    }
    return null
  }
}
```

**新增调试日志：**

```typescript
const token = this.getToken()
if (token) {
  headers.Authorization = `Bearer ${token}`
  console.log(`API Request: ${options.method || 'GET'} ${endpoint} with token: ${token.substring(0, 20)}...`)
} else {
  console.warn(`API Request: ${options.method || 'GET'} ${endpoint} WITHOUT TOKEN`)
}

// 响应日志
console.log(`API Response: ${options.method || 'GET'} ${endpoint} - Status: ${response.status}`)
```

### 2. AuthProvider Token恢复增强 (`providers/auth-provider.tsx`)

**修改内容：**

```typescript
useEffect(() => {
  if (typeof window !== 'undefined') {
    const storedUser = localStorage.getItem('portalops_user')
    const storedToken = localStorage.getItem('portalops_token')
    
    if (storedUser) {
      const userData = JSON.parse(storedUser)
      setUser(userData)
      
      // 关键修复：恢复token到API客户端
      const token = userData.accessToken || storedToken
      if (token) {
        console.log('Auth Provider: Restoring token from localStorage')
        apiClient.setToken(token)  // 确保API客户端有token
      } else {
        console.warn('Auth Provider: No token found in localStorage')
      }
    } else if (storedToken) {
      // Token存在但user不存在 - 尝试获取用户资料
      console.log('Auth Provider: Found token without user, fetching profile...')
      apiClient.setToken(storedToken)
      authApi.getProfile()
        .then(profile => {
          // 重建user对象
          const userData: User = {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            department: profile.department || '',
            role: profile.roles?.[0] as UserRole,
            assignedServiceIds: profile.assignedServiceIds || [],
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          setUser(userData)
          localStorage.setItem('portalops_user', JSON.stringify({
            ...userData,
            accessToken: storedToken
          }))
        })
        .catch(err => {
          console.error('Failed to fetch user profile:', err)
          apiClient.clearToken()
          localStorage.removeItem('portalops_user')
        })
    }
  }
  setIsLoading(false)
}, [])
```

## Token存储结构

系统使用两个localStorage键来存储认证信息：

1. **`portalops_token`**: 纯JWT token字符串
   - 由 `apiClient.setToken()` 自动管理
   - API请求时自动添加到 `Authorization` header

2. **`portalops_user`**: 用户信息对象（包含token）
   ```json
   {
     "id": "user-id",
     "name": "User Name",
     "email": "user@example.com",
     "role": "Admin",
     "assignedServiceIds": [],
     "accessToken": "jwt-token-here"
   }
   ```

## 验证步骤

### 1. 检查浏览器控制台日志

登录后应该看到：

```
Auth Provider: Restoring token from localStorage
API Client: Token initialized from localStorage
API Request: GET /api/services with token: eyJhbGciOiJIUzI1NiIs...
API Response: GET /api/services - Status: 200
```

### 2. 检查localStorage

在浏览器开发者工具的Application -> Local Storage中应该看到：

- `portalops_token`: 一个JWT token字符串
- `portalops_user`: 包含用户信息的JSON对象

### 3. 检查网络请求

在Network标签中查看API请求，请求头应该包含：

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 调试指南

如果仍然出现403错误：

### 检查1: Token是否存在

```javascript
// 在浏览器控制台运行
localStorage.getItem('portalops_token')
```

### 检查2: Token是否有效

登录后检查控制台日志，应该看到token被设置：

```
Auth Provider: Restoring token from localStorage
```

### 检查3: API请求是否携带token

检查网络请求的Headers：

```
Authorization: Bearer <token>
```

如果没有，说明token没有被正确传递。

### 检查4: 后端JWT验证

后端可能的问题：
- JWT密钥不匹配
- Token过期
- Token格式错误

查看后端日志确认token验证失败的原因。

## 后续优化建议

1. **Token刷新机制**：实现token自动刷新，避免过期
2. **统一错误处理**：401/403错误自动跳转到登录页
3. **Token过期提醒**：在token即将过期时提示用户
4. **安全性增强**：使用HttpOnly cookies存储token（需要后端配合）

## 相关文件

- `/frontend/lib/api.ts` - API客户端实现
- `/frontend/providers/auth-provider.tsx` - 认证Provider
- `/frontend/components/auth/SignInForm.tsx` - 登录表单
- `/server/app/api/api_v1/endpoints/auth.py` - 后端认证API

## 测试场景

- [x] 登录后立即访问页面
- [x] 刷新页面后访问API
- [x] 多标签页同时使用
- [x] 清除localStorage后重新登录

