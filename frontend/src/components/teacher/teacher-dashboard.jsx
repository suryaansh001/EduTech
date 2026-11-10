"use client"

import { ArrowUpRight, BookOpen, CalendarDays, ClipboardCheck, Plus, Users } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { useQuiz } from "@/lib/quiz-context"

export const TeacherDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { getQuizzesByTeacher, getAttemptsByQuiz } = useQuiz()
  const quizzes = getQuizzesByTeacher(user?.id)
  const submissions = quizzes.reduce((total, quiz) => total + getAttemptsByQuiz(quiz.id).length, 0)

  return (
    <main className="min-h-full bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="flex flex-col justify-between gap-5 rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 sm:flex-row sm:items-center sm:p-8">
          <div>
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Teacher workspace</p>
            <h2 className="mt-1 text-3xl font-semibold tracking-tight">Welcome back, {user?.name?.split(" ")[0] || "Teacher"}.</h2>
            <p className="mt-2 text-sm text-muted-foreground">Manage your classes, assessments, and student progress from one place.</p>
          </div>
          <Button onClick={() => navigate("/teacher/quizzes")} className="gap-2">
            <Plus className="h-4 w-4" />
            Create quiz
          </Button>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} label="My students" value="—" />
          <StatCard icon={BookOpen} label="Published quizzes" value={quizzes.length} />
          <StatCard icon={ClipboardCheck} label="Submissions" value={submissions} />
          <StatCard icon={CalendarDays} label="Next class" value="—" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <Card className="border-slate-200/80 bg-white/90 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
            <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-semibold tracking-tight">Your quizzes</h3>
                <p className="mt-1 text-sm text-muted-foreground">Recent assessments you have created.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate("/teacher/quizzes")} className="gap-1">
                View all <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3 p-6">
              {quizzes.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-muted-foreground dark:border-slate-800">
                  No quizzes yet. Create your first assessment to get started.
                </p>
              ) : quizzes.slice(0, 4).map((quiz) => (
                <div key={quiz.id} className="flex items-center gap-4 rounded-2xl border border-slate-100 p-4 transition hover:border-blue-200 dark:border-slate-800 dark:hover:border-blue-900">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{quiz.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{quiz.questions.length} questions · {quiz.timeLimit} min</p>
                  </div>
                  <Badge variant={quiz.isActive ? "default" : "secondary"}>{quiz.isActive ? "Active" : "Draft"}</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-slate-200/80 bg-white/90 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
            <div className="border-b border-slate-100 p-6 dark:border-slate-800">
              <h3 className="text-xl font-semibold tracking-tight">Quick access</h3>
              <p className="mt-1 text-sm text-muted-foreground">Common teaching tasks.</p>
            </div>
            <div className="grid gap-3 p-6">
              <QuickAction icon={CalendarDays} label="View schedule" onClick={() => navigate("/teacher/schedule")} />
              <QuickAction icon={Users} label="Manage students" onClick={() => navigate("/teacher/students")} />
              <QuickAction icon={BookOpen} label="Upload class notes" onClick={() => navigate("/teacher/upload-notes")} />
            </div>
          </Card>
        </section>
      </div>
    </main>
  )
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <Card className="border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  )
}

function QuickAction({ icon: Icon, label, onClick }) {
  return (
    <Button variant="outline" onClick={onClick} className="h-auto justify-between rounded-xl px-4 py-3">
      <span className="flex items-center gap-3"><Icon className="h-4 w-4 text-blue-600" />{label}</span>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
    </Button>
  )
}
