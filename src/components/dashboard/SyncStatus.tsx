'use client';

import React, { useState, useEffect } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { syncEngine } from '@/lib/db/sync';
import { syncEventBus, type SyncStatusState } from '@/lib/db/events';

export function SyncStatus() {
  const { isOnline } = useNetworkStatus();
  const [internalStatus, setInternalStatus] = useState<SyncStatusState>(() => syncEngine.getStatus().status);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    // Subscribe to external sync engine events
    const unsubscribe = syncEventBus.onStatus((event) => {
      setInternalStatus(event.status);
    });

    return unsubscribe;
  }, []);

  // Compute effective status: if device is offline, status is always 'offline'
  const status: SyncStatusState = !isOnline ? 'offline' : internalStatus;

  const handleManualSync = async () => {
    if (!isOnline || isRetrying) return;
    try {
      setIsRetrying(true);
      await syncEngine.triggerSync();
    } finally {
      setIsRetrying(false);
    }
  };

  // Determine appearance based on status
  // Required: "a small dot + label, using bg-forest for synced, a muted amber for syncing, text-ink/60 for offline. It must always be visible, not just appear on error."
  const renderContent = () => {
    if (status === 'offline') {
      return (
        <div
          className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-paper border border-line text-xs text-ink/60 select-none"
          title="Working offline. Changes are saved locally and will sync when reconnected."
        >
          <span className="w-2 h-2 rounded-full bg-ink/30 shrink-0" />
          <span className="font-medium">Offline</span>
        </div>
      );
    }

    if (status === 'syncing' || isRetrying) {
      return (
        <div
          className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 select-none"
          title="Syncing local changes with cloud database..."
        >
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
          <span className="font-medium">Syncing</span>
        </div>
      );
    }

    if (status === 'error') {
      return (
        <button
          onClick={handleManualSync}
          className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-rust/10 border border-rust/30 text-xs text-rust hover:bg-rust/20 transition-colors cursor-pointer"
          title="Sync error occurred. Click to retry."
        >
          <span className="w-2 h-2 rounded-full bg-rust shrink-0" />
          <span className="font-medium">Sync Error (Retry)</span>
        </button>
      );
    }

    // Default: 'synced'
    return (
      <div
        onClick={handleManualSync}
        className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-forest/5 border border-forest/20 text-xs text-forest select-none cursor-pointer hover:bg-forest/10 transition-colors"
        title="All changes saved to IndexedDB & synced with cloud. Click to check for updates."
      >
        <span className="w-2 h-2 rounded-full bg-forest shrink-0" />
        <span className="font-medium">Synced</span>
      </div>
    );
  };

  return (
    <div
      id="sync-status-indicator"
      role="status"
      aria-live="polite"
      className="flex items-center"
    >
      {renderContent()}
    </div>
  );
}
