# Tribo - 团队活动跟踪管理系统

全栈团队活动管理应用，支持团队创建、活动发布、物资调配、采购管理、场地布设等功能。

## 技术栈

- **后端**: FastAPI + SQLAlchemy (async) + SQLite
- **前端**: 微信小程序 (WXML/WXSS/JS)
- **部署**: nginx + systemd + Let's Encrypt SSL
- **AI 技能**: SkillOpt + DeepSeek (自动训练)

## 项目结构

```
backend/          # FastAPI 后端
├── app/
│   ├── main.py              # 入口
│   ├── core/                # 配置/数据库/安全
│   ├── models/              # ORM 模型
│   ├── schemas/             # Pydantic 验证
│   ├── routers/             # API 路由
│   └── services/            # 业务逻辑
├── requirements.txt
└── .env

miniprogram/      # 微信小程序前端
├── app.js
├── app.json
├── pages/
│   ├── index/               # 首页仪表板
│   ├── teams/               # 团队列表
│   ├── team_detail/         # 团队详情
│   ├── activity_detail/     # 活动详情
│   └── ...

.skillopt/        # AI 技能训练（全局）
├── setup.py                # 一键配置+训练
├── build_dataset.py        # 训练数据生成
├── best_skill.md           # 优化后的技能文档
└── configs/
```

## 部署

```bash
# 后端
cp backend/.env.example backend/.env
cd backend && pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## AI 技能训练

```powershell
cd C:\Users\12225\.claude\skill-base
python setup.py train
```
