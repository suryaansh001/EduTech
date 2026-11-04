"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"

export const TeacherDashboard = () => {
  const { user } = useAuth()

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Welcome, {user.name}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="font-medium mb-2">Quick Actions</h3>
          <Button
            variant="primary"
            onClick={() => console.log('Create quiz')}
            className="w-full mb-3"
          >
            Create Quiz
          </Button>
          <Button
            variant="outline"
            onClick={() => console.log('Manage Classes')}
            className="w-full"
          >
            Manage Classes
          </Button>
        </Card>

        <Card className="p-4">
          <h3 className="font-medium mb-2">Recent Activity</h3>
          <p className="text-gray-500">No recent activity</p>
        </Card>
      </div>
    </div>
  )
}