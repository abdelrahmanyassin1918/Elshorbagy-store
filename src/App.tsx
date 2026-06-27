import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import PwaBanner from './components/PwaBanner';
import HomeView from './views/HomeView';
import ProductsView from './views/ProductsView';
import ProductDetailView from './views/ProductDetailView';
import CartView from './views/CartView';
import OrderSuccessView from './views/OrderSuccessView';
import AdminView from './views/AdminView';
import { Product, CartItem, OrderDetails } from './types';
import { PRODUCTS, CATEGORIES } from './data';
import { FaHeadset, FaPhoneAlt, FaMapMarkerAlt, FaEnvelope, FaFacebook, FaInstagram, FaTiktok, FaUnlockAlt, FaEye, FaEyeSlash } from 'react-icons/fa';

const getRoleFromUrl = (): string | null => {
  if (typeof window === 'undefined') return null;
  const href = window.location.href;
  const hrefLower = href.toLowerCase();
  
  if (hrefLower.includes('role=user')) return 'user';
  if (hrefLower.includes('role=gate')) return 'gate';
  
  // Try search params first
  const searchParams = new URLSearchParams(window.location.search);
  let role = searchParams.get('role');
  if (role) return role.toLowerCase();

  // Try parsing from hash if search params didn't have it
  if (window.location.hash) {
    const hashIndex = window.location.hash.indexOf('?');
    if (hashIndex !== -1) {
      const hashParams = new URLSearchParams(window.location.hash.substring(hashIndex + 1));
      role = hashParams.get('role');
      if (role) return role.toLowerCase();
    }
  }

  return null;
};

const cleanRoleFromUrl = () => {
  if (typeof window === 'undefined') return;
  try {
    let newHref = window.location.href;
    // Replace ?role=user or &role=user or ?role=gate or &role=gate (case insensitive)
    newHref = newHref.replace(/[?&]role=[^&]+/gi, '');
    // Clean up double question marks or trailing question marks/ampersands if any
    newHref = newHref.replace(/\?&/, '?').replace(/\?$/, '').replace(/&$/, '');
    window.history.replaceState({}, '', newHref);
  } catch (e) {
    console.error(e);
  }
};

