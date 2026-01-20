import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { firestoreService } from '../services/firestore.service';
import { getAppConfig, AppConfig } from '../config/apps.config';
import { validateDocument } from '../utils/validators';
import { toast } from 'react-toastify';
import './EditorPage.css';

export const EditorPage: React.FC = () => {
  const { appId, documentId } = useParams<{ appId: string; documentId: string }>();
  const navigate = useNavigate();
  
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isErrorsExpanded, setIsErrorsExpanded] = useState(true);
  
  const editorRef = useRef<any>(null);

  const loadDocument = useCallback(async () => {
    if (!documentId) return;

    try {
      setLoading(true);
      const data = await firestoreService.getDocument(documentId);
      const jsonString = JSON.stringify(data, null, 2);
      setContent(jsonString);
      setOriginalContent(jsonString);
      setHasChanges(false);
      setValidationErrors([]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load document');
      navigate(`/dashboard/${appId}`);
    } finally {
      setLoading(false);
    }
  }, [documentId, appId, navigate]);

  useEffect(() => {
    // Validate and load app config
    if (!appId) {
      toast.error('No app selected');
      navigate('/apps');
      return;
    }

    try {
      const config = getAppConfig(appId);
      setAppConfig(config);
      // Set the Firestore collection for this app
      firestoreService.setCollection(config.collectionName);
      
      if (documentId) {
        loadDocument();
      }
    } catch (error: any) {
      toast.error(error.message || 'Invalid app configuration');
      navigate('/apps');
    }
  }, [appId, documentId, navigate, loadDocument]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setContent(value);
      setHasChanges(value !== originalContent);
      
      // Clear previous validation errors when editing
      if (validationErrors.length > 0) {
        setValidationErrors([]);
      }
    }
  };

  const handleValidate = () => {
    try {
      const parsedData = JSON.parse(content);
      const level = (appConfig?.level || 'B1') as 'B1' | 'B2' | 'A1';
      const validation = validateDocument(documentId!, parsedData, level);
      
      if (validation.valid) {
        toast.success('Validation passed! No errors found.');
        setValidationErrors([]);
      } else {
        toast.error(`Validation failed with ${validation.errors.length} error(s)`);
        setValidationErrors(validation.errors);
        setIsErrorsExpanded(true); // Auto-expand when new errors are found
      }
    } catch (error: any) {
      toast.error('Invalid JSON syntax');
      setValidationErrors(['Invalid JSON syntax: ' + error.message]);
      setIsErrorsExpanded(true); // Auto-expand when new errors are found
    }
  };

  const handleSave = async () => {
    if (!documentId) return;

    try {
      // First validate JSON syntax
      let parsedData;
      try {
        parsedData = JSON.parse(content);
      } catch (error: any) {
        toast.error('Cannot save: Invalid JSON syntax');
        setValidationErrors(['Invalid JSON syntax: ' + error.message]);
        return;
      }

      // Validate structure
      const level = (appConfig?.level || 'B1') as 'B1' | 'B2';
      const validation = validateDocument(documentId, parsedData, level);
      if (!validation.valid) {
        toast.error('Cannot save: Validation failed');
        setValidationErrors(validation.errors);
        return;
      }

      // Save to Firestore
      setSaving(true);
      await firestoreService.saveDocument(documentId, parsedData);
      
      toast.success('Document saved successfully!');
      setOriginalContent(content);
      setHasChanges(false);
      setValidationErrors([]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (!window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        return;
      }
    }
    navigate(`/dashboard/${appId}`);
  };

  const handleFormat = () => {
    try {
      const parsedData = JSON.parse(content);
      const formatted = JSON.stringify(parsedData, null, 2);
      setContent(formatted);
      toast.success('JSON formatted successfully');
    } catch (error) {
      toast.error('Cannot format: Invalid JSON syntax');
    }
  };

  const handleEditorMount = (editor: any) => {
    editorRef.current = editor;
  };

  if (loading || !appConfig) {
    return (
      <div className="editor-container">
        <div className="loading-state">Loading document...</div>
      </div>
    );
  }

  return (
    <div className="editor-container">
      <header className="editor-header">
        <div>
          <div className="breadcrumb">
            <Link to="/apps" className="breadcrumb-link">← All Apps</Link>
            <span className="breadcrumb-separator">/</span>
            <Link to={`/dashboard/${appId}`} className="breadcrumb-link">{appConfig.displayName}</Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{documentId}</span>
          </div>
          <h1>Editing: {documentId}
          {hasChanges && <span className="unsaved-indicator">Unsaved changes</span>}
          </h1>
        </div>
        <div className="header-actions">
          <button onClick={handleFormat} className="btn-format" disabled={saving}>
            Format JSON
          </button>
          <button onClick={handleValidate} className="btn-validate" disabled={saving}>
            Validate
          </button>
          <button onClick={handleSave} className="btn-save" disabled={saving || !hasChanges}>
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button onClick={handleCancel} className="btn-cancel" disabled={saving}>
            Cancel
          </button>
        </div>
      </header>

      {validationErrors.length > 0 && (
        <div className="validation-errors">
          <div className="validation-errors-header">
            <h3>Validation Errors ({validationErrors.length})</h3>
            <button 
              className="btn-toggle-errors"
              onClick={() => setIsErrorsExpanded(!isErrorsExpanded)}
              title={isErrorsExpanded ? "Collapse errors" : "Expand errors"}
            >
              {isErrorsExpanded ? '▼ Collapse' : '▶ Expand'}
            </button>
          </div>
          {isErrorsExpanded && (
            <ul className="validation-errors-list">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="editor-wrapper">
        <Editor
          height="100%"
          defaultLanguage="json"
          value={content}
          onChange={handleEditorChange}
          onMount={handleEditorMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            wordWrap: 'on',
            automaticLayout: true,
            scrollBeyondLastLine: false,
            formatOnPaste: true,
            formatOnType: true,
          }}
        />
      </div>
    </div>
  );
};

