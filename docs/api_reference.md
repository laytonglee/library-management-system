# API Endpoint Reference

## School Library Management System — Group 6

> **Base URL:** `http://localhost:5000/api` (development)
> **Auth:** All protected routes require `Authorization: Bearer <JWT>` header.
> **Roles:** `student` · `teacher` · `librarian` · `admin`

---

## Backend REST API

### 🔐 Auth

| Method | Endpoint         | Access   | Description                        |
| ------ | ---------------- | -------- | ---------------------------------- |
| `POST` | `/auth/register` | Public   | Register new user account          |
| `POST` | `/auth/login`    | Public   | Login, returns JWT token           |
| `POST` | `/auth/logout`   | Any auth | Invalidate session/token           |
| `GET`  | `/auth/me`       | Any auth | Get current logged-in user profile |

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

| Method | Endpoint                  | Access           | Description                      |
| ------ | ------------------------- | ---------------- | -------------------------------- |
| `GET`  | `/reports/inventory`      | librarian, admin | Current inventory status summary |
| `GET`  | `/reports/usage`          | librarian, admin | Borrowing frequency over time    |
| `GET`  | `/reports/popular-books`  | librarian, admin | Most borrowed books              |
| `GET`  | `/reports/overdue-trends` | librarian, admin | Overdue stats over time          |
| `GET`  | `/reports/export`         | librarian, admin | Download report as CSV           |

**`GET /reports/export` query params:**

```
?type=inventory|usage|popular_books|overdue_trends
&from=2026-01-01
&to=2026-03-01
```

---

### 🗒️ Audit Logs

| Method | Endpoint      | Access | Description                         |
| ------ | ------------- | ------ | ----------------------------------- |
| `GET`  | `/audit-logs` | admin  | List audit log entries (filterable) |

**`GET /audit-logs` query params:**

```
?action=CHECKOUT|RETURN|LOGIN|ROLE_CHANGE
&actor_id=3
&from=2026-02-01
&page=1&limit=50
```

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

---

## Frontend API Service Structure (suggested)

```
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
