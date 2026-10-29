# UnlockLab: Technical & Product Design Document
### Hackathon Problem: "Unlock Underused Equipment and Spaces"
*A trusted, auditable platform for sharing idle institutional spaces, equipment, and technical resources.*

---

## 1. Focused Use Case & Target Users

### Focused Domain
A collegiate **Electronics and Communication Engineering (ECE) Department** shares underused laboratory test equipment and specialized spaces (digital oscilloscopes, high-speed logic analyzers, RF spectrum analyzers, FPGA prototyping stations, SMD soldering rework stations, thermal cameras, and testing rooms) with:
1. **Undergraduate Students**: Enrolled in capstone projects requiring high-frequency testing.
2. **Postgraduate & M.Tech Scholars**: Conducting doctoral or milestone thesis hardware research.
3. **Faculty & Lab Technicians**: Governing laboratory bench safety, custody, and calibration.
4. **Nearby Students & Hardware Startups**: Regional hardware innovators incubated locally lacking expensive capital equipment.

---

## 2. Why the Problem Matters (Reasoning & Evidence)

1. **Capital Inefficiency**: A single mixed-signal oscilloscope or vector network analyzer costs between $5,000 and $40,000. In collegiate settings, these benches sit idle **over 70% of the academic calendar** outside scheduled 3-hour lab courses.
2. **The "Fear of Breakage" Barrier**: Lab heads and department chairs historically lock equipment in cabinets because traditional sign-out sheets lack **condition accountability**, **tamper-proof chain of custody**, and **verified prerequisite enforcement**.
3. **Monopolization & Nepotism**: Without published quotas, well-connected students or dominant research groups monopolize high-demand benches for weeks while other students stall on critical graduation milestones.

---

## 3. Architecture & Tech Stack

```
+-----------------------------------------------------------------------------------+
|                              CLIENT TIER (React 18 + Vite)                        |
|                                                                                   |
|  +--------------------+  +----------------------+  +---------------------------+  |
|  |   Explore Catalog  |  |  Eligibility Engine  |  |   Owner Review Queue      |  |
|  | (Filters, Search)  |  |  (Live Prerequisites)|  | (Suggested Actions, Quick)|  |
|  +--------------------+  +----------------------+  +---------------------------+  |
|  +--------------------+  +----------------------+  +---------------------------+  |
|  |  Handover Receipt  |  |  Custody Check-In    |  |  Audit Log Timeline       |  |
|  |  (Print / PDF)     |  |  & Return Comparison |  |  (10 Lifecycle Steps)     |  |
|  +--------------------+  +----------------------+  +---------------------------+  |
|                                                                                   |
|  Theme System: Central CSS Variables (src/theme.css + tailwind.config.js)        |
+-----------------------------------------------------------------------------------+
                                          |
                      (HTTPS / REST / Postgres RPC)
                                          |
+-----------------------------------------------------------------------------------+
|                        DATABASE & SECURITY LAYER (Supabase Postgres)              |
|                                                                                   |
|  SECURITY DEFINER RPC FUNCTIONS (Tamper-Proof Business Logic):                    |
|  - request_booking(...) [Resource Concurrency Locking: SELECT ... FOR UPDATE]    |
|  - transition_booking(...) [Enforces 14-State Machine, Mandatory Reasons]         |
|  - check_eligibility(...) [Validates standing, quotas, and verified certs]        |
|  - check_in(...) & return_booking(...) [Condition reports & damage flags]         |
|  - promote_waitlist(...) [Auto-promotes top candidate on slot cancellation]       |
|                                                                                   |
|  HARDENED CONSTRAINTS & IMMUTABILITY:                                             |
|  - EXCLUDE USING gist (resource_id WITH =, tstzrange WITH &&) [Anti-Double-Book]  |
|  - REVOKE INSERT/UPDATE/DELETE on critical tables from anon and authenticated      |
|  - Append-Only Postgres Engine Trigger blocking UPDATE/DELETE on audit_log        |
|  - Row Level Security (RLS) on all 15 tables                                      |
+-----------------------------------------------------------------------------------+
```

---

## 4. Complete 10-Step Lifecycle Workflow

```
[1. Owner Lists Equipment & Defines Prerequisites]
                     |
                     v
[2. Borrower Discovers Equipment & Checks Real-Time Eligibility]
                     |
                     v
[3. Borrower Submits Slot Window, Purpose, & Milestone Need]
                     |
                     v
[4. Automated Engine Validates Identity, Certifications, & Weekly Quotas]
                     |
                     v
[5. Lab Manager Reviews in Queue with Rule-Based Suggested Decision]
                     |
                     v
[6. Approved, Rejected, or Waitlisted (MANDATORY Plain-Language Reason)]
                     |
                     v
[7. Borrower Checks In & Records Initial Condition Inspection]
                     |
                     v
[8. Borrower Returns Resource & Inspects Before-vs-After Condition]
                     |
                     v
[9. Observed Damage Flags Incident -> Disputed State -> Manager Resolves -> Closed]
                     |
                     v
[10. Both Parties Access Immutable Audit Trail & Print Custody Handover Receipt]
```

---

## 5. Security, Trust, & Privacy Architecture (Section 11)

1. **No Direct Writes to Critical Tables (Section 11A)**:
   - Direct `INSERT`, `UPDATE`, and `DELETE` on `bookings`, `condition_reports`, `incidents`, `audit_log`, and `fair_use_settings` are strictly revoked from `anon` and `authenticated` roles.
   - All state mutations execute exclusively through `SECURITY DEFINER` Postgres functions with an explicit `SET search_path = public`.
