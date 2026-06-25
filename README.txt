# Tribo - 活动跟踪系统

🏋️ 健身运动跟踪 + 👥 团队活动组织 + ✅ 个人习惯管理 + 🏃 专项挑战

## 技术栈
- **前端**：微信小程序（WXML + WXSS + JS）— 6 页面
- **后端**：Python FastAPI + SQLAlchemy + SQLite — 49 API 端点
- **数据库**：SQLite（开发）/ 可切 MySQL / PostgreSQL

## 模块划分

| 模块 | 功能 | API 端点 |
|------|------|:--------:|
| 健身运动 | 记录、打卡、统计、连续天数 | 8 |
| 团队活动 | 创建团队、发布活动、报名、签到 | 10 |
| 任务习惯 | 待办、习惯打卡、进度、复盘 | 9 |
| 专项挑战 | 目标设定、进度记录、排行榜 | 6 |
| 用户系统 | 登录、设置 | 5 |
| **合计** | | **49** |

## 项目结构

```
Tribo-system/
├── README.txt              # 本文件
├── docs/                   # 设计文档
│   └── 开发方案文档.md
├── backend/                # FastAPI 后端 (49 API 端点)
│   ├── app/main.py         # 入口
│   ├── app/core/           # 配置/数据库/认证
│   ├── app/models/         # 17 张 ORM 模型
│   ├── app/schemas/        # Pydantic 校验
│   └── app/routers/        # 5 个路由模块
└── miniprogram/            # 微信小程序前端 (40 文件)
    ├── app.js/json/wxss    # 全局配置
    ├── utils/api.js        # API 封装
    ├── images/             # 10 个 SVG 图标
    └── pages/
        ├── index/          # 首页（打卡 + 统计 + 任务/习惯概览）
        ├── workout/        # 运动记录列表
        ├── workout_log/    # 新增运动记录
        ├── tasks/          # 任务管理（弹窗创建 + 完成）
        ├── habits/         # 习惯打卡（进度条）
        └── profile/        # 个人中心
```

## 快速开始

### 启动后端
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8011
```

### 前端预览
用微信开发者工具打开 `miniprogram/` 目录
配置 `miniprogram/app.js` 中的 `baseUrl` 为后端地址
修改 `project.config.json` 中的 `appid` 为你的 AppID

## 开发进度

- [x] Phase 1: MVP 核心功能 — 后端完成 ✅ 小程序骨架完成 ✅
- [ ] Phase 2: 社交与团队
- [ ] Phase 3: 专项活动
- [ ] Phase 4: 数据与增值
- [ ] Phase 5: 打磨上线
