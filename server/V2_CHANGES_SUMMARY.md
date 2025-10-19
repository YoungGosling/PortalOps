# PortalOps Backend v2.0 - Quick Reference

## 🎯 核心变更

### 1. 数据模型变更
```python
# Products 表
- service_id: NOT NULL → NULLABLE
- ON DELETE CASCADE → ON DELETE SET NULL

# Payment Info 表
+ bill_attachment_path VARCHAR(500)
```

### 2. 角色简化
```
v1.0: Admin, ServiceAdministrator, ProductAdministrator
v2.0: Admin, ServiceAdmin (只保留两个角色)
```

### 3. 权限调整
```
Services CRUD:  ServiceAdmin+ → Admin only
Products CRUD:  ServiceAdmin+ → Admin only  
Users List:     Any Admin    → Admin only
Inbox:          Any User     → Admin only
```

## 📋 API 变更清单

### 新增 Endpoints
```
POST   /api/webhooks/hr/offboarding
POST   /api/inbox/tasks/{id}/complete
GET    /api/master-files/attachments
GET    /api/master-files/attachments/{fileId}
```

### 修改 Endpoints
```
GET    /api/auth/me                    → 简化响应 (assignedServiceIds)
POST   /api/services                   → 支持 productIds
PUT    /api/services/{id}              → 支持关联/解除关联产品
DELETE /api/services/{id}              → 非破坏性删除
GET    /api/products?serviceId=...     → 新增过滤参数
PUT    /api/payment-register/{id}      → multipart/form-data
GET    /api/users?productId=...        → 新增过滤参数
PUT    /api/users/{id}                 → 统一更新接口
```

### 废弃 Endpoints
```
PUT /api/users/{id}/permissions → 合并到 PUT /api/users/{id}
```

## 🔄 主要行为变更

### Service 删除
**v1.0:**
```
删除 Service → 级联删除 Products
```

**v2.0:**
```
删除 Service → Products 保留，service_id 设为 NULL（变为"未关联"状态）
```

### Product 创建
**v1.0:**
```python
{
  "name": "Product Name",
  "service_id": "required-uuid"  # 必须
}
```

**v2.0:**
```python
{
  "name": "Product Name",
  "serviceId": "optional-uuid"  # 可选，可创建未关联产品
}
```

### Payment 更新
**v1.0:**
```http
Content-Type: application/json
{
  "amount": "100.00",
  "cardholder_name": "John Doe"
}
```

**v2.0:**
```http
Content-Type: multipart/form-data

amount: 100.00
cardholder_name: John Doe
bill_attachment: <file>
```

## 📝 数据库迁移

### 快速迁移
```bash
# 1. 备份数据库
pg_dump portalops > backup.sql

# 2. 执行迁移
psql -d portalops -f database/manual_migration_prd_v2.sql

# 3. 创建上传目录
mkdir -p uploads/bill_attachments
chmod 755 uploads/bill_attachments

# 4. 安装依赖
pip install aiofiles
```

### 关键 SQL
```sql
-- 产品可以无服务
ALTER TABLE products ALTER COLUMN service_id DROP NOT NULL;
ALTER TABLE products ADD CONSTRAINT products_service_id_fkey 
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL;

-- 账单附件
ALTER TABLE payment_info ADD COLUMN bill_attachment_path VARCHAR(500);

-- 角色更名 (可选)
UPDATE roles SET name = 'ServiceAdmin' WHERE name = 'ServiceAdministrator';
```

## 🔧 代码变更统计

### 新增文件 (3)
- `endpoints/master_files.py` - 主文件管理
- `MIGRATION_GUIDE_V2.md` - 迁移指南
- `database/manual_migration_prd_v2.sql` - 迁移脚本

### 修改文件 (12)
**Models (2):**
- `models/service.py` - Product nullable service_id
- `models/payment.py` - 添加 bill_attachment_path

**Schemas (3):**
- `schemas/service.py` - 产品关联支持
- `schemas/user.py` - UserUpdateV2
- `schemas/payment.py` - billAttachmentPath

**CRUD (3):**
- `crud/service.py` - 关联/解除关联逻辑
- `crud/user.py` - 产品过滤
- `crud/payment.py` - 附件路径

**Endpoints (4):**
- `endpoints/services.py` - Admin 权限，产品关联
- `endpoints/products.py` - 过滤，Admin 权限
- `endpoints/payment_register.py` - 文件上传
- `endpoints/users.py` - 统一更新，产品过滤
- `endpoints/workflows.py` - 离职，任务完成
- `endpoints/auth.py` - 简化响应

## 🚀 测试要点

### 必测功能
- [ ] 创建带产品的服务
- [ ] 关联/解除关联产品
- [ ] 删除服务（产品保留）
- [ ] 上传账单附件
- [ ] 查看主文件列表
- [ ] 下载附件
- [ ] 按服务过滤产品
- [ ] 按产品过滤用户
- [ ] 离职 webhook
- [ ] 任务完成流程

### 权限测试
- [ ] Admin 可访问所有新功能
- [ ] ServiceAdmin 权限正确限制
- [ ] 非 Admin 无法访问 Services CRUD
- [ ] 非 Admin 无法访问 Products CRUD

## ⚡ 快速开始

```bash
# 1. 更新代码
git pull origin v2.0

# 2. 迁移数据库
psql -d portalops -f database/manual_migration_prd_v2.sql

# 3. 安装依赖
cd server
pip install aiofiles

# 4. 创建目录
mkdir -p uploads/bill_attachments

# 5. 启动服务
./start.sh

# 6. 查看 API 文档
# http://localhost:8000/docs
```

## 📖 详细文档

- **完整迁移指南**: `MIGRATION_GUIDE_V2.md`
- **变更日志**: `CHANGELOG_V2.md`
- **产品需求**: `doc/design/PortalOps.md`
- **API 规范**: `doc/design/server/v2/API_Specification_v2.md`

## 🆘 回滚方案

```bash
# 恢复数据库
psql -d portalops < backup.sql

# 回退代码
git checkout v1.0
```

## 💡 重要提示

1. **Breaking Changes**: 此版本包含破坏性更改，需要前端配合修改
2. **权限变更**: 多个接口权限收紧为 Admin only
3. **文件上传**: 确保服务器有足够存储空间和写入权限
4. **角色迁移**: 如果数据库中有 ServiceAdministrator 角色，建议迁移为 ServiceAdmin
5. **测试充分**: 生产环境部署前请在测试环境充分验证

## 📞 支持

遇到问题？
1. 检查 `MIGRATION_GUIDE_V2.md`
2. 查看 API 文档 `/docs`
3. 检查日志文件
4. 验证数据库迁移是否成功

