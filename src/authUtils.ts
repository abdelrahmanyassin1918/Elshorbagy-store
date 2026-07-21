import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  UserCredential,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

// Type definitions
export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  isModerator?: boolean; // Optional moderator flag
  createdAt: string;
}

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

/**
 * Enable persistent authentication (stays logged in after page refresh)
 */
export async function enablePersistence() {
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (error) {
    console.error("Error setting persistence:", error);
  }
}

/**
 * Sign up new user
 */
export async function signUp(
  email: string,
  password: string,
  displayName: string,
): Promise<UserData> {
  try {
    // Create authentication user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const user = userCredential.user;

    // Update profile
    await updateProfile(user, { displayName });

    // Create user document in Firestore
    const userData: UserData = {
      uid: user.uid,
      email: user.email || "",
      displayName,
      isAdmin: false,
      isModerator: false,
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, "users", user.uid), userData);

    return userData;
  } catch (error: any) {
    console.error("Sign up error:", error.message);
    throw error;
  }
}

/**
 * Sign in existing user
 */
export async function signIn(email: string, password: string): Promise<User> {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
    return userCredential.user;
  } catch (error: any) {
    console.error("Sign in error:", error.message);
    throw error;
  }
}

/**
 * Sign in admin user with Firebase and verify admin flag in Firestore
 */
export async function signInAdmin(
  email: string,
  password: string,
): Promise<{ user: User; userData: UserData }> {
  // 1. First, try to sign in with Firebase Authentication (secure method)
  try {
    const userCredential: UserCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const userData = await getUserData(userCredential.user.uid);

    if (userData && (userData.isAdmin || userData.isModerator)) {
      return { user: userCredential.user, userData };
    } else {
      await signOut(auth); // Sign out if they don't have the right role
      throw new Error("هذا الحساب ليس لديه صلاحية الدخول للوحة التحكم");
    }
  } catch (authError: any) {
    console.log(
      "Firebase Auth sign-in failed, trying Firestore fallback. Error:",
      authError.code,
    );
    console.log(authError.code);

    // 2. If Auth fails (e.g., user not found), try the insecure fallback
    if (
      authError.code === "auth/user-not-found" ||
      authError.code === "auth/wrong-password" ||
      authError.code === "auth/too-many-requests" ||
      authError.code === "auth/invalid-credential"
    ) {
      const { getUserByEmail } = await import("./firestoreUtils");
      const firestoreUser = await getUserByEmail(email);

      // We need to check for a 'password' field in your Firestore document.
      // This is the insecure part.
      if (firestoreUser && (firestoreUser as any).password === password) {
        if (firestoreUser.isAdmin || firestoreUser.isModerator) {
          console.warn(
            "Successful login via insecure fallback for user:",
            email,
          );
          // Return a mock User object, as we don't have a real Auth user.
          // The rest of the app must be able to handle this mock object.
          const mockUser: User = {
            uid: firestoreUser.uid,
            email: firestoreUser.email,
            displayName: firestoreUser.displayName,
            // Add other required User properties with default values
          } as User;

          return { user: mockUser, userData: firestoreUser };
        } else {
          throw new Error("هذا الحساب ليس لديه صلاحية الدخول للوحة التحكم");
        }
      }
    }

    // 3. If both methods fail, throw a generic error.
    throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
  }
}

/**
 * Sign out current user
 */
export async function signOut_() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Sign out error:", error);
    throw error;
  }
}

/**
 * Get current authenticated user
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/**
 * Listen to authentication state changes
 */
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// ============================================
// USER DATA FUNCTIONS
// ============================================

/**
 * Get user data from Firestore
 */
export async function getUserData(uid: string): Promise<UserData | null> {
  try {
    const docSnap = await getDoc(doc(db, "users", uid));
    if (docSnap.exists()) {
      return docSnap.data() as UserData;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
}

/**
 * Check if user is admin
 */
export async function isUserAdmin(uid: string): Promise<boolean> {
  try {
    const userData = await getUserData(uid);
    return userData?.isAdmin === true;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

/**
 * Update user display name
 */
export async function updateUserDisplayName(
  uid: string,
  displayName: string,
): Promise<void> {
  try {
    const user = getCurrentUser();
    if (user) {
      await updateProfile(user, { displayName });
    }

    await setDoc(doc(db, "users", uid), { displayName }, { merge: true });
  } catch (error) {
    console.error("Error updating display name:", error);
    throw error;
  }
}

/**
 * Create admin account (call this only once during setup)
 * Only call this from a secure context (logged in as existing admin)
 */
export async function createAdminAccount(
  email: string,
  password: string,
  displayName: string,
): Promise<void> {
  try {
    // First check if current user is admin
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error("Must be logged in to create admin account");
    }

    const isAdmin = await isUserAdmin(currentUser.uid);
    if (!isAdmin) {
      throw new Error("Only admins can create other admin accounts");
    }

    // Create new admin account
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const user = userCredential.user;

    // Set as admin in Firestore
    const userData: UserData = {
      uid: user.uid,
      email: user.email || "",
      displayName,
      isAdmin: true,
      isModerator: true, // Admins are also moderators
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, "users", user.uid), userData);
  } catch (error: any) {
    console.error("Error creating admin account:", error.message);
    throw error;
  }
}

/**
 * Create a new admin/moderator user from the admin panel.
 * This is a client-side workaround. It will temporarily sign in as the new user
 * to create their profile, then sign back in as the original admin.
 */
export async function createAdminUser(
  email: string,
  password: string,
  displayName: string,
): Promise<UserData> {
  const currentAdmin = auth.currentUser;
  if (!currentAdmin) {
    throw new Error("No admin is currently signed in.");
  }

  try {
    // 1. Create the new user in Firebase Auth. This will sign them in.
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = userCredential.user;

    // 2. Update the new user's profile with their display name.
    await updateProfile(newUser, { displayName });

    // 3. Create the user document in Firestore with moderator privileges.
    const newUserDa_ta: UserData = {
      uid: newUser.uid,
      email: newUser.email || "",
      displayName,
      isAdmin: false, // New users are moderators by default, not full admins
      isModerator: true,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, "users", newUser.uid), newUserDa_ta);

    // 4. IMPORTANT: Sign the original admin back in.
    await auth.updateCurrentUser(currentAdmin);

    return newUserDa_ta;
  } catch (error: any) {
    if (
      error?.code === "auth/email-already-in-use" ||
      error?.message === "EMAIL_EXISTS" ||
      error?.message?.includes("EMAIL_EXISTS")
    ) {
      throw new Error(
        "هذا البريد الإلكتروني مستخدم بالفعل في Firebase. استخدم بريداً مختلفاً أو عدّل الحساب الموجود."
      );
    }

    throw new Error(`Failed to create user: ${error.message}`);
  }
}

/**
 * Set user as admin (use with caution!)
 * Only call from secure admin panel
 */
export async function setUserAsAdmin(uid: string): Promise<void> {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error("Must be logged in");
    }

    const isAdmin = await isUserAdmin(currentUser.uid);
    if (!isAdmin) {
      throw new Error("Only admins can modify user roles");
    }

    await setDoc(doc(db, "users", uid), { isAdmin: true }, { merge: true });
  } catch (error) {
    console.error("Error setting admin status:", error);
    throw error;
  }
}
