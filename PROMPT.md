# 🚀 TCS Selects — Candidate Master Dashboard

> **Project Codename:** TCS Selects Tracker  
> **Version:** 1.0  
> **Last Updated:** 2026-06-15  
> **Author:** Arnab  

Build a **production-grade, full-stack Master Dashboard** for tracking all TCS Selects candidates **from a single college (on-campus selection)** from the moment they are selected until they officially join the company. The dashboard must handle candidate data (CT/DT IDs, names, roles), track every milestone in the pre-joining journey, and serve as the single source of truth for coordinators and administrators.

I have a CSV dataset of **370 selected students** containing: **Reference ID (CT/DT ID), Name, Qualification, Specialization, Approved Offer (Role)**.

> **⚠️ IMPORTANT:**
> - **No PII stored in CSV** — no emails, phones, Aadhaar, PAN, bank details.
> - **No file uploads** — all document tracking is status-only (checklist).
> - **Single college, on-campus only** — college name, selection type, graduation year are global config (same for all candidates).
> - **Emails are collected only when candidates self-register** by claiming their CT/DT ID.
> - **Milestones are configurable** — admin can add/edit/reorder/delete stages from settings at any time.

Generate the following **8 detailed markdown documents** before writing any code. Each document must be exhaustive, well-structured, and actionable.

---

## 📄 Document 1: Product Requirement Document (PRD)

### 1.1 Problem Statement

- Candidates selected through TCS on-campus hiring currently have **no centralized platform** to track their post-selection journey.
- Critical information such as joining dates, document submission deadlines, ILP allocation, BGV status, and communication from TCS is scattered across emails, WhatsApp groups, and unofficial trackers.
- Candidates frequently miss deadlines, lose track of required actions, and have no visibility into where they stand in the pipeline.
- Coordinators/admins managing the batch have no dashboard to monitor compliance, identify at-risk candidates, or send bulk communications.

### 1.2 Target Users

| User Persona | Description | Key Needs |
|---|---|---|
| **Candidate** | Selected student awaiting joining | Track personal milestones, view deadlines, get notifications |
| **Batch Coordinator** | Peer or senior managing a group/college batch | View batch progress, identify laggards, send reminders, export reports |
| **Admin / Super Admin** | Overall system administrator | Full CRUD on all data, manage users & roles, system configuration, analytics |
| **Viewer (Read-Only)** | HR observers, mentors, college TPOs | View-only access to dashboards and reports |

### 1.3 Core Features

#### A. Candidate Management
- **Candidate Registry:** Import candidates via CSV upload. Fields from CSV: Reference ID (CT/DT ID), Name, Qualification, Specialization, Approved Offer (Role).
- **Candidate Profile Page:** Individual profile with milestone timeline, document checklist (status-only), and status badges.
- **Bulk Import/Export:** CSV import with validation, duplicate detection (by Reference ID), and error reporting. Export filtered data to CSV.
- **Search & Filter:** Full-text search by name, CT ID, DT ID. Filter by role, status, claim status, qualification.

#### B. Milestone & Status Tracking
Track each candidate through **configurable pre-joining milestones**. These are **placeholder stages** — admin can add, edit, reorder, or delete stages from the settings page at any time without code changes.

**Default milestones (editable by admin):**

| # | Milestone | Description | Status Options |
|---|---|---|---|
| 1 | **Selection Confirmation** | Offer letter received & acknowledged | Pending / Confirmed / Declined |
| 2 | **Document Submission** | Academic docs, ID proofs, photos submitted | Not Started / Partial / Complete / Verified |
| 3 | **Background Verification (BGV)** | BGV initiated and cleared | Not Initiated / In Progress / Cleared / Flagged |
| 4 | **Medical Fitness** | Medical test completed | Pending / Scheduled / Cleared / Requires Review |
| 5 | **ILP Allocation** | Initial Learning Program dates assigned | Not Assigned / Assigned / Started / Completed |
| 6 | **Joining Date Confirmation** | Official joining date communicated | Awaiting / Confirmed / Postponed / Deferred |
| 7 | **Onboarding Kit** | Laptop, access cards, credentials issued | Not Issued / In Transit / Received |
| 8 | **Day-1 Joining** | Candidate physically/virtually joined | Pending / Joined / No-Show / Deferred |

> **Note:** These stages will be refined with real TCS onboarding data later. The system supports adding/removing stages dynamically.

- Each milestone has: status, date updated, notes, updated-by (audit trail).
- Visual **Kanban board** view showing candidates grouped by their current milestone.
- Visual **Pipeline/Funnel** view showing conversion at each stage.

#### C. Dashboard & Analytics
- **Overview Dashboard:** Total candidates, breakdown by role, by status, claimed vs unclaimed accounts. Cards with counts + sparklines.
- **Progress Heatmap:** Matrix of candidates × milestones, color-coded by status (green/yellow/red/grey).
- **At-Risk Alerts:** Candidates stuck at a milestone beyond X days (configurable threshold).
- **Trend Charts:** Candidates joining over time, milestone completion rate over time.
- **Registration Stats:** How many candidates have claimed their IDs vs unclaimed.
- **Role-wise Distribution:** Pie/donut charts for Digital vs Ninja vs Prime.

#### D. Communication & Notifications
- **In-App Notification Center:** Bell icon with unread count, notification feed.
- **Announcement Board:** Admins can post announcements visible to all or filtered groups.
- **Email Notifications (optional):** Triggered on milestone changes, deadline reminders.
- **Deadline Alerts:** Configurable reminders (7-day, 3-day, 1-day before deadline).

#### E. Document Checklist (Status-Only — No File Storage)
- **Checklist Tracker:** Per-candidate checklist tracking whether required documents were submitted to TCS (via NextStep/iON portal). **No actual files are stored in this system.**
- **Status Tracking:** Each document item has a simple status: Not Submitted / Submitted / Verified by TCS.
- **Checklist Items:** 10th Marksheet, 12th Marksheet, Degree Certificate, Provisional Certificate, Passport Photo, Offer Letter Acknowledgment, Medical Certificate, Other.
- **Admin can update** checklist statuses and add notes.

#### F. User Management & Auth (Self-Registration by Claiming CT/DT ID)

