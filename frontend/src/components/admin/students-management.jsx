"use client"

import { useMemo, useState } from "react"
import { Plus, Search, UserPlus, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

const initialStudents = [
  { id: "1", name: "Jane Student", email: "student@school.com", status: "Active" },
  { id: "2", name: "Student One", email: "student1@school.com", status: "Active" },
  { id: "3", name: "Student Two", email: "student2@school.com", status: "Active" },
  { id: "4", name: "Student Three", email: "student3@school.com", status: "Active" },
]

export const StudentsManagement = () => {
  const [search, setSearch] = useState("")
  const [students, setStudents] = useState(initialStudents)
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return students.filter((s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q))
  }, [students, search])

  const addStudent = (e) => {
    e.preventDefault()
    if (!newName.trim() || !newEmail.trim()) return
    setStudents((prev) => [{ id: String(Date.now()), name: newName.trim(), email: newEmail.trim(), status: "Active" }, ...prev])
    setNewName("")
    setNewEmail("")
  }

  return (
    <main className="min-h-full bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 sm:p-8">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Administration</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">Students management</h2>
          <p className="mt-2 text-sm text-muted-foreground">Search, add, and review students in one place.</p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <Card className="border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Add student</h3>
                <p className="text-xs text-muted-foreground">Create a new student record</p>
              </div>
            </div>
            <form onSubmit={addStudent} className="space-y-3">
              <Input placeholder="Full name" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <Input type="email" placeholder="Email address" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
              <Button type="submit" className="w-full gap-2" disabled={!newName.trim() || !newEmail.trim()}>
                <Plus className="h-4 w-4" /> Add student
              </Button>
            </form>
            <p className="mt-4 text-xs text-muted-foreground">Tip: Use consistent email formats for easier account management.</p>
          </Card>

          <Card className="border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Students</h3>
                  <p className="text-xs text-muted-foreground">{filtered.length} total</p>
                </div>
              </div>
              <div className="relative w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {filtered.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-muted-foreground dark:border-slate-800">
                  No students match your search.
                </div>
              ) : (
                filtered.map((student) => (
                  <div key={student.id} className="flex flex-col gap-3 rounded-2xl border border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{student.name}</p>
                      <p className="truncate text-sm text-muted-foreground">{student.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{student.status}</Badge>
                      <Button variant="outline" size="sm">View</Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </section>
      </div>
    </main>
  )
}