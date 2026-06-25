"""
SkillOpt 项目自动化配置脚本
用法:  python setup.py        # 配置当前项目
       python setup.py train   # 配置并开始训练
       python setup.py webui   # 配置并启动 WebUI
"""
import os
import sys
import json
import shutil
from pathlib import Path

SKILLOPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SKILLOPT_DIR.parent

def get_site_packages():
    """找到 site-packages 路径"""
    import site
    return Path(site.getsitepackages()[0])

def generate_configs():
    """根据当前项目路径自动生成所有配置文件"""

    # 1. 生成训练数据集的 JSON
    data_path = SKILLOPT_DIR / "tribo_expert_data.json"
    if not data_path.exists():
        print(f"[WARN] 训练数据集不存在，运行 build_dataset.py 生成...")
        build_script = SKILLOPT_DIR / "build_dataset.py"
        if build_script.exists():
            exec(open(build_script, encoding='utf-8').read())
        else:
            print("[ERR] build_dataset.py 不存在，跳过")

    # 2. 生成训练配置（相对路径，项目无关）
    # 使用正斜杠避免 YAML 将 \U 等视为转义序列
    skill_init = str(SKILLOPT_DIR / "tribo_expert_skill.md").replace("\\", "/")
    data_path_str = str(SKILLOPT_DIR / "tribo_expert_data.json").replace("\\", "/")
    out_root = str(PROJECT_ROOT / "skillopt_outputs").replace("\\", "/")

    config_content = f"""_base_: _base_.yaml

model:
  reasoning_effort: medium

train:
  train_size: 0
  batch_size: 10
  num_epochs: 3
  accumulation: 1

gradient:
  minibatch_size: 5
  merge_batch_size: 5

optimizer:
  learning_rate: 4
  use_slow_update: true
  use_meta_skill: true

evaluation:
  sel_env_num: 0
  test_env_num: 0

env:
  name: searchqa
  skill_init: "{skill_init}"
  split_mode: ratio
  split_ratio: "7:1:2"
  data_path: "{data_path_str}"
  split_dir: ""
  split_output_dir: ""
  max_turns: 1
  max_completion_tokens: 8192
  workers: 4
  limit: 0
  out_root: "{out_root}"
"""
    config_path = SKILLOPT_DIR / "configs" / "tribo_expert.yaml"
    config_path.write_text(config_content, encoding='utf-8')
    print(f"[OK] 生成训练配置: {config_path}")

    # 3. 同步到 site-packages（供 WebUI 使用）
    sp = get_site_packages()
    sp_configs = sp / "configs"
    sp_configs.mkdir(parents=True, exist_ok=True)

    # 复制配置文件
    for f in SKILLOPT_DIR.glob("configs/*.yaml"):
        shutil.copy2(f, sp_configs / f.name)
        print(f"  [SYNC] 配置: {f.name}")

    # 复制初始 skill
    skill_src = SKILLOPT_DIR / "tribo_expert_skill.md"
    if skill_src.exists():
        shutil.copy2(skill_src, sp_configs / skill_src.name)
        print(f"  [SYNC] 技能: {skill_src.name}")

    # 复制训练数据
    data_src = SKILLOPT_DIR / "tribo_expert_data.json"
    if data_src.exists():
        shutil.copy2(data_src, sp_configs / data_src.name)
        print(f"  [SYNC] 数据: {data_src.name}")

    print(f"\n[OK] 配置完成！项目: {PROJECT_ROOT.name}")
    return str(config_path)


def load_env():
    """加载 .skillopt/.env 中的环境变量"""
    env_path = SKILLOPT_DIR / ".env"
    if env_path.exists():
        for line in env_path.read_text(encoding='utf-8').splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                # 去掉 export 前缀（兼容 bash 格式）
                clean = line.replace("export ", "", 1)
                k, v = clean.split("=", 1)
                os.environ[k.strip()] = v.strip()
        print(f"[OK] 加载环境变量: {env_path.name}")
    else:
        print(f"[WARN] 未找到 .env 文件，请创建 {env_path}")
        print(f"  格式: AZURE_OPENAI_ENDPOINT=https://api.deepseek.com/v1")
        print(f"        AZURE_OPENAI_API_KEY=sk-xxxx")
        print(f"        AZURE_OPENAI_AUTH_MODE=openai_compatible")


def train():
    """运行训练"""
    config_path = generate_configs()
    load_env()
    print(f"\n[START] 开始训练...")
    os.chdir(str(get_site_packages()))

    from scripts.train import main
    sys.argv = ['train', '--config', config_path]
    main()


def webui():
    """启动 WebUI"""
    generate_configs()
    load_env()
    print(f"\n[START] 启动 WebUI...")
    os.chdir(str(get_site_packages()))

    from skillopt_webui.app import main as webui_main
    sys.argv = ['skillopt-webui', '--port', '7860', '--host', '0.0.0.0']
    webui_main()


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'config'

    if cmd == 'train':
        train()
    elif cmd == 'webui':
        webui()
    elif cmd == 'config':
        generate_configs()
    else:
        print(f"用法: python setup.py [config|train|webui]")
        print(f"  config  - 生成配置文件（默认）")
        print(f"  train   - 配置并开始训练")
        print(f"  webui   - 配置并启动 WebUI")
