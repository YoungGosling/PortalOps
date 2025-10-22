# 部署检查清单 - Azure Auto-Admin Feature

## 📋 部署前准备

### 1. 环境检查

- [ ] **测试环境验证完成**
  - [ ] 功能测试通过
  - [ ] 性能测试通过
  - [ ] 安全性审查完成

- [ ] **生产环境准备**
  - [ ] 数据库备份已完成
  - [ ] 回滚方案已准备
  - [ ] 监控告警已配置

- [ ] **Azure AD配置检查**
  - [ ] AZURE_AD_ENABLED=true
  - [ ] AZURE_AD_TENANT_ID 正确配置
  - [ ] AZURE_AD_CLIENT_ID 正确配置
  - [ ] 前端环境变量配置正确

---

## 🚀 部署步骤

### Step 1: 备份数据库 ✅

```bash
# 创建备份
pg_dump -h [DB_HOST] -U [DB_USER] -d portalops > \
  backup_azure_auto_admin_$(date +%Y%m%d_%H%M%S).sql

# 验证备份文件
ls -lh backup_azure_auto_admin_*.sql
```

**检查点**:
- [ ] 备份文件已创建
- [ ] 备份文件大小合理（非0字节）
- [ ] 备份文件已保存到安全位置

---

### Step 2: 拉取最新代码 ✅

```bash
cd /home/evanzhang/EnterpriseProjects/PortalOps
git pull origin main
```

**检查点**:
- [ ] 代码拉取成功
- [ ] `server/app/core/deps.py` 包含新的修改
- [ ] 所有文档文件已更新

---

### Step 3: 重启后端服务 ✅

```bash
# 方式1: Docker
docker-compose restart backend

# 方式2: 手动重启
# 停止服务
pkill -f "uvicorn"
# 启动服务
cd server && ./start.sh

# 检查服务状态
curl http://localhost:8000/health
```

**检查点**:
- [ ] 服务重启成功
- [ ] 没有启动错误
- [ ] 健康检查通过

---

### Step 4: 验证功能 ✅

#### 4.1 日志检查

```bash
# 查看启动日志
docker logs portalops-backend | tail -50

# 查看是否有错误
docker logs portalops-backend | grep -i error
```

**检查点**:
- [ ] 没有严重错误
- [ ] 服务正常启动

#### 4.2 数据库检查

```bash
# 检查Admin角色
psql -h [DB_HOST] -U [DB_USER] -d portalops -c \
  "SELECT * FROM roles WHERE name = 'Admin';"

# 检查现有Azure用户
psql -h [DB_HOST] -U [DB_USER] -d portalops -c \
  "SELECT email, azure_id FROM users WHERE azure_id IS NOT NULL;"
```

**检查点**:
- [ ] Admin角色存在（id=1）
- [ ] 能够查询到Azure用户

#### 4.3 功能测试

```bash
# 测试1: 新用户登录
# 1. 访问 http://[your-domain]/signin
# 2. 点击 "Sign in with Microsoft"
# 3. 使用新的Azure账号登录
# 4. 检查是否获得Admin权限（能否创建Service/Product）

# 测试2: 查看日志
docker logs -f portalops-backend | grep "Admin role"
# 应该看到: "Assigned Admin role to Azure user xxx"
```

**检查点**:
- [ ] 新Azure用户能够登录
- [ ] 自动获得Admin角色
- [ ] 日志正常记录
- [ ] 能够访问需要Admin权限的功能

---

### Step 5: 运行迁移脚本（可选） ✅

**仅当需要为已存在的Azure用户补充角色时执行**

```bash
# 查看有多少Azure用户需要更新
psql -h [DB_HOST] -U [DB_USER] -d portalops -c "
SELECT COUNT(*) 
FROM users u
WHERE u.azure_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = u.id AND r.name = 'Admin'
);
"

# 如果有需要更新的用户，运行迁移脚本
psql -h [DB_HOST] -U [DB_USER] -d portalops -f \
  database/migration/assign_admin_to_existing_azure_users.sql
```

