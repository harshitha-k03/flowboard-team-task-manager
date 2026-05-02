export type Role = "admin" | "member";
export type ProjectStatus = "Planning" | "In Progress" | "On Track" | "At Risk" | "Completed";
export type ProjectHealth = "On Track" | "At Risk" | "Delayed";
export type TaskStatus = "Todo" | "In Progress" | "In Review" | "Done" | "Blocked";
export type TaskPriority = "Critical" | "High" | "Medium" | "Low";
export type Availability = "Available" | "Busy" | "On Leave";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: Role;
  roleLabel: string;
  availability?: Availability;
  avatar?: string;
  createdAt?: string;
}

export interface AuthPayload {
  email: string;
  password: string;
}

export interface GoogleAuthPayload {
  credential: string;
  role?: Role;
}

export interface SignupPayload extends AuthPayload {
  name: string;
  role?: Role;
}

export interface AuthSession {
  token: string;
  user: UserSummary;
}

export interface TaskStatusCount {
  status: TaskStatus;
  count: number;
}

export interface ProjectMetrics {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  progress: number;
  tasksByStatus: TaskStatusCount[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  health: ProjectHealth;
  healthScore: number;
  dueDate: string;
  progress: number;
  createdBy: UserSummary;
  members: UserSummary[];
  createdAt: string;
  updatedAt: string;
  metrics?: ProjectMetrics;
}

export interface Subtask {
  id?: string;
  title: string;
  completed: boolean;
}

export interface TaskAttachment {
  id?: string;
  name: string;
  url: string;
}

export interface TaskComment {
  id: string;
  text: string;
  createdAt: string;
  user: UserSummary;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  estimatedHours: number;
  projectId: string;
  project: {
    id: string;
    title: string;
    status?: ProjectStatus;
    dueDate?: string;
  } | null;
  assignedTo: UserSummary;
  createdBy: UserSummary;
  subtasks: Subtask[];
  comments: TaskComment[];
  attachments: TaskAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface ActivityItem {
  id: string;
  action: string;
  createdAt: string;
  user: UserSummary;
  project: {
    id: string;
    title?: string;
  } | null;
  task: {
    id: string;
    title?: string;
  } | null;
}

export interface ReminderItem {
  id: string;
  title: string;
  dueDate: string;
  projectTitle: string;
  type: "overdue" | "today" | "tomorrow" | "upcoming";
  message: string;
}

export interface WorkloadItem extends UserSummary {
  openTasks: number;
  completedTasks: number;
  productivity: number;
}

export interface DashboardSeriesItem {
  label: string;
  total: number;
  completed: number;
  productivity: number;
}

export interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  todayFocus: Task[];
  weeklyProductivity: number;
  weeklyProductivitySeries: DashboardSeriesItem[];
  projectProgress: Project[];
  workloadBalance: WorkloadItem[];
}

export interface ProjectDetails {
  project: Project;
  tasks: Task[];
  metrics: ProjectMetrics;
  activity: ActivityItem[];
  team: WorkloadItem[];
  milestones: {
    id: string;
    title: string;
    status: "done" | "active" | "upcoming";
    date: string;
  }[];
}

export interface TaskDetails {
  task: Task;
  activity: ActivityItem[];
}

export interface TeamMember extends UserSummary {
  assignedProjects: {
    id: string;
    title: string;
  }[];
  assignedProjectsCount: number;
  activeTasks: number;
  weeklyProductivity: number;
  utilization: number;
  loadStatus: "Balanced" | "Overloaded" | "Underutilized";
}

export interface TeamSummary {
  totalMembers: number;
  activeMembers: number;
  newMembersThisWeek: number;
  members: TeamMember[];
  reassignmentSuggestions: ReassignmentSuggestion[];
}

export interface TeamWorkloadItem {
  id: string;
  name: string;
  avatar?: string;
  availability: Availability;
  openTasks: number;
  assignedProjects: number;
  productivity: number;
  utilization: number;
  loadStatus: "Balanced" | "Overloaded" | "Underutilized";
}

export interface ReassignmentSuggestion {
  id: string;
  from: TeamMember;
  to: TeamMember;
  task: {
    id: string;
    title: string;
    projectTitle: string;
  };
  reason: string;
}

export interface DemoWorkspaceResult {
  summary: {
    users: number;
    projects: number;
    tasks: number;
  };
  session: AuthSession;
}

export interface WeeklyAnalytics {
  kpis: {
    weeklyProductivity: number;
    totalCompletedThisWeek: number;
    totalTasksThisWeek: number;
    overdueTasks: number;
    projectsOnTrack: number;
  };
  weeklyProductivity: DashboardSeriesItem[];
  completionBars: {
    name: string;
    completed: number;
    pending: number;
  }[];
}

export interface ProductivityAnalytics {
  projectProgressSummary: {
    id: string;
    title: string;
    progress: number;
    status: ProjectStatus;
  }[];
  mostProductiveMembers: {
    id: string;
    name: string;
    avatar?: string;
    completed: number;
    productivity: number;
  }[];
  overdueTrends: {
    label: string;
    count: number;
  }[];
  taskDistribution: {
    name: TaskStatus;
    count: number;
  }[];
}

export interface DeadlineData {
  dueToday: Task[];
  dueTomorrow: Task[];
  overdue: Task[];
  upcoming7Days: Task[];
  deadlineRiskChart: {
    label: string;
    count: number;
  }[];
  timeline: {
    date: string;
    count: number;
  }[];
  reminders: ReminderItem[];
}

export interface ProjectPayload {
  title: string;
  description: string;
  status: ProjectStatus;
  dueDate: string;
  memberIds: string[];
}

export interface TaskPayload {
  title: string;
  description: string;
  projectId: string;
  assignedTo: string;
  status: TaskStatus;
  dueDate: string;
  estimatedHours: number;
  subtasks: Subtask[];
  attachments: TaskAttachment[];
}

export interface TaskFilters {
  status?: TaskStatus | "all";
  priority?: TaskPriority | "all";
  dueDate?: "all" | "today" | "week" | "overdue";
  project?: string | "all";
  assignee?: string | "all";
  search?: string;
}

export interface ProjectFilters {
  search?: string;
  status?: ProjectStatus | "all";
}
