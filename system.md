# 🛡️ CyberX / FinX Community Web Application
## Complete System Specification & Features Documentation (`system.md`)

---

## 📖 1. Project Overview & Vision

**FinX / CyberX Community Web Application** is a full-stack Enterprise Resource Planning (ERP), Credential Registry, Event Management, and Operations Platform built for **CyberX Community India**. 

The system unifies organization management, financial ledgers, event RSVPs, hardware inventory, task workflows, documentation wikis, and cryptographically verifiable certificates under a unified Next.js 16 architecture.

---

## 🏗️ 2. Technology Stack & System Specifications

### 🖥️ Frontend Stack
- **Framework**: **Next.js 16.2** (App Router) with **React 19.2** & **TypeScript 5**
- **Build System**: Next.js Turbopack compiler & bundler
- **Styling**: **Tailwind CSS v4** with Lucide React Icons (`lucide-react`) & custom CSS variables
- **Data Visualization**: Recharts (`recharts`) for financial and community activity charts
- **Markdown Processing**: React Markdown (`react-markdown`), Rehype Raw, Rehype Highlight, Remark GFM
- **Image & PDF Export**: `html-to-image` for high-resolution PNG rendering, custom CSS `@media print` A4 landscape engine

### ⚙️ Backend & Database Stack
- **API Architecture**: Next.js Server API Routes (`src/app/api/...`)
- **Database**: **MongoDB** (Cloud / Local Cluster)
- **Object-Relational Mapping (ORM)**: **Prisma ORM 5.22** (`@prisma/client`)
- **Session & Auth Subsystem**: `jose` (JWT HTTP-Only session cookies `cyberx_session`)
- **Password Security**: `bcryptjs` (Salted hash encryption)
- **Push Notifications**: `web-push` (VAPID keys Web Push API)

---

## 🔐 3. Authentication, Security & Route Protection Architecture

```mermaid
graph TD
    UserRequest[Incoming Client Request] --> Middleware{Next.js Middleware}
    Middleware -->|Path: /_next, /favicon, /sw.js, static| PassThrough[Serve Static Asset]
    Middleware -->|Path: /public/* or /api/public/*| CheckAuthHead[Inject Session Headers if Available & Allow Access]
    Middleware -->|Path: / or /login & Has Session| RedirDash[Redirect to /dashboard]
    Middleware -->|Path: /dashboard & No Session| RedirLogin[Redirect to / (Login)]
    Middleware -->|Protected Route & Valid Session| InjectHeaders[Inject x-user-id, x-user-role, x-username Headers]
```

### Role-Based Access Control (RBAC) Tiers
1. **Super Admin**: Full platform ownership, manage user accounts, deactivate users, edit global organization settings.
2. **Founder**: Complete access to financial ledgers, transactions, assets, team management, and event approvals.
3. **Co-Founder**: Full administrative and operational permissions across all operational modules.
4. **Committee Member**: Operational access to create events, manage tasks, update documentation, and check in attendees.
5. **Read Only**: View-only access across ledgers and administrative panels without edit privileges.

---

## 🗂️ 4. Complete Sidebar Modules & Sub-Sections Directory

Below is the complete, exhaustive list of all 15 Sidebar Navigation Modules and their internal sub-sections, tabs, modals, and functional features:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           CYBERX PORTAL SIDEBAR NAV                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│  [D] 📊 Dashboard        ── KPI Stats, Analytics Graphs, Quick Action Launchers │
│  [G] 📝 Meetings         ── Meeting Notes, Agenda, Public Notes Toggle          │
│  [K] 📋 Tasks            ── Kanban Columns, Sub-Task Checklists, Comments       │
│  [E] 📅 Events           ── Event List, RSVP Passes, Fullscreen Attendee Modal  │
│  [M] 👥 Members          ── Team Directory, Skills, Badges, Certs, Assets       │
│  [A] 🛠️ Assets           ── Hardware Tags, Issue/Return Log, Maintenance        │
│  [U] 📄 Documents        ── Folder Hierarchy, Version History, File Uploads    │
│  [C] 💬 Messages         ── DMs, Group Chats, File Sharing, Location Sharing    │
│  [T] 💰 Ledger           ── Multi-Type Transactions, Receipts, Approvals        │
│  [P] 👤 People           ── External Stakeholders, Speakers, Vendors           │
│  [O] 🏢 Organizations    ── B2B Partners, Sponsors, Balance Ledger             │
│  [R] 📊 Reports          ── Financial Statements, Export PDF/CSV                │
│  [U] 🛡️ Users (Admin)    ── User Accounts, RBAC Roles, Password Resets          │
│  [L] 📜 Activity Log     ── System Audit Trail, User Action Logs                │
│  [S] ⚙️ Settings          ── Dynamic Branding, Favicons, Bank & UPI Setup        │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### 📊 4.1 Dashboard Command Center (`DashboardHome.tsx`)
- **Key Performance Indicator (KPI) Cards**:
  - Total Revenue & Income stats
  - Total Expenses & Reimbursements
  - Net Available Treasury Balance
  - Active Members & Core Team count
  - Total Registered Event Attendees
