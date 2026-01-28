#!/usr/bin/env node

/**
 * Dify API Keys 测试脚本
 *
 * 使用方法:
 * node scripts/test-dify-keys.js
 *
 * 环境变量 (在 .env.local 中配置):
 * - NEXT_PUBLIC_DIFY_BASE_URL
 * - NEXT_PUBLIC_DIFY_OUTLINE_KEY
 * - NEXT_PUBLIC_DIFY_CHAPTER_KEY
 * - NEXT_PUBLIC_DIFY_LLM_KEY
 */

const https = require('https');
const http = require('http');

const dotenv = require('dotenv');
const path = require('path');

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// 配置
const DIFY_BASE_URL = process.env.NEXT_PUBLIC_DIFY_BASE_URL || '';
const OUTLINE_KEY = process.env.NEXT_PUBLIC_DIFY_OUTLINE_KEY || '';
const CHAPTER_KEY = process.env.NEXT_PUBLIC_DIFY_CHAPTER_KEY || '';
const LLM_KEY = process.env.NEXT_PUBLIC_DIFY_LLM_KEY || '';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.cyan);
  console.log('='.repeat(60));
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ ${message}`, colors.blue);
}

// HTTP 请求函数
function makeRequest(url, method, headers, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname,
      method,
      headers,
    };

    const req = client.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.headers,
          data,
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// 测试 Dify API 连接
async function testDifyAPI(apiKey, keyType) {
  if (!apiKey) {
    return { success: false, message: 'API Key 未配置' };
  }

  if (!DIFY_BASE_URL) {
    return { success: false, message: 'DIFY_BASE_URL 未配置' };
  }

  try {
    const url = `${DIFY_BASE_URL}/workflows/run`;
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };
    const body = {
      inputs: {},
      response_mode: 'blocking',
      user: 'test',
    };

    const response = await makeRequest(url, 'POST', headers, body);

    if (response.statusCode === 200 || response.statusCode === 201) {
      return { success: true, message: '连接成功' };
    } else {
      return {
        success: false,
        message: `HTTP ${response.statusCode}: ${response.statusMessage}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error.message || '连接失败',
    };
  }
}

// 主函数
async function main() {
  logSection('Dify API Keys 测试');

  // 显示配置信息
  logInfo('配置信息:');
  console.log(`  Base URL: ${DIFY_BASE_URL || '未配置'}`);
  console.log(`  Outline Key: ${OUTLINE_KEY ? '已配置' : '未配置'}`);
  console.log(`  Chapter Key: ${CHAPTER_KEY ? '已配置' : '未配置'}`);
  console.log(`  LLM Key: ${LLM_KEY ? '已配置' : '未配置'}`);

  // 检查必需配置
  if (!DIFY_BASE_URL) {
    logError('缺少必需的配置: NEXT_PUBLIC_DIFY_BASE_URL');
    logInfo('请在 .env.local 文件中配置以下环境变量:');
    console.log('  NEXT_PUBLIC_DIFY_BASE_URL=https://your-dify-instance.com/v1');
    console.log('  NEXT_PUBLIC_DIFY_OUTLINE_KEY=app-xxxxxxxxxxxx');
    console.log('  NEXT_PUBLIC_DIFY_CHAPTER_KEY=app-xxxxxxxxxxxx');
    console.log('  NEXT_PUBLIC_DIFY_LLM_KEY=app-xxxxxxxxxxxx');
    process.exit(1);
  }

  // 测试大纲 API Key
  logSection('测试大纲写作 API Key');
  const outlineResult = await testDifyAPI(OUTLINE_KEY, 'outline');
  if (outlineResult.success) {
    logSuccess(`大纲写作 API Key: ${outlineResult.message}`);
  } else {
    logError(`大纲写作 API Key: ${outlineResult.message}`);
  }

  // 测试章节 API Key
  logSection('测试正文写作 API Key');
  const chapterResult = await testDifyAPI(CHAPTER_KEY, 'chapter');
  if (chapterResult.success) {
    logSuccess(`正文写作 API Key: ${chapterResult.message}`);
  } else {
    logError(`正文写作 API Key: ${chapterResult.message}`);
  }

  // 测试 LLM API Key
  logSection('测试 LLM 对话 API Key');
  const llmResult = await testDifyAPI(LLM_KEY, 'llm');
  if (llmResult.success) {
    logSuccess(`LLM 对话 API Key: ${llmResult.message}`);
  } else {
    logError(`LLM 对话 API Key: ${llmResult.message}`);
  }

  // 总结
  logSection('测试总结');

  const allSuccess = outlineResult.success && chapterResult.success && llmResult.success;
  const allFailed = !outlineResult.success && !chapterResult.success && !llmResult.success;

  if (allSuccess) {
    logSuccess('所有 API Key 测试通过！✨');
    logInfo('现在可以开始使用应用了。');
    process.exit(0);
  } else if (allFailed) {
    logError('所有 API Key 测试失败。');
    logInfo('请检查以下事项:');
    console.log('  1. DIFY_BASE_URL 是否正确');
    console.log('  2. API Key 是否有效');
    console.log('  3. Dify 实例是否可访问');
    console.log('  4. Workflow 是否已创建并发布');
    process.exit(1);
  } else {
    logWarning('部分 API Key 测试失败。');
    logInfo('请检查失败的 API Key 配置。');
    process.exit(1);
  }
}

// 运行
main().catch((error) => {
  logError(`脚本执行失败: ${error.message}`);
  console.error(error);
  process.exit(1);
});
