import { Request, Response, NextFunction } from "express";
import { db } from "@db";
import * as schema from "@shared/schema";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { eq, or, and } from "drizzle-orm";
import { ZodError } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import { 
  generateAccessToken, 
  generateRefreshToken,
  authenticateJwt,
  authorizeRoles,
  isAdmin as jwtIsAdmin,
  isArtist,
  isArtistOrAdmin,
  extractToken,
  verifyToken,
  verifyRefreshToken
} from "./jwt";
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(process.cwd(), 'public/uploads/profile_pictures');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const userId = req.user ? (req.user as any).id || 'unauth' : 'unauth';
    cb(null, `user-${userId}-${uniqueSuffix}${ext}`);
  }
});

export const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export function configurePassport(passport: any) {
  // Serialize user to session
  passport.serializeUser((user: any, done: any) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: number, done: any) => {
    try {
      const user = await db.query.users.findFirst({
        where: eq(schema.users.id, id)
      });
      
      if (!user) {
        return done(null, false);
      }
      
      // Remove password hash from user object before sending to client
      const { passwordHash, ...userWithoutPassword } = user;
      done(null, userWithoutPassword);
    } catch (err) {
      done(err, null);
    }
  });

  // Local strategy for username/password authentication
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await db.query.users.findFirst({
            where: eq(schema.users.email, email)
          });

          if (!user) {
            return done(null, false, { message: "Invalid email or password" });
          }

          // Handle case where user might not have a password (Google auth users)
          if (!user.passwordHash) {
            return done(null, false, { message: "Invalid email or password" });
          }
          
          const isMatch = await bcrypt.compare(password, user.passwordHash);
          if (!isMatch) {
            return done(null, false, { message: "Invalid email or password" });
          }

          // Remove password hash from user object before sending to client
          const { passwordHash, ...userWithoutPassword } = user;
          return done(null, userWithoutPassword);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
}

export async function registerUser(req: Request, res: Response) {
  try {
    const { username, email, password, confirmPassword, firstName, lastName } = req.body;
    
    // Validate input using zod schema
    const validatedData = schema.userSignupSchema.parse({
      username,
      email,
      password,
      confirmPassword,
      firstName,
      lastName
    });
    
    // Check if user with email already exists
    const existingUserByEmail = await db.query.users.findFirst({
      where: eq(schema.users.email, validatedData.email)
    });
    
    if (existingUserByEmail) {
      return res.status(400).json({ message: "Email already in use" });
    }
    
    // Check if username is taken
    const existingUserByUsername = await db.query.users.findFirst({
      where: eq(schema.users.username, validatedData.username)
    });
    
    if (existingUserByUsername) {
      return res.status(400).json({ message: "Username already taken" });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(validatedData.password, salt);
    
    // Create user
    const [newUser] = await db.insert(schema.users).values({
      username: validatedData.username,
      email: validatedData.email,
      passwordHash: hashedPassword,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      role: "user", // Default role
      createdAt: new Date()
    }).returning({
      id: schema.users.id,
      username: schema.users.username,
      email: schema.users.email,
      firstName: schema.users.firstName,
      lastName: schema.users.lastName,
      role: schema.users.role,
      createdAt: schema.users.createdAt
    });
    
    // Generate JWT tokens
    const accessToken = generateAccessToken(newUser as schema.User);
    const refreshToken = generateRefreshToken(newUser as schema.User);
    
    // Set refresh token in HTTP-only cookie (8h - session ends after 8h inactivity)
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 8 * 60 * 60 * 1000 // 8 hours
    });
    
    return res.status(201).json({ 
      message: "Registration successful",
      user: newUser,
      accessToken
    });
  } catch (err) {
    console.error("Registration error:", err);
    
    if (err instanceof ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: err.errors 
      });
    }
    
    return res.status(500).json({ message: "Registration failed" });
  }
}

export async function loginUser(req: Request, res: Response) {
  // Passport.authenticate middleware has already verified the user at this point
  if (req.user) {
    // Generate JWT tokens
    const accessToken = generateAccessToken(req.user as any);
    const refreshToken = generateRefreshToken(req.user as any);
    
    // Security settings for cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' as 'none' | 'lax',
      path: '/'
    };
    
    // Set access token in HTTP-only cookie
    res.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000 // 15 minutes
    });
    
    // Set refresh token in HTTP-only cookie (8h - session ends after 8h inactivity)
    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 8 * 60 * 60 * 1000 // 8 hours
    });
    
    // Return user info and access token (for non-cookie clients)
    return res.json({ 
      user: req.user,
      accessToken
    });
  }
  return res.status(401).json({ message: "Login failed" });
}

