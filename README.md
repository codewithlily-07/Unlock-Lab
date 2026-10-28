# UnlockLab 🔬⚡
> **Trusted Institutional Platform for Safely Sharing Underused Equipment and Spaces**  
> Built for the 48-Hour Hackathon (Problem: *Unlock Underused Equipment and Spaces*).

[![Tests](https://img.shields.io/badge/tests-all%20passing-brightgreen)](#automated-testing)
[![Tech Stack](https://img.shields.io/badge/stack-React%2018%20%2B%20Tailwind%20%2B%20Supabase-blue)](#tech-stack)
[![State Machine](https://img.shields.io/badge/state%20machine-14%20states%20%7C%20Postgres%20RPC-indigo)](#booking-state-machine)

---

## 📖 Quick Overview

University electronics and communication engineering (ECE) departments invest millions in high-end test instruments (1GHz+ oscilloscopes, 16-channel logic analyzers, 3GHz spectrum analyzers, FPGA prototyping platforms, rework stations) that sit idle **70–80% of the academic calendar**. At the same time, undergraduate capstone students, researchers, and local hardware startups face severe equipment shortages or cannot afford proprietary test gear.

**UnlockLab** provides an institutional trust platform demonstrating the complete **10-step lifecycle** of equipment sharing:
1. **List Resource**: Owner defines location, rules, safety notes, deposit, and prerequisite training.
2. **Discover & Verify**: Borrower browses equipment and checks a real-time eligibility checklist.
3. **Request Slot**: Borrower submits booking window, purpose, and milestone need.
4. **Auto-Verification**: Eligibility engine validates verified credentials, standing, and rolling quotas.
5. **Human Review Queue**: Lab manager reviews request with a rule-based suggested decision.
6. **Auditable Decision**: Approved, rejected, or waitlisted with a mandatory plain-language reason.
7. **Check-In Inspection**: Borrower confirms identity and records initial condition report.
8. **Custody Return**: Final physical condition is compared against check-in report.
9. **Dispute Resolution**: Observed damages automatically trigger disputes and open incidents.
10. **Immutable History**: Both parties access an append-only audit trail and print a custody receipt.

---

## ⚡ Quick Start (Under 10 Commands)

```bash
# 1. Clone repository
git clone https://github.com/your-org/unlocklab.git
cd unlocklab

# 2. Install dependencies
npm install

# 3. (Optional) Configure Supabase in .env or run with built-in zero-setup demo mode
cp .env.example .env

# 4. Run automated database and security tests (24 assertions)
npm run test:db

# 5. Run full 10-step lifecycle end-to-end test
npm run test:e2e

# 6. Run comprehensive verification pipeline
npm run test:all

# 7. Start local development server
npm run dev
```

Open **http://localhost:3001** (or port 3000) in your browser.

---

## 👥 Seed Demo Personas (Password: `Demo@12345` for all)

UnlockLab includes a **1-Click Demo Persona Switcher** in the top navigation bar for instant judge testing:

| Role | Persona Name | Email | Key Features & Purpose |
| :--- | :--- | :--- | :--- |
| **Admin** | Dr. Arvind Sen | `admin@unlocklab.demo` | Verifications queue, global audit log CSV export, fair-use settings. |
| **Owner (Verified)** | Dr. Rajesh Sharma | `owner1@unlocklab.demo` | Head of ECE. Lists equipment, reviews requests, manages active loans. |
| **Owner (Unverified)**| Prof. Sunita Rao | `owner2@unlocklab.demo` | Unverified owner; demonstrates rule blocking unverified publishing. |
| **Manager** | Vikram Mehra | `manager@unlocklab.demo` | ECE Lab Tech. Review queue, suggested decisions, check-in & return. |
| **Borrower (Eligible)** | Priya Patel | `student1@unlocklab.demo` | Verified student with ESD & FPGA training. Passes all eligibility checks. |
| **Borrower (Training Req)** | Amit Kumar | `student2@unlocklab.demo` | Missing ESD certificate. Shows red checklist with "How to fix" action. |
| **Borrower (Heavy User)** | Rohan Verma | `student3@unlocklab.demo` | Near 6.0 hr weekly quota; has active overdue loan on Fluke Camera. |
| **Borrower (External)** | Ananya Sen | `outsider@unlocklab.demo` | SparkRF Hardware Startup. Shows external partner workflow. |

---

## 🧪 Automated Testing

UnlockLab ships with hardened automated tests:

```bash
# Run database assertions (RLS, direct-write attacks, concurrency, state machine)
npm run test:db

# Run full 10-step lifecycle journey
npm run test:e2e

# Run all test suites together with production build check
npm run test:all
```

### Verified Test Assertions:
- ✅ **Eligibility Engine**: Verified unexpired credentials pass; missing certs fail with actionable `how_to_fix`.
- ✅ **State Machine**: Direct illegal jumps (e.g. `requested` -> `checked_out`) are blocked; blank reasons rejected.
- ✅ **Direct-Write Attack Defense (Section 11A)**: Direct client UPDATE on `bookings(status='approved')`, `profiles(role='admin')`, and `incidents(status='resolved')` fail.
- ✅ **Audit Log Immutability (Section 11C)**: Direct UPDATE and DELETE on `audit_log` are strictly blocked by Postgres engine triggers.
- ✅ **Concurrency Locking (Section 12)**: `tstzrange` EXCLUDE constraint blocks overlapping slot double-bookings with a friendly error.

---

## 🚀 Deployment Guide

### Deploying to Supabase Cloud:
1. Create a new Supabase project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run the following in order:
   - `supabase/migrations/0001_initial_schema.sql`
   - `supabase/migrations/0002_security_rls_revocations.sql`
   - `supabase/migrations/0003_rpc_functions.sql`
   - `supabase/seed.sql`
3. Under **Storage**, create two private buckets: `condition-photos` and `credentials`.
4. Copy `Project URL`, `anon key`, and `service_role key` into `.env`.

### Deploying to Vercel:
1. Import repository on [vercel.com](https://vercel.com).
2. Set Environment Variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_DEMO_MODE=true`).
3. Deploy! Vercel automatically runs `npm run build`.

---

## 📄 License & Hackathon Disclosure
Built for the 48-Hour Hackathon. All demo accounts, student profiles, and equipment data are fictional.
See [PROJECT_DOCUMENT.md](./PROJECT_DOCUMENT.md) for full architecture diagrams and design disclosures.
