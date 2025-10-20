# Azure AD 认证集成完成指南

## 🎉 实施概览

PortalOps 现在支持 **双认证模式**：
1. **Azure AD SSO** - 企业单点登录（推荐）
2. **传统邮箱/密码** - 独立账户登录

## ✅ 已完成的修改

### 前端 (nextjs/)

#### 1. Middleware (`middleware.ts`)
- ✅ 支持检测 NextAuth session token
- ✅ 支持检测传统 JWT token
- ✅ 双认证模式共存

#### 2. API Client (`lib/api.ts`)
- ✅ 自动从 NextAuth session 获取 Azure ID token
- ✅ 优先使用传统 token（向后兼容）
- ✅ 在所有 API 请求中自动携带正确的 token

#### 3. Auth Provider (`providers/auth-provider.tsx`)
- ✅ Azure AD 登录成功后自动从后端获取用户信息
- ✅ 后端自动创建/同步 Azure 用户
- ✅ 双认证模式统一管理

### 后端 (server/)

#### 1. 依赖添加 (`requirements.txt`)
- ✅ 添加 `requests==2.31.0` 用于 Azure AD token 验证

#### 2. 配置 (`app/core/config.py`)
- ✅ 添加 `AZURE_AD_ENABLED` - 启用/禁用 Azure AD
- ✅ 添加 `AZURE_AD_TENANT_ID` - Azure 租户 ID
- ✅ 添加 `AZURE_AD_CLIENT_ID` - Azure 应用程序 ID

#### 3. 安全模块 (`app/core/security.py`)
- ✅ `verify_azure_ad_token()` - 验证 Azure AD ID token
- ✅ `verify_token_flexible()` - 自动识别 JWT 或 Azure token
- ✅ 缓存 Azure AD 公钥（24小时）提升性能

#### 4. 依赖注入 (`app/core/deps.py`)
- ✅ `get_current_user()` - 支持双认证模式
- ✅ Azure 用户自动创建（首次登录）
- ✅ `get_current_active_user()` - 支持 Azure 用户（无密码）

#### 5. 数据库模型 (`app/models/user.py`)
- ✅ 添加 `azure_id` 字段（Azure AD Object ID）
- ✅ 设置为 unique 和 nullable

#### 6. 数据库迁移 (`migrations/add_azure_id_to_users.sql`)
- ✅ 添加 azure_id 列
- ✅ 创建索引提升查询性能

## 🚀 部署步骤

### 步骤 1: 前端配置

确保前端 `.env.local` 包含（已有）：

```bash
# NextAuth 配置
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<your-secret>

# Azure AD 配置
AZURE_AD_CLIENT_ID=<your-client-id>
AZURE_AD_CLIENT_SECRET=<your-client-secret>
AZURE_AD_TENANT_ID=<your-tenant-id>

# 公共环境变量
NEXT_PUBLIC_NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### 步骤 2: 后端配置

创建/更新后端 `.env` 文件：

```bash
# 数据库配置
DATABASE_URL=postgresql://portalops:password@localhost:5432/portalops

# JWT 配置（保持不变）
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=180

# 🆕 Azure AD 配置
AZURE_AD_ENABLED=true
AZURE_AD_TENANT_ID=7ef8ba09-12d3-41cf-83a6-87764f56f90b
AZURE_AD_CLIENT_ID=f396ec87-a8f4-4b65-8372-a2261f38561a

# API 配置
API_V1_STR=/api
PROJECT_NAME=PortalOps

# 其他配置...
DEBUG=true
```

**重要提示**: 
- `AZURE_AD_TENANT_ID` 和 `AZURE_AD_CLIENT_ID` 必须与前端配置一致
- `AZURE_AD_ENABLED=true` 启用 Azure AD 认证

### 步骤 3: 数据库迁移

运行迁移脚本添加 `azure_id` 字段：

```bash
cd server
psql -U portalops -d portalops -f migrations/add_azure_id_to_users.sql
```

或使用 Python：

```python
from app.db.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS azure_id VARCHAR(255) UNIQUE"))
    conn.execute(text("CREATE INDEX IF NOT EXISTS idx_users_azure_id ON users(azure_id)"))
    conn.commit()
```

### 步骤 4: 安装后端依赖

```bash
cd server
pip install -r requirements.txt
# 或使用虚拟环境
source .venv/bin/activate
pip install -r requirements.txt
```

### 步骤 5: 重启服务

#### 后端
```bash
cd server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 前端
```bash
cd nextjs
pnpm dev
```

## 🔍 认证流程

### Azure AD 登录流程

```
用户点击 "Sign in with Microsoft"
   ↓
重定向到 Microsoft 登录页
   ↓
用户输入 Azure AD 凭据
   ↓
Microsoft 返回 ID token 和 access token
   ↓
NextAuth 创建 session，存储 tokens
   ↓
前端调用 /api/auth/me
   ↓
ApiClient 从 NextAuth session 获取 ID token
   ↓
后端接收 ID token，调用 verify_azure_ad_token()
   ↓
验证 token（issuer, audience, expiration）
   ↓
提取用户信息（email, name, azure_id）
   ↓
查找用户（通过 email 或 azure_id）
   ↓
【如果用户不存在】自动创建用户
   ↓
返回用户信息（包含 roles, permissions）
   ↓
登录成功！
```

### 传统邮箱/密码登录流程

