"use client"

import { BookOpen, CheckCircle2, Clock3, Search, ToggleLeft, ToggleRight } from "lucide-react"
import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useQuiz } from "@/lib/quiz-context"

export const QuizManagement = () => {
  const { quizzes, updateQuiz } = useQuiz()
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return quizzes.filter((quiz) => quiz.title.toLowerCase().includes(q))
  }, [quizzes, query])

  return (
    <main className="min-h-full bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 sm:p-8">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Administration</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">Quiz management</h2>
          <p className="mt-2 text-sm text-muted-foreground">Review quizzes, monitor status, and toggle availability.</p>
        </section>

        <Card className="border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">All quizzes</h3>
                <p className="text-xs text-muted-foreground">{filtered.length} quiz(es)</p>
              </div>
            </div>
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input placeholder="Search quizzes..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-muted-foreground dark:border-slate-800">
                No quizzes found.
              </div>
            ) : (
              filtered.map((quiz) => (
                <div key={quiz.id} className="flex flex-col gap-4 rounded-2xl border border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium">{quiz.title}</p>
                      <Badge variant={quiz.isActive ? "default" : "secondary"}>{quiz.isActive ? "Active" : "Inactive"}</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {quiz.timeLimit} min</span>
                      <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> {quiz.questions.length} questions</span>
                    </div>
                  </div>
                  <Button
                    variant={quiz.isActive ? "outline" : "default"}
                    onClick={() => updateQuiz(quiz.id, { isActive: !quiz.isActive })}
                    className="gap-2"
                  >
                    {quiz.isActive ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                    {quiz.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </main>
  )
}