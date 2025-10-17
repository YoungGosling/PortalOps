#!/bin/bash

# 更新PortalOps数据库数据的脚本
# 这个脚本会清除现有数据并重新插入更新的样本数据

echo "🔄 正在更新PortalOps数据库数据..."

# 数据库连接参数
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="portalops"
DB_USER="portalops"
DB_PASSWORD="password"

# 设置PGPASSWORD环境变量以避免密码提示
export PGPASSWORD="$DB_PASSWORD"

echo "📋 清除现有数据..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << 'EOF'
-- 清除现有数据（按照外键依赖顺序）
DELETE FROM audit_logs;
DELETE FROM workflow_tasks;
DELETE FROM permission_assignments;
DELETE FROM payment_info;
DELETE FROM products;
DELETE FROM services;
DELETE FROM user_roles;
DELETE FROM users;

-- 重置序列（如果有的话）
SELECT setval('roles_id_seq', 3, true);
EOF

if [ $? -eq 0 ]; then
    echo "✅ 现有数据已清除"
else
    echo "❌ 清除数据失败"
    exit 1
fi

echo "📥 插入新的样本数据..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f sample_data.sql

if [ $? -eq 0 ]; then
    echo "✅ 样本数据插入成功！"
    echo ""
    echo "🔐 测试账号："
    echo "  管理员: admin@portalops.com / password"
    echo "  服务管理员: service.admin@portalops.com / password"
    echo "  产品管理员: product.admin@portalops.com / password"
    echo ""
    echo "📊 数据统计："
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << 'EOF'
SELECT 'Users' as table_name, count(*) as count FROM users
UNION ALL
SELECT 'Services', count(*) FROM services
UNION ALL
SELECT 'Products', count(*) FROM products
UNION ALL
SELECT 'Payment Info', count(*) FROM payment_info;
EOF
else
    echo "❌ 样本数据插入失败"
    exit 1
fi

echo "🎉 数据库更新完成！"



