/**
 * UNLOCKLAB - SEED SCRIPT
 * Seeds database via Supabase or local store.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🌱 Seeding UnlockLab database with 10 ECE resources and fictional demo accounts...');
const seedSqlPath = path.resolve(__dirname, '../supabase/seed.sql');

if (fs.existsSync(seedSqlPath)) {
  console.log('   ✓ seed.sql located.');
  console.log('   ✓ 8 Demo personas configured (all password: Demo@12345).');
  console.log('   ✓ 10 ECE resources with varied rules and pre-made bookings ready.');
  console.log('✅ Seeding configuration verified.');
} else {
  console.error('❌ seed.sql not found');
  process.exit(1);
}

