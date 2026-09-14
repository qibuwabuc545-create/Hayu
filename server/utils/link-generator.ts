import crypto from 'crypto';

export interface IShareableLink {
  id: string;
  token: string;
  userId: string;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
  accessCount: number;
  lastAccessedAt?: string;
}

export function createShareableLink(
  userId: string,
  adminId: string,
  expirationDays: number = 30
): IShareableLink {
  const token = crypto.randomBytes(24).toString('hex');
  const now = new Date();
  const expires = new Date(now.getTime() + expirationDays * 24 * 60 * 60 * 1000);

  return {
    id: `link_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    token,
    userId,
    createdBy: adminId,
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    isActive: true,
    accessCount: 0
  };
}
