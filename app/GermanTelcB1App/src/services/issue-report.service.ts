import firestore from '@react-native-firebase/firestore';
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { activeExamConfig } from '../config/active-exam.config';

interface SubmitIssueReportParams {
  userId: string | null;
  examData: any;
  section: string;
  part: number;
  examId: number;
  userFeedback: string;
}

interface IssueReport {
  userId: string | null;
  timestamp: number;
  appId: string;
  platform: 'ios' | 'android';
  appVersion: string;
  section: string;
  part: number;
  examId: number;
  questionSnapshot: any;
  userFeedback: string;
  status: 'pending' | 'in_progress' | 'cannot_reproduce' | 'fixed' | 'not_a_bug';
  adminResponse?: string;
  createdAt: ReturnType<typeof firestore.FieldValue.serverTimestamp>;
  updatedAt: ReturnType<typeof firestore.FieldValue.serverTimestamp>;
}

export interface ReportedIssueDetails {
  id: string;
  timestamp: number;
  section: string;
  part: number;
  examId: number;
  userFeedback: string;
  status: 'pending' | 'in_progress' | 'cannot_reproduce' | 'fixed' | 'not_a_bug';
  displayStatus: 'pending' | 'in_progress' | 'resolved'; // Mapped status for display
  adminResponse?: string;
  updatedAt?: number; // For tracking updates
}

interface ReportMetadata {
  reportedAt: number;
  lastSeenAt: number;
}

interface ReportsMetadataStorage {
  [reportId: string]: ReportMetadata;
}

class IssueReportService {
  private readonly COLLECTION_NAME = 'issueReports';
  private readonly STORAGE_KEY = `reportedIssueIds_${activeExamConfig.id}`;
  private readonly METADATA_KEY = `reportedIssuesMetadata_${activeExamConfig.id}`;

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

      // Create the issue report document
      const issueReport: IssueReport = {
        userId,
        timestamp: Date.now(),
        appId: currentAppId,
        platform,
        appVersion,
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
   * Store a report ID with metadata in local storage
   */
  private async storeReportId(reportId: string): Promise<void> {
    try {
      const metadata = await this.getMetadataStorage();
      const now = Date.now();
      
      metadata[reportId] = {
        reportedAt: now,
        lastSeenAt: now,
      };
      
      await AsyncStorage.setItem(this.METADATA_KEY, JSON.stringify(metadata));
      console.log('[IssueReportService] Report ID stored with metadata:', reportId);
    } catch (error) {
      console.error('[IssueReportService] Error storing report ID:', error);
      // Don't throw - this is not critical enough to fail the whole operation
    }
  }

  /**
   * Get metadata storage object
   */
  private async getMetadataStorage(): Promise<ReportsMetadataStorage> {
    try {
      const stored = await AsyncStorage.getItem(this.METADATA_KEY);
      if (!stored) {
        // Try to migrate from old format
        return await this.migrateFromOldFormat();
      }
      return JSON.parse(stored) as ReportsMetadataStorage;
    } catch (error) {
      console.error('[IssueReportService] Error reading metadata storage:', error);
      return {};
    }
  }

  /**
   * Migrate from old array format to new metadata format
   */
  private async migrateFromOldFormat(): Promise<ReportsMetadataStorage> {
    try {
      const oldStored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!oldStored) {
        return {};
      }
      
      const oldIds = JSON.parse(oldStored);
      if (!Array.isArray(oldIds)) {
        return {};
      }
      
      // Convert old format to new format
      const now = Date.now();
      const metadata: ReportsMetadataStorage = {};
      
      oldIds.forEach(id => {
        metadata[id] = {
          reportedAt: now,
          lastSeenAt: now,
        };
      });
      
      // Save new format
      await AsyncStorage.setItem(this.METADATA_KEY, JSON.stringify(metadata));
      
      // Optionally remove old format
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      
      console.log('[IssueReportService] Migrated', oldIds.length, 'reports to new format');
      return metadata;
    } catch (error) {
      console.error('[IssueReportService] Error migrating from old format:', error);
      return {};
    }
  }

  /**
   * Get all locally stored report IDs
   */
  async getLocalReportIds(): Promise<string[]> {
    try {
      const metadata = await this.getMetadataStorage();
      return Object.keys(metadata);
    } catch (error) {
      console.error('[IssueReportService] Error reading report IDs:', error);
      return [];
    }
  }

  /**
   * Get metadata for a specific report
   */
  async getReportMetadata(reportId: string): Promise<ReportMetadata | null> {
    try {
      const metadata = await this.getMetadataStorage();
      return metadata[reportId] || null;
    } catch (error) {
      console.error('[IssueReportService] Error reading report metadata:', error);
      return null;
    }
  }

  /**
   * Update lastSeenAt for multiple reports
   */
  async updateLastSeenAt(reportIds: string[]): Promise<void> {
    try {
      const metadata = await this.getMetadataStorage();
      const now = Date.now();
      
      reportIds.forEach(id => {
        if (metadata[id]) {
          metadata[id].lastSeenAt = now;
        }
      });
      
      await AsyncStorage.setItem(this.METADATA_KEY, JSON.stringify(metadata));
      console.log('[IssueReportService] Updated lastSeenAt for', reportIds.length, 'reports');
    } catch (error) {
      console.error('[IssueReportService] Error updating lastSeenAt:', error);
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
            updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : data.timestamp,
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
   * Get updated reports (reports that have been updated since last seen)
   */
  async getUpdatedReports(): Promise<ReportedIssueDetails[]> {
    try {
      const metadata = await this.getMetadataStorage();
      const reportIds = Object.keys(metadata);
      
      if (reportIds.length === 0) {
        return [];
      }
      
      // Fetch all reports from Firebase
      const allReports = await this.getReportedIssues(reportIds);
      
      // Filter reports that have been updated since lastSeenAt
      const updatedReports = allReports.filter(report => {
        const meta = metadata[report.id];
        if (!meta) return false;
        
        // Check if report has been updated after lastSeenAt
        const updatedAt = report.updatedAt || report.timestamp;
        console.log('[IssueReportService] Updated at:', updatedAt, 'Last seen at:', meta.lastSeenAt);
        return updatedAt > meta.lastSeenAt;
      });
      
      console.log('[IssueReportService] Found', updatedReports.length, 'updated reports');
      return updatedReports;
    } catch (error) {
      console.error('[IssueReportService] Error getting updated reports:', error);
      return [];
    }
  }
}

export const issueReportService = new IssueReportService();

