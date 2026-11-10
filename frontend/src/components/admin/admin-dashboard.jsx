"use client"

import { BarChart3, BookOpen, Layers, Settings, Users } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export const AdminDashboard = () => {
  const navigate = useNavigate()

  return (
    <main className="min-h-full bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 sm:p-8">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Admin workspace</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">Platform overview</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Manage users, classes, quizzes, and system settings from a single, consistent dashboard.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} label="Students" value="Manage" onClick={() => navigate("/admin/students")} />
          <StatCard icon={Users} label="Teachers" value="Review" onClick={() => navigate("/admin/teachers")} />
          <StatCard icon={BookOpen} label="Quizzes" value="Monitor" onClick={() => navigate("/admin/quizzes")} />
          <StatCard icon={BarChart3} label="Analytics" value="Insights" onClick={() => navigate("/admin/analytics")} />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
            <h3 className="text-xl font-semibold tracking-tight">Quick actions</h3>
            <p className="mt-1 text-sm text-muted-foreground">Frequently used admin tasks.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <ActionButton icon={Users} label="Manage students" onClick={() => navigate("/admin/students")} />
              <ActionButton icon={Layers} label="Manage classes" onClick={() => navigate("/admin/classes")} />
              <ActionButton icon={BookOpen} label="Quiz management" onClick={() => navigate("/admin/quizzes")} />
              <ActionButton icon={Settings} label="Platform settings" onClick={() => navigate("/admin/settings")} />
            </div>
          </Card>

          <Card className="border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
            <h3 className="text-xl font-semibold tracking-tight">System status</h3>
            <p className="mt-1 text-sm text-muted-foreground">A quick snapshot of your workspace.</p>
            <div className="mt-5 space-y-3">
              <StatusRow label="Authentication" value="Operational" />
              <StatusRow label="Quizzes" value="Operational" />
              <StatusRow label="Student management" value="Operational" />
              <StatusRow label="Analytics" value="Coming soon" muted />
            </div>
          </Card>
        </section>
      </div>
    </main>
  )
}

function StatCard({ icon: Icon, label, value, onClick }) {
  return (
    <button onClick={onClick} className="text-left">
      <Card className="border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-950/80">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-xl font-semibold tracking-tight">{value}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </Card>
    </button>
  )
}

function ActionButton({ icon: Icon, label, onClick }) {
  return (
    <Button variant="outline" onClick={onClick} className="h-auto justify-start gap-3 rounded-xl px-4 py-3 text-left">
      <Icon className="h-4 w-4 text-blue-600" />
      <span>{label}</span>
    </Button>
  )
}

function StatusRow({ label, value, muted }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 dark:border-slate-800">
      <span className="text-sm text-slate-600 dark:text-slate-300">{label}</span>
      <span className={`text-sm font-medium ${muted ? "text-slate-400" : "text-emerald-600 dark:text-emerald-400"}`}>{value}</span>
    </div>
  )
}