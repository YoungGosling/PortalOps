# PortalOps Frontend v2.0 - Quick Reference

## 🚀 Quick Start

```bash
cd frontend
pnpm install
pnpm dev
```

Visit: `http://localhost:3000`

## 📁 Project Structure

```
frontend/
├── app/
│   ├── (admin)/
│   │   ├── dashboard/          # 主仪表板
│   │   ├── services/           # 服务清单 (卡片视图)
│   │   ├── products/           # 产品清单 (表格视图)
│   │   ├── payment-register/   # 支付登记 (内联编辑)
│   │   ├── users/              # 用户目录
│   │   ├── inbox/              # 收件箱 (工作流)
│   │   └── admin/
│   │       └── files/          # 主文件
│   └── (auth)/
│       └── signin/             # 登录页 (Azure + Email)
├── components/
│   ├── services/               # ServiceFormDialog
│   ├── products/               # ProductFormDialog
│   ├── users/                  # UserFormDialog
│   ├── inbox/                  # TaskDialog
│   ├── layout/                 # Header, Sidebar
│   └── ui/                     # shadcn/ui components
├── lib/
│   └── api.ts                  # API client (v2.0)
├── types/
│   └── index.ts                # TypeScript types (v2.0)
└── providers/
    ├── auth-provider.tsx       # 认证上下文
    └── payment-summary-provider.tsx
```

## 🎯 核心功能

### 1. Dashboard (仪表板)
- **路径**: `/dashboard`
- **权限**: All users
- **功能**: 
  - 4个统计卡片 (Active Services, Total Users, Pending Tasks, Incomplete Billing)
  - 最近活动时间线
  - 即将到期的续费

### 2. Service Inventory (服务清单)
- **路径**: `/services`
- **权限**: Admin only
- **UI**: 卡片视图
- **功能**:
  - 创建/编辑服务
  - 关联/取消关联产品
  - 非破坏性删除 (产品变为"未关联"状态)

### 3. Product Inventory (产品清单)
- **路径**: `/products`
- **权限**: Admin, ServiceAdmin
- **UI**: 表格视图 + 服务过滤器
- **功能**:
  - 创建/编辑产品
  - 必须指定服务
  - 删除产品 (同时删除billing记录)
  - 按服务过滤

### 4. Payment Register (支付登记)
- **路径**: `/payment-register`
- **权限**: Admin only
- **UI**: 内联编辑表格
- **功能**:
  - 直接在表格中编辑
  - 5个必填字段: Amount, Cardholder Name, Expiry Date, Payment Method, Bill Attachment
  - 不完整记录显示红色并排在顶部
  - 导航栏显示不完整记录数量徽章

### 5. User Directory (用户目录)
- **路径**: `/users`
- **权限**: Admin only
- **功能**:
  - 创建/编辑用户
  - 分配角色: Admin or ServiceAdmin
  - ServiceAdmin: 分配服务
  - 按产品过滤用户
  - 删除用户 (移除所有权限)

### 6. Inbox (收件箱)
- **路径**: `/inbox`
- **权限**: Admin only
- **功能**:
  - **Onboarding**: 打开用户创建表单，预填只读字段，管理员分配服务
  - **Offboarding**: 显示用户详情 (只读)，确认删除
  - 3个标签: Pending, In Progress, Completed

### 7. Master Files (主文件)
- **路径**: `/admin/files`
- **权限**: Admin only
- **功能**:
  - 查看所有支付登记上传的账单附件
  - 下载文件
  - 显示服务、产品、文件大小、上传日期

## 🔐 权限系统 (v2.0)

### Roles
- **Admin**: 完全访问所有功能
- **ServiceAdmin**: 只能管理分配的服务下的产品

### 简化的权限模型
```typescript
interface User {
  role?: 'Admin' | 'ServiceAdmin'
  assignedServiceIds?: string[]  // 仅用于 ServiceAdmin
}
```

## 🎨 UI组件

### 统一的 Add/Edit 面板
所有模块使用相同的对话框模式:
- ServiceFormDialog
- ProductFormDialog
- UserFormDialog
- TaskDialog

