import React from 'react';
import { BookOpen, ShieldCheck, User, BarChart3, Plus, RefreshCw, Layers, LogIn, Sparkles } from 'lucide-react';
import { UserRole, UserProfile } from '../types';

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
  onOpenAuthModal
}) => {
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
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-mono">
                  Gated Catalog &amp; Pay
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Academic reading portal, instant full-page reader &amp; payment release system
              </p>
            </div>
          </div>

          {/* Center Stats */}
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

          {/* Right Role Toggle & Account Actions */}
          <div className="flex items-center gap-2.5">
            
            {/* Student Auth Button */}
            {onOpenAuthModal && (
              <button
                id="btn-nav-auth"
                onClick={onOpenAuthModal}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 transition-all"
              >
                {currentUser ? (
                  <>
                    <img
                      src={currentUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name)}`}
                      alt=""
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    <span className="hidden sm:inline truncate max-w-[100px]">{currentUser.name}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </>
                ) : (
                  <>
                    <LogIn className="w-3.5 h-3.5 text-blue-600" />
                    <span>Sign In (Gmail)</span>
                  </>
                )}
              </button>
            )}

            {/* Reset sample seed button */}
            <button
              id="btn-reset-seed"
              onClick={onResetSeed}
              disabled={isResetting}
              title="Reset to initial sample course data"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span className="hidden lg:inline">Reset Data</span>
            </button>

            {/* Admin Add Document button */}
            {currentRole === 'admin' && (
              <button
                id="btn-nav-add-doc"
                onClick={onOpenAddModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#173D35] hover:bg-[#0F2D27] text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>New Book</span>
              </button>
            )}

            {/* Role Switcher Pill */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                id="btn-role-user"
                onClick={() => onRoleChange('user')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentRole === 'user'
                    ? 'bg-white text-emerald-800 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Student View</span>
              </button>
              <button
                id="btn-role-admin"
                onClick={() => onRoleChange('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentRole === 'admin'
                    ? 'bg-slate-900 text-white shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin Studio</span>
              </button>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};

