"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

export const StudentsManagement = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [classes, setClasses] = useState([])
  const [enrolledStudents, setEnrolledStudents] = useState([])

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Students Management</h2>

      <Card className="p-4 mb-4">
        <Input
          placeholder="Search students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-3"
        />
        <Button variant="primary" onClick={() => console.log('Add student')}>
          Add Student
        </Button>
        <p className="text-sm text-gray-500 mb-2">Search to find students to enroll in classes.</p>
      </Card>

      <Card className="p-4">
        <h3 className="font-medium mb-2">Available Students</h3>
        {enrolledStudents.length === 0 && <p className="text-gray-500">No students found</p>}
        <ul className="space-y-2">
          {enrolledStudents.map((student) => (
            <li key={student.id} className="px-2 py-1 rounded">
              <Button
                variant="outline"
                size="sm"
                onClick={() => console.log('Enroll student:', student.id)}
                style={{ width: '100%' }}
              >
                {student.name}
              </Button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}