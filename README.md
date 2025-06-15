# TaskFlow API - Senior Backend Engineer Coding Challenge

## Introduction

Welcome to the TaskFlow API coding challenge! This project is designed to evaluate the skills of experienced backend engineers in identifying and solving complex architectural problems using our technology stack.

The TaskFlow API is a task management system with significant scalability, performance, and security challenges that need to be addressed. The codebase contains intentional anti-patterns and inefficiencies that require thoughtful refactoring and architectural improvements.

## Tech Stack

- **Language**: TypeScript
- **Framework**: NestJS
- **ORM**: TypeORM with PostgreSQL
- **Queue System**: BullMQ with Redis
- **API Style**: REST with JSON
- **Package Manager**: Bun
- **Testing**: Bun test

## Getting Started

### Prerequisites

- Node.js (v16+)
- Bun (latest version)
- PostgreSQL
- Redis

### Setup Instructions

1. Clone this repository
2. Install dependencies:
   ```bash
   bun install
   ```
3. Configure environment variables by copying `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   # Update the .env file with your database and Redis connection details
   ```
4. Database Setup:
   
   Ensure your PostgreSQL database is running, then create a database:
   ```bash
   # Using psql
   psql -U postgres
   CREATE DATABASE taskflow;
   \q
   
   # Or using createdb
   createdb -U postgres taskflow
   ```
   
   Build the TypeScript files to ensure the migrations can be run:
   ```bash
   bun run build
   ```

5. Run database migrations:
   ```bash
   # Option 1: Standard migration (if "No migrations are pending" but tables aren't created)
   bun run migration:run
   
   # Option 2: Force table creation with our custom script
   bun run migration:custom
   ```
   
   Our custom migration script will:
   - Try to run formal migrations first
   - If no migrations are executed, it will directly create the necessary tables
   - It provides detailed logging to help troubleshoot database setup issues

6. Seed the database with initial data:
   ```bash
   bun run seed
   ```
   
7. Start the development server:
   ```bash
   bun run start:dev
   ```

### Troubleshooting Database Issues

If you continue to have issues with database connections:

1. Check that PostgreSQL is properly installed and running:
   ```bash
   # On Linux/Mac
   systemctl status postgresql
   # or
   pg_isready
   
   # On Windows
   sc query postgresql
   ```

2. Verify your database credentials by connecting manually:
   ```bash
   psql -h localhost -U postgres -d taskflow
   ```

3. If needed, manually create the schema from the migration files:
   - Look at the SQL in `src/database/migrations/`
   - Execute the SQL manually in your database

### Default Users

The seeded database includes two users:

1. Admin User:
   - Email: admin@example.com
   - Password: admin123
   - Role: admin

2. Regular User:
   - Email: user@example.com
   - Password: user123
   - Role: user

# TaskFlow API

