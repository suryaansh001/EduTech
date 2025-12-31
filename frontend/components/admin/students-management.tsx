"use client"

/**
 * Students Management Component
 * 
 * SECURITY FEATURES:
 * 1. All CRUD operations go through authenticated API endpoints
 * 2. Role-based access (admin only) enforced by backend
 * 3. Input validation before API calls
 * 4. Secure password generation on backend
 * 5. Confirmation dialogs for destructive actions
 * 6. Error handling prevents information leakage
 */

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Edit, Trash2, Mail, Phone, BookOpen, MoreHorizontal, UserPlus, Upload, Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { usersApi, ApiError } from "@/lib/api"

interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string;
  profileImage?: string;
  createdAt: string;
  lastLogin?: string;
  isActive?: boolean;
  studentProfile?: {
    grade?: string;
    totalCourses?: number;
    completedCourses?: number;
  };
  _count?: {
    enrollments?: number;
    quizAttempts?: number;
  };
}

export function StudentsManagement() {
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    phone: "",
    grade: "",
  })
  const [formError, setFormError] = useState<string | null>(null)

  /**
   * Fetch students from backend
   * SECURITY: Uses authenticated API endpoint with admin authorization
   */
  const fetchStudents = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await usersApi.getUsers({ role: 'STUDENT', limit: 100 })
      if (response.success) {
        setStudents(response.data.users || [])
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load students'
      setError(message)
      console.error('Failed to fetch students:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  /**
   * Add new student
   * SECURITY: 
   * - Input validation before submission
   * - Backend generates secure temporary password
   * - Credentials sent via email (not displayed)
   */
  const handleAddStudent = async () => {
    setFormError(null)

    // Client-side validation
    if (!newStudent.name.trim()) {
      setFormError('Name is required')
      return
    }
    if (!newStudent.email.trim()) {
      setFormError('Email is required')
      return
    }
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newStudent.email)) {
      setFormError('Invalid email format')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await usersApi.createUser({
        name: newStudent.name.trim(),
        email: newStudent.email.trim(),
        role: 'STUDENT',
        phone: newStudent.phone.trim() || undefined,
        grade: newStudent.grade || undefined,
      })

      if (response.success) {
        setIsAddDialogOpen(false)
        setNewStudent({ name: '', email: '', phone: '', grade: '' })
        // Refresh the list
        fetchStudents()
        alert('Student created successfully! Credentials have been sent to their email.')
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to create student'
      setFormError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Delete student
   * SECURITY: 
   * - Requires confirmation dialog
   * - Backend verifies admin permission
   */
  const handleDeleteStudent = async () => {
    if (!selectedStudent) return

    setIsSubmitting(true)

    try {
      const response = await usersApi.deleteUser(selectedStudent.id)
      if (response.success) {
        setIsDeleteDialogOpen(false)
        setSelectedStudent(null)
        // Refresh the list
        fetchStudents()
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete student'
      alert(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filter students based on search term
  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Separate active and inactive students
  const activeStudents = filteredStudents.filter(s => s.isActive !== false)
  const inactiveStudents = filteredStudents.filter(s => s.isActive === false)

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading students...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center space-y-4">
            <AlertCircle className="w-12 h-12 mx-auto text-red-500" />
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
            <Button onClick={fetchStudents} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Students Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage student accounts and enrollments</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={fetchStudents} className="rounded-xl">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
                <DialogDescription>
                  Create a new student account. A secure password will be generated and sent to their email.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                    placeholder="Enter student's full name"
                    className="rounded-xl"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                    placeholder="Enter email address"
                    className="rounded-xl"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={newStudent.phone}
                    onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                    placeholder="Enter phone number"
                    className="rounded-xl"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grade">Grade</Label>
                  <Select
                    value={newStudent.grade}
                    onValueChange={(value) => setNewStudent({ ...newStudent, grade: value })}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {['8th Grade', '9th Grade', '10th Grade', '11th Grade', '12th Grade'].map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formError && (
                  <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsAddDialogOpen(false)
                      setFormError(null)
                    }} 
                    className="rounded-xl"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddStudent} 
                    className="rounded-xl"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Student'
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-3 rounded-2xl border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search students by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-lg">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{students.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Students</div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedStudent?.name}? This action cannot be undone.
              All their enrollments and data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStudent}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Students Table */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 rounded-xl">
          <TabsTrigger value="all" className="rounded-lg">
            All Students ({filteredStudents.length})
          </TabsTrigger>
          <TabsTrigger value="active" className="rounded-lg">
            Active ({activeStudents.length})
          </TabsTrigger>
          <TabsTrigger value="inactive" className="rounded-lg">
            Inactive ({inactiveStudents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card className="rounded-2xl border-0 shadow-lg">
            <CardHeader>
              <CardTitle>All Students</CardTitle>
              <CardDescription>Complete list of enrolled students</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredStudents.length === 0 ? (
                <div className="text-center py-12">
                  <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Students Found</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchTerm ? 'Try a different search term' : 'Add your first student to get started'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredStudents.map((student) => (
                    <StudentCard
                      key={student.id}
                      student={student}
                      onEdit={() => {
                        // TODO: Implement edit functionality
                        console.log('Edit student:', student.id)
                      }}
                      onDelete={() => {
                        setSelectedStudent(student)
                        setIsDeleteDialogOpen(true)
                      }}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active">
          <Card className="rounded-2xl border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Active Students</CardTitle>
              <CardDescription>Currently enrolled and active students</CardDescription>
            </CardHeader>
            <CardContent>
              {activeStudents.length === 0 ? (
                <div className="text-center py-12">
                  <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Active Students</h3>
                  <p className="text-gray-600 dark:text-gray-400">No active students found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeStudents.map((student) => (
                    <StudentCard
                      key={student.id}
                      student={student}
                      onEdit={() => console.log('Edit:', student.id)}
                      onDelete={() => {
                        setSelectedStudent(student)
                        setIsDeleteDialogOpen(true)
                      }}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inactive">
          <Card className="rounded-2xl border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Inactive Students</CardTitle>
              <CardDescription>Students who are currently inactive</CardDescription>
            </CardHeader>
            <CardContent>
              {inactiveStudents.length === 0 ? (
                <div className="text-center py-12">
                  <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Inactive Students</h3>
                  <p className="text-gray-600 dark:text-gray-400">All students are currently active</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {inactiveStudents.map((student) => (
                    <StudentCard
                      key={student.id}
                      student={student}
                      onEdit={() => console.log('Edit:', student.id)}
                      onDelete={() => {
                        setSelectedStudent(student)
                        setIsDeleteDialogOpen(true)
                      }}
                      showActivate
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

/**
 * Student Card Component
 * Displays individual student information
 */
function StudentCard({ 
  student, 
  onEdit, 
  onDelete,
  showActivate = false 
}: { 
  student: Student
  onEdit: () => void
  onDelete: () => void
  showActivate?: boolean
}) {
  const enrollmentCount = student._count?.enrollments || 0
  const quizAttempts = student._count?.quizAttempts || 0
  const grade = student.studentProfile?.grade || 'Not set'

  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200">
      <div className="flex items-center space-x-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={student.profileImage || "/placeholder.svg"} />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
            {student.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white">{student.name}</h3>
          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              <Mail className="w-4 h-4 mr-1" />
              {student.email}
            </div>
            {student.phone && (
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-1" />
                {student.phone}
              </div>
            )}
            <div className="flex items-center">
              <BookOpen className="w-4 h-4 mr-1" />
              {grade}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="text-center">
          <div className="text-sm font-medium text-gray-900 dark:text-white">{enrollmentCount}</div>
          <div className="text-xs text-gray-500">Enrollments</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-medium text-gray-900 dark:text-white">{quizAttempts}</div>
          <div className="text-xs text-gray-500">Quizzes</div>
        </div>
        <Badge variant={student.isActive !== false ? "default" : "secondary"}>
          {student.isActive !== false ? 'Active' : 'Inactive'}
        </Badge>
        <div className="flex items-center space-x-2">
          {showActivate && (
            <Button size="sm" variant="outline" className="rounded-xl bg-transparent">
              Activate
            </Button>
          )}
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full" onClick={onEdit}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 rounded-full text-red-600 hover:text-red-700"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
