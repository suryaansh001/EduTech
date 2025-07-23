import { ReactNode } from 'react'

interface DashboardLayoutProps {
  children: ReactNode
  header?: ReactNode
  sidebar?: ReactNode
}

export function DashboardLayout({ children, header, sidebar }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-800">
      <div className="flex h-screen">
        {/* Sidebar */}
        {sidebar && (
          <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:border-gray-200 dark:lg:border-gray-700 lg:bg-white/80 dark:lg:bg-gray-900/80 lg:backdrop-blur-xl">
            {sidebar}
          </div>
        )}
        
        {/* Main content area */}
        <div className={`flex-1 ${sidebar ? 'lg:pl-64' : ''}`}>
          {/* Header */}
          {header && (
            <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700">
              {header}
            </div>
          )}
          
          {/* Page content */}
          <main className="flex-1 relative overflow-y-auto">
            <div className="py-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
