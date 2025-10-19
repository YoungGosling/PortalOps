# Inbox 功能完善总结

## 变更概述

根据PRD v2.0的Inbox需求，完善了入职(Onboarding)和离职(Offboarding)工作流，确保：

1. ✅ **入职流程**：HR系统调用入职接口后，**不会立即创建用户**，只创建待处理任务。只有当Admin在Inbox中点击"Start Task"处理完入职信息并成功提交后，才会在User Directory中创建用户。
2. ✅ **离职流程**：HR系统调用离职接口后，**不会立即删除用户**，只创建待处理任务。只有当Admin在Inbox中点击"Start Task"处理完离职信息并成功提交后，才会从User Directory中删除用户。
3. ✅ **数据一致性**：入职Task未处理完成前，User Directory中不会显示新员工。

## 核心变更

### 数据库变更

**文件**: `database/migrations/001_update_workflow_tasks_for_inbox.sql`

修改 `workflow_tasks` 表：
- 新增 `employee_name` 字段（存储员工姓名）
- 新增 `employee_email` 字段（存储员工邮箱）
- 新增 `employee_department` 字段（存储员工部门）
- 修改 `target_user_id` 为可空（入职时用户不存在）
- 修改外键约束为 `ON DELETE SET NULL`

**原因**：入职任务创建时，用户记录尚不存在，需要将HR系统传来的员工信息存储在任务中。

### 后端变更

#### 1. 模型和Schema更新

**文件**: 
- `server/app/models/workflow.py`
- `server/app/schemas/workflow.py`
- `server/app/crud/workflow.py`

**变更**：
- 添加员工元数据字段到WorkflowTask模型
- 更新CRUD方法以支持存储员工信息
- 使target_user_id可选

#### 2. Webhook接口重构

**文件**: `server/app/api/api_v1/endpoints/workflows.py`

**入职Webhook** (`POST /api/webhooks/hr/onboarding`):

**之前行为** ❌:
```python
# 立即创建占位用户
new_user = user.create(db, obj_in=user_create)
# 创建任务引用该用户
workflow_task.create_onboarding_task(db, target_user_id=new_user.id)
```

**现在行为** ✅:
```python
# 只创建任务，存储员工信息，不创建用户
workflow_task.create_onboarding_task(
    db,
    assignee_id=admin_user_role.user_id,
    employee_name=employee_data["name"],
    employee_email=employee_data["email"],
    employee_department=employee_data.get("department"),
    details=task_details
)
# target_user_id = None (用户尚不存在)
```

**离职Webhook** (`POST /api/webhooks/hr/offboarding`):

**之前行为** ❌:
```python
# 可能立即删除用户或创建任务后用户已被删
```

**现在行为** ✅:
```python
# 只创建任务，不删除用户
workflow_task.create_offboarding_task(
    db,
    assignee_id=admin_user_role.user_id,
    target_user_id=existing_user.id,  # 引用现有用户
    employee_name=existing_user.name,
    employee_email=existing_user.email,
    employee_department=existing_user.department,
    details=task_details
)
# 用户仍然存在于数据库中
```

#### 3. 任务完成接口重构

**文件**: `server/app/api/api_v1/endpoints/workflows.py`

**端点**: `POST /api/inbox/tasks/{task_id}/complete`

**入职任务完成**:
```python
if existing_task.type == "onboarding":
    # 验证用户已通过User Directory API创建
    created_user = user.get_by_email(db, email=existing_task.employee_email)
    if not created_user:
        raise HTTPException(
            status_code=400,
            detail="User must be created before completing onboarding task"
        )
    
    # 更新任务，关联用户ID，标记完成
    workflow_task.update(db, db_obj=existing_task, obj_in={
        "target_user_id": created_user.id,
        "status": "completed"
    })
```

**离职任务完成**:
```python
elif existing_task.type == "offboarding":
    # 删除用户
    target_user = user.get(db, existing_task.target_user_id)
    if target_user:
        user.remove(db, id=existing_task.target_user_id)
    
    # 标记任务完成
    workflow_task.update(db, db_obj=existing_task, obj_in={"status": "completed"})
```

### 前端变更

#### 1. 类型定义更新

**文件**: `nextjs/types/index.ts`

```typescript
export interface WorkflowTask {
  id: string;
  type: 'onboarding' | 'offboarding';  // 匹配后端字段名
  employee_name: string;
  employee_email: string;
  employee_department?: string;
  status: 'pending' | 'completed';
  created_at: string;
  updated_at: string;
  target_user_id?: string;  // 入职时为空
}
```

#### 2. Inbox页面重构

