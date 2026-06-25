import { Product, Brand, Category } from './types';

export const BRANDS: Brand[] = [
  { id: 'persil', name: 'برسيل', bgClass: 'bg-[#007a33]', textColor: 'text-white' },
  { id: 'ariel', name: 'أريال', bgClass: 'bg-[#002f6c]', textColor: 'text-white' },
  { id: 'pril', name: 'بريل', bgClass: 'bg-[#d31115]', textColor: 'text-white' },
  { id: 'fairy', name: 'فيري', bgClass: 'bg-[#007a48]', textColor: 'text-[#ffce00]' },
  { id: 'fine', name: 'فاين', bgClass: 'bg-[#003882]', textColor: 'text-white' },
  { id: 'zeina', name: 'زينة', bgClass: 'bg-[#0a4073]', textColor: 'text-white' },
  { id: 'dettol', name: 'ديتول', bgClass: 'bg-[#015121]', textColor: 'text-[#ffff00]' },
  { id: 'lux', name: 'لوكس', bgClass: 'bg-[#bf9b30]', textColor: 'text-white' },
  { id: 'downy', name: 'داوني', bgClass: 'bg-[#00a3e0]', textColor: 'text-white' },
  { id: 'clorox', name: 'كلوركس', bgClass: 'bg-[#0d2358]', textColor: 'text-white' },
];

