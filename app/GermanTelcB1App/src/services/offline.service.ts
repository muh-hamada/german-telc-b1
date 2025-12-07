/**
 * Offline Service
 * 
 * Manages offline content downloading and storage for premium users.
 * Downloads Firestore documents and audio files for offline access.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { activeExamConfig } from '../config/active-exam.config';

// Storage keys
const STORAGE_KEYS = {
  OFFLINE_ENABLED: '@offline_enabled',
  LAST_DOWNLOAD_DATE: '@offline_last_download',
  EXAM_DATA: '@offline_exam_data',
  AUDIO_MANIFEST: '@offline_audio_manifest',
  DOWNLOAD_PROGRESS: '@offline_download_progress',
};

// Directory for downloaded audio files
const OFFLINE_AUDIO_DIR = `${RNFS.DocumentDirectoryPath}/offline_audio`;

export interface DownloadProgress {
  status: 'idle' | 'downloading' | 'completed' | 'error';
  totalItems: number;
  downloadedItems: number;
  currentItem: string;
  error?: string;
}

export interface OfflineStatus {
  isEnabled: boolean;
  isDownloaded: boolean;
  lastDownloadDate: number | null;
  storageUsedMB: number;
}

class OfflineService {
  private downloadProgress: DownloadProgress = {
    status: 'idle',
    totalItems: 0,
    downloadedItems: 0,
    currentItem: '',
  };
  private progressListeners: ((progress: DownloadProgress) => void)[] = [];

  /**
   * Initialize the offline service
   */
  async initialize(): Promise<void> {
    try {
      // Ensure audio directory exists
      const exists = await RNFS.exists(OFFLINE_AUDIO_DIR);
      if (!exists) {
        await RNFS.mkdir(OFFLINE_AUDIO_DIR);
      }
      console.log('[OfflineService] Initialized');
    } catch (error) {
      console.error('[OfflineService] Error initializing:', error);
    }
  }

  /**
   * Subscribe to download progress updates
   */
  onProgressUpdate(listener: (progress: DownloadProgress) => void): () => void {
    this.progressListeners.push(listener);
    return () => {
      this.progressListeners = this.progressListeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners of progress update
   */
  private notifyProgress(): void {
    this.progressListeners.forEach(listener => listener(this.downloadProgress));
  }

  /**
   * Get current offline status
   */
  async getOfflineStatus(): Promise<OfflineStatus> {
    try {
      const [isEnabled, lastDownloadStr, examData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_ENABLED),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_DOWNLOAD_DATE),
        AsyncStorage.getItem(STORAGE_KEYS.EXAM_DATA),
      ]);

      const isDownloaded = !!examData && examData !== '{}';
      const lastDownloadDate = lastDownloadStr ? parseInt(lastDownloadStr, 10) : null;

      // Calculate storage used
      const storageMB = await this.calculateStorageUsed();

      return {
        isEnabled: isEnabled === 'true',
        isDownloaded,
        lastDownloadDate,
        storageUsedMB: storageMB,
      };
    } catch (error) {
      console.error('[OfflineService] Error getting offline status:', error);
      return {
        isEnabled: false,
        isDownloaded: false,
        lastDownloadDate: null,
        storageUsedMB: 0,
      };
    }
  }

  /**
   * Calculate storage used by offline data
   */
  private async calculateStorageUsed(): Promise<number> {
    try {
      let totalBytes = 0;

      // Get exam data size
      const examData = await AsyncStorage.getItem(STORAGE_KEYS.EXAM_DATA);
      if (examData) {
        totalBytes += new Blob([examData]).size;
      }

      // Get audio files size
      const exists = await RNFS.exists(OFFLINE_AUDIO_DIR);
      if (exists) {
        const files = await RNFS.readDir(OFFLINE_AUDIO_DIR);
        for (const file of files) {
          totalBytes += file.size;
        }
      }

      return totalBytes / (1024 * 1024); // Convert to MB
    } catch (error) {
      console.error('[OfflineService] Error calculating storage:', error);
      return 0;
    }
  }

  /**
   * Enable offline mode and download all content
   */
  async enableOfflineMode(): Promise<boolean> {
    try {
      console.log('[OfflineService] Enabling offline mode...');
      
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_ENABLED, 'true');
      
      // Download all content
      const success = await this.downloadAllContent();
      
      if (success) {
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_DOWNLOAD_DATE, Date.now().toString());
      }
      
      return success;
    } catch (error) {
      console.error('[OfflineService] Error enabling offline mode:', error);
      return false;
    }
  }

  /**
   * Disable offline mode and clear downloaded content
   */
  async disableOfflineMode(): Promise<void> {
    try {
      console.log('[OfflineService] Disabling offline mode...');
      
      await this.clearOfflineData();
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_ENABLED, 'false');
      
      console.log('[OfflineService] Offline mode disabled');
    } catch (error) {
      console.error('[OfflineService] Error disabling offline mode:', error);
    }
  }

  /**
   * Download all content (exam data and audio files)
   */
  async downloadAllContent(): Promise<boolean> {
    try {
      this.downloadProgress = {
        status: 'downloading',
        totalItems: 0,
        downloadedItems: 0,
        currentItem: 'Preparing...',
      };
      this.notifyProgress();

      // Step 1: Download exam data from Firestore
      console.log('[OfflineService] Downloading exam data...');
      this.downloadProgress.currentItem = 'Downloading exam data...';
      this.notifyProgress();

      const examData = await this.downloadExamData();
      if (!examData) {
        throw new Error('Failed to download exam data');
      }

      // Step 2: Extract audio URLs from exam data and download
      console.log('[OfflineService] Downloading audio files...');
      const audioUrls = this.extractAudioUrls(examData);
      this.downloadProgress.totalItems = audioUrls.length;
      this.notifyProgress();

      for (let i = 0; i < audioUrls.length; i++) {
        const url = audioUrls[i];
        this.downloadProgress.currentItem = `Audio file ${i + 1}/${audioUrls.length}`;
        this.notifyProgress();

        await this.downloadAudioFile(url);
        this.downloadProgress.downloadedItems = i + 1;
        this.notifyProgress();
      }

      this.downloadProgress.status = 'completed';
      this.downloadProgress.currentItem = 'Download complete';
      this.notifyProgress();

      console.log('[OfflineService] All content downloaded successfully');
      return true;
    } catch (error) {
      console.error('[OfflineService] Error downloading content:', error);
      
      this.downloadProgress.status = 'error';
      this.downloadProgress.error = error instanceof Error ? error.message : 'Unknown error';
      this.notifyProgress();
      
      return false;
    }
  }

  /**
   * Download exam data from Firestore
   */
  private async downloadExamData(): Promise<Record<string, any> | null> {
    try {
      const collectionName = activeExamConfig.firebaseCollections.examData;
      const snapshot = await firestore().collection(collectionName).get();
      
      const examData: Record<string, any> = {};
      snapshot.docs.forEach(doc => {
        examData[doc.id] = doc.data();
      });

      // Also download vocabulary data if available
      try {
        const vocabCollection = activeExamConfig.firebaseCollections.vocabularyData;
        const vocabSnapshot = await firestore().collection(vocabCollection).get();
        examData['__vocabulary__'] = {};
        vocabSnapshot.docs.forEach(doc => {
          examData['__vocabulary__'][doc.id] = doc.data();
        });
      } catch (vocabError) {
        console.log('[OfflineService] No vocabulary data to download');
      }

      // Save to AsyncStorage
      await AsyncStorage.setItem(STORAGE_KEYS.EXAM_DATA, JSON.stringify(examData));
      
      console.log('[OfflineService] Exam data downloaded:', Object.keys(examData).length, 'documents');
      return examData;
    } catch (error) {
      console.error('[OfflineService] Error downloading exam data:', error);
      return null;
    }
  }

  /**
   * Extract audio URLs from exam data
   */
  private extractAudioUrls(examData: Record<string, any>): string[] {
    const urls: Set<string> = new Set();

    const extractFromObject = (obj: any) => {
      if (!obj) return;
      
      if (typeof obj === 'string') {
        // Check if it's an audio URL (Firebase Storage or MP3)
        if (obj.includes('firebasestorage.googleapis.com') && obj.includes('.mp3')) {
          urls.add(obj);
        }
      } else if (Array.isArray(obj)) {
        obj.forEach(extractFromObject);
      } else if (typeof obj === 'object') {
        Object.values(obj).forEach(extractFromObject);
      }
    };

    extractFromObject(examData);
    
    console.log('[OfflineService] Found', urls.size, 'audio URLs');
    return Array.from(urls);
  }

  /**
   * Download a single audio file
   */
  private async downloadAudioFile(url: string): Promise<void> {
    try {
      // Generate local filename from URL
      const filename = this.getFilenameFromUrl(url);
      const localPath = `${OFFLINE_AUDIO_DIR}/${filename}`;

      // Check if already downloaded
      const exists = await RNFS.exists(localPath);
      if (exists) {
        console.log('[OfflineService] Audio file already exists:', filename);
        return;
      }

      // Download the file
      await RNFS.downloadFile({
        fromUrl: url,
        toFile: localPath,
      }).promise;

      console.log('[OfflineService] Downloaded:', filename);
    } catch (error) {
      console.error('[OfflineService] Error downloading audio file:', url, error);
      // Don't throw - continue with other files
    }
  }

  /**
   * Generate a local filename from a URL
   */
  private getFilenameFromUrl(url: string): string {
    // Extract filename from URL and hash it for consistency
    const urlParts = url.split('/');
    const filename = urlParts[urlParts.length - 1].split('?')[0];
    
    // Create a simple hash of the URL for uniqueness
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return `${Math.abs(hash)}_${filename}`;
  }

  /**
   * Get local path for an audio URL
   * Returns the local file if downloaded, otherwise returns the original URL
   */
  async getLocalAudioPath(url: string): Promise<string> {
    try {
      const status = await this.getOfflineStatus();
      if (!status.isEnabled || !status.isDownloaded) {
        return url;
      }

      const filename = this.getFilenameFromUrl(url);
      const localPath = `${OFFLINE_AUDIO_DIR}/${filename}`;
      
      const exists = await RNFS.exists(localPath);
      if (exists) {
        return `file://${localPath}`;
      }
      
      return url;
    } catch (error) {
      console.error('[OfflineService] Error getting local audio path:', error);
      return url;
    }
  }

  /**
   * Get cached exam data
   */
  async getOfflineExamData(): Promise<Record<string, any> | null> {
    try {
      const status = await this.getOfflineStatus();
      if (!status.isEnabled || !status.isDownloaded) {
        return null;
      }

      const dataStr = await AsyncStorage.getItem(STORAGE_KEYS.EXAM_DATA);
      if (dataStr) {
        return JSON.parse(dataStr);
      }
      return null;
    } catch (error) {
      console.error('[OfflineService] Error getting offline exam data:', error);
      return null;
    }
  }

  /**
   * Clear all offline data
   */
  async clearOfflineData(): Promise<void> {
    try {
      // Clear AsyncStorage
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.EXAM_DATA,
        STORAGE_KEYS.AUDIO_MANIFEST,
        STORAGE_KEYS.LAST_DOWNLOAD_DATE,
        STORAGE_KEYS.DOWNLOAD_PROGRESS,
      ]);

      // Clear audio files
      const exists = await RNFS.exists(OFFLINE_AUDIO_DIR);
      if (exists) {
        await RNFS.unlink(OFFLINE_AUDIO_DIR);
        await RNFS.mkdir(OFFLINE_AUDIO_DIR);
      }

      console.log('[OfflineService] Offline data cleared');
    } catch (error) {
      console.error('[OfflineService] Error clearing offline data:', error);
    }
  }

  /**
   * Get current download progress
   */
  getDownloadProgress(): DownloadProgress {
    return { ...this.downloadProgress };
  }
}

const offlineService = new OfflineService();
export default offlineService;

