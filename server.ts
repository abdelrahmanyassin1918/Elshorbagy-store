import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

let currentDirname = process.cwd();
try {
  const isEsm = typeof import.meta !== 'undefined' && !!import.meta.url;
  if (isEsm) {
    const url = (import.meta as any).url;
    if (url) {
      currentDirname = path.dirname(fileURLToPath(url));
    }
  } else {
    // @ts-ignore
    currentDirname = __dirname;
  }
} catch (e) {
  currentDirname = process.cwd();
}

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Type definitions to keep typescript compiled output clean
interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  discountPrice?: number;
  discountPercentage?: number;
  image: string;
  images: string[];
  category: string;
  brand: string;
  rating: number;
  reviewsCount: number;
  featured?: boolean;
  isSpecialOffer?: boolean;
  specs: { [key: string]: string };
  stock: number; // dynamically added stock
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface OrderDetails {
  orderId: string;
  items: CartItem[];
  customerInfo: {
    name: string;
    phone: string;
    governorate: string;
    city: string;
    address: string;
  };
  subtotal: number;
  shipping: number;
  total: number;
  date: string;
}

const PORT = Number(process.env.PORT) || 3000;
const isVercel = !!process.env.VERCEL;
const DB_PATH = isVercel ? path.join('/tmp', 'data-db.json') : path.join(process.cwd(), 'data-db.json');

// Ensure db directory or file exists with preseeded data
const getInitialData = () => {
  // Let's import the arrays from the source code if possible, or define fallbacks
  let initialProducts: any[] = [];
  try {
    // Read PRODUCTS directly from src/data.ts to pre-seed
    const dataContent = fs.readFileSync(path.join(process.cwd(), 'src/data.ts'), 'utf-8');
    // Extract products by matching JSON structure or evaluate
    // But to keep it extremely robust and fast, let's write custom seeding parser or fallbacks
  } catch (e) {
    console.error('Error reading static data', e);
  }

  // Pre-seeded products with initial stocks
  const defaultProducts = [
    {
      id: 'persil-gel-3l',
      title: 'برسيل جل للغسالات الأوتوماتيك بنسيم لافندر - 3 لتر + 1 لتر مجاناً',
      description: 'برسيل جل بقوة التكنولوجيا الألمانية بديل المسحوق التقليدي، ينظف الملابس البيضاء والملونة بعمق ويترك رائحة اللافندر المنعشة تدوم طويلاً، مع توفير كامل وحماية تامة للغسالة من الترسبات.',
      price: 380,
      discountPrice: 320,
      discountPercentage: 16,
      image: 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&q=80&w=800',
      images: ['https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&q=80&w=800'],
      category: 'powders_detergents',
      brand: 'برسيل',
      rating: 4.8,
      reviewsCount: 142,
      featured: true,
      isSpecialOffer: false,
      specs: { 'الحجم': '3 لتر + 1 لتر إضافي', 'النوع': 'منظف غسيل سائل (جل)', 'نوع الغسالة': 'أوتوماتيك وفوق أوتوماتيك' },
      stock: 45
    },
    {
      id: 'ariel-powder-6kg',
      title: 'أريال مسحوق غسيل بودرة للغسالات الأوتوماتيك - وزن 6 كيلو جرام',
      description: 'أريال المسحوق الأول عالمياً في إزالة البقع الصعبة من غسلة واحدة لملابس ناصعة البياض بفضل حبيبات التنظيف النشطة والتركيبة الفعالة ضد أصعب الدهون والأوساخ مع حماية الأنسجة.',
      price: 490,
      discountPrice: 425,
      discountPercentage: 13,
      image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&q=80&w=800',
      images: ['https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&q=80&w=800'],
      category: 'powders_detergents',
      brand: 'أريال',
      rating: 4.7,
      reviewsCount: 96,
      featured: true,
      isSpecialOffer: false,
      specs: { 'الوزن': '6 كيلو جرام', 'النوع': 'مسحوق غسيل بودرة', 'الاستخدام': 'غسالات أوتوماتيك' },
      stock: 30
    },
    {
      id: 'dettol-soap-4pack',
      title: 'صابون ديتول الأصلي مضاد للبكتيريا والجراثيم - عرض 4 قطع × 120 جرام',
      description: 'صابون ديتول الأصلي لغسيل اليدين والجسم بتركيبة معقمة ذات فعالية مطلقة تقضي على 99.9% من الجراثيم والبكتيريا، مع الحفاظ على ترطيب البشرة وحيويتها الطبيعية يومياً.',
      price: 135,
      discountPrice: 99,
      discountPercentage: 27,
      image: 'https://images.unsplash.com/photo-1607006342411-9a336f168f19?auto=format&fit=crop&q=80&w=800',
      images: ['https://images.unsplash.com/photo-1607006342411-9a336f168f19?auto=format&fit=crop&q=80&w=800'],
      category: 'soap_liquid',
      brand: 'ديتول',
      rating: 4.9,
      reviewsCount: 215,
      featured: true,
      isSpecialOffer: true,
      specs: { 'العدد': '4 صابونات في العبوة', 'الوزن للقطعة': '120 جرام', 'النوع': 'صابون صلب مطهر' },
      stock: 80
    },
    {
      id: 'pril-dishwash-1l',
      title: 'بريل سائل غسيل الأطباق الفائق وقاهر الدهون بالليمون - 1 لتر',
      description: 'بريل الأصلي بقوة خمس طبقات لمعان لإزالة الأوساخ المستعصية والدهون الجافة من الصحون والحلل دون بذل مجهود شاق، آمن تماماً على اليدين ويمنح المطبخ رائحة ليمون برّاقة ونظافة لا تضاهى.',
      price: 60,
      discountPrice: 48,
      discountPercentage: 20,
      image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800',
      images: ['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800'],
      category: 'soap_liquid',
      brand: 'بريل',
      rating: 4.6,
      reviewsCount: 88,
      featured: true,
      isSpecialOffer: false,
      specs: { 'الحجم': '1 لتر (1000 مل)', 'العطر': 'ليمون مركز' },
      stock: 120
    },
    {
      id: 'fine-tissues-3pack',
      title: 'مناديل فاين كلاسيك معقمة وفائقة النعومة - عبوة 550 منديل (عرض 3 علب)',
      description: 'مناديل ورقية ناعمة جداً من فاين كلاسيك ثلاثية الطبقات لتأمين أعلى مستويات الامتصاص والمتانة مع الحفاظ على نعومة مذهلة ومريحة للبشرة الحساسة، معقمة بتقنية ستيريبرو لمنع انتقال الجراثيم.',
      price: 155,
      discountPrice: 125,
      discountPercentage: 19,
      image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&q=80&w=800',
      images: ['https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&q=80&w=800'],
      category: 'paper_products',
      brand: 'فاين',
      rating: 4.8,
      reviewsCount: 174,
      featured: true,
      isSpecialOffer: true,
      specs: { 'العدد في العلبة': '550 منديل سحب', 'العرض الكلي': '3 علب عائلية' },
      stock: 65
    }
  ];

  return {
    products: defaultProducts,
    banner: {
      badge: '🧼 النظافة والبريق في جيبك • أسعار جملة الجملة',
      title: 'الشوربجي للمنظفات والورقيات في مصر',
      subtitle: 'نوفر لكم أكبر تشكيلة من مساحيق الغسيل، مطهرات ديتول، صابون المواعين، والورقيات والمناديل المعقمة بأقصى توفير وأسرع خدمة شحن لباب بيتك!',
      image: 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&q=80&w=1200'
    },
    orders: [],
    adminSettings: {
      username: 'admin',
      password: '123',
      users: [
        { username: 'admin', password: '123', name: 'المدير العام' }
      ]
    }
  };
};

