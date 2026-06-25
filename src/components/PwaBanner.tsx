import React, { useState, useEffect } from 'react';
import { FiDownload, FiX, FiCheck, FiInfo, FiSmartphone, FiMonitor, FiShare, FiPlusSquare, FiAlertCircle } from 'react-icons/fi';

export default function PwaBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const [appUrl, setAppUrl] = useState('');
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'ios' | 'android'>('android');

  useEffect(() => {
    // Save current origin URL for QR code
    setAppUrl(window.location.origin);

    // Detect device type
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setDeviceType('ios');
      setActiveTab('ios');
    } else if (/android/.test(ua)) {
      setDeviceType('android');
      setActiveTab('android');
    } else {
      setDeviceType('desktop');
      setActiveTab('android');
    }

    // Check if PWA is already installed or running in standalone mode
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone
    ) {
      setIsInstalled(true);
      setIsVisible(false); // Hide if already running as app
    }

    // Capture standard install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Track successful install
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
      console.log('App was successfully installed!');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to install prompt: ${outcome}`);
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsVisible(false);
        setShowGuideModal(false);
      }
      setDeferredPrompt(null);
    } else {
      // If native prompt is not available, open the guide modal
      setShowGuideModal(true);
    }
  };

  if (!isVisible || isInstalled) return null;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(appUrl || 'https://elshorbagy-store.com')}`;

  return (
    <>
      {/* 1. Main Horizontal Top Banner */}
      <div id="pwa-install-banner" className="w-full bg-linear-to-r from-brand-purple-dark via-brand-purple to-indigo-900 text-white shadow-lg border-b border-white/10 relative overflow-hidden select-none">
        {/* Decorative background grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-5 relative z-10">
          
          {/* Right Section: App Promotion Details */}
          <div className="flex items-center gap-3.5 text-right w-full md:w-auto">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-2xl flex items-center justify-center shadow-md border border-white/20 shrink-0">
              <img 
                src="/icon.jpg" 
                alt="الشوربجي" 
                className="w-10 h-10 md:w-11 md:h-11 rounded-xl object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm md:text-base font-black tracking-tight flex items-center gap-1.5">
                <span>تطبيق الشوربجي ستور للمنظفات 📲</span>
                <span className="text-[10px] bg-brand-green text-black font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">النسخة الرسمية</span>
              </span>
              <span className="text-xs md:text-sm text-gray-200 font-medium mt-1 leading-relaxed">
                تصفح سريع، طلبات بضغطة زر، ويعمل بالكامل كبرنامج على شاشتك الرئيسية!
              </span>
            </div>
          </div>

          {/* Middle Section: Big Download Button & Desktop QR */}
          <div className="flex flex-wrap items-center gap-3.5 w-full md:w-auto justify-start md:justify-end">
            
            {/* The absolute requested main click button */}
            <button
              onClick={handleInstallClick}
              className="px-6 py-3 bg-brand-green hover:bg-brand-green-dark text-black font-black text-xs md:text-sm rounded-2xl shadow-lg transition-all duration-300 hover:scale-[1.03] active:scale-95 flex items-center gap-2 cursor-pointer border-2 border-white/20 animate-pulse-subtle"
            >
              <FiDownload className="w-4 h-4 animate-bounce" />
              <span>تنزيل وتثبيت التطبيق على الهاتف اضغط هنا 📥</span>
            </button>

            {/* Desktop QR Trigger for easy mobile download */}
            {deviceType === 'desktop' && (
              <button 
                onClick={() => setShowGuideModal(true)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/15 backdrop-blur-md p-2 rounded-2xl border border-white/10 text-right cursor-pointer transition-all"
              >
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-brand-green">فتح رمز QR للهاتف 📱</span>
                </div>
                <div className="w-8 h-8 bg-white p-0.5 rounded-lg shrink-0">
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code" 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </button>
            )}

          </div>

          {/* Close Banner Button */}
          <button
            onClick={() => setIsVisible(false)}
            className="absolute left-3 top-3 md:relative md:left-0 md:top-0 p-1.5 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-all cursor-pointer"
            title="إغلاق الإشعار"
          >
            <FiX className="w-4 h-4" />
          </button>

        </div>
      </div>

      {/* 2. Interactive App Download / Installation Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
          <div className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 text-gray-800 animate-slide-up text-right">
            
            {/* Modal Header */}
            <div className="bg-linear-to-r from-brand-purple to-indigo-900 text-white px-6 py-5 relative">
              <button
                onClick={() => setShowGuideModal(false)}
                className="absolute left-4 top-4 p-1.5 rounded-full bg-black/20 hover:bg-black/30 text-white transition-all cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md">
                  <img src="/icon.jpg" alt="الشوربجي" className="w-10 h-10 rounded-lg object-cover" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-black">تحميل تطبيق الشوربجي ستور</h3>
                  <p className="text-xs text-brand-green font-bold">بضع خطوات بسيطة لتنزيله كبرنامج على شاشتك!</p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              
              {/* Device Tabs Selector */}
              <div className="flex gap-2 p-1.5 bg-gray-100 rounded-2xl mb-6">
                <button
                  onClick={() => setActiveTab('android')}
                  className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'android'
                      ? 'bg-white text-brand-purple shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span>أجهزة أندرويد 🤖 (سامسونج، شاومي، إلخ)</span>
                </button>
                <button
                  onClick={() => setActiveTab('ios')}
                  className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'ios'
                      ? 'bg-white text-brand-purple shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span>أجهزة آيفون 🍏 (iOS)</span>
                </button>
              </div>

              {/* Native Prompt Option (If supported & active) */}
              {deferredPrompt && (
                <div className="mb-5 p-4 bg-brand-green/10 border border-brand-green/30 rounded-2xl flex flex-col items-center gap-3 text-center">
                  <p className="text-xs font-black text-green-800">
                    جهازك يدعم التثبيت المباشر الفوري بضغطة زر واحدة!
                  </p>
                  <button
                    onClick={handleInstallClick}
                    className="w-full py-3 bg-brand-green hover:bg-brand-green-dark text-black font-black text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <FiDownload className="w-4 h-4 animate-bounce" />
                    <span>تثبيت فوري ومباشر على الموبايل</span>
                  </button>
                </div>
              )}

              {/* Tab 1: Android Instructions */}
              {activeTab === 'android' && (
                <div className="space-y-4">
                  <div className="flex gap-3 items-start">
                    <div className="w-7 h-7 rounded-full bg-brand-purple/10 text-brand-purple flex items-center justify-center font-black text-xs shrink-0">١</div>
                    <div>
                      <p className="text-xs md:text-sm font-black text-gray-800">اضغط على زر القائمة في المتصفح</p>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        اضغط على النقاط الثلاث <span className="font-sans font-extrabold text-brand-purple">︙</span> في أعلى أو أسفل متصفح كروم أو سامسونج.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start">
                    <div className="w-7 h-7 rounded-full bg-brand-purple/10 text-brand-purple flex items-center justify-center font-black text-xs shrink-0">٢</div>
                    <div>
                      <p className="text-xs md:text-sm font-black text-gray-800">اختر "تثبيت التطبيق" أو "إضافة للشاشة"</p>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        ابحث عن خيار <span className="font-extrabold text-brand-purple">"تثبيت التطبيق 📲"</span> أو <span className="font-extrabold text-brand-purple">"إضافة إلى الشاشة الرئيسية ➕"</span> واضغط عليه.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start">
                    <div className="w-7 h-7 rounded-full bg-brand-purple/10 text-brand-purple flex items-center justify-center font-black text-xs shrink-0">٣</div>
                    <div>
                      <p className="text-xs md:text-sm font-black text-gray-800">تأكيد التنزيل</p>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        اضغط على <span className="font-extrabold text-brand-purple">"تثبيت"</span> أو <span className="font-extrabold text-brand-purple">"إضافة"</span> في النافذة المنبثقة، وسيتم فوراً إنشاء أيقونة للتطبيق على هاتفك بجانب تطبيقاتك الأخرى!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: iOS iPhone Instructions */}
              {activeTab === 'ios' && (
                <div className="space-y-4">
                  <div className="flex gap-3 items-start">
                    <div className="w-7 h-7 rounded-full bg-brand-purple/10 text-brand-purple flex items-center justify-center font-black text-xs shrink-0">١</div>
                    <div>
                      <p className="text-xs md:text-sm font-black text-gray-800">افتح الموقع في متصفح Safari</p>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        تأكد أنك تتصفح من خلال متصفح سفاري (Safari) الرسمي للآيفون.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start">
                    <div className="w-7 h-7 rounded-full bg-brand-purple/10 text-brand-purple flex items-center justify-center font-black text-xs shrink-0">٢</div>
                    <div>
                      <p className="text-xs md:text-sm font-black text-gray-800">اضغط على زر المشاركة</p>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed flex items-center gap-1 flex-wrap">
                        اضغط على أيقونة المشاركة <span>المربعة وبها سهم للأعلى</span> <span className="text-lg text-brand-purple inline-block">📤</span> في شريط سفاري السفلي.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start">
                    <div className="w-7 h-7 rounded-full bg-brand-purple/10 text-brand-purple flex items-center justify-center font-black text-xs shrink-0">٣</div>
                    <div>
                      <p className="text-xs md:text-sm font-black text-gray-800">اختر "إضافة إلى الشاشة الرئيسية"</p>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        اسحب القائمة لأعلى واضغط على خيار <span className="font-extrabold text-brand-purple">"إضافة للشاشة الرئيسية ➕"</span> (Add to Home Screen) ثم اضغط <span className="font-extrabold text-brand-purple">"إضافة"</span> في الأعلى.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Optional: Desktop / QR Info section */}
              {deviceType === 'desktop' && (
                <div className="mt-6 pt-5 border-t border-gray-100 flex items-center gap-4 bg-gray-50 p-3 rounded-2xl">
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code" 
                    className="w-20 h-20 bg-white p-1 rounded-xl shadow-xs border border-gray-100 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="text-right">
                    <p className="text-xs font-black text-gray-800">تصفح من الكمبيوتر؟</p>
                    <p className="text-[11px] text-gray-500 leading-relaxed mt-1">
                      وجه كاميرا هاتفك المحمول نحو هذا الرمز (QR Code) وسيتم توجيهك فوراً لرابط التثبيت على الموبايل كبرنامج منفصل!
                    </p>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-100">
              <span className="text-[10px] text-gray-400 font-extrabold flex items-center gap-1">
                <FiInfo className="text-brand-purple" />
                <span>الشوربجي ستور مكفول ومؤمن بالكامل</span>
              </span>
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-5 py-2 bg-brand-purple hover:bg-brand-purple-dark text-white font-extrabold text-xs rounded-xl cursor-pointer transition-all"
              >
                حسناً، فهمت
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
