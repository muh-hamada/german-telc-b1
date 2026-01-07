import { useState, useEffect } from 'react';
import { issueReportService } from '../services/issue-report.service';
import { useModalQueue } from '../contexts/ModalQueueContext';

/**
 * Hook to check for updated issue reports on app launch
 * Enqueues a modal in the global modal queue if updates are found
 */
export const useIssueUpdateChecker = (): void => {
  const { enqueue } = useModalQueue();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Only check once on mount
    if (hasChecked) return;

    const checkForUpdates = async () => {
      try {
        const updates = await issueReportService.getUpdatedReports();
        
        if (updates.length > 0) {
          console.log('[useIssueUpdateChecker] Found', updates.length, 'updated reports');
          // Enqueue the modal with updated reports data
          enqueue('issue-updates', { updatedReports: updates });
        }
      } catch (error) {
        console.error('[useIssueUpdateChecker] Error checking for updates:', error);
      } finally {
        setHasChecked(true);
      }
    };

    // Add a small delay to avoid checking immediately on app launch
    const timer = setTimeout(() => {
      checkForUpdates();
    }, 1000);

    return () => clearTimeout(timer);
  }, [hasChecked, enqueue]);
};

