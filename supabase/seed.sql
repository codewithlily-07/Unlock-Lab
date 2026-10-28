-- =====================================================
-- UNLOCKLAB - HACKATHON SEED DATA (Section 15)
-- Fixed demo accounts, 10 ECE resources, and diverse booking states
-- All accounts use password: Demo@12345
-- =====================================================

-- Clean slate for idempotent re-seeding
TRUNCATE TABLE audit_log CASCADE;
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE condition_reports CASCADE;
TRUNCATE TABLE incidents CASCADE;
TRUNCATE TABLE bookings CASCADE;
TRUNCATE TABLE user_credentials CASCADE;
TRUNCATE TABLE resource_managers CASCADE;
TRUNCATE TABLE resource_requirements CASCADE;
TRUNCATE TABLE resource_blackouts CASCADE;
TRUNCATE TABLE resource_availability CASCADE;
TRUNCATE TABLE resources CASCADE;
TRUNCATE TABLE organizations CASCADE;
TRUNCATE TABLE profiles CASCADE;

-- 1. ORGANIZATIONS
INSERT INTO organizations (id, name, type, address, is_verified) VALUES
('11111111-1111-1111-1111-111111111111', 'Apex Institute of Technology', 'college', 'Campus North, Tech Park Road, Bengaluru', true),
('22222222-2222-2222-2222-222222222222', 'Apex Makerspace & Prototyping Lab', 'makerspace', 'Block D, Innovation Center, Bengaluru', true),
('33333333-3333-3333-3333-333333333333', 'SparkRF Hardware Labs', 'company', 'Incubation Suite 12, Apex Tech Park', false);

-- 2. PROFILES (Deterministic UUIDs for demo simplicity)
-- Passwords in Supabase Auth can be matched with email admin@unlocklab.demo / Demo@12345
INSERT INTO profiles (id, full_name, email, role, organization, department, year_or_designation, phone, is_verified, verified_at, is_suspended) VALUES
-- Admin
('a0000000-0000-0000-0000-000000000001', 'Dr. Arvind Sen', 'admin@unlocklab.demo', 'admin', 'Apex Institute of Technology', 'ECE / Dean Office', 'Director of Labs', '+91 98765 00001', true, now(), false),

-- Owners
('b0000000-0000-0000-0000-000000000002', 'Dr. Rajesh Sharma', 'owner1@unlocklab.demo', 'owner', 'Apex Institute of Technology', 'ECE', 'Department Head & Professor', '+91 98765 00002', true, now(), false),
('b0000000-0000-0000-0000-000000000003', 'Prof. Sunita Rao', 'owner2@unlocklab.demo', 'owner', 'Apex Institute of Technology', 'Robotics & Automation', 'Associate Professor', '+91 98765 00003', false, NULL, false),

-- Manager
('c0000000-0000-0000-0000-000000000004', 'Vikram Mehra', 'manager@unlocklab.demo', 'manager', 'Apex Institute of Technology', 'ECE Technical Labs', 'Senior Lab Technical Officer', '+91 98765 00004', true, now(), false),

-- Students / Borrowers
('d0000000-0000-0000-0000-000000000005', 'Priya Patel', 'student1@unlocklab.demo', 'user', 'Apex Institute of Technology', 'ECE', 'Final Year B.Tech', '+91 98765 00005', true, now(), false),
('d0000000-0000-0000-0000-000000000006', 'Amit Kumar', 'student2@unlocklab.demo', 'user', 'Apex Institute of Technology', 'ECE', '3rd Year B.Tech', '+91 98765 00006', true, now(), false),
('d0000000-0000-0000-0000-000000000007', 'Rohan Verma', 'student3@unlocklab.demo', 'user', 'Apex Institute of Technology', 'ECE', 'M.Tech Research Scholar', '+91 98765 00007', true, now(), false),
('d0000000-0000-0000-0000-000000000008', 'Ananya Sen', 'outsider@unlocklab.demo', 'user', 'SparkRF Hardware Labs', 'Hardware R&D', 'Founder & RF Engineer', '+91 98765 00008', false, NULL, false);

-- Set verified_by for verified accounts
UPDATE profiles SET verified_by = 'a0000000-0000-0000-0000-000000000001' WHERE is_verified = true AND id != 'a0000000-0000-0000-0000-000000000001';

