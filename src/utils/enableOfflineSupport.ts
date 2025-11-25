import { enableIndexedDbPersistence } from 'firebase/firestore';
import { setPersistence, browserLocalPersistence } from 'firebase/auth';
import { db, auth } from '../lib/firebase';

export async function enableOfflineSupport() {
  try {
    await enableIndexedDbPersistence(db);
    console.log('✅ Firestore offline persistence enabled');
  } catch (err: any) {
    if (err.code === 'failed-precondition') {
      console.warn('⚠️ Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('⚠️ The current browser does not support offline persistence');
    } else {
      console.error('Error enabling persistence:', err);
    }
  }

  try {
    await setPersistence(auth, browserLocalPersistence);
    console.log('✅ Auth persistence enabled');
  } catch (err) {
    console.error('Error setting auth persistence:', err);
  }
}

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    // Check if we're in StackBlitz environment
    if (window.location.hostname.includes('stackblitz') || window.location.hostname.includes('webcontainer')) {
      console.log('⚠️ Service Worker not supported in StackBlitz environment');
      return;
    }

    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('✅ Service Worker registered:', registration.scope);

          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('🔄 New version available! Please refresh.');
                  if (confirm('New version available! Refresh to update?')) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          if (error.message && error.message.includes('StackBlitz')) {
            console.log('⚠️ Service Worker not supported in current environment');
          } else {
            console.error('Service Worker registration failed:', error);
          }
        });
    });
  } else {
    console.log('⚠️ Service Worker not supported in this browser');
  }
}

export function checkOnlineStatus(): boolean {
  return navigator.onLine;
}

export function subscribeToOnlineStatus(callback: (isOnline: boolean) => void) {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  callback(navigator.onLine);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