**How it works:** Admin imports CSV → all 370 candidate entries are created with status `UNCLAIMED`. Candidates visit the site, search for their CT/DT ID, verify their identity (name matches CSV), then enter email + password to create their account and "claim" that ID.

**Registration Flow:**
1. Candidate visits landing page → clicks "Register / Find My ID"
2. Searches by CT/DT ID or name → sees matching results showing Name, Qualification, Role from CSV
3. Clicks "This is me" on their entry
4. **If UNCLAIMED:** Enter email + create password → Account created → ID marked as `CLAIMED`
5. **If ALREADY CLAIMED:** Shows error "This ID is already linked to another account (partially masked email)"
   - Option A: "That's me, forgot password" → Standard password reset via email
   - Option B: "That's not me — Claim this ID" → Opens dispute ticket form

**Dispute Ticket Flow:**
- Candidate fills: Name, Email, Reason for dispute
- Ticket is created with status `OPEN`
- Admin receives in-app notification (and optional email)
- Admin reviews → can unlink the wrong account → notify both parties
- Dispute statuses: `OPEN` → `UNDER_REVIEW` → `RESOLVED` / `REJECTED`

**Auth Features:**
- **RBAC:** Admin, Coordinator, Candidate roles with granular permissions.
- **Authentication:** Email + Password login (collected during self-registration). JWT-based session management.
- **Password Reset:** Standard forgot-password flow via email.
- **Admin accounts:** Created manually (first admin seeded, can invite more).

#### G. Data Import & Initial Setup
- **CSV Upload Wizard:** Step-by-step import with column mapping, preview, validation errors, and confirmation.
- **Duplicate Detection:** Flag existing Reference IDs before import.
- **Auto-detect CT vs DT:** Reference IDs starting with `CT` or `DT` are auto-classified.
- **All imported candidates start as `UNCLAIMED`** — waiting for self-registration.

### 1.4 Success Criteria

| Metric | Target |
|---|---|
| All candidates imported and visible | 100% data accuracy after import |
| Milestone tracking coverage | All 8 milestones trackable per candidate |
| Dashboard load time | < 2 seconds for up to 5,000 candidates |
| User adoption (candidates logging in) | > 80% within first week of launch |
| Zero missed deadlines due to lack of visibility | Measurable via alert system |
| Admin can generate a full batch report | Under 3 clicks |
| Mobile-responsive | Fully usable on mobile and tablet |

### 1.5 Out of Scope (v1)
- Real-time chat / messaging between candidates
- Integration with TCS internal HRIS systems
- Automated BGV API integration
- Payment/salary tracking
- Post-joining performance tracking
- **Storing any personal/sensitive documents** (Aadhaar, PAN, bank details, etc.)
- **File uploads of any kind** — all document tracking is status-only

---

## 📄 Document 2: Technical Specification

### 2.1 Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | Next.js 14+ (App Router) | SSR/SSG, file-based routing, React Server Components |
| **Styling** | Vanilla CSS with CSS Modules + CSS Custom Properties | Full control, no dependency on utility frameworks |
| **State Management** | React Context + useReducer for global; local state for components | Lightweight, no external dependency |
| **Charts/Viz** | Chart.js or Recharts | Lightweight, responsive, customizable |
| **Backend API** | Next.js API Routes (Route Handlers) | Co-located with frontend, serverless-ready |
| **Database** | SQLite (via better-sqlite3) for dev & prod | Zero-config, no external DB server needed, handles 5K+ candidates easily |
| **ORM** | Prisma | Type-safe queries, migrations, schema-first |
| **Auth** | NextAuth.js (Auth.js v5) | Built-in providers, JWT sessions, RBAC middleware |
| **Deployment** | Vercel (free tier) or self-hosted Node.js | Optimized for Next.js, zero cost |
| **CSV Parsing** | PapaParse | Robust CSV/Excel parsing in browser |

### 2.2 Project Structure

```
tcs-selects-dashboard/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts                    # Seed data from CSV
│   └── migrations/
├── public/
│   ├── favicon.ico
│   ├── logo.svg
│   └── templates/
│       └── import-template.csv
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout with sidebar + topbar
│   │   ├── page.tsx               # Dashboard home (redirect or overview)
│   │   ├── globals.css            # Design tokens + global resets
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── forgot-password/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx         # Dashboard layout (sidebar + content)
│   │   │   ├── overview/page.tsx  # Main dashboard with cards + charts
│   │   │   ├── candidates/
│   │   │   │   ├── page.tsx       # Candidate list with search/filter
│   │   │   │   ├── [id]/page.tsx  # Individual candidate profile
│   │   │   │   └── import/page.tsx # CSV import wizard
│   │   │   ├── milestones/
│   │   │   │   ├── page.tsx       # Kanban board view
│   │   │   │   └── pipeline/page.tsx # Funnel view
│   │   │   ├── checklist/page.tsx  # Document checklist (status-only)
│   │   │   ├── announcements/page.tsx
│   │   │   ├── analytics/page.tsx # Charts + reports
│   │   │   ├── settings/
│   │   │   │   ├── page.tsx       # General settings
│   │   │   │   ├── users/page.tsx # User management
│   │   │   │   └── milestones/page.tsx # Configure milestones
│   │   │   └── notifications/page.tsx
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── candidates/
│   │       │   ├── route.ts       # GET (list), POST (create)
│   │       │   ├── [id]/route.ts  # GET, PUT, DELETE
│   │       │   ├── import/route.ts # POST (bulk CSV import)
│   │       │   └── export/route.ts # GET (CSV export)
│   │       ├── milestones/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       ├── checklist/
│   │       │   └── route.ts       # GET/PUT document checklist status
│   │       ├── announcements/route.ts
│   │       ├── notifications/route.ts
│   │       ├── analytics/route.ts
│   │       └── users/
│   │           ├── route.ts
│   │           └── [id]/route.ts
│   ├── components/
│   │   ├── ui/                    # Atomic UI components
│   │   │   ├── Button/
│   │   │   ├── Card/
│   │   │   ├── Badge/
│   │   │   ├── Modal/
│   │   │   ├── Table/
│   │   │   ├── Input/
│   │   │   ├── Select/
│   │   │   ├── Checkbox/
│   │   │   ├── Avatar/
│   │   │   ├── Tooltip/
│   │   │   ├── ProgressBar/
│   │   │   └── Skeleton/
│   │   ├── layout/
│   │   │   ├── Sidebar/
│   │   │   ├── Topbar/
│   │   │   ├── Breadcrumb/
│   │   │   └── PageHeader/
│   │   ├── dashboard/
│   │   │   ├── StatCard/
│   │   │   ├── MilestoneHeatmap/
│   │   │   ├── PipelineFunnel/
│   │   │   ├── RoleDistribution/
│   │   │   └── TrendChart/
│   │   ├── candidates/
│   │   │   ├── CandidateTable/
│   │   │   ├── CandidateCard/
│   │   │   ├── CandidateProfile/
│   │   │   ├── ImportWizard/
│   │   │   └── FilterPanel/
│   │   ├── milestones/
│   │   │   ├── KanbanBoard/
│   │   │   ├── KanbanColumn/
│   │   │   ├── MilestoneTimeline/
│   │   │   └── StatusBadge/
│   │   └── notifications/
│   │       ├── NotificationBell/
│   │       └── NotificationFeed/
│   ├── lib/
│   │   ├── prisma.ts              # Prisma client singleton
│   │   ├── auth.ts                # NextAuth config
│   │   ├── utils.ts               # General utilities
│   │   ├── csv-parser.ts          # CSV import/export logic
│   │   ├── validators.ts          # Zod schemas for validation
│   │   └── constants.ts           # Enums, milestone definitions, roles
│   ├── hooks/
│   │   ├── useDebounce.ts
│   │   ├── useCandidates.ts
│   │   ├── useNotifications.ts
│   │   └── useAnalytics.ts
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── NotificationContext.tsx
│   └── types/
│       ├── candidate.ts
│       ├── milestone.ts
│       ├── user.ts
│       └── api.ts
├── .env.local
├── .env.example
├── next.config.js
├── tsconfig.json
├── package.json
└── README.md
```

