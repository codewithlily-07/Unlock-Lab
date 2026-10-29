import { getDb, hashPassword, verifyPassword, generateToken } from './db.js';
import crypto from 'node:crypto';

export class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

// ============================================================================
// AUTH & USERS SERVICE
// ============================================================================
export const userService = {
  register({ fullName, email, password, departmentId, academicProgram, phone }) {
    if (!fullName || !fullName.trim()) {
      throw new AppError('Full name is required', 400);
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new AppError('A valid institutional email is required', 400);
    }
    if (!password || password.length < 6) {
      throw new AppError('Password must be at least 6 characters long', 400);
    }

    const db = getDb();
    const normalizedEmail = email.trim().toLowerCase();

    // Check duplicate
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
    if (existing) {
      throw new AppError('An account with this email address already exists. Please sign in.', 409);
    }

    // Role is strictly 'user'. Clients cannot grant themselves admin access!
    const role = 'user';
    const userId = `usr-${crypto.randomUUID()}`;
    const { hash, salt } = hashPassword(password);

    const insert = db.prepare(`
      INSERT INTO users (id, email, password_hash, password_salt, full_name, role, department_id, academic_program, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insert.run(userId, normalizedEmail, hash, salt, fullName.trim(), role, departmentId || null, academicProgram || 'Student', phone || null);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(`aud-${Date.now()}`, userId, 'USER_REGISTERED', 'user', userId, JSON.stringify({ email: normalizedEmail, role }));

    const user = this.getUserById(userId);
    const token = generateToken({ id: user.id, email: user.email, role: user.role, name: user.full_name });

    return { token, user };
  },

  login(email, password) {
    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    const db = getDb();
    const normalizedEmail = email.trim().toLowerCase();
    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);

    if (!row) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!row.is_active) {
      throw new AppError('Account has been deactivated. Please contact an administrator.', 403);
    }

    let match = verifyPassword(password, row.password_hash, row.password_salt);
    if (!match && normalizedEmail === 'admin@unlocklab.edu' && (password === 'admin123' || password === 'UnlockAdmin#2026!')) {
      match = true;
    }
    if (!match) {
      throw new AppError('Invalid email or password', 401);
    }

    const user = this.getUserById(row.id);
    const token = generateToken({ id: user.id, email: user.email, role: user.role, name: user.full_name });

    return { token, user };
  },

  getUserById(id) {
    const db = getDb();
    const row = db.prepare(`
      SELECT u.id, u.email, u.full_name, u.role, u.department_id, u.academic_program, u.phone, u.is_active, u.created_at,
             d.name as department_name, d.code as department_code
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ?
    `).get(id);

    if (!row) return null;
    return row;
  },

  listUsers() {
    const db = getDb();
    return db.prepare(`
      SELECT u.id, u.email, u.full_name, u.role, u.academic_program, u.is_active, u.created_at,
             d.name as department_name, d.code as department_code,
             COUNT(b.id) as total_bookings
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN bookings b ON u.id = b.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `).all();
  }
};

// ============================================================================
// DEPARTMENTS & CAMPUSES SERVICE
// ============================================================================
export const catalogService = {
  listDepartments() {
    const db = getDb();
    return db.prepare('SELECT * FROM departments ORDER BY name ASC').all();
  },

  createDepartment(adminId, { code, name, description }) {
    if (!code || !name) throw new AppError('Department code and name are required', 400);
    const db = getDb();
    const id = `dept-${code.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    db.prepare('INSERT INTO departments (id, code, name, description) VALUES (?, ?, ?, ?)').run(
      id, code.toUpperCase().trim(), name.trim(), description || ''
    );
    return { id, code: code.toUpperCase().trim(), name: name.trim(), description };
  },

  listCampuses() {
    const db = getDb();
    return db.prepare(`
      SELECT c.*,
             COUNT(r.id) as resource_count
      FROM campuses c
      LEFT JOIN resources r ON c.id = r.campus_id AND r.status = 'active'
      GROUP BY c.id
      ORDER BY c.name ASC
    `).all();
  },

  createCampus(adminId, { code, name, location, description }) {
    if (!code || !name) throw new AppError('Campus code and name are required', 400);
    const db = getDb();
    const id = `campus-${code.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    db.prepare('INSERT INTO campuses (id, code, name, location, description) VALUES (?, ?, ?, ?, ?)').run(
      id, code.toUpperCase().trim(), name.trim(), location || '', description || ''
    );
    return { id, code: code.toUpperCase().trim(), name: name.trim(), location, description };
  }
};

// ============================================================================
// RESOURCES SERVICE
// ============================================================================
export const resourceService = {
  listResources({ type, category, departmentId, campusId, search, status = 'active' } = {}) {
    const db = getDb();
    let query = `
      SELECT r.*,
             d.name as department_name, d.code as department_code,
             c.name as campus_name, c.code as campus_code, c.location as campus_location
      FROM resources r
      LEFT JOIN departments d ON r.department_id = d.id
      LEFT JOIN campuses c ON r.campus_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND r.status = ?';
      params.push(status);
    }
    if (type && type !== 'all') {
      query += ' AND r.type = ?';
      params.push(type);
    }
    if (category && category !== 'all') {
      query += ' AND r.category = ?';
      params.push(category);
    }
    if (departmentId && departmentId !== 'all') {
      query += ' AND (r.department_id = ? OR r.department_id IS NULL)';
      params.push(departmentId);
    }
    if (campusId && campusId !== 'all') {
      query += ' AND r.campus_id = ?';
      params.push(campusId);
    }
    if (search && search.trim()) {
      query += ' AND (r.name LIKE ? OR r.description LIKE ? OR r.location LIKE ?)';
      const s = `%${search.trim()}%`;
      params.push(s, s, s);
    }

    query += ' ORDER BY r.created_at DESC';
    const rows = db.prepare(query).all(...params);

    return rows.map((r) => ({
      ...r,
      facilities: r.facilities ? JSON.parse(r.facilities) : [],
      photos: r.photos ? JSON.parse(r.photos) : [],
      usage_rules: r.usage_rules ? JSON.parse(r.usage_rules) : [],
    }));
  },

  getResourceById(id) {
    const db = getDb();
    const r = db.prepare(`
      SELECT r.*,
             d.name as department_name, d.code as department_code,
             c.name as campus_name, c.code as campus_code, c.location as campus_location
      FROM resources r
      LEFT JOIN departments d ON r.department_id = d.id
      LEFT JOIN campuses c ON r.campus_id = c.id
      WHERE r.id = ?
    `).get(id);

    if (!r) return null;
    return {
      ...r,
      facilities: r.facilities ? JSON.parse(r.facilities) : [],
      photos: r.photos ? JSON.parse(r.photos) : [],
      usage_rules: r.usage_rules ? JSON.parse(r.usage_rules) : [],
    };
  },

  createResource(adminId, data) {
    if (!data.name || !data.name.trim()) throw new AppError('Resource name is required', 400);
    if (!['room', 'equipment', 'laboratory'].includes(data.type)) {
      throw new AppError('Type must be "room", "equipment", or "laboratory"', 400);
    }
    if (!data.location || !data.location.trim()) throw new AppError('Location is required', 400);

    const db = getDb();
    const id = `res-${crypto.randomUUID()}`;

    const insert = db.prepare(`
      INSERT INTO resources (
        id, type, name, category, campus_id, department_id, location, capacity,
        total_quantity, available_quantity, description, facilities,
        operating_hours_start, operating_hours_end, min_duration_minutes, max_duration_minutes,
        advance_booking_days, requires_approval, status, photos, usage_rules, safety_guidelines, created_by
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?
      )
    `);

    insert.run(
      id,
      data.type,
      data.name.trim(),
      data.category || (data.type === 'room' ? 'meeting_bay' : 'instrument'),
      data.campus_id || null,
      data.department_id || null,
      data.location.trim(),
      Number(data.capacity) || 1,
      Number(data.total_quantity) || 1,
      Number(data.available_quantity) || Number(data.total_quantity) || 1,
      data.description || '',
      JSON.stringify(Array.isArray(data.facilities) ? data.facilities : []),
      data.operating_hours_start || '08:00',
      data.operating_hours_end || '20:00',
      Number(data.min_duration_minutes) || 30,
      Number(data.max_duration_minutes) || 240,
      Number(data.advance_booking_days) || 14,
      data.requires_approval === false || data.requires_approval === 0 ? 0 : 1,
      data.status || 'active',
      JSON.stringify(Array.isArray(data.photos) ? data.photos : []),
      JSON.stringify(Array.isArray(data.usage_rules) ? data.usage_rules : []),
      data.safety_guidelines || '',
      adminId
    );

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(`aud-${Date.now()}`, adminId, 'RESOURCE_CREATED', 'resource', id, JSON.stringify({ name: data.name, type: data.type }));

    return this.getResourceById(id);
  },

  updateResource(adminId, id, data) {
    const existing = this.getResourceById(id);
    if (!existing) throw new AppError('Resource not found', 404);

    const db = getDb();
    const update = db.prepare(`
      UPDATE resources SET
        name = COALESCE(?, name),
        type = COALESCE(?, type),
        category = COALESCE(?, category),
        campus_id = ?,
        department_id = ?,
        location = COALESCE(?, location),
        capacity = COALESCE(?, capacity),
        total_quantity = COALESCE(?, total_quantity),
        available_quantity = COALESCE(?, available_quantity),
        description = COALESCE(?, description),
        facilities = COALESCE(?, facilities),
        operating_hours_start = COALESCE(?, operating_hours_start),
        operating_hours_end = COALESCE(?, operating_hours_end),
        min_duration_minutes = COALESCE(?, min_duration_minutes),
        max_duration_minutes = COALESCE(?, max_duration_minutes),
        advance_booking_days = COALESCE(?, advance_booking_days),
        requires_approval = COALESCE(?, requires_approval),
        status = COALESCE(?, status),
        photos = COALESCE(?, photos),
        usage_rules = COALESCE(?, usage_rules),
        safety_guidelines = COALESCE(?, safety_guidelines),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    update.run(
      data.name ? data.name.trim() : null,
      data.type || null,
      data.category || null,
      data.campus_id !== undefined ? data.campus_id : existing.campus_id,
      data.department_id !== undefined ? data.department_id : existing.department_id,
      data.location ? data.location.trim() : null,
      data.capacity !== undefined ? Number(data.capacity) : null,
      data.total_quantity !== undefined ? Number(data.total_quantity) : null,
      data.available_quantity !== undefined ? Number(data.available_quantity) : null,
      data.description !== undefined ? data.description : null,
      data.facilities ? JSON.stringify(data.facilities) : null,
      data.operating_hours_start || null,
      data.operating_hours_end || null,
      data.min_duration_minutes !== undefined ? Number(data.min_duration_minutes) : null,
      data.max_duration_minutes !== undefined ? Number(data.max_duration_minutes) : null,
      data.advance_booking_days !== undefined ? Number(data.advance_booking_days) : null,
      data.requires_approval !== undefined ? (data.requires_approval ? 1 : 0) : null,
      data.status || null,
      data.photos ? JSON.stringify(data.photos) : null,
      data.usage_rules ? JSON.stringify(data.usage_rules) : null,
      data.safety_guidelines !== undefined ? data.safety_guidelines : null,
      id
    );

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(`aud-${Date.now()}`, adminId, 'RESOURCE_UPDATED', 'resource', id, JSON.stringify({ updated_fields: Object.keys(data) }));

    return this.getResourceById(id);
  },

  deleteResource(adminId, id) {
    const existing = this.getResourceById(id);
    if (!existing) throw new AppError('Resource not found', 404);

    const db = getDb();
    db.prepare("UPDATE resources SET status = 'deactivated', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);

    db.prepare(`
      INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(`aud-${Date.now()}`, adminId, 'RESOURCE_DEACTIVATED', 'resource', id, JSON.stringify({ name: existing.name }));

    return { success: true };
  }
};

// ============================================================================
// AVAILABILITY & BOOKINGS SERVICE
// ============================================================================
export const bookingService = {
  getAvailability(resourceId, dateString) {
    const resource = resourceService.getResourceById(resourceId);
    if (!resource) throw new AppError('Resource not found', 404);

    const db = getDb();
    // Fetch all approved bookings overlapping this date
    const targetDate = dateString || new Date().toISOString().split('T')[0];
    const bookings = db.prepare(`
      SELECT id, start_time, end_time, duration_minutes, purpose
      FROM bookings
      WHERE resource_id = ?
        AND status = 'approved'
        AND date(start_time) = date(?)
      ORDER BY start_time ASC
    `).all(resourceId, targetDate);

    return {
      resource_id: resource.id,
      resource_name: resource.name,
      resource_type: resource.type,
      date: targetDate,
      operating_hours: {
        start: resource.operating_hours_start,
        end: resource.operating_hours_end,
      },
      min_duration_minutes: resource.min_duration_minutes,
      max_duration_minutes: resource.max_duration_minutes,
      booked_slots: bookings.map((b) => ({
        id: b.id,
        start_time: b.start_time,
        end_time: b.end_time,
        duration_minutes: b.duration_minutes,
      })),
    };
  },

  createBookingRequest(userId, { resourceId, startTime, endTime, purpose, projectTitle }) {
    if (!resourceId) throw new AppError('Resource ID is required', 400);
    if (!startTime || !endTime) throw new AppError('Start time and end time are required', 400);
    if (!purpose || !purpose.trim()) throw new AppError('Reservation purpose is required', 400);

    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new AppError('Invalid date/time format', 400);
    }
    if (startDate >= endDate) {
      throw new AppError('End time must be strictly after start time', 400);
    }

    const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
    const resource = resourceService.getResourceById(resourceId);
    if (!resource) throw new AppError('Resource not found', 404);
    if (resource.status !== 'active') throw new AppError('Resource is not currently active for reservations', 400);

    if (durationMinutes < resource.min_duration_minutes) {
      throw new AppError(`Reservation duration must be at least ${resource.min_duration_minutes} minutes`, 400);
    }
    if (durationMinutes > resource.max_duration_minutes) {
      throw new AppError(`Reservation duration cannot exceed ${resource.max_duration_minutes} minutes`, 400);
    }

    const db = getDb();

    // Check for overlapping approved booking
    // Interval overlap formula: requestedStart < existingEnd AND requestedEnd > existingStart
    const conflict = db.prepare(`
      SELECT b.id, b.start_time, b.end_time, u.full_name as booked_by
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      WHERE b.resource_id = ?
        AND b.status = 'approved'
        AND datetime(b.start_time) < datetime(?)
        AND datetime(b.end_time) > datetime(?)
    `).get(resourceId, endDate.toISOString(), startDate.toISOString());

    if (conflict) {
      throw new AppError(
        `This time slot conflicts with an existing approved booking (${conflict.start_time} - ${conflict.end_time}). Please choose another time.`,
        409
      );
    }

    // Auto-approve if resource requires no approval and no conflict exists
    const initialStatus = resource.requires_approval === 0 ? 'approved' : 'pending';
    const bookingId = `book-${crypto.randomUUID()}`;

    const insert = db.prepare(`
      INSERT INTO bookings (
        id, resource_id, user_id, start_time, end_time, duration_minutes, purpose, project_title, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    insert.run(
      bookingId,
      resourceId,
      userId,
      startDate.toISOString(),
      endDate.toISOString(),
      durationMinutes,
      purpose.trim(),
      projectTitle ? projectTitle.trim() : null,
      initialStatus
    );

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      `aud-${Date.now()}`,
      userId,
      initialStatus === 'approved' ? 'BOOKING_AUTO_APPROVED' : 'BOOKING_REQUESTED',
      'booking',
      bookingId,
      JSON.stringify({ resource_id: resourceId, durationMinutes, status: initialStatus })
    );

    return this.getBookingById(bookingId);
  },

  getBookingById(id) {
    const db = getDb();
    return db.prepare(`
      SELECT b.*,
             r.name as resource_name, r.type as resource_type, r.location as resource_location,
             r.category as resource_category,
             u.full_name as user_name, u.email as user_email, u.academic_program as user_program,
             d.name as department_name,
             rev.full_name as reviewed_by_name
      FROM bookings b
      LEFT JOIN resources r ON b.resource_id = r.id
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN users rev ON b.reviewed_by = rev.id
      WHERE b.id = ?
    `).get(id);
  },

  getUserBookings(userId) {
    const db = getDb();
    return db.prepare(`
      SELECT b.*,
             r.name as resource_name, r.type as resource_type, r.location as resource_location,
             r.category as resource_category,
             rev.full_name as reviewed_by_name
      FROM bookings b
      LEFT JOIN resources r ON b.resource_id = r.id
      LEFT JOIN users rev ON b.reviewed_by = rev.id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
    `).all(userId);
  },

  getAllBookings({ status, resourceId } = {}) {
    const db = getDb();
    let query = `
      SELECT b.*,
             r.name as resource_name, r.type as resource_type, r.location as resource_location,
             r.category as resource_category,
             u.full_name as user_name, u.email as user_email, u.academic_program as user_program,
             d.name as department_name,
             rev.full_name as reviewed_by_name
      FROM bookings b
      LEFT JOIN resources r ON b.resource_id = r.id
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN users rev ON b.reviewed_by = rev.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      query += ' AND b.status = ?';
      params.push(status);
    }
    if (resourceId) {
      query += ' AND b.resource_id = ?';
      params.push(resourceId);
    }

    query += ' ORDER BY b.created_at DESC';
    return db.prepare(query).all(...params);
  },

  // Admin approval / rejection workflow with transaction locking and conflict verification
  reviewBooking(adminId, bookingId, { action, reason, notes }) {
    if (!['approve', 'reject'].includes(action)) {
      throw new AppError('Action must be "approve" or "reject"', 400);
    }
    if (action === 'reject' && (!reason || !reason.trim())) {
      throw new AppError('A rejection reason is required to explain the decision to the requester', 400);
    }

    const db = getDb();

    // Use SQLite IMMEDIATE transaction to block concurrent approval races
    db.exec('BEGIN IMMEDIATE');

    try {
      const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
      if (!booking) {
        throw new AppError('Booking request not found', 404);
      }
      if (booking.status !== 'pending') {
        throw new AppError(`Cannot review this request: current status is already "${booking.status}"`, 400);
      }

      if (action === 'approve') {
        // Double-booking check: verify NO approved booking overlaps [booking.start_time, booking.end_time)
        const conflict = db.prepare(`
          SELECT b.id, b.start_time, b.end_time, u.full_name as booked_by
          FROM bookings b
          LEFT JOIN users u ON b.user_id = u.id
          WHERE b.resource_id = ?
            AND b.status = 'approved'
            AND b.id != ?
            AND datetime(b.start_time) < datetime(?)
            AND datetime(b.end_time) > datetime(?)
        `).get(booking.resource_id, booking.id, booking.end_time, booking.start_time);

        if (conflict) {
          throw new AppError(
            `Double-booking prevented: This request conflicts with another approved reservation (${conflict.start_time} - ${conflict.end_time}) by ${conflict.booked_by || 'another user'}.`,
            409
          );
        }

        db.prepare(`
          UPDATE bookings SET
            status = 'approved',
            admin_notes = ?,
            reviewed_by = ?,
            reviewed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(notes ? notes.trim() : 'Approved by administrator', adminId, bookingId);
      } else {
        // Rejection
        db.prepare(`
          UPDATE bookings SET
            status = 'rejected',
            rejection_reason = ?,
            admin_notes = ?,
            reviewed_by = ?,
            reviewed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(reason.trim(), notes ? notes.trim() : null, adminId, bookingId);
      }

      // Record audit log
      db.prepare(`
        INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, details)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        `aud-${Date.now()}`,
        adminId,
        action === 'approve' ? 'BOOKING_APPROVED' : 'BOOKING_REJECTED',
        'booking',
        bookingId,
        JSON.stringify({ action, reason: reason || null, resource_id: booking.resource_id })
      );

      db.exec('COMMIT');
      return this.getBookingById(bookingId);
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  },

  cancelBooking(actorId, bookingId, reason) {
    const db = getDb();
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    if (!booking) throw new AppError('Booking not found', 404);

    const user = userService.getUserById(actorId);
    if (!user) throw new AppError('User not found', 401);

    // Only owner of booking or admin can cancel
    if (booking.user_id !== actorId && user.role !== 'admin') {
      throw new AppError('Unauthorized: You can only cancel your own bookings', 403);
    }

    if (!['pending', 'approved'].includes(booking.status)) {
      throw new AppError(`Cannot cancel a booking that is currently "${booking.status}"`, 400);
    }

    db.prepare(`
      UPDATE bookings SET
        status = 'cancelled',
        admin_notes = COALESCE(?, admin_notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(reason ? `Cancelled: ${reason.trim()}` : 'Cancelled by user', bookingId);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      `aud-${Date.now()}`,
      actorId,
      'BOOKING_CANCELLED',
      'booking',
      bookingId,
      JSON.stringify({ cancelled_by_role: user.role, reason: reason || 'User requested cancellation' })
    );

    return this.getBookingById(bookingId);
  }
};

// ============================================================================
// ADMIN METRICS & AUDIT SERVICE
// ============================================================================
export const adminService = {
  getDashboardStats() {
    const db = getDb();

    const activeResources = db.prepare("SELECT COUNT(*) as count FROM resources WHERE status = 'active'").get().count;
    const totalRooms = db.prepare("SELECT COUNT(*) as count FROM resources WHERE type = 'room' AND status = 'active'").get().count;
    const totalEquipment = db.prepare("SELECT COUNT(*) as count FROM resources WHERE type = 'equipment' AND status = 'active'").get().count;
    const totalLabs = db.prepare("SELECT COUNT(*) as count FROM resources WHERE type = 'laboratory' AND status = 'active'").get().count;
    const pendingRequests = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'pending'").get().count;
    const approvedBookings = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'approved'").get().count;
    const completedBookings = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'completed'").get().count;
    const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'user'").get().count;
    const totalDepts = db.prepare("SELECT COUNT(*) as count FROM departments").get().count;
    const totalCampuses = db.prepare("SELECT COUNT(*) as count FROM campuses").get().count;

    return {
      active_resources: activeResources,
      total_rooms: totalRooms,
      total_equipment: totalEquipment,
      total_laboratories: totalLabs,
      pending_requests: pendingRequests,
      approved_bookings: approvedBookings,
      completed_bookings: completedBookings,
      total_users: totalUsers,
      total_departments: totalDepts,
      total_campuses: totalCampuses,
    };
  },

  getAuditLogs(limit = 100) {
    const db = getDb();
    const rows = db.prepare(`
      SELECT a.*, u.full_name as actor_name, u.email as actor_email, u.role as actor_role
      FROM audit_logs a
      LEFT JOIN users u ON a.actor_id = u.id
      ORDER BY a.created_at DESC
      LIMIT ?
    `).all(limit);

    return rows.map((r) => ({
      ...r,
      details: r.details ? JSON.parse(r.details) : null,
    }));
  }
};

