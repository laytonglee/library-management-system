# API Endpoint Reference

## School Library Management System — Group 6

> **Base URL:** `http://localhost:5000/api` (development)
> **Auth:** All protected routes require `Authorization: Bearer <JWT>` header.
> **Roles:** `student` · `teacher` · `librarian` · `admin`

---

## Backend REST API

### 🔐 Auth

| Method | Endpoint                  | Access   | Description                                        |
| ------ | ------------------------- | -------- | -------------------------------------------------- |
| `POST` | `/auth/register`          | Public   | Register new user account (student/teacher only)   |
| `POST` | `/auth/register/admin`    | admin    | Create any-role user account                       |
| `POST` | `/auth/login`             | Public   | Login — sets `accessToken` + `refreshToken` cookies; writes LOGIN audit log |
| `POST` | `/auth/refresh`           | Public   | Issue new accessToken from refreshToken cookie     |
| `POST` | `/auth/logout`            | Any auth | Clear auth cookies                                 |
| `GET`  | `/auth/me`                | Any auth | Get current logged-in user profile                 |

> Failed logins (wrong password, unknown email) write a `LOGIN_FAILED` audit log entry.

**`POST /auth/register` body:**

```json
{
  "full_name": "string",
  "username": "string",
  "email": "string",
  "password": "string",
  "role_id": 1
}
```

**`POST /auth/login` body:**

```json
{ "email": "string", "password": "string" }
```

**`POST /auth/login` response:**

```json
{
  "token": "jwt_string",
  "user": {
    "id": 1,
    "full_name": "string",
    "email": "string",
    "role": "student"
  }
}
```

---

### 📚 Books (Catalog)

| Method   | Endpoint                    | Access           | Description                                                        |
| -------- | --------------------------- | ---------------- | ------------------------------------------------------------------ |
| `GET`    | `/books`                    | Any auth         | Search/list all books (query params: `q`, `category_id`, `status`) |
| `GET`    | `/books/:id`                | Any auth         | Get single book details + availability                             |
| `POST`   | `/books`                    | librarian, admin | Add new book to catalog                                            |
| `PUT`    | `/books/:id`                | librarian, admin | Update book metadata                                               |
| `DELETE` | `/books/:id`                | admin            | Remove book from catalog                                           |
| `GET`    | `/books/:id/copies`         | Any auth         | List all physical copies of a book                                 |
| `POST`   | `/books/:id/copies`         | librarian, admin | Add a new physical copy                                            |
| `PUT`    | `/books/:id/copies/:copyId` | librarian, admin | Update copy status/location                                        |

**`GET /books` query params:**

```
?q=title_or_author
&category_id=2
&status=available
&page=1
&limit=20
```

**`POST /books` body:**

```json
{
  "title": "string",
  "author": "string",
  "isbn": "string",
  "category_id": 1,
  "publisher": "string",
  "publication_year": 2023,
  "description": "string",
  "total_copies": 3
}
```

> `total_copies` at create time means "create N `book_copies` rows". Inventory values returned by book endpoints are derived from `book_copies` (not persisted counters on `books`).

---

### 🗂️ Categories

| Method   | Endpoint          | Access   | Description         |
| -------- | ----------------- | -------- | ------------------- |
| `GET`    | `/categories`     | Any auth | List all categories |
| `POST`   | `/categories`     | admin    | Create new category |
| `PUT`    | `/categories/:id` | admin    | Update category     |
| `DELETE` | `/categories/:id` | admin    | Delete category     |

---

### 🔄 Borrowing Transactions

| Method | Endpoint                     | Access                 | Description                        |
| ------ | ---------------------------- | ---------------------- | ---------------------------------- |
| `POST` | `/transactions/checkout`     | librarian, admin       | Check out a book to a borrower     |
| `POST` | `/transactions/return`       | librarian, admin       | Process a book return              |
| `GET`  | `/transactions`              | librarian, admin       | List all transactions (filterable) |
| `GET`  | `/transactions/:id`          | librarian, admin       | Get single transaction details     |
| `GET`  | `/transactions/user/:userId` | librarian, admin, self | Get borrowing history for a user   |
| `GET`  | `/transactions/active`       | librarian, admin       | List all currently borrowed books  |

**`POST /transactions/checkout` body:**

```json
{
  "borrower_id": 5,
  "book_copy_id": 12,
  "notes": "optional"
}
```

**`POST /transactions/return` body:**

