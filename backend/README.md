# EduTech Platform Backend

A comprehensive backend API for the EduTech platform built with Node.js, Express, PostgreSQL, and Redis.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **User Management**: Students, Teachers, and Admin roles
- **Class Management**: Create, manage, and enroll in classes
- **Quiz System**: Create quizzes, take quizzes, and track performance
- **Real-time Chat**: Socket.IO powered chat for each class
- **File Upload & Sharing**: Cloudinary integration for file storage
- **Analytics**: Comprehensive analytics for all user roles
- **Real-time Features**: Live quiz sessions, typing indicators, online status

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Real-time**: Socket.IO
- **File Storage**: Cloudinary
- **Authentication**: JWT
- **Validation**: Joi
- **Logging**: Winston

## Prerequisites

- Node.js 18 or higher
- PostgreSQL 14 or higher
- Redis 6 or higher
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd edutech/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configurations:
   ```env
   NODE_ENV=development
   PORT=5000
   DATABASE_URL="postgresql://username:password@localhost:5432/edutech_db"
   REDIS_URL="redis://localhost:6379"
   JWT_SECRET="your-super-secret-jwt-key"
   CLOUDINARY_CLOUD_NAME="your-cloudinary-name"
   CLOUDINARY_API_KEY="your-cloudinary-api-key"
   CLOUDINARY_API_SECRET="your-cloudinary-api-secret"
   CLIENT_URL="http://localhost:3000"
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push database schema
   npm run db:push
   
   # Or run migrations (if you have migration files)
   npm run db:migrate
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

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