// Database utility functions
let cachedDB: any = null;
let firestoreDb: any = null;
let isFirestoreDisabled = false;
let lastLoadedTime = 0;
let activeLoadPromise: Promise<any> | null = null;

// Initialize Firebase Admin safely
try {
  const isVercel = !!process.env.VERCEL;
  let config: any = null;
  const configPaths = [
    path.join(process.cwd(), 'firebase-applet-config.json'),
    path.join(process.cwd(), '..', 'firebase-applet-config.json'),
    path.join(currentDirname, 'firebase-applet-config.json'),
    path.join(currentDirname, '..', 'firebase-applet-config.json')
  ];
  
  for (const p of configPaths) {
    if (fs.existsSync(p)) {
      try {
        config = JSON.parse(fs.readFileSync(p, 'utf-8'));
        console.log('Loaded firebase config from:', p);
        break;
      } catch (e) {}
    }
  }

  // Fallback to hardcoded configuration in case Vercel doesn't bundle the config file and not captured above
  if (!config) {
    console.log('⚠️ Could not physically find firebase-applet-config.json. Using hardcoded workspace config.');
    config = {
      projectId: process.env.FIREBASE_PROJECT_ID || "elshorbagy-store-c573e",
      firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID || "ai-studio-ef7eeffb-99a4-4341-a6aa-88b74a031ad1"
    };
  } else {
    // Sync environment overrides if set
    if (process.env.FIREBASE_PROJECT_ID) {
      config.projectId = process.env.FIREBASE_PROJECT_ID;
    }
    if (process.env.FIREBASE_DATABASE_ID) {
      config.firestoreDatabaseId = process.env.FIREBASE_DATABASE_ID;
    }
  }

  const isGoogleCloud = !!(process.env.K_SERVICE || process.env.GOOGLE_CLOUD_PROJECT || process.env.GOOGLE_APPLICATION_CREDENTIALS);
  const saEnv = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  
  if (!isGoogleCloud && !isVercel && !saEnv) {
    console.log('⚠️ Running locally outside Google Cloud. Disabling Firestore to prevent credential crashes. Using local JSON database (data-db.json).');
    isFirestoreDisabled = true;
    firestoreDb = null;
  } else if (isVercel && !saEnv) {
    console.log('⚠️ Running on Vercel without Firebase credentials. Disabling Firestore to prevent crashes. Using local JSON database (data-db.json).');
    isFirestoreDisabled = true;
    firestoreDb = null;
  } else {
    let app;
    if (getApps().length === 0) {
      let credential;
      let projectId = process.env.FIREBASE_PROJECT_ID || config.projectId;
      
      // AI Studio specific: if running on Google Cloud without a service account key,
      // the container uses Application Default Credentials of the AI Studio host project.
      // If the config projectId is different, it will throw PERMISSION_DENIED.
      if (process.env.GOOGLE_CLOUD_PROJECT && !saEnv && projectId !== process.env.GOOGLE_CLOUD_PROJECT) {
        console.log(`ℹ️ Overriding config projectId "${projectId}" with host projectId "${process.env.GOOGLE_CLOUD_PROJECT}" because no service account was provided.`);
        projectId = process.env.GOOGLE_CLOUD_PROJECT;
      }
      
      if (saEnv) {
        try {
          let serviceAccount: any = null;
          let cleanSaEnv = saEnv.trim();

          // Strip surrounding single or double quotes if added by Vercel UI
          if (cleanSaEnv.startsWith('"') && cleanSaEnv.endsWith('"')) {
            cleanSaEnv = cleanSaEnv.substring(1, cleanSaEnv.length - 1).trim();
          } else if (cleanSaEnv.startsWith("'") && cleanSaEnv.endsWith("'")) {
            cleanSaEnv = cleanSaEnv.substring(1, cleanSaEnv.length - 1).trim();
          }

          if (cleanSaEnv.startsWith('{')) {
            serviceAccount = JSON.parse(cleanSaEnv);
          } else if (fs.existsSync(cleanSaEnv)) {
            serviceAccount = JSON.parse(fs.readFileSync(cleanSaEnv, 'utf-8'));
          } else {
            // Try base64 decoded if they encoded it
            try {
              const decoded = Buffer.from(cleanSaEnv, 'base64').toString('utf-8').trim();
              if (decoded.startsWith('{')) {
                serviceAccount = JSON.parse(decoded);
              }
            } catch (e) {}
          }

          if (serviceAccount) {
            // Crucial Vercel fix for private key newline replacement
            if (serviceAccount.private_key && typeof serviceAccount.private_key === 'string') {
              serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
            }
            credential = cert(serviceAccount);
            if (serviceAccount.project_id) {
              projectId = serviceAccount.project_id;
            }
            console.log('Using Firebase service account credentials from environment variables. Project:', projectId);
          } else {
            console.warn('⚠️ Could not parse credentials from FIREBASE_SERVICE_ACCOUNT. Running unauthenticated.');
          }
        } catch (e: any) {
          console.error('Failed to parse Firebase service account JSON from environment:', e.message);
        }
      }
      
      app = initializeApp({
        projectId: projectId,
        ...(credential ? { credential } : {})
      });
    } else {
      app = getApps()[0];
    }
    
    // On Vercel or when custom service account is set, prioritize the standard (default) database unless they explicitly define FIREBASE_DATABASE_ID
    const dbId = process.env.FIREBASE_DATABASE_ID || (process.env.FIREBASE_SERVICE_ACCOUNT ? "(default)" : config.firestoreDatabaseId) || "(default)";
    firestoreDb = dbId && dbId !== '(default)' ? getFirestore(app, dbId) : getFirestore(app);
    console.log('Firebase Admin initialized successfully with database:', dbId, 'for project:', app.options?.projectId || 'unknown');
  }
} catch (error) {
  console.error('Firebase Admin initialization failed, relying on local filesystem:', error);
}

