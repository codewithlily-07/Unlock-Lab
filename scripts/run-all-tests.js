/**
 * UNLOCKLAB - COMPREHENSIVE TEST SUITE PIPELINE
 * Executes:
 * 1. Database tests (pgTAP / hardened assertions)
 * 2. Playwright/API End-to-end full 10-step journey
 * 3. Vite build verification
 */

import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function runStep(name, command, args) {
  console.log(`\n======================================================`);
  console.log(`▶️ RUNNING: ${name}`);
  console.log(`======================================================`);

  const result = spawnSync(command, args, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true,
  });

  if (result.status !== 0) {
    console.error(`\n❌ FAILED: ${name}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${name}`);
}

console.log('\n🚀 STARTING COMPLETE UNLOCKLAB AUTOMATED VERIFICATION');

// 1. Database tests
runStep('1. Database Schema, State Machine & Security Tests', 'node', ['supabase/tests/run_db_tests.js']);

// 2. E2E Lifecycle test
runStep('2. Full 10-Step Lifecycle E2E Journey Test', 'node', ['tests/e2e.test.js']);

// 3. Vite production bundle verification
runStep('3. Vite Frontend Production Build Verification', 'npm', ['run', 'build']);

console.log('\n======================================================');
console.log('🏆 ALL TESTS AND BUILDS PASSED SUCCESSFULLY!');
console.log('======================================================\n');
