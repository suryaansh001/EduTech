"use client"

import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { BarChart3, CalendarClock, CheckCircle2, Clock3, FileJson, PenLine, Pencil, Plus, Trash2, X } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useQuiz } from "@/lib/quiz-context"
import { classesApi } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

const JSON_SAMPLE = `{
  "title": "Algebra Fundamentals",
  "description": "Basic algebra concepts",
  "batchId": "batch1",
  "timeLimit": 30,
  "startTime": "2026-11-15T09:00",
  "endTime": "2026-11-15T18:00",
  "questions": [
    {
      "question": "What is 2 + 2?",
      "options": ["3", "4", "5", "6"],
      "correctAnswer": 1,
      "points": 1
    }
  ]
}`

const emptyQuestion = () => ({
  id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  question: "",
  options: ["", "", "", ""],
  correctAnswer: 0,
  points: 1,
})

export const QuizCreator = () => {
  const { user, token } = useAuth()
  const { createQuiz, updateQuiz, getQuizzesByTeacher, getAttemptsByQuiz } = useQuiz()
  const navigate = useNavigate()
  const quizzes = getQuizzesByTeacher(user?.id)
  const [batches, setBatches] = useState([])

  const [mode, setMode] = useState("manual")
  const [jsonText, setJsonText] = useState("")
  const [jsonError, setJsonError] = useState("")
  const [jsonApplied, setJsonApplied] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    batchId: user?.batchId || "",
    timeLimit: 30,
    startTime: "",
    endTime: "",
  })
  const [questions, setQuestions] = useState([emptyQuestion()])
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [editingId, setEditingId] = useState(null)
  const [analyticsQuizId, setAnalyticsQuizId] = useState(null)

  useEffect(() => {
    let mounted = true
    const loadBatches = async () => {
      if (!token) {
        if (mounted) setBatches(user?.batchId ? [{ id: user.batchId, title: `Batch ${user.batchId}` }] : [])
        return
      }
      try {
        const res = await classesApi.getClasses(token)
        const list = Array.isArray(res?.data) ? res.data : (res?.data?.classes || [])
        if (mounted) {
          setBatches(list)
          if (!formData.batchId && list[0]?.id) setFormData((f) => ({ ...f, batchId: list[0].id }))
        }
      } catch {
        if (mounted) setBatches(user?.batchId ? [{ id: user.batchId, title: `Batch ${user.batchId}` }] : [])
      }
    }
    loadBatches()
    return () => { mounted = false }
  }, [token])

  const totalPoints = useMemo(
    () => questions.reduce((sum, q) => sum + Number(q.points || 0), 0),
    [questions]
  )

  const toDatetimeLocal = (value) => {
    if (!value) return ""
    const d = new Date(value)
    if (isNaN(d.getTime())) return String(value)
    const pad = (n) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const normalizeImported = (data) => {
    if (!data || typeof data !== "object") throw new Error("JSON must be an object.")
    const title = String(data.title || data.name || "").trim()
    if (!title) throw new Error("`title` (or `name`) is required.")
    if (!Array.isArray(data.questions) || data.questions.length === 0) throw new Error("`questions` must be a non-empty array.")

    const questions = data.questions.map((q, i) => {
      if (!q || typeof q !== "object") throw new Error(`Question ${i + 1} is invalid.`)
      const question = String(q.question || q.text || "").trim()
      if (!question) throw new Error(`Question ${i + 1}: \`question\` is required.`)
      let options = Array.isArray(q.options) ? q.options.map((o) => String(o ?? "").trim()) : []
      if (options.length < 2) throw new Error(`Question ${i + 1}: at least 2 options required.`)
      if (options.some((o) => !o)) throw new Error(`Question ${i + 1}: options cannot be empty.`)

      let correctAnswer = q.correctAnswer ?? q.correctOption ?? q.answer ?? 0
      if (typeof correctAnswer === "string") {
        const idx = options.findIndex((o) => o.toLowerCase() === correctAnswer.toLowerCase())
        correctAnswer = idx >= 0 ? idx : Number(correctAnswer)
      }
      correctAnswer = Number(correctAnswer)
      if (!Number.isInteger(correctAnswer) || correctAnswer < 0 || correctAnswer >= options.length) {
        throw new Error(`Question ${i + 1}: \`correctAnswer\` must be option index (0-${options.length - 1}) or matching option text.`)
      }

      return {
        id: q.id || `q-${Date.now()}-${i}`,
        question,
        options,
        correctAnswer,
        points: Number(q.points ?? q.marks ?? 1) || 1,
      }
    })

    return {
      form: {
        title,
        description: String(data.description || "").trim(),
        batchId: String(data.batchId || user?.batchId || "batch1"),
        timeLimit: Number(data.timeLimit ?? data.duration ?? 30) || 30,
        startTime: toDatetimeLocal(data.startTime || data.startDate),
        endTime: toDatetimeLocal(data.endTime || data.endDate),
      },
      questions,
    }
  }

  const applyJson = () => {
    setJsonError("")
    setJsonApplied(false)
    setError("")
    try {
      const parsed = JSON.parse(jsonText)
      const normalized = normalizeImported(parsed)
      setFormData(normalized.form)
      setQuestions(normalized.questions)
      setJsonApplied(true)
      setSuccess(`Imported ${normalized.questions.length} question(s) from JSON. Review and ${editingId ? "save" : "create"}.`)
      setTimeout(() => setSuccess(""), 4000)
    } catch (e) {
      setJsonError(e instanceof SyntaxError ? `Invalid JSON: ${e.message}` : e.message)
    }
  }

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
    setFormData({ title: "", description: "", batchId: user?.batchId || "batch1", timeLimit: 30, startTime: "", endTime: "" })
    setQuestions([emptyQuestion()])
    setJsonText("")
    setJsonError("")
    setJsonApplied(false)
    setError("")
    setEditingId(null)
  }

  const startEdit = (quiz) => {
    setEditingId(quiz.id)
    setFormData({
      title: quiz.title || "",
      description: quiz.description || "",
      batchId: quiz.batchId || user?.batchId || "batch1",
      timeLimit: quiz.timeLimit || 30,
      startTime: toDatetimeLocal(quiz.startTime),
      endTime: toDatetimeLocal(quiz.endTime),
    })
    setQuestions((quiz.questions || [emptyQuestion()]).map((q, i) => ({
      id: q.id || `q-${i}`,
      question: q.question || "",
      options: Array.isArray(q.options) ? [...q.options] : ["", "", "", ""],
      correctAnswer: Number(q.correctAnswer ?? 0),
      points: Number(q.points ?? q.marks ?? 1) || 1,
    })))
    setMode("manual")
    setSuccess("")
    setError("")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const isValid =
    formData.title.trim() &&
    formData.batchId &&
    formData.startTime &&
    formData.endTime &&
    new Date(formData.endTime) > new Date(formData.startTime) &&
    questions.length > 0 &&
    questions.every((q) => q.question.trim() && q.options.every((o) => o.trim()))

  const handleCreate = (e) => {
    e.preventDefault()
    setError("")
    if (!isValid) {
      setError("Please fill all required fields, valid schedule, and complete questions/options.")
      return
    }
    const payload = {
      ...formData,
      teacherId: user?.id,
      teacherName: user?.name,
      timeLimit: Number(formData.timeLimit) || 30,
      startTime: new Date(formData.startTime).toISOString(),
      endTime: new Date(formData.endTime).toISOString(),
      isActive: true,
      isApproved: true,
      questions: questions.map((q, idx) => ({
        id: q.id || `q-${idx + 1}`,
        question: q.question,
        options: q.options,
        correctAnswer: Number(q.correctAnswer),
        points: Number(q.points) || 1,
      })),
    }
    if (editingId) {
      updateQuiz(editingId, payload)
      setSuccess("Quiz updated successfully.")
    } else {
      createQuiz({ ...payload, maxAttempts: 1, showLeaderboard: true })
      setSuccess("Quiz created and scheduled successfully.")
    }
    resetForm()
    setTimeout(() => setSuccess(""), 3000)
  }

  return (
    <main className="min-h-full bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Teacher tools</p>
              <h2 className="mt-1 text-3xl font-semibold tracking-tight">{editingId ? "Edit quiz" : "Create a quiz"}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{editingId ? "Update details, schedule/time, and questions for this quiz." : "Build quizzes manually or import all fields at once from a JSON payload."}</p>
            </div>
            {editingId && (
              <Button type="button" variant="outline" onClick={resetForm} className="gap-2"><X className="h-4 w-4" /> Cancel edit</Button>
            )}
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <form onSubmit={handleCreate} className="space-y-6">
            <Card className="border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg font-semibold">Creation method</h3>
                <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900">
                  <button type="button" onClick={() => setMode("manual")} className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition ${mode === "manual" ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}>
                    <PenLine className="h-4 w-4" /> Manual
                  </button>
                  <button type="button" onClick={() => setMode("json")} className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition ${mode === "json" ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}>
                    <FileJson className="h-4 w-4" /> JSON import
                  </button>
                </div>
              </div>

              {mode === "json" ? (
                <div className="mt-4 space-y-3">
                  <p className="text-sm text-muted-foreground">Paste quiz JSON (all fields + questions). <span className="font-medium">correctAnswer</span> is the option index (0-based) or matching option text.</p>
                  <Textarea value={jsonText} onChange={(e) => { setJsonText(e.target.value); setJsonError(""); setJsonApplied(false) }} placeholder={JSON_SAMPLE} rows={14} className="font-mono text-xs" />
                  {jsonError && <p className="text-sm text-rose-600">{jsonError}</p>}
                  {jsonApplied && <p className="text-sm text-emerald-600">JSON applied to the form. You can switch to Manual to fine-tune.</p>}
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" onClick={applyJson} className="gap-2"><FileJson className="h-4 w-4" /> Parse & apply JSON</Button>
                    <Button type="button" variant="outline" onClick={() => { setJsonText(JSON_SAMPLE); setJsonError("") }}>Load sample</Button>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">Fill quiz details and questions manually below, or switch to JSON import to prefill everything.</p>
              )}
            </Card>

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
                  <label className="mb-1.5 block text-sm font-medium">Batch (students in this batch can attempt)</label>
                  {batches.length > 0 ? (
                    <select value={formData.batchId} onChange={(e) => setFormData({ ...formData, batchId: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" required>
                      <option value="">Select batch</option>
                      {batches.map((b) => <option key={b.id} value={b.id}>{b.title || b.name || b.id}</option>)}
                    </select>
                  ) : (
                    <Input value={formData.batchId} onChange={(e) => setFormData({ ...formData, batchId: e.target.value })} placeholder="batch id" required />
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Time limit (minutes)</label>
                  <Input type="number" min={1} value={formData.timeLimit} onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Start date & time</label>
                  <Input type="datetime-local" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} required />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">End date & time</label>
                  <Input type="datetime-local" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} required />
                </div>
                {formData.startTime && formData.endTime && new Date(formData.endTime) <= new Date(formData.startTime) && (
                  <p className="sm:col-span-2 text-sm text-rose-600">End time must be after start time.</p>
                )}
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
                <CheckCircle2 className="h-4 w-4" /> {editingId ? "Update quiz" : "Create quiz"}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>{editingId ? "Cancel" : "Reset"}</Button>
              {success && <span className="text-sm font-medium text-emerald-600">{success}</span>}
              {error && <span className="text-sm font-medium text-rose-600">{error}</span>}
            </div>
          </form>

          <div className="space-y-6">
            <Card className="border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
              <h3 className="text-lg font-semibold">Preview</h3>
              <div className="mt-4 space-y-3 text-sm">
                <PreviewRow label="Title" value={formData.title || "—"} />
                <PreviewRow label="Batch" value={(batches.find((b) => b.id === formData.batchId)?.title) || formData.batchId || "—"} />
                <PreviewRow label="Questions" value={questions.length} />
                <PreviewRow label="Total points" value={totalPoints} />
                <PreviewRow label="Starts" value={formData.startTime ? new Date(formData.startTime).toLocaleString() : "—"} />
                <PreviewRow label="Ends" value={formData.endTime ? new Date(formData.endTime).toLocaleString() : "—"} />
                <div className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 dark:border-slate-800">
                  <span className="text-slate-500">Time limit</span>
                  <span className="inline-flex items-center gap-1.5 font-medium"><Clock3 className="h-4 w-4 text-blue-600" /> {formData.timeLimit} min</span>
                </div>
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3 text-xs text-blue-800 dark:border-blue-900/40 dark:bg-blue-500/10 dark:text-blue-200">
                  <span className="inline-flex items-center gap-1.5 font-medium"><CalendarClock className="h-3.5 w-3.5" /> Scheduling</span>
                  <p className="mt-1 opacity-90">Students can only take the quiz between the start and end times.</p>
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
                  quizzes.map((quiz) => (
                    <div key={quiz.id} className={`rounded-xl border p-3 transition dark:border-slate-800 ${analyticsQuizId === quiz.id ? "border-blue-300 bg-blue-50/40 dark:border-blue-900" : "border-slate-100"}`}>
                      <button type="button" onClick={() => setAnalyticsQuizId(analyticsQuizId === quiz.id ? null : quiz.id)} className="w-full text-left">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{quiz.title}</p>
                            <p className="text-xs text-muted-foreground">{quiz.questions.length} questions · {quiz.timeLimit} min</p>
                          </div>
                          <Badge variant={quiz.isActive ? "default" : "secondary"}>{quiz.isActive ? "Active" : "Draft"}</Badge>
                        </div>
                      </button>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button type="button" size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => startEdit(quiz)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                        <Button type="button" size="sm" variant={analyticsQuizId === quiz.id ? "default" : "outline"} className="h-8 gap-1.5" onClick={() => setAnalyticsQuizId(analyticsQuizId === quiz.id ? null : quiz.id)}><BarChart3 className="h-3.5 w-3.5" /> Analytics</Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {analyticsQuizId && (
              <QuizAnalytics quiz={quizzes.find((q) => q.id === analyticsQuizId)} attempts={getAttemptsByQuiz(analyticsQuizId)} onClose={() => setAnalyticsQuizId(null)} />
            )}
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
function formatDuration(seconds) {
  if (seconds == null || isNaN(seconds)) return "—"
  const s = Math.max(0, Math.round(Number(seconds)))
  const m = Math.floor(s / 60)
  const r = s % 60
  if (m === 0) return `${r}s`
  return `${m}m ${r}s`
}

function QuizAnalytics({ quiz, attempts, onClose }) {
  const [expanded, setExpanded] = useState(null)
  if (!quiz) return null

  const avgScore = attempts.length ? Math.round(attempts.reduce((s, a) => s + (Number(a.percentage) || 0), 0) / attempts.length) : 0
  const avgTime = attempts.length ? Math.round(attempts.reduce((s, a) => s + (Number(a.timeSpent) || 0), 0) / attempts.length) : 0

  const questionStats = (quiz.questions || []).map((q) => {
    let attempted = 0, correct = 0, incorrect = 0, timeSum = 0, timeCount = 0
    attempts.forEach((a) => {
      const ans = a.answers?.[q.id]
      const qt = a.questionTimes?.[q.id]
      if (ans !== undefined && ans !== null) {
        attempted += 1
        if (Number(ans) === Number(q.correctAnswer)) correct += 1
        else incorrect += 1
      }
      if (qt != null) { timeSum += Number(qt) || 0; timeCount += 1 }
    })
    return { ...q, attempted, correct, incorrect, avgTime: timeCount ? Math.round(timeSum / timeCount) : null }
  })

  return (
    <Card className="border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 xl:col-span-1">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Quiz analytics</h3>
          <p className="mt-1 text-sm text-muted-foreground">{quiz.title}</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onClose} className="gap-1.5"><X className="h-4 w-4" /> Close</Button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-100 p-3 text-center dark:border-slate-800">
          <p className="text-xs text-muted-foreground">Attempted</p>
          <p className="mt-1 text-xl font-semibold">{attempts.length}</p>
        </div>
        <div className="rounded-xl border border-slate-100 p-3 text-center dark:border-slate-800">
          <p className="text-xs text-muted-foreground">Avg score (A1)</p>
          <p className="mt-1 text-xl font-semibold">{avgScore}%</p>
        </div>
        <div className="rounded-xl border border-slate-100 p-3 text-center dark:border-slate-800">
          <p className="text-xs text-muted-foreground">Avg time</p>
          <p className="mt-1 text-xl font-semibold">{formatDuration(avgTime)}</p>
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-semibold">Question-wise analytics</h4>
        <div className="mt-3 space-y-2">
          {questionStats.map((q, i) => (
            <div key={q.id} className="rounded-xl border border-slate-100 p-3 text-sm dark:border-slate-800">
              <p className="font-medium">Q{i + 1}. {q.question}</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                <span>Attempted: <b>{q.attempted}</b></span>
                <span className="text-emerald-600">Correct: <b>{q.correct}</b></span>
                <span className="text-rose-600">Incorrect: <b>{q.incorrect}</b></span>
                <span>Avg time: <b>{formatDuration(q.avgTime)}</b></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-semibold">Student attempts</h4>
        <p className="mt-1 text-xs text-muted-foreground">Attempt 1 is final (details stored). Attempt 2 is practice (marks only, no answers stored).</p>
        {attempts.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No attempts yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {attempts.map((a) => {
              const open = expanded === a.id
              return (
                <div key={a.id} className="rounded-xl border border-slate-100 dark:border-slate-800">
                  <button type="button" onClick={() => setExpanded(open ? null : a.id)} className="w-full p-3 text-left">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{a.studentName || a.studentId}</p>
                        <p className="text-xs text-muted-foreground">A1: {a.score}/{a.totalPoints} ({a.percentage}%) · {a.submittedAt ? new Date(a.submittedAt).toLocaleString() : "—"}</p>
                        <p className="text-xs text-muted-foreground">A2 (practice): {a.attempt2Percentage != null ? `${a.attempt2Marks}/${a.attempt2TotalPoints} (${a.attempt2Percentage}%)` : "—"} {a.attempt2SubmittedAt ? `· ${new Date(a.attempt2SubmittedAt).toLocaleString()}` : ""}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={a.percentage >= 50 ? "default" : "secondary"}>Final {a.percentage}%</Badge>
                        <span className="text-xs text-blue-600">{open ? "Hide" : "Details"}</span>
                      </div>
                    </div>
                  </button>
                  {open && (
                    <div className="border-t border-slate-100 p-3 dark:border-slate-800">
                      <p className="mb-2 text-xs text-muted-foreground">Attempt 1 — Started: {a.startedAt ? new Date(a.startedAt).toLocaleString() : "—"} · Submitted: {a.submittedAt ? new Date(a.submittedAt).toLocaleString() : "—"} · Time: {formatDuration(a.timeSpent)}</p>
                      {a.attempt2Percentage != null && <p className="mb-2 text-xs text-amber-700 dark:text-amber-300">Attempt 2 (practice, marks only): {a.attempt2Marks}/{a.attempt2TotalPoints} ({a.attempt2Percentage}%) · Time: {formatDuration(a.attempt2TimeSpent)}</p>}
                      <div className="space-y-2">
                        {(quiz.questions || []).map((q, i) => {
                          const ans = a.answers?.[q.id]
                          const correct = ans !== undefined && Number(ans) === Number(q.correctAnswer)
                          const qTime = a.questionTimes?.[q.id]
                          return (
                            <div key={q.id} className={`rounded-lg border p-2 text-xs ${ans === undefined ? "border-slate-200 dark:border-slate-700" : correct ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-500/5" : "border-rose-200 bg-rose-50/40 dark:border-rose-900/40 dark:bg-rose-500/5"}`}>
                              <p className="font-medium">Q{i + 1}. {q.question}</p>
                              <p className="mt-1">Answer (A1): {ans !== undefined ? (q.options?.[ans] ?? ans) : "Not answered"} {ans !== undefined ? (correct ? "✓" : "✗") : ""}</p>
                              <p>Correct: {q.options?.[q.correctAnswer]}</p>
                              <p>Time taken (A1): {formatDuration(qTime)}</p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Card>
  )
}
