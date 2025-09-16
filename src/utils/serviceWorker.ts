/**
 * Service Worker Registration
 * Handles service worker registration and updates
 */

export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });


    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content is available, notify user
            
            // You could show a notification to the user here
            if (confirm('New version available! Refresh to update?')) {
              window.location.reload();
            }
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
};

export const unregisterServiceWorker = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    await Promise.all(
      registrations.map(registration => registration.unregister())
    );
    
    return true;
  } catch (error) {
    console.error('Service Worker unregistration failed:', error);
    return false;
  }
};

// Check if the app is running offline
export const isOffline = (): boolean => {
  return !navigator.onLine;
};

// Listen for online/offline events
export const setupOfflineDetection = (onOnline?: () => void, onOffline?: () => void) => {
  const handleOnline = () => {
    onOnline?.();
  };

  const handleOffline = () => {
    onOffline?.();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};
