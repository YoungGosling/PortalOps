# 快速应用数据库迁移

## 问题

如果你看到这个错误：
```
column workflow_tasks.employee_name does not exist
```

说明数据库迁移还没有应用。

## 解决方案

### 方法1: 使用psql命令行（推荐）

```bash
cd /home/evanzhang/EnterpriseProjects/PortalOps

# 使用portalops用户执行迁移
PGPASSWORD=password psql -U portalops -h localhost -d portalops -f database/migrations/001_update_workflow_tasks_for_inbox.sql
```

如果成功，你会看到类似输出：
```
ALTER TABLE
ALTER TABLE
ALTER TABLE
ALTER TABLE
CREATE INDEX
UPDATE 0
COMMENT
COMMENT
COMMENT
```

### 方法2: 使用pgAdmin或DBeaver

1. 打开你的数据库管理工具
2. 连接到 `portalops` 数据库
3. 打开SQL编辑器
4. 复制 `database/migrations/001_update_workflow_tasks_for_inbox.sql` 的全部内容
5. 执行SQL

### 方法3: 手动执行SQL（如果以上都不行）

连接到数据库后，手动执行以下SQL：

```sql
-- 1. 删除旧的外键约束
ALTER TABLE workflow_tasks 
  DROP CONSTRAINT IF EXISTS workflow_tasks_target_user_id_fkey;

-- 2. 使target_user_id可空
ALTER TABLE workflow_tasks 
  ALTER COLUMN target_user_id DROP NOT NULL;

-- 3. 添加新列
ALTER TABLE workflow_tasks 
  ADD COLUMN IF NOT EXISTS employee_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS employee_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS employee_department VARCHAR(255);

-- 4. 重新添加外键（ON DELETE SET NULL）
ALTER TABLE workflow_tasks 
  ADD CONSTRAINT workflow_tasks_target_user_id_fkey 
  FOREIGN KEY (target_user_id) 
  REFERENCES users(id) 
  ON DELETE SET NULL;

-- 5. 创建索引
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_employee_email 
  ON workflow_tasks(employee_email);

-- 6. 迁移现有数据（如果有）
UPDATE workflow_tasks wt
SET 
  employee_name = u.name,
  employee_email = u.email,
  employee_department = u.department
FROM users u
WHERE wt.target_user_id = u.id
  AND (wt.employee_email IS NULL OR wt.employee_name IS NULL);

-- 7. 添加注释
COMMENT ON COLUMN workflow_tasks.employee_name IS 'Employee name from HR system';
COMMENT ON COLUMN workflow_tasks.employee_email IS 'Employee email from HR system';
COMMENT ON COLUMN workflow_tasks.employee_department IS 'Employee department from HR system';
```

## 验证迁移成功

执行以下SQL验证：

```sql
\d workflow_tasks
```

或者：

```sql
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'workflow_tasks'
ORDER BY ordinal_position;
```

你应该看到这些新列：
- `employee_name` (character varying)
- `employee_email` (character varying)
- `employee_department` (character varying)

并且 `target_user_id` 的 `is_nullable` 应该是 `YES`。

## 常见问题

### Q: 我得到 "Peer authentication failed"
**A**: 使用密码认证而不是peer认证：
```bash
PGPASSWORD=password psql -U portalops -h localhost -d portalops -f migration.sql
```

### Q: 迁移文件在哪里？
**A**: 
```
/home/evanzhang/EnterpriseProjects/PortalOps/database/migrations/001_update_workflow_tasks_for_inbox.sql
```

### Q: 我不知道数据库密码
**A**: 检查这些文件：
- `server/.env`
- `server/env.example`

默认配置：
- 用户: `portalops`
- 密码: `password`
- 数据库: `portalops`
- 主机: `localhost`
- 端口: `5432`

### Q: 迁移后需要重启服务吗？
**A**: 不需要重启后端服务。SQLAlchemy会自动检测新的列。但如果仍有问题，可以重启：
```bash
cd server
# 停止当前服务 (Ctrl+C)
# 重新启动
python -m uvicorn app.main:app --reload
```

## 迁移后的下一步

1. **测试Inbox API**:
   ```bash
   # 获取任务列表应该不再报错
   curl -H "Authorization: Bearer <your-token>" \
        http://localhost:8000/api/inbox/tasks
   ```

2. **测试入职Webhook**:
   ```bash
   curl -X POST http://localhost:8000/api/webhooks/hr/onboarding \
     -H "Content-Type: application/json" \
     -H "X-Webhook-Key: your-webhook-key" \
     -d '{"employee": {"name": "Test", "email": "test@example.com", "department": "IT"}}'
   ```

3. **查看Inbox页面**:
   - 访问 http://localhost:3000/inbox
   - 应该能正常显示任务列表

## 回滚（如果需要）

如果迁移有问题，可以回滚：

```sql
-- 警告：这会删除所有employee_*列中的数据！
ALTER TABLE workflow_tasks 
  DROP COLUMN IF EXISTS employee_name,
  DROP COLUMN IF EXISTS employee_email,
  DROP COLUMN IF EXISTS employee_department;

-- 恢复target_user_id为NOT NULL（如果需要）
ALTER TABLE workflow_tasks 
  ALTER COLUMN target_user_id SET NOT NULL;

-- 删除索引
DROP INDEX IF EXISTS idx_workflow_tasks_employee_email;
```

但是注意：回滚后新的Inbox功能将无法工作！

