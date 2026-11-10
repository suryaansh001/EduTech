"use client"

import { ArrowUpRight, BookOpen, CheckCircle2, Clock3, Sparkles, Target } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { useQuiz } from "@/lib/quiz-context"

const getScoreTone = (percentage) => {
  if (percentage >= 80) return "text-emerald-600 dark:text-emerald-400"
  if (percentage >= 60) return "text-amber-600 dark:text-amber-400"
  return "text-rose-600 dark:text-rose-400"
}

export const StudentDashboard = () => {
  const { user } = useAuth()
  const { getQuizzesByBatch, getAttemptsByStudent } = useQuiz()
  const navigate = useNavigate()

  const quizzes = getQuizzesByBatch(user?.batchId)
  const attempts = getAttemptsByStudent(user?.id)
  const completedQuizIds = new Set(attempts.map((attempt) => attempt.quizId))
  const averageScore = attempts.length
    ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / attempts.length)
    : 0
  const firstName = user?.name?.split(" ")[0] || "Student"

  return (
    <main className="min-h-full bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-blue-900 px-6 py-8 text-white shadow-xl shadow-indigo-950/10 sm:px-8">
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-blue-400/20 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-violet-400/20 blur-3xl" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-blue-100">
                <Sparkles className="h-3.5 w-3.5" />
                Keep your momentum going
              </div>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Good morning, {firstName}.</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100/80 sm:text-base">
                Stay on top of your learning journey with a quick view of your quizzes, progress, and latest results.
              </p>
            </div>
            <Button onClick={() => navigate("/student/quizzes")} className="bg-white text-slate-900 hover:bg-blue-50">
              Open quizzes
            </Button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={BookOpen} label="Available quizzes" value={quizzes.length} tone="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" />
          <StatCard icon={CheckCircle2} label="Completed" value={attempts.length} tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" />
          <StatCard icon={Target} label="Average score" value={`${averageScore}%`} tone="bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400" />
          <StatCard icon={Clock3} label="Learning streak" value="Keep going" tone="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <Card className="overflow-hidden border-slate-200/80 bg-white/90 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6 dark:border-slate-800">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Your learning plan</p>
                <h3 className="mt-1 text-xl font-semibold tracking-tight">Quiz progress</h3>
                <p className="mt-1 text-sm text-muted-foreground">Pick up where you left off.</p>
              </div>
              <BookOpen className="hidden h-5 w-5 text-muted-foreground sm:block" />
            </div>
            <div className="space-y-3 p-6">
              {quizzes.length === 0 ? (
                <EmptyState message="No quizzes are available for your batch yet." />
              ) : (
                quizzes.map((quiz) => {
                  const attempt = attempts.find((item) => item.quizId === quiz.id)
                  const completed = completedQuizIds.has(quiz.id)
                  return (
                    <div
                      key={quiz.id}
                      className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition hover:border-blue-200 hover:bg-blue-50/50 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-blue-900 sm:flex-row sm:items-center"
                    >
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${completed ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"}`}>
                        {completed ? <CheckCircle2 className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="truncate text-sm font-semibold">{quiz.title}</h4>
                          <Badge variant={completed ? "secondary" : "default"}>{completed ? "Completed" : "Ready"}</Badge>
                        </div>
                        <p className="mt-1 truncate text-xs text-muted-foreground">{quiz.questions.length} questions · {quiz.timeLimit} min</p>
                      </div>
                      <div className="flex items-center gap-3 self-start sm:self-auto">
                        {attempt ? (
                          <p className={`text-lg font-semibold ${getScoreTone(attempt.percentage)}`}>{attempt.percentage}%</p>
                        ) : null}
                        <Button variant={completed ? "outline" : "default"} size="sm" onClick={() => navigate("/student/quizzes")} className="gap-1.5">
                          {completed ? "Review" : "Start"} <ArrowUpRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </Card>

          <Card className="border-slate-200/80 bg-white/90 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
            <div className="border-b border-slate-100 p-6 dark:border-slate-800">
              <p className="text-sm font-medium text-violet-600 dark:text-violet-400">Performance</p>
              <h3 className="mt-1 text-xl font-semibold tracking-tight">Recent results</h3>
            </div>
            <div className="p-6">
              {attempts.length === 0 ? (
                <EmptyState message="Your completed quizzes will appear here." />
              ) : (
                <div className="space-y-4">
                  {attempts.slice(0, 5).map((attempt) => {
                    const quiz = quizzes.find((item) => item.id === attempt.quizId)
                    return (
                      <div key={attempt.id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{quiz?.title || "Quiz result"}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleDateString() : "Recently completed"}
                          </p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-sm font-semibold ${getScoreTone(attempt.percentage)}`}>{attempt.percentage}%</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </Card>
        </section>
      </div>
    </main>
  )
}

function StatCard({ icon: Icon, label, value, tone }) {
  return (
    <Card className="border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  )
}

function EmptyState({ message }) {
  return <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-muted-foreground dark:border-slate-800">{message}</p>
}
