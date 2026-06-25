import { useEffect } from 'react';
import { OrderDetails } from '../types';
import { FaCheckCircle, FaWhatsapp, FaHome, FaMapMarkerAlt, FaFileInvoice } from 'react-icons/fa';
import { FiLoader } from 'react-icons/fi';

interface OrderSuccessViewProps {
  orderDetails: OrderDetails;
  onNavigate: (view: string, params?: any) => void;
}

export default function OrderSuccessView({
  orderDetails,
  onNavigate,
}: OrderSuccessViewProps) {
  
  const { orderId, items, customerInfo, subtotal, shipping, total, date } = orderDetails;

  const formatPrice = (amount: number) => {
    return `${amount.toLocaleString('ar-EG')} ج.م`;
  };

  // WhatsApp redirection link with highly detailed invoice information
  const getWhatsAppLink = () => {
    const itemsList = items.map(item => {
      const activePrice = item.product.discountPrice || item.product.price;
      const itemSubtotal = activePrice * item.quantity;
      return `- ${item.product.title} (العدد: ${item.quantity}) - سعر القطعة: ${activePrice} ج.م (الإجمالي: ${itemSubtotal} ج.م)`;
    }).join('\n');

    const shopDetail = customerInfo.city && customerInfo.city !== 'أوردر شخصي (لا يوجد اسم محل)'
      ? ` - المحل/النشاط: ${customerInfo.city}`
      : '';

    const textMessage = [
      `رقم الطلب: #${orderId}`,
      `اسم العميل: ${customerInfo.name}`,
      `رقم العميل: ${customerInfo.phone}`,
      `تفاصيل المكان: الإسماعيلية (${customerInfo.governorate})${shopDetail} - العنوان بالتفصيل: ${customerInfo.address}`,
      ``,
      `المنتجات المطلوبة ومبلغهم:`,
      itemsList,
      ``,
      `إجمالي الفاتورة: ${total} ج.م`
    ].join('\n');
    const dummyTextMessage = ''; /* `🌟 *طلب جديد من متجر الشوربجي* 🌟
----------------------------------
رقم الأوردر: #${orderId}

👤 *بيانات المستلم والعميل:*
- الاسم واللقب: ${customerInfo.name}
- رقم الهاتف الشغال: ${customerInfo.phone}
- المنطقة في الإسماعيلية: ${customerInfo.governorate}${shopDetail}
- العنوان بالتفصيل: ${customerInfo.address}

📦 *الأصناف والمنتجات المطلوبة:*
${itemsList}

💵 *تفاصيل حساب الفاتورة:*
- ثمن المنتجات: ${subtotal} ج.م
- كلفة شحن الدليفري: ${shipping === 0 ? 'شحن مجاني' : `${shipping} ج.م`}
- *الإجمالي المطلوب تسليمه كاش للطيار:* *${total} ج.م*

🚀 جهة التوصيل جاري تجهيزها، برجاء استلام وتأكيد شحنها الآن! 🥰`; */

    const message = encodeURIComponent(textMessage);
    return `https://wa.me/201203680727?text=${message}`;
  };

  // Automatic Redirection Trigger
  useEffect(() => {
    const waLink = getWhatsAppLink();
    try {
      // Use window.open to open in a new tab instead of iframe location change (which causes "refused to connect")
      const newWindow = window.open(waLink, '_blank');
      if (!newWindow) {
        console.log('Popup blocked or iframe sandbox constraint.');
      }
    } catch (e) {
      console.error('Redirect failed safely', e);
    }
  }, []);

  return (
    <div className="max-w-3xl mx-auto pb-20 md:pb-8 font-sans select-none my-4 text-right">
      
      {/* Redirection Alert Notice */}
      <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-3xl flex items-center justify-between gap-3 text-right">
        <div className="flex items-center gap-2.5">
          <FiLoader className="animate-spin text-[#00bf63] text-lg shrink-0" />
          <span className="text-xs sm:text-sm font-black">
            جاري تحويلك الآن تلقائياً إلى واتساب لتسريع تأكيد وحجز الدليفري لطلبك... 🚀
          </span>
        </div>
        <a 
          href={getWhatsAppLink()} 
          className="px-3 py-1.5 bg-[#25d366] text-white hover:bg-[#20ba56] rounded-xl text-[10px] sm:text-xs font-black shrink-0 transition-colors shadow-2xs cursor-pointer decoration-transparent"
        >
          اضغط هنا للذهاب فوراً
        </a>
      </div>

      {/* 1. Header Splash */}
      <div className="bg-white border border-gray-150 rounded-3xl p-6 md:p-8 shadow-xs text-center space-y-4 mb-6 relative overflow-hidden">
        {/* Animated Background Confetti Elements */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#dafbe9] rounded-bl-full opacity-60"></div>
        <div className="absolute top-0 left-0 w-24 h-24 bg-brand-purple-light rounded-br-full opacity-60"></div>

        <div className="relative z-10 flex flex-col items-center">
          <FaCheckCircle className="w-16 h-16 text-brand-green mb-3 drop-shadow-sm animate-pulse-subtle" />
          <h1 className="text-xl md:text-2xl font-black text-[#00602e]">تم تسجيل طلبك بنجاح في متجر الشوربجي! 🎉</h1>
          <p className="text-xs md:text-sm text-gray-500 font-bold max-w-lg leading-relaxed mt-2 text-center">
            تم استلام الأوردر بنجاح! <span className="text-brand-purple font-black">سيتواصل معك ممثل خدمة العملاء هاتفياً</span> خلال ٢٤ ساعة القادمة لتأكيد العنوان وحجز موعد الدليفري المناسب قبل خروج الشحنة.
          </p>
        </div>

        {/* Highlighted Order ID */}
        <div className="bg-[#FAF9FF] border border-brand-purple/10 rounded-2xl py-3 px-6 inline-flex flex-col items-center justify-center">
          <span className="text-[10px] md:text-xs text-gray-450 font-bold">رقم الطلب الفريد (Order ID)</span>
          <span className="text-lg md:text-2xl font-black text-brand-purple mt-1 tracking-wider">{orderId}</span>
        </div>
      </div>

      {/* 2. Customer details & items breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        
        {/* Delivery Details Card */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm md:text-base font-black text-gray-800 pb-2.5 border-b border-gray-50 flex items-center gap-2">
            <FaMapMarkerAlt className="text-brand-purple" /> معلومات الشحن و الدلفري
          </h3>

          <ul className="space-y-3 text-xs md:text-sm font-bold text-gray-600">
            <li className="flex justify-between items-center py-1">
              <span className="text-gray-400">الاسم واللقب:</span>
              <span className="text-gray-800">{customerInfo.name}</span>
            </li>
            <li className="flex justify-between items-center py-1">
              <span className="text-gray-400">رقم الهاتف الشغال:</span>
              <span className="text-gray-800 font-mono" style={{ direction: 'ltr' }}>{customerInfo.phone}</span>
            </li>
            <li className="flex justify-between items-center py-1">
              <span className="text-gray-400">المنطقة في الإسماعيلية:</span>
              <span className="text-gray-800">{customerInfo.governorate}</span>
            </li>
            <li className="flex justify-between items-center py-1">
              <span className="text-gray-400">اسم المحل / النشاط التجاري:</span>
              <span className="text-gray-800">{customerInfo.city}</span>
            </li>
            <li className="block bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-[10px] leading-relaxed select-text text-right mt-2">
              <span className="text-gray-400 font-extrabold block mb-0.5">العنوان بالتفصيل:</span>
              <span className="text-gray-700 font-semibold">{customerInfo.address}</span>
            </li>
          </ul>
        </div>

        {/* Invoice Summary Card */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm md:text-base font-black text-gray-800 pb-2.5 border-b border-gray-50 flex items-center gap-2">
            <FaFileInvoice className="text-brand-purple" /> بيان حساب الفاتورة كاش
          </h3>

          <ul className="space-y-2 text-xs md:text-sm font-bold text-gray-650">
            {/* Short review of items with quantities */}
            <div className="max-h-24 overflow-y-auto no-scrollbar space-y-1 bg-gray-50/50 p-2 rounded-xl mb-2 divide-y divide-gray-100/50">
              {items.map((item) => (
                <div key={item.product.id} className="flex justify-between text-[11px] text-gray-500 py-1 font-semibold">
                  <span className="truncate max-w-[70%]">{item.product.title}</span>
                  <span className="text-gray-800 shrink-0">x{item.quantity}</span>
                </div>
              ))}
            </div>

            <li className="flex justify-between items-center py-0.5">
              <span className="text-gray-400">تاريخ الطلب:</span>
              <span className="text-gray-750 text-[11px]">{date}</span>
            </li>
            <li className="flex justify-between items-center py-0.5 border-t border-gray-50 pt-2">
              <span className="text-gray-400">ثمن المنتجات:</span>
              <span className="text-gray-850 font-black">{formatPrice(subtotal)}</span>
            </li>
            <li className="flex justify-between items-center py-0.5">
              <span className="text-gray-400">تكلفة الشحن:</span>
              <span className="text-gray-805 font-black">{shipping === 0 ? 'مجانى' : formatPrice(shipping)}</span>
            </li>
            <li className="flex justify-between items-center pt-2 border-t border-gray-100 text-sm md:text-base font-extrabold text-brand-purple">
              <span>الإجمالي المطلوب كاش:</span>
              <span className="text-[#5108b5] font-black text-base md:text-lg">{formatPrice(total)}</span>
            </li>
          </ul>
        </div>

      </div>

      {/* 3. Call to Actions for customer outreach */}
      <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-xs text-center space-y-5">
        <h4 className="text-xs sm:text-sm font-black text-gray-800">تبي تأكيد فوري وخروج شحنتك اليوم؟ ⚡</h4>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          {/* WhatsApp Direct link */}
          <a
            href={getWhatsAppLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-6 py-3 bg-[#25d366] hover:bg-[#20ba56] text-white font-extrabold text-xs sm:text-sm rounded-full shadow-md flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer decoration-transparent"
          >
            <FaWhatsapp className="w-5 h-5 animate-bounce-subtle" /> راسلنا الآن لتسريع الشحن بالواتساب
          </a>

          {/* Return home button */}
          <button
            onClick={() => onNavigate('home')}
            className="w-full sm:w-auto px-6 py-3 bg-brand-purple hover:bg-brand-purple-dark text-white font-extrabold text-xs sm:text-sm rounded-full shadow-md flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer"
          >
            <FaHome className="w-4 h-4 text-brand-green" /> تصفح عروض الشوربجي الأخرى
          </button>
        </div>

        <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
          الدعم الفني والشكاوى لمتجر الشوربجي متوفر ٢٤ ساعة هاتفياً على الرقم ٠١٢٠٣٦٨٠٧٢٧ أو بالواتساب. نحن سعداء باختياركم لنا!
        </p>
      </div>

    </div>
  );
}
