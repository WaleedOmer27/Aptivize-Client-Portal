# Aptivize Client Portal

<div align="center">

![Aptivize Banner](client/src/assets/aptivize_logo.jpeg)

**A full-stack client management portal built with React, Express, and PostgreSQL.**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat&logo=vite&logoColor=white)](https://vite.dev)
[![Express](https://img.shields.io/badge/Express-5-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=flat&logo=postgresql&logoColor=white)](https://neon.tech)

</div>

---

## Overview

Aptivize Client Portal is a production-ready web application for managing client relationships. It gives clients a professional space to track their projects, pay invoices, message the team, and submit support tickets — all in one place. Admins get a full management dashboard with analytics, user management, and project creation tools.

Built over **8 days** as a full project from scratch.

---

## Features

### 👤 Client View
- **Dashboard** — Live stats: active projects, pending invoices, unread messages, open tickets
- **Projects** — Project list with progress bars and full milestone detail view
- **Messages** — Real-time-like messaging with the team; threaded conversations
- **Invoices** — View and pay invoices with one click
- **Support** — Create and reply to support tickets; full thread history
- **Notifications** — Bell badge that polls for updates every 30s; dropdown with mark-read
- **Profile** — Update name, email, and password

### 🛡️ Admin Panel
- **Dashboard** — Platform-wide KPIs: total revenue, active projects, open tickets, user counts
- **Clients** — Create, edit, and deactivate client accounts
- **Employees** — Manage employee and admin accounts
- **Analytics** — Revenue breakdown, project status, ticket trends (Recharts)
- **Create Project** — Assign projects to clients with colour, progress, status, and due date

### ⚙️ Technical Highlights
- **JWT Authentication** with role-based access control (`admin` / `employee` / `client`)
- **Notification system** — auto-triggered on ticket reply, status change, new message, project creation, invoice payment
- **Dark / Light theme** — persisted to localStorage
- **Code splitting** — 16 lazy-loaded page chunks (Recharts only loads on `/admin/analytics`)
- **Form validation** — client-side (instant) + server-side (`express-validator`, 422 responses)
- **Error boundary** — branded fallback UI for unhandled render errors
- **Soft deletes** — users are deactivated, never hard-deleted

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, Tailwind CSS v4, React Router v7 |
| Backend | Express.js 5, Node.js (ESM modules) |
| Database | PostgreSQL via [Neon](https://neon.tech) + Sequelize v6 |
| Auth | JWT (`jsonwebtoken`) + `bcryptjs` |
| Validation | `express-validator` (server) + custom hooks (client) |
| Charts | Recharts |
| Notifications | `react-toastify` + custom polling context |
| Styling | Inter font, CSS custom properties, dark mode |

---

## Getting Started

### Prerequisites
- Node.js 20+
- A PostgreSQL database (free tier on [Neon](https://neon.tech) works great)

### 1. Clone the repo
```bash
git clone https://github.com/WaleedOmer27/Aptivize-Client-Portal.git
cd Aptivize-Client-Portal
```

### 2. Install dependencies
```bash
cd server && npm install
cd ../client && npm install
```

### 3. Configure environment
```bash
cp server/.env.example server/.env
# Fill in your DATABASE_URL, JWT_SECRET, etc.
```

### 4. Run database migrations
```bash
cd server
node --env-file=.env config/migrate.js
node --env-file=.env config/migrate_phase3.js
node --env-file=.env config/migrate_notifications.js
```

### 5. Start dev servers
```bash
# Terminal 1
cd server && npm run dev      # → http://localhost:5000

# Terminal 2
cd client && npm run dev      # → http://localhost:5173
```

---

## Environment Variables

Create `server/.env` from the example:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
JWT_SECRET=your-super-secret-key
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

---

## Project Structure

```
Aptivize-Client-Portal/
├── client/                    # Vite + React frontend
│   └── src/
│       ├── components/        # Button, Card, Navbar, Sidebar, Input, …
│       ├── context/           # AuthContext, ThemeContext, NotificationContext
│       ├── layouts/           # MainLayout, AdminLayout, AuthLayout
│       ├── pages/             # Route-level page components
│       │   └── admin/         # Admin-only pages
│       └── services/          # api.js — typed Axios helpers
│
└── server/                    # Express.js REST API
    ├── config/                # Sequelize connection + migration scripts
    ├── controllers/           # Route handlers (business logic)
    ├── middleware/             # auth.js, validate.js, errorHandler.js
    ├── models/                # Sequelize models + query helpers
    └── routes/                # Express Router files
```

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/auth/me` | JWT | Current user |
| PATCH | `/api/users/me` | JWT | Update profile |
| PATCH | `/api/users/me/password` | JWT | Change password |
| GET | `/api/projects` | JWT | List projects (role-filtered) |
| POST | `/api/projects` | Admin | Create project |
| GET | `/api/projects/:id` | JWT | Project + milestones |
| GET | `/api/dashboard/stats` | JWT | KPI stats |
| GET | `/api/dashboard/activity` | JWT | Activity feed |
| GET | `/api/messages` | JWT | Thread list |
| POST | `/api/messages` | JWT | Send message |
| GET | `/api/tickets` | JWT | List tickets |
| POST | `/api/tickets` | Client | Create ticket |
| POST | `/api/tickets/:id/replies` | JWT | Add reply |
| PATCH | `/api/tickets/:id` | Admin/Employee | Update status |
| GET | `/api/invoices` | JWT | List invoices |
| PATCH | `/api/invoices/:id/pay` | JWT | Pay invoice |
| GET | `/api/admin/users` | Admin | List users |
| POST | `/api/admin/users` | Admin | Create user |
| GET | `/api/admin/analytics` | Admin | Platform analytics |
| GET | `/api/notifications` | JWT | Last 30 notifications |
| GET | `/api/notifications/unread-count` | JWT | Badge count |
| PATCH | `/api/notifications/:id/read` | JWT | Mark one read |
| PATCH | `/api/notifications/read-all` | JWT | Mark all read |

---

## Notification Triggers

| Event | Who is notified |
|-------|----------------|
| Staff replies to a ticket | Client (ticket owner) |
| Client replies to a ticket | Admin |
| Ticket status changes | Client (ticket owner) |
| New message sent | Message receiver |
| New project created | Client (assigned) |
| Invoice paid | Admin |

---

## Deployment

| Service | Platform |
|---------|----------|
| Frontend | [Vercel](https://vercel.com) — connect repo, set `VITE_API_URL` |
| Backend | [Render](https://render.com) — set all env vars from `.env.example` |
| Database | [Neon](https://neon.tech) — production PostgreSQL branch |

---

## License

MIT © 2026 Waleed Omer
