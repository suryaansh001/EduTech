"use client"

import { Bell, LogOut, Menu, PanelLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export const DashboardHeader = ({ title, subtitle, onMenuClick, onToggleCollapse, user, onLogout }) => {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="outline" size="icon" onClick={onMenuClick} className="h-10 w-10 rounded-xl lg:hidden" aria-label="Open menu">
            <Menu className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onToggleCollapse} className="hidden h-10 w-10 rounded-xl text-slate-600 lg:inline-flex dark:text-slate-300" aria-label="Toggle sidebar">
            <PanelLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl">{title}</h1>
            <p className="hidden truncate text-sm text-slate-500 sm:block">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </Button>
          {user && (
            <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 sm:flex dark:border-slate-800 dark:bg-slate-900">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-xs font-semibold text-white">
                {user.name?.charAt(0) || "U"}
              </div>
              <span className="max-w-[120px] truncate text-sm font-medium">{user.name}</span>
            </div>
          )}
          {onLogout && (
            <Button variant="outline" onClick={onLogout} className="h-10 gap-2 rounded-xl px-3 text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:text-slate-200 dark:hover:bg-rose-500/10 dark:hover:text-rose-400">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
