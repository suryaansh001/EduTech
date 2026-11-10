"use client"

import { useMemo, useState } from "react"
import { ArrowLeft, BookOpen, Mail, Plus, Search, User, UserPlus, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

const initialTeachers = [
  { id: "1", name: "John Teacher", email: "teacher@school.com", status: "Active", subject: "Mathematics", classes: 3, joined: "Jan 2026" },
  { id: "2", name: "Sarah Wilson", email: "sarah.w@school.com", status: "Active", subject: "Physics", classes: 2, joined: "Feb 2026" },
  { id: "3", name: "Michael Chen", email: "michael.c@school.com", status: "On Leave", subject: "Chemistry", classes: 1, joined: "Mar 2026" },
]

export const TeachersManagement = () => {
  const [search, setSearch] = useState("")
  const [teachers, setTeachers] = useState(initialTeachers)
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newSubject, setNewSubject] = useState("")
  const [selected, setSelected] = useState(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return teachers.filter((t) => t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q))
  }, [teachers, search])

  const addTeacher = (e) => {
    e.preventDefault()
    if (!newName.trim() || !newEmail.trim()) return
    setTeachers((prev) => [
      { id: String(Date.now()), name: newName.trim(), email: newEmail.trim(), status: "Active", subject: newSubject.trim() || "—", classes: 0, joined: "Today" },
      ...prev,
    ])
    setNewName("")
    setNewEmail("")
    setNewSubject("")
  }

  if (selected) {
    return (
      <main className="min-h-full bg-transparent px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <Button variant="ghost" onClick={() => setSelected(null)} className="-ml-2 gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to teachers
          </Button>
          <Card className="border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-xl font-semibold text-white">
                  {selected.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">{selected.name}</h2>
                  <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><Mail className="h-4 w-4" /> {selected.email}</p>
                </div>
              </div>
              <Badge variant={selected.status === "Active" ? "default" : "secondary"}>{selected.status}</Badge>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Teacher ID" value={selected.id} />
              <Info label="Subject" value={selected.subject} />
              <Info label="Classes" value={String(selected.classes)} />
              <Info label="Joined" value={selected.joined} />
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={() => alert(`Edit ${selected.name}`)}>Edit teacher</Button>
              <Button variant="outline" onClick={() => setTeachers((prev) => prev.map((t) => t.id === selected.id ? { ...t, status: t.status === "Active" ? "On Leave" : "Active" } : t)) || setSelected({ ...selected, status: selected.status === "Active" ? "On Leave" : "Active" })}>
                Toggle status
              </Button>
            </div>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-full bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 sm:p-8">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Administration</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">Teachers management</h2>
          <p className="mt-2 text-sm text-muted-foreground">Add, review, and manage teacher accounts.</p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <Card className="border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Add teacher</h3>
                <p className="text-xs text-muted-foreground">Create a new teacher record</p>
              </div>
            </div>
            <form onSubmit={addTeacher} className="space-y-3">
              <Input placeholder="Full name" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <Input type="email" placeholder="Email address" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
              <Input placeholder="Subject (optional)" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} />
              <Button type="submit" className="w-full gap-2" disabled={!newName.trim() || !newEmail.trim()}>
                <Plus className="h-4 w-4" /> Add teacher
              </Button>
            </form>
          </Card>

          <Card className="border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Teachers</h3>
                  <p className="text-xs text-muted-foreground">{filtered.length} total</p>
                </div>
              </div>
              <div className="relative w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input placeholder="Search teachers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {filtered.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-muted-foreground dark:border-slate-800">No teachers match your search.</div>
              ) : (
                filtered.map((teacher) => (
                  <div key={teacher.id} className="flex flex-col gap-3 rounded-2xl border border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{teacher.name}</p>
                        <p className="truncate text-sm text-muted-foreground">{teacher.email} · {teacher.subject}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={teacher.status === "Active" ? "default" : "secondary"}>{teacher.status}</Badge>
                      <Button variant="outline" size="sm" onClick={() => setSelected(teacher)}>View</Button>
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

function Info({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  )
}
