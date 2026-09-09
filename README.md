# CollabBoard — Real-Time Project Collaboration for Interns

A full-stack Kanban project board that lets interns collaborate on shared
projects in real time.

## Features

- **Kanban board** (React) — drag & drop tasks across To Do / In Progress /
  Review / Done columns, search, and filter by milestone or priority.
- **Live sync** — Socket.IO broadcasts task, milestone, comment, and activity
  changes to every connected client instantly.
- **Milestones** — create milestones with target dates and track completion
  progress (percentage and done/total counts). Click a milestone to filter the board.
- **Task priorities & due dates** — set urgency (Urgent / High / Medium / Low)
  with color badges, per-task due dates, and automatic overdue highlighting.
- **Comments** — discuss tasks inline; everyone sees new comments live.
- **Live activity feed** — a real-time log of every action: created, moved,
  commented, milestones added/removed, etc.
- **Named presence & typing indicator** — enter your name on join, see exactly
  who is online, and when someone is typing in a task's comment box.
- **Task sharing** — assign tasks to team members, link tasks to milestones,
  update or delete tasks collaboratively.

## Tech Stack

- **Frontend:** React 18 + Vite, socket.io-client
- **Backend:** Node.js + Express, Socket.IO
- **Storage:** JSON file (in-memory with persistence to `server/data/db.json`)

## Getting Started

### 1. Install dependencies

```bash
cd server
npm install

cd ../client
npm install
```

### 2. Run the backend

```bash
cd server
npm run dev
```

Starts at http://localhost:4000.

### 3. Run the frontend

```bash
cd client
npm run dev
```

Starts at http://localhost:5173. Open it in two browser windows/tabs and
watch changes sync live.

## API Overview

| Method | Endpoint                       | Description                                    |
| ------ | ------------------------------ | ---------------------------------------------- |
| GET    | `/api/tasks`                   | List tasks (filter by `status`, `assignee`, `milestoneId`, `priority`) |
| POST   | `/api/tasks`                   | Create a task                                  |
| PATCH  | `/api/tasks/:id`               | Update task fields (title, description, status, assignee, milestoneId, priority, dueDate, actor) |
| DELETE | `/api/tasks/:id`               | Delete a task                                  |
| POST   | `/api/tasks/:id/comments`      | Add a comment `{ author, text }`               |
| DELETE | `/api/tasks/:id/comments/:cid` | Delete a comment                               |
| GET    | `/api/milestones`              | List milestones + completion stats             |
| POST   | `/api/milestones`              | Create a milestone                             |
| PATCH  | `/api/milestones/:id`          | Update a milestone                             |
| DELETE | `/api/milestones/:id`          | Delete a milestone                             |
| GET    | `/api/activity`                | Recent activity log (`?limit=100`)             |
| GET    | `/api/health`                  | Health check                                   |

## Socket Events

| Event               | Direction  | Payload                                  | Purpose                          |
| ------------------- | ---------- | ---------------------------------------- | -------------------------------- |
| `board:snapshot`    | server → client | Initial tasks + milestones         | Initial load                      |
| `tasks:update`      | server → client | Full tasks array                   | Task changes                      |
| `milestones:update` | server → client | Full milestones array              | Milestone changes                 |
| `activity:add`      | server → client | One activity entry                 | Live activity feed                |
| `presence:update`   | server → client | `{ names, count }`                  | Who's online                      |
| `typing`            | server → client | `{ name, taskId, typing }`          | Comment typing indicator          |
| `presence:join`     | client → server | `{ name }`                          | Announce yourself                 |
| `task:move`         | client → server | `{ id, status, actor }`             | Drag-and-drop task moves          |
| `typing:start` / `typing:stop` | client → server | `{ name, taskId }` | Typing heartbeat                  |

## Project Structure

```
├── server/
│   └── src/
│       ├── index.js            # Express + Socket.IO entry
│       ├── store.js            # JSON persistence + seed data
│       └── routes/
│           ├── tasks.js
│           ├── milestones.js
│           └── activity.js
└── client/
    └── src/
        ├── App.jsx             # State, socket wiring
        ├── api.js              # REST helpers
        ├── useSocket.js        # Socket.IO hook
        ├── index.css
        └── components/         # Board, Column, TaskCard, ActivityFeed,
                                # NameModal, MilestoneBar, TaskModal, MilestoneModal
```