**检查点**:
- [ ] 迁移脚本执行成功
- [ ] 输出显示更新的用户数量
- [ ] 验证查询确认所有Azure用户都有Admin角色

---

### Step 6: 运行测试脚本 ✅

```bash
cd server
export PGPASSWORD=[your_password]
./test_azure_auto_admin.sh
```

**检查点**:
- [ ] 所有测试项通过
- [ ] 没有发现Azure用户缺少Admin角色
- [ ] 没有重复的角色分配

---

## 📊 部署后验证

### 监控检查清单

#### 立即检查（部署后10分钟内）

- [ ] **服务状态**
  ```bash
  # CPU和内存使用正常
  docker stats portalops-backend
  
  # 没有频繁重启
  docker ps -a | grep portalops-backend
  ```

- [ ] **日志监控**
  ```bash
  # 监控错误日志
  docker logs -f portalops-backend | grep -i "error\|warning"
  ```

- [ ] **功能测试**
  - [ ] 密码登录仍然正常工作
  - [ ] Azure登录正常工作
  - [ ] Admin功能可以访问

#### 短期监控（部署后1小时内）

- [ ] **用户反馈**
  - [ ] 没有收到用户报告的问题
  - [ ] Azure用户能够正常使用系统

- [ ] **数据库监控**
  ```sql
  -- 检查user_roles表的增长
  SELECT COUNT(*) FROM user_roles;
  
  -- 检查是否有重复记录
  SELECT user_id, role_id, COUNT(*)
  FROM user_roles
  GROUP BY user_id, role_id
  HAVING COUNT(*) > 1;
  ```

- [ ] **性能监控**
  - [ ] 登录响应时间正常（<2秒）
  - [ ] 数据库查询性能正常

#### 长期监控（部署后24小时内）

- [ ] **审计检查**
  ```sql
  -- 查看新增的Admin用户
  SELECT u.email, u.created_at
  FROM users u
  JOIN user_roles ur ON u.id = ur.user_id
  WHERE ur.role_id = 1 AND u.azure_id IS NOT NULL
  ORDER BY u.created_at DESC;
  ```

- [ ] **安全审计**
  - [ ] 所有Admin用户都是授权人员
  - [ ] 没有可疑的账号创建

---

## ⚠️ 回滚步骤（如果需要）

### 场景1: 代码回滚

```bash
# 1. 停止服务
docker-compose stop backend

# 2. 回滚代码
cd /home/evanzhang/EnterpriseProjects/PortalOps
git revert [commit-hash]
# 或者
git reset --hard [previous-commit]

# 3. 重启服务
docker-compose start backend

# 4. 验证服务
curl http://localhost:8000/health
```

### 场景2: 数据库回滚

```bash
# 恢复备份
psql -h [DB_HOST] -U [DB_USER] -d portalops < backup_azure_auto_admin_[timestamp].sql
```

### 场景3: 仅移除自动分配的角色

```sql
-- 创建备份表
CREATE TEMP TABLE backup_removed_roles AS
SELECT * FROM user_roles
WHERE role_id = 1 AND user_id IN (
    SELECT id FROM users WHERE azure_id IS NOT NULL
);

-- 删除角色分配
DELETE FROM user_roles
WHERE role_id = 1 AND user_id IN (
    SELECT id FROM users WHERE azure_id IS NOT NULL
);

-- 验证
SELECT COUNT(*) FROM backup_removed_roles;
```

**回滚检查点**:
- [ ] 服务恢复正常
- [ ] 数据一致性验证
- [ ] 功能测试通过

---

## 📝 部署后任务

### 立即执行

- [ ] **更新文档**
  - [ ] 记录部署时间和版本
  - [ ] 更新运维手册

- [ ] **通知相关人员**
  - [ ] 通知团队功能已上线
  - [ ] 发送部署报告

- [ ] **监控设置**
  - [ ] 配置日志告警（如果有错误）
  - [ ] 设置性能监控

### 后续跟进

- [ ] **一周后审查**
  - [ ] 检查是否有问题反馈
  - [ ] 审查Admin用户列表
  - [ ] 收集性能数据

- [ ] **一个月后评估**
  - [ ] 评估功能使用情况
  - [ ] 考虑是否需要优化
  - [ ] 规划下一步增强功能

