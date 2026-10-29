import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isVercel = Boolean(process.env.VERCEL);
const DB_PATH = isVercel
  ? path.resolve('/tmp', 'unlocklab.db')
  : path.resolve(__dirname, 'unlocklab.db');

let dbInstance = null;

export function getDb() {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(DB_PATH);
    dbInstance.exec('PRAGMA foreign_keys = ON;');
    dbInstance.exec('PRAGMA journal_mode = WAL;');
  }
  return dbInstance;
}

export function hashPassword(password, salt = null) {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, actualSalt, 64).toString('hex');
  return { hash, salt: actualSalt };
}

export function verifyPassword(password, hash, salt) {
  const verifyHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'));
}

export function generateToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const secret = process.env.JWT_SECRET || 'unlocklab-production-secure-signature-key-2026';
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  const secret = process.env.JWT_SECRET || 'unlocklab-production-secure-signature-key-2026';
  const expectedSig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  if (signature !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

export function initDb() {
  const db = getDb();

  // Create Tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS campuses (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      location TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'admin')) DEFAULT 'user',
      department_id TEXT REFERENCES departments(id),
      academic_program TEXT,
      phone TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS resources (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('room', 'equipment', 'laboratory')),
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      campus_id TEXT REFERENCES campuses(id),
      department_id TEXT REFERENCES departments(id),
      location TEXT NOT NULL,
      capacity INTEGER DEFAULT 1,
      total_quantity INTEGER DEFAULT 1,
      available_quantity INTEGER DEFAULT 1,
      description TEXT,
      facilities TEXT,
      operating_hours_start TEXT DEFAULT '08:00',
      operating_hours_end TEXT DEFAULT '20:00',
      min_duration_minutes INTEGER DEFAULT 30,
      max_duration_minutes INTEGER DEFAULT 240,
      advance_booking_days INTEGER DEFAULT 14,
      requires_approval INTEGER DEFAULT 1,
      status TEXT NOT NULL CHECK(status IN ('active', 'maintenance', 'deactivated')) DEFAULT 'active',
      photos TEXT,
      usage_rules TEXT,
      safety_guidelines TEXT,
      created_by TEXT REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      resource_id TEXT NOT NULL REFERENCES resources(id) ON DELETE RESTRICT,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      duration_minutes INTEGER NOT NULL,
      purpose TEXT NOT NULL,
      project_title TEXT,
      status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected', 'cancelled', 'completed')) DEFAULT 'pending',
      admin_notes TEXT,
      rejection_reason TEXT,
      reviewed_by TEXT REFERENCES users(id),
      reviewed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_id TEXT REFERENCES users(id),
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Performance Indexes
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_resources_status ON resources(status);
    CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(type);
    CREATE INDEX IF NOT EXISTS idx_resources_dept ON resources(department_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_resource_status ON bookings(resource_id, status);
    CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_times ON bookings(resource_id, start_time, end_time);
  `);

  // Seed Institutional Academic Departments (Multi-branch support)
  const deptCount = db.prepare('SELECT COUNT(*) as count FROM departments').get().count;
  if (deptCount === 0) {
    const insertDept = db.prepare('INSERT INTO departments (id, code, name, description) VALUES (?, ?, ?, ?)');
    const defaultDepts = [
      ['dept-eng-mech', 'MECH', 'Mechanical Engineering', 'Manufacturing, robotics, fluid dynamics, and thermodynamics labs'],
      ['dept-eng-civil', 'CIVIL', 'Civil & Environmental Engineering', 'Structural testing, geotech, surveying, and materials research'],
      ['dept-eng-elec', 'ELEC', 'Electrical Engineering', 'Power systems, smart grid, control systems, and renewable energy'],
      ['dept-eng-ece', 'ECE', 'Electronics & Communication', 'RF, VLSI, microelectronics, embedded systems, and communications'],
      ['dept-sci-cs', 'CSE', 'Computer Science & Engineering', 'High performance computing, AI research clusters, and data labs'],
      ['dept-sci-bio', 'BIO', 'Biotechnology & Bioengineering', 'Cell culture, molecular genetics, bioinformatics, and analytical assays'],
      ['dept-sci-chem', 'CHEM', 'Chemical Engineering & Chemistry', 'Spectroscopy, chromatography, reaction engineering, and polymer synthesis'],
      ['dept-sci-phys', 'PHYS', 'Physics & Advanced Instrumentation', 'Optics, quantum materials, electron microscopy, and thin-film deposition'],
      ['dept-inter', 'INTER', 'Interdisciplinary Sciences & Makerspaces', 'Shared rapid-prototyping, cross-faculty incubators, and testing bays']
    ];
    for (const [id, code, name, desc] of defaultDepts) {
      insertDept.run(id, code, name, desc);
    }
  }

  // Seed Campuses / Facility Zones
  const campusCount = db.prepare('SELECT COUNT(*) as count FROM campuses').get().count;
  if (campusCount === 0) {
    const insertCampus = db.prepare('INSERT INTO campuses (id, code, name, location, description) VALUES (?, ?, ?, ?, ?)');
    const defaultCampuses = [
      ['campus-main', 'MAIN', 'North Academic Quad & Engineering Complex', 'North Campus, Tech Hub Bldgs 1-4', 'Central engineering halls, cleanrooms, and testing facilities'],
      ['campus-science', 'SCI', 'Science & Innovation Research Park', 'East Campus, Research Block C', 'Advanced physics, chemistry, biology, and spectroscopy suites'],
      ['campus-maker', 'MAKER', 'Advanced Design & Prototyping Hub', 'South Campus, Innovation Wing', '3D fabrication, heavy prototyping, and cross-department collaboration bays']
    ];
    for (const [id, code, name, loc, desc] of defaultCampuses) {
      insertCampus.run(id, code, name, loc, desc);
    }
  }

  // Securely Provision Initial Accounts (Admin & Student)
  const adminId = 'usr-admin-initial';
  const adminEmail = 'admin@unlocklab.edu';
  const { hash: adminHash, salt: adminSalt } = hashPassword('admin123');
  
  // Upsert Admin with known credentials (admin@unlocklab.edu / admin123)
  const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
  if (!existingAdmin) {
    db.prepare(`
      INSERT INTO users (id, email, password_hash, password_salt, full_name, role, department_id, academic_program)
      VALUES (?, ?, ?, ?, ?, 'admin', 'dept-inter', 'Campus Laboratory Administration')
    `).run(adminId, adminEmail, adminHash, adminSalt, 'Dr. Maya Lin (Administrator)');
    console.log(`[DB] Administrator provisioned: ${adminEmail}`);
  } else {
    // Ensure password matches admin123
    db.prepare(`
      UPDATE users SET password_hash = ?, password_salt = ?, full_name = 'Dr. Maya Lin (Administrator)', role = 'admin'
      WHERE email = ?
    `).run(adminHash, adminSalt, adminEmail);
  }

  // Upsert Student with known credentials (student@unlocklab.edu / student123)
  const studentEmail = 'student@unlocklab.edu';
  const studentId = 'usr-student-primary';
  const { hash: studentHash, salt: studentSalt } = hashPassword('student123');
  const existingStudent = db.prepare('SELECT id FROM users WHERE email = ?').get(studentEmail);
  if (!existingStudent) {
    db.prepare(`
      INSERT INTO users (id, email, password_hash, password_salt, full_name, role, department_id, academic_program)
      VALUES (?, ?, ?, ?, ?, 'user', 'dept-eng-ece', 'B.Tech Electrical & Computer Engineering')
    `).run(studentId, studentEmail, studentHash, studentSalt, 'Aarav Sharma (Student Researcher)');
    console.log(`[DB] Student provisioned: ${studentEmail}`);
  } else {
    db.prepare(`
      UPDATE users SET password_hash = ?, password_salt = ?, full_name = 'Aarav Sharma (Student Researcher)', role = 'user'
      WHERE email = ?
    `).run(studentHash, studentSalt, studentEmail);
  }

  // Seed 10 Authentic Institutional Lab Equipment Instruments
  const coreInstruments = [
    {
      id: 'res-equip-vna',
      name: 'Keysight E5080B ENA Vector Network Analyzer',
      category: 'instrument',
      campus_id: 'campus-main',
      department_id: 'dept-eng-ece',
      location: 'North Academic Quad, RF & Microwave Lab 304',
      total_quantity: 2,
      available_quantity: 2,
      description: 'High-frequency 9 kHz to 20 GHz 4-port vector network analyzer for multi-port RF, microwave filter characterization, antenna tuning, and S-parameter verification.',
      facilities: JSON.stringify(['4-Port S-Parameter Test Set', 'Coaxial Cal Kit 3.5mm', 'GPIB & LAN Interface', 'High-Dynamic Range Receiver']),
      photos: JSON.stringify(['https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80']),
      usage_rules: JSON.stringify(['Wear ESD grounding wrist strap at all times', 'Do not exceed +20 dBm RF input power', 'Recalibrate using 3.5mm calibration unit before measurements']),
      safety_guidelines: 'Cleanroom safety goggles required. Do not disconnect RF cables while transmission is active.'
    },
    {
      id: 'res-equip-scope',
      name: 'Tektronix 4-Channel 1GHz Mixed Signal Oscilloscope',
      category: 'instrument',
      campus_id: 'campus-main',
      department_id: 'dept-eng-ece',
      location: 'North Academic Quad, High-Speed Digital Lab 208',
      total_quantity: 4,
      available_quantity: 4,
      description: 'Precision 4-channel 1GHz mixed signal oscilloscope with 5 GS/s sample rate, automated serial bus decoding (I2C, SPI, CAN), and arbitrary waveform tracking.',
      facilities: JSON.stringify(['4 Analog Channels (1 GHz)', '16 Digital Logic Channels', 'I2C/SPI Protocol Decoding', 'Active Differential Probes']),
      photos: JSON.stringify(['https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?auto=format&fit=crop&w=800&q=80']),
      usage_rules: JSON.stringify(['Verify probe attenuation 10X setting before connecting high voltage', 'Save trace data to institutional cloud storage']),
      safety_guidelines: 'Do not probe voltages exceeding 300V RMS Category II.'
    },
    {
      id: 'res-equip-sem',
      name: 'JEOL JSM-IT200 Scanning Electron Microscope',
      category: 'microscopy',
      campus_id: 'campus-science',
      department_id: 'dept-sci-phys',
      location: 'Science Research Park, Nanoscale Imaging Facility B1',
      total_quantity: 1,
      available_quantity: 1,
      description: 'Research-grade scanning electron microscope with high-resolution secondary electron imaging, backscattered electron detector, and integrated EDS elemental composition mapping.',
      facilities: JSON.stringify(['High-Vacuum Turbomolecular Pump', 'EDS Chemical Elemental Mapping', 'Sputter Coater for Non-Conductive Samples', 'Vibration-Isolated Foundation']),
      photos: JSON.stringify(['https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80']),
      usage_rules: JSON.stringify(['Samples must be thoroughly desiccated before chamber insertion', 'Conductive carbon or gold coating mandatory for polymers']),
      safety_guidelines: 'Nitrogen purge safety interlock must remain armed. Certified operator supervision required.'
    },
    {
      id: 'res-equip-fpga',
      name: 'Xilinx Zynq UltraScale+ MPSoC Development Platform',
      category: 'fpga',
      campus_id: 'campus-main',
      department_id: 'dept-sci-cs',
      location: 'Engineering Hall, Embedded Hardware Acceleration Lab 412',
      total_quantity: 3,
      available_quantity: 3,
      description: 'Quad-core ARM Cortex-A53 + dual-core Cortex-R5 with programmable FPGA logic, PCIe Gen3, and 4GB DDR4 for neural accelerator synthesis and real-time DSP pipelines.',
      facilities: JSON.stringify(['Quad-Core ARM Cortex-A53', 'Vivado Design Suite Floating License', 'FMC Expansion Slot', 'Dual 10GbE SFP+ Ports']),
      photos: JSON.stringify(['https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80']),
      usage_rules: JSON.stringify(['Check bitstream power dissipation limits before flashing', 'Ensure cooling fan is unobstructed']),
      safety_guidelines: 'Handle board by edge rails only to prevent electrostatic damage.'
    },
    {
      id: 'res-equip-3d',
      name: 'Prusa MK4 Precision Multi-Material Prototyping Bay',
      category: 'fabrication',
      campus_id: 'campus-maker',
      department_id: 'dept-eng-mech',
      location: 'Design Hub, Additive Manufacturing Wing Bay 03',
      total_quantity: 6,
      available_quantity: 6,
      description: 'Dual-extrusion precision FDM rapid prototyping station with 0.05mm layer resolution, engineering filament capabilities (CF-PETG, Nylon, PC-ABS), and automated bed leveling.',
      facilities: JSON.stringify(['Heated Magnetic PEI Bed', 'Direct Drive Nextruder', 'Enclosed HEPA Chamber', 'Multi-Material 5-Color MMU3 Unit']),
      photos: JSON.stringify(['https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=800&q=80']),
      usage_rules: JSON.stringify(['Use approved PrusaSlicer profiles only', 'Clean PEI sheet with 99% isopropanol between print runs']),
      safety_guidelines: 'Hotend reaches 290°C. Never touch nozzle or bed during active print cycle.'
    },
    {
      id: 'res-equip-tensile',
      name: 'Instron 5969 Universal Mechanical Testing Bay',
      category: 'testing_bay',
      campus_id: 'campus-main',
      department_id: 'dept-eng-civil',
      location: 'North Academic Quad, Materials Science & Mechanics Lab 112',
      total_quantity: 1,
      available_quantity: 1,
      description: 'Dual-column 50 kN mechanical load frame for tension, compression, flexure, and peel testing with video extensometer and Bluehill Universal telemetry.',
      facilities: JSON.stringify(['50 kN Static Load Cell', 'Wedge Action Grips', 'Non-Contact Video Extensometer', 'Bluehill Universal Software']),
      photos: JSON.stringify(['https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80']),
      usage_rules: JSON.stringify(['Pre-test calibration verification required', 'Set mechanical limit stops prior to loading specimen']),
      safety_guidelines: 'Safety enclosure doors must remain latched during tensile tests. Wear eye protection.'
    },
    {
      id: 'res-equip-spectro',
      name: 'Shimadzu UV-2600i Double-Beam UV-Vis Spectrophotometer',
      category: 'spectroscopy',
      campus_id: 'campus-science',
      department_id: 'dept-sci-chem',
      location: 'Science Research Park, Bioanalytical Instrumentation Core 215',
      total_quantity: 2,
      available_quantity: 2,
      description: 'Ultra-low stray light double-monochromator spectrophotometer spanning 185 to 900 nm wavelength range for photometric quantification and kinetics analysis.',
      facilities: JSON.stringify(['Double-Beam Optics', 'Quartz Cuvettes (10mm)', 'Temperature-Controlled Peltier Cell Holder', 'LabSolutions UV-Vis Suite']),
      photos: JSON.stringify(['https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80']),
      usage_rules: JSON.stringify(['Wipe quartz cuvettes with lens paper before insertion', 'Allow deuterium lamp 15-minute warmup']),
      safety_guidelines: 'Avoid looking directly at UV lamp aperture. Wear nitrile gloves when handling bio-samples.'
    },
    {
      id: 'res-equip-dgx',
      name: 'NVIDIA DGX A100 AI Supercomputing Cluster Node',
      category: 'computing',
      campus_id: 'campus-main',
      department_id: 'dept-sci-cs',
      location: 'Engineering Hall, Data Center Floor 1 Rack 08',
      total_quantity: 1,
      available_quantity: 1,
      description: 'Enterprise AI research system with 8x NVIDIA A100 Tensor Core GPUs (640GB total GPU memory), 200Gb/s InfiniBand interconnect, and NVLink for deep learning model training.',
      facilities: JSON.stringify(['8x NVIDIA A100 80GB SXM4', '640GB HBM2e Memory', 'Dual AMD EPYC 7742 (128 Cores)', '8x 200Gb/s HDR InfiniBand']),
      photos: JSON.stringify(['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80']),
      usage_rules: JSON.stringify(['Submit SLURM job requests through institutional compute portal', 'Maximum consecutive runtime 72 hours']),
      safety_guidelines: 'Data center access requires keycard authorization and ear protection.'
    },
    {
      id: 'res-equip-solder',
      name: 'Weller WXsmart Digital Soldering & SMD Rework Station',
      category: 'soldering',
      campus_id: 'campus-maker',
      department_id: 'dept-inter',
      location: 'Design Hub, Microelectronics Prototyping Bench 07',
      total_quantity: 4,
      available_quantity: 4,
      description: 'Traceable IoT soldering station with active heating micro-tools, nitrogen-capable desoldering iron, and preheating plate for fine-pitch QFN and BGA rework.',
      facilities: JSON.stringify(['Touchscreen Control Unit', 'WXUP MS Ultra Soldering Iron', 'WXair Hot Air & Desoldering Module', 'Stereo Inspection Microscope']),
      photos: JSON.stringify(['https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?auto=format&fit=crop&w=800&q=80']),
      usage_rules: JSON.stringify(['Tin soldering tip before turning off power', 'Ensure fume extractor arm is positioned within 10cm of work surface']),
      safety_guidelines: 'Fume extractor must be running during all lead-free soldering operations.'
    },
    {
      id: 'res-equip-incubator',
      name: 'Thermo Forma Steri-Cycle CO2 Cell Culture Suite',
      category: 'cleanroom',
      campus_id: 'campus-science',
      department_id: 'dept-sci-bio',
      location: 'Science Research Park, Molecular Biology Cleanroom 104',
      total_quantity: 2,
      available_quantity: 2,
      description: 'Direct heat CO2 incubator with HEPA air filtration, dry heat sterilization cycle, and humidity control for primary cell lines, stem cells, and organoid cultures.',
      facilities: JSON.stringify(['In-Chamber HEPA Filtration', '180°C Dry Heat Sterilization', 'Dual TC CO2 Sensor', 'Class 10,000 Cleanroom Enclosure']),
      photos: JSON.stringify(['https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=800&q=80']),
      usage_rules: JSON.stringify(['Spray all culture flasks with 70% ethanol prior to chamber entry', 'Maintain water pan level using autoclaved Milli-Q water']),
      safety_guidelines: 'Bio-safety Level 2 gowning required. Autoclave all biohazardous media before disposal.'
    }
  ];

  const upsertRes = db.prepare(`
    INSERT INTO resources (
      id, type, name, category, campus_id, department_id, location, capacity,
      total_quantity, available_quantity, description, facilities,
      operating_hours_start, operating_hours_end, min_duration_minutes, max_duration_minutes,
      advance_booking_days, requires_approval, status, photos, usage_rules, safety_guidelines, created_by
    ) VALUES (
      ?, 'equipment', ?, ?, ?, ?, ?, 1,
      ?, ?, ?, ?,
      '08:00', '20:00', 30, 240,
      14, 1, 'active', ?, ?, ?, ?
    ) ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      category = excluded.category,
      campus_id = excluded.campus_id,
      department_id = excluded.department_id,
      location = excluded.location,
      total_quantity = excluded.total_quantity,
      available_quantity = excluded.available_quantity,
      description = excluded.description,
      facilities = excluded.facilities,
      photos = excluded.photos,
      usage_rules = excluded.usage_rules,
      safety_guidelines = excluded.safety_guidelines,
      status = 'active',
      requires_approval = 1
  `);

  for (const item of coreInstruments) {
    upsertRes.run(
      item.id,
      item.name,
      item.category,
      item.campus_id,
      item.department_id,
      item.location,
      item.total_quantity,
      item.available_quantity,
      item.description,
      item.facilities,
      item.photos,
      item.usage_rules,
      item.safety_guidelines,
      adminId
    );
  }

  // Also ensure 2 collaborative lab rooms
  const coreRooms = [
    {
      id: 'res-room-mechatronics',
      name: 'Advanced Robotics & Mechatronics Testing Cell',
      category: 'testing_bay',
      campus_id: 'campus-main',
      department_id: 'dept-eng-mech',
      location: 'North Campus, Engineering Hall Bay 104',
      capacity: 8,
      description: 'Fully isolated mechatronics development cell equipped with overhead optical motion tracking, dynamometer testing rigs, and rapid hardware-in-the-loop interfaces.',
      facilities: JSON.stringify(['Vicon Motion Capture Camera Array', 'Modular T-Slot Aluminum Test Fixtures', 'High-Power 48V Bench Supplies', 'Dual Emergency E-Stop Loops']),
      photos: JSON.stringify(['https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80']),
      usage_rules: JSON.stringify(['Safety glasses required at all times', 'Do not operate robotic arms unassisted without secondary spotter']),
      safety_guidelines: 'Maintain 2-meter clearance from mechanical manipulators during servo-drive activation.'
    },
    {
      id: 'res-room-cleanroom',
      name: 'Microelectronics Class 100 Cleanroom & Lithography Bay',
      category: 'cleanroom',
      campus_id: 'campus-main',
      department_id: 'dept-eng-ece',
      location: 'North Academic Quad, Nanofabrication Core B02',
      capacity: 6,
      description: 'ISO 5 / Class 100 photolithography cleanroom with mask aligner, spin coaters, acid wet benches, and profilometer measurement stations.',
      facilities: JSON.stringify(['Karl Suss Contact Mask Aligner', 'Brewer Science Spin Coater', 'Polypropylene Acid Fume Hoods', 'Dektak Stylus Profilometer']),
      photos: JSON.stringify(['https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80']),
      usage_rules: JSON.stringify(['Full bunny suit gowning protocol required', 'No paper or non-cleanroom wipes permitted']),
      safety_guidelines: 'HF acid handling requires dedicated neoprene apron, face shield, and calcium gluconate antidote kit on standby.'
    }
  ];

  const upsertRoom = db.prepare(`
    INSERT INTO resources (
      id, type, name, category, campus_id, department_id, location, capacity,
      total_quantity, available_quantity, description, facilities,
      operating_hours_start, operating_hours_end, min_duration_minutes, max_duration_minutes,
      advance_booking_days, requires_approval, status, photos, usage_rules, safety_guidelines, created_by
    ) VALUES (
      ?, 'room', ?, ?, ?, ?, ?, ?,
      1, 1, ?, ?,
      '08:00', '20:00', 30, 240,
      14, 1, 'active', ?, ?, ?, ?
    ) ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      category = excluded.category,
      campus_id = excluded.campus_id,
      department_id = excluded.department_id,
      location = excluded.location,
      capacity = excluded.capacity,
      description = excluded.description,
      facilities = excluded.facilities,
      photos = excluded.photos,
      usage_rules = excluded.usage_rules,
      safety_guidelines = excluded.safety_guidelines,
      status = 'active',
      requires_approval = 1
  `);

  for (const room of coreRooms) {
    upsertRoom.run(
      room.id,
      room.name,
      room.category,
      room.campus_id,
      room.department_id,
      room.location,
      room.capacity,
      room.description,
      room.facilities,
      room.photos,
      room.usage_rules,
      room.safety_guidelines,
      adminId
    );
  }

  console.log('[DB] Core equipment (10) and research rooms (2) seeded successfully.');
  console.log('[DB] Database schema verified and initialized.');
}

