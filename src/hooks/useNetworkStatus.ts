'use client';

import { useSyncExternalStore } from 'react';

function getSnapshot(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

function getServerSnapshot(): boolean {
  return true;
}

function subscribe(callback: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);

  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

/**
 * Hook for detecting online/offline browser network status.
 */
export function useNetworkStatus(): { isOnline: boolean } {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { isOnline };
}
