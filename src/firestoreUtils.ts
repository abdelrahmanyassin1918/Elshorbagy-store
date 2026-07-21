import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface Review {
  name: string;
  rating: number;
  comment: string;
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string;
  image?: string;
}

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
  stock: number;
  featured?: boolean;
  isSpecialOffer?: boolean;
  specs?: { [key: string]: string };
  createdAt?: string;
  updatedAt?: string;
  reviews?: Review[];
}

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
  brand?: string;
  category?: string;
  discountPrice?: number;
  product?: any;
}

export interface BannerData {
  badge: string;
  title: string;
  subtitle: string;
  image: string;
  isClosed?: boolean;
}

export interface Order {
  id: string;
  userId?: string;
  orderId?: string;
  items: OrderItem[];
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
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  isModerator?: boolean;
  createdAt: string;
}

// ============================================
// SITE / BANNER FUNCTIONS
// ============================================

/**
 * Get banner/home content from Firestore
 */
export async function getBannerData(): Promise<BannerData | null> {
  try {
    const docSnap = await getDoc(doc(db, "banner", "home"));
    if (docSnap.exists()) {
      return docSnap.data() as BannerData;
    }
    return null;
  } catch (error) {
    console.error("Error fetching banner data:", error);
    return null;
  }
}

/**
 * Save banner/home content to Firestore
 */
export async function saveBannerData(banner: BannerData): Promise<void> {
  try {
    await setDoc(
      doc(db, "banner", "home"),
      {
        ...banner,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
  } catch (error) {
    console.error("Error saving banner data:", error);
    throw error;
  }
}

// ============================================
// USER FUNCTIONS (Admin only)
// ============================================

/**
 * Get all users (admin only)
 */
export async function getAllUsers(): Promise<UserData[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    return querySnapshot.docs.map(
      (doc) =>
        ({
          uid: doc.id,
          ...doc.data(),
        }) as UserData,
    );
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

/**
 * Get user data by UID
 */
export async function getUserData(uid: string): Promise<UserData | null> {
  try {
    const docSnap = await getDoc(doc(db, "users", uid));
    if (docSnap.exists()) {
      return { uid: docSnap.id, ...docSnap.data() } as UserData;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
}

/**
 * Update user data (admin only)
 */
export async function updateUser(
  uid: string,
  updates: Partial<Omit<UserData, "uid">>,
): Promise<void> {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, updates);
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}

/**
 * Delete a user from Firestore (admin only).
 * Note: This only deletes the Firestore document, not the Auth user.
 * Deleting the Auth user requires the Admin SDK on a backend.
 */
export async function deleteUser(uid: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "users", uid));
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}

/**
 * Get user data by email from Firestore (for fallback login)
 */
export async function getUserByEmail(email: string): Promise<UserData | null> {
  try {
    const q = query(collection(db, "users"), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return {
        uid: userDoc.id,
        ...userDoc.data(),
      } as UserData;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user by email:", error);
    return null;
  }
}

// ============================================
// CATEGORY FUNCTIONS
// ============================================

/**
 * Get all categories
 */
export async function getAllCategories(): Promise<Category[]> {
  try {
    const q = query(collection(db, "categories"), orderBy("name"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Category,
    );
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

/**
 * Add a new category (admin only)
 */
export async function addCategory(
  category: Omit<Category, "id">,
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "categories"), category);
    return docRef.id;
  } catch (error) {
    console.error("Error adding category:", error);
    throw error;
  }
}

/**
 * Update a category (admin only)
 */
export async function updateCategory(
  categoryId: string,
  updates: Partial<Omit<Category, "id">>,
): Promise<void> {
  try {
    const categoryRef = doc(db, "categories", categoryId);
    await updateDoc(categoryRef, updates);
  } catch (error) {
    console.error("Error updating category:", error);
    throw error;
  }
}

/**
 * Delete a category (admin only)
 */
export async function deleteCategory(categoryId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "categories", categoryId));
  } catch (error) {
    console.error("Error deleting category:", error);
    throw error;
  }
}

// ============================================
// PRODUCT FUNCTIONS
// ============================================

/**
 * Get all products
 */
export async function getAllProducts(): Promise<Product[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "products"));
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Product,
    );
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

/**
 * Get product by ID
 */
