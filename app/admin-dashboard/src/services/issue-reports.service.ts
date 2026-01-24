import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  doc, 
  updateDoc, 
  Timestamp,
  where,
} from 'firebase/firestore';
import { firebaseService } from './firebase.service';

export interface IssueReport {
  id: string;
  userId: string | null;
  timestamp: number;
  appId: string;
  platform: 'ios' | 'android';
  appVersion: string;
  deviceUUID?: string;
  section: string;
  part: number;
  examId: string;
  questionSnapshot: any;
  userFeedback: string;
  status: 'pending' | 'in_progress' | 'cannot_reproduce' | 'fixed' | 'not_a_bug';
  createdAt: Timestamp | Date;
  internalComments?: string;
  adminResponse?: string;
  seenByUserAt?: number;
  seenByUserSource?: 'modal' | 'screen';
  updatedAt?: Timestamp | Date;
}

export interface IssueReportFilters {
  appId?: string;
  status?: string;
  platform?: string;
}

class IssueReportsService {
  private readonly COLLECTION_NAME = 'issueReports';
  private db = firebaseService.getFirestore();

  /**
   * Fetch all issue reports from Firestore
   */
  async getAllIssueReports(filters?: IssueReportFilters): Promise<IssueReport[]> {
    try {
      const collectionRef = collection(this.db, this.COLLECTION_NAME);
      
      // Build query with filters
      let q = query(collectionRef, orderBy('timestamp', 'desc'));
      
      if (filters?.appId) {
        q = query(collectionRef, where('appId', '==', filters.appId), orderBy('timestamp', 'desc'));
      }
      
      if (filters?.status) {
        q = query(collectionRef, where('status', '==', filters.status), orderBy('timestamp', 'desc'));
      }
      
      if (filters?.platform) {
        q = query(collectionRef, where('platform', '==', filters.platform), orderBy('timestamp', 'desc'));
      }

      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as IssueReport[];
    } catch (error) {
      console.error('Error fetching issue reports:', error);
      throw new Error('Failed to fetch issue reports');
    }
  }

  /**
   * Update an issue report's status, internal comments, and/or admin response
   */
  async updateIssueReport(
    reportId: string, 
    updates: {
      status?: IssueReport['status'];
      internalComments?: string;
      adminResponse?: string;
    }
  ): Promise<void> {
    try {
      const reportRef = doc(this.db, this.COLLECTION_NAME, reportId);
      
      await updateDoc(reportRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
      
      console.log(`Issue report ${reportId} updated successfully`);
    } catch (error) {
      console.error('Error updating issue report:', error);
      throw new Error('Failed to update issue report');
    }
  }

  /**
   * Get count of reports by status
   */
  async getReportCounts(): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    cannotReproduce: number;
    fixed: number;
    notABug: number;
  }> {
    try {
      const reports = await this.getAllIssueReports();
      
      return {
        total: reports.length,
        pending: reports.filter(r => r.status === 'pending').length,
        inProgress: reports.filter(r => r.status === 'in_progress').length,
        cannotReproduce: reports.filter(r => r.status === 'cannot_reproduce').length,
        fixed: reports.filter(r => r.status === 'fixed').length,
        notABug: reports.filter(r => r.status === 'not_a_bug').length,
      };
    } catch (error) {
      console.error('Error getting report counts:', error);
      throw error;
    }
  }
}

export const issueReportsService = new IssueReportsService();

