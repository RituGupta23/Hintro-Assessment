# API Design

Base URL: \`http://localhost:3001/api\`

## Authentication

Authentication is handled via **Bearer Token**.
Include the token in the `Authorization` header for protected routes:
`Authorization: Bearer <your_jwt_token>`

## Error Response Format

All error responses follow this format:

```json
{
  "status": "error",
  "message": "Error description"
}
```

---

## 1. Authentication

### Signup
**POST** `/auth/signup`

**Body:**
```json
{
  "name": "name",
  "email": "name@example.com",
  "password": "password"
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "User created successfully",
  "data": {
    "newUser": {
      "id": "uuid",
      "name": "name",
      "email": "name@example.com",
      "avatar": null,
      "createdAt": "timestamp"
    },
    "token": "jwt_token"
  }
}
```

### Login
**POST** `/auth/login`

**Body:**
```json
{
  "email": "name@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "User logged in successfully",
  "data": {
    "user": {
      "id": "uuid",
      "name": "name Doe",
      "email": "name@example.com",
      "avatar": null
    },
    "token": "jwt_token"
  }
}
```

### Get Current User
**GET** `/auth/me`

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "User fetched successfully",
  "data": {
    "user": {
      "id": "uuid",
      "name": "name Doe",
      "email": "name@example.com",
      "avatar": null,
      "createdAt": "timestamp"
    }
  }
}
```

---

## 2. Boards

### Get All Boards
**GET** `/boards`

**Query Parameters:**
- `page` (optional, default 1)
- `limit` (optional, default 12)
- `search` (optional)

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "boards": [
      {
        "id": "uuid",
        "title": "Project Board",
        "description": "My project",
        "color": "#6366f1",
        "updatedAt": "timestamp",
        "members": [...],
        "_count": { "lists": 3 }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

### Get Single Board
**GET** `/boards/:id`

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "board": {
      "id": "uuid",
      "title": "Project Board",
      "lists": [
        {
          "id": "list_uuid",
          "title": "To Do",
          "tasks": [...]
        }
      ],
      "members": [...]
    }
  }
}
```

### Create Board
**POST** `/boards`

**Body:**
```json
{
  "title": "New Board",
  "description": "Optional description",
  "color": "#ff0000" // optional
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "data": {
    "board": { ... }
  }
}
```

### Update Board
**PUT** `/boards/:id`

**Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "color": "#00ff00"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "board": { ... }
  }
}
```

### Delete Board
**DELETE** `/boards/:id`

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Board deleted"
}
```

### Add Member
**POST** `/boards/:id/members`

**Body:**
```json
{
  "email": "jane@example.com"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "board": { ... } // returns updated board with new member
  }
}
```

---

## 3. Lists

### Create List
**POST** `/boards/:boardId/lists`

**Body:**
```json
{
  "title": "New List"
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "data": {
    "list": {
      "id": "uuid",
      "title": "New List",
      "position": 3,
      "boardId": "board_uuid",
      "tasks": []
    }
  }
}
```

### Update List
**PUT** `/lists/:id`

**Body:**
```json
{
  "title": "Updated List Title"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "list": { ... }
  }
}
```

### Delete List
**DELETE** `/lists/:id`

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "List deleted"
}
```

### Reorder Lists
**PUT** `/boards/:boardId/lists/reorder`

**Body:**
```json
{
  "lists": [
    { "id": "list_1", "position": 0 },
    { "id": "list_2", "position": 1 }
  ]
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Lists reordered"
}
```

---

## 4. Tasks

### Create Task
**POST** `/lists/:listId/tasks`

**Body:**
```json
{
  "title": "New Task",
  "description": "Task description",
  "priority": "medium", // low, medium, high
  "dueDate": "2023-12-31" // optional
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "data": {
    "task": { ... },
    "boardId": "board_uuid"
  }
}
```

### Update Task
**PUT** `/tasks/:id`

**Body:**
```json
{
  "title": "Updated Task",
  "priority": "high"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "task": { ... },
    "boardId": "board_uuid"
  }
}
```

### Delete Task
**DELETE** `/tasks/:id`

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Task deleted",
  "data": {
    "taskId": "task_uuid",
    "listId": "list_uuid",
    "boardId": "board_uuid"
  }
}
```

### Move Task
**PUT** `/tasks/:id/move`

**Body:**
```json
{
  "listId": "target_list_uuid",
  "position": 2
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "task": { ... },
    "boardId": "board_uuid"
  }
}
```

### Assign Task
**POST** `/tasks/:id/assign`

**Body:**
```json
{
  "userId": "user_uuid"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "task": { ... }, // includes updated assignees
    "boardId": "board_uuid"
  }
}
```

### Unassign Task
**DELETE** `/tasks/:id/assign/:userId`

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "task": { ... },
    "boardId": "board_uuid"
  }
}
```

### Search Tasks
**GET** `/boards/:boardId/tasks/search`

**Query Parameters:**
- `q`: search query string

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "tasks": [ ... ]
  }
}
```

---

## 5. Activities

### Get Board Activities
**GET** `/boards/:boardId/activities`

**Query Parameters:**
- `page`
- `limit`

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "activities": [
      {
        "id": "uuid",
        "action": "created",
        "details": "created task \"Fix Bug\"",
        "entityType": "task",
        "createdAt": "timestamp",
        "user": { ... }
      }
    ],
    "pagination": { ... }
  }
}
```
