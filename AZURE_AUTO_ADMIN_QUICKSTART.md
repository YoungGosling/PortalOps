# Azure Auto-Admin 快速指南 Quick Start

## 功能说明 Feature Description

**中文**: 当用户通过Azure AD成功登录PortalOps系统时，系统会自动为该用户分配Admin（管理员）角色。这意味着所有通过企业Azure AD认证的用户都将拥有系统的完全管理权限。

**English**: When a user successfully logs in to the PortalOps system through Azure AD, the system automatically assigns them the Admin role. This means all users authenticated through the enterprise Azure AD will have full administrative privileges in the system.

---

## 快速测试 Quick Test

### 1️⃣ 通过Azure登录 Login via Azure

1. 访问登录页面 Visit: `http://localhost:3000/signin`
2. 点击 "Sign in with Microsoft" 按钮
3. 完成Azure AD认证流程
4. 成功登录后，你将自动获得Admin权限

### 2️⃣ 验证角色分配 Verify Role Assignment

运行测试脚本：

```bash
cd /home/evanzhang/EnterpriseProjects/PortalOps/server
./test_azure_auto_admin.sh
```

或者手动查询数据库：

```bash
# 查看所有Azure用户及其角色
psql -h localhost -U postgres -d portalops -c "
SELECT 
    u.email, 
    u.azure_id,
    r.name as role_name,
    u.created_at
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.azure_id IS NOT NULL
ORDER BY u.created_at DESC;
"
```

### 3️⃣ 检查日志 Check Logs

查看后端日志确认角色分配：

```bash
# 如果使用Docker
docker logs portalops-backend | grep "Admin role"

# 或查看日志文件
tail -f /path/to/server/logs/app.log | grep "Admin role"
```

你应该看到类似的日志：
```
INFO:app.core.deps:Assigned Admin role to Azure user 550e8400-e29b-41d4-a716-446655440099 (user@example.com)
```

---

## 工作原理 How It Works

### 流程图 Flow Chart

```
Azure登录请求
    ↓
验证Azure AD Token
    ↓
Token有效？
    ↓ Yes
检查用户是否存在？
    ↓ No                  ↓ Yes
创建新用户           更新azure_id（如果未设置）
    ↓                      ↓
    └─────────┬───────────┘
              ↓
    检查是否已有Admin角色？
              ↓ No
    分配Admin角色（role_id=1）
              ↓
    记录日志并完成登录
              ↓
    返回用户信息
```

### 代码位置 Code Location

主要实现在 `server/app/core/deps.py` 的 `get_current_user()` 函数中。

关键代码片段：
```python
# Auto-assign Admin role to Azure users who successfully logged in
if is_new_azure_user or user.azure_id:
    # Check if user already has Admin role
    existing_admin_role = db.query(UserRole).join(Role).filter(
        UserRole.user_id == user.id,
        Role.name == "Admin"
    ).first()

    if not existing_admin_role:
        # Get Admin role (id=1)
        admin_role = db.query(Role).filter(Role.name == "Admin").first()
        if admin_role:
            user_role = UserRole(user_id=user.id, role_id=admin_role.id)
            db.add(user_role)
            db.commit()
            logger.info(f"Assigned Admin role to Azure user {user.id} ({email})")
```

---

## 测试场景 Test Scenarios

### ✅ 场景1：新Azure用户首次登录
**步骤**:
1. 使用从未登录过的Azure账号
2. 完成Azure AD认证
3. 系统创建新用户

**预期结果**:
- 用户记录被创建（`azure_id`已设置）
- 自动分配Admin角色
- 日志显示: "Created Azure AD user" 和 "Assigned Admin role"

**验证命令**:
```bash
psql -h localhost -U postgres -d portalops -c "
SELECT u.email, u.azure_id, r.name 
FROM users u 
JOIN user_roles ur ON u.id = ur.user_id 
JOIN roles r ON ur.role_id = r.id 
WHERE u.email = 'your-new-user@example.com';
"
```

### ✅ 场景2：现有用户首次使用Azure登录
**步骤**:
1. 创建一个本地用户（通过密码登录）
2. 该用户通过Azure AD登录

**预期结果**:
- 用户的`azure_id`字段被更新
- 自动分配Admin角色（如果还没有）
- 日志显示: "Updated existing user with Azure ID" 和 "Assigned Admin role"

**验证命令**:
```bash
psql -h localhost -U postgres -d portalops -c "
SELECT u.email, u.azure_id, COUNT(ur.role_id) as role_count
FROM users u 
LEFT JOIN user_roles ur ON u.id = ur.user_id 
WHERE u.azure_id IS NOT NULL
GROUP BY u.id, u.email, u.azure_id;
"
```

### ✅ 场景3：Azure用户重复登录
**步骤**:
1. 已有Admin角色的Azure用户再次登录
2. 多次重复登录

**预期结果**:
- 不会创建重复的角色分配记录
- 登录正常完成
- 日志不显示 "Assigned Admin role"（因为已存在）

**验证命令**:
```bash
# 检查是否有重复的角色分配
psql -h localhost -U postgres -d portalops -c "
SELECT u.email, COUNT(*) as admin_role_count
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.azure_id IS NOT NULL AND r.name = 'Admin'
GROUP BY u.id, u.email
HAVING COUNT(*) > 1;
"
```

