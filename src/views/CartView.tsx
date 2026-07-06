import React, { useState } from 'react';
import { CartItem, OrderDetails } from '../types';
import { GOVERNORATES } from '../data';
import { FaTrash, FaShieldAlt, FaMinus, FaPlus, FaCreditCard, FaUser, FaPhone, FaMapMarkedAlt } from 'react-icons/fa';
import { FiShoppingBag, FiInfo } from 'react-icons/fi';

interface CartViewProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onCheckoutComplete: (orderDetails: OrderDetails) => void;
  onNavigate: (view: string, params?: any) => void;
  isStoreClosed?: boolean;
}

export default function CartView({
  cart,
  onUpdateQuantity,
  onRemoveFromCart,
  onCheckoutComplete,
  onNavigate,
  isStoreClosed,
}: CartViewProps) {
  
  // Checkout Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedGovernorateCode, setSelectedGovernorateCode] = useState('ismailia_city');
  const [customerCity, setCustomerCity] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  
  // Form Validations and loading spinners
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Math totals
  const subtotal = cart.reduce((sum, item) => {
    const unitPrice = item.product.discountPrice || item.product.price;
    return sum + unitPrice * item.quantity;
  }, 0);

  const selectedGov = GOVERNORATES.find((g) => g.id === selectedGovernorateCode) || GOVERNORATES[0];
  const shippingFee = cart.length > 0 ? selectedGov.shipping : 0;
  const total = subtotal + shippingFee;

  const handleUpdate = (productId: string, currentQty: number, change: number) => {
    const nextQty = currentQty + change;
    if (nextQty >= 1) {
      onUpdateQuantity(productId, nextQty);
    }
  };

  const formatPrice = (amount: number) => {
    return `${amount.toLocaleString('ar-EG')} ج.م`;
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Field validations
    if (!customerName.trim()) {
      setErrorMessage('يرجى كتابة الاسم لتسجيل طلبك.');
      return;
    }

    // Egyptian phone formats (010, 011, 012, 015 - 11 digits)
    const egPhoneRegex = /^01[0125]\d{8}$/;
    if (!egPhoneRegex.test(customerPhone.trim())) {
      setErrorMessage('يرجى كتابة رقم هاتف مصري صحيح مكون من ١١ رقماً ويشمل الكود (مثال: 01012345678).');
      return;
    }

    if (!customerAddress.trim()) {
      setErrorMessage('يرجى كتابة العنوان لتسجيل طلبك.');
      return;
    }

    setIsSubmitting(true);

    // Simulate ordering registration process
    setTimeout(() => {
      const orderId = 'الشوربجي --';
      
      const newOrder: OrderDetails = {
        orderId,
        items: [...cart],
        customerInfo: {
          name: customerName.trim(),
          phone: customerPhone.trim(),
          governorate: selectedGov.name,
          city: customerCity.trim() || 'أوردر شخصي (لا يوجد اسم محل)',
          address: customerAddress.trim(),
        },
        subtotal,
        shipping: shippingFee,
        total,
        date: new Date().toLocaleDateString('ar-EG', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      setIsSubmitting(false);
      onCheckoutComplete(newOrder);
    }, 1500);
  };

  if (cart.length === 0) {
    return (
      <div className="py-14 text-center bg-white border border-gray-150 rounded-3xl max-w-2xl mx-auto p-8 shadow-xs flex flex-col items-center justify-center space-y-4 font-sans select-none my-6">
        <div className="w-16 h-16 bg-brand-purple-light text-brand-purple rounded-full flex items-center justify-center text-3xl">
          🛒
        </div>
        <h2 className="text-xl font-black text-gray-800">سلة مشترياتك فارغة حالياً!</h2>
        <p className="text-sm text-gray-400 font-semibold max-w-sm leading-relaxed">
          فرص الفرح والتخفيضات الكبرى في انتظارك! أضف الآن الهواتف الذكية أو مستلزمات المطبخ بجودة وضمان الشوربجي لتبدأ الشحن.
        </p>
        <button
          onClick={() => onNavigate('home')}
          className="px-6 py-3 bg-brand-purple hover:bg-brand-purple-dark text-white text-xs sm:text-sm font-extrabold rounded-full shadow-md cursor-pointer"
        >
          ابدأ بتصفح العروض الآن
        </button>
      </div>
    );
  }

  return (
    <div className="pb-20 md:pb-8 font-sans">
      <h1 className="text-xl md:text-3xl font-black text-gray-800 mb-6 flex items-center gap-2">
        <span>سلة التسوق وإتمام الطلبات</span>
        <span className="text-xs bg-brand-purple text-white px-2.5 py-0.5 rounded-full font-bold">
          {cart.length} منتجات مضافة
        </span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
        
        {/* ======================================= */}
        {/* RIGHT COLUMN: Products list             */}
        {/* ======================================= */}
        <div className="lg:col-span-7 bg-white border border-gray-100 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
          <h2 className="text-sm md:text-base font-black text-gray-800 pb-3 border-b border-gray-50 flex justify-between items-center">
            <span>مراجعة الأصناف بالسلة 📦</span>
            <button 
              onClick={() => onNavigate('products')} 
              className="text-xs text-brand-purple font-bold hover:underline"
            >
              + إضافة المزيد من المنتجات
            </button>
          </h2>

          <div className="divide-y divide-gray-50">
            {cart.map((item) => {
              const { id, title, price, discountPrice, image, brand } = item.product;
              const activePrice = discountPrice || price;
              
              return (
                <div key={id} className="py-4 flex gap-3 sm:gap-4 items-center">
                  
                  {/* Thumbnail */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded-xl p-1 flex items-center justify-center border border-gray-100 shrink-0">
                    <img src={image} alt={title} className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                  </div>

                  {/* Body description */}
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-black text-brand-purple uppercase bg-brand-purple-light px-1.5 py-0.5 rounded">
                      {brand}
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-gray-850 truncate mt-1 hover:text-brand-purple cursor-pointer" onClick={() => onNavigate('product-detail', { id })}>
                      {title}
                    </h3>
                    
                    {/* Size and Color options if chosen */}
                    {item.selectedSize && (
                      <span className="text-[10px] text-gray-400 font-bold ml-2">الحجم: {item.selectedSize}</span>
                    )}

                    <div className="flex items-center gap-1.5 mt-1 sm:hidden">
                      <span className="text-xs font-black text-gray-900">
                        {formatPrice(activePrice)}
                      </span>
                    </div>
                  </div>

                  {/* Actions column */}
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-4 shrink-0">
                    
                    {/* Qty controller plus/minus */}
                    <div className="flex items-center border border-gray-150 rounded-full py-0.5 px-2 bg-white">
                      <button
                        onClick={() => handleUpdate(id, item.quantity, -1)}
                        className="w-5 h-5 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 cursor-pointer"
                        aria-label="Decrease"
                      >
                        <FaMinus className="w-2 h-2" />
                      </button>
                      <span className="font-extrabold text-xs text-gray-800 w-6 text-center select-none">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdate(id, item.quantity, 1)}
                        className="w-5 h-5 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 cursor-pointer"
                        aria-label="Increase"
                      >
                        <FaPlus className="w-2 h-2" />
                      </button>
                    </div>

                    {/* Cost formatting */}
                    <span className="hidden sm:inline-block text-sm font-extrabold text-gray-800 min-w-20 text-left">
                      {formatPrice(activePrice * item.quantity)}
                    </span>

                    {/* Delete item button */}
                    <button
                      onClick={() => onRemoveFromCart(id)}
                      className="w-7 h-7 rounded-full text-red-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer"
                      title="احذف الصنف"
                    >
                      <FaTrash className="w-3.5 h-3.5" />
                    </button>

                  </div>

                </div>
              );
            })}
          </div>

          <div className="bg-[#FAF9FF] border border-brand-purple/5 rounded-2xl p-4 flex items-center justify-center mt-4">
            <div className="flex items-center gap-1 text-xs md:text-sm font-bold text-brand-purple">
              <FaShieldAlt /> تسوق آمن بنسبة ١٠٠٪
            </div>
          </div>
        </div>

        {/* ======================================= */}
        {/* LEFT COLUMN: Customer Form & checkout   */}
        {/* ======================================= */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Summary receipt box */}
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-xs">
            <h3 className="text-sm md:text-base font-black text-gray-850 pb-3 border-b border-gray-50 mb-4">
              ملخص الفاتورة وإجمالي الحساب 🧾
            </h3>

            <div className="space-y-3 pb-3 border-b border-gray-50 text-xs md:text-sm font-bold">
              <div className="flex justify-between text-gray-500">
                <span>ثمن المنتجات الحالي:</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>تكلفة توصيل المحافظة:</span>
                <span>{shippingFee === 0 ? 'مجانى' : formatPrice(shippingFee)}</span>
              </div>
              <div className="flex justify-between text-gray-400 text-[11px] bg-gray-50 p-2.5 rounded-lg border border-gray-100/50">
                <span className="flex items-center gap-1 font-semibold leading-relaxed">
                  <FiInfo className="text-brand-purple flex-shrink-0" />
                  براند الشوربجي يوفر توصيل سريع مؤمّن ومكفول بالكامل.
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 text-sm md:text-lg font-black">
              <span className="text-gray-900">المطلوب سداده كاش:</span>
              <span className="text-brand-purple text-base md:text-xl">
                {formatPrice(total)}
              </span>
            </div>
          </div>

          {/* Cash on delivery checkout form */}
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-xs">
            <h3 className="text-sm md:text-base font-black text-gray-800 pb-3 border-b border-gray-50 mb-4 flex items-center justify-between">
              <span>بيانات مشتري شحن الشوربجي الدلفري 🚚</span>
              <span className="text-[10px] bg-brand-green text-black font-black px-2 py-0.5 rounded uppercase">الدفع كاش عند الاستلام</span>
            </h3>

            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 block">الاسم *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="اكتب اسمك بوضوح"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2.5 pr-9 text-xs sm:text-sm font-bold border border-gray-200 rounded-xl focus:outline-none focus:border-brand-purple bg-gray-50/50"
                  />
                  <FaUser className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Phone number */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 block">رقم الهاتف لاستلام تأكيد الأوردر *</label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    maxLength={11}
                    placeholder="مثال: 01012345678"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2.5 pr-9 text-xs sm:text-sm font-bold border border-gray-200 rounded-xl focus:outline-none focus:border-brand-purple bg-gray-50/50 text-left"
                    style={{ direction: 'ltr' }}
                  />
                  <FaPhone className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Governorate Dropdown */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 block">المنطقة في الإسماعيلية *</label>
                <div className="relative">
                  <select
                    value={selectedGovernorateCode}
                    onChange={(e) => setSelectedGovernorateCode(e.target.value)}
                    className="w-full px-3 py-2.5 pr-9 text-xs sm:text-sm font-bold border border-gray-200 rounded-xl focus:outline-none focus:border-brand-purple bg-gray-50 shadow-xs cursor-pointer appearance-none"
                  >
                    {GOVERNORATES.map((gov) => (
                      <option key={gov.id} value={gov.id}>
                        {gov.name} (شحن مجاني)
                      </option>
                    ))}
                  </select>
                  <FaMapMarkedAlt className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Detailed Address */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 block">العنوان بالتفصيل (الشارع، عمارة، شقة، علامة مميزة) *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="مثال: شارع الجمهورية - عمارة ٣ب - الطابق الرابع - بجوار صيدلية..."
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs sm:text-sm font-bold border border-gray-200 rounded-xl focus:outline-none focus:border-brand-purple bg-gray-50/50 leading-relaxed resize-none"
                ></textarea>
              </div>

              {/* Shop / Store Name (Optional) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 block">اسم المحل / النشاط التجاري (اختياري)</label>
                <input
                  type="text"
                  placeholder="مثال: محل الشوربجي ستور (اتركه فارغاً إذا كان طلباً شخصياً)"
                  value={customerCity}
                  onChange={(e) => setCustomerCity(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs sm:text-sm font-bold border border-gray-200 rounded-xl focus:outline-none focus:border-brand-purple bg-gray-50/50"
                />
              </div>

              {/* Alert validations */}
              {errorMessage && (
                <div className="bg-red-50 text-red-600 border border-red-100 rounded-xl p-3 text-xs font-medium leading-relaxed">
                  ⚠️ {errorMessage}
                </div>
              )}

              {/* Confirm submit trigger button with cash-on-delivery branding */}
              {isStoreClosed ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center space-y-1.5 mt-4">
                  <span className="text-2xl block">🏪❌</span>
                  <p className="text-xs font-black text-red-700">المحل مغلق مؤقتاً حالياً</p>
                  <p className="text-[10px] text-red-600 font-bold leading-relaxed">
                    نعتذر منك بشدة، تم إغلاق استقبال الطلبات الجديدة مؤقتاً بواسطة الإدارة لتجهيز الدفعات الحالية. لا يمكن تأكيد الشراء الآن، يمكنك تصفح المنتجات وسنسعد بخدمتكم قريباً جداً!
                  </p>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 mt-2 bg-brand-purple hover:bg-brand-purple-dark disabled:bg-gray-300 text-white font-extrabold text-sm sm:text-base rounded-xl transition-all duration-300 shadow-md shadow-brand-purple/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      جاري تـسجيل طلبـك بكـنز...
                    </span>
                  ) : (
                    <>
                      <span>✓ تأكيد الطلب والدفع عند الاستلام</span>
                    </>
                  )}
                </button>
              )}

            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
