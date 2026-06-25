import { useState, useEffect } from 'react';
import { FaChevronRight, FaChevronLeft, FaPercent, FaGift, FaMobileAlt, FaHandHoldingHeart } from 'react-icons/fa';
import { motion, AnimatePresence } from 'motion/react';

interface BannerSliderProps {
  onBannerAction: (category: string) => void;
}

export default function BannerSlider({ onBannerAction }: BannerSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 'slide-1',
      title: 'مساحيق غسيل ومنظفات',
      subtitle: 'توفير لا ينتهي على منظفات ومساحيق برسيل، أريال، وداوني بخصومات حقيقية تصل إلى ٢٥٪ لبيتك الراقي.',
      buttonText: 'تسوق المساحيق الآن',
      category: 'powders_detergents',
      discountBadge: 'خصم ٢٥٪',
      bgColor: 'bg-gradient-to-br from-[#1b3511] via-[#2b4c1f] to-[#14260d]',
      textColor: 'text-white',
      accentColor: 'text-brand-green',
      image: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&q=80&w=800',
    },
    {
      id: 'slide-2',
      title: 'صابون ومطهرات منزلية',
      subtitle: 'احمِ عائلتك بأقوى مطهرات ديتول وصابون بريل ل غسيل الصحون بنظافة فائقة ولمعان لا ينتهي.',
      buttonText: 'تصفح الصابون والمطهرات',
      category: 'soap_liquid',
      discountBadge: 'تعقيم كامل',
      bgColor: 'bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-950',
      textColor: 'text-white',
      accentColor: 'text-[#ffd500]',
      image: 'https://images.unsplash.com/photo-1607006342411-9a336f168f19?auto=format&fit=crop&q=80&w=800',
    },
    {
      id: 'slide-3',
      title: 'ورقيات ومناديل اقتصادية',
      subtitle: 'مناديل فاين وزينة فائقة الامتصاص والنعومة بأميز العبوات العائلية المخفضة وتخفيضات مستمرة.',
      buttonText: 'تسوق المناديل والورقيات',
      category: 'paper_products',
      discountBadge: 'عبوات توفيرية',
      bgColor: 'bg-gradient-to-br from-[#142c16] via-[#204423] to-[#0e1d0f]',
      textColor: 'text-white',
      accentColor: 'text-amber-300',
      image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&q=80&w=800',
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="w-full relative overflow-hidden rounded-2xl md:rounded-3xl shadow-lg border border-gray-150">
      
      {/* Main Banner Slideshow Stage */}
      <div className="relative h-[240px] sm:h-[320px] md:h-[400px] w-full">
        <AnimatePresence mode="wait">
          {slides.map((slide, index) => {
            if (index !== currentSlide) return null;
            return (
              <motion.div
                key={slide.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4 }}
                className={`absolute inset-0 w-full h-full flex flex-row items-center justify-between ${slide.bgColor} p-6 sm:p-10 md:p-14 select-none`}
              >
                {/* Text Content Area */}
                <div className="flex-1 flex flex-col justify-center max-w-[60%] z-10">
                  
                  {/* Floating badge */}
                  <div className="inline-flex items-center gap-1.5 self-start bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white mb-3 md:mb-5 border border-white/20">
                    <FaPercent className="w-3 h-3 text-brand-green animate-bounce" />
                    <span>{slide.discountBadge}</span>
                  </div>

                  <h2 className="text-xl sm:text-3xl md:text-5xl font-extrabold text-white leading-tight mb-2 md:mb-4 tracking-tight">
                    {slide.title}
                  </h2>
                  <p className="text-xs sm:text-sm md:text-lg text-white/85 line-clamp-2 md:line-clamp-3 leading-relaxed mb-4 md:mb-8 font-medium">
                    {slide.subtitle}
                  </p>

                  <button
                    onClick={() => onBannerAction(slide.category)}
                    className="self-start px-5 py-2.5 sm:px-7 sm:py-3.5 bg-brand-green hover:bg-[#00c761] text-black font-extrabold text-xs sm:text-sm md:text-base rounded-full shadow-md shadow-brand-green/20 transition-all duration-300 transform active:scale-95 cursor-pointer flex items-center gap-2"
                  >
                    {slide.buttonText}
                  </button>
                </div>

                {/* Styled Image Graphic Area */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-[35%] aspect-square hidden sm:flex items-center justify-center p-3 z-10">
                  <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10">
                    <img
                      src={slide.image}
                      alt={slide.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                  </div>
                </div>

              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Arrow Navigation */}
        <button
          onClick={handlePrev}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white p-2.5 sm:p-3.5 rounded-full backdrop-blur-xs transition-colors z-20 cursor-pointer"
          aria-label="Previous Slide"
        >
          <FaChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
        <button
          onClick={handleNext}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white p-2.5 sm:p-3.5 rounded-full backdrop-blur-xs transition-colors z-20 cursor-pointer"
          aria-label="Next Slide"
        >
          <FaChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>

        {/* Bullet Indicator dots */}
        <div className="absolute bottom-4 right-1/2 translate-x-1/2 flex gap-1.5 z-20">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                index === currentSlide ? 'bg-brand-green w-5' : 'bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
