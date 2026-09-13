import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker securely with cdn fallback
try {
  if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    const version = pdfjsLib.version || '4.10.38';
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  }
} catch (e) {
  console.warn('PDF.js worker initialization notice in cover extractor:', e);
}

// In-memory cache for rendered first-page cover thumbnails
const coverMemoryCache = new Map<string, string>();
const pendingPromises = new Map<string, Promise<string | null>>();

/**
 * Extracts the first page of a PDF document as a high-quality image Data URL.
 * Includes memory & session storage caching so covers render instantly.
 */
export async function extractFirstPageCover(pdfUrl: string): Promise<string | null> {
  if (!pdfUrl) return null;

  // 1. Check memory cache
  if (coverMemoryCache.has(pdfUrl)) {
    return coverMemoryCache.get(pdfUrl) || null;
  }

  // 2. Check session storage cache
  try {
    const storageKey = `pdf_cover_p1_${pdfUrl.substring(0, 120)}`;
    const cached = sessionStorage.getItem(storageKey);
    if (cached) {
      coverMemoryCache.set(pdfUrl, cached);
      return cached;
    }
  } catch {
    // Ignore storage errors
  }

  // 3. Prevent duplicate concurrent extraction requests for same URL
  if (pendingPromises.has(pdfUrl)) {
    return pendingPromises.get(pdfUrl)!;
  }

  const extractionPromise = (async (): Promise<string | null> => {
    try {
      // Configure document loading task
      const loadingTask = pdfjsLib.getDocument({
        url: pdfUrl,
        disableFontFace: false,
        stopAtErrors: false
      });

      // Timeout guard in case external network fails
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error('PDF first page cover load timeout')), 9000);
      });

      const pdfDoc: any = await Promise.race([loadingTask.promise, timeoutPromise]);
      if (!pdfDoc || pdfDoc.numPages < 1) return null;

      // Extract page 1
      const page = await pdfDoc.getPage(1);
      const initialViewport = page.getViewport({ scale: 1 });

      // Target cover dimensions (width ~400px for crispness on high DPI)
      const targetWidth = 400;
      const calculatedScale = targetWidth / initialViewport.width;
      const scale = Math.min(Math.max(calculatedScale, 1.0), 2.2);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d', { alpha: false });

      if (!ctx) return null;

      // Fill background with clean academic white paper
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const renderContext = {
        canvasContext: ctx,
        viewport
      };

      await page.render(renderContext).promise;

      // Convert to compressed jpeg image data URL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      
      // Cache result
      coverMemoryCache.set(pdfUrl, dataUrl);
      try {
        const storageKey = `pdf_cover_p1_${pdfUrl.substring(0, 120)}`;
        sessionStorage.setItem(storageKey, dataUrl);
      } catch {
        // storage quota exceeded or disabled
      }

      return dataUrl;
    } catch (err) {
      // Non-fatal, return null so component falls back to first-page layout
      console.debug('Could not extract PDF first page cover automatically:', err);
      return null;
    } finally {
      pendingPromises.delete(pdfUrl);
    }
  })();

  pendingPromises.set(pdfUrl, extractionPromise);
  return extractionPromise;
}
