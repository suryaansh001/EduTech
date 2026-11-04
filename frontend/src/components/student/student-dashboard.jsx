"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useQuiz } from "@/lib/quiz-context"

export const StudentDashboard = () => {
  const { user } = useAuth()
  const { quizzes, attempts, getQuizzesByBatch, getAttemptsByStudent } = useQuiz()

  const myAttempts = getAttemptsByStudent(user.id)

  useEffect(() => {
    // Fetch quizzes when component mounts
  }, [user.id])

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Welcome, {user.name}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="font-medium mb-2">My Quizzes</h3>
          {quizzes.length === 0 && <p className="text-gray-500">No quizzes available</p>}
          <ul className="space-y-2">
            {quizzes.map((quiz) => (
              <li key={quiz.id} className="px-2 py-1 rounded-hover transition-colors">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => console.log('Take quiz:', quiz.id)}
                  style={{ width: '100%' }}
                >
                  {quiz.title}
                </Button>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-4">
          <h3 className="font-medium mb-2">My Attempts</h3>
          {myAttempts.length === 0 && <p className="text-gray-500">No attempts yet</p>}
          <ul className="space-y-2">
            {myAttempts.map((attempt) => (
              <li key={attempt.id} className="px-2 py-1 rounded-hover transition-colors">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => console.log('View attempt:', attempt.id)}
                  style={{ width: '100%' }}
                >
                  {attempt.quizTitle || 'Unknown Quiz'} - {attempt.percentage}%
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}