```json
{
  "book_copy_id": 12,
  "notes": "optional"
}
```

**`POST /transactions/checkout` response:**

```json
{
  "transaction_id": 42,
  "borrower": "John Doe",
  "book": "Clean Code",
  "checkout_date": "2026-02-18",
  "due_date": "2026-03-04"
}
```

---

### ⚠️ Overdue

| Method | Endpoint             | Access           | Description                            |
| ------ | -------------------- | ---------------- | -------------------------------------- |
| `GET`  | `/overdue`           | librarian, admin | List all overdue transactions          |
| `GET`  | `/overdue/summary`   | librarian, admin | Count of overdue items by days range   |
| `POST` | `/overdue/run-check` | admin, system    | Manually trigger overdue detection job |

**`GET /overdue` query params:**

```
?sort=days_overdue_desc
&borrower_id=5
&page=1&limit=20
```

**`GET /overdue` response item:**

```json
{
  "transaction_id": 42,
  "borrower": { "id": 5, "name": "Jane", "email": "..." },
  "book": { "title": "...", "copy_barcode": "..." },
  "due_date": "2026-02-10",
  "days_overdue": 8
}
```

---

### 🔔 Notifications

| Method   | Endpoint                  | Access   | Description                        |
| -------- | ------------------------- | -------- | ---------------------------------- |
| `GET`    | `/notifications`          | Any auth | Get notifications for current user |
| `PUT`    | `/notifications/:id/read` | Any auth | Mark a notification as read        |
| `PUT`    | `/notifications/read-all` | Any auth | Mark all notifications as read     |
| `DELETE` | `/notifications/:id`      | Any auth | Delete a notification              |

---

### 👥 Users & Roles

| Method   | Endpoint                      | Access      | Description                         |
| -------- | ----------------------------- | ----------- | ----------------------------------- |
| `GET`    | `/users`                      | admin       | List all users (filterable by role) |
| `GET`    | `/users/:id`                  | admin, self | Get user profile                    |
| `POST`   | `/users`                      | admin       | Create user account                 |
| `PUT`    | `/users/:id`                  | admin       | Update user info / role             |
| `PUT`    | `/users/:id/deactivate`       | admin       | Deactivate user account             |
| `DELETE` | `/users/:id`                  | admin       | Delete user account                 |
| `GET`    | `/roles`                      | admin       | List all roles                      |
| `GET`    | `/borrowing-policies`         | admin       | List borrowing policies per role    |
| `PUT`    | `/borrowing-policies/:roleId` | admin       | Update borrowing policy for a role  |

---

### 📊 Reports

| Method | Endpoint                         | Access           | Description                      |
| ------ | -------------------------------- | ---------------- | -------------------------------- |
| `GET`  | `/reports/inventory`             | librarian, admin | Current inventory status summary |
| `GET`  | `/reports/borrowing`             | librarian, admin | Borrowing frequency over time    |
| `GET`  | `/reports/popular`               | librarian, admin | Most borrowed books              |
| `GET`  | `/reports/overdue-trends`        | librarian, admin | Overdue stats over time          |
| `GET`  | `/reports/:type/export`          | librarian, admin | Download named report as CSV     |

**`GET /reports/:type/export`** — `:type` is one of `inventory`, `borrowing`, `popular`, `overdue-trends`.

Optional query params for borrowing and popular:
```
?startDate=2026-01-01&endDate=2026-03-01&limit=10
```

---

### 🏠 Dashboard

| Method | Endpoint     | Access           | Description                                                      |
| ------ | ------------ | ---------------- | ---------------------------------------------------------------- |
| `GET`  | `/dashboard` | librarian, admin | Summary stats: total books, active loans, overdue count, members |

---

### 🔖 Reservations

| Method   | Endpoint                         | Access       | Description                           |
| -------- | -------------------------------- | ------------ | ------------------------------------- |
| `POST`   | `/reservations`                  | Any auth     | Reserve a book                        |
| `GET`    | `/reservations`                  | Any auth     | List own reservations                 |
| `GET`    | `/reservations/:bookId/position` | Any auth     | Get queue position for a book         |
| `PUT`    | `/reservations/:id/cancel`       | Any auth     | Cancel a reservation                  |
| `PUT`    | `/reservations/:id/fulfill`      | librarian    | Mark reservation fulfilled (checkout) |

---

### 📥 Data Import / Export (UC-11)

