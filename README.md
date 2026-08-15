# 🛡️ Nexus: Open Source Startup & Community Management Platform

[![Next.js 16](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://www.prisma.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?logo=mongodb)](https://www.mongodb.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**Nexus** is a comprehensive, **open-source Enterprise Resource Planning (ERP) and Operations Platform** designed for startups, communities, student clubs, and growing organizations. It replaces fragmented tools by unifying team collaboration, financial tracking, task management, and event operations into a single, high-performance Next.js web application.

Whether you are looking for a **free community management software**, an **open-source startup CRM**, or a robust **internal team portal**, Nexus provides a scalable foundation ready for production.

---

## 🚀 Why Choose Nexus for Your Organization?

Managing a modern team requires too many subscriptions. Nexus solves this by offering a unified **open-source management system**:

*   **Zero Subscription Costs:** Self-host your own ERP and team management platform.
*   **Highly Customizable:** Built on modern React and Next.js architecture, making it easy to extend for your specific business logic.
*   **AI-Powered Workflows:** Seamless integrations with tools like Fathom AI to automate administrative overhead.
*   **Full Data Ownership:** Keep your financial ledgers, member data, and internal wikis secure in your own database.

---

## ✨ Core Features & Modules

Nexus is packed with essential business and community management features:

*   **📊 Executive Analytics Dashboard:** Real-time business intelligence (BI) KPIs, financial analytics, and organizational metrics at a glance.
*   **🤖 AI-Automated Meeting Notes (Fathom API):** Automatically sync meeting transcripts and AI summaries. **Smart automation** converts meeting action items directly into Kanban tasks assigned to your team!
*   **📋 Agile Task Management (Kanban):** Track internal initiatives, assign tasks, and monitor progress with interactive project management boards.
*   **📅 Event & RSVP Management System:** Create online/offline events, track attendee RSVPs, generate QR code tickets, and issue verifiable digital certificates.
*   **👥 Member Directory & CRM:** Manage your organization's roster, track technical skills, monitor availability, and log member activities.
*   **🛠️ Hardware Inventory & Asset Tracking:** A complete IT asset management (ITAM) module to track checkouts, returns, and equipment maintenance.
*   **📄 Internal Wiki & Knowledge Base:** Hierarchical folders with full Markdown support for company policies and onboarding documentation.
*   **💬 Real-Time Team Messaging:** Direct messages, group channels, secure file attachments, and location sharing for internal communication.
*   **💰 Financial Ledger & Expense Tracking:** A built-in accounting module to track revenue, manage reimbursements, handle sponsorships, and export financial reports.

---

## 🛠️ Modern Tech Stack

Nexus is built using the latest web technologies for maximum performance and developer experience:

*   **Frontend Framework:** [Next.js 16.2](https://nextjs.org/) (App Router), React 19.2, TypeScript 5
*   **UI & Styling:** [Tailwind CSS v4](https://tailwindcss.com/), Lucide React Icons, Recharts for data visualization
*   **Backend Architecture:** Next.js Serverless API Routes
*   **Database & ORM:** [MongoDB](https://www.mongodb.com/) via [Prisma ORM](https://www.prisma.io/)
*   **Authentication & Security:** `bcryptjs` for secure password hashing, `jose` for stateless JWT HTTP-Only session management

---

## 💻 Installation & Local Development Setup

Set up your own **open-source team management portal** in minutes. 

### Prerequisites

*   **Node.js** (v18.17 or higher)
*   **npm** or **yarn**
*   **MongoDB** (Local instance or free MongoDB Atlas cluster)

### Quick Start Guide

1.  **Clone the Open Source Repository**
    ```bash
    git clone [https://github.com/YOUR_ORG/nexus.git](https://github.com/Tnmy4069/open-startup-erp.git)
    cd nexus
    ```

2.  **Install Node Dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    Create a `.env` file in the root directory. Configure your database connection and security keys:

    ```env
    # Core Database Connection (MongoDB)
    DATABASE_URL="mongodb+srv://<user>:<password>@cluster.mongodb.net/nexus?retryWrites=true&w=majority"

    # Security (Required for Auth)
    JWT_SECRET="generate_a_secure_random_string_here"

    # Fathom AI Webhooks (Optional: Enables AI meeting auto-sync and task generation)
    FATHOM_API_KEY="your_fathom_api_key"
    FATHOM_WEBHOOK_SECRET="your_fathom_webhook_secret"
    ```

4.  **Initialize the Database Schema**
    Generate the Prisma client to map your database schema:
    ```bash
    npx prisma generate
    ```

5.  **Start the Local Development Server**
    ```bash
    npm run dev
    ```

    Navigate to [http://localhost:3000](http://localhost:3000) in your browser. 
    *(Note: If you have seeded the database, you can log in using default administrator credentials, e.g., username: `admin`, password: `cyberx2024`).*

---

## 🤝 Contributing to Open Source

Nexus thrives on community support! If you are looking to contribute to a modern **Next.js open-source project**, we would love your help.

### How to Contribute

1.  **Fork the repository** and create a feature branch (`git checkout -b feature/AmazingFeature`).
2.  **Make your changes** ensuring the code is clean and typed.
3.  **Run Type Checks** to validate your TypeScript code:
    ```bash
    npm run type-check
    ```
4.  **Commit your changes** (`git commit -m "feat: Added an amazing feature"`).
5.  **Push the branch** and open a Pull Request (PR).

### Contribution Guidelines
*   Ensure all new features include proper TypeScript types.
*   Follow the existing Tailwind CSS design system.
*   Check the [Issues](https://github.com/YOUR_ORG/nexus/issues) tab to find "good first issues" or propose a new feature.

---

## 📜 License

This open-source software is licensed under the [MIT License](LICENSE). You are free to use, modify, and distribute it for personal, community, or commercial use.
