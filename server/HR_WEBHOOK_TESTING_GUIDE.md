# HR Webhook 接口测试指南

## 概述

PortalOps 已经实现了完整的入职（Onboarding）和离职（Offboarding）webhook接口。本指南将帮助您通过 Postman 测试这两个接口。

## 接口信息

### 1. 入职接口（Onboarding）
- **URL**: `POST http://localhost:8000/api/webhooks/hr/onboarding`
- **功能**: 触发员工入职工作流，创建待办任务并预创建用户
- **返回**: HTTP 202 Accepted

### 2. 离职接口（Offboarding）
- **URL**: `POST http://localhost:8000/api/webhooks/hr/offboarding`
- **功能**: 触发员工离职工作流，创建待办任务
- **返回**: HTTP 202 Accepted

## 前置条件

### 1. 确保服务正在运行
```bash
cd /home/evanzhang/EnterpriseProjects/PortalOps/server
./start.sh
```

### 2. 获取 API Key
API Key 在 `.env` 文件中配置（或使用默认值）：
```
HR_WEBHOOK_API_KEY=your-hr-webhook-secret-key
```

**重要**: 在生产环境中，请修改为强随机密钥！

### 3. 确保至少有一个 Admin 用户
这些 webhook 会自动将任务分配给系统中的第一个 Admin 用户。

## Postman 测试步骤

### 测试 1: 入职接口（Onboarding）

#### 1.1 配置请求
- **Method**: `POST`
- **URL**: `http://localhost:8000/api/webhooks/hr/onboarding`

#### 1.2 设置 Headers
```
Content-Type: application/json
X-API-Key: your-hr-webhook-secret-key
```

#### 1.3 设置 Body (选择 raw JSON)
```json
{
  "employee": {
    "name": "张三",
    "email": "zhangsan@example.com",
    "department": "工程部"
  }
}
```

#### 1.4 预期响应
**成功 (202 Accepted)**:
```json
{
  "message": "Onboarding workflow triggered"
}
```

**错误响应**:
- `401 Unauthorized`: API Key 不正确
  ```json
  {
    "detail": "Invalid API key"
  }
  ```
- `400 Bad Request`: 请求格式错误

#### 1.5 验证结果
1. 访问前端 Inbox 页面（需要 Admin 登录）
2. 应该看到一条新的 "Onboarding" 任务
3. 任务详情包含员工信息
4. 用户已预创建（但没有权限和角色）

---

### 测试 2: 离职接口（Offboarding）

#### 2.1 前置条件
确保系统中存在要离职的员工记录（可以通过测试 1 先创建）

#### 2.2 配置请求
- **Method**: `POST`
- **URL**: `http://localhost:8000/api/webhooks/hr/offboarding`

#### 2.3 设置 Headers
```
Content-Type: application/json
X-API-Key: your-hr-webhook-secret-key
```

#### 2.4 设置 Body (选择 raw JSON)
```json
{
  "employee": {
    "name": "张三",
    "email": "zhangsan@example.com",
    "department": "工程部"
  }
}
```

**注意**: name 和 department 字段是可选的，但 **email 是必须的**，系统通过 email 查找用户。

#### 2.5 预期响应
**成功 (202 Accepted)**:
```json
{
  "message": "Offboarding workflow triggered"
}
```

**错误响应**:
- `401 Unauthorized`: API Key 不正确
- `404 Not Found`: 用户不存在
  ```json
  {
    "detail": "User not found"
  }
  ```

#### 2.6 验证结果
1. 访问前端 Inbox 页面（需要 Admin 登录）
2. 应该看到一条新的 "Offboarding" 任务
3. 任务详情包含员工信息和当前权限
4. 完成任务后，用户将被删除

---

## 完整工作流测试

### 场景 1: 完整的入职流程

1. **HR 系统触发入职 webhook**
   ```bash
   curl -X POST http://localhost:8000/api/webhooks/hr/onboarding \
     -H "Content-Type: application/json" \
     -H "X-API-Key: your-hr-webhook-secret-key" \
     -d '{
       "employee": {
         "name": "李四",
         "email": "lisi@example.com",
         "department": "销售部"
       }
     }'
   ```

2. **Admin 在 Inbox 中看到任务**
   - 访问 `/inbox`
   - 看到待办的 Onboarding 任务

3. **Admin 点击 "Start Task"**
   - 打开 User Form Dialog
   - 姓名、邮箱、部门字段预填且只读
   - Admin 分配服务/产品权限
   - 可选择分配角色（Admin 或 ServiceAdmin）

4. **Admin 提交表单**
   - 用户权限更新
   - 任务自动标记为 "Completed"
   - 用户可以登录系统

### 场景 2: 完整的离职流程

1. **HR 系统触发离职 webhook**
   ```bash
   curl -X POST http://localhost:8000/api/webhooks/hr/offboarding \
     -H "Content-Type: application/json" \
     -H "X-API-Key: your-hr-webhook-secret-key" \
     -d '{
       "employee": {
         "name": "李四",
         "email": "lisi@example.com",
         "department": "销售部"
       }
     }'
   ```