- **Quick Action Launchers**:
  - `+ Add Transaction`: Open fast ledger creation dialog
  - `+ Create Event`: Launch event creation form
  - `+ Issue Asset`: Open hardware checkout workflow
  - `+ Add Member`: Open candidate onboarding form
  - `+ New Task`: Create Kanban task item
  - `+ Upload Document`: Open document wiki upload
- **Analytics & Graphs**:
  - Recharts Income vs Expense Monthly Trends
  - Financial Category Allocation Breakdown
- **Global Search Modal (`Cmd + K` or `/`)**: Instant multi-entity fuzzy search across transactions, members, events, assets, and documents.
- **Announcement Banner & Real-Time Feeds**: Latest organization broadcast and system status alerts.

---

### 📝 4.2 Meetings & Notes Module (`MeetingsPanel.tsx`)
- **Meeting Notes Grid & List View**: Displays meeting date, agenda title, author, and snippet.
- **Create / Edit Meeting Note Modal**:
  - Agenda Title & Category
  - Rich Markdown Content Editor (supports tables, code blocks, lists)
  - External Reference URL / Document Link
- **Public Visibility Toggle (`isPublic`)**: Publish notes directly to `/public/meetings` for community access.
- **Search & Filter Sub-Section**: Filter notes by keyword, author, or meeting date.

---

### 📋 4.3 Tasks & Kanban Board Module (`TasksPanel.tsx`)
- **Kanban Board Columns**:
  - `Backlog`: Future planned initiatives
  - `Todo`: Assigned upcoming tasks
  - `In Progress`: Active ongoing work
  - `Review`: Tasks pending team sign-off
  - `Completed`: Archived finished tasks
- **Task List View & Filter Bar**: Filter by Assignee, Priority (`Low`, `Medium`, `High`, `Urgent`), Label, or Due Date.
- **Create / Edit Task Modal**:
  - Title & Detailed Description
  - Priority & Status Selection
  - Multi-Select Assignees (`Member` relation) & Reporter
  - Labels & File Attachment URLs
  - Recurring Pattern Rules (Daily, Weekly, Monthly)
- **Interactive Sub-Task Checklist**: Add checklist items with real-time completion percentage progress bars.
- **Task Discussion Stream (`TaskComment`)**: Real-time comments, updates, and author timestamps.
- **Task Activity Trail (`TaskActivity`)**: Audit log tracking who changed task status or priority.

---

### 📅 4.4 Events & RSVP Management Module (`EventsPanel.tsx`)
- **Event Registry Cards & List View**: Categorized by Draft, Upcoming, Past, and Cancelled events.
- **Create / Edit Event Modal**:
  - Title & Custom URL Slug
  - Event Type: `Online`, `Offline`, or `Hybrid`
  - Banner Image URL & Event Category (`OSINT`, `Web3`, `AI`, `CTF`, `Workshop`)
  - Venue Location & Address
  - Start Date, End Date, and RSVP Deadline
  - Maximum Capacity Limit & Visibility (`Public` vs `Internal`)
  - Budget Allocated vs Expected Revenue
  - Sponsors, Speakers, Volunteers, and Organizers tagging
- **Fullscreen Attendees Dashboard Modal**:
  - Real-time RSVP Candidate Table (Name, Email, Phone, RSVP Date)
  - Attendance Status Toggle (`Registered`, `Attended`, `No-Show`)
  - QR Code Pass Viewer: Preview digital ticket passes generated for attendees
  - Candidate Feedback & Rating Sub-Section
  - Attendees CSV / Excel Data Export
