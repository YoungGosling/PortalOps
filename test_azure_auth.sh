#!/bin/bash

# Azure AD 认证集成测试脚本
# 用于验证前后端配置是否正确

echo "🔍 PortalOps Azure AD 认证集成测试"
echo "======================================"
echo ""

# 检查前端配置
echo "📦 检查前端配置..."
cd nextjs

if [ ! -f ".env.local" ]; then
    echo "❌ 前端 .env.local 文件不存在"
    echo "   请根据 env.example 创建配置文件"
    exit 1
fi

# 检查必要的环境变量
FRONTEND_VARS=("NEXTAUTH_URL" "NEXTAUTH_SECRET" "AZURE_AD_CLIENT_ID" "AZURE_AD_CLIENT_SECRET" "AZURE_AD_TENANT_ID")
for var in "${FRONTEND_VARS[@]}"; do
    if grep -q "^${var}=" .env.local; then
        echo "✅ $var 已配置"
    else
        echo "❌ $var 未配置"
    fi
done

# 检查后端配置
echo ""
echo "📦 检查后端配置..."
cd ../server

if [ ! -f ".env" ]; then
    echo "❌ 后端 .env 文件不存在"
    echo "   请根据 env.example 创建配置文件"
    exit 1
fi

# 检查必要的环境变量
BACKEND_VARS=("AZURE_AD_ENABLED" "AZURE_AD_TENANT_ID" "AZURE_AD_CLIENT_ID")
for var in "${BACKEND_VARS[@]}"; do
    if grep -q "^${var}=" .env; then
        echo "✅ $var 已配置"
    else
        echo "❌ $var 未配置"
    fi
done

# 检查数据库连接
echo ""
echo "🗄️  检查数据库..."
if command -v psql &> /dev/null; then
    # 从 .env 读取数据库配置
    DB_URL=$(grep "^DATABASE_URL=" .env | cut -d '=' -f2-)
    
    # 解析 DATABASE_URL
    # postgresql://user:password@host:port/database
    DB_USER=$(echo $DB_URL | sed 's|postgresql://\([^:]*\):.*|\1|')
    DB_NAME=$(echo $DB_URL | sed 's|.*/\([^/]*\)$|\1|')
    DB_HOST=$(echo $DB_URL | sed 's|.*@\([^:]*\):.*|\1|')
    
    if psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT 1 FROM users LIMIT 1;" &> /dev/null; then
        echo "✅ 数据库连接成功"
        
        # 检查 azure_id 字段
        if psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "\d users" | grep -q "azure_id"; then
            echo "✅ users.azure_id 字段已存在"
        else
            echo "❌ users.azure_id 字段不存在"
            echo "   请运行: psql -U $DB_USER -d $DB_NAME -f migrations/add_azure_id_to_users.sql"
        fi
    else
        echo "❌ 数据库连接失败"
        echo "   请检查 DATABASE_URL 配置和数据库状态"
    fi
else
    echo "⚠️  psql 未安装，跳过数据库检查"
fi

# 检查 Python 依赖
echo ""
echo "📦 检查后端依赖..."
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi

if python -c "import requests" 2>/dev/null; then
    echo "✅ requests 库已安装"
else
    echo "❌ requests 库未安装"
    echo "   请运行: pip install -r requirements.txt"
fi

if python -c "from jose import jwt" 2>/dev/null; then
    echo "✅ python-jose 库已安装"
else
    echo "❌ python-jose 库未安装"
    echo "   请运行: pip install -r requirements.txt"
fi

# 检查 Node.js 依赖
echo ""
echo "📦 检查前端依赖..."
cd ../nextjs

if [ -d "node_modules/next-auth" ]; then
    echo "✅ next-auth 已安装"
else
    echo "❌ next-auth 未安装"
    echo "   请运行: pnpm install"
fi

# 总结
echo ""
echo "======================================"
echo "✅ 配置检查完成！"
echo ""
echo "📋 下一步操作："
echo "1. 确保数据库迁移已执行（添加 azure_id 字段）"
echo "2. 启动后端: cd server && python -m uvicorn app.main:app --reload"
echo "3. 启动前端: cd nextjs && pnpm dev"
echo "4. 访问 http://localhost:3000 并测试 Azure 登录"
echo ""
echo "🔧 故障排除："
echo "- 如果登录成功但停留在登录页，检查 middleware.ts"
echo "- 如果后端返回 401，检查 .env 中的 AZURE_AD_ENABLED=true"
echo "- 如果无权限访问，在 Employee Directory 中为用户分配角色"
echo ""

