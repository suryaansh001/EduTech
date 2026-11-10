"use client"

import { useMemo, useState } from "react"
import { BookOpen, Clock, Plus, Search, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

const initialClasses = [
  { id: "1", name: "Mathematics 101", teacher: "John Teacher", students: 24, schedule: "Mon, Wed 10:00 AM", status: "Active" },
  { id: "2", name: "Physics Advanced", teacher: "Sarah Wilson", students: 18, schedule: "Tue, Thu 2:00 PM", status: "Active" },
  { id: "3", name: "Chemistry Basics", teacher: "Michael Chen", students: 20, schedule: "Fri 11:00 AM", status: "Draft" },
]

export const ClassesManagement = () => {
  const [search, setSearch] = useState("")
  const [classes, setClasses] = useState(initialClasses)
  const [name, setName] = useState("")
  const [teacher, setTeacher] = useState("")
  const [schedule, setSchedule] = useState("")

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return classes.filter((c) => c.name.toLowerCase().includes(q) || c.teacher.toLowerCase().includes(q))
  }, [classes, search])

  const addClass = (e) => {
    e.preventDefault()
    if (!name.trim() || !teacher.trim()) return
    setClasses((prev) => [
      { id: String(Date.now()), name: name.trim(), teacher: teacher.trim(), students: 0, schedule: schedule.trim() || "TBD", status: "Active" },
      ...prev,
    ])
    setName("")
    setTeacher("")
    setSchedule("")
  }

  const toggleStatus = (id) => {
    setClasses((prev) => prev.map((c) => (c.id === id ? { ...c, status: c.status === "Active" ? "Draft" : "Active" } : c)))
  }

  return (
    <main className="min-h-full bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 sm:p-8">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Administration</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">Classes management</h2>
          <p className="mt-2 text-sm text-muted-foreground">Create, organize, and monitor classes across your institution.</p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <Card className="border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Create class</h3>
                <p className="text-xs text-muted-foreground">Add a new class</p>
              </div>
            </div>
            <form onSubmit={addClass} className="space-y-3">
              <Input placeholder="Class name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="Teacher name" value={teacher} onChange={(e) => setTeacher(e.target.value)} />
              <Input placeholder="Schedule (optional)" value={schedule} onChange={(e) => setSchedule(e.target.value)} />
              <Button type="submit" className="w-full gap-2" disabled={!name.trim() || !teacher.trim()}>
                <Plus className="h-4 w-4" /> Create class
              </Button>
            </form>
          </Card>

          <Card className="border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Classes</h3>
                  <p className="text-xs text-muted-foreground">{filtered.length} total</p>
                </div>
              </div>
              <div className="relative w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input placeholder="Search classes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {filtered.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-muted-foreground dark:border-slate-800">No classes match your search.</div>
              ) : (
                filtered.map((cls) => (
                  <div key={cls.id} className="flex flex-col gap-4 rounded-2xl border border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{cls.name}</p>
                        <Badge variant={cls.status === "Active" ? "default" : "secondary"}>{cls.status}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">Teacher: {cls.teacher}</p>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {cls.students} students</span>
                        <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {cls.schedule}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => toggleStatus(cls.id)}>
                        {cls.status === "Active" ? "Set draft" : "Activate"}
                      </Button>
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
