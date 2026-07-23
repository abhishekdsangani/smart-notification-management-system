# Smart Notification Management System

A notification management system where notifications can be created, listed, retried on failure, and tracked through a dashboard. Backend is Spring Boot, frontend will be React (not started yet).

This README grows as the project grows - right now only the backend foundation and DB schema are in place, so that's what's documented below. More sections get added as each piece gets built.

## Tech stack

- Java 17, Spring Boot 3.3.4, Maven
- PostgreSQL, Spring Data JPA / Hibernate
- Flyway for schema migrations
- RabbitMQ for async notification processing (queue not wired up yet)
- Log4j2 for logging (Logback excluded)
- Lombok

## Running the backend locally

Prerequisites: Java 17, Maven, a running PostgreSQL instance. RabbitMQ isn't required yet since nothing publishes/consumes messages so far.

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
