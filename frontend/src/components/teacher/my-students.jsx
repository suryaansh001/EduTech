"use client"

import { useMemo, useState } from "react"
import { Mail, Search, User, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

const initialStudents = [
  { id: "1", name: "Jane Student", email: "student@school.com", status: "Active", batch: "Batch 1", progress: "82%", lastActive: "Today" },
  { id: "2", name: "Student One", email: "student1@school.com", status: "Active", batch: "Batch 1", progress: "74%", lastActive: "Yesterday" },
  { id: "3", name: "Student Two", email: "student2@school.com", status: "Active", batch: "Batch 1", progress: "91%", lastActive: "Today" },
  { id: "4", name: "Student Three", email: "student3@school.com", status: "Active", batch: "Batch 2", progress: "68%", lastActive: "2 days ago" },
]

export const MyStudents = () => {
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return initialStudents.filter((s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.batch.toLowerCase().includes(q))
  }, [search])

  return (
    <main className="min-h-full bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 sm:p-8">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Teacher workspace</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">My students</h2>
          <p className="mt-2 text-sm text-muted-foreground">View and manage the students in your classes.</p>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <Card className="border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Students</h3>
                  <p className="text-xs text-muted-foreground">{filtered.length} in your classes</p>
                </div>
              </div>
              <div className="relative w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {filtered.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-muted-foreground dark:border-slate-800">No students found.</div>
              ) : (
                filtered.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => setSelected(student)}
                    className={`flex w-full flex-col gap-3 rounded-2xl border p-4 text-left transition sm:flex-row sm:items-center sm:justify-between ${
                      selected?.id === student.id
                        ? "border-blue-600 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-500/10"
                        : "border-slate-100 hover:border-blue-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-blue-900 dark:hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{student.name}</p>
                        <p className="truncate text-sm text-muted-foreground">{student.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{student.batch}</Badge>
                      <Badge>{student.status}</Badge>
                    </div>
                  </button>
                ))
              )}
            </div>
          </Card>

          <Card className="h-fit border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
            <h3 className="text-lg font-semibold">Student details</h3>
            {!selected ? (
              <p className="mt-4 text-sm text-muted-foreground">Select a student to view details.</p>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 font-semibold text-white">{selected.name.charAt(0)}</div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{selected.name}</p>
                    <p className="flex items-center gap-1 truncate text-sm text-muted-foreground"><Mail className="h-3.5 w-3.5" /> {selected.email}</p>
                  </div>
                </div>
                <div className="grid gap-3">
                  <Detail label="Batch" value={selected.batch} />
                  <Detail label="Status" value={selected.status} />
                  <Detail label="Progress" value={selected.progress} />
                  <Detail label="Last active" value={selected.lastActive} />
                </div>
                <Button className="w-full" variant="outline" onClick={() => alert(`Message sent to ${selected.email}`)}>Send message</Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </main>
  )
}

function Detail({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 dark:border-slate-800">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}
