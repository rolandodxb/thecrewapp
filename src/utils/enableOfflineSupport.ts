export async function enableOfflineSupport() {
  console.log('✅ Supabase handles offline persistence automatically');
}

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
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
