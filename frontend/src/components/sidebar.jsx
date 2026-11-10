"use client"

import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  MessageCircle,
  Settings,
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
  teachers: Users,
  batches: Users,
  classes: BookOpen,
  recordings: Video,
  notifications: ClipboardList,
  chat: MessageCircle,
  quizzes: BookOpen,
  notes: FileText,
  analytics: BarChart3,
  settings: Settings,
  "batch-select": Users,
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
  const collapsed = Boolean(isCollapsed)

  const handleNavigation = (value) => {
    onItemClick(value)
    onCloseMobile?.()
    navigate(`/${userRole}/${value === "dashboard" ? "" : value}`)
  }

  return (
    <>
      {isMobileOpen && (
        <button
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200 bg-white/95 backdrop-blur transition-all duration-300 dark:border-slate-800 dark:bg-slate-950/95 lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "lg:w-20" : "lg:w-64"} w-72`}
      >
        <div className={`flex h-20 items-center border-b border-slate-100 dark:border-slate-800 ${collapsed ? "justify-center px-2" : "justify-between px-4"}`}>
          <div className={`flex items-center ${collapsed ? "justify-center" : "gap-2.5"}`}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20">
              <GraduationCap className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div>
                <p className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">EduTech</p>
                <p className="text-[11px] capitalize text-slate-500">{userRole} workspace</p>
              </div>
            )}
          </div>
          <button
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden dark:hover:bg-slate-800 dark:hover:text-slate-200"
            onClick={onCloseMobile}
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
          {!collapsed && (
            <button
              className="hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:inline-flex dark:hover:bg-slate-800 dark:hover:text-slate-200"
              onClick={onToggleCollapse}
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {!collapsed && (
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
          )}
          {items.map((item) => {
            const Icon = iconMap[item.value] || BarChart3
            const active = activeItem === item.value
            return (
              <button
                key={item.value}
                onClick={() => handleNavigation(item.value)}
                title={collapsed ? item.label : undefined}
                className={`group flex w-full items-center rounded-xl text-sm font-medium transition-all ${
                  collapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5 text-left"
                } ${
                  active
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
                }`}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            )
          })}
        </nav>

        <div className={`border-t border-slate-100 p-3 dark:border-slate-800 ${collapsed ? "flex justify-center" : ""}`}>
          <button
            onClick={onToggleCollapse}
            className={`flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white ${
              collapsed ? "h-10 w-10" : "w-full gap-2 px-3 py-2 text-sm font-medium"
            }`}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