-- 3. USER CREDENTIALS
INSERT INTO user_credentials (id, user_id, type, name, file_path, status, reviewed_by, reviewed_at, review_note) VALUES
-- Priya has all needed training
('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000005', 'training', 'ESD & High-Frequency Lab Safety Level 2', 'certs/priya_esd.pdf', 'verified', 'a0000000-0000-0000-0000-000000000001', now(), 'Verified certificate issued by Department of ECE'),
('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000005', 'training', 'Logic Analysis & FPGA Tools Certification', 'certs/priya_fpga.pdf', 'verified', 'a0000000-0000-0000-0000-000000000001', now(), 'Verified completion score 96%'),
('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000005', 'training', 'SMD Soldering & Rework Certification', 'certs/priya_solder.pdf', 'verified', 'a0000000-0000-0000-0000-000000000001', now(), 'Certified for temperature-controlled stations'),

-- Amit has pending/missing certificates (Fails eligibility on advanced resources)
('e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000006', 'training', 'Basic Electrical Safety', 'certs/amit_basic.pdf', 'verified', 'a0000000-0000-0000-0000-000000000001', now(), 'Passed 1st Year Safety Module'),
('e0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000006', 'training', 'ESD & High-Frequency Lab Safety Level 2', 'certs/amit_esd_pending.pdf', 'pending', NULL, NULL, 'Pending lab manager review'),

-- Rohan (Heavy user, all trained)
('e0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000007', 'training', 'ESD & High-Frequency Lab Safety Level 2', 'certs/rohan_esd.pdf', 'verified', 'a0000000-0000-0000-0000-000000000001', now(), 'M.Tech Research Scholar authorization'),
('e0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000007', 'training', 'Logic Analysis & FPGA Tools Certification', 'certs/rohan_fpga.pdf', 'verified', 'a0000000-0000-0000-0000-000000000001', now(), 'FPGA Lead Lab Instructor cert');

-- 4. 10 ECE RESOURCES
INSERT INTO resources (
  id, owner_id, organization_id, name, category, description, location,
  photos, status, min_booking_minutes, max_booking_minutes, advance_booking_days,
  requires_approval, requires_deposit, deposit_amount, supervision_required,
  usage_rules, safety_notes, qr_token
) VALUES
-- 1. Digital Oscilloscope
(
  'f0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000002',
  '11111111-1111-1111-1111-111111111111',
  'Tektronix 4-Channel 1GHz Digital Oscilloscope (MSO44)',
  'instrument',
  'High-performance 4-channel mixed signal oscilloscope with 1GHz bandwidth, 6.25 GS/s sample rate, 13.3-inch HD touchscreen, and advanced bus decode for I2C, SPI, UART, and CAN.',
  'ECE Main Building, Room 202, Bench 4',
  ARRAY['https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'],
  'active',
  30,
  240,
  14,
  true,
  false,
  0.00,
  false,
  ARRAY['Wear grounded ESD wrist strap at all times', 'Do not exceed maximum probe input voltage (+/- 300V CAT II)', 'Save waveforms to designated USB drive, do not alter system calibration'],
  'Sensitive active differential probes require anti-static grounding before touching probe tips.',
  'qr-tektronix-mso44-202'
),

-- 2. Logic Analyzer
(
  'f0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000002',
  '11111111-1111-1111-1111-111111111111',
  'Keysight 16-Channel 500MHz High-Speed Logic Analyzer',
  'instrument',
  'Portable 16-channel logic analyzer with deep trace memory, digital pattern generator, protocol triggers, and timing correlation.',
  'ECE Main Building, Room 204, Bench 1',
  ARRAY['https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&w=800&q=80'],
  'active',
  30,
  180,
  7,
  true,
  false,
  0.00,
  false,
  ARRAY['Always ground logic harness ground clip before connecting signal flying leads', 'Do not disconnect probe wires under active device power'],
  'Ground loop prevention required when testing mains-connected prototypes.',
  'qr-keysight-logic-analyzer-204'
),

