import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/store';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '15mb' }));

  // --- API Routes ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // --- Authentication & User Routes ---
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, name, password, avatar } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email address is required' });
      }
      const user = db.registerUser({ email, name, password, avatar });
      res.status(201).json({ success: true, user });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to register account' });
    }
  });

  app.post('/api/auth/google', async (req, res) => {
    try {
      const { email, name, avatar } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Google email is required' });
      }
      const user = db.loginWithGoogle({ email, name, avatar });
      res.json({ success: true, user });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to authenticate with Google' });
    }
  });

  app.get('/api/auth/user/:id', async (req, res) => {
    try {
      const user = db.getUserById(req.params.id) || db.getUserByEmail(req.params.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Internal error' });
    }
  });

  app.get('/api/admin/users', async (req, res) => {
    try {
      const users = db.getAllUsers();
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Internal error' });
    }
  });

  // --- Payment Settings Routes ---
  app.get('/api/payments/settings', async (req, res) => {
    try {
      const settings = db.getPaymentSettings();
      res.json(settings);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Internal error' });
    }
  });

  app.put('/api/payments/settings', async (req, res) => {
    try {
      const updated = db.updatePaymentSettings(req.body);
      res.json({ success: true, settings: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Internal error' });
    }
  });

  // --- Payment Orders & Release Routes ---
  // User submits payment for a paid document
  app.post('/api/payments/order', async (req, res) => {
    try {
      const {
        userId,
        userEmail,
        userName,
        pdfId,
        amount,
        currency,
        paymentMethod,
        transactionRef,
        receiptImage,
        notes
      } = req.body;

      if (!userId || !userEmail || !pdfId || !transactionRef) {
        return res.status(400).json({
          error: 'User email, document ID, and payment reference/transaction ID are required.'
        });
      }

      const order = db.createPaymentOrder({
        userId,
        userEmail,
        userName: userName || userEmail.split('@')[0],
        pdfId,
        amount: Number(amount) || 0,
        currency: currency || 'USD',
        paymentMethod: paymentMethod || 'Direct Transfer',
        transactionRef,
        receiptImage,
        notes
      });

      res.status(201).json({ success: true, order });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to submit payment order' });
    }
  });

  // Get orders (all for admin, or filtered by ?userId=)
  app.get(['/api/payments/orders', '/api/orders'], async (req, res) => {
    try {
      const { userId } = req.query;
      if (userId && typeof userId === 'string') {
        const orders = db.getOrdersByUserId(userId);
        return res.json(orders);
      }
      const orders = db.getAllOrders();
      res.json(orders);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Internal error' });
    }
  });

  // ADMIN: Release book for order (Verify payment and grant instant access)
  app.put('/api/payments/orders/:id/release', async (req, res) => {
    try {
      const { id } = req.params;
      const { adminNotes } = req.body;
      const order = db.releaseBookForOrder(id, adminNotes);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.json({ success: true, order, message: 'Payment verified and book successfully released!' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to release book' });
    }
  });

  // ADMIN: Reject payment order
  app.put('/api/payments/orders/:id/reject', async (req, res) => {
    try {
      const { id } = req.params;
      const { adminNotes } = req.body;
      const order = db.rejectOrder(id, adminNotes);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.json({ success: true, order, message: 'Payment order rejected' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to reject order' });
    }
  });

  // ADMIN: Delete order record
  app.delete('/api/payments/orders/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const success = db.deleteOrder(id);
      if (!success) {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.json({ success: true, message: 'Order record deleted' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Internal error' });
    }
  });

  // Check user unlocked books & list access
  app.get(['/api/user/unlocked', '/api/user/access'], async (req, res) => {
    try {
      const userId = (req.query.userId as string) || '';
      if (!userId) {
        return res.json({ userId: '', unlockedPdfIds: [], accessList: [] });
      }
      const accessList = db.getUserAccess(userId);
      const unlockedPdfIds = Array.from(new Set(accessList.map(a => a.pdfId)));
      res.json({ userId, unlockedPdfIds, accessList });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Internal error' });
    }
  });

  app.get('/api/user/access/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const accessList = db.getUserAccess(userId);
      const unlockedPdfIds = Array.from(new Set(accessList.map(a => a.pdfId)));
      res.json({ userId, unlockedPdfIds, accessList });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Internal error' });
    }
  });

  // Verify access for specific user and PDF
  app.get('/api/user/check-access', async (req, res) => {
    try {
      const { userId, pdfId } = req.query;
      if (!pdfId || typeof pdfId !== 'string') {
        return res.status(400).json({ error: 'pdfId is required' });
      }

      const pdf = db.getPDFById(pdfId);
      if (!pdf) {
        return res.status(404).json({ error: 'PDF not found' });
      }

      const isFree = !pdf.isPaid || pdf.price === 0;
      const hasAccess = isFree || (userId && typeof userId === 'string' && db.hasAccessToPDF(userId, pdfId));

      res.json({
        pdfId,
        isPaid: pdf.isPaid || false,
        price: pdf.price || 0,
        currency: pdf.currency || 'USD',
        hasAccess: !!hasAccess,
        isFree
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Internal error' });
    }
  });

  // 1. ADMIN: Create a new PDF post
  app.post('/api/pdfs', async (req, res) => {
    try {
      const {
        title,
        pdfUrl,
        department,
        course,
        isVisible,
        summary,
        fileSize,
        pageCount,
        author,
        category,
        coverImage,
        coverColor,
        tagline,
        isPaid,
        price,
        currency,
        paymentMethods,
        paymentInstructions
      } = req.body;
      if (!title || !pdfUrl || !department || !course) {
        return res.status(400).json({ error: 'Title, PDF URL, Department, and Course are required fields.' });
      }

      const totalItems = db.countPDFs();
      const newPdf = db.createPDF({
        title,
        pdfUrl,
        department,
        course,
        isVisible: isVisible !== undefined ? isVisible : true,
        sortOrder: totalItems,
        summary,
        fileSize,
        pageCount,
        author,
        category,
        coverImage,
        coverColor,
        tagline,
        isPaid: !!isPaid,
        price: Number(price) || 0,
        currency: currency || 'USD',
        paymentMethods: paymentMethods || ['bank_transfer', 'paypal'],
        paymentInstructions: paymentInstructions || ''
      });

      res.status(201).json(newPdf);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
  });

  // 2. ADMIN: Update sorting order from drag-and-drop array
  app.put('/api/pdfs/reorder', async (req, res) => {
    try {
      const { orderedIds } = req.body; // Array of IDs in new order
      if (!Array.isArray(orderedIds)) {
        return res.status(400).json({ error: 'orderedIds must be an array of IDs' });
      }

      db.reorderPDFs(orderedIds);
      res.json({ success: true, message: 'Order updated successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
  });

  // 3. USER: Fetch PDFs arranged by admin order (only visible)
  app.get('/api/user/pdfs', async (req, res) => {
    try {
      const pdfs = db.getAllPDFs(true);
      res.json(pdfs);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
  });

  // 4. USER: Track a view event
  app.post('/api/analytics/track', async (req, res) => {
    try {
      const { pdfId } = req.body;
      if (!pdfId) {
        return res.status(400).json({ error: 'pdfId is required' });
      }

      const pdf = db.getPDFById(pdfId);
      if (!pdf) {
        return res.status(404).json({ error: 'PDF not found' });
      }

      const log = db.trackView(pdfId);
      res.json({ success: true, log });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
  });

  // 5. ADMIN: Get aggregated analytics views
  app.get('/api/admin/analytics', async (req, res) => {
    try {
      const stats = db.getAggregatedAnalytics();
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
  });

  // ADMIN: Get all PDFs (including hidden ones)
  app.get('/api/admin/pdfs', async (req, res) => {
    try {
      const pdfs = db.getAllPDFs(false);
      res.json(pdfs);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
  });

  // ADMIN: Update single PDF details or visibility
  app.put('/api/admin/pdfs/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updated = db.updatePDF(id, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'PDF not found' });
      }
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
  });

  // ADMIN: Delete single PDF
  app.delete('/api/admin/pdfs/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = db.deletePDF(id);
      if (!deleted) {
        return res.status(404).json({ error: 'PDF not found' });
      }
      res.json({ success: true, message: 'PDF deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
  });

  // ADMIN: Detailed analytics breakdown
  app.get('/api/admin/analytics/detailed', async (req, res) => {
    try {
      const detailed = db.getDetailedAnalytics();
      res.json(detailed);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
  });

  // Proxy external PDF URLs to bypass browser CORS constraints when rendering in canvas
  app.get('/api/proxy-pdf', async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) {
        return res.status(400).json({ error: 'URL query parameter is required' });
      }

      // If data URI, decode and return directly
      if (url.startsWith('data:application/pdf;base64,')) {
        const base64Data = url.replace(/^data:application\/pdf;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Content-Disposition', 'inline; filename="document.pdf"');
        return res.send(buffer);
      }

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 Academic-Portal-Reader/1.0',
        },
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: `Failed to fetch PDF: ${response.statusText}` });
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Content-Disposition', 'inline; filename="document.pdf"');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.send(buffer);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to proxy PDF' });
    }
  });

  // ADMIN: Reset to sample seed data
  app.post('/api/seed', async (req, res) => {
    try {
      const result = db.resetToSeed();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
