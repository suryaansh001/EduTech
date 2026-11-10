import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/lib/auth-context"
import { LoginPage } from "@/components/login-page"
import { Sidebar } from "@/components/sidebar"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { DashboardHeader } from "@/components/layouts/dashboard-header"
import { ContentWrapper } from "@/components/layouts/content-wrapper"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { StudentsManagement } from "@/components/admin/students-management"
import { TeachersManagement } from "@/components/admin/teachers-management"
import { ClassesManagement } from "@/components/admin/classes-management"
import { TeacherDashboard } from "@/components/teacher/teacher-dashboard"
import { StudentDashboard } from "@/components/student/student-dashboard"
import { NotesViewer } from "@/components/student/notes-viewer"
import { QuizCreator } from "@/components/teacher/quiz-creator"
import { QuizInterface } from "@/components/student/quiz-interface"
import { QuizManagement } from "@/components/admin/quiz-management"
import { ChatContainer } from "@/components/chat/ChatContainer"

function AppContent() {
  const { user, isLoading, logout } = useAuth()
  const location = useLocation()
  const [activeItem, setActiveItem] = useState("dashboard")
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  useEffect(() => {
    const segments = location.pathname.split("/").filter(Boolean)
    const item = segments[1] || "dashboard"
    setActiveItem(item === user?.role ? "dashboard" : item)
  }, [location.pathname, user?.role])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-600/20">
            <div className="h-7 w-7 animate-pulse rounded-lg bg-white/90" />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  const getPageTitle = () => {
    const titles = {
      dashboard: user?.role === 'admin' ? 'Admin Dashboard' : 
                 user?.role === 'teacher' ? 'Teacher Dashboard' : 'Student Dashboard',
      students: 'Students Management',
      teachers: 'Teachers Management', 
      batches: 'Batches Management',
      classes: 'Classes Management',
      schedule: user?.role === 'teacher' ? 'My Schedule' : 'Class Schedule',
      notifications: 'Notifications',
      analytics: 'Analytics Dashboard',
      settings: 'Settings',
      quizzes: user?.role === 'admin' ? 'Quiz Management' : 
               user?.role === 'teacher' ? 'Quiz Creator' : 'Quizzes',
      notes: 'Class Notes',
      'upload-notes': 'Upload Notes',
      recordings: 'Class Recordings',
      chat: 'Chat',
      'batch-select': 'Select Batch'
    }
    return titles[activeItem] || 'Dashboard'
  }

  const Placeholder = ({ title, description }) => (
    <ContentWrapper>
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200/80 bg-white/90 p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950/80 sm:p-12">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
          <span className="text-xl font-semibold">•</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">{description}</p>
        <div className="mt-6 inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          Coming soon
        </div>
      </div>
    </ContentWrapper>
  )

  const renderContent = () => {
    if (user.role === "admin") {
      switch (activeItem) {
        case "dashboard":
          return <AdminDashboard />
        case "students":
          return <StudentsManagement />
        case "teachers":
          return <TeachersManagement />
        case "batches":
          return <Placeholder title="Batches Management" description="Organize student batches and keep cohorts structured." />
        case "classes":
          return <ClassesManagement />
        case "schedule":
          return <Placeholder title="Schedule Management" description="Plan and track academic schedules in one place." />
        case "notifications":
          return <Placeholder title="Notifications" description="Stay informed with announcements and important updates." />
        case "analytics":
          return <Placeholder title="Analytics Dashboard" description="Insights and performance analytics will appear here." />
        case "settings":
          return <Placeholder title="Settings" description="Configure platform preferences and administrative options." />
        case "quizzes":
          return <QuizManagement />
        default:
          return <AdminDashboard />
      }
    } else if (user.role === "teacher") {
      switch (activeItem) {
        case "dashboard":
        case "batch-select":
          return <TeacherDashboard />
        case "schedule":
          return <Placeholder title="My Schedule" description="Your upcoming classes and teaching schedule will be shown here." />
        case "upload-notes":
          return <Placeholder title="Upload Notes" description="Share study materials and class notes with your students." />
        case "students":
          return <Placeholder title="My Students" description="View and manage the students in your classes." />
        case "notifications":
          return <Placeholder title="Notifications" description="Important alerts and updates for teachers will appear here." />
        case "recordings":
          return <Placeholder title="Class Recordings" description="Access and manage recorded class sessions." />
        case "chat":
          return <ChatContainer />
        case "quizzes":
          return <QuizCreator />
        default:
          return <TeacherDashboard />
      }
    } else if (user.role === "student") {
      switch (activeItem) {
        case "dashboard":
          return <StudentDashboard />
        case "schedule":
          return <Placeholder title="Class Schedule" description="Your upcoming classes and timetable will appear here." />
        case "notes":
          return <NotesViewer />
        case "recordings":
          return <Placeholder title="Class Recordings" description="Watch and review your class recordings here." />
        case "chat":
          return <ChatContainer />
        case "notifications":
          return <Placeholder title="Notifications" description="Stay updated with announcements and reminders." />
        case "quizzes":
          return <QuizInterface />
        default:
          return <StudentDashboard />
      }
    }
  }

  return (
    <DashboardLayout
      sidebar={
        <Sidebar
          activeItem={activeItem}
          onItemClick={(item) => {
            setActiveItem(item)
            setIsMobileSidebarOpen(false)
          }}
          userRole={user.role}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />
      }
      header={
        <DashboardHeader
          title={getPageTitle()}
          subtitle={`Welcome back, ${user.name}`}
          onMenuClick={() => setIsMobileSidebarOpen(true)}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          user={user}
          onLogout={logout}
        />
      }
      isSidebarCollapsed={isSidebarCollapsed}
    >
      {renderContent()}
    </DashboardLayout>
  )
}

export default AppContent
