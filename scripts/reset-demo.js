/**
 * UNLOCKLAB - RESET DEMO SCRIPT
 * Safely restores clean baseline demo data.
 */

import { api } from '../src/lib/supabase.js';

console.log('🔄 Resetting UnlockLab demo data to clean seed baseline...');
api.resetDemoData();
console.log('✅ Demo data reset completed. Clean state restored.');

