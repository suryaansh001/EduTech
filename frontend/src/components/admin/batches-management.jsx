"use client"

import { useEffect, useMemo, useState } from "react"
import { BookOpen, Loader2, Plus, Search, UserMinus, UserPlus, Users } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { classesApi } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export const BatchesManagement = () => {
  const { token, user } = useAuth()
  const [batches, setBatches] = useState([])
  const [search, setSearch] = useState("")
  const [name, setName] = useState("")
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")
  const [selectedId, setSelectedId] = useState(null)
  const [enrollments, setEnrollments] = useState([])
  const [available, setAvailable] = useState([])
  const [availSearch, setAvailSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [enrollLoading, setEnrollLoading] = useState(false)
  const [addingId, setAddingId] = useState(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const selected = batches.find((b) => b.id === selectedId) || null

  const loadBatches = async () => {
    if (!token) { setError("Login with a database admin/teacher account to manage batches."); setBatches([]); return }
    setLoading(true); setError("")
    try {
      const res = await classesApi.getClasses(token)
      const list = Array.isArray(res?.data) ? res.data : (res?.data?.classes || [])
      setBatches(list)
    } catch (e) { setError(e.message || "Failed to load batches"); setBatches([]) }
    finally { setLoading(false) }
  }

  const loadDetails = async (id) => {
    if (!token || !id) return
    setEnrollLoading(true)
    try {
      const [enrRes, availRes] = await Promise.all([
        classesApi.getEnrollments(id, token),
        classesApi.getAvailableStudents(id, token, { limit: 50 }),
      ])
      setEnrollments(Array.isArray(enrRes?.data) ? enrRes.data : (enrRes?.data?.enrollments || []))
      setAvailable(Array.isArray(availRes?.data) ? availRes.data : (availRes?.data?.students || []))
    } catch (e) { setError(e.message || "Failed to load batch details") }
    finally { setEnrollLoading(false) }
  }

  useEffect(() => { loadBatches() }, [token])
  useEffect(() => { if (selectedId) loadDetails(selectedId); else { setEnrollments([]); setAvailable([]) } }, [selectedId])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return batches.filter((b) => (b.title || "").toLowerCase().includes(q) || (b.subject || "").toLowerCase().includes(q))
  }, [batches, search])

  const filteredAvailable = useMemo(() => {
    const q = availSearch.toLowerCase()
    return available.filter((s) => (s.name || "").toLowerCase().includes(q) || (s.email || "").toLowerCase().includes(q))
  }, [available, availSearch])

  const createBatch = async (e) => {
    e.preventDefault()
    if (!name.trim() || !subject.trim() || !token) return
    setSaving(true); setError(""); setSuccess("")
    try {
      await classesApi.createClass({
        title: name.trim(),
        subject: subject.trim(),
        description: description.trim() || undefined,
        startDate: new Date().toISOString(),
        status: "ACTIVE",
      }, token)
      setName(""); setSubject(""); setDescription("")
      setSuccess("Batch created in database.")
      await loadBatches()
      setTimeout(() => setSuccess(""), 3000)
    } catch (e) { setError(e.message || "Failed to create batch") }
    finally { setSaving(false) }
  }

  const addStudent = async (studentId) => {
    if (!token || !selectedId) return
    setAddingId(studentId); setError("")
    try {
      await classesApi.bulkEnroll(selectedId, [studentId], token)
      setSuccess("Student added to batch.")
      await loadBatches()
      await loadDetails(selectedId)
      setTimeout(() => setSuccess(""), 3000)
    } catch (e) { setError(e.message || "Failed to add student") }
    finally { setAddingId(null) }
  }

  const removeStudent = async (studentId) => {
    if (!token || !selectedId) return
    setAddingId(studentId); setError("")
    try {
      await classesApi.removeStudent(selectedId, studentId, token)
      setSuccess("Student removed from batch.")
      await loadBatches()
      await loadDetails(selectedId)
      setTimeout(() => setSuccess(""), 3000)
    } catch (e) { setError(e.message || "Failed to remove student") }
    finally { setAddingId(null) }
  }

  return (
    <main className="min-h-full bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 sm:p-8">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Administration</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">Batches management</h2>
          <p className="mt-2 text-sm text-muted-foreground">Create batches (classes) and assign students to different batches in the database.</p>
        </section>

        {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-500/10 dark:text-rose-300">{error}</div>}
        {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-500/10 dark:text-emerald-300">{success}</div>}

        <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <div className="space-y-6">
            <Card className="border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"><BookOpen className="h-5 w-5" /></div>
                <div><h3 className="font-semibold">Create batch</h3><p className="text-xs text-muted-foreground">Saved to database</p></div>
              </div>
              <form onSubmit={createBatch} className="space-y-3">
                <Input placeholder="Batch/Class name" value={name} onChange={(e) => setName(e.target.value)} />
                <Input placeholder="Subject (required)" value={subject} onChange={(e) => setSubject(e.target.value)} />
                <Input placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
                <Button type="submit" className="w-full gap-2" disabled={!name.trim() || !subject.trim() || saving || !token}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create batch
                </Button>
              </form>
              {!token && <p className="mt-3 text-xs text-amber-600">Sign in with a DB account to create batches.</p>}
            </Card>

            <Card className="border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold">Batches</h3>
                <Badge variant="secondary">{filtered.length}</Badge>
              </div>
              <div className="relative mt-3">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input placeholder="Search batches..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <div className="mt-4 space-y-2">
                {loading ? (
                  <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
                ) : filtered.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-sm text-muted-foreground dark:border-slate-800">{token ? "No batches found." : "Sign in to view batches."}</p>
                ) : filtered.map((b) => (
                  <button key={b.id} type="button" onClick={() => setSelectedId(b.id)} className={`w-full rounded-xl border p-3 text-left transition ${selectedId === b.id ? "border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-500/10" : "border-slate-100 hover:border-blue-200 dark:border-slate-800"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{b.title}</p>
                        <p className="text-xs text-muted-foreground">{b.subject} · {b._count?.enrollments ?? 0} students</p>
                      </div>
                      <Badge variant={b.status === "ACTIVE" ? "default" : "secondary"}>{b.status || "—"}</Badge>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          <Card className="border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
            {!selected ? (
              <div className="flex h-full min-h-[300px] items-center justify-center text-center text-sm text-muted-foreground">Select a batch to view and assign students.</div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold tracking-tight">{selected.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{selected.subject}{selected.description ? ` · ${selected.description}` : ""}</p>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="font-semibold">Enrolled students</h4>
                      <Badge variant="secondary">{enrollments.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {enrollLoading ? (
                        <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
                      ) : enrollments.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-sm text-muted-foreground dark:border-slate-800">No students in this batch yet.</p>
                      ) : enrollments.map((en) => (
                        <div key={en.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                          <div className="min-w-0 flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"><Users className="h-4 w-4" /></div>
                            <div className="min-w-0"><p className="truncate text-sm font-medium">{en.user?.name || en.userId}</p><p className="truncate text-xs text-muted-foreground">{en.user?.email}</p></div>
                          </div>
                          <Button type="button" size="sm" variant="outline" className="h-8 gap-1.5 text-rose-600" onClick={() => removeStudent(en.user?.id || en.userId)} disabled={addingId === (en.user?.id || en.userId)}>
                            {addingId === (en.user?.id || en.userId) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserMinus className="h-3.5 w-3.5" />} Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="font-semibold">Add students</h4>
                      <Badge variant="secondary">{filteredAvailable.length}</Badge>
                    </div>
                    <div className="relative mb-3">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input placeholder="Search available students..." value={availSearch} onChange={(e) => setAvailSearch(e.target.value)} className="pl-9" />
                    </div>
                    <div className="space-y-2">
                      {enrollLoading ? (
                        <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
                      ) : filteredAvailable.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-sm text-muted-foreground dark:border-slate-800">No available students found.</p>
                      ) : filteredAvailable.map((s) => (
                        <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                          <div className="min-w-0"><p className="truncate text-sm font-medium">{s.name}</p><p className="truncate text-xs text-muted-foreground">{s.email}</p></div>
                          <Button type="button" size="sm" className="h-8 gap-1.5" onClick={() => addStudent(s.id)} disabled={addingId === s.id}>
                            {addingId === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />} Add
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </section>
      </div>
    </main>
  )
}
