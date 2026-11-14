"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { quizzesApi } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

const QuizContext = createContext(undefined)

const toNumMaybe = (v) => {
  if (v === null || v === undefined || v === "") return v
  const n = Number(v)
  return Number.isNaN(n) ? v : n
}

const normalizeQuestion = (q) => {
  const correct = q.correctAnswer
  let correctAnswer = correct
  if (typeof correct === "string" && correct !== "" && !Number.isNaN(Number(correct))) {
    correctAnswer = Number(correct)
  }
  return {
    ...q,
    options: Array.isArray(q.options) ? q.options : [],
    correctAnswer,
    points: Number(q.points ?? q.marks ?? 1),
    marks: Number(q.marks ?? q.points ?? 1),
  }
}

const extractAnswersMap = (answers) => {
  if (!answers || typeof answers !== "object") return {}
  // If stored as per-question result objects { qid: { studentAnswer, ... } }
  const values = Object.values(answers)
  if (values.length && values[0] && typeof values[0] === "object" && ("studentAnswer" in values[0] || "isCorrect" in values[0])) {
    const map = {}
    Object.entries(answers).forEach(([qid, v]) => { map[qid] = v?.studentAnswer })
    return map
  }
  return answers
}

const normalizeAttempt = (a) => {
  if (!a) return null
  const answers = extractAnswersMap(a.answers)
  const score = Number(a.score ?? 0)
  const totalPoints = Number(a.totalMarks ?? a.totalPoints ?? 0)
  const pct = a.percentageScore != null ? Number(a.percentageScore) : (a.percentage != null ? Number(a.percentage) : (totalPoints ? (score / totalPoints) * 100 : 0))
  return {
    ...a,
    quizId: a.quizId || a.quiz?.id,
    studentId: a.userId || a.studentId || a.user?.id,
    studentName: a.studentName || a.user?.name,
    score,
    totalMarks: totalPoints,
    totalPoints,
    percentage: Number(Number(pct).toFixed ? Number(Number(pct).toFixed(2)) : pct),
    answers,
    questionTimes: a.questionTimes || {},
    timeSpent: a.timeSpent != null ? Number(a.timeSpent) : (a.timeSpentMinutes != null ? Number(a.timeSpentMinutes) * 60 : null),
    startedAt: a.startedAt || null,
    submittedAt: a.completedAt || a.submittedAt || null,
    attempt2Marks: a.attempt2Marks ?? a.attempt2Score ?? null,
    attempt2TotalPoints: a.attempt2TotalPoints ?? a.attempt2TotalMarks ?? null,
    attempt2Percentage: a.attempt2Percentage != null ? Number(a.attempt2Percentage) : null,
    attempt2SubmittedAt: a.attempt2SubmittedAt ?? a.attempt2CompletedAt ?? null,
    attempt2TimeSpent: a.attempt2TimeSpent != null ? Number(a.attempt2TimeSpent) : (a.attempt2TimeSpentMinutes != null ? Number(a.attempt2TimeSpentMinutes) * 60 : null),
  }
}

const normalizeQuiz = (q) => {
  if (!q) return null
  const questions = Array.isArray(q.questions) ? q.questions.map(normalizeQuestion) : []
  const myAttempt = normalizeAttempt(q.myAttempt || (Array.isArray(q.attempts) && q.attempts[0]) || q.attempt)
  return {
    ...q,
    batchId: q.batchId || q.classId || q.class?.id,
    classId: q.classId || q.class?.id,
    teacherId: q.teacherId || q.class?.teacherId || q.class?.teacher?.id,
    teacherName: q.teacherName || q.class?.teacher?.name,
    questions,
    isActive: q.isActive !== undefined ? q.isActive : true,
    isApproved: q.isApproved !== undefined ? q.isApproved : true,
    timeLimit: q.timeLimit != null ? Number(q.timeLimit) : q.timeLimit,
    myAttempt,
  }
}

