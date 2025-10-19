#!/bin/bash

# PortalOps HR Webhook 测试脚本
# 用于快速测试入职和离职接口

set -e

# 配置
BASE_URL="${BASE_URL:-http://localhost:8000}"
API_KEY="${HR_WEBHOOK_API_KEY:-your-hr-webhook-secret-key}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  PortalOps HR Webhook 测试${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Base URL: ${YELLOW}${BASE_URL}${NC}"
echo -e "API Key: ${YELLOW}${API_KEY}${NC}"
echo ""

# 测试 1: 入职接口
echo -e "${YELLOW}[测试 1] 员工入职 - 张三${NC}"
echo "-------------------------------------------"

ONBOARDING_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/webhooks/hr/onboarding" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${API_KEY}" \
  -d '{
    "employee": {
      "name": "张三",
      "email": "zhangsan@example.com",
      "department": "工程部"
    }
  }')

ONBOARDING_BODY=$(echo "$ONBOARDING_RESPONSE" | head -n -1)
ONBOARDING_CODE=$(echo "$ONBOARDING_RESPONSE" | tail -n 1)

echo "HTTP Status: ${ONBOARDING_CODE}"
echo "Response Body: ${ONBOARDING_BODY}"

if [ "$ONBOARDING_CODE" = "202" ]; then
  echo -e "${GREEN}✓ 入职接口测试通过${NC}"
else
  echo -e "${RED}✗ 入职接口测试失败${NC}"
fi
echo ""

# 等待一秒
sleep 1

# 测试 2: 入职接口（重复用户）
echo -e "${YELLOW}[测试 2] 员工入职 - 李四（用于后续离职测试）${NC}"
echo "-------------------------------------------"

ONBOARDING2_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/webhooks/hr/onboarding" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${API_KEY}" \
  -d '{
    "employee": {
      "name": "李四",
      "email": "lisi@example.com",
      "department": "销售部"
    }
  }')

ONBOARDING2_BODY=$(echo "$ONBOARDING2_RESPONSE" | head -n -1)
ONBOARDING2_CODE=$(echo "$ONBOARDING2_RESPONSE" | tail -n 1)

echo "HTTP Status: ${ONBOARDING2_CODE}"
echo "Response Body: ${ONBOARDING2_BODY}"

if [ "$ONBOARDING2_CODE" = "202" ]; then
  echo -e "${GREEN}✓ 入职接口测试通过${NC}"
else
  echo -e "${RED}✗ 入职接口测试失败${NC}"
fi
echo ""

# 等待一秒
sleep 1

# 测试 3: 离职接口
echo -e "${YELLOW}[测试 3] 员工离职 - 李四${NC}"
echo "-------------------------------------------"

OFFBOARDING_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/webhooks/hr/offboarding" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${API_KEY}" \
  -d '{
    "employee": {
      "name": "李四",
      "email": "lisi@example.com",
      "department": "销售部"
    }
  }')

OFFBOARDING_BODY=$(echo "$OFFBOARDING_RESPONSE" | head -n -1)
OFFBOARDING_CODE=$(echo "$OFFBOARDING_RESPONSE" | tail -n 1)

echo "HTTP Status: ${OFFBOARDING_CODE}"
echo "Response Body: ${OFFBOARDING_BODY}"

if [ "$OFFBOARDING_CODE" = "202" ]; then
  echo -e "${GREEN}✓ 离职接口测试通过${NC}"
else
  echo -e "${RED}✗ 离职接口测试失败${NC}"
fi
echo ""

# 测试 4: 错误场景 - 离职不存在的用户
echo -e "${YELLOW}[测试 4] 错误场景 - 离职不存在的用户${NC}"
echo "-------------------------------------------"

ERROR_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/webhooks/hr/offboarding" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${API_KEY}" \
  -d '{
    "employee": {
      "email": "notexist@example.com"
    }
  }')

ERROR_BODY=$(echo "$ERROR_RESPONSE" | head -n -1)
ERROR_CODE=$(echo "$ERROR_RESPONSE" | tail -n 1)

echo "HTTP Status: ${ERROR_CODE}"
echo "Response Body: ${ERROR_BODY}"

if [ "$ERROR_CODE" = "404" ]; then
  echo -e "${GREEN}✓ 错误处理测试通过（预期返回 404）${NC}"
else
  echo -e "${RED}✗ 错误处理测试失败（预期 404，实际 ${ERROR_CODE}）${NC}"
fi
echo ""

# 测试 5: 错误场景 - 错误的 API Key
echo -e "${YELLOW}[测试 5] 错误场景 - 错误的 API Key${NC}"
echo "-------------------------------------------"

AUTH_ERROR_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/webhooks/hr/onboarding" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: wrong-api-key" \
  -d '{
    "employee": {
      "name": "测试",
      "email": "test@example.com",
      "department": "测试部"
    }
  }')

AUTH_ERROR_BODY=$(echo "$AUTH_ERROR_RESPONSE" | head -n -1)
AUTH_ERROR_CODE=$(echo "$AUTH_ERROR_RESPONSE" | tail -n 1)

echo "HTTP Status: ${AUTH_ERROR_CODE}"
echo "Response Body: ${AUTH_ERROR_BODY}"

if [ "$AUTH_ERROR_CODE" = "401" ]; then
  echo -e "${GREEN}✓ 认证测试通过（预期返回 401）${NC}"
else
  echo -e "${RED}✗ 认证测试失败（预期 401，实际 ${AUTH_ERROR_CODE}）${NC}"
fi
echo ""

# 总结
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  测试完成${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}提示：${NC}"
echo "1. 登录前端管理界面，访问 Inbox 页面查看创建的任务"
echo "2. 使用 Admin 账号完成入职和离职工作流"
echo "3. 查看数据库验证数据变化："
echo "   ${YELLOW}SELECT * FROM workflow_tasks ORDER BY created_at DESC LIMIT 5;${NC}"
echo "   ${YELLOW}SELECT * FROM users WHERE email IN ('zhangsan@example.com', 'lisi@example.com');${NC}"
echo ""

