import React, { useState, useMemo, useEffect } from 'react';
import { Product } from '../types';
import { PRODUCTS, CATEGORIES, BRANDS } from '../data';
import ProductCard from '../components/ProductCard';
import { FaFilter, FaSearch, FaSortAmountDown } from 'react-icons/fa';
import { FiSliders, FiTrash2 } from 'react-icons/fi';

interface ProductsViewProps {
  products?: Product[];
  initialFilters?: {
    category?: string;
    brand?: string;
    search?: string;
    isSpecialOffer?: boolean;
  };
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
}

export default function ProductsView({
  products,
  initialFilters = {},
  onSelectProduct,
  onAddToCart,
}: ProductsViewProps) {
  const activeProducts = useMemo(() => products && products.length > 0 ? products : PRODUCTS, [products]);

  // Dynamically compute active categories and brands
  const dynamicCategories = useMemo(() => {
    const list = [...CATEGORIES];
    activeProducts.forEach((p) => {
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
  }, [activeProducts]);

  const dynamicBrands = useMemo(() => {
    const list = [...BRANDS];
    activeProducts.forEach((p) => {
      if (!p.brand) return;
      const exists = list.some(
        (b) => b.id.toLowerCase() === p.brand.toLowerCase() || b.name.toLowerCase() === p.brand.toLowerCase()
      );
      if (!exists) {
        list.push({
          id: p.brand.toLowerCase().replace(/\s+/g, '-'),
          name: p.brand,
          bgClass: 'bg-brand-purple-light border border-brand-purple/20',
          textColor: 'text-brand-purple-dark'
        });
      }
    });
    return list;
  }, [activeProducts]);

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState<string>(initialFilters.category || '');
  const [selectedBrand, setSelectedBrand] = useState<string>(initialFilters.brand || '');
  const [searchQuery, setSearchQuery] = useState<string>(initialFilters.search || '');
  const [isSpecialOffer, setIsSpecialOffer] = useState<boolean>(initialFilters.isSpecialOffer || false);
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [sortBy, setSortBy] = useState<string>('featured');
  
  // Custom expandable filters panel state
  const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(false);

  // Sync with prop updates (e.g. searching from Header context or category banner clicks)
  useEffect(() => {
    if (initialFilters.category !== undefined) setSelectedCategory(initialFilters.category);
    if (initialFilters.brand !== undefined) setSelectedBrand(initialFilters.brand);
    if (initialFilters.search !== undefined) setSearchQuery(initialFilters.search);
    if (initialFilters.isSpecialOffer !== undefined) setIsSpecialOffer(initialFilters.isSpecialOffer);
  }, [initialFilters]);

  // Handle clearing all filters
  const resetFilters = () => {
    setSelectedCategory('');
    setSelectedBrand('');
    setSearchQuery('');
    setIsSpecialOffer(false);
    setMaxPrice(1000);
    setSortBy('featured');
  };

  // Filtered and Sorted products computed cache
  const filteredProducts = useMemo(() => {
    let result = [...activeProducts];

    // Search query search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategory) {
      result = result.filter((p) => {
        const catObj = dynamicCategories.find(c => c.id === selectedCategory || c.name === selectedCategory);
        if (catObj) {
          return p.category.toLowerCase() === catObj.id.toLowerCase() || p.category.toLowerCase() === catObj.name.toLowerCase();
        }
        return p.category.toLowerCase() === selectedCategory.toLowerCase();
      });
    }

    // Brand filter
    if (selectedBrand) {
      result = result.filter((p) => {
        const brandObj = dynamicBrands.find(b => b.id === selectedBrand || b.name === selectedBrand);
        if (brandObj) {
          return p.brand.toLowerCase() === brandObj.id.toLowerCase() || p.brand.toLowerCase() === brandObj.name.toLowerCase();
        }
        return p.brand.toLowerCase() === selectedBrand.toLowerCase();
      });
    }

    // Special Offer tag filter
    if (isSpecialOffer) {
      result = result.filter((p) => p.isSpecialOffer);
    }

    // Max Price cap
    result = result.filter((p) => {
      const actualPrice = p.discountPrice || p.price;
      return actualPrice <= maxPrice;
    });

    // Sorting block
    if (sortBy === 'price-asc') {
      result.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
    } else if (sortBy === 'ratings') {
      result.sort((a, b) => b.rating - a.rating);
    } else {
      // 'featured'
      result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    return result;
  }, [selectedCategory, selectedBrand, searchQuery, isSpecialOffer, maxPrice, sortBy]);

  return (
    <div className="pb-20 md:pb-12 bg-white min-h-[600px]">
      
      {/* Title Header Row with Integrated Sorting and Filter Dropdown Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-brand-purple/10">
        <div>
          <h1 className="text-xl md:text-3xl font-black text-brand-purple-dark flex items-center gap-2">
            🛍️ كل المنتجات ومستلزمات الغسيل
          </h1>
          <p className="text-xs md:text-sm text-gray-500 font-extrabold mt-1">
            لقد وجدنا <span className="text-brand-purple font-black">{filteredProducts.length}</span> منتج مميز يناسب اختياراتك
          </p>
        </div>

        {/* Action Controls Side */}
        <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
          {/* Main Toggle Button that opens the filters panel directly above products */}
          <button
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xs md:text-sm transition-all duration-300 border cursor-pointer ${
              isFiltersOpen 
                ? 'bg-brand-purple text-white border-brand-purple shadow-sm' 
                : 'bg-white text-brand-purple border-brand-purple/20 hover:bg-brand-purple-light'
            }`}
          >
            <FiSliders className="w-4.5 h-4.5" /> 
            <span>تصفية وتحديد المنتجات</span>
            <span className="text-[10px] opacity-75">{isFiltersOpen ? '▲' : '▼'}</span>
          </button>
          
          {/* Sorting Dropdown Menu */}
          <div className="relative flex-1 md:w-56">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-gray-200 focus:outline-none focus:border-brand-purple rounded-xl font-bold text-xs md:text-sm text-gray-700 cursor-pointer shadow-xs appearance-none text-right pr-2 pl-8"
            >
              <option value="featured">الأكثر تميزاً 🔥</option>
              <option value="price-asc">السعر: من الأقل للأعلى 📈</option>
              <option value="price-desc">السعر: من الأعلى للأقل 📉</option>
              <option value="ratings">التقييم: الأعلى تقييماً ⭐</option>
            </select>
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <FaSortAmountDown className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* ======================================= */}
      {/* COLLAPSIBLE FILTER CONTROLS PANEL      */}
      {/* ======================================= */}
      {isFiltersOpen && (
        <div className="bg-brand-purple-light/40 border-2 border-brand-purple/10 rounded-2xl p-5 mb-8 animate-fadeIn duration-200 select-none">
          <div className="flex justify-between items-center pb-3 mb-5 border-b border-brand-purple/15">
            <span className="text-xs md:text-sm font-black text-brand-purple-dark flex items-center gap-1.5">
              ⚙️ خيارات التصفية السريعة والتحديد
            </span>
            <button
              onClick={resetFilters}
              className="text-xs font-black text-red-500 hover:text-red-700 hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <FiTrash2 /> مسح كافة الاختيارات
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            
            {/* Box 1: Text Search & Discount Tag Filter */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-brand-purple-dark block">البحث الإملائي</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="امسح بالاسم أو الماركة..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 pr-8 text-xs font-bold border border-brand-purple/15 bg-white rounded-xl focus:outline-none focus:border-brand-purple text-right"
                  />
                  <FaSearch className="w-3 h-3 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-brand-green-light rounded-xl border border-brand-green/10">
                <span className="text-xs font-black text-brand-green-dark">عروض الخصم فقط ✨</span>
                <input
                  type="checkbox"
                  checked={isSpecialOffer}
                  onChange={(e) => setIsSpecialOffer(e.target.checked)}
                  className="w-5 h-5 text-brand-green bg-white border-gray-300 rounded-md focus:ring-brand-green cursor-pointer accent-[#00df6d]"
                />
              </div>
            </div>

            {/* Box 2: Category filter buttons list */}
            <div className="space-y-2">
              <span className="text-xs font-black text-brand-purple-dark block">الأقسام الرئيسية للمنتجات</span>
              <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto no-scrollbar pr-1">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`text-right px-2.5 py-1.5 rounded-xl text-xs font-black border transition-colors ${
                    selectedCategory === '' 
                      ? 'bg-brand-purple text-white border-brand-purple' 
                      : 'bg-white border-brand-purple/10 text-gray-600 hover:bg-brand-purple-light'
                  }`}
                >
                  الكل 🛍️
                </button>
                {dynamicCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`text-right px-2.5 py-1.5 rounded-xl text-xs font-black border transition-colors truncate ${
                      selectedCategory === cat.id 
                        ? 'bg-brand-purple text-white border-brand-purple' 
                        : 'bg-white border-brand-purple/10 text-gray-600 hover:bg-brand-purple-light'
                    }`}
                  >
                    <span className="truncate flex items-center gap-1">
                      <span>{cat.icon}</span>
                      <span className="truncate">{cat.name}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Box 3: Brand filter selection list */}
            <div className="space-y-2">
              <span className="text-xs font-black text-brand-purple-dark block">العلامات التجارية المتاحة</span>
              <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto no-scrollbar pr-1">
                <button
                  onClick={() => setSelectedBrand('')}
                  className={`text-right px-2.5 py-1.5 rounded-xl text-xs font-black border transition-colors ${
                    selectedBrand === '' 
                      ? 'bg-brand-purple text-white border-brand-purple shadow-xs' 
                      : 'bg-white border-brand-purple/10 text-gray-600 hover:bg-brand-purple-light'
                  }`}
                >
                  كل البراندات
                </button>
                {dynamicBrands.map((brand) => (
                  <button
                    key={brand.id}
                    onClick={() => setSelectedBrand(brand.name)}
                    className={`text-right px-2.5 py-1.5 rounded-xl text-xs font-black border transition-colors truncate ${
                      selectedBrand.toLowerCase() === brand.name.toLowerCase()
                        ? 'bg-brand-purple text-white border-brand-purple shadow-xs' 
                        : 'bg-white border-brand-purple/10 text-gray-600 hover:bg-brand-purple-light'
                    }`}
                  >
                    <span>{brand.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Box 4: Maximum Price control range slider */}
            <div className="space-y-2">
              <span className="text-xs font-black text-brand-purple-dark block">نطاق السعر الأقصى</span>
              <div className="pt-2">
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="5"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-brand-purple cursor-pointer h-1.5 bg-gray-200 rounded-lg"
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-[10px] font-bold text-gray-400">٠ ج.م</span>
                  <span className="text-xs font-black text-brand-purple bg-brand-purple-light px-2.5 py-0.5 rounded-full">
                    {maxPrice} ج.م
                  </span>
                  <span className="text-[10px] font-bold text-gray-400">١,٠٠٠ ج.م</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* PRODUCTS RESULTS LIST GRID             */}
      {/* ======================================= */}
      <div className="w-full">
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 md:p-14 text-center border-2 border-brand-purple/10 flex flex-col items-center justify-center space-y-4">
            <span className="text-5xl md:text-6xl text-gray-300">🔍</span>
            <h2 className="text-lg md:text-xl font-black text-brand-purple-dark">عذراً، لم نجد أي تطابقات!</h2>
            <p className="text-xs md:text-sm text-gray-400 max-w-sm font-bold leading-relaxed">
              يرجى تجربة كلمات بحث أخرى أو تعديل فلاتر التصفية أعلاه ومسح المحداد لرؤية جميع منتجات المنظفات والورقيات المتاحة.
            </p>
            <button
              onClick={resetFilters}
              className="px-6 py-2.5 bg-brand-purple hover:bg-brand-purple-dark text-white font-extrabold text-xs md:text-sm rounded-xl cursor-pointer shadow-sm transition-transform active:scale-95"
            >
              إعادة ضبط كافة الفلاتر بالكامل
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {filteredProducts.map((p) => (
              <div key={p.id}>
                <ProductCard
                  product={p}
                  onSelect={onSelectProduct}
                  onAddToCart={onAddToCart}
                />
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