```
用户输入邮箱和密码
   ↓
前端调用 POST /api/auth/login
   ↓
后端验证凭据，生成 JWT token
   ↓
前端存储 token 到 localStorage 和 cookie
   ↓
前端调用 /api/auth/me
   ↓
后端验证 JWT token
   ↓
返回用户信息
   ↓
登录成功！
```

## 🔐 安全特性

### Azure AD Token 验证

1. **Issuer 验证**: 确保 token 来自正确的 Azure AD 租户
2. **Audience 验证**: 确保 token 是为 PortalOps 应用颁发的
3. **过期验证**: 检查 token 是否过期
4. **签名验证**: 使用 Azure AD 公钥验证签名（缓存24小时）

### 双认证模式安全

- Azure 用户：`password_hash = NULL`, `azure_id = <oid>`
- 传统用户：`password_hash = <hash>`, `azure_id = NULL`
- 两者互不干扰，可以同时存在

## 📊 用户管理

### Azure 用户首次登录

当 Azure 用户首次登录时：

1. 后端自动创建用户记录
   - `email`: 从 Azure AD token 获取
   - `name`: 从 Azure AD token 获取
   - `azure_id`: Azure AD Object ID (oid)
   - `password_hash`: NULL
   - `roles`: 空数组（需要管理员分配）

2. 用户可以访问应用，但没有任何权限

3. **管理员需要在 User Directory 中为该用户分配角色和权限**

### 为 Azure 用户分配权限

1. 管理员登录 PortalOps
2. 进入 User Directory
3. 找到新创建的 Azure 用户
4. 分配角色（Admin / ServiceAdmin）
5. 分配产品/服务权限
6. 保存

用户下次登录即可看到被授权的数据。

## 🐛 故障排除

### 问题 1: 登录成功但停留在登录页

**原因**: Middleware 没有识别到 Azure session

**解决**:
1. 检查浏览器 Cookie 中是否有 `next-auth.session-token`
2. 检查前端 `.env.local` 中 `NEXTAUTH_URL` 是否正确
3. 清除浏览器缓存，重新登录

### 问题 2: 后端返回 401 Unauthorized

**原因**: 后端没有启用 Azure AD 或配置错误

**解决**:
1. 检查后端 `.env` 中 `AZURE_AD_ENABLED=true`
2. 检查 `AZURE_AD_TENANT_ID` 和 `AZURE_AD_CLIENT_ID` 是否正确
3. 重启后端服务
4. 查看后端日志：`Failed to validate Azure AD token`

### 问题 3: 数据库错误 - azure_id 字段不存在

**原因**: 未运行数据库迁移

**解决**:
```bash
cd server
psql -U portalops -d portalops -f migrations/add_azure_id_to_users.sql
```

### 问题 4: 用户登录成功但无权限

**原因**: Azure 用户首次登录时默认没有角色

**解决**:
1. 使用 Admin 账户登录（如 `admin@portalops.com`）
2. 进入 User Directory
3. 找到新用户，分配角色和权限
4. 用户重新登录即可

### 问题 5: Token 验证失败 - Invalid token issuer

**原因**: Token 的 issuer 不匹配

**解决**:
1. 确认后端 `AZURE_AD_TENANT_ID` 与前端一致
2. 检查 Token 中的 `iss` 字段：
   ```
   预期: https://login.microsoftonline.com/{tenant_id}/v2.0
   ```

## 📈 性能优化

### Azure AD 公钥缓存

- 公钥从 Microsoft 获取后缓存 24 小时
- 减少网络请求，提升验证速度
- 缓存在内存中，重启服务后重新获取

### Token 验证顺序

1. 先尝试 Azure AD token（如果启用）
2. 失败后尝试 JWT token
3. 两者都失败返回 401

这确保了向后兼容性和最佳性能。

## 🎯 下一步建议

### 1. 角色自动映射（可选）

根据 Azure AD 组自动分配角色：

```python
# 在 get_current_user 中添加
azure_groups = payload.get("groups", [])
if "admin-group-id" in azure_groups:
    assign_role(user, "Admin")
elif "service-admin-group-id" in azure_groups:
    assign_role(user, "ServiceAdmin")
```

### 2. 批量导入 Azure 用户（可选）

创建管理员工具批量同步 Azure AD 用户：

```bash
POST /api/admin/sync-azure-users
```

### 3. 审计日志增强

记录 Azure 登录事件：

```python
audit_log = AuditLog(
    actor_user_id=user.id,
    action="azure_login",
    details={"azure_id": azure_id, "email": email}
)
```

## 📝 总结

### 前端修改
- ✅ Middleware 支持双认证
- ✅ ApiClient 自动获取 Azure token
- ✅ AuthProvider 统一管理双认证

### 后端修改
- ✅ Azure AD token 验证
- ✅ 自动创建/同步 Azure 用户
- ✅ 双认证模式支持
- ✅ 数据库迁移（azure_id 字段）

### 配置要求
- ✅ 前端 NextAuth 配置（已有）
- ✅ 后端 Azure AD 配置（新增）
- ✅ 数据库迁移（必须）

### 测试清单
- [ ] Azure AD 登录成功
- [ ] 自动创建用户
- [ ] 获取用户信息（roles, permissions）
- [ ] 访问应用页面（Dashboard, etc.）
- [ ] 传统登录仍然工作
- [ ] 双认证模式共存

---

**实施完成时间**: 2025年10月20日  
**版本**: v2.1 - Azure AD Integration  
**状态**: ✅ 完成，待测试

