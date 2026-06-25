# Phase 2: 团队动态/评论/公告/通知

## Context

Phase 1 删除了个人健身/任务/运营活动模块。Phase 2 在核心团队模块上增加协作功能：团队动态流、活动评论、团队公告、站内通知。

## 实施步骤

### 1. 后端模型增强

**修改 `backend/app/models/team.py`**
- TeamActivity 新增字段: `activity_type`(String), `summary`(Text), `notes`(Text), `photo_urls`(Text)
- 新增 `TeamFeedItem` 模型（team_feeds 表）
- 新增 `ActivityComment` 模型（activity_comments 表）
- 新增 `TeamAnnouncement` 模型（team_announcements 表）

**新建 `backend/app/models/notification.py`**
- Notification 模型（notifications 表），含 type/title/body/ref_type/ref_id/is_read 等字段

**更新 `backend/app/models/__init__.py`** — 导出新模型

### 2. 后端 Schema

**修改 `backend/app/schemas/team.py`** — 新增:
- TeamFeedItemOut
- ActivityCommentCreate / ActivityCommentOut
- TeamAnnouncementCreate / TeamAnnouncementOut
- 更新 TeamActivityCreate/Out/Update 增加新字段

**新建 `backend/app/schemas/notification.py`** — NotificationOut, UnreadCountOut

### 3. 后端 API 端点

**修改 `backend/app/routers/team.py`**
- 新增辅助函数: `_create_feed_item()`, `_notify_user()`, `_notify_team_members()`
- 在 create_activity/signup/checkin/join_team 中注入 feed 自动生成
- 新增端点:
  - `GET /api/teams/{team_id}/feed` — 团队动态流
  - `GET /api/teams/feed` — 所有团队的聚合动态
  - `GET/POST /api/teams/{team_id}/activities/{activity_id}/comments` — 评论
  - `DELETE /api/teams/activities/comments/{comment_id}` — 删除评论
  - `GET/POST /api/teams/{team_id}/announcements` — 公告
  - `DELETE /api/teams/announcements/{announcement_id}` — 归档公告
  - `GET /api/teams/activities/{activity_id}` — 活动详情（用于通知导航）

**新建 `backend/app/routers/notification.py`**
- `GET /api/notifications` — 通知列表
- `GET /api/notifications/unread-count` — 未读数
- `PUT /api/notifications/{id}/read` — 标记已读
- `PUT /api/notifications/read-all` — 全部已读

**修改 `backend/app/main.py`** — 注册 notification.router

### 4. 前端变更

**`miniprogram/utils/api.js`** — 新增约 14 个 API 函数（feed/comment/announcement/notification）

**`miniprogram/pages/team_detail/`** — 增强:
- Tab 从 2 个改为 3 个: 活动/公告/成员
- 公告 Tab: 公告列表 + 发布对话框（管理员）
- 活动卡片增加: 评论展开/收起 → 评论输入框 + 发送
- 新增 handlers: toggleComments, submitComment, showCreateAnnouncement, submitAnnouncement

**新建 `miniprogram/pages/notifications/`** (4 文件):
- 通知列表页，支持下拉刷新、标记已读、全部已读
- 点击通知跳转至团队详情

**`miniprogram/pages/profile/`** — 增加"通知中心"入口（含未读数量角标）

**`miniprogram/pages/index/`** — 首页最新动态改为 feed 流 + 通知角标

**`miniprogram/app.json`** — 添加 notifications 页面注册

### 5. 关键设计

- Feed 自动生成（无手动发布），后端在关键操作点注入
- 通知仅站内（无微信模板消息）
- 用户只能删除自己的评论
- 公告仅管理员/群主可发布
- 无级联删除（孤立数据可接受）
- 使用 `Base.metadata.create_all` 自动建表（无 alembic）

### 验证方法

1. 启动后端，确认无启动错误（新表自动创建）
2. 创建活动 → 验证 feed 自动生成
3. 报名/签到活动 → 验证 feed + 通知
4. 活动下评论 → 验证评论列表 + feed
5. 发布公告 → 验证仅管理员可发 + feed
6. 通知中心 → 验证未读计数/标记已读
7. 首页 → 验证全局 feed 流显示
