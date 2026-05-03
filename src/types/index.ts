// ─── User & Auth ───────────────────────────────────────────────

export type UserRole = 'UNIT_HEAD' | 'CORE_LEADER' | 'ADMIN'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  unitId?: string
  coreLeaderId?: string
  avatarInitials: string
  createdAt: string
}

export interface Session {
  user: User
  token: string
  expiresAt: string
}

// ─── Unit ──────────────────────────────────────────────────────

export interface Unit {
  id: string
  name: string
  coreLeaderId: string
  coreLeaderName: string
  memberCount: number
  createdAt: string
}

// ─── Report ────────────────────────────────────────────────────

export type ReportStatus = 'PENDING' | 'REVIEWED' | 'REJECTED'

export interface Report {
  id: string
  title: string
  content: string
  status: ReportStatus
  unitId: string
  unitName: string
  submittedBy: string
  submittedByName: string
  coreLeaderId: string
  attachmentUrl?: string
  attachmentName?: string
  createdAt: string
  updatedAt: string
  comments: Comment[]
}

export interface Comment {
  id: string
  reportId: string
  authorId: string
  authorName: string
  authorRole: UserRole
  content: string
  createdAt: string
}

// ─── Dashboard Stats ───────────────────────────────────────────

export interface UnitHeadStats {
  totalReports: number
  reportsThisWeek: number
  lastSubmissionDate: string | null
  pendingCount: number
  reviewedCount: number
}

export interface CoreLeaderStats {
  totalUnits: number
  totalReports: number
  pendingReports: number
  reviewedReports: number
  unitsData: UnitSummary[]
}

export interface AdminStats {
  totalUsers: number
  totalUnits: number
  totalReports: number
  pendingReports: number
  reviewedReports: number
  reportsThisWeek: number
}

export interface UnitSummary {
  unitId: string
  unitName: string
  reportCount: number
  pendingCount: number
  lastSubmission: string | null
}

// ─── Form ──────────────────────────────────────────────────────

export interface SubmitReportForm {
  title: string
  content: string
  attachment?: File | null
}

export interface FormErrors {
  title?: string
  content?: string
  attachment?: string
}

// ─── API Response ──────────────────────────────────────────────

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

// ─── Filter ────────────────────────────────────────────────────

export interface ReportFilter {
  status?: ReportStatus | 'ALL'
  unitId?: string
  dateRange?: 'THIS_WEEK' | 'THIS_MONTH' | 'ALL_TIME'
  search?: string
}

// ─── Navigation ────────────────────────────────────────────────

export interface NavItem {
  label: string
  href: string
  icon: string
  badge?: number
  roles: UserRole[]
}