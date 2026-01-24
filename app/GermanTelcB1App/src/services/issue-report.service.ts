import firestore from '@react-native-firebase/firestore';
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { activeExamConfig } from '../config/active-exam.config';
import { AnalyticsEvents, logEvent } from './analytics.events';

interface SubmitIssueReportParams {
  userId: string | null;
  examData: any;
  section: string;
  part: number;
  examId: string;
  userFeedback: string;
}

interface IssueReport {
  userId: string | null;
  timestamp: number;
  appId: string;
  platform: 'ios' | 'android';
  appVersion: string;
  deviceUUID: string;
  section: string;
  part: number;
  examId: string;
  questionSnapshot: any;
  userFeedback: string;
  status: 'pending' | 'in_progress' | 'cannot_reproduce' | 'fixed' | 'not_a_bug';
  adminResponse?: string;
  seenByUserAt?: number;
  seenByUserSource?: 'modal' | 'screen';
  createdAt: ReturnType<typeof firestore.FieldValue.serverTimestamp>;
  updatedAt: ReturnType<typeof firestore.FieldValue.serverTimestamp>;
}

export interface ReportedIssueDetails {
  id: string;
  timestamp: number;
  section: string;
  part: number;
  examId: string;
  userFeedback: string;
  status: 'pending' | 'in_progress' | 'cannot_reproduce' | 'fixed' | 'not_a_bug';
  displayStatus: 'pending' | 'in_progress' | 'resolved'; // Mapped status for display
  adminResponse?: string;
  seenByUserAt?: number;
  seenByUserSource?: 'modal' | 'screen';
}

class IssueReportService {
  private readonly COLLECTION_NAME = 'issueReports';
  private readonly STORAGE_KEY = `reportedIssueIds_${activeExamConfig.id}`;
  private deviceUUID: string | null = null;

