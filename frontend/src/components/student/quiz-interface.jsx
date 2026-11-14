"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { CheckCircle2, ChevronLeft, ChevronRight, Clock3, Loader2, RotateCcw, Send } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useQuiz } from "@/lib/quiz-context"
import { useAuth } from "@/lib/auth-context"
import { classesApi } from "@/lib/api"

const formatTime = (seconds) => {
  const mins = Math.floor(Math.max(0, seconds) / 60)
  const secs = Math.max(0, seconds) % 60
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
}

const formatDateTime = (value) => {
  if (!value) return "Not set"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "Not set"
  return d.toLocaleString()
}

const getQuizStatus = (quiz, now = new Date()) => {
  if (!quiz?.isActive) return "inactive"
  const start = quiz.startTime ? new Date(quiz.startTime) : null
  const end = quiz.endTime ? new Date(quiz.endTime) : null
  const hasStart = start && !Number.isNaN(start.getTime())
  const hasEnd = end && !Number.isNaN(end.getTime())
  if (!hasStart && !hasEnd) return "active"
  if (hasStart && now < start) return "upcoming"
  if (hasEnd && now > end) return "ended"
  return "active"
}

export const QuizInterface = () => {
  const { user, token } = useAuth()
  const { getQuizzesByBatch, getAttemptsByStudent, submitQuizAttempt, loading, error } = useQuiz()
  const [batchIds, setBatchIds] = useState(user?.batchId ? [user.batchId] : [])
  const quizzes = useMemo(() => getQuizzesByBatch(batchIds), [getQuizzesByBatch, batchIds])
  const attempts = useMemo(() => getAttemptsByStudent(user?.id), [getAttemptsByStudent, user?.id])

  const [selectedQuizId, setSelectedQuizId] = useState(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)
  const [sessionReady, setSessionReady] = useState(false)
  const [isPractice, setIsPractice] = useState(false)
  const [practiceResult, setPracticeResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [now, setNow] = useState(new Date())
  const autoSubmittedRef = useRef(false)
  const startedAtRef = useRef(null)
  const questionEnterRef = useRef(null)
  const questionTimesRef = useRef({})
  const prevQuestionIdRef = useRef(null)

  useEffect(() => {
    let mounted = true
    const loadBatches = async () => {
      if (!token) { setBatchIds(user?.batchId ? [user.batchId] : []); return }
      try {
        const res = await classesApi.getClasses(token)
        const list = Array.isArray(res?.data) ? res.data : (res?.data?.classes || [])
        const ids = list.map((c) => c.id).filter(Boolean)
        if (mounted) setBatchIds(ids.length ? ids : (user?.batchId ? [user.batchId] : []))
      } catch {
        if (mounted) setBatchIds(user?.batchId ? [user.batchId] : [])
      }
    }
    loadBatches()
    return () => { mounted = false }
  }, [token, user?.batchId])

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!selectedQuizId && quizzes[0]?.id) setSelectedQuizId(quizzes[0].id)
  }, [selectedQuizId, quizzes])

  const selectedQuiz = quizzes.find((quiz) => quiz.id === selectedQuizId) || null
  const existingAttempt = attempts.find((attempt) => attempt.quizId === selectedQuizId) || null
  const hasReattempted = existingAttempt?.attempt2Percentage != null
  const quizStatus = selectedQuiz ? getQuizStatus(selectedQuiz, now) : "inactive"
  const isOpen = quizStatus === "active"
  const activeSession = sessionReady && !submitted
  const canTake = selectedQuiz && !existingAttempt && isOpen && sessionReady
  const canStart = selectedQuiz && !existingAttempt && isOpen && !sessionReady
  const canStartPractice = selectedQuiz && existingAttempt && !hasReattempted && isOpen && !sessionReady

  const flushQuestionTime = (qId) => {
    if (!qId || !questionEnterRef.current) return
    const delta = Math.max(0, Math.round((Date.now() - questionEnterRef.current) / 1000))
    questionTimesRef.current[qId] = (questionTimesRef.current[qId] || 0) + delta
    questionEnterRef.current = Date.now()
  }

  const startQuiz = (practice = false) => {
    if (!selectedQuiz) return
    if (practice) {
      if (!existingAttempt || hasReattempted) return
    } else {
      if (existingAttempt) return
    }
    const status = getQuizStatus(selectedQuiz, new Date())
    if (status !== "active") return
    setAnswers({})
    setQuestionIndex(0)
    setTimeLeft(Math.max(1, Number(selectedQuiz.timeLimit) || 30) * 60)
    setSessionReady(true)
    setSubmitted(false)
    setResult(null)
    setIsPractice(practice)
    setPracticeResult(null)
    autoSubmittedRef.current = false
    startedAtRef.current = new Date().toISOString()
    questionTimesRef.current = {}
    questionEnterRef.current = Date.now()
    prevQuestionIdRef.current = selectedQuiz.questions?.[0]?.id || null
  }

  useEffect(() => {
    if (!selectedQuiz) return
    const attempt = attempts.find((a) => a.quizId === selectedQuiz.id)
    setQuestionIndex(0)
    setAnswers(attempt?.answers ? { ...attempt.answers } : {})
    setResult(attempt || null)
    setPracticeResult(null)
    setIsPractice(false)
    setSubmitted(Boolean(attempt))
    setSessionReady(false)
    autoSubmittedRef.current = false
    startedAtRef.current = attempt?.startedAt || null
    questionTimesRef.current = attempt?.questionTimes || {}
    questionEnterRef.current = null
    prevQuestionIdRef.current = null
    setTimeLeft((selectedQuiz.timeLimit || 0) * 60)
  }, [selectedQuizId, existingAttempt?.id])

  useEffect(() => {
    if (!selectedQuiz || submitted || !sessionReady || quizStatus !== "active") return
    if (timeLeft <= 0) return
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [selectedQuiz?.id, submitted, sessionReady, quizStatus, timeLeft])

  const currentQuestion = selectedQuiz?.questions?.[questionIndex]

  useEffect(() => {
    if (!sessionReady || submitted || !currentQuestion) return
    if (prevQuestionIdRef.current && prevQuestionIdRef.current !== currentQuestion.id) {
      flushQuestionTime(prevQuestionIdRef.current)
    }
    if (!questionEnterRef.current) questionEnterRef.current = Date.now()
    prevQuestionIdRef.current = currentQuestion.id
  }, [currentQuestion?.id, sessionReady, submitted])

  const handleSelect = (questionId, optionIndex) => {
    if (submitted || !sessionReady || quizStatus !== "active") return
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }))
  }

  const calculateResult = () => {
    if (!selectedQuiz) return null
    let score = 0
    let totalPoints = 0
    selectedQuiz.questions.forEach((q) => {
      totalPoints += q.points || q.marks || 1
      if (answers[q.id] === q.correctAnswer) score += q.points || q.marks || 1
    })
    const percentage = totalPoints ? Math.round((score / totalPoints) * 100) : 0
    const totalSeconds = Math.max(1, Number(selectedQuiz.timeLimit) || 30) * 60
    const elapsed = Math.max(0, totalSeconds - Math.max(0, timeLeft))
    const qTimes = { ...questionTimesRef.current }
    if (currentQuestion && questionEnterRef.current) {
      const delta = Math.max(0, Math.round((Date.now() - questionEnterRef.current) / 1000))
      qTimes[currentQuestion.id] = (qTimes[currentQuestion.id] || 0) + delta
    }
    return {
      id: `attempt-${Date.now()}`,
      quizId: selectedQuiz.id,
      studentId: user?.id,
      studentName: user?.name,
      answers,
      score,
      totalPoints,
      percentage,
      timeSpent: elapsed,
      startedAt: startedAtRef.current || new Date().toISOString(),
      questionTimes: qTimes,
      submittedAt: new Date().toISOString(),
    }
  }

  const handleSubmit = async (auto = false) => {
    if (!selectedQuiz || submitted || !sessionReady || submitting) return
    if (!auto && quizStatus !== "active") return
    if (auto && autoSubmittedRef.current) return
    if (auto) autoSubmittedRef.current = true
    if (currentQuestion) flushQuestionTime(currentQuestion.id)
    questionEnterRef.current = null
    const res = calculateResult()
    setSubmitting(true)
    setSubmitError("")
    try {
      const saved = await submitQuizAttempt(res, { isPractice })
      const finalRes = { ...res, ...(saved || {}), questionResults: saved?.questionResults || res.questionResults }
      if (isPractice) {
        setPracticeResult(finalRes)
      } else {
        setResult(finalRes)
      }
      setSubmitted(true)
      setSessionReady(false)
    } catch (e) {
      setSubmitError(e?.message || "Failed to submit quiz")
      autoSubmittedRef.current = false
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (!submitted && selectedQuiz && sessionReady && quizStatus === "active" && timeLeft === 0) {
      handleSubmit(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, sessionReady, quizStatus])

  const wrongQuestions = useMemo(() => {
    if (!selectedQuiz || !result) return []
    return selectedQuiz.questions
      .map((q) => ({
        ...q,
        studentAnswer: result.answers?.[q.id],
        isCorrect: result.answers?.[q.id] === q.correctAnswer,
      }))
      .filter((q) => !q.isCorrect)
  }, [selectedQuiz, result])

  const answeredCount = Object.keys(answers).length
  const progress = selectedQuiz ? Math.round((answeredCount / selectedQuiz.questions.length) * 100) : 0

  if (!token) {
    return (
      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center text-amber-900 dark:border-amber-900/40 dark:bg-amber-500/10 dark:text-amber-100">
          <h2 className="text-xl font-semibold">Login required</h2>
          <p className="mt-2 text-sm">Please log in with your student account to load quizzes from the database.</p>
        </div>
      </main>
    )
  }

  if (loading && !quizzes.length) {
    return (
      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-white/90 p-10 text-sm text-muted-foreground shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading quizzes...
        </div>
      </main>
    )
  }

  if (!quizzes.length) {
    return (
      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white/90 p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
          <h2 className="text-2xl font-semibold tracking-tight">No quizzes available</h2>
          <p className="mt-2 text-sm text-muted-foreground">Your teacher hasn&apos;t assigned any quizzes for your batch yet, or the quiz window is not visible.</p>
          {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-full bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <Card className="h-fit border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
            <div className="mb-4">
              <h2 className="text-lg font-semibold tracking-tight">Quizzes</h2>
              <p className="mt-1 text-sm text-muted-foreground">Select a quiz to start or review.</p>
            </div>
            <div className="space-y-2">
              {quizzes.map((quiz) => {
                const attempt = attempts.find((a) => a.quizId === quiz.id)
                const active = quiz.id === selectedQuizId
                const status = getQuizStatus(quiz, now)
                return (
                  <button
                    key={quiz.id}
                    onClick={() => setSelectedQuizId(quiz.id)}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                      active
                        ? "border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-500/10"
                        : "border-slate-200 hover:border-blue-300 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-blue-900 dark:hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{quiz.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{quiz.questions.length} questions · {quiz.timeLimit} min</p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {status === "upcoming" ? `Starts: ${formatDateTime(quiz.startTime)}` : status === "ended" ? `Ended: ${formatDateTime(quiz.endTime)}` : `Ends: ${formatDateTime(quiz.endTime)}`}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {attempt ? <Badge variant="secondary">{attempt.percentage}%</Badge> : null}
                        <Badge variant={attempt ? "outline" : status === "active" ? "default" : "secondary"} className="capitalize">
                          {attempt ? "Attempted" : status}
                        </Badge>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </Card>

          <div className="space-y-6">
            {selectedQuiz && (
              <Card className="border-slate-200/80 bg-white/90 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
                <div className="flex flex-col gap-4 border-b border-slate-100 p-6 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-semibold tracking-tight">{selectedQuiz.title}</h2>
                      <Badge variant={result ? "secondary" : canTake ? "default" : "secondary"} className="capitalize">
                        {result ? "Completed" : quizStatus}
                      </Badge>
                      {existingAttempt && <Badge variant="outline">Attempted</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{selectedQuiz.description || "No description provided."}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      Starts: {formatDateTime(selectedQuiz.startTime)} · Ends: {formatDateTime(selectedQuiz.endTime)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium dark:border-slate-800 dark:bg-slate-900">
                      <Clock3 className="h-4 w-4 text-blue-600" />
                      {result ? "Finished" : canTake ? formatTime(timeLeft) : `${selectedQuiz.timeLimit} min`}
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                      {answeredCount}/{selectedQuiz.questions.length} answered
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {activeSession ? (
                    <>
                      {isPractice && (
                        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-500/10 dark:text-amber-200">
                          <p className="font-medium">Reattempt (practice)</p>
                          <p className="mt-0.5 opacity-90">This is attempt 2 for practice only. Marks will be recorded, but answers/options are not stored and your final attempt 1 score remains unchanged.</p>
                        </div>
                      )}
                      <div className="mb-6">
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-700 dark:text-slate-200">Question {questionIndex + 1} of {selectedQuiz.questions.length}</span>
                          <span className="text-muted-foreground">{progress}% complete</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${((questionIndex + 1) / selectedQuiz.questions.length) * 100}%` }} />
                        </div>
                      </div>

                      {currentQuestion && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium leading-relaxed">{currentQuestion.question}</h3>
                          <div className="grid gap-3">
                            {currentQuestion.options.map((option, idx) => {
                              const selected = answers[currentQuestion.id] === idx
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => handleSelect(currentQuestion.id, idx)}
                                  className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                                    selected
                                      ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600/20 dark:border-blue-500 dark:bg-blue-500/10"
                                      : "border-slate-200 hover:border-blue-300 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-blue-900 dark:hover:bg-slate-900"
                                  }`}
                                >
                                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold ${selected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
                                    {String.fromCharCode(65 + idx)}
                                  </span>
                                  <span className="text-sm sm:text-base">{option}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-6 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                        <Button variant="outline" onClick={() => setQuestionIndex((i) => Math.max(0, i - 1))} disabled={questionIndex === 0} className="gap-2">
                          <ChevronLeft className="h-4 w-4" /> Previous
                        </Button>

                        <div className="flex flex-wrap gap-2">
                          {selectedQuiz.questions.map((q, idx) => (
                            <button
                              key={q.id}
                              type="button"
                              onClick={() => setQuestionIndex(idx)}
                              className={`h-9 w-9 rounded-lg border text-sm font-medium transition ${
                                idx === questionIndex
                                  ? "border-blue-600 bg-blue-600 text-white"
                                  : answers[q.id] !== undefined
                                  ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-500/10 dark:text-blue-300"
                                  : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
                              }`}
                            >
                              {idx + 1}
                            </button>
                          ))}
                        </div>

                        {questionIndex < selectedQuiz.questions.length - 1 ? (
                          <Button onClick={() => setQuestionIndex((i) => Math.min(selectedQuiz.questions.length - 1, i + 1))} className="gap-2">
                            Next <ChevronRight className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button onClick={() => handleSubmit(false)} className="gap-2" disabled={submitting}>
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} {isPractice ? "Submit reattempt" : "Submit quiz"}
                          </Button>
                        )}
                      </div>
                      {submitError && <p className="mt-3 text-sm text-rose-600">{submitError}</p>}
                    </>
                  ) : canStart ? (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-blue-900 dark:border-blue-900/50 dark:bg-blue-500/10 dark:text-blue-200">
                        <p className="font-medium">Ready to start</p>
                        <p className="mt-1 text-sm opacity-90">This quiz is open. You have {selectedQuiz.timeLimit} minutes once you begin. Click below to start answering. <span className="font-medium">Attempt 1 marks will be your final score.</span></p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                        <p className="text-sm font-medium">Schedule</p>
                        <p className="mt-1 text-sm text-muted-foreground">Start: {formatDateTime(selectedQuiz.startTime)}</p>
                        <p className="text-sm text-muted-foreground">End: {formatDateTime(selectedQuiz.endTime)}</p>
                      </div>
                      <Button type="button" onClick={() => startQuiz(false)} className="gap-2">
                        <Clock3 className="h-4 w-4" /> Start quiz
                      </Button>
                    </div>
                  ) : !existingAttempt ? (
                    <div className="space-y-4">
                      <div className={`rounded-2xl border p-5 ${quizStatus === "upcoming" ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-500/10 dark:text-amber-200" : quizStatus === "ended" ? "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200" : "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900/50 dark:bg-blue-500/10 dark:text-blue-200"}`}>
                        <p className="font-medium capitalize">Quiz {quizStatus}</p>
                        <p className="mt-1 text-sm opacity-90">
                          {quizStatus === "upcoming" && `This quiz will start at ${formatDateTime(selectedQuiz.startTime)}.`}
                          {quizStatus === "ended" && `This quiz ended at ${formatDateTime(selectedQuiz.endTime)}.`}
                          {quizStatus === "inactive" && "This quiz is currently inactive."}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                        <p className="text-sm font-medium">Schedule</p>
                        <p className="mt-1 text-sm text-muted-foreground">Start: {formatDateTime(selectedQuiz.startTime)}</p>
                        <p className="mt-1 text-sm text-muted-foreground">End: {formatDateTime(selectedQuiz.endTime)}</p>
                        <p className="mt-2 text-xs text-slate-500">You can take the quiz only during the scheduled window.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Attempt summary */}
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <ResultStat label="Attempt 1 (final)" value={`${existingAttempt.score}/${existingAttempt.totalPoints}`} />
                        <ResultStat label="Attempt 1 %" value={`${existingAttempt.percentage}%`} />
                        <ResultStat label="Attempt 2 (practice)" value={existingAttempt.attempt2Percentage != null ? `${existingAttempt.attempt2Marks}/${existingAttempt.attempt2TotalPoints}` : "—"} />
                        <ResultStat label="Attempt 2 %" value={existingAttempt.attempt2Percentage != null ? `${existingAttempt.attempt2Percentage}%` : "—"} />
                      </div>

                      {isPractice && practiceResult ? (
                        <>
                          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/50 dark:bg-amber-500/10 dark:text-amber-200">
                            <div className="flex items-center gap-2 font-medium"><RotateCcw className="h-5 w-5" /> Practice reattempt submitted</div>
                            <p className="mt-1 text-sm opacity-90">Score: {practiceResult.score}/{practiceResult.totalPoints} ({practiceResult.percentage}%). Only attempt 2 marks are recorded; answers/options are not stored. Attempt 1 remains your final result.</p>
                          </div>
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold tracking-tight">Review (practice)</h3>
                            {selectedQuiz.questions.map((q, idx) => {
                              const studentAnswer = practiceResult.answers?.[q.id]
                              const correct = studentAnswer === q.correctAnswer
                              return (
                                <div key={q.id} className={`rounded-2xl border p-4 ${correct ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-500/5" : "border-rose-200 bg-rose-50/50 dark:border-rose-900/40 dark:bg-rose-500/5"}`}>
                                  <div className="mb-2 flex items-start justify-between gap-3">
                                    <p className="font-medium">{idx + 1}. {q.question}</p>
                                    <Badge variant={correct ? "default" : "destructive"}>{correct ? "Correct" : "Wrong"}</Badge>
                                  </div>
                                  <div className="space-y-1 text-sm">
                                    <p><span className="font-medium text-slate-700 dark:text-slate-200">Your answer:</span> {studentAnswer !== undefined ? q.options[studentAnswer] : "Not answered"}</p>
                                    <p><span className="font-medium text-slate-700 dark:text-slate-200">Correct answer:</span> {q.options[q.correctAnswer]}</p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-500/10 dark:text-emerald-200">
                            <div className="flex items-center gap-2 font-medium"><CheckCircle2 className="h-5 w-5" /> Attempt 1 (final) submitted</div>
                            <p className="mt-1 text-sm opacity-90">Attempt 1 details are stored as your final result. You may reattempt once for practice (marks recorded as attempt 2, no answers stored).</p>
                          </div>

                          {existingAttempt.answers && (
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold tracking-tight">Review answers (Attempt 1)</h3>
                              {selectedQuiz.questions.map((q, idx) => {
                                const studentAnswer = existingAttempt.answers?.[q.id]
                                const correct = studentAnswer === q.correctAnswer
                                return (
                                  <div key={q.id} className={`rounded-2xl border p-4 ${correct ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-500/5" : "border-rose-200 bg-rose-50/50 dark:border-rose-900/40 dark:bg-rose-500/5"}`}>
                                    <div className="mb-2 flex items-start justify-between gap-3">
                                      <p className="font-medium">{idx + 1}. {q.question}</p>
                                      <Badge variant={correct ? "default" : "destructive"}>{correct ? "Correct" : "Wrong"}</Badge>
                                    </div>
                                    <div className="space-y-1 text-sm">
                                      <p><span className="font-medium text-slate-700 dark:text-slate-200">Your answer:</span> {studentAnswer !== undefined ? q.options[studentAnswer] : "Not answered"}</p>
                                      <p><span className="font-medium text-slate-700 dark:text-slate-200">Correct answer:</span> {q.options[q.correctAnswer]}</p>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {canStartPractice ? (
                            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-500/10">
                              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Want to try again for practice?</p>
                              <p className="mt-1 text-sm text-blue-800/90 dark:text-blue-200/80">You can reattempt once. Correct/wrong will be shown after submit, only attempt 2 marks will be saved (no answers/options), and attempt 1 remains final.</p>
                              <Button type="button" onClick={() => startQuiz(true)} className="mt-3 gap-2" variant="outline">
                                <RotateCcw className="h-4 w-4" /> Reattempt (practice)
                              </Button>
                            </div>
                          ) : hasReattempted ? (
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                              Practice reattempt completed. Attempt 2 marks recorded: {existingAttempt.attempt2Marks}/{existingAttempt.attempt2TotalPoints} ({existingAttempt.attempt2Percentage}%). (Answers not stored.)
                            </div>
                          ) : null}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

function ResultStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  )
}