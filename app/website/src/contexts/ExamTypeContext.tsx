import React, { createContext, useContext, ReactNode } from 'react';

export type ExamType = 'telc' | 'dele';

interface ExamTypeContextType {
  examType: ExamType;
  getExamTypeName: () => string;
  getExamTypeNameLower: () => string;
}

const ExamTypeContext = createContext<ExamTypeContextType | undefined>(undefined);

// Read exam type from environment variable at build time
const examTypeFromEnv = (process.env.REACT_APP_EXAM_TYPE || 'telc') as ExamType;

export const ExamTypeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const examType = examTypeFromEnv;

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
