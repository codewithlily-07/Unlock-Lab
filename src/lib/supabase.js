import { createClient } from '@supabase/supabase-js';
import {
  INITIAL_PROFILES,
  INITIAL_RESOURCES,
  INITIAL_USER_CREDENTIALS,
  INITIAL_BOOKINGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_INCIDENTS,
} from './mockDemoData.js';

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});
const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey &&
  supabaseAnonKey !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// =====================================================
// LOCAL MOCK STORAGE STORE (Safe offline fallback)
// =====================================================
const STORAGE_KEYS = {
  PROFILES: 'unlocklab_profiles',
  RESOURCES: 'unlocklab_resources',
  CREDENTIALS: 'unlocklab_credentials',
  BOOKINGS: 'unlocklab_bookings',
  NOTIFICATIONS: 'unlocklab_notifications',
  AUDIT_LOGS: 'unlocklab_audit_logs',
  INCIDENTS: 'unlocklab_incidents',
};

const memoryStore = {};

function getStorage(key, defaultData) {
  if (typeof localStorage === 'undefined') {
    if (!memoryStore[key]) {
      memoryStore[key] = JSON.parse(JSON.stringify(defaultData));
    }
    return memoryStore[key];
  }
  try {
    const saved = localStorage.getItem(key);
    if (!saved) {
      localStorage.setItem(key, JSON.stringify(defaultData));
      return defaultData;
    }
    return JSON.parse(saved);
  } catch (e) {
    return defaultData;
  }
}

function setStorage(key, data) {
  if (typeof localStorage === 'undefined') {
    memoryStore[key] = data;
    return;
  }
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Storage error:', e);
  }
}

