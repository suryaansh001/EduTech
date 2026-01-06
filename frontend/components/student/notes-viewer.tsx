"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Download, FileText, Calendar, User, Filter, Eye, Loader2, RefreshCw, AlertCircle } from "lucide-react"
import { notesApi, filesApi } from "@/lib/api"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Types for API data
interface Note {
  id: string;
  title: string;
  content?: string;
  subject?: string;
  createdAt: string;
  updatedAt: string;
  class?: {
    id: string;
    name: string;
    subject: string;
  };
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  attachments?: Array<{
    id: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    url: string;
  }>;
}

export function NotesViewer() {
  const [notes, setNotes] = useState<Note[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)

  /**
   * Fetch notes from backend
   * REASON: Get real notes data from the API
   */
  const fetchNotes = async () => {
    try {
      setError(null);
      const response = await notesApi.getNotes();
      
      if (response.success && response.data) {
        setNotes(response.data.notes || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch notes:', err);
      setError(err.message || 'Failed to load notes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotes();
  };

  /**
   * Filter notes based on search term
   */
  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const searchLower = searchTerm.toLowerCase();
      return (
        note.title.toLowerCase().includes(searchLower) ||
        note.subject?.toLowerCase().includes(searchLower) ||
        note.class?.subject?.toLowerCase().includes(searchLower) ||
        note.createdBy?.firstName?.toLowerCase().includes(searchLower) ||
        note.createdBy?.lastName?.toLowerCase().includes(searchLower)
      );
    });
  }, [notes, searchTerm]);

  /**
   * Get unique subjects for tabs
   */
  const subjects = useMemo(() => {
    const subjectSet = new Set<string>();
    notes.forEach(note => {
      const subject = note.subject || note.class?.subject;
      if (subject) subjectSet.add(subject);
    });
    return Array.from(subjectSet);
  }, [notes]);

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  /**
   * Format file size for display
   */
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  /**
   * Get teacher name from note
   */
  const getTeacherName = (note: Note) => {
    if (note.createdBy) {
      return `${note.createdBy.firstName} ${note.createdBy.lastName}`;
    }
    return 'Unknown';
  };

  /**
   * Get subject from note
   */
  const getSubject = (note: Note) => {
    return note.subject || note.class?.subject || 'General';
  };

  /**
   * Handle note view
   */
  const handleViewNote = (note: Note) => {
    setSelectedNote(note);
  };

  /**
   * Handle note download
   * SECURITY: Downloads go through backend for access control
   */
  const handleDownload = async (note: Note) => {
    try {
      setDownloading(note.id);
      
      // If note has attachments, download the first one
      if (note.attachments && note.attachments.length > 0) {
        const attachment = note.attachments[0];
        const blob = await filesApi.download(attachment.id);
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = attachment.fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // If no attachment, create a text file with the note content
        const content = `${note.title}\n\n${note.content || 'No content'}`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${note.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download note');
    } finally {
      setDownloading(null);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading notes...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button variant="outline" size="sm" className="ml-4" onClick={handleRefresh}>
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  /**
   * Render note card component
   */
  const NoteCard = ({ note }: { note: Note }) => (
    <Card
      className="rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer"
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{note.title}</h3>
            <div className="flex items-center space-x-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {getSubject(note)}
              </Badge>
              {note.attachments && note.attachments.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {note.attachments[0].fileType?.split('/')[1]?.toUpperCase() || 'FILE'}
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              {note.content || 'No description available'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              <User className="w-4 h-4 mr-1" />
              {getTeacherName(note)}
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {formatDate(note.createdAt)}
            </div>
          </div>

          {note.attachments && note.attachments.length > 0 && (
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>{note.attachments.length} attachment(s)</span>
              <span>{formatFileSize(note.attachments[0].fileSize)}</span>
            </div>
          )}

          <div className="flex items-center space-x-2 pt-2">
            <Button size="sm" onClick={() => handleViewNote(note)} className="flex-1 rounded-xl">
              <Eye className="w-4 h-4 mr-2" />
              View
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleDownload(note)} 
              className="rounded-xl"
              disabled={downloading === note.id}
            >
              {downloading === note.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Selected note detail view
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
              {getSubject(selectedNote)} • {getTeacherName(selectedNote)}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              onClick={() => handleDownload(selectedNote)} 
              className="rounded-xl"
              disabled={downloading === selectedNote.id}
            >
              {downloading === selectedNote.id ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Download
            </Button>
          </div>
        </div>

        {/* Content Viewer */}
        <Card className="rounded-2xl border-0 shadow-lg">
          <CardContent className="p-0">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-8 min-h-[400px]">
              {selectedNote.content ? (
                <div className="prose dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                    {selectedNote.content}
                  </p>
                </div>
              ) : selectedNote.attachments && selectedNote.attachments.length > 0 ? (
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 bg-red-500 rounded-2xl flex items-center justify-center mx-auto">
                    <FileText className="w-12 h-12 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {selectedNote.attachments[0].fileName}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Click download to get the file
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                      Size: {formatFileSize(selectedNote.attachments[0].fileSize)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400">
                  No content available
                </div>
              )}
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
                <Badge variant="secondary">{getSubject(selectedNote)}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Teacher:</span>
                <span className="font-medium">{getTeacherName(selectedNote)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Created:</span>
                <span className="font-medium">{formatDate(selectedNote.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Updated:</span>
                <span className="font-medium">{formatDate(selectedNote.updatedAt)}</span>
              </div>
              {selectedNote.class && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Class:</span>
                  <span className="font-medium">{selectedNote.class.name}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2 rounded-2xl border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Attachments</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedNote.attachments && selectedNote.attachments.length > 0 ? (
                <div className="space-y-2">
                  {selectedNote.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {attachment.fileName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(attachment.fileSize)}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => handleDownload(selectedNote)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No attachments</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Notes list view
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notes & Materials</h1>
          <p className="text-gray-600 dark:text-gray-400">Access all your study materials in one place</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={refreshing}
          className="rounded-xl"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
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
          </div>
        </CardContent>
      </Card>

      {/* Empty state */}
      {notes.length === 0 ? (
        <Card className="rounded-2xl border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Notes Available
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              There are no notes uploaded yet. Check back later!
            </p>
          </CardContent>
        </Card>
      ) : (
        /* Notes by Subject */
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className={`grid w-full rounded-xl`} style={{ gridTemplateColumns: `repeat(${Math.min(subjects.length + 1, 5)}, minmax(0, 1fr))` }}>
            <TabsTrigger value="all" className="rounded-lg">
              All Notes
            </TabsTrigger>
            {subjects.slice(0, 4).map(subject => (
              <TabsTrigger key={subject} value={subject.toLowerCase()} className="rounded-lg">
                {subject}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNotes.length === 0 ? (
                <p className="col-span-full text-center text-gray-500 dark:text-gray-400 py-8">
                  No notes match your search
                </p>
              ) : (
                filteredNotes.map((note) => <NoteCard key={note.id} note={note} />)
              )}
            </div>
          </TabsContent>

          {subjects.map(subject => (
            <TabsContent key={subject} value={subject.toLowerCase()} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNotes
                  .filter(note => getSubject(note) === subject)
                  .map((note) => <NoteCard key={note.id} note={note} />)}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}
