"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { useNavigate } from "react-router-dom"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTrigger, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { API_BASE_URL } from "@/lib/api"

export const QuizInterface = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Find the current active quiz for this student
  const [quiz, setQuiz] = useState(null)
  const [attempts, setAttempts] = useState([])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [showResults, setShowResults] = useState(false)
  const [timer, setTimer] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)

  useEffect(() => {
    // Fetch available quizzes for the student
    const fetchQuizzes = async () => {
      if (!user) return
      try {
        const response = await fetch(`${API_BASE_URL}/quizzes`, {
          credentials: "include"
        })
        const data = await response.json()
        setQuiz(data.find((q) => !attempts.some((a) => a.quizId === q.id && a.studentId === user.id)) || null)
        setAttempts(data.attempts || [])
      } catch (error) {
        console.error("Failed to fetch quizzes:", error)
      }
    }

    fetchQuizzes()
  }, [user, attempts])

  useEffect(() => {
    if (quiz) {
      setTimer(quiz.timeLimit * 60)
      setIsTimerRunning(true)
      const startTime = new Date()
      setTimer(quiz.timeLimit * 60)

      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            setIsTimerRunning(false)
            setShowResults(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [quiz])

  useEffect(() => {
    // Fetch existing attempt if student has already taken this quiz
    const fetchExistingAttempt = async () => {
      if (!quiz || !user) return
      try {
        const response = await fetch(`${API_BASE_URL}/quizzes/${quiz.id}/my-attempts`, {
          credentials: "include"
        })
        const data = await response.json()
        const existingAttempt = data.attempts.find((a) => a.quizId === quiz.id)
        if (existingAttempt) {
          setSelectedAnswers(existingAttempt.answers || {})
          setShowResults(true)
        }
      } catch (error) {
        console.error("Failed to fetch attempt:", error)
      }
    }

    fetchExistingAttempt()
  }, [quiz, user])

  const handleAnswerChange = (questionId, answer) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }))
  }

  const handleSubmit = async () => {
    if (!quiz) {
      alert("Quiz not found")
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/quizzes/${quiz.id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          answers: selectedAnswers,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setShowResults(true)
        // Store the attempt for later reference
        setAttempts((prev) => [result.attempt, ...prev.filter((a) => a.quizId !== quiz.id)])
      } else {
        alert(result.message || "Failed to submit quiz")
      }
    } catch (error) {
      alert("Failed to submit quiz. Please try again.")
    }
  }

  if (!quiz) {
    return <div className="p-6">No active quizzes available</div>
  }

  // If student has already attempted or just submitted
  if (showResults) {
    const attempt = attempts.find((a) => a.quizId === quiz.id)
    const percentage = attempt ? ((attempt.score / quiz.totalMarks) * 100).toFixed(2) : "0"
    const wrongQuestions = quiz.questions.filter((q) => {
      const studentAnswer = selectedAnswers[q.id]
      return studentAnswer !== q.correctAnswer
    })

    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Quiz Results</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <div className="text-3x font-bold">{attempt ? attempt.score : 0}</div>
            <div className="text-sm text-gray-500">Score</div>
          </div>
          <div>
            <div className="text-3x font-bold">{percentage}%</div>
            <div className="text-sm text-gray-500">Percentage</div>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogHeader>
            <AlertDialogTitle>Quiz Completed</AlertDialogTitle>
            <AlertDialogDescription>
              You scored {attempt ? attempt.score : 0}/{quiz.totalMarks}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogContent>
            <p>Here are the questions you got wrong:</p>
            {wrongQuestions.map((q) => (
              <div key={q.id} className="p-3 rounded-md border border-red-200 mb-2">
                <p className="font-medium">{q.question}</p>
                <p className="text-sm text-red-600 mb-1">
                  Your answer: {selectedAnswers[q.id] !== undefined ? `Option ${selectedAnswers[q.id] + 1}` : 'Not answered'}
                </p>
                <p className="text-sm text-green-600">
                  Correct answer: Option {q.correctAnswer + 1}
                </p>
              </div>
            ))}
          </AlertDialogContent>

          <AlertDialogFooter>
            <AlertDialogAction onClickDefault onClick={() => navigate('/')}>
              Done
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialog>
      </div>
    )
  }

  // Timer helper
  const minutes = Math.floor(timer / 60)
  const seconds = timer % 60

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">
        {quiz.title}
        <Badge variant="secondary" className="ml-2">
          {minutes}:{seconds < 10 ? "0" + seconds : seconds}
        </Badge>
      </h2>

      {!isTimerRunning && (
        <p className="text-red-500">Time's up!</p>
      )}

      {isTimerRunning && !showResults && (
        <Card className="p-4 mb-4">
          <form>
            <Select onValueChange={(val) => handleAnswerChange(quiz.questions[questionIndex].id, val)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {quiz.questions[questionIndex].options.map((option, idx) => (
                  <SelectItem key={idx} value={idx}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </form>
        </Card>
      )}

      {isTimerRunning && showResults && (
        <Card className="p-4">
          <h3 className="font-medium mb-2">Review Your Answers</h3>
          {quiz.questions.map((q, idx) => {
            const studentAnswer = selectedAnswers[q.id]
            const isCorrect = studentAnswer === q.correctAnswer
            return (
              <div key={q.id} className="p-3 rounded-md mb-2" style={{ borderColor: isCorrect ? 'green-200' : 'red-200' }}>
                <p className="font-medium">{q.question}</p>
                <p className="text-sm">
                  Your answer: {studentAnswer !== undefined ? `Option ${studentAnswer + 1}` : 'Not answered'}
                  {isCorrect ? ' (Correct)' : ' (Wrong)'}
                </p>
              </div>
            )
          })}
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={timer > 0}
          >
            Submit Quiz
          </Button>
        </Card>
      )}
    </div>
  )
}