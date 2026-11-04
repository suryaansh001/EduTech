"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"

export const NotesViewer = () => {
  const { user } = useAuth()

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Class Notes</h2>
      
      {user?.role === 'student' ? (
        <p className="text-gray-500">
          Your class notes will appear here. Access notes from your enrolled classes.
        </p>
      ) : (
        <p className="text-gray-500">
          Notes management available for students.
        </p>
      )}

      <div className="mt-4 p-4 bg-blue-50 rounded">
        <h3 className="font-medium mb-2">Available Notes</h3>
        <p className="text-sm text-gray-500">No notes available yet</p>
      </div>
    </div>
  )
}