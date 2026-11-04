"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export const ChatContainer = () => {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Chat</h2>
      <div className="h-96 border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
        <div className="p-4 text-sm text-gray-500">
          Chat interface will appear here
        </div>
      </div>
      <Card className="mt-4 p-4">
        <Button variant="primary" className="w-full">
          Start Chat
        </Button>
      </Card>
    </div>
  )
}