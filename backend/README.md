# Backend Architecture & Documentation

## Overview

The backend is a Node.js and Express application designed to power a real-time task-collaboration platform. It leverages **TypeScript** for type safety, **Prisma** for ORM-based database interactions, and **Socket.io** for low-latency, bidirectional communication. The system is architected to handle concurrent user collaborations, ensuring data consistency and real-time synchronization across clients.

## Technology Stack

-   **Runtime**: Node.js
-   **Framework**: Express.js
-   **Language**: TypeScript
-   **Database**: PostgreSQL
-   **ORM**: Prisma
-   **Real-time Engine**: Socket.io
-   **Authentication**: JWT (JSON Web Tokens) with Bcrypt for hashing
-   **Validation**: Zod
-   **Testing**: Jest, Supertest

## System Architecture

The application adopts a **Layered Architecture** pattern, enforcing separation of concerns and maintainability.

### Detailed Architecture Diagram

![Backend Architecture](./src/img/Backend_Architecture.png)

    
   

## Core Components & Data Flow

### 1. Request Processing Pipeline
Incoming HTTP requests pass through a standardized middleware chain:
-   **CORS**: Handles cross-origin resource sharing headers.
-   **Authentication (`authMiddleware`)**: Verifies JWT tokens attached to the `Authorization` header. Decodes the payload to inject `userId` into the request object.
-   **Validation (`validate`)**: Intercepts requests and validates `body`, `query`, or `params` against strictly typed **Zod** schemas. If validation fails, it triggers a 400 Bad Request immediately.
-   **Controller Execution**: Business logic is executed. Database operations are performed via Prisma.
-   **Error Handling**: A centralized error handler captures synchronous and asynchronous errors, formatting them into standardized JSON responses.


### 2. Database Schema & Relationships (Prisma)
The database model is relational, designed for integrity and cascading deletes.

#### Entity Relationship Diagram (ERD)

![Database Architecture](./src/img/Database_Architecture.png)


#### Core Entities
-   **User**: Central entity managing authentication and profile data.
-   **Board**: The main container for tasks. Owned by a creator, but can have multiple members.
-   **BoardMember**: Junction table handling many-to-many relationship between `User` and `Board` with role-based access control (e.g., `owner`, `member`, `observer`).
-   **List**: Vertical columns within a board (e.g., "To Do", "In Progress"). Maintained in a specific order via the `position` field.
-   **Task**: The atomic unit of work. Contains details like priority, due date, and description.
-   **TaskAssignee**: Junction table for assigning multiple users to a single task.
-   **Activity**: A polymorphic-style audit log that tracks actions (Create, Update, Delete, Move) across the system for historical data and activity feeds.

### 3. Real-Time Synchronization Strategy
Real-time features are decoupled from the core business logic but triggered by it.
-   **Connection**: Clients establish a WebSocket connection authenticated via a JWT in the handshake.
-   **Room Subscription**: Clients emit `join-board` to subscribe to a specific board's updates (`board:{id}`).
-   **Event Broadcasting**: When a controller modifies state (e.g., `moveTask`), it does not directly emit to the socket. Instead, the frontend relies on successful API responses to optimistically update locally, while *other* clients receive updates via broadcasted events (implemented in `emitBoardEvent` utility). *Note: In the current implementation, the frontend refetches or updates based on local optimistic logic, while the backend infrastructure supports event emission for scalability.*

## Directory Structure

```
backend/
├── prisma/
│   └── schema.prisma       # Database schema definition
├── src/
│   ├── controllers/        # Request handlers (Business Logic)
│   ├── middleware/         # Auth, Validation, Error handling
│   ├── routes/             # API Route definitions
│   ├── services/           # Reusable services (Activity Logger)
│   ├── sockets/            # Socket.io setup and event handling
│   ├── utils/              # Helper functions (Prisma client, AppError)
│   ├── app.ts              # Express application setup
│   └── index.ts            # Server entry point
├── tests/                  # Jest test suites
├── docker-compose.yml      # Container orchestration
└── package.json
```

## Setup & Development

### Prerequisites
-   Node.js v18+
-   PostgreSQL v14+
-   npm

### Local Installation
1.  **Install Dependencies**:
    ```bash
    cd backend
    npm install
    ```
2.  **Environment Configuration**:
    Create `.env` based on `.env_example`:
    ```env
    PORT=3001
    DATABASE_URL="postgresql://user:password@localhost:5432/hintro_db"
    JWT_SECRET="your_secret_key"
    CLIENT_URL="http://localhost:5173"
    ```
3.  **Database Setup**:
    - Start Database from project root: (Ensure Docker Daemon is running before running that command)
      ```bash
      cd ..
      docker-compose up -d
      ```
    - Verify Database is running:
      ```bash
      docker ps
      ```
    - Navigate to backend and run migrations:
      ```bash
      npx prisma migrate dev 
      ```
    - If migrations are already applied:
      ```bash
      npx prisma db push
      ```

4.  **Run Development Server**:
    ```bash
    npm run dev
    ```

## Testing
The project uses **Jest** for testing.
-   **Unit Tests**: Mocking dependencies to test controller logic in isolation.
-   **Running Tests**:
    ```bash
    npm test
    ```
-   **Check Test Coverage**:
    ```bash
    npm test:coverage
    ```