### 2.3 API Design (RESTful)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/login` | Login with credentials | Public |
| POST | `/api/auth/register` | Register new user (admin-approved) | Public |
| GET | `/api/candidates` | List candidates (paginated, filtered) | All authenticated |
| POST | `/api/candidates` | Create single candidate | Admin, Coordinator |
| GET | `/api/candidates/:id` | Get candidate details | All authenticated |
| PUT | `/api/candidates/:id` | Update candidate info | Admin, Coordinator |
| DELETE | `/api/candidates/:id` | Soft-delete candidate | Admin |
| POST | `/api/candidates/import` | Bulk CSV import | Admin |
| GET | `/api/candidates/export` | Export filtered list as CSV | Admin, Coordinator |
| GET | `/api/milestones` | List all milestone definitions | All authenticated |
| PUT | `/api/milestones/:candidateId` | Update candidate milestone status | Admin, Coordinator |
| GET | `/api/milestones/:candidateId/history` | Audit trail for milestone changes | Admin |
| GET | `/api/checklist/:candidateId` | Get candidate's document checklist | All authenticated |
| PUT | `/api/checklist/:candidateId` | Update checklist item status | Admin, Coordinator |
| GET | `/api/analytics/overview` | Dashboard stats | Admin, Coordinator |
| GET | `/api/analytics/pipeline` | Funnel/pipeline data | Admin, Coordinator |
| GET | `/api/analytics/trends` | Time-series data | Admin, Coordinator |
| GET | `/api/announcements` | List announcements | All authenticated |
| POST | `/api/announcements` | Create announcement | Admin |
| GET | `/api/notifications` | User's notifications | All authenticated |
| PUT | `/api/notifications/:id/read` | Mark notification as read | All authenticated |
| GET | `/api/users` | List users | Admin |
| PUT | `/api/users/:id/role` | Change user role | Admin |

### 2.4 Performance Requirements

- **Initial page load:** < 1.5s (LCP)
- **API response time:** < 200ms for list endpoints (up to 5K records)
- **CSV import:** Handle 10,000 rows in < 30 seconds
- **Concurrent users:** Support 500+ simultaneous users
- **Database queries:** Indexed on CT_ID, DT_ID, email, status, role

### 2.5 Security Requirements

- All passwords hashed with bcrypt (min 12 rounds)
- JWT tokens with 24h expiry, refresh token rotation
- CSRF protection on all mutating endpoints
- Rate limiting: 100 req/min per IP on auth endpoints
- Input sanitization on all user inputs (XSS prevention)
- SQL injection prevention via Prisma parameterized queries

---

## 📄 Document 3: User Flow

### 3.1 Candidate Self-Registration Flow (New — Claim Your ID)

```
Landing Page
  ├─ "Already have an account?" → Login (email + password)
  └─ "New here? Find your ID" → Registration Flow
      → Search by CT/DT ID or Name
      → See matching results (Name, Qualification, Role from CSV)
      → Click "This is me"
          ├─ ID is UNCLAIMED:
          │   → Enter Email + Create Password
          │   → Account Created → ID marked CLAIMED
          │   → Redirect to Personal Dashboard
          └─ ID is ALREADY CLAIMED:
              → Show: "This ID is linked to a]•••@gmail.com"
              ├─ "That's me, forgot password" → Password Reset Flow
              └─ "That's not me — Claim this ID" → Dispute Form
                  → Enter: Name, Email, Reason
                  → Ticket Created (OPEN) → Admin Notified
                  → Show: "Admin will review within 24 hours"
```

### 3.2 Login Flow (All Users)

```
Login Page → Enter Email + Password → [Validate Credentials]
  ├─ Success → Dashboard Home (role-based redirect)
  │   ├─ Admin → Admin Overview Dashboard
  │   ├─ Coordinator → Batch Overview
  │   └─ Candidate → Personal Milestone Tracker
  ├─ Failure → Error Message → Retry
  └─ Forgot Password → Email Input → Reset Link → New Password → Login
```

### 3.3 Admin: First-Time Setup Flow