---

## 权限验证 Permission Verification

### 测试Admin权限

登录后，尝试访问需要Admin权限的功能：

1. **Service Management** - 创建/编辑/删除服务
   - POST `http://localhost:8000/api/v1/services`
   - PUT `http://localhost:8000/api/v1/services/{id}`
   - DELETE `http://localhost:8000/api/v1/services/{id}`

2. **Product Management** - 创建/编辑/删除产品
   - POST `http://localhost:8000/api/v1/products`
   - PUT `http://localhost:8000/api/v1/products/{id}`
   - DELETE `http://localhost:8000/api/v1/products/{id}`

3. **User Management** - 查看/管理用户
   - GET `http://localhost:8000/api/v1/users`
   - POST `http://localhost:8000/api/v1/users`
   - PUT `http://localhost:8000/api/v1/users/{id}`

### 测试脚本示例

```bash
# 获取access token（登录后从浏览器开发者工具中复制）
TOKEN="your-azure-ad-token"

# 测试创建服务（需要Admin权限）
curl -X POST http://localhost:8000/api/v1/services \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Service", "vendor": "Test Vendor"}'

# 应该返回200/201，而不是403 Forbidden
```

---

## 常见问题 FAQ

### Q1: 为什么我的Azure用户没有Admin角色？

**可能原因**:
1. Azure AD配置不正确
2. Token验证失败
3. 数据库中没有Admin角色记录
4. 用户在功能实施前就已经登录过

**解决方法**:
```bash
# 1. 检查Admin角色是否存在
psql -h localhost -U postgres -d portalops -c "SELECT * FROM roles WHERE name = 'Admin';"

# 2. 检查用户的azure_id是否已设置
psql -h localhost -U postgres -d portalops -c "SELECT email, azure_id FROM users WHERE email = 'your-email@example.com';"

# 3. 手动分配Admin角色（临时解决方案）
psql -h localhost -U postgres -d portalops -c "
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, 1 FROM users u WHERE u.email = 'your-email@example.com'
ON CONFLICT DO NOTHING;
"
```

### Q2: 如何为已存在的Azure用户补充Admin角色？

如果有用户在功能实施前就通过Azure登录过，可以运行：

```bash
psql -h localhost -U postgres -d portalops -c "
INSERT INTO user_roles (user_id, role_id)
SELECT DISTINCT u.id, 1
FROM users u
WHERE u.azure_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = u.id AND ur.role_id = 1
)
ON CONFLICT DO NOTHING;
"
```

### Q3: 如何禁用自动Admin分配？

修改 `server/app/core/deps.py`，注释掉或删除以下代码块：

```python
# Auto-assign Admin role to Azure users who successfully logged in
if is_new_azure_user or user.azure_id:
    # ... 整个代码块
```

或者实施条件检查：

```python
from app.core.config import settings

# 在.env中添加: AZURE_AUTO_ASSIGN_ADMIN=false
if getattr(settings, 'AZURE_AUTO_ASSIGN_ADMIN', True):
    # ... 角色分配逻辑
```

### Q4: 安全性如何保证？

**安全措施**:
1. ✅ 只有通过Azure AD认证的用户才会被分配角色
2. ✅ 使用企业级Azure AD租户认证
3. ✅ Token验证包括签名、过期时间、issuer检查
4. ✅ 所有角色分配都有日志记录
5. ✅ 防止重复角色分配

**建议**:
- 定期审查Azure AD用户列表
- 监控日志中的角色分配事件
- 确保Azure AD租户只包含授权人员
- 考虑添加email域名白名单

---

## 数据库查询速查表 Database Quick Reference

```sql
-- 查看所有Azure用户
SELECT email, name, azure_id, created_at 
FROM users 
WHERE azure_id IS NOT NULL;

-- 查看所有用户及其角色
SELECT u.email, r.name as role_name
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
ORDER BY u.email;

-- 查看没有角色的Azure用户
SELECT u.email, u.azure_id
FROM users u
WHERE u.azure_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id
);

-- 统计各角色的用户数
SELECT r.name, COUNT(ur.user_id) as user_count
FROM roles r
LEFT JOIN user_roles ur ON r.id = ur.role_id
GROUP BY r.id, r.name
ORDER BY user_count DESC;

-- 查看最近登录的Azure用户
SELECT email, azure_id, created_at, updated_at
FROM users
WHERE azure_id IS NOT NULL
ORDER BY updated_at DESC
LIMIT 10;
```

---

## 相关文档 Related Documentation

- 📄 **详细实施文档**: `server/AZURE_AUTO_ADMIN_IMPLEMENTATION.md`
- 📄 **Azure登录设置**: `nextjs/AZURE_LOGIN_SETUP.md`
- 📄 **数据库Schema**: `database/data/portalops_schema.sql`
- 📄 **测试脚本**: `server/test_azure_auto_admin.sh`

---

## 支持与反馈 Support & Feedback

如有问题或建议，请：
1. 查看服务器日志
2. 运行测试脚本诊断
3. 检查Azure AD配置
4. 联系开发团队

**版本**: v2.0+  
**更新日期**: 2025-10-21  
**维护者**: PortalOps Development Team


