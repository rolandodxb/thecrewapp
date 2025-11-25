import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import {
  getSystemControl,
  subscribeToSystemControl,
  SystemControl,
  SystemFeatures,
  SystemAnnouncement,
} from '../services/systemControlService';
import { handleDailyLogin, initializeUserPoints } from '../services/rewardsService';
import { startAutoRestoreScheduler } from '../services/featureShutdownService';
import { initializeUpdates } from '../utils/initializeUpdates';

export type Role = 'student' | 'mentor' | 'governor';
export type Plan = 'free' | 'pro' | 'vip';

export interface User {
  uid: string;
  email: string;
  name: string;
  role: Role;
  plan: Plan;
  country: string;
  bio: string;
  photoURL: string;
  expectations: string;
  hasCompletedOnboarding: boolean;
  hasSeenWelcomeBanner: boolean;
  onboardingCompletedAt?: string;
  welcomeBannerSeenAt?: string;
  createdAt: string;
  updatedAt: string;
  banned?: boolean;
  muted?: boolean;
  cvUrl?: string;
}

export interface Banner {
  id: string;
  title: string;
  color: string;
  expiration: string;
}

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  loading: boolean;
  maintenanceMode: boolean;
  setMaintenanceMode: (enabled: boolean) => void;
  maintenanceMessage: string;
  setMaintenanceMessage: (message: string) => void;
  banners: Banner[];
  setBanners: (banners: Banner[]) => void;
  systemFeatures: SystemFeatures;
  systemAnnouncement: SystemAnnouncement;
  isFeatureEnabled: (feature: keyof SystemFeatures) => boolean;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const firestoreUnsubscribeRef = useRef<(() => void) | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('System under maintenance. Please check back soon.');
  const [banners, setBanners] = useState<Banner[]>([]);
  const [systemFeatures, setSystemFeatures] = useState<SystemFeatures>({
    chat: { enabled: true },
    quiz: { enabled: true },
    englishTest: { enabled: true },
    profileEdit: { enabled: true },
    openDayModule: { enabled: true },
    courses: { enabled: true },
    aiTrainer: { enabled: true },
    recruiters: { enabled: true },
    openDays: { enabled: true },
    simulator: { enabled: true },
    messages: { enabled: true },
    leaderboard: { enabled: true },
    community: { enabled: true },
  });
  const [systemAnnouncement, setSystemAnnouncement] = useState<SystemAnnouncement>({
    active: false,
    message: '',
    type: 'info',
    timestamp: null,
  });

  useEffect(() => {
    const loadSystemControl = async () => {
      const control = await getSystemControl();
      console.log('AppContext - Loaded system control:', control);
      if (control) {
        setSystemFeatures(control.features);
        setSystemAnnouncement(control.announcement);
        console.log('AppContext - Set announcement:', control.announcement);
      }
    };

    const initializeSystemData = async () => {
      await initializeUpdates();
    };

    loadSystemControl();
    initializeSystemData();

    const unsubscribe = subscribeToSystemControl((control) => {
      console.log('AppContext - System control updated:', control);
      if (control) {
        setSystemFeatures(control.features);
        setSystemAnnouncement(control.announcement);
        console.log('AppContext - Updated announcement:', control.announcement);
      }
    });

    const stopAutoRestore = startAutoRestoreScheduler();

    return () => {
      unsubscribe();
      stopAutoRestore();
    };
  }, []);

  useEffect(() => {
    // Auth listener setup

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      // Clean up any existing Firestore listener
      if (firestoreUnsubscribeRef.current) {
        firestoreUnsubscribeRef.current();
        firestoreUnsubscribeRef.current = null;
      }

      if (firebaseUser) {
        // User authenticated

        if (sessionStorage.getItem('pending2FA') === 'true') {
          // 2FA verification required
          setLoading(false);
          return;
        }

        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const unsubscribeFirestore = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const userData = docSnap.data();
              // User data loaded

              const updatedUser: User = {
                uid: firebaseUser.uid,
                email: userData.email || firebaseUser.email || '',
                name: userData.name || 'User',
                role: (userData.role || 'student') as Role,
                plan: (userData.plan || 'free') as Plan,
                country: userData.country || '',
                bio: userData.bio || '',
                expectations: userData.expectations || '',
                photoURL: userData.photo_base64 || '',
                hasCompletedOnboarding: userData.hasCompletedOnboarding || false,
                hasSeenWelcomeBanner: userData.hasSeenWelcomeBanner || false,
                onboardingCompletedAt: userData.onboardingCompletedAt,
                welcomeBannerSeenAt: userData.welcomeBannerSeenAt,
                createdAt: userData.createdAt || new Date().toISOString(),
                updatedAt: userData.updatedAt || new Date().toISOString(),
                banned: userData.banned,
                muted: userData.muted,
                cvUrl: userData.cvUrl,
              };

              setCurrentUser(updatedUser);
              setLoading(false);

              initializeUserPoints(firebaseUser.uid).catch(console.error);
              handleDailyLogin(firebaseUser.uid).catch(console.error);
            } else {
              auth.signOut();
              setCurrentUser(null);
              sessionStorage.clear();
            }
          },
          (error) => {
            console.error('Error listening to user document:', error);

            if (error.code === 'permission-denied') {
              setTimeout(() => {
                firebaseUser.getIdToken(true).catch(() => {
                  auth.signOut();
                  setCurrentUser(null);
                  sessionStorage.clear();
                });
              }, 2000);
            } else {
              auth.signOut();
              setCurrentUser(null);
              sessionStorage.clear();
            }
          }
        );

        firestoreUnsubscribeRef.current = unsubscribeFirestore;
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => {
      // Cleanup auth listener
      // Clean up Firestore listener if it exists
      if (firestoreUnsubscribeRef.current) {
        firestoreUnsubscribeRef.current();
        firestoreUnsubscribeRef.current = null;
      }
      unsubscribeAuth();
    };
  }, []);

  const logout = async () => {
    try {
      await auth.signOut();
      setCurrentUser(null);
      sessionStorage.clear();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isFeatureEnabled = (feature: keyof SystemFeatures): boolean => {
    return systemFeatures[feature] === true;
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        loading,
        maintenanceMode,
        setMaintenanceMode,
        maintenanceMessage,
        setMaintenanceMessage,
        banners,
        setBanners,
        systemFeatures,
        systemAnnouncement,
        isFeatureEnabled,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