```
Login as Admin (first admin seeded during setup)
  → Empty Dashboard Prompt
  → "Import Your First Batch" CTA
  → Upload CSV (Reference ID, Name, Qualification, Specialization, Approved Offer)
  → Column Mapping Screen (auto-detected)
  → Preview (first 10 rows) → Validation Summary
    ├─ Errors Found → Show Error Report → Fix & Re-upload
    └─ All Valid → Confirm Import
      → Success: "370 candidates imported (all UNCLAIMED)"
      → Share the tracker link with candidates via WhatsApp/email
      → Candidates self-register by claiming their IDs
```

### 3.4 Admin: Daily Operations Flow

```
Dashboard Home
  ├─ View Overview Cards (Total, By Role, Claimed vs Unclaimed)
  ├─ Check At-Risk Alerts → Click Alert → Navigate to Candidate Profile
  ├─ Check Dispute Tickets → Review → Resolve/Reject
  ├─ View Milestone Heatmap → Click Cell → Update Status
  ├─ Navigate to Candidate List
  │   ├─ Search/Filter → Click Candidate → View Profile
  │   │   ├─ Update Milestone Status → Add Notes → Save
  │   │   ├─ Update Document Checklist → Mark Submitted/Verified
  │   │   └─ View Timeline → Audit Trail
  │   └─ Bulk Select → Bulk Status Update
  ├─ Navigate to Kanban Board → Drag Candidate Card Between Columns
  ├─ Navigate to Analytics → View Charts → Export Report
  ├─ Navigate to Settings → Add/Edit/Reorder Milestones
  └─ Post Announcement → Select Target Audience → Publish
```

### 3.5 Candidate: Self-Service Flow (After Claiming ID)

```
Login → Personal Dashboard
  ├─ View My Milestone Progress (Timeline/Stepper UI)
  │   └─ Each step shows: Status, Date, Notes from Admin
  ├─ View Required Actions / Pending Tasks
  ├─ Update Own Milestone Status (where allowed)
  │   └─ e.g., "I submitted my documents" → Status changes to Submitted
  ├─ View Document Checklist (can self-update submission status)
  ├─ View Announcements → Read Details
  └─ View Notifications → Mark as Read
```

### 3.6 Coordinator: Batch Management Flow

```
Login → Batch Dashboard
  ├─ View Batch Stats (claimed/unclaimed, milestone progress)
  ├─ Filter Candidates by Status/Role
  ├─ View Compliance Rate (% with all milestones cleared, all checklist items done)
  ├─ Click Candidate → View Profile → Update Status
  ├─ Generate Batch Report → Download CSV
  └─ Send Batch Reminder (in-app notification to all pending candidates)
```

---

## 📄 Document 4: Design System & Visual Specification

### 4.1 Design Philosophy

- **Premium & Modern:** Dark-mode-first with light mode toggle. Glassmorphism cards, smooth gradients, micro-animations.
- **TCS-Inspired Palette:** Incorporate TCS brand colors subtly (deep blue `#1A3B6B`, vibrant magenta `#E31E79`) while maintaining a modern, custom aesthetic.
- **Information Dense but Clean:** Dashboard should show a lot of data without feeling cluttered. Use progressive disclosure.

### 4.2 Color Palette

