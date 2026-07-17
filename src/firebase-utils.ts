import { Firestore, collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, writeBatch } from 'firebase/firestore';

/**
 * Firestore utility functions for client-side operations
 * Use these in your React components
 */

// Type definitions
export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  discountPrice?: number;
  discountPercentage?: number;
  image: string;
  images: string[];
  category: string;
  brand: string;
  rating: number;
  reviewsCount: number;
  featured?: boolean;
  isSpecialOffer?: boolean;
  specs: { [key: string]: string };
  stock: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Order {
  id: string;
  userId?: string;
  items: {
    productId: string;
    title: string;
    price: number;
    quantity: number;
  }[];
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
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  createdAt: Date;
  updatedAt?: Date;
}

// ============================================
// PRODUCTS
// ============================================

/**
 * Get all products
 */
export async function getAllProducts(db: Firestore): Promise<Product[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Product));
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

/**
 * Get product by ID
 */
export async function getProductById(db: Firestore, productId: string): Promise<Product | null> {
  try {
    const docSnap = await getDoc(doc(db, 'products', productId));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Product;
    }
    return null;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

/**
 * Get products by category
 */
export async function getProductsByCategory(db: Firestore, category: string): Promise<Product[]> {
  try {
    const q = query(collection(db, 'products'), where('category', '==', category));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Product));
  } catch (error) {
    console.error('Error fetching products by category:', error);
    return [];
  }
}

/**
 * Get featured products
 */
export async function getFeaturedProducts(db: Firestore): Promise<Product[]> {
  try {
    const q = query(collection(db, 'products'), where('featured', '==', true));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Product));
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }
}

/**
 * Search products by title
 */
export async function searchProducts(db: Firestore, searchTerm: string): Promise<Product[]> {
  try {
    const allProducts = await getAllProducts(db);
    return allProducts.filter(
      (product) =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchTerm.toLowerCase())
    );
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
}

// ============================================
// ORDERS
// ============================================

/**
 * Create a new order
 */
export async function createOrder(db: Firestore, order: Omit<Order, 'id'>): Promise<string> {
  try {
    const docRef = doc(collection(db, 'orders'));
    await setDoc(docRef, {
      ...order,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

/**
 * Get order by ID
 */
export async function getOrderById(db: Firestore, orderId: string): Promise<Order | null> {
  try {
    const docSnap = await getDoc(doc(db, 'orders', orderId));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Order;
    }
    return null;
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
}

/**
 * Get all orders
 */
export async function getAllOrders(db: Firestore): Promise<Order[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'orders'));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Order));
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  db: Firestore,
  orderId: string,
  status: Order['status']
): Promise<void> {
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      status,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
}

// ============================================
// INVENTORY / STOCK
// ============================================

/**
 * Update product stock
 */
export async function updateProductStock(
  db: Firestore,
  productId: string,
  quantity: number
): Promise<void> {
  try {
    const productRef = doc(db, 'products', productId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      throw new Error('Product not found');
    }

    const currentStock = productSnap.data().stock || 0;
    const newStock = Math.max(0, currentStock - quantity); // Don't go below 0

    await updateDoc(productRef, {
      stock: newStock,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    throw error;
  }
}

/**
 * Bulk update stock for multiple products
 */
export async function bulkUpdateStock(
  db: Firestore,
  updates: { productId: string; quantity: number }[]
): Promise<void> {
  try {
    const batch = writeBatch(db);

    for (const { productId, quantity } of updates) {
      const productRef = doc(db, 'products', productId);
      batch.update(productRef, {
        stock: quantity,
        updatedAt: new Date(),
      });
    }

    await batch.commit();
  } catch (error) {
    console.error('Error bulk updating stock:', error);
    throw error;
  }
}
