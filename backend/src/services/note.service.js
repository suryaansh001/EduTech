import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.utils.js';

export const noteService = {
  // Create new note
  createNote: async (authorId, noteData) => {
    const { title, content, subject, tags = [], isPublic = false, classId, attachments = [] } = noteData;

    // If classId is provided, verify access
    if (classId) {
      const classInfo = await prisma.class.findUnique({
        where: { id: classId },
        include: {
          teacher: true,
          enrollments: {
            where: { userId: authorId, status: 'ACTIVE' }
          }
        }
      });

      if (!classInfo) {
        throw new Error('Class not found');
      }

      const author = await prisma.user.findUnique({
        where: { id: authorId }
      });

      // Check if user has permission to add notes to this class
      if (author.role === 'STUDENT' && classInfo.enrollments.length === 0) {
        throw new Error('You are not enrolled in this class');
      } else if (author.role === 'TEACHER' && classInfo.teacherId !== authorId) {
        throw new Error('You are not the teacher of this class');
      }
    }

    const note = await prisma.note.create({
      data: {
        title,
        content,
        subject,
        tags,
        isPublic,
        classId,
        authorId,
        attachments
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        class: {
          select: {
            id: true,
            title: true,
            subject: true
          }
        }
      }
    });

    logger.info(`Note created by ${authorId}${classId ? ` for class ${classId}` : ''}`);
    return note;
  },

  // Get notes with filters
  getNotes: async (userId, userRole, filters = {}, pagination = {}) => {
    const { page = 1, limit = 10 } = pagination;
    const { classId, subject, tags, search, isPublic } = filters;
    const skip = (page - 1) * limit;

    let whereClause = {};

    // Base access control
    if (userRole === 'STUDENT') {
      whereClause.OR = [
        { authorId: userId }, // User's own notes
        { 
          isPublic: true,
          class: {
            enrollments: {
              some: {
                userId,
                status: 'ACTIVE'
              }
            }
          }
        }, // Public notes from classes they're enrolled in
        {
          isPublic: true,
          classId: null // Public general notes
        }
      ];
    } else if (userRole === 'TEACHER') {
      whereClause.OR = [
        { authorId: userId }, // Teacher's own notes
        { 
          isPublic: true,
          class: {
            teacherId: userId
          }
        }, // Public notes from their classes
        {
          isPublic: true,
          classId: null // Public general notes
        }
      ];
    }
    // Admin can see all notes

    // Apply additional filters
    if (classId) {
      if (whereClause.OR) {
        whereClause.OR = whereClause.OR.map(condition => ({
          ...condition,
          classId
        }));
      } else {
        whereClause.classId = classId;
      }
    }

    if (subject) {
      whereClause.subject = { contains: subject, mode: 'insensitive' };
    }

    if (tags && tags.length > 0) {
      whereClause.tags = {
        hasSome: Array.isArray(tags) ? tags : [tags]
      };
    }

    if (search) {
      const searchCondition = {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } }
        ]
      };

      if (whereClause.OR) {
        whereClause.AND = [{ OR: whereClause.OR }, searchCondition];
        delete whereClause.OR;
      } else {
        whereClause = { ...whereClause, ...searchCondition };
      }
    }

    if (typeof isPublic === 'boolean') {
      whereClause.isPublic = isPublic;
    }

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where: whereClause,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              role: true
            }
          },
          class: {
            select: {
              id: true,
              title: true,
              subject: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.note.count({ where: whereClause })
    ]);

    return {
      notes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  // Get note by ID
  getNoteById: async (noteId, userId, userRole) => {
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        class: {
          select: {
            id: true,
            title: true,
            subject: true,
            teacherId: true,
            enrollments: {
              where: { status: 'ACTIVE' },
              select: {
                userId: true
              }
            }
          }
        }
      }
    });

    if (!note) {
      throw new Error('Note not found');
    }

    // Check access permissions
    let hasAccess = false;

    if (userRole === 'ADMIN' || note.authorId === userId) {
      hasAccess = true;
    } else if (note.isPublic) {
      if (!note.classId) {
        hasAccess = true; // Public general note
      } else if (userRole === 'STUDENT') {
        hasAccess = note.class.enrollments.some(enrollment => enrollment.userId === userId);
      } else if (userRole === 'TEACHER') {
        hasAccess = note.class.teacherId === userId;
      }
    }

    if (!hasAccess) {
      throw new Error('You do not have access to this note');
    }

    return note;
  },

  // Update note
  updateNote: async (noteId, authorId, updateData) => {
    const { title, content, subject, tags, isPublic, attachments } = updateData;

    const existingNote = await prisma.note.findUnique({
      where: { id: noteId },
      include: { author: true }
    });

    if (!existingNote) {
      throw new Error('Note not found');
    }

    const user = await prisma.user.findUnique({
      where: { id: authorId }
    });

    // Check permissions
    if (user.role !== 'ADMIN' && existingNote.authorId !== authorId) {
      throw new Error('You can only edit your own notes');
    }

    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(subject && { subject }),
        ...(tags && { tags }),
        ...(typeof isPublic === 'boolean' && { isPublic }),
        ...(attachments && { attachments })
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        class: {
          select: {
            id: true,
            title: true,
            subject: true
          }
        }
      }
    });

    logger.info(`Note ${noteId} updated by ${authorId}`);
    return updatedNote;
  },

  // Delete note
  deleteNote: async (noteId, userId) => {
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      include: { author: true }
    });

    if (!note) {
      throw new Error('Note not found');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    // Check permissions
    if (user.role !== 'ADMIN' && note.authorId !== userId) {
      throw new Error('You can only delete your own notes');
    }

    await prisma.note.delete({
      where: { id: noteId }
    });

    logger.info(`Note ${noteId} deleted by ${userId}`);
  },

  // Get notes for a specific class
  getClassNotes: async (classId, userId, userRole, pagination = {}) => {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    // Check access to class
    if (userRole === 'STUDENT') {
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          userId,
          classId,
          status: 'ACTIVE'
        }
      });

      if (!enrollment) {
        throw new Error('You are not enrolled in this class');
      }
    } else if (userRole === 'TEACHER') {
      const classInfo = await prisma.class.findUnique({
        where: { id: classId }
      });

      if (!classInfo || classInfo.teacherId !== userId) {
        throw new Error('You do not have access to this class');
      }
    }

    let whereClause = { classId };

    // Students can only see public notes or their own
    if (userRole === 'STUDENT') {
      whereClause.OR = [
        { isPublic: true },
        { authorId: userId }
      ];
    }

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where: whereClause,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.note.count({ where: whereClause })
    ]);

    return {
      notes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
};