- **Certificate Issuance Integration**: Direct launcher to view and issue candidate achievement certificates.

---

### 👥 4.5 Members & Team Directory Module (`MembersPanel.tsx`)
- **Member Cards Grid & Table View**: Core team roster with role badges and contact information.
- **Create / Edit Member Modal**:
  - Personal Information: Name, Email, Phone, College, Department, Year
  - Organization Role: `Founder`, `Core Team`, `Lead`, `Executive`, `Volunteer`, `Member`, `Alumni`
  - Availability Status: `High`, `Medium`, `Low`
  - Bio, Emergency Contact, and Social Profiles (LinkedIn, GitHub, Portfolio)
- **Skills & Technical Domains Tagging**: Add skill chips (OSINT, Web Dev, Reverse Engineering, Cloud, Event Ops).
- **Badges & Certificate Portfolio Sub-Section**: Display awarded badges and verified event certificates.
- **Member Asset Checkout Sub-Section**: View hardware assets currently issued to the member.
- **Activity Log History (`MemberActivity`)**: Timeline of member contributions, event check-ins, and role updates.

---

### 🛠️ 4.6 Hardware Asset & Inventory Module (`AssetsPanel.tsx`)
- **Hardware Assets Registry Table**: Search and filter by category, condition, or status (`Available`, `Issued`, `Maintenance`, `Lost`).
- **Create / Edit Asset Modal**:
  - Unique Asset ID (e.g. `AST-0091`)
  - Name & Hardware Category (Laptops, Routers, Wifi Pineapple, SDR, Projectors, Merchandise)
  - Purchase Cost & Purchase Date
  - Vendor Details & Warranty Expiry Date
  - Condition (`Excellent`, `Good`, `Needs Repair`, `Damaged`, `Lost`)
  - Storage Location / Shelf No.
- **Member Issuance & Return Modal**:
  - Issue asset to a selected Member
  - Set return date & notes
  - Log return check-in with condition update
- **Asset Maintenance Sub-Section**:
  - Open maintenance tickets (`AssetMaintenance`)
  - Repair issue description, vendor cost, start/end dates, resolution notes
- **Asset History Trail (`AssetHistory`)**: Complete audit history of checkouts, returns, damage reports, and status changes.

---

### 📄 4.7 Documents Wiki & Knowledge Base Module (`DocumentsPanel.tsx`)
- **Hierarchical Folder Tree Navigation**: Create folders (`DocFolder`) and nested subfolders.
- **Multi-Format Files Sub-Section**:
  - Markdown Documents with built-in preview editor
  - File Downloads (PDFs, ZIPs, Images)
  - External Reference URLs / Web Links
- **Create Folder & Upload File Modal**: Name, Folder location, File Type, Attachment URL, Size, MIME Type, Tag chips.
- **Document Version Control Modal (`DocVersion`)**: View previous document revisions, content diffs, updated by whom, and restore historical versions.
- **Favorites & Pinned Bar**: Quick access to pinned (`isPinned`) or favorited (`isFavorite`) documents.
- **Public Sharing Toggle (`isPublic`)**: Publish documents to the public wiki (`/public/documents`).

---

### 💬 4.8 Messages & Chat Module (`MessagesPanel.tsx`)
- **Left Pane — Conversation List**:
  - Search & filter conversations by name
  - Unread message badge counts (per conversation & total)
  - "New Message" button → opens member picker modal
  - Conversation cards: Avatar, Name, Last message preview, Timestamp, Unread count
- **Right Pane — Active Chat View**:
  - Chat header: Conversation name, member count (groups), avatar, **Refresh Button** (with spin animation)
  - Message bubbles with sender name, timestamp, read receipts (✓ sent, ✓✓ read), and hover options menu
  - Message types:
    - **Text Messages**: Rich text with whitespace preservation and link detection
    - **File Attachments**: Download card with filename, file size, MIME type, and download button
    - **Image Messages**: Inline image preview with click-to-expand in new tab
    - **Location Sharing**: Coordinates card with OpenStreetMap link preview
