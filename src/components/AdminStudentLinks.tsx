import React, { useState, useMemo } from 'react';
import {
  Link as LinkIcon,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Send,
  MessageSquare,
  Mail,
  Sparkles,
  BookOpen,
  Filter,
  ShieldCheck,
  Globe,
  Sliders,
  Share2,
  CheckCircle2,
  Users,
  Eye
} from 'lucide-react';
import { PDFPost } from '../types';
import { BookCover } from './BookCover';
import { getStudentPortalUrl } from './StudentLinkGeneratorModal';

interface AdminStudentLinksProps {
  pdfs: PDFPost[];
  onOpenGenerateModal: (pdf?: PDFPost) => void;
  onReadPDF?: (pdf: PDFPost) => void;
  onSwitchToUser?: () => void;
}

export const AdminStudentLinks: React.FC<AdminStudentLinksProps> = ({
  pdfs,
  onOpenGenerateModal,
  onReadPDF,
  onSwitchToUser
}) => {
  const [selectedBookId, setSelectedBookId] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [actionType, setActionType] = useState<'view' | 'read' | 'buy'>('view');
  const [refTag, setRefTag] = useState<string>('');
  const [copiedGeneral, setCopiedGeneral] = useState<boolean>(false);
  const [copiedCustom, setCopiedCustom] = useState<boolean>(false);
  const [copiedBookId, setCopiedBookId] = useState<string | null>(null);
  const [showQr, setShowQr] = useState<boolean>(false);

  const mainPortalUrl = useMemo(() => {
    return getStudentPortalUrl();
  }, []);

  const customUrl = useMemo(() => {
    return getStudentPortalUrl({
      bookId: selectedBookId || undefined,
      dept: selectedDept !== 'ALL' ? selectedDept : undefined,
      action: selectedBookId && actionType !== 'view' ? actionType : undefined,
      refCode: refTag || undefined
    });
  }, [selectedBookId, selectedDept, actionType, refTag]);

  const departments = useMemo(() => {
    return Array.from(new Set(pdfs.map(p => p.department)));
  }, [pdfs]);

  const selectedPdf = useMemo(() => {
    return pdfs.find(p => p._id === selectedBookId) || null;
  }, [pdfs, selectedBookId]);

  const handleCopyGeneral = () => {
    navigator.clipboard.writeText(mainPortalUrl);
    setCopiedGeneral(true);
    setTimeout(() => setCopiedGeneral(false), 2500);
  };

  const handleCopyCustom = () => {
    navigator.clipboard.writeText(customUrl);
    setCopiedCustom(true);
    setTimeout(() => setCopiedCustom(false), 2500);
  };

  const handleCopyBookLink = (pdf: PDFPost) => {
    const url = getStudentPortalUrl({ bookId: pdf._id });
    navigator.clipboard.writeText(url);
    setCopiedBookId(pdf._id);
    setTimeout(() => setCopiedBookId(null), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Header Overview Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-1 border border-blue-200">
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Student Web Access Dispatcher</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">
            Student Access Links &amp; Portal Sharing Hub
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            The web app defaults to Admin Studio. To give students access to the digital catalog, document reader, and payment release system, generate and share direct web links below.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenGenerateModal()}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all self-start sm:self-auto"
        >
          <Share2 className="w-4 h-4 text-emerald-400" />
          <span>Open Link Creator</span>
        </button>
      </div>

      {/* Primary General Student Access Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 text-white p-6 rounded-3xl shadow-md space-y-4 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Universal Student Portal Web Link</h3>
              <p className="text-[11px] text-slate-400">Opens the complete student catalog with all published books and payment checkout.</p>
            </div>
          </div>
          <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30 font-bold self-start sm:self-auto">
            Default Student Link
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
          <input
            type="text"
            readOnly
            value={mainPortalUrl}
            className="w-full bg-transparent text-amber-300 font-mono text-xs sm:text-sm font-bold focus:outline-none select-all px-2"
          />
          <div className="flex items-center gap-2 flex-shrink-0 pt-2 sm:pt-0">
            <button
              type="button"
              onClick={handleCopyGeneral}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all w-full sm:w-auto justify-center ${
                copiedGeneral
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
              }`}
            >
              {copiedGeneral ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedGeneral ? 'Copied Link!' : 'Copy Student Link'}</span>
            </button>

            {onSwitchToUser && (
              <button
                type="button"
                onClick={onSwitchToUser}
                className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 border border-emerald-600 transition-colors"
                title="Preview Student Portal view directly in app"
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-200" />
                <span className="hidden sm:inline">Preview In-App</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                const url = getStudentPortalUrl();
                window.open(url, '_blank', 'noopener,noreferrer');
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
              title="Open standalone web portal in new browser tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Open Web Tab</span>
            </button>

            <button
              type="button"
              onClick={() => setShowQr(!showQr)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 border border-slate-700 transition-colors"
              title="Show QR Code"
            >
              <QrCode className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* QR Code expansion */}
        {showQr && (
          <div className="p-4 bg-white text-slate-900 rounded-2xl flex flex-col sm:flex-row items-center gap-4 animate-in fade-in">
            <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm flex-shrink-0">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(mainPortalUrl)}`}
                alt="Student Portal QR"
                className="w-28 h-28"
              />
            </div>
            <div className="space-y-1 text-center sm:text-left text-xs">
              <h4 className="font-bold text-slate-900">Student Mobile QR Access</h4>
              <p className="text-slate-500 text-[11px] leading-relaxed max-w-md">
                Students can scan this code with their smartphone camera to open the portal and read course books on mobile without typing the URL.
              </p>
              <div className="pt-1">
                <a
                  href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(mainPortalUrl)}`}
                  target="_blank"
                  download="academic-hub-student-portal-qr.png"
                  className="inline-flex items-center gap-1 px-3 py-1 bg-slate-900 text-white rounded-lg text-[11px] font-semibold"
                >
                  Download Print-Ready QR
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Custom Link Builder */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <span>Targeted Course &amp; Book Link Generator</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Create deep-links that auto-filter to a department or auto-open a specific book's reader or checkout for students.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedBookId('');
              setSelectedDept('ALL');
              setActionType('view');
              setRefTag('');
            }}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium"
          >
            Reset Filters
          </button>
        </div>

        {/* Builder Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Target Document */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Book / Document
            </label>
            <select
              value={selectedBookId}
              onChange={e => setSelectedBookId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 font-medium"
            >
              <option value="">All Documents (Full Catalog)</option>
              {pdfs.map(p => (
                <option key={p._id} value={p._id}>
                  {p.course}: {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Filter by Department
            </label>
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 font-medium"
            >
              <option value="ALL">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Action */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              On Student Arrival
            </label>
            <select
              value={actionType}
              onChange={e => setActionType(e.target.value as any)}
              disabled={!selectedBookId}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 font-medium disabled:opacity-50"
            >
              <option value="view">Highlight in Library</option>
              <option value="read">Auto-Launch Full Reader</option>
              <option value="buy">Auto-Open Payment Checkout</option>
            </select>
          </div>

          {/* Campaign / Class Ref */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Class / Telegram Tag (Optional)
            </label>
            <input
              type="text"
              value={refTag}
              onChange={e => setRefTag(e.target.value)}
              placeholder="e.g. Fall2026, SectionA"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono text-slate-800"
            />
          </div>

        </div>

        {/* Custom Generated Result Box */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                Custom Generated Link
              </span>
              {selectedPdf && (
                <span className="text-xs font-bold text-slate-800 truncate">
                  {selectedPdf.title}
                </span>
              )}
            </div>
            <div className="font-mono text-xs font-bold text-slate-700 truncate select-all">
              {customUrl}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={handleCopyCustom}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                copiedCustom
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {copiedCustom ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCustom ? 'Copied!' : 'Copy Custom Link'}</span>
            </button>

            <button
              type="button"
              onClick={() => window.open(customUrl, '_blank', 'noopener,noreferrer')}
              className="p-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700"
              title="Test custom link in new tab"
            >
              <ExternalLink className="w-4 h-4 text-blue-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Catalog 1-Click Document Access Links Table */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Direct Student Access Links per Book ({pdfs.length})</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Copy individual book links to share with students enrolled in specific courses.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {pdfs.map(pdf => {
            const isCopied = copiedBookId === pdf._id;
            return (
              <div
                key={pdf._id}
                className="p-4 bg-slate-50/70 hover:bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-14 rounded-lg shadow-xs overflow-hidden flex-shrink-0 bg-white">
                    <BookCover pdf={pdf} size="xs" className="w-full h-full text-[7px]" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <span className="text-[10px] font-mono font-bold text-blue-600 uppercase">
                      {pdf.course} • {pdf.department}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {pdf.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span>{pdf.isPaid ? `${pdf.currency || 'USD'} ${pdf.price}` : 'Free Access'}</span>
                      <span>•</span>
                      <span>{pdf.pageCount || 20} pgs</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopyBookLink(pdf)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                      isCopied
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-800'
                    }`}
                  >
                    {isCopied ? <Check className="w-3 h-3 stroke-[3]" /> : <Copy className="w-3 h-3" />}
                    <span>{isCopied ? 'Copied' : 'Copy Link'}</span>
                  </button>

                  <a
                    href={getStudentPortalUrl({ bookId: pdf._id })}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600"
                    title="Open student view for this book"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
