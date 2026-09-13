import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { UserPortal } from './components/UserPortal';
import { AdminPortal } from './components/AdminPortal';
import { PDFViewerModal } from './components/PDFViewerModal';
import { AddEditPDFModal } from './components/AddEditPDFModal';
import { AuthModal } from './components/AuthModal';
import { PaymentModal } from './components/PaymentModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import {
  PDFPost,
  UserRole,
  AggregatedCourseAnalytic,
  DetailedAnalytics,
  UserProfile,
  PaymentOrder
} from './types';

export default function App() {
  const [role, setRole] = useState<UserRole>('user');
  const [userPdfs, setUserPdfs] = useState<PDFPost[]>([]);
  const [adminPdfs, setAdminPdfs] = useState<PDFPost[]>([]);
  const [analytics, setAnalytics] = useState<AggregatedCourseAnalytic[]>([]);
  const [detailedAnalytics, setDetailedAnalytics] = useState<DetailedAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // User Auth & Monetization State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('academic_user_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [unlockedPdfIds, setUnlockedPdfIds] = useState<string[]>([]);
  const [userOrders, setUserOrders] = useState<PaymentOrder[]>([]);

  // Modals & Active Viewer
  const [activeReaderPdf, setActiveReaderPdf] = useState<PDFPost | null>(null);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState<boolean>(false);
  const [editingPdf, setEditingPdf] = useState<PDFPost | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [activePaymentPdf, setActivePaymentPdf] = useState<PDFPost | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Fetch student unlocked books & payment orders
  const fetchUserData = useCallback(async (user: UserProfile | null) => {
    if (!user) {
      setUnlockedPdfIds([]);
      setUserOrders([]);
      return;
    }
    try {
      const [unlockedRes, ordersRes] = await Promise.all([
        fetch(`/api/user/unlocked?userId=${user.id}`),
        fetch(`/api/orders?userId=${user.id}`)
      ]);

      if (unlockedRes.ok) {
        const unlockedData = await unlockedRes.json();
        setUnlockedPdfIds(unlockedData.unlockedPdfIds || []);
      }
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setUserOrders(ordersData || []);
      }
    } catch (e) {
      console.error('Failed to load user access data:', e);
    }
  }, []);

  // Fetch all initial catalog data
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [userRes, adminRes, analyticsRes, detailedRes] = await Promise.all([
        fetch('/api/user/pdfs'),
        fetch('/api/admin/pdfs'),
        fetch('/api/admin/analytics'),
        fetch('/api/admin/analytics/detailed')
      ]);

      if (userRes.ok) {
        const uData = await userRes.json();
        setUserPdfs(uData);
      }
      if (adminRes.ok) {
        const aData = await adminRes.json();
        setAdminPdfs(aData);
      }
      if (analyticsRes.ok) {
        const anData = await analyticsRes.json();
        setAnalytics(anData);
      }
      if (detailedRes.ok) {
        const detData = await detailedRes.json();
        setDetailedAnalytics(detData);
      }

      if (currentUser) {
        await fetchUserData(currentUser);
      }
    } catch (err) {
      console.error('Error fetching data from Express backend:', err);
      addToast('error', 'Connection Error', 'Could not sync with MongoDB Express backend.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, fetchUserData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // When user profile changes, sync to storage and load access
  const handleUserAuthenticated = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem('academic_user_profile', JSON.stringify(user));
    fetchUserData(user);
    addToast('success', 'Account Ready', `Welcome, ${user.name}!`);
  };

  const handleUserLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('academic_user_profile');
    setUnlockedPdfIds([]);
    setUserOrders([]);
    addToast('info', 'Signed Out', 'You have been signed out.');
  };

  // USER: Open and Read PDF (Triggers POST /api/analytics/track)
  const handleReadPDF = async (pdf: PDFPost) => {
    setActiveReaderPdf(pdf);
    try {
      const res = await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfId: pdf._id })
      });
      if (res.ok) {
        // Refresh analytics in background
        const [anRes, detRes] = await Promise.all([
          fetch('/api/admin/analytics'),
          fetch('/api/admin/analytics/detailed')
        ]);
        if (anRes.ok) setAnalytics(await anRes.json());
        if (detRes.ok) setDetailedAnalytics(await detRes.json());
      }
    } catch (err) {
      console.error('Failed to track view event:', err);
    }
  };

  // ADMIN: Reorder PDFs (Triggers PUT /api/pdfs/reorder)
  const handleReorderPDFs = async (orderedIds: string[]) => {
    const idMap = new Map(orderedIds.map((id, idx) => [id, idx]));
    setAdminPdfs(prev => {
      const next = [...prev].sort((a, b) => {
        const orderA = idMap.has(a._id) ? (idMap.get(a._id) as number) : a.sortOrder;
        const orderB = idMap.has(b._id) ? (idMap.get(b._id) as number) : b.sortOrder;
        return orderA - orderB;
      });
      return next.map((p, idx) => ({ ...p, sortOrder: idx }));
    });

    try {
      const res = await fetch('/api/pdfs/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds })
      });

      if (res.ok) {
        addToast('success', 'Order Synchronized', 'Catalog sequence updated and saved');
        const userRes = await fetch('/api/user/pdfs');
        if (userRes.ok) setUserPdfs(await userRes.json());
      } else {
        throw new Error('Failed to update order on server');
      }
    } catch (err: any) {
      addToast('error', 'Reorder Failed', err.message);
      fetchData(); // Rollback
    }
  };

  // ADMIN: Toggle Visibility
  const handleToggleVisibility = async (pdf: PDFPost) => {
    try {
      const newVisibility = !pdf.isVisible;
      const res = await fetch(`/api/admin/pdfs/${pdf._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: newVisibility })
      });

      if (res.ok) {
        addToast(
          'info',
          newVisibility ? 'Document Published' : 'Document Hidden',
          `${pdf.title} is now ${newVisibility ? 'visible in Student View' : 'hidden from students'}`
        );
        fetchData();
      }
    } catch (err: any) {
      addToast('error', 'Update Failed', err.message);
    }
  };

  // ADMIN: Create or Update PDF
  const handleSavePDF = async (data: Partial<PDFPost>) => {
    if (editingPdf) {
      const res = await fetch(`/api/admin/pdfs/${editingPdf._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Could not update document');
      addToast('success', 'Document Updated', data.title);
    } else {
      const res = await fetch('/api/pdfs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Could not create PDF post');
      addToast('success', 'New PDF Post Created', `Added to catalog with pricing and payment details`);
    }
    fetchData();
  };

  // ADMIN: Delete PDF
  const handleDeletePDF = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this PDF post?')) return;
    try {
      const res = await fetch(`/api/admin/pdfs/${id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('info', 'Document Removed', 'PDF deleted from catalog and remaining items re-indexed');
        fetchData();
      }
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message);
    }
  };

  // ADMIN: Reset seed data
  const handleResetSeed = async () => {
    try {
      setIsResetting(true);
      const res = await fetch('/api/seed', { method: 'POST' });
      if (res.ok) {
        addToast('success', 'Catalog Reset', 'Loaded sample course books, pricing and payment accounts');
        await fetchData();
      }
    } catch (err: any) {
      addToast('error', 'Reset Failed', err.message);
    } finally {
      setIsResetting(false);
    }
  };

  // Unique department list
  const departments = Array.from(new Set(adminPdfs.map(p => p.department)));

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col font-sans text-slate-900 antialiased selection:bg-emerald-600 selection:text-white">
      
      {/* Top Navigation */}
      <Navbar
        currentRole={role}
        onRoleChange={setRole}
        totalPdfs={userPdfs.length}
        totalViews={detailedAnalytics?.totalViews ?? analytics.reduce((a, b) => a + b.totalViews, 0)}
        onOpenAddModal={() => {
          setEditingPdf(null);
          setIsAddEditModalOpen(true);
        }}
        onResetSeed={handleResetSeed}
        isResetting={isResetting}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {role === 'user' ? (
          <UserPortal
            pdfs={userPdfs}
            isLoading={isLoading}
            onReadPDF={handleReadPDF}
            onRefresh={fetchData}
            onSwitchToAdmin={() => setRole('admin')}
            currentUser={currentUser}
            unlockedPdfIds={unlockedPdfIds}
            userOrders={userOrders}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onOpenPaymentModal={pdf => setActivePaymentPdf(pdf)}
          />
        ) : (
          <AdminPortal
            pdfs={adminPdfs}
            analytics={analytics}
            detailedAnalytics={detailedAnalytics}
            onReorder={handleReorderPDFs}
            onToggleVisibility={handleToggleVisibility}
            onEditPDF={pdf => {
              setEditingPdf(pdf);
              setIsAddEditModalOpen(true);
            }}
            onDeletePDF={handleDeletePDF}
            onOpenAddModal={() => {
              setEditingPdf(null);
              setIsAddEditModalOpen(true);
            }}
            onSimulateView={async pdfId => {
              const res = await fetch('/api/analytics/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pdfId })
              });
              if (res.ok) {
                addToast('success', 'View Event Triggered', `Tracked view for PDF: ${pdfId}`);
                fetchData();
              }
            }}
            onRefresh={fetchData}
            onReadPDF={handleReadPDF}
          />
        )}
      </main>

      {/* Full Open In-App Document Reader Modal */}
      <PDFViewerModal
        pdf={activeReaderPdf}
        onClose={() => setActiveReaderPdf(null)}
      />

      {/* Admin Add/Edit Document Modal */}
      <AddEditPDFModal
        isOpen={isAddEditModalOpen}
        onClose={() => {
          setIsAddEditModalOpen(false);
          setEditingPdf(null);
        }}
        onSubmit={handleSavePDF}
        initialData={editingPdf}
        departments={departments.length ? departments : ['Computer Science', 'Data Science & AI', 'Business & Management']}
      />

      {/* User Authentication Modal (Gmail & Account Creation) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onSuccess={handleUserAuthenticated}
        onLogout={handleUserLogout}
      />

      {/* Student Payment & Checkout Modal */}
      {activePaymentPdf && (
        <PaymentModal
          isOpen={!!activePaymentPdf}
          onClose={() => setActivePaymentPdf(null)}
          pdf={activePaymentPdf}
          currentUser={currentUser}
          onOrderSubmitted={() => {
            addToast('success', 'Payment Proof Submitted', 'Admin will verify your payment reference and release full access.');
            if (currentUser) fetchUserData(currentUser);
          }}
          onRequestAuth={() => {
            setActivePaymentPdf(null);
            setIsAuthModalOpen(true);
          }}
        />
      )}

      {/* Toast Feedback */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

    </div>
  );
}
