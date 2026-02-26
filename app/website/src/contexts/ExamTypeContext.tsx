import React, { createContext, useContext, ReactNode } from 'react';

export type ExamType = 'telc' | 'dele';
export type ExamProvider = 'telc' | 'dele' | 'goethe' | 'all';

interface ExamTypeContextType {
  examType: ExamType;
  examProvider: ExamProvider;
  getExamTypeName: () => string;
  getExamTypeNameLower: () => string;
}

const ExamTypeContext = createContext<ExamTypeContextType | undefined>(undefined);

// Read exam type from environment variable at build time
const examTypeFromEnv = (process.env.REACT_APP_EXAM_TYPE || 'telc') as ExamType;
const examProviderFromEnv = (process.env.REACT_APP_EXAM_PROVIDER || 'all') as ExamProvider;

export const ExamTypeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const examType = examTypeFromEnv;
  const examProvider = examProviderFromEnv;

  const getExamTypeName = (): string => {
    return examType === 'telc' ? 'TELC' : 'DELE';
  };

  const getExamTypeNameLower = (): string => {
    return examType;
  };

  return (
    <ExamTypeContext.Provider
      value={{
        examType,
        examProvider,
        getExamTypeName,
        getExamTypeNameLower,
      }}
    >
      {children}
    </ExamTypeContext.Provider>
  );
};

export const useExamType = (): ExamTypeContextType => {
  const context = useContext(ExamTypeContext);
  if (!context) {
    throw new Error('useExamType must be used within an ExamTypeProvider');
  }
  return context;
};