A robust, scalable, and production-ready **Task Management System** built with [NestJS](https://nestjs.com/), supporting advanced features like distributed caching, rate limiting, background processing, and comprehensive logging.

---

## 🚀 **Key Features & Improvements**

### 1. **Configuration & Environment Management**
- Uses `@nestjs/config` for centralized, environment-based configuration.
- Supports custom config loading (e.g., `jwtConfig`).
- **Validation schema** recommended for environment variables.

### 2. **Database Integration**
- Async `TypeOrmModule` setup with environment-driven config.
- Proper type safety for ports and credentials.
- `synchronize` and `logging` enabled only in development for safety.

### 3. **Caching**
- Migrated from inefficient in-memory cache to **NestJS CacheModule** with Redis.
- Supports TTL, namespacing, serialization, and distributed cache.
- Sample `CacheService` provided for easy cache operations.

### 4. **Queueing & Background Processing**
- Uses `@nestjs/bullmq` for distributed job queues (backed by Redis).
- Implements robust background workers for overdue task processing.
- Supports batch queueing and error handling.

### 5. **Scheduling**
- Uses `@nestjs/schedule` for cron jobs (e.g., hourly overdue task checks).

### 6. **Rate Limiting**
- Global and per-route rate limiting with `@nestjs/throttler`.
- Custom decorator and guard pattern for flexible rate limits.
- Redis-backed implementation for distributed enforcement.

### 7. **Validation & Security**
- Global `ValidationPipe` with `whitelist`, `forbidNonWhitelisted`, and transformation.
- Uses `helmet` for HTTP security headers.
- CORS enabled.
- JWT-based authentication and role-based authorization.
- Input validation with DTOs and `class-validator`.

### 8. **Logging & Observability**
- Comprehensive `LoggingInterceptor` using built-in NestJS `Logger`.
- Logs requests, responses, errors, user IDs, IPs, and redacts sensitive info.
- Ready for integration with external logging solutions (e.g., Winston, ELK).

### 9. **API Documentation**
- Swagger (`@nestjs/swagger`) auto-generates interactive API docs.
- Includes Bearer Auth, contact, and license info.

### 10. **App Structure & Modularity**
- Feature modules: `UsersModule`, `TasksModule`, `AuthModule`, etc.
- Clear separation of concerns and dependency injection.
- Supports global interceptors, guards, and providers.

---

## 🛠️ **Setup & Usage Guide**

### **1. Clone & Install**

```bash
git clone https://github.com/your-org/taskflow-api.git
cd taskflow-api
npm install
```

### **2. Configure Environment**

Copy `.env.example` to `.env` and fill in your values:

```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=yourpassword
DB_DATABASE=taskflow
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your_jwt_secret
```

### **3. Run the Application**

```bash
npm run start:dev
```

### **4. Access API & Docs**

- API: [http://localhost:3000/api/v1](http://localhost:3000/api/v1)
- Swagger UI: [http://localhost:3000/api](http://localhost:3000/api)

---

## 📚 **Project Structure**

```
src/
  modules/
    users/
    tasks/
    auth/
  queues/
    task-processor/
    scheduled-tasks/
  common/
    services/
      cache.service.ts
    interceptors/
      logging.interceptor.ts
  app.module.ts
  main.ts
```

---

## 📝 **Major Improvements (Summary Table)**

| Area             | Before (Problems)                                   | After (Improvements)                                                                 |
|------------------|-----------------------------------------------------|--------------------------------------------------------------------------------------|
| Caching          | In-memory, not distributed, memory leaks            | Redis-backed, TTL, namespacing, scalable via CacheModule                             |
| Rate Limiting    | Inefficient, in-memory, not per-route, not scalable | Decorator + Guard, Redis-backed, per-route config, no memory leaks                   |
| Logging          | Basic, no context, logs sensitive data              | Interceptor logs requests/responses, redacts sensitive info, includes user context    |
| Validation       | Not enforced globally                               | Global ValidationPipe, DTOs, class-validator                                         |
| Queueing         | None or basic, no error handling                    | BullMQ with batch processing, error handling, retries, distributed                   |
| Scheduling       | None or basic                                       | Cron jobs with ScheduleModule, robust overdue task processing                        |
| Security         | Minimal                                             | Helmet, CORS, JWT auth, role-based guards                                            |
| Documentation    | None or minimal                                     | Swagger with Bearer Auth, contact/license, DTO docs                                  |
| Modularization   | Not modular                                         | Feature modules, dependency injection, scalable structure                            |

---

## 🧑‍💻 **Developer Guide**

### **Caching Example**

```typescript
// Inject and use CacheService
constructor(private readonly cacheService: CacheService) {}

await this.cacheService.set('myKey', myValue, 120); // TTL 2 minutes
const value = await this.cacheService.get('myKey');
```

### **Rate Limiting Example**

```typescript
@UseGuards(RateLimitGuard)
@RateLimit({ limit: 10, windowMs: 60000 })
@Get('tasks')
getTasks() { ... }
```

### **Logging Example**

- All requests/responses/errors are logged with context.
- Sensitive fields (password, token) are redacted automatically.

### **Swagger**

- Visit `/api` for interactive docs.
- Use the "Authorize" button for JWT-protected routes.

---

## ⚠️ **Production Recommendations**

- Always use Redis for cache and rate limiting in production.
- Never enable TypeORM `synchronize` in production.
- Use environment variable validation for safety.
- Integrate with external logging/monitoring as needed.

---

## 📖 **References**

- [NestJS Docs](https://docs.nestjs.com/)
- [NestJS Caching](https://docs.nestjs.com/techniques/caching)
- [NestJS BullMQ](https://docs.nestjs.com/techniques/queues)
- [NestJS Swagger](https://docs.nestjs.com/openapi/introduction)

---

## 👏 **Contributing**

Pull requests and issues are welcome! Please follow the code style and add tests for new features.

---

**TaskFlow API is designed for reliability, scalability, and clarity.  
For questions or improvements, open an issue or contact the maintainers.**