import { Request, Response, NextFunction } from 'express';
import { db } from '../store';

// Extend Express Request type to include user
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    isAdmin: boolean;
  };
}

/**
 * Verify JWT token and attach user to request
 */
export const verifyToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // TODO: Replace with actual JWT verification
    // For now, we'll use a simple token format: userId:email:isAdmin
    // In production, use a proper JWT library like jsonwebtoken
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [userId, email, isAdmin] = decoded.split(':');

    if (!userId || !email) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = {
      id: userId,
      email: email,
      isAdmin: isAdmin === 'true'
    };

    next();
  } catch (err: any) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

/**
 * Check if user is admin
 */
export const isAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

/**
 * Check if user is owner or admin
 */
export const isOwnerOrAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const userId = req.query.userId as string || req.body.userId;
  
  if (req.user.id !== userId && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Access denied' });
  }

  next();
};
