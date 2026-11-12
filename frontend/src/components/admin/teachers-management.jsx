"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, BookOpen, Loader2, Mail, Plus, Search, User, UserPlus, Users } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { authApi, usersApi } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

const mapTeacher = (u) => ({
  id: u.id,
  name: u.name || "—",
  email: u.email || "—",
  status: u.isActive === false ? "Inactive" : "Active",
  subject: u.teacherProfile?.specialization || "—",
  classes: u._count?.createdClasses ?? 0,
  joined: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—",
  raw: u,
})

export const TeachersManagement = () => {
  const { token } = useAuth()
  const [search, setSearch] = useState("")
  const [teachers, setTeachers] = useState([])
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newSubject, setNewSubject] = useState("")
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const load = async () => {
    if (!token) {
      setError("Login with a database admin account to manage teachers.")
      setTeachers([])
      return
    }
    setLoading(true)
    setError("")
    try {
      const res = await usersApi.getUsers(token, { role: "TEACHER", limit: 100 })
      const list = Array.isArray(res?.data) ? res.data : (res?.data?.users || [])
      setTeachers(list.map(mapTeacher))
    } catch (e) {
      setError(e.message || "Failed to load teachers")
      setTeachers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [token])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return teachers.filter((t) => (t.name || "").toLowerCase().includes(q) || (t.email || "").toLowerCase().includes(q) || (t.subject || "").toLowerCase().includes(q))
  }, [teachers, search])

  const addTeacher = async (e) => {
    e.preventDefault()
    if (!newName.trim() || !newEmail.trim()) return
    if (!token) { setError("Login with a database admin account to add teachers."); return }
    setSaving(true)
    setError("")
    setSuccess("")
    try {
      await authApi.createUser({ name: newName.trim(), email: newEmail.trim(), role: "TEACHER", specialization: newSubject.trim() || undefined }, token)
      setNewName("")
      setNewEmail("")
      setNewSubject("")
      setSuccess("Teacher created in database (credentials emailed if configured).")
      await load()
      setTimeout(() => setSuccess(""), 4000)
    } catch (e) {
      setError(e.message || "Failed to create teacher")
    } finally {
      setSaving(false)
    }
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
                  {(selected.name || "?").charAt(0)}
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
              <Info label="Subject/Specialization" value={selected.subject} />
              <Info label="Classes" value={String(selected.classes)} />
              <Info label="Joined" value={selected.joined} />
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
          <p className="mt-2 text-sm text-muted-foreground">Add, review, and manage teacher accounts in the database.</p>
        </section>

        {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-500/10 dark:text-rose-300">{error}</div>}
        {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-500/10 dark:text-emerald-300">{success}</div>}

        <section className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <Card className="border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Add teacher</h3>
                <p className="text-xs text-muted-foreground">Create a new teacher in DB</p>
              </div>
            </div>
            <form onSubmit={addTeacher} className="space-y-3">
              <Input placeholder="Full name" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <Input type="email" placeholder="Email address" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
              <Input placeholder="Specialization/Subject (optional)" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} />
              <Button type="submit" className="w-full gap-2" disabled={!newName.trim() || !newEmail.trim() || saving || !token}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add teacher
              </Button>
            </form>
            <p className="mt-4 text-xs text-muted-foreground">Creates the user in the backend database (admin credentials required).</p>
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
              {loading ? (
                <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 p-8 text-sm text-muted-foreground dark:border-slate-800"><Loader2 className="h-4 w-4 animate-spin" /> Loading teachers...</div>
              ) : filtered.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-muted-foreground dark:border-slate-800">
                  {token ? "No teachers found." : "Sign in with a DB admin account to view teachers."}
                </div>
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