| Method | Endpoint                    | Access | Description                                              |
| ------ | --------------------------- | ------ | -------------------------------------------------------- |
| `GET`  | `/import/export/books`      | admin  | Download all books as CSV (id, title, author, isbn, ...) |
| `POST` | `/import/books`             | admin  | Import books from CSV file; upserts on isbn or title+author |

**`POST /import/books`** — multipart/form-data, field name `file`, `.csv` extension required.

CSV format (header row required):
```
title,author,isbn,publisher,publicationYear,category,description
Clean Code,Robert C. Martin,9780132350884,Prentice Hall,2008,Programming,
```

Response:
```json
{ "success": true, "data": { "imported": 12, "skipped": 1 } }
```

Rows without `title` and `author` are skipped. Categories are auto-created if they don't exist. Writes one `DATA_IMPORT` audit log entry per request.

---

### 🗒️ Audit Logs

| Method | Endpoint      | Access | Description                         |
| ------ | ------------- | ------ | ----------------------------------- |
| `GET`  | `/audit-logs` | admin  | List audit log entries (filterable) |

**`GET /audit-logs` query params:**

```
?action=CHECKOUT|RETURN|LOGIN|LOGIN_FAILED|OVERDUE_FLAG|DATA_IMPORT|ROLE_CHANGE
&actorId=3
&targetType=transaction|user|book
&page=1&limit=50
```

Logged actions: `LOGIN`, `LOGIN_FAILED`, `CHECKOUT`, `RETURN`, `OVERDUE_FLAG`, `DATA_IMPORT`, `BOOK_EDIT`, `ROLE_CHANGE`, `USER_DEACTIVATE`.

---

## Frontend Routes (React Pages)

| Route         | Page                 | Access           | Backend APIs Used                                         |
| ------------- | -------------------- | ---------------- | --------------------------------------------------------- |
| `/login`      | Login Page           | Public           | `POST /auth/login`                                        |
| `/register`   | Register Page        | Public           | `POST /auth/register`                                     |
| `/`           | Dashboard / Home     | Any auth         | `GET /auth/me`, `GET /notifications`                      |
| `/search`     | Search Catalog       | Any auth         | `GET /books`, `GET /categories`                           |
| `/books/:id`  | Book Detail          | Any auth         | `GET /books/:id`, `GET /books/:id/copies`                 |
| `/checkout`   | Checkout Book        | librarian, admin | `POST /transactions/checkout`, `GET /users`, `GET /books` |
| `/return`     | Return Book          | librarian, admin | `POST /transactions/return`                               |
| `/overdue`    | Overdue List         | librarian, admin | `GET /overdue`, `GET /overdue/summary`                    |
| `/history`    | My Borrowing History | Any auth         | `GET /transactions/user/:userId`                          |
| `/catalog`    | Catalog Management   | librarian, admin | `GET/POST/PUT/DELETE /books`, `GET /categories`           |
| `/users`      | User Management      | admin            | `GET/POST/PUT/DELETE /users`, `GET /roles`                |
| `/reports`    | Reports Dashboard    | librarian, admin | `GET /reports/*`, `GET /reports/export`                   |
| `/audit-logs` | Audit Log Viewer     | admin            | `GET /audit-logs`                                         |
| `/settings`   | Settings             | admin            | `GET/PUT /borrowing-policies`, `GET /roles`               |
| `/import`     | Data Import          | admin            | `POST /import/books`, `GET /import/export/books`          |

---

## Frontend API Service Structure (suggested)

```text
src/
  services/
    authService.js         ← /auth/*
    bookService.js         ← /books/*, /categories/*
    transactionService.js  ← /transactions/*, /overdue/*
    notificationService.js ← /notifications/*
    userService.js         ← /users/*, /roles/*
    reportService.js       ← /reports/*
    auditService.js        ← /audit-logs/*
```

Each service file exports functions like:

```js
// bookService.js
export const searchBooks = (params) => api.get("/books", { params });
export const getBookById = (id) => api.get(`/books/${id}`);
export const createBook = (data) => api.post("/books", data);
```

---

## HTTP Status Codes Used

| Code  | Meaning                               |
| ----- | ------------------------------------- |
| `200` | OK — success                          |
| `201` | Created — new resource created        |
| `400` | Bad Request — validation error        |
| `401` | Unauthorized — not logged in          |
| `403` | Forbidden — wrong role                |
| `404` | Not Found                             |
| `409` | Conflict — e.g. book already borrowed |
| `500` | Server Error                          |
