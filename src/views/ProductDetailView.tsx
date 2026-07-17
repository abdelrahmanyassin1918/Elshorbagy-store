import { useState } from 'react';
import { Product } from '../types';
import { FaStar, FaShoppingCart, FaChevronRight, FaShieldAlt, FaTruck, FaUndo, FaMinus, FaPlus, FaChevronLeft } from 'react-icons/fa';
import { FiArrowRight, FiShoppingBag, FiMessageSquare } from 'react-icons/fi';
import { addProductReview } from '../firestoreUtils';

interface ProductDetailViewProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number, options?: { color?: string; size?: string }) => void;
  onNavigate: (view: string, params?: any) => void;
  onRefreshData: () => void; // To refresh product data after review submission
}

export default function ProductDetailView({
  product,
  onAddToCart,
  onNavigate,
  onRefreshData,
}: ProductDetailViewProps) {
  const imageList = product.images && product.images.length > 0 ? product.images : [product.image];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedColor, setSelectedColor] = useState<string>('أساسي');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [addedMessage, setAddedMessage] = useState<boolean>(false);

  // Review form state
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState({ type: '', text: '' });

  // Mock colors & capacities if not standard
  const availableColors = ['#1e293b', '#64748b', '#e2e8f0', '#0f766e'];
  const sizesList = product.category === 'mobiles' 
    ? ['128 جيجا', '256 جيجا', '512 جيجا'] 
    : product.category === 'personal_care' 
      ? ['50 مل', '100 مل', '150 مل'] 
      : [];

  const handleIncrement = () => setQuantity((prev) => prev + 1);
  const handleDecrement = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  const formatPrice = (amount: number) => {
    return `${amount.toLocaleString('ar-EG')} ج.م`;
  };

  const handleAddClick = () => {
    onAddToCart(product, quantity, {
      color: selectedColor,
      size: selectedSize || undefined,
    });
    setAddedMessage(true);
    setTimeout(() => {
      setAddedMessage(false);
    }, 4000);
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % imageList.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + imageList.length) % imageList.length);
  };

  const selectedImage = imageList[currentImageIndex];

  // Safe checks for specification data
  const specsEntries = Object.entries(product.specs || {});

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim() || reviewRating === 0 || !reviewComment.trim()) {
      setReviewMessage({ type: 'error', text: 'يرجى ملء جميع الحقول: الاسم، التقييم، والتعليق.' });
      return;
    }

    setIsSubmittingReview(true);
    setReviewMessage({ type: '', text: '' });

    try {
      await addProductReview(product.id, {
        name: reviewName,
        rating: reviewRating,
        comment: reviewComment,
      });

      setReviewMessage({ type: 'success', text: 'شكراً لك! تم إضافة تقييمك بنجاح.' });
      setReviewName('');
      setReviewRating(0);
      setReviewComment('');
      onRefreshData(); // Refresh data to show the new review and updated average
    } catch (error) {
      setReviewMessage({ type: 'error', text: 'عذراً، حدث خطأ أثناء إرسال التقييم. يرجى المحاولة مرة أخرى.' });
      console.error("Review submission error:", error);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="pb-20 md:pb-8 font-sans">
      
      {/* 1. Breadcrumb navigation */}
      <div className="flex items-center gap-2 py-3 px-1 text-xs md:text-sm text-gray-500 font-bold mb-4 overflow-x-auto no-scrollbar whitespace-nowrap">
        <button onClick={() => onNavigate('home')} className="hover:text-brand-purple cursor-pointer">الرئيسية</button>
        <FaChevronRight className="w-2.5 h-2.5 shrink-0 text-gray-400" />
        <button onClick={() => onNavigate('products', { category: product.category })} className="hover:text-brand-purple cursor-pointer">
          {product.category === 'mobiles' ? 'موبايلات وإكسسوارات' : 
           product.category === 'home' ? 'أدوات منزلية ومطبخ' : 
           product.category === 'personal_care' ? 'العناية الشخصية والجمال' : 
           product.category === 'electronics' ? 'أجهزة كهربائية' : 'سوبر ماركت وغذاء'}
        </button>
        <FaChevronRight className="w-2.5 h-2.5 shrink-0 text-gray-400" />
        <span className="text-gray-900 truncate max-w-[200px] md:max-w-none">{product.title}</span>
      </div>

      {/* 2. Main details Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10 bg-white border border-gray-100 rounded-3xl p-4 sm:p-6 md:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        
        {/* RIGHT COLUMN: Image Gallery (Span 5) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* Main Huge Image */}
          <div className="w-full aspect-square md:h-[400px] bg-gray-50 rounded-2xl p-4 flex items-center justify-center border border-gray-50 relative overflow-hidden group">
            <img
              src={selectedImage}
              alt={product.title}
              referrerPolicy="no-referrer"
              className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
            />
            {product.discountPercentage && (
              <span className="absolute top-4 right-4 bg-brand-green-light border border-brand-green/30 text-brand-green-dark text-xs sm:text-sm font-black px-3 py-1 rounded-full shadow-xs">
                وفر -{product.discountPercentage}%
              </span>
            )}
            {imageList.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/70 backdrop-blur-sm text-gray-700 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white"
                  aria-label="Previous Image"
                >
                  <FaChevronLeft />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/70 backdrop-blur-sm text-gray-700 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white"
                  aria-label="Next Image"
                >
                  <FaChevronRight />
                </button>
              </>
            )}
          </div>

          {/* Sub Thumbnails row if more images available */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 justify-center overflow-x-auto no-scrollbar py-1">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImageIndex(i)}
                  className={`w-14 h-14 md:w-18 md:h-18 rounded-xl border-2 p-1 bg-gray-50 hover:bg-white transition-all flex items-center justify-center overflow-hidden cursor-pointer ${
                    selectedImage === img ? 'border-brand-purple bg-white scale-102 shadow-xs' : 'border-transparent'
                  }`}
                >
                  <img src={img} alt="نموذج مصغر" className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* LEFT COLUMN: Purchase specifications and details (Span 7) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4 text-right">
          
          <div className="space-y-3">
            {/* Brand and category pill */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-brand-purple-light text-brand-purple border border-brand-purple/10 text-xs font-black px-3 py-1 rounded-full">
                ماركة {product.brand}
              </span>
              {product.company && (
                <span className="bg-green-50 text-brand-green border border-brand-green/20 text-xs font-black px-3 py-1 rounded-full">
                  الشركة: {product.company}
                </span>
              )}
              <span className="bg-gray-50 text-gray-500 text-xs font-bold px-2.5 py-1 rounded-full border border-gray-100">
                أصلي ١٠٠٪ 🔒
              </span>
            </div>

            {/* Product Title */}
            <h1 className="text-lg sm:text-2xl font-black text-gray-900 leading-snug">
              {product.title}
            </h1>

            {/* Rating Stars and review stats */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-0.5 text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`shrink-0 ${
                      star <= Math.round(product.rating) ? 'text-amber-400' : 'text-gray-200'
                    }`}
                  >
                    <FaStar size={15} />
                  </span>
                ))}
              </div>
              <span className="text-xs sm:text-sm font-extrabold text-gray-700">
                {product.rating} / 5
              </span>
              <span className="text-xs text-gray-400 font-semibold border-r border-gray-200 pr-2.5">
                ({product.reviewsCount} تقييم حقيقي للمشترين)
              </span>
            </div>

            <hr className="border-gray-50" />

            {/* Price Box */}
            <div className="bg-[#FAF9FF] border border-brand-purple/5 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <span className="text-xs font-bold text-gray-500 block mb-1">السعر الحصري لعملاء الشوربجي</span>
                <div className="flex items-baseline gap-2">
                  {product.discountPrice ? (
                    <>
                      <span className="text-2xl sm:text-3xl font-black text-gray-900">
                        {formatPrice(product.discountPrice)}
                      </span>
                      <span className="text-xs sm:text-sm text-gray-400 line-through font-bold">
                        {formatPrice(product.price)}
                      </span>
                    </>
                  ) : (
                    <span className="text-2xl sm:text-3xl font-black text-gray-900">
                      {formatPrice(product.price)}
                    </span>
                  )}
                </div>
              </div>

              {product.discountPercentage && (
                <div className="bg-[#dafbe9] text-[#00602e] border border-[#a3f0c1] rounded-xl px-3.5 py-2 font-black text-xs md:text-sm flex flex-col items-center">
                  <span>نسبة التوفير</span>
                  <span className="text-base font-black mt-0.5">-{product.discountPercentage}%</span>
                </div>
              )}
            </div>

            {/* Description Paragraph */}
            <div className="space-y-1 pt-1">
              <h4 className="text-xs sm:text-sm font-black text-gray-800">وصف ومميزات المنتج:</h4>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed font-semibold">
                {product.description}
              </p>
            </div>

            {/* Dynamic Sizing Option (Mock specs) */}
            {sizesList.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-black text-gray-400 block">اختر السعة / الحجم المفضل:</span>
                <div className="flex gap-2">
                  {sizesList.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-1.5 text-xs font-extrabold border rounded-xl transition-all cursor-pointer ${
                        selectedSize === size
                          ? 'border-brand-purple bg-brand-purple text-white shadow-xs'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. Buying interface panel */}
          <div className="space-y-4 pt-4 border-t border-gray-50 mt-4">
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Quantities Selector plus/minus */}
              <div className="flex items-center justify-between border border-gray-200 rounded-full py-2 px-4 h-11 bg-white sm:w-36">
                <button
                  onClick={handleDecrement}
                  className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
                  aria-label="Decrease Quantity"
                >
                  <FaMinus className="w-2.5 h-2.5" />
                </button>
                <span className="font-extrabold text-sm md:text-base text-gray-800 w-8 text-center">
                  {quantity}
                </span>
                <button
                  onClick={handleIncrement}
                  className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
                  aria-label="Increase Quantity"
                >
                  <FaPlus className="w-2.5 h-2.5" />
                </button>
              </div>

              {/* Huge Add To Cart button */}
              <button
                onClick={handleAddClick}
                className="flex-1 h-11 bg-brand-purple hover:bg-brand-purple-dark text-white font-extrabold text-sm sm:text-base rounded-full shadow-lg shadow-brand-purple/15 flex items-center justify-center gap-2 transition-all cursor-pointer transform active:scale-98"
              >
                <FiShoppingBag className="w-5 h-5 text-brand-green" /> الاضافة المباشرة لسلة الشوربجي
              </button>
            </div>

            {/* Toast success message in product detail page */}
            {addedMessage && (
              <div className="bg-[#dafbe9] text-[#00602e] border border-[#a3f0c1] rounded-xl p-3 text-xs md:text-sm font-extrabold flex items-center justify-between animate-fade-in select-none">
                <span>✓ تم إضافة {quantity} قطع بنجاح إلى سلة مشترياتك!</span>
                <button 
                  onClick={() => onNavigate('cart')}
                  className="underline text-brand-purple hover:text-brand-purple-dark pr-3 cursor-pointer text-xs"
                >
                  الذهاب للسلة ومتابعة الدفع
                </button>
              </div>
            )}

            {/* Extra assurance bullet lists */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50/50 p-3 rounded-2xl border border-gray-50 text-[10px] md:text-xs text-gray-500 select-none">
              <div className="flex items-center gap-1.5">
                <FaTruck className="text-brand-purple text-sm shrink-0" />
                <span className="font-semibold">الدفع عند الاستلام كاش</span>
              </div>
              <div className="flex items-center gap-1.5 border-t sm:border-t-0 sm:border-r border-gray-100 pt-2 sm:pt-0 sm:pr-3">
                <FaUndo className="text-brand-purple text-sm shrink-0" />
                <span className="font-semibold">استرجاع آمن خلال ١٤ يوماً</span>
              </div>
              <div className="flex items-center gap-1.5 border-t sm:border-t-0 sm:border-r border-gray-100 pt-2 sm:pt-0 sm:pr-3">
                <FaShieldAlt className="text-brand-purple text-sm shrink-0" />
                <span className="font-semibold">معاينة كاملة قبل دفع الفاتورة</span>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* 4. Specs Table section */}
      {specsEntries.length > 0 && (
        <section className="mt-8 bg-white border border-gray-100 rounded-3xl p-4 sm:p-6 md:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
          <h3 className="text-base md:text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
            <span>المواصفات والخصائص الفنية الكاملة</span>
            <span className="w-1.5 h-4 bg-brand-purple rounded-full"></span>
          </h3>

          <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-xs">
            <table className="width-full w-full text-right border-collapse text-xs md:text-sm">
              <tbody>
                {specsEntries.map(([key, value], i) => (
                  <tr 
                    key={key}
                    className={i % 2 === 0 ? 'bg-[#FAFBFD]' : 'bg-white'}
                  >
                    <td className="w-1/3 p-3.5 md:p-4 font-extrabold text-gray-700 border-l border-b border-gray-100">{key}</td>
                    <td className="p-3.5 md:p-4 font-semibold text-gray-500 border-b border-gray-100">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 5. Reviews and Ratings Section */}
      <section className="mt-8 bg-white border border-gray-100 rounded-3xl p-4 sm:p-6 md:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        <h3 className="text-base md:text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
          <span>التقييمات والمراجعات من المشترين</span>
          <span className="w-1.5 h-4 bg-brand-purple rounded-full"></span>
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side: Existing Reviews */}
          <div className="lg:col-span-2 space-y-5">
            {product.reviews && product.reviews.length > 0 ? (
              product.reviews.map((review, index) => (
                <div key={index} className="border-b border-gray-100 pb-5 last:border-b-0 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="text-sm font-black text-gray-800">{review.name}</h5>
                    <div className="flex items-center gap-1 text-amber-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FaStar key={star} size={12} className={star <= review.rating ? 'text-amber-400' : 'text-gray-200'} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 font-semibold leading-relaxed">{review.comment}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 bg-gray-50/70 rounded-2xl border border-gray-100">
                <FiMessageSquare className="mx-auto text-3xl text-gray-300 mb-2" />
                <p className="text-sm font-bold text-gray-500">لا توجد تقييمات لهذا المنتج بعد.</p>
                <p className="text-xs text-gray-400 mt-1">كن أول من يضيف تقييماً!</p>
              </div>
            )}
          </div>

          {/* Right Side: Add Review Form */}
          <div className="lg:col-span-1 bg-gray-50/70 border border-gray-100 rounded-2xl p-5 h-fit">
            <h4 className="text-sm font-black text-gray-800 mb-3">أضف تقييمك للمنتج</h4>
            <form onSubmit={handleReviewSubmit} className="space-y-3 text-right">
              <div>
                <label htmlFor="reviewName" className="block text-xs font-bold text-gray-600 mb-1">اسمك الكريم</label>
                <input
                  id="reviewName"
                  type="text"
                  value={reviewName}
                  onChange={(e) => setReviewName(e.target.value)}
                  placeholder="مثال: أحمد علي"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-brand-purple focus:border-brand-purple"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">تقييمك (من 1 إلى 5 نجوم)</label>
                <div className="flex items-center justify-end gap-1 text-gray-300" dir="ltr">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <FaStar
                      key={star}
                      size={22}
                      onClick={() => setReviewRating(star)}
                      className={`cursor-pointer transition-colors ${star <= reviewRating ? 'text-amber-400' : 'hover:text-amber-300'
                        }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="reviewComment" className="block text-xs font-bold text-gray-600 mb-1">تعليقك وملاحظاتك</label>
                <textarea
                  id="reviewComment"
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="اكتب رأيك في المنتج بكل صراحة..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-brand-purple focus:border-brand-purple leading-relaxed"
                />
              </div>

              {reviewMessage.text && (
                <div className={`p-2.5 rounded-lg text-xs font-bold text-center border ${reviewMessage.type === 'success'
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-red-50 border-red-200 text-red-700'
                  }`}>
                  {reviewMessage.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmittingReview}
                className="w-full py-2.5 bg-brand-purple hover:bg-brand-purple-dark text-white font-extrabold text-sm rounded-lg shadow-md shadow-brand-purple/15 flex items-center justify-center gap-2 transition-all cursor-pointer transform active:scale-98 disabled:opacity-50"
              >
                {isSubmittingReview ? 'جاري الإرسال...' : 'إرسال التقييم'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Back button link */}
      <div className="mt-6 flex justify-start">
        <button
          onClick={() => onNavigate('products')}
          className="flex items-center gap-2 text-xs md:text-sm font-black text-brand-purple hover:underline cursor-pointer"
        >
          <FiArrowRight className="text-brand-purple" /> العودة لتصفح كل المعروضات
        </button>
      </div>

    </div>
  );
}