2. **Engine-Level Concurrency Safety (Section 12)**:
   - Resource row locks (`SELECT ... FOR UPDATE`) serialize competing simultaneous requests.
   - A PostgreSQL `tstzrange` EXCLUDE constraint on `(status IN ('approved', 'checked_out'))` guarantees at the kernel level that overlapping double-bookings can never occur.
3. **Immutable Audit Trail (Section 11C)**:
   - A PostgreSQL engine trigger raises a hard exception if any actor attempts an `UPDATE` or `DELETE` on the `audit_log` table.
4. **Data Minimization (Section 11E & 11H)**:
   - Personal phone numbers and emails are never exposed publicly.
   - Uploaded safety credentials are stored privately and inspected exclusively by verified departmental staff.

---

## 6. Explainable Fair Allocation Formula (Section 7)

When slots conflict, borrower waitlist priority is calculated transparently out of 100 points:

$$\text{Priority Score} = (\text{Hours Factor} \times 0.40) + (\text{Wait Time FIFO} \times 0.30) + (\text{Reliability} \times 0.20) + (\text{Milestone Bonus} \times 0.10)$$

- **Hours Factor (40%)**: Infrequent users score higher than heavy users near the 6.0-hour weekly cap.
- **Wait Time (30%)**: First-in, first-out tiebreaker based on request timestamp.
- **Reliability (20%)**: Based on verified clean handovers and on-time returns (scored 0–100).
- **Academic Milestone Bonus (10%)**: Declared capstone, thesis, or paper validation grant +10 points.

---

## 7. AI Integration & Human-in-the-Loop Guarantees (Section 10)

- **Strict Boundary**: AI **never** approves, rejects, or penalizes any user.
- **Advisory Only**: When an incident is opened, an AI summary is generated and explicitly labelled:
  > *"AI-generated summary - review before acting"*
- **Graceful Fallback**: If the Gemini API key is unavailable or offline, the system seamlessly generates a factual, template-based incident digest without throwing an error.

---

## 8. Manual Judge Testing Checklist (Click Paths)

UnlockLab provides a **1-Click Demo Persona Switcher** in the top navigation bar. Test these 5 core scenarios:

### Scenario A: Real-Time Eligibility Pass vs. Fail
1. In the top navbar, select **Priya Patel** (Trained Student).
2. Go to **Explore Equipment** -> Click **Tektronix Oscilloscope**.
3. Observe: All 4 checklist items have green checkmarks because Priya holds verified ESD Level 2 training.
4. Now switch persona to **Amit Kumar** (Missing Training).
5. Observe: The checklist instantly turns red, blocking submission with an action item: *"Upload your certificate for ESD & High-Frequency Lab Safety Level 2 in My Credentials"*.

### Scenario B: Owner Review with Mandatory Reason
1. Switch persona to **Dr. Rajesh Sharma** (Verified Owner).
2. Navigate to **Review Queue** (`/owner/requests`).
3. View pending requests with requester badges and a rule-based **Suggested Decision**.
4. Click **Approve Request**; select a quick-pick template or enter a custom reason. Click confirm.

### Scenario C: Custody Check-In & Handover
1. Switch persona to **Priya Patel**.
2. Go to **My Bookings** -> On the approved reservation, click **Check In Now**.
3. Select initial condition (e.g. *Excellent*), accept safety terms, and click **Confirm Check-In**.
4. Observe: Celebration confetti fires, and status advances to `checked_out`.

### Scenario D: Return Inspection & Damage Dispute Flow
1. In **My Bookings**, select the active loan and click **Return Equipment**.
2. Compare the side-by-side **Before-vs-After** condition cards.
3. Check **"Flag Damage or Malfunction"**, enter description: *"Channel 1 BNC connector loose"*.
4. Click **Submit Return with Damage Dispute**.
5. Observe: Status transitions to `disputed` and an open incident is generated.
6. Switch persona to **Vikram Mehra** (Lab Manager) -> Navigate to **Incidents** (`/owner/incidents`).
7. Inspect the incident and AI advisory summary -> Click **Resolve Dispute & Recertify**.
8. Observe: Incident is marked resolved, and the booking closes cleanly.

### Scenario E: Printable Handover Receipt & Immutable Audit Trail
1. Open any completed booking details screen (`/bookings/:id`).
2. Review the **"Why this decision?"** explainability box and the **Audit Log Timeline**.
3. Click **Print Custody Receipt** to view the clean, browser-printable custody handover document.
4. Click **Export Calendar (.ics)** to generate an industry-standard calendar reminder.

---

## 9. Disclosed Tools, Libraries, & AI Assistance

- **Frontend Framework**: React 18, Vite 5, Tailwind CSS 3, React Router v6.
- **Icons & Visuals**: `lucide-react`, `canvas-confetti`, `qrcode`.
- **Backend & Database**: Supabase (PostgreSQL 15, Row Level Security, RPC Functions, B-Tree & GIST extensions).
- **AI Tools**: Google Antigravity Agentic Assistant was utilized for code generation, architecture planning, and database migration structuring.

---

## 10. Team & Role Placeholders

- **Lead Full-Stack Engineer**: *UnlockLab Engineering Team*
- **Product & Systems Designer**: *ECE Department Lab Operations*
- **Database & Security Architect**: *Institutional Infrastructure Team*

