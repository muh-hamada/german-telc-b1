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
import i18n from '../utils/i18n';

// Storage keys
const STORAGE_KEYS = {
  OFFLINE_ENABLED: '@offline_enabled',
  LAST_DOWNLOAD_DATE: '@offline_last_download',
  EXAM_DATA: '@offline_exam_data',
  AUDIO_MANIFEST: '@offline_audio_manifest',
  DOWNLOAD_PROGRESS: '@offline_download_progress',
};

const progressMessageLocalizations: Record<string, Record<string, string>> = {
  en: {
    preparing: 'Preparing...',
    downloadingExamData: 'Downloading exam data...',
    downloadingAudioFiles: 'Downloading audio files...',
    completed: 'Download complete',
    progressMessage: 'File {{current}}/{{total}}',
  },
  de: {
    preparing: 'Vorbereitung...',
    downloadingExamData: 'Prüfungsdaten herunterladen...',
    downloadingAudioFiles: 'Audiodateien herunterladen...',
    completed: 'Herunterladen abgeschlossen',
    progressMessage: 'Datei {{current}}/{{total}}',
  },
  es: {
    preparing: 'Preparando...',
    downloadingExamData: 'Descargando datos del examen...',
    downloadingAudioFiles: 'Descargando archivos de audio...',
    completed: 'Descarga completada',
    progressMessage: 'Archivo {{current}}/{{total}}',
  },
  fr: {
    preparing: 'Préparation...',
    downloadingExamData: 'Téléchargement des données de l\'examen...',
    downloadingAudioFiles: 'Téléchargement des fichiers audio...',
    completed: 'Téléchargement terminé',
    progressMessage: 'Fichier {{current}}/{{total}}',
  },
  it: {
    preparing: 'Preparazione...',
    downloadingExamData: 'Download dei dati dell\'esame...',
    downloadingAudioFiles: 'Download dei file audio...',
    completed: 'Download completato',
    progressMessage: 'File {{current}}/{{total}}',
  },
  pt: {
    preparing: 'Preparando...',
    downloadingExamData: 'Download dos dados do exame...',
    downloadingAudioFiles: 'Download dos arquivos de áudio...',
    completed: 'Download concluído',
    progressMessage: 'Arquivo {{current}}/{{total}}',
  },
  ru: {
    preparing: 'Подготовка...',
    downloadingExamData: 'Загрузка данных экзамена...',
    downloadingAudioFiles: 'Загрузка аудио файлов...',
    completed: 'Загрузка завершена',
    progressMessage: 'Файл {{current}}/{{total}}',
  },
  'ar': {
    preparing: 'جاري التحميل...',
    downloadingExamData: 'جاري تحميل بيانات الامتحان...',
    downloadingAudioFiles: 'جاري تحميل ملفات الصوت...',
    completed: 'تحميل مكتمل',
    progressMessage: 'ملف {{current}}/{{total}}',
  },
};

// Directory for downloaded audio files
const OFFLINE_AUDIO_DIR = `${RNFS.DocumentDirectoryPath}/offline_audio`;
// File path for exam data
const OFFLINE_DATA_FILE = `${RNFS.DocumentDirectoryPath}/offline_data.json`;

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
    // Create a copy to ensure React detects state changes
    const progressCopy = { ...this.downloadProgress };
    this.progressListeners.forEach(listener => listener(progressCopy));
  }

  /**
   * Get current offline status
   */
  async getOfflineStatus(): Promise<OfflineStatus> {
    try {
      const [isEnabled, lastDownloadStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_ENABLED),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_DOWNLOAD_DATE),
      ]);

      const dataExists = await RNFS.exists(OFFLINE_DATA_FILE);
      const isDownloaded = dataExists;
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
      const dataExists = await RNFS.exists(OFFLINE_DATA_FILE);
      if (dataExists) {
        const stat = await RNFS.stat(OFFLINE_DATA_FILE);
        totalBytes += stat.size;
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
      const lang = i18n.language || 'en';
      const messages = progressMessageLocalizations[lang] || progressMessageLocalizations['en'];

      this.downloadProgress = {
        status: 'downloading',
        totalItems: 0,
        downloadedItems: 0,
        currentItem: messages.preparing,
      };
      this.notifyProgress();

      // Step 1: Download exam data from Firestore
      console.log('[OfflineService] Downloading exam data...');
      this.downloadProgress.currentItem = messages.downloadingExamData;
      this.notifyProgress();

      const examData = await this.downloadExamData();
      if (!examData) {
        throw new Error('Failed to download exam data');
      }

      const examDataDocsCount = Object.keys(examData).length;

      // Step 2: Extract audio URLs from exam data and download
      console.log('[OfflineService] Downloading audio files...');
      const audioUrls = this.extractAudioUrls(examData);
      
      // Total items = exam data docs count + audio files count
      this.downloadProgress.totalItems = examDataDocsCount + audioUrls.length;
      // We consider the exam docs "downloaded" now since we fetched them all in one batch above
      this.downloadProgress.downloadedItems = examDataDocsCount;
      this.notifyProgress();

      for (let i = 0; i < audioUrls.length; i++) {
        const url = audioUrls[i];
        this.downloadProgress.currentItem = messages.progressMessage
          .replace('{{current}}',  this.downloadProgress.downloadedItems.toString())
          .replace('{{total}}', this.downloadProgress.totalItems.toString());
        this.notifyProgress();

        await this.downloadAudioFile(url);
        
        this.downloadProgress.downloadedItems = examDataDocsCount + i + 1;
        this.notifyProgress();
      }

      this.downloadProgress.status = 'completed';
      this.downloadProgress.currentItem = messages.completed;
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

      // Save to File instead of AsyncStorage
      await RNFS.writeFile(OFFLINE_DATA_FILE, JSON.stringify(examData), 'utf8');
      
      console.log('[OfflineService] Exam data downloaded:', Object.keys(examData).length, 'documents');
      // Update progress for documents
      this.downloadProgress.downloadedItems = Object.keys(examData).length;
      this.notifyProgress();

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
      // Ensure audio directory exists
      const dirExists = await RNFS.exists(OFFLINE_AUDIO_DIR);
      if (!dirExists) {
        await RNFS.mkdir(OFFLINE_AUDIO_DIR);
      }

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
      console.log('[OfflineService] Status:', status);
      console.log('[OfflineService] Is enabled:', status.isEnabled);
      console.log('[OfflineService] Is downloaded:', status.isDownloaded);
      console.log('[OfflineService] URL:', url);
      if (!status.isEnabled || !status.isDownloaded) {
        return url;
      }

      const filename = this.getFilenameFromUrl(url);
      console.log('[OfflineService] Filename:', filename);
      const localPath = `${OFFLINE_AUDIO_DIR}/${filename}`;
      console.log('[OfflineService] Local path:', localPath);
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

      const exists = await RNFS.exists(OFFLINE_DATA_FILE);
      if (exists) {
        const dataStr = await RNFS.readFile(OFFLINE_DATA_FILE, 'utf8');
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
        STORAGE_KEYS.AUDIO_MANIFEST,
        STORAGE_KEYS.LAST_DOWNLOAD_DATE,
        STORAGE_KEYS.DOWNLOAD_PROGRESS,
      ]);
      // Remove old EXAM_DATA if it exists in AsyncStorage
      await AsyncStorage.removeItem(STORAGE_KEYS.EXAM_DATA);

      // Clear data file
      const dataExists = await RNFS.exists(OFFLINE_DATA_FILE);
      if (dataExists) {
        await RNFS.unlink(OFFLINE_DATA_FILE);
      }

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

