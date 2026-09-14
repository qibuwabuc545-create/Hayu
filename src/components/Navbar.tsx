import React, { useState } from 'react';
import {
  BookOpen,
  ShieldCheck,
  BarChart3,
  Plus,
  RefreshCw,
  LogIn,
  Link as LinkIcon,
  ExternalLink,
  Copy,
  Check,
  Share2
} from 'lucide-react';
import { UserRole, UserProfile } from '../types';
import { getStudentPortalUrl } from './StudentLinkGeneratorModal';

interface NavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  totalPdfs: number;
  totalViews: number;
  onOpenAddModal: () => void;
  onResetSeed: () => void;
  isResetting: boolean;
  currentUser?: UserProfile | null;
  onOpenAuthModal?: () => void;
  onOpenShareModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  totalPdfs,
  totalViews,
  onOpenAddModal,
  onResetSeed,
  isResetting,
  currentUser,
  onOpenAuthModal,
  onOpenShareModal
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const studentPortalUrl = typeof window !== 'undefined' ? getStudentPortalUrl() : '';

  const handleCopyStudentLink = () => {
    navigator.clipboard.writeText(studentPortalUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#173D35] to-[#0F2D27] flex items-center justify-center text-white shadow-sm">
              <BookOpen className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-lg">
                  The Books Hub
                </span>
                {currentRole === 'admin' ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-900 text-amber-300 border border-slate-800 font-mono">
                    Admin Studio
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-mono">
                    User Web Portal
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                {currentRole === 'admin'
                  ? 'Academic Curriculum Administration, Monetization & Web Portal Link Generator'
                  : 'Public Academic Library, Syllabus Reader & Instant Document Checkout'}
              </p>
            </div>
          </div>

          {/* Center Stats (Admin only) */}
          {currentRole === 'admin' && (
            <div className="hidden md:flex items-center gap-6 text-xs text-slate-600 border-x border-slate-200 px-6">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-semibold text-slate-800">{totalPdfs}</span>
                <span className="text-slate-500">Documents</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
                <span className="font-semibold text-slate-800">{totalViews}</span>
                <span className="text-slate-500">Tracked Views</span>
              </div>
            </div>
          )}

          {/* Right Header Actions */}
          <div className="flex items-center gap-2.5">
            
            {currentRole === 'admin' ? (
              <>
                {/* User Web Portal Link & Preview Control Pill */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => onRoleChange('user')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#173D35] hover:bg-[#0F2D27] text-white shadow-2xs transition-all"
                    title="Switch to User Web Portal view"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
                    <span>User Portal</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyStudentLink}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ml-1 ${
                      copiedLink
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200/80 shadow-2xs'
                    }`}
                    title="Copy public web link to access the User Web Portal"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5 text-emerald-600" />}
                    <span className="hidden sm:inline">{copiedLink ? 'Copied!' : 'Copy Portal Link'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const url = getStudentPortalUrl();
                      window.open(url, '_blank', 'noopener,noreferrer');
                    }}
                    className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg transition-colors ml-0.5"
                    title="Open User Web Portal in New Tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>

                  {onOpenShareModal && (
                    <button
                      type="button"
                      onClick={onOpenShareModal}
                      className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-white rounded-lg transition-colors"
                      title="Generate custom web portal links & QR codes"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Admin Add Document button */}
                <button
                  id="btn-nav-add-doc"
                  onClick={onOpenAddModal}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#173D35] hover:bg-[#0F2D27] text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Book</span>
                </button>

                {/* Reset sample seed button */}
                <button
                  id="btn-reset-seed"
                  onClick={onResetSeed}
                  disabled={isResetting}
                  title="Reset to initial sample course data"
                  className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                  <span>Reset</span>
                </button>
              </>
            ) : (
              <>
                {/* Quick Share Link in User Portal */}
                {onOpenShareModal && (
                  <button
                    type="button"
                    onClick={onOpenShareModal}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
                    title="Share this web portal link"
                  >
                    <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Share Portal</span>
                  </button>
                )}
              </>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};

