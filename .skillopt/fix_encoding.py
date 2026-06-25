"""
Fix all open() encoding issues in skillopt package.
Run: python fix_encoding.py
"""
import glob
import re

BASE = r'C:\Users\12225\AppData\Local\Programs\Python\Python312\Lib\site-packages\skillopt'

for py_file in glob.glob(f'{BASE}/**/*.py', recursive=True):
    with open(py_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace open(xxx, MODE) with open(xxx, MODE, encoding='utf-8')
    # Match patterns like: open(path, "w") or open(path, 'a')
    # Must NOT already have encoding=
    def fix_open(match):
        full = match.group(0)
        if 'encoding=' in full:
            return full
        # Add encoding='utf-8' before the closing paren
        if full.endswith(')'):
            return full[:-1] + ", encoding='utf-8')"
        return full

    new_content = re.sub(
        r'open\([^)]*,\s*["\']([aw])["\']\)',
        fix_open,
        content
    )

    if new_content != content:
        with open(py_file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        rel = py_file.replace(BASE, '')
        # Count changes
        old_count = content.count('open(')
        new_count = new_content.count('open(')
        print(f'Fixed: {rel} (encoding fixes applied)')

print('Done')
