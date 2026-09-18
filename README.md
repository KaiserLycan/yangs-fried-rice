# Yang's Fried Rice — Ordering System

A comprehensive, real-time ordering and restaurant management platform built for Yang's Fried Rice.

## 🚀 Current Project Status

The project has advanced significantly beyond the initial customer cart scaffold. We now have a robust multi-role system featuring:

* **Customer Ordering & Tracking**: Full browse, cart, and checkout flow. Live order tracking powered by Supabase Real-time subscriptions.
* **Authentication**: Supabase-backed role management for Customers, Administrators, Managers, and Delivery Drivers.
* **Kitchen Display System (KDS)**: Real-time sequential order queuing for the kitchen staff.
* **Driver Operations**: A dedicated driver dashboard featuring map integrations and a Proof of Delivery capture modal.
* **Admin Analytics**: PDF report generation for daily sales and platform summaries.

### 📋 Documentation & Missing Features
For a detailed look at what is currently built, what is using dummy data, and what is missing entirely (such as Stripe payment processing), please see the following audit files in the `docs/` directory:
* [`docs/requirements_audit.md`](docs/requirements_audit.md) - A master checklist of all original project requirements.
* [`docs/codebase_comparison.md`](docs/codebase_comparison.md) - Analysis of frontend components waiting on backend integration.
* [`docs/unimplemented_issues.md`](docs/unimplemented_issues.md) - Remaining Github issues and acceptance criteria.

---

## 🛠️ Tech Stack

* **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS, Shadcn UI
* **Backend & Database**: Supabase (PostgreSQL, Auth, Realtime, Storage)
* **Testing**: Vitest, React Testing Library
* **PDF Generation**: jsPDF, jspdf-autotable
* **Maps**: Leaflet, React-Leaflet

---

## 💻 Local Development Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Supabase Environment Variables**
   Create a `.env.local` file by copying the example:
   ```bash
   cp .env.local.example .env.local
   ```
   Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your Supabase dashboard.

3. **Database Schema & Seed** 
   In the Supabase SQL Editor, run `supabase/schema.sql` to generate the ERD tables, followed by `supabase/seed.sql` to populate mock data for local testing.

4. **Generate Real DB Types** (replaces the placeholder in `types/database.types.ts`):
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npm run supabase:types
   ```

5. **Run the dev server**
   ```bash
   npm run dev
   ```
   Visit http://localhost:3000 to view the application.

6. **Run tests**
   ```bash
   npm run test
   ```

## 📁 Key Folder Structure

```
app/                  # Next.js App Router (pages & API routes)
  (account)/          # Customer-facing checkout and order history
  (shop)/             # Customer-facing menu browsing
  api/                # Backend routers and PDF generators
  deliver/            # Delivery Driver UI
  manage/             # Admin/Manager Dashboard and KDS
components/           # Reusable UI components grouped by feature domain
docs/                 # Project tracking, gap analysis, and audits
lib/                  # Server actions, validation, and Supabase clients
__tests__/            # Vitest unit and component tests
```