```css
:root {
  /* Primary */
  --color-primary-50: #EBF0FF;
  --color-primary-100: #C2D1FF;
  --color-primary-200: #99B2FF;
  --color-primary-300: #7093FF;
  --color-primary-400: #4774FF;
  --color-primary-500: #1E55FF;   /* Main primary */
  --color-primary-600: #1844CC;
  --color-primary-700: #123399;
  --color-primary-800: #0C2266;
  --color-primary-900: #061133;

  /* Accent (TCS Magenta-inspired) */
  --color-accent-400: #FF4D94;
  --color-accent-500: #E31E79;
  --color-accent-600: #B91862;

  /* Neutral (Dark Mode Base) */
  --color-bg-primary: #0A0E1A;
  --color-bg-secondary: #111827;
  --color-bg-card: #1A1F2E;
  --color-bg-elevated: #242938;
  --color-border: #2D3348;
  --color-text-primary: #F1F5F9;
  --color-text-secondary: #94A3B8;
  --color-text-muted: #64748B;

  /* Status Colors */
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #3B82F6;
  --color-pending: #8B5CF6;

  /* Light Mode Overrides */
  /* ... symmetric light palette ... */

  /* Typography */
  --font-primary: 'Inter', 'Segoe UI', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Spacing Scale */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* Border Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.25);
  --shadow-lg: 0 10px 25px rgba(0,0,0,0.35);
  --shadow-glow: 0 0 20px rgba(30, 85, 255, 0.15);

  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-normal: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 4.3 Component Design Specs

#### Sidebar Navigation
- Fixed left sidebar, 260px wide (collapsible to 72px icon-only mode)
- Logo at top, navigation items with icons + labels
- Active item: primary color background with glow effect
- Hover: subtle background shift + scale animation
- User avatar + role badge at bottom
- Glassmorphism effect: `backdrop-filter: blur(20px); background: rgba(26, 31, 46, 0.85);`

#### Stat Cards (Dashboard)
- Grid of 4-6 cards at the top of the dashboard
- Each card: icon (in a gradient circle), metric value (large font), label, sparkline/trend indicator
- Subtle gradient border on hover
- Entrance animation: staggered fade-up on page load

#### Data Table
- Sticky header, alternating row shading (very subtle)
- Row hover: elevated shadow + slight background change
- Inline status badges (colored pills)
- Sortable columns with arrow indicators
- Pagination bar with page size selector

#### Kanban Board
- Columns for each milestone stage
- Cards show: avatar, name, CT ID, role badge, days-in-stage counter
- Drag-and-drop with smooth transition animations
- Column header shows count badge
- Color-coded column headers matching status colors

#### Milestone Timeline (Candidate Profile)
- Vertical timeline with connected dots/lines
- Completed steps: green dot + checkmark
- Current step: pulsing blue dot with glow animation
- Future steps: grey dot, dashed line
- Each step expands to show date, notes, updated-by

#### Charts
- Consistent color scheme matching the design system
- Smooth animation on load and data change
- Tooltip on hover with detailed values
- Responsive: stack vertically on mobile

### 4.4 Responsive Breakpoints

```css
/* Mobile first */
--breakpoint-sm: 640px;   /* Small tablets */
--breakpoint-md: 768px;   /* Tablets */
--breakpoint-lg: 1024px;  /* Small laptops */
--breakpoint-xl: 1280px;  /* Desktops */
--breakpoint-2xl: 1536px; /* Large screens */
```

- **Mobile (< 768px):** Sidebar collapses to bottom tab bar, single-column layout, cards stack vertically.
- **Tablet (768px-1024px):** Sidebar as overlay drawer, 2-column grid.
- **Desktop (> 1024px):** Full sidebar, multi-column grids, split panels.

### 4.5 Animations & Micro-Interactions

| Element | Animation | Trigger |
|---|---|---|
| Page transition | Fade + slide-up (200ms) | Route change |
| Stat cards | Staggered fade-up (50ms delay each) | Page load |
| Chart data | Smooth grow/morph (400ms) | Data load |
| Sidebar nav item | Scale(1.02) + bg color shift | Hover |
| Button click | Scale(0.97) → Scale(1) | Click |
| Modal | Backdrop fade + modal slide-up | Open |
| Notification bell | Subtle shake | New notification |
| Status badge change | Color morph + brief pulse | Status update |
| Table row | Bg highlight + shadow lift | Hover |
| Kanban card drag | Shadow increase + slight rotation | Drag start |
| Toast notification | Slide in from right + fade | Event trigger |
| Progress bar | Width animation (600ms ease) | Value change |

---

## 📄 Document 5: Database Schema

### 5.1 Entity Relationship Diagram (Prisma Schema)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite" // Switch to "postgresql" for production
  url      = env("DATABASE_URL")
}

// ─── USERS & AUTH ───────────────────────────────────────────

model User {
  id              String    @id @default(cuid())
  email           String    @unique
  passwordHash    String
  name            String
  role            UserRole  @default(CANDIDATE)
  isActive        Boolean   @default(true)
  lastLoginAt     DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  candidate       Candidate?
  announcements   Announcement[]    @relation("AuthorAnnouncements")
  notifications   Notification[]
  auditLogs       AuditLog[]        @relation("AuditUser")
  managedBatches  Batch[]           @relation("BatchCoordinator")

  @@index([email])
  @@index([role])
}

enum UserRole {
  ADMIN
  COORDINATOR
  CANDIDATE
}

// ─── CANDIDATES ─────────────────────────────────────────────
// Imported from CSV. userId is null until candidate claims their ID.

model Candidate {
  id              String          @id @default(cuid())
  userId          String?         @unique   // null = UNCLAIMED, set when candidate registers
  referenceId     String          @unique   // CT or DT ID from TCS (as-is from CSV)
  name            String                    // From CSV
  qualification   String                    // e.g., "BACHELOR OF TECHNOLOGY"
  specialization  String                    // e.g., "COMPUTER SCIENCE AND ENGINEERING"
  selectedRole    SelectedRole              // Digital / Ninja / Prime
  claimStatus     ClaimStatus     @default(UNCLAIMED)
  currentStage    String?                   // Current milestone stage (references MilestoneDefinition)
  overallStatus   CandidateStatus @default(ACTIVE)
  joiningDate     DateTime?
  remarks         String?
  batchId         String?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  // Relations
  user            User?           @relation(fields: [userId], references: [id], onDelete: SetNull)
  batch           Batch?          @relation(fields: [batchId], references: [id])
  milestones      CandidateMilestone[]
  checklistItems  DocumentChecklist[]
  disputes        DisputeTicket[]

  @@index([referenceId])
  @@index([name])
  @@index([selectedRole])
  @@index([claimStatus])
  @@index([overallStatus])
  @@index([batchId])
}

enum SelectedRole {
  DIGITAL
  NINJA
  PRIME
  OTHER
}

enum ClaimStatus {
  UNCLAIMED       // Imported from CSV, no one has registered yet
  CLAIMED         // Candidate has registered and linked their account
  DISPUTED        // Someone has raised a dispute on this ID
}

enum CandidateStatus {
  ACTIVE
  DEFERRED
  WITHDRAWN
  JOINED
  NO_SHOW
}

// ─── DISPUTE TICKETS ────────────────────────────────────────
// Created when someone tries to claim an already-claimed ID

model DisputeTicket {
  id              String          @id @default(cuid())
  candidateId     String          // The candidate entry being disputed
  claimantName    String          // Name of person filing the dispute
  claimantEmail   String          // Email of person filing the dispute
  reason          String          // Why they believe the ID is theirs
  status          DisputeStatus   @default(OPEN)
  adminNotes      String?         // Admin's resolution notes
  resolvedBy      String?         // Admin user ID who resolved
  resolvedAt      DateTime?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  // Relations
  candidate       Candidate       @relation(fields: [candidateId], references: [id])

  @@index([status])
  @@index([candidateId])
  @@index([createdAt])
}

enum DisputeStatus {
  OPEN
  UNDER_REVIEW
  RESOLVED
  REJECTED
}

// ─── MILESTONES ─────────────────────────────────────────────

model MilestoneDefinition {
  id              String          @id @default(cuid())
  stage           MilestoneStage  @unique
  name            String
  description     String?
  displayOrder    Int
  isRequired      Boolean         @default(true)
  deadlineDays    Int?            // Days from selection to deadline
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  // Relations
  candidateMilestones CandidateMilestone[]
}

model CandidateMilestone {
  id              String          @id @default(cuid())
  candidateId     String
  milestoneId     String
  status          MilestoneStatus @default(PENDING)
  notes           String?
  dueDate         DateTime?
  completedAt     DateTime?
  updatedBy       String?         // User ID of who updated
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  // Relations
  candidate       Candidate       @relation(fields: [candidateId], references: [id], onDelete: Cascade)
  milestone       MilestoneDefinition @relation(fields: [milestoneId], references: [id])
  history         MilestoneHistory[]

  @@unique([candidateId, milestoneId])
  @@index([status])
  @@index([dueDate])
}

model MilestoneHistory {
  id                    String          @id @default(cuid())
  candidateMilestoneId  String
  previousStatus        MilestoneStatus
  newStatus             MilestoneStatus
  notes                 String?
  changedBy             String          // User ID
  changedAt             DateTime        @default(now())

  // Relations
  candidateMilestone    CandidateMilestone @relation(fields: [candidateMilestoneId], references: [id], onDelete: Cascade)

  @@index([candidateMilestoneId])
  @@index([changedAt])
}

enum MilestoneStage {
  SELECTION_CONFIRMATION
  DOCUMENT_SUBMISSION
  BACKGROUND_VERIFICATION
  MEDICAL_FITNESS
  ILP_ALLOCATION
  JOINING_DATE_CONFIRMATION
  ONBOARDING_KIT
  DAY_1_JOINING
}

enum MilestoneStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  VERIFIED
  FLAGGED
  NOT_APPLICABLE
  OVERDUE
}

// ─── DOCUMENT CHECKLIST (Status-Only, No File Storage) ─────

model DocumentChecklist {
  id              String              @id @default(cuid())
  candidateId     String
  type            DocumentType
  status          ChecklistStatus     @default(NOT_SUBMITTED)
  notes           String?
  updatedBy       String?             // User ID of who updated
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  // Relations
  candidate       Candidate           @relation(fields: [candidateId], references: [id], onDelete: Cascade)

  @@unique([candidateId, type])
  @@index([candidateId])
  @@index([status])
}

enum DocumentType {
  MARKSHEET_10TH
  MARKSHEET_12TH
  DEGREE_CERTIFICATE
  PROVISIONAL_CERTIFICATE
  PASSPORT_PHOTO
  OFFER_LETTER_ACKNOWLEDGMENT
  MEDICAL_CERTIFICATE
  OTHER
}

enum ChecklistStatus {
  NOT_SUBMITTED
  SUBMITTED
  VERIFIED_BY_TCS
}

// ─── BATCHES ────────────────────────────────────────────────

model Batch {
  id              String    @id @default(cuid())
  name            String    // e.g., "NQT Batch 2026 - June"
  description     String?
  coordinatorId   String
  startDate       DateTime?
  expectedJoiningDate DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  coordinator     User      @relation("BatchCoordinator", fields: [coordinatorId], references: [id])
  candidates      Candidate[]

  @@index([coordinatorId])
}

// ─── ANNOUNCEMENTS ──────────────────────────────────────────

model Announcement {
  id              String          @id @default(cuid())
  title           String
  content         String          // Markdown supported
  priority        AnnouncementPriority @default(NORMAL)
  targetRoles     String?         // Comma-separated roles, null = all
  targetBatchId   String?         // null = all batches
  authorId        String
  isPinned        Boolean         @default(false)
  publishedAt     DateTime        @default(now())
  expiresAt       DateTime?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  // Relations
  author          User            @relation("AuthorAnnouncements", fields: [authorId], references: [id])

  @@index([publishedAt])
  @@index([priority])
}

enum AnnouncementPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}

// ─── NOTIFICATIONS ──────────────────────────────────────────

model Notification {
  id              String    @id @default(cuid())
  userId          String
  title           String
  message         String
  type            NotificationType
  isRead          Boolean   @default(false)
  actionUrl       String?   // Deep link to relevant page
  createdAt       DateTime  @default(now())

  // Relations
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isRead])
  @@index([createdAt])
}

enum NotificationType {
  MILESTONE_UPDATE
  CHECKLIST_UPDATE
  ANNOUNCEMENT
  DEADLINE_REMINDER
  SYSTEM
}

// ─── AUDIT LOG ──────────────────────────────────────────────

model AuditLog {
  id              String    @id @default(cuid())
  userId          String
  action          String    // e.g., "CANDIDATE_CREATED", "MILESTONE_UPDATED"
  entityType      String    // e.g., "Candidate", "Document"
  entityId        String
  details         String?   // JSON string with change details
  ipAddress       String?
  createdAt       DateTime  @default(now())

  // Relations
  user            User      @relation("AuditUser", fields: [userId], references: [id])

  @@index([userId])
  @@index([entityType, entityId])
  @@index([createdAt])
}
```

