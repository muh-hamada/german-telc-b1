import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, doc, setDoc, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';
import { firebaseService } from '../services/firebase.service';
import { getAllAppConfigs, AppConfig } from '../config/apps.config';
import { toast } from 'react-toastify';
import './VocabularyUploadPage.css';

interface VocabularyWord {
  id?: number;
  word: string;
  article?: string;
  translations: {
    en?: string;
    es?: string;
    fr?: string;
    ru?: string;
    ar?: string;
    de?: string;
  };
  type: string;
  exampleSentences: Array<{
    text: string;
    translations: {
      en?: string;
      es?: string;
      fr?: string;
      ru?: string;
      ar?: string;
      de?: string;
    };
  }>;
}

const VOCABULARY_COLLECTION_PREFIX = 'vocabulary_data_';

export const VocabularyUploadPage: React.FC = () => {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedApp, setSelectedApp] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cleanData, setCleanData] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<string[]>([]);
  const [vocabularyData, setVocabularyData] = useState<VocabularyWord[]>([]);
  const [existingWordsCount, setExistingWordsCount] = useState<number>(0);

  const appConfigs = getAllAppConfigs();

  const getVocabularyCollectionName = (appId: string): string => {
    const app = appConfigs.find(a => a.id === appId);
    if (!app) return '';
    
    // Map to vocabulary level
    // German B1/B2 -> A1/B2, English B1 -> A1
    const vocabLevel = app.level === 'B1' ? 'a1' : app.level.toLowerCase();
    return `${VOCABULARY_COLLECTION_PREFIX}${app.language}_${vocabLevel}`;
  };

  const handleAppChange = async (appId: string) => {
    setSelectedApp(appId);
    setProgress([]);
    
    // Check existing words count
    if (appId) {
      await checkExistingWords(appId);
    }
  };

  const checkExistingWords = async (appId: string) => {
    try {
      const collectionName = getVocabularyCollectionName(appId);
      const db = firebaseService.getFirestore();
      const colRef = collection(db, collectionName);
      const snapshot = await getDocs(colRef);
      setExistingWordsCount(snapshot.size);
      
      if (snapshot.size > 0) {
        setProgress([`ℹ️  Found ${snapshot.size} existing words in ${collectionName}`]);
      } else {
        setProgress([`ℹ️  Collection ${collectionName} is empty`]);
      }
    } catch (error: any) {
      console.error('Error checking existing words:', error);
      setExistingWordsCount(0);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error('Please select a JSON file');
      return;
    }

    setSelectedFile(file);
    
    // Read and parse the file
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        if (!Array.isArray(data)) {
          toast.error('Invalid format: JSON must be an array of vocabulary words');
          setSelectedFile(null);
          return;
        }

        // Validate structure
        const isValid = data.every((word: any) => 
          word.word && 
          word.translations && 
          word.type
        );

        if (!isValid) {
          toast.error('Invalid format: Each word must have word, translations, and type fields');
          setSelectedFile(null);
          return;
        }

        setVocabularyData(data);
        setProgress(prev => [...prev, `📄 Loaded ${data.length} words from file`]);
        toast.success(`File loaded: ${data.length} words found`);
      } catch (error: any) {
        toast.error(`Failed to parse JSON: ${error.message}`);
        setSelectedFile(null);
      }
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (!selectedApp) {
      toast.error('Please select an app');
      return;
    }

    if (!selectedFile || vocabularyData.length === 0) {
      toast.error('Please select a valid JSON file');
      return;
    }

    const collectionName = getVocabularyCollectionName(selectedApp);
    const actionText = cleanData ? 'clean and upload' : 'append';
    
    if (!window.confirm(
      `Are you sure you want to ${actionText} ${vocabularyData.length} words to ${collectionName}?\n\n` +
      (cleanData ? '⚠️  This will DELETE all existing words first!' : 'This will add to existing words.')
    )) {
      return;
    }

    setUploading(true);
    setProgress([]);

    try {
      const db = firebaseService.getFirestore();
      const colRef = collection(db, collectionName);

      // Step 1: Clean existing data if requested
      if (cleanData) {
        setProgress(prev => [...prev, '🗑️  Cleaning existing data...']);
        const snapshot = await getDocs(colRef);
        const batch = writeBatch(db);
        
        snapshot.docs.forEach((document) => {
          batch.delete(document.ref);
        });

        await batch.commit();
        setProgress(prev => [...prev, `✓ Deleted ${snapshot.size} existing words`]);
      }

      // Step 2: Upload words (Firebase will auto-generate document IDs)
      setProgress(prev => [...prev, `📤 Uploading ${vocabularyData.length} words...`]);

      // Step 3: Upload words in batches (500 per batch - Firestore limit)
      const batchSize = 500;
      let uploadedCount = 0;

      for (let i = 0; i < vocabularyData.length; i += batchSize) {
        const batch = writeBatch(db);
        const batchWords = vocabularyData.slice(i, i + batchSize);

        batchWords.forEach((word) => {
          // Let Firebase auto-generate the document ID
          const docRef = doc(colRef);
          batch.set(docRef, word);
        });

        await batch.commit();
        uploadedCount += batchWords.length;

        setProgress(prev => [
          ...prev,
          `✓ Uploaded batch ${Math.floor(i / batchSize) + 1}: ${uploadedCount}/${vocabularyData.length} words`
        ]);
      }

      setProgress(prev => [
        ...prev,
        '',
        `🎉 Successfully uploaded ${uploadedCount} words to ${collectionName}`,
        `ℹ️  Firebase auto-generated document IDs for all words`,
        '',
        'Upload complete!'
      ]);

      toast.success(`Successfully uploaded ${uploadedCount} words!`);
      
      // Refresh existing words count
      await checkExistingWords(selectedApp);
      
      // Reset form
      setSelectedFile(null);
      setVocabularyData([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error: any) {
      setProgress(prev => [
        ...prev,
        `❌ Failed to upload: ${error.message}`,
      ]);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error: any) {
      toast.error('Failed to logout');
    }
  };

  return (
    <div className="vocabulary-upload-page">
      <header className="dashboard-header">
        <div className="header-left">
          <Link to="/apps" className="back-link">← Back to Apps</Link>
          <h1>Vocabulary Upload</h1>
        </div>
        <div className="header-right">
          <span className="user-email">{currentUser?.email}</span>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </header>

      <div className="vocabulary-upload-container">
        <div className="upload-section">
          <div className="section-header">
            <h2>Upload Vocabulary Data</h2>
            <p className="section-description">
              Upload vocabulary words from a JSON file to Firebase. Select an app, choose your file, 
              and decide whether to clean existing data or append to it.
            </p>
          </div>

          {/* App Selection */}
          <div className="form-group">
            <label htmlFor="app-select">Select App</label>
            <select
              id="app-select"
              value={selectedApp}
              onChange={(e) => handleAppChange(e.target.value)}
              disabled={uploading}
              className="form-select"
            >
              <option value="">-- Select an App --</option>
              {appConfigs.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.displayName} ({app.language} {app.level})
                </option>
              ))}
            </select>
            {selectedApp && (
              <div className="collection-info">
                <strong>Collection:</strong> {getVocabularyCollectionName(selectedApp)}
                {existingWordsCount > 0 && (
                  <span className="existing-words-badge">
                    {existingWordsCount} words exist
                  </span>
                )}
              </div>
            )}
          </div>

          {/* File Selection */}
          <div className="form-group">
            <label htmlFor="file-input">Select JSON File</label>
            <input
              ref={fileInputRef}
              id="file-input"
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              disabled={uploading || !selectedApp}
              className="form-file-input"
            />
            {selectedFile && (
              <div className="file-info">
                <span className="file-icon">📄</span>
                <span className="file-name">{selectedFile.name}</span>
                <span className="word-count">{vocabularyData.length} words</span>
              </div>
            )}
          </div>

          {/* Clean Data Checkbox */}
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={cleanData}
                onChange={(e) => setCleanData(e.target.checked)}
                disabled={uploading || !selectedApp}
              />
              <span className="checkbox-text">
                Clean existing data before upload
                {cleanData && (
                  <span className="warning-text"> (⚠️  This will delete all existing words!)</span>
                )}
              </span>
            </label>
          </div>

          {/* Upload Button */}
          <div className="form-actions">
            <button
              onClick={handleUpload}
              disabled={uploading || !selectedApp || !selectedFile || vocabularyData.length === 0}
              className="btn-upload"
            >
              {uploading ? (
                <>
                  <span className="spinner"></span>
                  Uploading...
                </>
              ) : (
                <>Upload {vocabularyData.length} Words</>
              )}
            </button>
          </div>

          {/* Progress Log */}
          {progress.length > 0 && (
            <div className="progress-log">
              <h3>Upload Progress</h3>
              <div className="log-content">
                {progress.map((line, index) => (
                  <div key={index} className="log-line">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Instructions Panel */}
        <div className="instructions-panel">
          <h3>📋 Instructions</h3>
          
          <div className="instruction-section">
            <h4>JSON Format</h4>
            <p>The JSON file should be an array of vocabulary word objects:</p>
            <pre>{`[
  {
    "id": 1,
    "word": "Hallo",
    "article": "",
    "translations": {
      "en": "hello",
      "es": "hola",
      "fr": "bonjour"
    },
    "type": "interjection",
    "exampleSentences": [
      {
        "text": "Hallo! Wie geht's?",
        "translations": {
          "en": "Hello! How are you?"
        }
      }
    ]
  }
]`}</pre>
          </div>

          <div className="instruction-section">
            <h4>Required Fields</h4>
            <ul>
              <li><code>word</code> - The vocabulary word</li>
              <li><code>translations</code> - Object with language codes (en, es, fr, ru, ar, de)</li>
              <li><code>type</code> - Word type (noun, verb, adjective, etc.)</li>
              <li><code>exampleSentences</code> - Array of example sentences</li>
            </ul>
          </div>

          <div className="instruction-section">
            <h4>Optional Fields</h4>
            <ul>
              <li><code>id</code> - Word ID (auto-generated if not provided)</li>
              <li><code>article</code> - For nouns (der, die, das)</li>
            </ul>
          </div>

          <div className="instruction-section">
            <h4>Upload Options</h4>
            <ul>
              <li><strong>Append:</strong> Add new words to existing collection</li>
              <li><strong>Clean:</strong> Delete all existing words before uploading</li>
            </ul>
          </div>

          <div className="warning-box">
            <strong>⚠️  Warning:</strong> The clean option will permanently delete all existing 
            vocabulary words in the selected collection. Use with caution!
          </div>
        </div>
      </div>
    </div>
  );
};

