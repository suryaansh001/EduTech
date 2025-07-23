"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Calendar, Clock, Users, BookOpen, Bell, Upload, Video, MessageSquare, ChevronRight } from "lucide-react"

export function TeacherDashboard() {
  const [selectedBatch, setSelectedBatch] = useState<string>("")

  const batches = [
    { id: "batch1", name: "Batch A - Mathematics", students: 25 },
    { id: "batch2", name: "Batch B - Physics", students: 30 },
    { id: "batch3", name: "Batch C - Chemistry", students: 28 },
  ]

  const todayClasses = [
    { time: "09:00 AM", subject: "Mathematics", batch: "Batch A", duration: "1 hour", status: "upcoming" },
    { time: "11:00 AM", subject: "Physics", batch: "Batch B", duration: "1.5 hours", status: "upcoming" },
    { time: "02:00 PM", subject: "Chemistry", batch: "Batch C", duration: "1 hour", status: "completed" },
  ]

  const notifications = [
    { id: 1, message: "Admin updated class schedule for tomorrow", time: "1 hour ago", type: "info" },
    { id: 2, message: "New assignment submission from Batch A", time: "3 hours ago", type: "success" },
    { id: 3, message: "Parent meeting scheduled for next week", time: "1 day ago", type: "warning" },
  ]

  if (!selectedBatch) {
    return (
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Teacher Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Select a batch to view specific dashboard</p>
        </div>

        {/* Batch Selection */}
        <Card className="max-w-2xl mx-auto rounded-2xl border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Select Your Batch</CardTitle>
            <CardDescription>Choose a batch to access batch-specific features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {batches.map((batch) => (
              <div
                key={batch.id}
                className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 cursor-pointer hover:scale-[1.02]"
                onClick={() => setSelectedBatch(batch.id)}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{batch.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{batch.students} students</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* General Notifications */}
        <Card className="max-w-2xl mx-auto rounded-2xl border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Recent Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div key={notification.id} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-white">{notification.message}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notification.time}</p>
                    </div>
                    <Badge variant={notification.type === "warning" ? "destructive" : "default"}>
                      {notification.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card className="max-w-2xl mx-auto rounded-2xl border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayClasses.map((class_, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{class_.time}</p>
                      <p className="text-xs text-gray-500">{class_.duration}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{class_.subject}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{class_.batch}</p>
                    </div>
                  </div>
                  <Badge variant={class_.status === "completed" ? "default" : "secondary"}>{class_.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const selectedBatchData = batches.find((b) => b.id === selectedBatch)

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{selectedBatchData?.name}</h1>
          <p className="text-gray-600 dark:text-gray-400">{selectedBatchData?.students} students enrolled</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => setSelectedBatch("")} className="rounded-xl">
            Change Batch
          </Button>
          <Button className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600">
            <Upload className="w-4 h-4 mr-2" />
            Upload Notes
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: "Upload Notes", icon: Upload, color: "blue" },
          { title: "Schedule Class", icon: Calendar, color: "green" },
          { title: "Start Recording", icon: Video, color: "red" },
          { title: "Send Message", icon: MessageSquare, color: "purple" },
        ].map((action, index) => {
          const Icon = action.icon
          return (
            <Card
              key={index}
              className="rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer"
            >
              <CardContent className="p-4 text-center">
                <div
                  className={`w-12 h-12 mx-auto mb-3 bg-${action.color}-100 dark:bg-${action.color}-900/20 rounded-xl flex items-center justify-center`}
                >
                  <Icon className={`w-6 h-6 text-${action.color}-600 dark:text-${action.color}-400`} />
                </div>
                <p className="font-medium text-gray-900 dark:text-white">{action.title}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Batch Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-2xl border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Students</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedBatchData?.students}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Classes This Week</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">12</p>
              </div>
              <Calendar className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Attendance</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">89%</p>
              </div>
              <Clock className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Students Activity */}
      <Card className="rounded-2xl border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Recent Student Activity</CardTitle>
          <CardDescription>Latest activities from your students</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: "Alice Johnson", action: "submitted assignment", time: "2 hours ago" },
              { name: "Bob Smith", action: "attended live class", time: "4 hours ago" },
              { name: "Carol Davis", action: "downloaded notes", time: "1 day ago" },
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{activity.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    <span className="font-semibold">{activity.name}</span> {activity.action}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
