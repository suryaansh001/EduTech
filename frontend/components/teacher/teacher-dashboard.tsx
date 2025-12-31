"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Calendar, Clock, Users, BookOpen, Bell, Upload, Video, MessageSquare, ChevronRight, Loader2, RefreshCw, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { classesApi, usersApi, announcementsApi, notesApi } from "@/lib/api"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Types for API data
interface ClassData {
  id: string;
  name: string;
  subject: string;
  description?: string;
  _count?: {
    enrollments: number;
    schedules: number;
  };
  schedules?: Array<{
    id: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    room?: string;
  }>;
}

interface StatsData {
  totalClasses: number;
  totalStudents: number;
  recentActivities: Array<{
    type: string;
    message: string;
    time: string;
  }>;
  notifications: Array<{
    id: string;
    message: string;
    time: string;
    type: string;
  }>;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  createdAt: string;
}

export function TeacherDashboard() {
  const { user } = useAuth();
  const [selectedBatch, setSelectedBatch] = useState<string>("")
  const [classes, setClasses] = useState<ClassData[]>([])
  const [stats, setStats] = useState<StatsData | null>(null)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  /**
   * Fetch teacher dashboard data from backend
   * REASON: Get real-time data for classes, students, and activities
   */
  const fetchDashboardData = async () => {
    try {
      setError(null);
      
      // Fetch all data in parallel for better performance
      const [classesResponse, statsResponse, announcementsResponse] = await Promise.all([
        classesApi.getAll(),
        usersApi.getStats(),
        announcementsApi.getAll()
      ]);

      if (classesResponse.success && classesResponse.data) {
        setClasses(classesResponse.data);
      }

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }

      if (announcementsResponse.success && announcementsResponse.data) {
        setAnnouncements(announcementsResponse.data.slice(0, 5)); // Only show latest 5
      }

    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  /**
   * Format relative time for display
   */
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  /**
   * Get today's schedule from class schedules
   */
  const getTodaySchedule = () => {
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const today = days[new Date().getDay()];
    
    const todayClasses: Array<{
      time: string;
      subject: string;
      batch: string;
      duration: string;
      status: string;
    }> = [];

    classes.forEach(cls => {
      if (cls.schedules) {
        cls.schedules.forEach(schedule => {
          if (schedule.dayOfWeek === today) {
            const startTime = new Date(`1970-01-01T${schedule.startTime}`);
            const endTime = new Date(`1970-01-01T${schedule.endTime}`);
            const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
            const durationHours = durationMinutes / 60;
            
            const now = new Date();
            const currentTime = now.getHours() * 60 + now.getMinutes();
            const scheduleTime = startTime.getHours() * 60 + startTime.getMinutes();
            
            todayClasses.push({
              time: startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              subject: cls.subject,
              batch: cls.name,
              duration: durationHours >= 1 ? `${durationHours.toFixed(1)} hours` : `${durationMinutes} min`,
              status: currentTime > scheduleTime + durationMinutes ? 'completed' : 'upcoming'
            });
          }
        });
      }
    });

    return todayClasses.sort((a, b) => a.time.localeCompare(b.time));
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button variant="outline" size="sm" className="ml-4" onClick={handleRefresh}>
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Map classes to batches format
  const batches = classes.map(cls => ({
    id: cls.id,
    name: `${cls.name} - ${cls.subject}`,
    students: cls._count?.enrollments || 0
  }));

  // Get notifications from stats or announcements
  const notifications = stats?.notifications || announcements.map(a => ({
    id: a.id,
    message: a.title,
    time: formatTimeAgo(a.createdAt),
    type: a.priority === 'HIGH' ? 'warning' : a.priority === 'URGENT' ? 'destructive' : 'info'
  }));

  const todayClasses = getTodaySchedule();

  if (!selectedBatch) {
    return (
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="text-center flex-1 space-y-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Teacher Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Welcome back, {user?.firstName}! Select a batch to view specific dashboard
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
            className="rounded-xl"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Batch Selection */}
        <Card className="max-w-2xl mx-auto rounded-2xl border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Select Your Batch</CardTitle>
            <CardDescription>
              {batches.length === 0 
                ? 'No classes assigned yet. Contact admin to get classes assigned.'
                : 'Choose a batch to access batch-specific features'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {batches.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No classes assigned to you yet.</p>
              </div>
            ) : (
              batches.map((batch) => (
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
              ))
            )}
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
              {notifications.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  No notifications yet
                </p>
              ) : (
                notifications.map((notification) => (
                  <div key={notification.id} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-white">{notification.message}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notification.time}</p>
                      </div>
                      <Badge variant={notification.type === "warning" || notification.type === "destructive" ? "destructive" : "default"}>
                        {notification.type}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
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
              {todayClasses.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  No classes scheduled for today
                </p>
              ) : (
                todayClasses.map((class_, index) => (
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
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const selectedBatchData = classes.find((b) => b.id === selectedBatch);
  const selectedBatchInfo = batches.find((b) => b.id === selectedBatch);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{selectedBatchInfo?.name}</h1>
          <p className="text-gray-600 dark:text-gray-400">{selectedBatchInfo?.students} students enrolled</p>
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
          { title: "Upload Notes", icon: Upload, color: "blue", action: () => console.log('Upload notes') },
          { title: "Schedule Class", icon: Calendar, color: "green", action: () => console.log('Schedule class') },
          { title: "Start Recording", icon: Video, color: "red", action: () => console.log('Start recording') },
          { title: "Send Message", icon: MessageSquare, color: "purple", action: () => console.log('Send message') },
        ].map((action, index) => {
          const Icon = action.icon
          return (
            <Card
              key={index}
              className="rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer"
              onClick={action.action}
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
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedBatchInfo?.students || 0}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Schedules</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedBatchData?._count?.schedules || 0}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Class Status</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">Active</p>
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
            {stats?.recentActivities && stats.recentActivities.length > 0 ? (
              stats.recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{activity.type.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                No recent activity to display
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
