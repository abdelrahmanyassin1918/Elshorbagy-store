import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import admin from 'firebase-admin';

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
const DB_PATH = path.join(process.cwd(), 'data-db.json');

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

// Initialize Firebase Admin safely
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    admin.initializeApp({
      projectId: config.projectId
    });
    const dbId = config.firestoreDatabaseId || '(default)';
    firestoreDb = (admin as any).firestore(dbId);
    console.log('Firebase Admin initialized successfully with database:', dbId);
  } else {
    console.log('No firebase-applet-config.json found, running on local filesystem only.');
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

// Read database with Firestore support and fallback
async function loadDB(): Promise<any> {
  if (cachedDB) {
    return cachedDB;
  }

  // First load from local file to guarantee we have a quick fallback
  let localData: any = null;
  if (fs.existsSync(DB_PATH)) {
    try {
      localData = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    } catch (e) {
      console.error('Error reading local DB:', e);
    }
  }

  if (!localData) {
    localData = getInitialData();
    fs.writeFileSync(DB_PATH, JSON.stringify(localData, null, 2), 'utf-8');
  }

  if (localData && localData.adminSettings && (!localData.adminSettings.users || !Array.isArray(localData.adminSettings.users))) {
    localData.adminSettings.users = [
      { username: localData.adminSettings.username || 'admin', password: localData.adminSettings.password || '123', name: 'المدير العام' }
    ];
  }

  // If Firestore is available, try to fetch/sync from it
  if (firestoreDb) {
    try {
      console.log('Fetching state from Firestore...');
      
      // Load products
      const productsSnap = await firestoreDb.collection('products').get();
      let productsList: any[] = [];
      productsSnap.forEach(doc => {
        productsList.push({ id: doc.id, ...doc.data() });
      });

      // Load orders
      const ordersSnap = await firestoreDb.collection('orders').get();
      let ordersList: any[] = [];
      ordersSnap.forEach(doc => {
        ordersList.push(doc.data());
      });
      // Sort orders by timestamp descending locally
      ordersList.sort((a, b) => {
        return new Date(b.dateKey || 0).getTime() - new Date(a.dateKey || 0).getTime();
      });

      // Load settings (banner & admin)
      const bannerDoc = await firestoreDb.collection('settings').doc('banner').get();
      const adminDoc = await firestoreDb.collection('settings').doc('admin').get();

      let banner = localData.banner;
      if (bannerDoc.exists) {
        banner = bannerDoc.data();
      }

      let adminSettings = localData.adminSettings;
      if (adminDoc.exists) {
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
        fs.writeFileSync(DB_PATH, JSON.stringify(localData, null, 2), 'utf-8');
      } else {
        // Firestore is empty! Seed Firestore with initial data
        console.log('Firestore is empty. Seeding Firestore with initial data...');
        await seedFirestore(localData);
      }
    } catch (err) {
      console.error('Firestore loading failed, falling back to local storage:', err);
    }
  }

  cachedDB = localData;
  return cachedDB;
}

// Save database with write-through
async function saveDB(data: any) {
  cachedDB = data;
  
  // 1. Write to local file first (fast & secure)
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing to local DB:', e);
  }

  // 2. Asynchronously write to Firestore
  if (firestoreDb) {
    try {
      // Write settings
      firestoreDb.collection('settings').doc('banner').set(data.banner).catch(e => console.error('Error saving banner to Firestore:', e));
      firestoreDb.collection('settings').doc('admin').set(data.adminSettings).catch(e => console.error('Error saving admin settings to Firestore:', e));

      // Sync products
      for (const p of data.products) {
        const { id, ...pData } = p;
        firestoreDb.collection('products').doc(id).set(pData).catch(e => console.error(`Error saving product ${id} to Firestore:`, e));
      }

      // Sync orders
      for (const order of data.orders) {
        const docId = order.orderId.replace(/[^a-zA-Z0-9_\u0600-\u06FF]+/g, '_'); // Safe ID
        firestoreDb.collection('orders').doc(docId).set(order).catch(e => console.error(`Error saving order ${order.orderId} to Firestore:`, e));
      }
    } catch (err) {
      console.error('Error scheduling Firestore writes:', err);
    }
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

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
    const { badge, title, subtitle, image } = req.body;
    const db = await loadDB();
    db.banner = {
      badge: badge || db.banner.badge,
      title: title || db.banner.title,
      subtitle: subtitle || db.banner.subtitle,
      image: image || db.banner.image
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
    const { status } = req.body;

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
    const { username, password } = req.body;
    const db = await loadDB();
    
    // Ensure we have a valid users array
    const users = db.adminSettings.users || [];
    const matchedUser = users.find((u: any) => u.username === username && u.password === password);

    if (matchedUser) {
      res.json({ 
        success: true, 
        token: 'validated_sess_token_secure',
        user: {
          username: matchedUser.username,
          name: matchedUser.name || matchedUser.username
        }
      });
    } else if (
      username === db.adminSettings.username &&
      password === db.adminSettings.password
    ) {
      res.json({ 
        success: true, 
        token: 'validated_sess_token_secure',
        user: {
          username: db.adminSettings.username,
          name: 'المدير العام'
        }
      });
    } else {
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
    const { users } = req.body;
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
  try {
    console.log('Pre-warming database cache on startup...');
    await loadDB();
  } catch (err) {
    console.error('Error pre-warming DB:', err);
  }

  // Vite single-mode handler
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
    console.log(`Server loaded standard on http://localhost:${PORT}`);
  });
}

startServer();