### 5.2 Key Indexes & Constraints

- **Unique constraints:** `User.email`, `Candidate.referenceId`, `Candidate.userId`, `(CandidateMilestone.candidateId + CandidateMilestone.milestoneId)`
- **Composite indexes:** `(Notification.userId + Notification.isRead)`, `(AuditLog.entityType + AuditLog.entityId)`
- **Nullable foreign key:** `Candidate.userId` is null until the candidate claims their ID
- **Soft deletes:** `CandidateStatus.WITHDRAWN` rather than hard delete
- **Cascade on unlink:** If User is deleted, Candidate.userId is set to null (SetNull) — candidate entry remains, becomes UNCLAIMED again

---

## 📄 Document 6: Implementation Plan

### Phase 1: Foundation (Days 1-3)
| # | Task | Priority | Est. Hours |
|---|---|---|---|
| 1.1 | Initialize Next.js 14 project with TypeScript | P0 | 1 |
| 1.2 | Set up Prisma with SQLite, create schema, run migrations | P0 | 2 |
| 1.3 | Seed milestone definitions | P0 | 1 |
| 1.4 | Implement design system (globals.css with all tokens) | P0 | 3 |
| 1.5 | Build atomic UI components (Button, Card, Badge, Input, Select, Table, Modal) | P0 | 4 |
| 1.6 | Build layout components (Sidebar, Topbar, Breadcrumb, PageHeader) | P0 | 3 |
| 1.7 | Set up NextAuth with credentials provider, JWT, RBAC middleware | P0 | 3 |
| 1.8 | Create login, register, forgot-password pages | P0 | 2 |

### Phase 2: Core Candidate Module (Days 4-7)
| # | Task | Priority | Est. Hours |
|---|---|---|---|
| 2.1 | Build Candidate API routes (CRUD) | P0 | 3 |
| 2.2 | Build Candidate List page with search, filter, sort, pagination | P0 | 4 |
| 2.3 | Build Candidate Profile page with milestone timeline | P0 | 4 |
| 2.4 | Build CSV Import Wizard (upload → mapping → preview → validate → confirm) | P0 | 5 |
| 2.5 | Build CSV Export functionality | P1 | 2 |
| 2.6 | Implement bulk actions (bulk status update, bulk delete) | P1 | 2 |

