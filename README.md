# Smart Notification Management System

A notification management system where notifications can be created, listed, retried on failure, and tracked through a dashboard. Backend is Spring Boot, frontend is React.

This README grows as the project grows - more sections get added as each piece gets built.

## Tech stack

Backend:
- Java 17, Spring Boot 3.3.4, Maven
- PostgreSQL, Spring Data JPA / Hibernate
- Flyway for schema migrations
- RabbitMQ for async notification processing
- Log4j2 for logging (Logback excluded)
- Lombok

Frontend:
- React 18, Vite, plain JavaScript (no TypeScript)
- React Router for the 3 pages
- Axios for API calls
- No UI framework, no React Query/Redux - just hooks and a small service layer

## Architecture

Three layers, each with one job:

```
Controller  ->  handles HTTP only
Service     ->  all business rules (duplicate check, message validation, retry rules, dashboard stats)
Repository  ->  database queries only
```

Controllers never see the entity, only DTOs - a small transformer class converts between them. Whenever the service throws a business exception, one global handler turns it into the right HTTP status, so no other layer has to think about status codes.

**How a notification actually gets sent:**

```
1. POST /notifications or /retry  ->  save row (PENDING or RETRYING)
2.                                 ->  publish notification id to RabbitMQ
3. API responds here. The client does not wait for step 4.

4. Consumer picks up the message  ->  ~30% random failure  ->  save SENT or FAILED
```

That gap between step 3 and step 4 is the "asynchronous processing" the brief asks for - the API returns right after the DB write, the actual send happens separately, on its own time.

If RabbitMQ is down at step 2, the row from step 1 is still saved. It just sits there until the broker comes back and something republishes it. That failure gets logged, not swallowed.

## Frontend

Three pages, no state management library - just component-local `useState`/`useEffect` and a small service layer.

```
src/
  components/   Loader, Alert, Navbar - shared across all three pages
  pages/        CreateNotificationPage, NotificationListPage, DashboardPage
  services/     api.js (the axios instance), notificationService.js (the four API calls)
  utils/        errorUtils.js (turns a backend error response into one message), formatDate.js
  constants/    notification types and statuses
```

The list page's pagination and filters are both server-side - changing a filter resets to page 0 and refetches from the API rather than filtering in the browser.

## Running the backend locally

Prerequisites: Java 17, Maven, a running PostgreSQL instance, and RabbitMQ if you want notifications to actually get processed (without it the API still works, notifications just stay PENDING/RETRYING forever).

Easiest way to get RabbitMQ running locally is Docker:
```
docker run -d --name notification-rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```
Management UI is at http://localhost:15672 (guest/guest).

1. Create a database:
   ```sql
   CREATE DATABASE notification_db;
   ```
2. The app reads DB and RabbitMQ credentials from environment variables, falling back to local defaults if unset (see `application.yml`):
   - `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` (defaults assume `postgres`/local Postgres on 5432)
   - `RABBITMQ_HOST`, `RABBITMQ_PORT`, `RABBITMQ_USERNAME`, `RABBITMQ_PASSWORD`, `RABBITMQ_VHOST` (defaults assume a local broker with guest/guest)
   - `SERVER_PORT` (defaults to 8080)

   Set these to match your local setup, or export them before running.
3. From `notification-backend/`:
   ```
   mvn spring-boot:run
   ```
   Flyway runs automatically on startup and creates the schema.

## Running the frontend locally

Prerequisites: Node 18+, and the backend already running (the frontend has nothing to show without it).

From `notification-frontend/`:
```
npm install
npm run dev
```
Opens on http://localhost:5173. It calls the backend at `http://localhost:8080/api` by default - override with a `VITE_API_BASE_URL` env var if your backend runs somewhere else.

The backend needs CORS enabled for whatever origin the frontend runs on. It already is by default - `application.yml`'s `CORS_ALLOWED_ORIGIN` defaults to `http://localhost:5173`. If you run the frontend on a different port, update that env var to match, or the browser will block every request.

## API

Base path is `/api`.

