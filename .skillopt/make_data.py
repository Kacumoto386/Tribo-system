import json

data = [
    {"id":"gd_001","question":"What is the difference between git merge and git rebase?","answers":["Merge creates a merge commit, rebase rewrites history on top of another branch"]},
    {"id":"gd_002","question":"How to create a Python virtual environment?","answers":["python -m venv venv then activate with source venv/bin/activate (Linux) or venv\\Scripts\\activate (Windows)"]},
    {"id":"gd_003","question":"What is an SQLAlchemy session?","answers":["A session tracks ORM changes and manages transactions. Use session.add(), flush(), commit(), close()"]},
    {"id":"gd_004","question":"How to check which process is on port 8000?","answers":["Run ss -tlnp on Linux or netstat -ano | findstr :8000 on Windows"]},
    {"id":"gd_005","question":"How to set up nginx reverse proxy?","answers":["server block with proxy_pass http://127.0.0.1:8000, set proxy headers, link to sites-enabled"]},
    {"id":"gd_006","question":"HTTP vs HTTPS difference?","answers":["HTTPS encrypts with SSL/TLS. HTTP uses port 80, HTTPS uses port 443"]},
    {"id":"gd_007","question":"How to get Let's Encrypt SSL?","answers":["Install certbot, run certbot --nginx -d domain.com, auto-renews via cron"]},
    {"id":"gd_008","question":"What is a Python decorator?","answers":["Wraps a function to add behavior: def decorator(f): def w(*a,**k): ... return w"]},
    {"id":"gd_009","question":"How to undo a git commit not pushed?","answers":["git reset --soft HEAD~1 keeps changes, git reset --hard HEAD~1 discards"]},
    {"id":"gd_010","question":"What is FastAPI Depends?","answers":["Injects dependencies like DB sessions into routes. Declared as function parameter with Depends()"]},
    {"id":"gd_011","question":"How to set up a systemd Python service?","answers":[".service file in /etc/systemd/system with ExecStart, Restart=always, then systemctl enable/start"]},
    {"id":"gd_012","question":"What is CORS in FastAPI?","answers":["Add CORSMiddleware with allow_origins, headers, methods to handle cross-origin requests"]},
    {"id":"gd_013","question":"How to check Linux disk usage?","answers":["df -h for summary, du -sh * for directory sizes"]},
    {"id":"gd_014","question":"How to view systemd logs?","answers":["journalctl -u servicename -n 50 or journalctl -u servicename --since today"]},
    {"id":"gd_015","question":"How to restart a systemd service?","answers":["systemctl restart servicename, verify with systemctl status servicename"]},
    {"id":"gd_016","question":"What is a JWT token?","answers":["JSON Web Token with user claims. Server signs on login, client sends in Authorization: Bearer header"]},
    {"id":"gd_017","question":"How to copy files with SCP?","answers":["scp -i key.pem file user@host:/path/ for upload, reverse order for download. -r for directories"]},
    {"id":"gd_018","question":"Port already in use how to fix?","answers":["Find PID with lsof -i :port, kill with kill -9 PID, or use different port"]},
    {"id":"gd_019","question":"How to use env vars in Python?","answers":["python-dotenv to load .env, then os.getenv() or pydantic-settings BaseSettings"]},
    {"id":"gd_020","question":"What is a GitHub pull request?","answers":["Push branch, click New PR on GitHub, describe changes, request reviewers"]},
    {"id":"gd_021","question":"How to check Python syntax only?","answers":["python -m py_compile file.py checks syntax without running"]},
    {"id":"gd_022","question":"Python list vs tuple?","answers":["List is mutable ([]), tuple is immutable (()). Tuples can be dict keys, lists cannot"]},
    {"id":"gd_023","question":"How to check SSL cert expiry?","answers":["openssl x509 -enddate -noout -in cert.pem or curl -vI https://domain.com"]},
    {"id":"gd_024","question":"How to view git commit history?","answers":["git log --oneline -10 for recent, git log --graph --oneline --all for branch graph"]},
    {"id":"gd_025","question":"How to create a new git branch?","answers":["git branch name creates, git checkout -b name creates and switches"]},
    {"id":"gd_026","question":"What is an async function in Python?","answers":["Defined with async def, uses await for I/O. Runs in event loop for concurrency"]},
    {"id":"gd_027","question":"How to set up ufw firewall?","answers":["ufw allow 22/tcp, ufw allow 443/tcp, ufw enable. Check status with ufw status"]},
    {"id":"gd_028","question":"How to view running processes?","answers":["ps aux for all, top/htop for interactive, ps aux | grep name to filter"]},
    {"id":"gd_029","question":"How to schedule cron jobs?","answers":["crontab -e to edit, format: minute hour day month weekday command"]},
    {"id":"gd_030","question":"What is dependency injection?","answers":["DI provides external dependencies to a class/function rather than creating them internally, improving testability"]},
    {"id":"gd_031","question":"如何在 FastAPI 中定义新路由？","answers":["使用 @router.get() 或 @router.post() 装饰路由函数，从请求参数获取输入，返回响应"]},
    {"id":"gd_032","question":"nginx 配置文件在哪里？","answers":["主配置 /etc/nginx/nginx.conf，站点配置在 /etc/nginx/sites-available/"]},
    {"id":"gd_033","question":"如何查看文件大小？","answers":["ls -lh 查看文件，du -sh * 查看目录，df -h 查看磁盘"]},
    {"id":"gd_034","question":"如何停止运行中的 Python 服务？","answers":["systemctl stop servicename 系统服务，或 kill PID 直接进程"]},
    {"id":"gd_035","question":"微信小程序如何发起请求？","answers":["wx.request() 配置 url、method、data、header、timeout 参数"]},
    {"id":"gd_036","question":"如何检查服务器 uptime？","answers":["uptime 命令显示运行时间、负载、登录用户数"]},
    {"id":"gd_037","question":"Python 中如何处理 JSON？","answers":["json.dumps() 序列化，json.loads() 反序列化，json.dump()/load() 处理文件"]},
    {"id":"gd_038","question":"FastAPI 如何返回错误响应？","answers":["raise HTTPException(status_code=404, detail='Not found') 返回标准错误"]},
    {"id":"gd_039","question":"如何配置 git 用户信息？","answers":["git config --global user.name 'Name' 和 user.email 'email@example.com'"]},
    {"id":"gd_040","question":"什么是 SQL 索引？","answers":["索引加速查询但减慢慢写入。CREATE INDEX ON table(column)，复合索引支持多列"]},
]

path = r'C:\Users\12225\AppData\Local\Programs\Python\Python312\Lib\site-packages\configs\general_dev_data.json'
with open(path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
print(f'Created {len(data)} items')
print(f'File: {path}')
