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
import { doc, onSnapshot } from 'firebase/firestore';
import { UserProfile, Address } from './types';
import { getDocument, createDocument, updateDocument } from './lib/firebase-utils';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
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
          if (!userProfile) {
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email || undefined,
              displayName: user.displayName || undefined,
              role: user.email === 'a.osaka@gmail.com' ? 'admin' : 'customer',
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
    <AuthContext.Provider value={{ user, profile, loading, login, loginWithEmail, register, updateProfile, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
