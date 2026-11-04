"use client"

import { Slot } from "@radix-ui/react-slot"
import { useDisclosure } from "@radix-ui/react-dialog"
import { useState } from "react"

export const DashboardHeader = ({
  title,
  subtitle,
  onMenuClick,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
        <button
          onClick={onMenuClick}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600"
          aria-label="Open menu"
        >
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : null}
        </button>
      </div>
    </header>
  )
}