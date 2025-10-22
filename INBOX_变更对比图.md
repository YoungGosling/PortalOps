# Inbox 功能变更对比图

## 变更前 (Before) - 个人任务视图

```
┌─────────────────────────────────────────────────────────────────┐
│                    HR System (外部系统)                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ POST /api/webhooks/hr/onboarding
                         │ {"employee": {...}}
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PortalOps Backend                             │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  创建任务 (Create Task)                                 │    │
│  │  - assignee_user_id = 第一个 Admin 的 ID              │    │
│  │  - status = "pending"                                  │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                         │
                         │ 任务只分配给一个 Admin
                         │
         ┌───────────────┴───────────────┐
         ▼                               ▼
┌──────────────────┐            ┌──────────────────┐
│   Admin A        │            │   Admin B        │
│  ┌────────────┐  │            │  ┌────────────┐  │
│  │ Inbox:     │  │            │  │ Inbox:     │  │
│  │ - 任务 1 ✓ │  │            │  │ (空)       │  │
│  │ - 任务 2 ✓ │  │            │  │            │  │
│  └────────────┘  │            │  └────────────┘  │
│                  │            │                  │
│  可以处理任务 1   │            │  看不到任务 1     │
│  可以处理任务 2   │            │  无法处理任务 1   │
└──────────────────┘            └──────────────────┘

❌ 问题：
- 每个 Admin 只看到分配给自己的任务
- 任务分配不均
- 无法协作处理
```

---

## 变更后 (After) - 共享任务视图

```
┌─────────────────────────────────────────────────────────────────┐
│                    HR System (外部系统)                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ POST /api/webhooks/hr/onboarding
                         │ {"employee": {...}}
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PortalOps Backend                             │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  创建任务 (Create Task)                                 │    │
│  │  - assignee_user_id = 任意 Admin (仅占位)             │    │
│  │  - status = "pending"                                  │    │
│  │  - 所有 Admin 都可以看到和处理                         │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                         │
                         │ 任务对所有 Admin 可见
                         │
         ┌───────────────┴───────────────┐
         ▼                               ▼
┌──────────────────┐            ┌──────────────────┐
│   Admin A        │            │   Admin B        │
│  ┌────────────┐  │            │  ┌────────────┐  │
│  │ Inbox:     │  │            │  │ Inbox:     │  │
│  │ - 任务 1 ✓ │  │            │  │ - 任务 1 ✓ │  │
│  │ - 任务 2 ✓ │  │            │  │ - 任务 2 ✓ │  │
│  └────────────┘  │            │  └────────────┘  │
│                  │            │                  │
│  可以处理任务 1   │            │  可以处理任务 1   │
│  可以处理任务 2   │            │  可以处理任务 2   │
└──────────────────┘            └──────────────────┘

✅ 优势：
- 所有 Admin 看到相同的任务列表
- 任何 Admin 都可以处理任何任务
- 支持协作处理
- 防止重复处理
```

---

## 并发处理保护机制

```
时间线 (Timeline):

T1: Admin A 和 Admin B 都看到任务 1 (status: pending)

┌──────────────────┐            ┌──────────────────┐
│   Admin A        │            │   Admin B        │
│                  │            │                  │
│  看到任务 1      │            │  看到任务 1      │
│  status: pending │            │  status: pending │
└──────────────────┘            └──────────────────┘
         │                               │
         │                               │
         ▼                               │
T2: Admin A 点击"完成"                    │
    POST /api/inbox/tasks/{id}/complete  │
         │                               │
         ▼                               │
┌─────────────────────────────────────┐  │
│  Backend 处理:                      │  │
│  1. 检查任务状态                    │  │
│  2. status = "pending" ✓            │  │
│  3. 执行完成逻辑                    │  │
│  4. 更新 status = "completed"       │  │
│  5. 返回成功 (HTTP 204)             │  │
└─────────────────────────────────────┘  │
         │                               │
         ▼                               ▼
T3: Admin A 收到成功           Admin B 点击"完成"
                              POST /api/inbox/tasks/{id}/complete
                                        │
                                        ▼
                              ┌─────────────────────────────────────┐
                              │  Backend 处理:                      │
                              │  1. 检查任务状态                    │
                              │  2. status = "completed" ✗          │
                              │  3. 返回错误 (HTTP 400)             │
                              │     "Task has already been          │
                              │      completed by another admin"    │
                              └─────────────────────────────────────┘
                                        │
                                        ▼
T4:                              Admin B 收到错误提示
                                 "任务已被其他管理员完成"

┌──────────────────┐            ┌──────────────────┐
│   Admin A        │            │   Admin B        │
│                  │            │                  │
│  任务 1 完成 ✓   │            │  收到错误提示 ⚠  │
│  status:         │            │  "任务已完成"    │
│  completed       │            │                  │
└──────────────────┘            └──────────────────┘
```

---

## API 调用对比

### 变更前 (Before)

```
GET /api/inbox/tasks
Authorization: Bearer <Admin A Token>

Response: [
  {
    "id": "task-1",
    "assignee_user_id": "admin-a-id",  ← 只返回分配给 Admin A 的任务
    "status": "pending",
    ...
  }
]

---

GET /api/inbox/tasks
Authorization: Bearer <Admin B Token>

Response: []  ← Admin B 看不到任务（因为不是 assignee）
```

### 变更后 (After)

