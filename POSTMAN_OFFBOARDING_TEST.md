# Postman 测试离职(Offboarding)功能完整指南

## 前置条件

### 1. 应用数据库迁移

**必须先执行此步骤，否则会报500错误！**

```bash
# 方法1: 使用psql命令行
PGPASSWORD=password psql -U portalops -h localhost -d portalops -f /home/evanzhang/EnterpriseProjects/PortalOps/database/migrations/001_update_workflow_tasks_for_inbox.sql

# 方法2: 使用pgAdmin或其他数据库工具
# 直接打开 001_update_workflow_tasks_for_inbox.sql 文件并执行其中的SQL
```

**验证迁移成功**:
```sql
-- 连接到数据库后执行
\d workflow_tasks

-- 应该看到以下新列:
-- employee_name | character varying(255)
-- employee_email | character varying(255)
-- employee_department | character varying(255)
```

### 2. 确保系统中有至少一个用户

离职功能需要先有用户存在。我们可以通过入职流程创建一个用户，或者直接用现有用户。

## 完整测试流程

### 场景A: 测试完整的入职+离职流程

#### Step 1: 调用入职Webhook（创建测试用户）

**Postman配置**:

- **Method**: `POST`
- **URL**: `http://localhost:8000/api/webhooks/hr/onboarding`
- **Headers**:
  ```
  Content-Type: application/json
  X-Webhook-Key: your-hr-webhook-secret-key
  ```
  > ⚠️ 注意：`X-Webhook-Key` 的值必须与服务器配置的一致。默认值在 `server/.env` 或 `server/env.example` 中查看。

- **Body** (raw JSON):
  ```json
  {
    "employee": {
      "name": "测试员工",
      "email": "test.employee@company.com",
      "department": "工程部"
    }
  }
  ```

**预期响应**:
```json
{
  "message": "Onboarding workflow triggered successfully"
}
```

**验证**:
- 访问 `http://localhost:3000/inbox` (需要Admin登录)
- 应该看到一条待处理的入职任务
- **重要**: 此时访问 `http://localhost:3000/users` 不应该看到 `test.employee@company.com`

#### Step 2: 完成入职（通过前端）

1. 登录为Admin用户
2. 进入 Inbox 页面
3. 点击"测试员工"的 "Start Task" 按钮
4. 在弹出的表单中：
   - Name, Email, Department 是只读的（来自HR系统）
   - **必须**至少分配一个Service
   - 可选择分配Role (Admin 或 ServiceAdmin)
5. 点击 "Complete Onboarding"

**验证**:
- Inbox中该任务状态变为 "completed"
- User Directory中现在应该能看到 `test.employee@company.com` ✅

#### Step 3: 调用离职Webhook

现在用户已存在，可以测试离职功能了。

**Postman配置**:

- **Method**: `POST`
- **URL**: `http://localhost:8000/api/webhooks/hr/offboarding`
- **Headers**:
  ```
  Content-Type: application/json
  X-Webhook-Key: your-hr-webhook-secret-key
  ```

- **Body** (raw JSON):
  ```json
  {
    "employee": {
      "name": "测试员工",
      "email": "test.employee@company.com",
      "department": "工程部"
    }
  }
  ```

**预期响应**:
```json
{
  "message": "Offboarding workflow triggered successfully"
}
```

**验证**:
- 访问 Inbox，应该看到一条新的离职任务
- **关键验证**: 访问 User Directory，用户 `test.employee@company.com` **仍然存在** ✅
- 这证明离职Webhook没有立即删除用户

#### Step 4: 完成离职（通过前端）

1. 仍以Admin身份登录
2. 进入 Inbox 页面
3. 点击"测试员工"离职任务的 "Start Task" 按钮
4. 在弹出的表单中：
   - 所有字段都是只读的
   - 显示用户当前分配的Services（只读）
   - 显示警告信息
5. 审核后点击 "Confirm Offboarding"

**验证**:
- Inbox中离职任务状态变为 "completed"
- **关键验证**: User Directory中 `test.employee@company.com` **已消失** ✅
- 用户的所有权限分配也被删除

---

### 场景B: 直接测试离职功能（使用现有用户）

如果系统中已经有用户，可以直接测试离职。

#### Step 1: 确认要离职的用户信息

**Postman配置**:

- **Method**: `GET`
- **URL**: `http://localhost:8000/api/users`
- **Headers**:
  ```
  Authorization: Bearer <your-admin-token>
  ```

从响应中找到一个用户，记下其email。

#### Step 2: 调用离职Webhook

使用该用户的信息调用离职API：

- **Method**: `POST`
- **URL**: `http://localhost:8000/api/webhooks/hr/offboarding`
- **Headers**:
  ```
  Content-Type: application/json
  X-Webhook-Key: your-hr-webhook-secret-key
  ```

- **Body**:
  ```json
  {
    "employee": {
      "name": "张三",
      "email": "zhangsan@company.com",
      "department": "销售部"
    }
  }
  ```

#### Step 3: 按照场景A的Step 4完成离职

---

## 常见错误和解决方案

### 错误1: 500 Internal Server Error

**错误信息**:
```json
{
  "error": "database_error",
  "message": "An error occurred while processing your request"
}
```

**原因**: 数据库迁移未应用，缺少 `employee_name` 等字段。

