import express from 'express';
import cors from 'cors';
import { initDb, verifyToken } from './db.js';
import {
  userService,
  catalogService,
  resourceService,
  bookingService,
  adminService,
  AppError,
} from './services.js';

// Initialize Database Schema and Core System Records
initDb();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ============================================================================
// AUTHENTICATION MIDDLEWARES
// ============================================================================
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) {
    req.user = null;
    return next();
  }

  const user = userService.getUserById(payload.id);
  if (!user || !user.is_active) {
    req.user = null;
    return next();
  }

  req.user = user;
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Administrative privileges required.' });
  }
  next();
}

app.use(authMiddleware);

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================
app.post('/api/auth/register', (req, res, next) => {
  try {
    const { fullName, email, password, departmentId, academicProgram, phone } = req.body;
    const result = userService.register({ fullName, email, password, departmentId, academicProgram, phone });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

app.post('/api/auth/login', (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = userService.login(email, password);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true });
});

// ============================================================================
// CATALOG (DEPARTMENTS & CAMPUSES) ROUTES
// ============================================================================
app.get('/api/departments', (req, res, next) => {
  try {
    const departments = catalogService.listDepartments();
    res.json(departments);
  } catch (err) {
    next(err);
  }
});

app.post('/api/admin/departments', requireAdmin, (req, res, next) => {
  try {
    const dept = catalogService.createDepartment(req.user.id, req.body);
    res.status(201).json(dept);
  } catch (err) {
    next(err);
  }
});

app.get('/api/campuses', (req, res, next) => {
  try {
    const campuses = catalogService.listCampuses();
    res.json(campuses);
  } catch (err) {
    next(err);
  }
});

app.post('/api/admin/campuses', requireAdmin, (req, res, next) => {
  try {
    const campus = catalogService.createCampus(req.user.id, req.body);
    res.status(201).json(campus);
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// RESOURCES ROUTES (ROOMS, EQUIPMENT, LABORATORIES)
// ============================================================================
app.get('/api/resources', (req, res, next) => {
  try {
    const { type, category, departmentId, campusId, search, status } = req.query;
    const resources = resourceService.listResources({
      type,
      category,
      departmentId,
      campusId,
      search,
      status: status || 'active',
    });
    res.json(resources);
  } catch (err) {
    next(err);
  }
});

app.get('/api/resources/:id', (req, res, next) => {
  try {
    const resource = resourceService.getResourceById(req.params.id);
    if (!resource) return res.status(404).json({ error: 'Resource not found' });
    res.json(resource);
  } catch (err) {
    next(err);
  }
});

app.get('/api/resources/:id/availability', (req, res, next) => {
  try {
    const availability = bookingService.getAvailability(req.params.id, req.query.date);
    res.json(availability);
  } catch (err) {
    next(err);
  }
});

app.post('/api/admin/resources', requireAdmin, (req, res, next) => {
  try {
    const resource = resourceService.createResource(req.user.id, req.body);
    res.status(201).json(resource);
  } catch (err) {
    next(err);
  }
});

app.put('/api/admin/resources/:id', requireAdmin, (req, res, next) => {
  try {
    const resource = resourceService.updateResource(req.user.id, req.params.id, req.body);
    res.json(resource);
  } catch (err) {
    next(err);
  }
});

app.delete('/api/admin/resources/:id', requireAdmin, (req, res, next) => {
  try {
    const result = resourceService.deleteResource(req.user.id, req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// BOOKINGS & RESERVATIONS ROUTES
// ============================================================================
app.get('/api/bookings', requireAuth, (req, res, next) => {
  try {
    const { status, resourceId, all } = req.query;
    // Admins can view all bookings if all=true is specified
    if (req.user.role === 'admin' && all === 'true') {
      const bookings = bookingService.getAllBookings({ status, resourceId });
      return res.json(bookings);
    }
    // Standard users only see their own bookings
    const bookings = bookingService.getUserBookings(req.user.id);
    res.json(bookings);
  } catch (err) {
    next(err);
  }
});

app.get('/api/bookings/:id', requireAuth, (req, res, next) => {
  try {
    const booking = bookingService.getBookingById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to view this booking' });
    }
    res.json(booking);
  } catch (err) {
    next(err);
  }
});

app.post('/api/bookings', requireAuth, (req, res, next) => {
  try {
    const { resourceId, startTime, endTime, purpose, projectTitle } = req.body;
    const booking = bookingService.createBookingRequest(req.user.id, {
      resourceId,
      startTime,
      endTime,
      purpose,
      projectTitle,
    });
    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
});

app.post('/api/bookings/:id/cancel', requireAuth, (req, res, next) => {
  try {
    const { reason } = req.body;
    const cancelled = bookingService.cancelBooking(req.user.id, req.params.id, reason);
    res.json(cancelled);
  } catch (err) {
    next(err);
  }
});

app.post(['/api/admin/bookings/:id/review', '/api/bookings/:id/review'], requireAdmin, (req, res, next) => {
  try {
    const { action, reason, notes } = req.body;
    const reviewed = bookingService.reviewBooking(req.user.id, req.params.id, { action, reason, notes });
    res.json(reviewed);
  } catch (err) {
    next(err);
  }
});

// Notifications Endpoint
app.get('/api/notifications', (req, res) => {
  // Returns recent activity or notification badges for the user
  res.json([
    {
      id: 'notif-welcome',
      title: 'Welcome to UnlockLab',
      message: 'Explore shared equipment and reserve research facilities.',
      created_at: new Date().toISOString(),
      read: false
    }
  ]);
});

app.post('/api/notifications/:id/read', (req, res) => {
  res.json({ success: true });
});

// ============================================================================
// ADMIN METRICS & USER MANAGEMENT ROUTES
// ============================================================================
app.get('/api/admin/stats', requireAdmin, (req, res, next) => {
  try {
    const stats = adminService.getDashboardStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

app.get('/api/admin/users', requireAdmin, (req, res, next) => {
  try {
    const users = userService.listUsers();
    res.json(users);
  } catch (err) {
    next(err);
  }
});

app.get('/api/admin/audit-logs', requireAdmin, (req, res, next) => {
  try {
    const logs = adminService.getAuditLogs(Number(req.query.limit) || 100);
    res.json(logs);
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================
app.use((err, req, res, next) => {
  console.error('[API Error]:', err.message);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'An unexpected internal server error occurred',
  });
});

app.listen(PORT, () => {
  console.log(`[API Server] UnlockLab Backend running securely on http://localhost:${PORT}`);
});

