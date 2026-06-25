import React from 'react';
import { Product } from '../types';
import { FaStar, FaShoppingCart } from 'react-icons/fa';
import { FiPlus } from 'react-icons/fi';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
  isSpecialOfferStyle?: boolean;
}

export default function ProductCard({
  product,
  onSelect,
  onAddToCart,
  isSpecialOfferStyle = false,
}: ProductCardProps) {
  const {
    title,
    price,
    discountPrice,
    discountPercentage,
    image,
    brand,
    rating,
    reviewsCount,
  } = product;

  // Format currency with Egyptian Pound "ج.م"
  const formatPrice = (amount: number) => {
    return `${amount.toLocaleString('ar-EG')} ج.م`;
  };

  return (
    <div
      onClick={() => onSelect(product)}
      className={`group relative flex flex-col bg-white rounded-2xl border ${
        isSpecialOfferStyle 
          ? 'border-transparent shadow-xs hover:shadow-md' 
          : 'border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-brand-purple/20 hover:shadow-md'
      } p-3 md:p-4 transition-all duration-300 cursor-pointer select-none h-full`}
    >
      {/* Brand & Sale Tag */}
      <div className="flex justify-between items-center gap-1.5 mb-2.5">
        <span className="text-[10px] md:text-xs font-black tracking-wider uppercase text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
          {brand}
        </span>
        
        {discountPercentage && (
          <span className="text-[10px] md:text-xs font-extrabold text-brand-green-dark bg-brand-green-light px-2 py-0.5 rounded-full border border-brand-green/20">
            -{discountPercentage}%
          </span>
        )}
      </div>

      {/* Image Container */}
      <div className="relative w-full aspect-square bg-gray-50/50 rounded-xl overflow-hidden mb-3 p-1 flex items-center justify-center">
        <img
          src={image}
          alt={title}
          referrerPolicy="no-referrer"
          className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            // Fallback image if unsplash link has issues
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400';
          }}
        />
      </div>

      {/* Title */}
      <h3 className="text-xs md:text-sm font-bold text-gray-800 line-clamp-2 leading-relaxed min-h-[2.5rem] mb-2 flex-grow">
        {title}
      </h3>

      {/* Ratings */}
      <div className="flex items-center gap-1 mb-3">
        <span className="text-amber-400 shrink-0 flex items-center justify-center"><FaStar size={12} /></span>
        <span className="text-[10px] md:text-xs font-bold text-gray-600">
          {rating.toFixed(1)}
        </span>
        <span className="text-[9px] md:text-[10px] text-gray-400">
          ({reviewsCount})
        </span>
      </div>

      {/* Pricing and Cart button */}
      <div className="flex items-end justify-between gap-1.5 pt-2 border-t border-gray-50 mt-auto">
        <div className="flex flex-col">
          {discountPrice ? (
            <>
              {/* Original Price crossed out */}
              <span className="text-[10px] md:text-xs text-gray-400 line-through font-semibold leading-none">
                {formatPrice(price)}
              </span>
              {/* Promo Price */}
              <span className="text-sm md:text-[17px] font-black text-gray-900 mt-1 leading-none">
                {formatPrice(discountPrice)}
              </span>
            </>
          ) : (
            <span className="text-sm md:text-[17px] font-black text-gray-900 leading-none">
              {formatPrice(price)}
            </span>
          )}
        </div>

        {/* Quick Add To Cart Button */}
        <button
          onClick={(e) => onAddToCart(product, e)}
          className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 bg-brand-purple hover:bg-brand-purple-dark text-white rounded-full transition-all duration-200 shadow-md shadow-brand-purple/10 cursor-pointer shrink-0 active:scale-90"
          title="أضف إلى السلة"
        >
          <span><FiPlus size={16} /></span>
        </button>
      </div>
    </div>
  );
}
