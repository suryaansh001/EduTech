"use client"

import { Bell, Menu } from "lucide-react"

export const DashboardHeader = ({ title, subtitle, onMenuClick }) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="flex min-h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button onClick={onMenuClick} className="rounded-xl p-2 text-muted-foreground hover:bg-slate-100 lg:hidden dark:hover:bg-slate-900" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold tracking-tight sm:text-xl">{title}</h1>
            <p className="hidden text-sm text-muted-foreground sm:block">{subtitle}</p>
          </div>
        </div>
        <button className="rounded-xl border border-slate-200 p-2.5 text-muted-foreground hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}
