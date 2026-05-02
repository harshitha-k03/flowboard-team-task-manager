# FlowBoard – Smart Team Task Manager

FlowBoard is a full-stack SaaS-style team task manager built for assignment submission and easy deployment. It includes authentication, role-based access control, live MongoDB data, analytics, smart deadline views, seeded demo users, and a clean white-and-blue enterprise UI.

Live URL: `https://your-flowboard-app-url`

GitHub Repo: `https://github.com/your-username/flowboard`

## Overview

FlowBoard helps teams manage projects, assign work, track progress, monitor deadlines, and review weekly productivity.

The app includes:

- Admin and Member roles
- JWT auth with persisted login
- Project and task CRUD
- Smart dashboard metrics
- Weekly productivity analytics
- Smart deadline tracking
- Notification center for deadline alerts, comments, assignments, and status updates
- Member availability and workload balancing
- Demo data loader for interview walkthroughs
- Rule-based AI task assistant on task details
- Floating Ask AI chatbot that summarizes live tasks, deadlines, project health, and team workload
- Seeded demo data for quick evaluation

## Features

### Auth and RBAC

- Signup, login, and `GET /api/auth/me`
- Google sign-in with verified Google ID tokens
- Password hashing with `bcrypt`
- JWT session auth
- Role-based route protection
- Admin-only pages for Team, Analytics, and Deadlines

### Admin capabilities

- Create, edit, and delete projects
- Add project members
- Create, edit, delete, and assign tasks
- View full dashboard, team, analytics, and deadline data
- Use deadline quick actions: reschedule, remind team, mark done

### Member capabilities

- View assigned projects
- View assigned tasks only
- Update task status
- Add task comments
- Use My Tasks / Focus Mode

### Smart product features

- Weekly productivity formula:
  `completed tasks this week / total tasks this week * 100`
- Smart priority engine:
  - overdue and not done → `Critical`
  - due today or tomorrow → `High`
  - due within 3 days → `Medium`
  - otherwise → `Low`
- Smart reminders from live deadline data
- Rule-based AI task assistant on task details
- Floating Ask AI chatbot for simple workspace summaries and next-step guidance
- Notification center with searchable/filterable workspace alerts
- Project health scoring: `On Track`, `At Risk`, and `Delayed`
- Team workload labels: `Balanced`, `Overloaded`, and `Underutilized`
- Member availability: `Available`, `Busy`, and `On Leave`
- Admin demo data button that reloads a sample workspace and returns a fresh admin session
- Loading states and empty states across pages

## Tech Stack

### Frontend

- React + Vite
- TypeScript
- Tailwind CSS
- React Router DOM
- Axios
- Recharts
- Lucide React
- Zustand
- shadcn/ui primitives

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcrypt
- express-validator

## Folder Structure

```text
flowboard/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── store/
│   │   └── types/
│   ├── .env.example
│   └── package.json
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── seed.js
│   │   └── utils/
│   ├── tests/
│   ├── .env.example
│   └── package.json
└── README.md
```

## Main Pages

- `/login`
- `/signup`
- `/dashboard`
- `/projects`
- `/projects/:projectId`
- `/tasks`
- `/tasks/:taskId`
- `/my-tasks`
- `/notifications`
- `/team` admin only
- `/analytics` admin only
- `/deadlines` admin only

## Screenshots

Add final screenshots before submission:

- Login page
- Dashboard
- Projects
- Tasks
- Task details with AI assistant
- Team workload
- Analytics
- Smart deadlines
- Notifications
- Ask AI chatbot

## API Routes

### Auth

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `GET /api/auth/me`

### Projects

- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:id`
- `PUT /api/projects/:id`
- `DELETE /api/projects/:id`

### Tasks

- `GET /api/tasks`
- `POST /api/tasks`
- `GET /api/tasks/:id`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `PATCH /api/tasks/:id/status`
- `POST /api/tasks/:id/comments`

### Dashboard

- `GET /api/dashboard/stats`
- `GET /api/dashboard/activity`
- `GET /api/dashboard/reminders`

### Demo

- `POST /api/demo/load` admin only

### Team

- `GET /api/team`
- `GET /api/team/workload`

### Analytics

- `GET /api/analytics/weekly`
- `GET /api/analytics/productivity`

### Deadlines

- `GET /api/deadlines`

## Demo Seed Data

Run the seed script to create demo users, projects, tasks, comments, activity, and progress data.

```bash
cd server
npm run seed
```

### Demo credentials

- Admin
  - email: `admin@flowboard.com`
  - password: `123456`
- Member
  - email: `member@flowboard.com`
  - password: `123456`

### Seeded projects

- Website Redesign
- Mobile App Launch
- Marketing Campaign
- API Integration
- Customer Portal
- Q2 Product Roadmap

## Environment Variables

### Backend `server/.env`

```env
MONGO_URI=
JWT_SECRET=
PORT=
```

Recommended full example:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/flowboard
MONGO_MAX_POOL_SIZE=10
MONGO_MIN_POOL_SIZE=1
JWT_SECRET=replace-this-with-a-long-random-secret
JWT_EXPIRES_IN=7d
JWT_ISSUER=flowboard
JWT_AUDIENCE=flowboard-client
CLIENT_URL=http://localhost:5173
PUBLIC_SIGNUP_ENABLED=true
ADMIN_EMAILS=admin@flowboard.com
ALLOW_FIRST_ADMIN_BOOTSTRAP=true
AUTO_SEED_DEMO_USERS=true
REQUEST_BODY_LIMIT=10kb
GOOGLE_CLIENT_ID=
```

### Frontend `client/.env`

```env
VITE_API_URL=http://localhost:5000/api
VITE_API_TIMEOUT=15000
VITE_GOOGLE_CLIENT_ID=
```

For Google authentication, create a Web OAuth client in Google Cloud Console and use the same client ID for `GOOGLE_CLIENT_ID` on the backend and `VITE_GOOGLE_CLIENT_ID` on the frontend.

## Run Locally

### 1. Install dependencies

```bash
cd server
npm install

cd ../client
npm install
```

### 2. Start MongoDB

Use your local MongoDB instance or MongoDB Atlas.

### 3. Start the backend

```bash
cd server
npm run dev
```

### 4. Seed demo data

```bash
cd server
npm run seed
```

### 5. Start the frontend

```bash
cd client
npm run dev
```

### 6. Open the app

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:5000/api](http://localhost:5000/api)
- Health check: [http://localhost:5000/health](http://localhost:5000/health)

## Verification

Backend tests:

```bash
cd server
npm test
```

Frontend typecheck:

```bash
cd client
npm run typecheck
```

Frontend lint:

```bash
cd client
npm run lint
```

Frontend build:

```bash
cd client
npm run build
```

Recommended final local smoke test:

1. Run backend and frontend.
2. Login as `admin@flowboard.com` / `123456`.
3. Click **Load Demo Data** from Dashboard or Team.
4. Verify Dashboard, Projects, Tasks, Team, Analytics, Deadlines, Notifications, and Ask AI.
5. Logout and login as `member@flowboard.com` / `123456`.
6. Verify members only see assigned tasks/projects and cannot access admin pages.

## Railway Deployment

### Backend service

1. Create a Railway project.
2. Add a new service from the `server` folder.
3. Set the start command to `npm start`.
4. Add backend environment variables:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `PORT`
   - `CLIENT_URL`
   - `GOOGLE_CLIENT_ID`
   - optional JWT and signup settings from `server/.env.example`
5. Deploy the service.

### Frontend service

1. Add another Railway service from the `client` folder.
2. Set:
   - Build command: `npm run build`
   - Start command: `npm run start`
3. Add frontend environment variables:
   - `VITE_API_URL=https://your-backend-url.up.railway.app/api`
   - `VITE_API_TIMEOUT=15000`
   - `VITE_GOOGLE_CLIENT_ID=your-google-web-client-id`
4. Redeploy after setting the backend URL.

### Final deployment checklist

1. Deploy backend first.
2. Copy the backend public URL into the frontend `VITE_API_URL`.
3. Copy the frontend public URL into backend `CLIENT_URL`.
4. Seed production demo data only if your assignment requires it.
5. Test admin and member login after deploy.

## Submission Checklist

- Replace the Live URL placeholder with the deployed frontend URL.
- Replace the GitHub Repo placeholder with the real repository URL.
- Add screenshots to the README or assignment submission.
- Run `npm test` in `server`.
- Run `npm run typecheck`, `npm run lint`, and `npm run build` in `client`.
- Test demo credentials after deployment.
- Record a short 2-5 minute walkthrough using `DEMO_SCRIPT.md`.

## Notes

- Zustand is the only global state store used for auth/session data.
- The frontend is TypeScript-only.
- The backend includes validation, error handling, CORS configuration, and proper `PORT` usage.
- The client uses lazy-loaded routes and code-split bundles.
- Task attachments are supported through the live backend model.

## Demo Script

See [DEMO_SCRIPT.md](/Users/chittinaidu/Downloads/team-task-manager/DEMO_SCRIPT.md).
