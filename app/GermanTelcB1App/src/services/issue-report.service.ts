import firestore from '@react-native-firebase/firestore';
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
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
  status: 'pending';
  createdAt: ReturnType<typeof firestore.FieldValue.serverTimestamp>;
}

class IssueReportService {
  private readonly COLLECTION_NAME = 'issueReports';

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
      };

      // Write to Firestore
      await firestore()
        .collection(this.COLLECTION_NAME)
        .add(issueReport);

      console.log('[IssueReportService] Issue report submitted successfully', {
        section,
        part,
        examId,
        userId: userId || 'anonymous',
      });
    } catch (error) {
      console.error('[IssueReportService] Error submitting issue report:', error);
      throw error;
    }
  }
}

export const issueReportService = new IssueReportService();