- **Message Editing & Deletion**:
  - **Edit Sent Messages**: Senders can edit their text messages; edited messages display `(edited)` tag
  - **Delete for Me**: Removes message locally for current user
  - **Delete for Everyone**: (Sender/Admin only) Replaces message content with *"This message was deleted"*
- **Push Notifications & Real-Time Sync**:
  - **Browser Push Notifications**: Native Web Push / Desktop Notification triggered when a new message arrives from another member
  - **Database Notifications**: Creates `Notification` records on incoming messages
  - **Fast Real-Time Polling**: 2-second message refresh interval + automatic re-sync on window focus/tab restore
  - **Manual Refresh Button**: Dedicated refresh icon in chat header to force instant sync
- **New Conversation Modal**:
  - Toggle between "Direct Message" (1-on-1) and "Group Chat" modes
  - Group Name input (for group chats)
  - Member search & multi-select picker (combines `User` accounts, `Member` directory, and `Super Admin`)
  - Selected member chips with remove action
- **Group Management Sub-Section**:
  - Leave Group action
  - Delete Conversation (admin/creator only)
- **Input Bar**:
  - Text input with Enter-to-send
  - 📎 File Attachment button → file upload via existing upload API
  - 📍 Location button → browser Geolocation API sharing
  - Send button
- **DM Deduplication**: Prevents creating duplicate DM conversations between the same two users.


---

### 💰 4.9 Financial Ledger & Expense ERP Module (`LedgerTable.tsx`)
- **Transaction Financial Table**: Full accounting ledger with search, category filtering, and status badges.
- **Create / Edit Transaction Modal**:
  - Transaction Type: `Income`, `Expense`, `Transfer`, `Refund`
  - Purpose Category: Campus Session, Workshop, Sponsorship, Merchandise, Travel, Food, Equipment, Software, Marketing, Reimbursement, Miscellaneous
  - Party Name (Payer / Payee) & Transaction Amount
  - Payment Method: Cash, UPI, Bank Transfer, Card, Cheque
  - Reference / UTR Number & Payment Link URL
  - Bank Account Details & Attached Receipts / Invoices (JSON attachments array)
- **Reimbursement Approval Sub-Section**:
  - Pending approval queue for member expense claims
  - Founder / Admin one-click Approve / Reject action
- **Financial Statement Generator & Export**: Date range filters, CSV export, Excel download, and printable statements.

---

### 👤 4.10 External People Directory Module (`PeopleList.tsx`)
- **Directory Table**: External non-member stakeholders directory.
- **Category Filter**: Members, Vendors, Speakers, Guest Lecturers, Volunteers, Students.
- **Financial Balances Sub-Section**: Total Amount Received vs Total Amount Paid per person.
- **Create / Edit Person Modal**: Name, Phone, Email, Role, Notes.

---

### 🏢 4.11 Organizations Directory Module (`OrganizationsList.tsx`)
- **B2B Partner & Sponsor Registry**: Organization Name, Contact Person, Phone, Email, Address.
- **Outstanding Balance Ledger Sub-Section**: Track pending unpaid sponsorships or vendor dues (`outstandingPayments`).
- **Create / Edit Organization Modal**: Comprehensive contact and financial balance management.

---

### 📊 4.12 Financial & Operational Reports Module (`ReportsPanel.tsx`)
- **Analytics & Report Generator**: Custom date-range financial summaries.
- **Statement Breakdown Sub-Section**: Revenue by category, Expense by purpose, Net surplus/deficit.
- **Export Capabilities**: PDF export, CSV data dump, and formatted print layouts.

---

### 🛡️ 4.13 User Accounts & RBAC Manager (`UsersPanel.tsx`) — *Super Admin Exclusive*
- **User Accounts Table**: List registered system users, roles, and status.
- **Create User Account Modal**:
  - Username & Password
  - Privilege Role: `Super Admin`, `Founder`, `Co-Founder`, `Committee Member`, `Read Only`
- **Account Status Toggle**: One-click Activate / Deactivate user access.
- **Password Reset Modal**: Reset user passwords securely.
- **Target Broadcast Redirect Launcher**: Broadcast custom target path redirects.

---

