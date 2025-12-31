"use client"

/**
 * Admin Dashboard Component
 * 
 * SECURITY FEATURES:
 * 1. Data fetched from authenticated API endpoints only
 * 2. Role-based access enforced by backend
 * 3. No sensitive data exposed in component state
 * 4. Error handling prevents information leakage
 */

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Users, GraduationCap, BookOpen, Calendar, TrendingUp, Bell, Plus, Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { usersApi, classesApi, analyticsApi, ApiError } from "@/lib/api"

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  activeEnrollments: number;
  recentActivities: Array<{
    id: string;
    user: string;
    action: string;
    time: string;
    avatar?: string;
  }>;
  notifications: Array<{
    id: string;
    message: string;
    time: string;
    type: 'info' | 'success' | 'warning';
  }>;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch dashboard data from backend
   * SECURITY: All data comes from authenticated API endpoints
   */
  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch multiple data sources in parallel for efficiency
      const [usersResponse, classesResponse] = await Promise.all([
        usersApi.getStats(),
        classesApi.getClasses({ status: 'ACTIVE', limit: 5 }),
      ]);

      // Process the responses
      const dashboardStats: DashboardStats = {
        totalStudents: usersResponse.data?.totalStudents || 0,
        totalTeachers: usersResponse.data?.totalTeachers || 0,
        totalClasses: usersResponse.data?.totalClasses || classesResponse.data?.pagination?.total || 0,
        activeEnrollments: usersResponse.data?.activeEnrollments || 0,
        recentActivities: usersResponse.data?.recentActivities || [],
        notifications: usersResponse.data?.notifications || [],
      };

      setStats(dashboardStats);
    } catch (err) {
      // SECURITY: Don't expose detailed error information
      const message = err instanceof ApiError 
        ? err.message 
        : 'Failed to load dashboard data. Please try again.';
      setError(message);
      console.error('Dashboard fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center space-y-4">
            <AlertCircle className="w-12 h-12 mx-auto text-red-500" />
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
            <Button onClick={fetchDashboardData} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback data if API returns empty
  const displayStats = stats || {
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    activeEnrollments: 0,
    recentActivities: [],
    notifications: [],
  };

  const statCards = [
    { title: "Total Students", value: displayStats.totalStudents.toLocaleString(), change: "+12%", icon: Users, color: "blue" },
    { title: "Active Teachers", value: displayStats.totalTeachers.toLocaleString(), change: "+3%", icon: GraduationCap, color: "green" },
    { title: "Total Classes", value: displayStats.totalClasses.toLocaleString(), change: "+8%", icon: BookOpen, color: "purple" },
    { title: "Enrollments", value: displayStats.activeEnrollments.toLocaleString(), change: "+15%", icon: Calendar, color: "orange" },
  ];

  // Default activities if none from API
  const activities = displayStats.recentActivities.length > 0 
    ? displayStats.recentActivities 
    : [
        { id: '1', user: "System", action: "Dashboard initialized", time: "Just now", avatar: undefined },
      ];

  // Default notifications if none from API
  const notifications = displayStats.notifications.length > 0
    ? displayStats.notifications
    : [
        { id: '1', message: "Welcome to the Admin Dashboard", time: "Just now", type: 'info' as const },
      ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchDashboardData} className="rounded-xl">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Quick Action
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
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
              {activities.map((activity) => (
                <div
                  key={activity.id}
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
