"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useQuiz } from "@/lib/quiz-context"
import {
  CheckCircle,
  XCircle,
  Eye,
  BarChart3,
  Clock,
  Users,
  FileText,
  Calendar,
  Trophy,
  AlertCircle,
} from "lucide-react"

export function QuizManagement() {
  const { quizzes, attempts, updateQuiz, approveQuizAttempt, toggleLeaderboardVisibility } = useQuiz()
  const [activeTab, setActiveTab] = useState("pending")

  const pendingQuizzes = quizzes.filter((quiz) => !quiz.isApproved)
  const approvedQuizzes = quizzes.filter((quiz) => quiz.isApproved)
  const pendingAttempts = attempts.filter((attempt) => !attempt.isApproved)

  const handleApproveQuiz = (quizId: string) => {
    updateQuiz(quizId, { isApproved: true })
  }

  const handleRejectQuiz = (quizId: string) => {
    updateQuiz(quizId, { isApproved: false, isActive: false })
  }

  const handleApproveAttempt = (attemptId: string) => {
    approveQuizAttempt(attemptId)
  }

  const handleToggleLeaderboard = (quizId: string, visible: boolean) => {
    toggleLeaderboardVisibility(quizId, visible)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quiz Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage quizzes, approve results, and control leaderboards</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 rounded-xl">
          <TabsTrigger value="pending" className="rounded-lg">
            Pending Approval ({pendingQuizzes.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="rounded-lg">
            Approved Quizzes
          </TabsTrigger>
          <TabsTrigger value="results" className="rounded-lg">
            Results ({pendingAttempts.length})
          </TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-lg">
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card className="rounded-2xl border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                Quizzes Pending Approval
              </CardTitle>
              <CardDescription>Review and approve quizzes created by teachers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingQuizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{quiz.title}</h3>
                          <Badge variant="secondary">Pending</Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{quiz.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {quiz.teacherName}
                          </div>
                          <div className="flex items-center">
                            <FileText className="w-4 h-4 mr-1" />
                            {quiz.questions.length} questions
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {quiz.timeLimit} min
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(quiz.startTime).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline" className="rounded-xl bg-transparent">
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApproveQuiz(quiz.id)}
                          className="rounded-xl bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectQuiz(quiz.id)}
                          className="rounded-xl"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {pendingQuizzes.length === 0 && (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">All Caught Up!</h3>
                    <p className="text-gray-600 dark:text-gray-400">No quizzes pending approval</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved">
          <Card className="rounded-2xl border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Approved Quizzes</CardTitle>
              <CardDescription>Manage approved quizzes and leaderboard visibility</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {approvedQuizzes.map((quiz) => {
                  const quizAttempts = attempts.filter((attempt) => attempt.quizId === quiz.id)
                  return (
                    <div
                      key={quiz.id}
                      className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{quiz.title}</h3>
                            <Badge variant="default">Approved</Badge>
                            <Badge variant={quiz.isActive ? "default" : "secondary"}>
                              {quiz.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{quiz.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-1" />
                              {quiz.teacherName}
                            </div>
                            <div className="flex items-center">
                              <FileText className="w-4 h-4 mr-1" />
                              {quiz.questions.length} questions
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {quiz.timeLimit} min
                            </div>
                            <div className="flex items-center">
                              <BarChart3 className="w-4 h-4 mr-1" />
                              {quizAttempts.length} attempts
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Label htmlFor={`leaderboard-${quiz.id}`} className="text-sm">
                              Show Leaderboard
                            </Label>
                            <Switch
                              id={`leaderboard-${quiz.id}`}
                              checked={quiz.showLeaderboard}
                              onCheckedChange={(checked) => handleToggleLeaderboard(quiz.id, checked)}
                            />
                          </div>
                          <Button size="sm" variant="outline" className="rounded-xl bg-transparent">
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          <Card className="rounded-2xl border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                Results Pending Approval
              </CardTitle>
              <CardDescription>Review and approve student quiz results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingAttempts.map((attempt) => {
                  const quiz = quizzes.find((q) => q.id === attempt.quizId)
                  return (
                    <div
                      key={attempt.id}
                      className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{quiz?.title}</h3>
                            <Badge variant="secondary">Pending</Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>Student: {attempt.studentName}</span>
                            <span>Submitted: {new Date(attempt.submittedAt).toLocaleString()}</span>
                            <span>
                              Time: {Math.floor(attempt.timeSpent / 60)}:
                              {(attempt.timeSpent % 60).toString().padStart(2, "0")}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-xl font-bold text-gray-900 dark:text-white">{attempt.percentage}%</div>
                            <div className="text-sm text-gray-500">
                              {attempt.score}/{attempt.totalPoints} points
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="outline" className="rounded-xl bg-transparent">
                              <Eye className="w-4 h-4 mr-2" />
                              Review
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleApproveAttempt(attempt.id)}
                              className="rounded-xl bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {pendingAttempts.length === 0 && (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">All Results Approved!</h3>
                    <p className="text-gray-600 dark:text-gray-400">No quiz results pending approval</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="rounded-2xl border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Quiz Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <span className="font-medium text-gray-900 dark:text-white">Total Quizzes</span>
                    <span className="text-2xl font-bold text-blue-600">{quizzes.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <span className="font-medium text-gray-900 dark:text-white">Approved Quizzes</span>
                    <span className="text-2xl font-bold text-green-600">{approvedQuizzes.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <span className="font-medium text-gray-900 dark:text-white">Pending Approval</span>
                    <span className="text-2xl font-bold text-orange-600">{pendingQuizzes.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <span className="font-medium text-gray-900 dark:text-white">Total Attempts</span>
                    <span className="text-2xl font-bold text-purple-600">{attempts.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="w-5 h-5 mr-2" />
                  Top Performing Quizzes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {approvedQuizzes
                    .map((quiz) => {
                      const quizAttempts = attempts.filter(
                        (attempt) => attempt.quizId === quiz.id && attempt.isApproved,
                      )
                      const avgScore =
                        quizAttempts.length > 0
                          ? quizAttempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / quizAttempts.length
                          : 0
                      return { ...quiz, avgScore, attemptCount: quizAttempts.length }
                    })
                    .sort((a, b) => b.avgScore - a.avgScore)
                    .slice(0, 5)
                    .map((quiz, index) => (
                      <div
                        key={quiz.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
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
                            <p className="font-medium text-gray-900 dark:text-white">{quiz.title}</p>
                            <p className="text-sm text-gray-500">{quiz.attemptCount} attempts</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-white">{Math.round(quiz.avgScore)}%</p>
                          <p className="text-sm text-gray-500">avg score</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