---

## 🔍 故障排查

### 常见问题

#### 问题1: 新Azure用户没有获得Admin角色

**排查步骤**:
```bash
# 1. 检查日志
docker logs portalops-backend | grep -i "admin role\|error"

# 2. 检查数据库
psql -d portalops -c "SELECT * FROM roles WHERE name = 'Admin';"

# 3. 手动分配角色
psql -d portalops -c "
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, 1 FROM users u 
WHERE u.email = 'problem-user@example.com'
ON CONFLICT DO NOTHING;
"
```

#### 问题2: 服务启动失败

**排查步骤**:
```bash
# 1. 查看完整日志
docker logs portalops-backend

# 2. 检查代码语法
cd server
python -m py_compile app/core/deps.py

# 3. 检查数据库连接
psql -h [DB_HOST] -U [DB_USER] -d portalops -c "SELECT 1;"
```

#### 问题3: 性能下降

**排查步骤**:
```bash
# 1. 检查数据库性能
psql -d portalops -c "
SELECT * FROM pg_stat_statements 
WHERE query LIKE '%user_roles%' 
ORDER BY total_time DESC LIMIT 10;
"

# 2. 检查是否有慢查询
# 3. 考虑添加索引（已有索引，应该不需要）
```

---

## 📞 紧急联系

### 关键人员

- **开发负责人**: [Name] - [Email/Phone]
- **运维负责人**: [Name] - [Email/Phone]
- **数据库管理员**: [Name] - [Email/Phone]

### 升级流程

1. **Level 1**: 开发团队自行处理
2. **Level 2**: 升级到技术负责人
3. **Level 3**: 升级到CTO

### 紧急回滚决策

**触发条件**:
- [ ] 服务不可用超过5分钟
- [ ] 数据一致性问题
- [ ] 安全漏洞被发现
- [ ] 大量用户报告问题

**决策人**: 技术负责人或更高级别

---

## ✅ 最终确认

部署完成后，请确认以下所有项：

### 功能确认
- [ ] Azure登录功能正常
- [ ] 密码登录功能正常
- [ ] Admin权限自动分配
- [ ] 现有功能不受影响

### 性能确认
- [ ] 登录响应时间正常
- [ ] 数据库查询性能正常
- [ ] 服务器资源使用正常

### 安全确认
- [ ] Azure AD配置正确
- [ ] 只有授权用户能登录
- [ ] 日志正常记录

### 文档确认
- [ ] 部署文档已更新
- [ ] 运维手册已更新
- [ ] 用户手册已更新（如需要）

---

## 📊 部署报告模板

```
部署报告
========

项目: PortalOps - Azure Auto-Admin Feature
部署日期: [YYYY-MM-DD]
部署时间: [HH:MM]
部署人员: [Name]
环境: [Production/Staging]

部署内容:
- Azure用户自动Admin角色分配功能
- 相关文档和测试脚本

部署步骤执行情况:
✅ 数据库备份完成
✅ 代码部署完成
✅ 服务重启成功
✅ 功能验证通过
[ ] 迁移脚本执行（N/A - 无需执行）

测试结果:
✅ 新Azure用户登录测试 - 通过
✅ 角色自动分配测试 - 通过
✅ 权限验证测试 - 通过
✅ 性能测试 - 通过

遇到的问题:
[无/列出问题及解决方案]

回滚准备:
✅ 备份文件: backup_azure_auto_admin_[timestamp].sql
✅ 回滚方案已准备

监控情况:
- 服务状态: 正常
- 错误日志: 无
- 性能指标: 正常

下一步行动:
- 持续监控24小时
- 一周后进行审查
- 收集用户反馈

签名:
部署人员: ___________
审核人员: ___________
```

---

**清单版本**: v1.0  
**最后更新**: 2025-10-21  
**维护者**: PortalOps DevOps Team

---

**部署状态**: [ ] 待部署 / [ ] 进行中 / [ ] 已完成 / [ ] 已回滚

**部署人员签名**: ___________  
**审核人员签名**: ___________  
**日期**: ___________