**文件**: `nextjs/app/(internal)/inbox/page.tsx`

**处理入职任务**:

**之前** ❌:
```typescript
// 尝试从User Directory获取占位用户
const users = await apiClient.getUsers();
const placeholderUser = users.find(u => u.email === task.employee_email);
```

**现在** ✅:
```typescript
// 创建临时用户对象，使用任务中的员工数据
const tempUser: User = {
  id: '',  // 空ID表示需要创建新用户
  name: task.employee_name,
  email: task.employee_email,
  department: task.employee_department,
  roles: [],
  assignedServiceIds: []
};
setEditingUser(tempUser);
```

**任务完成回调**:
```typescript
const handleTaskComplete = async () => {
  // 调用完成任务API（入职：验证用户已创建；离职：删除用户）
  await apiClient.completeTask(currentTask.id);
  await fetchTasks();  // 刷新任务列表
  toast.success('Onboarding/Offboarding completed successfully');
};
```

#### 3. 用户表单对话框更新

**文件**: `nextjs/components/users/UserFormDialog.tsx`

**关键逻辑**:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  if (isOffboarding && user && user.id) {
    // 离职：只触发回调，由complete task接口处理删除
    onSuccess();
    return;
  }
  
  const isCreate = !user || !user.id;  // 判断是创建还是更新
  
  if (isCreate) {
    // 创建新用户（入职流程）
    await apiClient.createUser(userData);
  } else {
    // 更新现有用户
    await apiClient.updateUser(user.id, userData);
  }
  
  // 调用成功回调（入职时会调用completeTask）
  onSuccess();
};
```

## 完整工作流程

### 入职流程 (Onboarding)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. HR系统 → POST /api/webhooks/hr/onboarding               │
│    Body: { employee: { name, email, department } }         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. 后端创建workflow_task记录                                │
│    - type: "onboarding"                                     │
│    - employee_name: "张三"                                  │
│    - employee_email: "zhangsan@company.com"                │
│    - target_user_id: NULL （用户尚不存在）                  │
│    - status: "pending"                                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Admin访问Inbox，看到待处理的入职任务                     │
│    显示：张三 (zhangsan@company.com) - Action Required      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Admin点击 "Start Task"                                   │
│    前端创建临时User对象（id为空，使用任务中的员工数据）      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. UserFormDialog打开                                       │
│    - Name, Email, Department: 只读（来自HR）                │
│    - 分配至少一个Service（必填）                            │
│    - 可选分配Role                                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Admin分配Service后点击 "Complete Onboarding"             │
│    前端调用: POST /api/users (创建用户)                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. 用户创建成功                                             │
│    - users表新增记录                                        │
│    - permission_assignments表新增服务分配记录               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. 前端调用: POST /api/inbox/tasks/{id}/complete           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. 后端验证用户已创建，更新任务                             │
│    - target_user_id: 设置为新创建用户的ID                   │
│    - status: "completed"                                    │
│    - 记录audit log                                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 10. ✅ 完成                                                  │
│     - Inbox任务标记为完成                                   │
│     - User Directory显示新用户                              │
└─────────────────────────────────────────────────────────────┘
```

