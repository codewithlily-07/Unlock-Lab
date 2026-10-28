/**
 * UNLOCKLAB - SYSTEM CONSTANTS & CONFIGURATION
 */

export const ROLES = {
  USER: 'user',
  OWNER: 'owner',
  MANAGER: 'manager',
  ADMIN: 'admin',
};

export const RESOURCE_CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'instrument', label: 'Test & Measurement Instruments' },
  { value: 'fabrication', label: 'Fabrication & Prototyping' },
  { value: 'computing', label: 'High-Performance & FPGA Computing' },
  { value: 'camera', label: 'Diagnostic Cameras & Sensors' },
  { value: 'room', label: 'Specialized Labs & Project Rooms' },
  { value: 'other', label: 'Other Equipment' },
];

export const BOOKING_STATUSES = {
  REQUESTED: 'requested',
  ELIGIBILITY_FAILED: 'eligibility_failed',
  PENDING_REVIEW: 'pending_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  WAITLISTED: 'waitlisted',
  CANCELLED: 'cancelled',
  CHECKED_OUT: 'checked_out',
  RETURNED: 'returned',
  OVERDUE: 'overdue',
  RETURNED_LATE: 'returned_late',
  DISPUTED: 'disputed',
  CLOSED: 'closed',
  NO_SHOW: 'no_show',
};

export const STATUS_CONFIG = {
  requested: { label: 'Requested', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  eligibility_failed: { label: 'Eligibility Failed', color: 'bg-rose-100 text-rose-800 border-rose-200' },
  pending_review: { label: 'Pending Review', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  rejected: { label: 'Rejected', color: 'bg-slate-100 text-slate-700 border-slate-300' },
  waitlisted: { label: 'Waitlisted', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  cancelled: { label: 'Cancelled', color: 'bg-slate-100 text-slate-500 border-slate-200' },
  checked_out: { label: 'Checked Out (Active)', color: 'bg-sky-100 text-sky-800 border-sky-300 ring-2 ring-sky-400/30' },
  returned: { label: 'Returned', color: 'bg-teal-100 text-teal-800 border-teal-200' },
  overdue: { label: 'Overdue!', color: 'bg-red-100 text-red-800 border-red-300 animate-pulse' },
  returned_late: { label: 'Returned Late', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  disputed: { label: 'Disputed / Damaged', color: 'bg-red-100 text-red-900 border-red-300 font-semibold' },
  closed: { label: 'Completed (Closed)', color: 'bg-slate-100 text-slate-800 border-slate-300' },
  no_show: { label: 'No Show', color: 'bg-zinc-100 text-zinc-700 border-zinc-300' },
};

export const QUICK_PICK_REASONS = {
  approve: [
    'Prerequisites verified and lab bench slot confirmed.',
    'Clear academic project scope with verified safety credentials.',
    'Off-peak reservation granted to maximize institutional equipment utilization.',
    'Supervised session approved under scheduled lab assistant window.',
  ],
  reject: [
    'Missing required specialized laboratory safety training credential.',
    'Equipment booked for mandatory department exam / maintenance during requested hours.',
    'Project proposal outside laboratory safety classification scope.',
    'Requested slot conflicts with department master curriculum schedule.',
  ],
  waitlist: [
    'Slot currently committed to primary project; placed in transparent waitlist.',
    'Bench capacity reached for this timeframe. Will auto-promote if earlier slot cancels.',
  ],
};

export const DEMO_PERSONAS = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    name: 'Dr. Arvind Sen',
    email: 'admin@unlocklab.demo',
    role: 'admin',
    title: 'Lab Director & Admin',
    desc: 'Verify owners/credentials, audit logs, fair-use policies, disputes.',
    badge: 'Admin',
    color: 'bg-purple-600',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    name: 'Dr. Rajesh Sharma',
    email: 'owner1@unlocklab.demo',
    role: 'owner',
    title: 'ECE Department Head (Verified Owner)',
    desc: 'List equipment, review requests, approve/reject with reasons, monitor loans.',
    badge: 'Verified Owner',
    color: 'bg-blue-600',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000003',
    name: 'Prof. Sunita Rao',
    email: 'owner2@unlocklab.demo',
    role: 'owner',
    title: 'Robotics Lead (Unverified Owner)',
    desc: 'Demonstrates admin verification requirement before publishing equipment.',
    badge: 'Unverified Owner',
    color: 'bg-amber-600',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000004',
    name: 'Vikram Mehra',
    email: 'manager@unlocklab.demo',
    role: 'manager',
    title: 'Senior Lab Technician & Manager',
    desc: 'Delegated manager for ECE benches: review queue, check-in, condition check.',
    badge: 'Lab Manager',
    color: 'bg-teal-600',
  },
  {
    id: 'd0000000-0000-0000-0000-000000000005',
    name: 'Priya Patel',
    email: 'student1@unlocklab.demo',
    role: 'user',
    title: 'Final Year Student (Fully Eligible)',
    desc: 'Verified, has ESD & FPGA certifications. Passes all eligibility tests.',
    badge: 'Trained Borrower',
    color: 'bg-emerald-600',
  },
  {
    id: 'd0000000-0000-0000-0000-000000000006',
    name: 'Amit Kumar',
    email: 'student2@unlocklab.demo',
    role: 'user',
    title: '3rd Year Student (Missing Cert)',
    desc: 'Missing ESD certification. Fails eligibility on Oscilloscope with "how to fix".',
    badge: 'Needs Training',
    color: 'bg-orange-600',
  },
  {
    id: 'd0000000-0000-0000-0000-000000000007',
    name: 'Rohan Verma',
    email: 'student3@unlocklab.demo',
    role: 'user',
    title: 'M.Tech Scholar (Heavy User & Overdue Demo)',
    desc: 'Has active overdue loan on Fluke Camera and near weekly quota limit.',
    badge: 'Heavy User',
    color: 'bg-red-600',
  },
  {
    id: 'd0000000-0000-0000-0000-000000000008',
    name: 'Ananya Sen',
    email: 'outsider@unlocklab.demo',
    role: 'user',
    title: 'Startup Founder (External / Unverified)',
    desc: 'SparkRF Hardware startup. Shows external access & verification workflow.',
    badge: 'External Startup',
    color: 'bg-indigo-600',
  },
];