export function logoutUser(req: Request, res: Response) {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    
    // Clear both auth cookies so session is fully ended
    res.clearCookie('refreshToken');
    res.clearCookie('accessToken');
    
    return res.json({ message: "Logout successful" });
  });
}

export function getCurrentUser(req: Request, res: Response) {
  if (req.isAuthenticated() && req.user) {
    return res.json({ user: req.user });
  }
  return res.status(401).json({ message: "Not authenticated" });
}

/**
 * Handle JWT token refresh
 */
export async function refreshToken(req: Request, res: Response) {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token not found" });
    }
    
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      // Clear the invalid cookie
      res.clearCookie('refreshToken');
      return res.status(401).json({ message: "Invalid or expired refresh token" });
    }
    
    // Get user from database
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, payload.userId)
    });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Generate new access token
    const accessToken = generateAccessToken(user);
    
    // Set security options for cookie (refresh cookie stays 8h)
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' as 'none' | 'lax',
      path: '/'
    };
    
    // Set access token in HTTP-only cookie
    res.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000 // 15 minutes
    });
    
    // Return the token in the response body as well (for non-cookie clients)
    return res.json({ accessToken });
  } catch (err) {
    console.error("Token refresh error:", err);
    return res.status(500).json({ 
      message: "Failed to refresh token",
      error: err instanceof Error ? err.message : "Unknown error"
    });
  }
}

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  // Check session-based auth first
  if (req.isAuthenticated()) {
    return next();
  }
  
  // If not session-authenticated, try JWT
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ message: "Invalid or expired token" });
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

export function isAdmin(req: Request, res: Response, next: NextFunction) {
  // First ensure the user is authenticated (which will also set JWT user data if needed)
  isAuthenticated(req, res, () => {
    if (req.user && (req.user as any).role === "admin") {
      return next();
    }
    return res.status(403).json({ message: "Admin access required" });
  });
}

export function isArtistMiddleware(req: Request, res: Response, next: NextFunction) {
  // First ensure the user is authenticated (which will also set JWT user data if needed)
  isAuthenticated(req, res, () => {
    if (req.user && (req.user as any).role === "artist") {
      return next();
    }
    return res.status(403).json({ message: "Artist access required" });
  });
}

export function isArtistOrAdminMiddleware(req: Request, res: Response, next: NextFunction) {
  // First ensure the user is authenticated (which will also set JWT user data if needed)
  isAuthenticated(req, res, () => {
    if (req.user && ((req.user as any).role === "artist" || (req.user as any).role === "admin")) {
      return next();
    }
    return res.status(403).json({ message: "Artist or admin access required" });
  });
}

/**
 * Handle authentication with Google
 * This is called after Firebase authentication on the client-side
 */
