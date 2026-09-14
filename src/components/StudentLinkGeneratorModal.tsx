import React, { useState, useMemo } from 'react';
import {
  X,
  Link as LinkIcon,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Share2,
  Send,
  MessageSquare,
  Mail,
  Sparkles,
  BookOpen,
  Filter,
  ShieldCheck,
  CheckCircle2,
  Globe,
  Sliders,
  Layers,
  ArrowRight
} from 'lucide-react';
import { PDFPost } from '../types';
import { BookCover } from './BookCover';
import { getStudentPortalUrl, getStandaloneBaseUrl } from '../utils/urlHelper';

export { getStudentPortalUrl, getStandaloneBaseUrl };

interface StudentLinkGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfs: PDFPost[];
  initialPdf?: PDFPost | null;
  onCopySuccess?: (msg: string) => void;
}

export const StudentLinkGeneratorModal: React.FC<StudentLinkGeneratorModalProps> = ({
  isOpen,
  onClose,
  pdfs,
  initialPdf,
  onCopySuccess
}) => {
  const [selectedBookId, setSelectedBookId] = useState<string>(initialPdf ? initialPdf._id : '');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [actionType, setActionType] = useState<'view' | 'read' | 'buy'>('view');
  const [campaignRef, setCampaignRef] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [showQrCode, setShowQrCode] = useState<boolean>(false);
  const [quickCopiedId, setQuickCopiedId] = useState<string | null>(null);

  // Sync initial PDF if provided
  React.useEffect(() => {
    if (initialPdf) {
      setSelectedBookId(initialPdf._id);
    }
  }, [initialPdf]);

  const departments = useMemo(() => {
    return Array.from(new Set(pdfs.map(p => p.department)));
  }, [pdfs]);

  const selectedPdf = useMemo(() => {
    return pdfs.find(p => p._id === selectedBookId) || null;
  }, [pdfs, selectedBookId]);

  const generatedUrl = useMemo(() => {
    return getStudentPortalUrl({
      bookId: selectedBookId || undefined,
      dept: selectedDept !== 'ALL' ? selectedDept : undefined,
      action: selectedBookId && actionType !== 'view' ? actionType : undefined,
      refCode: campaignRef || undefined
    });
  }, [selectedBookId, selectedDept, actionType, campaignRef]);

  if (!isOpen) return null;

  const handleCopy = (urlToCopy: string, label: string = 'Student Portal link') => {
    navigator.clipboard.writeText(urlToCopy);
    setCopied(true);
    if (onCopySuccess) onCopySuccess(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleQuickCopyBook = (pdf: PDFPost) => {
    const url = getStudentPortalUrl({ bookId: pdf._id });
    navigator.clipboard.writeText(url);
    setQuickCopiedId(pdf._id);
    if (onCopySuccess) onCopySuccess(`Copied direct link for "${pdf.title}"!`);
    setTimeout(() => setQuickCopiedId(null), 2500);
  };

  const handleShareTelegram = () => {
    const text = selectedPdf
      ? `📚 Read "${selectedPdf.title}" on The Books Hub Academic Portal:\n`
      : `📚 Access The Books Hub Academic Portal to read course books and academic documents:\n`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(generatedUrl)}&text=${encodeURIComponent(text)}`;
    window.open(shareUrl, '_blank');
  };

  const handleShareWhatsApp = () => {
    const text = selectedPdf
      ? `📚 Read "${selectedPdf.title}" on The Books Hub:\n${generatedUrl}`
      : `📚 Access the Academic Books Hub Portal:\n${generatedUrl}`;
    const shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(shareUrl, '_blank');
  };

  const handleShareEmail = () => {
    const subject = selectedPdf ? `Academic Access: ${selectedPdf.title}` : `Academic Books Portal Access Link`;
    const body = `Hello,\n\nHere is your official access link to the academic document library:\n\n${generatedUrl}\n\nYou can read online and access document downloads directly through this link.`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 text-white p-5 sm:p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <LinkIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full">
                  Admin Share Engine
                </span>
                <span className="text-[11px] text-slate-300 font-semibold">
                  Web Link Dispatcher
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                Generate &amp; Share Student Access Link
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
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* Main Primary Link Box with Copy & Open */}
          <div className="p-5 rounded-3xl bg-slate-900 text-white space-y-3.5 shadow-lg border border-slate-800 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                  Live Web Access Link for Students
                </span>
              </div>
              <span className="text-[11px] text-emerald-400 font-mono bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800">
                Direct Student Mode
              </span>
            </div>

            {/* URL Display Field */}
            <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
              <input
                type="text"
                readOnly
                value={generatedUrl}
                className="w-full bg-transparent text-amber-300 font-mono text-xs sm:text-sm font-bold focus:outline-none select-all px-2"
              />
              <button
                type="button"
                onClick={() => handleCopy(generatedUrl)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all flex-shrink-0 ${
                  copied
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>

            {/* Action Bar (Test Link, QR Code, Social Share) */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.open(generatedUrl, '_blank', 'noopener,noreferrer')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
                  title="Open in new browser window"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                  <span>Test in New Tab</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowQrCode(!showQrCode)}
                  className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 border transition-colors ${
                    showQrCode
                      ? 'bg-emerald-900/60 border-emerald-600 text-emerald-300'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>{showQrCode ? 'Hide QR Code' : 'Show QR Code'}</span>
                </button>
              </div>

              {/* Instant Social Channels */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">Share to:</span>
                
                {/* Telegram */}
                <button
                  type="button"
                  onClick={handleShareTelegram}
                  className="px-2.5 py-1.5 bg-[#0088cc]/20 hover:bg-[#0088cc]/40 text-[#29b6f6] rounded-xl font-bold flex items-center gap-1 border border-[#0088cc]/40 transition-colors text-xs"
                  title="Share on Telegram"
                >
                  <Send className="w-3 h-3" />
                  <span>Telegram</span>
                </button>

                {/* WhatsApp */}
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="px-2.5 py-1.5 bg-[#25D366]/20 hover:bg-[#25D366]/40 text-[#25D366] rounded-xl font-bold flex items-center gap-1 border border-[#25D366]/40 transition-colors text-xs"
                  title="Share on WhatsApp"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>WhatsApp</span>
                </button>

                {/* Email */}
                <button
                  type="button"
                  onClick={handleShareEmail}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
                  title="Share via Email"
                >
                  <Mail className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* QR Code Section Dropdown */}
            {showQrCode && (
              <div className="mt-3 p-4 bg-white text-slate-900 rounded-2xl flex flex-col sm:flex-row items-center gap-4 animate-in fade-in">
                <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm flex-shrink-0">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(generatedUrl)}`}
                    alt="Student Portal QR Code"
                    className="w-32 h-32"
                  />
                </div>
                <div className="space-y-1.5 text-center sm:text-left">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 justify-center sm:justify-start">
                    <QrCode className="w-4 h-4 text-emerald-600" />
                    <span>Scan with Mobile to Open Student Portal</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed max-w-sm">
                    Students can scan this QR code on physical syllabus printouts, lecture slides, or campus noticeboards to land straight on the document page.
                  </p>
                  <div className="pt-1">
                    <a
                      href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(generatedUrl)}`}
                      target="_blank"
                      download="student-access-qr.png"
                      className="inline-flex items-center gap-1 px-3 py-1 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-[11px] font-semibold"
                    >
                      Download High-Res QR Image
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Link Customizer Parameters */}
          <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                <span>Customize Link Target &amp; Auto-Actions</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setSelectedBookId('');
                  setSelectedDept('ALL');
                  setActionType('view');
                  setCampaignRef('');
                }}
                className="text-[11px] text-slate-500 hover:text-slate-800 font-medium"
              >
                Reset to Full Library
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Target Document */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Target Specific Document (Optional)
                </label>
                <select
                  value={selectedBookId}
                  onChange={e => setSelectedBookId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 font-medium"
                >
                  <option value="">Full Academic Library (All Books)</option>
                  {pdfs.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.course}: {p.title} {p.isPaid ? `(${p.currency || 'USD'} ${p.price})` : '(Free)'}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  If selected, student will land directly with this book highlighted.
                </p>
              </div>

              {/* Target Department Filter */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Filter by Department
                </label>
                <select
                  value={selectedDept}
                  onChange={e => setSelectedDept(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 font-medium"
                >
                  <option value="ALL">All Academic Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Pre-filters the student portal to only show this department's books.
                </p>
              </div>

              {/* Behavior on Link Click */}
              {selectedBookId && (
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Student Arrival Action
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 bg-white p-1 rounded-xl border border-slate-300 text-xs">
                    <button
                      type="button"
                      onClick={() => setActionType('view')}
                      className={`py-1.5 rounded-lg font-semibold transition-all ${
                        actionType === 'view' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Show in List
                    </button>
                    <button
                      type="button"
                      onClick={() => setActionType('read')}
                      className={`py-1.5 rounded-lg font-semibold transition-all ${
                        actionType === 'read' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Auto-Open Reader
                    </button>
                    <button
                      type="button"
                      onClick={() => setActionType('buy')}
                      className={`py-1.5 rounded-lg font-semibold transition-all ${
                        actionType === 'buy' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Auto-Checkout
                    </button>
                  </div>
                </div>
              )}

              {/* Campaign / Class Ref */}
              <div className={selectedBookId ? '' : 'sm:col-span-2'}>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Class / Batch / Referral Tag (Optional)
                </label>
                <input
                  type="text"
                  value={campaignRef}
                  onChange={e => setCampaignRef(e.target.value)}
                  placeholder="e.g. CS201_Fall2026, TelegramGroup, SectionA"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono text-slate-800"
                />
              </div>

            </div>
          </div>

          {/* Quick 1-Click Document Access Links Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>1-Click Individual Book Direct Links ({pdfs.length})</span>
              </h3>
              <span className="text-[11px] text-slate-400">
                Click any button to grab instant link
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
              {pdfs.map(pdf => {
                const isQuickCopied = quickCopiedId === pdf._id;
                return (
                  <div
                    key={pdf._id}
                    className="p-3 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 shadow-2xs transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-10 rounded shadow-xs overflow-hidden flex-shrink-0 bg-slate-100">
                        <BookCover pdf={pdf} size="xs" className="w-full h-full text-[6px]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-mono font-bold text-blue-600 uppercase truncate">
                          {pdf.course}
                        </div>
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {pdf.title}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {pdf.isPaid ? `${pdf.currency || 'USD'} ${pdf.price}` : 'Free Access'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleQuickCopyBook(pdf)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 flex-shrink-0 transition-all ${
                        isQuickCopied
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isQuickCopied ? <Check className="w-3 h-3 stroke-[3]" /> : <Copy className="w-3 h-3" />}
                      <span>{isQuickCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Students accessing via this link are loaded into the clean student catalog interface.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
