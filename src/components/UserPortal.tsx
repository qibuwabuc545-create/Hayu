import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Menu,
  X,
  Search,
  BookOpen,
  Heart,
  Download,
  Settings,
  ShieldCheck,
  Layers,
  ChevronLeft,
  ChevronRight,
  Eye,
  Clock,
  ArrowRight,
  ArrowDownToLine,
  Compass,
  Trash2,
  FileText,
  Lock,
  Unlock,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  LogIn,
  User,
  Sparkles
} from 'lucide-react';
import { PDFPost, UserNavTab, UserProfile, PaymentOrder } from '../types';
import { BookCover } from './BookCover';
import { PaymentLogo } from './PaymentLogo';

interface UserPortalProps {
  pdfs: PDFPost[];
  isLoading: boolean;
  onReadPDF: (pdf: PDFPost) => void;
  onRefresh: () => void;
  onSwitchToAdmin?: () => void;
  currentUser?: UserProfile | null;
  unlockedPdfIds?: string[];
  userOrders?: PaymentOrder[];
  onOpenAuthModal?: () => void;
  onOpenPaymentModal?: (pdf: PDFPost) => void;
}

export const UserPortal: React.FC<UserPortalProps> = ({
  pdfs,
  isLoading,
  onReadPDF,
  onRefresh,
  onSwitchToAdmin,
  currentUser = null,
  unlockedPdfIds = [],
  userOrders = [],
  onOpenAuthModal,
  onOpenPaymentModal
}) => {
  // Menu open state (controlled by the specific Menu Icon)
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  
  // Active menu item displayed on the dashboard
  const [activeNav, setActiveNav] = useState<UserNavTab | 'setting' | 'purchases'>('discover');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [readHistory, setReadHistory] = useState<{ [id: string]: string }>({});
  const [showAllModal, setShowAllModal] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'shelf' | 'grid'>('shelf');
  
  // Custom user preferences in settings
  const [settings, setSettings] = useState({
    theme: 'warm', // 'warm' | 'light' | 'dark'
    autoBookmark: true,
    fontSize: 'normal',
    showPageNumberBadge: true,
    animationsEnabled: true
  });

  const shelfScrollRef = useRef<HTMLDivElement>(null);
  const catalogScrollRef = useRef<HTMLDivElement>(null);

  // Load favorites & read history from localStorage
  useEffect(() => {
    try {
      const storedFavs = localStorage.getItem('academic_favorites');
      if (storedFavs) setFavorites(JSON.parse(storedFavs));

      const storedHistory = localStorage.getItem('academic_read_history');
      if (storedHistory) setReadHistory(JSON.parse(storedHistory));

      const storedSettings = localStorage.getItem('academic_user_settings');
      if (storedSettings) setSettings(JSON.parse(storedSettings));
    } catch (e) {
      // ignore
    }
  }, []);

  const saveSettings = (newSettings: typeof settings) => {
    setSettings(newSettings);
    localStorage.setItem('academic_user_settings', JSON.stringify(newSettings));
  };

  const toggleFavorite = (pdfId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = favorites.includes(pdfId)
      ? favorites.filter(id => id !== pdfId)
      : [...favorites, pdfId];
    setFavorites(updated);
    localStorage.setItem('academic_favorites', JSON.stringify(updated));
  };

  // Check if a document is accessible to current user
  const isAccessible = (pdf: PDFPost): boolean => {
    // If it's not a paid document, it's free for everyone
    if (!pdf.isPaid || (pdf.price === 0)) return true;
    // If it's in unlocked list
    if (unlockedPdfIds.includes(pdf._id)) return true;
    return false;
  };

  // Handle opening PDF with monetization check
  const handleOpenPdf = (pdf: PDFPost) => {
    if (!isAccessible(pdf)) {
      // Document is locked and requires payment
      if (!currentUser && onOpenAuthModal) {
        onOpenAuthModal();
        return;
      }
      if (onOpenPaymentModal) {
        onOpenPaymentModal(pdf);
      }
      return;
    }

    const updatedHistory = {
      ...readHistory,
      [pdf._id]: new Date().toISOString()
    };
    setReadHistory(updatedHistory);
    localStorage.setItem('academic_read_history', JSON.stringify(updatedHistory));

    onReadPDF(pdf);
  };

  // Handle downloading PDF with monetization check
  const handleDownloadPdf = (pdf: PDFPost, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!isAccessible(pdf)) {
      if (!currentUser && onOpenAuthModal) {
        onOpenAuthModal();
        return;
      }
      if (onOpenPaymentModal) {
        onOpenPaymentModal(pdf);
      }
      return;
    }

    // Unlocked or free -> trigger download
    const link = document.createElement('a');
    link.href = pdf.pdfUrl;
    link.download = `${pdf.title}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const scrollShelf = (direction: 'left' | 'right') => {
    if (shelfScrollRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      shelfScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // When user selects an option from the menu
  const handleSelectMenuItem = (item: UserNavTab | 'setting' | 'purchases') => {
    setActiveNav(item);
    setIsMenuOpen(false); // Menu closes and hides once selected
  };

  // Filtered books strictly preserving the sequence ordered by admin
  const orderedAndFilteredPdfs = useMemo(() => {
    return pdfs
      .filter(pdf => {
        // Nav Tab filter
        if (activeNav === 'favorite' && !favorites.includes(pdf._id)) return false;
        if (activeNav === 'library' && !readHistory[pdf._id]) return false;
        if (activeNav === 'purchases' && !unlockedPdfIds.includes(pdf._id)) return false;

        // Search term
        const term = searchTerm.toLowerCase();
        const matchSearch =
          !term ||
          pdf.title.toLowerCase().includes(term) ||
          (pdf.author && pdf.author.toLowerCase().includes(term)) ||
          pdf.course.toLowerCase().includes(term) ||
          pdf.department.toLowerCase().includes(term) ||
          (pdf.summary && pdf.summary.toLowerCase().includes(term));

        return matchSearch;
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [pdfs, activeNav, favorites, readHistory, searchTerm, unlockedPdfIds]);

  // Recently read books for Library view
  const recentlyReadPdfs = useMemo(() => {
    return pdfs.filter(p => readHistory[p._id]);
  }, [pdfs, readHistory]);

  // Favorite books for Favorite view
  const favoritePdfs = useMemo(() => {
    return pdfs.filter(p => favorites.includes(p._id));
  }, [pdfs, favorites]);

  // Unlocked books for Purchases view
  const unlockedPdfs = useMemo(() => {
    return pdfs.filter(p => unlockedPdfIds.includes(p._id));
  }, [pdfs, unlockedPdfIds]);

  return (
    <div className="w-full max-w-7xl mx-auto rounded-[32px] bg-[#FFFFFF] shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col md:flex-row min-h-[820px] select-none text-slate-800 animate-in fade-in duration-200 relative">
      
      {/* 1. SLIDE-OUT / COLLAPSIBLE MENU SIDEBAR (TRIGGERED BY SPECIFIC MENU ICON) */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-200 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Menu Container: Visible when isMenuOpen is true or as a side panel */}
      <aside className={`
        ${isMenuOpen ? 'translate-x-0 opacity-100' : '-translate-x-full md:translate-x-0 hidden md:flex md:w-64'} 
        fixed md:relative top-0 bottom-0 left-0 z-50 md:z-10
        w-72 sm:w-64 bg-[#FFFFFF] border-r border-slate-100 p-5 sm:p-6 flex flex-col justify-between flex-shrink-0 shadow-2xl md:shadow-none transition-all duration-300 ease-in-out
      `}>
        <div className="space-y-6">
          
          {/* Brand Logo Header & Close button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#173D35] text-white flex items-center justify-center font-serif font-black text-sm">
                B
              </div>
              <h1 className="font-extrabold tracking-wider text-slate-900 text-sm sm:text-base uppercase">
                The Books
              </h1>
            </div>

            {/* Mobile close button for menu */}
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 md:hidden"
              title="Close Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Menu List */}
          <div className="space-y-5">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">
                Main Menu
              </div>
              <nav className="space-y-1.5">
                
                {/* 1. Discover */}
                <button
                  id="menu-nav-discover"
                  onClick={() => handleSelectMenuItem('discover')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                    activeNav === 'discover'
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    activeNav === 'discover' ? 'bg-[#EA6759] text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <Compass className="w-4 h-4" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-bold">Discover</div>
                    <div className={`text-[10px] ${activeNav === 'discover' ? 'text-slate-300' : 'text-slate-400'}`}>
                      Recommendations &amp; Shelf
                    </div>
                  </div>
                </button>

                {/* 2. My Library */}
                <button
                  id="menu-nav-library"
                  onClick={() => handleSelectMenuItem('library')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                    activeNav === 'library'
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    activeNav === 'library' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold">My Library</span>
                      {Object.keys(readHistory).length > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                          activeNav === 'library' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {Object.keys(readHistory).length}
                        </span>
                      )}
                    </div>
                    <div className={`text-[10px] ${activeNav === 'library' ? 'text-slate-300' : 'text-slate-400'}`}>
                      Reading history &amp; saved
                    </div>
                  </div>
                </button>

                {/* 3. My Purchases & Unlocked */}
                <button
                  id="menu-nav-purchases"
                  onClick={() => handleSelectMenuItem('purchases')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                    activeNav === 'purchases'
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    activeNav === 'purchases' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold">My Purchases</span>
                      {unlockedPdfIds.length > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                          activeNav === 'purchases' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {unlockedPdfIds.length}
                        </span>
                      )}
                    </div>
                    <div className={`text-[10px] ${activeNav === 'purchases' ? 'text-slate-300' : 'text-slate-400'}`}>
                      Unlocked books &amp; orders
                    </div>
                  </div>
                </button>

                {/* 4. Download */}
                <button
                  id="menu-nav-download"
                  onClick={() => handleSelectMenuItem('download')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                    activeNav === 'download'
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    activeNav === 'download' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <Download className="w-4 h-4" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-bold">Download</div>
                    <div className={`text-[10px] ${activeNav === 'download' ? 'text-slate-300' : 'text-slate-400'}`}>
                      Offline PDFs &amp; syllabus
                    </div>
                  </div>
                </button>

                {/* 5. Favorite */}
                <button
                  id="menu-nav-favorite"
                  onClick={() => handleSelectMenuItem('favorite')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                    activeNav === 'favorite'
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    activeNav === 'favorite' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <Heart className={`w-4 h-4 ${favorites.length > 0 ? 'fill-current' : ''}`} />
                  </div>
                  <div className="text-left flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold">Favorite</span>
                      {favorites.length > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                          activeNav === 'favorite' ? 'bg-white/20 text-white' : 'bg-red-100 text-red-700'
                        }`}>
                          {favorites.length}
                        </span>
                      )}
                    </div>
                    <div className={`text-[10px] ${activeNav === 'favorite' ? 'text-slate-300' : 'text-slate-400'}`}>
                      Loved documents
                    </div>
                  </div>
                </button>

              </nav>
            </div>

            {/* SETTING & UTILITIES */}
            <div className="pt-3 border-t border-slate-100 space-y-1.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-1">
                Preferences
              </div>

              {/* Setting */}
              <button
                id="menu-nav-setting"
                onClick={() => handleSelectMenuItem('setting')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                  activeNav === 'setting'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  activeNav === 'setting' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  <Settings className="w-4 h-4" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-bold">Setting</div>
                  <div className={`text-[10px] ${activeNav === 'setting' ? 'text-slate-300' : 'text-slate-400'}`}>
                    Theme &amp; view controls
                  </div>
                </div>
              </button>

              {/* Admin Studio Quick Button */}
              {onSwitchToAdmin && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onSwitchToAdmin();
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors"
                >
                  <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="text-left flex-1">
                    <div>Admin Studio</div>
                    <div className="text-[10px] text-blue-400">Upload &amp; sequence</div>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom User Account Pill */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          {currentUser ? (
            <div
              onClick={onOpenAuthModal}
              className="flex items-center gap-3 p-2 rounded-2xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors border border-slate-200/60"
            >
              <img
                src={currentUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name)}`}
                alt=""
                className="w-9 h-9 rounded-xl object-cover border border-white shadow-xs"
              />
              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs text-slate-900 truncate">{currentUser.name}</div>
                <div className="text-[10px] text-slate-500 truncate">{currentUser.email}</div>
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="w-full py-2.5 px-3 rounded-2xl bg-[#173D35] hover:bg-[#0F2D27] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <LogIn className="w-4 h-4 text-emerald-300" />
              <span>Create / Sign In Account</span>
            </button>
          )}
        </div>
      </aside>

      {/* 2. MAIN DASHBOARD CONTENT AREA */}
      <main className="flex-1 flex flex-col bg-[#FFFFFF] min-w-0 overflow-y-auto">
        
        {/* TOP ORGANIC BEIGE BANNER */}
        <div className="bg-[#EBE5DC] rounded-bl-[48px] p-5 sm:p-8 relative overflow-hidden transition-colors">
          
          {/* Top Header Row: SPECIFIC MENU ICON + Title + User Profile */}
          <div className="flex items-center justify-between mb-5 sm:mb-6">
            
            <div className="flex items-center gap-3">
              
              {/* SPECIFIC MENU ICON (Clicking opens/provides the menu) */}
              <button
                id="btn-main-menu-trigger"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl shadow-sm border transition-all duration-200 ${
                  isMenuOpen
                    ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-slate-900/20'
                    : 'bg-white/90 hover:bg-white text-slate-800 border-black/5 hover:scale-105'
                }`}
                title={isMenuOpen ? 'Hide Menu' : 'Open Menu'}
              >
                <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${
                  isMenuOpen ? 'bg-white/20 text-white' : 'bg-[#173D35] text-white'
                }`}>
                  {isMenuOpen ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
                </div>
                <span className="font-bold text-xs">
                  {isMenuOpen ? 'Close' : 'Menu'}
                </span>
                
                {/* Active menu tag */}
                <span className="text-[10px] font-medium bg-black/5 px-2 py-0.5 rounded-full capitalize text-slate-600 hidden sm:inline">
                  {activeNav === 'purchases' ? 'My Purchases' : activeNav}
                </span>
              </button>

              {/* Title of current section */}
              <div>
                <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-sans capitalize flex items-center gap-2">
                  <span>
                    {activeNav === 'setting'
                      ? 'Settings'
                      : activeNav === 'purchases'
                      ? 'My Purchases & Orders'
                      : activeNav}
                  </span>
                  {activeNav !== 'discover' && (
                    <button
                      onClick={() => setActiveNav('discover')}
                      className="text-[11px] font-semibold bg-white/80 hover:bg-white text-slate-700 px-2.5 py-0.5 rounded-full border border-black/5 shadow-xs"
                    >
                      ← Back to Discover
                    </button>
                  )}
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  {activeNav === 'discover' && 'Curated syllabus readings arranged side by side in instructor sequence'}
                  {activeNav === 'library' && `Personal library history (${Object.keys(readHistory).length} documents read)`}
                  {activeNav === 'purchases' && `Manage your unlocked books (${unlockedPdfIds.length}) & payment verification status`}
                  {activeNav === 'download' && `Download course documents for offline study`}
                  {activeNav === 'favorite' && `Your favorite bookmarked documents (${favorites.length} saved)`}
                  {activeNav === 'setting' && 'Manage your reader layout, display mode, and themes'}
                </p>
              </div>
            </div>

            {/* Right Profile & Setting Shortcut */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Settings shortcut button */}
              <button
                onClick={() => setActiveNav('setting')}
                className={`p-2 rounded-full border border-black/5 transition-colors shadow-sm ${
                  activeNav === 'setting' ? 'bg-slate-900 text-white' : 'bg-white/80 hover:bg-white text-slate-700'
                }`}
                title="Settings"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>

              {/* User Avatar & Name */}
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-2 bg-white/80 hover:bg-white backdrop-blur-md px-2.5 sm:px-3 py-1.5 rounded-full border border-black/5 shadow-sm transition-all"
              >
                {currentUser ? (
                  <>
                    <img
                      src={currentUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name)}`}
                      alt=""
                      className="w-6 h-6 rounded-full object-cover border border-white"
                    />
                    <span className="text-xs font-semibold text-slate-800 hidden md:inline truncate max-w-[120px]">
                      {currentUser.name}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 hidden md:inline">
                      Sign In / Register
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Search Bar Capsule (Clean without category dropdown) */}
          <div className="max-w-xl bg-white rounded-full p-1.5 shadow-md border border-slate-200/80 flex items-center justify-between gap-2">
            
            {/* Search Input */}
            <div className="flex-1 flex items-center gap-2.5 pl-3 pr-2">
              <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Find the book you like (title, course, author)..."
                className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dark Forest Green Search Button */}
            <button
              onClick={() => {}}
              className="bg-[#173D35] hover:bg-[#0F2D27] text-white px-5 py-2 rounded-full text-xs font-semibold shadow-sm transition-colors flex items-center justify-center flex-shrink-0"
            >
              Search
            </button>
          </div>

          {/* SECTION: SIDE-BY-SIDE RECOMMENDATION SHELF (Visible on Discover) */}
          {activeNav === 'discover' && (
            <div className="mt-7 sm:mt-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base font-sans tracking-tight">
                    Book Recommendation
                  </h3>
                  <span className="bg-white/80 text-slate-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-black/5">
                    {orderedAndFilteredPdfs.length} documents
                  </span>
                </div>

                {/* Side-by-Side Scroll Controls and View All */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={() => scrollShelf('left')}
                    className="w-7 h-7 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-sm border border-black/5 flex items-center justify-center transition-all hover:scale-105"
                    title="Scroll books left"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => scrollShelf('right')}
                    className="w-7 h-7 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-sm border border-black/5 flex items-center justify-center transition-all hover:scale-105"
                    title="Scroll books right"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setShowAllModal(true)}
                    className="bg-white/90 hover:bg-white text-slate-700 text-xs font-semibold px-3 py-1 rounded-full border border-black/5 shadow-sm transition-all flex items-center gap-1 ml-1"
                  >
                    <span>View all</span>
                    <span className="text-slate-400">›</span>
                  </button>
                </div>
              </div>

              {/* 3D Book Cover Row arranged strictly side-by-side in admin order */}
              {isLoading ? (
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="w-40 h-60 bg-white/50 animate-pulse rounded-xl flex-shrink-0" />
                  ))}
                </div>
              ) : orderedAndFilteredPdfs.length === 0 ? (
                <div className="bg-white/80 rounded-2xl p-8 text-center text-xs text-slate-500">
                  No matching documents found. Try clearing your search filter.
                </div>
              ) : (
                <div
                  ref={shelfScrollRef}
                  className="flex gap-4 sm:gap-6 overflow-x-auto pb-5 pt-2 scrollbar-none items-start scroll-smooth"
                >
                  {orderedAndFilteredPdfs.map((pdf) => {
                    const isFav = favorites.includes(pdf._id);
                    const unlocked = isAccessible(pdf);

                    return (
                      <div
                        key={pdf._id}
                        onClick={() => handleOpenPdf(pdf)}
                        className="flex-shrink-0 cursor-pointer group flex flex-col items-center relative w-36 sm:w-44"
                      >
                        {/* Admin Sequence Order Pill */}
                        <div className="absolute -top-2 left-2 z-20 bg-slate-900/90 backdrop-blur-sm text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-full shadow-md border border-white/20">
                          #{pdf.sortOrder + 1}
                        </div>

                        {/* Price / Monetization Badge */}
                        <div className="absolute top-5 left-2 z-20">
                          {unlocked ? (
                            pdf.isPaid ? (
                              <span className="bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Unlocked
                              </span>
                            ) : (
                              <span className="bg-slate-900/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow">
                                Free
                              </span>
                            )
                          ) : (
                            <span className="bg-emerald-600 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-full shadow flex items-center gap-1 border border-white/30">
                              <Lock className="w-2.5 h-2.5" />
                              ${Number(pdf.price || 0).toFixed(2)}
                            </span>
                          )}
                        </div>

                        {/* Favorite button */}
                        <button
                          onClick={(e) => toggleFavorite(pdf._id, e)}
                          className="absolute -top-2 right-2 z-20 w-6 h-6 rounded-full bg-white/90 hover:bg-white text-slate-400 hover:text-red-500 shadow-md flex items-center justify-center transition-all"
                          title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isFav ? 'text-red-500 fill-red-500' : ''}`} />
                        </button>

                        {/* Realistic 3D Book Cover */}
                        <div className="relative">
                          <BookCover pdf={pdf} size="md" />
                          
                          {/* Hover action overlay */}
                          <div className="absolute inset-x-2 bottom-3 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-1 group-hover:translate-y-0 z-30">
                            <span className={`text-white text-[10px] font-extrabold px-3 py-1.5 rounded-xl shadow-xl flex items-center gap-1.5 backdrop-blur-sm ${
                              unlocked ? 'bg-[#173D35] border border-emerald-400/40' : 'bg-emerald-700 border border-emerald-300/40'
                            }`}>
                              {unlocked ? (
                                <>
                                  <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
                                  <span>Read Page</span>
                                </>
                              ) : (
                                <>
                                  <Lock className="w-3.5 h-3.5 text-amber-300" />
                                  <span>Unlock (${Number(pdf.price || 0).toFixed(2)})</span>
                                </>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Book Shelf Floor Reflection / Shadow */}
                        <div className="w-4/5 h-2 bg-black/15 blur-sm rounded-full mt-2 transition-all group-hover:scale-110 group-hover:bg-black/25" />

                        {/* PDF Title & Details */}
                        <div className="w-full text-center mt-2.5 px-1 space-y-1">
                          <h4 className="font-bold text-xs text-slate-900 truncate group-hover:text-[#173D35] transition-colors" title={pdf.title}>
                            {pdf.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 truncate">
                            {pdf.author || pdf.course}
                          </p>
                          
                          {/* Specific Document Action Pill */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenPdf(pdf);
                            }}
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors border shadow-2xs ${
                              unlocked
                                ? 'bg-slate-100 hover:bg-[#173D35] text-slate-700 hover:text-white border-slate-200/80'
                                : 'bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white border-emerald-200'
                            }`}
                            title={unlocked ? 'Full Open Document Page' : 'Pay to Unlock'}
                          >
                            {unlocked ? (
                              <>
                                <FileText className="w-3 h-3 text-emerald-600 group-hover:text-emerald-300" />
                                <span>Read Document</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3 text-emerald-700 group-hover:text-white" />
                                <span>Pay to Read</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* 3. DYNAMIC CONTENT DISPLAYED ACCORDING TO SELECTED MENU ITEM */}
        <div className="p-5 sm:p-8 bg-[#FFFFFF] flex-1 space-y-6">
          
          {/* ==================== A. DISCOVER VIEW ==================== */}
          {activeNav === 'discover' && (
            <>
              {/* Complete Catalog Collection */}
              <div>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm sm:text-base font-sans tracking-tight flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#173D35]" />
                      <span>All Uploaded Documents (Catalog Sequence #{pdfs.length})</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Arranged side by side according to instructor sequence
                    </p>
                  </div>

                  {/* View Toggle */}
                  <div className="flex items-center gap-2">
                    <div className="bg-slate-100 p-0.5 rounded-lg flex items-center text-xs">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                          viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        Grid View
                      </button>
                      <button
                        onClick={() => setViewMode('shelf')}
                        className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                          viewMode === 'shelf' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        Side-by-Side Shelf
                      </button>
                    </div>
                  </div>
                </div>

                {viewMode === 'shelf' ? (
                  <div
                    ref={catalogScrollRef}
                    className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 pt-1 scrollbar-none items-start"
                  >
                    {orderedAndFilteredPdfs.map((pdf) => {
                      const unlocked = isAccessible(pdf);
                      return (
                        <div
                          key={pdf._id}
                          onClick={() => handleOpenPdf(pdf)}
                          className="flex-shrink-0 w-36 sm:w-40 bg-[#FAFAFA] hover:bg-[#F3F1EC] p-3 rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-all cursor-pointer flex flex-col items-center text-center group shadow-sm hover:shadow-md relative"
                        >
                          <div className="w-full flex items-center justify-between text-[9px] font-mono text-slate-500 mb-2">
                            <span className="bg-slate-900 text-white px-1.5 py-0.5 rounded font-bold">
                              #{pdf.sortOrder + 1}
                            </span>
                            {unlocked ? (
                              pdf.isPaid ? (
                                <span className="text-emerald-700 font-bold text-[9px]">Unlocked</span>
                              ) : (
                                <span className="text-slate-500">Free</span>
                              )
                            ) : (
                              <span className="text-emerald-700 font-bold font-mono text-[9px]">
                                ${Number(pdf.price || 0).toFixed(2)}
                              </span>
                            )}
                          </div>

                          <BookCover pdf={pdf} size="sm" />

                          <div className="mt-2.5 w-full flex flex-col items-center">
                            <h5 className="font-bold text-xs text-slate-900 truncate w-full group-hover:text-[#173D35] transition-colors" title={pdf.title}>
                              {pdf.title}
                            </h5>
                            <p className="text-[10px] text-slate-500 truncate mt-0.5 w-full">
                              {pdf.author || 'Academic Faculty'}
                            </p>
                            <div className="mt-1.5 flex items-center justify-center">
                              <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full transition-all shadow-2xs ${
                                unlocked
                                  ? 'bg-[#173D35]/10 text-[#173D35] group-hover:bg-[#173D35] group-hover:text-white'
                                  : 'bg-emerald-100 text-emerald-800 group-hover:bg-emerald-600 group-hover:text-white'
                              }`}>
                                {unlocked ? (
                                  <>
                                    <BookOpen className="w-2.5 h-2.5" />
                                    <span>Read Page</span>
                                  </>
                                ) : (
                                  <>
                                    <Lock className="w-2.5 h-2.5" />
                                    <span>Unlock Book</span>
                                  </>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {orderedAndFilteredPdfs.map((pdf) => {
                      const unlocked = isAccessible(pdf);
                      return (
                        <div
                          key={pdf._id}
                          onClick={() => handleOpenPdf(pdf)}
                          className="bg-[#FAFAFA] hover:bg-[#F3F1EC] p-3 rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-all cursor-pointer flex flex-col items-center text-center group shadow-sm hover:shadow-md"
                        >
                          <div className="w-full flex items-center justify-between text-[9px] font-mono text-slate-500 mb-2">
                            <span className="bg-slate-900 text-white px-1.5 py-0.5 rounded font-bold">
                              #{pdf.sortOrder + 1}
                            </span>
                            {unlocked ? (
                              pdf.isPaid ? (
                                <span className="text-emerald-700 font-bold text-[9px]">Unlocked</span>
                              ) : (
                                <span className="text-slate-500">Free</span>
                              )
                            ) : (
                              <span className="text-emerald-700 font-bold font-mono text-[9px]">
                                ${Number(pdf.price || 0).toFixed(2)}
                              </span>
                            )}
                          </div>

                          <BookCover pdf={pdf} size="sm" />

                          <div className="mt-2.5 w-full flex flex-col items-center">
                            <h5 className="font-bold text-xs text-slate-900 truncate w-full group-hover:text-[#173D35] transition-colors" title={pdf.title}>
                              {pdf.title}
                            </h5>
                            <p className="text-[10px] text-slate-500 truncate mt-0.5 w-full">
                              {pdf.author || 'Academic Faculty'}
                            </p>
                            <div className="mt-1.5 flex items-center justify-center">
                              <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full transition-all shadow-2xs ${
                                unlocked
                                  ? 'bg-[#173D35]/10 text-[#173D35] group-hover:bg-[#173D35] group-hover:text-white'
                                  : 'bg-emerald-100 text-emerald-800 group-hover:bg-emerald-600 group-hover:text-white'
                              }`}>
                                {unlocked ? (
                                  <>
                                    <BookOpen className="w-2.5 h-2.5" />
                                    <span>Read Page</span>
                                  </>
                                ) : (
                                  <>
                                    <Lock className="w-2.5 h-2.5" />
                                    <span>Unlock Book</span>
                                  </>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ==================== B. MY PURCHASES VIEW ==================== */}
          {activeNav === 'purchases' && (
            <div className="space-y-8">
              {/* Unlocked Books */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <span>My Unlocked Books ({unlockedPdfs.length})</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Premium documents unlocked for your account with full reading &amp; download access
                    </p>
                  </div>
                </div>

                {unlockedPdfs.length === 0 ? (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-10 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm">No Unlocked Books Yet</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      When you purchase a book and the admin verifies your payment, it will immediately appear here.
                    </p>
                    <button
                      onClick={() => handleSelectMenuItem('discover')}
                      className="bg-[#173D35] text-white text-xs font-semibold px-4 py-2 rounded-xl"
                    >
                      Browse Discover Catalog
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {unlockedPdfs.map(pdf => (
                      <div
                        key={pdf._id}
                        className="p-4 rounded-2xl bg-[#FAFAFA] hover:bg-[#F4F1EC] border border-emerald-200/80 flex items-center gap-4 transition-all shadow-sm"
                      >
                        <BookCover pdf={pdf} size="sm" className="scale-90 flex-shrink-0" />
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                              {pdf.course}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Unlocked
                            </span>
                          </div>
                          <h4 className="font-bold text-xs text-slate-900 truncate" title={pdf.title}>
                            {pdf.title}
                          </h4>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => handleOpenPdf(pdf)}
                              className="px-3 py-1.5 rounded-lg bg-[#173D35] hover:bg-[#0F2D27] text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                            >
                              <BookOpen className="w-3 h-3 text-emerald-300" />
                              <span>Read</span>
                            </button>
                            <button
                              onClick={(e) => handleDownloadPdf(pdf, e)}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                              title="Download PDF"
                            >
                              <Download className="w-3 h-3" />
                              <span>PDF</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment Orders Status Log */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span>My Payment Orders &amp; Release Status</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Track the admin verification progress for your submitted payment proofs
                  </p>
                </div>

                {userOrders.length === 0 ? (
                  <div className="bg-slate-50 rounded-2xl p-6 text-center text-xs text-slate-500 border border-slate-200/60">
                    No submitted payment orders yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userOrders.map(order => (
                      <div
                        key={order._id}
                        className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-4 flex-wrap"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-slate-900">
                              Order #{order._id.slice(-6).toUpperCase()}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="font-mono text-xs font-bold text-emerald-700">
                              ${Number(order.amount).toFixed(2)} {order.currency}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-xs text-slate-500">
                              {order.paymentMethod}
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-slate-800 truncate">
                            {order.pdfTitle}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            Ref: {order.proofTransactionId} • {new Date(order.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        <div>
                          {order.status === 'released' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Released &amp; Unlocked</span>
                            </span>
                          )}
                          {order.status === 'pending' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                              <span>Pending Admin Review</span>
                            </span>
                          )}
                          {order.status === 'rejected' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                              <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                              <span>Payment Rejected</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== C. MY LIBRARY VIEW ==================== */}
          {activeNav === 'library' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-emerald-600" />
                    <span>My Reading Library &amp; History</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Your reading journey, bookmarks, and recently opened syllabus materials
                  </p>
                </div>

                {recentlyReadPdfs.length > 0 && (
                  <button
                    onClick={() => {
                      localStorage.removeItem('academic_read_history');
                      setReadHistory({});
                    }}
                    className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear History</span>
                  </button>
                )}
              </div>

              {recentlyReadPdfs.length === 0 ? (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">No Books in Library Yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    When you open and read documents from Discover, they will automatically be recorded here for instant access.
                  </p>
                  <button
                    onClick={() => handleSelectMenuItem('discover')}
                    className="bg-[#173D35] text-white text-xs font-semibold px-4 py-2 rounded-xl"
                  >
                    Browse Discover Shelf
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentlyReadPdfs.map((pdf) => {
                    const unlocked = isAccessible(pdf);
                    return (
                      <div
                        key={pdf._id}
                        onClick={() => handleOpenPdf(pdf)}
                        className="p-4 rounded-2xl bg-[#FAFAFA] hover:bg-[#F4F1EC] border border-slate-200/80 flex items-center gap-4 cursor-pointer group transition-all shadow-sm hover:shadow-md"
                      >
                        <BookCover pdf={pdf} size="sm" className="scale-90 flex-shrink-0" />
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                              {pdf.course}
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Recently Read
                            </span>
                          </div>
                          <h4 className="font-bold text-xs text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                            {pdf.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 truncate">
                            {pdf.author || 'Academic Faculty'}
                          </p>
                          <div className="pt-2">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                              <span>Resume Reading</span>
                              <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ==================== D. DOWNLOAD VIEW ==================== */}
          {activeNav === 'download' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Download className="w-5 h-5 text-amber-500" />
                    <span>Download Materials &amp; Offline Access</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Save lecture slides, syllabus readings, and research papers for offline viewing
                  </p>
                </div>
              </div>

              {/* Download Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {orderedAndFilteredPdfs.map((pdf) => {
                  const unlocked = isAccessible(pdf);
                  return (
                    <div
                      key={pdf._id}
                      className="p-4 rounded-2xl bg-[#FAFAFA] border border-slate-200/80 flex items-center justify-between gap-4 hover:border-slate-300 transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <BookCover pdf={pdf} size="sm" className="scale-75 -my-2 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[9px] bg-slate-900 text-white px-1.5 py-0.5 rounded font-bold">
                              {pdf.course}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {pdf.fileSize || '2.4 MB'} PDF
                            </span>
                            {unlocked ? (
                              pdf.isPaid ? (
                                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                                  Unlocked
                                </span>
                              ) : null
                            ) : (
                              <span className="text-[9px] font-bold font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                                ${Number(pdf.price || 0).toFixed(2)}
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-xs text-slate-900 truncate mt-1" title={pdf.title}>
                            {pdf.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 truncate">
                            {pdf.author || 'Academic Faculty'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleOpenPdf(pdf)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                          title="Read online"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDownloadPdf(pdf, e)}
                          className={`px-3.5 py-2 rounded-xl text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors ${
                            unlocked
                              ? 'bg-amber-500 hover:bg-amber-600'
                              : 'bg-emerald-600 hover:bg-emerald-700'
                          }`}
                        >
                          {unlocked ? (
                            <>
                              <ArrowDownToLine className="w-3.5 h-3.5" />
                              <span>Download</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              <span>Unlock (${Number(pdf.price || 0).toFixed(2)})</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================== E. FAVORITE VIEW ==================== */}
          {activeNav === 'favorite' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                    <span>My Favorite Books ({favorites.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Your starred and bookmarked academic readings
                  </p>
                </div>
              </div>

              {favoritePdfs.length === 0 ? (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-500 flex items-center justify-center mx-auto">
                    <Heart className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">No Favorites Yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Click the heart icon on any book cover in the Discover shelf to save it to your personal favorites.
                  </p>
                  <button
                    onClick={() => handleSelectMenuItem('discover')}
                    className="bg-[#173D35] text-white text-xs font-semibold px-4 py-2 rounded-xl"
                  >
                    Browse Discover Shelf
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {favoritePdfs.map((pdf) => {
                    const unlocked = isAccessible(pdf);
                    return (
                      <div
                        key={pdf._id}
                        onClick={() => handleOpenPdf(pdf)}
                        className="p-4 rounded-2xl bg-[#FAFAFA] hover:bg-[#F4F1EC] border border-slate-200/80 flex items-center gap-4 cursor-pointer group transition-all shadow-sm hover:shadow-md"
                      >
                        <BookCover pdf={pdf} size="sm" className="scale-90 flex-shrink-0" />
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[9px] bg-slate-900 text-white px-1.5 py-0.5 rounded font-bold">
                              {pdf.course}
                            </span>
                            <button
                              onClick={(e) => toggleFavorite(pdf._id, e)}
                              className="text-red-500 hover:text-slate-400 p-1"
                              title="Remove favorite"
                            >
                              <Heart className="w-3.5 h-3.5 fill-current" />
                            </button>
                          </div>
                          <h4 className="font-bold text-xs text-slate-900 truncate group-hover:text-red-600 transition-colors">
                            {pdf.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 truncate">
                            {pdf.author || 'Academic Faculty'}
                          </p>
                          <div className="pt-2">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 px-2 py-1 rounded-lg">
                              <span>{unlocked ? 'Open Document' : `Unlock ($${Number(pdf.price || 0).toFixed(2)})`}</span>
                              <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ==================== F. SETTING VIEW ==================== */}
          {activeNav === 'setting' && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-indigo-600" />
                  <span>Reader Preferences &amp; View Settings</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Customize the look, reading layout, and theme for the in-app document viewer
                </p>
              </div>

              <div className="bg-[#FAFAFA] rounded-3xl p-6 border border-slate-200/80 space-y-5">
                {/* Theme selection */}
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                    Reading Canvas Atmosphere
                  </label>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    {[
                      { id: 'warm', label: 'Warm Parchment', color: 'bg-[#F9F6F0] border border-[#EBE5DC]' },
                      { id: 'light', label: 'Studio White', color: 'bg-white border border-slate-200' },
                      { id: 'dark', label: 'Night Dark', color: 'bg-slate-900 text-white' }
                    ].map(t => (
                      <button
                        key={t.id}
                        onClick={() => saveSettings({ ...settings, theme: t.id })}
                        className={`py-2.5 px-3 rounded-xl text-center font-semibold transition-all flex items-center justify-center gap-2 border ${
                          settings.theme === t.id
                            ? 'border-[#173D35] ring-2 ring-[#173D35]/20 bg-white font-bold text-slate-900'
                            : 'border-slate-200 bg-white/60 text-slate-600'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full ${t.color}`} />
                        <span>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-2.5">
                  <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 cursor-pointer">
                    <div>
                      <span className="font-bold text-slate-800 block">Show Sort Sequence Badge</span>
                      <span className="text-[11px] text-slate-500">Display #1, #2 instructor order tag on covers</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.showPageNumberBadge}
                      onChange={e => saveSettings({ ...settings, showPageNumberBadge: e.target.checked })}
                      className="w-4 h-4 rounded text-[#173D35] focus:ring-[#173D35] cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 cursor-pointer">
                    <div>
                      <span className="font-bold text-slate-800 block">Auto-Save Reading History</span>
                      <span className="text-[11px] text-slate-500">Track opened PDFs in My Library automatically</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.autoBookmark}
                      onChange={e => saveSettings({ ...settings, autoBookmark: e.target.checked })}
                      className="w-4 h-4 rounded text-[#173D35] focus:ring-[#173D35] cursor-pointer"
                    />
                  </label>
                </div>

                {/* Done button */}
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => handleSelectMenuItem('discover')}
                    className="bg-[#173D35] hover:bg-[#0F2D27] text-white px-6 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-colors"
                  >
                    Save &amp; Return to Discover
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

      </main>

      {/* VIEW ALL FULLSCREEN MODAL */}
      {showAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-5xl w-full p-6 space-y-4 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Complete Course Document Catalog
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  All {pdfs.length} documents arranged side by side in the exact order set by the admin.
                </p>
              </div>
              <button
                onClick={() => setShowAllModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 py-2">
              {orderedAndFilteredPdfs.map(pdf => {
                const unlocked = isAccessible(pdf);
                return (
                  <div
                    key={pdf._id}
                    onClick={() => {
                      setShowAllModal(false);
                      handleOpenPdf(pdf);
                    }}
                    className="p-3.5 rounded-2xl bg-[#FAFAFA] hover:bg-[#F4F1EC] border border-slate-200 flex flex-col items-center text-center cursor-pointer group transition-all shadow-sm hover:shadow-md relative"
                  >
                    <div className="relative mb-2">
                      <span className="absolute -top-1 -left-1 bg-slate-900 text-white text-[9px] font-mono font-bold px-1.5 py-0.2 rounded shadow">
                        #{pdf.sortOrder + 1}
                      </span>
                      <BookCover pdf={pdf} size="sm" />
                    </div>
                    <div className="font-bold text-xs text-slate-900 mt-1 line-clamp-2 group-hover:text-emerald-700" title={pdf.title}>
                      {pdf.title}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {pdf.author || pdf.course}
                    </div>
                    <div className="mt-1">
                      {unlocked ? (
                        <span className="text-[9px] font-bold text-emerald-700">Unlocked</span>
                      ) : (
                        <span className="text-[9px] font-bold font-mono text-emerald-700">
                          ${Number(pdf.price || 0).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
