import React, { useState } from 'react';
import { toast } from 'react-toastify';
import './MigrationPanel.css';

// Import all JSON files from local data folder
import examInfoData from '../data/exam-info.json';
import grammarPart1Data from '../data/grammar-part1.json';
import grammarPart2Data from '../data/grammar-part2.json';
import listeningPart1Data from '../data/listening-part1.json';
import listeningPart2Data from '../data/listening-part2.json';
import listeningPart3Data from '../data/listening-part3.json';
import readingPart1Data from '../data/reading-part1.json';
import readingPart2Data from '../data/reading-part2.json';
import readingPart3Data from '../data/reading-part3.json';
import speakingPart1Data from '../data/speaking-part1.json';
import speakingPart2Data from '../data/speaking-part2.json';
import speakingPart3Data from '../data/speaking-part3.json';
import writingData from '../data/writing.json';
import { firestoreService } from '../services/firestore.service';

interface MigrationPanelProps {
  onComplete: () => void;
}

export const MigrationPanel: React.FC<MigrationPanelProps> = ({ onComplete }) => {
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);

  const dataFiles = [
    { id: 'exam-info', data: examInfoData },
    { id: 'grammar-part1', data: grammarPart1Data },
    { id: 'grammar-part2', data: grammarPart2Data },
    { id: 'listening-part1', data: listeningPart1Data },
    { id: 'listening-part2', data: listeningPart2Data },
    { id: 'listening-part3', data: listeningPart3Data },
    { id: 'reading-part1', data: readingPart1Data },
    { id: 'reading-part2', data: readingPart2Data },
    { id: 'reading-part3', data: readingPart3Data },
    { id: 'speaking-part1', data: speakingPart1Data },
    { id: 'speaking-part2', data: speakingPart2Data },
    { id: 'speaking-part3', data: speakingPart3Data },
    { id: 'writing', data: writingData },
  ];

  const handleMigration = async () => {
    if (!window.confirm('This will initialize the Firestore collection with data from local JSON files. Continue?')) {
      return;
    }

    setMigrating(true);
    setProgress([]);
    let successCount = 0;
    let errorCount = 0;

    for (const file of dataFiles) {
      try {
        setProgress(prev => [...prev, `Migrating ${file.id}...`]);
        await firestoreService.initializeDocument(file.id, file.data);
        setProgress(prev => [...prev, `✓ Successfully migrated ${file.id}`]);
        successCount++;
      } catch (error: any) {
        setProgress(prev => [...prev, `✗ Failed to migrate ${file.id}: ${error.message}`]);
        errorCount++;
      }
    }

    setProgress(prev => [
      ...prev,
      '',
      `Migration complete! Success: ${successCount}, Errors: ${errorCount}`,
    ]);

    setMigrating(false);
    
    if (errorCount === 0) {
      toast.success('All documents migrated successfully!');
      setTimeout(() => onComplete(), 2000);
    } else {
      toast.error(`Migration completed with ${errorCount} error(s)`);
    }
  };

  return (
    <div className="migration-panel">
      <h2>Data Migration</h2>
      <p>Initialize the Firestore collection with data from the React Native app's JSON files.</p>
      
      <button
        onClick={handleMigration}
        disabled={migrating}
        className="btn-migrate"
      >
        {migrating ? 'Migrating...' : 'Start Migration'}
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

