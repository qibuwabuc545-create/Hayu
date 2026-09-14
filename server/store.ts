import fs from 'fs';
import path from 'path';

export interface IPDFPost {
  _id: string;
  title: string;
  pdfUrl: string;
  department: string;
  course: string;
  isVisible: boolean;
  sortOrder: number;
  createdAt: string;
  summary?: string;
  fileSize?: string;
  pageCount?: number;
  author?: string;
  category?: string;
  coverImage?: string;
  coverColor?: string;
  tagline?: string;
  // Payment fields
  isPaid?: boolean;
  price?: number;
  currency?: string;
  paymentMethods?: string[];
  paymentInstructions?: string;
}

export interface IUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  passwordHash?: string;
  provider: 'email' | 'google';
  createdAt: string;
}

export interface IPaymentMethodConfig {
  id: string;
  name: string;
  accountName: string;
  accountNumber: string;
  bankName?: string;
  category?: 'ethiopian' | 'crypto' | 'bank' | 'mobile' | 'other' | string;
  network?: string; // For crypto e.g. TRC20, ERC20, BEP20, Bitcoin, Solana
  qrCodeUrl?: string;
  notes?: string;
  active: boolean;
}

export interface IPaymentSettings {
  defaultCurrency: string;
  defaultInstructions: string;
  methods: IPaymentMethodConfig[];
}

export interface IPaymentOrder {
  _id: string;
  userId: string;
  userEmail: string;
  userName: string;
  pdfId: string;
  pdfTitle: string;
  course: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionRef: string;
  receiptImage?: string;
  notes?: string;
  status: 'pending' | 'released' | 'rejected';
  submittedAt: string;
  releasedAt?: string;
  adminNotes?: string;
}

export interface IUserAccess {
  userId: string;
  pdfId: string;
  grantedAt: string;
  orderId?: string;
}

export interface IAnalytics {
  _id: string;
  pdfId: string;
  viewedAt: string;
  department: string;
  course: string;
  title?: string;
  userAgent?: string;
}

const DATA_FILE = path.join(process.cwd(), 'data_store.json');

