import { Request, Response, NextFunction } from 'express';
import { db } from '../store';

export interface AdminRequest extends Request {
  admin?: {
    id: string;
    email: string;
    role: 'admin' | 'super_admin';
  };
}

/**
 * Verify admin token and attach admin info to request
 */
export const verifyAdminToken = (req: AdminRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // TODO: Replace with actual JWT verification
    // For now, we'll use a simple token format: adminId:email:role
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [adminId, email, role] = decoded.split(':');

    if (!adminId || !email || (role !== 'admin' && role !== 'super_admin')) {
      return res.status(401).json({ error: 'Invalid admin token' });
    }

    // Verify admin exists in database
    const admin = db.getAdminById(adminId);
    if (!admin) {
      return res.status(401).json({ error: 'Admin not found' });
    }

    req.admin = {
      id: adminId,
      email: email,
      role: role as 'admin' | 'super_admin'
    };

    next();
  } catch (err: any) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Require admin access
 */
export const requireAdmin = (req: AdminRequest, res: Response, next: NextFunction) => {
  if (!req.admin) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }
  next();
};

/**
 * Require super admin access
 */
export const requireSuperAdmin = (req: AdminRequest, res: Response, next: NextFunction) => {
  if (!req.admin) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }
  
  if (req.admin.role !== 'super_admin') {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  
  next();
};