// Seed helper
async function seedFirestore(data: any) {
  if (!firestoreDb) return;
  try {
    const batch = firestoreDb.batch();
    
    // Seed products
    for (const p of data.products) {
      const { id, ...pData } = p;
      const ref = firestoreDb.collection('products').doc(id);
      batch.set(ref, pData);
    }

    // Seed banner and admin settings
    const bannerRef = firestoreDb.collection('settings').doc('banner');
    batch.set(bannerRef, data.banner);

    const adminRef = firestoreDb.collection('settings').doc('admin');
    batch.set(adminRef, data.adminSettings);

    await batch.commit();
    console.log('Firestore seeded successfully with initial products and settings!');
  } catch (err) {
    console.error('Failed to seed Firestore:', err);
  }
}

// Asynchronous timeout helper to prevent hanging database connections and timeouts
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallbackValue: T): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((resolve) => {
    timeoutId = setTimeout(() => {
      console.warn(`⚠️ Operation timed out after ${timeoutMs}ms. Falling back to local data.`);
      resolve(fallbackValue);
    }, timeoutMs);
  });
  
  return Promise.race([
    promise.then((res) => {
      clearTimeout(timeoutId);
      return res;
    }),
    timeoutPromise
  ]);
}

// Read database with Firestore support and fallback
async function loadDB(): Promise<any> {
  const now = Date.now();
  
  // If we have a fresh cache (less than 3 seconds old), return it
  if (cachedDB && (now - lastLoadedTime < 3000)) {
    return cachedDB;
  }

  // Coalesce multiple concurrent loads into a single promise
  if (activeLoadPromise) {
    return activeLoadPromise;
  }

  activeLoadPromise = (async () => {
    let localData: any = null;
    try {
      // First load from local file to guarantee we have a quick fallback
      if (fs.existsSync(DB_PATH)) {
        try {
          localData = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        } catch (e) {
          console.error('Error reading local DB:', e);
        }
      }

      if (!localData) {
        const projectDbPath = path.join(process.cwd(), 'data-db.json');
        if (fs.existsSync(projectDbPath)) {
          try {
            console.log('Initializing temporary database from project data-db.json');
            localData = JSON.parse(fs.readFileSync(projectDbPath, 'utf-8'));
          } catch (e) {
            console.error('Error reading project data-db.json:', e);
          }
        }
        
        if (!localData) {
          localData = getInitialData();
        }
        
        try {
          fs.writeFileSync(DB_PATH, JSON.stringify(localData, null, 2), 'utf-8');
        } catch (e) {
          console.error('Error writing initialized database to DB_PATH:', e);
        }
      }

      if (localData && localData.adminSettings && (!localData.adminSettings.users || !Array.isArray(localData.adminSettings.users))) {
        localData.adminSettings.users = [
          { username: localData.adminSettings.username || 'admin', password: localData.adminSettings.password || '123', name: 'المدير العام' }
        ];
      }

      // If Firestore is available, load from it. Local offline checks are done at initialization.
      if (firestoreDb) {
        try {
          console.log('Fetching state from Firestore (with 4s timeout)...');
          
          // Load products with 4s timeout
          const productsPromise = firestoreDb.collection('products').get();
          const productsSnap = await withTimeout(productsPromise, 4000, null);
          
          if (!productsSnap) {
            throw new Error('Firestore read timed out or failed');
          }

          let productsList: any[] = [];
          productsSnap.forEach((doc: any) => {
            productsList.push({ id: doc.id, ...doc.data() });
          });

          // Load orders with 4s timeout
          const ordersPromise = firestoreDb.collection('orders').get();
          const ordersSnap = await withTimeout(ordersPromise, 4000, null);
          
          let ordersList: any[] = [];
          if (ordersSnap) {
            ordersSnap.forEach((doc: any) => {
              ordersList.push(doc.data());
            });
            // Sort orders by timestamp descending locally
            ordersList.sort((a, b) => {
              return new Date(b.dateKey || 0).getTime() - new Date(a.dateKey || 0).getTime();
            });
          }

          // Load settings (banner & admin) with 4s timeout
          const bannerPromise = firestoreDb.collection('settings').doc('banner').get();
          const adminPromise = firestoreDb.collection('settings').doc('admin').get();
          
          const [bannerDoc, adminDoc] = await Promise.all([
            withTimeout(bannerPromise, 4000, null),
            withTimeout(adminPromise, 4000, null)
          ]);

          let banner = localData.banner;
          if (bannerDoc && bannerDoc.exists) {
            banner = bannerDoc.data();
          }

          let adminSettings = localData.adminSettings;
          if (adminDoc && adminDoc.exists) {
            adminSettings = adminDoc.data() || {};
          }
          if (!adminSettings.users || !Array.isArray(adminSettings.users) || adminSettings.users.length === 0) {
            adminSettings.users = [
              { username: adminSettings.username || 'admin', password: adminSettings.password || '123', name: 'المدير العام' }
            ];
          }

          // If Firestore had data, merge it into local cache
          if (productsList.length > 0) {
            console.log('Syncing in-memory DB with Firestore data');
            localData.products = productsList;
            localData.orders = ordersList;
            localData.banner = banner;
            localData.adminSettings = adminSettings;
            
            // Update local file for redundancy
            try {
              fs.writeFileSync(DB_PATH, JSON.stringify(localData, null, 2), 'utf-8');
            } catch (e) {
              console.error('Error writing redundant cache:', e);
            }
          } else {
            // Firestore is empty! Seed Firestore with initial data
            console.log('Firestore is empty. Seeding Firestore with initial data...');
            await seedFirestore(localData);
          }
        } catch (err) {
          console.error('Firestore loading failed, falling back to local storage:', err);
        }
      }

      // Ensure localData has all required properties with robust defaults to prevent crashes
      if (!localData) {
        localData = {};
      }
      if (!localData.products || !Array.isArray(localData.products)) {
        localData.products = [];
      }
      if (!localData.orders || !Array.isArray(localData.orders)) {
        localData.orders = [];
      }
      if (!localData.banner) {
        localData.banner = {
          badge: '🧼 النظافة والبريق في جيبك • أسعار جملة الجملة',
          title: 'الشوربجي للمنظفات والورقيات في مصر',
          subtitle: 'نوفر لكم أكبر تشكيلة من مساحيق الغسيل، مطهرات ديتول، صابون المواعين، والورقيات والمناديل المعقمة بأقصى توفير وأسرع خدمة شحن لباب بيتك!',
          image: 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&q=80&w=1200'
        };
      }
      if (!localData.adminSettings) {
        localData.adminSettings = {
          username: 'admin',
          password: '123',
          users: [
            { username: 'admin', password: '123', name: 'المدير العام' }
          ]
        };
      }
      if (!localData.adminSettings.users || !Array.isArray(localData.adminSettings.users) || localData.adminSettings.users.length === 0) {
        localData.adminSettings.users = [
          { username: localData.adminSettings.username || 'admin', password: localData.adminSettings.password || '123', name: 'المدير العام' }
        ];
      }

      cachedDB = localData;
      lastLoadedTime = Date.now();
      return cachedDB;
    } catch (err) {
      console.error('Critical failure in activeLoadPromise:', err);
      const fallback = localData || getInitialData();
      if (!fallback.adminSettings) fallback.adminSettings = { username: 'admin', password: '123', users: [{ username: 'admin', password: '123', name: 'المدير العام' }] };
      if (!fallback.adminSettings.users) fallback.adminSettings.users = [{ username: 'admin', password: '123', name: 'المدير العام' }];
      return fallback;
    } finally {
      activeLoadPromise = null;
    }
  })();

  return activeLoadPromise;
}

