"use client"

import { useMemo, useState } from "react"
import { CheckCircle2, Clock3, Plus, Trash2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useQuiz } from "@/lib/quiz-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

const emptyQuestion = () => ({
  id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  question: "",
  options: ["", "", "", ""],
  correctAnswer: 0,
  points: 1,
})

export const QuizCreator = () => {
  const { user } = useAuth()
  const { createQuiz, getQuizzesByTeacher } = useQuiz()
  const quizzes = getQuizzesByTeacher(user?.id)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    batchId: user?.batchId || "batch1",
    timeLimit: 30,
  })
  const [questions, setQuestions] = useState([emptyQuestion()])
  const [success, setSuccess] = useState("")

  const totalPoints = useMemo(
    () => questions.reduce((sum, q) => sum + Number(q.points || 0), 0),
    [questions]
  )

  const updateQuestion = (idx, patch) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)))
  }

  const updateOption = (qIdx, optIdx, value) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q
        const options = [...q.options]
        options[optIdx] = value
        return { ...q, options }
      })
    )
  }

  const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion()])
  const removeQuestion = (idx) => setQuestions((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)))

  const resetForm = () => {
    setFormData({ title: "", description: "", batchId: user?.batchId || "batch1", timeLimit: 30 })
    setQuestions([emptyQuestion()])
  }

  const isValid =
    formData.title.trim() &&
    questions.length > 0 &&
    questions.every((q) => q.question.trim() && q.options.every((o) => o.trim()))

  const handleCreate = (e) => {
    e.preventDefault()
    if (!isValid) return
    createQuiz({
      ...formData,
      teacherId: user?.id,
      teacherName: user?.name,
      timeLimit: Number(formData.timeLimit) || 30,
      isActive: true,
      isApproved: true,
      maxAttempts: 1,
      showLeaderboard: true,
      questions: questions.map((q, idx) => ({
        id: q.id || `q-${idx + 1}`,
        question: q.question,
        options: q.options,
        correctAnswer: Number(q.correctAnswer),
        points: Number(q.points) || 1,
      })),
    })
    setSuccess("Quiz created successfully.")
    resetForm()
    setTimeout(() => setSuccess(""), 3000)
  }

  return (
    <main className="min-h-full bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 sm:p-8">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Teacher tools</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">Create a quiz</h2>
          <p className="mt-2 text-sm text-muted-foreground">Build timed quizzes, set correct answers, and publish to your students.</p>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <form onSubmit={handleCreate} className="space-y-6">
            <Card className="border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
              <h3 className="text-lg font-semibold">Quiz details</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium">Title</label>
                  <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Algebra fundamentals" required />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium">Description</label>
                  <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Briefly describe what this quiz covers" rows={3} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Batch ID</label>
                  <Input value={formData.batchId} onChange={(e) => setFormData({ ...formData, batchId: e.target.value })} placeholder="batch1" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Time limit (minutes)</label>
                  <Input type="number" min={1} value={formData.timeLimit} onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value })} />
                </div>
              </div>
            </Card>

            <Card className="border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold">Questions</h3>
                <Button type="button" variant="outline" onClick={addQuestion} className="gap-2">
                  <Plus className="h-4 w-4" /> Add question
                </Button>
              </div>
              <div className="mt-4 space-y-4">
                {questions.map((q, idx) => (
                  <div key={q.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">Question {idx + 1}</p>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeQuestion(idx)} disabled={questions.length === 1} className="gap-1.5 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-500/10">
                        <Trash2 className="h-4 w-4" /> Remove
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <Input value={q.question} onChange={(e) => updateQuestion(idx, { question: e.target.value })} placeholder="Enter question text" />
                      <div className="grid gap-2 sm:grid-cols-2">
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} className={`flex items-center gap-2 rounded-xl border p-2 ${Number(q.correctAnswer) === optIdx ? "border-emerald-300 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-500/10" : "border-slate-200 dark:border-slate-800"}`}>
                            <button
                              type="button"
                              onClick={() => updateQuestion(idx, { correctAnswer: optIdx })}
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${Number(q.correctAnswer) === optIdx ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}
                              title="Mark as correct"
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </button>
                            <Input value={opt} onChange={(e) => updateOption(idx, optIdx, e.target.value)} placeholder={`Option ${optIdx + 1}`} className="border-0 bg-transparent px-1 shadow-none focus-visible:ring-0" />
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium">Points</label>
                        <Input type="number" min={1} value={q.points} onChange={(e) => updateQuestion(idx, { points: e.target.value })} className="w-24" />
                        <span className="text-xs text-muted-foreground">Click a letter to mark the correct answer.</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={!isValid} className="gap-2">
                <CheckCircle2 className="h-4 w-4" /> Create quiz
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>Reset</Button>
              {success && <span className="text-sm font-medium text-emerald-600">{success}</span>}
            </div>
          </form>

          <div className="space-y-6">
            <Card className="border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
              <h3 className="text-lg font-semibold">Preview</h3>
              <div className="mt-4 space-y-3 text-sm">
                <PreviewRow label="Title" value={formData.title || "—"} />
                <PreviewRow label="Batch" value={formData.batchId || "—"} />
                <PreviewRow label="Questions" value={questions.length} />
                <PreviewRow label="Total points" value={totalPoints} />
                <div className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 dark:border-slate-800">
                  <span className="text-slate-500">Time limit</span>
                  <span className="inline-flex items-center gap-1.5 font-medium"><Clock3 className="h-4 w-4 text-blue-600" /> {formData.timeLimit} min</span>
                </div>
              </div>
            </Card>

            <Card className="border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Your quizzes</h3>
                <Badge variant="secondary">{quizzes.length}</Badge>
              </div>
              <div className="mt-4 space-y-3">
                {quizzes.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-sm text-muted-foreground dark:border-slate-800">No quizzes created yet.</p>
                ) : (
                  quizzes.slice(0, 5).map((quiz) => (
                    <div key={quiz.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{quiz.title}</p>
                        <p className="text-xs text-muted-foreground">{quiz.questions.length} questions · {quiz.timeLimit} min</p>
                      </div>
                      <Badge variant={quiz.isActive ? "default" : "secondary"}>{quiz.isActive ? "Active" : "Draft"}</Badge>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}

function PreviewRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 dark:border-slate-800">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}