-- 3. Spectrum Analyzer
(
  'f0000000-0000-0000-0000-000000000003',
  'b0000000-0000-0000-0000-000000000002',
  '11111111-1111-1111-1111-111111111111',
  'Rohde & Schwarz Spectrum Analyzer 3GHz (FPC1500)',
  'instrument',
  'RF Spectrum analyzer with tracking generator, independent signal generator, and one-port vector network analyzer up to 3GHz. Ideal for antenna matching and EMI testing.',
  'RF & Microwave Lab, Room 305, RF Shielded Cage',
  ARRAY['https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80'],
  'active',
  60,
  240,
  10,
  true,
  true,
  500.00,
  true,
  ARRAY['Faculty or manager supervision required during RF power emissions tests', 'Maximum input RF power is +30 dBm (1 Watt) - always connect external 20dB attenuator first', 'Log calibration values in paper logbook'],
  'High-power RF can destroy the front-end mixer. Attenuator check mandatory.',
  'qr-rs-spectrum-fpc1500-305'
),

-- 4. Function Generator (Instant Access / No Approval)
(
  'f0000000-0000-0000-0000-000000000004',
  'b0000000-0000-0000-0000-000000000002',
  '11111111-1111-1111-1111-111111111111',
  'Agilent Dual-Channel Arbitrary Function Generator 80MHz',
  'instrument',
  'Dual-channel arbitrary waveform generator producing sine, square, ramp, pulse, and custom noise signals up to 80MHz with 14-bit resolution.',
  'ECE Undergraduate Lab, Room 101, Bench 8',
  ARRAY['https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=800&q=80'],
  'active',
  30,
  120,
  7,
  false, -- Auto-approves if eligible!
  false,
  0.00,
  false,
  ARRAY['Ensure load impedance setting matches circuit under test (50 Ohm vs High-Z)', 'Power down output channels before rewiring breadboard'],
  'Standard low voltage electrical safety rules apply.',
  'qr-agilent-func-gen-101'
),

-- 5. FPGA Development Board
(
  'f0000000-0000-0000-0000-000000000005',
  'b0000000-0000-0000-0000-000000000002',
  '11111111-1111-1111-1111-111111111111',
  'Xilinx Zynq UltraScale+ MPSoC Development Platform (ZCU104)',
  'computing',
  'High-end heterogeneous computing platform featuring quad-core ARM Cortex-A53, dual-core Cortex-R5, and UltraScale+ programmable logic with video codec unit.',
  'VLSI & Embedded Lab, Room 208, Locker 3',
  ARRAY['https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=800&q=80'],
  'active',
  60,
  360,
  14,
  true,
  false,
  0.00,
  false,
  ARRAY['Use only the supplied certified 12V 5A power brick', 'Keep cooling fan unobstructed while bitstream is programmed', 'Do not hot-swap FMC mezzanine cards'],
  'Thermal overload warning: monitor chip temperature via Vivado hardware manager.',
  'qr-xilinx-zynq-zcu104-208'
),

-- 6. Soldering Station
(
  'f0000000-0000-0000-0000-000000000006',
  'b0000000-0000-0000-0000-000000000002',
  '11111111-1111-1111-1111-111111111111',
  'Weller Professional SMD Rework & Soldering Station (WT2M)',
  'fabrication',
  'Dual-channel micro-soldering station with hot air pencil, micro-tweezers for 0402/0201 passives, and active fume extraction arm.',
  'PCB Assembly Workshop, Room 105, Station B',
  ARRAY['https://images.unsplash.com/photo-1581092162384-8987c1d64718?auto=format&fit=crop&w=800&q=80'],
  'active',
  30,
  120,
  5,
  true,
  false,
  0.00,
  false,
  ARRAY['Turn on fume extractor before heating irons', 'Wear safety glasses and heat-resistant silicone mat', 'Clean tips with brass wool, never files or blades', 'Double-check auto-standby timer when leaving'],
  'Hot air temperatures reach 450C. Extreme burn hazard.',
  'qr-weller-smd-wt2m-105'
),

-- 7. 3D Printer
(
  'f0000000-0000-0000-0000-000000000007',
  'b0000000-0000-0000-0000-000000000002',
  '22222222-2222-2222-2222-222222222222',
  'Prusa i3 MK3S+ Precision Rapid Prototyping 3D Printer',
  'fabrication',
  'High-precision FDM 3D printer for electronics enclosures, robotics brackets, and custom sensor jigs. Supports PLA, PETG, and conductive filament.',
  'Makerspace, Block D, Room 12',
  ARRAY['https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80'],
  'active',
  60,
  240,
  7,
  true,
  false,
  0.00,
  false,
  ARRAY['Only use approved filament spools (Prusament PLA or PETG)', 'Do not scrape PEI spring steel sheet with metal knives', 'Wait for heated bed to cool below 35C before part removal'],
  'Nozzle reaches 250C. Watch moving axes during print calibration.',
  'qr-prusa-mk3s-makerspace-12'
),

