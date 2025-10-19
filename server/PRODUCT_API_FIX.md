# Product API Fix - Service Name Support

**Date:** 2025-10-18  
**Issue:** Products显示 "No Service" - API返回的产品数据缺少 `service_name` 字段  
**Status:** ✅ 已修复

## 问题描述

前端Product Inventory页面显示所有产品时，服务名称都显示为 "No Service"。检查API返回的数据发现只有 `service_id` 字段，但没有 `service_name` 字段。

### 原始API返回示例：
```json
[
    {
        "name": "Gmail",
        "url": null,
        "description": "Email service",
        "id": "770e8400-e29b-41d4-a716-446655440001",
        "service_id": "660e8400-e29b-41d4-a716-446655440001",
        "created_at": "2025-10-16T14:14:03.829933+08:00",
        "updated_at": "2025-10-16T14:14:03.829933+08:00"
    }
]
```

前端期望的数据格式需要包含 `service_name` 字段。

## 修复方案

### 1. 修改 Product Schema

**文件:** `app/schemas/service.py`

添加 `service_name` 字段到 `Product` schema：

```python
class Product(ProductBase):
    id: uuid.UUID
    service_id: uuid.UUID
    service_name: Optional[str] = None  # 新增字段
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
```

### 2. 修改 CRUD 层

**文件:** `app/crud/product.py`

使用 SQLAlchemy 的 `joinedload` 预加载关联的服务数据：

```python
from sqlalchemy.orm import Session, joinedload  # 导入 joinedload

class CRUDProduct(CRUDBase[Product, ProductCreate, ProductUpdate]):
    def get_products_for_user(
        self, db: Session, *, user_id: uuid.UUID, is_admin: bool = False
    ) -> List[Product]:
        """Get products filtered by user permissions."""
        if is_admin:
            return db.query(Product).options(joinedload(Product.service)).all()
        else:
            return db.query(Product).options(
                joinedload(Product.service)
            ).join(
                PermissionAssignment,
                Product.id == PermissionAssignment.product_id
            ).filter(
                PermissionAssignment.user_id == user_id
            ).all()

    def get_by_service(
        self, db: Session, *, service_id: uuid.UUID, user_id: uuid.UUID, is_admin: bool = False
    ) -> List[Product]:
        """Get products by service, filtered by user permissions."""
        if is_admin:
            return db.query(Product).options(
                joinedload(Product.service)
            ).filter(Product.service_id == service_id).all()
        else:
            return db.query(Product).options(
                joinedload(Product.service)
            ).join(
                PermissionAssignment,
                Product.id == PermissionAssignment.product_id
            ).filter(
                Product.service_id == service_id,
                PermissionAssignment.user_id == user_id
            ).all()
```

### 3. 修改 API Endpoint

**文件:** `app/api/api_v1/endpoints/products.py`

#### 3.1 GET /api/products

修改 `get_products` 函数，手动构建包含 `service_name` 的响应：

```python
@router.get("", response_model=List[Product])
def get_products(
    serviceId: Optional[uuid.UUID] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # ... 查询逻辑 ...
    
    # Add service_name to each product
    result = []
    for product in products:
        product_dict = {
            "id": product.id,
            "name": product.name,
            "url": product.url,
            "description": product.description,
            "service_id": product.service_id,
            "service_name": product.service.name if product.service else None,
            "created_at": product.created_at,
            "updated_at": product.updated_at
        }
        result.append(product_dict)
    
    return result
```

#### 3.2 PUT /api/products/{product_id} (新增)

添加产品更新endpoint，同样返回包含 `service_name` 的数据：

```python
@router.put("/{product_id}", response_model=Product)
def update_product(
    product_id: uuid.UUID,
    product_in: ProductCreateWithUrl,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a product. Only Admin can update products.
    """
    # ... 权限检查和更新逻辑 ...
    
    # Return product with service_name
    return {
        "id": updated_product.id,
        "name": updated_product.name,
        "url": updated_product.url,
        "description": updated_product.description,
        "service_id": updated_product.service_id,
        "service_name": updated_product.service.name if updated_product.service else None,
        "created_at": updated_product.created_at,
        "updated_at": updated_product.updated_at
    }
```

## 修改的文件列表

1. ✅ `app/schemas/service.py` - 添加 `service_name` 字段到 Product schema
2. ✅ `app/crud/product.py` - 使用 `joinedload` 预加载服务关系
3. ✅ `app/api/api_v1/endpoints/products.py` - 修改 GET endpoint 和添加 PUT endpoint

## 修复后的API响应

### GET /api/products

```json
[
    {
        "id": "770e8400-e29b-41d4-a716-446655440001",
        "name": "Gmail",
        "url": null,
        "description": "Email service",
        "service_id": "660e8400-e29b-41d4-a716-446655440001",
        "service_name": "Google Workspace",
        "created_at": "2025-10-16T14:14:03.829933+08:00",
        "updated_at": "2025-10-16T14:14:03.829933+08:00"
    },
    {
        "id": "770e8400-e29b-41d4-a716-446655440002",
        "name": "Google Drive",
        "url": null,
        "description": "Cloud storage service",
        "service_id": "660e8400-e29b-41d4-a716-446655440001",
        "service_name": "Google Workspace",
        "created_at": "2025-10-16T14:14:03.829933+08:00",
        "updated_at": "2025-10-16T14:14:03.829933+08:00"
    }
]
```

### PUT /api/products/{product_id}

```json
{
    "id": "770e8400-e29b-41d4-a716-446655440001",
    "name": "Gmail (Updated)",
    "url": "https://gmail.com",
    "description": "Email service",
    "service_id": "660e8400-e29b-41d4-a716-446655440001",
    "service_name": "Google Workspace",
    "created_at": "2025-10-16T14:14:03.829933+08:00",
    "updated_at": "2025-10-18T10:30:00.000000+08:00"
}
```

## 性能优化

使用 `joinedload` 的优点：

1. **减少数据库查询次数** - 使用 JOIN 一次性加载产品和服务数据，避免 N+1 查询问题
2. **提高响应速度** - 单次 SQL 查询比多次查询更快
3. **减少数据库负载** - 批量加载而不是逐个查询

## 测试验证

### 启动后端服务器

```bash
cd /home/evanzhang/EnterpriseProjects/PortalOps/server
python -m app.main
```

### 测试GET请求

```bash
curl -X GET "http://localhost:8000/api/products" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 测试PUT请求

```bash
curl -X PUT "http://localhost:8000/api/products/770e8400-e29b-41d4-a716-446655440001" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Gmail Updated",
    "serviceId": "660e8400-e29b-41d4-a716-446655440001"
  }'
```

### 前端验证

1. 重启后端服务器（如果已运行）
2. 刷新前端Product Inventory页面
3. 验证每个产品现在显示正确的服务名称，而不是 "No Service"

## 兼容性

- ✅ 向后兼容 - `service_name` 字段是可选的（`Optional[str]`）
- ✅ 不影响现有的API调用
- ✅ 不需要数据库迁移 - 只是查询层面的修改

## 后续工作

建议对其他API endpoint进行类似的优化：

1. ✅ Payment Register API - 已经返回 `service_name` 和 `product_name`
2. 考虑为其他需要关联数据的API添加类似的优化

---

**修复完成时间：** 2025-10-18  
**验证状态：** ✅ 代码语法检查通过  
**部署状态：** 待测试

