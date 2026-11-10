"use client"

import { useState } from "react"
import { MessageCircle, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"

export const ChatContainer = () => {
  const { user } = useAuth()
  const [messages, setMessages] = useState([
    { id: 1, sender: "System", text: "Welcome to class chat. Start a conversation with your teacher or classmates.", self: false },
  ])
  const [text, setText] = useState("")

  const send = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    setMessages((prev) => [...prev, { id: Date.now(), sender: user?.name || "You", text: text.trim(), self: true }])
    setText("")
  }

  return (
    <main className="min-h-full bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 sm:p-8">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Communication</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">Class chat</h2>
          <p className="mt-2 text-sm text-muted-foreground">Ask questions and collaborate in real time.</p>
        </section>

        <Card className="flex h-[70vh] min-h-[420px] flex-col border-slate-200/80 bg-white/90 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <MessageCircle className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium">General discussion</p>
              <p className="text-xs text-muted-foreground">Messages are visible to your class</p>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.self ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm sm:max-w-[70%] ${m.self ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"}`}>
                  {!m.self && <p className="mb-0.5 text-xs font-medium opacity-70">{m.sender}</p>}
                  <p className="leading-relaxed">{m.text}</p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={send} className="flex gap-2 border-t border-slate-100 p-4 dark:border-slate-800">
            <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type your message..." className="h-11" />
            <Button type="submit" disabled={!text.trim()} className="h-11 gap-2 px-5">
              <Send className="h-4 w-4" /> Send
            </Button>
          </form>
        </Card>
      </div>
    </main>
  )
}