-- 8. Thermal Imaging Camera
(
  'f0000000-0000-0000-0000-000000000008',
  'b0000000-0000-0000-0000-000000000002',
  '11111111-1111-1111-1111-111111111111',
  'Fluke Precision High-Speed Thermal Imaging Camera (Ti480 PRO)',
  'camera',
  '640 x 480 thermal resolution camera with macro lens attachment for pinpointing overheated traces, short circuits, and power regulator hotspots on populated PCBs.',
  'Reliability & Diagnostics Lab, Room 210, Secure Cabinet A',
  ARRAY['https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80'],
  'active',
  30,
  120,
  7,
  true,
  true,
  300.00,
  false,
  ARRAY['Keep germanium lens cap on whenever camera is not imaging', 'Store in foam-padded Pelican case immediately after use', 'Never point directly at sun or high-power laser sources'],
  'Sensitive uncooled microbolometer sensor.',
  'qr-fluke-ti480-camera-210'
),

-- 9. Embedded Systems Testing Bay
(
  'f0000000-0000-0000-0000-000000000009',
  'b0000000-0000-0000-0000-000000000002',
  '11111111-1111-1111-1111-111111111111',
  'ECE IoT & Embedded Systems Testing Bay (Room 204)',
  'room',
  'Dedicated 6-person project development bay equipped with isolated bench power, overhead exhaust, Wi-Fi 6 sniffer, and multi-protocol hardware debuggers.',
  'ECE Main Building, 2nd Floor, Room 204',
  ARRAY['https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'],
  'active',
  60,
  360,
  14,
  true,
  false,
  0.00,
  false,
  ARRAY['All team members must check in upon entering', 'Leave bench surfaces cleared and turn off all DC power supplies when session ends', 'Report any tripped circuit breakers to lab tech immediately'],
  'Emergency master power shutoff button located beside the exit door.',
  'qr-bay-room-204'
),

-- 10. Hardware Demo & Seminar Room
(
  'f0000000-0000-0000-0000-000000000010',
  'b0000000-0000-0000-0000-000000000002',
  '11111111-1111-1111-1111-111111111111',
  'ECE Advanced Seminar & Hardware Demo Room (Room 301)',
  'room',
  '30-seat smart presentation room with 4K interactive display, wireless casting, document visualizer camera, and live circuit demo streaming capabilities.',
  'ECE Main Building, 3rd Floor, Room 301',
  ARRAY['https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80'],
  'active',
  60,
  240,
  21,
  true,
  false,
  0.00,
  false,
  ARRAY['No food or beverages permitted inside', 'Return HDMI dongles and wireless pointers to the podium drawer', 'Lock projector console when session completes'],
  'Follow emergency egress route posted at the rear entrance.',
  'qr-seminar-room-301'
);

-- 5. RESOURCE MANAGERS
-- Vikram Mehra is manager for Dr. Rajesh Sharma's resources
INSERT INTO resource_managers (resource_id, manager_id) VALUES
('f0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004'),
('f0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000004'),
('f0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000004'),
('f0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004'),
('f0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000004'),
('f0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000004');

-- 6. RESOURCE REQUIREMENTS
INSERT INTO resource_requirements (resource_id, type, key, value, description) VALUES
-- Oscilloscope requires ESD safety
('f0000000-0000-0000-0000-000000000001', 'training', 'training_cert', 'ESD & High-Frequency Lab Safety Level 2', 'ESD & High-Frequency Lab Safety Level 2'),

-- Logic Analyzer requires FPGA / Logic tools
('f0000000-0000-0000-0000-000000000002', 'training', 'training_cert', 'Logic Analysis & FPGA Tools Certification', 'Logic Analysis & FPGA Tools Certification'),

-- Spectrum analyzer requires ESD + college affiliation
('f0000000-0000-0000-0000-000000000003', 'training', 'training_cert', 'ESD & High-Frequency Lab Safety Level 2', 'ESD & High-Frequency Lab Safety Level 2'),
('f0000000-0000-0000-0000-000000000003', 'org', 'organization_name', 'Apex Institute of Technology', 'Must be affiliated with Apex Institute of Technology'),

