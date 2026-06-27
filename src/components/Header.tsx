import React, { useState, useEffect } from 'react';
import { FaSearch } from 'react-icons/fa';
import { FiMenu, FiShoppingBag } from 'react-icons/fi';
import { CartItem } from '../types';

interface HeaderProps {
  currentView: string;
  cart: CartItem[];
  cartCount: number;
  onNavigate: (view: string, params?: any) => void;
  onSearch: (query: string) => void;
  onOpenSidebar: () => void;
  userRole: 'user' | 'owner';
  onSwitchToUser: () => void;
  onSwitchToOwner: () => void;
}

export default function Header({
  currentView,
  cart,
  cartCount,
  onNavigate,
  onSearch,
  onOpenSidebar,
  userRole,
  onSwitchToUser,
  onSwitchToOwner,
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery);
      onNavigate('products', { search: searchQuery });
    }
  };

  const handleLogoClick = () => {
    setSearchQuery('');
    onNavigate('home');
  };

  // Glassmorphic transparency at the top of HomeView, solid white otherwise
  const isTransparent = currentView === 'home' && !scrolled;

  const headerClass = isTransparent
    ? 'fixed top-0 left-0 right-0 z-50 bg-white/40 backdrop-blur-md border-b border-white/20 transition-all duration-300'
    : 'fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-150 shadow-xs transition-all duration-300';

  return (
    <header className={headerClass}>
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        
        {/* Desktop Layout (Hidden on Mobile) */}
        <div className="hidden md:flex items-center justify-between h-20 gap-6">
          
          {/* Logo & Brand */}
          <div 
            onClick={handleLogoClick}
            className="flex items-center gap-2.5 cursor-pointer shrink-0 select-none"
          >
            <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl overflow-hidden border-2 border-brand-purple shadow-sm transition-all duration-300 hover:scale-105 shrink-0">
              <img src="/icon.svg" alt="الشوربجي للمنظفات" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="flex flex-col text-right">
              <span className="text-xl md:text-2xl font-black text-brand-purple tracking-tight leading-none animate-pulse-subtle">
                الشوربجي
              </span>
              <span className="text-[10px] md:text-[12px] text-brand-purple-dark font-extrabold tracking-wide mt-1.5 font-sans">
                للمنظفات والورقيات
              </span>
            </div>
          </div>

          {/* Navigation Shortcuts */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigate('home')}
              className={`px-4 py-2 text-xs font-black rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1 ${
                currentView !== 'admin'
                  ? 'bg-brand-purple text-white shadow-xs'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>المتجر 🛒</span>
            </button>

            {userRole === 'owner' && (
              <>
                <button
                  onClick={() => onNavigate('admin')}
                  className={`px-4 py-2 text-xs font-black rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1 ${
                    currentView === 'admin'
                      ? 'bg-brand-green text-black shadow-xs font-black'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-brand-purple'
                  }`}
                >
                  <span>لوحة التحكم 🔐</span>
                </button>
                <button
                  onClick={onSwitchToUser}
                  className="px-3 py-2 text-xs font-black rounded-xl bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 transition-all duration-200 cursor-pointer flex items-center gap-1"
                  title="تسجيل خروج المالك والعودة كعميل"
                >
                  <span>خروج المالك 🚪</span>
                </button>
              </>
            )}
          </div>

          {/* Search Form */}
          <form 
            onSubmit={handleSearchSubmit} 
            className="flex-1 max-w-2xl relative"
          >
            <div className="relative">
              <input
                type="text"
                placeholder="ابحث عن المنظفات والمساحيق والورقيات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pr-11 pl-4 rounded-full bg-gray-50/90 border border-gray-200 focus:outline-none focus:border-brand-purple focus:bg-white text-sm md:text-base font-semibold transition-all duration-200 shadow-inner"
              />
              <button
                type="submit"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1"
              >
                <FaSearch className="w-4 h-4 md:w-5 md:h-5 text-brand-purple" />
              </button>
            </div>
          </form>

          {/* Actions & Sidebar Trigger for Desktop */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('cart')}
              className="relative p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer group"
              aria-label="Shopping Cart"
            >
              <div className="relative">
                <FiShoppingBag className="w-6 h-6 text-gray-700 group-hover:text-brand-purple transition-colors" />
                {cartCount > 0 && (
                  <span className="absolute -top-2.5 -right-2 bg-brand-green text-white font-extrabold text-xs px-2 py-0.5 rounded-full border-2 border-white min-w-5 text-center shadow-xs">
                    {cartCount}
                  </span>
                )}
              </div>
            </button>

            {/* Sidebar toggle button for desktop */}
            <button
              onClick={onOpenSidebar}
              className="p-2.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer text-gray-700 hover:text-brand-purple"
              title="القائمة الجانبية"
            >
              <FiMenu className="w-6 h-6" />
            </button>
          </div>

        </div>

        {/* Customized Mobile Layout with search field slightly lower in middle */}
        <div className="md:hidden flex flex-col py-3 gap-2">
          {/* Top line: Actions to the left, Logo to the right */}
          <div className="flex items-center justify-between w-full h-11">
            
            {/* Actions on Left */}
            <div className="flex items-center gap-3">
              <button 
                onClick={onOpenSidebar}
                className="p-2 -mr-1 rounded-full text-gray-700 hover:bg-gray-100"
                aria-label="القائمة الجانبية"
              >
                <FiMenu className="w-6 h-6 text-brand-purple" />
              </button>
              
              <button
                onClick={() => onNavigate('cart')}
                className="relative p-2 rounded-full hover:bg-gray-100"
                aria-label="Shopping Cart"
              >
                <div className="relative">
                  <FiShoppingBag className="w-6 h-6 text-gray-700" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-brand-green text-white font-extrabold text-[10px] px-1.5 py-0.5 rounded-full border border-white min-w-4 text-center">
                      {cartCount}
                    </span>
                  )}
                </div>
              </button>
            </div>

            {/* Logo on Right */}
            <div 
              onClick={handleLogoClick}
              className="flex items-center gap-2 cursor-pointer select-none"
            >
              <div className="flex flex-col text-right">
                <span className="text-base font-black text-brand-purple leading-none">
                  الشوربجي
                </span>
                <span className="text-[9px] text-brand-purple-dark font-extrabold mt-1">
                  للمنظفات والورقيات
                </span>
              </div>
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl overflow-hidden border border-brand-purple shadow-xs shrink-0">
                <img src="/icon.svg" alt="الشوربجي للمنظفات" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            </div>

          </div>

          {/* Mobile Navigation Shortcuts & Role Toggle */}
          <div className="flex flex-col gap-1.5 px-1 py-0.5">
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => onNavigate('home')}
                className={`flex-1 py-1.5 text-[11px] font-black rounded-lg text-center transition-all duration-200 cursor-pointer flex items-center justify-center gap-1 border ${
                  currentView !== 'admin'
                    ? 'bg-brand-purple text-white border-brand-purple'
                    : 'bg-white text-gray-600 border-gray-100'
                }`}
              >
                <span>المتجر 🛒</span>
              </button>
              
              {userRole === 'owner' && (
                <button
                  onClick={() => onNavigate('admin')}
                  className={`flex-1 py-1.5 text-[11px] font-black rounded-lg text-center transition-all duration-200 cursor-pointer flex items-center justify-center gap-1 border ${
                    currentView === 'admin'
                      ? 'bg-brand-green text-black border-brand-green'
                      : 'bg-white text-gray-600 border-gray-100 animate-pulse'
                  }`}
                >
                  <span>لوحة التحكم 🔐</span>
                </button>
              )}
            </div>

            {userRole === 'owner' && (
              <div className="flex items-center justify-between bg-red-50/50 border border-red-100 p-1 rounded-lg">
                <span className="text-[10px] font-black text-red-700 mr-2 select-none">حساب المالك 👑</span>
                <button
                  type="button"
                  onClick={onSwitchToUser}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black rounded-md transition-all cursor-pointer flex items-center gap-1"
                >
                  <span>تسجيل الخروج 🚪</span>
                </button>
              </div>
            )}
          </div>

          {/* Bottom line: Search bar Centered slightly lower */}
          <div className="w-full px-1">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="text"
                placeholder="ابحث عن المنظفات والمساحيق والورقيات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pr-10 pl-4 rounded-full bg-gray-50/90 border border-gray-200 focus:outline-none focus:border-brand-purple focus:bg-white text-xs font-semibold shadow-inner"
              />
              <button
                type="submit"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 p-1"
              >
                <FaSearch className="w-4 h-4 text-brand-purple" />
              </button>
            </form>
          </div>
        </div>

      </div>
    </header>
  );
}
