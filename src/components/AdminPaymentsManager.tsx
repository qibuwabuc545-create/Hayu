import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Eye,
  ShieldCheck,
  Building2,
  UserCheck,
  AlertCircle,
  ExternalLink,
  Trash2,
  Sparkles,
  BookOpen,
  ArrowUpRight
} from 'lucide-react';
import { PaymentOrder, PDFPost } from '../types';
import { PaymentLogo } from './PaymentLogo';

interface AdminPaymentsManagerProps {
  pdfs: PDFPost[];
  onOrderUpdated?: () => void;
}

export const AdminPaymentsManager: React.FC<AdminPaymentsManagerProps> = ({
  pdfs,
  onOrderUpdated
}) => {
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'released' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/payments/orders');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch orders');
      setOrders(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Error loading orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleReleaseBook = async (orderId: string) => {
    try {
      setProcessingId(orderId);
      setActionSuccess(null);
      setError(null);

      const res = await fetch(`/api/payments/orders/${orderId}/release`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes: 'Verified and approved by admin. Book access released.' })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to release book');

      setActionSuccess(`Book successfully released for order ${orderId}! The student can now read and download.`);
      await fetchOrders();
      if (onOrderUpdated) onOrderUpdated();
    } catch (err: any) {
      setError(err.message || 'Error releasing book');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    const reason = window.prompt('Enter reason for rejecting this payment order:', 'Invalid transaction reference or payment not received in ledger.');
    if (reason === null) return;

    try {
      setProcessingId(orderId);
      setActionSuccess(null);
      setError(null);

      const res = await fetch(`/api/payments/orders/${orderId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes: reason })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject order');

      setActionSuccess(`Order ${orderId} marked as rejected.`);
      await fetchOrders();
      if (onOrderUpdated) onOrderUpdated();
    } catch (err: any) {
      setError(err.message || 'Error rejecting order');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm('Delete this payment order record from database?')) return;

    try {
      setProcessingId(orderId);
      const res = await fetch(`/api/payments/orders/${orderId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete order');
      await fetchOrders();
      if (onOrderUpdated) onOrderUpdated();
    } catch (err: any) {
      setError(err.message || 'Error deleting order');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreateTestOrder = async () => {
    try {
      setLoading(true);
      const targetPdf = pdfs.find(p => p.isPaid) || pdfs[0];
      if (!targetPdf) {
        alert('No documents found in database.');
        return;
      }

      await fetch('/api/payments/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user_default',
          userEmail: 'qibuwabuc545@gmail.com',
          userName: 'Davis Workman',
          pdfId: targetPdf._id,
          amount: targetPdf.price || 9.99,
          currency: targetPdf.currency || 'USD',
          paymentMethod: 'Bank Transfer (Global Education Bank)',
          transactionRef: 'WIRE-' + Math.floor(10000 + Math.random() * 90000) + '-DEMO',
          notes: 'Test payment confirmation for instant verification.'
        })
      });

      await fetchOrders();
      setActionSuccess('Demo student payment order created! You can now verify and release the book.');
    } catch (err: any) {
      setError(err.message || 'Failed to create demo order');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch =
      order.pdfTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.transactionRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.course.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const releasedCount = orders.filter(o => o.status === 'released').length;
  const totalRevenue = orders
    .filter(o => o.status === 'released')
    .reduce((sum, o) => sum + (o.amount || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Pending Approvals */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Pending Verifications</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">{pendingCount}</span>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                Action Required
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">Student payments waiting for book release</p>
        </div>

        {/* Released Accesses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Released &amp; Active Books</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{releasedCount}</div>
          <p className="text-[11px] text-emerald-600 font-medium">Unlocked student reading licenses</p>
        </div>

        {/* Total Collected Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Verified Revenue</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            ${totalRevenue.toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-500">From approved book sales</p>
        </div>

        {/* Quick Simulator */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Test Workflow</span>
            <Sparkles className="w-4 h-4 text-indigo-500" />
          </div>
          <button
            onClick={handleCreateTestOrder}
            disabled={loading}
            className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Simulate Student Payment</span>
          </button>
          <div className="text-[10px] text-slate-400 text-center">Generates instant pending order</div>
        </div>

      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-medium">{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-2xl flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Controls and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search student, email, ref, or book..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'pending', 'released', 'rejected'] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status === 'all'
                ? `All (${orders.length})`
                : status === 'pending'
                ? `Pending (${pendingCount})`
                : status === 'released'
                ? `Released (${releasedCount})`
                : `Rejected`}
            </button>
          ))}

          <button
            onClick={fetchOrders}
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors ml-1"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Orders Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Student Payment Orders &amp; Document Release Ledger</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspect student payment confirmations, verify bank/PayPal references, and release full book access.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-500">
            {filteredOrders.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Student (Gmail / Name)</th>
                <th className="py-3 px-4">Requested Book &amp; Course</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Payment Method &amp; Reference ID</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Verification &amp; Release Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-xs">No payment orders found matching this filter.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      When students submit payments, they will appear here for verification.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const isPending = order.status === 'pending';
                  const isReleased = order.status === 'released';
                  const isRejected = order.status === 'rejected';

                  return (
                    <tr key={order._id} className="hover:bg-slate-50 transition-colors">
                      {/* Student info */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                            <span>{order.userName}</span>
                          </div>
                          <div className="font-mono text-slate-500 text-[11px]">
                            {order.userEmail}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(order.submittedAt).toLocaleTimeString()} • {new Date(order.submittedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </td>

                      {/* Book info */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="font-mono text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                            {order.course}
                          </span>
                          <h4 className="font-bold text-slate-800 text-xs">
                            {order.pdfTitle}
                          </h4>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        ${Number(order.amount).toFixed(2)} <span className="text-[10px] text-slate-400">{order.currency}</span>
                      </td>

                      {/* Payment details */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <PaymentLogo name={order.paymentMethod} size="xs" />
                            <span className="truncate max-w-[180px]">{order.paymentMethod}</span>
                          </div>
                          <div className="font-mono font-bold text-blue-700 text-[11px] bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded inline-block">
                            Ref: {order.transactionRef}
                          </div>
                          {order.notes && (
                            <div className="text-[10px] text-slate-500 italic max-w-xs truncate">
                              "{order.notes}"
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                            <Clock className="w-3 h-3 animate-pulse" /> Pending Review
                          </span>
                        )}
                        {isReleased && (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Released &amp; Unlocked
                            </span>
                            {order.releasedAt && (
                              <div className="text-[10px] text-slate-400 font-mono">
                                {new Date(order.releasedAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
                            <XCircle className="w-3 h-3" /> Rejected
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending ? (
                            <>
                              <button
                                onClick={() => handleReleaseBook(order._id)}
                                disabled={processingId === order._id}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-all disabled:opacity-50"
                                title="Verify payment in ledger and release book to student"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Verify &amp; Release Book</span>
                              </button>

                              <button
                                onClick={() => handleRejectOrder(order._id)}
                                disabled={processingId === order._id}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-200 transition-colors"
                                title="Reject payment order"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          ) : isReleased ? (
                            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                              <span className="bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                                <BookOpen className="w-3.5 h-3.5 text-emerald-600" /> Book Active
                              </span>
                              <button
                                onClick={() => handleDeleteOrder(order._id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                                title="Delete order archive"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleReleaseBook(order._id)}
                              disabled={processingId === order._id}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                            >
                              Re-evaluate &amp; Release
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
