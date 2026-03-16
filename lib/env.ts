/**
 * Environment Variable Validation
 * Validates all required environment variables at startup
 */

interface EnvVar {
  key: string;
  description: string;
  required: boolean;
  defaultValue?: string;
  validate?: (value: string) => boolean;
  errorMessage?: string;
}

interface EnvValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Environment variable configuration
const ENV_CONFIG: EnvVar[] = [
  // Core Dify Configuration (Required)
  {
    key: 'NEXT_PUBLIC_DIFY_BASE_URL',
    description: 'Dify API base URL',
    required: true,
    validate: (value) => /^https?:\/\/.+/.test(value),
    errorMessage: 'Must be a valid HTTP(S) URL',
  },
  {
    key: 'NEXT_PUBLIC_DIFY_OUTLINE_KEY',
    description: 'Dify API key for outline generation',
    required: true,
    validate: (value) => value.startsWith('app-') && value.length > 10,
    errorMessage: 'Must start with "app-" and be at least 10 characters',
  },
  {
    key: 'NEXT_PUBLIC_DIFY_CHAPTER_KEY',
    description: 'Dify API key for chapter generation',
    required: true,
    validate: (value) => value.startsWith('app-') && value.length > 10,
    errorMessage: 'Must start with "app-" and be at least 10 characters',
  },
  {
    key: 'NEXT_PUBLIC_DIFY_LLM_KEY',
    description: 'Dify API key for LLM chat',
    required: true,
    validate: (value) => value.startsWith('app-') && value.length > 10,
    errorMessage: 'Must start with "app-" and be at least 10 characters',
  },

  // Optional Core Configuration
  {
    key: 'NODE_ENV',
    description: 'Node environment (development/production)',
    required: false,
    defaultValue: 'development',
    validate: (value) => ['development', 'production', 'test'].includes(value),
  },
  {
    key: 'PORT',
    description: 'Server port',
    required: false,
    defaultValue: '3000',
    validate: (value) => !isNaN(parseInt(value)) && parseInt(value) > 0,
  },

  // Redis Configuration (Optional)
  {
    key: 'REDIS_URL',
    description: 'Redis connection URL',
    required: false,
    defaultValue: 'redis://localhost:6379',
    validate: (value) => /^redis:\/\/.+/.test(value),
  },
  {
    key: 'CACHE_ENABLED',
    description: 'Enable Redis caching',
    required: false,
    defaultValue: '0',
    validate: (value) => ['0', '1', 'true', 'false'].includes(value),
  },

  // Logging Configuration (Optional)
  {
    key: 'LOG_LEVEL',
    description: 'Logging level',
    required: false,
    validate: (value) => ['debug', 'info', 'warn', 'error'].includes(value),
  },

  // CORS Configuration (Optional)
  {
    key: 'ALLOWED_ORIGINS',
    description: 'Allowed CORS origins (comma-separated)',
    required: false,
    defaultValue: '*',
  },

  // Cross-Origin Mode (Optional)
  {
    key: 'NEXT_PUBLIC_USE_CROSS_ORIGIN_MODE',
    description: 'Enable cross-origin iframe mode',
    required: false,
    defaultValue: 'false',
    validate: (value) => ['true', 'false'].includes(value),
  },

  // Python Path (Optional)
  {
    key: 'PYTHON_PATH',
    description: 'Path to Python executable',
    required: false,
    defaultValue: 'python3',
  },

  // Optional AI Providers (at least one recommended)
  {
    key: 'NEXT_PUBLIC_OPENAI_API_KEY',
    description: 'OpenAI API key',
    required: false,
  },
  {
    key: 'NEXT_PUBLIC_GEMINI_API_KEY',
    description: 'Google Gemini API key',
    required: false,
  },
  {
    key: 'NEXT_PUBLIC_KIMI_API_KEY',
    description: 'Kimi (Moonshot) API key',
    required: false,
  },
  {
    key: 'NEXT_PUBLIC_QWEN_API_KEY',
    description: 'Qwen (Tongyi Qianwen) API key',
    required: false,
  },
  {
    key: 'NEXT_PUBLIC_CLAUDE_API_KEY',
    description: 'Anthropic Claude API key',
    required: false,
  },
  {
    key: 'NEXT_PUBLIC_DEEPSEEK_API_KEY',
    description: 'DeepSeek API key',
    required: false,
  },
  {
    key: 'NEXT_PUBLIC_GROQ_API_KEY',
    description: 'Groq API key',
    required: false,
  },
  {
    key: 'NEXT_PUBLIC_COHERE_API_KEY',
    description: 'Cohere API key',
    required: false,
  },
  {
    key: 'NEXT_PUBLIC_WENXIN_API_KEY',
    description: 'Baidu Wenxin API key',
    required: false,
  },
  {
    key: 'NEXT_PUBLIC_ZHIPU_API_KEY',
    description: 'Zhipu AI API key',
    required: false,
  },
  {
    key: 'NEXT_PUBLIC_LANGCHAIN_API_KEY',
    description: 'LangChain API key',
    required: false,
  },
];

/**
 * Get environment variable value
 */
function getEnvValue(key: string): string | undefined {
  // Check process.env first
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }

  // Fallback for browser environment (Next.js injects NEXT_PUBLIC_ vars)
  if (typeof window !== 'undefined' && (window as any).__ENV__) {
    return (window as any).__ENV__[key];
  }

  return undefined;
}

/**
 * Validate environment variables
 */
