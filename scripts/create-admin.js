/**
 * UNLOCKLAB - SECURE ADMIN PROVISIONING CLI TOOL
 *
 * Usage:
 *   node scripts/create-admin.js <email> <password> "<Full Name>" [departmentCode]
 *
 * Example:
 *   node scripts/create-admin.js director@apex.edu SuperSecret#2026 "Dr. Alistair Vance" INTER
 */

import { getDb, hashPassword } from '../server/db.js';
import crypto from 'node:crypto';

const args = process.argv.slice(2);
if (args.length < 3) {
  console.log('\n❌ Usage: node scripts/create-admin.js <email> <password> "<Full Name>" [departmentCode]');
  console.log('   Example: node scripts/create-admin.js labadmin@apex.edu SafePass123! "Dr. Maya Lin" INTER\n');
  process.exit(1);
}

const [email, password, fullName, deptCode = 'INTER'] = args;
const normalizedEmail = email.trim().toLowerCase();

const db = getDb();

// Find department
const dept = db.prepare('SELECT id, name FROM departments WHERE code = ? OR id = ?').get(deptCode.toUpperCase(), deptCode);
const deptId = dept ? dept.id : 'dept-inter';

// Check if user already exists
const existing = db.prepare('SELECT id, role FROM users WHERE email = ?').get(normalizedEmail);

if (existing) {
  if (existing.role === 'admin') {
    // Update password
    const { hash, salt } = hashPassword(password);
    db.prepare('UPDATE users SET password_hash = ?, password_salt = ?, full_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
      hash, salt, fullName.trim(), existing.id
    );
    console.log(`\n✅ Existing admin account (${normalizedEmail}) password updated successfully.`);
  } else {
    // Promote user to admin
    const { hash, salt } = hashPassword(password);
    db.prepare("UPDATE users SET role = 'admin', password_hash = ?, password_salt = ?, full_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(
      hash, salt, fullName.trim(), existing.id
    );
    console.log(`\n✅ User (${normalizedEmail}) securely promoted to Administrator role.`);
  }
} else {
  // Create new admin
  const adminId = `usr-${crypto.randomUUID()}`;
  const { hash, salt } = hashPassword(password);
  db.prepare(`
    INSERT INTO users (id, email, password_hash, password_salt, full_name, role, department_id, academic_program)
    VALUES (?, ?, ?, ?, ?, 'admin', ?, 'Campus Laboratory Administration')
  `).run(adminId, normalizedEmail, hash, salt, fullName.trim(), deptId);

  db.prepare(`
    INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, details)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(`aud-${Date.now()}`, adminId, 'ADMIN_MANUALLY_PROVISIONED', 'user', adminId, JSON.stringify({ email: normalizedEmail }));

  console.log(`\n✅ New Administrator provisioned successfully:`);
  console.log(`   ID:    ${adminId}`);
  console.log(`   Email: ${normalizedEmail}`);
  console.log(`   Name:  ${fullName.trim()}`);
  console.log(`   Role:  admin (Server-enforced)\n`);
}

process.exit(0);

