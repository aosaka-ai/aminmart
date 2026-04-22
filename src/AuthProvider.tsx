import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  reload
} from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, onSnapshot, where } from 'firebase/firestore';
import { UserProfile, Address } from './types';
import { getDocument, createDocument, updateDocument, getCollection, removeDocument } from './lib/firebase-utils';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  loginWithEmployeeId: (id: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, data: Partial<UserProfile>) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle redirect result with a timeout
    const redirectTimeout = setTimeout(() => {
      if (loading) {
        console.warn('Redirect check taking too long, proceeding...');
      }
    }, 5000);

    getRedirectResult(auth).then(() => {
      clearTimeout(redirectTimeout);
    }).catch((error) => {
      clearTimeout(redirectTimeout);
      console.error('Redirect login error:', error);
      if (error.code !== 'auth/network-request-failed') {
        toast.error('Failed to complete redirect login: ' + error.message);
      }
    });

    const safetyTimeout = setTimeout(() => {
      if (loading) {
        console.warn('Auth loading timed out, forcing ready state');
        setLoading(false);
      }
    }, 8000);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setUser(user);
        if (user) {
          // Fetch or create profile
          let userProfile = await getDocument<UserProfile>('users', user.uid);
          if (!userProfile && user.email) {
            // Check for pre-registered profile by email
            const preRegResults = await getCollection<UserProfile>('users', [where('email', '==', user.email)]);
            const preRegProfile = preRegResults.find(p => p.isPreRegistered);
            
            if (preRegProfile) {
              console.log("Linking to pre-registered profile:", preRegProfile.id);
              const updatedProfile = { 
                ...preRegProfile, 
                uid: user.uid, 
                isPreRegistered: false,
                isVerified: (user.emailVerified || preRegProfile.role === 'admin' || user.email === 'a.osaka@gmail.com') 
              };
              // Delete the old pending document and create new with UID
              await removeDocument('users', preRegProfile.id);
              await createDocument('users', updatedProfile, user.uid);
              userProfile = updatedProfile;
            }
          }

          if (!userProfile) {
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email || undefined,
              displayName: user.displayName || undefined,
              role: user.email === 'a.osaka@gmail.com' ? 'admin' : 'customer',
              isVerified: user.email === 'a.osaka@gmail.com', // Primary admin auto-verified
              addresses: []
            };
            await createDocument('users', newProfile, user.uid);
            userProfile = newProfile;
          }
          setProfile(userProfile);

          // Listen for real-time profile updates
          const profileUnsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
            if (doc.exists()) {
              setProfile({ ...(doc.data() as UserProfile), uid: doc.id });
            }
          }, (err) => {
            console.error('Profile snapshot error:', err);
          });
          
          // Store cleanup in a ref or local variable if needed, 
          // but for now we'll just let the outer unsubscribe handle it
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
      } finally {
        clearTimeout(safetyTimeout);
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(safetyTimeout);
      unsubscribe();
    };
  }, []);

  const login = async () => {
    console.log('Login button clicked');
    const toastId = toast.loading('Opening Google login...');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success('Logged in successfully', { id: toastId });
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/popup-blocked') {
        const provider = new GoogleAuthProvider();
        await signInWithRedirect(auth, provider);
      } else {
        toast.error('Failed to login: ' + (error.message || 'Unknown error'), { id: toastId });
      }
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    const toastId = toast.loading('Logging in...');
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      toast.success('Welcome back!', { id: toastId });
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
      throw error;
    }
  };

  const loginWithEmployeeId = async (id: string, pass: string) => {
    const toastId = toast.loading('Verifying Admin Credentials...');
    const normalizedId = id.trim().toUpperCase();
    console.log(`[AUTH-TRACE] Starting staff login check for normalized ID: "${normalizedId}"`);
    
    try {
      // Step 1: Try direct document lookup (Fastest & most secure)
      let credDoc: any = null;
      try {
        console.log(`[AUTH-TRACE] Attempting direct fetch: staffCredentials/${normalizedId}`);
        credDoc = await getDocument<any>('staffCredentials', normalizedId);
        if (credDoc) console.log(`[AUTH-TRACE] Direct fetch SUCCESS for ${normalizedId}`);
      } catch (docErr: any) {
        console.warn("[AUTH-TRACE] Direct lookup errored (might be expected if not found):", docErr.message || docErr);
      }
      
      // Step 2: Fallback to query if direct lookup found nothing
      if (!credDoc) {
        console.log(`[AUTH-TRACE] Direct lookup failed/null, trying collection query for employeeId == "${normalizedId}"`);
        const results = await getCollection<any>('staffCredentials', [
          where('employeeId', '==', normalizedId)
        ]);
        if (results && results.length > 0) {
          credDoc = results[0];
          console.log(`[AUTH-TRACE] Query fallback SUCCESS. Found:`, credDoc.id);
        } else {
          console.log(`[AUTH-TRACE] Query fallback returned 0 results for "${normalizedId}"`);
        }
      }

      if (!credDoc) {
        console.error(`[AUTH-CRITICAL] Failed to find credentials for ID: "${normalizedId}" in all database passes.`);
        throw new Error('Employee ID not found. Please ensure the admin profile has been created and you used the correct ID.');
      }
      
      console.log(`[AUTH-TRACE] Credential document found. Verifying password...`);
      if (credDoc.password !== pass) {
        console.warn(`[AUTH-TRACE] Password mismatch for ID: ${normalizedId}`);
        throw new Error('Invalid security password');
      }

      // Step 3: Fetch the actual user profile
      console.log(`[AUTH-TRACE] Password OK. Fetching user profile for UID: ${credDoc.uid}`);
      const userDoc = await getDocument<UserProfile>('users', credDoc.uid);
      if (!userDoc) {
        console.error(`[AUTH-CRITICAL] Credential exists but linked user doc "${credDoc.uid}" is MISSING.`);
        throw new Error('Admin profile corrupted (User record missing)');
      }

      // Allow staff access
      setProfile(userDoc);
      console.log(`[AUTH-TRACE] Login complete. Greeting ${userDoc.firstName}`);
      toast.success(`Access Granted: Welcome, ${userDoc.firstName}!`, { id: toastId });
    } catch (error: any) {
      console.error("[AUTH-FINAL] Staff login error loop termination:", error);
      const msg = error.message.includes('permission-denied') 
        ? "Security Error: Database denied access to credential records." 
        : error.message;
      toast.error(msg, { id: toastId });
      throw error;
    }
  };

  const register = async (email: string, pass: string, data: Partial<UserProfile> & { addressData?: Address }) => {
    const toastId = toast.loading('Creating account...');
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      
      // Send real verification email via Firebase
      await sendEmailVerification(cred.user);
      
      const newProfile: UserProfile = {
        uid: cred.user.uid,
        email,
        firstName: data.firstName,
        lastName: data.lastName,
        birthDate: data.birthDate,
        mobile: data.mobile,
        gender: data.gender,
        role: 'customer',
        isVerified: false,
        addresses: data.addressData ? [data.addressData] : []
      };
      await createDocument('users', newProfile, cred.user.uid);
      setProfile(newProfile);
      toast.success('Account created! A verification link has been sent to your email.', { id: toastId });
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
      throw error;
    }
  };

  const refreshUser = async () => {
    if (auth.currentUser) {
      await reload(auth.currentUser);
      setUser({ ...auth.currentUser });
      if (auth.currentUser.emailVerified && profile && !profile.isVerified) {
        await updateProfile({ isVerified: true });
      }
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    try {
      await updateDocument('users', user.uid, data);
      toast.success('Profile updated');
    } catch (error: any) {
      toast.error('Failed to update profile');
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, loginWithEmail, loginWithEmployeeId, register, updateProfile, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
