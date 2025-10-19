# PortalOps - Quick Start Guide

## 🚀 快速开始

### 第一步：安装依赖

```bash
cd /home/evanzhang/EnterpriseProjects/PortalOps/nextjs

# 使用 pnpm (推荐)
pnpm install

# 或使用 npm
npm install
```

### 第二步：配置环境变量

创建 `.env.local` 文件：

```bash
cp .env.example .env.local
```

编辑 `.env.local` 并配置必要的环境变量：

```env
# API 配置 (必需)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# NextAuth 配置 (如果使用 Azure AD)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Azure AD 配置 (可选)
AZURE_AD_CLIENT_ID=your-azure-client-id
AZURE_AD_CLIENT_SECRET=your-azure-client-secret
AZURE_AD_TENANT_ID=your-azure-tenant-id
```

### 第三步：启动开发服务器

```bash
pnpm dev
# 或
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 📋 默认登录信息

根据后端配置，使用以下任一账号登录：

### Admin 账户
- **Email**: `admin@portalops.com`
- **Password**: `password`

### ServiceAdmin 账户
- **Email**: `service.admin@portalops.com`
- **Password**: `password`

### ProductAdmin 账户  
- **Email**: `product.admin@portalops.com`
- **Password**: `password`

> ⚠️ **生产环境提醒**：这些是默认测试密码，生产环境中务必修改！

## 🎯 功能导览

登录后您可以访问以下功能：

### 普通用户 & ServiceAdmin
- ✅ **Dashboard** - 总览页面
- ✅ **Service Inventory** - 服务清单（卡片视图）
- ✅ **Product Inventory** - 产品清单（表格视图）
- ✅ **Payment Register** - 支付记录（内联编辑）

### 仅 Admin 用户
- ✅ **Inbox** - 工作流任务（Onboarding/Offboarding）
- ✅ **User Directory** - 用户管理
- ✅ **Admin Dashboard** - 系统仪表板
- ✅ **Security & Compliance** - 安全与合规
- ✅ **User Administration** - 用户权限管理
- ✅ **Master Files** - 主文件仓库
- ✅ **System Configuration** - 系统配置

## 🛠️ 开发命令

```bash
# 开发模式
pnpm dev

# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start

# 代码检查
pnpm lint
```

## 📦 生产部署

### 构建应用

```bash
pnpm build
```

### 部署到 Vercel (推荐)

1. 将代码推送到 Git 仓库
2. 在 [Vercel](https://vercel.com) 导入项目
3. 配置环境变量
4. 部署！

### 部署到其他平台

生成的 `.next` 文件夹可以部署到任何支持 Node.js 的平台：

```bash
pnpm build
pnpm start
```

## 🔧 故障排除

### 问题：无法连接到 API

**解决方案**：
1. 检查 `.env.local` 中的 `NEXT_PUBLIC_API_BASE_URL` 是否正确
2. 确保后端服务器正在运行
3. 检查浏览器控制台的网络请求

### 问题：登录后立即退出

**解决方案**：
1. 检查 localStorage 中是否存储了 `access_token`
2. 验证 token 是否有效
3. 检查后端 `/api/auth/me` 接口是否正常

### 问题：页面无法加载

**解决方案**：
1. 清除浏览器缓存和 localStorage
2. 删除 `.next` 文件夹重新构建
3. 检查是否有 TypeScript 或 ESLint 错误

### 问题：样式未生效

**解决方案**：
1. 确保 Tailwind CSS 配置正确
2. 重启开发服务器
3. 检查 `globals.css` 是否被正确导入

## 📚 更多资源

- [完整 README](./README.md)
- [PRD v2.0](../doc/design/PortalOps.md)
- [API Specification v2.0](../doc/design/server/v2/API_Specification_v2.md)
- [执行进度](../process.md)

## 💡 小贴士

1. **使用热重载**: 修改代码后页面会自动刷新
2. **检查 TypeScript 错误**: IDE 会显示类型错误
3. **使用浏览器开发工具**: React DevTools 和 Network 面板很有用
4. **查看 Console**: 错误信息会显示在浏览器控制台

## 🎨 UI 组件开发

所有 UI 组件基于 shadcn/ui，您可以：

1. 查看 `components/ui/` 下的现有组件
2. 使用 [shadcn/ui 文档](https://ui.shadcn.com) 了解更多组件
3. 自定义组件样式使用 Tailwind CSS

## 🔐 认证流程

1. 用户在 `/signin` 输入凭据
2. 调用 `POST /api/auth/login` 获取 token
3. Token 存储在 localStorage
4. 所有 API 请求携带 `Authorization: Bearer <token>` 头
5. Middleware 验证 token 并保护路由

## 📱 响应式设计

应用已针对以下断点优化：
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

主要响应式特性：
- 侧边栏可折叠
- 网格布局自适应
- 移动端导航优化

---

## 需要帮助？

如遇问题，请：
1. 查看本文档的故障排除部分
2. 检查浏览器控制台错误
3. 查看完整 README 文档
4. 联系开发团队

**祝您开发愉快！** 🎉

