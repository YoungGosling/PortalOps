# PortalOps Next.js - 安装指南

## 📋 系统要求

### 必需软件
- **Node.js**: 18.17 或更高版本
- **包管理器**: pnpm (推荐) 或 npm
- **操作系统**: Windows, macOS, 或 Linux

### 推荐工具
- **代码编辑器**: VS Code (推荐安装扩展: ESLint, Prettier, Tailwind CSS IntelliSense)
- **浏览器**: Chrome 或 Firefox (最新版本)
- **终端**: 任何现代终端

---

## 🚀 安装步骤

### 步骤 1: 克隆或访问项目

```bash
cd /home/evanzhang/EnterpriseProjects/PortalOps/nextjs
```

### 步骤 2: 安装依赖

#### 使用 pnpm (推荐)

```bash
# 如果还没有安装 pnpm
npm install -g pnpm

# 安装项目依赖
pnpm install
```

#### 使用 npm

```bash
npm install
```

预计安装时间: 2-5 分钟（取决于网络速度）

### 步骤 3: 配置环境变量

复制环境变量示例文件：

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件：

```env
# API 配置 (必需)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# NextAuth 配置 (可选，用于 Azure AD 集成)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-change-this-in-production

# Azure AD 配置 (可选)
# AZURE_AD_CLIENT_ID=your-azure-client-id
# AZURE_AD_CLIENT_SECRET=your-azure-client-secret
# AZURE_AD_TENANT_ID=your-azure-tenant-id
```

**重要提示**: 
- `NEXT_PUBLIC_API_BASE_URL` 必须指向后端 API 服务器
- 生产环境中务必修改 `NEXTAUTH_SECRET`

### 步骤 4: 启动开发服务器

```bash
pnpm dev
# 或
npm run dev
```

成功启动后，您将看到：

```
▲ Next.js 15.0.0
- Local:        http://localhost:3000
- Network:      http://192.168.x.x:3000

✓ Ready in 2.3s
```

### 步骤 5: 访问应用

在浏览器中打开 [http://localhost:3000](http://localhost:3000)

---

## ✅ 验证安装

### 1. 检查登录页面

访问 `http://localhost:3000/signin`，您应该看到：
- PortalOps logo
- Sign In / Sign Up 标签页
- 登录表单

### 2. 检查主题切换

- 尝试切换明暗主题
- 主题设置应该被保存

### 3. 测试登录 (需要后端运行)

使用测试账户登录：
```
Email: admin@portalops.com
Password: (根据后端配置)
```

### 4. 验证功能页面

登录后，检查以下页面是否可访问：
- ✅ Dashboard (`/`)
- ✅ Service Inventory (`/services`)
- ✅ Product Inventory (`/products`)
- ✅ Payment Register (`/payments`)
- ✅ User Directory (`/users`) - 仅 Admin
- ✅ Inbox (`/inbox`) - 仅 Admin

---

## 🔧 常见问题

### Q1: 安装依赖时出现错误

**错误**: `ERESOLVE unable to resolve dependency tree`

**解决方案**:
```bash
# 使用 legacy peer deps
npm install --legacy-peer-deps

# 或使用 pnpm (自动处理)
pnpm install
```

### Q2: 端口 3000 已被占用

**错误**: `Error: listen EADDRINUSE: address already in use :::3000`

**解决方案**:
```bash
# 方案 1: 使用其他端口
PORT=3001 pnpm dev

# 方案 2: 杀死占用端口的进程
# Linux/Mac
lsof -ti:3000 | xargs kill

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Q3: 无法连接到后端 API

**症状**: 登录失败，显示网络错误

**解决方案**:
1. 确认后端服务器正在运行
2. 检查 `.env.local` 中的 `NEXT_PUBLIC_API_BASE_URL`
3. 检查 CORS 配置
4. 查看浏览器控制台的网络请求

### Q4: TypeScript 错误

**错误**: 类型错误或找不到模块

**解决方案**:
```bash
# 删除 .next 文件夹
rm -rf .next

# 重新安装依赖
pnpm install

# 重启开发服务器
pnpm dev
```

### Q5: 样式未生效

**症状**: 页面显示但没有样式

**解决方案**:
1. 确认 `globals.css` 在 `app/layout.tsx` 中被导入
2. 检查 `tailwind.config.ts` 配置
3. 清除浏览器缓存
4. 重启开发服务器

---

## 📦 生产构建

### 构建应用

```bash
pnpm build
```

这将创建优化的生产版本在 `.next` 文件夹中。

### 本地测试生产构建

```bash
pnpm build
pnpm start
```

访问 `http://localhost:3000` 查看生产版本。

### 构建优化

生产构建会自动：
- ✅ 压缩 JavaScript 和 CSS
- ✅ 优化图片
- ✅ 代码分割
- ✅ 静态页面生成 (SSG)
- ✅ 移除开发代码

---

## 🌐 部署

### Vercel 部署 (推荐)

1. 推送代码到 Git 仓库 (GitHub, GitLab, Bitbucket)

2. 访问 [Vercel](https://vercel.com) 并导入项目

3. 配置环境变量:
   ```
   NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com
   NEXTAUTH_SECRET=your-production-secret
   ```

4. 点击 Deploy

5. 完成！应用将在几分钟内上线

### 其他平台

#### Netlify
```bash
pnpm build
# 上传 .next 文件夹
```

#### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

#### 传统服务器
```bash
# 在服务器上
git clone <your-repo>
cd nextjs
pnpm install
pnpm build
pm2 start npm --name "portalops" -- start
```

---

## 🔍 项目结构验证

运行以下命令验证项目结构完整性：

```bash
# 检查所有页面组件
find app -name "page.tsx"

# 检查 UI 组件
ls components/ui/

# 检查配置文件
ls *.config.* *.json
```

预期输出：
- 15+ 页面组件
- 13+ UI 组件
- 7 个配置文件

---

## 📚 下一步

安装完成后，您可以：

1. 📖 阅读 [README.md](./README.md) 了解项目详情
2. 🚀 查看 [QUICK_START.md](./QUICK_START.md) 快速开始
3. 📊 阅读 [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) 项目总结
4. 🔧 开始自定义和开发

---

## 💡 开发提示

### VS Code 推荐扩展

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### 调试配置

创建 `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "pnpm dev"
    }
  ]
}
```

### 性能监控

在开发模式下，您可以使用：
- React DevTools
- Network 面板
- Lighthouse 审计

---

## 🆘 获取帮助

如果遇到问题：

1. 检查本文档的常见问题部分
2. 查看浏览器控制台错误
3. 检查终端输出
4. 阅读 Next.js [官方文档](https://nextjs.org/docs)
5. 联系开发团队

---

## ✨ 成功！

如果您能看到登录页面并成功登录，恭喜！PortalOps 前端已经成功安装和运行。

**祝您开发愉快！** 🎉

---

**文档版本**: 1.0  
**最后更新**: 2025-10-17  
**维护者**: Enterprise Development Team


