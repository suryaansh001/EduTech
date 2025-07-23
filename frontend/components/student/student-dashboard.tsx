"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar, Clock, BookOpen, Bell, Download, Play, FileText, TrendingUp, Award } from "lucide-react"

export function StudentDashboard() {
  const [notifications] = useState([
    { id: 1, message: "New notes uploaded for Mathematics", time: "2 hours ago", type: "info" },
    { id: 2, message: "Class schedule updated for tomorrow", time: "4 hours ago", type: "warning" },
    { id: 3, message: "Assignment due in 2 days", time: "1 day ago", type: "urgent" },
  ])

  const upcomingClasses = [
    { time: "09:00 AM", subject: "Mathematics", teacher: "Mr. Johnson", duration: "1 hour", status: "upcoming" },
    { time: "11:00 AM", subject: "Physics", teacher: "Dr. Smith", duration: "1.5 hours", status: "upcoming" },
    { time: "02:00 PM", subject: "Chemistry", teacher: "Ms. Davis", duration: "1 hour", status: "live" },
  ]

  const recentUploads = [
    {
      title: "Calculus Chapter 5 Notes",
      subject: "Mathematics",
      uploadedBy: "Mr. Johnson",
      time: "2 hours ago",
      type: "pdf",
    },
    { title: "Physics Lab Manual", subject: "Physics", uploadedBy: "Dr. Smith", time: "1 day ago", type: "pdf" },
    { title: "Chemistry Assignment", subject: "Chemistry", uploadedBy: "Ms. Davis", time: "2 days ago", type: "doc" },
  ]

  const performanceData = [
    { subject: "Mathematics", score: 85, trend: "up" },
    { subject: "Physics", score: 92, trend: "up" },
    { subject: "Chemistry", score: 78, trend: "down" },
  ]

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Student Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Welcome back! Here's your learning progress.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="rounded-full">
            <Award className="w-4 h-4 mr-1" />
            Level 5
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: "Classes Today", value: "3", icon: Calendar, color: "blue" },
          { title: "Assignments Due", value: "2", icon: FileText, color: "orange" },
          { title: "Hours Studied", value: "24", icon: Clock, color: "green" },
          { title: "Average Score", value: "85%", icon: TrendingUp, color: "purple" },
        ].map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card
              key={index}
              className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-2xl bg-${stat.color}-100 dark:bg-${stat.color}-900/20`}>
                    <Icon className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notifications */}
        <Card className="rounded-2xl border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Recent Updates
            </CardTitle>
            <CardDescription>Important notifications and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-white">{notification.message}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notification.time}</p>
                    </div>
                    <Badge
                      variant={
                        notification.type === "urgent"
                          ? "destructive"
                          : notification.type === "warning"
                            ? "secondary"
                            : "default"
                      }
                      className="ml-2"
                    >
                      {notification.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Classes */}
        <Card className="lg:col-span-2 rounded-2xl border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Today's Classes
            </CardTitle>
            <CardDescription>Your schedule for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingClasses.map((class_, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{class_.time}</p>
                      <p className="text-xs text-gray-500">{class_.duration}</p>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{class_.subject}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{class_.teacher}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={class_.status === "live" ? "destructive" : "secondary"}>{class_.status}</Badge>
                    {class_.status === "live" && (
                      <Button size="sm" className="rounded-xl">
                        <Play className="w-4 h-4 mr-1" />
                        Join
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Uploads */}
      <Card className="rounded-2xl border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="w-5 h-5 mr-2" />
            Recently Uploaded
          </CardTitle>
          <CardDescription>Latest notes and materials from your teachers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentUploads.map((upload, index) => (
              <div
                key={index}
                className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 cursor-pointer hover:scale-[1.02]"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">{upload.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{upload.subject}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {upload.type.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">by {upload.uploadedBy}</p>
                    <p className="text-xs text-gray-400">{upload.time}</p>
                  </div>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Overview */}
      <Card className="rounded-2xl border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
          <CardDescription>Your academic performance across subjects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {performanceData.map((subject, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">{subject.subject}</span>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className={`w-4 h-4 ${subject.trend === "up" ? "text-green-500" : "text-red-500"}`} />
                    <span className="text-sm font-medium">{subject.score}%</span>
                  </div>
                </div>
                <Progress value={subject.score} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
