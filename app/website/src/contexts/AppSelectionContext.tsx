import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppConfig, AppLanguage, AppLevel, getAppConfig, appsConfig } from '../config/apps.config';

const STORAGE_KEY = 'telc_app_selection';

interface AppSelection {
  language: AppLanguage;
  level: AppLevel;
}

interface AppSelectionContextType {
  selection: AppSelection | null;
  selectedApp: AppConfig | null;
  setSelection: (selection: AppSelection) => void;
  clearSelection: () => void;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
}

const AppSelectionContext = createContext<AppSelectionContextType | undefined>(undefined);

export const AppSelectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selection, setSelectionState] = useState<AppSelection | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load selection from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AppSelection;
        setSelectionState(parsed);
      } catch (e) {
        console.error('Failed to parse stored app selection:', e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsInitialized(true);
  }, []);

  // Show modal if no selection after initialization
  useEffect(() => {
    if (isInitialized && !selection) {
      setShowModal(true);
    }
  }, [isInitialized, selection]);

  const setSelection = (newSelection: AppSelection) => {
    setSelectionState(newSelection);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSelection));
    setShowModal(false);
  };

  const clearSelection = () => {
    setSelectionState(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const selectedApp = selection ? getAppConfig(selection.language, selection.level) ?? null : null;

  return (
    <AppSelectionContext.Provider
      value={{
        selection,
        selectedApp,
        setSelection,
        clearSelection,
        showModal,
        setShowModal,
      }}
    >
      {children}
    </AppSelectionContext.Provider>
  );
};

export const useAppSelection = (): AppSelectionContextType => {
  const context = useContext(AppSelectionContext);
  if (!context) {
    throw new Error('useAppSelection must be used within an AppSelectionProvider');
  }
  return context;
};