export const CATEGORIES: Category[] = [
  { id: 'soap_liquid', name: 'صابون وصابون سائل', icon: '🧼', image: 'https://images.unsplash.com/photo-1607006342411-9a336f168f19?auto=format&fit=crop&q=80&w=400' },
  { id: 'powders_detergents', name: 'مساحيق غسيل ومنظفات', icon: '🧺', image: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&q=80&w=400' },
  { id: 'paper_products', name: 'ورقيات ومناديل', icon: '🧻', image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&q=80&w=400' },
  { id: 'cleaning_appliances', name: 'أدوات ومستلزمات نظافة', icon: '🧹', image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&q=80&w=400' },
  { id: 'shower_bath', name: 'سوائل استحمام وعناية', icon: '🧴', image: 'https://images.unsplash.com/photo-1608248597481-496100c80836?auto=format&fit=crop&q=80&w=400' },
];

export const PRODUCTS: Product[] = [
  {
    id: 'persil-gel-3l',
    title: 'برسيل جل للغسالات الأوتوماتيك بنسيم لافندر - 3 لتر + 1 لتر مجاناً',
    description: 'برسيل جل بقوة التكنولوجيا الألمانية بديل المسحوق التقليدي، ينظف الملابس البيضاء والملونة بعمق ويترك رائحة اللافندر المنعشة تدوم طويلاً، مع توفير كامل وحماية تامة للغسالة من الترسبات.',
    price: 380,
    discountPrice: 320,
    discountPercentage: 16,
    image: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&q=80&w=600',
    images: [
      'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600'
    ],
    category: 'powders_detergents',
    brand: 'برسيل',
    brandLogo: 'Persil',
    rating: 4.8,
    reviewsCount: 142,
    featured: true,
    isSpecialOffer: false,
    specs: {
      'الحجم': '3 لتر + 1 لتر إضافي',
      'النوع': 'منظف غسيل سائل (جل)',
      'نوع الغسالة': 'أوتوماتيك وفوق أوتوماتيك',
      'العطر': 'لافندر منعش',
      'المنشأ': 'صنع في مصر بأحدث المعايير الألمانية'
    }
  },
  {
    id: 'ariel-powder-6kg',
    title: 'أريال مسحوق غسيل بودرة للغسالات الأوتوماتيك - وزن 6 كيلو جرام',
    description: 'أريال المسحوق الأول عالمياً في إزالة البقع الصعبة من غسلة واحدة لملابس ناصعة البياض بفضل حبيبات التنظيف النشطة والتركيبة الفعالة ضد أصعب الدهون والأوساخ مع حماية الأنسجة.',
    price: 490,
    discountPrice: 425,
    discountPercentage: 13,
    image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&q=80&w=600',
    images: [
      'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&q=80&w=600'
    ],
    category: 'powders_detergents',
    brand: 'أريال',
    brandLogo: 'Ariel',
    rating: 4.7,
    reviewsCount: 96,
    featured: true,
    isSpecialOffer: false,
    specs: {
      'الوزن': '6 كيلو جرام',
      'النوع': 'مسحوق غسيل بودرة',
      'الاستخدام': 'غسالات أوتوماتيك',
      'الميزة الأساسية': 'إزالة البقع الصعبة فوريّاً'
    }
  },
  {
    id: 'dettol-soap-4pack',
    title: 'صابون ديتول الأصلي مضاد للبكتيريا والجراثيم - عرض 4 قطع × 120 جرام',
    description: 'صابون ديتول الأصلي لغسيل اليدين والجسم بتركيبة معقمة ذات فعالية مطلقة تقضي على 99.9% من الجراثيم والبكتيريا، مع الحفاظ على ترطيب البشرة وحيويتها الطبيعية يومياً.',
    price: 135,
    discountPrice: 99,
    discountPercentage: 27,
    image: 'https://images.unsplash.com/photo-1607006342411-9a336f168f19?auto=format&fit=crop&q=80&w=600',
    images: [
      'https://images.unsplash.com/photo-1607006342411-9a336f168f19?auto=format&fit=crop&q=80&w=600'
    ],
    category: 'soap_liquid',
    brand: 'ديتول',
    brandLogo: 'Dettol',
    rating: 4.9,
    reviewsCount: 215,
    featured: true,
    isSpecialOffer: false,
    specs: {
      'العدد': '4 صابونات في العبوة',
      'الوزن للقطعة': '120 جرام',
      'النوع': 'صابون صلب مطهر',
      'الاستخدام': 'الوجه، اليدين، ودش طبيعي للجسم'
    }
  },
  {
    id: 'pril-dishwash-1l',
    title: 'بريل سائل غسيل الأطباق الفائق وقاهر الدهون بالليمون - 1 لتر',
    description: 'بريل الأصلي بقوة خمس طبقات لمعان لإزالة الأوساخ المستعصية والدهون الجافة من الصحون والحلل دون بذل مجهود شاق، آمن تماماً على اليدين ويمنح المطبخ رائحة ليمون برّاقة ونظافة لا تضاهى.',
    price: 60,
    discountPrice: 48,
    discountPercentage: 20,
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=600',
    images: [
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=600'
    ],
    category: 'soap_liquid',
    brand: 'بريل',
    brandLogo: 'Pril',
    rating: 4.6,
    reviewsCount: 88,
    featured: true,
    isSpecialOffer: false,
    specs: {
      'الحجم': '1 لتر (1000 مل)',
      'العطر': 'ليمون مركز',
      'الشركة المصنعة': 'هنكل مصر للخدمات والصناعة',
      'الفعالية': 'قوة تكسير جزيئات الدهون والزيوت'
    }
  },
  {
    id: 'fine-tissues-3pack',
    title: 'مناديل فاين كلاسيك معقمة وفائقة النعومة - عبوة 550 منديل (عرض 3 علب)',
    description: 'مناديل ورقية ناعمة جداً من فاين كلاسيك ثلاثية الطبقات لتأمين أعلى مستويات الامتصاص والمتانة مع الحفاظ على نعومة مذهلة ومريحة للبشرة الحساسة، معقمة بتقنية ستيريبرو لمنع انتقال الجراثيم.',
    price: 155,
    discountPrice: 125,
    discountPercentage: 19,
    image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&q=80&w=600',
    images: [
      'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&q=80&w=600'
    ],
    category: 'paper_products',
    brand: 'فاين',
    brandLogo: 'Fine',
    rating: 4.8,
    reviewsCount: 174,
    featured: true,
    isSpecialOffer: false,
    specs: {
      'العدد في العلبة': '550 منديل سحب',
      'العرض الكلي': '3 علب عائلية فاخرة',
      'نوع الورق': 'طبيعي 100% معقم كليّاً',
      'النعومة': 'ملمس ناعم كالحرير'
    }
  },
  {
    id: 'zeina-kitchen-towels',
    title: 'مناديل مطبخ زينة سوبر جامبو عالية الامتصاص - 2 رول عملاق',
    description: 'مناديل مطبخ زينة صممت خصيصاً لتنظيف الأسطح وامتصاص الزيوت بكفاءة وسرعة بالغة، رول قوي لا يتفتت تحت ضغط رطوبة السوائل والماء ومناسب لمختلف أعمال المطبخ اليومية الشاقة.',
    price: 95,
    discountPrice: 79,
    discountPercentage: 17,
    image: 'https://images.unsplash.com/photo-1614806687483-36fa12beff34?auto=format&fit=crop&q=80&w=600',
    images: [
      'https://images.unsplash.com/photo-1614806687483-36fa12beff34?auto=format&fit=crop&q=80&w=600'
    ],
    category: 'paper_products',
    brand: 'زينة',
    brandLogo: 'Zeina',
    rating: 4.5,
    reviewsCount: 52,
    featured: true,
    isSpecialOffer: false,
    specs: {
      'العدد': '2 رول سوبر جامبو عملاق',
      'عدد الطبقات': 'ثنائية النعومة والمتانة',
      'الامتصاص': 'تصميم بجيوب هوائية لامتصاص مضاعف'
    }
  },
  {
    id: 'dettol-antiseptic-1l',
    title: 'ديتول سائل معقم ومطهر كلاسيكي متعدد الاستخدامات - 1 لتر',
    description: 'ديتول المطهر رقم واحد لحماية العائلات من مسببات الأمراض والعدوى والروائح السيئة. يستعمل لتطهير الأسطح والأرضيات، تعقيم الملابس أثناء الغسيل، وتوفير حماية طبية تامة في كائنات المعيشة.',
    price: 290,
    discountPrice: 245,
    discountPercentage: 15,
    image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=600',
    images: [
      'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=600'
    ],
    category: 'cleaning_appliances',
    brand: 'ديتول',
    brandLogo: 'Dettol',
    rating: 4.9,
    reviewsCount: 310,
    featured: true,
    isSpecialOffer: false,
    specs: {
      'الحجم': '1 لتر (1000 مل)',
      'الاستعمال': 'تنظيف، تطهير، غسيل، وتطبيقات الإسعافات الأولية',
      'الحماية': 'يقضي على 99.9% من الجراثيم المسببة للأمراض'
    }
  },
  {
    id: 'clorox-spray-500ml',
    title: 'بخاخ كلوركس المطور لتنظيف وتطهير الحمام والمطبخ وبقع الدهون - 500 مل',
    description: 'بخاخ ذكي برغوة فعالة يزيل الأوساخ والدهون الصعبة والترسبات الجيرية من السيراميك والأحواض بلمسة واحدة، ويقضي على الجراثيم والفيروسات ويترك الأجواء برائحة انتعاش الصنوبر اللطيفة.',
    price: 110,
    discountPrice: 89,
    discountPercentage: 19,
    image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&q=80&w=600',
    images: [
      'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&q=80&w=600'
    ],
    category: 'cleaning_appliances',
    brand: 'كلوركس',
    brandLogo: 'Clorox',
    rating: 4.4,
    reviewsCount: 65,
    featured: true,
    isSpecialOffer: false,
    specs: {
      'الحجم': '500 مل برذاذ بخّاخ',
      'الاستخدام': 'الحوائط، السيراميك، البلاط، الأفران والأحواض',
      'المفعول': 'تنظيف أقصى مع لمعان وتعقيم'
    }
  },
  {
    id: 'lux-shower-gel-500ml',
    title: 'لوكس شاور جل سائل استحمام لمسة ناعمة بماء الورد والعطور الساحرة - 500 مل',
    description: 'استمتعي ببشرة رطبة ومعطرة بنعومة الحرير مع سائل الاستحمام لوكس الجديد بعبير الروز الفاخر والزيوت العطرية النقية المغذية للبشرة للحصول على انتعاش ملكي طوال اليوم.',
    price: 115,
    discountPrice: 88,
    discountPercentage: 23,
    image: 'https://images.unsplash.com/photo-1608248597481-496100c80836?auto=format&fit=crop&q=80&w=600',
    images: [
      'https://images.unsplash.com/photo-1608248597481-496100c80836?auto=format&fit=crop&q=80&w=600'
    ],
    category: 'shower_bath',
    brand: 'لوكس',
    brandLogo: 'Lux',
    rating: 4.7,
    reviewsCount: 139,
    featured: true,
    isSpecialOffer: false,
    specs: {
      'الحجم': '500 مل',
      'المكونات': 'عطر الورد والياسمين مع كبسولات الزيوت المرطبة',
      'رغوة': 'رغوة غنية منعشة تغذي جسدك بالكامل'
    }
  },
  {
    id: 'downy-softener-1l',
    title: 'داوني منعم الأقمشة والملابس الفاخر بنسيم الوادي المنعش - 1 لتر',
    description: 'داوني المركز يمنح ملابسك نعومة لا تصدق وملمساً لطيفاً على البشرة، ويسهل عملية الكي وبث رائحة انتعاش نسيم البر والزهور التي ترافق حركاتك لأيام مبهرة.',
    price: 125,
    discountPrice: 104,
    discountPercentage: 16,
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600',
    images: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600'
    ],
    category: 'powders_detergents',
    brand: 'داوني',
    brandLogo: 'Downy',
    rating: 4.8,
    reviewsCount: 92,
    featured: true,
    isSpecialOffer: false,
    specs: {
      'الحجم': '1 لتر (1000 مل)',
      'العطر': 'نسيم الوادي المنعش للأقمشة والملابس',
      'التركيز': 'تأثير قوي ومثالي بنصف كمية الأغطية البسيطة'
    }
  },
  {
    id: 'fairy-capsules-20',
    title: 'فيري كبسولات غسالة الأطباق الكل في واحد إزالة الدهون العنيدة - 20 كبسولة',
    description: 'كبسولات فيري بلاتينيوم الكل في واحد لغسالات الأطباق تحتوي على سائل وبودرة تفتت كتل الدهون اللاصقة من أول غسلة وتترك الأواني والكؤوس بلمعان كريستالي وحماية متناهية من الخدش الجيري.',
    price: 450,
    discountPrice: 388,
    discountPercentage: 13,
    image: 'https://images.unsplash.com/photo-1545130853-a51307774421?auto=format&fit=crop&q=80&w=600',
    images: [
      'https://images.unsplash.com/photo-1545130853-a51307774421?auto=format&fit=crop&q=80&w=600'
    ],
    category: 'soap_liquid',
    brand: 'فيري',
    brandLogo: 'Fairy',
    rating: 4.9,
    reviewsCount: 78,
    featured: true,
    isSpecialOffer: false,
    specs: {
      'العبوة': '20 كبسولة تنظيف وتلميع بلاتينية',
      'الفعالية': 'قوة إزالة الشحوم صعبة الجفاف وتلميع مطلي الفولاذ الصحون',
      'العناية بالأطباق': 'تحمي الفخار، الزجاج وتلمع الفضة المستعملة'
    }
  }
];

export const GOVERNORATES = [
  { id: 'ismailia_city', name: 'مدينة الإسماعيلية (وسط البلد)', shipping: 0 },
  { id: 'hai_awal', name: 'حي أول', shipping: 0 },
  { id: 'hai_thani', name: 'حي ثان', shipping: 0 },
  { id: 'hai_thaleth', name: 'حي ثالث', shipping: 0 },
  { id: 'sheikh_zayed', name: 'الشيخ زايد', shipping: 0 },
  { id: 'araishya', name: 'العرايشية', shipping: 0 },
  { id: 'el_salam', name: 'حي السلام', shipping: 0 },
  { id: 'university', name: 'الجامعة والشارع التجاري', shipping: 0 },
  { id: 'belagat', name: 'طريق البلاجات', shipping: 0 },
  { id: 'gameyat', name: 'أرض الجمعيات', shipping: 0 },
  { id: 'shebin', name: 'شارع شبين والمنطقة الحرة', shipping: 0 },
  { id: 'nafisha', name: 'نفيشة', shipping: 0 },
  { id: 'abu_atwa', name: 'أبو عطوة', shipping: 0 },
  { id: 'shohada', name: 'الشهداء', shipping: 0 },
];