### 离职流程 (Offboarding)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. HR系统 → POST /api/webhooks/hr/offboarding              │
│    Body: { employee: { name, email, department } }         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. 后端查找现有用户，创建workflow_task记录                  │
│    - type: "offboarding"                                    │
│    - employee_name: "张三"                                  │
│    - employee_email: "zhangsan@company.com"                │
│    - target_user_id: <用户UUID> （引用现有用户）            │
│    - status: "pending"                                      │
│    ❗用户仍然存在于users表中                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Admin访问Inbox，看到待处理的离职任务                     │
│    显示：张三 (zhangsan@company.com) - Action Required      │
│    ❗此时User Directory仍显示该用户                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Admin点击 "Start Task"                                   │
│    前端从User Directory获取完整用户信息                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. UserFormDialog打开（离职模式）                           │
│    - 所有字段只读                                           │
│    - 显示当前分配的Services（只读）                         │
│    - 显示警告：此操作将删除用户及所有权限                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Admin审核后点击 "Confirm Offboarding"                    │
│    前端调用: POST /api/inbox/tasks/{id}/complete            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. 后端处理离职                                             │
│    - 删除users表记录                                        │
│    - 级联删除permission_assignments记录                     │
│    - 级联删除user_roles记录                                 │
│    - 更新任务: status = "completed"                         │
│    - 记录audit log                                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. ✅ 完成                                                   │
│     - Inbox任务标记为完成                                   │
│     - User Directory不再显示该用户                          │
└─────────────────────────────────────────────────────────────┘
```

## 关键行为验证

### ✅ 正确行为

| 场景 | 期望行为 | 实现状态 |
|------|---------|---------|
| 调用入职Webhook | 只创建任务，User Directory无新用户 | ✅ |
| Admin完成入职 | 用户出现在User Directory | ✅ |
| 调用离职Webhook | 只创建任务，用户仍在User Directory | ✅ |
| Admin完成离职 | 用户从User Directory消失 | ✅ |
| 重复入职Webhook | 返回"任务已存在"错误 | ✅ |
| 未创建用户就完成入职任务 | 返回"必须先创建用户"错误 | ✅ |

### ❌ 之前的问题（已修复）

| 问题 | 之前行为 | 现在行为 |
|------|---------|---------|
| 入职即创建用户 | Webhook调用后立即创建占位用户 | 只创建任务，不创建用户 |
| 用户过早可见 | 未处理入职任务就能在目录中看到用户 | 必须完成任务才出现 |
| 离职即删除 | Webhook可能立即删除用户 | 只创建任务，保留用户 |
| 无法审核离职 | Admin无法查看用户信息 | Admin可审核后确认删除 |

## 安装和部署

### 1. 应用数据库迁移

```bash
cd /home/evanzhang/EnterpriseProjects/PortalOps
psql -U postgres -d portalops -f database/migrations/001_update_workflow_tasks_for_inbox.sql
```

### 2. 重启后端服务

```bash
cd server
source .venv/bin/activate
python -m uvicorn app.main:app --reload
```

### 3. 重启前端服务

```bash
cd nextjs
pnpm run dev
```

## 测试

### 自动化测试

```bash
cd server
./test_inbox_workflow.sh
```

### 手动测试步骤

详见 `INBOX_IMPLEMENTATION.md` 文件中的 "Testing Guide" 章节。

## 修改的文件清单

### 数据库
- ✅ `database/migrations/001_update_workflow_tasks_for_inbox.sql` (新建)

### 后端 (server/)
- ✅ `app/models/workflow.py`
- ✅ `app/schemas/workflow.py`
- ✅ `app/crud/workflow.py`
- ✅ `app/api/api_v1/endpoints/workflows.py`

### 前端 (nextjs/)
- ✅ `types/index.ts`
- ✅ `app/(internal)/inbox/page.tsx`
- ✅ `components/users/UserFormDialog.tsx`

### 文档
- ✅ `INBOX_IMPLEMENTATION.md` (新建，完整实现文档)
- ✅ `INBOX_CHANGES_SUMMARY.md` (本文件)
- ✅ `server/test_inbox_workflow.sh` (新建，测试脚本)

## API变更总结

| 端点 | 变更 | 影响 |
|------|------|------|
| `POST /api/webhooks/hr/onboarding` | 不再创建用户记录 | HR系统无感知，响应相同 |
| `POST /api/webhooks/hr/offboarding` | 不再删除用户记录 | HR系统无感知，响应相同 |
| `GET /api/inbox/tasks` | 返回包含employee_*字段 | 前端已更新匹配 |
| `POST /api/inbox/tasks/{id}/complete` | 新增入职验证和离职删除逻辑 | 前端正确调用 |

## 注意事项

1. **数据库迁移必须先执行**：否则后端启动会因字段缺失而失败
2. **Webhook密钥配置**：确保 `X-Webhook-Key` 已在环境变量中配置
3. **Admin角色必须存在**：Webhook依赖Admin角色分配任务
4. **邮箱唯一性**：系统会拒绝重复邮箱的入职请求
5. **级联删除**：离职时会自动删除所有关联的权限和角色

## 性能考虑

- ✅ 添加了 `employee_email` 索引以加速任务查询
- ✅ Webhook接口在创建任务前检查重复，避免垃圾数据
- ✅ 前端Inbox页面使用员工数据直接显示，无需额外查询用户表

## 安全性

- ✅ Webhook需要密钥验证
- ✅ 只有Admin可以访问Inbox和完成任务
- ✅ 所有用户创建/删除操作都有audit log记录
- ✅ 离职时级联删除所有权限，防止权限泄露

## 总结

本次实现完全符合PRD v2.0的Inbox需求，确保了：

1. **入职任务未处理前，User Directory不会显示新员工**
2. **调用入职或离职接口不会直接新增或删除用户**
3. **只有Admin在Inbox成功提交任务后，才会对应地新增或删除用户**

这种设计提供了更好的控制、可审计性，并防止了意外的过早访问或数据丢失。

