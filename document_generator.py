import re
import base64
import tempfile
import os
import zipfile
import shutil
from pathlib import Path
from typing import Optional
import pypandoc


class DocumentGenerator:
    """
    使用 pypandoc 将 HTML 转换为格式完美的 Word 文档
    支持保留模板封面页
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

    def _merge_template_pages(self, output_path: str, document_title: str = "") -> None:
        """
        将模板的封面页、版权声明页、目录页合并到生成的文档中

        Args:
            output_path: Pandoc 生成的文档路径
            document_title: 文档标题（用于替换封面占位符）
        """
        print(f"[DocumentGenerator] 合并模板页面（封面+版权+目录）...")

        temp_output_dir = tempfile.mkdtemp(prefix='docx_output_')
        temp_template_dir = tempfile.mkdtemp(prefix='docx_template_')

        try:
            # 解压生成的文档
            with zipfile.ZipFile(output_path, 'r') as zip_ref:
                zip_ref.extractall(temp_output_dir)

            # 解压模板
            with zipfile.ZipFile(self.template_path, 'r') as zip_ref:
                zip_ref.extractall(temp_template_dir)

            # 读取模板的 document.xml
            template_doc_path = os.path.join(temp_template_dir, 'word', 'document.xml')
            with open(template_doc_path, 'r', encoding='utf-8') as f:
                template_doc = f.read()

            # 读取生成文档的 document.xml
            output_doc_path = os.path.join(temp_output_dir, 'word', 'document.xml')
            with open(output_doc_path, 'r', encoding='utf-8') as f:
                output_doc = f.read()

            # 提取模板的 body 内容
            template_body_match = re.search(r'<w:body[^>]*>(.*?)</w:body>', template_doc, re.DOTALL)
            if not template_body_match:
                print("[DocumentGenerator] 无法找到模板的 body 内容")
                return

            template_body = template_body_match.group(1)

            # 找到所有分页符位置
            page_breaks = list(re.finditer(r'<w:br\s+w:type="page"', template_body))
            print(f"[DocumentGenerator] 模板中找到 {len(page_breaks)} 个分页符")

            # 我们需要保留：封面页 + 版权声明页 + 目录页
            # 通常是前3个分页符之前的内容（封面后1个，版权后1个，目录后1个）
            # 或者找到第一个正文标题之前的所有内容

            # 策略：找到第一个使用正文标题样式的段落之前的所有内容
            heading_styles = ['47', '48', '49', '50', '2', '3', '4', '5']  # 亚信标题样式和标准样式
            content_start_pos = len(template_body)

            for para_match in re.finditer(r'<w:p\b[^>]*>(.*?)</w:p>', template_body, re.DOTALL):
                para_content = para_match.group(1)
                for style in heading_styles:
                    if f'<w:pStyle w:val="{style}"' in para_content:
                        # 检查这不是目录中的标题引用
                        if '<w:instrText' not in para_content and 'TOC' not in para_content:
                            if para_match.start() < content_start_pos:
                                content_start_pos = para_match.start()
                                print(f"[DocumentGenerator] 找到正文开始位置 (样式 {style})")
                            break

            # 如果没有找到标题，使用第3个分页符后的位置
            if content_start_pos == len(template_body) and len(page_breaks) >= 3:
                pb = page_breaks[2]
                para_end = template_body.find('</w:p>', pb.end())
                if para_end != -1:
                    content_start_pos = para_end + 6
                    print(f"[DocumentGenerator] 使用第3个分页符后作为正文开始位置")

            # 提取模板前置内容（封面+版权+目录）
            template_front_content = template_body[:content_start_pos].strip()

            if not template_front_content or len(template_front_content) < 100:
                print("[DocumentGenerator] 模板没有前置内容")
                return

            print(f"[DocumentGenerator] 提取了 {len(template_front_content)} 字符的模板前置内容")

            # 如果提供了文档标题，替换封面中的占位符
            if document_title:
                # 查找并替换常见的标题占位符
                placeholders = [
                    '文档标题', '项目名称', '方案名称',
                    '${title}', '{title}', '【标题】'
                ]
                for placeholder in placeholders:
                    if placeholder in template_front_content:
                        template_front_content = template_front_content.replace(
                            placeholder, document_title
                        )
                        print(f"[DocumentGenerator] 替换封面标题占位符: {placeholder} → {document_title}")

            # 在生成文档的 body 开头插入封面内容
            # 找到生成文档的 body 开始位置
            output_body_start = output_doc.find('<w:body')
            if output_body_start == -1:
                print("[DocumentGenerator] 无法找到生成文档的 body")
                return

            # 找到 <w:body> 标签的结束位置
            body_tag_end = output_doc.find('>', output_body_start) + 1

            # 插入模板前置内容（封面+版权+目录）
            new_output_doc = (
                output_doc[:body_tag_end] +
                '\n' + template_front_content + '\n' +
                output_doc[body_tag_end:]
            )

            # 保存修改后的 document.xml
            with open(output_doc_path, 'w', encoding='utf-8') as f:
                f.write(new_output_doc)

            # 复制模板中的图片到生成文档（如果不存在）
            template_media_dir = os.path.join(temp_template_dir, 'word', 'media')
            output_media_dir = os.path.join(temp_output_dir, 'word', 'media')

            if os.path.exists(template_media_dir):
                if not os.path.exists(output_media_dir):
                    os.makedirs(output_media_dir)

                for img_file in os.listdir(template_media_dir):
                    src = os.path.join(template_media_dir, img_file)
                    dst = os.path.join(output_media_dir, img_file)
                    if not os.path.exists(dst):
                        shutil.copy2(src, dst)
                        print(f"[DocumentGenerator] 复制图片: {img_file}")

            # 复制模板的 document.xml.rels（包含图片引用）
            template_rels = os.path.join(temp_template_dir, 'word', '_rels', 'document.xml.rels')
            output_rels = os.path.join(temp_output_dir, 'word', '_rels', 'document.xml.rels')

            if os.path.exists(template_rels) and os.path.exists(output_rels):
                # 合并 rels 文件
                with open(template_rels, 'r', encoding='utf-8') as f:
                    template_rels_content = f.read()
                with open(output_rels, 'r', encoding='utf-8') as f:
                    output_rels_content = f.read()

                # 提取模板中的图片关系
                img_relationships = re.findall(
                    r'<Relationship[^>]*Target="media/[^"]*"[^>]*/>',
                    template_rels_content
                )

                # 将不存在的关系添加到输出文件
                for rel in img_relationships:
                    if rel not in output_rels_content:
                        # 在 </Relationships> 前插入
                        output_rels_content = output_rels_content.replace(
                            '</Relationships>',
                            rel + '\n</Relationships>'
                        )

                with open(output_rels, 'w', encoding='utf-8') as f:
                    f.write(output_rels_content)

            # 重新打包文档
            with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for root, dirs, files in os.walk(temp_output_dir):
                    for file in files:
                        file_path = os.path.join(root, file)
                        arcname = os.path.relpath(file_path, temp_output_dir)
                        zipf.write(file_path, arcname)

            print(f"[DocumentGenerator] 模板页面合并完成")

        except Exception as e:
            print(f"[DocumentGenerator] 合并模板页面失败: {e}")
            import traceback
            traceback.print_exc()
        finally:
            # 清理临时目录
            shutil.rmtree(temp_output_dir, ignore_errors=True)
            shutil.rmtree(temp_template_dir, ignore_errors=True)

    def _apply_asiainfo_styles(self, output_path: str) -> None:
        """
        将 Pandoc 生成的标准样式替换为亚信安全样式，并为所有正文段落添加首行缩进

        样式映射：
        - heading 1 (2) → 标题 1（亚信安全）(47)
        - heading 2 (3) → 标题 2（亚信安全）(48)
        - heading 3 (4) → 标题 3（亚信安全）(49)
        - heading 4 (5) → 标题 4（亚信安全）(50)
        - FirstParagraph/BodyText → 正文首行缩进（亚信安全）(46)

        同时为所有普通段落添加首行缩进（2个中文字符）
        """
        print(f"[DocumentGenerator] 应用亚信安全样式...")

        temp_dir = tempfile.mkdtemp(prefix='docx_styles_')

        try:
            # 解压文档
            with zipfile.ZipFile(output_path, 'r') as zip_ref:
                zip_ref.extractall(temp_dir)

            # 读取 document.xml
            doc_path = os.path.join(temp_dir, 'word', 'document.xml')
            with open(doc_path, 'r', encoding='utf-8') as f:
                doc_content = f.read()

            # 样式映射
            style_mapping = {
                # Pandoc 标准 heading 样式
                '"2"': '"47"',   # heading 1 → 标题 1（亚信安全）
                '"3"': '"48"',   # heading 2 → 标题 2（亚信安全）
                '"4"': '"49"',   # heading 3 → 标题 3（亚信安全）
                '"5"': '"50"',   # heading 4 → 标题 4（亚信安全）
                # Pandoc 段落样式 → 正文首行缩进
                '"FirstParagraph"': '"46"',
                '"BodyText"': '"46"',
                '"Body Text"': '"46"',
                '"BodyText1"': '"46"',
                '"Compact"': '"46"',
            }

            # 替换样式
            replacements = 0
            for old_style, new_style in style_mapping.items():
                pattern = f'<w:pStyle w:val={old_style}/>'
                replacement = f'<w:pStyle w:val={new_style}/>'
                count = doc_content.count(pattern)
                if count > 0:
                    doc_content = doc_content.replace(pattern, replacement)
                    replacements += count
                    print(f"[DocumentGenerator]   替换 {old_style} → {new_style}: {count} 处")

            # 为所有普通段落添加首行缩进（没有样式的段落）
            # 排除：标题、表格、图片等
            heading_style_ids = ['47', '48', '49', '50', '2', '3', '4', '5', 'TOC', 'Heading']

            # 添加首行缩进到没有首行缩进的正文段落
            # 匹配 <w:pPr> 块，如果没有 <w:ind 或者没有 firstLineChars，则添加
            indent_added = 0

            def add_first_line_indent(match):
                nonlocal indent_added
                para_content = match.group(0)

                # 跳过标题段落
                for style_id in heading_style_ids:
                    if f'w:val="{style_id}"' in para_content:
                        return para_content

                # 跳过表格内容
                if '<w:tbl' in para_content or '</w:tbl>' in para_content:
                    return para_content

                # 检查是否已有首行缩进
                if 'firstLineChars' in para_content or 'firstLine=' in para_content:
                    return para_content

                # 检查是否有 <w:pPr>
                if '<w:pPr>' in para_content:
                    # 在 <w:pPr> 后添加首行缩进
                    if '<w:ind ' in para_content:
                        # 已有 w:ind，添加 firstLineChars 属性
                        para_content = re.sub(
                            r'<w:ind ([^>]*)/>',
                            r'<w:ind \1 w:firstLineChars="200"/>',
                            para_content
                        )
                    else:
                        # 没有 w:ind，添加完整的缩进设置
                        para_content = para_content.replace(
                            '<w:pPr>',
                            '<w:pPr><w:ind w:firstLineChars="200"/>'
                        )
                    indent_added += 1
                else:
                    # 没有 <w:pPr>，需要添加
                    # 在 <w:p> 或 <w:p ...> 后添加
                    para_content = re.sub(
                        r'(<w:p\b[^>]*>)',
                        r'\1<w:pPr><w:ind w:firstLineChars="200"/></w:pPr>',
                        para_content,
                        count=1
                    )
                    indent_added += 1

                return para_content

            # 处理每个段落
            doc_content = re.sub(r'<w:p\b[^>]*>.*?</w:p>', add_first_line_indent, doc_content, flags=re.DOTALL)
            print(f"[DocumentGenerator]   添加首行缩进: {indent_added} 处")

            # 保存修改后的 document.xml
            with open(doc_path, 'w', encoding='utf-8') as f:
                f.write(doc_content)

            # 重新打包
            with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for root, dirs, files in os.walk(temp_dir):
                    for file in files:
                        file_path = os.path.join(root, file)
                        arcname = os.path.relpath(file_path, temp_dir)
                        zipf.write(file_path, arcname)

            print(f"[DocumentGenerator] 样式替换完成，共 {replacements} 处样式替换，{indent_added} 处首行缩进")

        except Exception as e:
            print(f"[DocumentGenerator] 应用亚信安全样式失败: {e}")
            import traceback
            traceback.print_exc()
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

    def _apply_table_borders(self, output_path: str) -> None:
        """
        为所有表格添加完整的实线边框
        """
        print(f"[DocumentGenerator] 应用表格边框...")

        temp_dir = tempfile.mkdtemp(prefix='docx_tables_')

        try:
            # 解压文档
            with zipfile.ZipFile(output_path, 'r') as zip_ref:
                zip_ref.extractall(temp_dir)

            # 读取 document.xml
            doc_path = os.path.join(temp_dir, 'word', 'document.xml')
            with open(doc_path, 'r', encoding='utf-8') as f:
                doc_content = f.read()

            # 定义完整的表格边框样式
            table_borders = '''<w:tblBorders>
                <w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                <w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                <w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                <w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                <w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                <w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/>
            </w:tblBorders>'''

            cell_borders = '''<w:tcBorders>
                <w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                <w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                <w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>
                <w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>
            </w:tcBorders>'''

            tables_fixed = 0

            # 为每个表格添加边框
            def fix_table(match):
                nonlocal tables_fixed
                table_content = match.group(0)

                # 检查是否已有 tblBorders
                if '<w:tblBorders>' not in table_content:
                    # 在 <w:tblPr> 中添加边框
                    if '<w:tblPr>' in table_content:
                        table_content = table_content.replace(
                            '<w:tblPr>',
                            f'<w:tblPr>{table_borders}'
                        )
                    elif '<w:tblPr/>' in table_content:
                        table_content = table_content.replace(
                            '<w:tblPr/>',
                            f'<w:tblPr>{table_borders}</w:tblPr>'
                        )
                    tables_fixed += 1

                # 为每个单元格添加边框
                def fix_cell(cell_match):
                    cell_content = cell_match.group(0)
                    if '<w:tcBorders>' not in cell_content:
                        if '<w:tcPr>' in cell_content:
                            cell_content = cell_content.replace(
                                '<w:tcPr>',
                                f'<w:tcPr>{cell_borders}'
                            )
                        elif '<w:tcPr/>' in cell_content:
                            cell_content = cell_content.replace(
                                '<w:tcPr/>',
                                f'<w:tcPr>{cell_borders}</w:tcPr>'
                            )
                    return cell_content

                table_content = re.sub(r'<w:tc\b[^>]*>.*?</w:tc>', fix_cell, table_content, flags=re.DOTALL)
                return table_content

            doc_content = re.sub(r'<w:tbl\b[^>]*>.*?</w:tbl>', fix_table, doc_content, flags=re.DOTALL)
            print(f"[DocumentGenerator]   修复了 {tables_fixed} 个表格的边框")

            # 保存修改后的 document.xml
            with open(doc_path, 'w', encoding='utf-8') as f:
                f.write(doc_content)

            # 重新打包
            with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for root, dirs, files in os.walk(temp_dir):
                    for file in files:
                        file_path = os.path.join(root, file)
                        arcname = os.path.relpath(file_path, temp_dir)
                        zipf.write(file_path, arcname)

        except Exception as e:
            print(f"[DocumentGenerator] 应用表格边框失败: {e}")
            import traceback
            traceback.print_exc()
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

    def html_to_docx(
        self,
        html_content: str,
        output_path: str,
        document_title: str = "",
        preserve_template_pages: bool = True
    ) -> str:
        """
        将 HTML 内容转换为 Word 文档

        Args:
            html_content: HTML 内容，可以包含 h1-h3 标题、p 正文、table 表格、img 图片
            output_path: 输出的 Word 文档路径
            document_title: 文档标题（用于封面页，如果为空则根据内容自动生成）
            preserve_template_pages: 是否保留模板的封面页、版权页、目录页，默认为 True

        Returns:
            str: 生成的 Word 文档路径

        Raises:
            FileNotFoundError: 模板文件不存在
            RuntimeError: Pandoc 转换失败

        Special Note:
            生成的文档使用模板中的目录，用户在 Word 中打开文档后需要：
            按 "F9" 或右键点击目录选择"更新域"来更新目录页码。
        """
        print(f"[DocumentGenerator] 开始转换 HTML 到 Word 文档")
        print(f"[DocumentGenerator] 输出路径: {output_path}")
        print(f"[DocumentGenerator] 模板文件: {self.template_path}")
        print(f"[DocumentGenerator] 文档标题: {document_title or '(自动生成)'}")
        print(f"[DocumentGenerator] 保留模板页: {preserve_template_pages}")

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
                #   注意：不使用 --toc，目录使用模板中的
                print(f"[DocumentGenerator] 调用 Pandoc 进行转换...")

                output_file = pypandoc.convert_text(
                    source=processed_html,
                    to='docx',
                    format='html',
                    outputfile=output_path,
                    extra_args=[
                        f'--reference-doc={self.template_path}'
                    ]
                )

                print(f"[DocumentGenerator] 转换成功！输出文件: {output_file}")

                # 步骤 3: 合并模板页面（封面+版权+目录）
                if preserve_template_pages:
                    self._merge_template_pages(output_path, document_title)

                # 步骤 4: 应用亚信安全样式
                self._apply_asiainfo_styles(output_path)

                # 步骤 5: 应用表格边框
                self._apply_table_borders(output_path)

                # 特殊说明
                print("\n" + "="*70)
                print("重要提示: 更新目录")
                print("="*70)
                print("生成的文档使用模板中的目录，用户在 Word 中打开文档后需要:")
                print("  1. 右键点击目录，选择'更新域' -> '更新整个目录'")
                print("  2. 或选中目录后按 'F9' 键")
                print("这样才能看到正确的页码。")
                print("="*70 + "\n")

                return output_path

            finally:
                # 清理临时文件
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
