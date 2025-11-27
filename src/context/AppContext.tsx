import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRef } from 'react';
import { auth } from '../lib/auth';
import { supabase } from '../lib/supabase';
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
  const supabaseUnsubscribeRef = useRef<(() => void) | null>(null);
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
    const unsubscribeAuth = auth.onAuthStateChanged(async (authUser) => {
      if (supabaseUnsubscribeRef.current) {
        supabaseUnsubscribeRef.current();
        supabaseUnsubscribeRef.current = null;
      }

      if (authUser) {
        if (sessionStorage.getItem('pending2FA') === 'true') {
          setLoading(false);
          return;
        }

        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.uid)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user data:', error);
          if (error.code === 'PGRST116') {
            const defaultUserData = {
              id: authUser.uid,
              email: authUser.email || '',
              name: authUser.displayName || 'User',
              role: 'student',
              plan: 'free',
              country: '',
              bio: '',
              photo_url: '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            const { error: insertError } = await supabase
              .from('users')
              .insert(defaultUserData);

            if (insertError) {
              console.error('Error creating user:', insertError);
              await auth.signOut();
              setCurrentUser(null);
              sessionStorage.clear();
              setLoading(false);
              return;
            }

            const appUser: User = {
              uid: authUser.uid,
              email: authUser.email || '',
              name: authUser.displayName || 'User',
              role: 'student' as Role,
              plan: 'free' as Plan,
              country: '',
              bio: '',
              photoURL: '',
              expectations: '',
              hasCompletedOnboarding: false,
              hasSeenWelcomeBanner: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            setCurrentUser(appUser);
            setLoading(false);

            initializeUserPoints(authUser.uid).catch(console.error);
            handleDailyLogin(authUser.uid).catch(console.error);
          } else {
            await auth.signOut();
            setCurrentUser(null);
            sessionStorage.clear();
            setLoading(false);
          }
          return;
        }

        if (userData) {
          const appUser: User = {
            uid: userData.id,
            email: userData.email || '',
            name: userData.name || 'User',
            role: (userData.role || 'student') as Role,
            plan: (userData.plan || 'free') as Plan,
            country: userData.country || '',
            bio: userData.bio || '',
            photoURL: userData.photo_url || '',
            expectations: userData.metadata?.expectations || '',
            hasCompletedOnboarding: userData.metadata?.hasCompletedOnboarding || false,
            hasSeenWelcomeBanner: userData.metadata?.hasSeenWelcomeBanner || false,
            onboardingCompletedAt: userData.metadata?.onboardingCompletedAt,
            welcomeBannerSeenAt: userData.metadata?.welcomeBannerSeenAt,
            createdAt: userData.created_at || new Date().toISOString(),
            updatedAt: userData.updated_at || new Date().toISOString(),
            banned: userData.metadata?.banned,
            muted: userData.metadata?.muted,
            cvUrl: userData.metadata?.cvUrl,
          };

          setCurrentUser(appUser);
          setLoading(false);

          initializeUserPoints(authUser.uid).catch(console.error);
          handleDailyLogin(authUser.uid).catch(console.error);
        }

        const subscription = supabase
          .channel(`user:${authUser.uid}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'users',
              filter: `id=eq.${authUser.uid}`,
            },
            async (payload) => {
              if (payload.eventType === 'UPDATE' && payload.new) {
                const userData = payload.new;
                const appUser: User = {
                  uid: userData.id,
                  email: userData.email || '',
                  name: userData.name || 'User',
                  role: (userData.role || 'student') as Role,
                  plan: (userData.plan || 'free') as Plan,
                  country: userData.country || '',
                  bio: userData.bio || '',
                  photoURL: userData.photo_url || '',
                  expectations: userData.metadata?.expectations || '',
                  hasCompletedOnboarding: userData.metadata?.hasCompletedOnboarding || false,
                  hasSeenWelcomeBanner: userData.metadata?.hasSeenWelcomeBanner || false,
                  onboardingCompletedAt: userData.metadata?.onboardingCompletedAt,
                  welcomeBannerSeenAt: userData.metadata?.welcomeBannerSeenAt,
                  createdAt: userData.created_at || new Date().toISOString(),
                  updatedAt: userData.updated_at || new Date().toISOString(),
                  banned: userData.metadata?.banned,
                  muted: userData.metadata?.muted,
                  cvUrl: userData.metadata?.cvUrl,
                };
                setCurrentUser(appUser);
              }
            }
          )
          .subscribe();

        supabaseUnsubscribeRef.current = () => {
          supabase.removeChannel(subscription);
        };
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => {
      if (supabaseUnsubscribeRef.current) {
        supabaseUnsubscribeRef.current();
        supabaseUnsubscribeRef.current = null;
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
