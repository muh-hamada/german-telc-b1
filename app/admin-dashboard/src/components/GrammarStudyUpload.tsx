import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { firestoreService } from '../services/firestore.service';
import grammarStudyQuestionsData from '../data/german-b1/grammer-study-questions.json';
import './MigrationPanel.css';

interface GrammarStudyUploadProps {
  onComplete: () => void;
}

export const GrammarStudyUpload: React.FC<GrammarStudyUploadProps> = ({ onComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);
  const [documentExists, setDocumentExists] = useState<boolean>(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    checkDocumentStatus();
  }, []);

  const checkDocumentStatus = async () => {
    try {
      setCheckingStatus(true);
      const doc = await firestoreService.getDocument('grammar-study-questions');
      setDocumentExists(!!doc);
    } catch (error) {
      // Document doesn't exist
      setDocumentExists(false);
    } finally {
      setCheckingStatus(false);
    }
  };

  const calculateMetadata = (data: any[]) => {
    let totalQuestions = 0;
    data.forEach((group: any) => {
      if (group.sentences && Array.isArray(group.sentences)) {
        totalQuestions += group.sentences.length;
      }
    });

    return {
      version: '1.0',
      totalGroups: data.length,
      totalQuestions,
      lastUpdated: new Date().toISOString(),
    };
  };

  const handleUpload = async () => {
    if (documentExists) {
      if (!window.confirm('Grammar study questions already exist in Firebase. Do you want to overwrite them?')) {
        return;
      }
    } else {
      if (!window.confirm('This will upload the grammar study questions to Firebase. Continue?')) {
        return;
      }
    }

    setUploading(true);
    setProgress([]);

    try {
      setProgress(prev => [...prev, 'Preparing data...']);
      
      // Transform data structure - wrap array in object with metadata
      const metadata = calculateMetadata(grammarStudyQuestionsData);
      const wrappedData = {
        data: grammarStudyQuestionsData,
        metadata,
      };

      setProgress(prev => [
        ...prev,
        `Total groups: ${metadata.totalGroups}`,
        `Total questions: ${metadata.totalQuestions}`,
        'Uploading to Firebase...'
      ]);

      // Upload to Firebase
      await firestoreService.initializeDocument('grammar-study-questions', wrappedData);

      setProgress(prev => [
        ...prev,
        '✓ Successfully uploaded grammar study questions',
        '',
        'Upload complete!'
      ]);

      toast.success('Grammar study questions uploaded successfully!');
      setDocumentExists(true);
      
      setTimeout(() => onComplete(), 2000);
    } catch (error: any) {
      setProgress(prev => [
        ...prev,
        `✗ Failed to upload: ${error.message}`,
      ]);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="migration-panel">
        <h3>Grammar Study Questions</h3>
        <p>Checking document status...</p>
      </div>
    );
  }

  return (
    <div className="migration-panel">
      <h3>Grammar Study Questions</h3>
      <p>
        {documentExists ? (
          <>
            <span style={{ color: '#4caf50', fontWeight: 'bold' }}>✓ Document exists in Firebase</span>
            <br />
            You can edit it or re-upload to overwrite the existing data.
          </>
        ) : (
          <>
            <span style={{ color: '#ff9800', fontWeight: 'bold' }}>⚠ Document not found in Firebase</span>
            <br />
            Upload the grammar study questions to Firebase to enable mobile app access.
          </>
        )}
      </p>

      <button
        onClick={handleUpload}
        disabled={uploading}
        className="btn-migrate"
      >
        {uploading ? 'Uploading...' : documentExists ? 'Re-upload Data' : 'Upload Data'}
      </button>

      {progress.length > 0 && (
        <div className="migration-log">
          {progress.map((line, index) => (
            <div key={index} className="log-line">
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
