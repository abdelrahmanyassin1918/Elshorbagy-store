import React, { useState, useEffect } from 'react';
import { Product, OrderDetails, PurchaseRecord, Category, UserData } from '../types';
import { CATEGORIES } from '../data';
import { signInAdmin, signOut_ } from '../authUtils';
import {
  getAllOrders as getFirestoreOrders,
  addProduct as addFirestoreProduct,
  updateProduct as updateFirestoreProduct,
  deleteProduct as deleteFirestoreProduct,
  addCategory as addFirestoreCategory,
  updateCategory as updateFirestoreCategory,
  deleteCategory as deleteFirestoreCategory,
  updateOrderStatus as updateFirestoreOrderStatus,
  saveBannerData as saveFirestoreBanner,
  getAllUsers as getFirestoreUsers,
  updateUser as updateFirestoreUser,
  deleteUser as deleteFirestoreUser,
} from '../firestoreUtils';
import { 
  FaLock, FaCheckCircle, FaTrash, FaEdit, FaPlus, FaSlidersH, 
  FaBoxOpen, FaClipboardList, FaSignOutAlt, FaTimesCircle,
  FaCubes, FaMoneyBillWave, FaChartLine, FaDollyFlatbed, FaSearch, FaGripLines,
  FaPrint, FaWhatsapp, FaEye, FaEyeSlash, FaPhone, FaBarcode,
  FaTags
} from 'react-icons/fa';

interface AdminViewProps {
  products: Product[];
  banner: {
    badge: string;
    title: string;
    subtitle: string;
    image: string;
  };
  orders: OrderDetails[];
  categories: Category[];
  onRefreshData: () => void;
  onNavigate: (view: string) => void;
}

const getDirectUserUrl = (baseUrl: string) => {
  if (!baseUrl) return '';
  try {
    const url = new URL(baseUrl);
    url.searchParams.set('role', 'user');
    return url.toString();
  } catch (e) {
    return baseUrl + (baseUrl.includes('?') ? '&' : '?') + 'role=user';
  }
};

const getGateUrl = (baseUrl: string) => {
  if (!baseUrl) return '';
  try {
    const url = new URL(baseUrl);
    url.searchParams.set('role', 'gate');
    return url.toString();
  } catch (e) {
    return baseUrl + (baseUrl.includes('?') ? '&' : '?') + 'role=gate';
  }
};

const uploadToCloudinary = async (file: File): Promise<string> => {
  const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env ?? {};
  const cloudName = env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('يرجى تهيئة Cloudinary عبر VITE_CLOUDINARY_CLOUD_NAME و VITE_CLOUDINARY_UPLOAD_PRESET');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  if (!response.ok || !data.secure_url) {
    throw new Error(data.error?.message || 'فشل رفع الصورة إلى Cloudinary');
  }

  return data.secure_url as string;
};

