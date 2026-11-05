"use client"

export const DashboardLayout = ({
  sidebar,
  header,
  children,
  isSidebarCollapsed = false,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="flex">
        {sidebar}
        <div
          className={`flex min-h-screen flex-1 flex-col transition-[margin] duration-300 ${isSidebarCollapsed ? "lg:ml-0" : "lg:ml-64"}`}
        >
          {header}
          <div className="flex-1 overflow-auto">{children}</div>
        </div>
      </div>
    </div>
  )
}