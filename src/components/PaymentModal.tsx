import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Building2,
  Copy,
  Check,
  AlertCircle,
  Clock,
  ShieldCheck,
  FileCheck,
  Send,
  Sparkles,
  Lock,
  BookOpen,
  ArrowRight,
  Coins,
  Smartphone,
  Globe,
  QrCode,
  Info
} from 'lucide-react';
import { PDFPost, UserProfile, PaymentSettings, PaymentOrder, PaymentMethodConfig } from '../types';
import { BookCover } from './BookCover';
import { PaymentLogo, getPaymentMethodBrand } from './PaymentLogo';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdf: PDFPost | null;
  currentUser: UserProfile | null;
  onRequestAuth?: () => void;
  onRequireAuth?: () => void;
  onOrderSubmitted?: (order: PaymentOrder) => void;
  onPaymentSubmitted?: (order: PaymentOrder) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  pdf,
  currentUser,
  onRequestAuth,
  onRequireAuth,
  onOrderSubmitted,
  onPaymentSubmitted
}) => {
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'ethiopian' | 'crypto' | 'bank'>('all');
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<PaymentOrder | null>(null);
  const [error, setError] = useState<string | null>(null);

  const triggerAuth = onRequestAuth || onRequireAuth || (() => {});
  const triggerSubmitted = onOrderSubmitted || onPaymentSubmitted || (() => {});

  // Fetch admin payment settings
  useEffect(() => {
    if (isOpen) {
      setSubmittedOrder(null);
      setError(null);
      setTransactionRef('');
      setNotes('');

      fetch('/api/payments/settings')
        .then(res => res.json())
        .then(data => {
          if (data) {
            setPaymentSettings(data);
            if (data.methods && data.methods.length > 0) {
              const activeMethods = data.methods.filter((m: any) => m.active);
              if (activeMethods.length > 0) {
                // If book has specific allowed paymentMethods, pick first matching active
                if (pdf?.paymentMethods && pdf.paymentMethods.length > 0) {
                  const match = activeMethods.find((m: any) => pdf.paymentMethods?.includes(m.id));
                  setSelectedMethodId(match ? match.id : activeMethods[0].id);
                } else {
                  setSelectedMethodId(activeMethods[0].id);
                }
              }
            }
          }
        })
        .catch(err => console.error('Failed to load payment settings:', err));
    }
  }, [isOpen, pdf]);

  if (!isOpen || !pdf) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeMethods = paymentSettings?.methods.filter(m => m.active) || [];
  
  // Categorize methods
  const getMethodCategory = (m: PaymentMethodConfig) => {
    const lower = (m.name + ' ' + (m.bankName || '')).toLowerCase();
    if (m.category === 'ethiopian' || lower.includes('telebirr') || lower.includes('cbe')) return 'ethiopian';
    if (m.category === 'crypto' || lower.includes('usdt') || lower.includes('btc') || lower.includes('eth') || lower.includes('crypto') || lower.includes('binance')) return 'crypto';
    return 'bank';
  };

  const filteredMethods = activeMethods.filter(m => {
    if (selectedCategory === 'all') return true;
    return getMethodCategory(m) === selectedCategory;
  });

  const selectedMethod = activeMethods.find(m => m.id === selectedMethodId) || filteredMethods[0] || activeMethods[0];
  const selectedBrand = selectedMethod ? getPaymentMethodBrand(selectedMethod.name, selectedMethod.category) : null;
  const price = pdf.price || 0;
  const currency = pdf.currency || paymentSettings?.defaultCurrency || 'USD';

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      triggerAuth();
      return;
    }

    if (!transactionRef.trim()) {
      setError('Please provide your Transaction ID / Reference Number / SMS confirmation code.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const res = await fetch('/api/payments/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          userEmail: currentUser.email,
          userName: currentUser.name,
          pdfId: pdf._id,
          amount: price,
          currency,
          paymentMethod: selectedMethod ? `${selectedMethod.name} (${selectedMethod.accountNumber})` : 'Direct Payment',
          transactionRef: transactionRef.trim(),
          notes: notes.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit payment order');

      setSubmittedOrder(data.order);
      triggerSubmitted(data.order);
    } catch (err: any) {
      setError(err.message || 'Payment submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 text-white p-5 sm:p-6 relative flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full">
                  Official Verified Checkout
                </span>
                <span className="text-[11px] text-slate-300 font-bold">
                  {pdf.course}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                Unlock Full Document Access
              </h2>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          
          {/* Submission Success View */}
          {submittedOrder ? (
            <div className="p-6 text-center space-y-4 bg-emerald-50/60 border border-emerald-200 rounded-3xl animate-in fade-in">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Clock className="w-7 h-7 animate-pulse" />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 inline-block mb-2 border border-amber-300">
                  Status: Pending Admin Verification
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  Payment Submitted Successfully!
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto leading-relaxed">
                  Your payment order <strong className="font-mono text-slate-900">{submittedOrder._id}</strong> has been logged with reference <strong className="font-mono text-slate-900">{submittedOrder.transactionRef}</strong>.
                  The administrator will verify receipt and unlock <strong className="text-emerald-700">"{pdf.title}"</strong> for full online reading &amp; offline PDF download.
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-emerald-200 text-left text-xs space-y-2.5 max-w-md mx-auto font-mono">
                <div className="flex justify-between items-center text-slate-500">
                  <span>Document:</span>
                  <span className="font-bold text-slate-900 truncate max-w-[200px]">{pdf.title}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span>Amount:</span>
                  <span className="font-bold text-emerald-600 font-sans text-sm">
                    {currency === 'ETB' ? `${price} Br ETB` : currency === 'USDT' ? `${price} USDT` : `$${price.toFixed(2)} ${currency}`}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span>Payment Channel:</span>
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <PaymentLogo name={submittedOrder.paymentMethod} size="xs" />
                    <span>{submittedOrder.paymentMethod}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span>Reference ID:</span>
                  <span className="font-bold text-slate-900">{submittedOrder.transactionRef}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span>Payer Account:</span>
                  <span className="font-bold text-slate-900">{submittedOrder.userEmail}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                >
                  Back to Library
                </button>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Book Overview Card with First Page Cover */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-14 h-20 flex-shrink-0 rounded-lg shadow-md overflow-hidden bg-white">
                    <BookCover pdf={pdf} size="sm" className="w-full h-full text-[8px]" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <span className="text-[10px] font-mono font-bold text-blue-600 uppercase">
                      {pdf.course} • {pdf.department}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {pdf.title}
                    </h3>
                    <p className="text-xs text-slate-500">
                      by {pdf.author || 'Academic Faculty'} • {pdf.pageCount || 20} pages
                    </p>
                  </div>
                </div>

                {/* Price Tag */}
                <div className="text-right flex-shrink-0 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-2xl">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase font-mono block">
                    Required Amount
                  </span>
                  <span className="text-xl font-black text-emerald-900 font-mono">
                    {currency === 'ETB' ? `${price} Br` : currency === 'USDT' ? `${price} ₮` : `$${price.toFixed(2)}`}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold block">
                    {currency}
                  </span>
                </div>
              </div>

              {/* Payment Method Selector with Category Filter */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Choose Payment Channel (Official Logos)</span>
                  </label>

                  {/* Category Filter Tabs */}
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('all')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        selectedCategory === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      All ({activeMethods.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('ethiopian')}
                      className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                        selectedCategory === 'ethiopian' ? 'bg-[#5C0632] text-amber-300 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <span>🇪🇹</span> Ethiopian
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('crypto')}
                      className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                        selectedCategory === 'crypto' ? 'bg-[#26A17B] text-white shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Coins className="w-3 h-3" /> Crypto
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('bank')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        selectedCategory === 'bank' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Bank / Other
                    </button>
                  </div>
                </div>

                {/* Official Brand Method Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {filteredMethods.map(m => {
                    const isSelected = selectedMethod?.id === m.id;
                    const brand = getPaymentMethodBrand(m.name, m.category);

                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMethodId(m.id)}
                        className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 relative overflow-hidden ${
                          isSelected
                            ? `${brand.selectedRing} shadow-md`
                            : `border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/70`
                        }`}
                      >
                        {/* Official Brand Logo */}
                        <div className="flex-shrink-0">
                          <PaymentLogo name={m.name} category={m.category} size="md" />
                        </div>

                        {/* Details */}
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs text-slate-900 truncate">
                              {m.name}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono font-semibold text-slate-700 truncate">
                            {m.accountNumber}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {m.accountName} {m.network ? `• ${m.network}` : ''}
                          </div>
                        </div>

                        {/* Selection Check Circle */}
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Method Detail Card Styled with Official Brand Identity */}
              {selectedMethod && selectedBrand && (
                <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 text-white space-y-3.5 shadow-lg border border-slate-800 relative overflow-hidden">
                  
                  {/* Brand Gradient Accent line */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1.5"
                    style={{ backgroundColor: selectedBrand.primaryColor }}
                  />

                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <PaymentLogo name={selectedMethod.name} category={selectedMethod.category} size="lg" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-white">
                            {selectedMethod.name}
                          </h4>
                          <span
                            className="text-[9px] font-bold px-2 py-0.5 rounded-full border"
                            style={{
                              backgroundColor: `${selectedBrand.primaryColor}25`,
                              borderColor: `${selectedBrand.primaryColor}60`,
                              color: '#FFFFFF'
                            }}
                          >
                            {selectedBrand.displayName}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {selectedMethod.bankName || selectedBrand.subName}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono text-slate-400 block uppercase">
                        Due
                      </span>
                      <span className="text-sm font-black text-amber-300 font-mono">
                        {currency === 'ETB' ? `${price} Br` : currency === 'USDT' ? `${price} USDT` : `$${price.toFixed(2)}`}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Account Name */}
                    <div className="bg-slate-800/90 p-3 rounded-2xl border border-slate-700">
                      <div className="text-[10px] uppercase font-mono text-slate-400 font-bold">
                        Account Holder / Beneficiary Name
                      </div>
                      <div className="font-bold text-slate-100 mt-0.5 text-xs sm:text-sm">
                        {selectedMethod.accountName}
                      </div>
                    </div>

                    {/* Account / Phone / Address with Copy */}
                    <div className="bg-slate-800/90 p-3 rounded-2xl border border-slate-700">
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] uppercase font-mono text-slate-400 font-bold">
                          {selectedMethod.category === 'crypto' ? 'Wallet Address / Pay ID' : 'Account / Phone Number'}
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(selectedMethod.accountNumber, selectedMethod.id)}
                          className="text-[11px] px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 font-bold flex items-center gap-1 transition-colors"
                        >
                          {copiedId === selectedMethod.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedId === selectedMethod.id ? 'Copied!' : 'Copy'}</span>
                        </button>
                      </div>
                      <div className="font-mono font-bold text-amber-300 text-xs sm:text-sm mt-1 break-all select-all">
                        {selectedMethod.accountNumber}
                      </div>
                    </div>

                    {/* Network info */}
                    {selectedMethod.network && (
                      <div className="bg-slate-800/90 p-2.5 rounded-2xl border border-slate-700">
                        <div className="text-[10px] uppercase font-mono text-slate-400 font-bold">
                          Crypto Protocol / Network
                        </div>
                        <div className="font-mono font-bold text-emerald-400 mt-0.5">
                          {selectedMethod.network}
                        </div>
                      </div>
                    )}

                    {/* Instructions */}
                    <div className={`bg-slate-800/90 p-2.5 rounded-2xl border border-slate-700 ${selectedMethod.network ? '' : 'sm:col-span-2'}`}>
                      <div className="text-[10px] uppercase font-mono text-slate-400 font-bold">
                        Transfer Remarks &amp; Verification Guidance
                      </div>
                      <div className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                        {selectedMethod.notes || 'Please transfer the exact amount and paste your Transaction ID / Confirmation code below.'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Proof Submission Form */}
              <form onSubmit={handleSubmitPayment} className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Your Payment Transaction ID / Reference Number / SMS Code *
                  </label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={e => setTransactionRef(e.target.value)}
                    placeholder="e.g. Telebirr TXN ref, CBE 13-digit code, USDT TxHash, PayPal ID"
                    className="w-full px-3.5 py-2.5 text-xs font-mono font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Enter the confirmation code generated by Telebirr, CBE Mobile, or your Crypto wallet so the admin can verify your payment.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Optional Remarks / Student Identifier
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="e.g. Paid from 0911xxxxxx at 10:45 AM"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800"
                  />
                </div>

                {/* Authentication Notice */}
                {!currentUser && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span>You must sign in with your Gmail or account to link this purchase.</span>
                    </div>
                    <button
                      type="button"
                      onClick={triggerAuth}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold"
                    >
                      Sign In
                    </button>
                  </div>
                )}

                {/* Submit Action */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? 'Verifying & Submitting...' : 'Confirm Payment & Submit Reference'}</span>
                  </button>
                </div>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
};
