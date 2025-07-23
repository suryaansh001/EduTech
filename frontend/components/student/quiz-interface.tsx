"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useQuiz } from "@/lib/quiz-context"
import { useAuth } from "@/lib/auth-context"
import { Clock, Calendar, Users, Play, CheckCircle, XCircle, Trophy, FileText, Timer, AlertCircle } from "lucide-react"

export function QuizInterface() {
  const { user } = useAuth()
  const { getQuizzesByBatch, getAttemptsByStudent, submitQuizAttempt, attempts } = useQuiz()
  const [activeTab, setActiveTab] = useState("available")
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [timeLeft, setTimeLeft] = useState(0)
  const [quizStarted, setQuizStarted] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState(false)

  const availableQuizzes = user ? getQuizzesByBatch(user.batchId || "batch1") : []
  const studentAttempts = user ? getAttemptsByStudent(user.id) : []

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (quizStarted && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmitQuiz()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [quizStarted, timeLeft])

  const startQuiz = (quiz: any) => {
    setSelectedQuiz(quiz)
    setCurrentQuestion(0)
    setAnswers(new Array(quiz.questions.length).fill(-1))
    setTimeLeft(quiz.timeLimit * 60) // Convert minutes to seconds
    setQuizStarted(true)
    setQuizCompleted(false)
  }

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = answerIndex
    setAnswers(newAnswers)
  }

  const handleNextQuestion = () => {
    if (currentQuestion < selectedQuiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleSubmitQuiz = () => {
    if (!selectedQuiz || !user) return

    // Calculate score
    let score = 0
    let totalPoints = 0
    selectedQuiz.questions.forEach((question: any, index: number) => {
      totalPoints += question.points
      if (answers[index] === question.correctAnswer) {
        score += question.points
      }
    })

    const percentage = Math.round((score / totalPoints) * 100)
    const timeSpent = selectedQuiz.timeLimit * 60 - timeLeft

    submitQuizAttempt({
      quizId: selectedQuiz.id,
      studentId: user.id,
      studentName: user.name,
      answers,
      score,
      totalPoints,
      percentage,
      timeSpent,
      isApproved: false, // Needs teacher approval
    })

    setQuizCompleted(true)
    setQuizStarted(false)
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  // Quiz Taking Interface
  if (quizStarted && selectedQuiz) {
    const currentQ = selectedQuiz.questions[currentQuestion]
    const progress = ((currentQuestion + 1) / selectedQuiz.questions.length) * 100

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Quiz Header */}
          <Card className="rounded-2xl border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedQuiz.title}</h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Question {currentQuestion + 1} of {selectedQuiz.questions.length}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Timer className="w-5 h-5 text-red-500" />
                    <span
                      className={`font-mono text-lg ${timeLeft < 300 ? "text-red-500" : "text-gray-900 dark:text-white"}`}
                    >
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                  <Badge variant={timeLeft < 300 ? "destructive" : "default"}>
                    {timeLeft < 300 ? "Hurry Up!" : "Time Remaining"}
                  </Badge>
                </div>
              </div>
              <Progress value={progress} className="mt-4" />
            </CardContent>
          </Card>

          {/* Question */}
          <Card className="rounded-2xl border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white leading-relaxed">
                    {currentQ.question}
                  </h2>
                  <Badge variant="outline">{currentQ.points} points</Badge>
                </div>

                <div className="space-y-3">
                  {currentQ.options.map((option: string, index: number) => (
                    <div
                      key={index}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                        answers[currentQuestion] === index
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                      onClick={() => handleAnswerSelect(index)}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            answers[currentQuestion] === index
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-300 dark:border-gray-600"
                          }`}
                        >
                          {answers[currentQuestion] === index && <div className="w-3 h-3 bg-white rounded-full" />}
                        </div>
                        <span className="text-gray-900 dark:text-white font-medium">{option}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <Card className="rounded-2xl border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestion === 0}
                  className="rounded-xl bg-transparent"
                >
                  Previous
                </Button>

                <div className="flex items-center space-x-2">
                  {selectedQuiz.questions.map((_: any, index: number) => (
                    <div
                      key={index}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium cursor-pointer ${
                        index === currentQuestion
                          ? "bg-blue-500 text-white"
                          : answers[index] !== -1
                            ? "bg-green-500 text-white"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                      }`}
                      onClick={() => setCurrentQuestion(index)}
                    >
                      {index + 1}
                    </div>
                  ))}
                </div>

                {currentQuestion === selectedQuiz.questions.length - 1 ? (
                  <Button onClick={handleSubmitQuiz} className="rounded-xl bg-green-600 hover:bg-green-700">
                    Submit Quiz
                  </Button>
                ) : (
                  <Button onClick={handleNextQuestion} className="rounded-xl">
                    Next
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Quiz Completed Screen
  if (quizCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
        <Card className="max-w-md w-full rounded-2xl border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Quiz Submitted!</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your quiz has been submitted successfully. Results will be available once approved by your teacher.
            </p>
            <Button onClick={() => setActiveTab("results")} className="rounded-xl">
              View My Results
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quizzes</h1>
          <p className="text-gray-600 dark:text-gray-400">Take quizzes and track your performance</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 rounded-xl">
          <TabsTrigger value="available" className="rounded-lg">
            Available
          </TabsTrigger>
          <TabsTrigger value="results" className="rounded-lg">
            My Results
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="rounded-lg">
            Leaderboard
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg">
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableQuizzes.map((quiz) => {
              const userAttempts = studentAttempts.filter((attempt) => attempt.quizId === quiz.id)
              const canTakeQuiz = userAttempts.length < quiz.maxAttempts
              const isActive = new Date() >= new Date(quiz.startTime) && new Date() <= new Date(quiz.endTime)

              return (
                <Card
                  key={quiz.id}
                  className="rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                >
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{quiz.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{quiz.description}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-gray-500">
                            <Clock className="w-4 h-4 mr-1" />
                            {quiz.timeLimit} minutes
                          </div>
                          <div className="flex items-center text-gray-500">
                            <FileText className="w-4 h-4 mr-1" />
                            {quiz.questions.length} questions
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-gray-500">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(quiz.startTime).toLocaleDateString()}
                          </div>
                          <div className="flex items-center text-gray-500">
                            <Users className="w-4 h-4 mr-1" />
                            {userAttempts.length}/{quiz.maxAttempts} attempts
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant={isActive ? "default" : "secondary"}>{isActive ? "Active" : "Inactive"}</Badge>
                          {!canTakeQuiz && <Badge variant="destructive">Max Attempts Reached</Badge>}
                        </div>
                      </div>

                      <Button
                        onClick={() => startQuiz(quiz)}
                        disabled={!canTakeQuiz || !isActive}
                        className="w-full rounded-xl"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        {!canTakeQuiz ? "No Attempts Left" : !isActive ? "Quiz Inactive" : "Start Quiz"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="results">
          <Card className="rounded-2xl border-0 shadow-lg">
            <CardHeader>
              <CardTitle>My Quiz Results</CardTitle>
              <CardDescription>Your performance on completed quizzes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {studentAttempts.map((attempt) => {
                  const quiz = availableQuizzes.find((q) => q.id === attempt.quizId)
                  return (
                    <div
                      key={attempt.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{quiz?.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Submitted: {new Date(attempt.submittedAt).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          Time taken: {Math.floor(attempt.timeSpent / 60)}:
                          {(attempt.timeSpent % 60).toString().padStart(2, "0")}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            {attempt.percentage}%
                          </span>
                          {attempt.percentage >= 80 ? (
                            <CheckCircle className="w-6 h-6 text-green-500" />
                          ) : attempt.percentage >= 60 ? (
                            <AlertCircle className="w-6 h-6 text-yellow-500" />
                          ) : (
                            <XCircle className="w-6 h-6 text-red-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {attempt.score}/{attempt.totalPoints} points
                        </p>
                        <Badge variant={attempt.isApproved ? "default" : "secondary"}>
                          {attempt.isApproved ? "Approved" : "Pending"}
                        </Badge>
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
                <Trophy className="w-5 h-5 mr-2" />
                Leaderboards
              </CardTitle>
              <CardDescription>See how you rank against your classmates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {availableQuizzes
                  .filter((quiz) => quiz.showLeaderboard)
                  .map((quiz) => {
                    const quizAttempts = attempts
                      .filter((attempt) => attempt.quizId === quiz.id && attempt.isApproved)
                      .sort((a, b) => b.percentage - a.percentage)

                    return (
                      <div key={quiz.id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{quiz.title}</h3>
                        <div className="space-y-2">
                          {quizAttempts.slice(0, 10).map((attempt, index) => (
                            <div
                              key={attempt.id}
                              className={`flex items-center justify-between p-3 rounded-lg ${
                                attempt.studentId === user?.id
                                  ? "bg-blue-100 dark:bg-blue-900/20 border-2 border-blue-500"
                                  : "bg-white dark:bg-gray-700"
                              }`}
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
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {attempt.studentId === user?.id ? "You" : attempt.studentName}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {Math.floor(attempt.timeSpent / 60)}:
                                    {(attempt.timeSpent % 60).toString().padStart(2, "0")}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-gray-900 dark:text-white">{attempt.percentage}%</p>
                                <p className="text-sm text-gray-500">
                                  {attempt.score}/{attempt.totalPoints}
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

        <TabsContent value="history">
          <Card className="rounded-2xl border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Quiz History</CardTitle>
              <CardDescription>Complete history of your quiz attempts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {studentAttempts
                  .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
                  .map((attempt) => {
                    const quiz = availableQuizzes.find((q) => q.id === attempt.quizId)
                    return (
                      <div
                        key={attempt.id}
                        className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{quiz?.title}</h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                              <span>Submitted: {new Date(attempt.submittedAt).toLocaleString()}</span>
                              <span>
                                Time: {Math.floor(attempt.timeSpent / 60)}:
                                {(attempt.timeSpent % 60).toString().padStart(2, "0")}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-2">
                              <span className="text-xl font-bold text-gray-900 dark:text-white">
                                {attempt.percentage}%
                              </span>
                              <Badge variant={attempt.isApproved ? "default" : "secondary"}>
                                {attempt.isApproved ? "Approved" : "Pending"}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500">
                              {attempt.score}/{attempt.totalPoints} points
                            </p>
                          </div>
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
