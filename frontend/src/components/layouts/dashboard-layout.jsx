"use client"

export const DashboardLayout = ({
  sidebar,
  header,
  children,
  isSidebarCollapsed = false,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <div className="flex min-h-screen">
        {sidebar}
        <div
          className={`flex min-h-screen flex-1 flex-col transition-[margin] duration-300 ${
            isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
          }`}
        >
          {header}
          <div className="flex-1 overflow-auto">{children}</div>
        </div>
      </div>
    </div>
  )
}