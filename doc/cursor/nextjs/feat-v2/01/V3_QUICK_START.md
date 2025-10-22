# PortalOps v3.0 Frontend - Quick Start Guide

## 快速开始

### 启动前端

```bash
cd /home/evanzhang/EnterpriseProjects/PortalOps/nextjs
pnpm dev
```

访问: http://localhost:3000

---

## 新功能概览

### 1. 用户管理增强 📝

**位置**: Employee Directory (`/users`)

**新增字段**:
- 职位 (Position)
- 入职日期 (Hire Date)
- 离职日期 (Resignation Date) - 仅编辑时显示

**如何使用**:
1. 点击 "Add User" 或 "Edit" 按钮
2. 填写基本信息（包括新字段）
3. 使用树形选择器分配产品
4. 点击 "Create/Update User"

---

### 2. 部门管理 🏢

**位置**: Administration → Dept Master File (`/admin/departments`)

**功能**:
- 创建、编辑、删除部门
- 为部门分配默认产品
- 查看部门的产品列表

**如何使用**:

**创建部门**:
1. 点击 "Add Department"
2. 输入部门名称
3. 点击 "Next: Assign Products"
4. 选择默认产品
5. 点击 "Create Department"

**查看产品**:
1. 点击部门行左侧的展开按钮
2. 查看该部门的产品列表

**编辑部门**:
1. 点击部门行的 "Edit" 按钮
2. 修改名称或产品分配
3. 点击 "Update Department"

---

### 3. 服务与产品选择器 🌲

**特点**:
- 树形结构展示
- 选择服务 = 选择其所有产品
- 可以单独取消产品选择
- 显示部分选中状态

**使用位置**:
- 用户表单中的产品分配
- 部门表单中的产品分配

**操作**:
- 点击服务复选框：选中/取消所有产品
- 点击产品复选框：单独选中/取消
- 点击箭头：展开/折叠产品列表

---

## 页面路由

### 用户相关
- `/users` - Employee Directory (用户列表)

### 管理相关 (需要 Admin 权限)
- `/admin/departments` - 部门管理
- `/admin/permissions` - 用户权限管理
- `/admin/files` - Master Files
- `/inbox` - 工作流收件箱

---

## 权限说明

### Admin 权限
可以访问所有功能：
- ✅ Dashboard
- ✅ Inbox
- ✅ Service Provider
- ✅ Product Inventory
- ✅ Payment Register
- ✅ Employee Directory
- ✅ Department Management
- ✅ All Administration pages

### Service Admin 权限
可以访问大部分功能，但不能：
- ❌ 访问 Inbox
- ❌ 访问 Employee Directory
- ❌ 访问 Administration 菜单

---

## API 端点

### 部门相关

```typescript
// 获取所有部门
GET /api/departments

// 创建部门
POST /api/departments
Body: { "name": "Engineering" }

// 更新部门
PUT /api/departments/{id}
Body: { "name": "Engineering Dept" }

// 删除部门
DELETE /api/departments/{id}

// 获取部门产品
GET /api/departments/{id}/products

// 设置部门产品（完全替换）
PUT /api/departments/{id}/products
Body: { "product_ids": ["uuid1", "uuid2"] }
```

### 用户相关（v3 增强）

```typescript
// 获取用户（包含新字段）
GET /api/users

// 创建用户（支持新字段）
POST /api/users
Body: {
  "name": "John Doe",
  "email": "john@example.com",
  "department": "Engineering",
  "position": "Senior Developer",      // v3
  "hire_date": "2024-01-15",          // v3
  "assignedProductIds": ["uuid1", "uuid2"]
}

// 更新用户（支持新字段）
PUT /api/users/{id}
Body: {
  "position": "Lead Developer",
  "resignation_date": "2024-12-31"    // v3
}
```

---

## 组件使用示例

### ServiceProductSelector

```tsx
import { ServiceProductSelector } from '@/components/products/ServiceProductSelector';

function MyComponent() {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  return (
    <ServiceProductSelector
      services={services}
      selectedProductIds={selectedProductIds}
      onSelectionChange={setSelectedProductIds}
      loading={false}
    />
  );
}
```

### DepartmentFormDialog

```tsx
import { DepartmentFormDialog } from '@/components/departments/DepartmentFormDialog';

function MyComponent() {
  const [open, setOpen] = useState(false);
  const [department, setDepartment] = useState<Department | null>(null);

  return (
    <DepartmentFormDialog
      open={open}
      onOpenChange={setOpen}
      department={department}  // null for create, Department for edit
      onSuccess={() => {
        // Refresh list
      }}
    />
  );
}
```

---

## 常见问题

### Q: 部门产品分配如何工作？
A: 
- 为部门分配的产品是**默认产品**
- 部门中的用户会自动继承这些产品（后端处理）
- Admin 可以为单个用户手动覆盖产品分配

### Q: 如何删除产品分配？
A: 
- 对于用户：在编辑用户时取消选择产品
- 对于部门：在编辑部门时取消选择产品，或设置空列表

### Q: 离职日期字段在哪里？
A: 
- 创建用户时：**不显示**（自动为 null）
- 用户列表：**不显示**
- 编辑用户：**显示**（可选设置）

### Q: 如何测试新功能？
A: 
1. 确保后端服务运行在 http://localhost:8000
2. 以 Admin 用户登录
3. 访问 Employee Directory 测试用户新字段
4. 访问 Administration → Dept Master File 测试部门管理

---

## 开发技巧

### 调试

```bash
# 查看控制台日志
# 所有 API 错误会打印到浏览器控制台

# 查看网络请求
# 使用浏览器开发者工具的 Network 标签
```

### 样式调整

所有组件使用 Tailwind CSS 和 shadcn/ui：
- 颜色变量在 `app/globals.css`
- 组件主题在 `components/ui/`
- 自定义类使用 `cn()` 工具函数

### 添加新字段

如果需要添加更多字段：

1. 更新 `types/index.ts` 类型定义
2. 更新 `lib/api.ts` API 调用
3. 更新表单组件添加输入字段
4. 更新列表页面显示新字段

---

## 性能优化

### 已实施的优化
- ✅ 产品列表按需加载（展开时加载）
- ✅ 使用 React state 缓存服务数据
- ✅ 避免不必要的重新渲染
- ✅ 合理的加载状态提示

### 建议
- 大数据量时考虑分页（后端支持）
- 使用虚拟滚动处理长列表
- 考虑添加搜索/过滤功能

---

## 下一步

1. ✅ 测试所有新功能
2. ✅ 收集用户反馈
3. 🔄 考虑添加搜索和过滤
4. 🔄 考虑添加批量操作
5. 🔄 优化移动端体验

---

## 支持

如有问题，请查看：
- 完整文档: `V3_FRONTEND_IMPLEMENTATION.md`
- 后端文档: `/doc/cursor/server/feat-v2/V3_IMPLEMENTATION_COMPLETE.md`
- API 参考: `/doc/cursor/server/feat-v2/V3_API_QUICK_REFERENCE.md`

---

**版本**: v3.0
**更新日期**: 2025年10月22日

