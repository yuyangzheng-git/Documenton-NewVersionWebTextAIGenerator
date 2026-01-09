import fs from 'fs/promises';
import path from 'path';

/**
 * 本地模板存储管理
 * 用于存储和管理用户上传的自定义模板
 */

const TEMPLATES_DIR = path.join(process.cwd(), 'data', 'templates');

export interface StoredTemplate {
  id: string;
  name: string;
  originalName: string;
  filePath: string;
  uploadedAt: string;
  fileSize: number;
}

/**
 * 确保模板目录存在
 */
async function ensureTemplatesDir(): Promise<void> {
  try {
    await fs.mkdir(TEMPLATES_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create templates directory:', error);
  }
}

/**
 * 保存模板到本地存储
 */
export async function saveTemplate(
  fileBuffer: Buffer,
  originalName: string
): Promise<StoredTemplate> {
  await ensureTemplatesDir();

  const templateId = generateTemplateId();
  const fileName = `${templateId}.docx`;
  const filePath = path.join(TEMPLATES_DIR, fileName);

  await fs.writeFile(filePath, fileBuffer);

  const template: StoredTemplate = {
    id: templateId,
    name: originalName.replace('.docx', ''),
    originalName,
    filePath,
    uploadedAt: new Date().toISOString(),
    fileSize: fileBuffer.length,
  };

  return template;
}

/**
 * 从本地存储加载模板
 */
export async function loadTemplate(templateId: string): Promise<Buffer | null> {
  try {
    await ensureTemplatesDir();
    const filePath = path.join(TEMPLATES_DIR, `${templateId}.docx`);
    const buffer = await fs.readFile(filePath);
    return buffer;
  } catch (error) {
    console.error('Failed to load template:', error);
    return null;
  }
}

/**
 * 删除模板
 */
export async function deleteTemplate(templateId: string): Promise<boolean> {
  try {
    const filePath = path.join(TEMPLATES_DIR, `${templateId}.docx`);
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error('Failed to delete template:', error);
    return false;
  }
}

/**
 * 获取所有模板列表
 */
export async function listTemplates(): Promise<StoredTemplate[]> {
  try {
    await ensureTemplatesDir();
    const files = await fs.readdir(TEMPLATES_DIR);
    const templates: StoredTemplate[] = [];

    for (const file of files) {
      if (file.endsWith('.docx')) {
        const templateId = file.replace('.docx', '');
        const filePath = path.join(TEMPLATES_DIR, file);
        const stats = await fs.stat(filePath);

        templates.push({
          id: templateId,
          name: file.replace('.docx', ''),
          originalName: file,
          filePath,
          uploadedAt: stats.mtime.toISOString(),
          fileSize: stats.size,
        });
      }
    }

    return templates.sort((a, b) =>
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
  } catch (error) {
    console.error('Failed to list templates:', error);
    return [];
  }
}

/**
 * 生成模板 ID
 */
function generateTemplateId(): string {
  return `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * 清理过期模板 (可选)
 */
export async function cleanupOldTemplates(daysOld: number = 30): Promise<number> {
  try {
    const templates = await listTemplates();
    const now = new Date();
    let deletedCount = 0;

    for (const template of templates) {
      const uploadDate = new Date(template.uploadedAt);
      const ageInDays = (now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60 * 24);

      if (ageInDays > daysOld) {
        await deleteTemplate(template.id);
        deletedCount++;
      }
    }

    return deletedCount;
  } catch (error) {
    console.error('Failed to cleanup old templates:', error);
    return 0;
  }
}
