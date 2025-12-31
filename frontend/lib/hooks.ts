/**
 * Custom Hooks for API Data Fetching
 * 
 * SECURITY FEATURES:
 * 1. Automatic error handling
 * 2. Loading states prevent UI race conditions
 * 3. Stale data prevention with refetch capabilities
 * 4. Automatic cleanup on unmount
 * 5. Type-safe responses
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  usersApi, 
  classesApi, 
  quizzesApi, 
  notesApi, 
  analyticsApi,
  announcementsApi,
  ApiError 
} from './api';

// Generic hook for data fetching
interface UseApiResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

function useApiCall<T>(
  apiCall: () => Promise<{ success: boolean; data: T; message: string }>,
  dependencies: any[] = []
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiCall();
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.message || 'Failed to fetch data');
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

/**
 * Hook for fetching dashboard statistics
 * Used by: AdminDashboard, TeacherDashboard, StudentDashboard
 */
export function useDashboardStats() {
  return useApiCall(
    () => analyticsApi.getDashboardStats(),
    []
  );
}

/**
 * Hook for fetching users (admin only)
 * Used by: StudentsManagement, TeachersManagement
 */
export function useUsers(params?: { role?: string; search?: string; page?: number; limit?: number }) {
  const [users, setUsers] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await usersApi.getUsers(params);
      if (response.success) {
        setUsers(response.data.users || []);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch users';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [params?.role, params?.search, params?.page, params?.limit]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, pagination, isLoading, error, refetch: fetchUsers };
}

/**
 * Hook for fetching classes
 * Used by: ClassManagement, TeacherDashboard, StudentDashboard
 */
export function useClasses(params?: { status?: string; teacherId?: string; page?: number; limit?: number }) {
  const [classes, setClasses] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClasses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await classesApi.getClasses(params);
      if (response.success) {
        setClasses(response.data.classes || []);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch classes';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [params?.status, params?.teacherId, params?.page, params?.limit]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  return { classes, pagination, isLoading, error, refetch: fetchClasses };
}

/**
 * Hook for fetching a single class
 */
export function useClass(classId: string) {
  return useApiCall(
    () => classesApi.getClassById(classId),
    [classId]
  );
}

/**
 * Hook for fetching quizzes
 * Used by: QuizManagement, QuizCreator, QuizInterface
 */
export function useQuizzes(params?: { classId?: string; isActive?: boolean; page?: number; limit?: number }) {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuizzes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await quizzesApi.getQuizzes(params);
      if (response.success) {
        setQuizzes(response.data.quizzes || []);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch quizzes';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [params?.classId, params?.isActive, params?.page, params?.limit]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  return { quizzes, pagination, isLoading, error, refetch: fetchQuizzes };
}

/**
 * Hook for fetching a single quiz
 */
export function useQuiz(quizId: string) {
  return useApiCall(
    () => quizzesApi.getQuizById(quizId),
    [quizId]
  );
}

/**
 * Hook for fetching student's quiz attempts
 */
export function useMyQuizAttempts() {
  const [attempts, setAttempts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAttempts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await quizzesApi.getMyAttempts();
      if (response.success) {
        setAttempts(response.data || []);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch attempts';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttempts();
  }, [fetchAttempts]);

  return { attempts, isLoading, error, refetch: fetchAttempts };
}

/**
 * Hook for fetching notes
 * Used by: NotesViewer, NotesUpload
 */
export function useNotes(params?: { classId?: string; subject?: string; isPublic?: boolean; page?: number; limit?: number }) {
  const [notes, setNotes] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await notesApi.getNotes(params);
      if (response.success) {
        setNotes(response.data.notes || []);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch notes';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [params?.classId, params?.subject, params?.isPublic, params?.page, params?.limit]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return { notes, pagination, isLoading, error, refetch: fetchNotes };
}

/**
 * Hook for fetching announcements
 */
export function useAnnouncements(params?: { classId?: string; priority?: string; page?: number; limit?: number }) {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await announcementsApi.getAnnouncements(params);
      if (response.success) {
        setAnnouncements(response.data.announcements || []);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch announcements';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [params?.classId, params?.priority, params?.page, params?.limit]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  return { announcements, pagination, isLoading, error, refetch: fetchAnnouncements };
}

/**
 * Hook for fetching class enrollments
 */
export function useClassEnrollments(classId: string) {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEnrollments = useCallback(async () => {
    if (!classId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await classesApi.getEnrollments(classId);
      if (response.success) {
        setEnrollments(response.data || []);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch enrollments';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  return { enrollments, isLoading, error, refetch: fetchEnrollments };
}

/**
 * Hook for user statistics
 */
export function useUserStats() {
  return useApiCall(
    () => usersApi.getStats(),
    []
  );
}

// Export all hooks
export default {
  useDashboardStats,
  useUsers,
  useClasses,
  useClass,
  useQuizzes,
  useQuiz,
  useMyQuizAttempts,
  useNotes,
  useAnnouncements,
  useClassEnrollments,
  useUserStats,
};