export default function App() {
  // Navigation Routing States
  const [currentView, setCurrentView] = useState<string>('home');
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);

  // User Role State: 'user' | 'owner' (default to 'user' unless logged in previously)
  const [userRole, setUserRole] = useState<'user' | 'owner'>(() => {
    if (typeof window !== 'undefined') {
      const roleParam = getRoleFromUrl();
      if (roleParam === 'user') return 'user';
      if (roleParam === 'gate') return 'user';

      const token = sessionStorage.getItem('elshorbagy_admin_token') || localStorage.getItem('elshorbagy_admin_token');
      return token === 'validated_sess_token_secure' ? 'owner' : 'user';
    }
    return 'user';
  });

  // Entry gate status: true if they have chosen customer or logged in as owner
  const [hasEntered, setHasEntered] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const roleParam = getRoleFromUrl();
      if (roleParam === 'user') {
        sessionStorage.setItem('elshorbagy_gate_entered', 'true');
        localStorage.setItem('elshorbagy_gate_entered', 'true');
        return true;
      } else if (roleParam === 'gate') {
        sessionStorage.removeItem('elshorbagy_gate_entered');
        sessionStorage.removeItem('elshorbagy_admin_token');
        localStorage.removeItem('elshorbagy_gate_entered');
        localStorage.removeItem('elshorbagy_admin_token');
        return false;
      }

      const token = sessionStorage.getItem('elshorbagy_admin_token') || localStorage.getItem('elshorbagy_admin_token');
      if (token === 'validated_sess_token_secure') return true;
      
      const savedChoice = sessionStorage.getItem('elshorbagy_gate_entered') || localStorage.getItem('elshorbagy_gate_entered');
      return savedChoice === 'true';
    }
    return false;
  });

  // Modal Login States
  const [showOwnerLoginModal, setShowOwnerLoginModal] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginErrorMsg, setLoginErrorMsg] = useState('');
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Switching methods
  const handleSwitchToUser = () => {
    sessionStorage.removeItem('elshorbagy_admin_token');
    sessionStorage.removeItem('elshorbagy_admin_user_name');
    sessionStorage.removeItem('elshorbagy_gate_entered');
    localStorage.removeItem('elshorbagy_admin_token');
    localStorage.removeItem('elshorbagy_admin_user_name');
    localStorage.removeItem('elshorbagy_gate_entered');
    setUserRole('user');
    setHasEntered(false);
    handleNavigate('home');
  };

  const handleSwitchToOwner = () => {
    if (userRole === 'owner') {
      handleNavigate('admin');
    } else {
      setLoginErrorMsg('');
      setLoginUsername('');
      setLoginPassword('');
      setShowOwnerLoginModal(true);
    }
  };

  const handleOwnerLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErrorMsg('');
    setIsSubmittingLogin(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });

      if (res.ok) {
        const data = await res.json();
        sessionStorage.setItem('elshorbagy_admin_token', data.token);
        localStorage.setItem('elshorbagy_admin_token', data.token);
        const displayName = data.user?.name || data.user?.username || 'المدير';
        sessionStorage.setItem('elshorbagy_admin_user_name', displayName);
        localStorage.setItem('elshorbagy_admin_user_name', displayName);
        sessionStorage.setItem('elshorbagy_gate_entered', 'true');
        localStorage.setItem('elshorbagy_gate_entered', 'true');
        setUserRole('owner');
        setHasEntered(true);
        setShowOwnerLoginModal(false);
        setLoginUsername('');
        setLoginPassword('');
        handleNavigate('admin');
      } else {
        const data = await res.json();
        setLoginErrorMsg(data.error || 'اسم المستخدم أو كلمة المرور غير صحيحة');
      }
    } catch (err) {
      setLoginErrorMsg('عذراً، حدث خطأ أثناء الاتصال بالخادم.');
    } finally {
      setIsSubmittingLogin(false);
    }
  };
  const [productsFilters, setProductsFilters] = useState<{
    category?: string;
    brand?: string;
    search?: string;
    isSpecialOffer?: boolean;
  }>({});

  // Dynamic state loaded from Express Backend
  const [dynamicProducts, setDynamicProducts] = useState<Product[]>([]);
  const [dynamicBanner, setDynamicBanner] = useState({
    badge: '🧼 النظافة والبريق في جيبك • أسعار جملة الجملة',
    title: 'الشوربجي للمنظفات\nوالورقيات في مصر',
    subtitle: 'نوفر لكم أكبر تشكيلة من مساحيق الغسيل، مطهرات ديتول، صابون المواعين، والورقيات والمناديل المعقمة بأقصى توفير وأسرع خدمة شحن لباب بيتك!',
    image: ''
  });
  const [orders, setOrders] = useState<OrderDetails[]>([]);

  // Hydration utility
  const refreshLiveState = async () => {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        if (data.products && data.products.length > 0) {
          setDynamicProducts(data.products);
          
          // Sync currently active product to pick up decrease in stock levels
          if (activeProduct) {
            const synced = data.products.find((p: Product) => p.id === activeProduct.id);
            if (synced) setActiveProduct(synced);
          }
        } else {
          setDynamicProducts(PRODUCTS.map(p => ({ ...p, stock: p.stock !== undefined ? p.stock : 100 })));
        }
        if (data.banner) {
          setDynamicBanner(data.banner);
        }
      } else {
        setDynamicProducts(PRODUCTS.map(p => ({ ...p, stock: p.stock !== undefined ? p.stock : 100 })));
      }
    } catch (e) {
      console.warn('Backend server not responding or initial container boot up, fallback to offline static values:', e);
      setDynamicProducts(PRODUCTS.map(p => ({ ...p, stock: p.stock !== undefined ? p.stock : 100 })));
    }

    try {
      const resOrders = await fetch('/api/orders');
      if (resOrders.ok) {
        const oData = await resOrders.json();
        setOrders(oData);
      }
    } catch (_) {}
  };

  useEffect(() => {
    refreshLiveState();

    if (typeof window !== 'undefined') {
      const roleParam = getRoleFromUrl();
      if (roleParam === 'user') {
        sessionStorage.setItem('elshorbagy_gate_entered', 'true');
        localStorage.setItem('elshorbagy_gate_entered', 'true');
        setUserRole('user');
        setHasEntered(true);
        handleNavigate('home');
        cleanRoleFromUrl();
      } else if (roleParam === 'gate') {
        sessionStorage.removeItem('elshorbagy_gate_entered');
        sessionStorage.removeItem('elshorbagy_admin_token');
        localStorage.removeItem('elshorbagy_gate_entered');
        localStorage.removeItem('elshorbagy_admin_token');
        setUserRole('user');
        setHasEntered(false);
        handleNavigate('home');
        cleanRoleFromUrl();
      }
    }
  }, []);

  // Cart State (Initialized from localStorage helper)
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem('elshorbagy_cart');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Error loading cart state from localStorage', e);
      return [];
    }
  });

  // Successful Order receipt details
  const [lastOrderDetails, setLastOrderDetails] = useState<OrderDetails | null>(null);
  
  // Sidebar visibility control state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Expand/collapse child categories inside sidebar
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(false);

  // Dynamic Categories Memo
  const dynamicCategories = React.useMemo(() => {
    const list = [...CATEGORIES];
    dynamicProducts.forEach((p) => {
      if (!p.category) return;
      const exists = list.some(
        (c) => c.id.toLowerCase() === p.category.toLowerCase() || c.name.toLowerCase() === p.category.toLowerCase()
      );
      if (!exists) {
        list.push({
          id: p.category,
          name: p.category,
          icon: '🏷️',
          image: 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&q=80&w=400'
        });
      }
    });
    return list;
  }, [dynamicProducts]);

  // Sync cart modifications to localStorage automatically
  useEffect(() => {
    try {
      localStorage.setItem('elshorbagy_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to persist cart updates to localStorage', e);
    }
  }, [cart]);

  // Protect admin view - auto redirect if not owner
  useEffect(() => {
    if (currentView === 'admin' && userRole !== 'owner') {
      setCurrentView('home');
    }
  }, [currentView, userRole]);

  // Handle direct navigation to target screen views and reset scroll state
  const handleNavigate = (view: string, params: any = {}) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (view === 'product-detail' && params.id) {
      // Find and select active product
      const foundProduct = (dynamicProducts.length > 0 ? dynamicProducts : PRODUCTS).find((p) => p.id === params.id);
      if (foundProduct) {
        setActiveProduct(foundProduct);
      }
    } else if (view === 'products') {
      // Set listing filters context
      setProductsFilters(params);
    } else if (params.anchor === 'special-offers') {
      // Scroll to special block anchor on home screen
      setTimeout(() => {
        const borderEl = document.getElementById('special-offers');
        if (borderEl) {
          borderEl.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  // Nav helper finding product
  const selectProductDetail = (product: Product) => {
    setActiveProduct(product);
    setCurrentView('product-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cart modifications: Add item
  const handleAddToCart = (product: Product, quantity: number = 1, options?: { color?: string; size?: string }) => {
    setCart((prevCart) => {
      // Check if product with identical parameters exists
      const existingIndex = prevCart.findIndex(
        (item) => item.product.id === product.id && 
                  item.selectedSize === options?.size && 
                  item.selectedColor === options?.color
      );

      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      } else {
        return [
          ...prevCart,
          {
            product,
            quantity,
            selectedColor: options?.color,
            selectedSize: options?.size,
          },
        ];
      }
    });

    // Provide micro-haptic or subtle visual acknowledgement on footer
  };

  // Quick Add from Home listings
  const handleQuickAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering details card navigation click
    handleAddToCart(product, 1);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  // Successfully complete payment via COD
  const handleCheckoutComplete = async (orderDetails: OrderDetails) => {
    try {
      // Post order details to API to decrease stocks and save details
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderDetails),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.order) {
          setLastOrderDetails(result.order);
        } else {
          setLastOrderDetails(orderDetails);
        }
        // Immediately fetch updated stocks so that catalog counters reduce
        refreshLiveState();
      } else {
        setLastOrderDetails(orderDetails);
      }
    } catch (e) {
      console.error('Failed to post order to backend API, working in offline mode:', e);
      setLastOrderDetails(orderDetails);
    }

    setCart([]); // Clear shopping cart
    setCurrentView('order-success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Trigger search from headers
  const handleSearchSubmit = (query: string) => {
    setProductsFilters({ search: query });
    setCurrentView('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Count total singular quantities
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Calculate total price of cart items
  const totalCartPrice = cart.reduce((sum, item) => {
    const price = item.product.discountPrice || item.product.price;
    return sum + price * item.quantity;
  }, 0);

  // Condition to show floating bottom cart bar
  const showFloatingCartBar = cart.length > 0 && currentView !== 'cart' && currentView !== 'order-success';

  if (!hasEntered) {
    return (
      <div className="min-h-screen bg-linear-to-b from-brand-purple/10 to-white flex items-center justify-center p-4 sm:p-6 md:p-8 font-sans text-right" dir="rtl">
        {/* Portal card */}
        <div className="w-full max-w-xl bg-white rounded-3xl border border-gray-150 shadow-2xl overflow-hidden animate-fade-in relative">
          
          {/* Logo header */}
          <div className="bg-brand-purple text-white p-8 text-center relative select-none">
            <div className="absolute inset-0 bg-radial from-transparent to-brand-purple-dark/40 opacity-40"></div>
            <div className="relative z-10 flex flex-col items-center justify-center">
              <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/60 shadow-md mb-4 animate-scale-up">
                <img src="/icon.svg" alt="الشوربجي" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <h1 className="text-3xl font-black tracking-tight leading-tight mb-2">متجر الشوربجي</h1>
              <p className="text-white/85 text-xs font-black">للمنظفات والورقيات والمواد الاستهلاكية 🛒</p>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {!showOwnerLoginModal ? (
              <>
                <div className="text-center">
                  <h2 className="text-lg font-black text-gray-800 mb-2">مرحباً بك في المتجر الإلكتروني 👋</h2>
                  <p className="text-[11px] text-gray-400 font-extrabold leading-normal">يرجى اختيار طريقة الدخول لبدء استخدام التطبيق وتصفح المنتجات أو إدارة متجرك.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Option 1: Customer */}
                  <button
                    onClick={() => {
                      sessionStorage.setItem('elshorbagy_gate_entered', 'true');
                      setHasEntered(true);
                      setUserRole('user');
                      handleNavigate('home');
                    }}
                    className="group p-6 bg-white border-2 border-brand-purple/15 hover:border-brand-purple rounded-2xl text-center transition-all duration-300 hover:shadow-xl cursor-pointer"
                  >
                    <div className="w-14 h-14 bg-brand-purple/10 text-brand-purple rounded-xl flex items-center justify-center text-2xl mx-auto mb-3 group-hover:scale-110 transition-transform">
                      🛒
                    </div>
                    <h3 className="text-base font-black text-gray-800 mb-1">دخول كمستخدم</h3>
                    <p className="text-[10px] text-gray-400 font-extrabold leading-normal">تصفح المنظفات، المساحيق، الورقيات، واطلب احتياجاتك مباشرة</p>
                  </button>

                  {/* Option 2: Owner */}
                  <button
                    onClick={() => {
                      setLoginErrorMsg('');
                      setLoginUsername('');
                      setLoginPassword('');
                      setShowOwnerLoginModal(true);
                    }}
                    className="group p-6 bg-white border-2 border-[#00bf63]/15 hover:border-[#00bf63] rounded-2xl text-center transition-all duration-300 hover:shadow-xl cursor-pointer"
                  >
                    <div className="w-14 h-14 bg-[#00bf63]/10 text-[#00bf63] rounded-xl flex items-center justify-center text-2xl mx-auto mb-3 group-hover:scale-110 transition-transform">
                      👑
                    </div>
                    <h3 className="text-base font-black text-gray-800 mb-1">دخول كمالك المتجر</h3>
                    <p className="text-[10px] text-gray-400 font-extrabold leading-normal">لوحة التحكم، تعديل الأسعار، زيادة المخزون ومتابعة الطلبات والأرباح</p>
                  </button>
                </div>
              </>
            ) : (
              <div>
                <div className="text-center mb-6">
                  <div className="w-14 h-14 bg-[#eafbf2] text-[#00bf63] rounded-2xl flex items-center justify-center text-xl mx-auto mb-3">
                    <FaUnlockAlt />
                  </div>
                  <h3 className="text-lg font-black text-gray-800 mb-1">تسجيل دخول المالك 🔑</h3>
                  <p className="text-[11px] text-gray-400 font-bold leading-normal">يرجى إدخال اسم المستخدم وكلمة المرور لتفعيل ميزات لوحة التحكم</p>
                </div>

                {loginErrorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold mb-4 text-center">
                    {loginErrorMsg}
                  </div>
                )}

                <form onSubmit={handleOwnerLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-extrabold text-gray-600 mb-1 text-right">اسم المستخدم</label>
                    <input
                      type="text"
                      required
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="مثال: admin"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#00bf63]/40 focus:border-[#00bf63] text-left font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-gray-600 mb-1 text-right">كلمة المرور</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="إدخال كلمة المرور"
                        className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#00bf63]/40 focus:border-[#00bf63] text-left font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors cursor-pointer"
                      >
                        {showPassword ? <FaEyeSlash className="w-4 h-4 text-gray-500" /> : <FaEye className="w-4 h-4 text-gray-500" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowOwnerLoginModal(false);
                        setLoginUsername('');
                        setLoginPassword('');
                        setLoginErrorMsg('');
                      }}
                      className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-black rounded-xl transition-colors cursor-pointer"
                    >
                      عودة للخلف
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingLogin}
                      className="flex-1 py-2.5 bg-[#00bf63] hover:bg-[#00bf63]/90 text-white text-xs font-black rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingLogin ? 'جاري التحقق...' : 'تأكيد الدخول 🔑'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Footer branding */}
          <div className="bg-gray-50 border-t border-gray-100 p-4 text-center">
            <span className="text-[10px] text-gray-400 font-extrabold">إدارة المتجر وحقوق التطوير محفوظة © ٢٠٢٦</span>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      
      {/* 1. Header component */}
      <Header
        currentView={currentView}
        cart={cart}
        cartCount={totalCartCount}
        onNavigate={handleNavigate}
        onSearch={handleSearchSubmit}
        onOpenSidebar={() => setIsSidebarOpen(true)}
        userRole={userRole}
        onSwitchToUser={handleSwitchToUser}
        onSwitchToOwner={handleSwitchToOwner}
      />

      {/* 2. Main content Stage */}
      <main className={`flex-grow w-full mx-auto ${
        currentView === 'home' 
          ? `pt-20 md:pt-24 ${showFloatingCartBar ? 'pb-36 md:pb-24' : 'pb-12'}` 
          : `pt-24 md:pt-28 px-4 md:px-6 py-6 ${showFloatingCartBar ? 'pb-36 md:pb-28' : 'pb-10'}`
      }`}>
        <PwaBanner />
        {currentView === 'home' && (
          <HomeView
            products={dynamicProducts}
            banner={dynamicBanner}
            onSelectProduct={selectProductDetail}
            onAddToCart={handleQuickAddToCart}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'products' && (
          <ProductsView
            products={dynamicProducts}
            initialFilters={productsFilters}
            onSelectProduct={selectProductDetail}
            onAddToCart={handleQuickAddToCart}
          />
        )}

        {currentView === 'product-detail' && activeProduct && (
          <ProductDetailView
            product={activeProduct}
            onAddToCart={handleAddToCart}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'cart' && (
          <CartView
            cart={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveFromCart={handleRemoveFromCart}
            onCheckoutComplete={handleCheckoutComplete}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'admin' && userRole === 'owner' && (
          <AdminView
            products={dynamicProducts}
            banner={dynamicBanner}
            orders={orders}
            onRefreshData={refreshLiveState}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'order-success' && lastOrderDetails && (
          <OrderSuccessView
            orderDetails={lastOrderDetails}
            onNavigate={handleNavigate}
          />
        )}
      </main>

      {/* 3. Footer Block - Custom Compact layout styled in fresh Light pure white with deep teal text */}
      <footer className="bg-white border-t border-brand-purple/10 text-brand-purple-dark pt-8 pb-24 md:pb-8 text-right select-none">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row items-stretch justify-between gap-6">
          
          {/* Right Column: brand and description */}
          <div className="flex flex-col gap-2 max-w-md">
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center w-11 h-11 bg-brand-purple-light border-2 border-brand-purple rounded-2xl shadow-sm text-brand-purple">
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
                  {/* Basket handle */}
                  <path d="M6 10c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                  {/* Spray bottle */}
                  <path d="M8 6h3.5v4H8V6z" fill="#00b4d8" fillOpacity="0.85" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M9.7 4h1.5M8.5 5.2h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  {/* Soap/dispenser */}
                  <rect x="13" y="5" width="4.5" height="5" rx="1" fill="#06d6a0" fillOpacity="0.85" stroke="currentColor" strokeWidth="1.2" />
                  <circle cx="15.2" cy="4" r="1" fill="currentColor" />
                  {/* Basket body */}
                  <path d="M3 10h18l-2 9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2l-2-9z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                  {/* Brand grid lines */}
                  <path d="M8 10v11M12 10v11M16 10v11M4 14h16M4.5 18h15" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
                </svg>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-xl font-black text-brand-purple-dark leading-none">الشوربجي</span>
                <span className="text-[10px] text-brand-purple font-extrabold tracking-widest mt-1">AL-SHORBAGY</span>
              </div>
            </div>
            <p className="text-xs text-gray-600 font-bold leading-relaxed">
              متجر الشوربجي هو خيارك الأول لتسوق كافة أنواع المنظفات، مساحيق البودرة والجل، الورقيات والمناديل، ومستلزمات النظافة والتعقيم بأفضل أسعار الجملة والتوصيل المباشر في جمهورية مصر العربية.
            </p>
          </div>

          {/* Left Column: Follow and Icons + Contact underneath */}
          <div className="flex flex-col items-start md:items-end gap-4">
            
            {/* Follow Section (Right-to-Left alignment for Arabic) */}
            <div className="flex flex-col items-start md:items-end gap-1.5 w-full">
              <span className="text-xs font-black text-brand-purple-dark">تابعنا على وسائل التواصل</span>
              <div className="flex gap-2">
                <a 
                  href="https://facebook.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  title="تابعنا على فيسبوك"
                  className="w-8 h-8 rounded-full bg-brand-purple hover:bg-brand-purple-dark text-white flex items-center justify-center transition-all duration-200 shadow-xs"
                >
                  <FaFacebook className="w-4 h-4" />
                </a>
                <a 
                  href="https://instagram.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  title="تابعنا على إنستغرام"
                  className="w-8 h-8 rounded-full bg-brand-purple hover:bg-brand-purple-dark text-white flex items-center justify-center transition-all duration-200 shadow-xs"
                >
                  <FaInstagram className="w-4 h-4" />
                </a>
                <a 
                  href="https://tiktok.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  title="تابعنا على تيك توك"
                  className="w-8 h-8 rounded-full bg-brand-purple hover:bg-brand-purple-dark text-white flex items-center justify-center transition-all duration-200 shadow-xs"
                >
                  <FaTiktok className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Contact Details (rendered directly under icons as requested) */}
            <div className="flex flex-col items-start md:items-end gap-1 w-full text-xs">
              <span className="text-xs font-black text-brand-purple-dark">تواصل معنا</span>
              <div className="flex flex-col gap-0.5 text-gray-600 font-extrabold md:text-left">
                <span className="font-mono">الهاتف: 01023456789 / 01112345678</span>
                <span>المقر: شارع بشتيل، البراجيل، الجيزة، مصر</span>
              </div>
              
              {userRole === 'owner' && (
                <div className="mt-2 flex flex-col items-start md:items-end gap-1.5 select-none">
                  <button 
                    onClick={() => handleNavigate('admin')}
                    className="text-xs font-black text-[#00bf63] hover:text-[#00bf63]/80 hover:underline transition-all mt-1.5 flex items-center gap-1 cursor-pointer"
                  >
                    <span>دخول لوحة التحكم (المشرف) 🔐</span>
                  </button>
                  <button
                    onClick={handleSwitchToUser}
                    className="text-[10px] font-black text-red-500 hover:text-red-700 hover:underline transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>تسجيل خروج المالك 🚪</span>
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      </footer>

      {/* 4. Sidebar Slide-out Drawer */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-55 overflow-hidden flex justify-end text-right"
          role="dialog" 
          aria-modal="true"
        >
          {/* Backdrop blur overlay */}
          <div 
            onClick={() => setIsSidebarOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
          ></div>

          {/* Sidebar Drawer Panel */}
          <div className="relative w-80 max-w-full bg-white h-full shadow-2xl flex flex-col justify-between z-10 border-l border-gray-100 animate-slide-in-right">
            
            {/* Header section */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-brand-purple-light">
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-extrabold text-xs transition-colors"
              >
                ✕
              </button>
              <div className="flex items-center gap-2">
                <div className="flex flex-col text-right">
                  <span className="text-lg font-black text-brand-purple leading-none">الشوربجي</span>
                  <span className="text-[10px] text-brand-purple-dark font-extrabold mt-1">للمنظفات والورقيات</span>
                </div>
                <div className="w-10 h-10 bg-brand-purple rounded-xl flex items-center justify-center text-white text-xl shadow-xs">
                  🧼
                </div>
              </div>
            </div>

            {/* Scrollable navigation body */}
            <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
              <button
                onClick={() => { handleNavigate('home'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl font-extrabold text-xs transition-all duration-200 ${
                  currentView === 'home' 
                    ? 'bg-brand-purple text-white shadow-xs' 
                    : 'text-gray-700 hover:bg-brand-purple-light hover:text-brand-purple'
                }`}
              >
                <span>الرئيسية 🏠</span>
                <span className="text-[9px] opacity-75">&lt;</span>
              </button>

              {/* Collapsible Categories Navigation */}
              <div>
                <button
                  onClick={() => setIsCategoriesExpanded(!isCategoriesExpanded)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl font-extrabold text-xs transition-all duration-200 ${
                    currentView === 'products' 
                      ? 'bg-brand-purple text-white shadow-xs' 
                      : 'text-gray-700 hover:bg-brand-purple-light hover:text-brand-purple'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>تصفح الأقسام 🏷️</span>
                    <span className="text-[9px] font-black bg-brand-green text-white px-2 py-0.5 rounded-full">
                      {dynamicCategories.length} أقسام
                    </span>
                  </div>
                  <span className={`text-[10px] filter drop-shadow-sm font-black transition-transform duration-300 ${isCategoriesExpanded ? 'rotate-90' : ''}`}>
                    &lt;
                  </span>
                </button>

                {isCategoriesExpanded && (
                  <div className="mt-1.5 mr-2 pr-2 border-r-2 border-brand-purple/30 flex flex-col gap-1.5 bg-gray-50/50 p-2 rounded-lg animate-fadeIn duration-200">
                    <button
                      onClick={() => {
                        handleNavigate('products', {});
                        setIsSidebarOpen(false);
                      }}
                      className="w-full text-right py-2 px-3 text-brand-purple hover:bg-brand-purple-light rounded-lg text-xs font-black transition-colors"
                    >
                      ✨ تصفح كل المنتجات (الكل)
                    </button>
                    {dynamicCategories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          handleNavigate('products', { category: cat.id });
                          setIsSidebarOpen(false);
                        }}
                        className="w-full text-right py-1.5 px-3 hover:bg-brand-purple-light hover:text-brand-purple text-gray-700 rounded-lg text-xs font-semibold select-none flex items-center justify-between transition-colors"
                      >
                        <span className="truncate">{cat.name}</span>
                        <span className="text-sm shrink-0">{cat.icon}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => { handleNavigate('cart'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl font-extrabold text-xs transition-all duration-200 ${
                  currentView === 'cart' 
                    ? 'bg-brand-purple text-white shadow-xs' 
                    : 'text-gray-700 hover:bg-brand-purple-light hover:text-brand-purple'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>السلة 🛒</span>
                  {totalCartCount > 0 && (
                    <span className="bg-brand-green text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-full">
                      {totalCartCount}
                    </span>
                  )}
                </div>
                <span className="text-[9px] opacity-75">&lt;</span>
              </button>

              <button
                onClick={() => { 
                  if (lastOrderDetails) {
                    handleNavigate('order-success');
                  } else {
                    handleNavigate('products');
                  }
                  setIsSidebarOpen(false); 
                }}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl font-extrabold text-xs transition-all duration-200 ${
                  currentView === 'order-success' 
                    ? 'bg-brand-purple text-white shadow-xs' 
                    : 'text-gray-700 hover:bg-brand-purple-light hover:text-brand-purple'
                }`}
              >
                <span>طلباتي 📦</span>
                <span className="text-[9px] opacity-75">&lt;</span>
              </button>

              <button
                onClick={() => { 
                  setIsSidebarOpen(false); 
                  setTimeout(() => {
                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                  }, 100);
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-xl font-extrabold text-xs text-gray-700 hover:bg-brand-purple-light hover:text-brand-purple transition-all duration-200"
              >
                <span>تواصل معنا 📞</span>
                <span className="text-[9px] opacity-75">&lt;</span>
              </button>

              {userRole === 'owner' ? (
                <>
                  <button
                    onClick={() => { handleNavigate('admin'); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl font-extrabold text-xs transition-all duration-200 ${
                      currentView === 'admin' 
                        ? 'bg-[#00bf63] text-white shadow-xs' 
                        : 'text-gray-700 hover:bg-green-50 hover:text-[#00bf63]'
                    }`}
                  >
                    <span>لوحة التحكم للمسؤول 🔐</span>
                    <span className="text-[9px] opacity-75">&lt;</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsSidebarOpen(false);
                      handleSwitchToUser();
                    }}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl font-extrabold text-xs text-red-600 hover:bg-red-50 transition-all duration-200"
                  >
                    <span>تسجيل خروج المالك 🚪</span>
                    <span className="text-[9px] opacity-75">&lt;</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setIsSidebarOpen(false);
                    handleSwitchToUser();
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl font-extrabold text-xs text-red-600 hover:bg-red-50 transition-all duration-200"
                >
                  <span>تسجيل الخروج 🚪</span>
                  <span className="text-[9px] opacity-75">&lt;</span>
                </button>
              )}
            </div>

            {/* Sidebar Footer */}
            <div className="p-5 border-t border-gray-100 bg-gray-50 text-right space-y-2">
              <span className="text-[10px] font-bold text-gray-400">تواصل فائق السرعة عبر الدعم:</span>
              <div className="text-xs font-black text-brand-purple font-mono">01023456789 / 01112345678</div>
            </div>

          </div>
        </div>
      )}

      {/* 5. Bottom Navbar Floating for mobile screens */}
      <BottomNav
        currentView={currentView}
        cartCount={totalCartCount}
        onNavigate={handleNavigate}
      />

      {/* 6. Floating Cart Bar of products total and items count */}
      <AnimatePresence>
        {showFloatingCartBar && (
          <motion.div
            key="floating-cart-bar"
            initial={{ y: 100, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            onClick={() => handleNavigate('cart')}
            className="fixed bottom-[74px] md:bottom-6 left-3.5 right-3.5 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-full md:max-w-xl z-40 bg-[#00bf63] hover:bg-brand-green-dark text-white rounded-2xl border-2 border-white/20 shadow-[0_10px_35px_rgba(0,0,0,0.25)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] cursor-pointer transition-all duration-300 select-none p-3.5"
          >
            <div className="flex items-center justify-between w-full">
              
              {/* Right Side (RTL Start): Price Total & Product Items Count */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <span className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center font-black text-sm shadow-inner">
                    {totalCartCount}
                  </span>
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                  </span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[10px] md:text-xs text-white/90 font-black leading-tight flex items-center gap-1">
                    <span>سلتك الموفرة الحالية</span>
                    <span className="animate-bounce-subtle">🛒</span>
                  </span>
                  <span className="text-sm md:text-base font-black leading-tight mt-0.5">
                    الإجمالي: {totalCartPrice} ج.م
                  </span>
                </div>
              </div>

              {/* Left Side (RTL End): Cart Icon & navigation helper */}
              <div className="flex items-center gap-2">
                <span className="text-xs md:text-sm font-black hidden sm:inline-block">تأكيد الطلب الآن</span>
                <div className="w-9 h-9 rounded-xl bg-white text-[#00bf63] flex items-center justify-center shadow-xs">
                  <svg className="w-5 h-5 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                  </svg>
                </div>
                <span className="text-sm font-black animate-pulse">⟵</span>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 7. Owner Login Dialog Modal */}
      {showOwnerLoginModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs text-right font-sans select-none">
          <div className="w-full max-w-md bg-white rounded-3xl border border-gray-100 shadow-2xl p-6 sm:p-8 relative animate-scale-up">
            
            {/* Close Button */}
            <button
              onClick={() => {
                setShowOwnerLoginModal(false);
                setLoginUsername('');
                setLoginPassword('');
                setLoginErrorMsg('');
              }}
              className="absolute left-4 top-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
            >
              ✕
            </button>

            <div className="w-14 h-14 bg-[#eafbf2] text-[#00bf63] rounded-2xl flex items-center justify-center text-xl mx-auto mb-4">
              <FaUnlockAlt />
            </div>
            
            <h3 className="text-xl font-black text-gray-800 text-center mb-1">تسجيل دخول المالك</h3>
            <p className="text-[11px] text-gray-400 font-bold text-center mb-5 leading-relaxed">
              يرجى إدخال اسم المستخدم وكلمة المرور لتفعيل ميزات لوحة التحكم وإدارة المتجر.
            </p>

            {loginErrorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold mb-4 text-center">
                {loginErrorMsg}
              </div>
            )}

            <form onSubmit={handleOwnerLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-gray-600 mb-1">اسم المستخدم</label>
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="مثال: admin"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#00bf63]/40 focus:border-[#00bf63] text-left font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-gray-600 mb-1">كلمة المرور</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="إدخال كلمة المرور"
                    className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#00bf63]/40 focus:border-[#00bf63] text-left font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors cursor-pointer"
                  >
                    {showPassword ? <FaEyeSlash className="w-4 h-4 text-gray-500" /> : <FaEye className="w-4 h-4 text-gray-500" />}
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 font-semibold mt-1">الرمز الافتراضي: 123</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowOwnerLoginModal(false);
                    setLoginUsername('');
                    setLoginPassword('');
                    setLoginErrorMsg('');
                  }}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-black rounded-xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLogin}
                  className="flex-1 py-2.5 bg-[#00bf63] hover:bg-brand-green-dark text-white text-xs font-black rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingLogin ? 'جاري التحقق...' : 'تأكيد الدخول 🔑'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