export function QuizProvider({ children }) {
  const { token, user } = useAuth()
  const [quizzes, setQuizzes] = useState([])
  const [attemptsByQuiz, setAttemptsByQuiz] = useState({}) // quizId -> normalized attempts (teacher view)
  const [myAttempts, setMyAttempts] = useState([]) // student view
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const refreshQuizzes = useCallback(async () => {
    if (!token) { setQuizzes([]); return [] }
    setLoading(true); setError(null)
    try {
      const res = await quizzesApi.getQuizzes(token)
      const list = Array.isArray(res?.data) ? res.data : (res?.data?.quizzes || [])
      const norm = list.map(normalizeQuiz)
      setQuizzes(norm)
      // derive student attempts from myAttempt
      if (user?.role === 'student') {
        const mas = norm.map((q) => q.myAttempt).filter(Boolean).map((a) => normalizeAttempt(a))
        setMyAttempts(mas)
      }
      return norm
    } catch (e) {
      setError(e.message || 'Failed to load quizzes')
      setQuizzes([])
      return []
    } finally { setLoading(false) }
  }, [token, user?.role])

  const refreshMyAttempts = useCallback(async () => {
    if (!token || user?.role !== 'student') return []
    try {
      const res = await quizzesApi.getMyAttempts(token)
      const list = Array.isArray(res?.data) ? res.data : (res?.data?.attempts || [])
      const norm = list.map(normalizeAttempt)
      setMyAttempts(norm)
      return norm
    } catch { return [] }
  }, [token, user?.role])

  useEffect(() => { refreshQuizzes() }, [refreshQuizzes])

  const createQuiz = async (quiz) => {
    if (!token) throw new Error('Login required to create quiz')
    const payload = {
      title: quiz.title,
      description: quiz.description || '',
      classId: quiz.classId || quiz.batchId,
      batchId: quiz.batchId || quiz.classId,
      timeLimit: Number(quiz.timeLimit) || 30,
      startTime: quiz.startTime,
      endTime: quiz.endTime,
      isActive: quiz.isActive !== undefined ? quiz.isActive : true,
      questions: (quiz.questions || []).map((q, idx) => ({
        type: 'MULTIPLE_CHOICE',
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        marks: Number(q.points ?? q.marks ?? 1),
        order: idx + 1,
      })),
    }
    const res = await quizzesApi.createQuiz(payload, token)
    await refreshQuizzes()
    return normalizeQuiz(res?.data)
  }

  const updateQuiz = async (id, updates) => {
    if (!token) throw new Error('Login required to update quiz')
    const payload = { ...updates }
    if (updates.batchId || updates.classId) payload.classId = updates.classId || updates.batchId
    if (updates.questions) {
      payload.questions = updates.questions.map((q, idx) => ({
        type: q.type || 'MULTIPLE_CHOICE',
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        marks: Number(q.points ?? q.marks ?? 1),
        order: q.order || idx + 1,
      }))
    }
    const res = await quizzesApi.updateQuiz(id, payload, token)
    await refreshQuizzes()
    return normalizeQuiz(res?.data)
  }

  const deleteQuiz = async (id) => {
    if (!token) throw new Error('Login required to delete quiz')
    await quizzesApi.deleteQuiz(id, token)
    setQuizzes((prev) => prev.filter((q) => q.id !== id))
  }

  const submitQuizAttempt = async (attempt, { isPractice = false } = {}) => {
    if (!token) throw new Error('Login required to submit quiz')
    const payload = {
      answers: attempt.answers || {},
      timeSpent: attempt.timeSpent,
      startedAt: attempt.startedAt,
      questionTimes: attempt.questionTimes || {},
      isPractice,
    }
    const res = await quizzesApi.submitQuiz(attempt.quizId, payload, token)
    const data = res?.data || {}
    const norm = normalizeAttempt(data.attempt)
    // merge with question results for UI
    if (norm && data.questionResults) {
      norm.answers = Object.fromEntries(Object.entries(data.questionResults).map(([qid, v]) => [qid, v.studentAnswer]))
      norm.questionResults = data.questionResults
      norm.percentage = Number(data.percentage ?? norm.percentage)
    }
    if (isPractice) {
      setMyAttempts((prev) => prev.map((a) => a.quizId === attempt.quizId ? normalizeAttempt({ ...a, ...norm, answers: a.answers, questionTimes: a.questionTimes }) : a))
    } else {
      setMyAttempts((prev) => {
        const idx = prev.findIndex((a) => a.quizId === attempt.quizId)
        if (idx >= 0) { const copy = [...prev]; copy[idx] = norm; return copy }
        return [...prev, norm]
      })
    }
    // also update quiz.myAttempt cache
    setQuizzes((prev) => prev.map((q) => q.id === attempt.quizId ? { ...q, myAttempt: isPractice ? { ...(q.myAttempt || {}), ...norm, answers: q.myAttempt?.answers, questionTimes: q.myAttempt?.questionTimes } : norm } : q))
    return norm || data
  }

  const fetchQuizAttempts = useCallback(async (quizId) => {
    if (!token) return []
    const res = await quizzesApi.getQuizAttempts(quizId, token)
    const list = Array.isArray(res?.data) ? res.data : (res?.data?.attempts || [])
    const norm = list.map(normalizeAttempt)
    setAttemptsByQuiz((prev) => ({ ...prev, [quizId]: norm }))
    return norm
  }, [token])

  const approveQuizAttempt = async () => {}

  const getQuizzesByTeacher = useCallback((teacherId) => {
    return quizzes.filter((quiz) => !teacherId || quiz.teacherId === teacherId || quiz.class?.teacherId === teacherId)
  }, [quizzes])

  const getQuizzesByBatch = useCallback((batchIdOrIds) => {
    const ids = Array.isArray(batchIdOrIds) ? batchIdOrIds.filter(Boolean) : [batchIdOrIds].filter(Boolean)
    if (ids.length === 0) return []
    return quizzes.filter((quiz) => ids.includes(quiz.batchId) || ids.includes(quiz.classId))
  }, [quizzes])

  const getAttemptsByQuiz = useCallback((quizId) => {
    return attemptsByQuiz[quizId] || []
  }, [attemptsByQuiz])

  const getAttemptsByStudent = useCallback((studentId) => {
    return myAttempts.filter((a) => !studentId || a.studentId === studentId)
  }, [myAttempts])

  const getQuizById = useCallback((quizId) => quizzes.find((q) => q.id === quizId) || null, [quizzes])

  const toggleLeaderboardVisibility = async () => {}

  const value = useMemo(() => ({
    quizzes,
    attempts: myAttempts,
    loading,
    error,
    createQuiz,
    updateQuiz,
    deleteQuiz,
    submitQuizAttempt,
    approveQuizAttempt,
    getQuizzesByTeacher,
    getQuizzesByBatch,
    getAttemptsByQuiz,
    getAttemptsByStudent,
    getQuizById,
    toggleLeaderboardVisibility,
    refreshQuizzes,
    refreshMyAttempts,
    fetchQuizAttempts,
  }), [quizzes, myAttempts, loading, error, getQuizzesByTeacher, getQuizzesByBatch, getAttemptsByQuiz, getAttemptsByStudent, getQuizById, refreshQuizzes, refreshMyAttempts, fetchQuizAttempts])

  return (
    <QuizContext.Provider value={value}>
      {children}
    </QuizContext.Provider>
  )
}

export const useQuiz = () => {
  const context = useContext(QuizContext)
  if (context === undefined) {
    throw new Error("useQuiz must be used within a QuizProvider")
  }
  return context
}
