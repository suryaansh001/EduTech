# EduTech Backend API Usage Examples

This file provides practical examples of how to use the EduTech backend API.

## Authentication Flow

### 1. Login as Admin
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@edutech.com",
    "password": "admin123"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "name": "System Administrator",
      "email": "admin@edutech.com",
      "role": "ADMIN"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Use Token for Protected Routes
Include the token in the Authorization header for all protected routes:
```bash
Authorization: Bearer <your-jwt-token>
```

## Admin Workflow: Creating Students

### 1. Create a New Student (Admin Only)
```bash
curl -X POST http://localhost:5000/api/auth/create-user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "name": "Alice Johnson",
    "email": "alice@school.edu",
    "role": "STUDENT",
    "phone": "+1234567893",
    "grade": "11th Grade"
  }'
```

This will:
- Create a new student account
- Generate a temporary password
- Send welcome email with credentials to alice@school.edu
- Set `isFirstLogin: true` requiring password change

### 2. Create a New Teacher
```bash
curl -X POST http://localhost:5000/api/auth/create-user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "name": "Dr. Sarah Smith",
    "email": "sarah@school.edu",
    "role": "TEACHER",
    "phone": "+1234567894",
    "specialization": "Physics"
  }'
```

## Teacher Workflow: Class Management

### 1. Login as Teacher
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@edutech.com",
    "password": "teacher123"
  }'
```

### 2. Create a Class
```bash
curl -X POST http://localhost:5000/api/classes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <teacher-token>" \
  -d '{
    "title": "Advanced Mathematics",
    "description": "Calculus and Linear Algebra for Grade 12",
    "subject": "Mathematics",
    "grade": "12th Grade",
    "maxStudents": 30,
    "startDate": "2024-09-01T00:00:00Z",
    "endDate": "2024-12-20T00:00:00Z",
    "status": "ACTIVE"
  }'
```

### 3. Get Available Students for Enrollment
```bash
curl -X GET "http://localhost:5000/api/classes/{class-id}/available-students?search=&grade=11th" \
  -H "Authorization: Bearer <teacher-token>"
```

### 4. Bulk Enroll Students
```bash
curl -X POST http://localhost:5000/api/classes/{class-id}/bulk-enroll \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <teacher-token>" \
  -d '{
    "studentIds": ["student-id-1", "student-id-2", "student-id-3"]
  }'
```

### 5. Create an Announcement
```bash
curl -X POST http://localhost:5000/api/announcements/class/{class-id} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <teacher-token>" \
  -d '{
    "title": "Assignment Due Tomorrow",
    "content": "Please remember that your calculus assignment is due tomorrow at 11:59 PM. Submit via the class portal.",
    "priority": "HIGH"
  }'
```

This will:
- Create the announcement
- Send email notifications to all enrolled students
- Make the announcement visible in student dashboards

### 6. Share Notes with Class
```bash
curl -X POST http://localhost:5000/api/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <teacher-token>" \
  -d '{
    "title": "Calculus Formulas Reference",
    "content": "# Integration Formulas\n\n∫ x^n dx = (x^(n+1))/(n+1) + C\n∫ e^x dx = e^x + C\n...",
    "subject": "Mathematics",
    "tags": ["calculus", "formulas", "integration"],
    "isPublic": true,
    "classId": "{class-id}"
  }'
```

## Student Workflow

### 1. Login as Student
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@edutech.com",
    "password": "student123"
  }'
```

### 2. Change Password (First Login)
```bash
curl -X POST http://localhost:5000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <student-token>" \
  -d '{
    "currentPassword": "",
    "newPassword": "myNewSecurePassword123"
  }'
```

Note: For first-time login, leave `currentPassword` empty.

### 3. View Available Classes
```bash
curl -X GET http://localhost:5000/api/classes \
  -H "Authorization: Bearer <student-token>"
```

### 4. Enroll in a Class
```bash
curl -X POST http://localhost:5000/api/classes/{class-id}/enroll \
  -H "Authorization: Bearer <student-token>"
```

### 5. View Class Announcements
```bash
curl -X GET http://localhost:5000/api/announcements/class/{class-id} \
  -H "Authorization: Bearer <student-token>"
```

### 6. View Class Notes
```bash
curl -X GET http://localhost:5000/api/notes/class/{class-id} \
  -H "Authorization: Bearer <student-token>"
```

### 7. Create Personal Notes
```bash
curl -X POST http://localhost:5000/api/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <student-token>" \
  -d '{
    "title": "My Study Notes - Chapter 5",
    "content": "Key concepts from today\'s lecture...",
    "subject": "Mathematics",
    "tags": ["personal", "chapter5"],
    "isPublic": false
  }'
```

## Admin Workflow: System Management

### 1. Get All Users
```bash
curl -X GET "http://localhost:5000/api/users?role=STUDENT&page=1&limit=10" \
  -H "Authorization: Bearer <admin-token>"
```

### 2. View System-wide Classes
```bash
curl -X GET http://localhost:5000/api/classes \
  -H "Authorization: Bearer <admin-token>"
```

### 3. Manage Class Enrollments
```bash
# View enrollments for any class
curl -X GET http://localhost:5000/api/classes/{class-id}/enrollments \
  -H "Authorization: Bearer <admin-token>"

# Update enrollment status
curl -X PATCH http://localhost:5000/api/classes/{class-id}/enrollments/{enrollment-id} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "status": "COMPLETED"
  }'
```

## Password Reset Flow

### 1. Request Password Reset
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

### 2. Reset Password with Token
```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset-token-from-email",
    "newPassword": "newSecurePassword123"
  }'
```

## File Upload Example

### Upload Profile Image
```bash
curl -X POST http://localhost:5000/api/users/upload-profile-image \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/image.jpg"
```

## Error Handling

The API returns structured error responses:

```json
{
  "success": false,
  "message": "Validation error",
  "error": {
    "details": "Password must be at least 6 characters long"
  },
  "statusCode": 400
}
```

Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Real-time Features (WebSocket)

Connect to Socket.io for real-time features:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: 'your-jwt-token'
  }
});

// Join a class room for chat
socket.emit('join-class', { classId: 'class-id' });

// Listen for new messages
socket.on('new-message', (message) => {
  console.log('New message:', message);
});

// Send a message
socket.emit('send-message', {
  classId: 'class-id',
  message: 'Hello everyone!'
});
```

## Rate Limiting

The API has rate limiting enabled:
- 100 requests per 15 minutes per IP address
- Applies to `/api/*` routes
- Returns 429 status when limit exceeded

## Environment Setup for Testing

To test the API locally, ensure your `.env` file is configured:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL="postgresql://edutech_user:edutech_password@localhost:5432/edutech_db"
JWT_SECRET="your-super-secret-jwt-key-for-testing"
EMAIL_USER="your-test-email@gmail.com"
EMAIL_PASS="your-app-password"
```

## Postman Collection

Import the provided Postman collection for easy API testing with pre-configured requests and environment variables.
