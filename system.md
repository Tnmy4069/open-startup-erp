# CyberX Ledger — Complete System Documentation

> A full-stack, role-based financial management system built for CyberX community operations.
> Built with **Next.js 15 (App Router)**, **Prisma ORM**, **MongoDB**, and **TypeScript**.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Authentication & Session System](#4-authentication--session-system)
5. [Role-Based Access Control (RBAC)](#5-role-based-access-control-rbac)
6. [Global App Context](#6-global-app-context)
7. [Dashboard Shell (Layout)](#7-dashboard-shell-layout)
8. [Modules / Features](#8-modules--features)
9. [API Routes](#9-api-routes)
10. [Database Schema (Prisma / MongoDB)](#10-database-schema-prisma--mongodb)
11. [CLI Console](#11-cli-console)
12. [Keyboard Shortcuts](#12-keyboard-shortcuts)
13. [Notifications & Reminders](#13-notifications--reminders)
14. [Theme System](#14-theme-system)
15. [Security Practices](#15-security-practices)

---

## 1. Overview

**CyberX Ledger** is a secure, internal financial management dashboard for the CyberX community. It tracks all financial transactions (income, expenses, transfers, refunds), manages contacts (people and organizations), provides analytics reports, logs meeting notes, and enforces role-based access throughout.

Key design principles:
- **Security-first**: JWT sessions, HTTP-only cookies, server-side RBAC guards on every API route.
- **Multi-role**: Five distinct roles with progressively increasing permissions.
- **Real-time feel**: Global notifications, refresh triggers, and optimistic UI updates.
- **Hackerpunk aesthetic**: Dark/light theme toggle, CLI console, monospaced typography, typewriter effects.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, React Server Components) |
| Language | TypeScript |
| Database | MongoDB (via Prisma ORM) |
| ORM | Prisma Client v5 |
| Auth | JWT (`jose`) stored in HTTP-only cookie |
| Styling | Vanilla CSS (custom design tokens, dark/light theme) |
| Charts | Recharts (AreaChart, BarChart, PieChart) |
| Markdown | react-markdown + remark-gfm |
| Icons | Lucide React |
| Password hashing | bcryptjs |
| Fonts | Google Fonts (Inter / Outfit) |

---

## 3. Project Structure

```
cyber--main/
├── prisma/
│   ├── schema.prisma          # All database models
│   ├── dev.db                 # SQLite dev fallback
│   └── seed.js                # Database seed script
├── public/
│   └── cyberx-logo.png
├── src/
│   ├── app/
│   │   ├── page.tsx           # Root redirect
│   │   ├── login/             # Login page & layout
│   │   ├── dashboard/         # Dashboard page
│   │   └── api/               # All REST API routes
│   │       ├── auth/          # login, logout, me
│   │       ├── transactions/  # CRUD for ledger entries
│   │       ├── organizations/ # CRUD for organizations
│   │       ├── people/        # CRUD for people/contacts
│   │       ├── meetings/      # CRUD for meeting notes
│   │       ├── users/         # User management (Super Admin only)
│   │       ├── logs/          # Activity log fetch
│   │       ├── alerts/        # Notifications & reminders
│   │       ├── dashboard/     # Dashboard stats aggregation
│   │       └── settings/      # App settings read/write
│   ├── components/
│   │   ├── DashboardShell.tsx
│   │   ├── DashboardHome.tsx
│   │   ├── LedgerTable.tsx
│   │   ├── MeetingsPanel.tsx
│   │   ├── PeopleList.tsx
│   │   ├── OrganizationsList.tsx
│   │   ├── ReportsPanel.tsx
│   │   ├── AuditLogsList.tsx
│   │   ├── UsersPanel.tsx
│   │   └── SettingsPanel.tsx
│   ├── context/
│   │   └── AppContext.tsx      # Global state (user, theme, notifs)
│   └── lib/
│       ├── db.ts               # Prisma singleton
│       ├── session.ts          # JWT encrypt/decrypt, cookie management
│       ├── permissions.ts      # RBAC helpers + API route guards
│       └── usePermissions.ts   # Client-side role hook
```

---

## 4. Authentication & Session System

### How Login Works

1. User visits `/login` and submits username + password.
2. `POST /api/auth/login` is called.
3. **Super Admin check**: If the username matches `SUPER_ADMIN_USERNAME` from `.env`, the password is compared directly (no DB lookup).
4. **Regular users**: Prisma looks up the user by username. Password is compared against the bcrypt hash using `bcrypt.compare()`.
5. On success, `createSession()` is called which:
   - Creates a `SessionPayload` `{ userId, username, role, expiresAt }`.
   - Signs it as an **HS256 JWT** using `jose`.
   - Sets it as an **HTTP-only cookie** named `cyberx_session` with 7-day expiry.
6. Client is redirected to `/dashboard`.

### Session Verification

Every protected API route calls `getSession()` which reads the cookie, decrypts the JWT, and returns the payload. Missing or invalid JWT returns `401 Unauthorized`.

### Logout

`POST /api/auth/logout` calls `deleteSession()` to delete the cookie. Client clears user state and redirects to `/`.

### Required Environment Variables

```env
DATABASE_URL=             # MongoDB connection string
SESSION_SECRET=           # Secret key for JWT signing
SUPER_ADMIN_USERNAME=     # Super Admin username (not stored in DB)
SUPER_ADMIN_PASSWORD=     # Super Admin password (plain text)
```

---

## 5. Role-Based Access Control (RBAC)

### Permission Matrix

| Role | View | Create | Edit | Delete | Settings | Manage Users |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Super Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Finance Head** | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Treasurer** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Committee Member** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Read Only** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Server-Side Enforcement

Every API route that mutates data calls one of these guards before any DB operation:

- `guardCreate()` — blocks Read Only
- `guardEdit()` — blocks Committee Member and below
- `guardDelete()` — blocks everyone except Super Admin
- `guardSettings()` — blocks Treasurer and below
- `guardUsers()` — blocks everyone except Super Admin

### Client-Side Enforcement

The UI hides or disables elements based on role:
- **New Transaction** button hidden for Read Only.
- **Users** tab only shown to Super Admin.
- **Edit/Delete** buttons hidden based on role.
- **Settings** form disabled for insufficient roles.

---

## 6. Global App Context

`AppContext` is the global React state layer. It provides:

| Value | Description |
|---|---|
| `user` | Current logged-in user: `{ userId, username, role }` |
| `role` | Derived from user; defaults to `Read Only` |
| `theme` | `'dark'` or `'light'`; persisted in `localStorage` |
| `setTheme()` | Switch theme, update localStorage and DOM |
| `notifications` | In-memory list from `/api/alerts` |
| `setNotifications()` | Mark notifications as read locally |
| `reminders` | Active financial reminders |
| `refreshTrigger` | Number that increments to trigger re-fetches |
| `refreshData()` | Increments `refreshTrigger` |
| `triggerNotification()` | Creates notification in-memory + POSTs to `/api/alerts` |
| `logout()` | Calls logout API, clears user, redirects to `/` |
| `authLoading` | True while initial `/api/auth/me` is in progress |

On mount, AppContext calls `GET /api/auth/me` to hydrate user from the server session, and applies saved theme from `localStorage`.

---

## 7. Dashboard Shell (Layout)

`DashboardShell` is the persistent layout for the entire dashboard.

### Sidebar (Desktop)
Navigation links in this order:
1. Dashboard
2. Meetings
3. Ledger
4. People
5. Organizations
6. Reports
7. Users *(Super Admin only)*
8. Activity Log
9. Settings

Each link shows a keyboard shortcut badge. Bottom area has: New Transaction button, Shortcuts Help, Logout.

### Mobile Sidebar
Slide-in drawer (same nav), triggered by hamburger button. Auto-closes on tab select.

### Header Bar
- Global search input (searches transaction IDs, parties, purposes).
- CLI Console toggle button.
- Theme toggle (sun/moon icon).
- Notification bell with unread count badge.
- User info display (username + role).
- Logout button.

### Notification Dropdown
- Shows all notifications with type icons (warning, success, info).
- Mark All Read button.

---

## 8. Modules / Features

### 8.1 Dashboard

**File**: `DashboardHome.tsx` | **API**: `GET /api/dashboard/stats`

#### KPI Cards (9 cards)
| KPI | Description |
|---|---|
| Total Income | Sum of all completed Income transactions |
| Total Expenses | Sum of all completed Expense transactions |
| Net Balance | Total Income minus Total Expenses |
| Pending Income | Sum of pending Income transactions |
| Pending Expenses | Sum of pending Expense transactions |
| Monthly Income | Income for the current calendar month |
| Monthly Expenses | Expenses for the current calendar month |
| Completed Transactions | Count of all Completed transactions |
| Pending Transactions | Count of all Pending transactions |

#### Charts (4 charts)
| Chart | Type | Description |
|---|---|---|
| Income vs Expense | Area Chart | Monthly comparison over time |
| Monthly Cash Flow | Bar Chart | Net cash flow per month |
| Expense Distribution | Pie Chart | Breakdown by purpose category |
| Income Sources | Pie Chart | Breakdown by income category |

#### Additional Sections
- **Upcoming Reminders**: Active reminders with due dates and amounts.
- **Recent Activity Log**: Last 5 audit log entries.
- Typewriter animation on load: `"CONNECTING TO CYBERX LEDGER SYSTEM... STATUS: ONLINE."`

---

### 8.2 Meetings

**File**: `MeetingsPanel.tsx` | **API**: `GET/POST /api/meetings`, `PUT/DELETE /api/meetings/[id]`

Manages structured meeting notes with full Markdown support.

#### Features
- Meeting list with date, agenda, and author.
- Expand/collapse cards to read full notes.
- Full **GFM Markdown** rendering (headings, lists, tables, code blocks, links).
- All links in Markdown open in a **new tab** (`target="_blank" rel="noopener noreferrer"`).
- Optional reference URL per meeting (opens in new tab).
- **Add Meeting** modal: date, agenda, notes (Markdown editor with Write/Preview toggle), optional reference link.
- Edit and Delete (role-permissioned).

---

### 8.3 Ledger

**File**: `LedgerTable.tsx` | **API**: `GET/POST /api/transactions`, `PUT/DELETE /api/transactions/[id]`

The core financial ledger.

#### Transaction Fields
| Field | Values |
|---|---|
| Type | Income, Expense, Transfer, Refund |
| Purpose | Campus Session, Workshop, Sponsorship, Merchandise, Travel, Food, Equipment, Software, Marketing, Reimbursement, Miscellaneous |
| Status | Pending, Completed, Cancelled |
| Payment Method | Cash, UPI, Bank, Card, Cheque |
| + Party, Amount, Notes, Attachments, Reference, UTR, UPI ID, Payment Link, Bank Details | |

#### Features
- Server-side paginated table (10 per page).
- Multi-column sorting (asc/desc by clicking headers).
- **Advanced filter panel**: type, status, purpose, payment method, party, date range, amount range.
- Global search synced with header search bar.
- Row checkboxes for bulk selection.
- **Bulk delete** all selected (Super Admin only).
- **Add** transaction (slide-in drawer with full form + UPI QR display).
- **View** transaction details.
- **Edit** transaction (pre-filled drawer).
- **Clone** a transaction as a template.
- **Delete** single transaction (Super Admin only).
- **Export CSV** of current filtered view.

---

### 8.4 People

**File**: `PeopleList.tsx` | **API**: `GET/POST /api/people`, `PUT/DELETE /api/people/[id]`

Individual contacts: members, vendors, speakers, volunteers, students.

- Searchable/filterable list.
- Add / Edit / Delete (role-permissioned).
- Financial summary per person: total paid out vs. received.

---

### 8.5 Organizations

**File**: `OrganizationsList.tsx` | **API**: `GET/POST /api/organizations`, `PUT/DELETE /api/organizations/[id]`

Corporate partners, sponsors, and vendor organizations.

- Searchable/filterable list.
- Add / Edit / Delete (role-permissioned).
- Outstanding balance tracking per organization.

---

### 8.6 Reports

**File**: `ReportsPanel.tsx` | **API**: `GET /api/transactions` (predefined filters)

Predefined financial report templates.

| Report | Description |
|---|---|
| Income Report | All Income-type transactions |
| Expense Report | All Expense-type transactions |
| Monthly Report | Transactions from current calendar month |
| Yearly Report | Transactions from current calendar year |
| Pending Payments | All Pending-status transactions |
| Organization Report | Transactions by corporate parties |
| Person Report | Transactions for speakers, vendors, members |
| Travel Report | Purpose = Travel |
| Merchandise Report | Purpose = Merchandise |

Each report shows: summary stats (count, total volume, average), tabular data, Print, and Download CSV.

---

### 8.7 Users

**File**: `UsersPanel.tsx` | **API**: `GET/POST /api/users`, `PUT/DELETE /api/users/[id]` | **Access**: Super Admin only

- View, add, edit, delete user accounts.
- Passwords are bcrypt-hashed on create/update.
- Super Admin account is environment-only; does not appear here.

---

### 8.8 Activity Log

**File**: `AuditLogsList.tsx` | **API**: `GET /api/logs`

Read-only audit trail. Every create/update/delete/export/login action is auto-logged.

Fields: Action type, Timestamp, Username, Role, Details description.

---

### 8.9 Settings

**File**: `SettingsPanel.tsx` | **API**: `GET/PUT /api/settings` | **Access**: Finance Head+

Three sub-tabs:

**General**: Community name, default currency, financial year.

**Banking**: Bank name, account number, IFSC code, UPI ID, UPI QR code image.

**Ledger**: Transaction categories (comma-separated), payment methods (comma-separated).

---

## 9. API Routes

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Authenticate and set session cookie |
| POST | `/api/auth/logout` | Clear session cookie |
| GET | `/api/auth/me` | Return current session user info |

### Transactions
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/transactions` | List (paginated, filtered, sorted) |
| POST | `/api/transactions` | Create new transaction |
| PUT | `/api/transactions/[id]` | Update transaction |
| DELETE | `/api/transactions/[id]` | Delete (Super Admin only) |

### Organizations
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/organizations` | List all |
| POST | `/api/organizations` | Create |
| PUT | `/api/organizations/[id]` | Update |
| DELETE | `/api/organizations/[id]` | Delete (Super Admin only) |

### People
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/people` | List all |
| POST | `/api/people` | Create |
| PUT | `/api/people/[id]` | Update |
| DELETE | `/api/people/[id]` | Delete (Super Admin only) |

### Meetings
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/meetings` | List all |
| POST | `/api/meetings` | Create |
| PUT | `/api/meetings/[id]` | Update |
| DELETE | `/api/meetings/[id]` | Delete (Super Admin only) |

### Users
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users` | List all (Super Admin only) |
| POST | `/api/users` | Create with hashed password (Super Admin only) |
| PUT | `/api/users/[id]` | Update (Super Admin only) |
| DELETE | `/api/users/[id]` | Delete (Super Admin only) |

### Other
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard/stats` | Aggregated KPIs and chart data |
| GET | `/api/logs` | Activity log entries |
| GET | `/api/alerts` | Notifications and reminders |
| POST | `/api/alerts` | Create notification |
| GET | `/api/settings` | Read app settings |
| PUT | `/api/settings` | Update settings (Finance Head+) |

---

## 10. Database Schema (Prisma / MongoDB)

All models use MongoDB ObjectId as the primary key mapped via `@map("_id") @db.ObjectId`.

**Models**: `Transaction`, `Organization`, `Person`, `ActivityLog`, `Reminder`, `Notification`, `Setting`, `User`, `MeetingNote`

See `prisma/schema.prisma` for the full field definitions.

---

## 11. CLI Console

The **CyberX Secure CLI** is a terminal emulator built into the dashboard.

### Open / Close
Press **`` ` ``** (backtick), **`Ctrl + \`**, or click the terminal icon in the header.

### Commands

| Command | Description |
|---|---|
| `help` | List all available commands |
| `goto [tab]` | Navigate: `dash`, `ledger`, `orgs`, `people`, `reports`, `logs`, `settings`, `users` |
| `newtx` | Open the New Transaction drawer |
| `theme [light\|dark\|toggle]` | Switch or toggle UI theme |
| `search [query]` | Set global search filter |
| `logout` | Log out of the secure session |
| `clear` | Clear terminal history |

---

## 12. Keyboard Shortcuts

| Key | Action |
|---|---|
| `D` | Dashboard |
| `T` | Ledger (Transactions) |
| `O` | Organizations |
| `P` | People |
| `R` | Reports |
| `L` | Activity Log |
| `S` | Settings |
| `N` | New Transaction drawer |
| `Ctrl + K` / `/` | Focus global search |
| `` ` `` / `Ctrl + \` | Toggle CLI console |
| `?` / `H` | Toggle shortcuts help overlay |
| `Esc` | Close any open drawer, dialog, or overlay |

---

## 13. Notifications & Reminders

### Notifications
- Stored in MongoDB `Notification` collection.
- Type icons: ⚠️ Approval required, ✅ Payment completed, ℹ️ others.
- Unread count shown as a red pulsing dot on the bell icon.
- Auto-created by API routes on mutations.

### Reminders
- Stored in `Reminder` collection.
- Types: `Upcoming Due`, `Pending Reimbursement`, `Pending Payment`, `Overdue Payment`.
- Shown on the Dashboard home with due dates and amounts.
- Status: `Active` or `Resolved`.

---

## 14. Theme System

- Dark (default) and light themes.
- Saved in `localStorage` under `cyberx_theme`.
- Toggled via the sun/moon button in the header or via CLI: `theme toggle`.
- Implemented via CSS custom properties (design tokens) scoped with the `dark` class on `<html>`:
  - Background: `--bg-primary`, `--bg-surface`, `--bg-elevated`
  - Text: `--text-heading`, `--text-body`, `--text-muted`
  - Borders: `--border-normal`, `--border-hover`
  - Accent: `--primary` (cyber yellow `#FFD54A`)
  - Status: `--cyber-success`, `--cyber-danger`, `--cyber-warning`, `--cyber-info`

---

## 15. Security Practices

| Practice | Implementation |
|---|---|
| **HTTP-only cookies** | JWT inaccessible to client JavaScript |
| **Secure cookies** | `secure: true` in production (HTTPS only) |
| **SameSite=Lax** | Prevents CSRF from cross-site requests |
| **Server-side RBAC guards** | Role checked server-side before every DB mutation |
| **Password hashing** | All passwords stored as bcrypt hashes |
| **JWT signing** | HS256 with secret from environment variable |
| **7-day session expiry** | Sessions auto-expire |
| **Super Admin isolation** | Credentials only in `.env`, never in DB |
| **`server-only` module** | `session.ts` cannot be imported client-side |
| **Link safety** | Markdown links use `rel="noopener noreferrer"` |

---

*Last updated: July 2026 — CyberX Ledger v1.0*
