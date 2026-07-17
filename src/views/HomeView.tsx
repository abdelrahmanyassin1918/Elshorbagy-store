import React from 'react';
import { Product, Category } from '../types';
import { FiArrowLeft, FiTag, FiShoppingBag, FiStar } from 'react-icons/fi';

interface HomeViewProps {
  products?: Product[];
  banner?: {
    badge: string;
    title: string;
    subtitle: string;
    image: string;
  }
  categories?: Category[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
  onNavigate: (view: string, params?: any) => void;
}

// Map each brand ID to a clean, representative detergent product image (giving cartoonish/clean look)
const BRAND_IMAGES: Record<string, string> = {
  persil: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&q=80&w=400',
  ariel: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&q=80&w=400',
  pril: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400',
  fairy: 'https://images.unsplash.com/photo-1545130853-a51307774421?auto=format&fit=crop&q=80&w=400',
  fine: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&q=80&w=400',
  zeina: 'https://images.unsplash.com/photo-1614806687483-36fa12beff34?auto=format&fit=crop&q=80&w=400',
  dettol: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400',
  lux: 'https://images.unsplash.com/photo-1608248597481-496100c80836?auto=format&fit=crop&q=80&w=400',
  downy: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400',
  clorox: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&q=80&w=400',
};

export default function HomeView({
  products,
  banner,
  categories,
  onSelectProduct,
  onAddToCart,
  onNavigate,
}: HomeViewProps) {
  
  const activeProducts = products || [];

  const dynamicBrands = React.useMemo(() => {
    const list: Array<{ id: string; name: string; bgClass: string; textColor: string }> = [];
    activeProducts.forEach((p) => {
      if (!p.brand) return;
      const normalizedKey = p.brand.toLowerCase().replace(/\s+/g, '-');
      const exists = list.some((b) => b.id === normalizedKey);
      if (!exists) {
        list.push({
          id: normalizedKey,
          name: p.brand,
          bgClass: 'bg-brand-purple-light border border-brand-purple/20',
          textColor: 'text-brand-purple-dark',
        });
      }
    });
    return list;
  }, [activeProducts]);

  // Select top 4 highest discount products to showcase in the "Clipped Offers" section
  const offerProducts = activeProducts.filter(p => p.discountPercentage && p.discountPercentage >= 15).slice(0, 4);

  // Set default values for customizable features
  const currentBadge = banner?.badge || '🧼 النظافة والبريق في جيبك • أسعار جملة الجملة';
  const currentTitle = banner?.title || 'الشوربجي للمنظفات والورقيات في مصر';
  const currentSubtitle = banner?.subtitle || 'نوفر لكم أكبر تشكيلة من مساحيق الغسيل، مطهرات ديتول، صابون المواعين، والورقيات والمناديل المعقمة بأقصى توفير وأسرع خدمة شحن لباب بيتك!';
  const currentImage = banner?.image || 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&q=80&w=1200';

  return (
    <div className="space-y-8 md:space-y-12 pb-24 md:pb-12 bg-white">
      
      {/* 1. Giant Lifestyle Cartoon/Flat Style Fresh Welcoming Hero Banner */}
      <section className="relative w-full min-h-[380px] md:min-h-[440px] bg-white overflow-hidden select-none -mx-4 md:-mx-6 px-4 md:px-12 flex items-center border-b border-brand-purple/10">
        
        {/* Either show custom uploaded banner photo or standard vector cartoon basket */}
        <div className="absolute inset-y-0 left-0 md:left-12 z-0 flex items-center justify-center md:justify-end opacity-20 md:opacity-95 pointer-events-none w-full md:w-[45%]">
          {banner?.image ? (
            <img 
              src={currentImage} 
              alt="المعروضات" 
              className="w-full h-full max-h-[360px] object-cover rounded-2xl shadow-md border-2 border-brand-purple/10"
              referrerPolicy="no-referrer"
            />
          ) : (
            <svg className="w-64 h-64 md:w-80 md:h-80 drop-shadow-xl" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Background glowing aura */}
              <circle cx="100" cy="115" r="75" fill="url(#hero-glow)" opacity="0.6" />
              
              {/* Background detergent bottles sticking out of the basket */}
              <path d="M60 50h16v60H60V50z" fill="#00b4d8" />
              <path d="M68 35h8v15h-8V35z" fill="#0077b6" />
              <path d="M62 38h20v6l-20 6v-12z" fill="#0096c7" />
              
              <rect x="85" y="45" width="45" height="70" rx="6" fill="#e2fafd" stroke="#028090" strokeWidth="4" />
              <rect x="98" y="33" width="18" height="12" rx="2" fill="#028090" />
              <rect x="91" y="60" width="33" height="30" rx="3" fill="#06d6a0" />
              <circle cx="107" cy="75" r="6" fill="#ffffff" />
              <circle cx="112" cy="70" r="2.5" fill="#ffffff" />
              
              <path d="M130 60c10 0 15 5 15 15s-5 15-15 15" stroke="#028090" strokeWidth="4.5" strokeLinecap="round" />

              <circle cx="50" cy="120" r="12" fill="#90e0ef" opacity="0.4" />
              <circle cx="150" cy="110" r="16" fill="#90e0ef" opacity="0.4" />
              <circle cx="65" cy="150" r="8" fill="#e2fafd" opacity="0.7" />
              <circle cx="140" cy="145" r="10" fill="#e2fafd" opacity="0.5" />
              <circle cx="115" cy="30" r="5" fill="#90e0ef" />
              <circle cx="132" cy="22" r="3" fill="#90e0ef" />
              <circle cx="85" cy="20" r="7" fill="#90e0ef" opacity="0.7" />
              
              <path d="M40 35l2 4l4 2l-4 2l-2 4l-2-4l-4-2l4-2z" fill="#ffb703" />
              <path d="M165 45l1.5 3l3 1.5l-3 1.5l-1.5 3l-1.5-3l-3-1.5l3-1.5z" fill="#06d6a0" />

              <path d="M30 90h140l-12 75a10 10 0 0 1-10 9H52a10 10 0 0 1-10-9L30 90z" fill="#ffffff" stroke="#028090" strokeWidth="5" strokeLinejoin="round" />
              <path d="M50 90c0-30 20-50 50-50s50 20 50 50" stroke="#028090" strokeWidth="5.5" fill="none" strokeLinecap="round" />
              
              <path d="M65 90v74M100 90v74M135 90v74" stroke="#028090" strokeWidth="4" strokeLinecap="round" opacity="0.3" />
              <path d="M34 118h132M38 145h124" stroke="#028090" strokeWidth="4" strokeLinecap="round" opacity="0.3" />

              <defs>
                <radialGradient id="hero-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#028090" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </radialGradient>
              </defs>
            </svg>
          )}
        </div>
        
        {/* Banner Text Overlay */}
        <div className="relative z-10 max-w-2xl w-full text-right py-12 pr-1 md:pr-4">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 mb-4 rounded-full bg-brand-purple/10 text-brand-purple-dark font-black text-xs md:text-sm border border-brand-purple/20">
            {currentBadge}
          </span>
          
          <h1 className="text-3xl md:text-5xl font-black text-brand-purple-dark leading-tight mb-4 drop-shadow-xs" style={{ whiteSpace: 'pre-line' }}>
            {currentTitle}
          </h1>
          
          <p className="text-xs md:text-base text-brand-purple-dark font-bold max-w-lg mb-4 leading-relaxed">
            {currentSubtitle}
          </p>
        </div>
      </section>

      {/* 2. Primary Categories section (Now reordered to be BEFORE brands!) */}
      <section className="max-w-7xl mx-auto px-4 md:px-0 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-6 rounded-full bg-brand-purple"></div>
            <h2 className="text-lg md:text-2xl font-black text-brand-purple-dark tracking-tight">
              تصفح بالأقسام الرئيسية للمحل
            </h2>
          </div>
          <button 
            onClick={() => onNavigate('products')}
            className="self-start sm:self-auto text-xs md:text-sm font-black text-brand-purple bg-brand-purple-light hover:bg-brand-purple hover:text-white px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-1 cursor-pointer"
          >
            جميع الأقسام <FiArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 md:gap-5">
          {(categories || []).map((category) => (
            <div
              key={category.id}
              onClick={() => onNavigate('products', { category: category.id })}
              className="group relative bg-[#ffffff] border-2 border-brand-purple/10 rounded-2xl p-4.5 hover:border-brand-purple/40 hover:shadow-lg hover:scale-103 transition-all duration-300 cursor-pointer text-center select-none overflow-hidden"
            >
              {/* Decorative cartoon top circle */}
              <div className="absolute -top-6 -right-6 w-16 h-16 bg-brand-purple-light rounded-full opacity-70 group-hover:scale-125 transition-transform duration-300"></div>
              
              <div className="w-16 h-16 md:w-20 md:h-20 mb-3.5 relative z-10 filter drop-shadow-sm group-hover:scale-110 transition-transform duration-300 mx-auto bg-white rounded-2xl p-1 border border-brand-purple/10 flex items-center justify-center">
                <img
                  src={category.image || 'https://res.cloudinary.com/dglhc1pfj/image/upload/v1718817951/tag-placeholder_u5gy9y.png'}
                  alt={category.name}
                  className="w-full h-full object-contain rounded-xl"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://res.cloudinary.com/dglhc1pfj/image/upload/v1718817951/tag-placeholder_u5gy9y.png';
                  }}
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <h3 className="text-xs md:text-sm font-black text-brand-purple-dark group-hover:text-brand-purple transition-colors relative z-10 leading-snug">
                {category.name}
              </h3>
              
              <div className="mt-2 text-[10px] text-brand-purple font-extrabold group-hover:underline relative z-10">
                عرض المنتجات ⟵
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Brands Strip (Now styled as solid, large 4-column static grid list) */}
      <section className="max-w-7xl mx-auto px-4 md:px-0 bg-white rounded-3xl p-5 md:p-7 border-2 border-brand-purple/10 shadow-[0_4px_16px_rgba(2,128,144,0.03)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-6 rounded-full bg-brand-purple"></div>
            <div className="flex flex-col">
              <span className="text-lg md:text-2xl font-black text-brand-purple-dark">العلامات التجارية المتميزة</span>
              <span className="text-[10px] md:text-xs font-bold text-gray-400 mt-0.5">تسوق منتجاتك المفضلة مباشرة من المصنع الأصلي</span>
            </div>
          </div>
          <button 
            onClick={() => onNavigate('products')}
            className="self-start sm:self-auto text-xs md:text-sm font-black text-brand-purple bg-brand-purple-light hover:bg-brand-purple hover:text-white px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-1 cursor-pointer"
          >
            عرض كافة الماركات <FiArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Major Brand Grid: 4 wide on desktop, wraps perfectly if more */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {dynamicBrands.map((brand) => {
            const representativeImage = BRAND_IMAGES[brand.id] || BRAND_IMAGES['persil'] || 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&q=80&w=400';
            return (
              <div
                key={brand.id}
                onClick={() => onNavigate('products', { brand: brand.name })}
                className="group cursor-pointer select-none bg-white border-2 border-brand-purple/10 hover:border-brand-purple rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:scale-102"
              >
                {/* Brand Name centered at the top */}
                <div className="text-center pb-2.5 mb-2.5 border-b border-brand-purple/10">
                  <span className="text-sm md:text-base font-black text-brand-purple-dark group-hover:text-brand-purple transition-all block">
                    {brand.name}
                  </span>
                </div>

                {/* Product Image 代表 (Underneath the name in cartoon style) */}
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-white border border-brand-purple/5 p-1 mb-2.5 flex items-center justify-center">
                  <img
                    src={representativeImage}
                    alt={brand.name}
                    className="w-full h-full object-contain rounded-lg group-hover:scale-108 transition-transform duration-500"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Bottom decorative badge */}
                <div className="text-center bg-brand-purple-light border border-brand-purple/15 py-1.5 rounded-xl font-bold text-[10px] text-brand-purple-dark group-hover:bg-brand-purple group-hover:text-white transition-colors duration-300">
                  تصفح المنتجات ⟵
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Special Offers Section (Now Renamed to "العروض" and structured as a solid grid instead of slides) */}
      <section id="special-offers-grid" className="max-w-7xl mx-auto px-4 md:px-0 space-y-6 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-6 rounded-full bg-brand-purple"></div>
            <h2 className="text-lg md:text-2xl font-black text-brand-purple-dark">العروض 🏷️</h2>
            <span className="text-[10px] md:text-xs font-black text-white bg-brand-green px-2.5 py-0.5 rounded-full select-none">
              أقوى التخفيضات الحصرية
            </span>
          </div>
          <button 
            onClick={() => onNavigate('products', { isSpecialOffer: true })}
            className="text-xs md:text-sm font-black text-brand-purple hover:underline"
          >
            تصفح كل الخصومات ⟵
          </button>
        </div>

        {/* Offers Grid: 4 items wide on desktop, extremely consistent with Brands card layout */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {offerProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => onSelectProduct(product)}
              className="group cursor-pointer bg-white border-2 border-brand-green/10 hover:border-brand-green rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:scale-102"
            >
              {/* Product Title centered at the top */}
              <div className="text-center pb-2.5 mb-2.5 border-b border-brand-green/10">
                <span className="text-xs md:text-sm font-black text-brand-purple-dark group-hover:text-brand-purple line-clamp-2 leading-tight transition-all block min-h-[32px]">
                  {product.title}
                </span>
              </div>

              {/* Product Image representing the item */}
              <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-white border border-brand-green/5 p-1 mb-2.5 flex items-center justify-center">
                {/* Discount Percentage Badge on top-right of image */}
                <div className="absolute top-1.5 right-1.5 bg-brand-green text-white font-black text-[9px] px-2 py-0.5 rounded-lg shadow-xs z-10">
                  خصم {product.discountPercentage}%
                </div>
                
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-contain rounded-lg group-hover:scale-108 transition-transform duration-500"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Price and Cart button centered at the bottom */}
              <div className="flex flex-col gap-1.5 mt-1 select-none">
                <div className="flex items-center justify-center gap-2 text-xs">
                  <span className="font-extrabold text-brand-purple-dark">{product.discountPrice} ج.م</span>
                  <span className="text-[10px] text-gray-400 line-through">{product.price} ج.م</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToCart(product, e);
                  }}
                  className="w-full text-center bg-brand-green-light border border-brand-green/20 py-1.5 rounded-xl font-bold text-[10px] text-brand-green-dark group-hover:bg-brand-green group-hover:text-white transition-colors duration-300 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <FiShoppingBag className="w-3.5 h-3.5" />
                  <span>أضف للسلة ⟵</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
