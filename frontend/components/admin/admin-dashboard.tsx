"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Users, GraduationCap, BookOpen, Calendar, TrendingUp, Bell, Plus } from "lucide-react"

export function AdminDashboard() {
  const [notifications] = useState([
    { id: 1, message: "New student registration pending approval", time: "2 hours ago", type: "info" },
    { id: 2, message: "Class schedule updated for Batch A", time: "4 hours ago", type: "success" },
    { id: 3, message: "Teacher John requested leave for tomorrow", time: "1 day ago", type: "warning" },
  ])

  const stats = [
    { title: "Total Students", value: "1,234", change: "+12%", icon: Users, color: "blue" },
    { title: "Active Teachers", value: "56", change: "+3%", icon: GraduationCap, color: "green" },
    { title: "Total Classes", value: "89", change: "+8%", icon: BookOpen, color: "purple" },
    { title: "This Month", value: "234", change: "+15%", icon: Calendar, color: "orange" },
  ]

  const recentActivities = [
    { user: "Alice Johnson", action: "completed Math Quiz", time: "5 min ago", avatar: "/api/placeholder/32/32" },
    { user: "Bob Smith", action: "uploaded new notes", time: "15 min ago", avatar: "/api/placeholder/32/32" },
    { user: "Carol Davis", action: "scheduled new class", time: "1 hour ago", avatar: "/api/placeholder/32/32" },
  ]

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Welcome back! Here's what's happening today.</p>
        </div>
        <Button className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Quick Action
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
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
                    <div className="flex items-center mt-2">
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-500 font-medium">{stat.change}</span>
                    </div>
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
        {/* Recent Activities */}
        <Card className="lg:col-span-2 rounded-2xl border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Recent Activities
            </CardTitle>
            <CardDescription>Latest activities across the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={activity.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{activity.user.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      <span className="font-semibold">{activity.user}</span> {activity.action}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="rounded-2xl border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Important updates and alerts</CardDescription>
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
                    <Badge variant={notification.type === "warning" ? "destructive" : "default"} className="ml-2">
                      {notification.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-2xl border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Student Enrollment Trend</CardTitle>
            <CardDescription>Monthly enrollment statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">January</span>
                <span className="text-sm text-gray-500">85%</span>
              </div>
              <Progress value={85} className="h-2" />

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">February</span>
                <span className="text-sm text-gray-500">92%</span>
              </div>
              <Progress value={92} className="h-2" />

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">March</span>
                <span className="text-sm text-gray-500">78%</span>
              </div>
              <Progress value={78} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Class Performance</CardTitle>
            <CardDescription>Average performance by batch</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {["Batch A", "Batch B", "Batch C"].map((batch, index) => (
                <div
                  key={batch}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50"
                >
                  <span className="font-medium">{batch}</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={[88, 92, 76][index]} className="w-20 h-2" />
                    <span className="text-sm text-gray-500">{[88, 92, 76][index]}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