export function validateEnvironment(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const config of ENV_CONFIG) {
    const value = getEnvValue(config.key);

    // Check required variables
    if (config.required && !value) {
      errors.push(
        `❌ Missing required environment variable: ${config.key}\n` +
        `   Description: ${config.description}\n` +
        `   ${config.defaultValue ? `Default: ${config.defaultValue}\n` : ''}` +
        `   ${config.errorMessage ? `Constraint: ${config.errorMessage}` : ''}`
      );
      continue;
    }

    // Check optional variables with defaults
    if (!config.required && !value && config.defaultValue) {
      warnings.push(
        `⚠️  Using default value for ${config.key}: ${config.defaultValue}`
      );
      continue;
    }

    // Validate value if present and validator exists
    if (value && config.validate && !config.validate(value)) {
      errors.push(
        `❌ Invalid value for ${config.key}: "${value}"\n` +
        `   Description: ${config.description}\n` +
        `   ${config.errorMessage || 'Value does not meet requirements'}`
      );
    }
  }

  // Check if at least one AI provider is configured
  const aiProviderKeys = [
    'NEXT_PUBLIC_DIFY_OUTLINE_KEY',  // Dify is required
    'NEXT_PUBLIC_OPENAI_API_KEY',
    'NEXT_PUBLIC_GEMINI_API_KEY',
    'NEXT_PUBLIC_KIMI_API_KEY',
    'NEXT_PUBLIC_QWEN_API_KEY',
    'NEXT_PUBLIC_CLAUDE_API_KEY',
    'NEXT_PUBLIC_DEEPSEEK_API_KEY',
  ];

  const configuredProviders = aiProviderKeys.filter(key => getEnvValue(key));

  if (configuredProviders.length === 0) {
    errors.push(
      `❌ No AI provider configured!\n` +
      `   At least one AI provider API key must be set.`
    );
  } else if (configuredProviders.length === 1) {
    warnings.push(
      `⚠️  Only one AI provider configured: ${configuredProviders[0]}\n` +
      `   Consider configuring additional providers for fallback.`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate and throw error if invalid
 */
export function validateEnvironmentOrThrow(): void {
  const result = validateEnvironment();

  // Print warnings
  if (result.warnings.length > 0) {
    console.warn('\n🔧 Environment Configuration Warnings:\n');
    result.warnings.forEach(warning => console.warn(warning));
    console.warn('');
  }

  // Throw error if validation failed
  if (!result.valid) {
    console.error('\n🚨 Environment Configuration Errors:\n');
    result.errors.forEach(error => console.error(error));
    console.error('\n📝 Configuration Help:');
    console.error('   1. Copy .env.example to .env.local');
    console.error('   2. Fill in all required environment variables');
    console.error('   3. Restart the application\n');

    throw new Error(
      'Environment validation failed. Check the errors above and update your .env.local file.'
    );
  }

  console.log('✅ Environment validation passed');
}

/**
 * Get typed environment variable
 */
export function getEnv(key: string, defaultValue?: string): string {
  const value = getEnvValue(key);
  return value || defaultValue || '';
}

/**
 * Get required environment variable (throws if missing)
 */
export function getRequiredEnv(key: string): string {
  const value = getEnvValue(key);
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Get boolean environment variable
 */
export function getEnvBool(key: string, defaultValue = false): boolean {
  const value = getEnvValue(key);
  if (!value) return defaultValue;
  return value === '1' || value.toLowerCase() === 'true';
}

/**
 * Get number environment variable
 */
export function getEnvNumber(key: string, defaultValue?: number): number {
  const value = getEnvValue(key);
  if (!value) return defaultValue || 0;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? (defaultValue || 0) : parsed;
}

/**
 * Generate .env.example file content
 */
export function generateEnvExample(): string {
  const lines: string[] = [
    '# AI Document Generator - Environment Configuration',
    '# Copy this file to .env.local and fill in your values',
    '',
    '# ======================',
    '# Core Configuration',
    '# ======================',
    '',
  ];

  let currentSection = '';

  for (const config of ENV_CONFIG) {
    // Determine section
    let section = 'Other';
    if (config.key.includes('DIFY')) section = 'Dify Configuration';
    else if (config.key.includes('REDIS')) section = 'Redis Configuration';
    else if (config.key.includes('LOG')) section = 'Logging Configuration';
    else if (config.key.includes('OPENAI') || config.key.includes('GEMINI') ||
             config.key.includes('CLAUDE') || config.key.includes('KIMI') ||
             config.key.includes('QWEN') || config.key.includes('DEEPSEEK')) {
      section = 'AI Providers (Optional)';
    }

    // Add section header if changed
    if (section !== currentSection) {
      lines.push('', `# ======================`, `# ${section}`, `# ======================`, '');
      currentSection = section;
    }

    // Add comment
    lines.push(`# ${config.description}`);
    if (config.required) {
      lines.push('# REQUIRED');
    }
    if (config.errorMessage) {
      lines.push(`# Constraint: ${config.errorMessage}`);
    }

    // Add variable
    const placeholder = config.defaultValue || 'your-value-here';
    lines.push(`${config.key}=${placeholder}`);
    lines.push('');
  }

  return lines.join('\n');
}

// Run validation in server-side code
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  try {
    validateEnvironmentOrThrow();
  } catch (error) {
    // Allow import but log error
    if (process.env.NODE_ENV === 'development') {
      console.error(error);
    }
  }
}

export default {
  validate: validateEnvironment,
  validateOrThrow: validateEnvironmentOrThrow,
  getEnv,
  getRequiredEnv,
  getEnvBool,
  getEnvNumber,
  generateEnvExample,
};