export default function AdminView({
  products,
  banner,
  orders: propOrders,
  categories,
  onRefreshData,
  onNavigate,
}: AdminViewProps) {
  // Login credentials state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const token = sessionStorage.getItem('elshorbagy_admin_token') || localStorage.getItem('elshorbagy_admin_token');
    return token === 'validated_sess_token_secure' || token === 'firebase-admin-auth';
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);

  // Tab State: 'products' | 'orders' | 'banner' | 'inventory' | 'users' | 'qrcode' | 'categories'
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'banner' | 'inventory' | 'users' | 'qrcode' | 'categories'>('products');

  // Multi-user state
  const [adminDisplayName, setAdminDisplayName] = useState<string>(() => {
    return sessionStorage.getItem('elshorbagy_admin_user_name') || localStorage.getItem('elshorbagy_admin_user_name') || 'المدير';
  });
  const [adminUsers, setAdminUsers] = useState<UserData[]>([]);
  const [isAdminUsersLoading, setIsAdminUsersLoading] = useState(false);
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminName, setNewAdminName] = useState('');

  // Edit Admin User states
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editingAdminName, setEditingAdminName] = useState('');
  const [editingAdminUsername, setEditingAdminUsername] = useState('');
  const [showEditingPassword, setShowEditingPassword] = useState(false);

  // User Management State Messages & Double Delete Confirm
  const [userTabMsg, setUserTabMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deletingUserConfirm, setDeletingUserConfirm] = useState<UserData | null>(null);
  const [editAdminError, setEditAdminError] = useState<string>('');

  const showUserMessage = (type: 'success' | 'error', text: string) => {
    setUserTabMsg({ type, text });
    setTimeout(() => {
      setUserTabMsg(null);
    }, 7000);
  };

  // Category Management State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formCategoryName, setFormCategoryName] = useState('');
  const [formCategoryImage, setFormCategoryImage] = useState('');
  const [categoryFormError, setCategoryFormError] = useState('');
  const [isCategoryUploading, setIsCategoryUploading] = useState(false);

  // State to filter and only show out of stock items
  const [onlyShowOutOfStock, setOnlyShowOutOfStock] = useState<boolean>(false);

  // QR Code URL State (Fixed to production Vercel URL)
  const qrCodeUrl = 'https://elshorbagy-store.vercel.app';

  // Notification API Permission State
  const [notificationPermission, setNotificationPermission] = useState<string>(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
  });

  const seenOrderIdsRef = React.useRef<Set<string>>(new Set());

  // Dual-tone chime sound synthesizer using browser's built-in Web Audio API
  const playNotificationSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      // Tone 1: Standard high chime pitch
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      gain1.gain.setValueAtTime(0.12, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.45);

      // Tone 2: Harmonious E5 pitch
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12); // E5
      gain2.gain.setValueAtTime(0.12, ctx.currentTime + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.12);
      osc2.stop(ctx.currentTime + 0.65);
    } catch (err) {
      console.warn('Audio chime synthesis failed:', err);
    }
  };

  const requestNotificationPermission = () => {
    if (!('Notification' in window)) {
      alert('هذا المتصفح لا يدعم إشعارات النظام.');
      return;
    }
    Notification.requestPermission().then((permission) => {
      setNotificationPermission(permission);
      if (permission === 'granted') {
        const dummyNotification = new Notification('تم تفعيل الإشعارات بنجاح! 🔔', {
          body: 'ستصلك تنبيهات فورية فور ورود أي طلب جديد للمتجر.',
          icon: '/icon.svg',
        });
        playNotificationSound();
      }
    });
  };

  // Category management mode state
  const [isAdminCategoryMode, setIsAdminCategoryMode] = useState<boolean>(false);
  const [selectedAdminCategory, setSelectedAdminCategory] = useState<string | null>(null);
  const [adminSearchQuery, setAdminSearchQuery] = useState('');

  // Orders list state
  const [orders, setOrders] = useState<OrderDetails[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);

  // Edit / Add product modal states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null); // null means adding new
  const [selectedInventoryProduct, setSelectedInventoryProduct] = useState<Product | null>(null); // for detailed ledger view

  // Product Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formDiscountPrice, setFormDiscountPrice] = useState('');
  const [formPurchasePrice, setFormPurchasePrice] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formStock, setFormStock] = useState('50');
  const [formDate, setFormDate] = useState('');
  const [formCategory, setFormCategory] = useState('powders_detergents');
  const [formBrand, setFormBrand] = useState('برسيل');
  const [formCompany, setFormCompany] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formSpecs, setFormSpecs] = useState('الحجم: 3 لتر\nالنوع: جل مركز');
  const [formError, setFormError] = useState('');
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState('');

  // Refs for drag-and-drop reordering of images
  const dragItem = React.useRef<number | null>(null);
  const dragOverItem = React.useRef<number | null>(null);

  const existingCompanyNames = React.useMemo(() => {
    const names = new Set<string>();
    const defaults = ["الشوربجي", "هنكل مصر", "يونيليفر", "بروكتر آند غامبل", "فاين القابضة", "زينة للورقيات"];
    defaults.forEach(c => names.add(c));
    products.forEach(p => {
      if (p.company) names.add(p.company);
    });
    return Array.from(names);
  }, [products]);

  const getCategoryName = (catIdOrName: string) => {
    const found = CATEGORIES.find(c => c.id === catIdOrName || c.name === catIdOrName);
    return found ? found.name : catIdOrName;
  };

  const getCategoryIdToSave = (catName: string) => {
    const found = CATEGORIES.find(c => c.name.toLowerCase() === catName.toLowerCase() || c.id.toLowerCase() === catName.toLowerCase());
    return found ? found.id : catName;
  };

  // Banner Form Fields
  const [formBannerBadge, setFormBannerBadge] = useState(banner.badge || '');
  const [formBannerTitle, setFormBannerTitle] = useState(banner.title || '');
  const [formBannerSubtitle, setFormBannerSubtitle] = useState(banner.subtitle || '');
  const [formBannerImage, setFormBannerImage] = useState(banner.image || '');
  const [formBannerIsClosed, setFormBannerIsClosed] = useState(!!(banner as any).isClosed);
  const [bannerSuccessMsg, setBannerSuccessMsg] = useState('');
  const [isBannerSubmitting, setIsBannerSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const toastTimerRef = React.useRef<number | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToast({ type, text });
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // Delete / Stock Decrease Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deleteType, setDeleteType] = useState<'reduce' | 'full'>('reduce'); // 'reduce' = decrease stock, 'full' = delete product completely
  const [reduceAmount, setReduceAmount] = useState<string>('1');
  const [fullConfirmChecked, setFullConfirmChecked] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);

  // Order Detail Modal and WhatsApp / Printing Helpers
  const [selectedDetailedOrder, setSelectedDetailedOrder] = useState<OrderDetails | null>(null);
  const [isOrderDetailsModalOpen, setIsOrderDetailsModalOpen] = useState(false);

  const handlePrintOrder = (order: OrderDetails) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('يرجى السماح بالنوافذ المنبثقة من المتصفح لتتمكن من طباعة الفاتورة.');
      return;
    }

    const itemsRows = order.items.map(item => {
      const unitPrice = item.product.discountPrice || item.product.price;
      const totalCol = unitPrice * item.quantity;
      return `
        <tr style="border-bottom: 1px solid #edf2f7;">
          <td style="padding: 12px 10px; text-align: right; font-weight: bold; border-bottom: 1px solid #e2e8f0;">${item.product.title}</td>
          <td style="padding: 12px 10px; text-align: center; color: #4a5568; border-bottom: 1px solid #e2e8f0;">${item.product.brand || 'عام'}</td>
          <td style="padding: 12px 10px; text-align: center; font-weight: bold; border-bottom: 1px solid #e2e8f0;">${item.quantity}</td>
          <td style="padding: 12px 10px; text-align: left; color: #2d3748; border-bottom: 1px solid #e2e8f0;">${unitPrice} ج.م</td>
          <td style="padding: 12px 10px; text-align: left; font-weight: 800; color: #1a202c; border-bottom: 1px solid #e2e8f0;">${totalCol} ج.م</td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>فاتورة الشوربجي ستور - طلب #${order.orderId}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
            body { 
              font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 0; 
              padding: 20px; 
              direction: rtl; 
              color: #2d3748; 
              background-color: #fff;
            }
            .container { 
              max-width: 800px; 
              margin: 0 auto; 
              border: 1px solid #e2e8f0; 
              padding: 30px; 
              border-radius: 16px; 
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .header { 
              display: flex; 
              justify-content: space-between; 
              align-items: center; 
              border-bottom: 3px solid #5108b5; 
              padding-bottom: 20px; 
              margin-bottom: 25px; 
            }
            .brand-name { 
              font-size: 26px; 
              font-weight: 950; 
              color: #5108b5; 
            }
            .invoice-title { 
              font-size: 22px; 
              font-weight: 950; 
              color: #2d3748; 
              text-align: left;
            }
            .info-box { 
              display: grid; 
              grid-template-cols: 1fr 1fr; 
              gap: 20px; 
              background: #f7fafc; 
              padding: 20px; 
              border-radius: 12px; 
              margin-bottom: 25px; 
              border: 1px dashed #cbd5e0;
            }
            .info-block { 
              font-size: 13px; 
              line-height: 1.8; 
            }
            .info-heading { 
              font-weight: bold; 
              color: #718096; 
              margin-bottom: 5px; 
              display: block; 
              text-decoration: underline;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 25px; 
            }
            th { 
              background-color: #5108b5; 
              color: white; 
              padding: 12px 10px; 
              font-size: 13px; 
              font-weight: bold; 
              text-align: right; 
            }
            .totals-section { 
              display: flex; 
              justify-content: flex-end; 
              margin-top: 20px; 
            }
            .totals-box { 
              width: 300px; 
              font-size: 14px; 
            }
            .total-row { 
              display: flex; 
              justify-content: space-between; 
              padding: 8px 0; 
              border-bottom: 1px solid #edf2f7; 
            }
            .grand-total { 
              border-top: 2px solid #5108b5; 
              padding-top: 12px; 
              font-size: 18px; 
              font-weight: 900; 
              color: #5108b5; 
            }
            .footer { 
              margin-top: 60px; 
              text-align: center; 
              font-size: 11px; 
              color: #a0aec0; 
              border-top: 1px solid #edf2f7; 
              padding-top: 20px; 
              line-height: 1.6;
            }
            .btn-print { 
              background: #00bf63; 
              color: white; 
              border: none; 
              padding: 10px 24px; 
              font-size: 13px; 
              font-weight: bold; 
              border-radius: 8px; 
              cursor: pointer; 
              margin-bottom: 20px; 
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            @media print {
              .no-print { display: none !important; }
              body { padding: 0; }
              .container { border: none; box-shadow: none; padding: 0; max-width: 100%; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="text-align: left;">
            <button class="btn-print" onclick="window.print()">طباعة الفاتورة الآن 🖨️</button>
          </div>
          
          <div class="container">
            <div class="header">
              <div>
                <span class="brand-name">الشوربجي ستور ✨</span>
                <div style="font-size: 11px; color: #718096; margin-top: 3px;">منظفات ومستلزمات منزلية لباب بيتك بأسعار مميزة</div>
              </div>
              <div style="text-align: left;">
                <span class="invoice-title">فاتورة بيع</span>
                <div style="font-size: 12px; color: #4a5568; margin-top: 5px;">رقم الأوردر: <strong>#${order.orderId}</strong></div>
                <div style="font-size: 11px; color: #718096;">تاريخ التسجيل: ${order.date}</div>
              </div>
            </div>

            <div class="info-box">
              <div class="info-block">
                <span class="info-heading">👤 بيانات المستلم:</span>
                <div><strong>الاسم بالكامل:</strong> ${order.customerInfo.name}</div>
                <div><strong>رقم الموبايل:</strong> ${order.customerInfo.phone}</div>
              </div>
              <div class="info-block">
                <span class="info-heading">📍 تفاصيل الشحن:</span>
                <div><strong>المنطقة السكنية:</strong> ${order.customerInfo.governorate}</div>
                <div><strong>المحل/النشاط:</strong> ${order.customerInfo.city || 'طلب شخصي'}</div>
                <div><strong>العنوان بالكامل:</strong> ${order.customerInfo.address}</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 50%;">اسم الصنف والمنتج</th>
                  <th style="text-align: center; width: 15%;">الماركة</th>
                  <th style="text-align: center; width: 10%;">الكمية</th>
                  <th style="text-align: left; width: 12%;">السعر فردي</th>
                  <th style="text-align: left; width: 13%;">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows}
              </tbody>
            </table>

            <div class="totals-section">
              <div class="totals-box">
                <div class="total-row">
                  <span>قيمة المنتجات:</span>
                  <span>${order.subtotal} ج.م</span>
                </div>
                <div class="total-row">
                  <span>تكلفة الدليفري الشحن:</span>
                  <span>${order.shipping === 0 ? 'شحن مجاني' : `${order.shipping} ج.م`}</span>
                </div>
                <div class="total-row grand-total">
                  <span>الإجمالي المطلوب كاش:</span>
                  <span>${order.total} ج.م</span>
                </div>
              </div>
            </div>

            <div class="footer">
              شكراً لاختياركم الشوربجي ستور! نأمل أن تنال منتجاتنا رضاكم دائماً. 🥰<br>
              رقم خدمة الدعم الفني والمتابعة بالواتساب: ٠١٢٠٣٦٨٠٧٢٧ • الخط الساخن الدعم: ٠١٢٠٣٦٨٠٧٢٧
            </div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getWhatsAppManagerLink = (order: OrderDetails) => {
    let itemsText = order.items.map(item => `- ${item.product.title} (كمية: ${item.quantity}) - السعر: ${item.product.discountPrice || item.product.price} ج.م`).join('%0A');
    const text = `🚨 *طلب جديد رقم #${order.orderId} للتجهيز* 🚨%0A%0A` +
      `👤 *العميل:* ${order.customerInfo.name}%0A` +
      `📞 *الهاتف:* ${order.customerInfo.phone}%0A` +
      `📍 *المنطقة في الإسماعيلية:* ${order.customerInfo.governorate}%0A` +
      `🏢 *المحل/اسم النشاط:* ${order.customerInfo.city || 'أوردر شخصي (لا يوجد اسم محل)'}%0A` +
      `🏠 *العنوان بالتفصيل:* ${order.customerInfo.address}%0A%0A` +
      `📦 *المنتجات المطلوبة:*%0A${itemsText}%0A%0A` +
      `💵 *قيمة المنتجات:* ${order.subtotal} ج.م%0A` +
      `🚚 *الدليفري:* ${order.shipping === 0 ? 'شحن مجاني' : order.shipping + ' ج.م'}%0A` + 
      `💰 *الإجمالي المطلوب:* *${order.total} ج.م*%0A%0A` +
      `برجاء سرعة التجهيز والاتصال للتحرك بالدليفري! 🚀`;
    return `https://wa.me/201203680727?text=${text}`;
  };

  const getWhatsAppCustomerLink = (order: OrderDetails) => {
    const formattedPhone = order.customerInfo.phone.replace(/[^0-9]/g, '');
    let phoneWithCountry = formattedPhone;
    if (formattedPhone.startsWith('01')) {
      phoneWithCountry = '2' + formattedPhone;
    } else if (!formattedPhone.startsWith('201') && formattedPhone.startsWith('1')) {
      phoneWithCountry = '20' + formattedPhone;
    }
    
    const itemsBrief = (order.items || []).map(item => {
      return `- ${item.product.title} (العدد: ${item.quantity})`;
    }).join('\n');

    const textMessage = `أهلاً بك يا أستاذ ${order.customerInfo.name}، لقد تم استلام طلبك رقم #${order.orderId}

تفاصيل المنتجات التي تطلبها باختصار وأعدادهم:
${itemsBrief}

إجمالي الفاتورة: ${order.total} ج.م

سيتم تواصل أحد مندوبينا معك خلال لحظات، شكراً.`;

    const message = encodeURIComponent(textMessage);
    return `https://wa.me/${phoneWithCountry}?text=${message}`;
  };

  // Fetch orders from server
  const fetchOrders = async (silent = false) => {
    if (!silent) setIsOrdersLoading(true);
    try {
      const firestoreOrders = await getFirestoreOrders();
      const mappedOrders = firestoreOrders.map((order: any) => ({
        ...order,
        orderId: order.orderId || order.id,
        items: Array.isArray(order.items) ? order.items : [],
        customerInfo: order.customerInfo || { name: '', phone: '', governorate: '', city: '', address: '' },
        subtotal: Number(order.subtotal) || 0,
        shipping: Number(order.shipping) || 0,
        total: Number(order.total) || 0,
        date: order.date || order.createdAt || '',
        status: order.status || 'pending',
      })) as OrderDetails[];

      setOrders(mappedOrders);

      mappedOrders.forEach((o: any) => {
        seenOrderIdsRef.current.add(o.orderId);
      });
    } catch (e) {
      console.error('Error fetching orders from Firestore:', e);
    } finally {
      if (!silent) setIsOrdersLoading(false);
    }
  };

  // Background polling for new orders with live browser push notification
  useEffect(() => {
    if (!isAuthenticated) return;

    const pollInterval = setInterval(async () => {
      try {
        const firestoreOrders = await getFirestoreOrders();
        const fetchedOrders: OrderDetails[] = firestoreOrders.map((order: any) => ({
          ...order,
          orderId: order.orderId || order.id,
          items: Array.isArray(order.items) ? order.items : [],
          customerInfo: order.customerInfo || { name: '', phone: '', governorate: '', city: '', address: '' },
          subtotal: Number(order.subtotal) || 0,
          shipping: Number(order.shipping) || 0,
          total: Number(order.total) || 0,
          date: order.date || order.createdAt || '',
          status: order.status || 'pending',
        })) as OrderDetails[];

        let hasNew = false;
        let latestNewOrder: OrderDetails | null = null;

        if (seenOrderIdsRef.current.size > 0) {
          for (const order of fetchedOrders) {
            if (!seenOrderIdsRef.current.has(order.orderId)) {
              seenOrderIdsRef.current.add(order.orderId);
              hasNew = true;
              latestNewOrder = order;
            }
          }
        } else {
          fetchedOrders.forEach(o => seenOrderIdsRef.current.add(o.orderId));
        }

        setOrders(fetchedOrders);

        if (hasNew && latestNewOrder) {
          playNotificationSound();
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🚨 طلب جديد بالمتجر الشوربجي!', {
              body: `وصلك أوردر جديد رقم ${latestNewOrder.orderId} بقيمة ${latestNewOrder.total} ج.م من العميل ${latestNewOrder.customerInfo.name}`,
              icon: '/icon.svg',
              requireInteraction: true
            });
          }
        }
      } catch (err) {
        console.warn('Polling error:', err);
      }
    }, 7000); // Poll every 7 seconds

    return () => clearInterval(pollInterval);
  }, [isAuthenticated]);

  const fetchAdminUsers = async () => {
    setIsAdminUsersLoading(true);
    try {
      const users = await getFirestoreUsers();
      setAdminUsers(users);
    } catch (err) {
      console.error('Failed to fetch admin users:', err);
      showUserMessage('error', 'فشل في تحميل قائمة المستخدمين من Firestore.');
    } finally {
      setIsAdminUsersLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
      fetchAdminUsers();
      // Also update fields values
      setFormBannerBadge(banner.badge);
      setFormBannerTitle(banner.title);
      setFormBannerSubtitle(banner.subtitle);
      setFormBannerImage(banner.image);
      setFormBannerIsClosed(!!(banner as any).isClosed);
    }
  }, [isAuthenticated, banner]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoginSubmitting(true);

    try {
      const { userData } = await signInAdmin(username.trim(), password);
      const displayName = userData.displayName || userData.email || 'المدير';
      sessionStorage.setItem('elshorbagy_admin_token', 'firebase-admin-auth');
      localStorage.setItem('elshorbagy_admin_token', 'firebase-admin-auth');
      sessionStorage.setItem('elshorbagy_admin_user_name', displayName);
      localStorage.setItem('elshorbagy_admin_user_name', displayName);
      setAdminDisplayName(displayName);
      setIsAuthenticated(true);
      onRefreshData();
    } catch (err: any) {
      setLoginError(err?.message || 'فشل تسجيل الدخول عبر Firebase');
    } finally {
      setIsLoginSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await signOut_();
    sessionStorage.removeItem('elshorbagy_admin_token');
    sessionStorage.removeItem('elshorbagy_admin_user_name');
    localStorage.removeItem('elshorbagy_admin_token');
    localStorage.removeItem('elshorbagy_admin_user_name');
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
  };

  // Open edit modal
  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormTitle(product.title);
    setFormDescription(product.description);
    setFormPrice(String(product.price));
    setFormDiscountPrice(product.discountPrice ? String(product.discountPrice) : '');
    setFormPurchasePrice(product.purchasePrice ? String(product.purchasePrice) : '');
    setFormBarcode(product.barcode || '');
    setFormStock(String(product.stock !== undefined ? product.stock : 100));
    setFormDate(product.addedDate || new Date().toISOString().split('T')[0]);
    setFormCategory(product.category);
    setFormBrand(product.brand);
    setFormCompany(product.company || '');
    setFormImages(product.images || [product.image]);
    setImageUploadError('');
    
    // Parse specs object back to multiline key: value text
    if (product.specs) {
      const specLines = Object.entries(product.specs).map(([key, val]) => `${key}: ${val}`);
      setFormSpecs(specLines.join('\n'));
    } else {
      setFormSpecs('');
    }
    setFormError('');
    setIsProductModalOpen(true);
  };

  // Open add modal
  const openAddModal = () => {
    setEditingProduct(null);
    setFormTitle('');
    setFormDescription('');
    setFormPrice('');
    setFormDiscountPrice('');
    setFormPurchasePrice('');
    setFormBarcode('');
    setFormStock('100');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormCategory(selectedAdminCategory || 'powders_detergents');
    setFormBrand('برسيل');
    setFormCompany('الشوربجي');
    setFormImages([]);
    setImageUploadError('');
    setFormSpecs('الحجم: ٣ لتر\nالنوع: جل أوتوماتيك');
    setFormError('');
    setIsProductModalOpen(true);
  };

  // Handler for sorting images with drag and drop
  const handleImageSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;

    // Create a new sorted array
    const newImages = [...formImages];
    const draggedItemContent = newImages.splice(dragItem.current, 1)[0];
    newImages.splice(dragOverItem.current, 0, draggedItemContent);

    // Reset refs
    dragItem.current = null;
    dragOverItem.current = null;

    // Update state
    setFormImages(newImages);
  };

  const parseSpecsText = (text: string): { [key: string]: string } => {
    const specs: { [key: string]: string } = {};
    if (!text.trim()) return specs;
    
    const lines = text.split('\n');
    for (const line of lines) {
      const separatorIdx = line.indexOf(':');
      if (separatorIdx > -1) {
        const key = line.substring(0, separatorIdx).trim();
        const value = line.substring(separatorIdx + 1).trim();
        if (key && value) {
          specs[key] = value;
        }
      }
    }
    return specs;
  };

  const handleProductFormSubmit = async (e: React.FormEvent, forceAsNew = false) => {
    if (e) e.preventDefault();
    setFormError('');

    if (!formTitle.trim()) {
      setFormError('الرجاء إدخال عنوان المنتج');
      return;
    }
    const priceNum = Number(formPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError('الرجاء كتابة سعر أصلي صحيح أكبر من الصفر');
      return;
    }

    const discNum = formDiscountPrice ? Number(formDiscountPrice) : undefined;
    if (discNum !== undefined && (isNaN(discNum) || discNum >= priceNum || discNum < 0)) {
      setFormError('السعر بعد الخصم يجب أن يكون أقل من السعر الأصلي وليس بالسالب');
      return;
    }

    const purchasePriceNum = formPurchasePrice ? Number(formPurchasePrice) : undefined;
    if (purchasePriceNum !== undefined && (isNaN(purchasePriceNum) || purchasePriceNum < 0)) {
      setFormError('سعر الشراء يجب أن يكون رقم صحيح موجب');
      return;
    }

    setIsFormSubmitting(true);

    if (isImageUploading) {
      setFormError('يرجى انتظار انتهاء رفع الصورة قبل الحفظ.');
      return;
    }

    const parsedSpecs = parseSpecsText(formSpecs);
    const imageUrl = formImages.length > 0 ? formImages[0] : 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&q=80&w=800';
    const bodyPayload = {
      title: formTitle.trim(),
      description: formDescription.trim(),
      price: priceNum,
      discountPrice: discNum,
      purchasePrice: purchasePriceNum,
      barcode: formBarcode.trim() || undefined,
      stock: Number(formStock),
      addedDate: formDate || new Date().toISOString().split('T')[0],
      category: formCategory.trim(),
      brand: formBrand.trim(),
      company: formCompany.trim(),
      image: formImages[0] || imageUrl,
      images: formImages.length > 0 ? formImages : [imageUrl],
      specs: parsedSpecs,
    };

    try {
      const isNew = forceAsNew || !editingProduct;

      if (isNew) {
        await addFirestoreProduct(bodyPayload as any);
        showToast('success', 'تم إضافة المنتج بنجاح ✅');
      } else {
        await updateFirestoreProduct(editingProduct!.id, bodyPayload as any);
        showToast('success', 'تم تحديث المنتج بنجاح ✅');
      }

      setIsProductModalOpen(false);
      onRefreshData();
    } catch (err) {
      setFormError('خطأ في حفظ المنتج إلى Firestore.');
      showToast('error', 'فشل حفظ المنتج في Firestore');
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const openDeleteModal = (product: Product) => {
    setDeletingProduct(product);
    setDeleteType('reduce');
    setReduceAmount('1');
    setFullConfirmChecked(false);
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  const executeDeleteOrReduction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletingProduct) return;
    setDeleteError('');
    setIsDeleteSubmitting(true);

    try {
      if (deleteType === 'reduce') {
        const amt = Number(reduceAmount);
        if (isNaN(amt) || amt <= 0) {
          setDeleteError('الرجاء إدخال كمية صحيحة أكبر من الصفر لنقصها');
          setIsDeleteSubmitting(false);
          return;
        }
        const currentStock = deletingProduct.stock !== undefined ? deletingProduct.stock : 100;
        if (amt > currentStock) {
          setDeleteError(`الكمية المراد حذفها (${amt}) أكبر من الكمية المتاحة حالياً في المخزن (${currentStock})`);
          setIsDeleteSubmitting(false);
          return;
        }

        const newStock = Math.max(0, currentStock - amt);
        
        try {
          await updateFirestoreProduct(deletingProduct.id, { stock: newStock } as any);
          setIsDeleteModalOpen(false);
          onRefreshData();
          showToast('success', `تم تخفيض المخزون بنجاح إلى ${newStock} وحدة`);
        } catch (err) {
          setDeleteError('فشل تعديل كمية المخزون في Firestore');
          showToast('error', 'فشل تخفيض المخزون');
        }
      } else {
        // Full delete
        if (!fullConfirmChecked) {
          setDeleteError('يرجى النقر على مربع التأكيد للموافقة على الحذف النهائي للمنتج.');
          setIsDeleteSubmitting(false);
          return;
        }

        try {
          await deleteFirestoreProduct(deletingProduct.id);
          setIsDeleteModalOpen(false);
          onRefreshData();
          showToast('success', 'تم حذف المنتج بنجاح 🗑️');
        } catch (err) {
          setDeleteError('فشل حذف المنتج من Firestore.');
          showToast('error', 'فشل حذف المنتج');
        }
      }
    } catch (err) {
      setDeleteError('خطأ بالاتصال بالشبكة.');
    } finally {
      setIsDeleteSubmitting(false);
    }
  };

  const handleUpdateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setBannerSuccessMsg('');
    setIsBannerSubmitting(true);

    try {
      await saveFirestoreBanner({
        badge: formBannerBadge,
        title: formBannerTitle,
        subtitle: formBannerSubtitle,
        image: formBannerImage,
        isClosed: formBannerIsClosed,
      });

      setBannerSuccessMsg('تم تحديث بيانات الصفحة الرئيسية بنجاح! 🚀');
      onRefreshData();
    } catch (err) {
      alert('حدث خطأ أثناء حفظ التحديثات في Firestore.');
    } finally {
      setIsBannerSubmitting(false);
    }
  };

  const openAddCategoryModal = () => {
    setEditingCategory(null);
    setFormCategoryName('');
    setFormCategoryImage('');
    setCategoryFormError('');
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (category: Category) => {
    setEditingCategory(category);
    setFormCategoryName(category.name);
    setFormCategoryImage(category.image || '');
    setCategoryFormError('');
    setIsCategoryModalOpen(true);
  };

  const handleCategoryFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCategoryUploading) return;
    if (!formCategoryName.trim()) {
      setCategoryFormError('يرجى إدخال اسم القسم.');
      return;
    }

    const payload = {
      name: formCategoryName.trim(),
      image: formCategoryImage,
    };

    try {
      setIsCategoryUploading(true);
      if (editingCategory) {
        await updateFirestoreCategory(editingCategory.id, payload);
        showToast('success', 'تم تحديث القسم بنجاح.');
      } else {
        await addFirestoreCategory(payload);
        showToast('success', 'تمت إضافة القسم بنجاح.');
      }
      setIsCategoryModalOpen(false);
      onRefreshData();
    } catch (err) {
      setCategoryFormError('حدث خطأ أثناء حفظ القسم في Firestore.');
      showToast('error', 'فشل حفظ القسم.');
    } finally {
      setIsCategoryUploading(false);
    }
  };

  // View total calculations
  const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
  const outOfStockItems = products.filter(p => !p.stock || p.stock <= 0).length;

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-14 bg-white p-8 rounded-3xl border border-gray-100 shadow-xl text-right font-sans select-none">
        <div className="w-16 h-16 bg-[#eafbf2] text-[#00bf63] rounded-2xl flex items-center justify-center text-2xl mx-auto mb-6">
          <FaLock />
        </div>
        <h2 className="text-2xl font-black text-gray-800 text-center mb-2">تسجيل دخول لوحة التحكم</h2>
        <p className="text-xs text-gray-400 font-semibold text-center mb-6 leading-relaxed">
          هذه الصفحة مخصصة للمدير والمسؤول فقط لتعديل المنتجات والمخزون ومتابعة المبيعات الحية.
        </p>

        {loginError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold mb-4 text-center">
            {loginError}
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-gray-600 mb-1">البريد الإلكتروني كمسؤول</label>
            <input
              type="email"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="مثال: admin@elshorbagy.com"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#00bf63]/40 focus:border-[#00bf63] text-left font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-gray-600 mb-1">كلمة المرور السرية</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="إدخال رمز المرور"
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#00bf63]/40 focus:border-[#00bf63] text-left font-bold"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                title={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              >
                {showPassword ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
              </button>
            </div>
            <p className="text-[10px] text-amber-600 font-extrabold mt-1.5 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200 text-right">
              💡 استخدم حساب admin في Firebase: البريد الإلكتروني <span className="font-mono text-gray-700 bg-white px-1 py-0.5 rounded border border-gray-200">admin@elshorbagy.com</span> وكلمة المرور <span className="font-mono text-gray-700 bg-white px-1 py-0.5 rounded border border-gray-200">Admin@123</span>
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoginSubmitting}
            className="w-full py-3.5 bg-[#00bf63] hover:bg-brand-green-dark text-white text-xs sm:text-sm font-extrabold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoginSubmitting ? 'جاري التحقق...' : 'تأكيد الدخول كمدير 🔐'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-4 px-2 sm:px-4 font-sans text-right select-none">
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-4 py-3 rounded-2xl shadow-lg border text-sm font-black backdrop-blur ${toast.type === 'success'
          ? 'bg-[#eafbf2] border-[#00bf63] text-[#00bf63]'
          : toast.type === 'error'
            ? 'bg-[#fff1f2] border-[#ef4444] text-[#ef4444]'
            : 'bg-[#eff6ff] border-[#3b82f6] text-[#2563eb]'
          }`}>
          {toast.text}
        </div>
      )}
      
      {/* Admin Dashboard header info */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-800 flex items-center gap-2">
            <span>لوحة تحكم متجر الشوربجي 🧼</span>
            <span className="text-[10px] sm:text-xs bg-red-100/80 text-red-600 px-3 py-1 rounded-full font-black animate-pulse">
              مرحباً: {adminDisplayName} 👤
            </span>
          </h1>
          <p className="text-xs text-gray-400 font-bold mt-1">
            إدارة مباشرة وفورية للمخزن، تحديث الأسعار، تعديل لافتة الإعلان الرئيسي وتتبع كشف الطلبات المستلمة.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={requestNotificationPermission}
            className={`px-4 py-2 text-xs font-black rounded-xl transition-all border shadow-xs cursor-pointer flex items-center gap-1.5 ${
              notificationPermission === 'granted'
                ? 'bg-green-50 text-[#00bf63] border-green-200'
                : 'bg-[#00bf63] text-white hover:bg-brand-green-dark animate-pulse'
            }`}
          >
            <span>{notificationPermission === 'granted' ? 'الإشعارات مفعلة ✅' : 'تشغيل الإشعارات المستمرة 🔔'}</span>
          </button>

          <button
            onClick={() => onRefreshData()}
            className="px-4 py-2 bg-gray-150 hover:bg-gray-200 text-gray-700 text-xs font-black rounded-xl transition-colors border border-gray-200 cursor-pointer"
          >
            تحديث البيانات 🔄
          </button>
          
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 text-xs font-black rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <FaSignOutAlt />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>

      {/* Grid Stats blocks */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <button
          onClick={() => {
            setActiveTab('products');
            setOnlyShowOutOfStock(false);
            setIsAdminCategoryMode(false);
            setAdminSearchQuery('');
          }}
          className="text-right w-full bg-gradient-to-br from-[#eefaf3] to-white p-4 rounded-2xl border border-[#d6f5e3] flex items-center justify-between cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <div>
            <span className="text-[10px] md:text-xs text-gray-500 font-extrabold block">إجمالي المنتجات 📦</span>
            <span className="text-xl md:text-3xl font-black text-gray-800 mt-1 block">{products.length} منتج</span>
          </div>
          <div className="text-lg md:text-2xl text-[#00bf63] w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-xs">
            <FaCubes />
          </div>
        </button>

        <button
          onClick={() => {
            setActiveTab('products');
            setOnlyShowOutOfStock(false);
            setIsAdminCategoryMode(false);
            setAdminSearchQuery('');
          }}
          className="text-right w-full bg-gradient-to-br from-blue-50 to-white p-4 rounded-2xl border border-blue-100 flex items-center justify-between cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <div>
            <span className="text-[10px] md:text-xs text-gray-500 font-extrabold block">مستودع المخزون 🏭</span>
            <span className="text-xl md:text-3xl font-black text-gray-800 mt-1 block">{totalStock} قطعة</span>
          </div>
          <div className="text-lg md:text-2xl text-blue-500 w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-xs">
            <FaDollyFlatbed />
          </div>
        </button>

        <button
          onClick={() => {
            setActiveTab('products');
            setOnlyShowOutOfStock(true);
            setIsAdminCategoryMode(false);
            setAdminSearchQuery('');
          }}
          className={`text-right w-full bg-gradient-to-br from-amber-50 to-white p-4 rounded-2xl border flex items-center justify-between cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all ${
            onlyShowOutOfStock ? 'border-red-400 ring-2 ring-red-100' : 'border-amber-100'
          }`}
        >
          <div>
            <span className="text-[10px] md:text-xs text-gray-500 font-extrabold block">منتجات نفدت ⚠️</span>
            <span className="text-xl md:text-3xl font-black text-red-600 mt-1 block">{outOfStockItems} منتج</span>
          </div>
          <div className="text-lg md:text-2xl text-amber-500 w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-xs">
            <FaLock className="text-red-500" />
          </div>
        </button>

        {(() => {
          const pendingCount = orders.filter(o => o.status !== 'delivered').length;
          const isPulsing = pendingCount > 0;
          return (
            <button
              onClick={() => {
                setActiveTab('orders');
                fetchOrders(true);
              }}
              className={`text-right w-full bg-gradient-to-br p-4 rounded-2xl border flex items-center justify-between cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all ${
                isPulsing 
                  ? 'from-red-50 to-white border-red-200 ring-2 ring-red-100 animate-pulse' 
                  : 'from-purple-50 to-white border-purple-100'
              }`}
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] md:text-xs text-gray-500 font-extrabold block">الطلبات المستلمة ({orders.length})</span>
                  {isPulsing && (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                  )}
                </div>
                <span className={`text-xl md:text-2xl font-black mt-1 block ${isPulsing ? 'text-red-600' : 'text-purple-600'}`}>
                  {orders.reduce((sum, o) => sum + o.total, 0).toLocaleString('ar-EG')} ج.م
                </span>
                {isPulsing && (
                  <span className="text-[9px] text-red-500 font-black block animate-bounce mt-0.5">
                    ⚠️ لديك {pendingCount} طلب قيد الانتظار!
                  </span>
                )}
              </div>
              <div className="text-lg md:text-2xl text-purple-500 w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-xs">
                <FaMoneyBillWave className={isPulsing ? 'text-red-500 animate-spin-slow' : ''} />
              </div>
            </button>
          );
        })()}
      </div>

      {/* Tabs list switches */}
      <div className="flex border-b border-gray-200 mb-6 gap-2">
        <button
          onClick={() => { setActiveTab('products'); setOnlyShowOutOfStock(false); }}
          className={`px-5 py-3 text-xs md:text-sm font-black border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'products' ? 'border-[#00bf63] text-[#00bf63]' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <FaBoxOpen />
          <span>المخزون والمنتجات ({products.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('orders'); fetchOrders(); }}
          className={`px-5 py-3 text-xs md:text-sm font-black border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'orders' ? 'border-[#00bf63] text-[#00bf63]' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <FaClipboardList />
          <span>الطلبات الواردة حياً ({orders.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('categories'); }}
          className={`px-5 py-3 text-xs md:text-sm font-black border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'categories' ? 'border-[#00bf63] text-[#00bf63]' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
        >
          <FaTags />
          <span>إدارة الأقسام ({categories.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('inventory'); }}
          className={`px-5 py-3 text-xs md:text-sm font-black border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'inventory' ? 'border-[#00bf63] text-[#00bf63]' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <FaCubes className="text-amber-500 animate-pulse" />
          <span>حسابات وجدول المخزون والربح الكلي 📊</span>
        </button>

        <button
          onClick={() => { setActiveTab('banner'); }}
          className={`px-5 py-3 text-xs md:text-sm font-black border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'banner' ? 'border-[#00bf63] text-[#00bf63]' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <FaSlidersH />
          <span>لافتة الإعلان الرئيسية</span>
        </button>

        <button
          onClick={() => { setActiveTab('users'); }}
          className={`px-5 py-3 text-xs md:text-sm font-black border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'users' ? 'border-[#00bf63] text-[#00bf63]' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <FaLock className="text-blue-500" />
          <span>إعدادات المشرفين والمستخدمين 👥</span>
        </button>

        <button
          onClick={() => { setActiveTab('qrcode'); }}
          className={`px-5 py-3 text-xs md:text-sm font-black border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'qrcode' ? 'border-[#00bf63] text-[#00bf63]' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <span className="text-base">📱</span>
          <span>رمز الـ QR ومشاركة المتجر</span>
        </button>
      </div>

      {/**************** TAB: PRODUCTS *****************/}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h3 className="text-lg font-black text-gray-800 flex items-center gap-2 flex-wrap">
              <span>{isAdminCategoryMode ? 'تصفح وعرض المنتجات حسب الأقسام 📦' : 'قائمة معروضات المتجر والمخزن الكلي 📋'}</span>
              {onlyShowOutOfStock && (
                <span className="bg-red-50 border border-red-200 text-red-600 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 animate-pulse-subtle">
                  <span>المنتجات النافذة فقط ⚠️</span>
                  <button
                    type="button"
                    onClick={() => setOnlyShowOutOfStock(false)}
                    className="hover:text-red-800 text-xs font-black cursor-pointer bg-red-100 rounded-full w-4.5 h-4.5 flex items-center justify-center"
                    title="عرض الكل"
                  >
                    ✕
                  </button>
                </span>
              )}
            </h3>
            
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="ابحث عن منتج بالاسم أو الماركة..."
                  value={adminSearchQuery}
                  onChange={(e) => setAdminSearchQuery(e.target.value)}
                  className="px-4 py-3 pr-9 text-xs font-black border border-gray-200 rounded-xl focus:outline-none focus:border-[#00bf63] bg-white w-48 sm:w-56 focus:w-64 transition-all text-right shadow-xs"
                />
                <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              </div>

              <button
                onClick={openAddModal}
                className="px-5 py-3 bg-[#00bf63] hover:bg-brand-green-dark text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 cursor-pointer transition-colors"
              >
                <FaPlus />
                <span>إضافة منتج جديد للمخزن</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (isAdminCategoryMode) {
                    setIsAdminCategoryMode(false);
                    setSelectedAdminCategory(null);
                  } else {
                    setIsAdminCategoryMode(true);
                    setSelectedAdminCategory(categories.length > 0 ? categories[0].id : null);
                  }
                }}
                className={`px-5 py-3 rounded-xl text-xs font-black shadow-sm flex items-center gap-2 cursor-pointer transition-all border ${
                  isAdminCategoryMode 
                    ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' 
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {isAdminCategoryMode ? (
                  <>
                    <FaBoxOpen />
                    <span>عرض جميع المنتجات</span>
                  </>
                ) : (
                  <>
                    <FaCubes />
                    <span>تصفح وتعديل حسب الأقسام</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Categories Grid (Visible only in isAdminCategoryMode) */}
          {isAdminCategoryMode && (
            <div className="bg-gray-50/50 p-4 border border-gray-150 rounded-2xl">
              <span className="block text-xs font-extrabold text-gray-500 mb-3 text-right">أقسام المتجر المتوفرة بالمستودع:</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {categories.map((cat) => {
                  const productCount = products.filter(p => p.category === cat.id).length;
                  const isSelected = selectedAdminCategory === cat.id;
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setSelectedAdminCategory(cat.id)}
                      className={`p-3.5 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-[#00bf63] bg-green-50/40 text-[#00bf63] font-black ring-2 ring-[#00bf63]/20 shadow-xs' 
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50/50 hover:border-gray-300'
                      }`}
                    >
                      <img src={cat.image || 'https://res.cloudinary.com/dglhc1pfj/image/upload/v1718817951/tag-placeholder_u5gy9y.png'} alt={cat.name} className="w-8 h-8 object-contain rounded-md" />
                      <span className="text-xs font-black truncate max-w-full">{cat.name}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        isSelected 
                          ? 'bg-green-100/60 border-green-200 text-green-700' 
                          : 'bg-gray-50 border-gray-100 text-gray-400'
                      }`}>
                        {productCount} منتج
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {(() => {
            const filtered = products.filter((p) => {
              if (onlyShowOutOfStock) {
                const stockVal = p.stock !== undefined ? p.stock : 100;
                if (stockVal > 0) return false;
              }
              if (isAdminCategoryMode && selectedAdminCategory) {
                if (p.category !== selectedAdminCategory) return false;
              }
              if (adminSearchQuery.trim()) {
                const query = adminSearchQuery.toLowerCase();
                const matchesTitle = p.title.toLowerCase().includes(query);
                const matchesBrand = p.brand?.toLowerCase().includes(query);
                const matchesId = p.id.toLowerCase().includes(query);
                return matchesTitle || matchesBrand || matchesId;
              }
              return true;
            });

            if (filtered.length === 0) {
              return (
                <div className="text-center py-16 bg-white border border-gray-150 rounded-2xl shadow-xs space-y-3">
                  <span className="text-3xl">🔍</span>
                  <p className="text-sm font-black text-gray-700">لم يتم العثور على أي منتجات مطابقة للبحث أو القسم</p>
                  <p className="text-[11px] text-gray-400 font-bold max-w-md mx-auto leading-relaxed font-sans">
                    لم نجد أي منتجات تطابق عبارة البحث " {adminSearchQuery} " أو الاختيارات المحددة حالياً. بإمكانك تعديل البحث أو الضغط على زر إضافة منتج جديد.
                  </p>
                </div>
              );
            }

            return (
              <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-[10px] md:text-xs text-gray-500 font-extrabold">
                        <th className="p-3 md:p-4">المنتج</th>
                        <th className="p-3 md:p-4">الشركة والماركة</th>
                        <th className="p-3 md:p-4">السعر الأصلي</th>
                        <th className="p-3 md:p-4">السعر بعد الخصم</th>
                        <th className="p-3 md:p-4">المتاح في المخزن</th>
                        <th className="p-3 md:p-4 text-center">أدوات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                      {filtered.map((p) => {
                        const isLowStock = p.stock !== undefined && p.stock <= 5;
                        const isOutOfStock = p.stock !== undefined && p.stock <= 0;
                        return (
                          <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-3 md:p-4">
                              <div className="flex items-center gap-3">
                                <img 
                                  src={p.image} 
                                  alt={p.title} 
                                  className="w-10 h-10 rounded-lg object-cover border border-gray-200 bg-gray-50 shadow-2xs"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="flex flex-col max-w-[240px] md:max-w-md">
                                  <span className="font-extrabold text-gray-800 line-clamp-1">{p.title}</span>
                                  <span className="text-[10px] text-gray-400 mt-0.5 font-bold">المعرف: {p.id}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 md:p-4 font-bold text-gray-600">
                              {p.brand}
                            </td>
                            <td className="p-3 md:p-4 font-black text-gray-800">
                              {p.price} ج.م
                            </td>
                            <td className="p-3 md:p-4 font-black text-[#00bf63]">
                              {p.discountPrice ? `${p.discountPrice} ج.م` : <span className="text-gray-400 font-semibold">—</span>}
                            </td>
                            <td className="p-3 md:p-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                                isOutOfStock 
                                  ? 'bg-red-100 text-red-600 border border-red-200' 
                                  : isLowStock 
                                    ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                                    : 'bg-green-100 text-green-700 border border-green-200'
                              }`}>
                                {p.stock !== undefined ? p.stock : 100} قطعة {' '}
                                {isOutOfStock ? '(نفد)' : isLowStock ? '(حرج)' : ''}
                              </span>
                            </td>
                            <td className="p-3 md:p-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => openEditModal(p)}
                                  title="تعديل المنتج"
                                  className="p-1.5 md:p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer text-xs"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  onClick={() => openDeleteModal(p)}
                                  title="حذف أو تقليل الكمية"
                                  className="p-1.5 md:p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors cursor-pointer text-xs"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/**************** TAB: ORDERS *****************/}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-gray-800">سجل الطلبات الحية المستلمة</h3>
            <span className="text-xs text-gray-400 font-extrabold">عدد الطلبات المسجلة: {orders.length} طلب</span>
          </div>

          {isOrdersLoading ? (
            <div className="text-center py-16 bg-white border border-gray-150 rounded-2xl shadow-xs">
              <span className="text-sm text-gray-400 font-black animate-pulse">جاري تحميل كرت الطلبات... 🔄</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-14 bg-white border border-gray-150 rounded-2xl shadow-xs p-8">
              <div className="w-14 h-14 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center text-xl mx-auto mb-3">
                🫙
              </div>
              <h4 className="text-base font-black text-gray-700">لا يوجد طلبات حتى الأن!</h4>
              <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto leading-relaxed">
                أي منتجات يقوم المشتري بطلبها من السلة سوف تظهر وتقل من حساب المخازن فوراً.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                return (
                  <div key={order.orderId} className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs text-right">
                    
                    {/* ID and date bar */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-gray-100 pb-3 mb-4 text-xs font-black">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-black text-gray-800">رقم الطلب: {order.orderId}</span>
                        <span className="bg-[#00bf63]/10 text-[#00bf63] px-2.5 py-0.5 rounded-full text-[10px]">
                          دفع عند الاستلام (COD)
                        </span>
                        {order.status === 'delivered' ? (
                          <span className="bg-green-100 text-green-700 border border-green-200 px-2.5 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1">
                            <span>تم التسليم</span>
                            <span>✅</span>
                          </span>
                        ) : order.status === 'cancelled' ? (
                          <span className="bg-red-100 text-red-700 border border-red-200 px-2.5 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1">
                            <span>تم إلغاء الطلب</span>
                            <span>❌</span>
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 animate-pulse">
                            <span>قيد الانتظار</span>
                            <span>⏳</span>
                          </span>
                        )}
                      </div>
                      <span className="text-gray-400 font-bold">{order.date}</span>
                    </div>

                    {/* Customer specs details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 bg-gray-50/50 p-3.5 rounded-xl border border-gray-200/50 text-xs">
                      <div>
                        <span className="text-[10px] text-gray-400 font-semibold block">اسم العميل</span>
                        <span className="font-extrabold text-gray-800 mt-0.5 block">{order.customerInfo.name}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 font-semibold block">رقم الهاتف</span>
                        <a href={`tel:${order.customerInfo.phone}`} className="font-extrabold text-blue-600 hover:underline mt-0.5 block tracking-widest text-left md:text-right">
                          {order.customerInfo.phone} 📞
                        </a>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 font-semibold block">العنوان والتوصيل</span>
                        <span className="font-extrabold text-gray-800 mt-0.5 block">
                          المنطقة: {order.customerInfo.governorate} • المحل: {order.customerInfo.city} • العنوان: {order.customerInfo.address}
                        </span>
                      </div>
                    </div>

                    {/* Ordered Items list */}
                    <div className="space-y-2.5 border-b border-gray-100 pb-4 mb-4">
                      <span className="block text-xs font-black text-gray-800 mb-2">المنتجات المطلوبة في سلة العميل:</span>
                      {order.items.map((item, idx) => {
                        const price = item.product.discountPrice || item.product.price;
                        return (
                          <div key={idx} className="flex items-center justify-between text-xs font-extrabold text-gray-600 py-1">
                            <div className="flex items-center gap-3">
                              <img 
                                src={item.product.image} 
                                alt={item.product.title} 
                                className="w-8 h-8 rounded-md object-cover border border-gray-200"
                                referrerPolicy="no-referrer"
                              />
                              <div className="flex flex-col">
                                <span className="text-gray-800 font-black">{item.product.title}</span>
                                <span className="text-[10px] text-gray-400 mt-0.5 font-semibold">
                                  سعر القطعة: {price} ج.م | العلامة: {item.product.brand}
                                </span>
                              </div>
                            </div>
                            <span className="text-gray-800 font-black text-left">
                              {item.quantity} × {price} = {item.quantity * price} ج.م
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Price structure summary */}
                    <div className="flex items-center justify-between text-xs font-bold text-gray-500 font-sans pb-4 border-b border-gray-100/60">
                      <div className="flex gap-4">
                        <span>قيمة المنتجات: <strong className="text-gray-800">{order.subtotal} ج.م</strong></span>
                        <span>مصاريف الشحن: <strong className="text-gray-800">{order.shipping} ج.م</strong></span>
                      </div>
                      <div className="text-sm md:text-base font-black text-gray-800">
                        الإجمالي الكلي: <span className="text-[#00bf63] font-serif">{order.total} ج.م</span>
                      </div>
                    </div>

                    {/* Action Buttons panel */}
                    <div className="mt-4 flex flex-wrap gap-2.5 items-center justify-end">
                      {order.status === 'cancelled' ? (
                        <>
                          <div className="px-3.5 py-2.5 bg-red-100/60 text-red-800 rounded-xl text-[11px] font-black border border-red-200/50 flex items-center gap-1.5 shadow-2xs">
                            <span>الطلب ملغي ومسترجع للمخزن ❌</span>
                          </div>
                          <button
                            onClick={async () => {
                              if (confirm('هل تريد إعادة هذا الطلب الملغي إلى قيد الانتظار؟ سيتم خصم الكميات من المخزن مرة أخرى.')) {
                                try {
                                  try {
                                    await updateFirestoreOrderStatus((order as any).id || order.orderId, 'pending');
                                    fetchOrders(true); // reload silently
                                  } catch (err) {
                                    alert('خطأ في الاتصال بـ Firestore وتعديل الحالة.');
                                  }
                                } catch (err) {
                                  alert('خطأ في الاتصال بالخادم وتعديل الحالة.');
                                }
                              }
                            }}
                            className="px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-[11px] font-black border border-amber-200 shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                          >
                            <span>استعادة الطلب (قيد الانتظار) ⏳</span>
                          </button>
                        </>
                      ) : (
                        <>
                          {order.status !== 'delivered' ? (
                            <button
                              onClick={async () => {
                                try {
                                  try {
                                    await updateFirestoreOrderStatus((order as any).id || order.orderId, 'delivered');
                                    fetchOrders(true); // reload silently
                                  } catch (err) {
                                    alert('خطأ في الاتصال بـ Firestore وتعديل الحالة.');
                                  }
                                } catch (err) {
                                  alert('خطأ في الاتصال بالخادم وتعديل الحالة.');
                                }
                              }}
                              className="px-3.5 py-2.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl text-[11px] font-black border border-green-200 shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                            >
                              <span>توصيل وتسليم الطلب 📦✅</span>
                            </button>
                          ) : (
                            <>
                              <div className="px-3.5 py-2.5 bg-green-100/60 text-green-800 rounded-xl text-[11px] font-black border border-green-200/50 flex items-center gap-1.5 shadow-2xs">
                                <span>تم توصيل وتسليم الطلب 📦✅</span>
                              </div>
                              <button
                                onClick={async () => {
                                  if (confirm('هل تريد إلغاء حالة التسليم وإعادة هذا الطلب إلى قيد الانتظار؟')) {
                                    try {
                                      try {
                                        await updateFirestoreOrderStatus((order as any).id || order.orderId, 'pending');
                                        fetchOrders(true); // reload silently
                                      } catch (err) {
                                        alert('خطأ في الاتصال بـ Firestore وتعديل الحالة.');
                                      }
                                    } catch (err) {
                                      alert('خطأ في الاتصال بالخادم وتعديل الحالة.');
                                    }
                                  }
                                }}
                                className="px-3 py-2 bg-gray-50 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-gray-500 rounded-xl text-[10px] font-black border border-gray-200 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                                title="تراجع عن التسليم وإعادته لقيد الانتظار"
                              >
                                <span>تراجع عن التسليم 🔄</span>
                              </button>
                            </>
                          )}

                          <button
                            onClick={async () => {
                              if (confirm('هل أنت متأكد من إلغاء هذا الطلب؟ سيتم إرجاع جميع كميات منتجاته إلى المخزن تلقائياً.')) {
                                try {
                                  try {
                                    await updateFirestoreOrderStatus((order as any).id || order.orderId, 'cancelled');
                                    fetchOrders(true); // reload silently
                                  } catch (err) {
                                    alert('خطأ في الاتصال بـ Firestore وتعديل الحالة.');
                                  }
                                } catch (err) {
                                  alert('خطأ في الاتصال بالخادم وتعديل الحالة.');
                                }
                              }
                            }}
                            className="px-3.5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-[11px] font-black border border-red-200 shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                          >
                            <span>إلغاء الطلب ❌</span>
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => {
                          setSelectedDetailedOrder(order);
                          setIsOrderDetailsModalOpen(true);
                        }}
                        className="px-3.5 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-[11px] font-black border border-gray-200/60 shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                      >
                        <FaEye className="text-gray-500" />
                        <span>تفاصيل الطلب 🔍</span>
                      </button>

                      <button
                        onClick={() => handlePrintOrder(order)}
                        className="px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-[11px] font-black border border-blue-200/60 shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                      >
                        <FaPrint className="text-blue-500" />
                        <span>طباعة الطلب 🖨️</span>
                      </button>

                      <a
                        href={getWhatsAppManagerLink(order)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2.5 bg-[#25d366]/10 hover:bg-[#25d366]/20 text-[#1a9a46] rounded-xl text-[11px] font-black border border-[#25d366]/30 shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 decoration-transparent"
                      >
                        <FaWhatsapp className="text-[#25d366] text-sm" />
                        <span>إرسال إليّ (الأدمن واتساب) 📲</span>
                      </a>

                      <a
                        href={getWhatsAppCustomerLink(order)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-[11px] font-black border border-purple-200/50 shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 decoration-transparent"
                      >
                        <FaWhatsapp className="text-purple-600 text-sm" />
                        <span>تأكيد واستلام (العميل واتساب) 💬</span>
                      </a>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/**************** TAB: CATEGORIES *****************/}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
              <FaTags />
              <span>إدارة أقسام المنتجات ({categories.length})</span>
            </h3>
            <button
              onClick={openAddCategoryModal}
              className="px-5 py-3 bg-[#00bf63] hover:bg-brand-green-dark text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 cursor-pointer transition-colors"
            >
              <FaPlus />
              <span>إضافة قسم جديد</span>
            </button>
          </div>

          {categories.length === 0 ? (
            <div className="text-center py-16 bg-white border border-gray-150 rounded-2xl shadow-xs space-y-3">
              <p className="text-sm font-black text-gray-700">لا توجد أقسام مضافة بعد.</p>
              <p className="text-xs text-gray-400 font-bold">انقر على "إضافة قسم جديد" للبدء.</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 font-extrabold">
                      <th className="p-4">صورة القسم</th>
                      <th className="p-4">اسم القسم</th>
                      <th className="p-4">عدد المنتجات</th>
                      <th className="p-4 text-center">أدوات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                    {categories.map((cat) => {
                      const productCount = products.filter(p => p.category === cat.id).length;
                      return (
                        <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-2">
                            <img
                              src={cat.image || 'https://res.cloudinary.com/dglhc1pfj/image/upload/v1718817951/tag-placeholder_u5gy9y.png'}
                              alt={cat.name}
                              className="w-12 h-12 object-contain rounded-lg bg-gray-50 border border-gray-100"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://res.cloudinary.com/dglhc1pfj/image/upload/v1718817951/tag-placeholder_u5gy9y.png';
                              }}
                              referrerPolicy="no-referrer"
                            />
                          </td>
                          <td className="p-4 font-black text-gray-800">{cat.name}</td>
                          <td className="p-4 font-bold">{productCount} منتج</td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openEditCategoryModal(cat)}
                                title="تعديل القسم"
                                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer text-sm"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={async () => {
                                  if (productCount > 0) {
                                    alert('لا يمكن حذف هذا القسم لأنه يحتوي على منتجات. يرجى نقل المنتجات إلى قسم آخر أولاً.');
                                    return;
                                  }
                                  if (confirm(`هل أنت متأكد من رغبتك في حذف قسم "${cat.name}"؟ لا يمكن التراجع عن هذا الإجراء.`)) {
                                    try {
                                      await deleteFirestoreCategory(cat.id);
                                      showToast('success', 'تم حذف القسم بنجاح.');
                                      onRefreshData();
                                    } catch (err) {
                                      showToast('error', 'فشل حذف القسم.');
                                    }
                                  }
                                }}
                                title="حذف القسم"
                                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors cursor-pointer text-sm"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/**************** TAB: INVENTORY *****************/}
      {activeTab === 'inventory' && (
        <div className="space-y-6 text-right">
          {/* Main header block */}
          <div className="bg-gradient-to-r from-emerald-600 to-[#00bf63] text-white p-6 rounded-3xl shadow-xs relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xl font-black mb-1.5 flex items-center gap-2">
                <FaCubes className="text-amber-300 animate-pulse" />
                <span>إدارة حسابات المخازن والأرباح 📊</span>
              </h3>
              <p className="text-xs text-white/90 font-bold max-w-2xl">
                هنا يتم احتساب حركة المبيعات والمشتريات والكميات المضافة لكل منتج تلقائياً بناءً على فواتير الشراء والطلبات الفعلية المستلمة.
              </p>
            </div>
            <div className="absolute top-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-x-12 -translate-y-12"></div>
          </div>

          {selectedInventoryProduct ? (
            /* DETAILED PRODUCT LEDGER VIEW */
            (() => {
              const p = selectedInventoryProduct;
              // 1. Get sales entries for this product
              const pSales: any[] = [];
              (orders || []).forEach(order => {
                order.items.forEach(item => {
                  if (item.product.id === p.id) {
                    pSales.push({
                      orderId: order.orderId,
                      date: order.date,
                      quantity: item.quantity,
                      salePrice: item.product.discountPrice || item.product.price,
                      totalRevenue: item.quantity * (item.product.discountPrice || item.product.price)
                    });
                  }
                });
              });

              // 2. Get purchase entries for this product (with fallback)
              const pPurchases = p.purchaseHistory && p.purchaseHistory.length > 0 
                ? p.purchaseHistory 
                : (() => {
                    const soldQty = pSales.reduce((sum, s) => sum + s.quantity, 0);
                    const initialQty = (p.stock !== undefined ? p.stock : 100) + soldQty;
                    const pPrice = p.purchasePrice || p.price * 0.7;
                    return [{
                      id: 'initial',
                      date: 'تاريخ التأسيس (رصيد أول المدة)',
                      quantity: initialQty,
                      purchasePrice: pPrice,
                      totalCost: initialQty * pPrice
                    }];
                  })();

              // 3. Financial calculations
              const totalPurchasedQty = pPurchases.reduce((sum, r) => sum + r.quantity, 0);
              const totalPurchasedCost = pPurchases.reduce((sum, r) => sum + r.totalCost, 0);
              
              const totalSoldQty = pSales.reduce((sum, s) => sum + s.quantity, 0);
              const totalSoldRevenue = pSales.reduce((sum, s) => sum + s.totalRevenue, 0);

              // COGS based on average cost of batches
              const avgPurchaseUnitCost = totalPurchasedQty > 0 ? (totalPurchasedCost / totalPurchasedQty) : (p.purchasePrice || p.price * 0.7);
              const costOfGoodsSold = totalSoldQty * avgPurchaseUnitCost;
              const productNetProfit = totalSoldRevenue - costOfGoodsSold;

              return (
                <div className="space-y-6">
                  <div className="flex justify-between items-center flex-wrap gap-3">
                    <button
                      onClick={() => setSelectedInventoryProduct(null)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-black cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <span>← العودة لجدول المخزون العام</span>
                    </button>
                    <h4 className="text-sm font-black text-gray-400">سجل المعاملات والربحية التفصيلية للمنتج</h4>
                  </div>

                  {/* Product Info Card */}
                  <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-xs grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div className="flex items-center gap-3 col-span-1 md:col-span-2">
                      <img src={p.image} alt={p.title} className="w-16 h-16 rounded-xl object-contain border border-gray-100 bg-gray-50 p-1" />
                      <div>
                        <h4 className="text-sm font-black text-gray-800 leading-tight">{p.title}</h4>
                        <p className="text-[11px] text-gray-400 font-bold mt-1 flex items-center gap-1.5">
                          <span>الماركة: <strong className="text-gray-600">{p.brand}</strong></span>
                          <span>•</span>
                          <span>القسم: <strong className="text-gray-600">{(categories || []).find(c => c.id === p.category)?.name || p.category}</strong></span>
                        </p>
                        {p.barcode && (
                          <div className="text-[10px] text-gray-500 font-mono mt-1.5 bg-gray-50 px-2 py-0.5 rounded-md inline-block border border-gray-100">
                            Barcode: {p.barcode}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 text-center">
                      <span className="block text-[10px] text-emerald-700 font-black mb-1">الكمية المتبقية بالمخزن 📦</span>
                      <strong className="text-base text-emerald-600 font-black">{p.stock ?? 0} قطعة</strong>
                    </div>
                    <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100 text-center">
                      <span className="block text-[10px] text-amber-700 font-black mb-1">إجمالي المبيعات المحققة 🛒</span>
                      <strong className="text-base text-amber-600 font-black">{totalSoldQty} قطعة مباعة</strong>
                    </div>
                  </div>

                  {/* Financial Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50/40 border border-blue-100 p-4 rounded-2xl">
                      <span className="block text-[11px] text-blue-700 font-bold mb-1">إجمالي تكلفة المشتريات 💸</span>
                      <strong className="text-lg font-black text-blue-800">{totalPurchasedCost.toLocaleString('ar-EG')} ج.م</strong>
                      <span className="block text-[10px] text-blue-500 font-semibold mt-1">تضم {totalPurchasedQty} قطعة مضافة</span>
                    </div>

                    <div className="bg-amber-50/40 border border-amber-100 p-4 rounded-2xl">
                      <span className="block text-[11px] text-amber-700 font-bold mb-1">إجمالي مبالغ البيع (الإيراد) 💵</span>
                      <strong className="text-lg font-black text-amber-800">{totalSoldRevenue.toLocaleString('ar-EG')} ج.م</strong>
                      <span className="block text-[10px] text-amber-500 font-semibold mt-1">تضم {totalSoldQty} قطعة مباعة</span>
                    </div>

                    <div className="bg-red-50/40 border border-red-100 p-4 rounded-2xl">
                      <span className="block text-[11px] text-red-700 font-bold mb-1">تكلفة البضاعة المباعة (COGS) 📉</span>
                      <strong className="text-lg font-black text-red-800">{costOfGoodsSold.toLocaleString('ar-EG')} ج.م</strong>
                      <span className="block text-[10px] text-red-500 font-semibold mt-1">متوسط تكلفة القطعة: {avgPurchaseUnitCost.toFixed(1)} ج.م</span>
                    </div>

                    <div className="bg-[#00bf63]/10 border border-[#00bf63]/25 p-4 rounded-2xl">
                      <span className="block text-[11px] text-[#00bf63] font-bold mb-1">صافي أرباح المنتج (المكسب) 📈</span>
                      <strong className="text-lg font-black text-[#1a9a46]">{productNetProfit.toLocaleString('ar-EG')} ج.م</strong>
                      <span className="block text-[10px] text-emerald-600 font-semibold mt-1">هامش الربح: {totalSoldRevenue > 0 ? ((productNetProfit / totalSoldRevenue) * 100).toFixed(1) : 0}%</span>
                    </div>
                  </div>

                  {/* Left and Right Tables */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* PURCHASES TABLE */}
                    <div className="bg-white border border-gray-150 rounded-2xl shadow-xs overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
                        <h5 className="text-xs font-black text-gray-700">📋 سجل المشتريات والكميات المضافة (المخزون)</h5>
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">بين البيانات</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-right">
                          <thead className="bg-gray-50/50 text-[11px] text-gray-500 border-b border-gray-100">
                            <tr>
                              <th className="px-4 py-3 font-bold">التاريخ</th>
                              <th className="px-4 py-3 font-bold text-center">الكمية المضافة</th>
                              <th className="px-4 py-3 font-bold text-left">سعر شراء الوحدة</th>
                              <th className="px-4 py-3 font-bold text-left">إجمالي التكلفة</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {pPurchases.map((rec, idx) => (
                              <tr key={rec.id || idx} className="hover:bg-gray-50/50">
                                <td className="px-4 py-3 font-bold text-gray-600">{rec.date}</td>
                                <td className="px-4 py-3 font-black text-center text-blue-600">+{rec.quantity} قطعة</td>
                                <td className="px-4 py-3 font-mono text-left text-gray-500">{Number(rec.purchasePrice).toFixed(1)} ج.م</td>
                                <td className="px-4 py-3 font-black text-left text-gray-700">{Number(rec.totalCost).toLocaleString('ar-EG')} ج.م</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* SALES TABLE */}
                    <div className="bg-white border border-gray-150 rounded-2xl shadow-xs overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
                        <h5 className="text-xs font-black text-gray-700">🛒 سجل المبيعات والعمليات المسجلة</h5>
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">من الطلبات</span>
                      </div>
                      <div className="overflow-x-auto">
                        {pSales.length === 0 ? (
                          <div className="p-8 text-center text-gray-400 font-bold">
                            لا توجد أي مبيعات مسجلة لهذا المنتج حتى الآن.
                          </div>
                        ) : (
                          <table className="w-full text-xs text-right">
                            <thead className="bg-gray-50/50 text-[11px] text-gray-500 border-b border-gray-100">
                              <tr>
                                <th className="px-4 py-3 font-bold">رقم الطلب / التاريخ</th>
                                <th className="px-4 py-3 font-bold text-center">الكمية المباعة</th>
                                <th className="px-4 py-3 font-bold text-left">سعر البيع</th>
                                <th className="px-4 py-3 font-bold text-left">إجمالي الإيراد</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {pSales.map((sale, idx) => (
                                <tr key={idx} className="hover:bg-gray-50/50">
                                  <td className="px-4 py-3">
                                    <span className="block font-black text-emerald-600">{sale.orderId}</span>
                                    <span className="block text-[10px] text-gray-400 mt-0.5">{sale.date}</span>
                                  </td>
                                  <td className="px-4 py-3 font-black text-center text-amber-600">-{sale.quantity} قطعة</td>
                                  <td className="px-4 py-3 font-mono text-left text-gray-500">{Number(sale.salePrice).toFixed(1)} ج.م</td>
                                  <td className="px-4 py-3 font-black text-left text-gray-700">{Number(sale.totalRevenue).toLocaleString('ar-EG')} ج.م</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            /* GENERAL WAREHOUSE OVERVIEW */
            (() => {
              // 1. Pre-calculate dynamic sales histories for all products
              const dynamicSalesMap: { [productId: string]: any[] } = {};
              (orders || []).forEach(order => {
                order.items.forEach(item => {
                  if (!item.product) return;
                  const pId = item.product.id;
                  if (!dynamicSalesMap[pId]) {
                    dynamicSalesMap[pId] = [];
                  }
                  dynamicSalesMap[pId].push({
                    quantity: item.quantity,
                    salePrice: item.product.discountPrice || item.product.price,
                    totalRevenue: item.quantity * (item.product.discountPrice || item.product.price)
                  });
                });
              });

              // 2. Compute dynamic financial values for each product
              const compiledInventory = (products || []).map(p => {
                const sales = dynamicSalesMap[p.id] || [];
                const totalSold = sales.reduce((sum, s) => sum + s.quantity, 0);
                const totalRevenue = sales.reduce((sum, s) => sum + s.totalRevenue, 0);

                const pPurchases: PurchaseRecord[] = p.purchaseHistory && p.purchaseHistory.length > 0
                  ? p.purchaseHistory
                  : [{
                      id: 'initial',
                      date: 'تاريخ التأسيس (رصيد أول المدة)',
                      quantity: (p.stock ?? 0) + totalSold,
                      purchasePrice: p.purchasePrice || p.price * 0.7,
                      totalCost: ((p.stock ?? 0) + totalSold) * (p.purchasePrice || p.price * 0.7)
                    }];

                const totalPurchasedQty = pPurchases.reduce((sum: number, r) => sum + r.quantity, 0);
                const totalPurchasedCost = pPurchases.reduce((sum: number, r) => sum + r.totalCost, 0);

                const avgPurchaseUnitCost = totalPurchasedQty > 0 ? (totalPurchasedCost / totalPurchasedQty) : (p.purchasePrice || p.price * 0.7);
                const cogs = totalSold * avgPurchaseUnitCost;
                const netProfit = totalRevenue - cogs;
                const currentStockValue = (p.stock ?? 0) * avgPurchaseUnitCost;

                return {
                  product: p,
                  totalSold,
                  totalRevenue,
                  totalPurchasedCost,
                  totalPurchasedQty,
                  cogs,
                  netProfit,
                  currentStockValue,
                  avgPurchaseUnitCost
                };
              });

              // Grand totals
              const grandTotalStockValue = compiledInventory.reduce((sum: number, item) => sum + item.currentStockValue, 0);
              const grandTotalPurchases = compiledInventory.reduce((sum: number, item) => sum + item.totalPurchasedCost, 0);
              const grandTotalRevenue = compiledInventory.reduce((sum: number, item) => sum + item.totalRevenue, 0);
              const grandTotalProfit = compiledInventory.reduce((sum: number, item) => sum + item.netProfit, 0);

              // Group products by category
              const groupedByCategory: { [catId: string]: typeof compiledInventory } = {};
                (categories || []).forEach(cat => {
                groupedByCategory[cat.id] = [];
              });

              compiledInventory.forEach(item => {
                const catId = item.product.category;
                if (!groupedByCategory[catId]) {
                  groupedByCategory[catId] = [];
                }
                groupedByCategory[catId].push(item);
              });

              return (
                <div className="space-y-6">
                  {/* Financial Stats Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-emerald-50 border border-emerald-150 p-4 rounded-2xl relative overflow-hidden">
                      <span className="block text-xs font-black text-emerald-700 mb-1">📦 قيمة البضاعة الحالية بالمخزن</span>
                      <strong className="text-xl font-black text-emerald-800">{grandTotalStockValue.toLocaleString('ar-EG')} ج.م</strong>
                      <span className="block text-[10px] text-emerald-500 font-semibold mt-1">تضم {products.reduce((sum, p) => sum + (p.stock ?? 0), 0)} قطعة متبقية</span>
                    </div>

                    <div className="bg-blue-50 border border-blue-150 p-4 rounded-2xl relative overflow-hidden">
                      <span className="block text-xs font-black text-blue-700 mb-1">💸 إجمالي رأس مال المشتريات الكلي</span>
                      <strong className="text-xl font-black text-blue-800">{grandTotalPurchases.toLocaleString('ar-EG')} ج.م</strong>
                      <span className="block text-[10px] text-blue-500 font-semibold mt-1">قيمة المشتريات التاريخية الكلية</span>
                    </div>

                    <div className="bg-amber-50 border border-amber-150 p-4 rounded-2xl relative overflow-hidden">
                      <span className="block text-xs font-black text-amber-700 mb-1">💵 إجمالي الإيرادات المحققة فعلياً</span>
                      <strong className="text-xl font-black text-amber-800">{grandTotalRevenue.toLocaleString('ar-EG')} ج.م</strong>
                      <span className="block text-[10px] text-amber-500 font-semibold mt-1">قيمة المبيعات المستلمة للطلبات</span>
                    </div>

                    <div className="bg-[#00bf63]/10 border border-[#00bf63]/25 p-4 rounded-2xl relative overflow-hidden">
                      <span className="block text-xs font-black text-[#1a9a46] mb-1">📈 صافي الأرباح المحققة (المكسب الكلي)</span>
                      <strong className="text-xl font-black text-[#1a9a46]">{grandTotalProfit.toLocaleString('ar-EG')} ج.م</strong>
                      <span className="block text-[10px] text-emerald-600 font-semibold mt-1">فارق البيع عن سعر التكلفة الفعلي</span>
                    </div>
                  </div>

                  {/* Render Categories and tables */}
                  {(categories || []).map(cat => {
                    const catItems = groupedByCategory[cat.id] || [];
                    if (catItems.length === 0) return null;

                    const catStockCount = catItems.reduce((sum, item) => sum + (item.product.stock ?? 0), 0);
                    const catSoldQty = catItems.reduce((sum, item) => sum + item.totalSold, 0);

                    return (
                      <div key={cat.id} className="bg-white border border-gray-150 rounded-2xl shadow-xs overflow-hidden">
                        <div className="bg-gray-50/80 px-4 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{cat.icon}</span>
                            <h4 className="text-xs md:text-sm font-black text-gray-800">{cat.name}</h4>
                            <span className="bg-gray-200/60 text-gray-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              {catItems.length} منتج
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] font-bold text-gray-500">
                            <span>المتبقي بالمخزن: <strong className="text-emerald-600">{catStockCount} قطعة</strong></span>
                            <span>•</span>
                            <span>المباع: <strong className="text-amber-600">{catSoldQty} قطعة</strong></span>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-right border-collapse">
                            <thead className="bg-gray-50 text-[11px] text-gray-500 border-b border-gray-100">
                              <tr>
                                <th className="px-4 py-3 font-bold">اسم المنتج والماركة</th>
                                <th className="px-4 py-3 font-bold text-left">سعر شراء الوحدة</th>
                                <th className="px-4 py-3 font-bold text-center">إجمالي الكمية المضافة 📥</th>
                                <th className="px-4 py-3 font-bold text-center">إجمالي المباع 📤</th>
                                <th className="px-4 py-3 font-bold text-center">المتبقي بالمخزن 📦</th>
                                <th className="px-4 py-3 font-bold text-left">قيمة المخزون الحالي</th>
                                <th className="px-4 py-3 font-bold text-left">إجمالي قيمة البيع</th>
                                <th className="px-4 py-3 font-bold text-left">صافي المكسب</th>
                                <th className="px-4 py-3 font-bold text-center">سجل الحسابات</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {catItems.map(item => {
                                const p = item.product;
                                return (
                                  <tr key={p.id} className="hover:bg-gray-50/40 transition-all">
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-2.5">
                                        <img src={p.image} alt={p.title} className="w-10 h-10 rounded-lg object-contain bg-gray-50 border border-gray-100 p-0.5" />
                                        <div>
                                          <span className="block font-black text-gray-800 leading-tight">{p.title}</span>
                                          <span className="block text-[10px] text-gray-400 font-bold mt-0.5">{p.brand}</span>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-left text-gray-600">
                                      {item.avgPurchaseUnitCost.toFixed(1)} ج.م
                                    </td>
                                    <td className="px-4 py-3 text-center font-black text-xs text-blue-600">
                                      {item.totalPurchasedQty} قطعة
                                    </td>
                                    <td className="px-4 py-3 text-center font-bold text-amber-600">
                                      {item.totalSold} قطعة
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <span className={`inline-block px-2 py-0.5 rounded font-black text-xs ${
                                        (p.stock ?? 0) === 0 ? 'bg-red-50 text-red-600 animate-pulse' : 'text-gray-700'
                                      }`}>
                                        {p.stock ?? 0} قطعة
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 font-black text-left text-gray-600">
                                      {item.currentStockValue.toLocaleString('ar-EG')} ج.م
                                    </td>
                                    <td className="px-4 py-3 font-black text-left text-indigo-600">
                                      {item.totalRevenue.toLocaleString('ar-EG')} ج.م
                                    </td>
                                    <td className={`px-4 py-3 font-black text-left ${
                                      item.netProfit > 0 ? 'text-[#1a9a46]' : 'text-gray-500'
                                    }`}>
                                      {item.netProfit > 0 ? `+${item.netProfit.toLocaleString('ar-EG')}` : '0'} ج.م
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <button
                                        onClick={() => setSelectedInventoryProduct(p)}
                                        className="px-3 py-1.5 bg-gray-100 hover:bg-[#00bf63] hover:text-white text-gray-700 rounded-lg text-[10px] font-black cursor-pointer transition-all active:scale-95 flex items-center gap-1 mx-auto"
                                      >
                                        <span>عرض السجل التفصيلي 📜</span>
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()
          )}
        </div>
      )}

      {/**************** TAB: BANNER *****************/}
      {activeTab === 'banner' && (
        <div className="max-w-2xl bg-white border border-gray-150 p-6 rounded-2xl shadow-xs">
          <div className="mb-6">
            <h3 className="text-lg font-black text-gray-800">تعديل الإعلان واللافتة الترحيبية للرئيسية</h3>
            <p className="text-xs text-gray-400 font-bold mt-1">
              تغيير النصوص والصورة والمحتوى المميز أعلى الجزء الرئيسي بعيداً عن كود المصدر.
            </p>
          </div>

          {bannerSuccessMsg && (
            <div className="p-3 bg-green-50 border border-green-200 text-[#00bf63] rounded-xl text-xs font-bold mb-4 text-center">
              {bannerSuccessMsg}
            </div>
          )}

          <form onSubmit={handleUpdateBanner} className="space-y-4 text-right">
            <div>
              <label className="block text-xs font-extrabold text-gray-600 mb-1">الشارة الترويجية (أعلى العنوان)</label>
              <input
                type="text"
                required
                value={formBannerBadge}
                onChange={(e) => setFormBannerBadge(e.target.value)}
                placeholder="مثال: خصومات كبرى بمناسبة الصيف"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#00bf63]/40 focus:border-[#00bf63]"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-gray-600 mb-1">العنوان الرئيسي العريض</label>
              <input
                type="text"
                required
                value={formBannerTitle}
                onChange={(e) => setFormBannerTitle(e.target.value)}
                placeholder="مثال: الشوربجي للمنظفات والورقيات"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-xs sm:text-sm font-black focus:ring-2 focus:ring-[#00bf63]/40"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-gray-600 mb-1">الوصف والفقرة التفصيلية السفلى</label>
              <textarea
                required
                rows={3}
                value={formBannerSubtitle}
                onChange={(e) => setFormBannerSubtitle(e.target.value)}
                placeholder="اكتب نبذة عن المتجر وأسرع خدمة شحن..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-[#00bf63]/40"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-gray-600 mb-1">صورة الخلفية / الإعلان للرئيسية</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                <div className="space-y-2">
                  <input
                    type="url"
                    value={formBannerImage}
                    onChange={(e) => setFormBannerImage(e.target.value)}
                    placeholder="رابط الصورة (https://...)"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-xs text-left font-mono focus:ring-2 focus:ring-[#00bf63]/40"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 font-bold whitespace-nowrap">أو ارفع من جهازك:</span>
                    <label className="flex-1 py-2 px-3 bg-green-50 hover:bg-green-100 text-[#00bf63] border border-[#00bf63]/30 rounded-xl text-center text-xs font-black cursor-pointer transition-colors block">
                      <span>اختر صورة من جهازك 📁</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (event.target?.result) {
                                setFormImages([String(event.target.result)]);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
                <div className="border border-gray-150 rounded-2xl p-2 bg-gray-50 flex items-center justify-center h-28 relative overflow-hidden group">
                  {formImages.length > 0 && formImages[0] ? (
                    <>
                      <img 
                        src={formImages[0]} 
                        alt="معاينة إعلان الرئيسية" 
                        className="max-h-full max-w-full object-contain rounded-lg shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={() => setFormImages([])}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 text-[10px] shadow-sm transition-colors"
                        title="حذف الصورة"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <span className="text-[10px] text-gray-400 font-bold">لا توجد صورة معينة للبانر</span>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-gray-400 font-semibold mt-1">الرابط أو الصورة المرفوعة تمثل واجهة الإعلان والمنتجات على اليمين.</p>
            </div>

            {/* Store Status Toggle */}
            <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-amber-900">حالة فتح وإغلاق المتجر الحالية 🏪</h4>
                  <p className="text-[10px] text-amber-700/80 font-bold mt-0.5">
                    عند إغلاق المتجر، سيتم تعطيل استقبال الطلبات مؤقتاً وسيظهر شريط تنبيه واضح للزوار لتجنب إرسال طلبات جديدة.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formBannerIsClosed} 
                    onChange={(e) => setFormBannerIsClosed(e.target.checked)} 
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-green-500 peer-focus:outline-none rounded-full peer peer-checked:bg-red-500 after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${formBannerIsClosed ? 'bg-red-500 animate-pulse' : 'bg-[#00bf63]'}`} />
                <span className="text-xs font-black text-gray-700">
                  المحل حالياً: {formBannerIsClosed ? '❌ مغلق مؤقتاً (لا يمكن الشراء)' : '✅ مفتوح وجاهز لاستقبال الطلبات'}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isBannerSubmitting}
              className="px-5 py-3.5 bg-[#00bf63] hover:bg-brand-green-dark text-white rounded-xl text-xs font-black shadow-md cursor-pointer disabled:opacity-50 w-full sm:w-auto"
            >
              {isBannerSubmitting ? 'جاري حفظ التحديث...' : 'تأكيد وحفظ الإعدادات 🚀'}
            </button>
          </form>
        </div>
      )}

      {/**************** TAB: USERS *****************/}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-xs">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                  <span>إدارة المشرفين والمستخدمين للوحة التحكم 👥</span>
                  <span className="text-xs bg-blue-100 text-blue-600 px-2.5 py-0.5 rounded-full font-black">
                    {adminUsers.length} مستخدمين
                  </span>
                </h3>
                <p className="text-xs text-gray-400 font-bold mt-1">
                  يمكنك إضافة حتى 4 مستخدمين أو أكثر، وتعيين اسم مستخدم وكلمة مرور مخصصة لكل شخص ليقوم بتسجيل الدخول والتعديل بحسابه الخاص.
                </p>
              </div>
              <button
                onClick={() => {
                  fetchAdminUsers();
                  showUserMessage('success', 'تم تحديث قائمة المشرفين بنجاح! 🔄');
                }}
                className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors cursor-pointer self-start md:self-auto"
              >
                تحديث قائمة المستخدمين 🔄
              </button>
            </div>

            {userTabMsg && (
              <div className={`mb-6 p-4 rounded-xl text-xs font-black text-center border animate-fade-in ${
                userTabMsg.type === 'success' 
                  ? 'bg-green-50 border-green-200 text-green-700' 
                  : 'bg-red-50 border-red-200 text-red-600'
              }`}>
                {userTabMsg.text}
              </div>
            )}

            {isAdminUsersLoading ? (
              <div className="text-center py-12 text-xs font-bold text-gray-400">
                جاري تحميل قائمة المشرفين...
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-150 mb-6">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-150 text-gray-500 text-xs font-extrabold">
                      <th className="p-3">الاسم بالكامل</th>
                      <th className="p-3">اسم المستخدم (Login)</th>
                      <th className="p-3">كلمة المرور</th>
                      <th className="p-3 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map((u, i) => {
                      const isCurrentUser = u.displayName === adminDisplayName || u.email === username;
                      return (
                        <tr key={i} className="border-b border-gray-100 text-xs text-gray-700 hover:bg-gray-50/50">
                          <td className="p-3 font-extrabold text-gray-800">
                            {u.displayName || 'مستخدم غير مسمى'}
                            {isCurrentUser && (
                              <span className="mr-2 text-[10px] bg-green-100 text-[#00bf63] px-2 py-0.5 rounded-full font-black">
                                حسابك الحالي 👤
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-mono text-gray-500 text-left" dir="ltr">{u.username}</td>
                          <td className="p-3 font-mono text-gray-500 text-left" dir="ltr">{u.email}</td>
                          <td className="p-3 text-center flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingUser(u);
                                setEditingAdminName(u.displayName || '');
                                setEditingAdminUsername(u.email || '');
                                setEditAdminError('');
                              }}
                              className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 rounded-lg transition-colors cursor-pointer text-[10px] font-black"
                              title="تعديل بيانات الحساب"
                            >
                              تعديل الحساب ⚙️
                            </button>
                            {deletingUserConfirm?.uid === u.uid ? (
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    setDeletingUserConfirm(null);
                                    if (adminUsers.length <= 1) {
                                      showUserMessage('error', 'لا يمكنك حذف المستخدم الوحيد! يجب أن يبقى مستخدم واحد على الأقل.');
                                      return;
                                    }
                                    if (isCurrentUser) {
                                      showUserMessage('error', 'لا يمكنك حذف الحساب الخاص بك أثناء تسجيل الدخول به حالياً!');
                                      return;
                                    }
                                    try {
                                      await deleteFirestoreUser(u.uid);
                                      showUserMessage('success', 'تم حذف حساب المشرف بنجاح! 🎉');
                                      fetchAdminUsers(); // Refresh list
                                    } catch (err) {
                                      showUserMessage('error', 'خطأ في الاتصال بـ Firestore أثناء الحذف.');
                                    }
                                  }}
                                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer text-[10px] font-black shadow-xs"
                                >
                                  تأكيد الحذف ⚠️
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingUserConfirm(null)}
                                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors cursor-pointer text-[10px] font-black"
                                >
                                  تراجع
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  if (adminUsers.length <= 1) {
                                    showUserMessage('error', 'لا يمكنك حذف المستخدم الوحيد! يجب أن يبقى مستخدم واحد على الأقل.');
                                    return;
                                  }
                                  if (isCurrentUser) {
                                    showUserMessage('error', 'لا يمكنك حذف الحساب الخاص بك أثناء تسجيل الدخول به حالياً!');
                                    return;
                                  }
                                  setDeletingUserConfirm(u);
                                }}
                                className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 rounded-lg transition-colors cursor-pointer text-[10px] font-black"
                                title="حذف الحساب"
                              >
                                حذف الحساب 🗑️
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="border-t border-gray-100 pt-6">
              <h4 className="text-sm font-black text-gray-800 mb-4">➕ إضافة مشرف/مستخدم جديد للوحة التحكم</h4>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newAdminUsername.trim() || !newAdminPassword.trim() || !newAdminName.trim()) {
                    showUserMessage('error', 'برجاء ملء جميع الحقول المطلوبة.');
                    return;
                  }

                  if (adminUsers.some(u => u.email.toLowerCase() === newAdminUsername.trim().toLowerCase())) {
                    showUserMessage('error', 'هذا البريد الإلكتروني مستخدم بالفعل!');
                    return;
                  }

                  try {
                    // This function is in authUtils.ts and should handle both Auth and Firestore user creation
                    // For now, we assume it exists. If not, it needs to be created.
                    // For this example, we'll just show a success message and refresh.
                    // The actual creation would happen in a function like `createNewAdminUser(email, password, name)`
                    showUserMessage('info', 'ميزة إضافة المستخدمين الجدد تتطلب صلاحيات خاصة. حالياً، قم بإضافتهم من لوحة تحكم Firebase.');
                    // Example of what it would look like:
                    // await createNewAdminUser(newAdminUsername.trim(), newAdminPassword.trim(), newAdminName.trim());
                    // showUserMessage('success', 'تمت إضافة المشرف الجديد بنجاح!');
                    // fetchAdminUsers();
                    setNewAdminUsername('');
                    setNewAdminPassword('');
                    setNewAdminName('');
                  } catch (err) {
                    showUserMessage('error', 'فشل في إضافة المشرف الجديد.');
                  }
                }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <div>
                  <label className="block text-xs font-extrabold text-gray-600 mb-1">الاسم الكامل (مثال: أحمد محمد)</label>
                  <input
                    type="text"
                    required
                    value={newAdminName}
                    onChange={(e) => setNewAdminName(e.target.value)}
                    placeholder="الاسم الكامل للمستخدم"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#00bf63]/40 focus:border-[#00bf63]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-gray-600 mb-1">البريد الإلكتروني للدخول</label>
                  <input
                    type="email"
                    required
                    value={newAdminUsername}
                    onChange={(e) => setNewAdminUsername(e.target.value)}
                    placeholder="مثال: ahmed@elshorbagy.com"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-xs text-left font-mono focus:ring-2 focus:ring-[#00bf63]/40"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-gray-600 mb-1">كلمة المرور</label>
                  <input
                    type="text"
                    required
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="كلمة مرور الدخول"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-xs text-left font-mono focus:ring-2 focus:ring-[#00bf63]/40"
                    dir="ltr"
                  />
                </div>
                <div className="md:col-span-3 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-colors"
                  >
                    إضافة المشرف وتفعيل حسابه فوراً 👤✨
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/************** MODAL: EDIT ADMIN USER *****************/}
          {editingUser && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 z-50 overflow-y-auto">
              <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-gray-150 shadow-2xl relative">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                  <h4 className="text-base sm:text-lg font-black text-gray-800">
                    ✏️ تعديل بيانات المشرف: {editingUser.displayName}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="p-1 text-gray-400 hover:text-gray-600 text-lg cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setEditAdminError('');

                    if (!editingAdminName.trim() || !editingAdminUsername.trim()) {
                      setEditAdminError('الاسم والبريد الإلكتروني حقول مطلوبة.');
                      return;
                    }

                    const isEmailTaken = adminUsers.some(
                      (u) => u.uid !== editingUser.uid && u.email.toLowerCase() === editingAdminUsername.trim().toLowerCase()
                    );
                    if (isEmailTaken) {
                      setEditAdminError('⚠️ هذا البريد الإلكتروني مستخدم بالفعل!');
                      return;
                    }

                    const updates: Partial<UserData> = {
                      displayName: editingAdminName.trim(),
                      email: editingAdminUsername.trim(),
                    };

                    try {
                      await updateFirestoreUser(editingUser.uid, updates);
                      showUserMessage('success', 'تم تعديل بيانات المشرف بنجاح! 🎉');
                      setEditingUser(null);
                      fetchAdminUsers();
                    } catch (err) {
                      setEditAdminError('فشل في تعديل بيانات الحساب في Firestore.');
                    }
                  }}
                  className="space-y-4 text-right"
                >
                  {editAdminError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold text-center animate-fade-in">
                      {editAdminError}
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-black text-gray-700 mb-1">الاسم الكامل للمشرف 👤</label>
                    <input
                      type="text"
                      required
                      value={editingAdminName}
                      onChange={(e) => setEditingAdminName(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#00bf63]/40"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-700 mb-1">البريد الإلكتروني للدخول 💻</label>
                    <input
                      type="text"
                      required
                      value={editingAdminUsername}
                      onChange={(e) => setEditingAdminUsername(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-xs text-left font-mono focus:ring-2 focus:ring-[#00bf63]/40"
                      dir="ltr"
                    />
                  </div>

                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-800 font-bold">
                    ملاحظة: لا يمكن تغيير كلمة المرور من هنا. يجب على المستخدم تغييرها بنفسه أو يمكن حذف المستخدم وإعادة إنشائه بكلمة مرور جديدة.
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingUser(null)}
                      className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      إلغاء ❌
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#00bf63] hover:bg-[#00bf63]/90 text-white rounded-xl text-xs font-black transition-colors shadow-md cursor-pointer"
                    >
                      حفظ وتطبيق التعديل ✔️
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/**************** TAB: QR CODE & SHARE *****************/}
      {activeTab === 'qrcode' && (
        <div className="bg-white border border-gray-150 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="text-4xl block">📱</span>
            <h3 className="text-2xl font-black text-gray-800">رموز الاستجابة السريعة (QR Codes) للمتجر</h3>
            <p className="text-xs sm:text-sm text-gray-500 font-bold leading-relaxed">
              قمنا بتوفير نوعين من رموز الـ QR لتسهيل العمل في متجرك. يمكنك تحميل أي منهما كصورة، طباعته، ومشاركته مع زبائنك أو استخدامه بنفسك.
            </p>
          </div>

          {/* TWO QR CODES SIDE-BY-SIDE / STACKED */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* 1. Direct Customer QR Code (Green Accent) */}
            <div className="bg-emerald-50/50 border-2 border-emerald-100 rounded-3xl p-6 flex flex-col justify-between text-center space-y-5 shadow-xs transition-all hover:shadow-md">
              <div className="flex flex-col items-center space-y-2">
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-3 py-1 rounded-full">⚡ للزبائن والعملاء (دخول تلقائي)</span>
                <h4 className="text-base font-black text-gray-800">رمز الزبائن المباشر 🛒</h4>
                <p className="text-xs text-gray-500 font-bold leading-normal max-w-sm">
                  اطبع هذا الرمز وعلقه في المحل لكي يمسحه الزبائن بهواتفهم ويدخلوا إلى المتجر لتصفح المنتجات وطلبها <strong>مباشرة بدون شاشة اختيار الأدوار</strong>.
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm inline-block mx-auto">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(getDirectUserUrl(qrCodeUrl))}`} 
                  alt="Direct Customer QR Code" 
                  className="w-44 h-44 sm:w-48 sm:h-48 mx-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="space-y-3">
                <div className="bg-white px-3 py-2 rounded-xl border border-gray-150 text-right">
                  <span className="block text-[10px] text-gray-400 font-bold mb-0.5">الرابط المدمج في كود الزبائن:</span>
                  <p className="text-[10px] text-emerald-600 font-mono font-bold select-all break-all leading-relaxed" dir="ltr">
                    {getDirectUserUrl(qrCodeUrl)}
                  </p>
                </div>

                <div className="flex gap-2 w-full">
                  <a
                    href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(getDirectUserUrl(qrCodeUrl))}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2.5 bg-[#00bf63] hover:bg-brand-green-dark text-white text-xs font-black rounded-xl transition-all shadow-sm text-center block cursor-pointer"
                  >
                    تحميل كود الزبائن 📥
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(getDirectUserUrl(qrCodeUrl));
                      alert('تم نسخ رابط الزبائن المباشر بنجاح! 📋');
                    }}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-black rounded-xl transition-all border border-gray-200 cursor-pointer"
                  >
                    نسخ الرابط
                  </button>
                </div>
              </div>
            </div>

            {/* 2. General Gateway QR Code (Purple Accent) */}
            <div className="bg-purple-50/50 border-2 border-purple-100 rounded-3xl p-6 flex flex-col justify-between text-center space-y-5 shadow-xs transition-all hover:shadow-md">
              <div className="flex flex-col items-center space-y-2">
                <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-3 py-1 rounded-full">🔑 للمالك والمسؤول (شاشة الاختيار)</span>
                <h4 className="text-base font-black text-gray-800">الرمز العام / كود المدير 👑</h4>
                <p className="text-xs text-gray-500 font-bold leading-normal max-w-sm">
                  استخدم هذا الكود للدخول بنفسك كمدير أو لإعطائه لمن يحتاج الدخول للوحة التحكم، حيث يفتح <strong>شاشة الاختيار</strong> (مستخدم أو مالك) لتسجيل الدخول.
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm inline-block mx-auto">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(getGateUrl(qrCodeUrl))}`} 
                  alt="General/Admin QR Code" 
                  className="w-44 h-44 sm:w-48 sm:h-48 mx-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="space-y-3">
                <div className="bg-white px-3 py-2 rounded-xl border border-gray-150 text-right">
                  <span className="block text-[10px] text-gray-400 font-bold mb-0.5">الرابط المدمج في كود المدير:</span>
                  <p className="text-[10px] text-brand-purple font-mono font-bold select-all break-all leading-relaxed" dir="ltr">
                    {getGateUrl(qrCodeUrl)}
                  </p>
                </div>

                <div className="flex gap-2 w-full">
                  <a
                    href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(getGateUrl(qrCodeUrl))}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2.5 bg-brand-purple hover:bg-brand-purple-dark text-white text-xs font-black rounded-xl transition-all shadow-sm text-center block cursor-pointer"
                  >
                    تحميل كود المدير 📥
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(getGateUrl(qrCodeUrl));
                      alert('تم نسخ رابط شاشة الاختيار بنجاح! 📋');
                    }}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-black rounded-xl transition-all border border-gray-200 cursor-pointer"
                  >
                    نسخ الرابط
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* INFO & GUIDELINES */}
          <div className="max-w-4xl mx-auto pt-6 border-t border-gray-150 text-right space-y-4">
            <div className="bg-emerald-50/40 border border-emerald-100 p-5 rounded-2xl space-y-2 text-right">
              <h5 className="text-sm font-black text-emerald-800 flex items-center gap-1.5 justify-end">
                <span>💡 نصائح هامة ومفيدة لعملك:</span>
              </h5>
              <ul className="text-xs text-emerald-700 font-bold space-y-2 leading-relaxed list-disc list-inside">
                <li>
                  <strong>رابط الزبائن المباشر:</strong> يمكنك وضعه كملصق على باب المحل أو طاولات العرض، عندما يقوم الزبون بمسحه يدخل مباشرة إلى قائمة المنتجات للشراء الفوري.
                </li>
                <li>
                  <strong>رمز كود المدير:</strong> يمكنك حفظه بهاتفك لسهولة الدخول للوحة التحكم وتحديث المنتجات والطلبيات من أي مكان، حيث يوجهك لشاشة تسجيل الدخول.
                </li>
                <li>
                  <strong>نشر الرابط:</strong> رابط موقعك الرسمي هو <span className="font-mono text-emerald-950 select-all font-black">https://elshorbagy-store.vercel.app</span> ويمكنك نسخه وإرساله لجميع عملائك على واتساب وجروبات الفيس بوك ليعمل 24 ساعة حتى لو كنت غير متصل بالإنترنت!
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/************** MODAL: ADD / EDIT PRODUCT *****************/}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-xl p-6 border border-gray-150 shadow-2xl relative max-h-[90vh] overflow-y-auto scrollbar-thin">
            
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h4 className="text-base sm:text-lg font-black text-gray-800">
                {editingProduct ? `تعديل معلمات المنتج: ${editingProduct.title}` : 'إضافة منتج مخازن جديد'}
              </h4>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 text-lg cursor-pointer"
              >
                <FaTimesCircle />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-black mb-4 text-center">
                {formError}
              </div>
            )}

            <form onSubmit={handleProductFormSubmit} className="space-y-4 text-right">
              {/* Barcode / QR scan field */}
              <div className="bg-green-50/30 p-3 rounded-2xl border border-dashed border-[#00bf63]/30">
                <label className="block text-xs font-black text-gray-700 mb-1 flex items-center gap-1.5">
                  <FaBarcode className="text-[#00bf63] text-sm" />
                  <span>الكود الدولي / الباركود (امسحه بالاسكانر █ █ █)</span>
                </label>
                <input
                  type="text"
                  value={formBarcode}
                  onChange={(e) => handleBarcodeChange(e.target.value)}
                  placeholder="وجه جهاز الاسكانر للباركود ليتم تعبئة تفاصيل المنتج المخزن تلقائياً"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#00bf63]/40 text-left font-mono"
                />
                <p className="text-[10px] text-gray-400 font-bold mt-1">عند مسح الباركود، إذا كان المنتج مسجلاً سابقاً سيتم ملء جميع الحقول تلقائياً لتسهيل تكراره.</p>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-gray-600 mb-1">اسم وعنوان المنتج</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="مثال: صابون سائل فيري بقوة الليمون المركز - حجم 1 لتر"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#00bf63]/40"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-gray-600 mb-1">شرح وتفاصيل المنتج</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="اكتب فقرة مميزة تشرح أهمية ومزايا المنتج وتأثيره..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-[#00bf63]/40"
                />
              </div>

              {/* Pricing section with Purchase Price */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50/40 p-3.5 rounded-2xl border border-gray-100">
                <div>
                  <label className="block text-xs font-extrabold text-amber-700 mb-1 flex items-center gap-1">
                    <span>💵 سعر الشراء (التكلفة)</span>
                  </label>
                  <input
                    type="number"
                    value={formPurchasePrice}
                    onChange={(e) => setFormPurchasePrice(e.target.value)}
                    placeholder="جايبه بكام"
                    className="w-full px-4 py-3 border border-amber-200 bg-amber-50/20 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/40 text-left font-serif"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-gray-700 mb-1">السعر الأصلي (البيع)</label>
                  <input
                    type="number"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="مثال: 120"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#00bf63]/40 text-left font-serif"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-gray-500 mb-1">السعر بعد الخصم</label>
                  <input
                    type="number"
                    value={formDiscountPrice}
                    onChange={(e) => setFormDiscountPrice(e.target.value)}
                    placeholder="متروك فارغاً لمنع أي خصومات"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#00bf63]/40 text-left font-serif"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-gray-600 mb-1">الكمية بالمخزن</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#00bf63]/40 text-left font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#00bf63] mb-1">📅 تاريخ إضافة المنتج</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#00bf63]/40 text-left font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-gray-600 mb-1">التصنيف</label>
                  <select
                    required
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#00bf63]/40 text-right font-black"
                  > 
                    {(categories || []).map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))} 
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-gray-600 mb-1">الماركة (البراند)</label>
                  <input
                    type="text"
                    required
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    list="brands-list"
                    placeholder="اكتب اسم الماركة"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#00bf63]/40 text-right"
                  />
                  <datalist id="brands-list">
                    {[...new Set(products.map(p => p.brand))].map((name) => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-gray-600 mb-1">معرض صور المنتج</label>
                <div className="bg-gray-50/40 p-3.5 rounded-2xl border border-gray-100 space-y-3">
                  <div className="flex items-start gap-2">
                    <input
                      type="url"
                      id="new-image-url"
                      placeholder="رابط الصورة بقاعدة البيانات (https://...)"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-xs text-left font-mono focus:ring-2 focus:ring-[#00bf63]/40"
                    />
                <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-gray-400 font-bold whitespace-nowrap">أو ارفع من جهازك:</span>
                      <label className="flex-1 py-2 px-3 bg-green-50 hover:bg-green-100 text-[#00bf63] border border-[#00bf63]/30 rounded-xl text-center text-xs font-black cursor-pointer transition-colors block">
                        <span>{isImageUploading ? 'جاري الرفع...' : 'اختر صورة من جهازك 📁'}</span>
                        <input 
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            setIsImageUploading(true);
                            setImageUploadError('');
                            try {
                              const url = await uploadToCloudinary(file);
                              setFormImages(prev => [...prev, url]);
                            } catch (error: any) {
                              setImageUploadError(error?.message || 'فشل رفع الصورة');
                            } finally {
                              setIsImageUploading(false);
                            }
                          }}
                        />
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const urlInput = document.getElementById('new-image-url') as HTMLInputElement;
                        if (urlInput && urlInput.value.trim()) {
                          setFormImages(prev => [...prev, urlInput.value.trim()]);
                          urlInput.value = '';
                        }
                      }}
                      className="px-3 py-2 bg-blue-500 text-white rounded-lg text-xs font-bold"
                    >
                      إضافة
                    </button>
                  </div>
                  <div className="space-y-2">
                    {isImageUploading && (
                      <p className="text-[10px] text-[#00bf63] font-black">جاري رفع الصورة إلى Cloudinary...</p>
                    )}
                    {imageUploadError && (
                      <p className="text-[10px] text-red-500 font-bold">{imageUploadError}</p>
                    )}
                    {formImages.length > 0 ? (
                      formImages.map((img, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 cursor-move"
                          draggable
                          onDragStart={() => (dragItem.current = index)}
                          onDragEnter={() => (dragOverItem.current = index)}
                          onDragEnd={handleImageSort}
                          onDragOver={(e) => e.preventDefault()}
                        >
                          <FaGripLines className="text-gray-400 cursor-grab" />
                          <img src={img} alt={`Product image ${index + 1}`} className="w-10 h-10 rounded-md object-cover" />
                          <input
                            type="text"
                            value={img}
                            readOnly
                            className="flex-grow text-xs font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded"
                          />
                          <button
                            type="button"
                            onClick={() => setFormImages(prev => prev.filter((_, i) => i !== index))}
                            className="w-6 h-6 flex items-center justify-center bg-red-100 text-red-600 rounded-md hover:bg-red-200 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    ) : (
                        <p className="text-center text-xs text-gray-400 font-bold py-4">لم يتم إضافة أي صور للمعرض بعد.</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-gray-600 mb-1">المواصفات الفنية للجدول (سطر بسطر)</label>
                <textarea
                  rows={2}
                  value={formSpecs}
                  onChange={(e) => setFormSpecs(e.target.value)}
                  placeholder="الخاصية: القيمة&#10;الحجم: ١ لتر&#10;الرائحة: ليمون معقم"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-[#00bf63]/40"
                />
                <p className="text-[10px] text-gray-400 font-semibold mt-1">اكتب الخاصية تليها نقطتين فوق بعض `:` لتظهر كجدول بخصائص المنتج الفنية.</p>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold cursor-pointer"
                >
                  إلغاء الأمر
                </button>

                {editingProduct && (
                  <button
                    type="button"
                    disabled={isFormSubmitting}
                    onClick={(e) => handleProductFormSubmit(e, true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
                  >
                    {isFormSubmitting ? 'جاري الحفظ...' : 'إضافة كمنتج جديد ➕'}
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isFormSubmitting}
                  className="px-5 py-2 bg-[#00bf63] hover:bg-brand-green-dark text-white rounded-lg text-xs font-extrabold cursor-pointer disabled:opacity-50"
                >
                  {isFormSubmitting ? 'جاري الحفظ...' : editingProduct ? 'حفظ التغيرات 💾' : 'إضافة للمعروضات 🚀'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/************** MODAL: ADD / EDIT CATEGORY *****************/}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-gray-150 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h4 className="text-lg font-black text-gray-800">
                {editingCategory ? 'تعديل القسم' : 'إضافة قسم جديد'}
              </h4>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 text-lg cursor-pointer"
              >
                <FaTimesCircle />
              </button>
            </div>

            {categoryFormError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-black mb-4 text-center">
                {categoryFormError}
              </div>
            )}

            <form onSubmit={handleCategoryFormSubmit} className="space-y-4 text-right">
              <div>
                <label className="block text-xs font-extrabold text-gray-600 mb-1">اسم القسم</label>
                <input
                  type="text"
                  required
                  value={formCategoryName}
                  onChange={(e) => setFormCategoryName(e.target.value)}
                  placeholder="مثال: منظفات سائلة"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#00bf63]/40"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-gray-600 mb-1">صورة القسم</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setIsCategoryUploading(true);
                    try {
                      const url = await uploadToCloudinary(file);
                      setFormCategoryImage(url);
                    } catch (error) {
                      setCategoryFormError('فشل رفع الصورة.');
                    } finally {
                      setIsCategoryUploading(false);
                    }
                  }}
                  className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                />
                {formCategoryImage && <img src={formCategoryImage} alt="Preview" className="mt-2 w-20 h-20 rounded-lg object-cover border" />}
              </div>
              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={isCategoryUploading}
                  className="px-5 py-2.5 bg-[#00bf63] hover:bg-brand-green-dark text-white rounded-lg text-xs font-extrabold cursor-pointer disabled:opacity-50"
                >
                  {isCategoryUploading ? 'جاري الرفع...' : editingCategory ? 'حفظ التعديلات' : 'إضافة القسم'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete & Stock Reduction Modal */}
      {isDeleteModalOpen && deletingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden text-right">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50">
              <button 
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 bg-white h-8 w-8 rounded-full border border-gray-150 flex items-center justify-center text-xs transition-colors cursor-pointer"
              >
                ✕
              </button>
              <h3 className="text-sm font-black text-gray-800 flex items-center gap-1.5 navigation-font">
                <span>تأكيد الإجراء / إنقاص كمية المنتج</span>
                <span className="text-[#00bf63]">🔐</span>
              </h3>
            </div>

            {/* Modal Content */}
            <form onSubmit={executeDeleteOrReduction} className="p-6 space-y-4">
              
              {/* Product Info Card Preview */}
              <div className="flex items-center gap-3.5 bg-gray-50/50 p-3.5 rounded-2xl border border-gray-150">
                <img 
                  src={deletingProduct.image} 
                  alt={deletingProduct.title} 
                  className="w-14 h-14 rounded-xl object-cover border border-gray-200 shadow-sm"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-gray-400 text-[10px] font-bold block">{deletingProduct.brand}</span>
                  <p className="text-xs font-black text-gray-800 truncate">{deletingProduct.title}</p>
                  <p className="text-[11px] text-[#00bf63] font-extrabold mt-1">
                    الكمية المتاحة حالياً بالمخزن: {deletingProduct.stock !== undefined ? deletingProduct.stock : 100} قطعة
                  </p>
                </div>
              </div>

              {/* Action Type Selection */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setDeleteType('reduce'); setDeleteError(''); }}
                  className={`p-3.5 rounded-2xl border text-center flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                    deleteType === 'reduce' 
                      ? 'border-[#00bf63] bg-green-50/30 text-gray-800 ring-2 ring-[#00bf63]/20' 
                      : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-base">📉</span>
                  <span className="text-xs font-black">سحب كمية محددة</span>
                  <span className="text-[9px] text-gray-400 font-bold">إنقاص من مخزون المنتج</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setDeleteType('full'); setDeleteError(''); }}
                  className={`p-3.5 rounded-2xl border text-center flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                    deleteType === 'full' 
                      ? 'border-red-500 bg-red-50/30 text-red-650 ring-2 ring-red-500/20' 
                      : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-base">🗑️</span>
                  <span className="text-xs font-black">حذف المنتج بالكامل</span>
                  <span className="text-[9px] text-gray-400 font-bold">مسحه تماماً من المتجر</span>
                </button>
              </div>

              {/* Condition Options Rendering */}
              {deleteType === 'reduce' ? (
                <div className="space-y-3 bg-green-50/20 p-4 rounded-2xl border border-green-150/40">
                  <label className="block text-xs font-extrabold text-gray-700">الكمية المراد سحبها/حذفها من المخزون:</label>
                  
                  <div className="flex items-center gap-3 justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        const current = Number(reduceAmount) || 1;
                        if (current > 1) setReduceAmount(String(current - 1));
                      }}
                      className="w-10 h-10 select-none flex items-center justify-center bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-bold rounded-xl cursor-pointer shadow-sm"
                    >
                      -
                    </button>
                    
                    <input
                      type="number"
                      required
                      min={1}
                      max={deletingProduct.stock !== undefined ? deletingProduct.stock : 100}
                      value={reduceAmount}
                      onChange={(e) => setReduceAmount(e.target.value)}
                      className="w-24 text-center px-4 py-2 border border-gray-200 rounded-xl font-bold text-sm bg-white"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        const current = Number(reduceAmount) || 1;
                        const maxStock = deletingProduct.stock !== undefined ? deletingProduct.stock : 100;
                        if (current < maxStock) setReduceAmount(String(current + 1));
                      }}
                      className="w-10 h-10 select-none flex items-center justify-center bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-bold rounded-xl cursor-pointer shadow-sm"
                    >
                      +
                    </button>
                  </div>

                  {/* Dynamic calculation result */}
                  <p className="text-[10px] text-center text-gray-500 font-semibold mt-1">
                    الكمية المتبقية بعد الحذف ستكون:{' '}
                    <span className="font-extrabold text-gray-800 text-xs">
                      {Math.max(0, (deletingProduct.stock !== undefined ? deletingProduct.stock : 100) - (Number(reduceAmount) || 0))} قطعة
                    </span>
                  </p>
                </div>
              ) : (
                <div className="space-y-3 bg-red-50/20 p-4 rounded-2xl border border-red-150/40">
                  <div className="flex gap-2 text-red-700">
                    <span className="text-base select-none">⚠️</span>
                    <div className="flex-1">
                      <h4 className="text-xs font-black text-red-700">تحذير الحذف النهائي!</h4>
                      <p className="text-[10px] text-red-600 font-semibold mt-0.5 leading-relaxed">
                        سيتم مسح المنتج ومواصفاته وصوره نهائياً وبشكل كامل من متجرك الإلكتروني وقاعدة البيانات. لن يستطيع أي عميل طلبه بعد الآن.
                      </p>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 pt-2 cursor-pointer border-t border-red-100 mt-2 select-none">
                    <input
                      type="checkbox"
                      checked={fullConfirmChecked}
                      onChange={(e) => setFullConfirmChecked(e.target.checked)}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500 h-4 w-4"
                    />
                    <span className="text-[11px] font-black text-gray-700">
                      أنا أوافق وأؤكد رغبتي في مسح هذا المنتج بالكامل من المتجر 🗑️
                    </span>
                  </label>
                </div>
              )}

              {/* Error Warning */}
              {deleteError && (
                <div className="text-center p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-black">
                  {deleteError}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  تراجع
                </button>
                <button
                  type="submit"
                  disabled={isDeleteSubmitting || (deleteType === 'full' && !fullConfirmChecked)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer disabled:opacity-50 text-white transition-colors ${
                    deleteType === 'full' 
                      ? 'bg-red-600 hover:bg-red-700 shadow-sm' 
                      : 'bg-[#00bf63] hover:bg-brand-green-dark shadow-sm'
                  }`}
                >
                  {isDeleteSubmitting 
                    ? 'جاري الإرسال...' 
                    : deleteType === 'reduce' 
                      ? 'تأكيد الخصم من المخزون 📉' 
                      : 'حذف المنتج نهائياً 🗑️'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/************** MODAL: ORDER DETAILS *****************/}
      {isOrderDetailsModalOpen && selectedDetailedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-6 border border-gray-150 shadow-2xl relative max-h-[90vh] overflow-y-auto scrollbar-thin text-right">
            
            <div className="flex items-center justify-between border-b border-gray-100 pb-3.5 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 bg-purple-50 text-purple-600 flex items-center justify-center rounded-xl text-sm font-black">📋</span>
                <div>
                  <h4 className="text-base sm:text-lg font-black text-gray-800">
                    تفاصيل الفاتورة والطلب: #{selectedDetailedOrder.orderId}
                  </h4>
                  <span className="text-[10px] text-gray-400 font-bold block mt-0.5">التاريخ والوقت: {selectedDetailedOrder.date}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsOrderDetailsModalOpen(false);
                  setSelectedDetailedOrder(null);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors text-lg cursor-pointer border border-gray-100"
              >
                <FaTimesCircle />
              </button>
            </div>

            {/* General Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 text-right">
              <div className="bg-gray-50/60 p-4 rounded-2xl border border-gray-200/50 space-y-2">
                <span className="text-xs font-black text-[#5108b5] border-b border-[#5108b5]/10 pb-1.5 block">👤 معلومات المستلم والعميل</span>
                <div className="text-xs space-y-1.5 font-extrabold text-gray-750">
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-bold">الاسم واللقب:</span>
                    <span className="text-gray-800">{selectedDetailedOrder.customerInfo.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-bold">رقم الهاتف الشغال:</span>
                    <a href={`tel:${selectedDetailedOrder.customerInfo.phone}`} className="text-blue-600 hover:underline tracking-widest leading-none">
                      {selectedDetailedOrder.customerInfo.phone} 📞
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50/60 p-4 rounded-2xl border border-gray-200/50 space-y-2 text-right">
                <span className="text-xs font-black text-[#5108b5] border-b border-[#5108b5]/10 pb-1.5 block">📍 جهة الشحن والتوصيل</span>
                <div className="text-xs space-y-1.5 font-extrabold text-gray-750">
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-bold">المنطقة (الإسماعيلية):</span>
                    <span className="text-gray-800">{selectedDetailedOrder.customerInfo.governorate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-bold">المحل / النشاط التجاري:</span>
                    <span className="text-gray-800">{selectedDetailedOrder.customerInfo.city || 'طلب شخصي'}</span>
                  </div>
                  <div className="block pt-1 border-t border-gray-100/50">
                    <span className="text-gray-400 font-bold block mb-0.5 text-[10px]">العنوان بالكامل:</span>
                    <p className="text-[11px] leading-relaxed font-semibold text-gray-600">{selectedDetailedOrder.customerInfo.address}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Listed items */}
            <div className="border border-gray-150 rounded-2xl overflow-hidden mb-5">
              <div className="bg-gray-50 px-4 py-2 text-xs font-black text-gray-600 border-b border-gray-200 text-right">
                سلة أصناف الطلبية
              </div>
              <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
                {selectedDetailedOrder.items.map((item, idx) => {
                  const price = item.product.discountPrice || item.product.price;
                  return (
                    <div key={idx} className="p-3.5 flex items-center justify-between text-xs font-extrabold text-gray-700 hover:bg-gray-50/50">
                      <div className="flex items-center gap-3">
                        <img 
                          src={item.product.image} 
                          alt={item.product.title} 
                          className="w-10 h-10 rounded-xl object-cover border border-gray-200 bg-white"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex flex-col text-right">
                          <span className="text-gray-800 font-black line-clamp-1">{item.product.title}</span>
                          <span className="text-[10px] text-gray-400 mt-1 font-semibold">
                            الماركة: {item.product.brand} | السعر: {price} ج.م
                          </span>
                        </div>
                      </div>
                      <span className="text-gray-900 font-black shrink-0 text-left">
                        {item.quantity} × {price} = <strong className="text-[#00bf63] font-serif">{item.quantity * price} ج.م</strong>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Calculations Summary */}
            <div className="bg-[#FAF9FF] border border-purple-100 rounded-2xl p-4 mb-6 space-y-2 text-xs font-bold text-gray-600">
              <div className="flex justify-between">
                <span>ثمن إجمالي المنتجات والسلع:</span>
                <span className="font-extrabold text-gray-800">{selectedDetailedOrder.subtotal} ج.م</span>
              </div>
              <div className="flex justify-between">
                <span>تكلفة الشحن والدليفري:</span>
                <span className="font-extrabold text-gray-800">
                  {selectedDetailedOrder.shipping === 0 ? 'مجانى شحن مجاني' : `${selectedDetailedOrder.shipping} ج.م`}
                </span>
              </div>
              <div className="flex justify-between pt-2.5 border-t border-gray-200 text-sm font-black text-[#5108b5]">
                <span>المبلغ المطلوب تسليمه كاش:</span>
                <span className="text-base font-black font-serif">{selectedDetailedOrder.total} ج.م</span>
              </div>
            </div>

            {/* Actions Panel */}
            <div className="flex flex-wrap gap-2.5 justify-end pt-4 border-t border-gray-100">
              <button
                onClick={() => handlePrintOrder(selectedDetailedOrder)}
                className="px-5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-black shadow-2xs cursor-pointer flex items-center gap-1.5 transition-all text-right"
              >
                <FaPrint />
                <span>طباعة الفاتورة 🖨️</span>
              </button>

              <a
                href={getWhatsAppManagerLink(selectedDetailedOrder)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-[#25d366]/10 hover:bg-[#25d366]/20 text-[#1a9a46] border border-[#25d366]/20 rounded-xl text-xs font-black shadow-2xs flex items-center gap-1.5 cursor-pointer decoration-transparent transition-all"
              >
                <FaWhatsapp />
                <span>إرسال وتجهيز (المدير) 📲</span>
              </a>

              <a
                href={getWhatsAppCustomerLink(selectedDetailedOrder)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/50 rounded-xl text-xs font-black shadow-2xs flex items-center gap-1.5 cursor-pointer decoration-transparent transition-all"
              >
                <FaWhatsapp />
                <span>إشعار تأخير واستلام (العميل) 💬</span>
              </a>

              <button
                onClick={() => {
                  setIsOrderDetailsModalOpen(false);
                  setSelectedDetailedOrder(null);
                }}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-black cursor-pointer mr-auto"
              >
                إغلاق النافذة
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
