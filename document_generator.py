import re
import base64
import tempfile
import os
from pathlib import Path
from typing import Optional
import pypandoc


class DocumentGenerator:
    """
    使用 pypandoc 将 HTML 转换为格式完美的 Word 文档
    """

    def __init__(self, template_path: Optional[str] = None):
        """
        初始化 DocumentGenerator

        Args:
            template_path: 模板文件路径，默认为项目根目录下的 reference_template.docx
        """
        if template_path is None:
            # 默认模板路径：项目根目录下的 reference_template.docx
            self.template_path = str(Path(__file__).parent / "reference_template.docx")
        else:
            self.template_path = template_path

        # 检查模板文件是否存在
        if not os.path.exists(self.template_path):
            raise FileNotFoundError(
                f"模板文件不存在: {self.template_path}\n"
                "请确保项目根目录下有 reference_template.docx 文件"
            )

    def _extract_and_save_base64_images(self, html_content: str) -> tuple[str, list[str]]:
        """
        提取 HTML 中的 Base64 图片，保存为临时文件，并替换 HTML 中的 src

        Args:
            html_content: 包含 Base64 图片的 HTML 内容

        Returns:
            tuple: (处理后的 HTML 内容, 临时文件路径列表)
        """
        # 匹配 Base64 图片: <img src="data:image/xxx;base64,..." />
        base64_pattern = r'<img\s+[^>]*src="data:image/([^;]+);base64,([^"]+)"([^>]*)>'

        temp_files = []

        def replace_base64_img(match):
            img_type = match.group(1)  # e.g., 'png', 'jpeg', 'gif'
            base64_data = match.group(2)
            other_attrs = match.group(3)

            try:
                # 解码 Base64 数据
                image_data = base64.b64decode(base64_data)

                # 创建临时文件
                with tempfile.NamedTemporaryFile(
                    delete=False,
                    suffix=f'.{img_type}',
                    prefix='img_'
                ) as temp_file:
                    temp_file.write(image_data)
                    temp_file_path = temp_file.name
                    temp_files.append(temp_file_path)

                # 返回替换后的 img 标签（使用相对路径）
                return f'<img src="{temp_file_path}"{other_attrs}>'

            except Exception as e:
                print(f"警告: 无法处理 Base64 图片 - {e}")
                # 如果处理失败，保持原样
                return match.group(0)

        # 替换所有 Base64 图片
        processed_html = re.sub(base64_pattern, replace_base64_img, html_content, flags=re.IGNORECASE)

        return processed_html, temp_files

    def _cleanup_temp_files(self, temp_files: list[str]):
        """
        清理临时文件

        Args:
            temp_files: 临时文件路径列表
        """
        for file_path in temp_files:
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception as e:
                print(f"警告: 无法删除临时文件 {file_path} - {e}")

    def html_to_docx(
        self,
        html_content: str,
        output_path: str,
        toc_depth: int = 3
    ) -> str:
        """
        将 HTML 内容转换为 Word 文档

        Args:
            html_content: HTML 内容，可以包含 h1-h3 标题、p 正文、table 表格、img 图片
            output_path: 输出的 Word 文档路径
            toc_depth: 目录层级深度，默认为 3

        Returns:
            str: 生成的 Word 文档路径

        Raises:
            FileNotFoundError: 模板文件不存在
            RuntimeError: Pandoc 转换失败

        Special Note:
            生成的文档中会包含目录，但由于 Word 的机制限制，
            用户在 Word 中打开文档后可能需要按 "F9" 或右键点击目录选择"更新域"才能看到最终页码。
        """
        print(f"[DocumentGenerator] 开始转换 HTML 到 Word 文档")
        print(f"[DocumentGenerator] 输出路径: {output_path}")
        print(f"[DocumentGenerator] 模板文件: {self.template_path}")
        print(f"[DocumentGenerator] 目录深度: {toc_depth}")

        try:
            # 步骤 1: 处理 Base64 图片
            processed_html, temp_files = self._extract_and_save_base64_images(html_content)
            print(f"[DocumentGenerator] 处理了 {len(temp_files)} 个 Base64 图片")

            try:
                # 步骤 2: 使用 pypandoc 进行转换
                # Pandoc 参数说明:
                #   -f html: 输入格式为 HTML
                #   -t docx: 输出格式为 Word
                #   --reference-doc: 使用模板文件（包含字体、页眉页脚、背景图等样式）
                #   --toc: 生成目录
                #   --toc-depth: 目录层级深度
                #   -o: 输出文件路径
                print(f"[DocumentGenerator] 调用 Pandoc 进行转换...")

                output_file = pypandoc.convert_text(
                    source=processed_html,
                    to='docx',
                    format='html',
                    output_file=output_path,
                    extra_args=[
                        f'--reference-doc={self.template_path}',
                        '--toc',
                        f'--toc-depth={toc_depth}'
                    ]
                )

                print(f"[DocumentGenerator] 转换成功！输出文件: {output_file}")

                # 特殊说明
                print("\n" + "="*70)
                print("重要提示: 目录页码")
                print("="*70)
                print("生成的文档已包含目录，但由于 Word 的机制限制，")
                print("用户在 Word 中打开文档后可能需要:")
                print("  1. 按 'F9' 键")
                print("  2. 或右键点击目录，选择'更新域' -> '更新整个目录'")
                print("这样才能看到最终的页码。")
                print("="*70 + "\n")

                return output_file

            finally:
                # 步骤 3: 清理临时文件
                self._cleanup_temp_files(temp_files)
                print(f"[DocumentGenerator] 已清理 {len(temp_files)} 个临时文件")

        except Exception as e:
            error_msg = f"HTML 到 Word 转换失败: {str(e)}"
            print(f"[DocumentGenerator] 错误: {error_msg}")
            raise RuntimeError(error_msg) from e


# 使用示例
if __name__ == "__main__":
    # 示例 HTML 内容
    example_html = """
    <html>
    <head>
        <title>示例文档</title>
    </head>
    <body>
        <h1>第一章：引言</h1>
        <p>这是引言的内容，可以包含各种格式。</p>

        <h2>1.1 背景</h2>
        <p>背景介绍...</p>

        <h3>1.1.1 技术背景</h3>
        <p>更详细的技术背景介绍...</p>

        <h1>第二章：数据分析</h1>
        <p>数据分析章节。</p>

        <h2>2.1 表格示例</h2>
        <table border="1">
            <tr>
                <th>列1</th>
                <th>列2</th>
                <th>列3</th>
            </tr>
            <tr>
                <td>数据1</td>
                <td>数据2</td>
                <td>数据3</td>
            </tr>
            <tr>
                <td>数据4</td>
                <td>数据5</td>
                <td>数据6</td>
            </tr>
        </table>

        <h2>2.2 图片示例</h2>
        <p>下面是一个 URL 图片：</p>
        <img src="https://example.com/image.png" alt="示例图片" />

        <p>下面是一个 Base64 图片：</p>
        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" alt="Base64 示例图片" />

        <h1>第三章：结论</h1>
        <p>结论内容...</p>
    </body>
    </html>
    """

    # 创建 DocumentGenerator 实例（确保项目根目录下有 reference_template.docx）
    generator = DocumentGenerator()

    # 转换 HTML 到 Word
    try:
        output_path = generator.html_to_docx(
            html_content=example_html,
            output_path="output.docx"
        )
        print(f"\n成功生成 Word 文档: {output_path}")
    except Exception as e:
        print(f"\n转换失败: {e}")