### 📜 4.14 System Activity & Audit Logs Module (`AuditLogsList.tsx`)
- **System Audit Trail**: Complete log of system actions (Action, Timestamp, User, Role, Details).
- **Filter & Search Bar**: Filter logs by Action (`Created`, `Updated`, `Deleted`, `Approved`, `Exported`, `Login`), User, or Date Range.
- **Detailed Inspection Dialog**: Inspect JSON payload details of any system change.

---

### ⚙️ 4.15 Dynamic Branding & Settings Module (`SettingsPanel.tsx`)
- **Branding Settings Sub-Section**:
  - Community Name (e.g. `CyberX Community India`)
  - App Logo URL, Icon URL, Favicon URL
  - Database Overrides vs Environment Variable Fallbacks
  - Live DOM Head Favicon Injector
- **Bank Account Setup Sub-Section**: Bank Name, Account Number, IFSC Code, Default Currency (`INR`), Financial Year (`2026-2027`).
- **Payment Gateway & UPI Setup**: UPI ID (`cyberx@hdfcbank`) & Custom UPI QR Code Image Uploader.
- **Categories & Payment Methods Manager**: Custom comma-separated transaction categories and payment methods.
- **Feature Toggles**: Toggle Digital Event Pass functionality (`enableEventPass`).

---

## 🌐 5. Public Access Portals (`src/app/public/...`)

The application exposes 5 unauthenticated public portals for candidates and community members:

1. **`/public/events`**: Public event catalog and event details (`/public/events/[id]`). Enables candidates to fill out RSVP forms and download digital QR code entry passes.
2. **`/public/certificates`**: Candidate email certificate lookup and public verification page (`/public/certificates/[id]`). Features high-res PNG download and marginless A4 Landscape PDF export.
3. **`/public/members`**: Public directory showcasing community leadership, core team members, alumni, and technical domains.
4. **`/public/documents`**: Public documentation wiki (`/public/documents/[id]`) for reading published guidelines, policies, and learning resources.
5. **`/public/meetings`**: Public meeting notes archive for transparent community governance.

---

## 🔌 6. Complete API Endpoints Reference

| Endpoint Route | HTTP Method | Description | Access Level |
| :--- | :--- | :--- | :--- |
| `/api/auth/login` | `POST` | Authenticate user & issue `cyberx_session` HTTP-only cookie | Public |
| `/api/auth/logout` | `POST` | Clear session cookie & terminate session | Authenticated |
| `/api/auth/me` | `GET` | Fetch active logged-in user profile & role | Authenticated |
| `/api/transactions` | `GET`, `POST` | List ledger transactions or create new transaction | Authenticated |
| `/api/events` | `GET`, `POST` | Fetch all events or create a new event | Authenticated |
| `/api/events/[id]/registrations` | `GET`, `POST` | List event registrations or register attendee | Public / Auth |
| `/api/certificates` | `GET`, `POST` | Certificate generation & candidate search | Authenticated |
| `/api/public/certificates` | `GET` | Public candidate certificate email lookup | Public |
| `/api/public/certificates/[id]` | `GET` | Public certificate verification payload | Public |
| `/api/assets` | `GET`, `POST` | Hardware inventory list & new asset creation | Authenticated |
| `/api/tasks` | `GET`, `POST` | Kanban task list & task creation | Authenticated |
| `/api/documents` | `GET`, `POST` | Fetch wiki files/folders or upload documentation | Authenticated |
| `/api/public/documents` | `GET` | List public documents | Public |
| `/api/members` | `GET`, `POST` | Core team member directory & registration | Authenticated |
| `/api/public/members` | `GET` | Public team directory listing | Public |
| `/api/settings` | `GET`, `POST` | Global branding, bank details, & app settings | Public (GET) / Admin (POST) |
| `/api/users` | `GET`, `POST`, `PATCH`| Manage system user accounts & active statuses | Super Admin |
| `/api/alerts` | `GET`, `POST` | System notifications & reminders | Authenticated |

---

## 🛠️ 7. Build, Validation & Execution Commands

```bash
# 1. Install all dependencies
npm install

# 2. Generate Prisma Client
npx prisma generate

# 3. Perform TypeScript Type Verification
npm run type-check

# 4. Start Local Development Server
npm run dev

# 5. Build Production Bundle
npm run build

# 6. Start Production Server
npm start
```

---

*Documentation compiled and generated directly in `system.md` for CyberX / FinX Community Web Application.*
