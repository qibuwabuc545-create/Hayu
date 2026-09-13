import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Search,
  BookOpen,
  Bookmark,
  FileText,
  Layers,
  Moon,
  Sun,
  Printer,
  Sparkles,
  Edit3,
  Trash2,
  GraduationCap,
  Building,
  Calendar,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Sliders,
  ArrowUp,
  ArrowDown,
  Columns,
  Square
} from 'lucide-react';
import { PDFPost } from '../types';

// Configure PDF.js worker
try {
  const version = pdfjsLib.version || '4.10.38';
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
} catch (e) {
  console.warn('PDF.js worker initialization notice:', e);
}

interface PDFViewerModalProps {
  pdf: PDFPost | null;
  onClose: () => void;
  onTrackedView?: (pdfId: string) => void;
}

type ReaderTheme = 'light' | 'sepia' | 'dark';
type ViewMode = 'continuous' | 'single' | 'native';
type SidebarTab = 'thumbnails' | 'search' | 'notes' | 'info';

interface StudyNote {
  id: string;
  page: number;
  text: string;
  createdAt: string;
}

export const PDFViewerModal: React.FC<PDFViewerModalProps> = ({
  pdf,
  onClose,
}) => {
  // PDF Document state
  const [pdfDoc, setPdfDoc] = useState<any | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageInput, setPageInput] = useState<string>('1');
  const [zoom, setZoom] = useState<number>(115); // Default comfortable reading zoom
  const [rotation, setRotation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reader View Configurations (Default to continuous vertical scroll for seamless reading)
  const [theme, setTheme] = useState<ReaderTheme>('light');
  const [viewMode, setViewMode] = useState<ViewMode>('continuous');
  const [fitWidth, setFitWidth] = useState<boolean>(true);
  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTab>('thumbnails');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false); // Starts closed for full reading immersion
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Search & Notes
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<{ page: number; snippet: string }[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [newNoteText, setNewNoteText] = useState<string>('');
  const [thumbnails, setThumbnails] = useState<{ [page: number]: string }>({});

  // Canvas Refs & Scroll tracking
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<any>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const continuousContainerRef = useRef<HTMLDivElement | null>(null);
  const modalContainerRef = useRef<HTMLDivElement | null>(null);

  // Load study notes from localStorage for this document
  useEffect(() => {
    if (pdf) {
      try {
        const stored = localStorage.getItem(`academic_notes_${pdf._id}`);
        if (stored) {
          setNotes(JSON.parse(stored));
        } else {
          setNotes([
            {
              id: 'note-1',
              page: 1,
              text: `Key notes for ${pdf.course}: ${pdf.title}`,
              createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        }
      } catch (e) {
        // ignore
      }
    }
  }, [pdf]);

  const saveNotes = (updated: StudyNote[]) => {
    setNotes(updated);
    if (pdf) {
      localStorage.setItem(`academic_notes_${pdf._id}`, JSON.stringify(updated));
    }
  };

  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    const newNote: StudyNote = {
      id: Date.now().toString(),
      page: currentPage,
      text: newNoteText.trim(),
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    saveNotes([...notes, newNote]);
    setNewNoteText('');
  };

  const handleDeleteNote = (noteId: string) => {
    saveNotes(notes.filter(n => n.id !== noteId));
  };

  // Resolve source URL (using backend proxy for external remote URLs to prevent CORS blockages)
  const getResolvedPdfUrl = useCallback((rawUrl: string) => {
    if (!rawUrl) return '';
    if (rawUrl.startsWith('data:') || rawUrl.startsWith('blob:') || rawUrl.startsWith('/')) {
      return rawUrl;
    }
    return `/api/proxy-pdf?url=${encodeURIComponent(rawUrl)}`;
  }, []);

  // Load PDF Document
  const loadDocument = useCallback(async () => {
    if (!pdf) return;
    setIsLoading(true);
    setErrorMsg(null);
    setPdfDoc(null);
    setCurrentPage(1);
    setPageInput('1');
    setThumbnails({});

    try {
      const sourceUrl = getResolvedPdfUrl(pdf.pdfUrl);
      const loadingTask = pdfjsLib.getDocument({
        url: sourceUrl,
        cMapUrl: 'https://unpkg.com/pdfjs-dist@4.10.38/cmaps/',
        cMapPacked: true,
      });

      const doc = await loadingTask.promise;
      setPdfDoc(doc);
      setNumPages(doc.numPages);
      setIsLoading(false);
    } catch (err: any) {
      console.warn('PDF.js proxy load notice, attempting direct fallback:', err);
      try {
        const directTask = pdfjsLib.getDocument(pdf.pdfUrl);
        const doc = await directTask.promise;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setIsLoading(false);
      } catch (directErr: any) {
        console.warn('PDF.js fallback error, enabling in-app native embedded reader:', directErr);
        setViewMode('native');
        setIsLoading(false);
      }
    }
  }, [pdf, getResolvedPdfUrl]);

  useEffect(() => {
    if (pdf) {
      loadDocument();
    }
  }, [pdf, loadDocument]);

  // Render Continuous Scroll Pages (Fit & Full Width to Read)
  useEffect(() => {
    if (!pdfDoc || viewMode !== 'continuous' || !continuousContainerRef.current) return;

    let isMounted = true;
    const container = continuousContainerRef.current;
    container.innerHTML = '';

    const renderAllPages = async () => {
      // Calculate target container width for perfect fit-to-width reading
      const containerWidth = scrollContainerRef.current?.clientWidth || window.innerWidth;
      const targetWidth = Math.min(containerWidth - 48, fitWidth ? 980 : 800) * (zoom / 100);
      const pixelRatio = window.devicePixelRatio || 2;

      for (let i = 1; i <= pdfDoc.numPages; i++) {
        if (!isMounted) break;
        try {
          const page = await pdfDoc.getPage(i);
          const unscaledViewport = page.getViewport({ scale: 1.0, rotation });
          
          // Compute scale to fit full reading width
          const scale = (targetWidth / unscaledViewport.width);
          const viewport = page.getViewport({ scale, rotation });

          const pageWrapper = document.createElement('div');
          pageWrapper.className = 'mb-8 flex flex-col items-center relative w-full transition-all';
          pageWrapper.id = `pdf-page-cont-${i}`;
          pageWrapper.setAttribute('data-page-number', i.toString());

          // Top Page Badge
          const pageLabel = document.createElement('div');
          pageLabel.className = 'flex items-center gap-2 mb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase select-none';
          pageLabel.innerHTML = `<span>Page ${i}</span> <span class="text-slate-600">•</span> <span>${pdfDoc.numPages} Pages Total</span>`;
          pageWrapper.appendChild(pageLabel);

          // Page Canvas with 2x High-DPI backing for razor-sharp text
          const canvas = document.createElement('canvas');
          canvas.className = 'rounded-xl shadow-2xl border border-slate-300/60 bg-white max-w-full block';
          canvas.width = viewport.width * pixelRatio;
          canvas.height = viewport.height * pixelRatio;
          canvas.style.width = `${viewport.width}px`;
          canvas.style.height = `${viewport.height}px`;

          const context = canvas.getContext('2d');
          if (context) {
            context.scale(pixelRatio, pixelRatio);
          }

          pageWrapper.appendChild(canvas);
          container.appendChild(pageWrapper);

          if (context) {
            await page.render({ canvasContext: context, viewport }).promise;
          }
        } catch (e) {
          console.error(`Error rendering continuous page ${i}:`, e);
        }
      }
    };

    renderAllPages();

    return () => {
      isMounted = false;
    };
  }, [pdfDoc, viewMode, zoom, rotation, fitWidth]);

  // Render Single Page Canvas
  const renderSinglePage = useCallback(async (pageNum: number) => {
    if (!pdfDoc || viewMode !== 'single' || !canvasRef.current) return;

    try {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      const page = await pdfDoc.getPage(pageNum);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext('2d');
      if (!context) return;

      const containerWidth = scrollContainerRef.current?.clientWidth || window.innerWidth;
      const targetWidth = Math.min(containerWidth - 64, fitWidth ? 980 : 800) * (zoom / 100);
      const unscaledViewport = page.getViewport({ scale: 1.0, rotation });
      const scale = (targetWidth / unscaledViewport.width);
      const viewport = page.getViewport({ scale, rotation });

      const pixelRatio = window.devicePixelRatio || 2;
      canvas.width = viewport.width * pixelRatio;
      canvas.height = viewport.height * pixelRatio;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      context.scale(pixelRatio, pixelRatio);

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      const task = page.render(renderContext);
      renderTaskRef.current = task;
      await task.promise;
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error('Error rendering single page:', err);
      }
    }
  }, [pdfDoc, zoom, rotation, viewMode, fitWidth]);

  useEffect(() => {
    if (pdfDoc && viewMode === 'single') {
      renderSinglePage(currentPage);
    }
  }, [pdfDoc, currentPage, zoom, rotation, viewMode, renderSinglePage, fitWidth]);

  // Scroll listener to update active page number indicator in real time
  const handleScroll = () => {
    if (viewMode !== 'continuous' || !scrollContainerRef.current || !pdfDoc) return;
    const container = scrollContainerRef.current;
    const pages = container.querySelectorAll('[data-page-number]');
    
    let activePage = 1;
    for (let i = 0; i < pages.length; i++) {
      const el = pages[i] as HTMLElement;
      const rect = el.getBoundingClientRect();
      if (rect.top <= 200 && rect.bottom >= 150) {
        activePage = parseInt(el.getAttribute('data-page-number') || '1', 10);
        break;
      }
    }

    if (activePage !== currentPage) {
      setCurrentPage(activePage);
      setPageInput(activePage.toString());
    }
  };

  // Generate page thumbnails for fast navigation
  const generateThumbnails = useCallback(async () => {
    if (!pdfDoc) return;
    const thumbs: { [page: number]: string } = {};
    const maxThumbs = Math.min(pdfDoc.numPages, 18);

    for (let i = 1; i <= maxThumbs; i++) {
      try {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 0.28 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport }).promise;
          thumbs[i] = canvas.toDataURL('image/jpeg', 0.65);
        }
      } catch (e) {
        // ignore
      }
    }
    setThumbnails(prev => ({ ...prev, ...thumbs }));
  }, [pdfDoc]);

  useEffect(() => {
    if (pdfDoc && isSidebarOpen && activeSidebarTab === 'thumbnails') {
      generateThumbnails();
    }
  }, [pdfDoc, isSidebarOpen, activeSidebarTab, generateThumbnails]);

  // In-document Text Search
  const handleSearch = async () => {
    if (!pdfDoc || !searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);

    const q = searchQuery.toLowerCase();
    const matches: { page: number; snippet: string }[] = [];

    for (let i = 1; i <= pdfDoc.numPages; i++) {
      try {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const fullText = textContent.items.map((item: any) => item.str).join(' ');
        const index = fullText.toLowerCase().indexOf(q);

        if (index !== -1) {
          const start = Math.max(0, index - 40);
          const end = Math.min(fullText.length, index + 80);
          const snippet = (start > 0 ? '...' : '') + fullText.substring(start, end) + (end < fullText.length ? '...' : '');
          matches.push({ page: i, snippet });
        }
      } catch (e) {
        // ignore
      }
    }

    setSearchResults(matches);
    setIsSearching(false);
  };

  // Jump to specific page
  const goToPage = (num: number) => {
    const valid = Math.max(1, Math.min(numPages || 1, num));
    setCurrentPage(valid);
    setPageInput(valid.toString());

    if (viewMode === 'continuous') {
      const el = document.getElementById(`pdf-page-cont-${valid}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const parsed = parseInt(pageInput, 10);
      if (!isNaN(parsed)) {
        goToPage(parsed);
      }
    }
  };

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!pdf) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        goToPage(currentPage + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        goToPage(currentPage - 1);
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setZoom(z => Math.min(220, z + 15));
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        setZoom(z => Math.max(60, z - 15));
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pdf, currentPage, numPages, onClose]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!modalContainerRef.current) return;
    if (!isFullscreen) {
      if (modalContainerRef.current.requestFullscreen) {
        modalContainerRef.current.requestFullscreen().catch(() => {});
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  const handleDownload = () => {
    if (!pdf) return;
    const link = document.createElement('a');
    link.href = pdf.pdfUrl;
    link.download = `${pdf.course}_${pdf.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!pdf) return null;

  // Reader Themes
  const getThemeClass = () => {
    switch (theme) {
      case 'sepia':
        return 'bg-[#F5EEDB] text-[#423321]';
      case 'dark':
        return 'bg-[#0B1120] text-slate-100';
      default:
        return 'bg-[#EEF2F6] text-slate-800';
    }
  };

  const getCanvasFilter = () => {
    switch (theme) {
      case 'sepia':
        return 'sepia(0.35) brightness(0.96) contrast(1.04)';
      case 'dark':
        return 'invert(0.90) hue-rotate(180deg) contrast(1.1) brightness(0.92)';
      default:
        return 'none';
    }
  };

  const resolvedUrl = getResolvedPdfUrl(pdf.pdfUrl);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white select-none animate-in fade-in duration-200">
      
      {/* FULL-OPEN IMMERSION CONTAINER */}
      <div
        ref={modalContainerRef}
        id="pdf-full-reader-page"
        className="w-full h-full flex flex-col overflow-hidden bg-slate-900"
      >
        
        {/* 1. TOP DEDICATED DOCUMENT HEADER TOOLBAR */}
        <header className="flex items-center justify-between px-3 sm:px-6 py-2.5 bg-[#0F172A] text-white border-b border-slate-800 flex-shrink-0 z-30 shadow-md">
          
          {/* Left: Specific Document Page Icons & Back to Library */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 mr-2">
            
            {/* Specific Back / Exit Button */}
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-extrabold border border-slate-700 transition-all hover:scale-105 flex-shrink-0 shadow-sm"
              title="Return to library / book shelf without losing your place"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Back to Shelf</span>
            </button>

            {/* Specific Document Page Icon Badge */}
            <div className="flex items-center gap-2 min-w-0 pl-1">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 shadow-inner">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xs sm:text-sm font-black text-white truncate max-w-[160px] sm:max-w-xs md:max-w-md">
                  {pdf.title}
                </h2>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="font-bold text-emerald-400">{pdf.course}</span>
                  <span>•</span>
                  <span className="truncate">{pdf.author || pdf.department}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Center: Reading Visibility Controls (Fit Width, Zoom, Theme, Scroll Mode) */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            
            {/* Continuous Scroll vs Single Page Mode */}
            <div className="flex items-center bg-slate-800/90 border border-slate-700 rounded-xl p-0.5 text-xs">
              <button
                onClick={() => setViewMode('continuous')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  viewMode === 'continuous' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Continuous Vertical Scroll Mode (Scroll to read easily)"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Scroll View</span>
              </button>

              <button
                onClick={() => setViewMode('single')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  viewMode === 'single' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Single Page Mode"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Single Page</span>
              </button>

              <button
                onClick={() => setViewMode('native')}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  viewMode === 'native' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Native Embedded Browser Viewer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Interactive</span>
              </button>
            </div>

            {/* Fit to Width Toggle */}
            <button
              onClick={() => setFitWidth(!fitWidth)}
              className={`hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                fitWidth
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Toggle Fit Width for optimal reading visibility"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Fit Width</span>
            </button>

            {/* Page Jump / Status */}
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl px-2 py-1 text-xs">
              <span className="text-slate-400 text-[11px] mr-1 hidden sm:inline">Page</span>
              <input
                type="text"
                value={pageInput}
                onChange={handlePageInputChange}
                onKeyDown={handlePageInputKeyDown}
                className="w-8 text-center bg-slate-900 border border-slate-700 text-white rounded px-1 py-0.5 text-xs font-mono font-bold focus:outline-none focus:border-emerald-500"
                title="Jump to page"
              />
              <span className="text-slate-400 text-xs font-mono ml-1">
                / {numPages || pdf.pageCount || '...'}
              </span>
            </div>

            {/* Zoom Adjusters */}
            <div className="hidden lg:flex items-center bg-slate-800 border border-slate-700 rounded-xl px-1.5 py-1 text-xs">
              <button
                onClick={() => setZoom(prev => Math.max(60, prev - 15))}
                className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-700"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoom(115)}
                className="px-1.5 font-mono text-[11px] font-bold text-slate-300 hover:text-white"
                title="Reset to 115%"
              >
                {zoom}%
              </button>
              <button
                onClick={() => setZoom(prev => Math.min(220, prev + 15))}
                className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-700"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Themes: Light, Sepia, Dark */}
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl p-0.5 text-xs">
              <button
                onClick={() => setTheme('light')}
                className={`p-1.5 rounded-lg ${theme === 'light' ? 'bg-slate-700 text-amber-300' : 'text-slate-400 hover:text-white'}`}
                title="Paper White Mode"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setTheme('sepia')}
                className={`px-2 py-1 text-[11px] font-bold rounded-lg ${theme === 'sepia' ? 'bg-amber-800 text-amber-100' : 'text-amber-400 hover:text-amber-200'}`}
                title="Warm Sepia Reading Mode"
              >
                Sepia
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`p-1.5 rounded-lg ${theme === 'dark' ? 'bg-slate-950 text-emerald-400' : 'text-slate-400 hover:text-white'}`}
                title="Midnight Dark Mode"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right: Sidebar Toggle, Download, Fullscreen, Close */}
          <div className="flex items-center gap-1.5">
            {/* Toggle Sidebar (Thumbnails / Search / Notes) */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-1.5 rounded-xl border transition-colors ${
                isSidebarOpen
                  ? 'bg-emerald-600 border-emerald-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Toggle Thumbnails, Outline & Notes Sidebar"
            >
              <Columns className="w-4 h-4" />
            </button>

            <button
              onClick={handleDownload}
              className="hidden sm:flex p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl"
              title="Download PDF document"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={toggleFullscreen}
              className="hidden sm:flex p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              id="btn-close-pdf-reader"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-red-600/80 rounded-xl transition-colors ml-1"
              title="Close Reader (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* 2. MAIN READING STAGE (Full Width, Continuous Scroll, 100% Fit Visibility) */}
        <div className="flex-1 flex overflow-hidden min-h-0 relative">
          
          {/* OPTIONAL SIDEBAR FOR THUMBNAILS, SEARCH, STUDY NOTES */}
          {isSidebarOpen && (
            <aside className="w-64 sm:w-72 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col flex-shrink-0 z-20 shadow-2xl">
              
              {/* Sidebar Tabs */}
              <div className="flex items-center border-b border-slate-800 bg-slate-950/70 p-1 text-xs">
                <button
                  onClick={() => setActiveSidebarTab('thumbnails')}
                  className={`flex-1 py-1.5 text-center font-bold rounded-lg ${
                    activeSidebarTab === 'thumbnails' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Pages
                </button>
                <button
                  onClick={() => setActiveSidebarTab('search')}
                  className={`flex-1 py-1.5 text-center font-bold rounded-lg ${
                    activeSidebarTab === 'search' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Search
                </button>
                <button
                  onClick={() => setActiveSidebarTab('notes')}
                  className={`flex-1 py-1.5 text-center font-bold rounded-lg ${
                    activeSidebarTab === 'notes' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Notes ({notes.length})
                </button>
                <button
                  onClick={() => setActiveSidebarTab('info')}
                  className={`flex-1 py-1.5 text-center font-bold rounded-lg ${
                    activeSidebarTab === 'info' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Details
                </button>
              </div>

              {/* Sidebar Content Area */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                
                {/* Thumbnails */}
                {activeSidebarTab === 'thumbnails' && (
                  <div className="space-y-3">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                      Document Pages ({numPages || pdf.pageCount || '...'})
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2.5">
                      {Array.from({ length: numPages || pdf.pageCount || 12 }, (_, idx) => idx + 1).map(pNum => {
                        const isCurrent = currentPage === pNum;
                        const thumbSrc = thumbnails[pNum];

                        return (
                          <button
                            key={pNum}
                            onClick={() => goToPage(pNum)}
                            className={`p-2 rounded-xl text-left transition-all border flex flex-col items-center group ${
                              isCurrent
                                ? 'bg-emerald-950/60 border-emerald-500 shadow-md ring-2 ring-emerald-500/30'
                                : 'bg-slate-800/80 border-slate-700 hover:border-slate-500 hover:bg-slate-800'
                            }`}
                          >
                            <div className="w-full aspect-[3/4] bg-white rounded-lg flex items-center justify-center overflow-hidden border border-slate-600 relative">
                              {thumbSrc ? (
                                <img src={thumbSrc} alt={`Page ${pNum}`} className="w-full h-full object-cover" />
                              ) : (
                                <div className="text-slate-400 text-xs font-mono font-bold">
                                  P.{pNum}
                                </div>
                              )}
                              {isCurrent && (
                                <div className="absolute inset-0 bg-emerald-500/20 border-2 border-emerald-500 rounded-lg" />
                              )}
                            </div>
                            <span className={`text-[11px] font-bold mt-1.5 ${isCurrent ? 'text-emerald-400' : 'text-slate-400 group-hover:text-white'}`}>
                              Page {pNum}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Search */}
                {activeSidebarTab === 'search' && (
                  <div className="space-y-3">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Search in Document
                    </div>

                    <div className="flex gap-1.5">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSearch()}
                          placeholder="Type keyword..."
                          className="w-full pl-8 pr-2 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <button
                        onClick={handleSearch}
                        disabled={isSearching || !searchQuery.trim()}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                      >
                        {isSearching ? '...' : 'Find'}
                      </button>
                    </div>

                    {isSearching && (
                      <div className="text-center py-4 text-xs text-slate-400">
                        Scanning document...
                      </div>
                    )}

                    {!isSearching && searchResults.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-[11px] text-slate-400">
                          Found <strong>{searchResults.length}</strong> matching page(s):
                        </div>
                        {searchResults.map((res, idx) => (
                          <button
                            key={idx}
                            onClick={() => goToPage(res.page)}
                            className="w-full text-left p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs space-y-1 transition-colors group"
                          >
                            <div className="flex items-center justify-between text-emerald-400 font-bold text-[11px]">
                              <span>Page {res.page}</span>
                              <span className="text-slate-500 group-hover:text-slate-300">Jump →</span>
                            </div>
                            <p className="text-slate-300 line-clamp-2 text-[11px] font-mono leading-tight">
                              {res.snippet}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                {activeSidebarTab === 'notes' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Study Notes
                      </span>
                      <span className="text-[11px] text-emerald-400 font-mono font-bold">
                        Page {currentPage}
                      </span>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-2">
                      <textarea
                        value={newNoteText}
                        onChange={e => setNewNoteText(e.target.value)}
                        placeholder={`Annotate page ${currentPage}...`}
                        rows={2}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                      />
                      <button
                        onClick={handleAddNote}
                        disabled={!newNoteText.trim()}
                        className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1 shadow-sm"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Save Note on Page {currentPage}</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {notes.length === 0 ? (
                        <div className="text-xs text-slate-500 text-center py-4 bg-slate-950/40 rounded-xl p-3">
                          No notes saved yet. Write key concepts above!
                        </div>
                      ) : (
                        notes.map(note => (
                          <div
                            key={note.id}
                            className="bg-slate-800/90 border border-slate-700 rounded-xl p-2.5 text-xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <button
                                onClick={() => goToPage(note.page)}
                                className="text-emerald-400 font-bold hover:underline flex items-center gap-1"
                              >
                                <Bookmark className="w-3 h-3 text-emerald-400" />
                                <span>Page {note.page}</span>
                              </button>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-500">{note.createdAt}</span>
                                <button
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="text-slate-500 hover:text-red-400 p-0.5"
                                  title="Delete Note"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            <p className="text-slate-200 leading-relaxed text-[11px] whitespace-pre-wrap">
                              {note.text}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Details */}
                {activeSidebarTab === 'info' && (
                  <div className="space-y-4 text-xs">
                    <div>
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Course Information
                      </h4>
                      <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 space-y-2.5">
                        <div className="flex items-start gap-2">
                          <GraduationCap className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="text-[10px] text-slate-400">Course Code</div>
                            <div className="font-bold text-white">{pdf.course}</div>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Building className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="text-[10px] text-slate-400">Department</div>
                            <div className="font-bold text-white">{pdf.department}</div>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Calendar className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="text-[10px] text-slate-400">Published</div>
                            <div className="font-bold text-white">
                              {new Date(pdf.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {pdf.summary && (
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Syllabus Abstract
                        </h4>
                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300 text-[11px] leading-relaxed">
                          {pdf.summary}
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </aside>
          )}

          {/* MAIN SCROLLABLE READING CANVAS CONTAINER */}
          <main
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className={`flex-1 overflow-y-auto flex flex-col items-center justify-start p-3 sm:p-8 transition-colors ${getThemeClass()} relative scroll-smooth`}
          >
            {/* Loading Indicator */}
            {isLoading && viewMode !== 'native' && (
              <div className="my-auto flex flex-col items-center gap-3 text-center p-8 bg-slate-800/80 rounded-3xl border border-slate-700/50 backdrop-blur-md shadow-2xl">
                <RefreshCw className="w-9 h-9 text-emerald-400 animate-spin" />
                <div>
                  <h3 className="text-base font-bold text-white">Full-Opening Document Page...</h3>
                  <p className="text-xs text-slate-400 mt-1">Rendering high-resolution fit-width book pages for easy scrolling</p>
                </div>
              </div>
            )}

            {/* 1. CONTINUOUS VERTICAL SCROLL MODE (User scrolls to read with full fit visibility) */}
            {!isLoading && viewMode === 'continuous' && (
              <div
                ref={continuousContainerRef}
                className="w-full flex flex-col items-center py-2 transition-all"
                style={{ filter: getCanvasFilter() }}
              />
            )}

            {/* 2. SINGLE PAGE MODE */}
            {!isLoading && viewMode === 'single' && (
              <div className="flex flex-col items-center justify-center min-h-full my-auto transition-transform duration-100">
                <div 
                  className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-300/80 transition-all duration-150 p-1"
                  style={{ filter: getCanvasFilter() }}
                >
                  <canvas ref={canvasRef} className="block max-w-full rounded-xl" />
                </div>

                <div className="mt-4 flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-5 py-2 rounded-full border border-slate-700 text-xs text-slate-300 shadow-2xl">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="hover:text-white disabled:opacity-30 font-bold"
                  >
                    ← Prev
                  </button>
                  <span className="font-mono text-xs text-emerald-400 font-bold">
                    Page {currentPage} of {numPages || pdf.pageCount || '...'}
                  </span>
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage >= numPages}
                    className="hover:text-white disabled:opacity-30 font-bold"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* 3. NATIVE EMBEDDED READER */}
            {viewMode === 'native' && (
              <div className="w-full h-full flex flex-col rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
                <iframe
                  src={`${resolvedUrl}#toolbar=1&navpanes=1&scrollbar=1&page=${currentPage}`}
                  title={pdf.title}
                  className="w-full h-full border-0 rounded-2xl bg-white"
                />
              </div>
            )}

            {/* FLOATING QUICK-SCROLL & JUMP TOOLBAR (Bottom Center) */}
            {!isLoading && viewMode === 'continuous' && (
              <div className="sticky bottom-4 z-30 flex items-center gap-2 bg-slate-900/95 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700/80 text-xs text-slate-200 shadow-2xl">
                <button
                  onClick={scrollToTop}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
                  title="Scroll to Top of Document"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>

                <div className="h-4 w-px bg-slate-700" />

                <span className="font-mono text-xs font-extrabold text-emerald-400 px-1">
                  Page {currentPage} of {numPages || pdf.pageCount || '...'}
                </span>

                <div className="h-4 w-px bg-slate-700" />

                <button
                  onClick={scrollToBottom}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
                  title="Scroll to Bottom of Document"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>

                <div className="h-4 w-px bg-slate-700" />

                <button
                  onClick={() => setFitWidth(!fitWidth)}
                  className="text-[11px] font-bold text-slate-300 hover:text-emerald-400 px-1.5"
                  title="Toggle Full Fit Width"
                >
                  {fitWidth ? 'Fit Width' : 'Standard'}
                </button>
              </div>
            )}

          </main>

        </div>

      </div>
    </div>
  );
};