### Phase 3: Milestone Tracking (Days 8-10)
| # | Task | Priority | Est. Hours |
|---|---|---|---|
| 3.1 | Build Milestone API routes | P0 | 2 |
| 3.2 | Build Kanban Board with drag-and-drop | P0 | 5 |
| 3.3 | Build Pipeline/Funnel view | P1 | 3 |
| 3.4 | Implement milestone history/audit trail | P0 | 2 |
| 3.5 | Build at-risk detection logic (days-in-stage threshold) | P1 | 2 |

### Phase 4: Dashboard & Analytics (Days 11-13)
| # | Task | Priority | Est. Hours |
|---|---|---|---|
| 4.1 | Build Overview Dashboard with stat cards | P0 | 3 |
| 4.2 | Build Milestone Heatmap component | P0 | 3 |
| 4.3 | Build Role Distribution chart (pie/donut) | P1 | 2 |
| 4.4 | Build Trend Charts (joining over time, completion rate) | P1 | 2 |
| 4.5 | Build College-wise analytics | P2 | 2 |

### Phase 5: Checklist & Communication (Days 14-16)
| # | Task | Priority | Est. Hours |
|---|---|---|---|
| 5.1 | Build Document Checklist API (status-only, no file uploads) | P0 | 2 |
| 5.2 | Build Document Checklist UI (per-candidate checklist with status toggles) | P0 | 2 |
| 5.3 | Build Announcement system (CRUD + feed) | P1 | 3 |
| 5.4 | Build Notification system (bell + feed + mark-read) | P1 | 3 |

### Phase 6: Polish & Deploy (Days 17-19)
| # | Task | Priority | Est. Hours |
|---|---|---|---|
| 6.1 | Responsive design testing & fixes | P0 | 3 |
| 6.2 | Dark/Light mode toggle implementation | P1 | 2 |
| 6.3 | Loading states (skeletons, spinners) | P1 | 2 |
| 6.4 | Error handling & toast notifications | P0 | 2 |
| 6.5 | SEO: meta tags, OG tags, proper heading hierarchy | P2 | 1 |
| 6.6 | Performance optimization (lazy loading, code splitting) | P1 | 2 |
| 6.7 | Final testing & bug fixes | P0 | 3 |
| 6.8 | Deployment setup (Vercel or Docker) | P0 | 2 |

**Total Estimated Time: ~85 hours (approximately 17 working days)**

---

## 📄 Document 7: Progress Tracker

### Sprint Tracker Template

```markdown
## Sprint 1: Foundation (Days 1-3)

- [ ] 1.1 Initialize Next.js 14 project with TypeScript
- [ ] 1.2 Set up Prisma with SQLite, schema, migrations
- [ ] 1.3 Seed milestone definitions
- [ ] 1.4 Implement design system (globals.css)
- [ ] 1.5 Build atomic UI components
- [ ] 1.6 Build layout components
- [ ] 1.7 Set up NextAuth with RBAC
- [ ] 1.8 Create auth pages

## Sprint 2: Core Candidate Module (Days 4-7)

- [ ] 2.1 Candidate API routes (CRUD)
- [ ] 2.2 Candidate List page
- [ ] 2.3 Candidate Profile page
- [ ] 2.4 CSV Import Wizard
- [ ] 2.5 CSV Export
- [ ] 2.6 Bulk actions

## Sprint 3: Milestone Tracking (Days 8-10)

- [ ] 3.1 Milestone API routes
- [ ] 3.2 Kanban Board with drag-and-drop
- [ ] 3.3 Pipeline/Funnel view
- [ ] 3.4 Milestone history/audit trail
- [ ] 3.5 At-risk detection logic

## Sprint 4: Dashboard & Analytics (Days 11-13)

- [ ] 4.1 Overview Dashboard with stat cards
- [ ] 4.2 Milestone Heatmap
- [ ] 4.3 Role Distribution chart
- [ ] 4.4 Trend Charts
- [ ] 4.5 College-wise analytics

## Sprint 5: Checklist & Communication (Days 14-16)

- [ ] 5.1 Document Checklist API (status-only)
- [ ] 5.2 Document Checklist UI
- [ ] 5.3 Announcement system
- [ ] 5.4 Notification system

## Sprint 6: Polish & Deploy (Days 17-19)

- [ ] 6.1 Responsive design testing
- [ ] 6.2 Dark/Light mode toggle
- [ ] 6.3 Loading states
- [ ] 6.4 Error handling & toasts
- [ ] 6.5 SEO optimization
- [ ] 6.6 Performance optimization
- [ ] 6.7 Final testing & bug fixes
- [ ] 6.8 Deployment
```

### Quality Gates

Each sprint must pass these gates before moving to the next:

| Gate | Criteria |
|---|---|
| **Code Quality** | No TypeScript errors, no console warnings |
| **Visual Quality** | Matches design spec, responsive on 3+ breakpoints |
| **Functional** | All features in sprint work end-to-end |
| **Performance** | Page load < 2s, no layout shifts |
| **Accessibility** | Keyboard navigable, proper ARIA labels, contrast ratio > 4.5:1 |

---

## 📄 Document 8: Project Rules & Conventions

### 8.1 Code Style & Conventions

#### General
- **Language:** TypeScript (strict mode) everywhere. No `any` types unless absolutely unavoidable (and documented).
- **Formatting:** Use Prettier with default config. 2-space indentation, single quotes, trailing commas.
- **Linting:** ESLint with Next.js recommended config + strict TypeScript rules.
- **Naming:**
  - Components: `PascalCase` (e.g., `CandidateTable.tsx`)
  - Utilities/hooks: `camelCase` (e.g., `useDebounce.ts`)
  - CSS Modules: `camelCase` class names (e.g., `.statCard`, `.milestoneTimeline`)
  - Constants/Enums: `SCREAMING_SNAKE_CASE` (e.g., `MILESTONE_STAGES`)
  - API routes: `kebab-case` in URL paths (e.g., `/api/candidates/import`)
  - Database columns: `camelCase` in Prisma schema