// Save database with write-through
async function saveDB(data: any) {
  const oldData = cachedDB || { products: [], orders: [], banner: {}, adminSettings: {} };
  cachedDB = JSON.parse(JSON.stringify(data)); // Deep copy to prevent side-effects
  lastLoadedTime = Date.now(); // Keep cache freshly updated
  
  // 1. Write to local file first (fast & secure)
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing to local DB:', e);
  }

  // 2. Write to Firestore (AWAITED delta updates)
  if (firestoreDb) {
    try {
      const promises: Promise<any>[] = [];

      // Compare banner
      if (JSON.stringify(data.banner) !== JSON.stringify(oldData.banner)) {
        console.log('[Firestore Sync] Banner changed, updating...');
        promises.push(firestoreDb.collection('settings').doc('banner').set(data.banner));
      }

      // Compare adminSettings
      if (JSON.stringify(data.adminSettings) !== JSON.stringify(oldData.adminSettings)) {
        console.log('[Firestore Sync] Admin settings changed, updating...');
        promises.push(firestoreDb.collection('settings').doc('admin').set(data.adminSettings));
      }

      // Compare products
      const oldProductsMap = new Map(oldData.products.map((p: any) => [p.id, p]));
      const newProductsMap = new Map(data.products.map((p: any) => [p.id, p]));

      // Find added or updated products
      for (const p of data.products) {
        const oldP = oldProductsMap.get(p.id);
        if (!oldP || JSON.stringify(p) !== JSON.stringify(oldP)) {
          console.log(`[Firestore Sync] Product ${p.id} added or updated, saving...`);
          const { id, ...pData } = p;
          promises.push(firestoreDb.collection('products').doc(id).set(pData));
        }
      }

      // Find deleted products
      for (const oldP of oldData.products) {
        if (!newProductsMap.has(oldP.id)) {
          console.log(`[Firestore Sync] Product ${oldP.id} deleted, removing...`);
          promises.push(firestoreDb.collection('products').doc(oldP.id).delete());
        }
      }

      // Compare orders
      const oldOrdersMap = new Map(oldData.orders.map((o: any) => [o.orderId, o]));
      for (const order of data.orders) {
        const oldO = oldOrdersMap.get(order.orderId);
        if (!oldO || JSON.stringify(order) !== JSON.stringify(oldO)) {
          console.log(`[Firestore Sync] Order ${order.orderId} added or updated, saving...`);
          const docId = order.orderId.replace(/[^a-zA-Z0-9_\u0600-\u06FF]+/g, '_');
          promises.push(firestoreDb.collection('orders').doc(docId).set(order));
        }
      }

      // Await ALL the database writes concurrently before returning!
      // This is super critical so Vercel keeps the lambda alive until everything is safely persisted!
      if (promises.length > 0) {
        await Promise.all(promises);
        console.log(`[Firestore Sync] Successfully synced ${promises.length} changes to Firestore.`);
      }
    } catch (err) {
      console.error('Error syncing changes to Firestore:', err);
    }
  }
}

