/**
 * Memory Monitor Service
 * 
 * Monitors app memory usage and provides warnings when memory is low.
 * Helps prevent OutOfMemoryError crashes by alerting components to clean up resources.
 * 
 * This is particularly important for ad-heavy apps where banner and rewarded ads
 * can accumulate in memory and cause OOM crashes.
 */

import { AppState, Platform } from 'react-native';

type MemoryWarningListener = () => void;

class MemoryMonitorService {
  private listeners: Set<MemoryWarningListener> = new Set();
  private isMonitoring = false;

  /**
   * Start monitoring memory warnings
   */
  startMonitoring() {
    if (this.isMonitoring) {
      return;
    }

    console.log('[MemoryMonitor] Starting memory monitoring');
    this.isMonitoring = true;

    // On Android, we can listen for low memory warnings
    if (Platform.OS === 'android') {
      // React Native doesn't expose native memory warnings directly
      // But we can use AppState changes as a proxy
      // When app goes to background and comes back, it's a good time to clean up
      AppState.addEventListener('memoryWarning', this.handleMemoryWarning);
    }
  }

  /**
   * Stop monitoring memory warnings
   */
  stopMonitoring() {
    if (!this.isMonitoring) {
      return;
    }

    console.log('[MemoryMonitor] Stopping memory monitoring');
    this.isMonitoring = false;
  }

  /**
   * Handle memory warning from the system
   */
  private handleMemoryWarning = () => {
    console.warn('[MemoryMonitor] ⚠️ LOW MEMORY WARNING - Notifying listeners to clean up');
    
    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('[MemoryMonitor] Error in memory warning listener:', error);
      }
    });
  };

  /**
   * Add a listener for memory warnings
   * @param listener Function to call when memory is low
   * @returns Unsubscribe function
   */
  addMemoryWarningListener(listener: MemoryWarningListener): () => void {
    this.listeners.add(listener);
    console.log(`[MemoryMonitor] Added listener (total: ${this.listeners.size})`);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
      console.log(`[MemoryMonitor] Removed listener (total: ${this.listeners.size})`);
    };
  }

  /**
   * Manually trigger memory warning (for testing or forced cleanup)
   */
  triggerMemoryWarning() {
    console.log('[MemoryMonitor] Manual memory warning triggered');
    this.handleMemoryWarning();
  }

  /**
   * Log memory statistics (if available)
   */
  logMemoryStats() {
    // React Native doesn't expose memory stats directly
    // But we can log that monitoring is active
    console.log('[MemoryMonitor] Memory monitoring active:', this.isMonitoring);
    console.log('[MemoryMonitor] Active listeners:', this.listeners.size);
  }
}

// Export singleton instance
const memoryMonitorService = new MemoryMonitorService();
export default memoryMonitorService;
