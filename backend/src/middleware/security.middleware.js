/**
 * Security Middleware for EduTech Backend
 * 
 * This file contains additional security measures to protect the application
 * from common web vulnerabilities and attacks.
 */

import { logger } from '../utils/logger.utils.js';
import { errorResponse } from '../utils/response.utils.js';

/**
 * XSS (Cross-Site Scripting) Prevention Middleware
 * 
 * REASON: Sanitizes request body, query, and params to prevent XSS attacks.
 * XSS attacks can steal user sessions, redirect users to malicious sites,
 * or deface the application.
 */
export const xssProtection = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      // Remove potential XSS vectors
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/<\s*iframe/gi, '&lt;iframe')
        .replace(/<\s*object/gi, '&lt;object')
        .replace(/<\s*embed/gi, '&lt;embed');
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);

  next();
};

/**
 * SQL Injection Prevention Middleware
 * 
 * REASON: While Prisma ORM provides built-in SQL injection protection,
 * this adds an additional layer by checking for common SQL injection patterns.
 * This is defense-in-depth strategy.
 */
export const sqlInjectionProtection = (req, res, next) => {
  const sqlPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
    /(\%3D)|(=)[^\s]*(\%27)|(\')/i,
    /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
    /((\%27)|(\'))union/i,
    /exec(\s|\+)+(s|x)p\w+/i,
    /UNION\s+SELECT/i,
    /INSERT\s+INTO/i,
    /DELETE\s+FROM/i,
    /DROP\s+TABLE/i,
    /UPDATE\s+\w+\s+SET/i
  ];

  const checkValue = (value) => {
    if (typeof value === 'string') {
      for (const pattern of sqlPatterns) {
        if (pattern.test(value)) {
          return true;
        }
      }
    }
    return false;
  };

  const hasInjection = (obj) => {
    if (typeof obj === 'string') {
      return checkValue(obj);
    }
    if (Array.isArray(obj)) {
      return obj.some(hasInjection);
    }
    if (obj && typeof obj === 'object') {
      return Object.values(obj).some(hasInjection);
    }
    return false;
  };

  if (hasInjection(req.body) || hasInjection(req.query) || hasInjection(req.params)) {
    logger.warn('Potential SQL injection attempt detected', {
      ip: req.ip,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent')
    });
    return errorResponse(res, 'Invalid request data', 400);
  }

  next();
};

/**
 * Request Size Limiter
 * 
 * REASON: Prevents DoS attacks by limiting request body size.
 * Large payloads can exhaust server memory and cause crashes.
 */
export const requestSizeLimiter = (maxSize = 10 * 1024 * 1024) => { // 10MB default
  return (req, res, next) => {
    const contentLength = parseInt(req.get('Content-Length') || '0');
    
    if (contentLength > maxSize) {
      logger.warn('Request size limit exceeded', {
        ip: req.ip,
        contentLength,
        maxSize
      });
      return errorResponse(res, 'Request too large', 413);
    }
    
    next();
  };
};

/**
 * Security Headers Middleware
 * 
 * REASON: Adds additional security headers not covered by Helmet
 * to provide extra protection against various attacks.
 */
export const securityHeaders = (req, res, next) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Enable XSS filter in browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy - only send referrer for same-origin
  res.setHeader('Referrer-Policy', 'same-origin');
  
  // Permissions policy - restrict browser features
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Cache control for API responses - prevent caching of sensitive data
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  next();
};

/**
 * Request Logging Middleware
 * 
 * REASON: Logs all API requests for security auditing and debugging.
 * Helps in detecting suspicious activities and troubleshooting issues.
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || 'anonymous'
  });
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    };
    
    if (res.statusCode >= 400) {
      logger.warn('Request completed with error', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });
  
  next();
};

/**
 * IP Blocking Middleware
 * 
 * REASON: Blocks requests from blacklisted IPs.
 * Used to block known malicious IPs or IPs that have made too many failed requests.
 */
const blockedIPs = new Set();

export const ipBlocker = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  
  if (blockedIPs.has(clientIP)) {
    logger.warn('Blocked request from blacklisted IP', { ip: clientIP });
    return errorResponse(res, 'Access denied', 403);
  }
  
  next();
};

// Function to add IP to blocklist
export const blockIP = (ip, duration = 3600000) => { // 1 hour default
  blockedIPs.add(ip);
  logger.info(`IP blocked: ${ip}`);
  
  // Remove from blocklist after duration
  setTimeout(() => {
    blockedIPs.delete(ip);
    logger.info(`IP unblocked: ${ip}`);
  }, duration);
};

/**
 * Brute Force Protection
 * 
 * REASON: Tracks failed login attempts and blocks IPs that exceed threshold.
 * Prevents password guessing attacks.
 */
const failedAttempts = new Map();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export const bruteForceProtection = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const key = `${clientIP}:${req.path}`;
  
  const attempts = failedAttempts.get(key);
  
  if (attempts && attempts.count >= MAX_FAILED_ATTEMPTS) {
    const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
    
    if (timeSinceLastAttempt < LOCKOUT_DURATION) {
      const remainingTime = Math.ceil((LOCKOUT_DURATION - timeSinceLastAttempt) / 1000 / 60);
      logger.warn('Brute force protection triggered', { ip: clientIP, path: req.path });
      return errorResponse(
        res, 
        `Too many failed attempts. Please try again in ${remainingTime} minutes.`, 
        429
      );
    } else {
      // Reset after lockout duration
      failedAttempts.delete(key);
    }
  }
  
  // Add tracking to response
  res.trackFailedAttempt = () => {
    const current = failedAttempts.get(key) || { count: 0, lastAttempt: Date.now() };
    failedAttempts.set(key, {
      count: current.count + 1,
      lastAttempt: Date.now()
    });
  };
  
  res.clearFailedAttempts = () => {
    failedAttempts.delete(key);
  };
  
  next();
};

/**
 * Content Security Policy for API
 * 
 * REASON: Adds CSP headers to prevent various injection attacks
 * when content is rendered by the API.
 */
export const contentSecurityPolicy = (req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'"
  );
  next();
};

/**
 * API Key Validation (for external integrations)
 * 
 * REASON: Validates API keys for external services that need to access the API.
 * This is separate from user authentication.
 */
export const validateApiKey = (req, res, next) => {
  const apiKey = req.get('X-API-Key');
  
  // Skip if not required (most routes use JWT instead)
  if (!req.requiresApiKey) {
    return next();
  }
  
  if (!apiKey || apiKey !== process.env.EXTERNAL_API_KEY) {
    logger.warn('Invalid API key attempt', {
      ip: req.ip,
      providedKey: apiKey ? 'yes' : 'no'
    });
    return errorResponse(res, 'Invalid API key', 401);
  }
  
  next();
};

export default {
  xssProtection,
  sqlInjectionProtection,
  requestSizeLimiter,
  securityHeaders,
  requestLogger,
  ipBlocker,
  blockIP,
  bruteForceProtection,
  contentSecurityPolicy,
  validateApiKey
};
