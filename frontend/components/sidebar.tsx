"use client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"
import { ThemeToggle } from "./theme-toggle"
import {
  Home,
  Users,
  BookOpen,
  Calendar,
  FileText,
  Video,
  Settings,
  LogOut,
  Bell,
  Upload,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  MessageSquare,
  BarChart3,
  Layers,
} from "lucide-react"

type SidebarProps = {
  activeItem: string
  onItemClick: (item: string) => void
  userRole: "admin" | "teacher" | "student"
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

const menuItems = {
  admin: [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "students", label: "Students", icon: Users },
    { id: "teachers", label: "Teachers", icon: GraduationCap },
    { id: "batches", label: "Batches", icon: Layers },
    { id: "classes", label: "Classes", icon: BookOpen },
    { id: "quizzes", label: "Quiz Management", icon: FileText },
    { id: "schedule", label: "Schedule", icon: Calendar },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ],
  teacher: [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "batch-select", label: "Select Batch", icon: Layers },
    { id: "schedule", label: "My Schedule", icon: Calendar },
    { id: "quizzes", label: "Quizzes", icon: FileText },
    { id: "upload-notes", label: "Upload Notes", icon: Upload },
    { id: "students", label: "My Students", icon: Users },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "recordings", label: "Recordings", icon: Video },
    { id: "chat", label: "Chat", icon: MessageSquare },
  ],
  student: [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "schedule", label: "Class Schedule", icon: Calendar },
    { id: "quizzes", label: "Quizzes", icon: FileText },
    { id: "notes", label: "Notes", icon: FileText },
    { id: "recordings", label: "Recordings", icon: Video },
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "notifications", label: "Notifications", icon: Bell },
  ],
}

export function Sidebar({ activeItem, onItemClick, userRole, isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const { user, logout } = useAuth()
  const items = menuItems[userRole]

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                EduPlatform
              </span>
            </div>
          )}
          {onToggleCollapse && (
            <Button variant="ghost" size="icon" onClick={onToggleCollapse} className="h-8 w-8 rounded-full">
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>

      {/* User Info */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.avatar || "/placeholder.svg"} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                {user?.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          {items.map((item) => {
            const Icon = item.icon
            const isActive = activeItem === item.id

            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start rounded-xl transition-all duration-200 hover:scale-[1.02]",
                  isActive && "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg",
                  !isActive && "hover:bg-gray-100 dark:hover:bg-gray-800",
                  isCollapsed && "px-2",
                )}
                onClick={() => onItemClick(item.id)}
              >
                <Icon className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
                {!isCollapsed && <span>{item.label}</span>}
              </Button>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <div className="flex items-center justify-between">
          {!isCollapsed && <span className="text-sm text-gray-500">Theme</span>}
          <ThemeToggle />
        </div>

        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200",
            isCollapsed && "px-2",
          )}
          onClick={logout}
        >
          <LogOut className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
          {!isCollapsed && <span>Logout</span>}
        </Button>
      </div>
    </div>
  )
}
