# Service Inventory 错误修复

## 问题描述

访问 Service Inventory 页面时出现运行时错误：

```
TypeError: Cannot read properties of undefined (reading 'length')
at ServiceInventory.tsx:192:67
```

## 根本原因

在 `ServiceInventory.tsx` 组件中，代码假设 `service.products` 总是存在，但根据类型定义（`types/index.ts`），`products` 是一个可选字段（`products?: ServiceProduct[]`）。

当 API 返回的 service 对象没有包含 `products` 字段时，尝试访问 `service.products.length` 会导致运行时错误。

## 修复内容

修改了 3 处代码，添加了可选链操作符（`?.`）和默认值：

### 1. 第 65 行 - handleEditService 函数
**修改前：**
```typescript
selectedProductIds: service.products.map(p => p.id),
```

**修改后：**
```typescript
selectedProductIds: service.products?.map(p => p.id) || [],
```

### 2. 第 192 行 - 产品数量显示
**修改前：**
```typescript
<span>{service.productCount || service.products.length} Products</span>
```

**修改后：**
```typescript
<span>{service.productCount || service.products?.length || 0} Products</span>
```

### 3. 第 236 行 - 编辑面板中的产品列表
**修改前：**
```typescript
{editingService?.products.map(product => (
```

**修改后：**
```typescript
{editingService?.products?.map(product => (
```

## 技术细节

### 可选链操作符 (`?.`)
- 如果左侧的值是 `null` 或 `undefined`，表达式会短路并返回 `undefined`
- 这样可以安全地访问可能不存在的属性

### 空值合并操作符 (`||`)
- 当左侧的值是假值（`false`、`0`、`''`、`null`、`undefined`）时，返回右侧的值
- 在这里用于提供默认值（空数组 `[]` 或 `0`）

## 测试结果

✅ 构建成功，无错误
✅ TypeScript 类型检查通过
✅ Service Inventory 页面可以正常访问
✅ 不影响其他功能

## 预防措施

### 推荐做法
1. 在访问嵌套属性前，始终检查父对象是否存在
2. 使用 TypeScript 的可选链和空值合并操作符
3. 为可能不存在的数据提供合理的默认值
4. 保持类型定义与实际 API 响应一致

### 类型定义参考
```typescript
export interface WebService {
  id: string
  name: string
  vendor?: string
  products?: ServiceProduct[] // 可选字段
  productCount: number // 总是存在的计数字段
  isActive: boolean
  createdAt: string
  updatedAt: string
}
```

## 相关文件

- `components/services/ServiceInventory.tsx` - 已修复
- `types/index.ts` - 类型定义（无需修改）
- `lib/api.ts` - API 调用（无需修改）

