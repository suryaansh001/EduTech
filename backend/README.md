# EduTech Backend API

A comprehensive backend system for an educational technology platform supporting students, teachers, and administrators.

## Features

### Core Functionality
- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: Complete user management with role-specific profiles
- **Class Management**: Create and manage classes with student enrollment
- **Announcements**: Teachers can post announcements to classes with email notifications
- **Notes Sharing**: Teachers and students can share notes within classes
- **File Uploads**: Secure file handling with Cloudinary integration
- **Real-time Chat**: Socket.io based chat system for classes
- **Quiz System**: Complete quiz management with scoring
- **Email Notifications**: Automated email system for various events

### User Roles
- **Admin**: Full system access, user management, class oversight
- **Teacher**: Class creation, student management, content sharing
- **Student**: Class enrollment, content access, quiz participation

## Quick Start

### Prerequisites
- Node.js (v16+)
- PostgreSQL database
- Redis server
- Cloudinary account (for file uploads)
- SMTP email service (Gmail recommended)

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   ```

3. **Database Setup**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Run database migrations
   npm run db:migrate
   
   # (Optional) Seed database
   npm run db:seed
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Public user registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/create-user` - Admin creates new users (sends credentials via email)

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)
- `POST /api/users/upload-profile-image` - Upload profile image

### Classes
- `POST /api/classes` - Create class (teacher/admin)
- `GET /api/classes` - Get classes (filtered by role)
- `GET /api/classes/:id` - Get specific class
- `PUT /api/classes/:id` - Update class (teacher/admin)
- `DELETE /api/classes/:id` - Delete class (teacher/admin)
- `POST /api/classes/:id/enroll` - Enroll in class (student)
- `GET /api/classes/:id/enrollments` - Get class enrollments
- `GET /api/classes/:id/available-students` - Get available students for enrollment
- `POST /api/classes/:id/bulk-enroll` - Bulk enroll students
- `DELETE /api/classes/:id/students/:studentId` - Remove student from class

### Announcements
- `POST /api/announcements/class/:classId` - Create announcement (teacher/admin)
- `GET /api/announcements` - Get user's announcements
- `GET /api/announcements/class/:classId` - Get class announcements
- `GET /api/announcements/:id` - Get specific announcement
- `PUT /api/announcements/:id` - Update announcement
- `DELETE /api/announcements/:id` - Delete announcement

### Notes
- `POST /api/notes` - Create note
- `GET /api/notes` - Get notes (with filters)
- `GET /api/notes/:id` - Get specific note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note
- `GET /api/notes/class/:classId` - Get class notes

### Files
- `POST /api/files/upload` - Upload file
- `GET /api/files` - Get user's files
- `GET /api/files/:id` - Get file details
- `DELETE /api/files/:id` - Delete file

## Key Features Explained

### Admin User Management
Admins can create new student/teacher accounts through the API. The system:
1. Generates a secure temporary password
2. Creates the user account with `isFirstLogin: true`
3. Sends welcome email with credentials
4. Forces password change on first login

```javascript
// Admin creates a student
POST /api/auth/create-user
{
  "name": "John Student",
  "email": "john@school.edu",
  "role": "STUDENT",
  "grade": "10th Grade"
}
```

### Class Management with Student Selection
Teachers and admins can:
1. Create classes with specific criteria
2. View available students not enrolled in the class
3. Bulk enroll multiple students at once
4. Manage enrollment statuses

```javascript
// Get available students for a class
GET /api/classes/class-id/available-students?search=john&grade=10

// Bulk enroll students
POST /api/classes/class-id/bulk-enroll
{
  "studentIds": ["student1-id", "student2-id"]
}
```

### Announcements with Email Notifications
When teachers post announcements:
1. Announcement is saved to database
2. All enrolled students receive email notifications
3. Students can view announcements in their dashboard

### Notes Sharing System
- Teachers can share public notes visible to all class members
- Students can create private notes or share with the class
- Advanced filtering by tags, subject, and search terms
- File attachments supported

### Security Features
- JWT authentication with token blacklisting
- Role-based authorization
- Rate limiting on API endpoints
- Input validation with Joi schemas
- Secure file upload with type restrictions
- Password hashing with bcrypt
- SQL injection protection with Prisma ORM

## Database Schema