-- FPGA Board requires FPGA training
('f0000000-0000-0000-0000-000000000005', 'training', 'training_cert', 'Logic Analysis & FPGA Tools Certification', 'Logic Analysis & FPGA Tools Certification'),

-- Soldering station requires SMD soldering cert
('f0000000-0000-0000-0000-000000000006', 'training', 'training_cert', 'SMD Soldering & Rework Certification', 'SMD Soldering & Rework Certification');

-- 7. RESOURCE AVAILABILITY (Monday to Friday 09:00 - 18:00, Saturday 09:00 - 13:00)
DO $$
DECLARE
  r RECORD;
  d INTEGER;
BEGIN
  FOR r IN SELECT id FROM resources LOOP
    -- Mon (1) to Fri (5)
    FOR d IN 1..5 LOOP
      INSERT INTO resource_availability (resource_id, weekday, start_time, end_time)
      VALUES (r.id, d, '08:00:00', '19:00:00');
    END LOOP;
    -- Sat (6)
    INSERT INTO resource_availability (resource_id, weekday, start_time, end_time)
    VALUES (r.id, 6, '09:00:00', '14:00:00');
  END LOOP;
END $$;

-- 8. PRE-MADE SEED BOOKINGS IN VARIOUS LIFECYCLE STATES (Section 15)
-- State 1: Completed with full condition history & audit log (Tektronix Oscilloscope)
INSERT INTO bookings (
  id, resource_id, user_id, start_at, end_at, purpose, project_need, status,
  decision_reason, rule_applied, waitlist_position, priority_score, priority_breakdown,
  requested_at, decided_by, decided_at, checked_in_at, returned_at
) VALUES (
  '10000000-0000-0000-0000-000000000001',
  'f0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000005',
  now() - INTERVAL '3 days',
  now() - INTERVAL '3 days' + INTERVAL '2 hours',
  'Final Year Capstone: Testing high-speed SPI bus transitions on custom motor controller PCB',
  'Required for IEEE conference paper hardware validation',
  'closed',
  'Approved: Clear project scope and verified ESD Level 2 training credentials.',
  'Manager Authorization Required',
  NULL,
  88.5,
  '{"hours_factor": 38.0, "wait_factor": 22.0, "reliability_factor": 18.5, "project_need_bonus": 10.0}'::jsonb,
  now() - INTERVAL '4 days',
  'b0000000-0000-0000-0000-000000000002',
  now() - INTERVAL '3 days' - INTERVAL '2 hours',
  now() - INTERVAL '3 days',
  now() - INTERVAL '3 days' + INTERVAL '1 hour 55 minutes'
);

-- Condition reports for completed booking
INSERT INTO condition_reports (booking_id, phase, condition, notes, recorded_by, recorded_at) VALUES
('10000000-0000-0000-0000-000000000001', 'before', 'excellent', 'Oscilloscope calibrated, 4 passive probes and 2 active differential probes present in good shape.', 'd0000000-0000-0000-0000-000000000005', now() - INTERVAL '3 days'),
('10000000-0000-0000-0000-000000000001', 'after', 'excellent', 'Session complete, cleaned probe tips, returned all accessories to drawer.', 'd0000000-0000-0000-0000-000000000005', now() - INTERVAL '3 days' + INTERVAL '1 hour 55 minutes');

-- State 2: Currently Active Checked-Out Loan (Keysight Logic Analyzer)
INSERT INTO bookings (
  id, resource_id, user_id, start_at, end_at, purpose, project_need, status,
  decision_reason, rule_applied, waitlist_position, priority_score, priority_breakdown,
  requested_at, decided_by, decided_at, checked_in_at
) VALUES (
  '10000000-0000-0000-0000-000000000002',
  'f0000000-0000-0000-0000-000000000002',
  'd0000000-0000-0000-0000-000000000005',
  now() - INTERVAL '30 minutes',
  now() + INTERVAL '90 minutes',
  'Debugging UART packet drops on BLE gateway module',
  'Sensor network lab exercise 4',
  'checked_out',
  'Approved by Lab Manager Vikram Mehra: Verified user and prerequisite logic training.',
  'Manager Authorization Required',
  NULL,
  82.0,
  '{"hours_factor": 35.0, "wait_factor": 20.0, "reliability_factor": 17.0, "project_need_bonus": 10.0}'::jsonb,
  now() - INTERVAL '6 hours',
  'c0000000-0000-0000-0000-000000000004',
  now() - INTERVAL '5 hours',
  now() - INTERVAL '25 minutes'
);

