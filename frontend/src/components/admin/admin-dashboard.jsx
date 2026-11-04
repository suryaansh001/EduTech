"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

export const AdminDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Welcome, Admin</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="font-medium mb-2">Management</h3>
          <Button
            variant="primary"
            onClick={() => navigate('/admin/students')}
            className="w-full mb-3"
          >
            Students
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/admin/teachers')}
            className="w-full"
          >
            Teachers
          </Button>
        </Card>
        <Card className="p-4">
          <h3 className="font-medium mb-2">Overview</h3>
          <Button
            variant="outline"
            onClick={() => navigate('/admin/quizzes')}
            className="w-full"
          >
            Quizzes
          </Button>
        </Card>
      </div>
    </div>
  )
}