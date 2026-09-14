export interface PDFPost {
  _id: string;
  title: string;
  pdfUrl: string;
  department: string;
  course: string;
  isVisible: boolean;
  sortOrder: number;
  createdAt: string;
  summary?: string;
  fileSize?: string;
  pageCount?: number;
  author?: string;
  category?: string;
  coverImage?: string;
  coverColor?: string;
  tagline?: string;
  // Payment fields
  isPaid?: boolean;
  price?: number;
  currency?: string;
  paymentMethods?: string[];
  paymentInstructions?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: 'email' | 'google';
  createdAt: string;
}

export type PaymentCategory = 'ethiopian' | 'crypto' | 'bank' | 'mobile' | 'other';

export interface PaymentMethodConfig {
  id: string;
  name: string;
  accountName: string;
  accountNumber: string;
  bankName?: string;
  category?: PaymentCategory | string;
  network?: string; // e.g. TRC20, ERC20, BEP20, Bitcoin, Solana
  qrCodeUrl?: string;
  notes?: string;
  active: boolean;
}

export interface PaymentSettings {
  defaultCurrency: string;
  defaultInstructions: string;
  methods: PaymentMethodConfig[];
}

export type PaymentOrderStatus = 'pending' | 'released' | 'rejected';

export interface PaymentOrder {
  _id: string;
  userId: string;
  userEmail: string;
  userName: string;
  pdfId: string;
  pdfTitle: string;
  course: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionRef: string;
  receiptImage?: string;
  notes?: string;
  status: PaymentOrderStatus;
  submittedAt: string;
  releasedAt?: string;
  adminNotes?: string;
}

export interface AggregatedCourseAnalytic {
  _id: string; // course name
  totalViews: number;
  department: string;
}

export interface PDFAnalyticStat {
  pdfId: string;
  title: string;
  course: string;
  department: string;
  views: number;
}

export interface DepartmentAnalyticStat {
  department: string;
  totalViews: number;
}

export interface AnalyticsLog {
  _id: string;
  pdfId: string;
  viewedAt: string;
  department: string;
  course: string;
  title?: string;
}

export interface DetailedAnalytics {
  aggregated: AggregatedCourseAnalytic[];
  pdfStats: PDFAnalyticStat[];
  departmentStats: DepartmentAnalyticStat[];
  recentActivity: AnalyticsLog[];
  totalViews: number;
  totalDocuments: number;
}

export type UserRole = 'user' | 'admin';
export type AdminTab = 'reorder' | 'links' | 'analytics' | 'payments' | 'payment-settings' | 'api-docs';
export type UserNavTab = 'discover' | 'library' | 'download' | 'favorite' | 'purchases';
