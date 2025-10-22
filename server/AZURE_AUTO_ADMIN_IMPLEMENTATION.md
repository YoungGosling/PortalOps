# Azure Auto-Admin Implementation

## 概述 Overview

当用户通过Azure AD成功登录PortalOps系统时，系统会自动为该用户分配Admin角色。这确保了所有通过企业Azure AD认证的用户都拥有管理员权限。

When a user successfully logs in through Azure AD to the PortalOps system, the system automatically assigns the Admin role to that user. This ensures that all users authenticated through the enterprise Azure AD have administrator privileges.

## 实施细节 Implementation Details

### 修改的文件 Modified Files

1. **`server/app/core/deps.py`** - `get_current_user()` 函数

### 核心逻辑 Core Logic

在`get_current_user()`函数的Azure AD token处理部分添加了自动角色分配逻辑：

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
        else:
            logger.warning(f"Admin role not found in database")
```

### 触发条件 Trigger Conditions

Admin角色会在以下情况下自动分配：

1. **新用户创建** - 当用户首次通过Azure AD登录时
2. **Azure ID更新** - 当现有用户首次使用Azure AD登录（之前可能是通过密码登录）
3. **每次Azure登录** - 系统会检查用户是否已有Admin角色，如果没有则自动分配

### 安全性考虑 Security Considerations

- ✅ **防重复分配**: 系统会先检查用户是否已有Admin角色，避免重复记录
- ✅ **仅限Azure用户**: 只有通过Azure AD认证的用户才会被分配Admin角色
- ✅ **日志记录**: 每次角色分配都会记录在日志中，便于审计
- ✅ **事务安全**: 使用数据库事务确保数据一致性

## 工作流程 Workflow

### 情景1：新Azure用户首次登录
```
1. 用户通过Azure AD登录
2. Azure token验证成功
3. 系统检测到用户不存在
4. 创建新用户记录（azure_id已设置）
5. 查询Admin角色
6. 创建user_roles记录，分配Admin角色
7. 返回用户对象
```

### 情景2：已存在用户首次使用Azure登录
```
1. 用户通过Azure AD登录
2. Azure token验证成功
3. 系统找到已存在的用户（通过email）
4. 更新用户的azure_id字段
5. 查询Admin角色
6. 创建user_roles记录，分配Admin角色
7. 返回用户对象
```

### 情景3：Azure用户再次登录（已有Admin角色）
```
1. 用户通过Azure AD登录
2. Azure token验证成功
3. 系统找到已存在的用户
4. 检测到用户已有Admin角色
5. 跳过角色分配步骤
6. 直接返回用户对象
```

## 数据库结构 Database Schema

### 相关表 Related Tables

```sql
-- users表
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    azure_id VARCHAR(255) UNIQUE,  -- Azure AD Object ID
    password_hash VARCHAR(255),
    department VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- roles表
CREATE TABLE roles (
    id INTEGER PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);
-- Admin角色的ID为1

-- user_roles表（多对多关系）
CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id),
    role_id INTEGER REFERENCES roles(id),
    PRIMARY KEY (user_id, role_id)
);
```

## 测试建议 Testing Recommendations

### 测试场景 Test Scenarios

1. **新用户Azure登录测试**
   - 使用从未登录过的Azure账号
   - 验证用户被创建且分配了Admin角色
   - 检查日志输出

2. **现有用户Azure登录测试**
   - 使用已存在但没有azure_id的账号
   - 通过Azure AD登录
   - 验证azure_id被更新且分配了Admin角色

3. **重复登录测试**
   - Azure用户多次登录
   - 验证不会创建重复的role分配记录

4. **权限验证测试**
   - 登录后访问需要Admin权限的API端点
   - 验证请求成功且不返回403错误

### 测试命令 Test Commands

```bash
# 查看用户的角色分配
psql -h localhost -U postgres -d portalops -c "
SELECT u.email, u.azure_id, r.name as role_name 
FROM users u 
LEFT JOIN user_roles ur ON u.id = ur.user_id 
LEFT JOIN roles r ON ur.role_id = r.id 
WHERE u.azure_id IS NOT NULL;
"

# 查看最近创建的Azure用户
psql -h localhost -U postgres -d portalops -c "
SELECT id, name, email, azure_id, created_at 
FROM users 
WHERE azure_id IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 5;
"
```

## 日志输出 Log Output

成功分配Admin角色时的日志示例：

```
INFO:app.core.deps:Auto-creating Azure AD user: user@example.com
INFO:app.core.deps:Created Azure AD user with ID: 550e8400-e29b-41d4-a716-446655440099
INFO:app.core.deps:Assigned Admin role to Azure user 550e8400-e29b-41d4-a716-446655440099 (user@example.com)
```

更新现有用户的日志示例：

```
INFO:app.core.deps:Updated existing user 550e8400-e29b-41d4-a716-446655440001 with Azure ID: 23255c23-de58-4ec4-a870-7fb9647b12e5
INFO:app.core.deps:Assigned Admin role to Azure user 550e8400-e29b-41d4-a716-446655440001 (admin@example.com)
```

## 回滚方案 Rollback Plan

如果需要撤销这个功能，可以：

1. **代码回滚**: 恢复`server/app/core/deps.py`到修改前的版本
2. **数据清理** (可选): 如果需要移除已分配的Admin角色：

```sql
-- 移除所有Azure用户的Admin角色（谨慎操作！）
DELETE FROM user_roles 
WHERE role_id = 1  -- Admin role
AND user_id IN (
    SELECT id FROM users WHERE azure_id IS NOT NULL
);
```

## 配置选项 Configuration Options

当前实现为自动启用。如果未来需要可配置选项，可以在`.env`文件中添加：

```env
# 是否自动为Azure用户分配Admin角色
AZURE_AUTO_ASSIGN_ADMIN=true
```

然后在代码中检查此配置：

```python
from app.core.config import settings

if settings.AZURE_AUTO_ASSIGN_ADMIN:
    # 执行角色分配逻辑
    ...
```

## 相关文件 Related Files

- `server/app/core/deps.py` - 主要实现
- `server/app/models/user.py` - User, Role, UserRole模型
- `server/app/core/security.py` - Azure AD token验证
- `database/data/portalops_schema.sql` - 数据库schema
- `database/data/portalops_data.sql` - 初始数据（包含Admin角色）

## API影响 API Impact

此更改不影响任何API端点的签名或行为，只是在后台自动处理角色分配。用户仍然通过相同的方式进行Azure AD认证。

## 版本信息 Version Information

- **实施日期**: 2025-10-21
- **版本**: v2.0+
- **兼容性**: 向后兼容，不影响现有功能

## 注意事项 Notes

⚠️ **重要**: 此功能意味着任何能够通过企业Azure AD认证的用户都将获得系统的完全管理员权限。请确保：

1. Azure AD租户配置正确
2. 只有授权人员能访问Azure AD
3. 定期审查拥有Admin角色的用户列表
4. 考虑实施额外的审计日志记录

## 后续优化建议 Future Improvements

1. **角色白名单**: 添加email白名单，只为特定域名的用户分配Admin角色
2. **可配置角色**: 允许配置为Azure用户分配不同的默认角色
3. **审计日志增强**: 在audit_logs表中记录自动角色分配事件
4. **通知机制**: 当新的Admin用户被创建时发送通知

---

**文档维护**: 如有任何问题或需要更新，请联系开发团队。


