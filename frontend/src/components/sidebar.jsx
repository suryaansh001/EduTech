"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { Menu, MenuItems, MenuTrigger, MenuContent, MenuItem } from "@/components/ui/menu"

export const Sidebar = ({
  activeItem,
  onItemClick,
  userRole,
  isCollapsed,
  onToggleCollapse,
}) => {
  const menuItems = {
    teacher: [
      { label: 'Dashboard', value: 'dashboard' },
      { label: 'My Schedule', value: 'schedule' },
      { label: 'Upload Notes', value: 'upload-notes' },
      { label: 'My Students', value: 'students' },
      { label: 'Class Recordings', value: 'recordings' },
      { label: 'Notifications', value: 'notifications' },
      { label: 'Chat', value: 'chat' },
      { label: 'Quizzes', value: 'quizzes' },
    ],
    student: [
      { label: 'Dashboard', value: 'dashboard' },
      { label: 'Class Schedule', value: 'schedule' },
      { label: 'Class Notes', value: 'notes' },
      { label: 'Class Recordings', value: 'recordings' },
      { label: 'Notifications', value: 'notifications' },
      { label: 'Chat', value: 'chat' },
    ],
    admin: [
      { label: 'Dashboard', value: 'dashboard' },
      { label: 'Students', value: 'students' },
      { label: 'Teachers', value: 'teachers' },
      { label: 'Batches', value: 'batches' },
      { label: 'Classes', value: 'classes' },
      { label: 'Schedule', value: 'schedule' },
      { label: 'Notifications', value: 'notifications' },
      { label: 'Analytics', value: 'analytics' },
      { label: 'Settings', value: 'settings' },
      { label: 'Quizzes', value: 'quizzes' },
    ],
  }

  const items = menuItems[userRole] || menuItems.student

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shrink-0 transform transition-transform duration-300 ease-out" style={{ transform: isCollapsed ? 'translateX(-100%)' : 'translateX(0)' }}>
      <div className="flex h-16 items-center justify-between px-4">
        <button
          onClick={onToggleCollapse}
          className="hidden lg:block p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600"
          aria-label="Collapse sidebar"
        >
          ←
        </button>
      </div>

      <nav className="flex-1 pt-6">
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.value} className="group">
              <Link
                onClick={() => onItemClick(item.value)}
                className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 group-[.active]:bg-primary-600 group-[.active]:text-white"
                style={{
                  background: activeItem === item.value ? 'primary-600' : 'transparent',
                  color: activeItem === item.value ? 'white' : 'currentColor',
                }}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}