"use client"

import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  MessageCircle,
  Users,
  Video,
  X,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

const iconMap = {
  dashboard: LayoutDashboard,
  schedule: CalendarDays,
  "upload-notes": FileText,
  students: Users,
  recordings: Video,
  notifications: ClipboardList,
  chat: MessageCircle,
  quizzes: BookOpen,
  notes: FileText,
}

const menuItems = {
  teacher: [
    { label: "Dashboard", value: "dashboard" },
    { label: "My Schedule", value: "schedule" },
    { label: "Upload Notes", value: "upload-notes" },
    { label: "My Students", value: "students" },
    { label: "Class Recordings", value: "recordings" },
    { label: "Notifications", value: "notifications" },
    { label: "Chat", value: "chat" },
    { label: "Quizzes", value: "quizzes" },
  ],
  student: [
    { label: "Dashboard", value: "dashboard" },
    { label: "Class Schedule", value: "schedule" },
    { label: "Class Notes", value: "notes" },
    { label: "Class Recordings", value: "recordings" },
    { label: "Notifications", value: "notifications" },
    { label: "Chat", value: "chat" },
    { label: "Quizzes", value: "quizzes" },
  ],
  admin: [
    { label: "Dashboard", value: "dashboard" },
    { label: "Students", value: "students" },
    { label: "Teachers", value: "teachers" },
    { label: "Batches", value: "batches" },
    { label: "Classes", value: "classes" },
    { label: "Schedule", value: "schedule" },
    { label: "Notifications", value: "notifications" },
    { label: "Analytics", value: "analytics" },
    { label: "Settings", value: "settings" },
    { label: "Quizzes", value: "quizzes" },
  ],
}

export const Sidebar = ({
  activeItem,
  onItemClick,
  userRole,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const navigate = useNavigate()
  const items = menuItems[userRole] || menuItems.student

  const handleNavigation = (value) => {
    onItemClick(value)
    onCloseMobile?.()
    navigate(`/${userRole}/${value === "dashboard" ? "" : value}`)
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 dark:border-slate-800 dark:bg-slate-950 ${
        isCollapsed ? "lg:-translate-x-full" : "lg:translate-x-0"
      } ${
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex h-20 items-center justify-between border-b border-slate-100 px-5 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight">EduTech</p>
            <p className="text-[11px] capitalize text-muted-foreground">{userRole} workspace</p>
          </div>
        </div>
        <button className="rounded-lg p-2 text-muted-foreground hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800" onClick={onCloseMobile} aria-label="Close menu">
          <X className="h-4 w-4" />
        </button>
        <button className="hidden rounded-lg p-2 text-muted-foreground hover:bg-slate-100 lg:block dark:hover:bg-slate-800" onClick={onToggleCollapse} aria-label="Collapse sidebar">
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Workspace</p>
        {items.map((item) => {
          const Icon = iconMap[item.value] || BarChart3
          const active = activeItem === item.value
          return (
            <button
              key={item.value}
              onClick={() => handleNavigation(item.value)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                active
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