const app = express();
app.use(express.json());

// URL normalization middleware for Vercel/serverless environments
app.use((req, res, next) => {
  console.log(`[Request] ${req.method} ${req.url}`);
  // If the path does not start with /api, but starts with /state, /products, /orders, /banner, or /admin, prefix it with /api
  if (req.url && !req.url.startsWith('/api') && (
    req.url.startsWith('/state') || 
    req.url.startsWith('/products') || 
    req.url.startsWith('/orders') || 
    req.url.startsWith('/banner') || 
    req.url.startsWith('/admin')
  )) {
    console.log(`[URL Normalize] Rewriting ${req.url} -> /api${req.url}`);
    req.url = '/api' + req.url;
  }
  next();
});

// API Endpoints:
  
  // 1. Get entire state for frontend initialization
  app.get('/api/state', async (req, res) => {
    const db = await loadDB();
    res.json({
      products: db.products,
      banner: db.banner,
      orderByCount: db.orders.length
    });
  });

  // 2. Get Products list (includes dynamic stock)
  app.get('/api/products', async (req, res) => {
    const db = await loadDB();
    res.json(db.products);
  });

  // 3. Get Banner
  app.get('/api/banner', async (req, res) => {
    const db = await loadDB();
    res.json(db.banner);
  });

  // 4. Update Banner Config
  app.post('/api/banner', async (req, res) => {
    const { badge, title, subtitle, image, isClosed } = req.body || {};
    const db = await loadDB();
    db.banner = {
      badge: badge !== undefined ? badge : db.banner.badge,
      title: title !== undefined ? title : db.banner.title,
      subtitle: subtitle !== undefined ? subtitle : db.banner.subtitle,
      image: image !== undefined ? image : db.banner.image,
      isClosed: isClosed !== undefined ? !!isClosed : !!db.banner.isClosed
    };
    await saveDB(db);
    res.json({ success: true, banner: db.banner });
  });

  // 5. Add product
  app.post('/api/products', async (req, res) => {
    const newProduct = req.body;
    if (!newProduct.title || !newProduct.price) {
      return res.status(400).json({ error: 'Title and Price are required' });
    }

    const db = await loadDB();
    
    // Generate valid ID
    const baseId = newProduct.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let uniqueId = baseId || 'product';
    let counter = 1;
    while (db.products.some((p: any) => p.id === uniqueId)) {
      uniqueId = `${baseId}-${counter}`;
      counter++;
    }

    const initialStock = Number(newProduct.stock !== undefined ? newProduct.stock : 100);
    const initialPurchasePrice = newProduct.purchasePrice ? Number(newProduct.purchasePrice) : Number(newProduct.price) * 0.7;
    const addedDateStr = newProduct.addedDate || new Date().toISOString().split('T')[0];
    
    const formattedAddedDate = newProduct.addedDate 
      ? new Date(newProduct.addedDate).toLocaleDateString('ar-EG', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : new Date().toLocaleDateString('ar-EG', {
          timeZone: 'Africa/Cairo',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

    const initialPurchase = {
      id: Math.random().toString(36).substring(2, 9),
      date: `تاريخ الإضافة (${formattedAddedDate})`,
      quantity: initialStock,
      purchasePrice: initialPurchasePrice,
      totalCost: initialStock * initialPurchasePrice
    };

    const productWithDefaults = {
      id: uniqueId,
      title: newProduct.title,
      description: newProduct.description || '',
      price: Number(newProduct.price),
      discountPrice: newProduct.discountPrice ? Number(newProduct.discountPrice) : undefined,
      purchasePrice: newProduct.purchasePrice ? Number(newProduct.purchasePrice) : undefined,
      barcode: newProduct.barcode || undefined,
      discountPercentage: newProduct.discountPrice ? Math.round(((Number(newProduct.price) - Number(newProduct.discountPrice)) / Number(newProduct.price)) * 100) : undefined,
      image: newProduct.image || 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&q=80&w=600',
      images: [newProduct.image || 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&q=80&w=600'],
      category: newProduct.category || 'powders_detergents',
      brand: newProduct.brand || 'الشوربجي',
      company: newProduct.company || '',
      rating: 4.8,
      reviewsCount: Math.floor(Math.random() * 200) + 12,
      featured: !!newProduct.featured,
      isSpecialOffer: !!newProduct.isSpecialOffer,
      specs: newProduct.specs || {},
      stock: initialStock,
      purchaseHistory: [initialPurchase],
      addedDate: addedDateStr
    };

    db.products.push(productWithDefaults);
    await saveDB(db);
    res.json({ success: true, product: productWithDefaults });
  });

  // 6. Update product specifications, stock levels, or details
  app.put('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    const fields = req.body;
    const db = await loadDB();

    const index = db.products.findIndex((p: any) => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const existing = db.products[index];
    const price = fields.price !== undefined ? Number(fields.price) : existing.price;
    const discountPrice = fields.discountPrice !== undefined ? (fields.discountPrice ? Number(fields.discountPrice) : undefined) : existing.discountPrice;
    
    let discountPercentage = undefined;
    if (discountPrice && price) {
      discountPercentage = Math.round(((price - discountPrice) / price) * 100);
    }

    const newStock = fields.stock !== undefined ? Number(fields.stock) : existing.stock;
    const purchasePrice = fields.purchasePrice !== undefined ? (fields.purchasePrice ? Number(fields.purchasePrice) : undefined) : existing.purchasePrice;

    // Manage purchase history
    let updatedHistory = existing.purchaseHistory ? [...existing.purchaseHistory] : [];
    if (updatedHistory.length === 0) {
      const baseStock = existing.stock !== undefined ? existing.stock : 100;
      const basePurchasePrice = existing.purchasePrice || existing.price * 0.7;
      updatedHistory.push({
        id: 'initial',
        date: 'تاريخ التأسيس (رصيد أول المدة)',
        quantity: baseStock,
        purchasePrice: basePurchasePrice,
        totalCost: baseStock * basePurchasePrice
      });
    }

    if (fields.stock !== undefined && Number(fields.stock) > Number(existing.stock)) {
      const addedQty = Number(fields.stock) - Number(existing.stock);
      const effectivePurchasePrice = purchasePrice || price * 0.7;
      updatedHistory.push({
        id: Math.random().toString(36).substring(2, 9),
        date: new Date().toLocaleDateString('ar-EG', {
          timeZone: 'Africa/Cairo',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        quantity: addedQty,
        purchasePrice: effectivePurchasePrice,
        totalCost: addedQty * effectivePurchasePrice
      });
    }

    db.products[index] = {
      ...existing,
      title: fields.title || existing.title,
      description: fields.description !== undefined ? fields.description : existing.description,
      price,
      discountPrice,
      discountPercentage,
      purchasePrice: fields.purchasePrice !== undefined ? (fields.purchasePrice ? Number(fields.purchasePrice) : undefined) : existing.purchasePrice,
      barcode: fields.barcode !== undefined ? fields.barcode : existing.barcode,
      image: fields.image || existing.image,
      images: fields.image ? [fields.image] : existing.images,
      category: fields.category || existing.category,
      brand: fields.brand || existing.brand,
      company: fields.company !== undefined ? fields.company : existing.company,
      featured: fields.featured !== undefined ? !!fields.featured : existing.featured,
      isSpecialOffer: fields.isSpecialOffer !== undefined ? !!fields.isSpecialOffer : existing.isSpecialOffer,
      specs: fields.specs || existing.specs,
      stock: newStock,
      purchaseHistory: updatedHistory,
      addedDate: fields.addedDate !== undefined ? fields.addedDate : existing.addedDate
    };

    await saveDB(db);
    res.json({ success: true, product: db.products[index] });
  });

  // 7. Delete Product
  app.delete('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    const db = await loadDB();
    const initialCount = db.products.length;
    db.products = db.products.filter((p: any) => p.id !== id);

    if (db.products.length === initialCount) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await saveDB(db);
    res.json({ success: true });
  });

  // 8. Place order and deduct stock dynamic levels
  app.post('/api/orders', async (req, res) => {
    const orderData = req.body;
    if (!orderData.items || !orderData.customerInfo) {
      return res.status(400).json({ error: 'Missing order parameters' });
    }

    const db = await loadDB();
    
    // Deduct stock levels in local DB safely
    const updatedProducts = [...db.products];
    for (const item of orderData.items) {
      const match = updatedProducts.find((p) => p.id === item.product.id);
      if (match) {
        // Decrease stock but clamp to 0
        match.stock = Math.max(0, match.stock - item.quantity);
      }
    }

    const dateKey = new Date().toLocaleDateString('en-US', {
      timeZone: 'Africa/Cairo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    const todayOrders = (db.orders || []).filter((order: any) => order.dateKey === dateKey);
    const nextNum = todayOrders.length + 1;
    const numStr = nextNum < 10 ? `0${nextNum}` : `${nextNum}`;
    const generatedOrderId = `الشوربجي ${numStr}`;

    const newOrder = {
      ...orderData,
      orderId: generatedOrderId,
      dateKey,
      date: new Date().toLocaleDateString('ar-EG', {
        timeZone: 'Africa/Cairo',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    };

    db.products = updatedProducts;
    db.orders.unshift(newOrder); // Add to the top of the orders list
    await saveDB(db);

    res.json({ success: true, order: newOrder, products: updatedProducts });
  });

  // 9. Get orders list for dashboard
  app.get('/api/orders', async (req, res) => {
    const db = await loadDB();
    res.json(db.orders);
  });

  // Update order status (pending, delivered, or cancelled)
  app.put('/api/orders/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body || {};

    if (!status || !['pending', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const db = await loadDB();
    const orderIndex = db.orders.findIndex((o: any) => o.orderId === id);
    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const oldStatus = db.orders[orderIndex].status || 'pending';
    const newStatus = status;

    if (oldStatus !== newStatus) {
      // If we are cancelling the order, restore stock
      if (newStatus === 'cancelled') {
        const orderItems = db.orders[orderIndex].items || [];
        for (const item of orderItems) {
          const match = db.products.find((p: any) => p.id === item.product.id);
          if (match) {
            match.stock = (match.stock || 0) + item.quantity;
          }
        }
      }
      // If we are un-cancelling the order (moving from cancelled back to pending or delivered), deduct stock
      else if (oldStatus === 'cancelled') {
        const orderItems = db.orders[orderIndex].items || [];
        for (const item of orderItems) {
          const match = db.products.find((p: any) => p.id === item.product.id);
          if (match) {
            match.stock = Math.max(0, (match.stock || 0) - item.quantity);
          }
        }
      }
    }

    db.orders[orderIndex].status = status;
    await saveDB(db);

    res.json({ success: true, order: db.orders[orderIndex] });
  });

  // 10. Admin Verify Credentials login flow
  app.post('/api/admin/login', async (req, res) => {
    let { username, password } = req.body || {};
    
    console.log('[DEBUG LOGIN] Incoming login request:', { username, password });

    // Normalize and trim inputs to prevent copy-paste and casing issues
    const normalizedUsername = typeof username === 'string' ? username.trim().toLowerCase() : '';
    const trimmedPassword = typeof password === 'string' ? password.trim() : '';

    if (!normalizedUsername || !trimmedPassword) {
      console.log('[DEBUG LOGIN] Missing username or password');
      return res.status(400).json({ error: 'برجاء إدخال اسم المستخدم وكلمة المرور!' });
    }

    const db = await loadDB();
    console.log('[DEBUG LOGIN] Current adminSettings in DB:', JSON.stringify(db.adminSettings, null, 2));
    
    // Ensure we have a valid users array
    const users = db.adminSettings.users || [];
    const matchedUser = users.find((u: any) => 
      (u.username || '').trim().toLowerCase() === normalizedUsername && 
      (u.password || '').trim() === trimmedPassword
    );

    if (matchedUser) {
      console.log('[DEBUG LOGIN] Matched custom admin user:', matchedUser.username);
      res.json({ 
        success: true, 
        token: 'validated_sess_token_secure',
        user: {
          username: matchedUser.username,
          name: matchedUser.name || matchedUser.username
        }
      });
    } else if (
      (normalizedUsername === 'admin' && trimmedPassword === '123') ||
      (db.adminSettings.username && db.adminSettings.username.trim().toLowerCase() === normalizedUsername && db.adminSettings.password && db.adminSettings.password.trim() === trimmedPassword)
    ) {
      console.log('[DEBUG LOGIN] Matched default or primary admin credentials');
      res.json({ 
        success: true, 
        token: 'validated_sess_token_secure',
        user: {
          username: username || db.adminSettings.username || 'admin',
          name: 'المدير العام'
        }
      });
    } else {
      console.log('[DEBUG LOGIN] Login credentials did not match any user.');
      res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة!' });
    }
  });

  // 11. Get admin users list
  app.get('/api/admin/users', async (req, res) => {
    const db = await loadDB();
    res.json({ users: db.adminSettings.users || [] });
  });

  // 12. Save admin users list
  app.post('/api/admin/users', async (req, res) => {
    const { users } = req.body || {};
    if (!users || !Array.isArray(users)) {
      return res.status(400).json({ error: 'قائمة المستخدمين غير صالحة.' });
    }

    const db = await loadDB();
    db.adminSettings.users = users;

    // Also update main fallback credentials to match first user for backwards compatibility
    if (users.length > 0) {
      db.adminSettings.username = users[0].username;
      db.adminSettings.password = users[0].password;
    }

    await saveDB(db);
    res.json({ success: true, users: db.adminSettings.users });
  });

  // Load database on server start to pre-warm cache
  async function runDevOrProductionServer() {
    try {
      console.log('Pre-warming database cache on startup...');
      await loadDB();
    } catch (err) {
      console.error('Error pre-warming DB:', err);
    }

    // Vite single-mode handler
    if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else if (!process.env.VERCEL) {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    if (!process.env.VERCEL) {
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server loaded standard on http://localhost:${PORT}`);
      });
    }
  }

  // Start the server if not running on Vercel
  if (!process.env.VERCEL) {
    runDevOrProductionServer();
  } else {
    // On Vercel, pre-warm cache on first invocation
    loadDB().catch(err => console.error('Error loading DB on Vercel initialization:', err));
  }

export default app;
