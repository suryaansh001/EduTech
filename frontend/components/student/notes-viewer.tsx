"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Download, FileText, Calendar, User, Filter, Eye } from "lucide-react"

export function NotesViewer() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedNote, setSelectedNote] = useState<any>(null)

  const notes = [
    {
      id: 1,
      title: "Calculus - Derivatives and Applications",
      subject: "Mathematics",
      teacher: "Mr. Johnson",
      uploadDate: "2024-01-15",
      size: "2.5 MB",
      type: "PDF",
      description: "Comprehensive notes on derivatives, chain rule, and real-world applications",
      pages: 45,
      downloads: 234,
    },
    {
      id: 2,
      title: "Quantum Mechanics - Wave Functions",
      subject: "Physics",
      teacher: "Dr. Smith",
      uploadDate: "2024-01-14",
      size: "3.2 MB",
      type: "PDF",
      description: "Introduction to quantum mechanics and wave function properties",
      pages: 62,
      downloads: 189,
    },
    {
      id: 3,
      title: "Organic Chemistry - Reaction Mechanisms",
      subject: "Chemistry",
      teacher: "Ms. Davis",
      uploadDate: "2024-01-13",
      size: "1.8 MB",
      type: "PDF",
      description: "Detailed explanation of organic reaction mechanisms and pathways",
      pages: 38,
      downloads: 156,
    },
  ]

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.teacher.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleViewNote = (note: any) => {
    setSelectedNote(note)
  }

  const handleDownload = (note: any) => {
    // Simulate download
    console.log(`Downloading ${note.title}`)
  }

  if (selectedNote) {
    return (
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={() => setSelectedNote(null)} className="mb-2 rounded-xl">
              ← Back to Notes
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{selectedNote.title}</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {selectedNote.subject} • {selectedNote.teacher} • {selectedNote.pages} pages
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={() => handleDownload(selectedNote)} className="rounded-xl">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        {/* PDF Viewer Simulation */}
        <Card className="rounded-2xl border-0 shadow-lg">
          <CardContent className="p-0">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-8 min-h-[600px] flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-24 h-24 bg-red-500 rounded-2xl flex items-center justify-center mx-auto">
                  <FileText className="w-12 h-12 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">PDF Viewer</h3>
                  <p className="text-gray-600 dark:text-gray-400">{selectedNote.title} would be displayed here</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    In a real implementation, this would show the actual PDF content
                  </p>
                </div>
                <div className="flex items-center justify-center space-x-4 pt-4">
                  <Button variant="outline" className="rounded-xl bg-transparent">
                    Previous Page
                  </Button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Page 1 of {selectedNote.pages}</span>
                  <Button variant="outline" className="rounded-xl bg-transparent">
                    Next Page
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Note Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="rounded-2xl border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Note Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Subject:</span>
                <Badge variant="secondary">{selectedNote.subject}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Teacher:</span>
                <span className="font-medium">{selectedNote.teacher}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Upload Date:</span>
                <span className="font-medium">{selectedNote.uploadDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">File Size:</span>
                <span className="font-medium">{selectedNote.size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Downloads:</span>
                <span className="font-medium">{selectedNote.downloads}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 rounded-2xl border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300">{selectedNote.description}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notes & Materials</h1>
          <p className="text-gray-600 dark:text-gray-400">Access all your study materials in one place</p>
        </div>
      </div>

      {/* Search and Filter */}
      <Card className="rounded-2xl border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search notes by title, subject, or teacher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>
            <Button variant="outline" className="rounded-xl bg-transparent">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notes by Subject */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 rounded-xl">
          <TabsTrigger value="all" className="rounded-lg">
            All Notes
          </TabsTrigger>
          <TabsTrigger value="mathematics" className="rounded-lg">
            Mathematics
          </TabsTrigger>
          <TabsTrigger value="physics" className="rounded-lg">
            Physics
          </TabsTrigger>
          <TabsTrigger value="chemistry" className="rounded-lg">
            Chemistry
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map((note) => (
              <Card
                key={note.id}
                className="rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{note.title}</h3>
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {note.subject}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {note.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{note.description}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        {note.teacher}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {note.uploadDate}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>
                        {note.pages} pages • {note.size}
                      </span>
                      <span>{note.downloads} downloads</span>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                      <Button size="sm" onClick={() => handleViewNote(note)} className="flex-1 rounded-xl">
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDownload(note)} className="rounded-xl">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="mathematics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes
              .filter((note) => note.subject === "Mathematics")
              .map((note) => (
                <Card
                  key={note.id}
                  className="rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{note.title}</h3>
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {note.subject}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {note.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{note.description}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          {note.teacher}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {note.uploadDate}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>
                          {note.pages} pages • {note.size}
                        </span>
                        <span>{note.downloads} downloads</span>
                      </div>

                      <div className="flex items-center space-x-2 pt-2">
                        <Button size="sm" onClick={() => handleViewNote(note)} className="flex-1 rounded-xl">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDownload(note)} className="rounded-xl">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="physics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes
              .filter((note) => note.subject === "Physics")
              .map((note) => (
                <Card
                  key={note.id}
                  className="rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{note.title}</h3>
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {note.subject}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {note.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{note.description}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          {note.teacher}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {note.uploadDate}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>
                          {note.pages} pages • {note.size}
                        </span>
                        <span>{note.downloads} downloads</span>
                      </div>

                      <div className="flex items-center space-x-2 pt-2">
                        <Button size="sm" onClick={() => handleViewNote(note)} className="flex-1 rounded-xl">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDownload(note)} className="rounded-xl">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="chemistry" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes
              .filter((note) => note.subject === "Chemistry")
              .map((note) => (
                <Card
                  key={note.id}
                  className="rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{note.title}</h3>
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {note.subject}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {note.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{note.description}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          {note.teacher}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {note.uploadDate}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>
                          {note.pages} pages • {note.size}
                        </span>
                        <span>{note.downloads} downloads</span>
                      </div>

                      <div className="flex items-center space-x-2 pt-2">
                        <Button size="sm" onClick={() => handleViewNote(note)} className="flex-1 rounded-xl">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDownload(note)} className="rounded-xl">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
