export interface PurchaseRecord {
  id: string;
  date: string;
  quantity: number;
  purchasePrice: number;
  totalCost: number;
}

export interface SaleRecord {
  orderId: string;
  date: string;
  quantity: number;
  salePrice: number;
  totalRevenue: number;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number; // Original price
  discountPrice?: number; // Price after discount
  purchasePrice?: number; // Purchase price
  barcode?: string; // QR code / Barcode
  discountPercentage?: number; // e.g. 51%
  stock?: number; // Remaining stock count in warehouse
  image: string;
  images: string[];
  category: string;
  brand: string;
  brandLogo?: string;
  company?: string; // Manufacturing company
  rating: number;
  reviewsCount: number;
  featured?: boolean;
  isSpecialOffer?: boolean;
  specs: { [key: string]: string };
  purchaseHistory?: PurchaseRecord[];
  salesHistory?: SaleRecord[];
  addedDate?: string;
}

export interface Brand {
  id: string;
  name: string;
  logoUrl?: string;
  bgClass?: string;
  textColor?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  image: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

export interface OrderDetails {
  orderId: string;
  items: CartItem[];
  customerInfo: {
    name: string;
    phone: string;
    governorate: string;
    city: string;
    address: string;
  };
  subtotal: number;
  shipping: number;
  total: number;
  date: string;
  status?: 'pending' | 'delivered' | 'cancelled';
}
