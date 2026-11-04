"use client"

import { cn } from "@/lib/utils"
import { Slot } from "@radix-ui/react-slot"
import { useEffect } from "react"
import { useDisclosure } from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { useState } from "react"

export const DashboardLayout = ({
  sidebar,
  header,
  children,
}) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        {sidebar}
        <div className="flex-1 flex flex-col">
          {header}
          <div className="flex-1 overflow-auto">{children}</div>
        </div>
      </div>
    </div>
  )
}