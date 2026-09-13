import React, { useState, useMemo } from 'react';
import {
  GripVertical,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Plus,
  BarChart2,
  Layers,
  Code2,
  Sparkles,
  TrendingUp,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  Activity,
  Award,
  Search,
  RefreshCw,
  Copy,
  Check,
  Send,
  Sliders,
  Maximize2,
  Zap,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  ShieldCheck,
  Building2,
  DollarSign,
  CreditCard
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import {
  PDFPost,
  AggregatedCourseAnalytic,
  DetailedAnalytics,
  AdminTab
} from '../types';
import { BookCover } from './BookCover';
import { AdminPaymentsManager } from './AdminPaymentsManager';
import { AdminPaymentSettings } from './AdminPaymentSettings';

interface AdminPortalProps {
  pdfs: PDFPost[];
  analytics: AggregatedCourseAnalytic[];
  detailedAnalytics: DetailedAnalytics | null;
  onReorder: (orderedIds: string[]) => Promise<void>;
  onToggleVisibility: (pdf: PDFPost) => Promise<void>;
  onEditPDF: (pdf: PDFPost) => void;
  onDeletePDF: (id: string) => Promise<void>;
  onOpenAddModal: () => void;
  onSimulateView: (pdfId: string) => Promise<void>;
  onRefresh: () => void;
  onReadPDF?: (pdf: PDFPost) => void;
}

const COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2', '#4f46e5'];

export const AdminPortal: React.FC<AdminPortalProps> = ({
  pdfs,
  analytics,
  detailedAnalytics,
  onReorder,
  onToggleVisibility,
  onEditPDF,
  onDeletePDF,
  onOpenAddModal,
  onSimulateView,
  onRefresh,
  onReadPDF
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('reorder');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [adminSearch, setAdminSearch] = useState('');
  const [adminDeptFilter, setAdminDeptFilter] = useState('ALL');
  const [isSimulatingTraffic, setIsSimulatingTraffic] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  // API Tester State
  const [apiEndpoint, setApiEndpoint] = useState<string>('/api/user/pdfs');
  const [apiMethod, setApiMethod] = useState<string>('GET');
  const [apiPayload, setApiPayload] = useState<string>('');
  const [apiTestResponse, setApiTestResponse] = useState<string | null>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiStatusCode, setApiStatusCode] = useState<number | null>(null);
  const [apiLatency, setApiLatency] = useState<number | null>(null);

  // Move item up/down
  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= pdfs.length) return;

    const newItems = [...pdfs];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    const orderedIds = newItems.map(p => p._id);
    setIsSavingOrder(true);
    await onReorder(orderedIds);
    setIsSavingOrder(false);
  };

  // Move directly to top or bottom
  const handleSendToEdge = async (index: number, edge: 'top' | 'bottom') => {
    const newItems = [...pdfs];
    const [item] = newItems.splice(index, 1);
    if (edge === 'top') {
      newItems.unshift(item);
    } else {
      newItems.push(item);
    }
    const orderedIds = newItems.map(p => p._id);
    setIsSavingOrder(true);
    await onReorder(orderedIds);
    setIsSavingOrder(false);
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newItems = [...pdfs];
    const [movedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(dropIndex, 0, movedItem);

    setDraggedIndex(null);
    setDragOverIndex(null);

    const orderedIds = newItems.map(p => p._id);
    setIsSavingOrder(true);
    await onReorder(orderedIds);
    setIsSavingOrder(false);
  };

  // Simulate batch random traffic
  const handleSimulateRandomTraffic = async () => {
    if (pdfs.length === 0 || isSimulatingTraffic) return;
    setIsSimulatingTraffic(true);
    try {
      for (let i = 0; i < 4; i++) {
        const randomIndex = Math.floor(Math.random() * pdfs.length);
        const randomPdf = pdfs[randomIndex];
        await onSimulateView(randomPdf._id);
      }
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimulatingTraffic(false);
    }
  };

  // Live API test runners
  const runApiTest = async (endpoint: string, method: string = 'GET', body?: any) => {
    setApiLoading(true);
    setApiTestResponse(null);
    setApiStatusCode(null);
    setApiEndpoint(endpoint);
    setApiMethod(method);
    if (body) setApiPayload(JSON.stringify(body, null, 2));

    const startTime = performance.now();
    try {
      const res = await fetch(endpoint, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined
      });
      const duration = Math.round(performance.now() - startTime);
      setApiLatency(duration);
      setApiStatusCode(res.status);

      const data = await res.json();
      setApiTestResponse(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setApiLatency(Math.round(performance.now() - startTime));
      setApiStatusCode(500);
      setApiTestResponse(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setApiLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(label);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  // Admin filter
  const filteredPdfs = useMemo(() => {
    return pdfs.filter(pdf => {
      const matchDept = adminDeptFilter === 'ALL' || pdf.department === adminDeptFilter;
      const term = adminSearch.toLowerCase();
      const matchSearch =
        !term ||
        pdf.title.toLowerCase().includes(term) ||
        pdf.course.toLowerCase().includes(term) ||
        pdf.department.toLowerCase().includes(term);
      return matchDept && matchSearch;
    });
  }, [pdfs, adminDeptFilter, adminSearch]);

  // Analytics Derived Stats
  const totalViews = useMemo(() => {
    return detailedAnalytics?.totalViews || analytics.reduce((acc, c) => acc + c.totalViews, 0);
  }, [detailedAnalytics, analytics]);

  const topCourse = useMemo(() => {
    if (analytics.length === 0) return null;
    return [...analytics].sort((a, b) => b.totalViews - a.totalViews)[0];
  }, [analytics]);

  const visibleCount = pdfs.filter(p => p.isVisible).length;
  const hiddenCount = pdfs.length - visibleCount;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Studio Header Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 sm:p-7 text-white shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-2 border border-blue-400/30">
            <Sliders className="w-3.5 h-3.5" />
            <span>Instructor Sequencing &amp; Course Analytics Studio</span>
          </div>
          <h1 className="text-2xl font-black text-white">
            Academic Curriculum Administration
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Manage course PDF syllabus ordering, toggle student visibility, review engagement analytics, and test backend REST endpoints in real time.
          </p>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenAddModal}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Course PDF</span>
          </button>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-0 overflow-x-auto">
        <div className="flex space-x-1 sm:space-x-2 min-w-max">
          <button
            id="admin-tab-reorder"
            onClick={() => setActiveTab('reorder')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'reorder'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Document Catalog</span>
            <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold">
              {pdfs.length}
            </span>
          </button>

          <button
            id="admin-tab-payments"
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'payments'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Student Orders &amp; Releases</span>
          </button>

          <button
            id="admin-tab-payment-settings"
            onClick={() => setActiveTab('payment-settings')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'payment-settings'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>Payment Accounts</span>
          </button>

          <button
            id="admin-tab-analytics"
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'analytics'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Engagement Analytics</span>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold">
              {totalViews} views
            </span>
          </button>

          <button
            id="admin-tab-api"
            onClick={() => setActiveTab('api-docs')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'api-docs'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>API REST Sandbox</span>
          </button>
        </div>

        <button
          onClick={onRefresh}
          className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 text-xs font-semibold flex items-center gap-1 flex-shrink-0"
          title="Sync with database"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sync DB</span>
        </button>
      </div>

      {/* TAB 1: REORDER & CONTENT MANAGEMENT */}
      {activeTab === 'reorder' && (
        <div className="space-y-4">
          
          {/* Controls bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-sm">
            
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={adminSearch}
                onChange={e => setAdminSearch(e.target.value)}
                placeholder="Filter documents..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Department Filter & Stats */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end text-xs">
              <div className="flex items-center gap-2 font-mono text-slate-500 text-[11px]">
                <span className="text-emerald-600 font-bold">● {visibleCount} Published</span>
                <span>•</span>
                <span className="text-amber-600 font-bold">○ {hiddenCount} Hidden</span>
              </div>

              <select
                value={adminDeptFilter}
                onChange={e => setAdminDeptFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="Business">Business</option>
                <option value="Arts">Arts</option>
              </select>
            </div>
          </div>

          {/* Reorder Guide / Status banner */}
          <div className="bg-blue-50/80 border border-blue-200/80 rounded-xl p-3.5 flex items-center justify-between text-xs text-blue-900">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>
                <strong>Drag &amp; Drop</strong> cards by their grip handle or use <strong>↑ / ↓</strong> arrows to reorganize syllabus sequence. Changes sync immediately via <code className="bg-white/80 px-1 py-0.5 rounded font-mono text-[11px] text-blue-800">PUT /api/pdfs/reorder</code>.
              </span>
            </div>
            {isSavingOrder && (
              <span className="font-semibold text-blue-700 flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" /> Saving order...
              </span>
            )}
          </div>

          {/* Sortable Document List */}
          <div className="space-y-2.5">
            {filteredPdfs.map((pdf, index) => {
              const isFirst = index === 0;
              const isLast = index === filteredPdfs.length - 1;
              const isDragged = draggedIndex === index;
              const isDragOver = dragOverIndex === index;

              return (
                <div
                  key={pdf._id}
                  draggable
                  onDragStart={e => handleDragStart(e, index)}
                  onDragOver={e => handleDragOver(e, index)}
                  onDrop={e => handleDrop(e, index)}
                  onDragEnd={() => {
                    setDraggedIndex(null);
                    setDragOverIndex(null);
                  }}
                  className={`bg-white rounded-2xl border p-3.5 sm:p-4 transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm ${
                    isDragged
                      ? 'opacity-40 border-dashed border-blue-500 scale-[0.99]'
                      : isDragOver
                      ? 'border-blue-500 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20'
                      : pdf.isVisible
                      ? 'border-slate-200 hover:border-slate-300'
                      : 'border-amber-200 bg-amber-50/20'
                  }`}
                >
                  {/* Left: Drag Handle + Order badge + Document Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 flex-shrink-0"
                      title="Drag to reposition"
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>

                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                      #{pdf.sortOrder + 1}
                    </div>

                    {/* Book Cover Miniature Thumbnail */}
                    <div className="hidden sm:block flex-shrink-0">
                      <BookCover pdf={pdf} size="sm" className="w-12 h-16 text-[7px] scale-90" />
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-blue-600">
                          {pdf.course}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[11px] text-slate-500">
                          {pdf.department}
                        </span>
                        {pdf.isPaid ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-mono font-bold text-[10px] rounded-full border border-emerald-200">
                            ${Number(pdf.price || 0).toFixed(2)} Paid
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-mono font-bold text-[10px] rounded-full">
                            Free Access
                          </span>
                        )}
                        {!pdf.isVisible && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-semibold rounded-full">
                            Hidden
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-sm sm:max-w-md md:max-w-lg">
                        {pdf.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {pdf.pageCount || 20} pages • {pdf.fileSize || '2.4 MB'}
                      </p>
                    </div>
                  </div>

                  {/* Right Actions Toolbar */}
                  <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    
                    {/* Up / Down Arrow Steppers */}
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 mr-1">
                      <button
                        onClick={() => handleMove(index, 'up')}
                        disabled={isFirst || isSavingOrder}
                        className="p-1.5 text-slate-600 hover:text-blue-600 disabled:opacity-30 rounded hover:bg-white transition-colors"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMove(index, 'down')}
                        disabled={isLast || isSavingOrder}
                        className="p-1.5 text-slate-600 hover:text-blue-600 disabled:opacity-30 rounded hover:bg-white transition-colors"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Read / Preview In-App */}
                    {onReadPDF && (
                      <button
                        onClick={() => onReadPDF(pdf)}
                        title="Read and Inspect PDF In-App"
                        className="p-1.5 text-xs text-indigo-600 hover:bg-indigo-50 rounded-lg border border-indigo-200 flex items-center gap-1 font-medium"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline text-[11px]">Read</span>
                      </button>
                    )}

                    {/* Simulate Student View */}
                    <button
                      onClick={() => onSimulateView(pdf._id)}
                      title="Simulate student reading event"
                      className="p-1.5 text-xs text-emerald-700 hover:bg-emerald-50 rounded-lg border border-emerald-200 flex items-center gap-1 font-medium"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-[11px]">+View</span>
                    </button>

                    {/* Toggle Visibility */}
                    <button
                      onClick={() => onToggleVisibility(pdf)}
                      title={pdf.isVisible ? 'Hide from students' : 'Publish to students'}
                      className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition-colors ${
                        pdf.isVisible
                          ? 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                          : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-300'
                      }`}
                    >
                      {pdf.isVisible ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-amber-600" />}
                      <span className="hidden md:inline text-[11px]">{pdf.isVisible ? 'Visible' : 'Hidden'}</span>
                    </button>

                    {/* Edit Document */}
                    <button
                      onClick={() => onEditPDF(pdf)}
                      className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-200"
                      title="Edit Course Details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Document */}
                    <button
                      onClick={() => onDeletePDF(pdf._id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200"
                      title="Delete from Catalog"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: STUDENT PAYMENTS & ORDERS */}
      {activeTab === 'payments' && (
        <AdminPaymentsManager pdfs={pdfs} onOrderUpdated={onRefresh} />
      )}

      {/* TAB: PAYMENT RECEIVING ACCOUNTS CONFIG */}
      {activeTab === 'payment-settings' && (
        <AdminPaymentSettings />
      )}

      {/* TAB 2: ANALYTICS & INSIGHTS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          
          {/* Analytics KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span className="font-semibold">Total Student Reads</span>
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">{totalViews}</div>
              <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Live Realtime Events
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span className="font-semibold">Most Popular Course</span>
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-xl font-black text-slate-900 font-mono truncate">
                {topCourse ? topCourse._id : 'N/A'}
              </div>
              <div className="text-[11px] text-slate-500">
                {topCourse ? `${topCourse.totalViews} student views` : 'No views recorded'}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span className="font-semibold">Active Syllabus Materials</span>
                <BookOpen className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">{pdfs.length}</div>
              <div className="text-[11px] text-slate-500">
                {visibleCount} Published • {hiddenCount} Hidden
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span className="font-semibold">Simulate Traffic</span>
                <Zap className="w-4 h-4 text-emerald-600" />
              </div>
              <button
                onClick={handleSimulateRandomTraffic}
                disabled={isSimulatingTraffic}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Zap className={`w-3.5 h-3.5 ${isSimulatingTraffic ? 'animate-spin' : ''}`} />
                <span>{isSimulatingTraffic ? 'Injecting Reads...' : 'Simulate Traffic'}</span>
              </button>
              <div className="text-[10px] text-slate-400 text-center">
                Triggers live read events into MongoDB
              </div>
            </div>

          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Bar Chart: Views by Course */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    <span>Course Reading Engagement (Views by Course)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Aggregated pipeline from MongoDB collection</p>
                </div>
              </div>

              <div className="h-72 w-full pt-4">
                {analytics.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No course analytics recorded yet.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="_id" tick={{ fontSize: 11 }} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          fontSize: '12px'
                        }}
                      />
                      <Bar dataKey="totalViews" fill="#2563eb" radius={[6, 6, 0, 0]} name="Tracked Reads">
                        {analytics.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Donut Chart: Views by Department */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-indigo-600" />
                  <span>Department Distribution</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Share of total reading events</p>
              </div>

              <div className="h-72 w-full flex items-center justify-center">
                {(!detailedAnalytics || detailedAnalytics.departmentStats.length === 0) ? (
                  <div className="text-xs text-slate-400">No department breakdown yet.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={detailedAnalytics.departmentStats}
                        dataKey="totalViews"
                        nameKey="department"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                      >
                        {detailedAnalytics.departmentStats.map((entry, index) => (
                          <Cell key={`dept-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>

          {/* Audit Stream / Recent Activity */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span>Live Reading Event Audit Feed</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Recent student access timestamps recorded by backend</p>
              </div>
              <span className="text-xs font-mono font-semibold text-slate-500">
                {detailedAnalytics?.recentActivity?.length || 0} events logged
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4">Timestamp</th>
                    <th className="py-2.5 px-4">Course</th>
                    <th className="py-2.5 px-4">Document Title</th>
                    <th className="py-2.5 px-4">Department</th>
                    <th className="py-2.5 px-4 text-right">Event ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(!detailedAnalytics || detailedAnalytics.recentActivity.length === 0) ? (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-slate-400 text-xs">
                        No reading logs captured yet. Open any document or click "Simulate Traffic".
                      </td>
                    </tr>
                  ) : (
                    detailedAnalytics.recentActivity.slice(0, 10).map((log, idx) => (
                      <tr key={log._id || idx} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                          {new Date(log.viewedAt).toLocaleTimeString()} • {new Date(log.viewedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-blue-600">
                          {log.course}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {log.title || 'Course Lecture Notes'}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {log.department}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-[10px] text-slate-400">
                          {log._id}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: REST API PLAYGROUND */}
      {activeTab === 'api-docs' && (
        <div className="space-y-6">
          
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Code2 className="w-5 h-5 text-blue-600" />
                <span>Interactive Express &amp; MongoDB REST Endpoint Tester</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Execute live requests against the running Express backend and inspect JSON payloads and latency.
              </p>
            </div>

            {/* Quick Test Presets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
              <button
                onClick={() => runApiTest('/api/user/pdfs', 'GET')}
                className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-left space-y-1 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">GET</span>
                  <span className="text-[10px] text-slate-400 group-hover:text-blue-600">Execute →</span>
                </div>
                <div className="font-mono text-xs font-bold text-slate-800">/api/user/pdfs</div>
                <p className="text-[11px] text-slate-500">Fetch visible, sorted course documents</p>
              </button>

              <button
                onClick={() => runApiTest('/api/admin/pdfs', 'GET')}
                className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-left space-y-1 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">GET</span>
                  <span className="text-[10px] text-slate-400 group-hover:text-blue-600">Execute →</span>
                </div>
                <div className="font-mono text-xs font-bold text-slate-800">/api/admin/pdfs</div>
                <p className="text-[11px] text-slate-500">Fetch all documents (including hidden)</p>
              </button>

              <button
                onClick={() => runApiTest('/api/admin/analytics', 'GET')}
                className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-left space-y-1 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">GET</span>
                  <span className="text-[10px] text-slate-400 group-hover:text-blue-600">Execute →</span>
                </div>
                <div className="font-mono text-xs font-bold text-slate-800">/api/admin/analytics</div>
                <p className="text-[11px] text-slate-500">Course view aggregation statistics</p>
              </button>

              <button
                onClick={() => runApiTest('/api/admin/analytics/detailed', 'GET')}
                className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-left space-y-1 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">GET</span>
                  <span className="text-[10px] text-slate-400 group-hover:text-blue-600">Execute →</span>
                </div>
                <div className="font-mono text-xs font-bold text-slate-800">/api/admin/analytics/detailed</div>
                <p className="text-[11px] text-slate-500">Full audit log &amp; department stats</p>
              </button>

              <button
                onClick={() => {
                  const targetPdf = pdfs[0] ? pdfs[0]._id : 'pdf_cs101_algo';
                  runApiTest('/api/analytics/track', 'POST', { pdfId: targetPdf });
                }}
                className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-left space-y-1 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">POST</span>
                  <span className="text-[10px] text-slate-400 group-hover:text-blue-600">Execute →</span>
                </div>
                <div className="font-mono text-xs font-bold text-slate-800">/api/analytics/track</div>
                <p className="text-[11px] text-slate-500">Record document reading event</p>
              </button>

              <button
                onClick={() => {
                  const reversedIds = [...pdfs].reverse().map(p => p._id);
                  runApiTest('/api/pdfs/reorder', 'PUT', { orderedIds: reversedIds });
                }}
                className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-left space-y-1 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">PUT</span>
                  <span className="text-[10px] text-slate-400 group-hover:text-blue-600">Execute →</span>
                </div>
                <div className="font-mono text-xs font-bold text-slate-800">/api/pdfs/reorder</div>
                <p className="text-[11px] text-slate-500">Batch update syllabus sequence order</p>
              </button>
            </div>

            {/* Custom Request Execution Console */}
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={apiMethod}
                  onChange={e => setApiMethod(e.target.value)}
                  className="px-3 py-2 bg-slate-900 text-white font-mono font-bold text-xs rounded-xl border border-slate-700 focus:outline-none"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                </select>

                <input
                  type="text"
                  value={apiEndpoint}
                  onChange={e => setApiEndpoint(e.target.value)}
                  placeholder="/api/..."
                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />

                <button
                  onClick={() => runApiTest(apiEndpoint, apiMethod, apiPayload ? JSON.parse(apiPayload) : undefined)}
                  disabled={apiLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{apiLoading ? 'Sending...' : 'Send Request'}</span>
                </button>
              </div>

              {/* Response Display */}
              {apiTestResponse && (
                <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-2 mt-4">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-400">Response Payload:</span>
                      {apiStatusCode && (
                        <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                          apiStatusCode < 300 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'
                        }`}>
                          HTTP {apiStatusCode}
                        </span>
                      )}
                      {apiLatency !== null && (
                        <span className="text-[11px] text-slate-500 font-mono">
                          {apiLatency}ms
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => copyToClipboard(apiTestResponse, 'res')}
                      className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                    >
                      {copiedEndpoint === 'res' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedEndpoint === 'res' ? 'Copied' : 'Copy JSON'}</span>
                    </button>
                  </div>
                  <pre className="text-emerald-400 font-mono text-xs overflow-x-auto max-h-72 p-2 leading-relaxed">
                    {apiTestResponse}
                  </pre>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
