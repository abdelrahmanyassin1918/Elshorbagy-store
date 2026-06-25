import { Brand } from '../types';
import { BRANDS } from '../data';

interface BrandSliderProps {
  onSelectBrand: (brandName: string) => void;
}

export default function BrandSlider({ onSelectBrand }: BrandSliderProps) {
  return (
    <div className="w-full">
      {/* Brands Scrolling Container */}
      <div className="overflow-x-auto no-scrollbar py-2 px-1">
        <div className="flex gap-2.5 md:gap-4 pb-2">
          {BRANDS.map((brand) => {
            return (
              <div
                key={brand.id}
                onClick={() => onSelectBrand(brand.name)}
                className="flex-shrink-0 cursor-pointer select-none group focus:outline-none"
              >
                {/* Brand Card Frame resembling the reference Image 1 */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-white border border-gray-100 rounded-xl sm:rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-brand-purple/15 flex flex-col items-center justify-center p-2.5 transition-all duration-300">
                  
                  {/* Brand Brand logo-text placeholder container */}
                  <div className={`w-full h-8 sm:h-10 rounded-lg flex items-center justify-center font-black text-[9px] sm:text-xs md:text-sm px-1.5 shadow-xs overflow-hidden ${brand.bgClass} ${brand.textColor}`}>
                    <span className="truncate tracking-wide text-center">
                      {brand.name}
                    </span>
                  </div>
                  
                  {/* Brand label */}
                  <span className="text-[9px] sm:text-[11px] font-bold text-gray-500 mt-1 md:mt-2 group-hover:text-brand-purple transition-colors truncate max-w-full">
                    {brand.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
