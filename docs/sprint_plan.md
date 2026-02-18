# 8-Week Sprint Plan

## School Library Management System — Group 6

**Duration:** Feb 18 – Apr 18, 2026 | **Team:** Norint, Sopanhariem, Laytong, Norithisak

---

> **Is 2 months enough?** Yes — comfortably. Your SRS is already done, requirements are clear, the tech stack is decided, and all 4 members have relevant skills. The main risk is scope creep; stick to the 2 iterations defined in your report.

---

## Iteration 1 — Core Circulation (Weeks 1–4)

_Goal: Working login, search, checkout, and return flow_

---

### Week 1 — Feb 18–24 | Project Setup & Foundation

| Member                | Tasks                                                                                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Norint Ros**        | Set up PostgreSQL/MySQL DB, write all migrations (all 9 tables), seed roles & borrowing policies, set up Express backend project structure                   |
| **Sopanhariem Soeun** | Set up React frontend project (Vite + Tailwind/Shadcn already started ✅), create routing skeleton (Login, Home, Search, Detail pages), set up global layout |
| **Laytong Ly**        | Set up backend project (Node/Express or Spring Boot), configure `.env`, connect DB, set up API folder structure, configure CORS & middleware                 |
| **Norithisak Teng**   | Set up testing framework (Jest or Vitest), write test plan document, define test cases for checkout/return/due-date logic                                    |

**🏁 Week 1 Milestone:** All repos set up, DB running locally, frontend skeleton renders, test framework configured.

---

### Week 2 — Feb 25 – Mar 3 | Authentication & Book Catalog

| Member                | Tasks                                                                                                                              |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Norint Ros**        | Build Auth API: `POST /auth/register`, `POST /auth/login`, JWT middleware, role-based route guards                                 |
| **Sopanhariem Soeun** | Build Login UI (already started ✅), Sign-up UI, connect to Auth API, store JWT in context/localStorage                            |
| **Laytong Ly**        | Build Books API: `GET /books` (search + filter), `GET /books/:id`, `GET /categories`                                               |
| **Norithisak Teng**   | Write unit tests for Auth (login success/fail, token validation), test DB connection, verify role guard blocks unauthorized routes |

**🏁 Week 2 Milestone:** Login works end-to-end. Books can be fetched from API.

---

### Week 3 — Mar 4–10 | Search UI & Checkout/Return API

| Member                | Tasks                                                                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Norint Ros**        | Build Checkout API: `POST /transactions/checkout` (validate borrower eligibility, compute due date, update `book_copies.status`, write audit log) |
| **Sopanhariem Soeun** | Build Search Catalog UI (search bar, filters, results list with availability badge), Book Detail page                                             |
| **Laytong Ly**        | Build Return API: `POST /transactions/return` (find active transaction, record return date, update availability, write audit log)                 |
| **Norithisak Teng**   | Write unit tests for due-date calculation, availability update logic, borrower eligibility check                                                  |

**🏁 Week 3 Milestone:** Search works in UI. Checkout and Return APIs pass unit tests.

---

### Week 4 — Mar 11–17 | Checkout/Return UI & Iteration 1 Integration