const INITIAL_PAYMENT_SETTINGS: IPaymentSettings = {
  defaultCurrency: 'USD',
  defaultInstructions: 'Please transfer the exact amount to any of our official verified payment accounts below. Include your transaction ID or reference number in the payment confirmation form. The administrator will inspect the receipt and release the book to your account.',
  methods: [
    {
      id: 'eth_telebirr',
      name: 'Telebirr (ቴሌብር)',
      accountName: 'Academic Books & Course Hub',
      accountNumber: '0911234567',
      bankName: 'Ethio Telecom Telebirr SuperApp',
      category: 'ethiopian',
      notes: 'Transfer via Telebirr App or *127#. Enter your Name/Email in remarks.',
      active: true
    },
    {
      id: 'eth_cbe_bank',
      name: 'Commercial Bank of Ethiopia (CBE)',
      accountName: 'Academic Publishing & Research PLC',
      accountNumber: '1000492819401',
      bankName: 'Commercial Bank of Ethiopia (CBE) - Main Branch',
      category: 'ethiopian',
      notes: 'Transfer via CBE Mobile Banking, CBE Birr or Bank Branch. Enter your Transaction Reference ID.',
      active: true
    },
    {
      id: 'eth_cbe_birr',
      name: 'CBEbirr Wallet (ሲቢኢ ብር)',
      accountName: 'Academic Portal CBEbirr',
      accountNumber: '0912345678',
      bankName: 'CBEbirr Mobile Wallet (*847#)',
      category: 'ethiopian',
      notes: 'Transfer via CBEbirr wallet or *847#. Include student reference.',
      active: true
    },
    {
      id: 'crypto_usdt',
      name: 'USDT (Tether - TRC20)',
      accountName: 'Academic Treasury Wallet (TRC-20)',
      accountNumber: 'TX9dJk7P2Wn8vYq6z4bZ8kLqm9RpF3gE7u',
      bankName: 'TRON Network (TRC20)',
      category: 'crypto',
      network: 'TRC20',
      notes: 'Send exact USDT amount via TRON (TRC-20) network. Paste your TxHash in confirmation.',
      active: true
    },
    {
      id: 'crypto_btc',
      name: 'Bitcoin (BTC)',
      accountName: 'Academic BTC Vault',
      accountNumber: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
      bankName: 'Bitcoin Network',
      category: 'crypto',
      network: 'Bitcoin',
      notes: 'Send BTC. Transaction will be confirmed upon 1 network confirmation.',
      active: true
    },
    {
      id: 'crypto_eth',
      name: 'Ethereum (ETH)',
      accountName: 'Academic ETH Vault',
      accountNumber: '0x71C8363837F5FB123013000407B372861E43206a',
      bankName: 'Ethereum Mainnet (ERC-20)',
      category: 'crypto',
      network: 'ERC-20',
      notes: 'Send ETH via Ethereum Network (ERC-20).',
      active: true
    },
    {
      id: 'crypto_binance',
      name: 'Binance Pay (Pay ID)',
      accountName: 'Academic Books Global',
      accountNumber: '582910482',
      bankName: 'Binance Pay App',
      category: 'crypto',
      network: 'Binance Pay',
      notes: 'Zero-fee instant transfer via Binance App > Pay > Send to Pay ID.',
      active: true
    },
    {
      id: 'bank_transfer',
      name: 'Direct Bank Wire / International Wire',
      accountName: 'Academic Course Library Ltd',
      accountNumber: '0482910482',
      bankName: 'Global Education Bank (IBAN: US89GLOB9482019482)',
      category: 'bank',
      notes: 'Please add your Student Name/Course in description',
      active: true
    },
    {
      id: 'paypal',
      name: 'PayPal / Credit Card',
      accountName: 'University Publications',
      accountNumber: 'payments@academic-courses.edu',
      category: 'mobile',
      notes: 'Send as Goods & Services or Direct Invoice payment',
      active: true
    }
  ]
};

