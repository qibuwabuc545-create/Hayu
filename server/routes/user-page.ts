import { Router, Request, Response } from 'express';
import { db } from '../store';
import { verifyShareableLink } from '../middleware/link-auth';

const router = Router();

interface LinkRequest extends Request {
  shareableLink?: any;
}

/**
 * Get user profile via shareable link
 * Public endpoint - accessed via /api/user-page/:linkId
 */
router.get('/:linkId', verifyShareableLink, (req: LinkRequest, res: Response) => {
  try {
    const link = (req as any).shareableLink;
    const user = db.getUserById(link.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Track access
    db.recordShareableLinkAccess(link.id);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar
      },
      link: {
        id: link.id,
        accessCount: link.accessCount,
        createdAt: link.createdAt,
        expiresAt: link.expiresAt
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch user page' });
  }
});

/**
 * Get user's unlocked PDFs via shareable link
 */
router.get('/:linkId/access', verifyShareableLink, (req: LinkRequest, res: Response) => {
  try {
    const link = (req as any).shareableLink;
    const accessList = db.getUserAccess(link.userId);
    const unlockedPdfIds = Array.from(new Set(accessList.map(a => a.pdfId)));
    
    // Get PDF details for unlocked books
    const unlockedPdfs = unlockedPdfIds
      .map(pdfId => db.getPDFById(pdfId))
      .filter(pdf => pdf && pdf.isVisible);

    res.json({
      userId: link.userId,
      unlockedCount: unlockedPdfs.length,
      unlockedPdfs: unlockedPdfs,
      accessList: accessList
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch access list' });
  }
});

/**
 * Get specific PDF via shareable link
 * User can only access PDFs they have been granted access to
 */
router.get('/:linkId/pdfs/:pdfId', verifyShareableLink, (req: LinkRequest, res: Response) => {
  try {
    const link = (req as any).shareableLink;
    const { pdfId } = req.params;

    const pdf = db.getPDFById(pdfId);
    if (!pdf) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    // Check if user has access to this PDF
    const hasAccess = db.hasAccessToPDF(link.userId, pdfId);
    
    if (!hasAccess && pdf.isPaid) {
      return res.status(403).json({ error: 'Access denied. User has not purchased this PDF.' });
    }

    // Track view
    db.trackView(pdfId);

    res.json({
      pdf: pdf,
      hasAccess: hasAccess || !pdf.isPaid
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch PDF' });
  }
});

export default router;
