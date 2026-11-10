"use client"

import { BookOpen, Download, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const sampleNotes = [
  { id: 1, title: "Calculus - Derivatives", subject: "Mathematics", date: "Apr 2, 2026", size: "1.2 MB" },
  { id: 2, title: "Quantum Mechanics Intro", subject: "Physics", date: "Apr 1, 2026", size: "2.4 MB" },
]

export const NotesViewer = () => {
  return (
    <main className="min-h-full bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 sm:p-8">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Study materials</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">Class notes</h2>
          <p className="mt-2 text-sm text-muted-foreground">Access notes shared by your teachers for each subject.</p>
        </section>

        <Card className="border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
          <div className="mb-5 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Available notes</h3>
              <p className="text-xs text-muted-foreground">{sampleNotes.length} file(s)</p>
            </div>
          </div>

          <div className="space-y-3">
            {sampleNotes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-muted-foreground dark:border-slate-800">
                No notes available yet.
              </div>
            ) : (
              sampleNotes.map((note) => (
                <div key={note.id} className="flex flex-col gap-4 rounded-2xl border border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{note.title}</p>
                      <p className="text-xs text-muted-foreground">{note.subject} · {note.date} · {note.size}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2 self-start sm:self-auto">
                    <Download className="h-4 w-4" /> Download
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </main>
  )
}