# Azure AD 登录快速启动指南

## 5 分钟快速配置

### 步骤 1: 安装依赖（已完成）
```bash
# 依赖已安装：
# - next-auth@4.24.11
# - jwt-decode@4.0.0
# - react-icons@5.5.0
```

### 步骤 2: 配置环境变量
```bash
# 1. 复制环境变量模板
cp env.example .env.local

# 2. 生成 NEXTAUTH_SECRET
openssl rand -base64 32

# 3. 编辑 .env.local，填入以下值：
# NEXTAUTH_URL=http://localhost:3000
# NEXTAUTH_SECRET=<从上一步生成的值>
# AZURE_AD_CLIENT_ID=<从 Azure Portal 获取>
# AZURE_AD_CLIENT_SECRET=<从 Azure Portal 获取>
# AZURE_AD_TENANT_ID=<从 Azure Portal 获取>
```

### 步骤 3: Azure Portal 配置
1. 访问 [Azure Portal](https://portal.azure.com)
2. Azure Active Directory > App registrations > New registration
3. 填写：
   - Name: `PortalOps Frontend`
   - Redirect URI: `http://localhost:3000/api/auth/callback/customazure`
4. 记录：
   - Application (client) ID → `AZURE_AD_CLIENT_ID`
   - Directory (tenant) ID → `AZURE_AD_TENANT_ID`
5. Certificates & secrets > New client secret
   - 记录 Value → `AZURE_AD_CLIENT_SECRET`
6. API permissions > Grant admin consent

### 步骤 4: 启动应用
```bash
pnpm dev
```

### 步骤 5: 测试
1. 访问 http://localhost:3000/signin
2. 点击 "Sign in with Microsoft"
3. 使用 Microsoft 账号登录
4. 验证重定向到 Dashboard ✅

## 主要文件位置

```
frontend/
├── app/
│   ├── api/auth/[...nextauth]/     # NextAuth API 路由
│   ├── auth/error/                 # 错误页面
│   └── (auth)/signin/              # 登录页面（已更新）
├── components/auth/
│   └── AzureSignInButton.tsx       # Azure 登录按钮
├── middleware.ts                   # JWT 验证（已更新）
└── env.example                     # 环境变量模板
```

## 常见问题

### Q: 如何获取 Azure AD 配置？
A: 在 Azure Portal > Azure Active Directory > App registrations

### Q: 回调 URL 是什么？
A: `http://localhost:3000/api/auth/callback/customazure` (开发环境)

### Q: NEXTAUTH_SECRET 怎么生成？
A: `openssl rand -base64 32`

### Q: 支持哪些认证方式？
A: 
- ✅ Azure AD (Microsoft) 登录
- ✅ 邮箱/密码登录
- 两者可以同时使用

## 生产环境

### 更新 Redirect URI
在 Azure Portal 添加：
```
https://your-domain.com/api/auth/callback/customazure
```

### 更新环境变量
```env
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=<strong-production-secret>
```

## 需要帮助？

详细文档：
- 📘 完整配置指南：`AZURE_LOGIN_SETUP.md`
- 📗 迁移总结：`AZURE_MIGRATION_COMPLETE.md`
- 📕 故障排除：查看 `AZURE_LOGIN_SETUP.md` 的 Troubleshooting 部分

---

**快速启动完成时间**: < 10 分钟  
**前提**: 拥有 Azure AD 管理权限

