import { Request, Response, NextFunction } from 'express';
import { db } from '../store';

export interface LinkRequest extends Request {
  shareableLink?: any;
}

export const verifyShareableLink = (req: LinkRequest, res: Response, next: NextFunction) => {
  try {
    const linkId = req.params.linkId;
    if (!linkId) {
      return res.status(400).json({ error: 'Link ID or token is required' });
    }

    // Find link by id or token
    const links = db.getAllShareableLinks ? db.getAllShareableLinks() : [];
    const link = links.find((l: any) => (l.id === linkId || l.token === linkId) && l.isActive);

    if (!link) {
      return res.status(404).json({ error: 'Shareable link is invalid or expired' });
    }

    // Check expiration
    if (link.expiresAt && new Date(link.expiresAt).getTime() < Date.now()) {
      return res.status(410).json({ error: 'Shareable link has expired' });
    }

    req.shareableLink = link;
    next();
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to verify link' });
  }
};
