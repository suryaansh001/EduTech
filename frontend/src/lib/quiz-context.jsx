"use client"

import { createContext, useContext, useState } from "react"

const QuizContext = createContext(undefined)

export function QuizProvider({ children }) {
  const [quizzes, setQuizzes] = useState([
    {
      id: "quiz1",
      title: "Mathematics - Calculus Basics",
      description: "Test your understanding of basic calculus concepts including derivatives and integrals",
      teacherId: "2",
      teacherName: "John Teacher",
      batchId: "batch1",
      questions: [
        {
          id: "q1",
          question: "What is the derivative of x²?",
          options: ["2x", "x", "2", "x²"],
          correctAnswer: 0,
          points: 10,
        },
        {
          id: "q2",
          question: "What is the integral of 2x?",
          options: ["x²", "x² + C", "2", "2x + C"],
          correctAnswer: 1,
          points: 10,
        },
      ],
      timeLimit: 30,
      startTime: "2024-01-20T09:00:00",
      endTime: "2024-01-20T10:00:00",
      isActive: true,
      createdAt: "2024-01-15T10:00:00",
      maxAttempts: 2,
      showLeaderboard: true,
      isApproved: true,
    },
    {
      id: "quiz2",
      title: "Physics - Quantum Mechanics",
      description: "Advanced quiz on quantum mechanics principles",
      teacherId: "2",
      teacherName: "John Teacher",
      batchId: "batch2",
      questions: [
        {
          id: "q3",
          question: "What is Planck's constant approximately?",
          options: ["6.626 × 10⁻³⁴ J·s", "3.14", "9.8 m/s²", "299,792,458 m/s"],
          correctAnswer: 0,
          points: 15,
        },
      ],
      timeLimit: 45,
      startTime: "2024-01-21T14:00:00",
      endTime: "2024-01-21T15:00:00",
      isActive: false,
      createdAt: "2024-01-16T14:00:00",
      maxAttempts: 1,
      showLeaderboard: false,
      isApproved: true,
    },
  ])

  const [attempts, setAttempts] = useState([
    {
      id: "attempt1",
      quizId: "quiz1",
      studentId: "3",
      studentName: "Jane Student",
      answers: [0, 1],
      score: 20,
      totalPoints: 20,
      percentage: 100,
      timeSpent: 1200, // 20 minutes
      submittedAt: "2024-01-20T09:25:00",
      isApproved: true,
    },
    {
      id: "attempt2",
      quizId: "quiz1",
      studentId: "4",
      studentName: "Bob Student",
      answers: [0, 0],
      score: 10,
      totalPoints: 20,
      percentage: 50,
      timeSpent: 1500, // 25 minutes
      submittedAt: "2024-01-20T09:30:00",
      isApproved: false,
    },
  ])

  const createQuiz = (quiz) => {
    const newQuiz = {
      ...quiz,
      id: `quiz${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    setQuizzes((prev) => [...prev, newQuiz])
  }

  const updateQuiz = (id, updates) => {
    setQuizzes((prev) => prev.map((quiz) => (quiz.id === id ? { ...quiz, ...updates } : quiz)))
  }

  const deleteQuiz = (id) => {
    setQuizzes((prev) => prev.filter((quiz) => quiz.id !== id))
    setAttempts((prev) => prev.filter((attempt) => attempt.quizId !== id))
  }

  const submitQuizAttempt = (attempt) => {
    const newAttempt = {
      ...attempt,
      id: `attempt${Date.now()}`,
      submittedAt: new Date().toISOString(),
    }
    setAttempts((prev) => [...prev, newAttempt])
  }

  const approveQuizAttempt = (attemptId) => {
    setAttempts((prev) =>
      prev.map((attempt) => (attempt.id === attemptId ? { ...attempt, isApproved: true } : attempt)),
    )
  }

  const getQuizzesByTeacher = (teacherId) => {
    return quizzes.filter((quiz) => quiz.teacherId === teacherId)
  }

  const getQuizzesByBatch = (batchId) => {
    return quizzes.filter((quiz) => quiz.batchId === batchId && quiz.isApproved)
  }

  const getAttemptsByQuiz = (quizId) => {
    return attempts.filter((attempt) => attempt.quizId === quizId)
  }

  const getAttemptsByStudent = (studentId) => {
    return attempts.filter((attempt) => attempt.studentId === studentId)
  }

  const toggleLeaderboardVisibility = (quizId, visible) => {
    updateQuiz(quizId, { showLeaderboard: visible })
  }

  return (
    <QuizContext.Provider
      value={{
        quizzes,
        attempts,
        createQuiz,
        updateQuiz,
        deleteQuiz,
        submitQuizAttempt,
        approveQuizAttempt,
        getQuizzesByTeacher,
        getQuizzesByBatch,
        getAttemptsByQuiz,
        getAttemptsByStudent,
        toggleLeaderboardVisibility,
      }}
    >
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
