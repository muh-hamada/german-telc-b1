import React, { useState } from 'react';
import { toast } from 'react-toastify';
import './MigrationPanel.css';
import { useParams } from 'react-router-dom';
import { getAppConfig } from '../config/apps.config';
import { firestoreService } from '../services/firestore.service';
import { appDataMap } from '../data/data-files';

interface MigrationPanelProps {
  onComplete: () => void;
}

export const MigrationPanel: React.FC<MigrationPanelProps> = ({ onComplete }) => {
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const { appId } = useParams<{ appId: string }>();
  const appConfig = getAppConfig(appId || '');
  const data = appDataMap[appConfig?.id || ''];

  const dataFiles = data ? Object.entries(data).map(([key, value]) => ({
    id: key,
    data: value,
  })) : [];

  // Initialize all files as selected
  React.useEffect(() => {
    if (dataFiles.length > 0) {
      setSelectedFiles(new Set());
    }
  }, [dataFiles.length]);

  if (!data) {
    return <div className="migration-panel">
      <p className="no-data">Data not found</p>
    </div>;
  }

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedFiles.size === dataFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(dataFiles.map(f => f.id)));
    }
  };

  const handleMigration = async () => {
    if (selectedFiles.size === 0) {
      toast.error('Please select at least one file to migrate');
      return;
    }

    if (!window.confirm(`This will migrate ${selectedFiles.size} file(s) to the Firestore collection. Continue?`)) {
      return;
    }

    setMigrating(true);
    setProgress([]);
    let successCount = 0;
    let errorCount = 0;

    const filesToMigrate = dataFiles.filter(f => selectedFiles.has(f.id));

    for (const file of filesToMigrate) {
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
      <p>Select which files to migrate to the Firestore collection.</p>
      
      <div className="file-selection">
        <div className="file-selection-header">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={selectedFiles.size === dataFiles.length}
              onChange={toggleSelectAll}
              disabled={migrating}
            />
            <span>Select All ({selectedFiles.size}/{dataFiles.length} selected)</span>
          </label>
        </div>

        <div className="file-list">
          {dataFiles.map(file => (
            <label key={file.id} className="checkbox-label file-item">
              <input
                type="checkbox"
                checked={selectedFiles.has(file.id)}
                onChange={() => toggleFileSelection(file.id)}
                disabled={migrating}
              />
              <span className="file-name">{file.id}</span>
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={handleMigration}
        disabled={migrating || selectedFiles.size === 0}
        className="btn-migrate"
      >
        {migrating ? 'Migrating...' : `Migrate ${selectedFiles.size} File${selectedFiles.size !== 1 ? 's' : ''}`}
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