  /**
   * Get or generate device UUID
   */
  private async getDeviceUUID(): Promise<string> {
    if (this.deviceUUID) {
      return this.deviceUUID;
    }

    try {
      this.deviceUUID = await DeviceInfo.getUniqueId();
      console.log('[IssueReportService] Device UUID obtained:', this.deviceUUID);
      return this.deviceUUID;
    } catch (error) {
      console.error('[IssueReportService] Error getting device UUID:', error);
      // Fallback to a generated UUID if device UUID fails
      this.deviceUUID = `fallback-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      return this.deviceUUID;
    }
  }

  /**
   * Map admin status to user-friendly display status
   * pending -> pending
   * in_progress -> in_progress
   * fixed, not_a_bug, cannot_reproduce -> resolved
   */
  private mapStatusToDisplay(
    status: 'pending' | 'in_progress' | 'cannot_reproduce' | 'fixed' | 'not_a_bug'
  ): 'pending' | 'in_progress' | 'resolved' {
    if (status === 'fixed' || status === 'not_a_bug' || status === 'cannot_reproduce') {
      return 'resolved';
    }
    return status as 'pending' | 'in_progress';
  }

  /**
   * Submit an issue report to Firestore
   */
  async submitIssueReport(params: SubmitIssueReportParams): Promise<void> {
    const {
      userId,
      examData,
      section,
      part,
      examId,
      userFeedback,
    } = params;

    try {
      // Gather device metadata
      const appVersion = DeviceInfo.getVersion();
      const platform = Platform.OS as 'ios' | 'android';
      const currentAppId = activeExamConfig.id;
      const deviceUUID = await this.getDeviceUUID();

      // Create the issue report document
      const issueReport: IssueReport = {
        userId,
        timestamp: Date.now(),
        appId: currentAppId,
        platform,
        appVersion,
        deviceUUID,
        section,
        part,
        examId: examId,
        questionSnapshot: examData,
        userFeedback: userFeedback.trim(),
        status: 'pending',
        createdAt: firestore.FieldValue.serverTimestamp() as any,
        updatedAt: firestore.FieldValue.serverTimestamp() as any,
      };

      // Write to Firestore
      const docRef = await firestore()
        .collection(this.COLLECTION_NAME)
        .add(issueReport);

      // Store the document ID in local storage
      await this.storeReportId(docRef.id);

      console.log('[IssueReportService] Issue report submitted successfully', {
        section,
        part,
        examId,
        userId: userId || 'anonymous',
        reportId: docRef.id,
      });
    } catch (error) {
      console.error('[IssueReportService] Error submitting issue report:', error);
      throw error;
    }
  }

  /**
   * Store a report ID in local storage
   */
  private async storeReportId(reportId: string): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      const reportIds: string[] = stored ? JSON.parse(stored) : [];
      
      if (!reportIds.includes(reportId)) {
        reportIds.push(reportId);
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(reportIds));
        console.log('[IssueReportService] Report ID stored:', reportId);
      }
    } catch (error) {
      console.error('[IssueReportService] Error storing report ID:', error);
      // Don't throw - this is not critical enough to fail the whole operation
    }
  }

  /**
   * Get all locally stored report IDs
   */
  async getLocalReportIds(): Promise<string[]> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('[IssueReportService] Error reading report IDs:', error);
      return [];
    }
  }

  /**
   * Fetch reported issues by their IDs
   */
  async getReportedIssues(reportIds: string[]): Promise<ReportedIssueDetails[]> {
    if (reportIds.length === 0) {
      return [];
    }

    try {
      // Firebase 'in' query has a limit of 10 items, so we need to batch
      const batchSize = 10;
      const batches: string[][] = [];
      
      for (let i = 0; i < reportIds.length; i += batchSize) {
        batches.push(reportIds.slice(i, i + batchSize));
      }

      const allReports: ReportedIssueDetails[] = [];

      for (const batch of batches) {
        const snapshot = await firestore()
          .collection(this.COLLECTION_NAME)
          .where(firestore.FieldPath.documentId(), 'in', batch)
          .get();

        snapshot.docs.forEach(doc => {
          const data = doc.data();
          allReports.push({
            id: doc.id,
            timestamp: data.timestamp,
            section: data.section,
            part: data.part,
            examId: data.examId,
            userFeedback: data.userFeedback,
            status: data.status || 'pending',
            displayStatus: this.mapStatusToDisplay(data.status || 'pending'),
            adminResponse: data.adminResponse,
            seenByUserAt: data.seenByUserAt,
            seenByUserSource: data.seenByUserSource,
          });
        });
      }

      // Sort by timestamp (newest first)
      allReports.sort((a, b) => b.timestamp - a.timestamp);

      console.log('[IssueReportService] Fetched reported issues:', allReports.length);
      return allReports;
    } catch (error) {
      console.error('[IssueReportService] Error fetching reported issues:', error);
      throw error;
    }
  }

  /**
   * Mark reports as seen by updating Firebase with timestamp and source
   */
  async markReportsAsSeen(reportIds: string[], source: 'modal' | 'screen'): Promise<void> {
    if (reportIds.length === 0) {
      return;
    }

    try {
      const deviceUUID = await this.getDeviceUUID();
      const now = Date.now();
      const batch = firestore().batch();

      // Update each report in the batch
      reportIds.forEach(reportId => {
        const reportRef = firestore()
          .collection(this.COLLECTION_NAME)
          .doc(reportId);
        
        batch.update(reportRef, {
          seenByUserAt: now,
          seenByUserSource: source,
          deviceUUID, // Include deviceUUID to ensure security rule compliance
        });
      });

      // Commit the batch
      await batch.commit();
      
      logEvent(AnalyticsEvents.ISSUE_REPORT_MARKED_AS_SEEN, {
        count: reportIds.length,
        source,
      });
      
      console.log('[IssueReportService] Marked', reportIds.length, 'reports as seen from', source);
    } catch (error) {
      console.error('[IssueReportService] Error marking reports as seen:', error);
      // Don't throw - this is not critical enough to fail the UI
    }
  }

  /**
   * Get reports that have been updated by admin but not yet seen by user
   * A report is considered "updated" if:
   * - It has an adminResponse or non-pending status
   * - AND either seenByUserAt is not set, or updatedAt is newer than seenByUserAt
   */
  async getUpdatedReports(): Promise<ReportedIssueDetails[]> {
    try {
      const reportIds = await this.getLocalReportIds();
      
      if (reportIds.length === 0) {
        return [];
      }
      
      // Fetch all reports from Firebase
      const allReports = await this.getReportedIssues(reportIds);
      
      // Get full report data from Firebase to check updatedAt timestamps
      const batchSize = 10;
      const batches: string[][] = [];
      
      for (let i = 0; i < reportIds.length; i += batchSize) {
        batches.push(reportIds.slice(i, i + batchSize));
      }

      const updatedReports: ReportedIssueDetails[] = [];

      for (const batch of batches) {
        const snapshot = await firestore()
          .collection(this.COLLECTION_NAME)
          .where(firestore.FieldPath.documentId(), 'in', batch)
          .get();

        snapshot.docs.forEach(doc => {
          const data = doc.data();
          
          // Check if report has admin updates
          const hasAdminUpdate = data.adminResponse || 
                                 (data.status && data.status !== 'pending');
          
          if (!hasAdminUpdate) {
            return; // Skip reports with no admin updates
          }

          // Check if user has seen the update
          const updatedAtTimestamp = data.updatedAt?.toMillis ? data.updatedAt.toMillis() : data.timestamp;
          const seenByUserAt = data.seenByUserAt || 0;
          
          // Report is "updated" if updatedAt is newer than when user last saw it
          if (updatedAtTimestamp > seenByUserAt) {
            updatedReports.push({
              id: doc.id,
              timestamp: data.timestamp,
              section: data.section,
              part: data.part,
              examId: data.examId,
              userFeedback: data.userFeedback,
              status: data.status || 'pending',
              displayStatus: this.mapStatusToDisplay(data.status || 'pending'),
              adminResponse: data.adminResponse,
              seenByUserAt: data.seenByUserAt,
              seenByUserSource: data.seenByUserSource,
            });
          }
        });
      }
      
      // Sort by timestamp (newest first)
      updatedReports.sort((a, b) => b.timestamp - a.timestamp);
      
      logEvent(AnalyticsEvents.ISSUE_REPORT_UPDATE_CHECK_COMPLETED, {
        totalReports: reportIds.length,
        updatedReportsFound: updatedReports.length,
      });
      
      if (updatedReports.length > 0) {
        logEvent(AnalyticsEvents.ISSUE_REPORT_UPDATES_FOUND, {
          count: updatedReports.length,
          statuses: updatedReports.map(r => r.status).join(','),
        });
      }
      
      console.log('[IssueReportService] Found', updatedReports.length, 'updated reports');
      return updatedReports;
    } catch (error) {
      console.error('[IssueReportService] Error getting updated reports:', error);
      return [];
    }
  }
}

export const issueReportService = new IssueReportService();

