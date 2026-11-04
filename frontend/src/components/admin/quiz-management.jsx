"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

export const QuizManagement = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [quizzes, setQuizzes] = useState([])
  const [newQuizTitle, setNewQuizTitle] = useState("")

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Quiz Management</h2>

      <Card className="p-4 mb-4">
        <Input
          placeholder="Search quizzes..."
          value={newQuizTitle}
          onChange={(e) => setNewQuizTitle(e.target.value)}
          className="w-full mb-3"
        />
        <Button variant="primary" onClick={() => console.log('Create new quiz')}>
          Create Quiz
        </Button>
      </Card>

      <Card className="p-4">
        <h3 className="font-medium mb-2">Quizzes</h3>
        {quizzes.length === 0 && <p className="text-gray-500">No quizzes found</p>}
        <ul className="space-y-2">
          {quizzes.map((quiz) => (
            <li key={quiz.id} className="px-2 py-1 rounded">
              <Button
                variant="outline"
                size="sm"
                onClick={() => console.log('View quiz:', quiz.id)}
                style={{ width: '100%' }}
              >
                {quiz.title}
              </Button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}