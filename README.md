# Real-Time Task Collaboration Platform

The application that allows users to create boards, lists, tasks, assign members, and see real-time
updates.

## Features

-   **User Authentication**: Secure signup and login functionality.
-   **Board Management**: Create, update, and delete boards.
-   **List & Task Management**: Organize tasks into lists with full CRUD capabilities.
-   **Drag & Drop**: Intuitive drag-and-drop interface for moving tasks between lists and reordering them.
-   **Real-time Collaboration**: Instant updates for all connected users via WebSockets.
-   **Task Assignment**: Assign tasks to specific board members.
-   **Activity History**: Track changes and actions within a board.
-   **Responsive Design**: optimized for various screen sizes.

## Tech Stack

### Frontend
-   **Framework**: React (Vite)
-   **State Management**: Zustand
-   **Styling**: TailwindCSS
-   **Drag & Drop**: @dnd-kit/core, @dnd-kit/sortable
-   **HTTP Client**: Axios
-   **Real-time**: Socket.io-client

### Backend
-   **Runtime**: Node.js
-   **Framework**: Express.js
-   **Database**: PostgreSQL
-   **ORM**: Prisma
-   **Real-time**: Socket.io
-   **Authentication**: JWT (JSON Web Tokens)
-   **Validation**: Zod

## Prerequisites

-   **Node.js** (v18 or higher)
-   **PostgreSQL** (running locally or via Docker)
-   **Docker Desktop** (optional, recommended for running the database)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/RituGupta23/Hintro-Assessment.git
```

### 2. Database Setup

You can run PostgreSQL using Docker Compose:

```bash
docker-compose up -d
```
This will start a PostgreSQL container on port 5432 with default credentials (`postgres`/`postgres`) and a database named `hintro-db`.

### 3. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Configure environment variables:

```bash
touch .env

PORT=3001
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hintro_db"
JWT_SECRET="your_secret_key"
CLIENT_URL="http://localhost:5173"
```

Run database migrations:

```bash
npx prisma migrate dev
```
Start the development server:

```bash
npm run dev
```
The backend server will start on `http://localhost:3001`.

### 4. Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Configure environment variables:

```bash
touch .env

VITE_API_URL="http://localhost:3001/api"
VITE_SOCKET_URL="http://localhost:3001"
```

Start the development server:

```bash
npm run dev
```
The frontend application will be available at `http://localhost:5173`.

## Architecture Overview

### Frontend

![Frontend Architecture](./frontend/src/assets/Frontend_Architecture.png)

For more details check: [Frontend Architecture](./frontend/README.md)

### Backend

![Backend Architecture](./backend/src/img/Backend_Architecture.png)

For more details check: [Backend Architecture](./backend/README.md)

## Database Schema

Below is a high-level overview of the database schema:

![Database Schema](./backend/src/img/Database_Architecture.png)

*   **User**: Stores authentication details.
*   **Board**: Top-level container for tasks.
*   **List**: Columns within a board.
*   **Task**: Individual items to be tracked.
*   **BoardMember**: Junction table for User-Board relationship.
*   **Activity**: Audit log for actions performed on the board.

## API Documentation
 
### **[View Full API Design Document](./backend/API_Design.md)** for detailed request/response examples.
### Auth
-   `POST /api/auth/signup`: Register a new user.
-   `POST /api/auth/login`: Login and receive JWT.
-   `GET /api/auth/me`: Get current user info.


### Boards
-   `GET /api/boards`: List all boards for the user.
-   `POST /api/boards`: Create a new board.
-   `GET /api/boards/:id`: Get details of a specific board.
-   `POST /api/boards/:id/members`: Add a member to the board.

### Lists
-   `POST /api/boards/:boardId/lists`: Create a list.
-   `PUT /api/lists/:id`: Update a list.
-   `DELETE /api/lists/:id`: Delete a list.

### Tasks
-   `POST /api/lists/:listId/tasks`: Create a task.
-   `PUT /api/tasks/:id`: Update task details.
-   `PUT /api/tasks/:id/move`: Move task to a different list or position.
-   `POST /api/tasks/:id/assign`: Assign user to task.



## Real-time Strategy

We use **Socket.io** to enable instant collaboration. The system follows a **Hybrid REST + WebSocket** pattern where actions are performed via REST APIs, and updates are propagated via WebSockets.

### 1. Connection & Authentication
-   **Handshake**: When the application loads, a Socket.io connection is established.
-   **Auth**: The client sends the JWT token in the `auth` payload during the handshake.
-   **Verification**: The backend middleware validates the token. If invalid, the connection is rejected.

### 2. Room-Based Channeling
To ensure users only receive updates for boards they are currently viewing, we use **Socket Rooms**.
-   **Join Room**: When a user navigates to `/board/:id`, the frontend emits `join-board`. The server adds the socket to a specific room: `board:${boardId}`.
-   **Leave Room**: When navigating away, `leave-board` is emitted to prevent unnecessary traffic.

### 3. Event Propagation Flow
Actions (e.g., Moving a Task) follow this strict flow:
1.  **Client Action**: User drags a task. Frontend Optimistically updates the UI.
2.  **API Request**: Frontend sends `PUT /api/tasks/:id/move` to the backend.
3.  **Database Update**: Controller updates PostgreSQL via Prisma.
4.  **Broadcast**: Upon success, the controller calls `emitBoardEvent(boardId, 'task:moved', data)`.
5.  **Client Update**: All *other* clients in the room receive the event and update their Zustand store.

### 4. Supported Events
| Event Name | Payload | Description |
| :--- | :--- | :--- |
| `task:created` | `{ task, boardId }` | A new task was added. |
| `task:updated` | `{ task, boardId }` | Task details (title, desc) changed. |
| `task:moved` | `{ task, boardId }` | Task position or list changed. |
| `task:deleted` | `{ taskId, listId }` | A task was removed. |
| `list:created` | `{ list, boardId }` | A new list was added. |
| `list:deleted` | `{ listId, boardId }` | A list was removed. |


## Scalability & Trade-offs

-   **Scalability**:
    -   **Socket.io Redis Adapter**: For scaling to multiple server instances, we would need to introduce a Redis adapter to pass messages between socket servers.
    -   **Database**: Indexing is used on foreign keys (e.g., `boardId`, `listId`) to ensure fast lookups as data grows.
    -   **Horizontal Scaling**: The stateless REST API can be easily horizontally scaled behind a load balancer.

-   **Trade-offs**:
    -   **REST vs GraphQL**: REST was chosen for simplicity and speed of implementation given the timeframe. GraphQL would offer more flexible data fetching for the complex board structure.
    -   **Long Polling fallback**: Socket.io automatically falls back to HTTP long-polling if WebSockets are unavailable, ensuring robust connectivity.

## Demo Credentials

To test the application, you can register and use the following demo accounts.

| User Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Primary User** | Demo User 1 | `demo@hintro.com` | `demo1234` |
| **Collaborator A** | Demo User 2 | `demo2@hintro.com` | `demo1234` |
| **Collaborator B** | Demo User 3 | `demo3@hintro.com` | `demo1234` |
| **Collaborator C** | Demo User 4 | `demo4@hintro.com` | `demo1234` |

### How to Test Real-Time Collaboration
1.  Open the application in **Browser A** and login as `demo@hintro.com`.
2.  Open a **New Incognito Window** (or a different browser) and login as `demo2@hintro.com`.
3.  Create a board with User 1 and add User 2 as a member.
4.  Try moving tasks, creating lists, or updating titles in one window, watch it update instantly in the other!

> **Note:** These credentials are suggested for consistency. You can register any email/password you prefer.
