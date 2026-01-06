"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar, Clock, BookOpen, Bell, Download, Play, FileText, TrendingUp, Award, Loader2, RefreshCw, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { classesApi, usersApi, announcementsApi, notesApi, quizzesApi, filesApi } from "@/lib/api"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Types for API data
interface ClassEnrollment {
  id: string;
  class: {
    id: string;
    name: string;
    subject: string;
    teacher?: {
      user: {
        firstName: string;
        lastName: string;
      }
    };
    schedules?: Array<{
      dayOfWeek: string;
      startTime: string;
      endTime: string;
    }>;
  };
}

interface StatsData {
  totalEnrollments: number;
  quizAttempts: number;
  averageScore: number;
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

interface Note {
  id: string;
  title: string;
  subject?: string;
  createdAt: string;
  createdBy?: {
    firstName: string;
    lastName: string;
  };
  class?: {
    name: string;
    subject: string;
  };
}

interface QuizAttempt {
  id: string;
  score: number;
  quiz: {
    title: string;
    class?: {
      name: string;
      subject: string;
    };
  };
}

export function StudentDashboard() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<ClassEnrollment[]>([])
  const [stats, setStats] = useState<StatsData | null>(null)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [quizScores, setQuizScores] = useState<QuizAttempt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  /**
   * Fetch student dashboard data from backend
   * REASON: Get real-time data for enrolled classes, assignments, and progress
   */
  const fetchDashboardData = async () => {
    try {
      setError(null);

      // Fetch all data in parallel for better performance
      const [enrollmentsRes, statsRes, announcementsRes, notesRes, quizzesRes] = await Promise.all([
        classesApi.getMyEnrollments(),
        usersApi.getStats(),
        announcementsApi.getAnnouncements(),
        notesApi.getNotes(),
        quizzesApi.getMyAttempts()
      ]);

      if (enrollmentsRes.success && enrollmentsRes.data) {
        setEnrollments(enrollmentsRes.data);
      }

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }

      if (announcementsRes.success && announcementsRes.data) {
        setAnnouncements((announcementsRes.data.announcements || []).slice(0, 5));
      }

      if (notesRes.success && notesRes.data) {
        setNotes((notesRes.data.notes || []).slice(0, 6)); // Show latest 6 notes
      }

      if (quizzesRes.success && quizzesRes.data) {
        setQuizScores(quizzesRes.data.slice(0, 5));
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
   * Get today's classes from enrollments
   */
  const getTodayClasses = () => {
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const today = days[new Date().getDay()];
    
    const todayClasses: Array<{
      time: string;
      subject: string;
      teacher: string;
      duration: string;
      status: string;
    }> = [];

    enrollments.forEach(enrollment => {
      const cls = enrollment.class;
      if (cls.schedules) {
        cls.schedules.forEach(schedule => {
          if (schedule.dayOfWeek === today) {
            const startTime = new Date(`1970-01-01T${schedule.startTime}`);
            const endTime = new Date(`1970-01-01T${schedule.endTime}`);
            const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
            const durationHours = durationMinutes / 60;
            
            const now = new Date();
            const currentTime = now.getHours() * 60 + now.getMinutes();
            const scheduleStartTime = startTime.getHours() * 60 + startTime.getMinutes();
            const scheduleEndTime = scheduleStartTime + durationMinutes;
            
            let status = 'upcoming';
            if (currentTime >= scheduleStartTime && currentTime <= scheduleEndTime) {
              status = 'live';
            } else if (currentTime > scheduleEndTime) {
              status = 'completed';
            }

            const teacherName = cls.teacher 
              ? `${cls.teacher.user.firstName} ${cls.teacher.user.lastName}`
              : 'TBA';

            todayClasses.push({
              time: startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              subject: cls.subject,
              teacher: teacherName,
              duration: durationHours >= 1 ? `${durationHours.toFixed(1)} hours` : `${durationMinutes} min`,
              status
            });
          }
        });
      }
    });

    return todayClasses.sort((a, b) => a.time.localeCompare(b.time));
  };

  /**
   * Calculate performance data from quiz scores
   */
  const getPerformanceData = () => {
    const subjectScores: { [key: string]: number[] } = {};
    
    quizScores.forEach(attempt => {
      const subject = attempt.quiz.class?.subject || 'General';
      if (!subjectScores[subject]) {
        subjectScores[subject] = [];
      }
      subjectScores[subject].push(attempt.score);
    });

    return Object.entries(subjectScores).map(([subject, scores]) => {
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      return {
        subject,
        score: Math.round(avgScore),
        trend: avgScore >= 70 ? 'up' : 'down'
      };
    });
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

  // Get notifications from stats or announcements
  const notifications = stats?.notifications || announcements.map(a => ({
    id: a.id,
    message: a.title,
    time: formatTimeAgo(a.createdAt),
    type: a.priority === 'HIGH' ? 'warning' : a.priority === 'URGENT' ? 'urgent' : 'info'
  }));

  const todayClasses = getTodayClasses();
  const performanceData = getPerformanceData();

  // Calculate stats
  const classesToday = todayClasses.filter(c => c.status !== 'completed').length;
  const totalEnrollments = enrollments.length;
  const avgScore = stats?.averageScore || (performanceData.length > 0 
    ? Math.round(performanceData.reduce((a, b) => a + b.score, 0) / performanceData.length) 
    : 0);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Student Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back, {user?.firstName || user?.name}! Here's your learning progress.
          </p>
        </div>
        <div className="flex items-center space-x-2">
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
          <Badge variant="secondary" className="rounded-full">
            <Award className="w-4 h-4 mr-1" />
            {totalEnrollments > 3 ? 'Level 3' : totalEnrollments > 1 ? 'Level 2' : 'Level 1'}
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: "Classes Today", value: String(classesToday), icon: Calendar, color: "blue" },
          { title: "Enrolled Classes", value: String(totalEnrollments), icon: BookOpen, color: "orange" },
          { title: "Quiz Attempts", value: String(stats?.quizAttempts || quizScores.length), icon: FileText, color: "green" },
          { title: "Average Score", value: `${avgScore}%`, icon: TrendingUp, color: "purple" },
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
              {notifications.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  No notifications yet
                </p>
              ) : (
                notifications.map((notification) => (
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
                ))
              )}
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
              {todayClasses.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  No classes scheduled for today
                </p>
              ) : (
                todayClasses.map((class_, index) => (
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
                      <Badge variant={class_.status === "live" ? "destructive" : class_.status === "completed" ? "default" : "secondary"}>
                        {class_.status}
                      </Badge>
                      {class_.status === "live" && (
                        <Button size="sm" className="rounded-xl">
                          <Play className="w-4 h-4 mr-1" />
                          Join
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
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
            {notes.length === 0 ? (
              <p className="col-span-full text-center text-gray-500 dark:text-gray-400 py-4">
                No notes available yet
              </p>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 cursor-pointer hover:scale-[1.02]"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">{note.title}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {note.class?.subject || note.subject || 'General'}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      NOTE
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        by {note.createdBy ? `${note.createdBy.firstName} ${note.createdBy.lastName}` : 'Teacher'}
                      </p>
                      <p className="text-xs text-gray-400">{formatTimeAgo(note.createdAt)}</p>
                    </div>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
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
            {performanceData.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                Complete some quizzes to see your performance data
              </p>
            ) : (
              performanceData.map((subject, index) => (
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
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