const INITIAL_PDFS: IPDFPost[] = [
  {
    _id: 'book_psychology_money',
    title: 'The Psychology of Money',
    author: 'Morgan Housel',
    category: 'Money/Investing',
    pdfUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf',
    department: 'Business & Finance',
    course: 'FIN402',
    isVisible: true,
    sortOrder: 0,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    summary: 'Timeless lessons on wealth, greed, and happiness. Doing well with money isn’t necessarily about what you know. It’s about how you behave.',
    fileSize: '3.4 MB',
    pageCount: 256,
    coverColor: '#FFFFFF',
    tagline: 'Timeless lessons on wealth, greed, and happiness',
    isPaid: true,
    price: 9.99,
    currency: 'USD',
    paymentMethods: ['bank_transfer', 'paypal', 'cashapp_venmo'],
    paymentInstructions: 'Transfer $9.99 via Bank Transfer or PayPal to unlock full text, high-res reading pages, and offline PDF download.'
  },
  {
    _id: 'book_company_of_one',
    title: 'Company of One',
    author: 'Paul Jarvis',
    category: 'Business',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    department: 'Business & Strategy',
    course: 'MKT301',
    isVisible: true,
    sortOrder: 1,
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    summary: 'Why staying small is the next big thing for business. A refreshing guide to building a self-sustaining, profitable business on your own terms.',
    fileSize: '2.8 MB',
    pageCount: 272,
    coverColor: '#FFFFFF',
    tagline: 'Why staying small is the next big thing',
    isPaid: true,
    price: 6.50,
    currency: 'USD',
    paymentMethods: ['bank_transfer', 'paypal'],
    paymentInstructions: 'Pay $6.50 to release the complete edition with course study notes.'
  },
  {
    _id: 'book_how_innovation_works',
    title: 'How Innovation Works',
    author: 'Matt Ridley',
    category: 'Design',
    pdfUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf',
    department: 'Engineering & Tech',
    course: 'CS101',
    isVisible: true,
    sortOrder: 2,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    summary: 'And why it flourishes in freedom. Innovation is the main event of the modern age—the reason we hope for progress tomorrow.',
    fileSize: '4.1 MB',
    pageCount: 416,
    coverColor: '#F5C800',
    tagline: 'And why it flourishes in freedom',
    isPaid: false,
    price: 0,
    currency: 'USD'
  },
  {
    _id: 'book_dorian_gray',
    title: 'The Picture of Dorian Gray',
    author: 'Oscar Wilde',
    category: 'Literature & Arts',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    department: 'Arts & Humanities',
    course: 'ENG201',
    isVisible: true,
    sortOrder: 3,
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    summary: 'The philosophical gothic masterpiece exploring hedonism, vanity, aestheticism, and the moral corruption of the soul.',
    fileSize: '2.1 MB',
    pageCount: 240,
    coverColor: '#251F1F',
    tagline: 'Philosophical gothic classic',
    isPaid: true,
    price: 4.99,
    currency: 'USD',
    paymentMethods: ['bank_transfer', 'paypal', 'cashapp_venmo'],
    paymentInstructions: 'Pay $4.99 to access full annotated literary edition.'
  },
  {
    _id: 'book_two_towers',
    title: 'The Two Towers',
    author: 'J.R.R. Tolkien',
    category: 'Money/Investing',
    pdfUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf',
    department: 'Arts & Humanities',
    course: 'LIT302',
    isVisible: true,
    sortOrder: 4,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    summary: 'The epic middle volume of The Lord of the Rings, following the Fellowship divided and the battles of Rohan and Gondor.',
    fileSize: '4.8 MB',
    pageCount: 352,
    coverColor: '#0E1726',
    tagline: 'The classic fantasy epic',
    isPaid: false,
    price: 0,
    currency: 'USD'
  },
  {
    _id: 'book_objectif_lune',
    title: 'Objectif Lune',
    author: 'Hergé',
    category: 'Design',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    department: 'Design & Engineering',
    course: 'DES105',
    isVisible: true,
    sortOrder: 5,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    summary: 'The iconic pioneering lunar adventure and visual design comic chronicle by Hergé, detailing rocketry and exploration.',
    fileSize: '5.2 MB',
    pageCount: 64,
    coverColor: '#D89E4E',
    tagline: 'Iconic graphic literature',
    isPaid: true,
    price: 12.00,
    currency: 'USD',
    paymentMethods: ['bank_transfer', 'paypal'],
    paymentInstructions: 'Direct transfer $12.00 for illustrated archival master copy.'
  },
  {
    _id: 'book_subtle_art',
    title: 'The Subtle Art of Not Giving a F*ck',
    author: 'Mark Manson',
    category: 'Self Improvement',
    pdfUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf',
    department: 'Psychology',
    course: 'PSY210',
    isVisible: true,
    sortOrder: 6,
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    summary: 'A counterintuitive approach to living a good life, focusing on choosing what truly matters and letting go of the trivial.',
    fileSize: '2.5 MB',
    pageCount: 224,
    coverColor: '#E65100',
    tagline: 'A counterintuitive approach to living well',
    isPaid: false,
    price: 0,
    currency: 'USD'
  }
];

const INITIAL_USERS: IUser[] = [
  {
    id: 'user_default',
    email: 'qibuwabuc545@gmail.com',
    name: 'Davis Workman',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    provider: 'google',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString()
  },
  {
    id: 'user_alex_reed',
    email: 'alex.reed@university.edu',
    name: 'Alex Reed',
    provider: 'email',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
  }
];