INSERT INTO condition_reports (booking_id, phase, condition, notes, recorded_by, recorded_at) VALUES
('10000000-0000-0000-0000-000000000002', 'before', 'good', 'Flying leads inspected; ribbon cable intact and functional.', 'd0000000-0000-0000-0000-000000000005', now() - INTERVAL '25 minutes');

-- State 3: Overdue Loan (Fluke Thermal Camera)
INSERT INTO bookings (
  id, resource_id, user_id, start_at, end_at, purpose, project_need, status,
  decision_reason, rule_applied, is_overdue,
  requested_at, decided_by, decided_at, checked_in_at
) VALUES (
  '10000000-0000-0000-0000-000000000003',
  'f0000000-0000-0000-0000-000000000008',
  'd0000000-0000-0000-0000-000000000007',
  now() - INTERVAL '3 hours',
  now() - INTERVAL '30 minutes', -- Past end_at!
  'Thermal analysis of custom gallium-nitride power supply PCB',
  'PhD thesis thermal benchmark',
  'overdue',
  'Approved: verified researcher with security deposit confirmed.',
  'Manager Authorization Required',
  true,
  now() - INTERVAL '1 day',
  'b0000000-0000-0000-0000-000000000002',
  now() - INTERVAL '18 hours',
  now() - INTERVAL '2 hours 50 minutes'
);

INSERT INTO condition_reports (booking_id, phase, condition, notes, recorded_by, recorded_at) VALUES
('10000000-0000-0000-0000-000000000003', 'before', 'excellent', 'Lens inspected, battery 100%, SD card installed.', 'd0000000-0000-0000-0000-000000000007', now() - INTERVAL '2 hours 50 minutes');

-- State 4: Disputed / Damage Incident (Weller Soldering Station)
INSERT INTO bookings (
  id, resource_id, user_id, start_at, end_at, purpose, status,
  decision_reason, rule_applied,
  requested_at, decided_by, decided_at, checked_in_at, returned_at
) VALUES (
  '10000000-0000-0000-0000-000000000004',
  'f0000000-0000-0000-0000-000000000006',
  'd0000000-0000-0000-0000-000000000007',
  now() - INTERVAL '1 day' - INTERVAL '3 hours',
  now() - INTERVAL '1 day' - INTERVAL '1 hour',
  'Desoldering QFN IC from prototype board',
  'disputed',
  'Approved for research rework session.',
  'Manager Authorization Required',
  now() - INTERVAL '2 days',
  'c0000000-0000-0000-0000-000000000004',
  now() - INTERVAL '1 day' - INTERVAL '5 hours',
  now() - INTERVAL '1 day' - INTERVAL '2 hours 55 minutes',
  now() - INTERVAL '1 day' - INTERVAL '1 hour 5 minutes'
);

INSERT INTO condition_reports (booking_id, phase, condition, notes, recorded_by, recorded_at) VALUES
('10000000-0000-0000-0000-000000000004', 'before', 'good', 'Station heating up normally, chisel tip attached.', 'd0000000-0000-0000-0000-000000000007', now() - INTERVAL '1 day' - INTERVAL '2 hours 55 minutes'),
('10000000-0000-0000-0000-000000000004', 'after', 'damaged', 'Hot air heating element burned out during prolonged heating, tip blackened and pitted.', 'c0000000-0000-0000-0000-000000000004', now() - INTERVAL '1 day' - INTERVAL '1 hour 5 minutes');

-- Open damage incident
INSERT INTO incidents (
  id, booking_id, resource_id, reported_by, type, severity, description, status,
  ai_summary, ai_summary_reviewed, created_at
) VALUES (
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000004',
  'f0000000-0000-0000-0000-000000000006',
  'c0000000-0000-0000-0000-000000000004',
  'damage',
  'high',
  'Hot air nozzle heating cartridge burned out; thermocouple indicates open circuit error 104. Fine rework tip damaged by incorrect cleaning solvent.',
  'open',
  'AI-generated summary - review before acting: High-severity hardware damage reported on Weller Soldering Station. Heating element failed and fine tip ruined. Repair/replacement required before re-enabling slot.',
  true,
  now() - INTERVAL '1 day' - INTERVAL '1 hour'
);

