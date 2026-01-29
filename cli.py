#!/usr/bin/env python3
"""
HTML to Word 转换脚本（命令行接口）
用于 Next.js API 路由调用

使用项目中的虚拟环境
"""

import argparse
import sys
import os

# 将项目根目录添加到 Python 路径
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

# 确保使用虚拟环境
venv_python = os.path.join(project_root, 'venv', 'bin', 'python')
if os.path.exists(venv_python) and sys.executable != venv_python:
    # 如果当前不是虚拟环境的 Python，重新执行
    import subprocess
    result = subprocess.run([venv_python] + sys.argv, cwd=project_root)
    sys.exit(result.returncode)

from document_generator import DocumentGenerator


def main():
    parser = argparse.ArgumentParser(description='Convert HTML to Word document using Pandoc')
    parser.add_argument('--input', required=True, help='Input HTML file path')
    parser.add_argument('--output', required=True, help='Output DOCX file path')
    parser.add_argument('--template', required=True, help='Reference template DOCX file path')
    parser.add_argument('--title', default='', help='Document title for cover page')
    parser.add_argument('--toc-depth', type=int, default=3, help='Table of contents depth (default: 3)')

    args = parser.parse_args()

    # 检查输入文件是否存在
    if not os.path.exists(args.input):
        print(f"Error: Input file not found: {args.input}", file=sys.stderr)
        sys.exit(1)

    # 检查模板文件是否存在
    if not os.path.exists(args.template):
        print(f"Error: Template file not found: {args.template}", file=sys.stderr)
        sys.exit(1)

    try:
        # 读取 HTML 内容
        with open(args.input, 'r', encoding='utf-8') as f:
            html_content = f.read()

        print(f"[CLI] Starting conversion...")
        print(f"[CLI] Input: {args.input}")
        print(f"[CLI] Output: {args.output}")
        print(f"[CLI] Template: {args.template}")
        print(f"[CLI] Title: {args.title or '(auto-generated)'}")

        # 创建生成器实例
        generator = DocumentGenerator(template_path=args.template)

        # 转换
        output_path = generator.html_to_docx(
            html_content=html_content,
            output_path=args.output,
            document_title=args.title
        )

        print(f"[CLI] Conversion successful: {output_path}")
        sys.exit(0)

    except Exception as e:
        print(f"[CLI] Error: {str(e)}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