```
GET /api/inbox/tasks
Authorization: Bearer <Admin A Token>

Response: [
  {
    "id": "task-1",
    "assignee_user_id": "admin-a-id",  ← 所有 Admin 都能看到所有任务
    "status": "pending",
    ...
  },
  {
    "id": "task-2",
    "assignee_user_id": "admin-b-id",
    "status": "pending",
    ...
  }
]

---

GET /api/inbox/tasks
Authorization: Bearer <Admin B Token>

Response: [
  {
    "id": "task-1",
    "assignee_user_id": "admin-a-id",  ← 返回相同的任务列表
    "status": "pending",
    ...
  },
  {
    "id": "task-2",
    "assignee_user_id": "admin-b-id",
    "status": "pending",
    ...
  }
]
```

---

## 完成任务流程对比

### 变更前 (Before)

```
Admin B 尝试完成 Admin A 的任务:

POST /api/inbox/tasks/task-1/complete
Authorization: Bearer <Admin B Token>

Backend 检查:
1. 任务存在 ✓
2. 任务的 assignee_user_id == Admin B 的 ID? ✗
3. 返回 HTTP 403 Forbidden

Response:
{
  "detail": "You can only complete tasks assigned to you"
}

结果: Admin B 无法帮助 Admin A 处理任务
```

### 变更后 (After)

```
Admin B 尝试完成任何任务:

POST /api/inbox/tasks/task-1/complete
Authorization: Bearer <Admin B Token>

Backend 检查:
1. 任务存在 ✓
2. 任务状态 == "pending"? ✓
3. 移除了 assignee 检查
4. 执行完成逻辑
5. 返回 HTTP 204 No Content

结果: Admin B 可以帮助处理任务 ✓

---

如果任务已被完成:

POST /api/inbox/tasks/task-1/complete
Authorization: Bearer <Admin B Token>

Backend 检查:
1. 任务存在 ✓
2. 任务状态 == "completed" ✗
3. 返回 HTTP 400 Bad Request

Response:
{
  "detail": "Task has already been completed by another admin"
}

结果: 防止重复处理 ✓
```

---

## Dashboard 待处理任务计数对比

### 变更前 (Before)

```
┌──────────────────────────────────────────────────────────┐
│  Dashboard - Admin A                                      │
│  ┌────────────────────────────────────────────────────┐  │
│  │  View Inbox                                        │  │
│  │  Check pending workflow tasks                      │  │
│  │                                    [2]  ← 2 个任务  │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  Dashboard - Admin B                                      │
│  ┌────────────────────────────────────────────────────┐  │
│  │  View Inbox                                        │  │
│  │  Check pending workflow tasks                      │  │
│  │                                    [1]  ← 1 个任务  │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘

❌ 问题: 不同 Admin 看到不同的数字（只计算分配给自己的）
```

### 变更后 (After)

```
┌──────────────────────────────────────────────────────────┐
│  Dashboard - Admin A                                      │
│  ┌────────────────────────────────────────────────────┐  │
│  │  View Inbox                                        │  │
│  │  Check pending workflow tasks                      │  │
│  │                                    [3]  ← 3 个任务  │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  Dashboard - Admin B                                      │
│  ┌────────────────────────────────────────────────────┐  │
│  │  View Inbox                                        │  │
│  │  Check pending workflow tasks                      │  │
│  │                                    [3]  ← 3 个任务  │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘

✅ 改进: 所有 Admin 看到相同的数字（所有待处理任务总数）
```

---

## 数据库查询对比

### 变更前 (Before)

```sql
-- GET /api/inbox/tasks (Admin A)
SELECT * FROM workflow_tasks
WHERE assignee_user_id = 'admin-a-id'  ← 只查询分配给 Admin A 的
AND status = 'pending'
ORDER BY created_at DESC;

-- GET /api/dashboard/pending-tasks-count (Admin A)
SELECT COUNT(*) FROM workflow_tasks
WHERE status = 'pending'
AND assignee_user_id = 'admin-a-id';  ← 只计算分配给 Admin A 的
```

### 变更后 (After)

```sql
-- GET /api/inbox/tasks (任何 Admin)
SELECT * FROM workflow_tasks
-- 移除了 assignee_user_id 过滤条件
ORDER BY created_at DESC;

-- GET /api/dashboard/pending-tasks-count (任何 Admin)
SELECT COUNT(*) FROM workflow_tasks
WHERE status = 'pending';
-- 移除了 assignee_user_id 过滤条件
```

---

## 总结

| 特性 | 变更前 (Before) | 变更后 (After) |
|------|----------------|---------------|
| **任务可见性** | 每个 Admin 只看到分配给自己的任务 | 所有 Admin 看到所有任务 |
| **处理权限** | 只能处理分配给自己的任务 | 可以处理任何任务 |
| **待处理计数** | 显示分配给当前 Admin 的任务数 | 显示所有待处理任务总数 |
| **协作能力** | ❌ 无法协作 | ✅ 支持协作 |
| **重复处理保护** | ✅ 有（通过 assignee 检查） | ✅ 有（通过状态检查） |
| **错误提示** | "只能处理分配给你的任务" | "任务已被其他管理员完成" |
| **API 兼容性** | - | ✅ 完全向后兼容 |
| **数据库迁移** | - | ❌ 无需迁移 |
| **前端修改** | - | ❌ 无需修改 |

✅ **变更优势:**
- 提高协作效率
- 平衡工作负载
- 简化查询逻辑
- 保持向后兼容
- 零停机部署