**解决方案**:
```bash
PGPASSWORD=password psql -U portalops -h localhost -d portalops -f database/migrations/001_update_workflow_tasks_for_inbox.sql
```

### 错误2: 401 Unauthorized

**错误信息**:
```json
{
  "detail": "Could not validate credentials"
}
```

**原因**: Webhook密钥不正确。

**解决方案**:
1. 检查 `server/.env` 中的 `HR_WEBHOOK_API_KEY` 值
2. 确保Postman中的 `X-Webhook-Key` header与之一致

### 错误3: User not found

**错误信息**:
```json
{
  "detail": "User test.employee@company.com not found in the system"
}
```

**原因**: 尝试离职一个不存在的用户。

**解决方案**:
1. 先通过入职流程创建用户（场景A）
2. 或者使用系统中已存在的用户email

### 错误4: Task already exists

**错误信息**:
```json
{
  "message": "Offboarding task already exists for this employee"
}
```

**原因**: 该用户已经有一个待处理的离职任务。

**解决方案**:
1. 先在Inbox中完成已有的任务
2. 或者检查该任务是否已经完成

---

## Postman Collection 配置

### 创建Environment

建议创建一个Environment来管理变量：

**变量**:
- `base_url`: `http://localhost:8000`
- `webhook_key`: `your-hr-webhook-secret-key`
- `admin_token`: (登录后获取的JWT token)

### Request示例

#### 1. 登录获取Token

```
POST {{base_url}}/api/auth/login
Content-Type: application/json

{
  "email": "admin@portalops.com",
  "password": "admin123"
}
```

将响应中的 `accessToken` 保存到 `admin_token` 变量。

#### 2. 入职Webhook

```
POST {{base_url}}/api/webhooks/hr/onboarding
Content-Type: application/json
X-Webhook-Key: {{webhook_key}}

{
  "employee": {
    "name": "{{$randomFullName}}",
    "email": "{{$randomEmail}}",
    "department": "Engineering"
  }
}
```

#### 3. 查看任务列表

```
GET {{base_url}}/api/inbox/tasks
Authorization: Bearer {{admin_token}}
```

#### 4. 离职Webhook

```
POST {{base_url}}/api/webhooks/hr/offboarding
Content-Type: application/json
X-Webhook-Key: {{webhook_key}}

{
  "employee": {
    "name": "Test User",
    "email": "test.user@company.com",
    "department": "Engineering"
  }
}
```

---

## 验证清单

使用此清单确保功能正常：

### 入职流程
- [ ] Webhook调用成功，返回 "triggered successfully"
- [ ] Inbox显示待处理的入职任务
- [ ] User Directory不显示该用户（✅ 核心验证）
- [ ] 完成入职任务后，User Directory显示该用户
- [ ] 任务状态变为 completed

### 离职流程
- [ ] Webhook调用成功，返回 "triggered successfully"
- [ ] Inbox显示待处理的离职任务
- [ ] User Directory仍显示该用户（✅ 核心验证）
- [ ] 完成离职任务后，User Directory不再显示该用户
- [ ] 任务状态变为 completed
- [ ] 用户的所有权限被删除

### 错误处理
- [ ] 重复调用入职Webhook返回 "already exists"
- [ ] 离职不存在的用户返回 "not found"
- [ ] 错误的Webhook Key返回 401
- [ ] 未应用迁移返回 500

---

## 快速测试脚本

如果你想用curl快速测试：

```bash
# 设置变量
WEBHOOK_KEY="your-hr-webhook-secret-key"
BASE_URL="http://localhost:8000"

# 1. 入职
curl -X POST "${BASE_URL}/api/webhooks/hr/onboarding" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Key: ${WEBHOOK_KEY}" \
  -d '{
    "employee": {
      "name": "快速测试用户",
      "email": "quick.test@company.com",
      "department": "测试部"
    }
  }'

# 2. 等待Admin在前端完成入职...

# 3. 离职
curl -X POST "${BASE_URL}/api/webhooks/hr/offboarding" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Key: ${WEBHOOK_KEY}" \
  -d '{
    "employee": {
      "name": "快速测试用户",
      "email": "quick.test@company.com",
      "department": "测试部"
    }
  }'

# 4. 等待Admin在前端完成离职...
```

---

## 数据库直接查询（调试用）

如果需要直接查看数据库状态：

```sql
-- 查看所有任务
SELECT 
  id,
  type,
  status,
  employee_name,
  employee_email,
  target_user_id,
  created_at
FROM workflow_tasks
ORDER BY created_at DESC;

-- 查看所有用户
SELECT 
  id,
  name,
  email,
  department,
  created_at
FROM users
ORDER BY created_at DESC;

-- 查看用户权限
SELECT 
  u.name,
  u.email,
  s.name as service_name
FROM users u
JOIN permission_assignments pa ON u.id = pa.user_id
LEFT JOIN services s ON pa.service_id = s.id
ORDER BY u.name;
```

---

## 总结

离职功能的核心验证点：

1. ✅ **调用离职Webhook后，用户仍然存在于User Directory**
2. ✅ **只有Admin在Inbox完成离职任务后，用户才被删除**
3. ✅ **删除用户时，所有相关权限也被级联删除**

这确保了没有用户会在Admin审核前被意外删除。