| Member                | Tasks                                                                                                                                           |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Norint Ros**        | Review and fix any API bugs found during integration, add input validation & error responses                                                    |
| **Sopanhariem Soeun** | Build Checkout UI (librarian view: enter borrower ID + book ID, confirm), Return UI (scan/enter book ID, confirm)                               |
| **Laytong Ly**        | Wire all frontend pages to real APIs (replace any mock data), implement protected routes (redirect if not logged in)                            |
| **Norithisak Teng**   | Run integration tests: full checkout → return workflow, verify DB state after each transaction, test role-based access (student can't checkout) |

**🏁 Iteration 1 Complete:** Login → Search → Checkout → Return fully working end-to-end.

---

## Iteration 2 — Administrative Features (Weeks 5–8)

_Goal: Overdue management, reports, user management, polish_

---

### Week 5 — Mar 18–24 | Overdue System & Notifications

| Member                | Tasks                                                                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Norint Ros**        | Build Overdue API: scheduled job to flag `status = overdue` on past-due transactions, `GET /transactions/overdue` endpoint with sorting/filtering |
| **Sopanhariem Soeun** | Build Overdue UI (staff page: list of overdue items, days overdue, borrower info, sortable/filterable)                                            |
| **Laytong Ly**        | Build Notifications system: create notification records on overdue detection, `GET /notifications` for current user, mark-as-read endpoint        |
| **Norithisak Teng**   | Test overdue detection (mock past due dates), verify notifications are created, test overdue list API filters                                     |

**🏁 Week 5 Milestone:** Overdue items are auto-detected. Staff can view overdue list. Users see notifications.

---

### Week 6 — Mar 25–31 | User Management & Borrowing History

| Member                | Tasks                                                                                                                                     |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Norint Ros**        | Build User Management API: `GET/POST/PUT/DELETE /users`, role assignment, `GET /users/:id/borrowing-history`                              |
| **Sopanhariem Soeun** | Build Borrowing History UI (user view: list of past + current borrows with status), Notification bell in header (already in Dashboard ✅) |
| **Laytong Ly**        | Build Audit Log API: `GET /audit-logs` (admin only), wire audit log writes to all critical actions (login, checkout, return, role change) |
| **Norithisak Teng**   | Test user management (create/update/disable), verify audit logs are written correctly, test borrowing history accuracy                    |

**🏁 Week 6 Milestone:** Admins can manage users. Borrowing history works. Audit trail is complete.

---

### Week 7 — Apr 1–7 | Reports, Export & Catalog Management

| Member                | Tasks                                                                                                                                                 |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Norint Ros**        | Build Reports API: inventory status, borrowing frequency, popular books, overdue trends; CSV export endpoint                                          |
| **Sopanhariem Soeun** | Build Reports Dashboard UI (2–3 report types with charts/tables, download CSV button), Catalog management UI (add/edit/remove books — librarian only) |
| **Laytong Ly**        | Build Catalog Management API: `POST/PUT/DELETE /books`, `POST /book-copies`, ensure audit log on all changes                                          |
| **Norithisak Teng**   | Test reports (verify data accuracy), test CSV export, test catalog CRUD operations, run full end-to-end test suite                                    |

**🏁 Week 7 Milestone:** Reports generate correctly. Librarians can manage the catalog. CSV export works.

---

### Week 8 — Apr 8–18 | Polish, Security, Testing & Final Delivery

| Member                | Tasks                                                                                                                             |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Norint Ros**        | Final API review: add missing error handling, rate limiting, ensure all endpoints have auth guards; write API documentation       |
| **Sopanhariem Soeun** | UI polish: responsive design (REQ-32), loading states, error messages, empty states; final UX review across all pages             |
| **Laytong Ly**        | Final integration pass: fix any broken API connections, environment config for production, final code review                      |
| **Norithisak Teng**   | Full regression test suite, security testing (try bypassing auth via direct URL/API), performance check (REQ-19), final bug fixes |

**🏁 Final Milestone (Apr 18):** System fully functional, tested, documented, and ready for demo/submission.

---

## Summary Timeline

```
Week 1  [Feb 18] ████ Setup & DB
Week 2  [Feb 25] ████ Auth + Books API
Week 3  [Mar 04] ████ Search UI + Checkout/Return API
Week 4  [Mar 11] ████ Checkout/Return UI + Integration ← Iteration 1 Done ✅
Week 5  [Mar 18] ████ Overdue + Notifications
Week 6  [Mar 25] ████ User Mgmt + History + Audit
Week 7  [Apr 01] ████ Reports + Catalog Mgmt
Week 8  [Apr 08] ████ Polish + Security + Final Testing ← Done ✅
```

---

## Risk & Tips

> **TIP — Meet weekly (30 min):** Quick sync every Monday to unblock each other early.

> **IMPORTANT — API contracts first:** Laytong is the integration glue — make sure frontend and backend teams agree on API contracts (request/response shapes) by end of Week 1.

> **WARNING — Scope risk:** REQ-22 (backup/restore) and REQ-23 (maintainability docs) are low priority — defer to Week 8 only if time allows.

> **CAUTION — Don't skip tests:** Transaction consistency (REQ-20) is critical. A bug in checkout/return logic can corrupt the whole DB.