**POST /api/notifications** - create a notification.
```json
{ "userId": 101, "type": "EMAIL", "message": "Welcome User", "scheduleTime": "2026-05-28T10:00:00" }
```
`type` is EMAIL, SMS, or PUSH. `scheduleTime` is optional. Returns 201 with the notification at status PENDING. Returns 409 if the same user already created the same type + message combination in the last 5 minutes, 400 if a word in the message repeats more than 3 times, and 400 for missing/invalid fields.

**GET /api/notifications** - paginated list, newest first. Optional query params `status` and `type` filter the results, plus the standard `page`/`size`/`sort` params.

**POST /api/notifications/{id}/retry** - retry a failed notification. Only allowed when status is FAILED, retryCount is under 3, and the last retry was more than 2 minutes ago. Returns 409 with a message naming whichever condition failed, or 404 if the id doesn't exist.

**GET /api/dashboard** - total notifications, sent count, failed count, count currently retrying, and a breakdown by type.

Every error response has the same shape: timestamp, status, error, message, path, and a fieldErrors map when it's a validation failure.

## Database schema

One table so far, `notifications`, created by `V1__create_notifications_table.sql`:

| Column | Type | Notes |
|---|---|---|
| id | BIGSERIAL | primary key |
| user_id | BIGINT | who the notification belongs to, no FK - there's no user/auth table in this system |
| type | VARCHAR(20) | EMAIL / SMS / PUSH, enforced with a CHECK constraint |
| message | TEXT | notification body |
| status | VARCHAR(20) | PENDING / SENT / FAILED / RETRYING, defaults to PENDING, also CHECK-constrained |
| schedule_time | TIMESTAMP | optional, when the notification should be sent |
| retry_count | INTEGER | defaults to 0, capped at 3 by application logic |
| last_retry_time | TIMESTAMP | set when a retry is attempted, used to enforce the 2-minute retry cooldown |
| created_at | TIMESTAMP | set by Hibernate on insert |

Indexes on `user_id`, `status`, `type`, and `created_at` since those are the columns the listing/filtering and dashboard endpoints will query on.

## Assumptions

I didn't add a users table or any auth. Nothing in the requirements asks for login/registration, so `user_id` is just whatever ID the client sends - no FK, no lookup against a real user record.

`schedule_time` is nullable. Not every notification needs to be scheduled ahead of time and the spec doesn't say it's mandatory, so I left it optional instead of forcing a value.

Messages are stored as `TEXT` with no length cap at the DB level. The "same word repeated more than 3 times" rule is something I'll check in code when a notification is created, not something the database should be enforcing.

Retry rules (max 3 attempts, 2 minute cooldown) also live in the service layer, not the DB. `retry_count` and `last_retry_time` just hold the data the service needs to make that call.

The dashboard's "retry count" is the number of notifications currently sitting in RETRYING status, not a running total of every retry attempt ever made. The other three dashboard numbers (total, sent, failed) are all status counts, so this reading keeps all four consistent with each other - four numbers, four mutually exclusive statuses.

The repeated-word check on messages is a plain check in the service, not a Bean Validation annotation, even though it doesn't touch the database and could have gone either way. The other two rules (duplicate check, retry eligibility) both need to query existing data so they have to live in the service regardless - keeping all three business rules in the same place felt more consistent than pulling this one out just because it happens to be stateless.

`scheduleTime` is currently accepted, stored, and shown in the UI, but doesn't actually delay anything - a notification is published to the queue and processed immediately no matter what `scheduleTime` says. The brief only shows it as a field in the sample payload with no stated rule for how it should behave, so for now it's plain metadata rather than a guess at a scheduling design that wasn't asked for. The frontend does stop you from picking a past date/time for it, at least.

CORS had to be added to the backend once the frontend existed. A browser blocks cross-origin requests by default, and the frontend (port 5173) and backend (port 8080) count as different origins even though both run on localhost - `curl` never caught this during backend-only testing since it doesn't enforce that policy. The allowed origin is configurable via `CORS_ALLOWED_ORIGIN`.
