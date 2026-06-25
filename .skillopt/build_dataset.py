"""
Tribo 项目完整训练数据集生成器
覆盖：后端开发、前端、部署运维、Debug、备案审核、数据库、版本控制
"""
import json
from pathlib import Path

TRAINING_DATA = [
    # ========== 一、FastAPI 后端开发 ==========
    {"id":"tribo_fastapi_001","question":"FastAPI 如何创建路由？","answers":["使用 APIRouter() 创建路由模块，用 @router.get('/path') 定义 GET 接口，@router.post('/path') 定义 POST 接口，prefix 参数设置统一前缀"]},
    {"id":"tribo_fastapi_002","question":"FastAPI 如何依赖注入？","answers":["用 Depends() 声明依赖，比如数据库会话：db: AsyncSession = Depends(get_db)，依赖可以是函数或类"]},
    {"id":"tribo_fastapi_003","question":"FastAPI 生命周期事件怎么用？","answers":["用 lifespan 异步上下文管理器，启动时创建数据库表、初始化种子数据，关闭时释放连接池"]},
    {"id":"tribo_fastapi_004","question":"FastAPI 如何配置 CORS？","answers":["添加 CORSMiddleware，设置 allow_origins=['*'], allow_credentials=True, allow_methods=['*'], allow_headers=['*']"]},
    {"id":"tribo_fastapi_005","question":"FastAPI 如何返回错误响应？","answers":["raise HTTPException(status_code=404, detail='Not found')，FastAPI 自动返回 JSON 格式错误"]},

    # ========== 二、SQLAlchemy 数据库 ==========
    {"id":"tribo_db_001","question":"SQLAlchemy 异步引擎如何使用？","answers":["用 create_async_engine() 创建异步引擎，AsyncSession 管理会话，查询用 await db.execute(select(Model))"]},
    {"id":"tribo_db_002","question":"SQLAlchemy 模型字段类型怎么选？","answers":["字符串用 String(长度)，整数用 Integer，时间用 DateTime，大文本用 Text，小数用 DECIMAL(10,2)"]},
    {"id":"tribo_db_003","question":"SQLAlchemy flush 和 commit 有什么区别？","answers":["flush() 发送 SQL 到数据库但不提交事务，commit() 提交事务。batch 操作时先 flush 再 commit"]},
    {"id":"tribo_db_004","question":"SQLAlchemy 如何统计数量？","answers":["select(func.count()).where(Model.field == value)，或直接 len(result.scalars().all())"]},
    {"id":"tribo_db_005","question":"SQLAlchemy JOIN 查询怎么写？","answers":["select(ModelA, ModelB.field).outerjoin(ModelB, ModelB.id == ModelA.ref_id)，返回元组列表"]},

    # ========== 三、微信小程序前端 ==========
    {"id":"tribo_mini_001","question":"微信小程序如何发起 HTTP 请求？","answers":["用 wx.request({url, method, data, header, timeout})，注意要配置超时和错误处理"]},
    {"id":"tribo_mini_002","question":"微信小程序 WXML 中怎么显示动态数据？","answers":["用 {{变量名}} 双花括号插值，wx:for 循环渲染，wx:if/wx:elif/wx:else 条件渲染"]},
    {"id":"tribo_mini_003","question":"微信小程序 WXML 不支持哪些 JS 特性？","answers":["不支持箭头函数、可选链 ?.、数组索引 obj[key]、方法调用 [0].toUpperCase()，需要在 JS 中预计算"]},
    {"id":"tribo_mini_004","question":"微信小程序如何获取用户信息？","answers":["用 wx.getStorageSync() 本地缓存获取，或调用 wx.getUserProfile() 弹窗授权"]},
    {"id":"tribo_mini_005","question":"微信小程序页面之间如何传参？","answers":["navigateTo 通过 url 参数传递，接收方在 onLoad(options) 中获取 options.id"]},

    # ========== 四、核心业务逻辑（Bug修复经验） ==========
    {"id":"tribo_bug_001","question":"创建团队后成员列表显示 OpenID 而不是昵称？","answers":["前端 WXML 显示的是 item.user_id，改为 item.nickname || item.user_id。后端 list_members 需要 JOIN User 表获取 nickname"]},
    {"id":"tribo_bug_002","question":"评论和公告显示 userId 不友好？","answers":["后端的 Schema（ActivityCommentOut、TeamAnnouncementOut 等）缺少 nickname 字段，增加后 JOIN User 表填充"]},
    {"id":"tribo_bug_003","question":"待办弹窗点击物资分派显示'暂无待办'？","answers":[".js 中 showTodoDialog 的 map 映射少了 assign: 'todoAssigns'，加上这行即可"]},
    {"id":"tribo_bug_004","question":"标记完成后采购认领和物资分派仍显示在待办列表？","answers":["后端 my-todos 接口过滤条件是 status < 2，改为 status == 0 只显示待处理项"]},
    {"id":"tribo_bug_005","question":"物资分派标记完成后详情页仍显示'待准备'？","answers":["分派状态（0待领取→1已领取）和物资状态（0待准备→2已到位）是分开的。update_assignment 中需联动更新：当全部分派完成时自动将物资置为已到位"]},
    {"id":"tribo_bug_006","question":"物资领取列表显示 OpenID 而不是姓名？","answers":["在 loadFullDetail() 中用 getTeamMembers() 获取成员列表，构建 nickMap 映射，嵌入到 _assignments、_claims 等对象中供 WXML 使用"]},
    {"id":"tribo_bug_007","question":"首次进入团队评论数显示为 0？","answers":["前端 loadData 时硬编码了 _commentCount: 0，后端 _build_activity_out 加入评论计数查询返回 comment_count 字段"]},

    # ========== 五、部署运维 ==========
    {"id":"tribo_deploy_001","question":"如何部署后端到阿里云 ECS？","answers":["SSH 连接服务器，scp 传输代码，设置 systemd 服务自动启停，nginx 反向代理到 uvicorn"]},
    {"id":"tribo_deploy_002","question":"nginx 如何配置反向代理？","answers":["server 块中 location / 配置 proxy_pass http://127.0.0.1:8000，设置 Host/X-Real-IP/X-Forwarded-For 头"]},
    {"id":"tribo_deploy_003","question":"nginx HTTP 如何重定向到 HTTPS？","answers":["listen 80 的 server 块中 return 301 https://$server_name$request_uri"]},
    {"id":"tribo_deploy_004","question":"systemd 服务如何配置？","answers":[".service 文件放在 /etc/systemd/system/，配置 ExecStart、WorkingDirectory、Restart=always，然后 systemctl enable/start"]},
    {"id":"tribo_deploy_005","question":"如何检查端口监听？","answers":["Linux 用 ss -tlnp | grep 端口，Windows 用 netstat -ano | findstr 端口"]},
    {"id":"tribo_deploy_006","question":"后端服务如何安全重启？","answers":["先 systemctl stop servicename，更新代码后 systemctl start servicename，用 systemctl status 检查状态"]},
    {"id":"tribo_deploy_007","question":"如何查看服务日志？","answers":["journalctl -u servicename -n 100 或 journalctl -u servicename --since '1 hour ago'"]},
    {"id":"tribo_deploy_008","question":"SSH 连接不上服务器怎么办？","answers":["检查安全组端口是否开放，确认密钥文件权限正确（.pem 需要 chmod 400），检查 sshd 是否运行"]},

    # ========== 六、备案与 SSL ==========
    {"id":"tribo_cert_001","question":"阿里云 ICP 备案未完成会怎样？","answers":["阿里云会拦截 HTTP（80端口）显示 Non-compliance ICP Filing 页面，导致 Let's Encrypt 证书无法续期，HTTPS 也失效"]},
    {"id":"tribo_cert_002","question":"如何申请 Let's Encrypt SSL 证书？","answers":["安装 certbot，运行 certbot --nginx -d domain.com，证书在 /etc/letsencrypt/live/domain.com/，自动续期"]},
    {"id":"tribo_cert_003","question":"如何检查 SSL 证书过期时间？","answers":["openssl x509 -enddate -noout -in /path/to/fullchain.pem，或浏览器点击锁图标查看"]},
    {"id":"tribo_cert_004","question":"小程序备案需要什么材料？","answers":["需要小程序代码包的 MD5 或 SHA1 哈希值，可以从微信开发者工具上传时获取"]},

    # ========== 七、微信小程序审核 ==========
    {"id":"tribo_review_001","question":"个人主体小程序为什么不能发布社交功能？","answers":["微信规定社交类目仅限企业主体。涉及用户发布内容、留言、评论的功能都属社交范畴"]},
    {"id":"tribo_review_002","question":"个人主体小程序想上线社交功能怎么办？","answers":["注册企业主体小程序（需营业执照），或注销原小程序重新以企业身份注册"]},
    {"id":"tribo_review_003","question":"小程序上传失败提示类目不符怎么办？","answers":["检查功能是否涉及社交、金融等受限类目，需要对应资质才能发布"]},

    # ========== 八、Git 版本控制 ==========
    {"id":"tribo_git_001","question":"如何撤销尚未推送的 commit？","answers":["git reset --soft HEAD~1 保留改动文件，git reset --hard HEAD~1 丢弃改动"]},
    {"id":"tribo_git_002","question":"如何创建并切换到新分支？","answers":["git checkout -b branch-name 或先 git branch name 再 git checkout name"]},
    {"id":"tribo_git_003","question":"如何查看最近提交记录？","answers":["git log --oneline -10 最近10条，git log --graph --oneline --all 分支图"]},

    # ========== 九、SkillOpt 使用 ==========
    {"id":"skillopt_001","question":"SkillOpt 是什么？","answers":["微软开源的自然语言技能优化框架，通过训练循环自动优化 AI 助手的 system prompt/skill 文档"]},
    {"id":"skillopt_002","question":"如何安装 SkillOpt？","answers":["pip install skillopt，如需 WebUI 额外安装 gradio，从 GitHub 下载 prompt 模板文件"]},
    {"id":"skillopt_003","question":"SkillOpt WebUI 如何启动？","answers":["python -m skillopt_webui.app --port 7860 --host 0.0.0.0，注意 PROJECT_ROOT 是 site-packages 目录"]},
    {"id":"skillopt_004","question":"SkillOpt 训练数据格式是什么？","answers":["JSON 数组，每条有 id、question 和 answers（数组）字段。通过 split_mode 和 data_path 配置"]},
    {"id":"skillopt_005","question":"Windows 上打开 JSON 文件报 GBK 解码错误？","answers":["Python 默认用系统编码打开文件，Windows 用 GBK。在 dataloader 的 open() 调用中指定 encoding='utf-8'"]},
    {"id":"skillopt_006","question":"训练完成后 best_skill.md 是什么？","answers":["最终优化后的技能文档，本质是高质量的 system prompt。可以部署到任何 AI 助手或 API 中使用"]},

    # ========== 十、Python 开发通用 ==========
    {"id":"python_001","question":"如何检查 Python 语法而不运行代码？","answers":["python -m py_compile file.py，只检查语法不执行"]},
    {"id":"python_002","question":"Python 虚拟环境怎么创建？","answers":["python -m venv venv，Linux 用 source venv/bin/activate，Windows 用 venv\\Scripts\\activate"]},
    {"id":"python_003","question":"Python 装饰器是什么？","answers":["函数包装器：def decorator(func): def wrapper(*args, **kwargs): return func(*args, **kwargs); return wrapper"]},
    {"id":"python_004","question":"Python 列表和元组有什么区别？","answers":["列表 [] 可变，元组 () 不可变。元组可以做字典键，列表不行"]},
    {"id":"python_005","question":"Python 异步编程怎么用？","answers":["async def 定义协程，await 等待 I/O，asyncio.run() 启动事件循环"]},

    # ========== 十一、安全问题 ==========
    {"id":"security_001","question":"API Key 不小心提交到 git 怎么办？","answers":["立即撤销/更新密钥，git filter-branch 或 BFG 从历史中清除，添加 .gitignore 和 .env 到忽略列表"]},
    {"id":"security_002","question":"如何安全存储 API Key？","answers":["放在 .env 文件中，在 gitignore 里排除。生产环境用环境变量或密钥管理服务"]},

    # ========== 十二、数据库设计与优化 ==========
    {"id":"design_001","question":"为什么物资状态和分派状态要分开？","answers":["物资状态表示物资本身的准备情况（待准备→已采购→已到位），分派状态记录谁负责领取（待领取→已领取→已归还），两者独立追踪"]},
    {"id":"design_002","question":"评论数实时显示如何设计？","answers":["后端在返回活动列表时一并统计评论数 comment_count，前端直接显示不需要额外请求"]},
    {"id":"design_003","question":"待办聚合怎么设计？","answers":["后端 my-todos 接口从任务、采购、物资分派、布设多表中查询状态为0的条目，统一返回 TodoItemOut"]},
]

# Output - 输出到 .skillopt 目录（跨项目可移植）
import sys
SKILLOPT_DIR = Path(__file__).resolve().parent
path = str(SKILLOPT_DIR / 'tribo_expert_data.json')
with open(path, 'w', encoding='utf-8') as f:
    json.dump(TRAINING_DATA, f, ensure_ascii=False, indent=2)

print(f'=== Tribo 专家训练数据集 ===')
print(f'总条目: {len(TRAINING_DATA)}')

# Stats by category
cats = {}
for d in TRAINING_DATA:
    prefix = d['id'].split('_')[0]
    cats[prefix] = cats.get(prefix, 0) + 1
for k in sorted(cats.keys()):
    print(f'  {k}: {cats[k]} 条')
print(f'\n保存路径: {path}')
