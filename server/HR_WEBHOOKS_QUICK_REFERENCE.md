# HR Webhooks 快速参考卡

## 🚀 快速开始

### 1. 启动服务
```bash
cd /home/evanzhang/EnterpriseProjects/PortalOps/server
./start.sh
```

### 2. 运行测试脚本
```bash
./test_hr_webhooks.sh
```

### 3. 导入 Postman Collection
导入文件：`PortalOps_HR_Webhooks.postman_collection.json`

---

## 📝 接口概览

### 入职接口（Onboarding）
```
POST http://localhost:8000/api/webhooks/hr/onboarding
```

**Headers:**
```
Content-Type: application/json
X-API-Key: your-hr-webhook-secret-key
```

**Body:**
```json
{
  "employee": {
    "name": "张三",
    "email": "zhangsan@example.com",
    "department": "工程部"
  }
}
```

**响应:** `202 Accepted`

---

### 离职接口（Offboarding）
```
POST http://localhost:8000/api/webhooks/hr/offboarding
```

**Headers:**
```
Content-Type: application/json
X-API-Key: your-hr-webhook-secret-key
```

**Body:**
```json
{
  "employee": {
    "name": "张三",
    "email": "zhangsan@example.com",
    "department": "工程部"
  }
}
```

**响应:** `202 Accepted` 或 `404 Not Found`（用户不存在）

---

## 🔑 配置 API Key

### 查看当前配置
```bash
grep HR_WEBHOOK_API_KEY .env
```

### 修改 API Key（推荐）
```bash
# 生成随机密钥
openssl rand -hex 32

# 编辑 .env 文件
nano .env
# 修改: HR_WEBHOOK_API_KEY=<新生成的密钥>

# 重启服务
./start.sh
```

---

## 🧪 使用 curl 测试

### 入职
```bash
curl -X POST http://localhost:8000/api/webhooks/hr/onboarding \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-hr-webhook-secret-key" \
  -d '{
    "employee": {
      "name": "测试用户",
      "email": "test@example.com",
      "department": "测试部"
    }
  }'
```

### 离职
```bash
curl -X POST http://localhost:8000/api/webhooks/hr/offboarding \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-hr-webhook-secret-key" \
  -d '{
    "employee": {
      "email": "test@example.com"
    }
  }'
```

---

## 📊 验证结果

### 1. 前端界面验证
- 登录管理界面（需要 Admin 权限）
- 访问 **Inbox** 页面
- 应该看到新创建的任务

### 2. 数据库验证
```sql
-- 查看工作流任务
SELECT id, type, status, details, created_at 
FROM workflow_tasks 
ORDER BY created_at DESC 
LIMIT 5;

-- 查看创建的用户
SELECT id, name, email, department 
FROM users 
WHERE email = 'test@example.com';

-- 查看审计日志
SELECT action, details, created_at 
FROM audit_logs 
WHERE action LIKE '%onboard%' OR action LIKE '%offboard%'
ORDER BY created_at DESC;
```

### 3. API 验证（需要 Admin Token）
```bash
# 获取 token（先登录）
TOKEN="<your-admin-token>"

# 查看任务列表
curl -X GET http://localhost:8000/api/inbox/tasks \
  -H "Authorization: Bearer ${TOKEN}"
```

---

## ⚠️ 常见错误

| HTTP Code | 原因 | 解决方法 |
|-----------|------|----------|
| 401 | API Key 错误 | 检查 X-API-Key header 是否正确 |
| 404 | 用户不存在（离职） | 确认用户 email 存在于系统中 |
| 422 | 请求格式错误 | 检查 JSON 格式和必需字段 |
| 500 | 服务器错误 | 查看服务器日志 |

---

## 🔍 故障排查

### 检查服务状态
```bash
# 使用 Docker
docker-compose ps

# 查看日志
docker-compose logs -f api
```

### 检查数据库连接
```bash
# 进入 postgres 容器
docker-compose exec postgres psql -U portalops

# 查看表结构
\dt

# 查看用户
SELECT * FROM users;
```

### 检查环境变量
```bash
cat .env | grep -E '(DATABASE_URL|HR_WEBHOOK_API_KEY)'
```

---

## 📖 相关文档

- **详细测试指南**: `HR_WEBHOOK_TESTING_GUIDE.md`
- **Postman Collection**: `PortalOps_HR_Webhooks.postman_collection.json`
- **测试脚本**: `test_hr_webhooks.sh`
- **API 规范**: `../doc/design/server/v2/API_Specification_v2.md`
- **PRD**: `../doc/design/PortalOps.md`

---

## 🔗 相关 API 端点

```
# 查看任务列表（需要 Admin 登录）
GET /api/inbox/tasks

# 完成任务（需要 Admin 登录）
POST /api/inbox/tasks/{taskId}/complete

# 查看用户列表（需要 Admin 登录）
GET /api/users

# 创建/更新用户（需要 Admin 登录）
POST /api/users
PUT /api/users/{userId}
```

---

## 💡 工作流说明

### 入职流程
1. HR 系统调用 onboarding webhook
2. 系统预创建用户（无密码、无权限）
3. 创建待办任务分配给 Admin
4. Admin 在 Inbox 中看到任务
5. Admin 点击 "Start Task" 打开用户表单
6. Admin 分配服务/产品和角色
7. Admin 提交，任务标记为完成
8. 用户获得权限，可以登录

### 离职流程
1. HR 系统调用 offboarding webhook
2. 系统查找用户（必须存在）
3. 创建待办任务分配给 Admin
4. Admin 在 Inbox 中看到任务
5. Admin 点击 "Start Task" 查看用户信息
6. Admin 确认离职
7. 系统删除用户和所有权限
8. 任务标记为完成

---

## 📞 支持

如有问题，请：
1. 查看服务器日志
2. 检查数据库数据
3. 运行测试脚本验证基本功能
4. 查阅完整的测试指南

---

**最后更新**: 2025-10-18  
**版本**: 2.0