2. **Admin 在 Inbox 中看到任务**
   - 访问 `/inbox`
   - 看到待办的 Offboarding 任务

3. **Admin 点击 "Start Task"**
   - 打开 User Form Dialog（查看模式）
   - 显示用户的所有信息和权限（只读）
   - 显示确认离职按钮

4. **Admin 确认离职**
   - 调用 `POST /api/inbox/tasks/{taskId}/complete`
   - 用户被删除
   - 所有权限被移除
   - 任务标记为 "Completed"

---

## 使用 curl 进行测试

### 入职测试
```bash
# 入职
curl -X POST http://localhost:8000/api/webhooks/hr/onboarding \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-hr-webhook-secret-key" \
  -d '{
    "employee": {
      "name": "王五",
      "email": "wangwu@example.com",
      "department": "市场部"
    }
  }'
```

### 离职测试
```bash
# 离职
curl -X POST http://localhost:8000/api/webhooks/hr/offboarding \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-hr-webhook-secret-key" \
  -d '{
    "employee": {
      "name": "王五",
      "email": "wangwu@example.com",
      "department": "市场部"
    }
  }'
```

---

## Postman Collection 配置

您可以在 Postman 中创建一个 Collection 来管理这些请求：

### Collection 变量设置
```
base_url: http://localhost:8000
api_key: your-hr-webhook-secret-key
```

### 请求 1: HR Onboarding
```
POST {{base_url}}/api/webhooks/hr/onboarding
Headers:
  Content-Type: application/json
  X-API-Key: {{api_key}}
Body:
{
  "employee": {
    "name": "测试员工",
    "email": "test@example.com",
    "department": "测试部门"
  }
}
```

### 请求 2: HR Offboarding
```
POST {{base_url}}/api/webhooks/hr/offboarding
Headers:
  Content-Type: application/json
  X-API-Key: {{api_key}}
Body:
{
  "employee": {
    "name": "测试员工",
    "email": "test@example.com",
    "department": "测试部门"
  }
}
```

---

## 常见问题

### Q1: 收到 401 Unauthorized 错误
**原因**: X-API-Key header 不正确或缺失
**解决**: 
- 检查 `.env` 文件中的 `HR_WEBHOOK_API_KEY` 配置
- 确保 Postman 中的 X-API-Key header 值与配置匹配

### Q2: 离职接口返回 404 User not found
**原因**: 系统中不存在该 email 的用户
**解决**: 
- 先通过入职接口创建用户
- 或者使用已存在用户的 email

### Q3: 接口调用成功，但 Inbox 中看不到任务
**原因**: 系统中没有 Admin 用户
**解决**: 
- 确保至少创建一个具有 Admin 角色的用户
- 检查数据库中的 roles 和 user_roles 表

### Q4: 入职时重复创建用户
**行为**: 如果用户已存在，系统会：
- 检查是否有待处理的入职任务
- 如果有，返回已存在的消息
- 如果没有，为现有用户创建新任务

---

## 安全建议

1. **生产环境必须修改 API Key**
   ```bash
   # 生成强随机密钥
   openssl rand -hex 32
   ```

2. **使用 HTTPS**
   在生产环境中，webhook URL 必须使用 HTTPS

3. **IP 白名单**
   考虑在 nginx/防火墙层面限制只允许 HR 系统的 IP 访问

4. **请求日志**
   所有 webhook 调用都会记录到 audit_logs 表中

5. **请求验证**
   考虑添加请求签名验证机制（HMAC）

---

## 相关 API 端点

### 查看任务列表（需要 Admin 登录）
```
GET /api/inbox/tasks
Authorization: Bearer <admin_token>
```

### 完成任务（需要 Admin 登录）
```
POST /api/inbox/tasks/{taskId}/complete
Authorization: Bearer <admin_token>
```

### 查看用户列表（需要 Admin 登录）
```
GET /api/users
Authorization: Bearer <admin_token>
```

---

## 附录：数据库验证

### 检查创建的任务
```sql
SELECT * FROM workflow_tasks 
WHERE type IN ('onboarding', 'offboarding')
ORDER BY created_at DESC;
```

### 检查用户创建情况
```sql
SELECT id, name, email, department, password_hash 
FROM users 
WHERE email = 'test@example.com';
```

### 检查审计日志
```sql
SELECT * FROM audit_logs 
WHERE action LIKE '%onboard%' OR action LIKE '%offboard%'
ORDER BY created_at DESC;
```

---

## 总结

✅ 入职和离职接口已完全实现  
✅ 支持通过 API Key 进行安全验证  
✅ 自动创建工作流任务  
✅ 与前端 Inbox 模块完全集成  
✅ 支持完整的审计日志记录  

如有任何问题，请查看服务器日志：
```bash
# 如果使用 Docker
docker-compose logs -f api

# 如果直接运行
tail -f logs/portalops.log
```