export async function getProductById(
  productId: string,
): Promise<Product | null> {
  try {
    const docSnap = await getDoc(doc(db, "products", productId));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Product;
    }
    return null;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

/**
 * Get products by category
 */
export async function getProductsByCategory(
  category: string,
): Promise<Product[]> {
  try {
    const q = query(
      collection(db, "products"),
      where("category", "==", category),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Product,
    );
  } catch (error) {
    console.error("Error fetching products by category:", error);
    return [];
  }
}

/**
 * Get featured products
 */
export async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const q = query(collection(db, "products"), where("featured", "==", true));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Product,
    );
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return [];
  }
}

/**
 * Search products by title or description
 */
export async function searchProducts(searchTerm: string): Promise<Product[]> {
  try {
    const allProducts = await getAllProducts();
    const lowerTerm = searchTerm.toLowerCase();
    return allProducts.filter(
      (product) =>
        product.title.toLowerCase().includes(lowerTerm) ||
        product.description.toLowerCase().includes(lowerTerm) ||
        product.brand.toLowerCase().includes(lowerTerm),
    );
  } catch (error) {
    console.error("Error searching products:", error);
    return [];
  }
}

/**
 * Add a new product (admin only)
 */
export async function addProduct(
  product: Omit<Product, "id" | "createdAt">,
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "products"), {
      ...product,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding product:", error);
    throw error;
  }
}

/**
 * Update product (admin only)
 */
export async function updateProduct(
  productId: string,
  updates: Partial<Product>,
): Promise<void> {
  const token = await auth.currentUser?.getIdTokenResult(true);

  try {
    const productRef = doc(db, "products", productId);
    await updateDoc(productRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
}

/**
 * Add a review to a product and update its average rating.
 */
export async function addProductReview(
  productId: string,
  review: Omit<Review, "createdAt">,
): Promise<void> {
  try {
    const productRef = doc(db, "products", productId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      throw new Error("Product not found");
    }

    const productData = productSnap.data() as Product;

    const newReview: Review = {
      ...review,
      createdAt: new Date().toISOString(),
    };

    const existingReviews = productData.reviews || [];
    const updatedReviews = [...existingReviews, newReview];

    // Calculate new average rating and review count
    const newReviewsCount = updatedReviews.length;
    const totalRating = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
    const newAverageRating =
      newReviewsCount > 0 ? totalRating / newReviewsCount : 0;

    await updateDoc(productRef, {
      reviews: updatedReviews,
      reviewsCount: newReviewsCount,
      rating: newAverageRating,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error adding product review:", error);
    throw error;
  }
}

/**
 * Delete a product (admin only)
 */
export async function deleteProduct(productId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "products", productId));
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
}

// ============================================
// ORDER FUNCTIONS
// ============================================

/**
 * Create new order
 */
export async function createOrder(
  order: Omit<Order, "id" | "userId" | "createdAt">,
  userId?: string, // Make userId optional for guest checkouts
): Promise<string> {
  try {
    const orderRef = doc(collection(db, "orders"));
    await setDoc(orderRef, {
      ...order,
      orderId: orderRef.id,
      ...(userId && { userId }), // Conditionally add userId if it exists
      status: "pending",
      createdAt: new Date().toISOString(),
    });
    return orderRef.id;
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
}

/**
 * Get user's orders
 */
export async function getUserOrders(userId: string): Promise<Order[]> {
  try {
    const q = query(
      collection(db, "orders"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Order,
    );
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return [];
  }
}

/**
 * Get order by ID
 */
export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    const docSnap = await getDoc(doc(db, "orders", orderId));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Order;
    }
    return null;
  } catch (error) {
    console.error("Error fetching order:", error);
    return null;
  }
}

/**
 * Get all orders (admin only)
 */
export async function getAllOrders(): Promise<Order[]> {
  try {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Order,
    );
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
}

/**
 * Update order status (admin only)
 */
export async function updateOrderStatus(
  orderId: string,
  status: Order["status"],
): Promise<void> {
  try {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, {
      status,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error updating order:", error);
    throw error;
  }
}

/**
 * Cancel order
 */
export async function cancelOrder(orderId: string): Promise<void> {
  try {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, {
      status: "cancelled",
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    throw error;
  }
}

/**
 * Delete an order (admin only)
 */
export async function deleteOrder(orderId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "orders", orderId));
  } catch (error) {
    console.error("Error deleting order:", error);
    throw error;
  }
}
