"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { CheckCircle2, ChevronLeft, ChevronRight, Clock3, Send } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useQuiz } from "@/lib/quiz-context"
import { useAuth } from "@/lib/auth-context"

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
  if (start && !Number.isNaN(start.getTime()) && now < start) return "upcoming"
  if (end && !Number.isNaN(end.getTime()) && now > end) return "ended"
  return "active"
}

export const QuizInterface = () => {
  const { user } = useAuth()
  const { getQuizzesByBatch, getAttemptsByStudent, submitQuizAttempt } = useQuiz()
  const quizzes = getQuizzesByBatch(user?.batchId)
  const attempts = getAttemptsByStudent(user?.id)

  const [selectedQuizId, setSelectedQuizId] = useState(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)
  const [sessionReady, setSessionReady] = useState(false)
  const [now, setNow] = useState(new Date())
  const autoSubmittedRef = useRef(false)

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!selectedQuizId && quizzes[0]?.id) setSelectedQuizId(quizzes[0].id)
  }, [selectedQuizId, quizzes])

  const selectedQuiz = quizzes.find((quiz) => quiz.id === selectedQuizId) || null
  const existingAttempt = attempts.find((attempt) => attempt.quizId === selectedQuizId) || null
  const quizStatus = selectedQuiz ? getQuizStatus(selectedQuiz, now) : "inactive"
  const canTake = selectedQuiz && !existingAttempt && quizStatus === "active"

  useEffect(() => {
    if (!selectedQuiz) return
    const attempt = attempts.find((a) => a.quizId === selectedQuiz.id)
    setQuestionIndex(0)
    setAnswers(attempt?.answers ? { ...attempt.answers } : {})
    setResult(attempt || null)
    setSubmitted(Boolean(attempt))
    setSessionReady(false)
    autoSubmittedRef.current = false
    setTimeLeft((selectedQuiz.timeLimit || 0) * 60)
    if (!attempt && getQuizStatus(selectedQuiz, new Date()) === "active") {
      setSessionReady(true)
    }
  }, [selectedQuizId, selectedQuiz, attempts])

  useEffect(() => {
    if (!selectedQuiz || submitted || existingAttempt || !sessionReady || quizStatus !== "active") return
    if (timeLeft <= 0) return
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [selectedQuiz, submitted, existingAttempt, sessionReady, quizStatus, timeLeft])

  const currentQuestion = selectedQuiz?.questions?.[questionIndex]

  const handleSelect = (questionId, optionIndex) => {
    if (submitted || existingAttempt || quizStatus !== "active") return
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
    return {
      id: `attempt-${Date.now()}`,
      quizId: selectedQuiz.id,
      studentId: user?.id,
      studentName: user?.name,
      answers,
      score,
      totalPoints,
      percentage,
      submittedAt: new Date().toISOString(),
    }
  }

  const handleSubmit = (auto = false) => {
    if (!selectedQuiz || submitted || existingAttempt) return
    if (!auto && quizStatus !== "active") return
    if (auto && autoSubmittedRef.current) return
    if (auto) autoSubmittedRef.current = true
    const res = calculateResult()
    submitQuizAttempt(res)
    setResult(res)
    setSubmitted(true)
    setSessionReady(false)
  }

  useEffect(() => {
    if (!submitted && !existingAttempt && selectedQuiz && sessionReady && quizStatus === "active" && timeLeft === 0) {
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

  if (!quizzes.length) {
    return (
      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white/90 p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
          <h2 className="text-2xl font-semibold tracking-tight">No quizzes available</h2>
          <p className="mt-2 text-sm text-muted-foreground">Your teacher hasn&apos;t assigned any quizzes yet.</p>
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
                      {attempt ? (
                        <Badge variant="secondary">{attempt.percentage}%</Badge>
                      ) : (
                        <Badge variant={status === "active" ? "default" : "secondary"} className="capitalize">{status}</Badge>
                      )}
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
                  {!result ? (
                    !canTake ? (
                      <div className="space-y-4">
                        <div className={`rounded-2xl border p-5 ${quizStatus === "upcoming" ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-500/10 dark:text-amber-200" : quizStatus === "ended" ? "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200" : "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900/50 dark:bg-blue-500/10 dark:text-blue-200"}`}>
                          <p className="font-medium capitalize">{quizStatus === "active" ? "Quiz not available" : `Quiz ${quizStatus}`}</p>
                          <p className="mt-1 text-sm opacity-90">
                            {quizStatus === "upcoming" && `This quiz will start at ${formatDateTime(selectedQuiz.startTime)}.`}
                            {quizStatus === "ended" && `This quiz ended at ${formatDateTime(selectedQuiz.endTime)}.`}
                            {quizStatus === "inactive" && "This quiz is currently inactive."}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                          <p className="text-sm font-medium">Schedule</p>
                          <p className="mt-1 text-sm text-muted-foreground">Start: {formatDateTime(selectedQuiz.startTime)}</p>
                          <p className="text-sm text-muted-foreground">End: {formatDateTime(selectedQuiz.endTime)}</p>
                          <p className="mt-2 text-xs text-slate-500">You can take the quiz only during the scheduled window.</p>
                        </div>
                      </div>
                    ) : (
                      <>
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
                            <Button onClick={() => handleSubmit(false)} className="gap-2">
                              <Send className="h-4 w-4" /> Submit quiz
                            </Button>
                          )}
                        </div>
                      </>
                    )
                  ) : (
                    <div className="space-y-6">
                      <div className="grid gap-4 sm:grid-cols-3">
                        <ResultStat label="Score" value={`${result.score}/${result.totalPoints}`} />
                        <ResultStat label="Percentage" value={`${result.percentage}%`} />
                        <ResultStat label="Wrong answers" value={wrongQuestions.length} />
                      </div>

                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-500/10 dark:text-emerald-200">
                        <div className="flex items-center gap-2 font-medium">
                          <CheckCircle2 className="h-5 w-5" /> Quiz submitted successfully
                        </div>
                        <p className="mt-1 text-sm opacity-90">Review your answers below to see what went wrong and the correct solutions.</p>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold tracking-tight">Review answers</h3>
                        {selectedQuiz.questions.map((q, idx) => {
                          const studentAnswer = result.answers?.[q.id]
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

                      {wrongQuestions.length === 0 && (
                        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900/50 dark:bg-blue-500/10 dark:text-blue-200">
                          Perfect score! You answered every question correctly.
                        </div>
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