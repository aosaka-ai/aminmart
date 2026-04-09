import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { UserProfile } from './types';
import { getDocument, createDocument } from './lib/firebase-utils';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: () => Promise<void>;
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
      
      // On some mobile devices, popups are strictly blocked.
      // We can try popup first, and if it fails, the error handler will catch it.
      await signInWithPopup(auth, provider);
      toast.success('Logged in successfully', { id: toastId });
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.code === 'auth/popup-blocked') {
        toast.info('Popup blocked. Trying redirect method...', { id: toastId });
        const provider = new GoogleAuthProvider();
        await signInWithRedirect(auth, provider);
      } else if (error.code === 'auth/unauthorized-domain') {
        toast.error('This domain is not authorized in Firebase. Please add aosaka-ai.github.io to authorized domains in Firebase Console.', { id: toastId });
      } else if (error.code === 'auth/network-request-failed') {
        toast.error('Network error: Firebase could not be reached. This is often caused by ad-blockers, VPNs, or network restrictions. Please disable ad-blockers and try again.', { id: toastId, duration: 6000 });
      } else {
        toast.error('Failed to login: ' + (error.message || 'Unknown error'), { id: toastId });
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
