import { Router } from 'express';
import { db } from '../store';
import { verifyAdminToken, requireAdmin, requireSuperAdmin } from '../middleware/admin-auth';
import { createShareableLink } from '../utils/link-generator';

const router = Router();

/**
 * Admin Login - Generate admin token
 * In production, verify credentials against database/OAuth
 */
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const admin = db.authenticateAdmin(email, password);
    
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token: adminId:email:role (base64 encoded)
    const tokenData = `${admin.id}:${admin.email}:${admin.role}`;
    const token = Buffer.from(tokenData).toString('base64');

    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

/**
 * Get admin dashboard data
 */
router.get('/dashboard', verifyAdminToken, requireAdmin, (req, res) => {
  try {
    const stats = {
      totalUsers: db.getAllUsers().length,
      totalPDFs: db.countPDFs(),
      totalOrders: db.getAllOrders().length,
      pendingOrders: db.getAllOrders().filter((o: any) => o.status === 'pending').length,
      totalViews: db.getDetailedAnalytics().totalViews,
      recentOrders: db.getAllOrders().slice(-10)
    };

    res.json({
      admin: (req as any).admin,
      stats
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch dashboard' });
  }
});

/**
 * Create a shareable link for a user
 * Admin can create links to grant access to specific users
 */
router.post('/users/:userId/generate-link', verifyAdminToken, requireAdmin, (req, res) => {
  try {
    const { userId } = req.params;
    const { expirationDays } = req.body;

    const user = db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const link = createShareableLink(userId, (req as any).admin.id, expirationDays);
    const savedLink = db.createShareableLink(link);

    res.status(201).json({
      success: true,
      link: savedLink,
      shareUrl: `${process.env.APP_URL || 'http://localhost:3000'}/user/${savedLink.token}`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate link' });
  }
});

/**
 * List all shareable links
 */
router.get('/links', verifyAdminToken, requireAdmin, (req, res) => {
  try {
    const links = db.getAllShareableLinks();
    res.json(links);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch links' });
  }
});

/**
 * Get links for a specific user
 */
router.get('/users/:userId/links', verifyAdminToken, requireAdmin, (req, res) => {
  try {
    const { userId } = req.params;
    const links = db.getShareableLinksByUserId(userId);
    res.json(links);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch user links' });
  }
});

/**
 * Deactivate a shareable link
 */
router.put('/links/:linkId/deactivate', verifyAdminToken, requireAdmin, (req, res) => {
  try {
    const { linkId } = req.params;
    const link = db.deactivateShareableLink(linkId);

    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    res.json({ success: true, link });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to deactivate link' });
  }
});

/**
 * Delete a shareable link
 */
router.delete('/links/:linkId', verifyAdminToken, requireSuperAdmin, (req, res) => {
  try {
    const { linkId } = req.params;
    const success = db.deleteShareableLink(linkId);

    if (!success) {
      return res.status(404).json({ error: 'Link not found' });
    }

    res.json({ success: true, message: 'Link deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete link' });
  }
});

/**
 * Get all users (for admin dashboard)
 */
router.get('/users', verifyAdminToken, requireAdmin, (req, res) => {
  try {
    const users = db.getAllUsers();
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch users' });
  }
});

export default router;