const INITIAL_ORDERS: IPaymentOrder[] = [
  {
    _id: 'ord_sample_pending_1',
    userId: 'user_alex_reed',
    userEmail: 'alex.reed@university.edu',
    userName: 'Alex Reed',
    pdfId: 'book_psychology_money',
    pdfTitle: 'The Psychology of Money',
    course: 'FIN402',
    amount: 9.99,
    currency: 'USD',
    paymentMethod: 'Bank Transfer (Global Education Bank)',
    transactionRef: 'WIRE-98234-AXR',
    notes: 'Paid via mobile banking wire at 9:30 AM. Please release book.',
    status: 'pending',
    submittedAt: new Date(Date.now() - 2 * 3600000).toISOString()
  },
  {
    _id: 'ord_sample_released_1',
    userId: 'user_default',
    userEmail: 'qibuwabuc545@gmail.com',
    userName: 'Davis Workman',
    pdfId: 'book_dorian_gray',
    pdfTitle: 'The Picture of Dorian Gray',
    course: 'ENG201',
    amount: 4.99,
    currency: 'USD',
    paymentMethod: 'PayPal',
    transactionRef: 'PP-94820-DWK',
    notes: 'PayPal transaction ID: 948201984210',
    status: 'released',
    submittedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    releasedAt: new Date(Date.now() - 22 * 3600000).toISOString(),
    adminNotes: 'Payment verified in PayPal ledger. Book released to student.'
  }
];

const INITIAL_ACCESS: IUserAccess[] = [
  {
    userId: 'user_default',
    pdfId: 'book_dorian_gray',
    grantedAt: new Date(Date.now() - 22 * 3600000).toISOString(),
    orderId: 'ord_sample_released_1'
  }
];

const INITIAL_ANALYTICS: IAnalytics[] = [
  {
    _id: 'an_1',
    pdfId: 'book_psychology_money',
    title: 'The Psychology of Money',
    department: 'Business & Finance',
    course: 'FIN402',
    viewedAt: new Date(Date.now() - 48 * 3600000).toISOString()
  },
  {
    _id: 'an_2',
    pdfId: 'book_psychology_money',
    title: 'The Psychology of Money',
    department: 'Business & Finance',
    course: 'FIN402',
    viewedAt: new Date(Date.now() - 36 * 3600000).toISOString()
  },
  {
    _id: 'an_3',
    pdfId: 'book_company_of_one',
    title: 'Company of One',
    department: 'Business & Strategy',
    course: 'MKT301',
    viewedAt: new Date(Date.now() - 24 * 3600000).toISOString()
  },
  {
    _id: 'an_4',
    pdfId: 'book_how_innovation_works',
    title: 'How Innovation Works',
    department: 'Engineering & Tech',
    course: 'CS101',
    viewedAt: new Date(Date.now() - 18 * 3600000).toISOString()
  },
  {
    _id: 'an_5',
    pdfId: 'book_dorian_gray',
    title: 'The Picture of Dorian Gray',
    department: 'Arts & Humanities',
    course: 'ENG201',
    viewedAt: new Date(Date.now() - 12 * 3600000).toISOString()
  }
];

class DatabaseStore {
  private pdfs: IPDFPost[] = [];
  private analytics: IAnalytics[] = [];
  private users: IUser[] = [];
  private paymentOrders: IPaymentOrder[] = [];
  private userAccess: IUserAccess[] = [];
  private paymentSettings: IPaymentSettings = INITIAL_PAYMENT_SETTINGS;

  constructor() {
    this.loadData();
  }