// Client RPC & Service Layer
export const api = {
  // Profiles
  async getProfiles() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('profiles').select('*');
      if (!error && data) return data;
    }
    return getStorage(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
  },

  async getProfile(id) {
    const profiles = await this.getProfiles();
    return profiles.find((p) => p.id === id) || null;
  },

  // Resources
  async getResources() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('resources').select('*');
      if (!error && data) return data;
    }
    return getStorage(STORAGE_KEYS.RESOURCES, INITIAL_RESOURCES);
  },

  async getResource(id) {
    const resources = await this.getResources();
    return resources.find((r) => r.id === id) || null;
  },

  async saveResource(resourceData) {
    const resources = await this.getResources();
    let updated;
    if (resourceData.id) {
      updated = resources.map((r) => (r.id === resourceData.id ? { ...r, ...resourceData } : r));
    } else {
      const newRes = {
        ...resourceData,
        id: `res-${Date.now()}`,
        qr_token: `qr-${Math.random().toString(36).substring(2, 12)}`,
        created_at: new Date().toISOString(),
      };
      updated = [newRes, ...resources];
    }
    setStorage(STORAGE_KEYS.RESOURCES, updated);
    return resourceData.id ? resourceData : updated[0];
  },

  // Credentials
  async getCredentials(userId = null) {
    const creds = getStorage(STORAGE_KEYS.CREDENTIALS, INITIAL_USER_CREDENTIALS);
    if (userId) return creds.filter((c) => c.user_id === userId);
    return creds;
  },

  async uploadCredential(credential) {
    const creds = await this.getCredentials();
    const newCred = {
      ...credential,
      id: `cred-${Date.now()}`,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    const updated = [newCred, ...creds];
    setStorage(STORAGE_KEYS.CREDENTIALS, updated);
    return newCred;
  },

  // Eligibility Engine (Matches check_eligibility SQL RPC)
  async checkEligibility(userId, resourceId) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.rpc('check_eligibility', {
        p_user_id: userId,
        p_resource_id: resourceId,
      });
      if (!error && data) return data;
    }

    // Local deterministic evaluation
    const user = (await this.getProfiles()).find((p) => p.id === userId);
    const resource = (await this.getResources()).find((r) => r.id === resourceId);
    const userCreds = await this.getCredentials(userId);

    const checklist = [];

    // 1. Account Standing
    if (user?.is_suspended) {
      checklist.push({
        requirement: 'Account Standing',
        passed: false,
        message: 'Account suspended due to policy violation',
        how_to_fix: 'Contact lab administrator to review account suspension',
      });
    } else {
      checklist.push({
        requirement: 'Account Standing',
        passed: true,
        message: 'Account is active in good standing',
        how_to_fix: '',
      });
    }

    // 2. Identity Verification
    if (!user?.is_verified) {
      checklist.push({
        requirement: 'Identity Verification',
        passed: false,
        message: 'Institutional identity has not been verified by an administrator',
        how_to_fix: 'Upload student/faculty ID credentials on the Credentials page for verification',
      });
    } else {
      checklist.push({
        requirement: 'Identity Verification',
        passed: true,
        message: 'Institutional identity verified',
        how_to_fix: '',
      });
    }

    // 3. Late Return Cooldown
    const bookings = await this.getBookings();
    const recentLate = bookings.find(
      (b) => b.user_id === userId && b.status === 'returned_late'
    );
    if (recentLate) {
      checklist.push({
        requirement: 'Late Return Cooldown',
        passed: false,
        message: 'A 48-hour cooldown is active due to a recent late return',
        how_to_fix: 'Wait for cooldown period to elapse before making new reservations',
      });
    } else {
      checklist.push({
        requirement: 'Late Return Cooldown',
        passed: true,
        message: 'No active late return cooldown penalties',
        how_to_fix: '',
      });
    }

    // 4. Resource Specific Requirements
    const reqs = resource?.requirements || [];
    for (const req of reqs) {
      if (req.type === 'training') {
        const hasCert = userCreds.some(
          (c) =>
            c.type === 'training' &&
            c.name.toLowerCase() === req.value.toLowerCase() &&
            c.status === 'verified'
        );
        checklist.push({
          requirement: req.description,
          passed: hasCert,
          message: hasCert
            ? `Verified training certification: ${req.value}`
            : `Requires verified certification: "${req.value}"`,
          how_to_fix: hasCert
            ? ''
            : `Upload your certificate for "${req.value}" in My Credentials`,
        });
      } else if (req.type === 'org') {
        const matchesOrg = user?.organization?.toLowerCase() === req.value.toLowerCase();
        checklist.push({
          requirement: req.description,
          passed: matchesOrg,
          message: matchesOrg
            ? `Affiliated with: ${req.value}`
            : `Restricted to members of ${req.value}`,
          how_to_fix: matchesOrg ? '' : 'Request partner organization guest access',
        });
      }
    }

    return checklist;
  },

  // Bookings
  async getBookings(userId = null) {
    if (isSupabaseConfigured) {
      let query = supabase.from('bookings').select('*').order('requested_at', { ascending: false });
      if (userId) query = query.eq('user_id', userId);
      const { data, error } = await query;
      if (!error && data) return data;
    }
    const all = getStorage(STORAGE_KEYS.BOOKINGS, INITIAL_BOOKINGS);
    if (userId) return all.filter((b) => b.user_id === userId);
    return all;
  },

  async getBooking(id) {
    const bookings = await this.getBookings();
    return bookings.find((b) => b.id === id) || null;
  },

  async requestBooking({ resourceId, userId, startAt, endAt, purpose, projectNeed }) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.rpc('request_booking', {
        p_resource_id: resourceId,
        p_start_at: startAt,
        p_end_at: endAt,
        p_purpose: purpose,
        p_project_need: projectNeed || null,
      });
      if (!error && data) return data;
    }

    // Local evaluation
    const resource = await this.getResource(resourceId);
    const eligibility = await this.checkEligibility(userId, resourceId);
    const passed = eligibility.every((item) => item.passed);

    const bookings = await this.getBookings();
    // Conflict check
    const hasConflict = bookings.some(
      (b) =>
        b.resource_id === resourceId &&
        ['approved', 'checked_out'].includes(b.status) &&
        new Date(startAt) < new Date(b.end_at) &&
        new Date(endAt) > new Date(b.start_at)
    );

    let initialStatus = 'pending_review';
    let decisionReason = 'Requirements verified automatically. Request forwarded to lab manager for slot confirmation.';
    let waitlistPosition = null;

    if (!passed) {
      initialStatus = 'eligibility_failed';
      decisionReason = 'Automated eligibility check failed. Review requirements and upload needed credentials.';
    } else if (hasConflict) {
      initialStatus = 'waitlisted';
      waitlistPosition = 1;
      decisionReason = 'Slot is reserved by an active booking. You have been placed on the transparent waitlist at position #1.';
    } else if (!resource.requires_approval) {
      initialStatus = 'approved';
      decisionReason = 'Auto-approved: all requirements met; this resource needs no manual approval.';
    }

    const newBooking = {
      id: `book-${Date.now()}`,
      resource_id: resourceId,
      user_id: userId,
      start_at: startAt,
      end_at: endAt,
      purpose,
      project_need: projectNeed,
      status: initialStatus,
      decision_reason: decisionReason,
      rule_applied: resource.requires_approval ? 'Manager Authorization Required' : 'Instant Access',
      eligibility_snapshot: eligibility,
      waitlist_position: waitlistPosition,
      priority_score: 85.0,
      priority_breakdown: {
        hours_factor: 36.0,
        wait_factor: 20.0,
        reliability_factor: 19.0,
        project_need_bonus: projectNeed ? 10.0 : 0.0,
      },
      requested_at: new Date().toISOString(),
      decided_at: initialStatus === 'approved' ? new Date().toISOString() : null,
    };

    const updated = [newBooking, ...bookings];
    setStorage(STORAGE_KEYS.BOOKINGS, updated);
    this.addAuditLog({
      actor_id: userId,
      actor_role: 'user',
      action: 'BOOKING_REQUESTED',
      entity_type: 'booking',
      entity_id: newBooking.id,
      booking_id: newBooking.id,
      resource_id: resourceId,
      details: { status: initialStatus, purpose },
    });

    return newBooking;
  },

  async transitionBooking(bookingId, newStatus, reason, callerId) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.rpc('transition_booking', {
        p_booking_id: bookingId,
        p_new_status: newStatus,
        p_reason: reason,
      });
      if (!error && data) return data;
    }

    const bookings = await this.getBookings();
    let updatedBooking = null;
    const updated = bookings.map((b) => {
      if (b.id === bookingId) {
        updatedBooking = {
          ...b,
          status: newStatus,
          decision_reason: reason,
          decided_by: callerId,
          decided_at: new Date().toISOString(),
          waitlist_position: newStatus === 'waitlisted' ? 1 : null,
        };
        return updatedBooking;
      }
      return b;
    });

    setStorage(STORAGE_KEYS.BOOKINGS, updated);
    this.addAuditLog({
      actor_id: callerId,
      actor_role: 'owner',
      action: `BOOKING_${newStatus.toUpperCase()}`,
      entity_type: 'booking',
      entity_id: bookingId,
      booking_id: bookingId,
      resource_id: updatedBooking?.resource_id,
      details: { reason, new_status: newStatus },
    });

    return updatedBooking;
  },

  async checkIn(bookingId, condition, notes, callerId) {
    const bookings = await this.getBookings();
    let updatedBooking = null;
    const updated = bookings.map((b) => {
      if (b.id === bookingId) {
        updatedBooking = {
          ...b,
          status: 'checked_out',
          checked_in_at: new Date().toISOString(),
          initial_condition: condition,
          initial_notes: notes,
        };
        return updatedBooking;
      }
      return b;
    });
    setStorage(STORAGE_KEYS.BOOKINGS, updated);
    this.addAuditLog({
      actor_id: callerId,
      actor_role: 'user',
      action: 'BOOKING_CHECKED_OUT',
      entity_type: 'booking',
      entity_id: bookingId,
      booking_id: bookingId,
      resource_id: updatedBooking?.resource_id,
      details: { condition, notes },
    });
    return updatedBooking;
  },

  async returnBooking(bookingId, condition, notes, flagDamage, incidentDescription, callerId) {
    const bookings = await this.getBookings();
    let updatedBooking = null;
    const isLate = false;
    const newStatus = flagDamage || condition === 'damaged' ? 'disputed' : isLate ? 'returned_late' : 'closed';

    const updated = bookings.map((b) => {
      if (b.id === bookingId) {
        updatedBooking = {
          ...b,
          status: newStatus,
          returned_at: new Date().toISOString(),
          return_condition: condition,
          return_notes: notes,
          is_overdue: false,
        };
        return updatedBooking;
      }
      return b;
    });
    setStorage(STORAGE_KEYS.BOOKINGS, updated);

    if (flagDamage || condition === 'damaged') {
      const incidents = getStorage(STORAGE_KEYS.INCIDENTS, INITIAL_INCIDENTS);
      const newInc = {
        id: `inc-${Date.now()}`,
        booking_id: bookingId,
        resource_id: updatedBooking?.resource_id,
        reported_by: callerId,
        type: 'damage',
        severity: 'high',
        description: incidentDescription || notes || 'Hardware damage flagged upon return.',
        status: 'open',
        ai_summary: `AI-generated summary - review before acting: Damage flagged during return inspection for ${updatedBooking?.resource_id}. Borrower recorded condition as ${condition}.`,
        ai_summary_reviewed: true,
        created_at: new Date().toISOString(),
      };
      setStorage(STORAGE_KEYS.INCIDENTS, [newInc, ...incidents]);
    }

    this.addAuditLog({
      actor_id: callerId,
      actor_role: 'user',
      action: `BOOKING_${newStatus.toUpperCase()}`,
      entity_type: 'booking',
      entity_id: bookingId,
      booking_id: bookingId,
      resource_id: updatedBooking?.resource_id,
      details: { condition, flagDamage, status: newStatus },
    });

    return updatedBooking;
  },

  // Audit Logs
  async getAuditLogs(bookingId = null) {
    const logs = getStorage(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    if (bookingId) return logs.filter((l) => l.booking_id === bookingId);
    return logs;
  },

  addAuditLog(entry) {
    const logs = getStorage(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    const newLog = {
      id: `aud-${Date.now()}`,
      created_at: new Date().toISOString(),
      ...entry,
    };
    setStorage(STORAGE_KEYS.AUDIT_LOGS, [newLog, ...logs]);
    return newLog;
  },

  // Incidents
  async getIncidents() {
    return getStorage(STORAGE_KEYS.INCIDENTS, INITIAL_INCIDENTS);
  },

  async resolveIncident(incidentId, status, note, callerId) {
    const incidents = await this.getIncidents();
    let target = null;
    const updated = incidents.map((inc) => {
      if (inc.id === incidentId) {
        target = { ...inc, status, resolution_note: note, resolved_by: callerId, resolved_at: new Date().toISOString() };
        return target;
      }
      return inc;
    });
    setStorage(STORAGE_KEYS.INCIDENTS, updated);

    if (target?.booking_id) {
      const bookings = await this.getBookings();
      const bUpdated = bookings.map((b) => (b.id === target.booking_id ? { ...b, status: 'closed' } : b));
      setStorage(STORAGE_KEYS.BOOKINGS, bUpdated);
    }
    return target;
  },

  // Notifications
  async getNotifications(userId) {
    const notifs = getStorage(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    return notifs.filter((n) => n.user_id === userId);
  },

  async markNotificationRead(id) {
    const notifs = getStorage(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const updated = notifs.map((n) => (n.id === id ? { ...n, is_read: true } : n));
    setStorage(STORAGE_KEYS.NOTIFICATIONS, updated);
  },

  // Admin Verification
  async verifyUser(userId, isVerified) {
    const profiles = await this.getProfiles();
    const updated = profiles.map((p) =>
      p.id === userId ? { ...p, is_verified: isVerified, verified_at: isVerified ? new Date().toISOString() : null } : p
    );
    setStorage(STORAGE_KEYS.PROFILES, updated);
  },

  async verifyCredential(credentialId, status, reviewNote) {
    const creds = await this.getCredentials();
    const updated = creds.map((c) =>
      c.id === credentialId ? { ...c, status, review_note: reviewNote, reviewed_at: new Date().toISOString() } : c
    );
    setStorage(STORAGE_KEYS.CREDENTIALS, updated);
  },

  // Reset Demo Data
  resetDemoData() {
    localStorage.removeItem(STORAGE_KEYS.PROFILES);
    localStorage.removeItem(STORAGE_KEYS.RESOURCES);
    localStorage.removeItem(STORAGE_KEYS.CREDENTIALS);
    localStorage.removeItem(STORAGE_KEYS.BOOKINGS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    localStorage.removeItem(STORAGE_KEYS.INCIDENTS);
    return true;
  },
};

