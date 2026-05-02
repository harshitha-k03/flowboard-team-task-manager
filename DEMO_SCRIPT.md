# FlowBoard Demo Script

## Demo credentials

- Admin: `admin@flowboard.com` / `123456`
- Member: `member@flowboard.com` / `123456`

## 2-5 minute walkthrough

### 1. Start at login

Say:

“FlowBoard is a full-stack smart team task manager. This login page is connected to the real backend, and the demo buttons sign into seeded admin and member accounts.”

Show:

- `Login as Admin`
- `Login as Member`
- signup flow

### 2. Login as Admin

Say:

“Admin users get full project, task, analytics, team, and deadline access.”

Show:

- Dashboard stat cards
- weekly productivity chart
- project progress cards
- workload balance chart
- recent activity
- smart reminders

### 3. Open Projects

Say:

“Projects are fully backed by MongoDB. Admins can create, edit, delete, and manage members.”

Show:

- search and status filter
- Create Project modal
- project progress bars
- member avatars
- project detail tabs: Overview, Tasks, Team, Activity

### 4. Open Tasks

Say:

“Tasks support smart filters, comments, attachments, subtasks, status updates, and assignment control.”

Show:

- task filters for status, priority, due date, project, and assignee
- New Task modal
- Task Details page
- AI Task Assistant panel
- comments section
- update status buttons
- mark done action

### 5. Open Notifications and Ask AI

Say:

“Notifications and the Ask AI assistant are built from live workspace data. They help the team understand what needs attention without manually checking every page.”

Show:

- Notifications page
- deadline alerts
- comment and activity notifications
- floating Ask AI button
- ask: `Summarize my work`
- ask: `Today focus`
- ask: `Overdue risks`

### 6. Open Team, Analytics, and Deadlines

Say:

“Admin users also get deeper operations views.”

Show:

- Team page with member table and workload chart
- availability status: Available, Busy, On Leave
- Analytics page with KPI cards and charts
- Deadlines page with:
  - due today
  - due tomorrow
  - overdue tasks
  - upcoming 7 days
  - quick actions: Reschedule, Remind Team, Mark Done, View Calendar

### 7. Login as Member

Say:

“The same app becomes restricted for members using backend-enforced RBAC.”

Show:

- member dashboard
- Projects page with assigned projects only
- Tasks page with assigned tasks only
- My Tasks / Focus Mode
- task status update
- comment creation

Point out:

- member cannot open admin-only pages
- member cannot create or delete projects/tasks
- member can only update assigned task status

### 8. Close with deployment readiness

Say:

“FlowBoard is ready to deploy on Railway. The backend has a proper start script, the frontend builds into `dist`, and the repo includes env examples, seed data, tests, linting, and a production build.”
