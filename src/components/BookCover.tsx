import React, { useState, useEffect } from 'react';
import { PDFPost } from '../types';
import { BookOpen, FileText, Sparkles, Bookmark, FileCheck } from 'lucide-react';
import { extractFirstPageCover } from '../lib/pdfCoverExtractor';

interface BookCoverProps {
  pdf: PDFPost;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showBadge?: boolean;
}

export const BookCover: React.FC<BookCoverProps> = ({
  pdf,
  size = 'md',
  className = '',
  showBadge = true
}) => {
  const [firstPageUrl, setFirstPageUrl] = useState<string | null>(pdf.coverImage || null);
  const [isLoading, setIsLoading] = useState<boolean>(!pdf.coverImage && !!pdf.pdfUrl);

  const title = (pdf.title || 'Untitled Document').trim();
  const author = (pdf.author || 'Academic Faculty').trim();
  const course = (pdf.course || 'ACAD').trim();
  const department = (pdf.department || '').trim();

  // Extract real page 1 of PDF document
  useEffect(() => {
    let isMounted = true;

    if (pdf.coverImage) {
      setFirstPageUrl(pdf.coverImage);
      setIsLoading(false);
      return;
    }

    if (pdf.pdfUrl) {
      setIsLoading(true);
      extractFirstPageCover(pdf.pdfUrl)
        .then(dataUrl => {
          if (isMounted) {
            if (dataUrl) setFirstPageUrl(dataUrl);
            setIsLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [pdf.pdfUrl, pdf.coverImage, pdf._id]);

  // Size dimensions
  const sizeClasses = {
    sm: 'w-24 h-36 rounded-md text-[9px]',
    md: 'w-36 sm:w-44 h-52 sm:h-64 rounded-lg text-xs',
    lg: 'w-48 sm:w-56 h-72 sm:h-80 rounded-xl text-sm'
  }[size];

  // 1. IF REAL FIRST PAGE IMAGE IS EXTRACTED / AVAILABLE
  if (firstPageUrl) {
    return (
      <div
        className={`relative overflow-hidden bg-white border border-slate-300/80 shadow-[0_12px_28px_-6px_rgba(0,0,0,0.30)] select-none transition-all duration-200 group-hover:scale-[1.03] group-hover:-translate-y-1 ${sizeClasses} ${className}`}
      >
        {/* Rendered Real First Page of Document */}
        <img
          src={firstPageUrl}
          alt={`Page 1 cover for ${title}`}
          className="w-full h-full object-cover object-top select-none pointer-events-none"
          loading="lazy"
        />

        {/* 3D Curved Book Spine Lighting & Crease */}
        <div className="absolute left-0 top-0 bottom-0 w-3.5 sm:w-4 bg-gradient-to-r from-black/50 via-black/20 to-transparent pointer-events-none z-20" />
        <div className="absolute left-3.5 top-0 bottom-0 w-px bg-white/40 pointer-events-none z-20" />

        {/* Subtle Paper Edge Sheen */}
        <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-gradient-to-l from-black/15 to-transparent pointer-events-none z-20" />

        {/* Top Course Floating Tag (if enabled) */}
        {showBadge && (
          <div className="absolute top-2 left-4 right-2 z-30 flex items-center justify-between gap-1 pointer-events-none">
            <span className="font-mono text-[8px] sm:text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-900/85 text-white backdrop-blur-xs border border-white/20 shadow-xs truncate max-w-[90px]">
              {course}
            </span>
            {pdf.isPaid && (
              <span className="font-mono text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-600/90 text-white backdrop-blur-xs border border-white/20 shadow-xs">
                {pdf.currency === 'ETB' ? `${pdf.price} Br` : `$${pdf.price}`}
              </span>
            )}
          </div>
        )}

        {/* Bottom Title Bar Overlay for Quick Identification on Small Sizes */}
        {size === 'sm' && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950/90 via-slate-900/70 to-transparent p-1.5 pt-4 text-[8px] text-white font-medium truncate z-20">
            {title}
          </div>
        )}
      </div>
    );
  }

  // 2. LOADING SKELETON WITH FIRST PAGE MANUSCRIPT LAYOUT
  if (isLoading) {
    return (
      <div
        className={`relative overflow-hidden bg-slate-50 border border-slate-200 shadow-md p-3 flex flex-col justify-between select-none ${sizeClasses} ${className}`}
      >
        <div className="absolute left-0 top-0 bottom-0 w-3.5 bg-gradient-to-r from-black/20 via-black/5 to-transparent pointer-events-none" />
        <div className="space-y-2 animate-pulse pt-2">
          <div className="h-3 bg-slate-200 rounded w-2/3" />
          <div className="h-4 bg-slate-300 rounded w-5/6" />
          <div className="h-2.5 bg-slate-200 rounded w-1/2" />
        </div>

        <div className="space-y-1.5 animate-pulse my-auto opacity-40">
          <div className="h-2 bg-slate-200 rounded w-full" />
          <div className="h-2 bg-slate-200 rounded w-full" />
          <div className="h-2 bg-slate-200 rounded w-3/4" />
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 pt-1.5">
          <span className="text-[8px] font-mono text-slate-400">{course}</span>
          <span className="text-[7px] text-slate-400">Loading Page 1...</span>
        </div>
      </div>
    );
  }

  // 3. FIRST-PAGE MANUSCRIPT FRONT COVER LAYOUT (High Fidelity Printed Academic Document First Page)
  return (
    <div
      className={`relative overflow-hidden bg-[#FAFAF8] text-slate-900 border border-slate-300 shadow-[0_12px_28px_-6px_rgba(0,0,0,0.28)] flex flex-col justify-between p-3 sm:p-4 select-none transition-all duration-200 group-hover:scale-[1.03] group-hover:-translate-y-1 ${sizeClasses} ${className}`}
    >
      {/* 3D Spine Fold Lighting */}
      <div className="absolute left-0 top-0 bottom-0 w-3.5 sm:w-4 bg-gradient-to-r from-black/35 via-black/10 to-transparent pointer-events-none z-20" />
      <div className="absolute left-3.5 top-0 bottom-0 w-px bg-slate-300 pointer-events-none z-20" />
      <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-l from-black/10 to-transparent pointer-events-none z-20" />

      {/* Top Academic Header */}
      <div className="pl-1.5 z-10 space-y-1">
        <div className="flex items-center justify-between gap-1 border-b border-slate-200 pb-1">
          <span className="font-mono text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-slate-700 bg-slate-200/80 px-1.5 py-0.5 rounded">
            {course}
          </span>
          <span className="text-[7px] sm:text-[8px] font-sans text-slate-500 uppercase tracking-widest truncate max-w-[80px]">
            {department || 'COURSE TEXT'}
          </span>
        </div>
      </div>

      {/* Center First Page Document Content: Title, Authors, Abstract snippet */}
      <div className="pl-1.5 my-auto py-1 z-10 flex flex-col justify-center">
        <h2 className="font-serif font-bold text-slate-950 text-xs sm:text-sm leading-snug tracking-tight line-clamp-3">
          {title}
        </h2>

        <div className="font-sans text-[8px] sm:text-[10px] text-slate-600 font-medium mt-1 truncate">
          by {author}
        </div>

        {/* Abstract / Abstract Lines simulating first page */}
        <div className="mt-2 pt-1.5 border-t border-slate-200/80 space-y-1">
          <div className="text-[7px] font-mono uppercase font-bold text-slate-400">
            Page 1 • Abstract
          </div>
          <p className="text-[7px] sm:text-[8px] text-slate-500 font-serif leading-tight line-clamp-3 italic opacity-90">
            {pdf.summary || 'A comprehensive course reference manuscript presenting fundamental theories, methodology, and systematic problem solutions.'}
          </p>
        </div>
      </div>

      {/* Bottom Page 1 Footer */}
      <div className="pl-1.5 border-t border-slate-200 pt-1 z-10 flex items-center justify-between text-[7px] sm:text-[8px] text-slate-400 font-mono">
        <span>{pdf.pageCount || 20} Pages</span>
        <span className="font-bold text-slate-600">Page [ 1 ]</span>
      </div>
    </div>
  );
};
