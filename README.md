# Library Management System

**CSCI 441 — Software Engineering | Spring 2026 | Group 6**  
**Team:** Norint Ros · Sopanhariem Soeun · Laytong Ly · Norithisak Teng

A full-stack web application for managing a school library — supporting book catalog management, borrowing and returns, overdue tracking, user management, reporting, and a complete audit trail.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Roles & Permissions](#roles--permissions)
- [Backend](#backend)
  - [Getting Started](#backend-getting-started)
  - [Environment Variables](#environment-variables)
  - [API Endpoints](#api-endpoints)
- [Frontend](#frontend)
  - [Getting Started](#frontend-getting-started)
  - [Pages & Routes](#pages--routes)
- [Running the Full Stack](#running-the-full-stack)
- [Sprint Plan](#sprint-plan)

---

## Overview

The Library Management System (LMS) is a role-based web platform that allows students and teachers to search the library catalog and track borrowing history, while librarians and administrators can check out and return books, monitor overdue items, manage the catalog and users, generate reports, and view a full audit log of system activity.

---

## Tech Stack

| Layer        | Technology                                                      |
| ------------ | --------------------------------------------------------------- |
| **Frontend** | React 19, Vite 7, Tailwind CSS 4, shadcn/ui, React Router DOM 7 |
| **Backend**  | Node.js, Express 5                                              |
| **Database** | PostgreSQL + Prisma ORM 5                                       |
| **Auth**     | JSON Web Tokens (JWT, HS512) + HTTP-only cookies                |
| **Security** | bcryptjs (password hashing), role-based middleware              |

---

## Project Structure

```
library-management-system/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema (all 9 models)
│   │   └── seed.js              # Role & policy seed data
│   └── src/
│       ├── app.js               # Express app setup, CORS, middleware
│       ├── server.js            # HTTP server entry point
│       ├── config/
│       │   ├── permissions.js   # Role-permission map
│       │   └── prisma.js        # Prisma client singleton
│       ├── controllers/
│       │   └── authController.js
│       ├── middleware/
│       │   └── authMiddleware.js  # authenticateToken, authorizeRoles, requirePermission
│       ├── routes/
│       │   └── authRoutes.js
│       └── services/
│           ├── authService.js
│           └── bookService.js
├── frontend/
│   └── src/
│       ├── App.jsx              # Route definitions, ProtectedRoute, RoleRoute
│       ├── context/
│       │   └── AuthContext.jsx  # Global auth state
│       ├── constants/
│       │   └── permissions.js   # Mirrored permission keys
│       ├── layouts/
│       │   └── DashboardLayout.jsx
│       ├── components/          # Sidebar, nav, shadcn/ui components
│       ├── pages/               # One file per route (15 pages)
│       └── services/            # API service layer (7 files)
├── .gitignore
└── README.md
```

> **Note:** The `docs/` folder (sprint plan, API reference, database plan) is excluded from version control via `.gitignore`.

---

## Database Schema

The PostgreSQL database contains 9 models managed by Prisma:

| Model                  | Description                                                        |
| ---------------------- | ------------------------------------------------------------------ |
| `Role`                 | Defines the four roles: `student`, `teacher`, `librarian`, `admin` |
| `User`                 | Library members with hashed passwords, role FK, active flag        |
| `Category`             | Book genre/subject categories                                      |
| `Book`                 | Catalog entry with title, author, ISBN, availability counters      |
| `BookCopy`             | Individual physical copy with barcode and status                   |
| `BorrowingPolicy`      | Per-role loan duration and max books allowed                       |
| `BorrowingTransaction` | Checkout/return record linking a copy, borrower, and librarian     |
| `Notification`         | Due reminders, overdue alerts, and system messages per user        |
| `AuditLog`             | Immutable log of every critical action in the system               |
| `Report`               | Metadata for generated inventory/usage/overdue reports             |

**BookCopy statuses:** `AVAILABLE` · `BORROWED` · `RESERVED` · `LOST` · `UNAVAILABLE`  
**Transaction statuses:** `ACTIVE` · `RETURNED` · `OVERDUE`  
**Report types:** `INVENTORY` · `USAGE` · `POPULAR_BOOKS` · `OVERDUE_TRENDS`  
**Notification types:** `DUE_REMINDER` · `OVERDUE_ALERT` · `SYSTEM`

---

## Roles & Permissions

| Permission        | student | teacher | librarian | admin |
| ----------------- | :-----: | :-----: | :-------: | :---: |
| View Dashboard    |    ✓    |    ✓    |     ✓     |   ✓   |
| Search Catalog    |    ✓    |    ✓    |     ✓     |   ✓   |
| View Book Detail  |    ✓    |    ✓    |     ✓     |   ✓   |
| View Own History  |    ✓    |    ✓    |     ✓     |   ✓   |
| Checkout / Return |         |         |     ✓     |   ✓   |
| View Overdue      |         |         |     ✓     |   ✓   |
| Manage Catalog    |         |         |     ✓     |   ✓   |
| View Reports      |         |         |     ✓     |   ✓   |
| View Audit Logs   |         |         |     ✓     |   ✓   |
| Manage Users      |         |         |           |   ✓   |
| Manage Settings   |         |         |           |   ✓   |

---

## Backend

### Backend Getting Started

**Prerequisites:** Node.js 18+, PostgreSQL

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Copy and fill in environment variables
cp .env.example .env

# 4. Push the Prisma schema to your database
npm run db:push

# 5. Seed roles and borrowing policies
node prisma/seed.js

# 6. Start the development server
npm run dev
```

The API will be available at `http://localhost:3000`.

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/library_db"
JWT_SECRET="your-super-secret-key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=3000
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
COOKIE_SAME_SITE="lax"
```

### Available Scripts

| Script                | Description                            |
| --------------------- | -------------------------------------- |
| `npm run dev`         | Start server with nodemon (hot reload) |
| `npm start`           | Start server in production mode        |
| `npm run db:generate` | Regenerate Prisma client               |
| `npm run db:push`     | Push schema changes to DB              |
| `npm run db:studio`   | Open Prisma Studio GUI                 |

### API Endpoints

> **Base URL:** `http://localhost:3000/api`  
> All protected routes require either an `Authorization: Bearer <token>` header or an `accessToken` HTTP-only cookie set during login.

#### Authentication

| Method | Endpoint         | Access   | Description                    |
| ------ | ---------------- | -------- | ------------------------------ |
| `POST` | `/auth/register` | Public   | Register a new user account    |
| `POST` | `/auth/login`    | Public   | Login and receive JWT tokens   |
| `POST` | `/auth/logout`   | Any auth | Clear auth cookies             |
| `GET`  | `/auth/me`       | Any auth | Get the current user's profile |

#### Books & Catalog

| Method   | Endpoint                    | Access           | Description                                         |
| -------- | --------------------------- | ---------------- | --------------------------------------------------- |
| `GET`    | `/books`                    | Any auth         | Search/list books (`?q`, `?category_id`, `?status`) |
| `GET`    | `/books/:id`                | Any auth         | Get a single book with availability                 |
| `POST`   | `/books`                    | librarian, admin | Add a new book to the catalog                       |
| `PUT`    | `/books/:id`                | librarian, admin | Update book metadata                                |
| `DELETE` | `/books/:id`                | admin            | Remove a book from the catalog                      |
| `GET`    | `/books/:id/copies`         | Any auth         | List all physical copies                            |
| `POST`   | `/books/:id/copies`         | librarian, admin | Add a new physical copy                             |
| `PUT`    | `/books/:id/copies/:copyId` | librarian, admin | Update copy status or location                      |

#### Categories

| Method   | Endpoint          | Access   | Description         |
| -------- | ----------------- | -------- | ------------------- |
| `GET`    | `/categories`     | Any auth | List all categories |
| `POST`   | `/categories`     | admin    | Create a category   |
| `PUT`    | `/categories/:id` | admin    | Update a category   |
| `DELETE` | `/categories/:id` | admin    | Delete a category   |

#### Borrowing Transactions

| Method | Endpoint                     | Access                 | Description                       |
| ------ | ---------------------------- | ---------------------- | --------------------------------- |
| `POST` | `/transactions/checkout`     | librarian, admin       | Check out a book to a borrower    |
| `POST` | `/transactions/return`       | librarian, admin       | Process a book return             |
| `GET`  | `/transactions`              | librarian, admin       | List all transactions             |
| `GET`  | `/transactions/:id`          | librarian, admin       | Get a single transaction          |
| `GET`  | `/transactions/user/:userId` | librarian, admin, self | Get borrowing history for a user  |
| `GET`  | `/transactions/active`       | librarian, admin       | List all currently borrowed books |

#### Overdue

| Method | Endpoint             | Access           | Description                            |
| ------ | -------------------- | ---------------- | -------------------------------------- |
| `GET`  | `/overdue`           | librarian, admin | List all overdue transactions          |
| `GET`  | `/overdue/summary`   | librarian, admin | Overdue count by days range            |
| `POST` | `/overdue/run-check` | admin            | Manually trigger overdue detection job |

#### Notifications

| Method   | Endpoint                  | Access   | Description                        |
| -------- | ------------------------- | -------- | ---------------------------------- |
| `GET`    | `/notifications`          | Any auth | Get notifications for current user |
| `PUT`    | `/notifications/:id/read` | Any auth | Mark a notification as read        |
| `PUT`    | `/notifications/read-all` | Any auth | Mark all notifications as read     |
| `DELETE` | `/notifications/:id`      | Any auth | Delete a notification              |

#### Users & Roles

| Method   | Endpoint                      | Access      | Description                         |
| -------- | ----------------------------- | ----------- | ----------------------------------- |
| `GET`    | `/users`                      | admin       | List all users (filterable by role) |
| `GET`    | `/users/:id`                  | admin, self | Get user profile                    |
| `POST`   | `/users`                      | admin       | Create a user account               |
| `PUT`    | `/users/:id`                  | admin       | Update user info or role            |
| `PUT`    | `/users/:id/deactivate`       | admin       | Deactivate a user account           |
| `DELETE` | `/users/:id`                  | admin       | Delete a user account               |
| `GET`    | `/roles`                      | admin       | List all roles                      |
| `GET`    | `/borrowing-policies`         | admin       | List borrowing policies per role    |
| `PUT`    | `/borrowing-policies/:roleId` | admin       | Update borrowing policy for a role  |

#### Reports

| Method | Endpoint                  | Access           | Description                      |
| ------ | ------------------------- | ---------------- | -------------------------------- |
| `GET`  | `/reports/inventory`      | librarian, admin | Current inventory status summary |
| `GET`  | `/reports/usage`          | librarian, admin | Borrowing frequency over time    |
| `GET`  | `/reports/popular-books`  | librarian, admin | Most borrowed books              |
| `GET`  | `/reports/overdue-trends` | librarian, admin | Overdue statistics over time     |
| `GET`  | `/reports/export`         | librarian, admin | Download a report as CSV         |

#### Audit Logs

| Method | Endpoint      | Access | Description                         |
| ------ | ------------- | ------ | ----------------------------------- |
| `GET`  | `/audit-logs` | admin  | List audit log entries (filterable) |

---

## Frontend

### Frontend Getting Started

**Prerequisites:** Node.js 18+

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Available Scripts

| Script            | Description                        |
| ----------------- | ---------------------------------- |
| `npm run dev`     | Start Vite dev server (hot reload) |
| `npm run build`   | Build for production               |
| `npm run preview` | Preview production build locally   |
| `npm run lint`    | Run ESLint                         |

### Pages & Routes

| Route           | Page                 | Access           |
| --------------- | -------------------- | ---------------- |
| `/login`        | Login Page           | Public           |
| `/register`     | Register Page        | Public           |
| `/dashboard`    | Dashboard            | Any auth         |
| `/search`       | Search Catalog       | Any auth         |
| `/books/:id`    | Book Detail          | Any auth         |
| `/history`      | My Borrowing History | Any auth         |
| `/checkout`     | Checkout Book        | librarian, admin |
| `/return`       | Return Book          | librarian, admin |
| `/overdue`      | Overdue List         | librarian, admin |
| `/catalog`      | Catalog Management   | librarian, admin |
| `/users`        | User Management      | admin            |
| `/reports`      | Reports Dashboard    | librarian, admin |
| `/audit-logs`   | Audit Log Viewer     | admin            |
| `/settings`     | System Settings      | admin            |
| `/unauthorized` | Unauthorized         | Any              |

### Frontend Service Layer

API calls are organized into service files under `src/services/`:

| File                     | Covers                                          |
| ------------------------ | ----------------------------------------------- |
| `authService.js`         | `/auth/*`                                       |
| `bookService.js`         | `/books/*`, `/categories/*`                     |
| `transactionService.js`  | `/transactions/*`, `/overdue/*`                 |
| `notificationService.js` | `/notifications/*`                              |
| `userService.js`         | `/users/*`, `/roles/*`, `/borrowing-policies/*` |
| `reportService.js`       | `/reports/*`                                    |
| `auditService.js`        | `/audit-logs/*`                                 |

---

## Running the Full Stack

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

| Service  | URL                              |
| -------- | -------------------------------- |
| Frontend | http://localhost:5173            |
| Backend  | http://localhost:3000            |
| API      | http://localhost:3000/api        |
| Health   | http://localhost:3000/api/health |

---

## Sprint Plan

The project follows an 8-week, 2-iteration schedule (**Feb 18 – Apr 18, 2026**):

| Iteration | Weeks | Goal                                                                                 |
| --------- | ----- | ------------------------------------------------------------------------------------ |
| **1**     | 1 – 4 | Core circulation: auth, catalog search, checkout, return                             |
| **2**     | 5 – 8 | Admin features: overdue, notifications, reports, user management, audit logs, polish |

The full week-by-week task breakdown and API specification are maintained in the `docs/` folder, which is excluded from version control.