  private loadData() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.pdfs && parsed.pdfs.length > 0) {
          this.pdfs = parsed.pdfs;
          this.analytics = parsed.analytics || INITIAL_ANALYTICS;
          this.users = parsed.users && parsed.users.length > 0 ? parsed.users : [...INITIAL_USERS];
          this.paymentOrders = parsed.paymentOrders || [...INITIAL_ORDERS];
          this.userAccess = parsed.userAccess || [...INITIAL_ACCESS];
          
          // Load payment settings and merge any missing core methods (Telebirr, CBE, Crypto)
          const loadedSettings = parsed.paymentSettings || INITIAL_PAYMENT_SETTINGS;
          const existingIds = new Set((loadedSettings.methods || []).map((m: any) => m.id));
          const mergedMethods = [...(loadedSettings.methods || [])];
          for (const initMethod of INITIAL_PAYMENT_SETTINGS.methods) {
            if (!existingIds.has(initMethod.id)) {
              mergedMethods.push(initMethod);
            }
          }
          this.paymentSettings = {
            ...loadedSettings,
            methods: mergedMethods
          };
          this.saveData();
          return;
        }
      }
    } catch (e) {
      console.warn('Could not read persistent store, using initial seed data:', e);
    }
    this.pdfs = [...INITIAL_PDFS];
    this.analytics = [...INITIAL_ANALYTICS];
    this.users = [...INITIAL_USERS];
    this.paymentOrders = [...INITIAL_ORDERS];
    this.userAccess = [...INITIAL_ACCESS];
    this.paymentSettings = { ...INITIAL_PAYMENT_SETTINGS };
    this.saveData();
  }

  private saveData() {
    try {
      fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(
          {
            pdfs: this.pdfs,
            analytics: this.analytics,
            users: this.users,
            paymentOrders: this.paymentOrders,
            userAccess: this.userAccess,
            paymentSettings: this.paymentSettings
          },
          null,
          2
        ),
        'utf-8'
      );
    } catch (e) {
      console.warn('Failed to persist store to file:', e);
    }
  }

  public resetToSeed() {
    this.pdfs = [...INITIAL_PDFS];
    this.analytics = [...INITIAL_ANALYTICS];
    this.users = [...INITIAL_USERS];
    this.paymentOrders = [...INITIAL_ORDERS];
    this.userAccess = [...INITIAL_ACCESS];
    this.paymentSettings = { ...INITIAL_PAYMENT_SETTINGS };
    this.saveData();
    return {
      success: true,
      pdfs: this.pdfs,
      analytics: this.analytics,
      orders: this.paymentOrders,
      users: this.users
    };
  }

  // --- USER AUTHENTICATION OPERATIONS ---
  public registerUser(data: { email: string; name: string; password?: string; avatar?: string }): IUser {
    const existing = this.users.find(u => u.email.toLowerCase() === data.email.toLowerCase());
    if (existing) {
      return existing;
    }
    const newUser: IUser = {
      id: 'usr_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      email: data.email.toLowerCase(),
      name: data.name || data.email.split('@')[0],
      avatar: data.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(data.email)}`,
      provider: 'email',
      createdAt: new Date().toISOString()
    };
    this.users.push(newUser);
    this.saveData();
    return newUser;
  }

  public loginWithGoogle(data: { email: string; name?: string; avatar?: string }): IUser {
    const email = data.email.toLowerCase();
    let user = this.users.find(u => u.email === email);
    if (!user) {
      user = {
        id: 'usr_g_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
        email,
        name: data.name || email.split('@')[0],
        avatar: data.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name || email)}`,
        provider: 'google',
        createdAt: new Date().toISOString()
      };
      this.users.push(user);
    } else {
      if (data.name) user.name = data.name;
      if (data.avatar) user.avatar = data.avatar;
    }
    this.saveData();
    return user;
  }

  public getUserById(id: string): IUser | undefined {
    return this.users.find(u => u.id === id);
  }

  public getUserByEmail(email: string): IUser | undefined {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public getAllUsers(): IUser[] {
    return this.users;
  }

  // --- PAYMENT SETTINGS ---
  public getPaymentSettings(): IPaymentSettings {
    return this.paymentSettings;
  }

  public updatePaymentSettings(settings: Partial<IPaymentSettings>): IPaymentSettings {
    this.paymentSettings = {
      ...this.paymentSettings,
      ...settings
    };
    this.saveData();
    return this.paymentSettings;
  }

  // --- PAYMENT ORDERS & BOOK RELEASING ---
  public createPaymentOrder(data: {
    userId: string;
    userEmail: string;
    userName: string;
    pdfId: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    transactionRef: string;
    receiptImage?: string;
    notes?: string;
  }): IPaymentOrder {
    const pdf = this.getPDFById(data.pdfId);
    const newOrder: IPaymentOrder = {
      _id: 'ord_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      userId: data.userId,
      userEmail: data.userEmail,
      userName: data.userName,
      pdfId: data.pdfId,
      pdfTitle: pdf ? pdf.title : 'Course Document',
      course: pdf ? pdf.course : 'Course',
      amount: data.amount,
      currency: data.currency || 'USD',
      paymentMethod: data.paymentMethod,
      transactionRef: data.transactionRef,
      receiptImage: data.receiptImage,
      notes: data.notes,
      status: 'pending',
      submittedAt: new Date().toISOString()
    };

    this.paymentOrders.unshift(newOrder);
    this.saveData();
    return newOrder;
  }

  public getAllOrders(): IPaymentOrder[] {
    return this.paymentOrders;
  }

  public getOrdersByUserId(userId: string): IPaymentOrder[] {
    return this.paymentOrders.filter(o => o.userId === userId || o.userEmail === userId);
  }

  public getOrderById(id: string): IPaymentOrder | undefined {
    return this.paymentOrders.find(o => o._id === id);
  }

  public releaseBookForOrder(orderId: string, adminNotes?: string): IPaymentOrder | null {
    const order = this.paymentOrders.find(o => o._id === orderId);
    if (!order) return null;

    order.status = 'released';
    order.releasedAt = new Date().toISOString();
    if (adminNotes) order.adminNotes = adminNotes;

    // Grant access
    this.grantUserAccess(order.userId, order.pdfId, order._id);
    
    // Also grant by email if user has alternative id
    const user = this.getUserByEmail(order.userEmail);
    if (user && user.id !== order.userId) {
      this.grantUserAccess(user.id, order.pdfId, order._id);
    }

    this.saveData();
    return order;
  }

  public rejectOrder(orderId: string, adminNotes?: string): IPaymentOrder | null {
    const order = this.paymentOrders.find(o => o._id === orderId);
    if (!order) return null;

    order.status = 'rejected';
    if (adminNotes) order.adminNotes = adminNotes;

    // Revoke access if granted before
    this.revokeUserAccess(order.userId, order.pdfId);

    this.saveData();
    return order;
  }

  public deleteOrder(orderId: string): boolean {
    const prev = this.paymentOrders.length;
    this.paymentOrders = this.paymentOrders.filter(o => o._id !== orderId);
    this.saveData();
    return this.paymentOrders.length !== prev;
  }

  // --- ACCESS CONTROL ---
  public grantUserAccess(userId: string, pdfId: string, orderId?: string): IUserAccess {
    const existing = this.userAccess.find(a => a.userId === userId && a.pdfId === pdfId);
    if (existing) {
      if (orderId) existing.orderId = orderId;
      return existing;
    }
    const access: IUserAccess = {
      userId,
      pdfId,
      grantedAt: new Date().toISOString(),
      orderId
    };
    this.userAccess.push(access);
    this.saveData();
    return access;
  }

  public revokeUserAccess(userId: string, pdfId: string): boolean {
    const prev = this.userAccess.length;
    this.userAccess = this.userAccess.filter(a => !(a.userId === userId && a.pdfId === pdfId));
    this.saveData();
    return this.userAccess.length !== prev;
  }

  public getUserAccess(userId: string): IUserAccess[] {
    const user = this.getUserById(userId) || this.getUserByEmail(userId);
    const ids = [userId];
    if (user) {
      ids.push(user.id, user.email);
    }
    return this.userAccess.filter(a => ids.includes(a.userId));
  }

  public hasAccessToPDF(userId: string | undefined, pdfId: string): boolean {
    const pdf = this.getPDFById(pdfId);
    if (!pdf) return false;
    // If not paid (free document), everyone has access
    if (!pdf.isPaid || pdf.price === 0) {
      return true;
    }
    if (!userId) return false;

    const user = this.getUserById(userId) || this.getUserByEmail(userId);
    const searchIds = [userId];
    if (user) {
      searchIds.push(user.id, user.email);
    }
    return this.userAccess.some(a => searchIds.includes(a.userId) && a.pdfId === pdfId);
  }

  // --- PDF Operations ---
  public getAllPDFs(onlyVisible: boolean = false): IPDFPost[] {
    const list = onlyVisible ? this.pdfs.filter(p => p.isVisible) : this.pdfs;
    return [...list].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  public getPDFById(id: string): IPDFPost | undefined {
    return this.pdfs.find(p => p._id === id);
  }

  public countPDFs(): number {
    return this.pdfs.length;
  }

  public createPDF(data: Partial<IPDFPost>): IPDFPost {
    const totalItems = this.pdfs.length;
    const newPdf: IPDFPost = {
      _id: 'book_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      title: data.title || 'Untitled Document',
      author: data.author || 'Academic Faculty',
      category: data.category || 'General',
      pdfUrl: data.pdfUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      department: data.department || 'General',
      course: data.course || 'GEN 100',
      isVisible: data.isVisible !== undefined ? data.isVisible : true,
      sortOrder: data.sortOrder !== undefined ? data.sortOrder : totalItems,
      createdAt: data.createdAt || new Date().toISOString(),
      summary: data.summary || '',
      fileSize: data.fileSize || '1.2 MB',
      pageCount: data.pageCount || 10,
      coverColor: data.coverColor || '#2563EB',
      tagline: data.tagline || '',
      isPaid: data.isPaid || false,
      price: data.price !== undefined ? data.price : 0,
      currency: data.currency || 'USD',
      paymentMethods: data.paymentMethods || ['bank_transfer', 'paypal'],
      paymentInstructions: data.paymentInstructions || ''
    };

    this.pdfs.push(newPdf);
    this.saveData();
    return newPdf;
  }

  public updatePDF(id: string, updates: Partial<IPDFPost>): IPDFPost | null {
    const index = this.pdfs.findIndex(p => p._id === id);
    if (index === -1) return null;

    this.pdfs[index] = {
      ...this.pdfs[index],
      ...updates
    };

    this.saveData();
    return this.pdfs[index];
  }

  public deletePDF(id: string): boolean {
    const prevLen = this.pdfs.length;
    this.pdfs = this.pdfs.filter(p => p._id !== id);
    if (this.pdfs.length !== prevLen) {
      // Re-index remaining items sort orders
      this.pdfs.forEach((p, idx) => {
        p.sortOrder = idx;
      });
      this.saveData();
      return true;
    }
    return false;
  }

  public reorderPDFs(orderedIds: string[]): boolean {
    const idMap = new Map(orderedIds.map((id, index) => [id, index]));
    
    this.pdfs.sort((a, b) => {
      const orderA = idMap.has(a._id) ? (idMap.get(a._id) as number) : a.sortOrder;
      const orderB = idMap.has(b._id) ? (idMap.get(b._id) as number) : b.sortOrder;
      return orderA - orderB;
    });

    this.pdfs.forEach((p, index) => {
      p.sortOrder = index;
    });

    this.saveData();
    return true;
  }

  // Analytics Operations
  public trackView(pdfId: string, userAgent?: string): IAnalytics {
    const pdf = this.getPDFById(pdfId);
    const log: IAnalytics = {
      _id: 'an_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      pdfId,
      viewedAt: new Date().toISOString(),
      department: pdf ? pdf.department : 'General',
      course: pdf ? pdf.course : 'GEN 100',
      title: pdf ? pdf.title : 'Document',
      userAgent
    };

    this.analytics.push(log);
    this.saveData();
    return log;
  }

  public getAggregatedAnalytics() {
    const map = new Map<string, { totalViews: number; department: string }>();

    this.analytics.forEach(log => {
      const existing = map.get(log.course) || { totalViews: 0, department: log.department };
      existing.totalViews += 1;
      map.set(log.course, existing);
    });

    const result: { _id: string; totalViews: number; department: string }[] = [];
    map.forEach((val, course) => {
      result.push({
        _id: course,
        totalViews: val.totalViews,
        department: val.department
      });
    });

    return result.sort((a, b) => b.totalViews - a.totalViews);
  }

  public getDetailedAnalytics() {
    const aggregated = this.getAggregatedAnalytics();

    // PDF views map
    const pdfMap = new Map<string, number>();
    this.analytics.forEach(log => {
      pdfMap.set(log.pdfId, (pdfMap.get(log.pdfId) || 0) + 1);
    });

    const pdfStats = this.pdfs.map(p => ({
      pdfId: p._id,
      title: p.title,
      course: p.course,
      department: p.department,
      views: pdfMap.get(p._id) || 0
    })).sort((a, b) => b.views - a.views);

    // Department views map
    const deptMap = new Map<string, number>();
    this.analytics.forEach(log => {
      deptMap.set(log.department, (deptMap.get(log.department) || 0) + 1);
    });

    const departmentStats: { department: string; totalViews: number }[] = [];
    deptMap.forEach((views, department) => {
      departmentStats.push({ department, totalViews: views });
    });

    return {
      aggregated,
      pdfStats,
      departmentStats: departmentStats.sort((a, b) => b.totalViews - a.totalViews),
      recentActivity: [...this.analytics].reverse().slice(0, 50),
      totalViews: this.analytics.length,
      totalDocuments: this.pdfs.length
    };
  }

  // --- Admin & Shareable Links Support ---
  public shareableLinks: any[] = [];

  public getAdminById(adminId: string) {
    if (adminId === 'admin_master') {
      return { id: 'admin_master', email: 'admin@thebookshub.edu', name: 'Master Administrator', role: 'super_admin' };
    }
    const user = this.getUserById(adminId);
    if (user) {
      return { id: user.id, email: user.email, name: user.name, role: 'admin' };
    }
    return { id: adminId, email: 'admin@thebookshub.edu', name: 'Academic Admin', role: 'admin' };
  }

  public authenticateAdmin(email: string, _password: string) {
    if (email) {
      return {
        id: 'admin_master',
        email: email,
        name: 'Curriculum Administrator',
        role: 'super_admin' as const
      };
    }
    return null;
  }

  public createShareableLink(link: any) {
    this.shareableLinks.push(link);
    this.saveData();
    return link;
  }

  public getAllShareableLinks() {
    return this.shareableLinks;
  }

  public getShareableLinksByUserId(userId: string) {
    return this.shareableLinks.filter(l => l.userId === userId);
  }

  public deactivateShareableLink(linkId: string) {
    const link = this.shareableLinks.find(l => l.id === linkId || l.token === linkId);
    if (link) {
      link.isActive = false;
      this.saveData();
      return link;
    }
    return null;
  }

  public deleteShareableLink(linkId: string) {
    const idx = this.shareableLinks.findIndex(l => l.id === linkId || l.token === linkId);
    if (idx !== -1) {
      this.shareableLinks.splice(idx, 1);
      this.saveData();
      return true;
    }
    return false;
  }

  public recordShareableLinkAccess(linkId: string) {
    const link = this.shareableLinks.find(l => l.id === linkId || l.token === linkId);
    if (link) {
      link.accessCount = (link.accessCount || 0) + 1;
      link.lastAccessedAt = new Date().toISOString();
      this.saveData();
    }
  }
}

export const db = new DatabaseStore();