export async function authenticateWithGoogle(req: Request, res: Response) {
  try {
    const { providerId, email, username, firstName, lastName, profilePictureUrl, accessToken } = req.body;
    
    console.log('Google auth request received:', { 
      providerId: providerId?.substring(0, 5) + '...', // Log partial ID for security
      email: email?.substring(0, 3) + '...', 
      username 
    });
    console.log('[DEBUG] Received profilePictureUrl:', profilePictureUrl);
    console.log('[DEBUG] Received Google OAuth accessToken:', accessToken ? '[REDACTED]' : undefined);
    
    // If accessToken is present, fetch the user's profile photo from the Google People API
    let finalProfilePictureUrl = profilePictureUrl;
    if (accessToken) {
      try {
        const peopleRes = await fetch('https://people.googleapis.com/v1/people/me?personFields=photos', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        const peopleData = await peopleRes.json();
        const photos = (peopleData as any).photos;
        if (photos && photos.length > 0 && photos[0].url) {
          finalProfilePictureUrl = photos[0].url;
          console.log('[DEBUG] Fetched profile photo from People API:', finalProfilePictureUrl);
        } else {
          console.warn('[DEBUG] No photo found in People API response:', peopleData);
        }
      } catch (err) {
        console.error('[DEBUG] Error fetching profile photo from People API:', err);
      }
    }
    
    // Validate input
    try {
      var validatedData = schema.googleAuthSchema.parse({
        providerId,
        email,
        username,
        firstName,
        lastName,
        profilePictureUrl: finalProfilePictureUrl
      });
    } catch (validationError) {
      console.error('Google auth validation error:', validationError);
      return res.status(400).json({ 
        message: "Google authentication failed: Invalid data", 
        error: validationError instanceof Error ? validationError.message : "Validation error" 
      });
    }
    
    // Check if the user already exists by provider ID or email
    try {
      var existingUser = await db.query.users.findFirst({
        where: or(
          eq(schema.users.providerId, validatedData.providerId),
          eq(schema.users.email, validatedData.email)
        )
      });
      
      console.log('Existing user check:', existingUser ? 'Found' : 'Not found');
    } catch (dbError) {
      console.error('Database error during Google auth:', dbError);
      return res.status(500).json({ 
        message: "Google authentication failed: Database error", 
        error: dbError instanceof Error ? dbError.message : "Database error" 
      });
    }
    
    let user;
    
    if (existingUser) {
      // Always update Google profile picture and info on login
      const [updatedUser] = await db.update(schema.users)
        .set({
          providerId: validatedData.providerId,
          authProvider: 'google',
          firstName: validatedData.firstName || existingUser.firstName,
          lastName: validatedData.lastName || existingUser.lastName,
          profilePictureUrl: validatedData.profilePictureUrl || existingUser.profilePictureUrl,
          lastLoginAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(schema.users.id, existingUser.id))
        .returning();
      user = updatedUser;
    } else {
      // Create a new user if they don't exist
      const [newUser] = await db.insert(schema.users).values({
        username: validatedData.username,
        email: validatedData.email,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        providerId: validatedData.providerId,
        authProvider: 'google',
        profilePictureUrl: validatedData.profilePictureUrl,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date()
      }).returning();
      
      user = newUser;
    }
    
    // Login the user (create session)
    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to login after Google authentication", error: err.message });
      }
      
      // Generate JWT tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      
      // Set refresh token in HTTP-only cookie (8h - session ends after 8h inactivity)
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 8 * 60 * 60 * 1000 // 8 hours
      });
      
      return res.status(200).json({
        message: "Google authentication successful",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          profilePictureUrl: user.profilePictureUrl,
          authProvider: user.authProvider
        },
        accessToken
      });
    });
  } catch (err) {
    console.error("Google authentication error:", err);
    
    if (err instanceof ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: err.errors 
      });
    }
    
    return res.status(500).json({ 
      message: "Google authentication failed",
      error: err instanceof Error ? err.message : "Unknown error"
    });
  }
}

/**
 * Handle profile picture upload
 */
export async function uploadProfilePicture(req: Request, res: Response) {
  if (!req.file) {
    return res.status(400).json({ message: "No profile picture file provided" });
  }

  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const profilePictureUrl = `/uploads/profile_pictures/${req.file.filename}`;

    // Update user's profile picture URL in the database
    const [updatedUser] = await db.update(schema.users)
      .set({ profilePictureUrl, updatedAt: new Date() })
      .where(eq(schema.users.id, userId))
      .returning({
        id: schema.users.id,
        username: schema.users.username,
        email: schema.users.email,
        firstName: schema.users.firstName,
        lastName: schema.users.lastName,
        profilePictureUrl: schema.users.profilePictureUrl,
        role: schema.users.role,
        authProvider: schema.users.authProvider
      });

    if (!updatedUser) {
      return res.status(500).json({ message: "Failed to update profile picture in database" });
    }

    return res.json({ profilePictureUrl: updatedUser.profilePictureUrl });
  } catch (err) {
    console.error("Error updating profile picture:", err);
    return res.status(500).json({ message: "Failed to upload profile picture" });
  }
}

/**
 * Handle password change
 */
export async function changePassword(req: Request, res: Response) {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    
    // Validate input
    const validatedData = schema.passwordChangeSchema.parse({
      currentPassword,
      newPassword,
      confirmNewPassword
    });
    
    const userId = (req.user as any).id;
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, userId)
    });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // For users with Google auth only, they don't have a password to change
    if (user.authProvider === 'google' && !user.passwordHash) {
      return res.status(400).json({ 
        message: "Cannot change password for Google-authenticated accounts that haven't set a password" 
      });
    }
    
    // Verify current password
    if (!user.passwordHash) {
      return res.status(400).json({ message: "No password set for this account" });
    }
    
    const isPasswordCorrect = await bcrypt.compare(validatedData.currentPassword, user.passwordHash);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(validatedData.newPassword, salt);
    
    // Update password
    await db.update(schema.users)
      .set({
        passwordHash: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(schema.users.id, userId));
    
    return res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Password change error:", err);
    
    if (err instanceof ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: err.errors 
      });
    }
    
    return res.status(500).json({ 
      message: "Failed to change password",
      error: err instanceof Error ? err.message : "Unknown error"
    });
  }
}