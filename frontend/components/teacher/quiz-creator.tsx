"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useQuiz } from "@/lib/quiz-context"
import { useAuth } from "@/lib/auth-context"
import { Plus, Trash2, Save, Clock, Calendar, Users, Edit, Eye, BarChart3 } from "lucide-react"

type QuizQuestion = {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  points: number
}

export function QuizCreator() {
  const { user } = useAuth()
  const { createQuiz, getQuizzesByTeacher, updateQuiz, deleteQuiz, getAttemptsByQuiz } = useQuiz()
  const [activeTab, setActiveTab] = useState("create")

  // Quiz creation state
  const [quizData, setQuizData] = useState({
    title: "",
    description: "",
    timeLimit: 30,
    startTime: "",
    endTime: "",
    maxAttempts: 1,
    batchId: "batch1",
  })

  const [questions, setQuestions] = useState<QuizQuestion[]>([
    {
      id: "1",
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      points: 10,
    },
  ])

  const teacherQuizzes = user ? getQuizzesByTeacher(user.id) : []

  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: Date.now().toString(),
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      points: 10,
    }
    setQuestions([...questions, newQuestion])
  }

  const updateQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    const updatedQuestions = [...questions]
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value }
    setQuestions(updatedQuestions)
  }

  const updateQuestionOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...questions]
    updatedQuestions[questionIndex].options[optionIndex] = value
    setQuestions(updatedQuestions)
  }

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index))
    }
  }

  const handleSaveQuiz = () => {
    if (!user) return

    const validQuestions = questions.filter((q) => q.question.trim() && q.options.every((opt) => opt.trim()))

    if (validQuestions.length === 0) {
      alert("Please add at least one complete question")
      return
    }

    createQuiz({
      title: quizData.title,
      description: quizData.description,
      teacherId: user.id,
      teacherName: user.name,
      batchId: quizData.batchId,
      questions: validQuestions,
      timeLimit: quizData.timeLimit,
      startTime: quizData.startTime,
      endTime: quizData.endTime,
      isActive: true,
      maxAttempts: quizData.maxAttempts,
      showLeaderboard: true,
      isApproved: false, // Needs admin approval
    })

    // Reset form
    setQuizData({
      title: "",
      description: "",
      timeLimit: 30,
      startTime: "",
      endTime: "",
      maxAttempts: 1,
      batchId: "batch1",
    })
    setQuestions([
      {
        id: "1",
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
        points: 10,
      },
    ])

    alert("Quiz created successfully! Waiting for admin approval.")
  }

  if (activeTab === "create") {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Quiz</h1>
            <p className="text-gray-600 dark:text-gray-400">Design and create quizzes for your students</p>
          </div>
        </div>

        {/* Quiz Details */}
        <Card className="rounded-2xl border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Quiz Information</CardTitle>
            <CardDescription>Basic details about your quiz</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Quiz Title</Label>
                <Input
                  id="title"
                  value={quizData.title}
                  onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
                  placeholder="Enter quiz title"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="batch">Select Batch</Label>
                <Select
                  value={quizData.batchId}
                  onValueChange={(value) => setQuizData({ ...quizData, batchId: value })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select batch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="batch1">Batch A - Mathematics</SelectItem>
                    <SelectItem value="batch2">Batch B - Physics</SelectItem>
                    <SelectItem value="batch3">Batch C - Chemistry</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={quizData.description}
                onChange={(e) => setQuizData({ ...quizData, description: e.target.value })}
                placeholder="Describe what this quiz covers"
                className="rounded-xl"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                <Input
                  id="timeLimit"
                  type="number"
                  value={quizData.timeLimit}
                  onChange={(e) => setQuizData({ ...quizData, timeLimit: Number.parseInt(e.target.value) || 30 })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxAttempts">Max Attempts</Label>
                <Input
                  id="maxAttempts"
                  type="number"
                  value={quizData.maxAttempts}
                  onChange={(e) => setQuizData({ ...quizData, maxAttempts: Number.parseInt(e.target.value) || 1 })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={quizData.startTime}
                  onChange={(e) => setQuizData({ ...quizData, startTime: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={quizData.endTime}
                  onChange={(e) => setQuizData({ ...quizData, endTime: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions */}
        <Card className="rounded-2xl border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Questions</CardTitle>
                <CardDescription>Add questions and their options</CardDescription>
              </div>
              <Button onClick={addQuestion} className="rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {questions.map((question, questionIndex) => (
              <div key={question.id} className="p-4 border rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900 dark:text-white">Question {questionIndex + 1}</h4>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2">
                      <Label className="text-sm">Points:</Label>
                      <Input
                        type="number"
                        value={question.points}
                        onChange={(e) => updateQuestion(questionIndex, "points", Number.parseInt(e.target.value) || 10)}
                        className="w-20 h-8 rounded-lg"
                      />
                    </div>
                    {questions.length > 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeQuestion(questionIndex)}
                        className="text-red-600 hover:text-red-700 rounded-full"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Question</Label>
                  <Textarea
                    value={question.question}
                    onChange={(e) => updateQuestion(questionIndex, "question", e.target.value)}
                    placeholder="Enter your question"
                    className="rounded-xl"
                    rows={2}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Options</Label>
                  {question.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name={`correct-${question.id}`}
                        checked={question.correctAnswer === optionIndex}
                        onChange={() => updateQuestion(questionIndex, "correctAnswer", optionIndex)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <Input
                        value={option}
                        onChange={(e) => updateQuestionOption(questionIndex, optionIndex, e.target.value)}
                        placeholder={`Option ${optionIndex + 1}`}
                        className="flex-1 rounded-xl"
                      />
                      <Badge variant={question.correctAnswer === optionIndex ? "default" : "secondary"}>
                        {question.correctAnswer === optionIndex ? "Correct" : `Option ${optionIndex + 1}`}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSaveQuiz} className="rounded-xl bg-gradient-to-r from-green-500 to-green-600">
            <Save className="w-4 h-4 mr-2" />
            Save Quiz
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quiz Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your quizzes and view results</p>
        </div>
        <Button onClick={() => setActiveTab("create")} className="rounded-xl">
          <Plus className="w-4 h-4 mr-2" />
          Create New Quiz
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 rounded-xl">
          <TabsTrigger value="create" className="rounded-lg">
            Create Quiz
          </TabsTrigger>
          <TabsTrigger value="manage" className="rounded-lg">
            My Quizzes
          </TabsTrigger>
          <TabsTrigger value="results" className="rounded-lg">
            Results
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="rounded-lg">
            Leaderboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manage">
          <Card className="rounded-2xl border-0 shadow-lg">
            <CardHeader>
              <CardTitle>My Quizzes</CardTitle>
              <CardDescription>Manage your created quizzes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teacherQuizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{quiz.title}</h3>
                        <Badge variant={quiz.isApproved ? "default" : "secondary"}>
                          {quiz.isApproved ? "Approved" : "Pending"}
                        </Badge>
                        <Badge variant={quiz.isActive ? "default" : "destructive"}>
                          {quiz.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{quiz.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {quiz.timeLimit} min
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(quiz.startTime).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          {quiz.questions.length} questions
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="ghost" className="rounded-full">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="rounded-full">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="rounded-full text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          <Card className="rounded-2xl border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Quiz Results</CardTitle>
              <CardDescription>View student performance on your quizzes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teacherQuizzes.map((quiz) => {
                  const attempts = getAttemptsByQuiz(quiz.id)
                  return (
                    <div key={quiz.id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{quiz.title}</h3>
                        <Badge>{attempts.length} attempts</Badge>
                      </div>
                      <div className="space-y-2">
                        {attempts.map((attempt) => (
                          <div
                            key={attempt.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-700"
                          >
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{attempt.studentName}</p>
                              <p className="text-sm text-gray-500">
                                Submitted: {new Date(attempt.submittedAt).toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {attempt.score}/{attempt.totalPoints} ({attempt.percentage}%)
                              </p>
                              <Badge variant={attempt.isApproved ? "default" : "secondary"}>
                                {attempt.isApproved ? "Approved" : "Pending"}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard">
          <Card className="rounded-2xl border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Leaderboards
              </CardTitle>
              <CardDescription>Top performers across your quizzes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {teacherQuizzes.map((quiz) => {
                  const attempts = getAttemptsByQuiz(quiz.id)
                    .filter((attempt) => attempt.isApproved)
                    .sort((a, b) => b.percentage - a.percentage)

                  return (
                    <div key={quiz.id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{quiz.title}</h3>
                        <Badge variant={quiz.showLeaderboard ? "default" : "secondary"}>
                          {quiz.showLeaderboard ? "Visible to Students" : "Hidden"}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {attempts.slice(0, 5).map((attempt, index) => (
                          <div
                            key={attempt.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-700"
                          >
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                                  index === 0
                                    ? "bg-yellow-500"
                                    : index === 1
                                      ? "bg-gray-400"
                                      : index === 2
                                        ? "bg-amber-600"
                                        : "bg-blue-500"
                                }`}
                              >
                                {index + 1}
                              </div>
                              <p className="font-medium text-gray-900 dark:text-white">{attempt.studentName}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900 dark:text-white">{attempt.percentage}%</p>
                              <p className="text-sm text-gray-500">
                                {Math.floor(attempt.timeSpent / 60)}:
                                {(attempt.timeSpent % 60).toString().padStart(2, "0")}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
