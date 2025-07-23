# EduTech Platform

EduTech is a full-stack educational technology platform designed to facilitate online learning, classroom management, quizzes, file sharing, and real-time chat for students, teachers, and administrators.

## Features

- **User Authentication**: Secure login and registration for students, teachers, and admins.
- **Classroom Management**: Create, join, and manage virtual classes.
- **Quiz System**: Create, assign, and take quizzes with automatic grading.
- **File Uploads**: Upload and share files (images, PDFs, Word documents, etc.) with configurable size and type restrictions.
- **Real-Time Chat**: Instant messaging within classes and groups.
- **Analytics**: Track user activity and quiz performance.
- **Admin Dashboard**: Manage users, quizzes, and classes.

## Tech Stack

- **Frontend**: React (Next.js, Vite, Tailwind CSS)
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (via Prisma ORM)
- **Cache**: Redis
- **File Storage**: Cloudinary
- **Authentication**: JWT
- **Email**: NodeMailer (SMTP)
- **WebSockets**: Real-time chat and quiz features

## Getting Started

### Prerequisites
- Node.js (v16+)
- PostgreSQL
- Redis
- Cloudinary account (for file uploads)

### Environment Variables
Copy `.env.example` to `.env` in the `backend/` directory and fill in the required values:

```bash
cp backend/.env.example backend/.env
```

### Backend Setup
1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```
3. Start the server:
   ```bash
   npm start
   ```

### Frontend Setup
1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```

## Folder Structure

- `backend/` - Express.js API, business logic, and database
- `frontend/` - React/Next.js client application

## Configuration
- All environment variables are documented in `backend/.env.example`.
- File upload limits and allowed types are configurable via environment variables.

## License

This project is licensed under the MIT License.