#### File Organization
- One component per file. Component + its CSS Module in the same directory.
- Co-locate tests with source files: `Component.tsx` → `Component.test.tsx`
- Shared types in `src/types/`. No inline type definitions for shared structures.
- All magic numbers and strings must be in `src/lib/constants.ts`.

#### CSS Rules
- **CSS Modules** for component-specific styles. No global class pollution.
- **CSS Custom Properties** for all design tokens. Never hardcode colors, spacing, or font sizes.
- **Mobile-first** media queries: default styles for mobile, `@media (min-width: ...)` for larger screens.
- **No `!important`** unless overriding third-party library styles (documented with a comment).
- **BEM-inspired naming** within modules: `.container`, `.container__header`, `.container--active`.

#### React Patterns
- Prefer **Server Components** by default. Use `'use client'` only when needed (interactivity, hooks, browser APIs).
- **No prop drilling** beyond 2 levels. Use Context or composition.
- All forms use **controlled components** with proper validation (Zod schemas).
- **Error boundaries** around all major sections.
- **Suspense boundaries** with skeleton loading states.

### 8.2 API Rules

- All API responses follow a consistent shape:
  ```typescript
  // Success
  { success: true, data: T, meta?: { total, page, pageSize } }

  // Error
  { success: false, error: { code: string, message: string, details?: any } }
  ```
- **HTTP status codes:** 200 (success), 201 (created), 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found), 422 (validation error), 500 (server error).
- **Pagination:** `?page=1&pageSize=25` with default 25, max 100.
- **Filtering:** Query params: `?role=DIGITAL&status=ACTIVE&search=john`
- **Sorting:** `?sortBy=name&sortOrder=asc`
- All mutating endpoints require authentication and appropriate role.
- All inputs validated with Zod before processing.

### 8.3 Git & Workflow Rules

- **Branch naming:** `feature/`, `fix/`, `chore/` prefixes (e.g., `feature/candidate-import`)
- **Commit messages:** Conventional Commits format: `feat:`, `fix:`, `chore:`, `docs:`, `style:`, `refactor:`
- **PR size:** Max 400 lines changed per PR. Break large features into smaller PRs.
- **No direct commits to `main`**. All changes via PR.

### 8.4 Security Rules

- **Never** store plaintext passwords. Always bcrypt with 12+ rounds.
- **Never** expose internal IDs in URLs if they reveal sequential patterns. Use CUIDs.
- **Never** return full user objects in API responses. Use DTOs to exclude `passwordHash`.
- **No file uploads exist in this system.** All document tracking is status-only (checklist).
- **Always** sanitize user input before rendering (React handles this by default, but be careful with `dangerouslySetInnerHTML`).
- **Always** use parameterized queries (Prisma handles this).
- **Rate limit** authentication endpoints.
- **CORS:** Restrict to known origins in production.

### 8.5 Data Rules

- **Reference ID:** Must start with `CT` or `DT`. Must be unique. Auto-classified by prefix.
- **Email:** Must be valid email format. Unique per user. Collected only during self-registration.
- **Claim rules:** A candidate entry can only be claimed once. Disputes go through admin review.
- **Dates:** Store in UTC, display in IST (Asia/Kolkata).
- **Soft deletes:** Never hard-delete candidates. Use `CandidateStatus.WITHDRAWN`.
- **Audit trail:** All milestone status changes must be logged in `MilestoneHistory`.
- **CSV import:** Reject entire row if Reference ID already exists (with error message). Don't silently skip.
- **Milestones:** Admin can add/edit/reorder/delete milestone definitions at any time. Changes apply to all candidates.

### 8.6 Performance Rules

- **Images:** Lazy load all images below the fold. Use `next/image` with proper `width`/`height`.
- **Lists:** Virtualize lists with > 100 items (use `react-window` or similar).
- **API calls:** Debounce search inputs (300ms). Cache frequently-accessed data (overview stats, milestone definitions).
- **Bundle:** Keep initial JS bundle < 200KB gzipped. Code-split by route.
- **Database:** No N+1 queries. Use Prisma `include` for related data. Paginate all list endpoints.

### 8.7 Accessibility Rules

- All interactive elements must be keyboard-accessible (Tab, Enter, Escape).
- All images must have meaningful `alt` text.
- Color must not be the only indicator of status (use icons + text alongside colors).
- Minimum contrast ratio: 4.5:1 for normal text, 3:1 for large text.
- All form inputs must have associated `<label>` elements.
- Use ARIA attributes for custom components (modals, dropdowns, tabs).
- Focus trap in modals. Focus return on close.
- Screen reader announcements for dynamic content changes (toast notifications, status updates).

---

## 🗂️ Initial Dataset Format

The actual CSV file contains these columns (no sensitive/personal data):

| CSV Column | Maps To | Type | Example |
|---|---|---|---|
| `Reference ID` | `referenceId` | String | DT20233891145 or CT20254860321 |
| `Name` | `name` | String | Jhasaketan Sa |
| `Qualification` | `qualification` | String | BACHELOR OF TECHNOLOGY |
| `Specialization` | `specialization` | String | COMPUTER SCIENCE AND ENGINEERING |
| `Approved Offer` | `selectedRole` | Enum | Prime / Digital / Ninja |

**Global config (same for all — set in admin settings, not per-candidate):**

| Setting | Value |
|---|---|
| College Name | *(Set by admin during first-time setup)* |
| Selection Type | ON_CAMPUS |
| Graduation Year | 2026 |

**Total candidates in dataset:** 370 (12 Prime, ~75 Digital, ~283 Ninja)

---

## ⚡ Execution Instructions

1. **Generate all 8 documents first** as separate markdown files in the project root under `/docs/`.
2. **Wait for my review and approval** before writing any code.
3. Follow the **Implementation Plan (Document 6)** phase by phase.
4. Update the **Tracker (Document 7)** after each completed task.
5. Ensure every component matches the **Design Spec (Document 4)** exactly.
6. Follow all **Rules (Document 8)** without exception.
7. After each phase, provide a brief summary of what was built and any blockers.

---

> **Start by generating all 8 documents. Do not write any implementation code until I have reviewed and approved all documents.**
