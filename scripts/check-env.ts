#!/usr/bin/env tsx

/**
 * Validate environment variables without starting the application
 * Usage: npm run env:check
 */

import { validateEnvironment, generateEnvExample } from '../lib/env';
import * as fs from 'fs';
import * as path from 'path';

const command = process.argv[2];

if (command === 'generate') {
  // Generate .env.example file
  const content = generateEnvExample();
  const outputPath = path.join(process.cwd(), '.env.example');

  fs.writeFileSync(outputPath, content, 'utf-8');

  console.log(`\n✅ Generated .env.example at ${outputPath}\n`);
  console.log('Next steps:');
  console.log('  1. cp .env.example .env.local');
  console.log('  2. Edit .env.local with your actual values');
  console.log('  3. Run: npm run env:check\n');
  process.exit(0);
}

// Default: validate current environment
console.log('\n🔍 Validating environment configuration...\n');

const result = validateEnvironment();

// Print warnings
if (result.warnings.length > 0) {
  console.log('⚠️  Warnings:\n');
  result.warnings.forEach(warning => console.log(warning));
  console.log('');
}

// Print errors or success
if (!result.valid) {
  console.error('❌ Validation failed:\n');
  result.errors.forEach(error => console.error(error));
  console.error('\n📝 Quick fix:');
  console.error('  1. Check .env.local exists');
  console.error('  2. Compare with .env.example');
  console.error('  3. Fill in missing required values\n');
  console.error('💡 Generate template: npm run env:generate\n');
  process.exit(1);
} else {
  console.log('✅ Environment validation passed!\n');
  console.log('All required environment variables are configured correctly.\n');
  process.exit(0);
}
