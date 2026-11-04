"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useQuiz } from "@/lib/quiz-context"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export const QuizCreator = () => {
  const { user } = useAuth()
  const { quizzes, createQuiz, updateQuiz } = useQuiz()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    classId: "",
    timeLimit: 30,
    questions: []
  })

  const [editingQuizId, setEditingQuizId] = useState(null)
  const [newQuestion, setNewQuestion] = useState({
    question: "",
    type: "multiple_choice",
    options: ["", "", "", ""],
    correctAnswer: 0,
    marks: 1,
    order: 1
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const addQuestion = () => {
    setNewQuestion({
      question: "",
      type: "multiple_choice",
      options: ["", "", "", ""],
      correctAnswer: 0,
      marks: 1,
      order: newQuestion.order + 1
    })
  }

  const removeQuestion = (index) => {
    setNewQuestion(prev => {
      const questions = [...prev.questions]
      questions.splice(index, 1)
      return { questions, order: questions.length > 0 ? questions[questions.length - 1].order - 1 : 1 }
    })
  }

  const saveQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      questions: [...prev.questions, { ...newQuestion, id: Date.now() + Math.random() }]
    }))
    setNewQuestion({
      question: "",
      type: "multiple_choice",
      options: ["", "", "", ""],
      correctAnswer: 0,
      marks: 1,
      order: prev ? prev.order + 1 : 1
    })
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">Create Quiz</h2>

      <Card className="p-4 mb-4">
        <form>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Input
              placeholder="Quiz title"
              value={formData.title}
              onChange={handleChange}
              name="title"
              required
            />
            <Input
              placeholder="Description (optional)"
              value={formData.description}
              onChange={handleChange}
              name="description"
            />
            <Input
              placeholder="Time limit (minutes)"
              type="number"
              value={formData.timeLimit}
              onChange={handleChange}
              name="timeLimit"
            />
            <Select onValueChange={(val) => setFormData((prev) => ({ ...prev, classId: val }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {/* Class options would be fetched from API */}
                <SelectItem value="batch1">Batch 1</SelectItem>
                <SelectItem value="batch2">Batch 2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mb-4">
            <h3 className="font-medium mb-2">Questions</h3>
            {formData.questions.length > 0 ? (
              <div>
                {formData.questions.map((q, idx) => (
                  <Card key={q.id} className="p-3 mb-3">
                    <Input
                      placeholder="Question text"
                      value={q.question}
                      onChange={(e) => {
                        const questions = [...formData.questions]
                        questions[idx].question = e.target.value
                        setFormData({ ...formData, questions })
                      }}
                      name={`questions[${idx}][question]`
                    />
                    <Select onValueChange={(val) => {
                      const questions = [...formData.questions]
                      questions[idx].type = val
                      setFormData({ ...formData, questions })
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                        <SelectItem value="true_false">True/False</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {q.options.map((opt, i) => (
                        <Input
                          key={i}
                          placeholder={`Option ${i + 1}`}
                          value={opt || ""}
                          onChange={(e) => {
                            const questions = [...formData.questions]
                            questions[idx].options[i] = e.target.value
                            setFormData({ ...formData, questions })
                          }}
                          name={`questions[${idx}][options][${i}]`
                        />
                      ))}
                    </div>

                    <Select onValueChange={(val) => {
                      const questions = [...formData.questions]
                      questions[idx].correctAnswer = parseInt(val)
                      setFormData({ ...formData, questions })
                    }}>
                      <SelectTrigger>
                        <SelectValue defaultValue={q.correctAnswer} />
                      </SelectTrigger>
                      <SelectContent>
                        {["0", "1", "2", "3"].map((val) => (
                          <SelectItem key={val} value={val}>
                            Option {val}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      type="number"
                      value={q.marks || 1}
                      onChange={(e) => {
                        const questions = [...formData.questions]
                        questions[idx].marks = parseInt(e.target.value)
                        setFormData({ ...formData, questions })
                      }}
                      placeholder="Marks"
                      name={`questions[${idx}][marks]`
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeQuestion(idx)}
                      className="mt-1 flex items-center gap-1"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                      Remove
                    </Button>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No questions added yet</p>
            )}

            <Button
              variant="primary"
              onClick={addQuestion}
              className="mt-2 w-full"
            >
              Add Question
            </Button>
          </div>

          <Button
            variant="primary"
            onClick={saveQuestion}
            className="mt-4 w-full"
          >
            Add Question to Quiz
          </Button>
        </form>
      </Card>

      {formData.questions.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded">
          <h3 className="font-medium mb-2">Preview</h3>
          <p>Quiz will have {formData.questions.length} question(s)</p>
          <p>Time limit: {formData.timeLimit} minutes</p>
          <p>Total marks: {formData.questions.reduce((sum, q) => sum + (q.marks || 1), 0)}</p>
        </div>
      )}

      <Button
        variant="primary"
        onClick={() => {
          if (formData.title && formData.questions.length > 0) {
            const teacherId = user.id
            createQuiz(teacherId, formData)
            setFormData({
              title: "",
              description: "",
              classId: "",
              timeLimit: 30,
              questions: []
            })
          }
        }}
        disabled={!formData.title || formData.questions.length === 0}
      >
        Create Quiz
      </Button>
    </div>
  )
}