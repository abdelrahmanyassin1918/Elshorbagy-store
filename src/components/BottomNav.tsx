import React from 'react';
import { FaHome, FaTv } from 'react-icons/fa';
import { FiHome, FiShoppingBag, FiLayers } from 'react-icons/fi';
import { CartItem } from '../types';

interface BottomNavProps {
  currentView: string;
  cartCount: number;
  onNavigate: (view: string, params?: any) => void;
}

export default function BottomNav({ currentView, cartCount, onNavigate }: BottomNavProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-150 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] px-4 py-2">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        
        {/* Categories Icon */}
        <button
          onClick={() => onNavigate('products')}
          className={`flex flex-col items-center gap-0.5 justify-center py-1 flex-1 transition-all duration-200 cursor-pointer ${
            currentView === 'products' ? 'text-brand-purple scale-105' : 'text-gray-400 hover:text-gray-500'
          }`}
        >
          <FiLayers className="w-5.5 h-5.5" />
          <span className="text-[10px] font-black">الأقسام</span>
        </button>

        {/* Offers Icon */}
        <button
          onClick={() => onNavigate('products', { isSpecialOffer: true })}
          className={`flex flex-col items-center gap-0.5 justify-center py-1 flex-1 transition-all duration-200 cursor-pointer ${
            currentView === 'products' ? 'text-brand-purple' : 'text-gray-400 hover:text-gray-500'
          }`}
        >
          <div className="relative">
            <FaTv className="w-5.5 h-5.5 text-brand-green" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-purple opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-purple"></span>
            </span>
          </div>
          <span className="text-[10px] font-black">العروض المميزة</span>
        </button>

        {/* Cart Icon in the Center */}
        <button
          onClick={() => onNavigate('cart')}
          className={`relative flex flex-col items-center gap-0.5 justify-center py-1 flex-1 transition-all duration-200 cursor-pointer ${
            currentView === 'cart' ? 'text-brand-purple font-black' : 'text-gray-400 hover:text-gray-500'
          }`}
        >
          <div className="relative">
            <FiShoppingBag className="w-5.5 h-5.5" />
            {cartCount > 0 && (
              <span className="absolute -top-2.5 -right-2 bg-brand-purple text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-full border border-white min-w-4 text-center">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-black">السلة</span>
        </button>

        {/* Home Icon */}
        <button
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center gap-0.5 justify-center py-1 flex-1 transition-all duration-200 cursor-pointer ${
            currentView === 'home' ? 'text-brand-purple font-black scale-105' : 'text-gray-400 hover:text-gray-500'
          }`}
        >
          <FiHome className="w-5.5 h-5.5 focus:outline-none" />
          <span className="text-[10px] font-black">الرئيسية</span>
        </button>

        {/* Shorbagy Logo Icon */}
        <button
          onClick={() => onNavigate('home')}
          className="flex flex-col items-center justify-center py-1 flex-1 transition-transform active:scale-90 cursor-pointer"
        >
          <div className="relative flex items-center justify-center w-8 h-8 bg-brand-purple text-white rounded-lg font-black text-base shadow-sm">
            🧼
            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-brand-green border border-white animate-pulse"></span>
          </div>
          <span className="text-[9px] font-black text-brand-purple mt-0.5">الشوربجي</span>
        </button>

      </div>
    </div>
  );
}
