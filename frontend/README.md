# Frontend Architecture & Documentation

## Overview

The frontend is a modern, Single Page Application (SPA) built with **React 19** and **Vite**. It implements a real-time task-collaboration platform, featuring drag-and-drop task management, live updates via WebSockets, and a responsive UI styled with **Tailwind CSS**.

## Technology Stack

- **Core**: React 19, TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS, Lucide React (Icons)
- **State Management**: Zustand
- **Routing**: React Router DOM v7
- **Drag & Drop**: @dnd-kit/core, @dnd-kit/sortable
- **Network**: Axios (REST), Socket.io-client (WebSockets)
- **Quality Assurance**: ESLint, TypeScript-ESLint

## Architecture

The application follows a modular architecture separating views, state management, and side effects (API/Sockets).

### High-Level Architecture Diagram

![Frontend Architecture](./src/assets/Frontend_Architecture.png)

### Key Architectural Patterns

1.  **Centralized State Management (Zustand)**
    *   Stores `(src/store)` are the single source of truth.
    *   Actions (fetch, create, update) are defined within the store, keeping components clean.
    *   **Optimistic UI Updates**: The store updates the local state immediately for better perceived performance, rolling back if the API call fails.

2.  **Real-Time Event Driven**
    *   The `BoardStore` listens for socket events (`task:moved`, `list:created`, etc.).
    *   When an event is received, the store automatically updates its state, ensuring all connected clients see changes instantly without refreshing.

3.  **Component-Based Drag & Drop**
    *   `@dnd-kit` manages the complex drag interactions.
    *   **Sensors** detect pointer and keyboard inputs.
    *   **Collision Detection** (`closestCorners`) determines where an item is dropped.
    *   The `BoardPage` handles the `onDragEnd` event to calculate the new position and trigger the `moveTask` action in the store.

4.  **Service Abstraction**
    *   `api.ts`: Configures Axios with interceptors for JWT token handling.
    *   `socket.ts`: Manages the Socket.io connection lifecycle.

## Directory Structure

```
frontend/
├── src/
│   ├── assets/         # Static assets
│   ├── components/     # Reusable UI components (modals, cards, lists)
│   ├── hooks/          # Custom React hooks (useSocket)
│   ├── pages/          # Route components (LoginPage, SignupPage, BoardPage, DashboardPage)
│   ├── services/       # API and Socket configuration
│   ├── store/          # Zustand state stores
│   ├── App.tsx         # Main routing configuration
│   └── main.tsx        # Entry point
├── index.html
├── package.json
├── tailwind.config.ts  # Tailwind configuration
└── vite.config.ts      # Vite configuration
```

## Setup & Running

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Environment Variables**
    Create a `.env` file to configure the backend URL
    ```
    VITE_API_URL=http://localhost:3001
    ```

3.  **Development Server**
    ```bash
    npm run dev
    ```

4.  **Build for Production**
    ```bash
    npm run build
    ```

## Key Features Implementation

### Drag and Drop Logic
Located in `src/pages/BoardPage.tsx`, the drag-and-drop system uses `onDragEnd` to determine:
1.  **Source Container**: Where the task started.
2.  **Destination Container**: Where the task ended.
3.  **New Index**: The specific position within the new list.
4.  It then calls `moveTask` in `boardStore.ts` which performs an optimistic update locally and sends a request to the backend.

### Real-Time Updates
The `useSocketBoard` hook initializes the connection. `BoardStore` contains handlers like `handleTaskMoved` which:
1.  Receives the updated task payload.
2.  Removes the task from its old list.
3.  Inserts it into the new list at the correct position.
4.  Updates the state, triggering a re-render.
