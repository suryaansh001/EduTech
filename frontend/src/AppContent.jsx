import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { LoginPage } from "@/components/login-page"
import { Sidebar } from "@/components/sidebar"
import { DashboardLayout } from "../components/layouts/dashboard-layout"
import { DashboardHeader } from "../components/layouts/dashboard-header"
import { ContentWrapper } from "../components/layouts/content-wrapper"
import { AdminDashboard } from "../components/admin/admin-dashboard"
import { StudentsManagement } from "../components/admin/students-management"
import { TeacherDashboard } from "../components/teacher/teacher-dashboard"
import { StudentDashboard } from "../components/student/student-dashboard"
import { NotesViewer } from "../components/student/notes-viewer"
import { QuizCreator } from "../components/teacher/quiz-creator"
import { QuizInterface } from "../components/student/quiz-interface"
import { QuizManagement } from "../components/admin/quiz-management"

function AppContent() {
  const { user, isLoading } = useAuth()
  const [activeItem, setActiveItem] = useState("dashboard")
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
            <div className="w-8 h-8 bg-white rounded-lg"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
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

  const renderContent = () => {
    if (user.role === "admin") {
      switch (activeItem) {
        case "dashboard":
          return <AdminDashboard />
        case "students":
          return <StudentsManagement />
        case "teachers":
          return (
            <ContentWrapper>
              <div className="text-center py-12">
                <h1 className="text-2xl font-bold mb-4">Teachers Management</h1>
                <p className="text-gray-600 dark:text-gray-400">Teachers management functionality coming soon...</p>
              </div>
            </ContentWrapper>
          )
        case "batches":
          return (
            <ContentWrapper>
              <div className="text-center py-12">
                <h1 className="text-2xl font-bold mb-4">Batches Management</h1>
                <p className="text-gray-600 dark:text-gray-400">Batches management functionality coming soon...</p>
              </div>
            </ContentWrapper>
          )
        case "classes":
          return (
            <ContentWrapper>
              <div className="text-center py-12">
                <h1 className="text-2xl font-bold mb-4">Classes Management</h1>
                <p className="text-gray-600 dark:text-gray-400">Classes management functionality coming soon...</p>
              </div>
            </ContentWrapper>
          )
        case "schedule":
          return (
            <ContentWrapper>
              <div className="text-center py-12">
                <h1 className="text-2xl font-bold mb-4">Schedule Management</h1>
                <p className="text-gray-600 dark:text-gray-400">Schedule management functionality coming soon...</p>
              </div>
            </ContentWrapper>
          )
        case "notifications":
          return (
            <ContentWrapper>
              <div className="text-center py-12">
                <h1 className="text-2xl font-bold mb-4">Notifications</h1>
                <p className="text-gray-600 dark:text-gray-400">Notifications management functionality coming soon...</p>
              </div>
            </ContentWrapper>
          )
        case "analytics":
          return (
            <ContentWrapper>
              <div className="text-center py-12">
                <h1 className="text-2xl font-bold mb-4">Analytics Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-400">Analytics dashboard functionality coming soon...</p>
              </div>
            </ContentWrapper>
          )
        case "settings":
          return (
            <ContentWrapper>
              <div className="text-center py-12">
                <h1 className="text-2xl font-bold mb-4">Settings</h1>
                <p className="text-gray-600 dark:text-gray-400">Settings functionality coming soon...</p>
              </div>
            </ContentWrapper>
          )
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
          return (
            <ContentWrapper>
              <div className="text-center py-12">
                <h1 className="text-2xl font-bold mb-4">My Schedule</h1>
                <p className="text-gray-600 dark:text-gray-400">Schedule functionality coming soon...</p>
              </div>
            </ContentWrapper>
          )
        case "upload-notes":
          return (
            <ContentWrapper>
              <div className="text-center py-12">
                <h1 className="text-2xl font-bold mb-4">Upload Notes</h1>
                <p className="text-gray-600 dark:text-gray-400">Upload notes functionality coming soon...</p>
              </div>
            </ContentWrapper>
          )
        case "students":
          return (
            <ContentWrapper>
              <div className="text-center py-12">
                <h1 className="text-2xl font-bold mb-4">My Students</h1>
                <p className="text-gray-600 dark:text-gray-400">Students management functionality coming soon...</p>
              </div>
            </ContentWrapper>
          )
        case "notifications":
          return (
            <ContentWrapper>
              <div className="text-center py-12">
                <h1 className="text-2xl font-bold mb-4">Notifications</h1>
                <p className="text-gray-600 dark:text-gray-400">Notifications functionality coming soon...</p>
              </div>
            </ContentWrapper>
          )
        case "recordings":
          return (
            <ContentWrapper>
              <div className="text-center py-12">
                <h1 className="text-2xl font-bold mb-4">Class Recordings</h1>
                <p className="text-gray-600 dark:text-gray-400">Recordings functionality coming soon...</p>
              </div>
            </ContentWrapper>
          )
        case "chat":
          return (
            <ContentWrapper>
              <div className="text-center py-12">
                <h1 className="text-2xl font-bold mb-4">Chat</h1>
                <p className="text-gray-600 dark:text-gray-400">Chat functionality coming soon...</p>
              </div>
            </ContentWrapper>
          )
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
          return (
            <ContentWrapper>
              <div className="text-center py-12">
                <h1 className="text-2xl font-bold mb-4">Class Schedule</h1>
                <p className="text-gray-600 dark:text-gray-400">Schedule functionality coming soon...</p>
              </div>
            </ContentWrapper>
          )
        case "notes":
          return <NotesViewer />
        case "recordings":
          return (
            <ContentWrapper>
              <div className="text-center py-12">
                <h1 className="text-2xl font-bold mb-4">Class Recordings</h1>
                <p className="text-gray-600 dark:text-gray-400">Recordings functionality coming soon...</p>
              </div>
            </ContentWrapper>
          )
        case "chat":
          return (
            <ContentWrapper>
              <div className="text-center py-12">
                <h1 className="text-2xl font-bold mb-4">Chat</h1>
                <p className="text-gray-600 dark:text-gray-400">Chat functionality coming soon...</p>
              </div>
            </ContentWrapper>
          )
        case "notifications":
          return (
            <ContentWrapper>
              <div className="text-center py-12">
                <h1 className="text-2xl font-bold mb-4">Notifications</h1>
                <p className="text-gray-600 dark:text-gray-400">Notifications functionality coming soon...</p>
              </div>
            </ContentWrapper>
          )
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
        />
      }
      header={
        <DashboardHeader
          title={getPageTitle()}
          subtitle={`Welcome back, ${user.name}`}
          onMenuClick={() => setIsMobileSidebarOpen(true)}
        />
      }
    >
      {renderContent()}
    </DashboardLayout>
  )
}

export default AppContent
