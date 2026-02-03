import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { User } from '@shared/schema';

// JWT secret key - should be in environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || 'izuran-jwt-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'izuran-jwt-refresh-secret';

// Token expiration times
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '8h'; // 8 hours - session ends after 8h inactivity

// Interface for JWT payload
export interface JwtPayload {
  userId: number;
  email: string;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Generate JWT access token
 */
export function generateAccessToken(user: Partial<User> & { id: number; email: string; username: string; role: string }): string {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    username: user.username,
    role: user.role
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

/**
 * Generate JWT refresh token
 */
export function generateRefreshToken(user: Partial<User> & { id: number; email: string; username: string; role: string }): string {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    username: user.username,
    role: user.role
  };

  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Extract JWT token from request header or cookie
 */
export function extractToken(req: Request): string | null {
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check cookies - try accessToken first, then fall back to refreshToken or token
  if (req.cookies) {
    if (req.cookies.accessToken) {
      return req.cookies.accessToken;
    }
    
    if (req.cookies.refreshToken) {
      return req.cookies.refreshToken;
    }
    
    if (req.cookies.token) {
      return req.cookies.token;
    }
  }
  
  return null;
}

/**
 * Middleware to authenticate JWT token
 */
export function authenticateJwt(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
  
  // Add user data to request
  req.user = {
    id: payload.userId,
    email: payload.email,
    username: payload.username,
    role: payload.role
  };
  
  next();
}

/**
 * Role-based authorization middleware
 */
export function authorizeRoles(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const userRole = (req.user as any).role;
    if (!roles.includes(userRole)) {
      return res.status(403).json({ 
        message: 'Access denied. Required role: ' + roles.join(' or ')
      });
    }
    
    next();
  };
}

/**
 * Middleware for artist authorization
 */
export function isArtist(req: Request, res: Response, next: NextFunction) {
  if (req.user && (req.user as any).role === 'artist') {
    return next();
  }
  return res.status(403).json({ message: 'Artist access required' });
}

/**
 * Middleware for admin authorization
 */
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user && (req.user as any).role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Admin access required' });
}

/**
 * Middleware for artist or admin authorization
 */
export function isArtistOrAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user && ((req.user as any).role === 'artist' || (req.user as any).role === 'admin')) {
    return next();
  }
  return res.status(403).json({ message: 'Artist or admin access required' });
}