### 设计令牌
- **主色**: Blue (#3B82F6)
- **成功色**: Green (完成/激活)
- **错误色**: Red (不完整/错误)
- **警告色**: Yellow (待处理)
- **离职色**: Orange (Offboarding)

## 🔌 API端点 (v2.0)

```typescript
// Services
GET    /api/services
POST   /api/services
PUT    /api/services/{id}        // 支持 associateProductIds, disassociateProductIds
DELETE /api/services/{id}

// Products
GET    /api/products?serviceId={id}
POST   /api/products
PUT    /api/products/{id}
DELETE /api/products/{id}

// Payment Register
GET    /api/payment-register
PUT    /api/payment-register/{productId}  // multipart/form-data
GET    /api/payment-register/summary

// Users
GET    /api/users?productId={id}
POST   /api/users
PUT    /api/users/{id}
DELETE /api/users/{id}

// Inbox (Workflows)
GET    /api/inbox/tasks?status={pending|completed}
POST   /api/inbox/tasks/{id}/complete

// Master Files
GET    /api/master-files/attachments
GET    /api/master-files/attachments/{id}

// Auth
POST   /api/auth/login
GET    /api/auth/me
```

## ⚙️ 环境变量

```env
# API
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# NextAuth (Azure)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret
AZURE_AD_TENANT_ID=your-tenant-id
```

## 🧪 测试流程

### 1. 服务管理
```
1. 创建服务 "Google Workspace"
2. 关联产品 "Gmail", "Drive"
3. 编辑服务，取消关联 "Drive"
4. 删除服务 (产品变为未关联状态)
```

### 2. 产品管理
```
1. 创建产品 "Slack Pro"，选择服务 "Communication"
2. 编辑产品，更改服务
3. 按服务过滤产品
4. 删除产品 (billing记录自动删除)
```

### 3. 支付登记
```
1. 找到不完整的记录 (红色标记)
2. 点击 "Edit" 进入内联编辑模式
3. 填写所有字段 + 上传文件
4. 点击 "Save"
5. 记录变为完整 (绿色标记)
6. 导航栏徽章数量减1
```

### 4. 用户管理
```
1. 创建用户，角色选择 "ServiceAdmin"
2. 分配服务 (勾选多个服务)
3. 按产品过滤用户
4. 删除用户 (所有权限被移除)
```

### 5. 工作流
```
Onboarding:
1. HR系统触发webhook → 创建任务
2. Admin点击 "Start Task"
3. 打开用户表单，姓名/邮箱/部门预填且只读
4. Admin分配服务
5. 提交 → 创建用户 → 任务标记为完成

Offboarding:
1. HR系统触发webhook → 创建任务
2. Admin点击 "Start Task"
3. 显示用户详情 (只读)
4. 确认 → 删除用户 → 任务标记为完成
```

## 🚨 常见问题

### Q: Azure登录不工作？
A: 检查 `.env` 文件中的 Azure AD 配置，确保所有凭证正确。

### Q: API调用失败？
A: 确保后端服务运行在 `http://localhost:8000`，或更新 `NEXT_PUBLIC_API_URL`。

### Q: 文件上传失败？
A: 确保后端支持 `multipart/form-data` 并正确配置文件存储路径。

### Q: 用户看不到某些页面？
A: 检查用户角色：
- Dashboard, Products: Admin + ServiceAdmin
- Services, Payment Register, Users, Inbox, Master Files: Admin only

### Q: 产品删除后billing记录没有删除？
A: 后端需要实现级联删除或在产品删除endpoint中显式删除billing记录。

## 📝 开发提示

### 添加新页面
1. 在 `app/(admin)/` 下创建目录
2. 创建 `page.tsx`
3. 在 `Sidebar.tsx` 中添加导航项
4. 根据需要创建对应的表单对话框组件

### 调用API
```typescript
import { servicesApi } from '@/lib/api'

const services = await servicesApi.getServices()
```

### 显示提示
```typescript
import { toast } from 'sonner'

toast.success('操作成功')
toast.error('操作失败')
```

### 检查权限
```typescript
import { useAuth } from '@/providers/auth-provider'

const { hasRole, hasAnyRole } = useAuth()

if (hasRole('Admin')) {
  // Admin only code
}
```

## 🎯 下一步

1. ✅ Frontend v2.0 实现完成
2. ⏳ Backend API v2.0 实现
3. ⏳ 集成测试
4. ⏳ HR webhook设置
5. ⏳ 文件存储配置
6. ⏳ 生产部署

---

**快速参考完成!** 🎉