-- State 5: Waitlisted Booking (Tektronix Oscilloscope conflicting slot)
INSERT INTO bookings (
  id, resource_id, user_id, start_at, end_at, purpose, project_need, status,
  decision_reason, rule_applied, waitlist_position, priority_score, priority_breakdown,
  requested_at
) VALUES (
  '10000000-0000-0000-0000-000000000005',
  'f0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000006',
  now() + INTERVAL '1 day',
  now() + INTERVAL '1 day' + INTERVAL '2 hours',
  'Lab practical exercise: Measuring crystal oscillator harmonics',
  'Academic coursework lab assessment',
  'waitlisted',
  'Slot is reserved by an active booking. You have been placed on the transparent waitlist at position #1.',
  'Waitlist Queuing & Fair Priority Formula',
  1,
  74.0,
  '{"hours_factor": 34.0, "wait_factor": 15.0, "reliability_factor": 15.0, "project_need_bonus": 10.0}'::jsonb,
  now() - INTERVAL '4 hours'
);

-- State 6: Pending Review Request
INSERT INTO bookings (
  id, resource_id, user_id, start_at, end_at, purpose, project_need, status,
  decision_reason, rule_applied,
  requested_at
) VALUES (
  '10000000-0000-0000-0000-000000000006',
  'f0000000-0000-0000-0000-000000000005',
  'd0000000-0000-0000-0000-000000000005',
  now() + INTERVAL '2 days',
  now() + INTERVAL '2 days' + INTERVAL '3 hours',
  'FPGA Deep Learning accelerator deployment and latency profiling',
  'Final capstone evaluation demo',
  'pending_review',
  'Requirements verified automatically. Request forwarded to lab manager for slot confirmation.',
  'Manager Authorization Required',
  now() - INTERVAL '1 hour'
);

-- 9. AUDIT LOG INITIAL EVENTS (Append-only)
INSERT INTO audit_log (actor_id, actor_role, action, entity_type, entity_id, booking_id, resource_id, details, created_at) VALUES
('d0000000-0000-0000-0000-000000000005', 'user', 'BOOKING_REQUESTED', 'booking', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', '{"status": "pending_review"}'::jsonb, now() - INTERVAL '4 days'),
('b0000000-0000-0000-0000-000000000002', 'owner', 'BOOKING_APPROVED', 'booking', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', '{"reason": "Approved: Clear project scope and verified ESD training."}'::jsonb, now() - INTERVAL '3 days' - INTERVAL '2 hours'),
('d0000000-0000-0000-0000-000000000005', 'user', 'BOOKING_CHECKED_OUT', 'booking', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', '{"condition": "excellent"}'::jsonb, now() - INTERVAL '3 days'),
('d0000000-0000-0000-0000-000000000005', 'user', 'BOOKING_CLOSED', 'booking', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', '{"condition": "excellent", "on_time": true}'::jsonb, now() - INTERVAL '3 days' + INTERVAL '1 hour 55 minutes');

-- 10. SAMPLE INITIAL NOTIFICATIONS
INSERT INTO notifications (user_id, type, title, message, link, is_read, created_at) VALUES
('d0000000-0000-0000-0000-000000000005', 'booking_status', 'Booking Approved: Tektronix Oscilloscope', 'Your reservation request was approved by Dr. Rajesh Sharma.', '/bookings/10000000-0000-0000-0000-000000000001', true, now() - INTERVAL '3 days'),
('d0000000-0000-0000-0000-000000000006', 'booking_status', 'Waitlisted at Position #1', 'You are #1 on the waitlist for Tektronix 4-Channel 1GHz Digital Oscilloscope.', '/bookings/10000000-0000-0000-0000-000000000005', false, now() - INTERVAL '4 hours'),
('d0000000-0000-0000-0000-000000000007', 'overdue', 'Equipment Return Overdue', 'Your booked equipment (Fluke Thermal Camera) is past due. Please return it to the lab immediately.', '/bookings/10000000-0000-0000-0000-000000000003', false, now() - INTERVAL '20 minutes');
