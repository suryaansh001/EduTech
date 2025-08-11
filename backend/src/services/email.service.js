import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.utils.js';

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  async sendEmail(to, subject, html, text = null) {
    try {
      const mailOptions = {
        from: `"EduTech Platform" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for text version
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent to ${to}: ${info.messageId}`);
      return info;
    } catch (error) {
      logger.error('Email sending failed:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendWelcomeEmail(user, temporaryPassword) {
    const subject = 'Welcome to EduTech Platform - Your Account Details';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .credentials { background-color: #e0e7ff; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; }
          .button { display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to EduTech Platform!</h1>
          </div>
          <div class="content">
            <h2>Hello ${user.name},</h2>
            <p>Your account has been successfully created on the EduTech Platform. You can now access your ${user.role.toLowerCase()} dashboard with the following credentials:</p>
            
            <div class="credentials">
              <strong>Login Credentials:</strong><br>
              <strong>Email:</strong> ${user.email}<br>
              <strong>Temporary Password:</strong> ${temporaryPassword}<br>
              <strong>Role:</strong> ${user.role}
            </div>

            <p><strong>Important Security Notice:</strong></p>
            <ul>
              <li>This is a temporary password for your first login</li>
              <li>Please change your password immediately after logging in</li>
              <li>Never share your login credentials with anyone</li>
            </ul>

            <p>You can login to your account by visiting:</p>
            <a href="${process.env.CLIENT_URL}/login" class="button">Login to EduTech</a>

            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          </div>
          <div class="footer">
            <p>Best regards,<br>EduTech Platform Team</p>
            <p><small>This is an automated email. Please do not reply to this message.</small></p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  async sendPasswordResetEmail(user, resetToken) {
    const subject = 'Password Reset - EduTech Platform';
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hello ${user.name},</h2>
            <p>We received a request to reset your password for your EduTech Platform account.</p>
            
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            
            <p>Or copy and paste this link in your browser:</p>
            <p>${resetUrl}</p>
            
            <p><strong>Note:</strong> This link will expire in 1 hour for security purposes.</p>
            
            <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>Best regards,<br>EduTech Platform Team</p>
            <p><small>This is an automated email. Please do not reply to this message.</small></p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  async sendAnnouncementEmail(users, announcement, className) {
    const subject = `New Announcement: ${announcement.title}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .announcement { background-color: #fff; padding: 20px; border-left: 4px solid #4f46e5; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; }
          .button { display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Class Announcement</h1>
          </div>
          <div class="content">
            <p>A new announcement has been posted in your class <strong>${className}</strong>:</p>
            
            <div class="announcement">
              <h3>${announcement.title}</h3>
              <p>${announcement.content}</p>
              <small>Posted on: ${new Date(announcement.createdAt).toLocaleDateString()}</small>
            </div>

            <p>Login to your dashboard to view all announcements and interact with your class.</p>
            <a href="${process.env.CLIENT_URL}/dashboard" class="button">View Dashboard</a>
          </div>
          <div class="footer">
            <p>Best regards,<br>EduTech Platform Team</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send to all users in the list
    const emailPromises = users.map(user => 
      this.sendEmail(user.email, subject, html)
    );

    return Promise.allSettled(emailPromises);
  }

  async sendQuizReminderEmail(user, quiz, className) {
    const subject = `Quiz Reminder: ${quiz.title}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .quiz-info { background-color: #fff; padding: 20px; border-left: 4px solid #f59e0b; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; }
          .button { display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Quiz Reminder</h1>
          </div>
          <div class="content">
            <h2>Hello ${user.name},</h2>
            <p>This is a reminder about an upcoming quiz in your class <strong>${className}</strong>:</p>
            
            <div class="quiz-info">
              <h3>${quiz.title}</h3>
              <p><strong>Due Date:</strong> ${new Date(quiz.dueDate).toLocaleDateString()}</p>
              <p><strong>Duration:</strong> ${quiz.timeLimit} minutes</p>
              <p><strong>Total Questions:</strong> ${quiz.questions?.length || 'TBD'}</p>
              ${quiz.description ? `<p><strong>Description:</strong> ${quiz.description}</p>` : ''}
            </div>

            <p>Don't forget to complete your quiz before the deadline!</p>
            <a href="${process.env.CLIENT_URL}/quiz/${quiz._id}" class="button">Take Quiz</a>
          </div>
          <div class="footer">
            <p>Best regards,<br>EduTech Platform Team</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  async sendAssignmentSubmissionEmail(teacher, student, assignment, className) {
    const subject = `Assignment Submitted: ${assignment.title}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .submission-info { background-color: #fff; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; }
          .button { display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Assignment Submission</h1>
          </div>
          <div class="content">
            <h2>Hello ${teacher.name},</h2>
            <p>A student has submitted an assignment in your class <strong>${className}</strong>:</p>
            
            <div class="submission-info">
              <h3>${assignment.title}</h3>
              <p><strong>Student:</strong> ${student.name} (${student.email})</p>
              <p><strong>Submitted on:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Class:</strong> ${className}</p>
            </div>

            <p>You can review the submission in your dashboard.</p>
            <a href="${process.env.CLIENT_URL}/dashboard/assignments" class="button">Review Submission</a>
          </div>
          <div class="footer">
            <p>Best regards,<br>EduTech Platform Team</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(teacher.email, subject, html);
  }

  // Verify email configuration
  async verifyConnection() {
    try {
      await this.transporter.verify();
      logger.info('Email service configuration verified');
      return true;
    } catch (error) {
      logger.error('Email service verification failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();