import app from '../server/index.js';
import { initDb } from '../server/db.js';

// Ensure database schema and initial records exist on serverless cold start
initDb();

export default app;