The system uses PostgreSQL with Prisma ORM. Key models:
- **User**: Core user information with role-based profiles
- **Class**: Class information with enrollment tracking
- **Enrollment**: Student-class relationships with status
- **Announcement**: Class announcements with priority levels
- **Note**: Shared notes with visibility controls
- **Quiz/Question**: Assessment system
- **ChatMessage**: Real-time messaging
- **FileUpload**: File management

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/edutech_db"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="24h"

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Email Service
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Development Scripts

```bash
npm run dev          # Start development server with nodemon
npm run start        # Start production server
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes to database
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Prisma Studio
npm run test         # Run tests
```

## Production Deployment

1. Set NODE_ENV=production
2. Configure production database and Redis
3. Set up proper SMTP service
4. Configure Cloudinary for file storage
5. Use process manager like PM2
6. Set up reverse proxy (nginx)
7. Enable HTTPS with SSL certificates

## API Testing

The backend includes comprehensive error handling and validation. Test the API using:
- Postman/Insomnia collections
- Built-in health check: `GET /health`
- Authentication testing with various roles

## Contributing

1. Follow the existing code structure
2. Add proper validation schemas
3. Include error handling
4. Write tests for new features
5. Update documentation

## License

MIT License - see LICENSE file for details.

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Class Endpoints

- `GET /api/classes` - Get all classes
- `POST /api/classes` - Create new class (Teachers only)
- `GET /api/classes/:id` - Get class details
- `PUT /api/classes/:id` - Update class (Teachers only)
- `DELETE /api/classes/:id` - Delete class (Teachers only)
- `POST /api/classes/:id/enroll` - Enroll in class (Students only)

### Quiz Endpoints

- `GET /api/quizzes` - Get all quizzes
- `POST /api/quizzes` - Create new quiz (Teachers only)
- `GET /api/quizzes/:id` - Get quiz details
- `PUT /api/quizzes/:id` - Update quiz (Teachers only)
- `DELETE /api/quizzes/:id` - Delete quiz (Teachers only)
- `POST /api/quizzes/:id/submit` - Submit quiz attempt (Students only)

### File Endpoints

- `POST /api/files/upload` - Upload file
- `GET /api/files` - Get files
- `GET /api/files/:id` - Get file details
- `GET /api/files/:id/download` - Download file
- `DELETE /api/files/:id` - Delete file

### Chat Endpoints

- `GET /api/chat/class/:classId` - Get chat messages
- `POST /api/chat/class/:classId` - Send message
- `DELETE /api/chat/message/:messageId` - Delete message

### Analytics Endpoints

- `POST /api/analytics/track` - Track analytics event
- `GET /api/analytics/platform` - Platform analytics (Admin only)
- `GET /api/analytics/teacher` - Teacher analytics
- `GET /api/analytics/student` - Student analytics

## Real-time Features (Socket.IO)

### Events

#### Authentication
- Connect with `auth.token` in handshake

#### Class Management
- `join-class` - Join a class room
- `leave-class` - Leave a class room
- `user-joined-class` - User joined notification
- `user-left-class` - User left notification

#### Chat
- `send-message` - Send chat message
- `new-message` - New message received
- `delete-message` - Delete message
- `message-deleted` - Message deleted notification

#### Quiz
- `join-quiz` - Join quiz session
- `start-quiz-timer` - Start quiz timer (Teachers)
- `quiz-timer-started` - Timer started notification
- `quiz-submitted` - Quiz submission notification

## Database Schema

The application uses Prisma ORM with the following main models:

- **User**: Base user model with roles (STUDENT, TEACHER, ADMIN)
- **TeacherProfile**: Extended profile for teachers
- **StudentProfile**: Extended profile for students
- **Class**: Course/class model
- **Enrollment**: Student-class relationship
- **Quiz**: Quiz model
- **Question**: Quiz questions
- **QuizAttempt**: Student quiz attempts
- **ChatMessage**: Chat messages
- **FileUpload**: File metadata
- **Analytics**: Analytics events

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

## Error Handling

The API uses consistent error responses:

```json
{
  "success": false,
  "message": "Error message",
  "errors": [], // Validation errors if any
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Security Features

- JWT authentication
- Password hashing with bcrypt
- Rate limiting
- Input validation
- File type validation
- CORS configuration
- Helmet security headers

## Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=5000
DATABASE_URL="your-production-db-url"
REDIS_URL="your-production-redis-url"
JWT_SECRET="your-production-jwt-secret"
CLOUDINARY_CLOUD_NAME="your-cloudinary-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"
CLIENT_URL="your-frontend-url"
```

### Docker Support (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
EXPOSE 5000
CMD ["npm", "start"]
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
