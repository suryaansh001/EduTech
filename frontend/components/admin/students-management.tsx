"use client"

import { useState } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Edit, Trash2, Mail, Phone, BookOpen, MoreHorizontal, UserPlus, Upload } from "lucide-react"

export function StudentsManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    phone: "",
    batch: "",
    enrollmentDate: "",
  })

  const students = [
    {
      id: 1,
      name: "Alice Johnson",
      email: "alice.johnson@email.com",
      phone: "+1 234 567 8901",
      batch: "Batch A - Mathematics",
      enrollmentDate: "2024-01-15",
      status: "active",
      avatar: "/api/placeholder/40/40",
      performance: 85,
      attendance: 92,
    },
    {
      id: 2,
      name: "Bob Smith",
      email: "bob.smith@email.com",
      phone: "+1 234 567 8902",
      batch: "Batch B - Physics",
      enrollmentDate: "2024-01-10",
      status: "active",
      avatar: "/api/placeholder/40/40",
      performance: 78,
      attendance: 88,
    },
    {
      id: 3,
      name: "Carol Davis",
      email: "carol.davis@email.com",
      phone: "+1 234 567 8903",
      batch: "Batch C - Chemistry",
      enrollmentDate: "2024-01-20",
      status: "inactive",
      avatar: "/api/placeholder/40/40",
      performance: 91,
      attendance: 95,
    },
  ]

  const batches = ["Batch A - Mathematics", "Batch B - Physics", "Batch C - Chemistry"]

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.batch.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddStudent = () => {
    // Generate random password
    const password = Math.random().toString(36).slice(-8)
    console.log("New student created:", { ...newStudent, password })
    setIsAddDialogOpen(false)
    setNewStudent({ name: "", email: "", phone: "", batch: "", enrollmentDate: "" })
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
          <Button variant="outline" className="rounded-xl bg-transparent">
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
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
                  Create a new student account. A password will be generated automatically.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                    placeholder="Enter student's full name"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                    placeholder="Enter email address"
                    className="rounded-xl"
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batch">Batch</Label>
                  <Select
                    value={newStudent.batch}
                    onValueChange={(value) => setNewStudent({ ...newStudent, batch: value })}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select a batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {batches.map((batch) => (
                        <SelectItem key={batch} value={batch}>
                          {batch}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="enrollmentDate">Enrollment Date</Label>
                  <Input
                    id="enrollmentDate"
                    type="date"
                    value={newStudent.enrollmentDate}
                    onChange={(e) => setNewStudent({ ...newStudent, enrollmentDate: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="rounded-xl">
                    Cancel
                  </Button>
                  <Button onClick={handleAddStudent} className="rounded-xl">
                    Create Student
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
                placeholder="Search students by name, email, or batch..."
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

      {/* Students Table */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 rounded-xl">
          <TabsTrigger value="all" className="rounded-lg">
            All Students
          </TabsTrigger>
          <TabsTrigger value="active" className="rounded-lg">
            Active
          </TabsTrigger>
          <TabsTrigger value="inactive" className="rounded-lg">
            Inactive
          </TabsTrigger>
          <TabsTrigger value="pending" className="rounded-lg">
            Pending
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card className="rounded-2xl border-0 shadow-lg">
            <CardHeader>
              <CardTitle>All Students</CardTitle>
              <CardDescription>Complete list of enrolled students</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={student.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                          {student.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{student.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center">
                            <Mail className="w-4 h-4 mr-1" />
                            {student.email}
                          </div>
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-1" />
                            {student.phone}
                          </div>
                          <div className="flex items-center">
                            <BookOpen className="w-4 h-4 mr-1" />
                            {student.batch}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{student.performance}%</div>
                        <div className="text-xs text-gray-500">Performance</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{student.attendance}%</div>
                        <div className="text-xs text-gray-500">Attendance</div>
                      </div>
                      <Badge variant={student.status === "active" ? "default" : "secondary"}>{student.status}</Badge>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 rounded-full text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
              <div className="space-y-4">
                {filteredStudents
                  .filter((s) => s.status === "active")
                  .map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                    >
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={student.avatar || "/placeholder.svg"} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                            {student.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{student.name}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center">
                              <Mail className="w-4 h-4 mr-1" />
                              {student.email}
                            </div>
                            <div className="flex items-center">
                              <BookOpen className="w-4 h-4 mr-1" />
                              {student.batch}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {student.performance}%
                          </div>
                          <div className="text-xs text-gray-500">Performance</div>
                        </div>
                        <Badge variant="default">Active</Badge>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
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
              <div className="space-y-4">
                {filteredStudents
                  .filter((s) => s.status === "inactive")
                  .map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                    >
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={student.avatar || "/placeholder.svg"} />
                          <AvatarFallback className="bg-gradient-to-br from-gray-500 to-gray-600 text-white">
                            {student.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{student.name}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center">
                              <Mail className="w-4 h-4 mr-1" />
                              {student.email}
                            </div>
                            <div className="flex items-center">
                              <BookOpen className="w-4 h-4 mr-1" />
                              {student.batch}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <Badge variant="secondary">Inactive</Badge>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline" className="rounded-xl bg-transparent">
                            Activate
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card className="rounded-2xl border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Pending Students</CardTitle>
              <CardDescription>Students awaiting approval or activation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Pending Students</h3>
                <p className="text-gray-600 dark:text-gray-400">All students have been processed</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
